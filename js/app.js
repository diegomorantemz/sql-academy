// ============================================
// UTILIDADES GENERALES
// ============================================

/** Escapa un nombre de identificador SQL (tabla/columna). */
function quoteIdent(name) {
    return '"' + String(name).replace(/"/g, '""') + '"';
}

function loadPreferences() {
    const stored = readStoredJSON(STORAGE_KEYS.preferences, {});
    preferences = {
        theme: stored.theme === 'dark' ? 'dark' : 'light',
        safeMode: stored.safeMode !== false,
        dataset: ['escuela', 'tienda', 'biblioteca'].includes(stored.dataset) ? stored.dataset : 'escuela'
    };
    return preferences;
}

function savePreferences() {
    writeStoredJSON(STORAGE_KEYS.preferences, preferences);
}

function loadHistoryFromStorage() {
    const stored = readStoredJSON(STORAGE_KEYS.history, []);
    if (!Array.isArray(stored)) {
        queryHistory = [];
        return;
    }

    const seen = new Set();
    queryHistory = stored
        .filter(item => typeof item === 'string' && item.trim())
        .filter(item => {
            if (seen.has(item)) return false;
            seen.add(item);
            return true;
        })
        .slice(0, HISTORY_LIMIT);
}

function saveHistoryToStorage() {
    writeStoredJSON(STORAGE_KEYS.history, queryHistory.slice(0, HISTORY_LIMIT));
}

/** Abre (o reutiliza) la base IndexedDB donde se guarda el archivo SQLite. */
function resetSqlResultPanel(message = 'Ejemplo cargado. Pulsa «Ejecutar» para ver los resultados.') {
    lastResultSets = [];
    lastQueryMeta = { durationMs: 0, executedAt: null };
    resultRowLimits = [];
    resultSortState = [];
    lastQueryError = null;

    const output = document.getElementById('resultOutput');
    if (!output) return;
    output.className = 'result-placeholder';
    output.innerHTML = `
        <i class="fas fa-play placeholder-icon"></i>
        <p>${escapeHtml(message)}</p>
    `;
}

/** Muestra un mensaje estandarizado en el panel de resultados. */
function showMessage(type, title, detail) {
    const icons = {
        success: 'fa-check-circle',
        error: 'fa-circle-exclamation',
        warning: 'fa-exclamation-triangle',
        info: 'fa-circle-info'
    };
    const icon = icons[type] || icons.info;
    const detailHtml = detail
        ? `<div class="msg-detail">${detail}</div>`
        : '';
    const output = document.getElementById('resultOutput');
    output.classList.remove('result-placeholder');
    output.innerHTML = `
        <div class="msg msg-${type}">
            <div class="msg-title"><i class="fas ${icon}"></i> ${escapeHtml(title)}</div>
            ${detailHtml}
        </div>
    `;
}

function getFocusableElements(container) {
    if (!container) return [];
    return Array.from(container.querySelectorAll(FOCUSABLE_SELECTOR))
        .filter(element => element.getClientRects().length > 0);
}

/** Abre un modal y bloquea el scroll de la página. */
function openModal(modal) {
    if (!modal) return;
    lastFocusedElement = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    modal.classList.add('active');
    document.body.style.overflow = 'hidden';

    setTimeout(() => {
        const focusable = getFocusableElements(modal);
        if (focusable.length > 0) focusable[0].focus();
    }, 0);
}

/** Cierra un modal y restaura el scroll solo si no queda otro abierto. */
function closeModal(modal) {
    if (!modal) return;
    if (modal.id === 'aiHelpModal') {
        abortAIRequest();
    }
    if (modal.id === 'checkpointModal') {
        currentCheckpoint = null;
    }
    if (modal.id === 'mobileMoreModal') {
        document.getElementById('mobileMoreBtn')?.setAttribute('aria-expanded', 'false');
    }
    modal.classList.remove('active');
    if (!document.querySelector('.modal.active')) {
        document.body.style.overflow = '';
        if (lastFocusedElement && document.contains(lastFocusedElement)) {
            lastFocusedElement.focus();
        }
        lastFocusedElement = null;
    }
}

/** Refresca todos los paneles que dependen de la base de datos. */
function refreshAll() {
    if (window.SQLAcademyAutocomplete?.invalidateSchema) {
        window.SQLAcademyAutocomplete.invalidateSchema();
    }
    showTablesInfo();
    renderAnalyzePanel();
    generateDiagram();
}

// LIMPIAR EDITOR
function clearEditor() {
    const editor = document.getElementById('sqlEditor');
    if (editor.value.trim() !== '') {
        editor.value = '';
        editor.focus();
        showMessage('warning', 'Editor limpiado');
    }
}

// INICIALIZAR BASE DE DATOS
function showQueryError(message) {
    showMessage('error', 'Error en la consulta', `
        <code>${escapeHtml(message)}</code>
        <div>
            <button type="button" class="btn-secondary btn-ai btn-ai-error" onclick="openAIHelp('error')">
                <i class="fas fa-wand-magic-sparkles"></i> Explicar este error con IA
            </button>
        </div>
    `);
}

function formatEditorSql() {
    const editor = document.getElementById('sqlEditor');
    if (!editor) return;

    const start = editor.selectionStart;
    const end = editor.selectionEnd;
    const hasSelection = end > start;
    const source = hasSelection ? editor.value.slice(start, end) : editor.value;

    if (!source.trim()) {
        showToast('warning', 'No hay ninguna consulta para formatear.');
        return;
    }

    const formatted = formatSql(source);
    if (hasSelection) {
        editor.setRangeText(formatted, start, end, 'select');
    } else {
        editor.value = formatted;
    }
    editor.focus();
    showToast('success', 'Consulta formateada.');
}

// MODO SEGURO
function stripSqlComments(sql) {
    return String(sql || '')
        .replace(/--[^\n]*/g, ' ')
        .replace(/\/\*[\s\S]*?\*\//g, ' ')
        .replace(/\s+/g, ' ')
        .trim();
}

/**
 * Devuelve una explicación si la consulta es potencialmente destructiva.
 * Es una comprobación heurística pensada para principiantes, no un parser SQL.
 */
function getDangerousQueryReason(sql) {
    const normalized = stripSqlComments(sql);
    if (!normalized) return '';

    if (/^DROP\s+(TABLE|VIEW|INDEX|TRIGGER|DATABASE|SCHEMA)\b/i.test(normalized)) {
        return 'La consulta elimina un objeto de la base de datos con DROP.';
    }

    if (/^TRUNCATE\b/i.test(normalized)) {
        return 'TRUNCATE vacía una tabla completa sin posibilidad de recuperar los datos.';
    }

    const deleteMatch = normalized.match(/^DELETE\s+FROM\s+[^;]+/i);
    if (deleteMatch && !/\bWHERE\b/i.test(deleteMatch[0])) {
        return 'DELETE sin WHERE elimina todos los registros de la tabla.';
    }

    const updateMatch = normalized.match(/^UPDATE\s+[^;]+/i);
    if (updateMatch && !/\bWHERE\b/i.test(updateMatch[0])) {
        return 'UPDATE sin WHERE modifica todos los registros de la tabla.';
    }

    if (/^ALTER\s+TABLE\s+.+\s+DROP\s+(COLUMN|CONSTRAINT)\b/i.test(normalized)) {
        return 'ALTER TABLE ... DROP elimina parte del esquema de la base de datos.';
    }

    return '';
}

function syncCourseDatasetControls() {
    const sqlSelector = document.getElementById('courseSqlDatasetSelector');
    if (sqlSelector) sqlSelector.value = preferences.dataset;

    const nosqlSelector = document.getElementById('courseNoSQLDatasetSelector');
    if (nosqlSelector) nosqlSelector.value = getNoSQLActiveDatasetName();
}

function syncDatasetSelector() {
    const selector = document.getElementById('datasetSelector');
    if (selector) selector.value = preferences.dataset;
    syncCourseDatasetControls();
}

async function changeCourseSqlDataset(name) {
    if (!['escuela', 'tienda', 'biblioteca'].includes(name)) {
        syncCourseDatasetControls();
        return;
    }
    if (name === preferences.dataset) {
        syncCourseDatasetControls();
        return;
    }
    await loadDataset(name);
    syncCourseDatasetControls();
}

function changeCourseNoSQLDataset(name) {
    if (!['escuela', 'tienda', 'biblioteca'].includes(name)) {
        syncCourseDatasetControls();
        return;
    }
    if (getNoSQLActiveDatasetName() === name) {
        syncCourseDatasetControls();
        return;
    }
    if (typeof window.changeNoSQLDataset !== 'function') {
        showToast('warning', 'El laboratorio NoSQL todavía no está listo.');
        syncCourseDatasetControls();
        return;
    }
    const previous = getNoSQLActiveDatasetName();
    window.changeNoSQLDataset(name);
    syncCourseDatasetControls();
    if (getNoSQLActiveDatasetName() !== previous) {
        refreshActiveCourseDataset();
    }
}

function applyPreferences() {
    const safeModeToggle = document.getElementById('safeModeToggle');
    if (safeModeToggle) safeModeToggle.checked = preferences.safeMode;
    syncDatasetSelector();

    const isDark = preferences.theme === 'dark';
    document.documentElement.dataset.theme = isDark ? 'dark' : 'light';
    const themeMeta = document.querySelector('meta[name="theme-color"]');
    if (themeMeta) themeMeta.setAttribute('content', isDark ? '#111827' : '#123b61');

    const themeToggle = document.getElementById('themeToggle');
    if (themeToggle) {
        themeToggle.innerHTML = `<i class="fas ${isDark ? 'fa-sun' : 'fa-moon'}"></i>`;
        themeToggle.setAttribute('aria-pressed', String(isDark));
        themeToggle.setAttribute('aria-label', isDark ? 'Activar modo claro' : 'Activar modo oscuro');
        themeToggle.title = isDark ? 'Activar modo claro' : 'Activar modo oscuro';
    }
}

function toggleSafeMode(enabled) {
    preferences.safeMode = Boolean(enabled);
    savePreferences();
    showToast(
        preferences.safeMode ? 'success' : 'warning',
        preferences.safeMode
            ? 'Modo seguro activado: se pedirá confirmación antes de consultas destructivas.'
            : 'Modo seguro desactivado: las consultas destructivas se ejecutarán sin confirmación.'
    );
}

function toggleTheme() {
    preferences.theme = preferences.theme === 'dark' ? 'light' : 'dark';
    savePreferences();
    applyPreferences();
    showToast('info', preferences.theme === 'dark' ? 'Modo oscuro activado.' : 'Modo claro activado.');
}

async function installApp() {
    if (!deferredInstallPrompt) {
        showToast('info', 'Si tu navegador lo permite, usa el menú “Instalar app” o “Añadir a pantalla de inicio”.');
        return;
    }

    deferredInstallPrompt.prompt();
    try {
        await deferredInstallPrompt.userChoice;
    } finally {
        deferredInstallPrompt = null;
        const button = document.getElementById('installAppBtn');
        if (button) button.hidden = true;
    }
}

function registerServiceWorker() {
    if (!('serviceWorker' in navigator)) return;

    const isLocalHost = ['localhost', '127.0.0.1', '[::1]'].includes(window.location.hostname);
    if (window.location.protocol !== 'https:' && !isLocalHost) return;

    const hadController = Boolean(navigator.serviceWorker.controller);
    let refreshing = false;

    navigator.serviceWorker.addEventListener('controllerchange', () => {
        if (!hadController || refreshing) return;
        refreshing = true;
        window.location.reload();
    });

    window.addEventListener('load', () => {
        navigator.serviceWorker.register('./service-worker.js', { updateViaCache: 'none' })
            .then(registration => {
                const update = () => registration.update().catch(() => {});
                update();
                document.addEventListener('visibilitychange', () => {
                    if (document.visibilityState === 'visible') update();
                });
            })
            .catch(error => {
                console.warn('No se pudo registrar el service worker:', error);
            });
    });
}

// EJECUTAR CONSULTA
function runQuery() {
    if (!dbInitialized) {
        showMessage('info', 'Esperando que la base de datos se inicialice...');
        return;
    }

    const editor = document.getElementById('sqlEditor');
    const selection = editor.value.substring(editor.selectionStart, editor.selectionEnd);
    const query = (selection.trim() || editor.value).trim();

    if (!query) {
        showMessage('warning', 'Por favor, escribe una consulta SQL');
        return;
    }

    if (preferences.safeMode) {
        const dangerReason = getDangerousQueryReason(query);
        if (dangerReason) {
            const confirmed = confirm(
                `Modo seguro activado\n\n${dangerReason}\n\n¿Quieres ejecutar la consulta de todos modos?`
            );
            if (!confirmed) {
                showToast('info', 'Consulta cancelada. No se modificó la base de datos.');
                return;
            }
        }
    }

    addToHistory(query);

    try {
        const startedAt = performance.now();
        const result = db.exec(query);
        const durationMs = performance.now() - startedAt;
        lastQueryError = null;
        displayResults(result, { durationMs });
        refreshAll();
        if (isWriteQuery(query) || db.getRowsModified() > 0) {
            schedulePersistDatabase();
        }
    } catch (error) {
        const message = error && error.message ? error.message : String(error);
        lastQueryError = { query, message };
        showQueryError(message);
    }
}

// HISTORIAL
function addToHistory(query) {
    if (!query || query.trim() === '') return;
    const existingIndex = queryHistory.indexOf(query);
    if (existingIndex >= 0) queryHistory.splice(existingIndex, 1);
    queryHistory.unshift(query);
    if (queryHistory.length > HISTORY_LIMIT) queryHistory.pop();
    saveHistoryToStorage();
    updateHistoryDisplay();
}

function updateHistoryDisplay() {
    const list = document.getElementById('historyList');
    list.innerHTML = '';

    if (queryHistory.length === 0) {
        const empty = document.createElement('li');
        empty.className = 'empty-history';
        empty.textContent = 'No hay consultas todavía';
        list.appendChild(empty);
        return;
    }

    queryHistory.forEach(query => {
        const li = document.createElement('li');
        const truncated = query.length > 60 ? query.substring(0, 60) + '...' : query;
        li.textContent = truncated;
        li.title = query;
        li.addEventListener('click', () => loadHistoryQuery(query));
        list.appendChild(li);
    });
}

function loadHistoryQuery(query) {
    const editor = document.getElementById('sqlEditor');
    editor.value = query;
    editor.focus();
}

function clearHistory() {
    if (confirm('¿Limpiar todo el historial?')) {
        queryHistory = [];
        removeStoredItem(STORAGE_KEYS.history);
        updateHistoryDisplay();
        showMessage('info', 'Historial limpiado');
    }
}

// EXPORTAR BASE DE DATOS
function exportDatabase() {
    if (!db) {
        showMessage('error', 'La base de datos no está inicializada');
        return;
    }
    try {
        const data = db.export();
        const blob = new Blob([data], { type: 'application/x-sqlite3' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `database_${new Date().toISOString().slice(0, 10)}.sqlite`;
        document.body.appendChild(a);
        a.click();
        a.remove();
        setTimeout(() => URL.revokeObjectURL(url), 1000);
        showMessage('success', 'Base de datos exportada correctamente');
    } catch (e) {
        showMessage('error', 'No se pudo exportar la base de datos', `<code>${escapeHtml(e.message)}</code>`);
    }
}

function closeToolbarMore() {
    const menu = document.getElementById('sqlMoreMenu');
    if (menu) menu.open = false;
}

// EXPLORADOR DE TABLAS Y EDITOR DE DATOS
// NAVEGACIÓN ENTRE SECCIONES
document.addEventListener('DOMContentLoaded', function() {
    // Navegación por pestañas del navbar
    document.querySelectorAll('.nav-btn').forEach(btn => {
        if (btn.classList.contains('active')) {
            btn.setAttribute('aria-current', 'page');
        }

        btn.addEventListener('click', function() {
            activateSection(this.dataset.section);
        });
    });

    document.querySelectorAll('[data-mobile-section]').forEach(btn => {
        btn.addEventListener('click', () => activateSection(btn.dataset.mobileSection));
    });
    syncMobileNavigation(document.querySelector('.section.active')?.id.replace('section-', '') || 'learn');

    document.querySelectorAll('.challenge-tab').forEach(tab => {
        tab.addEventListener('click', () => activateChallengeTab(tab.dataset.challengeTab));
    });
    activateChallengeTab('sql');

    const nosqlDatasetSelector = document.getElementById('nosqlDatasetSelector');
    if (nosqlDatasetSelector) {
        nosqlDatasetSelector.addEventListener('change', () => {
            if (document.getElementById('nosqlChallengesPanel')?.classList.contains('active')) {
                selectedNoSQLChallengeId = null;
                setTimeout(renderNoSQLChallengeHub, 0);
            }
        });
    }

    // Preferencias e historial guardados en el navegador.
    loadPreferences();
    applyPreferences();
    loadSkillProfile();
    applySkillLevelUI();
    loadHistoryFromStorage();
    updateHistoryDisplay();
    renderCategorySelector();
    initLearnLibrary();
    initChallenges();
    initLearningPath();
    initAnalyzeExplorerControls();
    updateAnalyzeExplorerModeUI();

    // Inicializar base de datos (restaura la copia local si existe).
    initDatabase();
    registerServiceWorker();

    // Año automático en el footer
    const yearSpan = document.getElementById('currentYear');
    if (yearSpan) {
        yearSpan.textContent = new Date().getFullYear();
    }
});

// Cerrar modales con clic fuera o con la tecla ESC
document.addEventListener('click', function(e) {
    if (e.target.classList && e.target.classList.contains('modal')) {
        closeModal(e.target);
    }
    const toolbarMenu = document.getElementById('sqlMoreMenu');
    if (toolbarMenu && toolbarMenu.open && !toolbarMenu.contains(e.target)) {
        toolbarMenu.open = false;
    }
});

document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape') closeToolbarMore();
});

document.addEventListener('dblclick', function(e) {
    const cell = e.target && e.target.closest ? e.target.closest('[data-copy-value]') : null;
    if (cell) {
        copyResultCell(cell.dataset.copyValue || '');
    }
});

document.addEventListener('keydown', function(e) {
    if (e.key !== 'Escape') return;
    const activeModal = document.querySelector('.modal.active');
    if (activeModal) {
        e.preventDefault();
        closeModal(activeModal);
    }
});

// Mantiene el foco dentro del modal abierto.
document.addEventListener('keydown', function(e) {
    if (e.key !== 'Tab') return;
    const activeModal = document.querySelector('.modal.active');
    if (!activeModal) return;

    const focusable = getFocusableElements(activeModal);
    if (focusable.length === 0) return;

    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
    } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
    }
});

window.addEventListener('beforeinstallprompt', function(event) {
    event.preventDefault();
    deferredInstallPrompt = event;
    const button = document.getElementById('installAppBtn');
    if (button) button.hidden = false;
});

window.addEventListener('appinstalled', function() {
    deferredInstallPrompt = null;
    const button = document.getElementById('installAppBtn');
    if (button) button.hidden = true;
    showToast('success', 'SQL Academy se instaló correctamente.');
});

window.addEventListener('offline', function() {
    showToast('warning', 'Sin conexión. El simulador SQL sigue funcionando; el asistente IA no estará disponible.');
});

window.addEventListener('online', function() {
    showToast('success', 'Conexión restablecida.');
});

// ATAJOS DE TECLADO
document.addEventListener('keydown', function(e) {
    if (e.ctrlKey && e.key === 'Enter') {
        e.preventDefault();
        runQuery();
    }
    if (e.ctrlKey && e.shiftKey && e.key.toLowerCase() === 'r') {
        e.preventDefault();
        resetDatabase();
    }
    if (e.ctrlKey && e.shiftKey && e.key.toLowerCase() === 'f') {
        e.preventDefault();
        formatEditorSql();
    }
    if (e.ctrlKey && e.key.toLowerCase() === 'e') {
        e.preventDefault();
        showExamples();
    }
    if (e.ctrlKey && e.key.toLowerCase() === 'l') {
        e.preventDefault();
        clearEditor();
    }
});
