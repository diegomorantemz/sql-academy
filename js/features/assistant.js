// Asistente IA: contexto, solicitudes y respuesta.

/** Resume el esquema de las tablas sin incluir ningún dato de filas. */
function getDatabaseSchemaSummary() {
    try {
        return getUserTables().map(tableName => {
            const columns = getTableColumns(tableName).map(column => {
                const parts = [column.name, column.type || 'TEXT'];
                if (column.pk) parts.push('PK');
                if (column.notnull) parts.push('NOT NULL');
                return parts.join(' ');
            });
            return `${tableName}(${columns.join(', ')})`;
        }).join('\n').slice(0, 5000);
    } catch (error) {
        console.error('No se pudo construir el esquema para la IA:', error);
        return '';
    }
}

const AI_MODES = new Set(['error', 'explain', 'hint', 'exercise', 'review']);
const AI_MODE_LABELS = {
    error: 'Diagnóstico',
    explain: 'Explicación',
    hint: 'Pista',
    exercise: 'Ejercicio propuesto',
    review: 'Revisión',
    nosql: 'Explicación NoSQL'
};
const AI_MODE_ICONS = {
    error: 'fa-stethoscope',
    explain: 'fa-lightbulb',
    hint: 'fa-compass',
    exercise: 'fa-dumbbell',
    review: 'fa-magnifying-glass',
    nosql: 'fa-leaf'
};

/** Prepara la consulta, el error y el esquema que se enviarán. */
function buildAIContext(mode) {
    const editor = document.getElementById('sqlEditor');
    const currentQuery = editor ? editor.value.trim() : '';

    let normalizedMode = String(mode || 'explain');
    if (normalizedMode === 'manual') normalizedMode = 'explain';
    if (!AI_MODES.has(normalizedMode)) normalizedMode = 'explain';

    if (normalizedMode === 'explain' && lastQueryError && lastQueryError.query === currentQuery) {
        normalizedMode = 'error';
    }

    if (normalizedMode === 'error' && lastQueryError) {
        return {
            query: lastQueryError.query,
            error: lastQueryError.message,
            schema: getDatabaseSchemaSummary(),
            mode: 'error'
        };
    }

    if (normalizedMode === 'error') {
        normalizedMode = 'explain';
    }

    return {
        query: currentQuery,
        error: '',
        schema: getDatabaseSchemaSummary(),
        mode: normalizedMode
    };
}

/** Abre el panel y solicita una explicación. */
function openAIHelp(mode = 'error') {
    const modal = document.getElementById('aiHelpModal');
    if (!modal) return;

    const context = buildAIContext(mode);

    if (!context.query && context.mode !== 'exercise') {
        showMessage('warning', 'Escribe una consulta antes de pedir ayuda al asistente');
        const editor = document.getElementById('sqlEditor');
        if (editor) editor.focus();
        return;
    }

    if (context.mode === 'exercise' && !context.schema) {
        showMessage('warning', 'Espera a que la base de datos termine de inicializarse para generar un ejercicio');
        return;
    }

    if (context.query.length > AI_MAX_QUERY_CHARS) {
        showMessage(
            'warning',
            'La consulta es demasiado larga para el asistente',
            'Prueba con una consulta más corta.'
        );
        return;
    }

    aiLastContext = context;
    openModal(modal);
    requestAIExplanation(context);
}

function closeAIHelp() {
    closeModal(document.getElementById('aiHelpModal'));
}

function retryAIHelp() {
    if (!aiLastContext) return;
    requestAIExplanation(aiLastContext, { force: true });
}

function abortAIRequest() {
    const controller = aiAbortController;
    aiAbortController = null;
    aiRequestInFlight = false;

    if (controller) {
        try { controller.abort(); } catch (error) { /* ignorar */ }
    }
}

function getAIErrorMessage(code) {
    switch (code) {
        case 'quota':
            return 'El asistente alcanzó el límite gratuito de Gemini. Espera un momento o intenta más tarde.';
        case 'rate_limited':
            return 'Has hecho varias solicitudes seguidas. Espera un minuto antes de volver a intentarlo.';
        case 'missing_key':
            return 'El asistente no está configurado en este sitio. Falta la variable GEMINI_API_KEY en Netlify.';
        case 'input_too_large':
            return 'La consulta o el error son demasiado largos para enviarlos al asistente.';
        case 'timeout':
            return 'La explicación tardó demasiado en llegar. Intenta de nuevo.';
        case 'model_overloaded':
            return 'El modelo de IA está saturado en este momento. Intenta de nuevo en unos segundos.';
        case 'model_unavailable':
            return 'El modelo de IA configurado ya no está disponible. Revisa GEMINI_MODEL en Netlify.';
        case 'gemini_auth':
            return 'La clave de Gemini no es válida o no tiene permisos. Revisa GEMINI_API_KEY en Netlify.';
        case 'gemini_bad_request':
            return 'La solicitud al proveedor de IA no es válida. Intenta reformular la consulta.';
        case 'gemini_unavailable':
            return 'El proveedor de IA está teniendo problemas temporales. Intenta de nuevo en unos segundos.';
        case 'upstream':
        case 'invalid_upstream_response':
            return 'El proveedor de IA no respondió correctamente. Intenta de nuevo en unos segundos.';
        case 'empty_response':
            return 'La IA no devolvió una explicación. Intenta reformular la consulta.';
        case 'empty_query':
            return 'No hay una consulta para explicar.';
        case 'empty_schema':
            return 'No se pudo leer el esquema de la base de datos para generar el ejercicio.';
        case 'invalid_mode':
            return 'El modo del asistente no es válido. Recarga la página e inténtalo de nuevo.';
        case 'http_404':
        case 'http_405':
            return 'El asistente no está disponible en este entorno. Si trabajas en local, abre el proyecto con Netlify Dev.';
        default:
            return 'No se pudo conectar con el asistente. Revisa tu conexión e intenta de nuevo.';
    }
}

function isAIRetryable(code) {
    return [
        'quota',
        'rate_limited',
        'timeout',
        'model_overloaded',
        'gemini_unavailable',
        'upstream',
        'invalid_upstream_response',
        'empty_response',
        'network',
        'http_500',
        'http_502',
        'http_503',
        'http_504'
    ].includes(code);
}

async function requestAIExplanation(context, options = {}) {
    const body = document.getElementById('aiHelpBody');
    const copyBtn = document.getElementById('aiCopyBtn');
    const retryBtn = document.getElementById('aiRetryBtn');
    if (!body) return;

    const force = options.force === true;
    const cacheKey = [context.mode, context.query, context.error, context.schema].join('\u0000');

    aiLastContext = context;

    if (!force && aiResponseCache.has(cacheKey)) {
        aiLastResponse = aiResponseCache.get(cacheKey);
        renderAIResponse(aiLastResponse);
        return;
    }

    if (aiRequestInFlight) return;

    if (!force && Date.now() < aiCooldownUntil) {
        const seconds = Math.ceil((aiCooldownUntil - Date.now()) / 1000);
        renderAIError(
            `Espera ${seconds} ${seconds === 1 ? 'segundo' : 'segundos'} antes de pedir otra explicación.`,
            false
        );
        return;
    }

    aiRequestInFlight = true;
    aiLastResponse = '';
    if (copyBtn) copyBtn.disabled = true;
    if (retryBtn) retryBtn.hidden = true;
    renderAILoading(context);

    if (window.location.protocol === 'file:') {
        aiRequestInFlight = false;
        renderAIError(
            'El asistente necesita el sitio publicado en Netlify o ejecutarse con Netlify Dev. Abrir el archivo directamente no permite usar la función.',
            false
        );
        return;
    }

    const fetchImpl = (typeof window.fetch === 'function')
        ? window.fetch.bind(window)
        : (typeof fetch === 'function' ? fetch : null);

    if (!fetchImpl) {
        aiRequestInFlight = false;
        renderAIError('Este navegador no permite conectar con el asistente.', false);
        return;
    }

    const controller = new AbortController();
    aiAbortController = controller;
    const timeoutId = setTimeout(() => controller.abort(), AI_REQUEST_TIMEOUT_MS);

    try {
        const response = await fetchImpl(AI_ENDPOINT, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                query: context.query,
                error: context.error,
                schema: context.schema,
                mode: context.mode
            }),
            signal: controller.signal
        });

        let data = {};
        try {
            data = await response.json();
        } catch (error) {
            data = {};
        }

        if (!response.ok) {
            const requestError = new Error('La solicitud al asistente falló');
            requestError.code = typeof data.error === 'string' ? data.error : `http_${response.status}`;
            throw requestError;
        }

        const explanation = typeof data.explanation === 'string'
            ? data.explanation.trim()
            : '';

        if (!explanation) {
            const requestError = new Error('La IA devolvió una respuesta vacía');
            requestError.code = 'empty_response';
            throw requestError;
        }

        aiLastResponse = explanation;
        aiCooldownUntil = Date.now() + AI_COOLDOWN_MS;

        if (aiResponseCache.size >= AI_CACHE_LIMIT) {
            const oldestKey = aiResponseCache.keys().next().value;
            aiResponseCache.delete(oldestKey);
        }
        aiResponseCache.set(cacheKey, explanation);

        renderAIResponse(explanation);
    } catch (error) {
        // Si se cerró el panel, la petición se abortó a propósito.
        if (error && error.name === 'AbortError' && aiAbortController !== controller) {
            return;
        }

        const code = error && error.code ? error.code : (error.name === 'AbortError' ? 'timeout' : 'network');
        renderAIError(getAIErrorMessage(code), isAIRetryable(code));
    } finally {
        clearTimeout(timeoutId);
        if (aiAbortController === controller) {
            aiAbortController = null;
            aiRequestInFlight = false;
        }
    }
}

function renderAILoading(context) {
    const body = document.getElementById('aiHelpBody');
    if (!body) return;

    const messages = {
        error: 'Diagnosticando el error...',
        explain: 'Analizando la consulta...',
        hint: 'Preparando una pista...',
        exercise: 'Diseñando un ejercicio...',
        review: 'Revisando la consulta...',
        nosql: 'Analizando el comando NoSQL...'
    };

    body.innerHTML = `
        ${renderAIContext(context)}
        <div class="ai-loading">
            <i class="fas fa-spinner fa-spin"></i>
            <p>${escapeHtml(messages[context.mode] || 'Analizando...')}</p>
            <p>Esto puede tardar unos segundos.</p>
        </div>
    `;
}

function renderAIContext(context) {
    if (!context) return '';

    const isExercise = context.mode === 'exercise';
    const query = context.query.length > 600
        ? `${context.query.slice(0, 600)}...`
        : context.query;
    const error = context.error
        ? (context.error.length > 500 ? `${context.error.slice(0, 500)}...` : context.error)
        : '';

    return `
        <div class="ai-context">
            <div class="ai-context-title"><i class="fas fa-code"></i> ${isExercise ? 'Esquema enviado' : 'Consulta enviada'}</div>
            ${query
                ? `<pre>${escapeHtml(query)}</pre>`
                : `<p class="ai-context-note">Se enviará únicamente el esquema de las tablas para generar el ejercicio.</p>`}
            ${error ? `
                <div class="ai-context-error">
                    <strong>Error:</strong>
                    <pre>${escapeHtml(error)}</pre>
                </div>
            ` : ''}
        </div>
    `;
}

function renderAIResponse(explanation) {
    const body = document.getElementById('aiHelpBody');
    const copyBtn = document.getElementById('aiCopyBtn');
    const retryBtn = document.getElementById('aiRetryBtn');
    if (!body) return;

    const mode = aiLastContext?.mode || 'explain';
    const label = AI_MODE_LABELS[mode] || 'Respuesta';
    const icon = AI_MODE_ICONS[mode] || 'fa-lightbulb';

    body.innerHTML = `
        ${renderAIContext(aiLastContext)}
        <div class="ai-response-title"><i class="fas ${icon}"></i> ${escapeHtml(label)}</div>
        <div class="ai-response">${formatAIResponse(explanation)}</div>
    `;

    if (copyBtn) copyBtn.disabled = false;
    if (retryBtn) retryBtn.hidden = true;
}

function renderAIError(message, canRetry = true) {
    const body = document.getElementById('aiHelpBody');
    const copyBtn = document.getElementById('aiCopyBtn');
    const retryBtn = document.getElementById('aiRetryBtn');
    if (!body) return;

    aiLastResponse = '';

    body.innerHTML = `
        ${renderAIContext(aiLastContext)}
        <div class="ai-error" role="alert">
            <strong><i class="fas fa-circle-exclamation"></i> No se pudo generar la explicación</strong>
            ${escapeHtml(message)}
        </div>
    `;

    if (copyBtn) copyBtn.disabled = true;
    if (retryBtn) retryBtn.hidden = !canRetry;
}

/** Formatea la respuesta sin inyectar HTML del modelo. */
function formatAIResponse(text) {
    const safeText = escapeHtml(String(text || ''));
    const parts = safeText.split('```');

    return parts.map((part, index) => {
        if (index % 2 === 1) {
            const code = part
                .replace(/^[a-zA-Z0-9_+-]*\r?\n/, '')
                .replace(/\r?\n$/, '');
            return `<pre><code>${code}</code></pre>`;
        }

        const formatted = part
            .replace(/\*\*([^*\n]+)\*\*/g, '<strong>$1</strong>')
            .replace(/`([^`\n]+)`/g, '<code>$1</code>');

        return `<div class="ai-text">${formatted}</div>`;
    }).join('');
}

async function copyAIResponse() {
    if (!aiLastResponse) return;

    const button = document.getElementById('aiCopyBtn');
    const original = button ? button.innerHTML : '';

    try {
        if (navigator.clipboard && typeof navigator.clipboard.writeText === 'function') {
            await navigator.clipboard.writeText(aiLastResponse);
        } else {
            const textarea = document.createElement('textarea');
            textarea.value = aiLastResponse;
            textarea.setAttribute('readonly', '');
            textarea.style.position = 'fixed';
            textarea.style.opacity = '0';
            document.body.appendChild(textarea);
            textarea.select();
            const copied = typeof document.execCommand === 'function'
                ? document.execCommand('copy')
                : false;
            document.body.removeChild(textarea);
            if (!copied) throw new Error('No se pudo copiar');
        }

        if (button) {
            button.innerHTML = '<i class="fas fa-check"></i> Copiado';
            setTimeout(() => { button.innerHTML = original; }, 1800);
        }
    } catch (error) {
        showMessage('warning', 'No se pudo copiar', 'Selecciona el texto del panel y cópialo manualmente.');
    }
}
