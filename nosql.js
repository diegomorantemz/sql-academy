/**
 * Interfaz del laboratorio NoSQL.
 *
 * Mantiene el estado documental, la persistencia en IndexedDB, el historial,
 * los ejemplos y los retos. El motor puro vive en nosql-engine.js.
 */
(function (global) {
    'use strict';

    const STORAGE_KEYS = {
        history: 'sql-academy-nosql-history-v1',
        preferences: 'sql-academy-nosql-preferences-v1',
        challenges: 'sql-academy-nosql-challenges-v1',
        fallbackState: 'sql-academy-nosql-state-v1'
    };
    const IDB_NAME = 'sql-academy-nosql';
    const IDB_VERSION = 1;
    const IDB_STORE = 'state';
    const IDB_KEY = 'current';
    const HISTORY_LIMIT = 30;

    let state = null;
    let datasetName = 'escuela';
    let safeMode = true;
    let history = [];
    let challengeProgress = {};
    let activeChallengeId = null;
    let persistTimer = null;
    let initialized = false;
    let persistenceDbPromise = null;

    function getElement(id) {
        return document.getElementById(id);
    }

    function escapeHtml(value) {
        if (typeof global.escapeHtml === 'function') return global.escapeHtml(String(value));
        return String(value)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;');
    }

    function readJSON(key, fallback) {
        try {
            const raw = global.localStorage.getItem(key);
            if (!raw) return fallback;
            return JSON.parse(raw);
        } catch (error) {
            return fallback;
        }
    }

    function writeJSON(key, value) {
        try {
            global.localStorage.setItem(key, JSON.stringify(value));
        } catch (error) {
            // La app sigue funcionando aunque localStorage esté bloqueado.
        }
    }

    function removeStored(key) {
        try {
            global.localStorage.removeItem(key);
        } catch (error) {
            // Ignorar.
        }
    }

    function showToast(type, message) {
        if (typeof global.showToast === 'function') {
            global.showToast(type, message);
        }
    }

    function setPersistenceState(mode, label) {
        const status = getElement('nosqlPersistenceStatus');
        if (!status) return;
        status.classList.remove('is-saving', 'is-error', 'is-saved');
        status.classList.add(`is-${mode}`);
        status.innerHTML = `<i class="fas fa-${mode === 'saving' ? 'spinner fa-spin' : (mode === 'error' ? 'triangle-exclamation' : 'hard-drive')}"></i> ${escapeHtml(label)}`;
    }

    function schedulePersist() {
        if (persistTimer) clearTimeout(persistTimer);
        setPersistenceState('saving', 'Guardando...');
        persistTimer = setTimeout(() => {
            persistTimer = null;
            persistState();
        }, 150);
    }

    function openPersistenceDb() {
        if (persistenceDbPromise) return persistenceDbPromise;

        persistenceDbPromise = new Promise((resolve, reject) => {
            if (!global.indexedDB) {
                reject(new Error('IndexedDB no está disponible'));
                return;
            }

            const request = global.indexedDB.open(IDB_NAME, IDB_VERSION);
            request.onupgradeneeded = () => {
                const database = request.result;
                if (!database.objectStoreNames.contains(IDB_STORE)) {
                    database.createObjectStore(IDB_STORE);
                }
            };
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error || new Error('No se pudo abrir IndexedDB'));
            request.onblocked = () => reject(new Error('IndexedDB está bloqueada por otra pestaña'));
        });

        return persistenceDbPromise;
    }

    async function loadPersistedState() {
        try {
            const database = await openPersistenceDb();
            return await new Promise((resolve, reject) => {
                const transaction = database.transaction(IDB_STORE, 'readonly');
                const request = transaction.objectStore(IDB_STORE).get(IDB_KEY);
                request.onsuccess = () => resolve(request.result || null);
                request.onerror = () => reject(request.error || new Error('No se pudo leer IndexedDB'));
            });
        } catch (error) {
            return readJSON(STORAGE_KEYS.fallbackState, null);
        }
    }

    async function persistState() {
        if (!state) return;
        const payload = { datasetName, state };
        try {
            const database = await openPersistenceDb();
            await new Promise((resolve, reject) => {
                const transaction = database.transaction(IDB_STORE, 'readwrite');
                transaction.objectStore(IDB_STORE).put(payload, IDB_KEY);
                transaction.oncomplete = () => resolve();
                transaction.onerror = () => reject(transaction.error || new Error('No se pudo guardar IndexedDB'));
            });
            removeStored(STORAGE_KEYS.fallbackState);
            setPersistenceState('saved', 'Guardado local');
        } catch (error) {
            writeJSON(STORAGE_KEYS.fallbackState, payload);
            setPersistenceState('saved', 'Guardado local');
        }
    }

    function clearPersistedState() {
        if (global.indexedDB) {
            openPersistenceDb()
                .then(database => {
                    const transaction = database.transaction(IDB_STORE, 'readwrite');
                    transaction.objectStore(IDB_STORE).delete(IDB_KEY);
                })
                .catch(() => {});
        }
        removeStored(STORAGE_KEYS.fallbackState);
    }

    function createDefaultState() {
        const dataset = global.NOSQL_DATASETS[datasetName] || global.NOSQL_DATASETS.escuela;
        datasetName = dataset === global.NOSQL_DATASETS.escuela ? 'escuela' : datasetName;
        return global.NoSQL.createDatabase(dataset);
    }

    function loadPreferences() {
        const preferences = readJSON(STORAGE_KEYS.preferences, {});
        safeMode = preferences.safeMode !== false;
        datasetName = global.NOSQL_DATASETS[preferences.datasetName] ? preferences.datasetName : 'escuela';

        const safeToggle = getElement('nosqlSafeModeToggle');
        if (safeToggle) safeToggle.checked = safeMode;

        const datasetSelector = getElement('nosqlDatasetSelector');
        if (datasetSelector) datasetSelector.value = datasetName;
    }

    function savePreferences() {
        writeJSON(STORAGE_KEYS.preferences, { safeMode, datasetName });
    }

    function loadHistory() {
        const saved = readJSON(STORAGE_KEYS.history, []);
        history = Array.isArray(saved) ? saved.filter(item => item && typeof item.query === 'string').slice(0, HISTORY_LIMIT) : [];
    }

    function saveHistory() {
        writeJSON(STORAGE_KEYS.history, history);
    }

    function loadChallengeProgress() {
        const saved = readJSON(STORAGE_KEYS.challenges, {});
        challengeProgress = saved && typeof saved === 'object' && !Array.isArray(saved) ? saved : {};
    }

    function saveChallengeProgress() {
        writeJSON(STORAGE_KEYS.challenges, challengeProgress);
    }

    function renderCollections() {
        const container = getElement('nosqlCollectionList');
        const summary = getElement('nosqlCollectionSummary');
        if (!container || !state) return;

        const collections = global.NoSQL.getCollectionSummary(state);
        if (summary) {
            summary.textContent = `${state.name} · ${collections.length} colecciones`;
        }

        if (!collections.length) {
            container.innerHTML = '<p class="nosql-muted">No hay colecciones. Reinicia el dataset.</p>';
            return;
        }

        container.innerHTML = collections.map(collection => `
            <button type="button" class="nosql-collection-btn" data-collection="${escapeHtml(collection.name)}">
                <span><i class="fas fa-folder"></i> ${escapeHtml(collection.name)}</span>
                <small>${collection.count} docs</small>
            </button>
        `).join('');

        container.querySelectorAll('[data-collection]').forEach(button => {
            button.addEventListener('click', () => loadCollection(button.dataset.collection));
        });
    }

    function loadCollection(name) {
        const editor = getElement('nosqlEditor');
        if (!editor) return;
        editor.value = `db.${name}.find({})`;
        editor.focus();
    }

    function renderHistory() {
        const list = getElement('nosqlHistoryList');
        if (!list) return;

        if (!history.length) {
            list.innerHTML = '<li class="empty-history">Todavía no hay comandos ejecutados</li>';
            return;
        }

        list.innerHTML = '';
        history.forEach(item => {
            const li = document.createElement('li');
            const button = document.createElement('button');
            button.type = 'button';
            button.className = 'nosql-history-query';
            button.title = item.query;
            button.textContent = item.query;
            button.addEventListener('click', () => {
                const editor = getElement('nosqlEditor');
                if (editor) {
                    editor.value = item.query;
                    editor.focus();
                }
            });
            li.appendChild(button);
            list.appendChild(li);
        });
    }

    function addHistory(query) {
        history = [{ query, at: new Date().toISOString() }, ...history.filter(item => item.query !== query)].slice(0, HISTORY_LIMIT);
        saveHistory();
        renderHistory();
    }

    function clearHistory() {
        history = [];
        saveHistory();
        renderHistory();
        showToast('info', 'Historial NoSQL limpiado.');
    }

    function populateExamples() {
        const select = getElement('nosqlExampleSelector');
        if (!select || !Array.isArray(global.NOSQL_EXAMPLES)) return;

        select.innerHTML = global.NOSQL_EXAMPLES.map((example, index) => (
            `<option value="${index}">${escapeHtml(example.category)} · ${escapeHtml(example.title)}</option>`
        )).join('');
    }

    function loadExample() {
        const select = getElement('nosqlExampleSelector');
        const editor = getElement('nosqlEditor');
        if (!select || !editor) return;

        const example = global.NOSQL_EXAMPLES[Number(select.value)];
        if (!example) return;

        const usesStore = /db\.(productos|pedidos|clientes)\b/.test(example.query);
        if (usesStore && datasetName !== 'tienda') {
            showToast('warning', 'Este ejemplo usa el dataset Tienda. Cambia el dataset para ejecutarlo.');
            return;
        }

        editor.value = example.query;
        editor.focus();
    }

    function toggleSafeMode(enabled) {
        safeMode = Boolean(enabled);
        savePreferences();
        showToast('info', safeMode ? 'Modo seguro NoSQL activado.' : 'Modo seguro NoSQL desactivado.');
    }

    function describeDangerousCommand(reason) {
        const labels = {
            drop: 'eliminar una colección completa',
            deleteMany: 'eliminar varios documentos',
            updateMany: 'actualizar varios documentos'
        };
        return labels[reason] || 'modificar datos';
    }

    function renderTable(documents) {
        if (!Array.isArray(documents) || !documents.length) {
            return '<p class="nosql-muted">La consulta no devolvió documentos.</p>';
        }

        const columns = [];
        documents.forEach(document => {
            Object.keys(document).forEach(key => {
                if (!columns.includes(key) && columns.length < 14) columns.push(key);
            });
        });

        const rows = documents.map(document => columns.map(column => {
            const value = document[column];
            const display = value !== null && typeof value === 'object' ? JSON.stringify(value) : String(value ?? '');
            return `<td data-copy-value="${escapeHtml(display)}" title="Doble clic para copiar">${escapeHtml(display)}</td>`;
        }).join(''));

        return `
            <div class="result-container nosql-result-container">
                <table>
                    <thead><tr>${columns.map(column => `<th>${escapeHtml(column)}</th>`).join('')}</tr></thead>
                    <tbody>${rows.map(cells => `<tr>${cells}</tr>`).join('')}</tbody>
                </table>
            </div>
            <p class="result-scroll-hint">Desplázate horizontalmente si hay muchas columnas.</p>
        `;
    }

    function renderResult(result, durationMs) {
        const output = getElement('nosqlResultOutput');
        if (!output) return;

        const docs = Array.isArray(result.documents)
            ? result.documents
            : (result.document ? [result.document] : []);
        const isRead = result.type === 'find' || result.type === 'aggregate' || result.type === 'document';
        const json = JSON.stringify(isRead ? (result.document !== undefined ? result.document : docs) : result, null, 2);

        let html = `
            <div class="result-meta nosql-result-meta">
                <span class="result-summary"><i class="fas fa-check-circle"></i> ${escapeHtml(getResultSummary(result))}</span>
                <span class="result-time"><i class="fas fa-stopwatch"></i> ${escapeHtml(formatDuration(durationMs))}</span>
            </div>
        `;

        if (isRead && docs.length) {
            html += renderTable(docs);
        } else if (isRead) {
            html += '<p class="nosql-muted">No se encontraron documentos con ese criterio.</p>';
        } else {
            html += `<pre class="nosql-json">${escapeHtml(json)}</pre>`;
        }

        html += `
            <details class="nosql-json-details">
                <summary>Ver JSON completo</summary>
                <pre class="nosql-json">${escapeHtml(json)}</pre>
            </details>
        `;

        output.className = 'nosql-result-output';
        output.innerHTML = html;
    }

    function getResultSummary(result) {
        if (result.type === 'find' || result.type === 'aggregate') {
            return `${result.count} ${result.count === 1 ? 'documento' : 'documentos'}`;
        }
        if (result.type === 'document') {
            return result.document ? '1 documento' : 'Sin resultados';
        }
        if (result.type === 'count') {
            return `${result.count} documentos`;
        }
        if (result.type === 'distinct') {
            return `${result.values.length} valores distintos`;
        }
        if (result.type === 'write') {
            if (result.operation === 'insertOne') return `Documento insertado: ${result.insertedId}`;
            if (result.operation === 'insertMany') return `${result.insertedCount} documentos insertados`;
            if (result.operation === 'updateOne' || result.operation === 'updateMany') {
                return `${result.matchedCount} coincidencias, ${result.modifiedCount} modificados`;
            }
            if (result.operation === 'deleteOne' || result.operation === 'deleteMany') {
                return `${result.deletedCount} documentos eliminados`;
            }
            if (result.operation === 'drop') return 'Colección eliminada';
        }
        return 'Comando ejecutado';
    }

    function formatDuration(value) {
        const ms = Number(value) || 0;
        if (ms < 10) return `${ms.toFixed(1)} ms`;
        return `${Math.round(ms)} ms`;
    }

    function renderError(message, query) {
        const output = getElement('nosqlResultOutput');
        if (!output) return;
        output.className = 'nosql-result-output';
        output.innerHTML = `
            <div class="msg msg-error">
                <div class="msg-title"><i class="fas fa-circle-exclamation"></i> No se pudo ejecutar el comando</div>
                <div class="msg-detail">${escapeHtml(message)}</div>
                <div class="msg-detail"><code>${escapeHtml(query || '')}</code></div>
            </div>
            <p class="nosql-muted">Revisa la sintaxis. Las claves pueden ir sin comillas y los textos deben ir entre comillas.</p>
        `;
    }

    function clearResult() {
        const output = getElement('nosqlResultOutput');
        if (!output) return;
        output.className = 'result-placeholder';
        output.innerHTML = `
            <i class="fas fa-lightbulb placeholder-icon"></i>
            <p>Ejecuta un comando para ver los documentos</p>
        `;
    }

    function validateChallenge(result) {
        if (!activeChallengeId) return null;
        const challenge = global.NOSQL_CHALLENGES.find(item => item.id === activeChallengeId);
        if (!challenge) return null;

        if (!['find', 'aggregate'].includes(result.type)) {
            return { ok: false, message: 'Este reto se comprueba con una consulta de lectura: find o aggregate.' };
        }

        const documents = result.documents || [];

        if (Array.isArray(challenge.expectedIds)) {
            const actual = documents.map(document => document._id).filter(Boolean).sort();
            const expected = challenge.expectedIds.slice().sort();
            const ok = actual.length === expected.length && actual.every((id, index) => id === expected[index]);
            return {
                ok,
                message: ok
                    ? '¡Correcto! Encontraste todos los documentos esperados.'
                    : `Aún no coincide. Se esperaban ${expected.length} documentos y obtuviste ${actual.length}. Revisa el filtro y la proyección.`
            };
        }

        if (Array.isArray(challenge.expectedCities)) {
            const actual = documents.map(document => document._id);
            const ok = actual.length === challenge.expectedCities.length
                && actual.every((city, index) => city === challenge.expectedCities[index]);
            return {
                ok,
                message: ok
                    ? '¡Correcto! Agrupaste y ordenaste las ciudades como se pedía.'
                    : 'Aún no coincide. Revisa $group, $sum y el orden descendente con $sort.'
            };
        }

        return { ok: false, message: 'Este reto no tiene un validador configurado.' };
    }

    function renderChallengeFeedback(feedback) {
        const container = getElement('nosqlChallengeFeedback');
        if (!container) return;
        container.hidden = false;
        container.className = `challenge-result ${feedback.ok ? 'success' : 'error'}`;
        container.innerHTML = `<strong>${feedback.ok ? 'Reto completado' : 'Todavía no'}</strong><p>${escapeHtml(feedback.message)}</p>`;
    }

    function runQuery() {
        const editor = getElement('nosqlEditor');
        if (!editor || !global.NoSQL) return;

        const query = editor.value.trim();
        if (!query) {
            showToast('warning', 'Escribe un comando NoSQL antes de ejecutar.');
            editor.focus();
            return;
        }

        const dangerous = global.NoSQL.getDangerousCommandReason(query);
        if (safeMode && dangerous) {
            const confirmed = global.confirm(
                `Modo seguro NoSQL: vas a ${describeDangerousCommand(dangerous)} sin filtro.\n\n¿Quieres continuar?`
            );
            if (!confirmed) {
                showToast('info', 'Operación cancelada por el modo seguro.');
                return;
            }
        }

        const startedAt = Date.now();
        try {
            const result = global.NoSQL.executeCommand(state, query);
            const duration = Date.now() - startedAt;
            addHistory(query);
            renderResult(result, duration);

            if (result.type === 'write') {
                schedulePersist();
                renderCollections();
            }

            const feedback = validateChallenge(result);
            if (feedback) {
                renderChallengeFeedback(feedback);
                if (feedback.ok && !challengeProgress[activeChallengeId]) {
                    challengeProgress[activeChallengeId] = {
                        completedAt: new Date().toISOString()
                    };
                    saveChallengeProgress();
                    renderChallenges();
                }
            }

            showToast(result.type === 'write' ? 'success' : 'info', getResultSummary(result));
        } catch (error) {
            renderError(error.message, query);
            addHistory(query);
            showToast('error', error.message);
        }
    }

    function openAIHelp() {
        const editor = getElement('nosqlEditor');
        const modal = getElement('aiHelpModal');
        if (!editor || !modal || !state) return;

        const query = editor.value.trim();
        if (!query) {
            showToast('warning', 'Escribe un comando NoSQL antes de pedir ayuda al asistente.');
            editor.focus();
            return;
        }

        if (typeof global.requestAIExplanation !== 'function' || typeof global.openModal !== 'function') {
            showToast('warning', 'El asistente IA no está disponible en este entorno.');
            return;
        }

        const context = {
            query,
            error: '',
            schema: global.NoSQL.getSchemaSummary(state),
            mode: 'nosql'
        };

        global.openModal(modal);
        global.requestAIExplanation(context);
    }

    function renderChallenges() {
        const list = getElement('nosqlChallengeList');
        if (!list || !Array.isArray(global.NOSQL_CHALLENGES)) return;

        list.innerHTML = global.NOSQL_CHALLENGES.map(challenge => {
            const completed = Boolean(challengeProgress[challenge.id]);
            const active = challenge.id === activeChallengeId;
            return `
                <button type="button" class="nosql-challenge-card${active ? ' active' : ''}${completed ? ' completed' : ''}" data-challenge="${escapeHtml(challenge.id)}">
                    <span class="nosql-challenge-title">
                        <i class="fas fa-${completed ? 'circle-check' : 'circle'}"></i>
                        ${escapeHtml(challenge.title)}
                    </span>
                    <span class="challenge-level ${challenge.level === 'Básico' ? 'basico' : (challenge.level === 'Intermedio' ? 'intermedio' : 'avanzado')}">${escapeHtml(challenge.level)}</span>
                </button>
            `;
        }).join('');

        list.querySelectorAll('[data-challenge]').forEach(button => {
            button.addEventListener('click', () => openChallenge(button.dataset.challenge));
        });
    }

    function openChallenge(id) {
        const challenge = global.NOSQL_CHALLENGES.find(item => item.id === id);
        const detail = getElement('nosqlChallengeDetail');
        const editor = getElement('nosqlEditor');
        if (!challenge || !detail) return;

        activeChallengeId = id;
        if (editor) editor.value = challenge.starter;

        detail.innerHTML = `
            <div class="challenge-detail-header">
                <h3>${escapeHtml(challenge.title)}</h3>
                <span class="challenge-level ${challenge.level === 'Básico' ? 'basico' : (challenge.level === 'Intermedio' ? 'intermedio' : 'avanzado')}">${escapeHtml(challenge.level)}</span>
            </div>
            <p class="challenge-description">${escapeHtml(challenge.description)}</p>
            <details class="nosql-hint">
                <summary><i class="fas fa-lightbulb"></i> Ver pista</summary>
                <p>${escapeHtml(challenge.hint)}</p>
            </details>
            <div class="challenge-actions">
                <button type="button" class="btn-secondary" onclick="runNoSQLQuery()">
                    <i class="fas fa-play"></i> Ejecutar y comprobar
                </button>
            </div>
            <div id="nosqlChallengeFeedback" class="challenge-result" hidden></div>
        `;

        renderChallenges();
        if (editor) editor.focus();
    }

    function resetChallengeProgress() {
        if (!global.confirm('¿Reiniciar el progreso de los retos NoSQL?')) return;
        challengeProgress = {};
        saveChallengeProgress();
        activeChallengeId = null;
        renderChallenges();
        const detail = getElement('nosqlChallengeDetail');
        if (detail) {
            detail.innerHTML = `
                <div class="challenge-empty">
                    <i class="fas fa-trophy"></i>
                    <h3>Elige un reto NoSQL</h3>
                    <p>Selecciona un reto de la izquierda para cargar su plantilla y comprobar tu resultado.</p>
                </div>
            `;
        }
        showToast('info', 'Progreso de retos NoSQL reiniciado.');
    }

    function changeDataset(nextDataset, options) {
        if (!global.NOSQL_DATASETS[nextDataset]) return;
        const settings = options || {};
        if (!settings.silent && nextDataset !== datasetName && !global.confirm('Al cambiar de dataset se reemplaza la base NoSQL actual. ¿Continuar?')) {
            const selector = getElement('nosqlDatasetSelector');
            if (selector) selector.value = datasetName;
            return;
        }

        datasetName = nextDataset;
        state = global.NoSQL.createDatabase(global.NOSQL_DATASETS[datasetName]);
        savePreferences();
        clearPersistedState();
        schedulePersist();
        renderCollections();
        clearResult();
        if (!settings.silent) showToast('success', `Dataset NoSQL cambiado a ${state.name}.`);
    }

    function resetDatabase() {
        if (!global.confirm('¿Reiniciar la base NoSQL del dataset actual? Se perderán los cambios locales.')) return;
        state = createDefaultState();
        clearPersistedState();
        schedulePersist();
        renderCollections();
        clearResult();
        showToast('success', `Base NoSQL reiniciada: ${state.name}.`);
    }

    async function init() {
        if (initialized) return;
        initialized = true;

        if (!global.NoSQL || !global.NOSQL_DATASETS) {
            console.error('No se pudo cargar el motor NoSQL.');
            return;
        }

        loadPreferences();
        loadHistory();
        loadChallengeProgress();
        populateExamples();
        renderHistory();
        renderChallenges();

        const editor = getElement('nosqlEditor');
        if (editor) {
            editor.addEventListener('keydown', event => {
                if ((event.ctrlKey || event.metaKey) && event.key === 'Enter') {
                    event.preventDefault();
                    runQuery();
                }
            });
        }

        state = createDefaultState();
        renderCollections();

        try {
            const saved = await loadPersistedState();
            if (saved && saved.state && saved.state.collections) {
                datasetName = global.NOSQL_DATASETS[saved.datasetName] ? saved.datasetName : datasetName;
                state = saved.state;
                const selector = getElement('nosqlDatasetSelector');
                if (selector) selector.value = datasetName;
                renderCollections();
                setPersistenceState('saved', 'Copia local restaurada');
            } else {
                setPersistenceState('saved', 'Guardado local');
            }
        } catch (error) {
            setPersistenceState('error', 'Solo en memoria');
        }
    }

    global.runNoSQLQuery = runQuery;
    global.clearNoSQLHistory = clearHistory;
    global.clearNoSQLResult = clearResult;
    global.loadNoSQLExample = loadExample;
    global.loadNoSQLCollection = loadCollection;
    global.resetNoSQLDatabase = resetDatabase;
    global.changeNoSQLDataset = changeDataset;
    global.toggleNoSQLSafeMode = toggleSafeMode;
    global.openNoSQLAIHelp = openAIHelp;
    global.loadNoSQLChallenge = openChallenge;
    global.resetNoSQLChallengeProgress = resetChallengeProgress;

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
}(typeof window !== 'undefined' ? window : globalThis));
