// Retos de depuración SQL.

// ============================================
// RETOS DE DEPURACION SQL
// ============================================

let currentDebugChallengeId = null;
let debugChallengeAttempts = 0;

function getDebugChallengeCatalog(datasetName = preferences.dataset) {
    return debugChallengeCatalogByDataset[datasetName] || debugChallengeCatalogByDataset.escuela;
}

function getActiveDebugChallengeCatalog() {
    return getDebugChallengeCatalog();
}

function getDebugChallengeById(id) {
    return getActiveDebugChallengeCatalog().find(challenge => challenge.id === id) || null;
}

function getCompletedDebugChallengeCount() {
    return getActiveDebugChallengeCatalog().filter(challenge => challengeProgress[challenge.id]?.completed).length;
}

function renderDebugChallengeProgress() {
    const catalog = getActiveDebugChallengeCatalog();
    const completed = getCompletedDebugChallengeCount();
    const percent = catalog.length ? Math.round((completed / catalog.length) * 100) : 0;
    const text = document.getElementById('debugProgressText');
    const bar = document.getElementById('debugProgressBar');
    const track = document.getElementById('debugProgressTrack');
    if (text) text.textContent = `${completed} de ${catalog.length}`;
    if (bar) bar.style.width = `${percent}%`;
    if (track) track.setAttribute('aria-valuenow', String(percent));
}

function renderDebugChallengeList() {
    const list = document.getElementById('debugChallengeList');
    if (!list) return;

    const catalog = getActiveDebugChallengeCatalog();
    if (!catalog.length) {
        list.innerHTML = '<p class="text-muted">No hay retos de depuración para este dataset.</p>';
        renderDebugChallengeProgress();
        return;
    }

    list.innerHTML = catalog.map(challenge => {
        const completed = Boolean(challengeProgress[challenge.id]?.completed);
        const active = challenge.id === currentDebugChallengeId;
        return `
            <button type="button" class="challenge-card${completed ? ' completed' : ''}${active ? ' active' : ''}" onclick="openDebugChallenge('${escapeHtml(challenge.id)}')" aria-pressed="${active}">
                <span class="challenge-card-title">
                    ${escapeHtml(challenge.titulo)}
                    ${completed ? '<i class="fas fa-circle-check" title="Completado"></i>' : ''}
                </span>
                <span class="challenge-card-meta">
                    <span class="challenge-level ${escapeHtml(challenge.nivel)}">${escapeHtml(challenge.nivel)}</span>
                    <span>${completed ? 'Completado' : 'Pendiente'}</span>
                </span>
            </button>
        `;
    }).join('');

    renderDebugChallengeProgress();
}

function renderDebugChallengePlaceholder() {
    const detail = document.getElementById('debugChallengeDetail');
    if (!detail) return;
    detail.innerHTML = `
        <div class="challenge-empty">
            <i class="fas fa-bug"></i>
            <h3>Encuentra el error</h3>
            <p>Elige un reto de depuración para revisar una consulta rota, entender qué falla y corregirla.</p>
        </div>
    `;
}

function describeDebugComparison(comparison) {
    if (comparison.reason === 'columns') {
        return `Se esperaban ${comparison.expectedColumns} columnas y tu corrección devolvió ${comparison.actualColumns}.`;
    }
    if (comparison.reason === 'rows') {
        return `Se esperaban ${comparison.expectedRows} filas y tu corrección devolvió ${comparison.actualRows}.`;
    }
    if (comparison.reason === 'values') {
        return 'Las columnas y el número de filas coinciden, pero los valores o el orden no son los esperados.';
    }
    if (comparison.reason === 'no_result') {
        return 'La consulta no devolvió un conjunto de resultados.';
    }
    return 'La consulta todavía no devuelve el resultado esperado.';
}

function openDebugChallenge(id) {
    const challenge = getDebugChallengeById(id);
    const detail = document.getElementById('debugChallengeDetail');
    if (!challenge || !detail) return;

    currentDebugChallengeId = id;
    debugChallengeAttempts = 0;
    renderDebugChallengeList();

    detail.innerHTML = `
        <div class="challenge-detail-header">
            <div>
                <h3>${escapeHtml(challenge.titulo)}</h3>
                <div class="challenge-detail-meta">
                    <span class="challenge-level ${escapeHtml(challenge.nivel)}">${escapeHtml(challenge.nivel)}</span>
                    <span class="text-muted">Depuración · validación por resultado</span>
                </div>
            </div>
        </div>
        <div class="challenge-description">${escapeHtml(challenge.descripcion)}</div>

        <div class="debug-broken-block">
            <div class="debug-block-head">
                <span><i class="fas fa-bug"></i> Consulta con el error</span>
                <button type="button" class="btn-ghost btn-sm" onclick="resetDebugQuery()">
                    <i class="fas fa-rotate-left"></i> Restaurar
                </button>
            </div>
            <pre><code>${escapeHtml(challenge.brokenSql)}</code></pre>
        </div>

        <div class="debug-symptom">
            <span>Qué ocurre</span>
            <p>${escapeHtml(challenge.problema)}</p>
        </div>

        <label for="debugEditor" class="sr-only">Consulta SQL corregida para el reto de depuración</label>
        <textarea id="debugEditor" spellcheck="false" placeholder="Corrige la consulta aquí...">${escapeHtml(challenge.brokenSql)}</textarea>
        <div class="challenge-actions">
            <button type="button" onclick="runDebugChallenge()">
                <i class="fas fa-play"></i> Comprobar corrección
            </button>
            <button type="button" class="btn-secondary" onclick="showDebugHint()">
                <i class="fas fa-lightbulb"></i> Ver pista
            </button>
            <button type="button" class="btn-secondary" onclick="resetDebugQuery()">
                <i class="fas fa-rotate-left"></i> Restaurar consulta rota
            </button>
        </div>
        <div id="debugHint" class="challenge-hint" hidden>${escapeHtml(challenge.pista)}</div>
        <div id="debugResult" class="challenge-result" aria-live="polite">
            <strong><i class="fas fa-circle-info"></i> Listo para depurar</strong>
            Corrige la consulta y pulsa «Comprobar corrección».
        </div>
        <div id="debugNext" class="path-next" hidden></div>
    `;

    const editor = document.getElementById('debugEditor');
    if (editor) editor.focus();
}

function markDebugChallengeComplete(challenge) {
    challengeProgress[challenge.id] = {
        completed: true,
        completedAt: new Date().toISOString()
    };
    saveChallengeProgress();
    renderDebugChallengeList();
}

function showDebugNext(challenge) {
    const container = document.getElementById('debugNext');
    if (!container) return;
    const catalog = getActiveDebugChallengeCatalog();
    const index = catalog.findIndex(item => item.id === challenge.id);
    const next = catalog[index + 1];
    container.hidden = false;
    container.innerHTML = next
        ? `<button type="button" class="btn-primary" onclick="nextDebugChallenge()">Siguiente depuración: ${escapeHtml(next.titulo)} <i class="fas fa-arrow-right"></i></button>`
        : '<div class="path-complete"><i class="fas fa-trophy"></i> ¡Has completado las depuraciones de este dataset!</div>';
}

function runDebugChallenge() {
    const challenge = getDebugChallengeById(currentDebugChallengeId);
    const editor = document.getElementById('debugEditor');
    if (!challenge || !editor) return;

    const query = editor.value.trim();
    if (!query) {
        showDebugResult('warning', '<strong><i class="fas fa-circle-exclamation"></i> Falta la consulta</strong> Escribe una corrección antes de comprobarla.');
        return;
    }
    if (!isReadOnlyQuery(query)) {
        showDebugResult('warning', '<strong><i class="fas fa-lock"></i> Solo lectura</strong> La depuración solo permite consultas <code>SELECT</code> o <code>WITH</code>.');
        return;
    }
    if (!dbInitialized || !db) {
        showDebugResult('warning', '<strong><i class="fas fa-hourglass-half"></i> Base de datos no disponible</strong> Espera a que termine de inicializarse.');
        return;
    }

    try {
        const expected = db.exec(challenge.sqlEsperado);
        const actual = db.exec(query);
        const comparison = compareChallengeResults(expected, actual, challenge.ordenada);

        if (comparison.ok) {
            const wasCompleted = Boolean(challengeProgress[challenge.id]?.completed);
            markDebugChallengeComplete(challenge);
            showDebugResult('success', `
                <strong><i class="fas fa-circle-check"></i> ¡Consulta corregida!</strong>
                ${wasCompleted ? 'Ya tenías este reto completado.' : 'El resultado coincide con la solución esperada.'}
            `);
            showDebugNext(challenge);
            showToast('success', 'Reto de depuración completado.');
            return;
        }

        debugChallengeAttempts += 1;
        const solutionButton = debugChallengeAttempts >= 2
            ? '<div class="challenge-result-actions"><button type="button" class="btn-secondary" onclick="showDebugSolution()"><i class="fas fa-eye"></i> Ver solución</button></div>'
            : '';
        showDebugResult('error', `
            <strong><i class="fas fa-circle-xmark"></i> Todavía no</strong>
            ${escapeHtml(describeDebugComparison(comparison))}
            ${solutionButton}
        `);
    } catch (error) {
        debugChallengeAttempts += 1;
        const solutionButton = debugChallengeAttempts >= 2
            ? '<div class="challenge-result-actions"><button type="button" class="btn-secondary" onclick="showDebugSolution()"><i class="fas fa-eye"></i> Ver solución</button></div>'
            : '';
        showDebugResult('error', `
            <strong><i class="fas fa-circle-exclamation"></i> Error en la consulta</strong>
            <code>${escapeHtml(error.message || String(error))}</code>
            ${solutionButton}
        `);
    }
}

function showDebugResult(type, html) {
    const result = document.getElementById('debugResult');
    if (!result) return;
    result.className = `challenge-result ${type}`;
    result.innerHTML = html;
}

function showDebugHint() {
    const hint = document.getElementById('debugHint');
    if (!hint) return;
    hint.hidden = !hint.hidden;
}

function showDebugSolution() {
    const challenge = getDebugChallengeById(currentDebugChallengeId);
    const editor = document.getElementById('debugEditor');
    if (!challenge || !editor) return;
    editor.value = challenge.sqlEsperado;
    editor.focus();
    showToast('info', 'Solución cargada. Ejecútala para comprobar el resultado.');
}

function resetDebugQuery() {
    const challenge = getDebugChallengeById(currentDebugChallengeId);
    const editor = document.getElementById('debugEditor');
    if (!challenge || !editor) return;
    editor.value = challenge.brokenSql;
    editor.focus();
}

function nextDebugChallenge() {
    const catalog = getActiveDebugChallengeCatalog();
    const index = catalog.findIndex(challenge => challenge.id === currentDebugChallengeId);
    const next = catalog[index + 1];
    if (next) {
        openDebugChallenge(next.id);
    } else {
        showToast('success', '¡Has llegado al final de las depuraciones de este dataset!');
    }
}

function resetDebugChallengeProgress() {
    if (!confirm('¿Reiniciar el progreso de los retos de depuración de este dataset?')) return;
    getActiveDebugChallengeCatalog().forEach(challenge => {
        delete challengeProgress[challenge.id];
    });
    saveChallengeProgress();
    currentDebugChallengeId = null;
    debugChallengeAttempts = 0;
    renderDebugChallengeList();
    renderDebugChallengePlaceholder();
    showToast('info', 'Progreso de depuración reiniciado.');
}
