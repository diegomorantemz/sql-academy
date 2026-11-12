let db;
let SQLModule = null;
let dbInitialized = false;
let queryHistory = [];
let diagramFullView = false;
let analyzeSelectedTable = null;
let analyzeExplorerMode = 'view';
const TABLE_EDITOR_ROW_LIMIT = 100;

// ============================================
// PERSISTENCIA LOCAL
// ============================================

const STORAGE_KEYS = {
    history: 'sql-academy-history-v1',
    preferences: 'sql-academy-preferences-v1',
    challenges: 'sql-academy-challenges-v1',
    learningPath: 'sql-academy-path-v1',
    activeCourse: 'sql-academy-active-course-v1',
    nosqlCourse: 'sql-academy-nosql-course-v1',
    courseAssessment: 'sql-academy-course-assessment-v1',
    skillProfile: 'sql-academy-skill-profile-v1'
};
const PERSIST_DB_NAME = 'sql-academy';
const PERSIST_DB_VERSION = 1;
const PERSIST_STORE = 'database';
const HISTORY_LIMIT = 30;

let persistenceDbPromise = null;
let persistTimer = null;
let preferences = {
    theme: 'light',
    safeMode: true,
    dataset: 'escuela'
};

// ============================================
// SONIDO
// ============================================

const SOUND_STORAGE_KEY = 'sql-academy-sound-enabled';
let soundEnabled = false;
let audioContext = null;
let masterGain = null;

function loadSoundPreference() {
    try {
        soundEnabled = localStorage.getItem(SOUND_STORAGE_KEY) === '1';
    } catch (error) {
        soundEnabled = false;
    }
}

function saveSoundPreference() {
    try {
        localStorage.setItem(SOUND_STORAGE_KEY, soundEnabled ? '1' : '0');
    } catch (error) {
        // La app sigue funcionando aunque localStorage esté bloqueado.
    }
}

function updateSoundButton() {
    const button = document.getElementById('soundToggle');
    if (!button) return;
    button.innerHTML = `<i class="fas ${soundEnabled ? 'fa-volume-high' : 'fa-volume-xmark'}"></i>`;
    button.setAttribute('aria-pressed', String(soundEnabled));
    button.setAttribute('aria-label', soundEnabled ? 'Desactivar sonido' : 'Activar sonido');
    button.title = soundEnabled ? 'Desactivar sonido' : 'Activar sonido';
}

function applySoundPreference() {
    updateSoundButton();
    if (audioContext && masterGain) {
        masterGain.gain.setTargetAtTime(soundEnabled ? 0.75 : 0, audioContext.currentTime, 0.02);
    }
}

function ensureAudioContext() {
    if (audioContext) {
        if (audioContext.state === 'suspended') {
            audioContext.resume().catch(() => {});
        }
        if (masterGain) {
            masterGain.gain.setTargetAtTime(soundEnabled ? 0.75 : 0, audioContext.currentTime, 0.02);
        }
        return audioContext;
    }

    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (!AudioContextClass) return null;

    try {
        audioContext = new AudioContextClass();
        masterGain = audioContext.createGain();
        masterGain.gain.value = soundEnabled ? 0.75 : 0;
        masterGain.connect(audioContext.destination);
        if (audioContext.state === 'suspended') {
            audioContext.resume().catch(() => {});
        }
        return audioContext;
    } catch (error) {
        audioContext = null;
        masterGain = null;
        return null;
    }
}

function playTone({ frequency, start = 0, duration = 0.2, type = 'sine', gain = 0.04, endFrequency = frequency }) {
    const context = ensureAudioContext();
    if (!context || !masterGain) return;

    const startAt = context.currentTime + start;
    const oscillator = context.createOscillator();
    const envelope = context.createGain();
    oscillator.type = type;
    oscillator.frequency.setValueAtTime(frequency, startAt);
    oscillator.frequency.exponentialRampToValueAtTime(Math.max(20, endFrequency), startAt + duration);
    envelope.gain.setValueAtTime(0.0001, startAt);
    envelope.gain.exponentialRampToValueAtTime(gain, startAt + Math.min(0.02, duration / 4));
    envelope.gain.exponentialRampToValueAtTime(0.0001, startAt + duration);
    oscillator.connect(envelope).connect(masterGain);
    oscillator.start(startAt);
    oscillator.stop(startAt + duration + 0.05);
}

function playNoiseHit({ start = 0, duration = 0.35, gain = 0.03, frequency = 1100 }) {
    const context = ensureAudioContext();
    if (!context || !masterGain) return;

    const startAt = context.currentTime + start;
    const sampleCount = Math.max(1, Math.floor(context.sampleRate * duration));
    const buffer = context.createBuffer(1, sampleCount, context.sampleRate);
    const data = buffer.getChannelData(0);
    for (let index = 0; index < sampleCount; index += 1) {
        data[index] = (Math.random() * 2 - 1) * (1 - index / sampleCount);
    }

    const source = context.createBufferSource();
    const filter = context.createBiquadFilter();
    const envelope = context.createGain();
    source.buffer = buffer;
    filter.type = 'bandpass';
    filter.frequency.value = frequency;
    filter.Q.value = 0.7;
    envelope.gain.setValueAtTime(gain, startAt);
    envelope.gain.exponentialRampToValueAtTime(0.0001, startAt + duration);
    source.connect(filter).connect(envelope).connect(masterGain);
    source.start(startAt);
    source.stop(startAt + duration + 0.02);
}

function playIntroSound() {
    const context = ensureAudioContext();
    if (!context || !masterGain) return;

    const startAt = context.currentTime;
    const drone = context.createOscillator();
    const droneEnvelope = context.createGain();
    drone.type = 'sine';
    drone.frequency.setValueAtTime(55, startAt);
    droneEnvelope.gain.setValueAtTime(0.0001, startAt);
    droneEnvelope.gain.exponentialRampToValueAtTime(0.035, startAt + 0.18);
    droneEnvelope.gain.setValueAtTime(0.035, startAt + 3.25);
    droneEnvelope.gain.exponentialRampToValueAtTime(0.0001, startAt + 4);
    drone.connect(droneEnvelope).connect(masterGain);
    drone.start(startAt);
    drone.stop(startAt + 4.1);

    for (let index = 0; index < 4; index += 1) {
        playTone({
            frequency: 110,
            start: 0.35 + index * 0.82,
            duration: 0.18,
            type: 'triangle',
            gain: 0.03,
            endFrequency: 55
        });
    }

    playNoiseHit({ start: 0.12, duration: 0.45, gain: 0.03, frequency: 1200 });
    playTone({ frequency: 440, start: 0.12, duration: 0.5, type: 'sine', gain: 0.014, endFrequency: 660 });
}

function playSuccessSound() {
    playTone({ frequency: 523.25, start: 0, duration: 0.12, gain: 0.045 });
    playTone({ frequency: 783.99, start: 0.1, duration: 0.2, gain: 0.04 });
}

function playErrorSound() {
    playTone({ frequency: 220, start: 0, duration: 0.16, type: 'triangle', gain: 0.035, endFrequency: 170 });
    playTone({ frequency: 164.81, start: 0.12, duration: 0.22, type: 'triangle', gain: 0.03, endFrequency: 130 });
}

function playSound(type) {
    if (!soundEnabled) return;
    if (type === 'intro') playIntroSound();
    else if (type === 'success') playSuccessSound();
    else if (type === 'error') playErrorSound();
}

function toggleSound() {
    soundEnabled = !soundEnabled;
    saveSoundPreference();
    applySoundPreference();

    if (soundEnabled) {
        ensureAudioContext();
        playSound('success');
        showToast('success', 'Sonido activado.');
    } else {
        if (audioContext && masterGain) {
            masterGain.gain.setTargetAtTime(0, audioContext.currentTime, 0.02);
        }
        showToast('info', 'Sonido desactivado.');
    }
}

// ============================================
// ASISTENTE IA
// ============================================

const AI_ENDPOINT = '/api/explain';
const AI_MAX_QUERY_CHARS = 4000;
const AI_CACHE_LIMIT = 20;
const AI_COOLDOWN_MS = 15000;
const AI_REQUEST_TIMEOUT_MS = 25000;

let lastQueryError = null;
let aiLastContext = null;
let aiLastResponse = '';
let aiRequestInFlight = false;
let aiAbortController = null;
let aiCooldownUntil = 0;

const aiResponseCache = new Map();

// ============================================
// RESULTADOS
// ============================================

const RESULTS_PAGE_SIZE = 100;
let lastResultSets = [];
let lastQueryMeta = { durationMs: 0, executedAt: null };
let resultRowLimits = [];
let resultSortState = [];
let lastFocusedElement = null;
let deferredInstallPrompt = null;

const FOCUSABLE_SELECTOR = 'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])';

// ============================================
// UTILIDADES GENERALES
// ============================================

/**
 * Escapa texto para insertarlo de forma segura en HTML.
 * Se usa tanto en contenido como en valores de atributos.
 */
function escapeHtml(value) {
    if (value === null || value === undefined) return '';
    return String(value)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

/** Escapa un nombre de identificador SQL (tabla/columna). */
function quoteIdent(name) {
    return '"' + String(name).replace(/"/g, '""') + '"';
}

/** Lee un valor JSON de localStorage sin romper la app si está bloqueado. */
function readStoredJSON(key, fallback) {
    try {
        const raw = window.localStorage.getItem(key);
        if (!raw) return fallback;
        const parsed = JSON.parse(raw);
        return parsed ?? fallback;
    } catch (error) {
        console.warn(`No se pudo leer ${key} de localStorage:`, error);
        return fallback;
    }
}

/** Guarda un valor JSON en localStorage. */
function writeStoredJSON(key, value) {
    try {
        window.localStorage.setItem(key, JSON.stringify(value));
        return true;
    } catch (error) {
        console.warn(`No se pudo guardar ${key} en localStorage:`, error);
        return false;
    }
}

function removeStoredItem(key) {
    try {
        window.localStorage.removeItem(key);
    } catch (error) {
        console.warn(`No se pudo eliminar ${key} de localStorage:`, error);
    }
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
function openPersistenceDb() {
    if (!('indexedDB' in window)) {
        return Promise.reject(new Error('IndexedDB no está disponible'));
    }
    if (persistenceDbPromise) return persistenceDbPromise;

    persistenceDbPromise = new Promise((resolve, reject) => {
        const request = window.indexedDB.open(PERSIST_DB_NAME, PERSIST_DB_VERSION);

        request.onupgradeneeded = () => {
            const database = request.result;
            if (!database.objectStoreNames.contains(PERSIST_STORE)) {
                database.createObjectStore(PERSIST_STORE, { keyPath: 'id' });
            }
        };

        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error || new Error('No se pudo abrir IndexedDB'));
        request.onblocked = () => reject(new Error('IndexedDB está bloqueada por otra pestaña'));
    }).catch(error => {
        persistenceDbPromise = null;
        throw error;
    });

    return persistenceDbPromise;
}

/** Restaura el último archivo SQLite guardado. Devuelve null si no hay uno válido. */
async function loadDatabaseFromIndexedDB(SQL) {
    try {
        const database = await openPersistenceDb();
        const record = await new Promise((resolve, reject) => {
            const transaction = database.transaction(PERSIST_STORE, 'readonly');
            const request = transaction.objectStore(PERSIST_STORE).get('main');
            request.onsuccess = () => resolve(request.result || null);
            request.onerror = () => reject(request.error || new Error('No se pudo leer la base guardada'));
        });

        if (!record || !record.bytes) return null;

        const restored = new SQL.Database(new Uint8Array(record.bytes));
        // Valida que el archivo sea SQLite y que se pueda leer antes de usarlo.
        restored.exec('SELECT name FROM sqlite_master LIMIT 1;');
        restored.run('PRAGMA foreign_keys = ON;');
        return restored;
    } catch (error) {
        console.warn('No se pudo restaurar la base de datos guardada:', error);
        // Un archivo corrupto no debe impedir que la app arranque con los datos de ejemplo.
        try { await clearSavedDatabase(); } catch (cleanupError) { /* ignorar */ }
        return null;
    }
}

async function saveDatabaseToIndexedDB() {
    if (!db || !dbInitialized) return false;

    const bytes = db.export();
    const database = await openPersistenceDb();

    await new Promise((resolve, reject) => {
        const transaction = database.transaction(PERSIST_STORE, 'readwrite');
        const request = transaction.objectStore(PERSIST_STORE).put({
            id: 'main',
            bytes,
            updatedAt: Date.now()
        });
        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error || new Error('No se pudo guardar la base de datos'));
        transaction.onerror = () => reject(transaction.error || new Error('La transacción de guardado falló'));
    });

    return true;
}

async function clearSavedDatabase() {
    try {
        const database = await openPersistenceDb();
        await new Promise((resolve, reject) => {
            const transaction = database.transaction(PERSIST_STORE, 'readwrite');
            const request = transaction.objectStore(PERSIST_STORE).delete('main');
            request.onsuccess = () => resolve();
            request.onerror = () => reject(request.error || new Error('No se pudo borrar la base guardada'));
            transaction.onerror = () => reject(transaction.error || new Error('La transacción de borrado falló'));
        });
    } catch (error) {
        console.warn('No se pudo borrar la base de datos guardada:', error);
    }
}

function setPersistenceStatus(state) {
    const status = document.getElementById('persistenceStatus');
    if (!status) return;

    status.classList.remove('is-saving', 'is-saved', 'is-error');
    if (state === 'saving') {
        status.classList.add('is-saving');
        status.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Guardando...';
        status.title = 'Guardando la base de datos en este navegador';
    } else if (state === 'error') {
        status.classList.add('is-error');
        status.innerHTML = '<i class="fas fa-triangle-exclamation"></i> Sin guardado';
        status.title = 'No se pudo guardar la base de datos en este navegador';
    } else {
        status.classList.add('is-saved');
        status.innerHTML = '<i class="fas fa-hard-drive"></i> Guardado local';
        status.title = 'La base de datos se guarda en este navegador (IndexedDB)';
    }
}

async function persistDatabase() {
    if (!db || !dbInitialized) return;
    setPersistenceStatus('saving');
    try {
        await saveDatabaseToIndexedDB();
        setPersistenceStatus('saved');
    } catch (error) {
        console.warn('No se pudo guardar la base de datos:', error);
        setPersistenceStatus('error');
    }
}

function schedulePersistDatabase() {
    clearTimeout(persistTimer);
    persistTimer = setTimeout(() => { persistDatabase(); }, 250);
}

/** Detecta consultas que pueden modificar el esquema o los datos. */
function isWriteQuery(sql) {
    const normalized = String(sql || '')
        .replace(/--[^\n]*/g, ' ')
        .replace(/\/\*[\s\S]*?\*\//g, ' ')
        .trim();
    return /^(INSERT|UPDATE|DELETE|REPLACE|CREATE|DROP|ALTER|TRUNCATE|VACUUM|REINDEX|ANALYZE|PRAGMA)\b/i.test(normalized);
}

/** Devuelve las tablas de usuario de la base de datos actual. */
function getUserTables(database = db) {
    if (!database) return [];
    try {
        const result = database.exec(
            "SELECT name FROM sqlite_master WHERE type = 'table' AND name NOT LIKE 'sqlite_%' ORDER BY name"
        );
        return result.length > 0 ? result[0].values.map(row => String(row[0])) : [];
    } catch (e) {
        console.error('No se pudieron leer las tablas:', e);
        return [];
    }
}

/** Devuelve la estructura de una tabla usando PRAGMA table_info. */
function getTableColumns(tableName, database = db) {
    if (!database) return [];
    try {
        const result = database.exec(`PRAGMA table_info(${quoteIdent(tableName)})`);
        if (result.length === 0) return [];
        return result[0].values.map(row => ({
            cid: row[0],
            name: String(row[1]),
            type: String(row[2] || ''),
            notnull: Number(row[3]) === 1,
            dflt_value: row[4],
            pk: Number(row[5]) || 0
        }));
    } catch (e) {
        console.error(`No se pudo leer la tabla ${tableName}:`, e);
        return [];
    }
}

/** Devuelve la clave primaria de una tabla (o null si no tiene). */
function getPrimaryKey(tableName) {
    const columns = getTableColumns(tableName);
    return columns.find(col => col.pk > 0) || null;
}

/** Indica si un tipo declarado de SQLite es numérico. */
function isNumericType(type) {
    return /INT|REAL|FLOA|DOUB|NUM|DEC|BOOL/i.test(String(type || ''));
}

/**
 * Convierte un valor del editor de tablas al tipo declarado de la columna.
 * En columnas numéricas, los valores vacíos se guardan como NULL; en texto
 * se conserva la cadena vacía y "NULL" se interpreta como nulo explícito.
 */
function parseColumnValue(rawValue, column) {
    const raw = rawValue === null || rawValue === undefined ? '' : String(rawValue);

    // "NULL" siempre representa un nulo explícito, sin importar el tipo.
    if (raw.trim().toUpperCase() === 'NULL') return null;

    if (isNumericType(column.type)) {
        if (raw.trim() === '') return null;
        const normalized = raw.trim().replace(',', '.');
        const number = Number(normalized);
        if (!Number.isFinite(number)) {
            throw new Error(`"${raw}" no es un valor numérico válido para la columna ${column.name}`);
        }
        return number;
    }

    return raw;
}

/** Deja el panel de resultados listo para ejecutar una consulta. */
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

/** Muestra una notificación breve sin sustituir los resultados de la consulta. */
function showToast(type, message, duration = 2800) {
    const container = document.getElementById('toastContainer');
    if (!container) return;

    const icons = {
        success: 'fa-check-circle',
        warning: 'fa-triangle-exclamation',
        error: 'fa-circle-exclamation',
        info: 'fa-circle-info'
    };
    const toast = document.createElement('div');
    toast.className = `toast toast-${icons[type] ? type : 'info'}`;
    toast.setAttribute('role', type === 'error' ? 'alert' : 'status');
    toast.innerHTML = `
        <i class="fas ${icons[type] || icons.info}" aria-hidden="true"></i>
        <span>${escapeHtml(message)}</span>
    `;
    container.appendChild(toast);

    setTimeout(() => {
        toast.classList.add('toast-hiding');
        setTimeout(() => toast.remove(), 220);
    }, duration);
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
function initDatabase(options = {}) {
    const restore = options.restore !== false;
    dbInitialized = false;

    if (typeof initSqlJs !== 'function') {
        showMessage('error', 'No se pudo cargar SQL.js', 'Revisa tu conexión a internet y recarga la página.');
        return;
    }

    // Liberar la base de datos anterior (por ejemplo, al reiniciar).
    if (db) {
        try { db.close(); } catch (e) { /* ignorar */ }
        db = null;
    }

    initSqlJs({
        locateFile: file => `https://cdn.jsdelivr.net/npm/sql.js@1.10.3/dist/${file}`
    }).then(async SQL => {
        SQLModule = SQL;

        if (restore) {
            const restored = await loadDatabaseFromIndexedDB(SQL);
            if (restored) {
                db = restored;
                dbInitialized = true;
                lastQueryError = null;
                refreshAll();
                setPersistenceStatus('saved');
                showMessage(
                    'success',
                    'Base de datos restaurada',
                    'Se recuperaron los datos guardados en este navegador. Usa “Reiniciar BD” si quieres volver a los datos de ejemplo.'
                );
                return;
            }
        }

        db = new SQL.Database();
        // SQLite desactiva las claves foráneas por defecto; el simulador las enseña,
        // así que deben aplicarse de verdad.
        db.run('PRAGMA foreign_keys = ON;');

        // TABLA: estudiantes
        db.run(`
            CREATE TABLE estudiantes (
                id INTEGER PRIMARY KEY,
                nombre TEXT NOT NULL,
                edad INTEGER,
                carrera TEXT,
                promedio REAL,
                ciudad TEXT,
                fecha_ingreso TEXT
            )
        `);
        
        db.run(`
            INSERT INTO estudiantes VALUES 
                (1, 'Ana Garcia', 20, 'Ingenieria', 15.5, 'Lima', '2023-03-15'),
                (2, 'Carlos Lopez', 22, 'Medicina', 17.2, 'Arequipa', '2022-02-10'),
                (3, 'Maria Torres', 19, 'Derecho', 12.8, 'Cusco', '2024-01-20'),
                (4, 'Juan Perez', 21, 'Arquitectura', 16.9, 'Lima', '2023-04-05'),
                (5, 'Laura Sanchez', 20, 'Ingenieria', 18.5, 'Trujillo', '2023-03-01'),
                (6, 'Pedro Diaz', 23, 'Ingenieria', 14.2, 'Lima', '2022-01-15'),
                (7, 'Sofia Romero', 21, 'Medicina', 17.1, 'Arequipa', '2023-02-20'),
                (8, 'Diego Luna', 22, 'Arquitectura', 13.9, 'Cusco', '2022-06-10'),
                (9, 'Valentina Rios', 19, 'Derecho', 15.7, 'Lima', '2024-02-14'),
                (10, 'Mateo Cruz', 24, 'Ingenieria', 16.0, 'Trujillo', '2021-08-01'),
                (11, 'Camila Vega', 20, 'Medicina', 15.8, 'Lima', '2023-09-15'),
                (12, 'Lucas Fernandez', 22, 'Arquitectura', 14.1, 'Arequipa', '2022-11-20'),
                (13, 'Isabella Ortiz', 19, 'Derecho', 17.3, 'Cusco', '2024-01-10'),
                (14, 'Gabriel Silva', 21, 'Ingenieria', 13.6, 'Lima', '2023-05-22'),
                (15, 'Valeria Mendoza', 23, 'Medicina', 18.4, 'Trujillo', '2022-04-18'),
                (16, 'Daniel Castro', 20, 'Arquitectura', 15.4, 'Lima', '2023-07-07'),
                (17, 'Lucia Herrera', 22, 'Derecho', 14.0, 'Arequipa', '2022-09-30'),
                (18, 'Tomas Gutierrez', 19, 'Ingenieria', 17.1, 'Cusco', '2024-03-25'),
                (19, 'Paula Morales', 21, 'Medicina', 13.5, 'Lima', '2023-10-12'),
                (20, 'Joaquin Nunez', 24, 'Arquitectura', 16.9, 'Trujillo', '2021-12-01'),
                (21, 'Martina Flores', 20, 'Ingenieria', 17.2, 'Lima', '2023-06-15'),
                (22, 'Sebastian Pena', 22, 'Derecho', 15.6, 'Arequipa', '2022-07-20'),
                (23, 'Renata Cabrera', 19, 'Medicina', 16.0, 'Cusco', '2024-02-28'),
                (24, 'Emiliano Reyes', 21, 'Arquitectura', 13.7, 'Lima', '2023-08-14'),
                (25, 'Antonella Figueroa', 23, 'Ingenieria', 15.8, 'Trujillo', '2022-05-06')
        `);
        
        // TABLA: cursos
        db.run(`
            CREATE TABLE cursos (
                id INTEGER PRIMARY KEY,
                nombre TEXT NOT NULL,
                creditos INTEGER,
                profesor TEXT,
                departamento TEXT,
                semestre INTEGER
            )
        `);
        
        db.run(`
            INSERT INTO cursos VALUES 
                (1, 'Matematicas I', 4, 'Dr. Ramirez', 'Ciencias', 1),
                (2, 'Programacion I', 6, 'Dra. Martinez', 'Ingenieria', 1),
                (3, 'Fisica I', 3, 'Dr. Gomez', 'Ciencias', 1),
                (4, 'Quimica I', 4, 'Dra. Fernandez', 'Ciencias', 1),
                (5, 'Matematicas II', 4, 'Dr. Ramirez', 'Ciencias', 2),
                (6, 'Programacion II', 6, 'Dra. Martinez', 'Ingenieria', 2),
                (7, 'Fisica II', 3, 'Dr. Gomez', 'Ciencias', 2),
                (8, 'Quimica II', 4, 'Dra. Fernandez', 'Ciencias', 2),
                (9, 'Bases de Datos I', 5, 'Dr. Torres', 'Ingenieria', 3),
                (10, 'Redes', 4, 'Dra. Castro', 'Ingenieria', 3),
                (11, 'Algoritmos', 6, 'Dr. Mendoza', 'Ingenieria', 3),
                (12, 'Gestion de Proyectos', 4, 'Dra. Ortega', 'Administracion', 4),
                (13, 'Marketing Digital', 3, 'Dr. Silva', 'Administracion', 4),
                (14, 'Finanzas', 4, 'Dra. Paz', 'Administracion', 4),
                (15, 'Ingenieria de Software', 5, 'Dr. Torres', 'Ingenieria', 4)
        `);
        
        // TABLA: inscripciones
        db.run(`
            CREATE TABLE inscripciones (
                id INTEGER PRIMARY KEY,
                estudiante_id INTEGER,
                curso_id INTEGER,
                anio INTEGER,
                ciclo TEXT,
                nota REAL,
                FOREIGN KEY (estudiante_id) REFERENCES estudiantes(id),
                FOREIGN KEY (curso_id) REFERENCES cursos(id)
            )
        `);
        
        db.run(`
            INSERT INTO inscripciones VALUES 
                (1, 1, 1, 2023, '2023-1', 15.5),
                (2, 1, 2, 2023, '2023-1', 17.0),
                (3, 1, 3, 2023, '2023-1', 14.0),
                (4, 2, 3, 2023, '2023-1', 18.5),
                (5, 2, 4, 2023, '2023-1', 16.0),
                (6, 3, 2, 2023, '2023-1', 12.5),
                (7, 3, 9, 2023, '2023-1', 11.0),
                (8, 4, 1, 2023, '2023-1', 17.5),
                (9, 4, 5, 2023, '2023-1', 16.0),
                (10, 5, 2, 2023, '2023-1', 19.0),
                (11, 5, 6, 2023, '2023-1', 18.0),
                (12, 5, 10, 2023, '2023-1', 16.5),
                (13, 6, 1, 2023, '2023-1', 13.0),
                (14, 6, 5, 2023, '2023-1', 14.5),
                (15, 6, 9, 2023, '2023-1', 12.0),
                (16, 7, 4, 2023, '2023-1', 17.0),
                (17, 7, 7, 2023, '2023-1', 15.5),
                (18, 8, 1, 2023, '2023-1', 14.0),
                (19, 8, 5, 2023, '2023-1', 13.5),
                (20, 9, 2, 2023, '2023-1', 16.5),
                (21, 9, 13, 2023, '2023-1', 14.0),
                (22, 10, 2, 2023, '2023-1', 18.0),
                (23, 10, 6, 2023, '2023-1', 17.5),
                (24, 10, 11, 2023, '2023-1', 16.0),
                (25, 11, 3, 2023, '2023-1', 15.0),
                (26, 11, 7, 2023, '2023-1', 14.5),
                (27, 12, 1, 2023, '2023-1', 12.0),
                (28, 12, 5, 2023, '2023-1', 13.0),
                (29, 13, 9, 2023, '2023-1', 18.5),
                (30, 13, 13, 2023, '2023-1', 16.0),
                (31, 14, 2, 2023, '2023-1', 14.0),
                (32, 14, 6, 2023, '2023-1', 15.5),
                (33, 15, 4, 2023, '2023-1', 19.0),
                (34, 15, 8, 2023, '2023-1', 17.0),
                (35, 15, 12, 2023, '2023-1', 16.5),
                (36, 16, 1, 2023, '2023-1', 15.0),
                (37, 16, 5, 2023, '2023-1', 14.0),
                (38, 17, 9, 2023, '2023-1', 13.0),
                (39, 17, 14, 2023, '2023-1', 12.5),
                (40, 18, 2, 2023, '2023-1', 18.0),
                (41, 18, 6, 2023, '2023-1', 17.0),
                (42, 18, 10, 2023, '2023-1', 15.5),
                (43, 19, 3, 2023, '2023-1', 14.0),
                (44, 19, 7, 2023, '2023-1', 13.5),
                (45, 20, 1, 2023, '2023-1', 16.0),
                (46, 20, 5, 2023, '2023-1', 15.0),
                (47, 20, 11, 2023, '2023-1', 17.5),
                (48, 21, 2, 2023, '2023-1', 18.5),
                (49, 21, 6, 2023, '2023-1', 17.0),
                (50, 21, 9, 2023, '2023-1', 16.0),
                (51, 22, 4, 2023, '2023-1', 15.5),
                (52, 22, 8, 2023, '2023-1', 14.0),
                (53, 22, 13, 2023, '2023-1', 13.5),
                (54, 23, 3, 2023, '2023-1', 17.0),
                (55, 23, 7, 2023, '2023-1', 16.5),
                (56, 24, 1, 2023, '2023-1', 14.5),
                (57, 24, 5, 2023, '2023-1', 13.0),
                (58, 24, 12, 2023, '2023-1', 12.0),
                (59, 25, 2, 2023, '2023-1', 16.5),
                (60, 25, 6, 2023, '2023-1', 15.0),
                (61, 25, 15, 2023, '2023-1', 18.0),
                (62, 1, 5, 2024, '2024-1', 16.0),
                (63, 2, 2, 2024, '2024-1', 17.5),
                (64, 5, 9, 2024, '2024-1', 18.5),
                (65, 7, 12, 2024, '2024-1', 15.0),
                (66, 10, 15, 2024, '2024-1', 17.0),
                (67, 15, 13, 2024, '2024-1', 16.5),
                (68, 18, 14, 2024, '2024-1', 14.0),
                (69, 21, 10, 2024, '2024-1', 16.0),
                (70, 25, 11, 2024, '2024-1', 17.5)
        `);
        
        dbInitialized = true;
        preferences.dataset = 'escuela';
        savePreferences();
        syncDatasetSelector();
        setPersistenceStatus('saved');
        refreshAll();
        showMessage('success', 'Base de datos lista. Escribe una consulta SQL.');
        schedulePersistDatabase();
    }).catch(error => {
        showMessage('error', 'Error al cargar SQL.js', `<code>${escapeHtml(error.message)}</code>`);
    });
}

// MOSTRAR INFO DE TABLAS
function showTablesInfo() {
    if (!db) return;
    const container = document.getElementById('tableInfo');

    try {
        const tables = getUserTables();
        if (tables.length === 0) {
            container.innerHTML = '<p class="text-muted">No hay tablas disponibles</p>';
            return;
        }

        let html = '';
        tables.forEach(tableName => {
            try {
                const result = db.exec(`SELECT * FROM ${quoteIdent(tableName)} LIMIT 5`);
                if (result.length === 0) return;

                const cols = result[0].columns;
                const rows = result[0].values;

                const countResult = db.exec(`SELECT COUNT(*) AS total FROM ${quoteIdent(tableName)}`);
                const totalRows = countResult.length > 0 ? countResult[0].values[0][0] : 0;

                html += `<div class="table-card">`;
                html += `<div class="table-title"><i class="fas fa-table"></i> ${escapeHtml(tableName)} <span class="badge-count">${escapeHtml(totalRows)} registros</span></div>`;
                html += `<div class="table-scroll" tabindex="0" role="region" aria-label="Tabla de datos">`;
                html += `<table class="info-table">`;

                html += '<thead><tr>';
                cols.forEach(col => {
                    html += `<th>${escapeHtml(col)}</th>`;
                });
                html += '</tr></thead>';

                html += '<tbody>';
                if (rows.length === 0) {
                    html += `<tr><td colspan="${cols.length}" style="text-align:center;color:var(--text-muted);">Sin datos</td></tr>`;
                } else {
                    rows.forEach(row => {
                        html += '<tr>';
                        row.forEach(val => {
                            const displayVal = val !== null && val !== undefined ? String(val) : 'NULL';
                            const truncated = displayVal.length > 20 ? displayVal.substring(0, 20) + '...' : displayVal;
                            html += `<td title="${escapeHtml(displayVal)}">${escapeHtml(truncated)}</td>`;
                        });
                        html += '</tr>';
                    });
                    if (totalRows > 5) {
                        html += `<tr><td colspan="${cols.length}" style="text-align:center;color:var(--text-muted);font-style:italic;">
                            ... y ${escapeHtml(totalRows - 5)} registros mas
                        </td></tr>`;
                    }
                }

                html += '</tbody></table>';
                html += '</div></div>';
            } catch (tableError) {
                console.error(`Error al mostrar la tabla ${tableName}:`, tableError);
                html += `<div class="table-card"><div class="table-title"><i class="fas fa-table"></i> ${escapeHtml(tableName)}</div>
                    <p style="color:#dc3545;font-size:12px;">No se pudo leer esta tabla.</p></div>`;
            }
        });

        container.innerHTML = html || '<p class="text-muted">No hay tablas disponibles</p>';
    } catch (e) {
        container.innerHTML = `<p style="color:#dc3545;"><i class="fas fa-circle-exclamation"></i> Error: ${escapeHtml(e.message)}</p>`;
    }
}

// MOSTRAR RESULTADOS
function formatDuration(ms) {
    if (ms === null || ms === undefined || ms === '') return '';
    const value = Number(ms);
    if (!Number.isFinite(value) || value < 0) return '';
    return value < 10 ? `${value.toFixed(1)} ms` : `${Math.round(value)} ms`;
}

function compareResultValues(a, b) {
    if (a === b) return 0;
    if (a === null || a === undefined) return -1;
    if (b === null || b === undefined) return 1;
    if (typeof a === 'number' && typeof b === 'number') return a - b;
    return String(a).localeCompare(String(b), 'es', { numeric: true, sensitivity: 'base' });
}

function getSortedResultSet(index) {
    const set = lastResultSets[index];
    if (!set) return null;
    const sort = resultSortState[index];
    if (!sort) return set;

    const values = set.values.map(row => row.slice());
    values.sort((left, right) => {
        const comparison = compareResultValues(left[sort.column], right[sort.column]);
        return sort.direction === 'asc' ? comparison : -comparison;
    });

    return { ...set, values };
}

function resultSetToObjects(set) {
    if (!set) return [];
    return set.values.map(row => {
        const object = {};
        set.columns.forEach((column, index) => {
            object[column] = row[index] === undefined ? null : row[index];
        });
        return object;
    });
}

function escapeCsvCell(value) {
    const text = value === null || value === undefined ? '' : String(value);
    return /[",\r\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

function resultSetToCsv(set) {
    if (!set) return '';
    const header = set.columns.map(escapeCsvCell).join(',');
    const rows = set.values.map(row => row.map(escapeCsvCell).join(','));
    return [header, ...rows].join('\r\n');
}

function resultSetToTsv(set) {
    if (!set) return '';
    const clean = value => String(value ?? '').replace(/\t/g, ' ').replace(/\r?\n/g, ' ');
    const header = set.columns.map(clean).join('\t');
    const rows = set.values.map(row => row.map(clean).join('\t'));
    return [header, ...rows].join('\n');
}

function downloadTextFile(content, filename, mimeType) {
    const blob = new Blob([content], { type: `${mimeType};charset=utf-8` });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    link.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function resultFileTimestamp() {
    return new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
}

async function copyTextToClipboard(text) {
    if (navigator.clipboard && typeof navigator.clipboard.writeText === 'function') {
        await navigator.clipboard.writeText(text);
        return;
    }

    const textarea = document.createElement('textarea');
    textarea.value = text;
    textarea.setAttribute('readonly', '');
    textarea.style.position = 'fixed';
    textarea.style.opacity = '0';
    document.body.appendChild(textarea);
    textarea.select();
    const copied = typeof document.execCommand === 'function' ? document.execCommand('copy') : false;
    textarea.remove();
    if (!copied) throw new Error('No se pudo copiar al portapapeles');
}

function renderResultSets() {
    const output = document.getElementById('resultOutput');
    if (!output) return;

    const multiple = lastResultSets.length > 1;
    let html = '';

    lastResultSets.forEach((set, index) => {
        const sortedSet = getSortedResultSet(index) || set;
        const rowCount = sortedSet.values.length;
        const colCount = sortedSet.columns.length;
        const limit = Math.max(RESULTS_PAGE_SIZE, resultRowLimits[index] || RESULTS_PAGE_SIZE);
        const visibleRows = sortedSet.values.slice(0, limit);
        const sort = resultSortState[index];
        const duration = index === 0 ? formatDuration(lastQueryMeta.durationMs) : '';

        html += `
            <div class="result-meta">
                <span class="result-summary">
                    <i class="fas fa-list"></i>
                    ${multiple ? `Resultado ${index + 1} de ${lastResultSets.length}: ` : ''}
                    ${rowCount} ${rowCount === 1 ? 'fila' : 'filas'} | ${colCount} columnas
                    ${duration ? `<span class="result-time"><i class="fas fa-stopwatch"></i> ${escapeHtml(duration)}</span>` : ''}
                </span>
                <span class="result-actions">
                    <button type="button" class="result-action-btn" onclick="copyResultTable(${index})" title="Copiar toda la tabla">
                        <i class="fas fa-copy"></i> Copiar
                    </button>
                    <button type="button" class="result-action-btn" onclick="exportResultCSV(${index})" title="Descargar como CSV">
                        <i class="fas fa-file-csv"></i> CSV
                    </button>
                    <button type="button" class="result-action-btn" onclick="exportResultJSON(${index})" title="Descargar como JSON">
                        <i class="fas fa-file-code"></i> JSON
                    </button>
                </span>
            </div>
            <div class="result-container">
                <table>
                    <thead>
                        <tr>
                            ${sortedSet.columns.map((col, colIndex) => {
                                const ariaSort = sort && sort.column === colIndex
                                    ? (sort.direction === 'asc' ? 'ascending' : 'descending')
                                    : 'none';
                                const icon = sort && sort.column === colIndex
                                    ? (sort.direction === 'asc' ? 'fa-arrow-up-short-wide' : 'fa-arrow-down-wide-short')
                                    : 'fa-sort';
                                return `<th class="sortable-result" tabindex="0" scope="col" aria-sort="${ariaSort}"
                                    title="Ordenar por ${escapeHtml(col)}"
                                    onclick="sortResult(${index}, ${colIndex})"
                                    onkeydown="if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); sortResult(${index}, ${colIndex}); }">
                                    ${escapeHtml(col)} <i class="fas ${icon}" aria-hidden="true"></i>
                                </th>`;
                            }).join('')}
                        </tr>
                    </thead>
                    <tbody>
                        ${rowCount === 0
                            ? `<tr><td colspan="${colCount}" style="text-align:center;color:var(--text-muted);">Sin filas</td></tr>`
                            : visibleRows.map(row => `
                                <tr>
                                    ${row.map(value => {
                                        const displayValue = value !== null && value !== undefined ? String(value) : 'NULL';
                                        const truncated = displayValue.length > 50 ? displayValue.substring(0, 50) + '...' : displayValue;
                                        return `<td class="copyable-cell" title="${escapeHtml(displayValue)} (doble clic para copiar)"
                                            data-copy-value="${escapeHtml(displayValue)}">${escapeHtml(truncated)}</td>`;
                                    }).join('')}
                                </tr>
                            `).join('')}
                    </tbody>
                </table>
            </div>
        `;

        if (rowCount > limit) {
            const remaining = rowCount - limit;
            html += `
                <div class="result-more">
                    <span>Mostrando ${visibleRows.length} de ${rowCount} filas.</span>
                    <button type="button" class="result-action-btn" onclick="showMoreResults(${index})">
                        <i class="fas fa-plus"></i> Mostrar ${Math.min(RESULTS_PAGE_SIZE, remaining)} más
                    </button>
                </div>
            `;
        }
    });

    html += `
        <div class="result-scroll-hint">
            <span><i class="fas fa-arrow-left"></i><i class="fas fa-arrow-right"></i> Scroll horizontal</span>
            <span><i class="fas fa-arrow-up"></i><i class="fas fa-arrow-down"></i> Scroll vertical</span>
            <span><i class="fas fa-copy"></i> Doble clic en una celda para copiarla</span>
        </div>
    `;

    output.classList.remove('result-placeholder');
    output.innerHTML = html;
}

function displayResults(result, meta = {}) {
    const resultSets = (result || []).filter(set => set && set.columns && set.columns.length > 0);
    lastQueryMeta = {
        durationMs: Number(meta.durationMs) || 0,
        executedAt: new Date()
    };

    if (resultSets.length === 0) {
        const time = formatDuration(lastQueryMeta.durationMs);
        showMessage('success', 'Consulta ejecutada correctamente', time ? `<span class="result-time"><i class="fas fa-stopwatch"></i> ${escapeHtml(time)}</span>` : '');
        lastResultSets = [];
        return;
    }

    lastResultSets = resultSets;
    resultRowLimits = resultSets.map(() => RESULTS_PAGE_SIZE);
    resultSortState = resultSets.map(() => null);
    renderResultSets();
}

function sortResult(index, column) {
    if (!lastResultSets[index]) return;
    const current = resultSortState[index];
    resultSortState[index] = current && current.column === column
        ? { column, direction: current.direction === 'asc' ? 'desc' : 'asc' }
        : { column, direction: 'asc' };
    renderResultSets();
}

function showMoreResults(index) {
    if (!lastResultSets[index]) return;
    resultRowLimits[index] = (resultRowLimits[index] || RESULTS_PAGE_SIZE) + RESULTS_PAGE_SIZE;
    renderResultSets();
}

function exportResultCSV(index) {
    const set = getSortedResultSet(index);
    if (!set) return;
    downloadTextFile(resultSetToCsv(set), `resultado_${resultFileTimestamp()}.csv`, 'text/csv');
    showToast('success', 'Resultado exportado como CSV.');
}

function exportResultJSON(index) {
    const set = getSortedResultSet(index);
    if (!set) return;
    downloadTextFile(JSON.stringify(resultSetToObjects(set), null, 2), `resultado_${resultFileTimestamp()}.json`, 'application/json');
    showToast('success', 'Resultado exportado como JSON.');
}

async function copyResultTable(index) {
    const set = getSortedResultSet(index);
    if (!set) return;
    try {
        await copyTextToClipboard(resultSetToTsv(set));
        showToast('success', 'Resultado copiado al portapapeles.');
    } catch (error) {
        showToast('error', 'No se pudo copiar. Selecciona la tabla manualmente.');
    }
}

async function copyResultCell(value) {
    try {
        await copyTextToClipboard(value);
        showToast('success', 'Celda copiada al portapapeles.');
    } catch (error) {
        showToast('error', 'No se pudo copiar la celda.');
    }
}

// ============================================
// ASISTENTE IA: CONTEXTO Y PETICIONES
// ============================================

/** Muestra un error de consulta con acceso directo al asistente. */
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

// FORMATEO DE SQL
function formatSql(sql) {
    let text = String(sql || '').trim();
    if (!text) return '';

    // Protege literales, identificadores entre comillas y comentarios.
    const stringLiterals = [];
    const protect = match => {
        stringLiterals.push(match);
        return `\u0000STR${stringLiterals.length - 1}\u0000`;
    };
    text = text
        .replace(/\/\*[\s\S]*?\*\//g, protect)
        .replace(/--[^\n]*/g, protect)
        .replace(/'(?:''|[^'])*'/g, protect)
        .replace(/"(?:""|[^"])*"/g, protect);

    text = text.replace(/\s+/g, ' ');

    const clauses = [
        'SELECT', 'FROM', 'WHERE', 'GROUP BY', 'ORDER BY', 'HAVING', 'LIMIT', 'OFFSET',
        'LEFT JOIN', 'RIGHT JOIN', 'INNER JOIN', 'CROSS JOIN', 'JOIN',
        'UNION ALL', 'INSERT INTO', 'VALUES', 'UPDATE', 'SET', 'DELETE FROM'
    ];

    clauses.forEach(clause => {
        const words = clause.split(' ').join('\\s+');
        const pattern = new RegExp(`\\s+(${words})\\s+`, 'gi');
        text = text.replace(pattern, `\n$1 `);
    });

    // Evita que "LEFT JOIN" o "INNER JOIN" queden partidos en dos líneas.
    text = text.replace(/\b(LEFT|RIGHT|INNER|CROSS)\nJOIN\b/gi, '$1 JOIN');

    // Las condiciones ON van en una línea indentada.
    text = text.replace(/\s+(ON)\s+/gi, '\n  $1 ');

    const keywordPattern = /\b(select|from|where|group by|order by|having|limit|offset|left join|right join|inner join|cross join|join|on|union all|insert into|values|update|set|delete from|and|or|not|as|distinct|count|avg|sum|min|max|round)\b/gi;
    text = text.replace(keywordPattern, match => match.toUpperCase());
    text = text.replace(/\n{2,}/g, '\n');
    text = text.replace(/[ \t]+\n/g, '\n');
    text = text.replace(/\u0000STR(\d+)\u0000/g, (_, index) => stringLiterals[Number(index)]);

    return text.trim();
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
    if (window.location.protocol !== 'https:' && window.location.hostname !== 'localhost') return;

    window.addEventListener('load', () => {
        navigator.serviceWorker.register('./service-worker.js').catch(error => {
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
function hasUnsavedTableEditorChanges() {
    return Array.from(document.querySelectorAll('#tableEditorContent .cell-input'))
        .some(input => input.value !== (input.dataset.original ?? ''));
}

function updateTableEditorDirtyState() {
    const status = document.getElementById('tableEditorStatus');
    if (!status) return;
    const dirty = hasUnsavedTableEditorChanges();
    status.hidden = !dirty;
    status.textContent = dirty ? 'Cambios sin guardar' : '';
}

function confirmDiscardTableEditorChanges(message) {
    if (!hasUnsavedTableEditorChanges()) return true;
    return confirm(`${message}\n\nTienes cambios sin guardar. Si continúas, se perderán.`);
}

function setAnalyzeEditorControlsEnabled(enabled) {
    document.querySelectorAll('#analyzeTableEditor [data-editor-action="add"], #analyzeTableEditor [data-editor-action="save"]')
        .forEach(button => {
            button.disabled = !enabled;
        });
}

function updateAnalyzeExplorerModeUI() {
    document.querySelectorAll('[data-analyze-mode]').forEach(button => {
        const active = button.dataset.analyzeMode === analyzeExplorerMode;
        button.classList.toggle('active', active);
        button.setAttribute('aria-pressed', String(active));
    });

    const detail = document.getElementById('analyzeTableDetail');
    const editor = document.getElementById('analyzeTableEditor');
    if (detail) detail.hidden = analyzeExplorerMode === 'edit';
    if (editor) editor.hidden = analyzeExplorerMode !== 'edit';
}

function setAnalyzeExplorerMode(mode, database = db) {
    const nextMode = mode === 'edit' ? 'edit' : 'view';
    if (nextMode === analyzeExplorerMode) return;
    if (analyzeExplorerMode === 'edit' && nextMode === 'view'
        && !confirmDiscardTableEditorChanges('Vas a cerrar el modo de edición.')) {
        return;
    }

    analyzeExplorerMode = nextMode;
    updateAnalyzeExplorerModeUI();
    if (nextMode === 'edit') {
        loadTableEditor(analyzeSelectedTable, database);
    }
}

function initAnalyzeExplorerControls() {
    document.querySelectorAll('[data-analyze-mode]').forEach(button => {
        if (button.dataset.bound === 'true') return;
        button.dataset.bound = 'true';
        button.addEventListener('click', () => setAnalyzeExplorerMode(button.dataset.analyzeMode));
    });
}

function refreshAnalyzeTableEditor() {
    if (!confirmDiscardTableEditorChanges('Vas a recargar la tabla.')) return;
    loadTableEditor(analyzeSelectedTable);
}

function renderAnalyzeTableEditor(table, database = db) {
    const editor = document.getElementById('analyzeTableEditor');
    if (!editor) return;

    const tableNameEl = document.getElementById('analyzeEditorTableName');
    if (tableNameEl) tableNameEl.textContent = table ? table.name : '—';

    updateAnalyzeExplorerModeUI();

    if (!table) {
        const content = document.getElementById('tableEditorContent');
        if (content) {
            content.innerHTML = '<p class="text-muted" style="text-align:center;padding:20px;"><i class="fas fa-inbox"></i> Selecciona una tabla para editarla.</p>';
        }
        setAnalyzeEditorControlsEnabled(false);
        return;
    }

    if (analyzeExplorerMode === 'edit') {
        loadTableEditor(table.name, database);
    }
}

function loadTableEditor(tableName = analyzeSelectedTable, database = db) {
    const content = document.getElementById('tableEditorContent');
    if (!content) return;

    const tableNameEl = document.getElementById('analyzeEditorTableName');
    if (tableNameEl) tableNameEl.textContent = tableName || '—';

    if (!database) {
        content.innerHTML = '<p class="text-muted" style="text-align:center;padding:20px;"><i class="fas fa-hourglass-half"></i> La base de datos todavía no está disponible.</p>';
        setAnalyzeEditorControlsEnabled(false);
        updateTableEditorDirtyState();
        return;
    }

    if (!tableName) {
        content.innerHTML = '<p class="text-muted" style="text-align:center;padding:20px;"><i class="fas fa-inbox"></i> No hay tablas para editar.</p>';
        setAnalyzeEditorControlsEnabled(false);
        updateTableEditorDirtyState();
        return;
    }

    try {
        const columns = getTableColumns(tableName, database);
        const pkColumn = columns.find(col => col.pk > 0) || null;
        const note = document.getElementById('tableEditorNote');

        if (!pkColumn) {
            content.innerHTML = '<p class="text-muted" style="text-align:center;padding:20px;"><i class="fas fa-lock"></i> Esta tabla no tiene clave primaria. Usa el editor SQL para modificarla.</p>';
            if (note) note.textContent = 'La edición visual requiere una clave primaria.';
            setAnalyzeEditorControlsEnabled(false);
            updateTableEditorDirtyState();
            return;
        }

        const countResult = database.exec(`SELECT COUNT(*) AS total FROM ${quoteIdent(tableName)}`);
        const totalRows = countResult.length > 0 ? Number(countResult[0].values[0][0]) || 0 : 0;
        const result = database.exec(
            `SELECT * FROM ${quoteIdent(tableName)} ORDER BY ${quoteIdent(pkColumn.name)} LIMIT ${TABLE_EDITOR_ROW_LIMIT}`
        );
        const selectColumns = result.length > 0 ? result[0].columns : [];
        const rows = result.length > 0 ? result[0].values : [];
        const pkIndex = selectColumns.indexOf(pkColumn.name);

        if (selectColumns.length === 0 || pkIndex < 0) {
            content.innerHTML = '<p class="text-muted" style="text-align:center;padding:20px;"><i class="fas fa-inbox"></i> Tabla vacía.</p>';
            if (note) note.textContent = `${totalRows} fila(s) en la tabla.`;
            setAnalyzeEditorControlsEnabled(true);
            updateTableEditorDirtyState();
            return;
        }

        if (note) {
            note.textContent = totalRows > TABLE_EDITOR_ROW_LIMIT
                ? `Mostrando las primeras ${TABLE_EDITOR_ROW_LIMIT} de ${totalRows} filas. Para editar el resto, usa el editor SQL.`
                : `${totalRows} fila(s) disponibles para editar.`;
        }

        setAnalyzeEditorControlsEnabled(true);

        let html = '<table>';
        html += '<thead><tr>';
        selectColumns.forEach(col => {
            const isPk = col === pkColumn.name;
            html += `<th>${isPk ? '<i class="fas fa-key" title="Clave primaria"></i> ' : ''}${escapeHtml(col)}</th>`;
        });
        html += '<th>Acciones</th></tr></thead>';

        html += '<tbody>';
        if (rows.length === 0) {
            html += `<tr><td colspan="${selectColumns.length + 1}" style="text-align:center;color:var(--text-muted);">
                Tabla vacía. Usa "Agregar fila" para crear un registro.
            </td></tr>`;
        } else {
            rows.forEach((row, rowIndex) => {
                const pkValue = row[pkIndex];
                html += `<tr data-row="${rowIndex}" data-pk="${escapeHtml(pkValue)}">`;
                row.forEach((value, colIdx) => {
                    const displayValue = value !== null && value !== undefined ? String(value) : '';
                    const isPk = colIdx === pkIndex;
                    html += `<td><input type="text" value="${escapeHtml(displayValue)}"
                        data-row="${rowIndex}" data-col="${colIdx}"
                        data-original="${escapeHtml(displayValue)}"
                        class="cell-input${isPk ? ' pk-input' : ''}"
                        ${isPk ? 'readonly title="La clave primaria no se puede editar"' : ''} /></td>`;
                });
                html += `<td><button type="button" class="delete-btn" data-pk="${escapeHtml(pkValue)}" title="Eliminar fila" aria-label="Eliminar fila"><i class="fas fa-trash"></i></button></td>`;
                html += '</tr>';
            });
        }
        html += '</tbody></table>';

        content.innerHTML = html;

        content.querySelectorAll('.cell-input').forEach(input => {
            input.addEventListener('input', updateTableEditorDirtyState);
        });
        content.querySelectorAll('.delete-btn').forEach(button => {
            button.addEventListener('click', () => deleteRow(tableName, button.dataset.pk));
        });
        updateTableEditorDirtyState();
    } catch (e) {
        content.innerHTML = `<p style="color:#dc3545;"><i class="fas fa-circle-exclamation"></i> Error: ${escapeHtml(e.message)}</p>`;
        setAnalyzeEditorControlsEnabled(false);
        updateTableEditorDirtyState();
    }
}

function saveTableChanges(tableName = analyzeSelectedTable) {
    if (!db) {
        showToast('error', 'La base de datos no está inicializada.');
        return;
    }
    if (!tableName) {
        showToast('warning', 'No hay ninguna tabla seleccionada.');
        return;
    }

    try {
        if (!getUserTables().includes(tableName)) {
            throw new Error(`La tabla ${tableName} no existe`);
        }

        const columns = getTableColumns(tableName);
        const pkColumn = columns.find(col => col.pk > 0);
        if (!pkColumn) {
            throw new Error('La tabla no tiene clave primaria; actualízala con una consulta SQL');
        }
        const pkIndex = columns.findIndex(col => col === pkColumn);

        const rows = new Map();
        document.querySelectorAll('#tableEditorContent .cell-input').forEach(input => {
            const rowIndex = Number(input.dataset.row);
            const colIndex = Number(input.dataset.col);
            if (!rows.has(rowIndex)) {
                rows.set(rowIndex, {
                    values: {},
                    originals: {},
                    pk: input.closest('tr')?.dataset.pk ?? ''
                });
            }
            const row = rows.get(rowIndex);
            row.values[colIndex] = input.value;
            row.originals[colIndex] = input.dataset.original ?? '';
        });

        let updatedCount = 0;
        db.run('BEGIN TRANSACTION;');
        try {
            for (const row of rows.values()) {
                const setClauses = [];
                const params = [];

                columns.forEach((column, colIndex) => {
                    if (colIndex === pkIndex) return;

                    const rawValue = row.values[colIndex];
                    const originalValue = row.originals[colIndex];
                    const current = rawValue === undefined ? '' : rawValue;
                    const original = originalValue === undefined ? '' : originalValue;

                    if (current === original) return;

                    const parsed = parseColumnValue(current, column);
                    setClauses.push(`${quoteIdent(column.name)} = ?`);
                    params.push(parsed);
                });

                if (setClauses.length === 0) continue;

                const pkValue = parseColumnValue(row.pk, pkColumn);
                params.push(pkValue);
                db.run(
                    `UPDATE ${quoteIdent(tableName)} SET ${setClauses.join(', ')} WHERE ${quoteIdent(pkColumn.name)} = ?`,
                    params
                );
                updatedCount++;
            }
            db.run('COMMIT;');
        } catch (e) {
            db.run('ROLLBACK;');
            throw e;
        }

        refreshAll();
        if (updatedCount === 0) {
            showToast('info', 'No había cambios que guardar.');
        } else {
            schedulePersistDatabase();
            showToast('success', `${updatedCount} fila(s) actualizada(s) en ${tableName}.`);
        }
    } catch (e) {
        showToast('error', `Error al guardar cambios: ${e.message}`);
        console.error(e);
    }
}

function deleteRow(tableName, pkValue) {
    if (!db) return;

    try {
        const pkColumn = getPrimaryKey(tableName);
        if (!pkColumn) {
            throw new Error('La tabla no tiene clave primaria; elimina el registro con una consulta SQL');
        }

        const dirtyWarning = hasUnsavedTableEditorChanges()
            ? '\n\nTienes cambios sin guardar en otras filas; se perderán.'
            : '';
        if (!confirm(`¿Eliminar el registro con ${pkColumn.name} = ${pkValue}?${dirtyWarning}`)) return;

        const value = parseColumnValue(pkValue, pkColumn);
        db.run(`DELETE FROM ${quoteIdent(tableName)} WHERE ${quoteIdent(pkColumn.name)} = ?`, [value]);
        refreshAll();
        schedulePersistDatabase();
        showToast('success', 'Registro eliminado correctamente.');
    } catch (e) {
        showToast('error', `Error al eliminar: ${e.message}`);
    }
}

function addRow(tableName = analyzeSelectedTable) {
    if (!db) return;
    if (!tableName) {
        showToast('warning', 'No hay ninguna tabla seleccionada.');
        return;
    }
    if (!confirmDiscardTableEditorChanges('Agregar una fila recargará la tabla.')) return;

    try {
        const columns = getTableColumns(tableName);
        if (columns.length === 0) {
            throw new Error(`La tabla ${tableName} no existe`);
        }

        const primaryKeys = columns.filter(col => col.pk > 0);
        const pkColumn = primaryKeys.length === 1 ? primaryKeys[0] : null;
        const autoPk = pkColumn && /INT/i.test(pkColumn.type);
        const insertColumns = columns.filter(col => !(autoPk && col === pkColumn));

        if (insertColumns.length === 0) {
            db.run(`INSERT INTO ${quoteIdent(tableName)} DEFAULT VALUES`);
        } else {
            const values = insertColumns.map(column => {
                if (column === pkColumn) {
                    return isNumericType(column.type) ? 0 : 'nuevo';
                }
                if (column.name === 'nombre') {
                    return 'Nuevo registro';
                }
                if (column.notnull && column.dflt_value === null) {
                    return isNumericType(column.type) ? 0 : '';
                }
                return null;
            });

            const columnList = insertColumns.map(col => quoteIdent(col.name)).join(', ');
            const placeholders = insertColumns.map(() => '?').join(', ');
            db.run(`INSERT INTO ${quoteIdent(tableName)} (${columnList}) VALUES (${placeholders})`, values);
        }

        refreshAll();
        schedulePersistDatabase();
        showToast('success', `Nueva fila agregada a ${tableName}.`);
    } catch (e) {
        showToast('error', `Error al agregar fila: ${e.message}`);
    }
}

// DIAGRAMA DE RELACIONES
function generateDiagram() {
    const container = document.getElementById('diagramContainer');

    if (!db) {
        container.innerHTML = '<p style="color:#dc3545;"><i class="fas fa-circle-exclamation"></i> Base de datos no inicializada</p>';
        return;
    }

    try {
        const tables = getUserTables();
        if (tables.length === 0) {
            container.innerHTML = '<p class="text-muted" style="text-align:center;padding:20px;"><i class="fas fa-inbox"></i> No hay tablas para mostrar</p>';
            return;
        }

        const entities = tables.map(tableName => {
            let foreignKeys = [];
            try {
                const fkResult = db.exec(`PRAGMA foreign_key_list(${quoteIdent(tableName)})`);
                if (fkResult.length > 0) {
                    foreignKeys = fkResult[0].values.map(row => ({
                        table: String(row[2]),
                        from: String(row[3]),
                        to: String(row[4]),
                        onDelete: String(row[6] || 'NO ACTION')
                    }));
                }
            } catch (e) {
                console.error(`No se pudieron leer las claves foráneas de ${tableName}:`, e);
            }
            return {
                name: tableName,
                columns: getTableColumns(tableName),
                foreignKeys
            };
        });

        let html = '<div class="diagram-erd">';
        entities.forEach(entity => {
            const fkByColumn = new Map(entity.foreignKeys.map(fk => [fk.from, fk]));

            html += `<div class="entity-box">`;
            html += `<div class="entity-title"><i class="fas fa-table"></i> ${escapeHtml(entity.name)}</div>`;
            html += '<ul>';
            entity.columns.forEach(column => {
                const isPk = column.pk > 0;
                const fk = fkByColumn.get(column.name);
                const className = isPk && fk ? 'pk-fk' : isPk ? 'pk' : fk ? 'fk' : '';
                const title = fk
                    ? ` title="Referencia a ${escapeHtml(fk.table)}.${escapeHtml(fk.to)}"`
                    : ` title="${escapeHtml(column.type || 'sin tipo')}"`;
                html += `<li class="${className}"${title}>${escapeHtml(column.name)}</li>`;
            });
            html += '</ul></div>';
        });
        html += '</div>';

        const relations = entities.flatMap(entity =>
            entity.foreignKeys.map(fk => ({ source: entity.name, ...fk }))
        );

        if (relations.length === 0) {
            html += '<p class="diagram-empty-relations"><i class="fas fa-info-circle"></i> No se detectaron claves foráneas.</p>';
        } else {
            html += '<div class="diagram-relations">';
            html += '<h4><i class="fas fa-link"></i> Relaciones detectadas</h4>';
            html += '<ul>';
            relations.forEach(relation => {
                html += `<li>
                    <code>${escapeHtml(relation.source)}.${escapeHtml(relation.from)}</code>
                    <span class="relation-arrow">→</span>
                    <code>${escapeHtml(relation.table)}.${escapeHtml(relation.to)}</code>
                    <span class="relation-cardinality">N : 1</span>
                    <span class="relation-delete">ON DELETE ${escapeHtml(relation.onDelete)}</span>
                </li>`;
            });
            html += '</ul></div>';
        }

        html += `
            <div class="diagram-legend">
                <span><i class="fas fa-key" style="color:#336791;"></i> Primary Key</span>
                <span><i class="fas fa-link" style="color:#764ba2;"></i> Foreign Key</span>
                <span><i class="fas fa-key" style="color:#dc3545;"></i><i class="fas fa-link" style="color:#dc3545;"></i> Primary + Foreign Key</span>
            </div>
        `;

        container.innerHTML = html;
    } catch (e) {
        container.innerHTML = `<p style="color:#dc3545;"><i class="fas fa-circle-exclamation"></i> Error al generar diagrama: ${escapeHtml(e.message)}</p>`;
    }
}

function toggleDiagramView() {
    const container = document.getElementById('diagramContainer');
    const overlay = document.getElementById('diagramOverlay') || createOverlay();
    const closeBtn = document.getElementById('closeDiagramBtn') || createCloseButton();
    
    diagramFullView = !diagramFullView;
    
    if (diagramFullView) {
        container.classList.add('full-view');
        overlay.classList.add('active');
        closeBtn.classList.add('visible');
    } else {
        container.classList.remove('full-view');
        overlay.classList.remove('active');
        closeBtn.classList.remove('visible');
    }
}

function createOverlay() {
    const overlay = document.createElement('div');
    overlay.id = 'diagramOverlay';
    overlay.className = 'diagram-overlay';
    overlay.onclick = toggleDiagramView;
    document.body.appendChild(overlay);
    return overlay;
}

function createCloseButton() {
    const btn = document.createElement('button');
    btn.id = 'closeDiagramBtn';
    btn.className = 'close-diagram-btn';
    btn.innerHTML = '<i class="fas fa-times"></i>';
    btn.onclick = toggleDiagramView;
    document.body.appendChild(btn);
    return btn;
}

// ANALISIS DE DATOS
function getTableForeignKeys(tableName, database = db) {
    if (!database) return [];
    try {
        const result = database.exec(`PRAGMA foreign_key_list(${quoteIdent(tableName)})`);
        if (result.length === 0) return [];
        return result[0].values.map(row => ({
            table: String(row[2]),
            from: String(row[3]),
            to: row[4] === null || row[4] === undefined ? '' : String(row[4]),
            onDelete: String(row[6] || 'NO ACTION')
        }));
    } catch (e) {
        console.error(`No se pudieron leer las claves foráneas de ${tableName}:`, e);
        return [];
    }
}

function getTableRowCount(tableName, database = db) {
    if (!database) return 0;
    try {
        const result = database.exec(`SELECT COUNT(*) FROM ${quoteIdent(tableName)}`);
        return result.length > 0 ? Number(result[0].values[0][0]) || 0 : 0;
    } catch (e) {
        console.error(`No se pudo contar las filas de ${tableName}:`, e);
        return 0;
    }
}

function getTablePreview(tableName, limit = 5, database = db) {
    if (!database) return { columns: [], values: [] };
    const safeLimit = Math.max(1, Math.min(50, Number(limit) || 5));
    try {
        const result = database.exec(`SELECT * FROM ${quoteIdent(tableName)} LIMIT ${safeLimit}`);
        if (result.length === 0) return { columns: [], values: [] };
        return {
            columns: result[0].columns.map(String),
            values: result[0].values
        };
    } catch (e) {
        console.error(`No se pudo leer una vista previa de ${tableName}:`, e);
        return { columns: [], values: [] };
    }
}

function getAnalyzeSummary(database = db) {
    const emptySummary = {
        tables: [],
        tableStats: [],
        columnCount: 0,
        rowCount: 0,
        relationCount: 0,
        emptyTables: [],
        largestTable: null
    };
    if (!database) return emptySummary;

    const tables = getUserTables(database);
    const tableStats = tables.map(name => {
        const columns = getTableColumns(name, database);
        const foreignKeys = getTableForeignKeys(name, database);
        const rowCount = getTableRowCount(name, database);
        return { name, columns, foreignKeys, rowCount };
    });

    return {
        tables,
        tableStats,
        columnCount: tableStats.reduce((total, table) => total + table.columns.length, 0),
        rowCount: tableStats.reduce((total, table) => total + table.rowCount, 0),
        relationCount: tableStats.reduce((total, table) => total + table.foreignKeys.length, 0),
        emptyTables: tableStats.filter(table => table.rowCount === 0).map(table => table.name),
        largestTable: tableStats.reduce(
            (largest, table) => (!largest || table.rowCount > largest.rowCount ? table : largest),
            null
        )
    };
}

function formatAnalyzeNumber(value) {
    return Number(value || 0).toLocaleString('es-ES');
}

function formatAnalyzeCell(value) {
    if (value === null || value === undefined) {
        return '<span class="null-value">NULL</span>';
    }
    return escapeHtml(String(value));
}

function renderAnalyzeSummary(summary) {
    const container = document.getElementById('analyzeSummary');
    if (!container) return;

    if (summary.tables.length === 0) {
        container.innerHTML = `
            <div class="analyze-empty-state analyze-empty-state-wide">
                <i class="fas fa-database"></i>
                <p>No hay tablas disponibles en este dataset.</p>
            </div>
        `;
        return;
    }

    const emptyTables = summary.emptyTables.length;
    const metrics = [
        { label: 'Tablas', value: summary.tables.length, icon: 'fa-table', tone: 'tone-blue', hint: 'Tablas de usuario' },
        { label: 'Columnas', value: summary.columnCount, icon: 'fa-columns', tone: 'tone-violet', hint: 'Campos en total' },
        { label: 'Filas', value: summary.rowCount, icon: 'fa-database', tone: 'tone-green', hint: 'Registros almacenados' },
        { label: 'Relaciones', value: summary.relationCount, icon: 'fa-link', tone: 'tone-orange', hint: 'Claves foráneas' },
        {
            label: 'Tablas vacías',
            value: emptyTables,
            icon: 'fa-inbox',
            tone: emptyTables ? 'tone-amber' : 'tone-green',
            hint: emptyTables ? 'Revisar datos' : 'Todas con datos'
        }
    ];

    container.innerHTML = metrics.map(metric => `
        <div class="analyze-metric">
            <span class="analyze-metric-icon ${metric.tone}"><i class="fas ${metric.icon}"></i></span>
            <div>
                <span class="analyze-metric-value">${formatAnalyzeNumber(metric.value)}</span>
                <span class="analyze-metric-label">${metric.label}</span>
                <span class="analyze-metric-hint">${metric.hint}</span>
            </div>
        </div>
    `).join('');
}

function renderAnalyzeTableList(summary) {
    const list = document.getElementById('analyzeTableList');
    if (!list) return;

    if (summary.tableStats.length === 0) {
        list.innerHTML = '<p class="analyze-empty-state"><i class="fas fa-inbox"></i> Sin tablas</p>';
        return;
    }

    if (!summary.tableStats.some(table => table.name === analyzeSelectedTable)) {
        analyzeSelectedTable = summary.tableStats[0].name;
    }

    list.innerHTML = summary.tableStats.map(table => {
        const active = table.name === analyzeSelectedTable;
        return `
            <button type="button"
                class="analyze-table-item${active ? ' active' : ''}"
                data-table="${escapeHtml(table.name)}"
                role="option"
                aria-selected="${active}">
                <span class="analyze-table-name"><i class="fas fa-table"></i> ${escapeHtml(table.name)}</span>
                <span class="analyze-table-meta">${formatAnalyzeNumber(table.rowCount)} filas · ${formatAnalyzeNumber(table.columns.length)} col.</span>
            </button>
        `;
    }).join('');

    list.querySelectorAll('[data-table]').forEach(button => {
        button.addEventListener('click', () => selectAnalyzeTable(button.dataset.table));
    });
}

function renderAnalyzeTableDetail(table, database = db) {
    const detail = document.getElementById('analyzeTableDetail');
    if (!detail) return;

    if (!table) {
        detail.innerHTML = `
            <div class="analyze-empty-state">
                <i class="fas fa-table"></i>
                <p>Selecciona una tabla para ver su estructura.</p>
            </div>
        `;
        return;
    }

    const foreignKeyByColumn = new Map(table.foreignKeys.map(fk => [fk.from, fk]));
    const preview = getTablePreview(table.name, 5, database);

    const columnRows = table.columns.map(column => {
        const isPk = column.pk > 0;
        const foreignKey = foreignKeyByColumn.get(column.name);
        let keyBadge = '<span class="key-badge key-none">—</span>';
        if (isPk && foreignKey) keyBadge = '<span class="key-badge key-pk-fk">PK/FK</span>';
        else if (isPk) keyBadge = '<span class="key-badge key-pk">PK</span>';
        else if (foreignKey) keyBadge = '<span class="key-badge key-fk">FK</span>';

        return `
            <tr>
                <td><code>${escapeHtml(column.name)}</code></td>
                <td>${escapeHtml(column.type || 'sin tipo')}</td>
                <td>${keyBadge}</td>
                <td>${column.notnull ? 'No' : 'Sí'}</td>
            </tr>
        `;
    }).join('');

    const previewRows = preview.values.map(row => `
        <tr>${preview.columns.map((_, index) => `<td>${formatAnalyzeCell(row[index])}</td>`).join('')}</tr>
    `).join('');

    const previewHtml = preview.columns.length
        ? `
            <div class="table-detail-preview" tabindex="0" role="region" aria-label="Vista previa de la tabla">
                <table class="table-detail-table">
                    <thead>
                        <tr>${preview.columns.map(column => `<th>${escapeHtml(column)}</th>`).join('')}</tr>
                    </thead>
                    <tbody>${previewRows}</tbody>
                </table>
            </div>
        `
        : `
            <div class="analyze-empty-state">
                <i class="fas fa-inbox"></i>
                <p>Esta tabla todavía no tiene registros.</p>
            </div>
        `;

    const relationText = table.foreignKeys.length
        ? `${table.foreignKeys.length} relación(es)`
        : 'Sin relaciones';

    detail.innerHTML = `
        <div class="table-detail-head">
            <div>
                <h4><i class="fas fa-table"></i> ${escapeHtml(table.name)}</h4>
                <p class="table-detail-meta">
                    ${formatAnalyzeNumber(table.rowCount)} filas · ${formatAnalyzeNumber(table.columns.length)} columnas · ${escapeHtml(relationText)}
                </p>
            </div>
            <div class="table-detail-actions">
                <button type="button" class="btn-secondary btn-sm" data-analyze-action="copy" data-table="${escapeHtml(table.name)}">
                    <i class="fas fa-copy"></i> Copiar SELECT
                </button>
                <button type="button" class="btn-secondary btn-sm" data-analyze-action="edit" data-table="${escapeHtml(table.name)}">
                    <i class="fas fa-pen"></i> Editar datos
                </button>
                <button type="button" class="btn-primary btn-sm" data-analyze-action="practice" data-table="${escapeHtml(table.name)}">
                    <i class="fas fa-play"></i> Practicar
                </button>
            </div>
        </div>

        <p class="table-detail-subtitle">Columnas</p>
        <div class="table-detail-table-wrap" tabindex="0" role="region" aria-label="Detalle de la tabla">
            <table class="table-detail-table">
                <thead>
                    <tr>
                        <th>Columna</th>
                        <th>Tipo</th>
                        <th>Clave</th>
                        <th>¿Nulo?</th>
                    </tr>
                </thead>
                <tbody>${columnRows}</tbody>
            </table>
        </div>

        <p class="table-detail-subtitle">Vista previa · ${formatAnalyzeNumber(preview.values.length)} fila(s)</p>
        ${previewHtml}
    `;

    detail.querySelectorAll('[data-analyze-action]').forEach(button => {
        button.addEventListener('click', () => {
            if (button.dataset.analyzeAction === 'copy') {
                copyAnalyzeSelect(button.dataset.table);
            } else if (button.dataset.analyzeAction === 'edit') {
                setAnalyzeExplorerMode('edit', database);
            } else if (button.dataset.analyzeAction === 'practice') {
                practiceAnalyzeTable(button.dataset.table);
            }
        });
    });
}

function selectAnalyzeTable(tableName, database = db) {
    if (tableName === analyzeSelectedTable && analyzeExplorerMode === 'edit') return;
    if (tableName !== analyzeSelectedTable && analyzeExplorerMode === 'edit'
        && !confirmDiscardTableEditorChanges('Vas a cambiar de tabla.')) {
        return;
    }

    analyzeSelectedTable = tableName;
    const summary = getAnalyzeSummary(database);
    const selectedTable = summary.tableStats.find(table => table.name === tableName) || null;
    renderAnalyzeTableList(summary);
    renderAnalyzeTableDetail(selectedTable, database);
    renderAnalyzeTableEditor(selectedTable, database);
}

function getAnalyzeOrphanIssues(summary, database = db) {
    if (!database) return [];
    const tableNames = new Set(summary.tables);
    const issues = [];

    summary.tableStats.forEach(table => {
        table.foreignKeys.forEach(foreignKey => {
            if (!tableNames.has(foreignKey.table)) return;
            const parentTable = summary.tableStats.find(item => item.name === foreignKey.table);
            const parentColumn = foreignKey.to || parentTable?.columns.find(column => column.pk > 0)?.name;
            if (!parentColumn) return;

            try {
                const result = database.exec(`
                    SELECT COUNT(*) AS total
                    FROM ${quoteIdent(table.name)} AS child
                    LEFT JOIN ${quoteIdent(foreignKey.table)} AS parent_row
                        ON child.${quoteIdent(foreignKey.from)} = parent_row.${quoteIdent(parentColumn)}
                    WHERE child.${quoteIdent(foreignKey.from)} IS NOT NULL
                        AND parent_row.${quoteIdent(parentColumn)} IS NULL
                `);
                const count = result.length > 0 ? Number(result[0].values[0][0]) || 0 : 0;
                if (count > 0) {
                    issues.push({
                        table: table.name,
                        column: foreignKey.from,
                        parentTable: foreignKey.table,
                        parentColumn,
                        count
                    });
                }
            } catch (e) {
                console.error(`No se pudo comprobar la relación ${table.name}.${foreignKey.from}:`, e);
            }
        });
    });

    return issues;
}

function getAnalyzeNullColumns(summary, database = db) {
    if (!database) return [];
    const issues = [];

    summary.tableStats.forEach(table => {
        if (table.rowCount === 0) return;
        const nullableColumns = table.columns.filter(column => !column.notnull);
        if (nullableColumns.length === 0) return;

        try {
            const selectParts = nullableColumns.map((column, index) => (
                `SUM(CASE WHEN ${quoteIdent(column.name)} IS NULL THEN 1 ELSE 0 END) AS n${index}`
            ));
            const result = database.exec(
                `SELECT ${selectParts.join(', ')} FROM ${quoteIdent(table.name)}`
            );
            const counts = result.length > 0 ? result[0].values[0] : [];
            nullableColumns.forEach((column, index) => {
                const count = Number(counts[index]) || 0;
                if (count > 0) {
                    issues.push({ table: table.name, column: column.name, count });
                }
            });
        } catch (e) {
            console.error(`No se pudieron contar los nulos de ${table.name}:`, e);
        }
    });

    return issues;
}

function buildAnalyzeQualityChecks(summary, database = db) {
    const checks = [];
    const emptyTables = summary.emptyTables;

    checks.push({
        status: emptyTables.length ? 'warning' : 'ok',
        title: 'Tablas con datos',
        detail: emptyTables.length
            ? `${emptyTables.length} tabla(s) sin registros: ${emptyTables.join(', ')}.`
            : 'Todas las tablas contienen registros.'
    });

    const tablesWithoutPk = summary.tableStats
        .filter(table => !table.columns.some(column => column.pk > 0))
        .map(table => table.name);
    checks.push({
        status: tablesWithoutPk.length ? 'warning' : 'ok',
        title: 'Claves primarias',
        detail: tablesWithoutPk.length
            ? `Sin clave primaria: ${tablesWithoutPk.join(', ')}.`
            : 'Todas las tablas tienen clave primaria.'
    });

    const orphanIssues = getAnalyzeOrphanIssues(summary, database);
    checks.push({
        status: orphanIssues.length ? 'error' : 'ok',
        title: 'Integridad referencial',
        detail: orphanIssues.length
            ? `${orphanIssues.length} relación(es) con registros huérfanos: ${orphanIssues.slice(0, 3).map(issue => `${issue.table}.${issue.column} (${issue.count})`).join(', ')}${orphanIssues.length > 3 ? '…' : ''}.`
            : 'No se detectaron registros huérfanos en las claves foráneas.'
    });

    const nullColumns = getAnalyzeNullColumns(summary, database);
    checks.push({
        status: nullColumns.length ? 'info' : 'ok',
        title: 'Valores nulos',
        detail: nullColumns.length
            ? `${nullColumns.length} columna(s) contienen nulos: ${nullColumns.slice(0, 3).map(issue => `${issue.table}.${issue.column} (${issue.count})`).join(', ')}${nullColumns.length > 3 ? '…' : ''}.`
            : 'No se encontraron valores nulos en las columnas consultadas.'
    });

    const untypedColumns = summary.tableStats.flatMap(table => table.columns
        .filter(column => !column.type)
        .map(column => `${table.name}.${column.name}`));
    checks.push({
        status: untypedColumns.length ? 'warning' : 'ok',
        title: 'Tipos declarados',
        detail: untypedColumns.length
            ? `${untypedColumns.length} columna(s) sin tipo: ${untypedColumns.slice(0, 3).join(', ')}${untypedColumns.length > 3 ? '…' : ''}.`
            : 'Todas las columnas tienen un tipo declarado.'
    });

    return checks;
}

function renderAnalyzeQuality(summary, database = db) {
    const container = document.getElementById('analyzeQuality');
    if (!container) return;

    if (summary.tableStats.length === 0) {
        container.innerHTML = `
            <div class="analyze-empty-state">
                <i class="fas fa-shield-halved"></i>
                <p>No hay datos para analizar.</p>
            </div>
        `;
        return;
    }

    const meta = {
        ok: { icon: 'fa-circle-check', label: 'Correcto' },
        warning: { icon: 'fa-triangle-exclamation', label: 'Revisar' },
        error: { icon: 'fa-circle-exclamation', label: 'Atención' },
        info: { icon: 'fa-circle-info', label: 'Info' }
    };

    container.innerHTML = buildAnalyzeQualityChecks(summary, database).map(check => {
        const checkMeta = meta[check.status] || meta.info;
        return `
            <div class="quality-item quality-${check.status}">
                <span class="quality-icon"><i class="fas ${checkMeta.icon}"></i></span>
                <div class="quality-copy">
                    <strong>${escapeHtml(check.title)}</strong>
                    <p>${escapeHtml(check.detail)}</p>
                </div>
                <span class="quality-badge">${checkMeta.label}</span>
            </div>
        `;
    }).join('');
}

function renderAnalyzePanel(database = db) {
    initAnalyzeExplorerControls();
    updateAnalyzeExplorerModeUI();

    const summary = getAnalyzeSummary(database);
    renderAnalyzeSummary(summary);
    renderAnalyzeTableList(summary);
    const selectedTable = summary.tableStats.find(table => table.name === analyzeSelectedTable) || summary.tableStats[0] || null;
    analyzeSelectedTable = selectedTable ? selectedTable.name : null;
    renderAnalyzeTableDetail(selectedTable, database);
    renderAnalyzeTableEditor(selectedTable, database);
    renderAnalyzeQuality(summary, database);
}

async function copyAnalyzeSelect(tableName) {
    const sql = `SELECT * FROM ${quoteIdent(tableName)} LIMIT 20;`;
    try {
        await copyTextToClipboard(sql);
        showToast('success', 'Consulta copiada al portapapeles.');
    } catch (e) {
        showToast('error', 'No se pudo copiar la consulta.');
    }
}

function practiceAnalyzeTable(tableName) {
    const editor = document.getElementById('sqlEditor');
    if (!editor) return;

    const sql = `SELECT * FROM ${quoteIdent(tableName)} LIMIT 20;`;
    editor.value = sql;
    editor.selectionStart = editor.selectionEnd = sql.length;
    activateSection('practice');
    editor.focus();
    runQuery();
}

// DATASETS
async function loadDataset(name) {
    const dataset = name === 'escuela' ? null : window.SQL_ACADEMY_DATASETS?.[name];
    if (name !== 'escuela' && !dataset) {
        showToast('error', 'El dataset seleccionado no está disponible.');
        syncDatasetSelector();
        return;
    }
    if (!SQLModule) {
        showToast('warning', 'Espera a que la base de datos termine de inicializarse.');
        syncDatasetSelector();
        return;
    }

    const label = name === 'escuela' ? 'Escuela' : dataset.name;
    const confirmed = confirm(
        `¿Cambiar al dataset ${label}?\n\nSe reemplazará la base de datos actual y se borrará la copia guardada. Exporta tu base si quieres conservarla.`
    );
    if (!confirmed) {
        syncDatasetSelector();
        return;
    }

    try {
        dbInitialized = false;
        lastQueryError = null;
        aiCooldownUntil = 0;
        aiResponseCache.clear();
        if (db) {
            try { db.close(); } catch (error) { /* ignorar */ }
            db = null;
        }
        await clearSavedDatabase();

        preferences.dataset = name;
        savePreferences();
        syncDatasetSelector();
        refreshPracticeContentForDataset();

        if (name === 'escuela') {
            initDatabase({ restore: false });
            return;
        }

        const nextDb = new SQLModule.Database();
        nextDb.run('PRAGMA foreign_keys = ON;');
        nextDb.run(dataset.sql);
        db = nextDb;
        dbInitialized = true;
        refreshAll();
        schedulePersistDatabase();
        showMessage(
            'success',
            `Dataset ${escapeHtml(dataset.name)} cargado`,
            `${escapeHtml(dataset.description)} Los ejemplos y retos se adaptan a este dataset.`
        );
        showToast('success', `Dataset ${dataset.name} listo.`);
    } catch (error) {
        console.error('No se pudo cargar el dataset:', error);
        preferences.dataset = 'escuela';
        savePreferences();
        syncDatasetSelector();
        refreshPracticeContentForDataset();
        showMessage('error', 'No se pudo cargar el dataset', `<code>${escapeHtml(error.message)}</code>`);
        showToast('error', 'Se restauró el dataset Escuela.');
        initDatabase({ restore: false });
    }
}

// REINICIAR BASE DE DATOS
async function resetDatabase(skipConfirm = false) {
    if (!skipConfirm && !confirm('¿Seguro que quieres reiniciar la base de datos a su estado original? Se borrará la copia guardada en este navegador.')) return;

    dbInitialized = false;
    lastQueryError = null;
    aiCooldownUntil = 0;
    preferences.dataset = 'escuela';
    savePreferences();
    syncDatasetSelector();
    refreshPracticeContentForDataset();
    showMessage('warning', 'Reiniciando base de datos...');
    await clearSavedDatabase();
    initDatabase({ restore: false });
}

async function restoreAnalyzeDatasetData() {
    const datasetName = preferences.dataset;
    const dataset = datasetName === 'escuela' ? null : window.SQL_ACADEMY_DATASETS?.[datasetName];
    const label = datasetName === 'escuela' ? 'Escuela' : dataset?.name || datasetName;

    if (datasetName !== 'escuela' && !dataset) {
        showToast('error', 'El dataset activo no está disponible.');
        return;
    }
    if (!SQLModule) {
        showToast('warning', 'Espera a que la base de datos termine de inicializarse.');
        return;
    }
    if (!confirm(`¿Restaurar los datos originales de ${label}? Se perderán los cambios guardados en este navegador.`)) return;

    if (datasetName === 'escuela') {
        await resetDatabase(true);
        showToast('info', 'Restaurando los datos originales de Escuela.');
        return;
    }

    try {
        const nextDb = new SQLModule.Database();
        nextDb.run('PRAGMA foreign_keys = ON;');
        nextDb.run(dataset.sql);

        if (db) {
            try { db.close(); } catch (error) { /* ignorar */ }
        }
        db = nextDb;
        dbInitialized = true;
        lastQueryError = null;
        aiCooldownUntil = 0;
        aiResponseCache.clear();

        await clearSavedDatabase();
        refreshAll();
        schedulePersistDatabase();
        showToast('success', `Datos originales de ${dataset.name} restaurados.`);
    } catch (error) {
        console.error('No se pudieron restaurar los datos del dataset:', error);
        showToast('error', `No se pudieron restaurar los datos: ${error.message}`);
    }
}

// EJEMPLOS POR CATEGORIAS
function getEscuelaExamplesByCategory() {
    return {
        'basicos': {
            titulo: 'Consultas Basicas',
            ejemplos: [
                { titulo: 'Todos los estudiantes', sql: 'SELECT * FROM estudiantes;' },
                { titulo: 'Todos los cursos', sql: 'SELECT * FROM cursos;' },
                { titulo: 'Todas las inscripciones', sql: 'SELECT * FROM inscripciones;' },
                { titulo: 'Nombres y carreras', sql: 'SELECT nombre, carrera FROM estudiantes;' },
                { titulo: 'Top 5 estudiantes', sql: 'SELECT * FROM estudiantes LIMIT 5;' }
            ]
        },
        'filtros': {
            titulo: 'Filtros (WHERE)',
            ejemplos: [
                { titulo: 'Estudiantes de Ingenieria', sql: "SELECT * FROM estudiantes WHERE carrera = 'Ingenieria';" },
                { titulo: 'Estudiantes mayores de 21', sql: 'SELECT * FROM estudiantes WHERE edad > 21;' },
                { titulo: 'Estudiantes con promedio >= 16', sql: 'SELECT * FROM estudiantes WHERE promedio >= 16.0;' },
                { titulo: 'Estudiantes de Lima', sql: "SELECT * FROM estudiantes WHERE ciudad = 'Lima';" },
                { titulo: 'Ingenieria y edad >= 20', sql: "SELECT * FROM estudiantes WHERE carrera = 'Ingenieria' AND edad >= 20;" },
                { titulo: 'Medicina o Derecho', sql: "SELECT * FROM estudiantes WHERE carrera = 'Medicina' OR carrera = 'Derecho';" },
                { titulo: 'NO son de Ingenieria', sql: "SELECT * FROM estudiantes WHERE carrera != 'Ingenieria';" }
            ]
        },
        'orden': {
            titulo: 'Ordenamiento (ORDER BY)',
            ejemplos: [
                { titulo: 'Mejores promedios (mayor a menor)', sql: 'SELECT * FROM estudiantes ORDER BY promedio DESC;' },
                { titulo: 'Peores promedios (menor a mayor)', sql: 'SELECT * FROM estudiantes ORDER BY promedio ASC;' },
                { titulo: 'Por edad (jovenes a mayores)', sql: 'SELECT * FROM estudiantes ORDER BY edad;' },
                { titulo: 'Alfabeticamente por nombre', sql: 'SELECT * FROM estudiantes ORDER BY nombre ASC;' },
                { titulo: 'Por carrera y luego por promedio', sql: 'SELECT * FROM estudiantes ORDER BY carrera, promedio DESC;' }
            ]
        },
        'agregacion': {
            titulo: 'Agregaciones (AVG, COUNT, MAX, MIN, SUM)',
            ejemplos: [
                { titulo: 'Contar todos los estudiantes', sql: 'SELECT COUNT(*) as total FROM estudiantes;' },
                { titulo: 'Promedio de edad', sql: 'SELECT AVG(edad) as edad_promedio FROM estudiantes;' },
                { titulo: 'Promedio general de calificaciones', sql: 'SELECT AVG(promedio) as promedio_general FROM estudiantes;' },
                { titulo: 'Edad maxima', sql: 'SELECT MAX(edad) as edad_maxima FROM estudiantes;' },
                { titulo: 'Edad minima', sql: 'SELECT MIN(edad) as edad_minima FROM estudiantes;' },
                { titulo: 'Suma de creditos', sql: 'SELECT SUM(creditos) as total_creditos FROM cursos;' }
            ]
        },
        'groupby': {
            titulo: 'Agrupaciones (GROUP BY)',
            ejemplos: [
                { titulo: 'Estudiantes por carrera', sql: 'SELECT carrera, COUNT(*) as cantidad FROM estudiantes GROUP BY carrera;' },
                { titulo: 'Promedio de edad por carrera', sql: 'SELECT carrera, AVG(edad) as edad_promedio FROM estudiantes GROUP BY carrera;' },
                { titulo: 'Promedio de calificaciones por carrera', sql: 'SELECT carrera, ROUND(AVG(promedio), 2) as promedio FROM estudiantes GROUP BY carrera;' },
                { titulo: 'Estudiantes por ciudad', sql: 'SELECT ciudad, COUNT(*) as cantidad FROM estudiantes GROUP BY ciudad;' },
                { titulo: 'Cursos por profesor', sql: 'SELECT profesor, COUNT(*) as cantidad FROM cursos GROUP BY profesor;' }
            ]
        },
        'having': {
            titulo: 'Filtros de Agrupacion (HAVING)',
            ejemplos: [
                { titulo: 'Carreras con mas de 3 estudiantes', sql: 'SELECT carrera, COUNT(*) as cantidad FROM estudiantes GROUP BY carrera HAVING COUNT(*) > 3;' },
                { titulo: 'Carreras con promedio > 16', sql: 'SELECT carrera, ROUND(AVG(promedio), 2) as promedio FROM estudiantes GROUP BY carrera HAVING AVG(promedio) > 16.0;' }
            ]
        },
        'join': {
            titulo: 'JOIN (Relaciones entre tablas)',
            ejemplos: [
                { titulo: 'Estudiantes con sus cursos', sql: 'SELECT e.nombre, c.nombre as curso FROM estudiantes e JOIN inscripciones i ON e.id = i.estudiante_id JOIN cursos c ON i.curso_id = c.id LIMIT 10;' },
                { titulo: 'Ingenieria con sus cursos', sql: "SELECT e.nombre, c.nombre as curso FROM estudiantes e JOIN inscripciones i ON e.id = i.estudiante_id JOIN cursos c ON i.curso_id = c.id WHERE e.carrera = 'Ingenieria' LIMIT 10;" },
                { titulo: 'Cursos con cantidad de inscritos', sql: 'SELECT c.nombre, COUNT(i.estudiante_id) as inscritos FROM cursos c LEFT JOIN inscripciones i ON c.id = i.curso_id GROUP BY c.nombre ORDER BY inscritos DESC;' },
                { titulo: 'Profesores con total de estudiantes', sql: 'SELECT c.profesor, COUNT(i.estudiante_id) as total FROM cursos c LEFT JOIN inscripciones i ON c.id = i.curso_id GROUP BY c.profesor ORDER BY total DESC;' },
                { titulo: 'Estudiantes, curso y profesor', sql: 'SELECT e.nombre as estudiante, c.nombre as curso, c.profesor FROM estudiantes e JOIN inscripciones i ON e.id = i.estudiante_id JOIN cursos c ON i.curso_id = c.id ORDER BY e.nombre LIMIT 10;' }
            ]
        },
        'subconsultas': {
            titulo: 'Subconsultas',
            ejemplos: [
                { titulo: 'Promedio mayor al general', sql: 'SELECT * FROM estudiantes WHERE promedio > (SELECT AVG(promedio) FROM estudiantes);' },
                { titulo: 'Mas jovenes que el promedio', sql: 'SELECT * FROM estudiantes WHERE edad < (SELECT AVG(edad) FROM estudiantes);' },
                { titulo: 'Cursos con mas creditos que el promedio', sql: 'SELECT * FROM cursos WHERE creditos > (SELECT AVG(creditos) FROM cursos);' },
                { titulo: 'Estudiantes con la edad maxima', sql: 'SELECT * FROM estudiantes WHERE edad = (SELECT MAX(edad) FROM estudiantes);' },
                { titulo: 'Estudiantes con el mejor promedio', sql: 'SELECT * FROM estudiantes WHERE promedio = (SELECT MAX(promedio) FROM estudiantes);' }
            ]
        },
        'operadores': {
            titulo: 'Operadores Especiales',
            ejemplos: [
                { titulo: 'IN: Ingenieria o Medicina', sql: "SELECT * FROM estudiantes WHERE carrera IN ('Ingenieria', 'Medicina');" },
                { titulo: 'NOT IN: No son de Derecho o Arquitectura', sql: "SELECT * FROM estudiantes WHERE carrera NOT IN ('Derecho', 'Arquitectura');" },
                { titulo: 'BETWEEN: Edad entre 20 y 22', sql: 'SELECT * FROM estudiantes WHERE edad BETWEEN 20 AND 22;' },
                { titulo: 'BETWEEN: Promedio entre 14 y 18', sql: 'SELECT * FROM estudiantes WHERE promedio BETWEEN 14.0 AND 18.0;' },
                { titulo: 'LIKE: Nombres que empiezan con "A"', sql: "SELECT * FROM estudiantes WHERE nombre LIKE 'A%';" },
                { titulo: 'LIKE: Nombres que contienen "a"', sql: "SELECT * FROM estudiantes WHERE nombre LIKE '%a%';" },
                { titulo: 'DISTINCT: Carreras unicas', sql: 'SELECT DISTINCT carrera FROM estudiantes;' }
            ]
        },
        'avanzado': {
            titulo: 'Consultas Avanzadas',
            ejemplos: [
                { titulo: 'Top 3 carreras con mejor promedio', sql: 'SELECT carrera, ROUND(AVG(promedio), 2) as promedio FROM estudiantes GROUP BY carrera ORDER BY promedio DESC LIMIT 3;' },
                { titulo: 'Estudiantes que cursan mas de 2 materias', sql: 'SELECT e.nombre, COUNT(i.curso_id) as cursos FROM estudiantes e JOIN inscripciones i ON e.id = i.estudiante_id GROUP BY e.nombre HAVING COUNT(i.curso_id) > 2;' },
                { titulo: 'Promedio de creditos por carrera', sql: 'SELECT e.carrera, ROUND(AVG(c.creditos), 2) as promedio_creditos FROM estudiantes e JOIN inscripciones i ON e.id = i.estudiante_id JOIN cursos c ON i.curso_id = c.id GROUP BY e.carrera;' },
                { titulo: 'Profesores con mas de 3 estudiantes', sql: 'SELECT c.profesor, COUNT(i.estudiante_id) as total FROM cursos c JOIN inscripciones i ON c.id = i.curso_id GROUP BY c.profesor HAVING COUNT(i.estudiante_id) >= 3;' },
                { titulo: 'Estudiantes sin cursos', sql: 'SELECT e.nombre FROM estudiantes e LEFT JOIN inscripciones i ON e.id = i.estudiante_id WHERE i.estudiante_id IS NULL;' }
            ]
        },
        'modificacion': {
            titulo: 'Modificacion (INSERT, UPDATE, DELETE)',
            ejemplos: [
                { titulo: 'INSERT: Agregar estudiante', sql: "INSERT INTO estudiantes (id, nombre, edad, carrera, promedio, ciudad, fecha_ingreso) VALUES (26, 'Nuevo Estudiante', 20, 'Ingenieria', 14.0, 'Lima', '2024-06-01');" },
                { titulo: 'INSERT: Agregar curso', sql: "INSERT INTO cursos (id, nombre, creditos, profesor, departamento, semestre) VALUES (16, 'Inteligencia Artificial', 5, 'Dr. Perez', 'Ingenieria', 4);" },
                { titulo: 'UPDATE: Actualizar promedio', sql: "UPDATE estudiantes SET promedio = 18.5 WHERE nombre = 'Ana Garcia';" },
                { titulo: 'UPDATE: Cambiar carrera', sql: "UPDATE estudiantes SET carrera = 'Ingenieria de Software' WHERE id = 4;" },
                { titulo: 'UPDATE: Incrementar edad', sql: 'UPDATE estudiantes SET edad = edad + 1;' },
                { titulo: 'DELETE: Eliminar estudiante', sql: 'DELETE FROM estudiantes WHERE id = 26;' }
            ]
        }
    };
}

const SQL_ADDITIONAL_EXAMPLE_CATALOGS = {
    tienda: {
        basicos: {
            titulo: 'Consultas Basicas',
            ejemplos: [
                { titulo: 'Todos los clientes', sql: 'SELECT * FROM clientes;' },
                { titulo: 'Todos los productos', sql: 'SELECT * FROM productos;' },
                { titulo: 'Todos los pedidos', sql: 'SELECT * FROM pedidos;' },
                { titulo: 'Nombres y ciudades', sql: 'SELECT nombre, ciudad FROM clientes;' }
            ]
        },
        filtros: {
            titulo: 'Filtros (WHERE)',
            ejemplos: [
                { titulo: 'Productos con stock bajo', sql: 'SELECT nombre, categoria, precio, stock FROM productos WHERE stock <= 10;' },
                { titulo: 'Clientes de Lima', sql: "SELECT nombre, ciudad FROM clientes WHERE ciudad = 'Lima';" },
                { titulo: 'Pedidos pagados', sql: "SELECT * FROM pedidos WHERE estado = 'pagado';" },
                { titulo: 'Lineas con cantidad mayor a 1', sql: 'SELECT pedido_id, producto_id, cantidad FROM detalle_pedidos WHERE cantidad > 1;' }
            ]
        },
        orden: {
            titulo: 'Ordenamiento (ORDER BY)',
            ejemplos: [
                { titulo: 'Productos por precio', sql: 'SELECT nombre, precio FROM productos ORDER BY precio DESC;' },
                { titulo: 'Productos por stock', sql: 'SELECT nombre, stock FROM productos ORDER BY stock ASC, nombre ASC;' },
                { titulo: 'Clientes por ciudad', sql: 'SELECT nombre, ciudad FROM clientes ORDER BY ciudad ASC, nombre ASC;' },
                { titulo: 'Pedidos recientes', sql: 'SELECT id, fecha, estado FROM pedidos ORDER BY fecha DESC;' }
            ]
        },
        agregacion: {
            titulo: 'Agregaciones (AVG, COUNT, MAX, MIN, SUM)',
            ejemplos: [
                { titulo: 'Contar clientes', sql: 'SELECT COUNT(*) AS total FROM clientes;' },
                { titulo: 'Precio promedio', sql: 'SELECT ROUND(AVG(precio), 2) AS precio_promedio FROM productos;' },
                { titulo: 'Stock total', sql: 'SELECT SUM(stock) AS stock_total FROM productos;' },
                { titulo: 'Precio maximo y minimo', sql: 'SELECT MAX(precio) AS maximo, MIN(precio) AS minimo FROM productos;' }
            ]
        },
        groupby: {
            titulo: 'Agrupaciones (GROUP BY)',
            ejemplos: [
                { titulo: 'Productos por categoria', sql: 'SELECT categoria, COUNT(*) AS productos FROM productos GROUP BY categoria ORDER BY productos DESC, categoria ASC;' },
                { titulo: 'Pedidos por estado', sql: 'SELECT estado, COUNT(*) AS pedidos FROM pedidos GROUP BY estado ORDER BY pedidos DESC, estado ASC;' },
                { titulo: 'Stock por categoria', sql: 'SELECT categoria, SUM(stock) AS stock_total FROM productos GROUP BY categoria ORDER BY stock_total DESC, categoria ASC;' },
                { titulo: 'Precio promedio por categoria', sql: 'SELECT categoria, ROUND(AVG(precio), 2) AS precio_promedio FROM productos GROUP BY categoria ORDER BY categoria ASC;' }
            ]
        },
        having: {
            titulo: 'Filtros de Agrupacion (HAVING)',
            ejemplos: [
                { titulo: 'Categorias con mas de un producto', sql: 'SELECT categoria, COUNT(*) AS productos FROM productos GROUP BY categoria HAVING COUNT(*) > 1 ORDER BY productos DESC, categoria ASC;' },
                { titulo: 'Clientes con mas de un pedido', sql: 'SELECT cliente_id, COUNT(*) AS pedidos FROM pedidos GROUP BY cliente_id HAVING COUNT(*) > 1 ORDER BY pedidos DESC, cliente_id ASC;' }
            ]
        },
        join: {
            titulo: 'JOIN (Relaciones entre tablas)',
            ejemplos: [
                { titulo: 'Pedidos con cliente', sql: 'SELECT p.id AS pedido, c.nombre AS cliente, p.fecha, p.estado FROM pedidos p JOIN clientes c ON c.id = p.cliente_id ORDER BY p.id ASC;' },
                { titulo: 'Detalle con producto', sql: 'SELECT d.pedido_id, pr.nombre AS producto, d.cantidad, d.precio_unitario FROM detalle_pedidos d JOIN productos pr ON pr.id = d.producto_id ORDER BY d.pedido_id ASC, pr.nombre ASC;' },
                { titulo: 'Total por pedido', sql: 'SELECT p.id AS pedido, SUM(d.cantidad * d.precio_unitario) AS total FROM pedidos p JOIN detalle_pedidos d ON d.pedido_id = p.id GROUP BY p.id ORDER BY p.id ASC;' },
                { titulo: 'Ventas por categoria', sql: 'SELECT pr.categoria, SUM(d.cantidad * d.precio_unitario) AS total FROM detalle_pedidos d JOIN productos pr ON pr.id = d.producto_id GROUP BY pr.categoria ORDER BY total DESC, pr.categoria ASC;' }
            ]
        },
        subconsultas: {
            titulo: 'Subconsultas',
            ejemplos: [
                { titulo: 'Productos sobre el precio promedio', sql: 'SELECT nombre, precio FROM productos WHERE precio > (SELECT AVG(precio) FROM productos) ORDER BY precio DESC;' },
                { titulo: 'Clientes con pedidos', sql: 'SELECT nombre FROM clientes WHERE id IN (SELECT cliente_id FROM pedidos) ORDER BY nombre ASC;' },
                { titulo: 'Pedido con mayor total', sql: 'SELECT pedido_id, SUM(cantidad * precio_unitario) AS total FROM detalle_pedidos GROUP BY pedido_id ORDER BY total DESC LIMIT 1;' }
            ]
        },
        operadores: {
            titulo: 'Operadores Especiales',
            ejemplos: [
                { titulo: 'IN: Lima o Arequipa', sql: "SELECT nombre, ciudad FROM clientes WHERE ciudad IN ('Lima', 'Arequipa') ORDER BY nombre ASC;" },
                { titulo: 'NOT IN: Sin perifericos ni audio', sql: "SELECT nombre, categoria FROM productos WHERE categoria NOT IN ('Perifericos', 'Audio') ORDER BY nombre ASC;" },
                { titulo: 'BETWEEN: Precio entre 40 y 100', sql: 'SELECT nombre, precio FROM productos WHERE precio BETWEEN 40 AND 100 ORDER BY precio ASC;' },
                { titulo: 'LIKE: Nombres que empiezan con A', sql: "SELECT nombre FROM clientes WHERE nombre LIKE 'A%';" },
                { titulo: 'DISTINCT: Categorias unicas', sql: 'SELECT DISTINCT categoria FROM productos ORDER BY categoria ASC;' }
            ]
        },
        avanzado: {
            titulo: 'Consultas Avanzadas',
            ejemplos: [
                { titulo: 'Top 3 productos por unidades', sql: 'SELECT pr.nombre, SUM(d.cantidad) AS unidades FROM detalle_pedidos d JOIN productos pr ON pr.id = d.producto_id GROUP BY pr.id, pr.nombre ORDER BY unidades DESC, pr.nombre ASC LIMIT 3;' },
                { titulo: 'Top 3 clientes por total gastado', sql: 'SELECT c.nombre, SUM(d.cantidad * d.precio_unitario) AS total FROM clientes c JOIN pedidos p ON p.cliente_id = c.id JOIN detalle_pedidos d ON d.pedido_id = p.id GROUP BY c.id, c.nombre ORDER BY total DESC, c.nombre ASC LIMIT 3;' },
                { titulo: 'Pedidos sobre el total promedio', sql: 'SELECT p.id AS pedido, SUM(d.cantidad * d.precio_unitario) AS total FROM pedidos p JOIN detalle_pedidos d ON d.pedido_id = p.id GROUP BY p.id HAVING SUM(d.cantidad * d.precio_unitario) > (SELECT AVG(total) FROM (SELECT SUM(cantidad * precio_unitario) AS total FROM detalle_pedidos GROUP BY pedido_id)) ORDER BY total DESC;' }
            ]
        },
        modificacion: {
            titulo: 'Modificacion (INSERT, UPDATE, DELETE)',
            ejemplos: [
                { titulo: 'INSERT: Agregar cliente', sql: "INSERT INTO clientes (id, nombre, ciudad, email) VALUES (7, 'Gabriela Nunez', 'Lima', 'gabriela@example.com');" },
                { titulo: 'INSERT: Agregar producto', sql: "INSERT INTO productos (id, nombre, categoria, precio, stock) VALUES (9, 'Tablet 10 pulgadas', 'Computadoras', 320.00, 8);" },
                { titulo: 'UPDATE: Incrementar stock', sql: 'UPDATE productos SET stock = stock + 5 WHERE id = 8;' },
                { titulo: 'DELETE: Eliminar producto', sql: 'DELETE FROM productos WHERE id = 9;' }
            ]
        }
    },
    biblioteca: {
        basicos: {
            titulo: 'Consultas Basicas',
            ejemplos: [
                { titulo: 'Todos los autores', sql: 'SELECT * FROM autores;' },
                { titulo: 'Todos los libros', sql: 'SELECT * FROM libros;' },
                { titulo: 'Todos los socios', sql: 'SELECT * FROM socios;' },
                { titulo: 'Todos los prestamos', sql: 'SELECT * FROM prestamos;' }
            ]
        },
        filtros: {
            titulo: 'Filtros (WHERE)',
            ejemplos: [
                { titulo: 'Libros disponibles', sql: 'SELECT titulo, genero, disponible FROM libros WHERE disponible = 1;' },
                { titulo: 'Libros de Novela', sql: "SELECT titulo, genero FROM libros WHERE genero = 'Novela';" },
                { titulo: 'Autores de Colombia', sql: "SELECT nombre, pais FROM autores WHERE pais = 'Colombia';" },
                { titulo: 'Prestamos sin devolver', sql: 'SELECT * FROM prestamos WHERE fecha_devolucion IS NULL;' }
            ]
        },
        orden: {
            titulo: 'Ordenamiento (ORDER BY)',
            ejemplos: [
                { titulo: 'Libros por anio', sql: 'SELECT titulo, anio FROM libros ORDER BY anio DESC, titulo ASC;' },
                { titulo: 'Libros por titulo', sql: 'SELECT titulo FROM libros ORDER BY titulo ASC;' },
                { titulo: 'Socios por fecha de alta', sql: 'SELECT nombre, fecha_alta FROM socios ORDER BY fecha_alta DESC;' },
                { titulo: 'Prestamos recientes', sql: 'SELECT id, fecha_prestamo FROM prestamos ORDER BY fecha_prestamo DESC;' }
            ]
        },
        agregacion: {
            titulo: 'Agregaciones (AVG, COUNT, MAX, MIN, SUM)',
            ejemplos: [
                { titulo: 'Contar libros', sql: 'SELECT COUNT(*) AS total FROM libros;' },
                { titulo: 'Anio promedio', sql: 'SELECT ROUND(AVG(anio), 0) AS anio_promedio FROM libros;' },
                { titulo: 'Libros disponibles', sql: 'SELECT COUNT(*) AS disponibles FROM libros WHERE disponible = 1;' },
                { titulo: 'Anio maximo y minimo', sql: 'SELECT MAX(anio) AS maximo, MIN(anio) AS minimo FROM libros;' }
            ]
        },
        groupby: {
            titulo: 'Agrupaciones (GROUP BY)',
            ejemplos: [
                { titulo: 'Libros por genero', sql: 'SELECT genero, COUNT(*) AS libros FROM libros GROUP BY genero ORDER BY libros DESC, genero ASC;' },
                { titulo: 'Autores por pais', sql: 'SELECT pais, COUNT(*) AS autores FROM autores GROUP BY pais ORDER BY autores DESC, pais ASC;' },
                { titulo: 'Prestamos por socio', sql: 'SELECT socio_id, COUNT(*) AS prestamos FROM prestamos GROUP BY socio_id ORDER BY prestamos DESC, socio_id ASC;' },
                { titulo: 'Libros por autor', sql: 'SELECT autor_id, COUNT(*) AS libros FROM libros GROUP BY autor_id ORDER BY libros DESC, autor_id ASC;' }
            ]
        },
        having: {
            titulo: 'Filtros de Agrupacion (HAVING)',
            ejemplos: [
                { titulo: 'Generos con mas de dos libros', sql: 'SELECT genero, COUNT(*) AS libros FROM libros GROUP BY genero HAVING COUNT(*) > 2 ORDER BY libros DESC, genero ASC;' },
                { titulo: 'Socios con mas de un prestamo', sql: 'SELECT socio_id, COUNT(*) AS prestamos FROM prestamos GROUP BY socio_id HAVING COUNT(*) > 1 ORDER BY prestamos DESC, socio_id ASC;' }
            ]
        },
        join: {
            titulo: 'JOIN (Relaciones entre tablas)',
            ejemplos: [
                { titulo: 'Libros con autor', sql: 'SELECT l.titulo, a.nombre AS autor FROM libros l JOIN autores a ON a.id = l.autor_id ORDER BY l.titulo ASC;' },
                { titulo: 'Prestamos con libro y socio', sql: 'SELECT p.id, l.titulo, s.nombre AS socio, p.fecha_prestamo, p.fecha_devolucion FROM prestamos p JOIN libros l ON l.id = p.libro_id JOIN socios s ON s.id = p.socio_id ORDER BY p.id ASC;' },
                { titulo: 'Libros por autor', sql: 'SELECT a.nombre, COUNT(l.id) AS libros FROM autores a LEFT JOIN libros l ON l.autor_id = a.id GROUP BY a.id, a.nombre ORDER BY libros DESC, a.nombre ASC;' },
                { titulo: 'Prestamos por socio', sql: 'SELECT s.nombre, COUNT(p.id) AS prestamos FROM socios s LEFT JOIN prestamos p ON p.socio_id = s.id GROUP BY s.id, s.nombre ORDER BY prestamos DESC, s.nombre ASC;' }
            ]
        },
        subconsultas: {
            titulo: 'Subconsultas',
            ejemplos: [
                { titulo: 'Libros anteriores al promedio', sql: 'SELECT titulo, anio FROM libros WHERE anio < (SELECT AVG(anio) FROM libros) ORDER BY anio ASC;' },
                { titulo: 'Libros del autor con mas libros', sql: 'SELECT titulo FROM libros WHERE autor_id = (SELECT autor_id FROM libros GROUP BY autor_id ORDER BY COUNT(*) DESC, autor_id ASC LIMIT 1) ORDER BY titulo ASC;' },
                { titulo: 'Socio con mas prestamos', sql: 'SELECT socio_id, COUNT(*) AS prestamos FROM prestamos GROUP BY socio_id ORDER BY prestamos DESC, socio_id ASC LIMIT 1;' }
            ]
        },
        operadores: {
            titulo: 'Operadores Especiales',
            ejemplos: [
                { titulo: 'IN: Colombia o Argentina', sql: "SELECT nombre, pais FROM autores WHERE pais IN ('Colombia', 'Argentina') ORDER BY nombre ASC;" },
                { titulo: 'NOT IN: Libros que no son Novela', sql: "SELECT titulo, genero FROM libros WHERE genero NOT IN ('Novela') ORDER BY titulo ASC;" },
                { titulo: 'BETWEEN: Libros entre 1940 y 1970', sql: 'SELECT titulo, anio FROM libros WHERE anio BETWEEN 1940 AND 1970 ORDER BY anio ASC;' },
                { titulo: 'LIKE: Titulos que contienen la', sql: "SELECT titulo FROM libros WHERE titulo LIKE '%la%' ORDER BY titulo ASC;" },
                { titulo: 'DISTINCT: Generos unicos', sql: 'SELECT DISTINCT genero FROM libros ORDER BY genero ASC;' }
            ]
        },
        avanzado: {
            titulo: 'Consultas Avanzadas',
            ejemplos: [
                { titulo: 'Top 3 autores por libros', sql: 'SELECT a.nombre, COUNT(l.id) AS libros FROM autores a LEFT JOIN libros l ON l.autor_id = a.id GROUP BY a.id, a.nombre ORDER BY libros DESC, a.nombre ASC LIMIT 3;' },
                { titulo: 'Socios con prestamos activos', sql: 'SELECT s.nombre, COUNT(p.id) AS activos FROM socios s JOIN prestamos p ON p.socio_id = s.id WHERE p.fecha_devolucion IS NULL GROUP BY s.id, s.nombre ORDER BY activos DESC, s.nombre ASC;' },
                { titulo: 'Autores con libros disponibles', sql: 'SELECT a.nombre, COUNT(l.id) AS disponibles FROM autores a JOIN libros l ON l.autor_id = a.id WHERE l.disponible = 1 GROUP BY a.id, a.nombre ORDER BY disponibles DESC, a.nombre ASC;' }
            ]
        },
        modificacion: {
            titulo: 'Modificacion (INSERT, UPDATE, DELETE)',
            ejemplos: [
                { titulo: 'INSERT: Agregar autor', sql: "INSERT INTO autores (id, nombre, pais) VALUES (5, 'Julio Cortazar', 'Argentina');" },
                { titulo: 'INSERT: Agregar libro', sql: "INSERT INTO libros (id, titulo, autor_id, anio, genero, disponible) VALUES (9, 'La fiesta del chivo', 4, 2000, 'Novela', 1);" },
                { titulo: 'UPDATE: Marcar libro no disponible', sql: 'UPDATE libros SET disponible = 0 WHERE id = 1;' },
                { titulo: 'DELETE: Eliminar libro', sql: 'DELETE FROM libros WHERE id = 9;' }
            ]
        }
    }
};

function getExamplesByCategory(datasetName = preferences.dataset) {
    if (datasetName === 'escuela') return getEscuelaExamplesByCategory();
    return SQL_ADDITIONAL_EXAMPLE_CATALOGS[datasetName] || getEscuelaExamplesByCategory();
}

function renderCategorySelector() {
    const selector = document.getElementById('categorySelector');
    if (!selector) return;

    const previous = selector.value;
    const categories = getVisibleExampleCategories();
    const keys = Object.keys(categories);
    const showLevels = getEffectiveSkillLevel('sql') === 'all';
    const options = keys.map(key => {
        const levelLabel = showLevels
            ? `[${getSkillLevelInfo(getExampleCategoryLevel(key)).label}] `
            : '';
        return `<option value="${escapeHtml(key)}">${levelLabel}${escapeHtml(categories[key].titulo)}</option>`;
    });
    options.push('<option value="aleatorio">Aleatorio</option>');
    selector.innerHTML = options.join('');

    if (keys.includes(previous)) {
        selector.value = previous;
    } else {
        selector.value = keys[0] || 'aleatorio';
    }
}

// CARGAR EJEMPLO POR CATEGORIA
let lastSqlExample = null;

function showExampleByCategory() {
    const selector = document.getElementById('categorySelector');
    if (!selector) {
        console.error('No se encontro el selector de categorias');
        return;
    }

    const category = selector.value;
    const categories = getVisibleExampleCategories();
    const keys = Object.keys(categories);
    if (!keys.length) {
        showMessage('warning', 'No hay ejemplos para este nivel', 'Cambia de nivel o escribe una consulta directamente en el editor.');
        return;
    }

    let selectedCategory = category;
    if (category === 'aleatorio' || !categories[selectedCategory]) {
        selectedCategory = keys[Math.floor(Math.random() * keys.length)];
    }

    const categoryData = categories[selectedCategory];
    if (!categoryData || !Array.isArray(categoryData.ejemplos) || !categoryData.ejemplos.length) return;

    const ejemplos = categoryData.ejemplos;
    let ejemplo = ejemplos[Math.floor(Math.random() * ejemplos.length)];
    let exampleKey = `${selectedCategory}:${ejemplo.sql}`;

    if (ejemplos.length > 1 && exampleKey === lastSqlExample) {
        const alternatives = ejemplos.filter(item => `${selectedCategory}:${item.sql}` !== lastSqlExample);
        if (alternatives.length) {
            ejemplo = alternatives[Math.floor(Math.random() * alternatives.length)];
            exampleKey = `${selectedCategory}:${ejemplo.sql}`;
        }
    }

    lastSqlExample = exampleKey;

    const editor = document.getElementById('sqlEditor');
    if (editor) {
        editor.value = ejemplo.sql;
        editor.selectionStart = editor.selectionEnd = editor.value.length;
        editor.focus();
    }

    const status = document.getElementById('sqlExampleStatus');
    if (status) {
        status.textContent = `Ejemplo cargado: ${ejemplo.titulo}`;
    }

    resetSqlResultPanel();
    if (editor) editor.focus();
}

function showExamples() {
    showExampleByCategory();
}

// DONACIONES VOLUNTARIAS
const DONATION_METHODS = {
    yape: {
        id: 'yape',
        label: 'Yape',
        icon: 'fa-mobile-screen-button',
        enabled: true,
        type: 'qr',
        image: 'assets/images/qr-yape.png',
        alt: 'QR de Yape para donar a SQL Academy'
    },
    plin: {
        id: 'plin',
        label: 'Plin',
        icon: 'fa-bolt',
        enabled: true,
        type: 'qr',
        image: 'assets/images/qr-plin.png',
        alt: 'QR de Plin para donar a SQL Academy'
    },
    paypal: {
        id: 'paypal',
        label: 'PayPal',
        icon: 'fa-paypal',
        enabled: false,
        type: 'link',
        url: ''
    },
    kofi: {
        id: 'kofi',
        label: 'Ko-fi',
        icon: 'fa-mug-hot',
        enabled: false,
        type: 'link',
        url: ''
    }
};

const DONATION_QUOTES = [
    'Este código no se va a escribir solo... bueno, a veces sí.',
    'Tu donación es como un buen índice: hace que todo sea más rápido.',
    'Con esto compro café para seguir soñando con código limpio.',
    'Apoya a un programador, evita que tenga que usar Excel.',
    'El servidor también tiene sentimientos (y necesita café).',
    'Las donaciones son como las transacciones ACID: confiables y necesarias.',
    'Gracias a ti, este proyecto no muere en el olvido.',
    'Tu aporte es más rápido que un SELECT sin WHERE.',
    'Así como las bases de datos necesitan índices, yo necesito café.',
    'Cada café es un commit más en mi vida.',
    'Las donaciones son el motor que mueve este proyecto.',
    'Programar sin café es como SQL sin JOIN: incompleto.',
    'Tu donación me da energía para seguir debugueando.',
    'Café + código = felicidad.',
    'No es una donación, es una inversión en código de calidad.'
];

function getEnabledDonationMethods() {
    return Object.values(DONATION_METHODS).filter(method => (
        method.enabled && (method.type !== 'link' || Boolean(method.url))
    ));
}

function getDonationMethod(type) {
    const methods = getEnabledDonationMethods();
    return methods.find(method => method.id === type) || methods[0] || null;
}

function renderDonationMethodTabs(selectedId, methods) {
    return `
        <div class="donation-method-tabs" role="tablist" aria-label="Método de donación">
            ${methods.map(method => `
                <button type="button"
                    class="donation-method-tab${method.id === selectedId ? ' active' : ''}"
                    role="tab"
                    aria-selected="${method.id === selectedId}"
                    onclick="showDonationQR('${escapeHtml(method.id)}')">
                    <i class="fas ${escapeHtml(method.icon)}"></i> ${escapeHtml(method.label)}
                </button>
            `).join('')}
        </div>
    `;
}

function renderDonationMethodPanel(method) {
    if (!method) return '';

    if (method.type === 'qr') {
        return `
            <div class="donation-method-panel" role="tabpanel">
                <div class="donation-qr-card">
                    <a href="${escapeHtml(method.image)}" target="_blank" rel="noopener" class="donation-qr-link" title="Abrir QR de ${escapeHtml(method.label)} en tamaño completo" aria-label="Abrir QR de ${escapeHtml(method.label)} en tamaño completo">
                        <img src="${escapeHtml(method.image)}" alt="${escapeHtml(method.alt)}" class="donation-qr-image">
                        <span class="donation-qr-hint"><i class="fas fa-expand"></i> Ver QR en grande</span>
                    </a>
                </div>
                <div class="donation-method-copy">
                    <p class="donation-scan-copy"><i class="fas fa-qrcode"></i> Escanea el QR y elige el monto.</p>
                    <p class="donation-amount">Monto libre desde <strong>S/1</strong>. Tú decides cuánto.</p>
                </div>
            </div>
        `;
    }

    if (method.type === 'link') {
        return `
            <div class="donation-method-panel donation-method-panel-link" role="tabpanel">
                <div class="donation-method-copy">
                    <h3>Donar con ${escapeHtml(method.label)}</h3>
                    <p>Serás redirigido a ${escapeHtml(method.label)} para completar la donación.</p>
                    <a href="${escapeHtml(method.url)}" target="_blank" rel="noopener" class="btn-primary donation-link-btn">
                        <i class="fas ${escapeHtml(method.icon)}"></i> Abrir ${escapeHtml(method.label)}
                    </a>
                </div>
            </div>
        `;
    }

    return '';
}

function showDonationQR(type = 'yape') {
    const modal = document.getElementById('donationModal');
    const body = document.getElementById('donationModalBody');

    if (!modal || !body) {
        console.error('No se encontró el modal de donaciones');
        return;
    }

    const methods = getEnabledDonationMethods();
    const method = getDonationMethod(type);

    if (!method) {
        body.innerHTML = '<p class="text-muted">No hay métodos de donación disponibles.</p>';
        return;
    }

    const quote = DONATION_QUOTES[Math.floor(Math.random() * DONATION_QUOTES.length)];

    body.innerHTML = `
        <div class="donation-card">
            <p class="donation-lead">
                Si te sirvió, deja una donación voluntaria desde S/1.
            </p>

            ${renderDonationMethodTabs(method.id, methods)}
            ${renderDonationMethodPanel(method)}

            <div class="donation-quote">“${escapeHtml(quote)}”</div>

            <div class="donation-voluntary">
                100% voluntario · No bloquea nada.
            </div>
            <p class="donation-footnote"><i class="fas fa-server"></i> Hosting, dominio y mantenimiento.</p>
        </div>
    `;

    if (!modal.classList.contains('active')) {
        openModal(modal);
    } else {
        const activeTab = body.querySelector('.donation-method-tab.active');
        if (activeTab) activeTab.focus();
    }
}

function closeDonationModal() {
    closeModal(document.getElementById('donationModal'));
}

// GESTORES DE BD - INFORMACION
const dbInfo = {
    'postgresql': {
        title: 'PostgreSQL',
        logo: 'assets/logos/postgresql.png',
        description: 'PostgreSQL es un sistema de gestion de bases de datos relacional orientado a objetos y de codigo abierto, considerado el mas avanzado del mundo.',
        type: 'Relacional (SQL)',
        licencia: 'Open Source',
        sitio: 'postgresql.org',
        caracteristicas: [
            'Soporte completo de SQL',
            'Transacciones ACID',
            'Lenguaje procedimental (PL/pgSQL)',
            'Replicacion y alta disponibilidad',
            'Extensible con extensiones',
            'Ideal para aplicaciones empresariales'
        ],
        empresas: 'Instagram, Apple, Spotify, Uber, Reddit',
        ventajas: 'Muy robusto, excelente rendimiento, gran comunidad',
        desventajas: 'Curva de aprendizaje pronunciada, consume mas recursos',
        tip: 'Ideal para aplicaciones que requieren consistencia, transacciones complejas y consultas avanzadas.',
        tags: ['Open Source', 'SQL', 'ACID', 'Empresarial']
    },
    'mysql': {
        title: 'MySQL',
        logo: 'assets/logos/mysql.png',
        logoDark: 'assets/logos/mysql-dark.png',
        description: 'MySQL es el sistema de gestion de bases de datos relacional mas popular del mundo. Es conocido por su velocidad, facilidad de uso y amplia adopcion en aplicaciones web.',
        type: 'Relacional (SQL)',
        licencia: 'Open Source',
        sitio: 'mysql.com',
        caracteristicas: [
            'Alto rendimiento y velocidad',
            'Facil de aprender y usar',
            'Integracion con PHP y Apache',
            'Replicacion maestro-esclavo',
            'Multiples motores de almacenamiento',
            'Ideal para aplicaciones web'
        ],
        empresas: 'Facebook, Twitter, YouTube, Netflix, Airbnb',
        ventajas: 'Muy rapido, facil de usar, gran comunidad',
        desventajas: 'Menos funcionalidades que PostgreSQL',
        tip: 'Ideal para aplicaciones web y proyectos que priorizan velocidad y simplicidad.',
        tags: ['Open Source', 'SQL', 'Rapido', 'Web']
    },
    'sqlserver': {
        title: 'SQL Server',
        logo: 'assets/logos/sqlserver.png',
        description: 'Microsoft SQL Server es un sistema de gestion de bases de datos relacional desarrollado por Microsoft. Es ampliamente utilizado en entornos empresariales.',
        type: 'Relacional (SQL)',
        licencia: 'Comercial',
        sitio: 'microsoft.com/sql-server',
        caracteristicas: [
            'Integracion con .NET y Azure',
            'SQL Server Integration Services (SSIS)',
            'Analisis de datos (SSAS) y reportes (SSRS)',
            'Alta disponibilidad y clustering',
            'Columnstore para consultas analiticas',
            'Ideal para empresas .NET'
        ],
        empresas: 'Microsoft, Coca-Cola, Walmart, Adobe, Dell',
        ventajas: 'Excelente integracion con Microsoft',
        desventajas: 'Costo de licencia, requiere Windows',
        tip: 'Ideal para entornos empresariales ya integrados en el ecosistema Microsoft.',
        tags: ['Comercial', 'SQL', 'Empresarial', 'Microsoft']
    },
    'oracle': {
        title: 'Oracle Database',
        logo: 'assets/logos/oracle.png',
        description: 'Oracle Database es el sistema de gestion de bases de datos relacional mas utilizado en grandes corporaciones. Es conocido por su robustez y seguridad.',
        type: 'Relacional (SQL)',
        licencia: 'Comercial',
        sitio: 'oracle.com/database',
        caracteristicas: [
            'Maxima seguridad y conformidad',
            'Oracle Real Application Clusters (RAC)',
            'Particionamiento y paralelismo avanzado',
            'Data Guard para recuperacion',
            'Oracle Exadata para rendimiento extremo',
            'Ideal para bancos y gobierno'
        ],
        empresas: 'Bancos, gobiernos, Amazon, Salesforce, SAP',
        ventajas: 'Muy robusto, seguro y escalable',
        desventajas: 'Muy costoso, complejo de administrar',
        tip: 'Ideal para sistemas criticos que exigen alta seguridad, disponibilidad y soporte corporativo.',
        tags: ['Comercial', 'SQL', 'Empresarial', 'Seguro']
    },
    'mariadb': {
        title: 'MariaDB',
        logo: 'assets/logos/mariadb.png',
        description: 'MariaDB es un fork de MySQL creado por los desarrolladores originales. Ofrece mejoras de rendimiento y nuevas funcionalidades.',
        type: 'Relacional (SQL)',
        licencia: 'Open Source',
        sitio: 'mariadb.org',
        caracteristicas: [
            'Compatibilidad con MySQL',
            'Mejor rendimiento en consultas',
            'Multiples motores de almacenamiento',
            'Galera Cluster para alta disponibilidad',
            'ColumnStore para analisis de datos',
            'Ideal para aplicaciones web modernas'
        ],
        empresas: 'Google, Wikipedia, WordPress, Red Hat, Fedora',
        ventajas: 'Rapido, compatible con MySQL, innovador',
        desventajas: 'Comunidad mas pequeña que MySQL',
        tip: 'Ideal para aplicaciones web que buscan compatibilidad con MySQL y codigo abierto.',
        tags: ['Open Source', 'SQL', 'Rapido', 'Web']
    },
    'sqlite': {
        title: 'SQLite',
        logo: 'assets/logos/sqlite.png',
        logoDark: 'assets/logos/sqlite-dark.png',
        description: 'SQLite es una biblioteca que proporciona un motor de base de datos SQL ligero y sin servidor. Es la base de datos mas utilizada del mundo.',
        type: 'Relacional (SQL)',
        licencia: 'Dominio Publico',
        sitio: 'sqlite.org',
        caracteristicas: [
            'Sin servidor (embebido)',
            'Base de datos autocontenida',
            'Transacciones ACID',
            'Muy ligero (menos de 1MB)',
            'Soporte estandar SQL',
            'Ideal para moviles, IoT y navegadores'
        ],
        empresas: 'Apple, Google, Firefox, Adobe, Autodesk',
        ventajas: 'Muy ligero, facil de usar, sin configuracion',
        desventajas: 'No escalable para grandes volumenes',
        tip: 'Ideal para aplicaciones moviles, prototipos y herramientas locales que no necesitan un servidor.',
        tags: ['Open Source', 'SQL', 'Ligero', 'Embebido']
    },
    // ===== GESTORES NoSQL =====
'mongodb': {
    title: 'MongoDB',
    logo: 'assets/logos/mongodb.png',
    description: 'MongoDB es la base de datos NoSQL documental más popular. Almacena datos en documentos JSON flexibles, ideales para aplicaciones modernas y datos semiestructurados.',
    type: 'NoSQL (Documental)',
    licencia: 'Open Source (SSPL) / Comercial',
    sitio: 'mongodb.com',
    caracteristicas: [
        'Almacenamiento en documentos JSON (BSON)',
        'Esquema flexible (schema-less)',
        'Escalabilidad horizontal (sharding)',
        'Aggregation Pipeline para consultas complejas',
        'Indexación avanzada y geoespacial',
        'Ideal para aplicaciones web y Big Data'
    ],
    empresas: 'Adobe, Google, eBay, Bosch, Accenture',
    ventajas: 'Flexible, escalable, facil de comenzar',
    desventajas: 'No tiene JOINs nativos, consistencia eventual',
    tip: 'Ideal para datos semiestructurados y aplicaciones con esquemas cambiantes.',
    tags: ['NoSQL', 'Documental', 'Escalable', 'JSON']
},
'firebase': {
    title: 'Firebase',
    logo: 'assets/logos/firebase.png',
    description: 'Firebase es la plataforma de Google que incluye una base de datos NoSQL en tiempo real. Es ideal para aplicaciones móviles y web con sincronización instantánea.',
    type: 'NoSQL (Tiempo Real)',
    licencia: 'Comercial (Google)',
    sitio: 'firebase.google.com',
    caracteristicas: [
        'Sincronización en tiempo real',
        'Autenticación integrada (Google, Facebook, etc)',
        'Hosting y funciones serverless',
        'Cloud Firestore para datos escalables',
        'Almacenamiento de archivos',
        'Ideal para apps móviles y web'
    ],
    empresas: 'Google, Lyft, The New York Times, Alibaba',
    ventajas: 'Muy facil de usar, integracion completa',
    desventajas: 'Costo variable, dependencia de Google',
    tip: 'Ideal para apps moviles y web que necesitan sincronizacion en tiempo real.',
    tags: ['NoSQL', 'Tiempo Real', 'Cloud', 'Mobile']
},
'redis': {
    title: 'Redis',
    logo: 'assets/logos/redis.png',
    description: 'Redis es la base de datos clave-valor más rápida del mundo. Es ampliamente utilizada como caché, para sesiones de usuario y para aplicaciones que requieren baja latencia.',
    type: 'NoSQL (Clave-Valor)',
    licencia: 'AGPLv3 (Redis 8+)',
    sitio: 'redis.io',
    caracteristicas: [
        'Alta velocidad (sub-milisegundo)',
        'Estructuras de datos avanzadas (listas, sets, hashes)',
        'Persistencia opcional (RDB/AOF)',
        'Replicación y alta disponibilidad',
        'Soporte para Lua scripting',
        'Ideal para caché, sesiones y colas'
    ],
    empresas: 'Twitter, GitHub, Stack Overflow, Snapchat',
    ventajas: 'Muy rapido, versatil, facil de usar',
    desventajas: 'No soporta consultas complejas',
    tip: 'Ideal para cache, sesiones y datos de acceso ultrarrápido; no para consultas relacionales complejas.',
    tags: ['NoSQL', 'Clave-Valor', 'Rapido', 'Cache']
},
'cassandra': {
    title: 'Cassandra',
    logo: 'assets/logos/cassandra.png',
    description: 'Apache Cassandra es una base de datos NoSQL columnar diseñada para manejar grandes volúmenes de datos distribuidos en múltiples servidores. No tiene puntos de fallo.',
    type: 'NoSQL (Columnar)',
    licencia: 'Open Source (Apache 2.0)',
    sitio: 'cassandra.apache.org',
    caracteristicas: [
        'Arquitectura sin punto de fallo',
        'Escalabilidad horizontal nativa',
        'Alto rendimiento en escrituras',
        'Compresión de datos eficiente',
        'Lenguaje CQL (Cassandra Query Language)',
        'Ideal para Big Data y IoT'
    ],
    empresas: 'Apple, Netflix, Uber, eBay, Spotify',
    ventajas: 'Muy escalable, alta disponibilidad',
    desventajas: 'Consistencia eventual, complejo de administrar',
    tip: 'Ideal para escrituras masivas y datos distribuidos geograficamente.',
    tags: ['NoSQL', 'Columnar', 'Escalable', 'Big Data']
},
'neo4j': {
    title: 'Neo4j',
    logo: 'assets/logos/neo4j.png',
    description: 'Neo4j es la base de datos de grafos más utilizada del mundo. Permite modelar y consultar relaciones complejas de manera eficiente y natural.',
    type: 'NoSQL (Grafos)',
    licencia: 'Open Source (GPL) / Comercial',
    sitio: 'neo4j.com',
    caracteristicas: [
        'Modelo de datos basado en grafos (nodos, aristas)',
        'Lenguaje de consulta Cypher',
        'Alto rendimiento en consultas de relaciones',
        'Indexación y búsqueda avanzada',
        'Escalable para millones de nodos',
        'Ideal para redes sociales, fraudes, recomendaciones'
    ],
    empresas: 'eBay, Walmart, Cisco, UBS, NASA',
    ventajas: 'Excelente para relaciones complejas, intuitivo',
    desventajas: 'Curva de aprendizaje, no optimizado para datos planos',
    tip: 'Ideal para redes sociales, recomendaciones y analisis de relaciones complejas.',
    tags: ['NoSQL', 'Grafos', 'Relaciones', 'Redes']
},
'elasticsearch': {
    title: 'Elasticsearch',
    logo: 'assets/logos/elasticsearch.png',
    description: 'Elasticsearch es el motor de búsqueda y análisis de datos más popular. Está basado en Lucene y permite consultas full-text en tiempo real.',
    type: 'NoSQL (Busqueda)',
    licencia: 'Elastic License 2.0 / AGPLv3',
    sitio: 'elastic.co',
    caracteristicas: [
        'Búsqueda full-text en tiempo real',
        'Análisis y agregaciones de datos',
        'Escalabilidad horizontal',
        'Indexación automática',
        'Integración con Logstash y Kibana (ELK Stack)',
        'Ideal para logs, busquedas y analisis'
    ],
    empresas: 'Uber, Netflix, eBay, Microsoft, Facebook',
    ventajas: 'Busqueda rapida, analisis potente',
    desventajas: 'No es una BD transaccional, consistencia eventual',
    tip: 'Ideal para busqueda de texto completo, logs y analisis; no como base transaccional principal.',
    tags: ['NoSQL', 'Busqueda', 'Analisis', 'Logs']
}
};

// ABRIR MODAL DE GESTORES
function openDBInfo(dbKey) {
    const info = dbInfo[dbKey];
    if (!info) return;
    
    const modal = document.getElementById('dbModal');
    const title = document.getElementById('modalTitle');
    const body = document.getElementById('modalBody');
    
    title.innerHTML = `<i class="fas fa-database"></i> ${info.title}`;
    
    let html = `
        <div class="db-logo-large${info.logoDark ? ' has-dark-logo' : ''}">
            <img class="db-logo-light" src="${info.logo}" alt="${info.title}">
            ${info.logoDark ? `<img class="db-logo-dark" src="${info.logoDark}" alt="" aria-hidden="true">` : ''}
        </div>
        
        <p style="font-size:1.05em; color:#444; line-height:1.7;">${info.description}</p>
        
        <div class="info-grid">
            <div class="info-item">
                <div class="label">Tipo</div>
                <div class="value">${info.type}</div>
            </div>
            <div class="info-item">
                <div class="label">Licencia</div>
                <div class="value">${info.licencia}</div>
            </div>
            <div class="info-item">
                <div class="label">Sitio Web</div>
                <div class="value"><a href="https://${info.sitio}" target="_blank" style="color:#336791; text-decoration:none;">${info.sitio}</a></div>
            </div>
            <div class="info-item">
                <div class="label">Empresas que lo usan</div>
                <div class="value" style="font-size:0.85em;">${info.empresas}</div>
            </div>
        </div>
        
        <h3><i class="fas fa-check-circle"></i> Caracteristicas Principales</h3>
        <ul>
            ${info.caracteristicas.map(c => `<li>${c}</li>`).join('')}
        </ul>
        
        <h3><i class="fas fa-balance-scale"></i> Ventajas y Desventajas</h3>
        <div class="info-grid">
            <div class="info-item" style="border-left-color: #28a745;">
                <div class="label" style="color: #28a745;">Ventajas</div>
                <div class="value" style="font-size:0.9em;">${info.ventajas}</div>
            </div>
            <div class="info-item" style="border-left-color: #dc3545;">
                <div class="label" style="color: #dc3545;">Desventajas</div>
                <div class="value" style="font-size:0.9em;">${info.desventajas}</div>
            </div>
        </div>
        
        <h3><i class="fas fa-tags"></i> Etiquetas</h3>
        <div class="badge-container">
            ${info.tags.map(tag => {
                const colorMap = {
                    'Open Source': 'badge-success',
                    'Comercial': 'badge-warning',
                    'SQL': 'badge-info',
                    'ACID': 'badge-info',
                    'Empresarial': 'badge-danger',
                    'Rapido': 'badge-success',
                    'Web': 'badge-info',
                    'Microsoft': 'badge-info',
                    'Seguro': 'badge-success',
                    'Ligero': 'badge-info',
                    'Embebido': 'badge-secondary'
                };
                const badgeClass = colorMap[tag] || 'badge-secondary';
                return `<span class="badge ${badgeClass}">${tag}</span>`;
            }).join('')}
        </div>
        
        <div style="margin-top: 15px; padding: 12px; background: #f0f4ff; border-radius: 8px; border-left: 4px solid #336791; font-size:0.9em; color:#555;">
            <i class="fas fa-lightbulb" style="color: #336791;"></i>
            <strong>Tip:</strong> ${info.tip}
        </div>

        ${window.INSTALL_GUIDES?.[dbKey] ? `
            <div class="db-install-cta">
                <div>
                    <strong>¿Quieres instalarlo en tu equipo?</strong>
                    <p>Guía paso a paso para Windows, macOS, Linux o Docker.</p>
                </div>
                <button type="button" class="btn-primary" onclick="openInstallFromDBInfo('${escapeHtml(dbKey)}')">
                    <i class="fas fa-download"></i> Cómo instalarlo
                </button>
            </div>
        ` : ''}
    `;
    
    body.innerHTML = html;
    openModal(modal);
}

function closeDBModal() {
    closeModal(document.getElementById('dbModal'));
}

// CONCEPTOS CLAVE
const conceptInfo = {
    mer: {
        title: 'Modelo Entidad-Relación (MER)',
        icon: 'sitemap',
        level: 'Básico',
        tags: ['SQL', 'Diseño'],
        description: 'El modelo entidad-relación es una representación conceptual de los datos. Define entidades, atributos y relaciones antes de crear las tablas.',
        conceptos: [
            'Entidad: objeto del mundo real, como Estudiante o Curso.',
            'Atributo: característica de una entidad, como nombre o edad.',
            'Relación: asociación entre entidades, como “un estudiante se inscribe en un curso”.',
            'Cardinalidad: cuántos elementos participan en una relación (1:1, 1:N, N:M).'
        ],
        ejemplo: 'Un Estudiante se inscribe en varios Cursos y un Curso tiene muchos Estudiantes. Es una relación N:M que suele resolverse con una tabla intermedia.'
    },
    normalizacion: {
        title: 'Normalización de Bases de Datos',
        icon: 'layer-group',
        level: 'Intermedio',
        tags: ['SQL', 'Diseño'],
        description: 'La normalización organiza los datos para reducir redundancia y evitar anomalías al insertar, actualizar o eliminar registros.',
        conceptos: [
            '1FN: elimina grupos repetidos y valores multivaluados.',
            '2FN: cada atributo depende de toda la clave primaria.',
            '3FN: elimina dependencias transitivas entre columnas no clave.',
            'BCNF: una versión más estricta de 3FN para casos especiales.'
        ],
        ejemplo: 'En lugar de guardar los datos del curso repetidos en cada estudiante, separa Estudiantes, Cursos e Inscripciones.'
    },
    llaves: {
        title: 'Tipos de Llaves en Bases de Datos',
        icon: 'key',
        level: 'Básico',
        tags: ['SQL', 'Estructura'],
        description: 'Las llaves identifican registros y conectan tablas. Son una pieza central del modelo relacional.',
        conceptos: [
            'Primary Key (PK): identificador único de cada fila.',
            'Foreign Key (FK): referencia a la PK de otra tabla.',
            'Unique Key: garantiza que los valores de una columna no se repitan.',
            'Composite Key: clave formada por varias columnas.'
        ],
        ejemplo: 'En Inscripciones, (estudiante_id, curso_id) puede ser una clave compuesta. estudiante_id también es una FK hacia Estudiantes.'
    },
    sql: {
        title: 'Comandos SQL (DDL, DML, DCL, TCL)',
        icon: 'code',
        level: 'Básico',
        tags: ['SQL', 'Consultas'],
        description: 'SQL agrupa sus comandos según su función: definir estructura, manipular datos, controlar permisos o gestionar transacciones.',
        conceptos: [
            'DDL: CREATE, ALTER y DROP definen la estructura.',
            'DML: SELECT, INSERT, UPDATE y DELETE trabajan con los datos.',
            'DCL: GRANT y REVOKE controlan permisos.',
            'TCL: COMMIT, ROLLBACK y SAVEPOINT gestionan transacciones.'
        ],
        ejemplo: 'CREATE TABLE estudiantes (id INTEGER PRIMARY KEY, nombre TEXT); es DDL. INSERT INTO estudiantes VALUES (...); es DML.'
    },
    acid: {
        title: 'Propiedades ACID',
        icon: 'shield-halved',
        level: 'Intermedio',
        tags: ['SQL', 'Transacciones'],
        description: 'ACID describe las garantías que hacen que una transacción sea segura incluso ante errores o concurrencia.',
        conceptos: [
            'Atomicidad: la transacción se completa entera o no se aplica.',
            'Consistencia: se respetan las reglas e integridad de la base.',
            'Aislamiento: las transacciones concurrentes no se pisan entre sí.',
            'Durabilidad: los cambios confirmados sobreviven a fallos.'
        ],
        ejemplo: 'En una transferencia bancaria, no puede descontarse el dinero de una cuenta sin sumarlo en la otra. Atomicidad lo impide.'
    },
    indices: {
        title: 'Índices en Bases de Datos',
        icon: 'list',
        level: 'Intermedio',
        tags: ['SQL', 'Rendimiento'],
        description: 'Un índice es una estructura auxiliar que acelera determinadas lecturas a cambio de espacio y de un coste extra en escrituras.',
        conceptos: [
            'B-Tree: el índice más común; sirve para rangos y búsquedas ordenadas.',
            'Hash: muy rápido para igualdad exacta, pero no para rangos.',
            'Full-Text: pensado para buscar palabras dentro de textos.',
            'Trade-off: mejora lecturas, pero ralentiza INSERT, UPDATE y DELETE.'
        ],
        ejemplo: 'CREATE INDEX idx_estudiantes_nombre ON estudiantes(nombre); puede acelerar búsquedas por nombre.'
    },
    joins: {
        title: 'Tipos de JOIN',
        icon: 'link',
        level: 'Intermedio',
        tags: ['SQL', 'Consultas'],
        description: 'JOIN combina filas de dos o más tablas usando una condición. Elegir el tipo correcto cambia qué filas aparecen en el resultado.',
        conceptos: [
            'INNER JOIN: solo devuelve las filas que coinciden en ambas tablas.',
            'LEFT JOIN: conserva todas las filas de la tabla izquierda.',
            'RIGHT JOIN: conserva todas las filas de la tabla derecha.',
            'FULL JOIN: conserva las filas de ambos lados cuando el motor lo soporta.',
            'CROSS JOIN: genera todas las combinaciones posibles.'
        ],
        ejemplo: 'SELECT e.nombre, c.nombre FROM estudiantes e JOIN inscripciones i ON e.id = i.estudiante_id JOIN cursos c ON i.curso_id = c.id;'
    },
    nosql: {
        title: 'Bases de Datos NoSQL',
        icon: 'database',
        level: 'Básico',
        tags: ['NoSQL', 'Big Data'],
        description: 'NoSQL agrupa motores que no usan el modelo relacional tradicional. Están pensados para datos flexibles, grandes volúmenes o patrones de acceso concretos.',
        conceptos: [
            'NoSQL significa “Not Only SQL”: no implica que SQL desaparezca.',
            'No requieren un esquema fijo, aunque el modelo de datos sigue importando.',
            'Suelen buscar escalabilidad horizontal.',
            'Tipos principales: documentos, clave-valor, columnas y grafos.'
        ],
        ejemplo: 'MongoDB guarda documentos JSON flexibles. Redis guarda pares clave-valor. Neo4j modela nodos y relaciones.'
    },
    documentales: {
        title: 'Bases de Datos Documentales',
        icon: 'file-lines',
        level: 'Básico',
        tags: ['NoSQL', 'Documentos'],
        description: 'Almacenan la información en documentos, normalmente JSON o BSON. Cada documento puede tener una estructura distinta.',
        conceptos: [
            'Documentos con campos y objetos anidados.',
            'Esquema flexible, pero conviene definir convenciones.',
            'Buen encaje para catálogos, perfiles y contenido semiestructurado.',
            'Consultas por campos internos e indexación de rutas.'
        ],
        ejemplo: 'Un documento de usuario puede incluir nombre, email y una lista de direcciones sin crear tres tablas distintas.'
    },
    'clave-valor': {
        title: 'Bases de Datos Clave-Valor',
        icon: 'key',
        level: 'Básico',
        tags: ['NoSQL', 'Cache'],
        description: 'Son las bases más simples: guardan un valor asociado a una clave única. Destacan por su velocidad y su facilidad para escalar.',
        conceptos: [
            'Estructura clave → valor.',
            'Lecturas y escrituras muy rápidas.',
            'Ideales para caché, sesiones y contadores.',
            'No son la mejor opción para consultas relacionales complejas.'
        ],
        ejemplo: 'En Redis puedes guardar user:123 → { nombre: "Ana", rol: "admin" } con una expiración de sesión.'
    },
    columnas: {
        title: 'Bases de Datos por Columnas',
        icon: 'table-cells',
        level: 'Intermedio',
        tags: ['NoSQL', 'Analítica'],
        description: 'Guardan los datos por columnas en lugar de por filas. Son eficientes para analítica porque leen solo las columnas necesarias y comprimen mejor.',
        conceptos: [
            'Almacenamiento orientado a columnas.',
            'Excelente para OLAP, agregaciones y data warehouses.',
            'Buena compresión y lectura de grandes volúmenes.',
            'No suelen ser la primera opción para OLTP con muchas escrituras pequeñas.'
        ],
        ejemplo: 'Cassandra organiza los datos en familias de columnas para consultas distribuidas de alta escala.'
    },
    grafos: {
        title: 'Bases de Datos de Grafos',
        icon: 'share-nodes',
        level: 'Intermedio',
        tags: ['NoSQL', 'Redes'],
        description: 'Representan la información como nodos, aristas y propiedades. Son ideales cuando las relaciones son tan importantes como los datos.',
        conceptos: [
            'Nodos: entidades, como personas o productos.',
            'Aristas: relaciones, como “amigo de” o “compró”.',
            'Propiedades: atributos de nodos y aristas.',
            'Recorridos eficientes para amigos de amigos, rutas y recomendaciones.'
        ],
        ejemplo: 'En Neo4j puedes consultar MATCH (u:Person)-[:FRIENDS]->(f) RETURN f; para encontrar amigos directos.'
    },
    'tiempo-real': {
        title: 'Bases de Datos en Tiempo Real',
        icon: 'bolt',
        level: 'Intermedio',
        tags: ['NoSQL', 'Tiempo Real'],
        description: 'Están diseñadas para sincronizar cambios y notificar a los clientes casi al instante. Son habituales en apps colaborativas y chats.',
        conceptos: [
            'Sincronización instantánea entre clientes.',
            'Suscripciones a cambios y eventos.',
            'Buen encaje para chats, juegos y edición colaborativa.',
            'Hay que pensar en conflictos, latencia y consistencia.'
        ],
        ejemplo: 'Firebase Realtime Database notifica a todos los clientes cuando cambia un documento compartido.'
    },
    cap: {
        title: 'Teorema CAP',
        icon: 'circle-nodes',
        level: 'Avanzado',
        tags: ['NoSQL', 'Distribución'],
        description: 'CAP explica que, ante una partición de red, un sistema distribuido debe elegir entre consistencia y disponibilidad. No significa que solo puedas tener dos propiedades siempre.',
        conceptos: [
            'Consistencia (C): todos los nodos ven el mismo dato.',
            'Disponibilidad (A): el sistema responde aunque haya fallos.',
            'Tolerancia a particiones (P): el sistema sigue funcionando si se separa la red.',
            'CP prioriza datos consistentes; AP prioriza seguir respondiendo.'
        ],
        ejemplo: 'En una partición de red, un sistema AP puede devolver una versión antigua del dato para seguir disponible; un sistema CP puede rechazar la operación hasta recuperar consistencia.'
    }
};

const conceptMistakes = {
    mer: [
        'Confundir una entidad conceptual con una tabla física.',
        'Olvidar indicar la cardinalidad de las relaciones.'
    ],
    normalizacion: [
        'Normalizar sin medir el coste de los JOINs posteriores.',
        'Confundir 2FN con 3FN.'
    ],
    llaves: [
        'Usar una FK como PK sin que sea necesario.',
        'Pensar que UNIQUE y PRIMARY KEY son exactamente lo mismo.'
    ],
    sql: [
        'Confundir DDL con DML.',
        'Pensar que SELECT modifica los datos.'
    ],
    acid: [
        'Creer que ACID es exclusivo de las bases SQL.',
        'Confundir aislamiento con consistencia.'
    ],
    indices: [
        'Indexar todas las columnas por si acaso.',
        'Olvidar que los índices también cuestan espacio y escrituras.'
    ],
    joins: [
        'Hacer JOIN sin condición ON y provocar un producto cartesiano.',
        'Confundir LEFT JOIN con INNER JOIN.'
    ],
    nosql: [
        'Creer que NoSQL significa que ya no se usa SQL.',
        'Elegir NoSQL sin un patrón de acceso claro.'
    ],
    documentales: [
        'Duplicar datos sin control y crear inconsistencias.',
        'Pensar que un esquema flexible significa que no hay que modelar.'
    ],
    'clave-valor': [
        'Usarlas para consultas relacionales complejas.',
        'No definir expiración o estrategia de invalidación en caché.'
    ],
    columnas: [
        'Usarlas para OLTP con muchas escrituras pequeñas.',
        'Ignorar el coste de las escrituras y la modelización por consultas.'
    ],
    grafos: [
        'Usarlas para datos tabulares simples sin relaciones profundas.',
        'Olvidar indexar las propiedades que se usan en los recorridos.'
    ],
    'tiempo-real': [
        'Confundir tiempo real con baja latencia puntual.',
        'No prever conflictos de escritura concurrente.'
    ],
    cap: [
        'Creer que se pueden tener C, A y P al mismo tiempo durante una partición.',
        'Pensar que CAP es una elección fija para siempre: depende del escenario.'
    ]
};

const conceptPractices = {
    mer: { type: 'analyze', label: 'Ver ERD', icon: 'fa-project-diagram' },
    normalizacion: { type: 'analyze', label: 'Ver ERD', icon: 'fa-project-diagram' },
    llaves: { type: 'analyze', label: 'Ver claves en el ERD', icon: 'fa-key' },
    sql: { type: 'lesson', lessonId: 'select', label: 'Practicar SELECT', icon: 'fa-play' },
    acid: { type: 'practice', label: 'Ir al editor SQL', icon: 'fa-code' },
    indices: { type: 'analyze', label: 'Ver tablas y relaciones', icon: 'fa-table-list' },
    joins: { type: 'lesson', lessonId: 'join', label: 'Practicar JOIN', icon: 'fa-link' },
    nosql: { type: 'nosql', label: 'Abrir laboratorio NoSQL', icon: 'fa-flask' },
    documentales: { type: 'nosql', label: 'Probar documentos', icon: 'fa-file-lines' },
    'clave-valor': { type: 'nosql', label: 'Abrir laboratorio NoSQL', icon: 'fa-key' },
    columnas: { type: 'nosql', label: 'Explorar agregaciones', icon: 'fa-table-cells' },
    grafos: { type: 'nosql', label: 'Abrir laboratorio NoSQL', icon: 'fa-share-nodes' },
    'tiempo-real': { type: 'nosql', label: 'Abrir laboratorio NoSQL', icon: 'fa-bolt' },
    cap: { type: 'nosql', label: 'Explorar NoSQL', icon: 'fa-circle-nodes' }
};

const conceptRelated = {
    mer: ['normalizacion', 'llaves', 'joins'],
    normalizacion: ['mer', 'llaves'],
    llaves: ['mer', 'joins'],
    sql: ['joins', 'acid'],
    acid: ['sql', 'cap'],
    indices: ['sql', 'columnas'],
    joins: ['llaves', 'mer'],
    nosql: ['documentales', 'clave-valor', 'columnas', 'grafos', 'cap'],
    documentales: ['nosql', 'clave-valor'],
    'clave-valor': ['nosql', 'tiempo-real'],
    columnas: ['nosql', 'indices'],
    grafos: ['nosql', 'cap'],
    'tiempo-real': ['nosql', 'clave-valor'],
    cap: ['nosql', 'acid', 'grafos']
};

const conceptQuizzes = {
    mer: [
        { question: '¿Qué representa una entidad en el MER?', options: ['Un objeto del mundo real', 'Una consulta SQL', 'Un índice'], answer: 0 },
        { question: '¿Qué indica una cardinalidad 1:N?', options: ['Un elemento se relaciona con muchos', 'Muchos con muchos', 'Ningún elemento se relaciona'], answer: 0 }
    ],
    normalizacion: [
        { question: '¿Qué busca la normalización?', options: ['Reducir redundancia y mejorar integridad', 'Duplicar los datos', 'Eliminar todas las claves'], answer: 0 },
        { question: '¿Qué forma normal elimina dependencias transitivas?', options: ['3FN', '1FN', 'Ninguna'], answer: 0 }
    ],
    llaves: [
        { question: '¿Qué hace una Foreign Key?', options: ['Referencia la PK de otra tabla', 'Identifica la fila de su propia tabla', 'Crea un índice Full-Text'], answer: 0 },
        { question: '¿Qué es una clave compuesta?', options: ['Una clave formada por varias columnas', 'Una clave foránea', 'Un índice único'], answer: 0 }
    ],
    sql: [
        { question: '¿Qué grupo incluye CREATE, ALTER y DROP?', options: ['DDL', 'DML', 'DCL'], answer: 0 },
        { question: '¿Qué comando pertenece a DML?', options: ['INSERT', 'GRANT', 'COMMIT'], answer: 0 }
    ],
    acid: [
        { question: '¿Qué propiedad garantiza que una transacción se complete o no se aplique?', options: ['Atomicidad', 'Durabilidad', 'Aislamiento'], answer: 0 },
        { question: '¿Qué propiedad evita que transacciones concurrentes interfieran?', options: ['Aislamiento', 'Consistencia', 'Atomicidad'], answer: 0 }
    ],
    indices: [
        { question: '¿Qué mejora principalmente un índice?', options: ['Velocidad de lectura', 'Velocidad de escritura', 'Espacio libre'], answer: 0 },
        { question: '¿Qué índice es el más común?', options: ['B-Tree', 'Hash', 'Full-Text'], answer: 0 }
    ],
    joins: [
        { question: '¿Qué JOIN devuelve solo las filas que coinciden en ambas tablas?', options: ['INNER JOIN', 'LEFT JOIN', 'FULL JOIN'], answer: 0 },
        { question: '¿Qué JOIN conserva todas las filas de la tabla izquierda?', options: ['LEFT JOIN', 'INNER JOIN', 'CROSS JOIN'], answer: 0 }
    ],
    nosql: [
        { question: '¿Qué significa NoSQL?', options: ['Not Only SQL', 'No SQL', 'New SQL'], answer: 0 },
        { question: '¿Qué tipo de escalabilidad suele buscar NoSQL?', options: ['Horizontal', 'Vertical', 'Ninguna'], answer: 0 }
    ],
    documentales: [
        { question: '¿Cómo almacenan los datos?', options: ['Documentos JSON/BSON', 'Filas y columnas', 'Grafos'], answer: 0 },
        { question: '¿Qué base de datos es documental?', options: ['MongoDB', 'Redis', 'Neo4j'], answer: 0 }
    ],
    'clave-valor': [
        { question: '¿Qué estructura usan?', options: ['Clave → valor', 'Tabla → fila', 'Nodo → arista'], answer: 0 },
        { question: '¿Para qué se usan mucho?', options: ['Caché y sesiones', 'Data warehouses', 'Grafos sociales'], answer: 0 }
    ],
    columnas: [
        { question: '¿Cómo almacenan los datos?', options: ['Por columnas', 'Por filas', 'Por documentos'], answer: 0 },
        { question: '¿Para qué son ideales?', options: ['Analítica y OLAP', 'Transacciones OLTP', 'Grafos'], answer: 0 }
    ],
    grafos: [
        { question: '¿Qué elementos usan?', options: ['Nodos y aristas', 'Filas y columnas', 'Claves y valores'], answer: 0 },
        { question: '¿Para qué son ideales?', options: ['Redes sociales y recomendaciones', 'Nóminas', 'Caché'], answer: 0 }
    ],
    'tiempo-real': [
        { question: '¿Qué ofrecen?', options: ['Sincronización instantánea', 'Copias de seguridad', 'Índices B-Tree'], answer: 0 },
        { question: '¿Qué ejemplo encaja?', options: ['Chat colaborativo', 'Facturación mensual', 'Data warehouse'], answer: 0 }
    ],
    cap: [
        { question: '¿Qué tres propiedades plantea CAP?', options: ['Consistencia, disponibilidad y tolerancia a particiones', 'Atomicidad, consistencia e integridad', 'Clave, valor y documento'], answer: 0 },
        { question: 'En una partición, ¿qué suele sacrificar un sistema AP?', options: ['Consistencia', 'Disponibilidad', 'Tolerancia a particiones'], answer: 0 }
    ]
};

const CONCEPT_PROGRESS_KEY = 'sql-academy-concepts-v1';
let conceptProgress = {};
let activeGuideFilter = 'all';
let activeConceptFilter = 'all';
let activeInstallFilter = 'all';
let currentInstallGuideId = null;
let currentInstallPathId = null;
let learnLibraryInitialized = false;

function loadConceptProgress() {
    const stored = readStoredJSON(CONCEPT_PROGRESS_KEY, {});
    conceptProgress = stored && typeof stored === 'object' && !Array.isArray(stored) ? stored : {};
}

function saveConceptProgress() {
    writeStoredJSON(CONCEPT_PROGRESS_KEY, conceptProgress);
}

function isConceptCompleted(key) {
    return Boolean(conceptProgress[key]?.completed);
}

function getConceptMasteryStats() {
    const total = Object.keys(conceptInfo).length;
    const completed = Object.keys(conceptInfo).filter(isConceptCompleted).length;
    return {
        total,
        completed,
        percent: total ? Math.round((completed / total) * 100) : 0
    };
}

function updateConceptProgressUI() {
    const stats = getConceptMasteryStats();
    const text = document.getElementById('conceptProgressText');
    const bar = document.getElementById('conceptProgressBar');
    const track = document.getElementById('conceptProgressTrack');
    if (text) text.textContent = `${stats.completed} de ${stats.total}`;
    if (bar) bar.style.width = `${stats.percent}%`;
    if (track) track.setAttribute('aria-valuenow', String(stats.percent));

    document.querySelectorAll('[data-concept-badge]').forEach(badge => {
        badge.hidden = !isConceptCompleted(badge.dataset.conceptBadge);
    });
    document.querySelectorAll('[data-concept-card]').forEach(card => {
        card.classList.toggle('is-completed', isConceptCompleted(card.dataset.conceptKey));
    });
}

function markConceptCompleted(key) {
    if (isConceptCompleted(key)) return false;
    conceptProgress[key] = {
        completed: true,
        completedAt: new Date().toISOString()
    };
    saveConceptProgress();
    updateConceptProgressUI();
    renderLearningProgressDashboard();
    showToast('success', 'Concepto dominado. Se ha guardado en tu progreso.');
    return true;
}

function getConceptLevelClass(level) {
    if (level === 'Básico') return 'basico';
    if (level === 'Intermedio') return 'intermedio';
    return 'avanzado';
}

function normalizeLibraryText(value) {
    return String(value || '')
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '');
}

function activateLearnTab(tabName) {
    const next = ['guides', 'concepts', 'install'].includes(tabName) ? tabName : 'guides';
    const tabs = Array.from(document.querySelectorAll('.learn-tab'));
    const panels = {
        guides: document.getElementById('learnGuidesPanel'),
        concepts: document.getElementById('learnConceptsPanel'),
        install: document.getElementById('learnInstallPanel')
    };

    tabs.forEach(tab => {
        const active = tab.dataset.learnTab === next;
        tab.classList.toggle('active', active);
        tab.setAttribute('aria-selected', String(active));
        tab.tabIndex = active ? 0 : -1;
    });

    Object.entries(panels).forEach(([name, panel]) => {
        if (!panel) return;
        const active = name === next;
        panel.hidden = !active;
        panel.classList.toggle('active', active);
    });

    if (next === 'concepts') updateConceptProgressUI();
    if (next === 'install') filterInstallGuides();
}

function filterLearnGuides() {
    const input = document.getElementById('guideSearch');
    const query = normalizeLibraryText(input?.value || '');
    const cards = Array.from(document.querySelectorAll('[data-guide-card]'));
    let visible = 0;

    cards.forEach(card => {
        const tags = (card.dataset.tags || '').split(' ').filter(Boolean);
        const matchesFilter = activeGuideFilter === 'all' || tags.includes(activeGuideFilter);
        const haystack = normalizeLibraryText(`${card.dataset.search || ''} ${card.textContent}`);
        const matchesQuery = !query || haystack.includes(query);
        const match = matchesFilter && matchesQuery;
        card.hidden = !match;
        if (match) visible += 1;
    });

    document.querySelectorAll('#learnGuidesPanel .db-group').forEach(group => {
        const groupCards = Array.from(group.querySelectorAll('[data-guide-card]'));
        group.hidden = groupCards.length > 0 && groupCards.every(card => card.hidden);
    });

    const empty = document.getElementById('guideEmptyState');
    if (empty) empty.hidden = visible > 0;
}

function setGuideFilter(filter) {
    activeGuideFilter = filter;
    document.querySelectorAll('[data-guide-filter]').forEach(button => {
        const active = button.dataset.guideFilter === filter;
        button.classList.toggle('active', active);
        button.setAttribute('aria-pressed', String(active));
    });
    filterLearnGuides();
}

function filterConcepts() {
    const input = document.getElementById('conceptSearch');
    const query = normalizeLibraryText(input?.value || '');
    const cards = Array.from(document.querySelectorAll('[data-concept-card]'));
    let visible = 0;

    cards.forEach(card => {
        const tags = (card.dataset.tags || '').split(' ').filter(Boolean);
        const level = card.dataset.level || '';
        const matchesFilter = activeConceptFilter === 'all'
            || tags.includes(activeConceptFilter)
            || level === activeConceptFilter;
        const haystack = normalizeLibraryText(`${card.dataset.search || ''} ${card.textContent}`);
        const matchesQuery = !query || haystack.includes(query);
        const match = matchesFilter && matchesQuery;
        card.hidden = !match;
        if (match) visible += 1;
    });

    const empty = document.getElementById('conceptEmptyState');
    if (empty) empty.hidden = visible > 0;
}

function setConceptFilter(filter) {
    activeConceptFilter = filter;
    document.querySelectorAll('[data-concept-filter]').forEach(button => {
        const active = button.dataset.conceptFilter === filter;
        button.classList.toggle('active', active);
        button.setAttribute('aria-pressed', String(active));
    });
    filterConcepts();
}

function getInstallDifficultyClass(difficulty) {
    return normalizeLibraryText(difficulty).replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'media';
}

function renderInstallGuides() {
    const container = document.getElementById('installGuideGrid');
    if (!container) return;

    const guides = Object.values(window.INSTALL_GUIDES || {})
        .filter(guide => guide && guide.id && guide.name)
        .sort((a, b) => {
            if (Boolean(a.recommended) !== Boolean(b.recommended)) return a.recommended ? -1 : 1;
            return a.name.localeCompare(b.name, 'es');
        });

    container.innerHTML = guides.map(guide => {
        const paths = Array.isArray(guide.paths) ? guide.paths : [];
        const osIds = [...new Set(paths.flatMap(path => (
            Array.isArray(path.platforms) && path.platforms.length ? path.platforms : [path.id]
        )))].join(' ');
        const search = [
            guide.name,
            guide.summary,
            guide.type,
            guide.difficulty,
            ...paths.flatMap(path => [
                path.label,
                ...(Array.isArray(path.platforms) ? path.platforms : [])
            ])
        ].join(' ');
        return `
            <article class="install-guide-card"
                data-install-card
                data-type="${escapeHtml(String(guide.type || '').toLowerCase())}"
                data-recommended="${guide.recommended ? 'true' : 'false'}"
                data-os="${escapeHtml(osIds)}"
                data-search="${escapeHtml(search)}">
                <div class="install-guide-card-top">
                    <span class="install-guide-logo${guide.logoDark ? ' has-dark-logo' : ''}">
                        <img class="db-logo-light" src="${escapeHtml(guide.logo)}" alt="${escapeHtml(guide.name)}">
                        ${guide.logoDark ? `<img class="db-logo-dark" src="${escapeHtml(guide.logoDark)}" alt="" aria-hidden="true">` : ''}
                    </span>
                    ${guide.recommended ? '<span class="install-guide-recommended">Recomendado</span>' : ''}
                </div>
                <h3>${escapeHtml(guide.name)}</h3>
                <p>${escapeHtml(guide.summary)}</p>
                <div class="install-guide-meta">
                    <span class="install-difficulty install-difficulty-${getInstallDifficultyClass(guide.difficulty)}">${escapeHtml(guide.difficulty)}</span>
                    <span><i class="fas fa-clock"></i> ${escapeHtml(guide.time)}</span>
                </div>
                <div class="install-guide-os">
                    ${paths.map(path => `<span>${escapeHtml(path.label)}</span>`).join('')}
                </div>
                <button type="button" class="btn-secondary install-guide-open" onclick="openInstallGuide('${escapeHtml(guide.id)}')">
                    Ver guía <i class="fas fa-arrow-right"></i>
                </button>
            </article>
        `;
    }).join('');
}

function filterInstallGuides() {
    const search = document.getElementById('installSearch');
    const osFilter = document.getElementById('installOsFilter');
    const query = normalizeLibraryText(search?.value || '');
    const selectedOs = osFilter?.value || 'all';
    const cards = Array.from(document.querySelectorAll('[data-install-card]'));
    let visible = 0;

    cards.forEach(card => {
        const type = card.dataset.type || '';
        const recommended = card.dataset.recommended === 'true';
        const osIds = (card.dataset.os || '').split(' ').filter(Boolean);
        const matchesFilter = activeInstallFilter === 'all'
            || (activeInstallFilter === 'recomendado' ? recommended : type === activeInstallFilter);
        const matchesOs = selectedOs === 'all'
            || osIds.includes(selectedOs)
            || (osIds.includes('docker') && ['windows', 'macos', 'linux'].includes(selectedOs));
        const haystack = normalizeLibraryText(`${card.dataset.search || ''} ${card.textContent}`);
        const matchesQuery = !query || haystack.includes(query);
        const match = matchesFilter && matchesOs && matchesQuery;
        card.hidden = !match;
        if (match) visible += 1;
    });

    const empty = document.getElementById('installEmptyState');
    if (empty) empty.hidden = visible > 0;
}

function setInstallFilter(filter) {
    activeInstallFilter = ['all', 'sql', 'nosql', 'recomendado'].includes(filter) ? filter : 'all';
    document.querySelectorAll('[data-install-filter]').forEach(button => {
        const active = button.dataset.installFilter === activeInstallFilter;
        button.classList.toggle('active', active);
        button.setAttribute('aria-pressed', String(active));
    });
    filterInstallGuides();
}

function getActiveInstallGuide() {
    return window.INSTALL_GUIDES?.[currentInstallGuideId] || null;
}

function getActiveInstallPath(guide) {
    if (!guide) return null;
    return guide.paths.find(path => path.id === currentInstallPathId)
        || guide.paths.find(path => path.recommended)
        || guide.paths[0]
        || null;
}

function renderInstallCode(code) {
    if (!code) return '';
    return `
        <div class="install-code-row">
            <code>${escapeHtml(code)}</code>
            <button type="button" class="install-copy-btn" data-copy-code="${escapeHtml(code)}" onclick="copyInstallCommand(this)" aria-label="Copiar comando">
                <i class="fas fa-copy"></i> Copiar
            </button>
        </div>
    `;
}

function renderInstallLink(link) {
    if (!link || !link.url) return '';
    return `<a class="install-inline-link" href="${escapeHtml(link.url)}" target="_blank" rel="noopener">${escapeHtml(link.label || link.url)} <i class="fas fa-arrow-up-right-from-square"></i></a>`;
}

function renderInstallGuide() {
    const guide = getActiveInstallGuide();
    const body = document.getElementById('installGuideBody');
    const title = document.getElementById('installGuideTitle');
    const eyebrow = document.getElementById('installGuideEyebrow');
    if (!guide || !body) return;

    const path = getActiveInstallPath(guide);
    currentInstallPathId = path?.id || null;
    if (title) title.textContent = `Cómo instalar ${guide.name}`;
    if (eyebrow) eyebrow.textContent = `Instalación · ${guide.type}`;

    const paths = Array.isArray(guide.paths) ? guide.paths : [];
    const osTabs = paths.length > 1 ? `
        <div class="install-os-tabs" role="tablist" aria-label="Sistema operativo">
            ${paths.map(item => `
                <button type="button"
                    class="install-os-tab${item.id === currentInstallPathId ? ' active' : ''}"
                    role="tab"
                    aria-selected="${item.id === currentInstallPathId}"
                    onclick="selectInstallOs('${escapeHtml(item.id)}')">
                    ${escapeHtml(item.label)}
                </button>
            `).join('')}
        </div>
    ` : '';

    const steps = path?.steps?.length ? `
        <section class="install-guide-section">
            <h4><i class="fas fa-list-ol"></i> Pasos</h4>
            <ol class="install-steps">
                ${path.steps.map((step, index) => `
                    <li class="install-step">
                        <span class="install-step-number">${index + 1}</span>
                        <div class="install-step-body">
                            <strong>${escapeHtml(step.title)}</strong>
                            <p>${escapeHtml(step.body)}</p>
                            ${renderInstallCode(step.code)}
                            ${renderInstallLink(step.link)}
                        </div>
                    </li>
                `).join('')}
            </ol>
        </section>
    ` : '<p class="install-empty-copy">No hay pasos disponibles para este sistema.</p>';

    const verify = path?.verify?.length ? `
        <section class="install-guide-section install-verify">
            <h4><i class="fas fa-circle-check"></i> Cómo verificar</h4>
            ${path.verify.map(step => `
                <div class="install-verify-item">
                    <strong>${escapeHtml(step.title)}</strong>
                    <p>${escapeHtml(step.body)}</p>
                    ${renderInstallCode(step.code)}
                    ${renderInstallLink(step.link)}
                </div>
            `).join('')}
        </section>
    ` : '';

    const notes = path?.notes?.length ? `
        <section class="install-guide-section install-notes">
            <h4><i class="fas fa-circle-info"></i> Notas</h4>
            <ul>${path.notes.map(note => `<li>${escapeHtml(note)}</li>`).join('')}</ul>
        </section>
    ` : '';

    const clients = guide.clients?.length ? `
        <section class="install-guide-section">
            <h4><i class="fas fa-window-restore"></i> Cliente recomendado</h4>
            <div class="install-guide-links">
                ${guide.clients.map(client => `
                    <a href="${escapeHtml(client.url)}" target="_blank" rel="noopener">
                        ${escapeHtml(client.name)} <i class="fas fa-arrow-up-right-from-square"></i>
                    </a>
                `).join('')}
            </div>
        </section>
    ` : '';

    const cloud = guide.cloudAlternative ? `
        <div class="install-cloud-alternative">
            <span><i class="fas fa-cloud"></i> Alternativa sin instalar</span>
            <strong>${escapeHtml(guide.cloudAlternative.label)}</strong>
            <p>${escapeHtml(guide.cloudAlternative.note)}</p>
            <a href="${escapeHtml(guide.cloudAlternative.url)}" target="_blank" rel="noopener">Abrir ${escapeHtml(guide.cloudAlternative.label)} <i class="fas fa-arrow-up-right-from-square"></i></a>
        </div>
    ` : '';

    const commonErrors = guide.commonErrors?.length ? `
        <section class="install-guide-section">
            <h4><i class="fas fa-triangle-exclamation"></i> Errores comunes</h4>
            <div class="install-errors">
                ${guide.commonErrors.map(error => `
                    <div class="install-error">
                        <strong>${escapeHtml(error.problem)}</strong>
                        <p>${escapeHtml(error.solution)}</p>
                    </div>
                `).join('')}
            </div>
        </section>
    ` : '';

    const security = guide.security?.length ? `
        <section class="install-guide-section install-security">
            <h4><i class="fas fa-shield-halved"></i> Seguridad</h4>
            <ul>${guide.security.map(item => `<li>${escapeHtml(item)}</li>`).join('')}</ul>
        </section>
    ` : '';

    body.innerHTML = `
        <div class="install-guide-detail">
            <div class="install-guide-detail-head">
                <span class="install-guide-logo install-guide-logo-large${guide.logoDark ? ' has-dark-logo' : ''}">
                    <img class="db-logo-light" src="${escapeHtml(guide.logo)}" alt="${escapeHtml(guide.name)}">
                    ${guide.logoDark ? `<img class="db-logo-dark" src="${escapeHtml(guide.logoDark)}" alt="" aria-hidden="true">` : ''}
                </span>
                <div class="install-guide-detail-copy">
                    <span class="install-guide-eyebrow">${escapeHtml(guide.type)} · ${escapeHtml(guide.difficulty)}</span>
                    <h3>${escapeHtml(guide.name)}</h3>
                    <p>${escapeHtml(guide.summary)}</p>
                    <div class="install-guide-detail-meta">
                        <span><i class="fas fa-clock"></i> ${escapeHtml(guide.time)}</span>
                        <span>Revisado: ${escapeHtml(guide.lastReviewed)}</span>
                    </div>
                </div>
            </div>

            ${cloud}
            ${osTabs}
            ${steps}
            ${verify}
            ${notes}
            ${clients}
            ${commonErrors}
            ${security}

            <div class="install-guide-footer">
                <a href="${escapeHtml(guide.officialUrl)}" target="_blank" rel="noopener">
                    <i class="fas fa-download"></i> Descarga oficial
                </a>
                <a href="${escapeHtml(guide.docsUrl)}" target="_blank" rel="noopener">
                    <i class="fas fa-book"></i> Documentación
                </a>
                <span><i class="fas fa-calendar"></i> Última revisión: ${escapeHtml(guide.lastReviewed)}</span>
            </div>
        </div>
    `;
}

function openInstallGuide(id, pathId = '') {
    const guide = window.INSTALL_GUIDES?.[id];
    if (!guide) return;
    currentInstallGuideId = id;
    const requestedPath = pathId ? guide.paths.find(path => path.id === pathId) : null;
    const activePath = requestedPath || guide.paths.find(path => path.recommended) || guide.paths[0];
    currentInstallPathId = activePath?.id || null;
    renderInstallGuide();
    const modal = document.getElementById('installGuideModal');
    if (modal && !modal.classList.contains('active')) openModal(modal);
}

function selectInstallOs(pathId) {
    const guide = getActiveInstallGuide();
    if (!guide || !guide.paths.some(path => path.id === pathId)) return;
    currentInstallPathId = pathId;
    renderInstallGuide();
}

async function copyInstallCommand(button) {
    const code = button?.dataset.copyCode || '';
    if (!code) return;
    try {
        await copyTextToClipboard(code);
        showToast('success', 'Comando copiado.');
    } catch (error) {
        showToast('error', 'No se pudo copiar el comando.');
    }
}

function openInstallFromDBInfo(dbKey) {
    closeDBModal();
    openInstallGuide(dbKey);
}

function closeInstallGuide() {
    currentInstallGuideId = null;
    currentInstallPathId = null;
    closeModal(document.getElementById('installGuideModal'));
}

function openConceptLibrary() {
    activateSection('learn');
    activateLearnTab('concepts');
    const search = document.getElementById('conceptSearch');
    if (search) search.value = '';
    setConceptFilter('all');
    const section = document.getElementById('section-learn');
    if (section && typeof section.scrollIntoView === 'function') {
        section.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
}

function toggleMotorFinder() {
    const body = document.getElementById('motorFinderBody');
    const button = document.getElementById('motorFinderToggle');
    if (!body || !button) return;
    body.hidden = !body.hidden;
    button.innerHTML = body.hidden
        ? 'Abrir asistente <i class="fas fa-chevron-down"></i>'
        : 'Cerrar asistente <i class="fas fa-chevron-up"></i>';
    if (!body.hidden) {
        const first = body.querySelector('select');
        if (first) first.focus();
    }
}

function getMotorRecommendation(answers) {
    const make = (id, name, reason, avoid) => ({ id, name, reason, avoid });

    if (answers.type === 'graph') {
        return make('neo4j', 'Neo4j', 'Modela nodos y relaciones de forma nativa. Es la opción natural si las conexiones son el centro del problema.', 'Si tus datos son tablas simples y no necesitas recorridos profundos.');
    }
    if (answers.type === 'search') {
        return make('elasticsearch', 'Elasticsearch', 'Está pensado para búsqueda de texto, filtros y analítica sobre grandes volúmenes.', 'Si necesitas transacciones estrictas o eres la fuente de verdad principal.');
    }
    if (answers.type === 'keyvalue') {
        return make('redis', 'Redis', 'Es rapidísimo para caché, sesiones, contadores y datos efímeros.', 'Si necesitas consultas relacionales complejas o agregaciones pesadas.');
    }
    if (answers.type === 'documents') {
        if (answers.realtime === 'yes') {
            return make('firebase', 'Firebase', 'Combina documentos flexibles con sincronización en tiempo real y una integración sencilla.', 'Si necesitas consultas relacionales complejas o control total del backend.');
        }
        return make('mongodb', 'MongoDB', 'Documentos flexibles, buen encaje para perfiles, catálogos y contenido semiestructurado.', 'Si el modelo es muy relacional y necesitas JOINs y transacciones complejas.');
    }
    if (answers.realtime === 'yes') {
        return make('firebase', 'Firebase', 'Sincronización instantánea y documentos flexibles para apps colaborativas.', 'Si necesitas transacciones estrictas o un esquema muy relacional.');
    }
    if (answers.transactions === 'yes') {
        return make('postgresql', 'PostgreSQL', 'Relacional, robusto, con ACID, tipos avanzados y un ecosistema muy completo.', 'Si buscas principalmente caché o una escala horizontal extrema sin operaciones relacionales.');
    }
    if (answers.scale === 'yes') {
        return make('cassandra', 'Cassandra', 'Diseñada para alta disponibilidad y escala horizontal con cargas distribuidas.', 'Si necesitas transacciones complejas o consultas ad hoc muy flexibles.');
    }
    return make('mysql', 'MySQL', 'Una opción relacional muy extendida, sencilla de operar y con buen rendimiento general.', 'Si necesitas características avanzadas de PostgreSQL o modelado documental.');
}

function recommendMotor() {
    const result = document.getElementById('motorFinderResult');
    if (!result) return;
    const answers = {
        type: document.getElementById('motorFinderType')?.value || 'structured',
        transactions: document.getElementById('motorFinderTransactions')?.value || 'yes',
        scale: document.getElementById('motorFinderScale')?.value || 'no',
        realtime: document.getElementById('motorFinderRealtime')?.value || 'no'
    };
    const recommendation = getMotorRecommendation(answers);
    const darkLogos = {
        mysql: 'assets/logos/mysql-dark.png',
        sqlite: 'assets/logos/sqlite-dark.png'
    };
    const darkLogo = darkLogos[recommendation.id] || '';
    result.hidden = false;
    result.innerHTML = `
        <div class="motor-result-card">
            <span class="motor-result-logo${darkLogo ? ' has-dark-logo' : ''}">
                <img class="db-logo-light" src="assets/logos/${recommendation.id}.png" alt="${escapeHtml(recommendation.name)}">
                ${darkLogo ? `<img class="db-logo-dark" src="${darkLogo}" alt="" aria-hidden="true">` : ''}
            </span>
            <div class="motor-result-copy">
                <span class="motor-result-eyebrow">Recomendación</span>
                <h3>${escapeHtml(recommendation.name)}</h3>
                <p>${escapeHtml(recommendation.reason)}</p>
                <p class="motor-result-avoid"><strong>Cuidado:</strong> ${escapeHtml(recommendation.avoid)}</p>
            </div>
            <button type="button" class="btn-secondary" onclick="openDBInfo('${recommendation.id}')">
                Ver ficha <i class="fas fa-arrow-right"></i>
            </button>
        </div>
    `;
    if (typeof result.scrollIntoView === 'function') {
        result.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
}

function getConceptDiagram(key) {
    const diagrams = {
        mer: `
            <div class="concept-diagram diagram-mer">
                <div class="diagram-entity"><strong>Estudiante</strong><span>id · nombre</span></div>
                <span class="diagram-relation">1 : N</span>
                <div class="diagram-entity"><strong>Curso</strong><span>id · nombre</span></div>
            </div>
        `,
        normalizacion: `
            <div class="concept-diagram diagram-normalization">
                <div class="diagram-panel"><span>Antes</span><strong>Estudiantes + cursos</strong><small>datos repetidos</small></div>
                <i class="fas fa-arrow-right diagram-arrow"></i>
                <div class="diagram-panel"><span>Después</span><strong>Estudiantes / Cursos</strong><small>sin redundancia</small></div>
            </div>
        `,
        llaves: `
            <div class="concept-diagram diagram-keys">
                <div class="diagram-key-row"><span class="diagram-pk">PK</span> estudiantes.id</div>
                <div class="diagram-key-row"><span class="diagram-fk">FK</span> inscripciones.estudiante_id</div>
                <div class="diagram-key-row"><span class="diagram-unique">UQ</span> estudiantes.email</div>
            </div>
        `,
        sql: `
            <div class="concept-diagram diagram-sql-groups">
                <span class="diagram-chip chip-blue">DDL</span>
                <span class="diagram-chip chip-green">DML</span>
                <span class="diagram-chip chip-amber">DCL</span>
                <span class="diagram-chip chip-violet">TCL</span>
            </div>
        `,
        acid: `
            <div class="concept-diagram diagram-acid">
                <div><strong>A</strong><span>Atomicidad</span></div>
                <div><strong>C</strong><span>Consistencia</span></div>
                <div><strong>I</strong><span>Aislamiento</span></div>
                <div><strong>D</strong><span>Durabilidad</span></div>
            </div>
        `,
        indices: `
            <div class="concept-diagram diagram-index">
                <div class="diagram-index-row"><span>Sin índice</span><strong>1000 filas</strong></div>
                <div class="diagram-index-row"><span>Con índice</span><strong>3 saltos</strong></div>
            </div>
        `,
        joins: `
            <div class="concept-diagram diagram-join">
                <div class="diagram-join-circle"><span>A</span><span>B</span></div>
                <p>INNER JOIN = intersección</p>
            </div>
        `,
        nosql: `
            <div class="concept-diagram diagram-nosql-types">
                <span>Documentos</span>
                <span>Clave-Valor</span>
                <span>Columnas</span>
                <span>Grafos</span>
            </div>
        `,
        documentales: `
            <div class="concept-diagram diagram-json">
                <pre><code>{
  "nombre": "Ana",
  "cursos": ["SQL", "NoSQL"]
}</code></pre>
            </div>
        `,
        'clave-valor': `
            <div class="concept-diagram diagram-kv">
                <span>user:123</span>
                <i class="fas fa-arrow-right"></i>
                <strong>{ nombre: "Ana" }</strong>
            </div>
        `,
        columnas: `
            <div class="concept-diagram diagram-columns">
                <div class="diagram-row-view"><span>fila 1</span><span>fila 2</span><span>fila 3</span></div>
                <div class="diagram-column-view"><span>col A</span><span>col B</span></div>
            </div>
        `,
        grafos: `
            <div class="concept-diagram diagram-graph">
                <span class="diagram-node">Ana</span>
                <span class="diagram-edge">amiga</span>
                <span class="diagram-node">Luis</span>
                <span class="diagram-edge">amigo</span>
                <span class="diagram-node">Eva</span>
            </div>
        `,
        'tiempo-real': `
            <div class="concept-diagram diagram-realtime">
                <span>Cliente A</span>
                <span>Servidor</span>
                <span>Cliente B</span>
                <i class="fas fa-arrows-rotate"></i>
            </div>
        `,
        cap: `
            <div class="concept-diagram diagram-cap">
                <div class="diagram-cap-triangle">
                    <span class="cap-c">C</span>
                    <span class="cap-a">A</span>
                    <span class="cap-p">P</span>
                </div>
                <p>Ante una partición: CP o AP</p>
            </div>
        `
    };
    return diagrams[key] || '';
}

function copyConceptExample(key) {
    const info = conceptInfo[key];
    if (!info) return;
    copyTextToClipboard(info.ejemplo)
        .then(() => showToast('success', 'Ejemplo copiado al portapapeles.'))
        .catch(() => showToast('error', 'No se pudo copiar el ejemplo.'));
}

function practiceConcept(key) {
    const practice = conceptPractices[key];
    if (!practice) return;
    closeConceptModal();

    if (practice.type === 'analyze') {
        activateSection('analyze');
        generateDiagram();
        setTimeout(() => {
            const diagram = document.getElementById('diagramContainer');
            if (diagram && typeof diagram.scrollIntoView === 'function') {
                diagram.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
        }, 60);
        return;
    }
    if (practice.type === 'lesson') {
        openLearningPath();
        selectLearningLesson(practice.lessonId);
        return;
    }
    if (practice.type === 'challenge') {
        openSQLChallenges();
        openChallenge(practice.challengeId);
        return;
    }
    if (practice.type === 'nosql') {
        activateSection('nosql');
        return;
    }
    activateSection('practice');
}

function getConceptQuizOptions(question) {
    const options = question.options.map((text, index) => ({
        text,
        correct: index === question.answer
    }));
    const seed = Array.from(question.question)
        .reduce((total, character) => total + character.charCodeAt(0), 0);
    const offset = seed % options.length;
    const rotated = options.slice(offset).concat(options.slice(0, offset));
    return {
        options: rotated.map(option => option.text),
        answer: rotated.findIndex(option => option.correct)
    };
}

function submitConceptQuiz(event, key) {
    event.preventDefault();
    const info = conceptInfo[key];
    const quiz = conceptQuizzes[key] || [];
    const form = event.target;
    const result = document.getElementById('conceptQuizResult');
    if (!info || !quiz.length || !result) return;

    let correct = 0;
    const correctAnswers = [];
    quiz.forEach((question, index) => {
        const quizOptions = getConceptQuizOptions(question);
        const selected = form.querySelector(`input[name="q${index}"]:checked`);
        const value = selected ? Number(selected.value) : -1;
        if (value === quizOptions.answer) correct += 1;
        correctAnswers.push(quizOptions.options[quizOptions.answer]);
    });

    if (correct === quiz.length) {
        const wasCompleted = isConceptCompleted(key);
        markConceptCompleted(key);
        const status = document.getElementById('conceptModalStatus');
        if (status) {
            status.className = 'concept-modal-status is-complete';
            status.innerHTML = '<i class="fas fa-check"></i> Dominado';
        }
        result.className = 'concept-quiz-result is-success';
        result.innerHTML = `
            <strong><i class="fas fa-circle-check"></i> ¡Concepto dominado!</strong>
            <p>Has acertado las ${quiz.length} preguntas. ${wasCompleted ? 'Ya estaba guardado en tu progreso.' : 'Se ha guardado en tu progreso.'}</p>
        `;
        return;
    }

    result.className = 'concept-quiz-result is-error';
    result.innerHTML = `
        <strong><i class="fas fa-circle-xmark"></i> Has acertado ${correct} de ${quiz.length}</strong>
        <p>Revisa el contenido e inténtalo de nuevo.</p>
        <details>
            <summary>Ver respuestas correctas</summary>
            <ul>${correctAnswers.map(answer => `<li>${escapeHtml(answer)}</li>`).join('')}</ul>
        </details>
    `;
}

function openConcept(conceptKey) {
    const info = conceptInfo[conceptKey];
    if (!info) return;

    const modal = document.getElementById('conceptModal');
    const title = document.getElementById('conceptModalTitle');
    const body = document.getElementById('conceptModalBody');
    if (!modal || !title || !body) return;

    const completed = isConceptCompleted(conceptKey);
    const practice = conceptPractices[conceptKey];
    const related = (conceptRelated[conceptKey] || []).filter(key => conceptInfo[key]);
    const mistakes = conceptMistakes[conceptKey] || [];
    const quiz = conceptQuizzes[conceptKey] || [];
    const diagram = getConceptDiagram(conceptKey);

    title.innerHTML = `<i class="fas fa-${info.icon}"></i> ${escapeHtml(info.title)}`;
    body.innerHTML = `
        <div class="concept-modal-meta">
            <span class="challenge-level ${getConceptLevelClass(info.level)}">${escapeHtml(info.level)}</span>
            ${info.tags.map(tag => `<span class="concept-tag ${tag === 'SQL' ? 'sql-tag' : tag === 'NoSQL' ? 'nosql-tag' : ''}">${escapeHtml(tag)}</span>`).join('')}
            <span id="conceptModalStatus" class="concept-modal-status ${completed ? 'is-complete' : ''}">
                ${completed ? '<i class="fas fa-check"></i> Dominado' : 'Pendiente de quiz'}
            </span>
        </div>
        <p class="concept-modal-description">${escapeHtml(info.description)}</p>
        ${diagram ? `<div class="concept-diagram-wrap">${diagram}</div>` : ''}
        <h3><i class="fas fa-list"></i> Conceptos clave</h3>
        <ul class="concept-modal-list">${info.conceptos.map(item => `<li>${escapeHtml(item)}</li>`).join('')}</ul>
        <h3><i class="fas fa-lightbulb"></i> Ejemplo práctico</h3>
        <div class="concept-example">
            <pre><code>${escapeHtml(info.ejemplo)}</code></pre>
            <button type="button" class="btn-secondary btn-sm" onclick="copyConceptExample('${conceptKey}')">
                <i class="fas fa-copy"></i> Copiar ejemplo
            </button>
        </div>
        ${mistakes.length ? `
            <h3><i class="fas fa-triangle-exclamation"></i> Errores comunes</h3>
            <ul class="concept-mistakes">${mistakes.map(item => `<li>${escapeHtml(item)}</li>`).join('')}</ul>
        ` : ''}
        <div class="concept-modal-actions">
            ${practice ? `
                <button type="button" class="btn-primary" onclick="practiceConcept('${conceptKey}')">
                    <i class="fas ${practice.icon || 'fa-play'}"></i> ${escapeHtml(practice.label)}
                </button>
            ` : ''}
        </div>
        <div class="concept-quiz">
            <h3><i class="fas fa-circle-question"></i> Mini-quiz</h3>
            <p class="concept-quiz-intro">Responde las dos preguntas para marcar el concepto como dominado.</p>
            <form class="concept-quiz-form" onsubmit="submitConceptQuiz(event, '${conceptKey}')">
                ${quiz.map((question, questionIndex) => {
                    const quizOptions = getConceptQuizOptions(question);
                    return `
                        <fieldset class="concept-quiz-question">
                            <legend>${questionIndex + 1}. ${escapeHtml(question.question)}</legend>
                            ${quizOptions.options.map((option, optionIndex) => `
                                <label class="concept-quiz-option">
                                    <input type="radio" name="q${questionIndex}" value="${optionIndex}">
                                    <span>${escapeHtml(option)}</span>
                                </label>
                            `).join('')}
                        </fieldset>
                    `;
                }).join('')}
                <button type="submit" class="btn-primary">
                    <i class="fas fa-check"></i> Comprobar respuestas
                </button>
            </form>
            <div id="conceptQuizResult" class="concept-quiz-result" role="status" aria-live="polite"></div>
        </div>
        ${related.length ? `
            <div class="concept-related">
                <span>Conceptos relacionados</span>
                <div>${related.map(key => `<button type="button" onclick="openConcept('${key}')">${escapeHtml(conceptInfo[key].title)}</button>`).join('')}</div>
            </div>
        ` : ''}
    `;

    openModal(modal);
}

function closeConceptModal() {
    closeModal(document.getElementById('conceptModal'));
}

function initLearnLibrary() {
    loadConceptProgress();
    updateConceptProgressUI();
    if (learnLibraryInitialized) return;
    learnLibraryInitialized = true;

    document.querySelectorAll('.learn-tab').forEach(tab => {
        tab.addEventListener('click', () => activateLearnTab(tab.dataset.learnTab));
        tab.addEventListener('keydown', event => {
            if (event.key !== 'ArrowRight' && event.key !== 'ArrowLeft') return;
            const tabs = Array.from(document.querySelectorAll('.learn-tab'));
            const index = tabs.indexOf(tab);
            if (index === -1) return;
            event.preventDefault();
            const offset = event.key === 'ArrowRight' ? 1 : -1;
            const nextTab = tabs[(index + offset + tabs.length) % tabs.length];
            nextTab.focus();
            activateLearnTab(nextTab.dataset.learnTab);
        });
    });

    renderInstallGuides();
    activateLearnTab('guides');
    setGuideFilter('all');
    setConceptFilter('all');
    setInstallFilter('all');
}

// ============================================
// RETOS
// ============================================

const challengeCatalog = [
    {
        id: 'basico-01',
        titulo: 'Primer contacto',
        nivel: 'basico',
        descripcion: 'Muestra todos los estudiantes de la tabla estudiantes.',
        pista: 'Usa SELECT * FROM estudiantes; para ver todas las columnas y filas.',
        sqlEsperado: 'SELECT * FROM estudiantes;',
        ordenada: false
    },
    {
        id: 'filtro-01',
        titulo: 'Solo Ingeniería',
        nivel: 'basico',
        descripcion: 'Muestra el nombre y la carrera de los estudiantes cuya carrera sea Ingenieria.',
        pista: 'Combina SELECT nombre, carrera con un WHERE carrera = \'Ingenieria\'.',
        sqlEsperado: "SELECT nombre, carrera FROM estudiantes WHERE carrera = 'Ingenieria';",
        ordenada: false
    },
    {
        id: 'orden-01',
        titulo: 'Top 5 promedios',
        nivel: 'intermedio',
        descripcion: 'Muestra el nombre y el promedio de los 5 estudiantes con mejor promedio. Ordena de mayor a menor y desempata por nombre ascendente.',
        pista: 'Usa ORDER BY promedio DESC, nombre ASC y LIMIT 5.',
        sqlEsperado: 'SELECT nombre, promedio FROM estudiantes ORDER BY promedio DESC, nombre ASC LIMIT 5;',
        ordenada: true
    },
    {
        id: 'agregacion-01',
        titulo: 'Estudiantes por carrera',
        nivel: 'intermedio',
        descripcion: 'Muestra cada carrera y la cantidad de estudiantes que tiene. Ordena alfabéticamente por carrera.',
        pista: 'Agrupa con GROUP BY carrera y cuenta con COUNT(*).',
        sqlEsperado: 'SELECT carrera, COUNT(*) AS cantidad FROM estudiantes GROUP BY carrera ORDER BY carrera ASC;',
        ordenada: true
    },
    {
        id: 'join-01',
        titulo: 'Estudiantes y sus cursos',
        nivel: 'intermedio',
        descripcion: 'Muestra el nombre del estudiante y el nombre del curso de todas las inscripciones. Ordena por nombre del estudiante y luego por nombre del curso.',
        pista: 'Une estudiantes con inscripciones y luego con cursos usando JOIN.',
        sqlEsperado: 'SELECT e.nombre AS estudiante, c.nombre AS curso FROM estudiantes e JOIN inscripciones i ON e.id = i.estudiante_id JOIN cursos c ON i.curso_id = c.id ORDER BY e.nombre ASC, c.nombre ASC;',
        ordenada: true
    },
    {
        id: 'subconsulta-01',
        titulo: 'Por encima del promedio',
        nivel: 'avanzado',
        descripcion: 'Muestra el nombre y el promedio de los estudiantes cuyo promedio sea mayor al promedio general. Ordena por promedio descendente y nombre ascendente.',
        pista: 'Compara promedio con una subconsulta: (SELECT AVG(promedio) FROM estudiantes).',
        sqlEsperado: 'SELECT nombre, promedio FROM estudiantes WHERE promedio > (SELECT AVG(promedio) FROM estudiantes) ORDER BY promedio DESC, nombre ASC;',
        ordenada: true
    },
    {
        id: 'having-01',
        titulo: 'Carreras con más alumnos',
        nivel: 'avanzado',
        descripcion: 'Muestra las carreras con 5 o más estudiantes y su cantidad. Ordena por cantidad descendente y luego por carrera ascendente.',
        pista: 'Usa GROUP BY carrera y filtra el agregado con HAVING COUNT(*) >= 5.',
        sqlEsperado: 'SELECT carrera, COUNT(*) AS cantidad FROM estudiantes GROUP BY carrera HAVING COUNT(*) >= 5 ORDER BY cantidad DESC, carrera ASC;',
        ordenada: true
    },
    {
        id: 'join-02',
        titulo: 'Cursos e inscritos',
        nivel: 'avanzado',
        descripcion: 'Muestra el nombre de cada curso y cuántas inscripciones tiene, incluyendo cursos con cero inscritos. Ordena por inscritos descendente y nombre del curso ascendente.',
        pista: 'Usa LEFT JOIN desde cursos hacia inscripciones y COUNT(i.id).',
        sqlEsperado: 'SELECT c.nombre, COUNT(i.id) AS inscritos FROM cursos c LEFT JOIN inscripciones i ON c.id = i.curso_id GROUP BY c.id, c.nombre ORDER BY inscritos DESC, c.nombre ASC;',
        ordenada: true
    }
];


const debugChallengeCatalogByDataset = {
    escuela: [
        {
            id: 'debug-escuela-having',
            titulo: 'Filtra grupos, no filas',
            nivel: 'intermedio',
            descripcion: 'Muestra las carreras con 5 o más estudiantes y su total. Ordena por total descendente y luego por carrera ascendente.',
            brokenSql: `SELECT carrera, COUNT(*) AS total
FROM estudiantes
GROUP BY carrera
WHERE COUNT(*) >= 5
ORDER BY total DESC, carrera ASC;`,
            problema: 'SQLite lanza un error de sintaxis: WHERE no puede filtrar el resultado de COUNT(*) porque se ejecuta antes de agrupar.',
            pista: 'Cambia WHERE por HAVING.',
            sqlEsperado: `SELECT carrera, COUNT(*) AS total
FROM estudiantes
GROUP BY carrera
HAVING COUNT(*) >= 5
ORDER BY total DESC, carrera ASC;`,
            ordenada: true
        },
        {
            id: 'debug-escuela-join',
            titulo: 'El JOIN sin condición',
            nivel: 'intermedio',
            descripcion: 'Muestra el nombre del estudiante, el nombre del curso y la nota de cada inscripción. Ordena por estudiante y curso.',
            brokenSql: `SELECT e.nombre AS estudiante, c.nombre AS curso, i.nota
FROM estudiantes e
JOIN inscripciones i
JOIN cursos c
ORDER BY e.nombre ASC, c.nombre ASC;`,
            problema: 'La consulta devuelve muchísimas combinaciones: los JOIN no tienen condición ON y se está generando un producto cartesiano.',
            pista: 'Añade ON e.id = i.estudiante_id y ON i.curso_id = c.id.',
            sqlEsperado: `SELECT e.nombre AS estudiante, c.nombre AS curso, i.nota
FROM estudiantes e
JOIN inscripciones i ON e.id = i.estudiante_id
JOIN cursos c ON i.curso_id = c.id
ORDER BY e.nombre ASC, c.nombre ASC;`,
            ordenada: true
        },
        {
            id: 'debug-escuela-group',
            titulo: 'Falta una columna en GROUP BY',
            nivel: 'avanzado',
            descripcion: 'Cuenta cuántos estudiantes hay por carrera y ciudad. Ordena por total descendente y luego por carrera y ciudad.',
            brokenSql: `SELECT carrera, ciudad, COUNT(*) AS total
FROM estudiantes
GROUP BY carrera
ORDER BY total DESC, carrera ASC, ciudad ASC;`,
            problema: 'La consulta se ejecuta, pero muestra una ciudad arbitraria por carrera porque ciudad no está en GROUP BY.',
            pista: 'Agrupa por carrera y ciudad.',
            sqlEsperado: `SELECT carrera, ciudad, COUNT(*) AS total
FROM estudiantes
GROUP BY carrera, ciudad
ORDER BY total DESC, carrera ASC, ciudad ASC;`,
            ordenada: true
        },
        {
            id: 'debug-escuela-subquery',
            titulo: 'Un agregado dentro de WHERE',
            nivel: 'avanzado',
            descripcion: 'Muestra los estudiantes con promedio superior al promedio general. Ordena por promedio descendente y nombre ascendente.',
            brokenSql: `SELECT nombre, promedio
FROM estudiantes
WHERE promedio > AVG(promedio)
ORDER BY promedio DESC, nombre ASC;`,
            problema: 'SQLite lanza misuse of aggregate function AVG(): no se puede usar AVG() directamente en un WHERE.',
            pista: 'Compara promedio con una subconsulta: (SELECT AVG(promedio) FROM estudiantes).',
            sqlEsperado: `SELECT nombre, promedio
FROM estudiantes
WHERE promedio > (SELECT AVG(promedio) FROM estudiantes)
ORDER BY promedio DESC, nombre ASC;`,
            ordenada: true
        }
    ],
    tienda: [
        {
            id: 'debug-tienda-having',
            titulo: 'Filtra estados después de agrupar',
            nivel: 'intermedio',
            descripcion: 'Muestra los estados de pedido con más de dos pedidos y su total. Ordena por total descendente y estado ascendente.',
            brokenSql: `SELECT estado, COUNT(*) AS total
FROM pedidos
GROUP BY estado
WHERE COUNT(*) > 2
ORDER BY total DESC, estado ASC;`,
            problema: 'SQLite lanza un error de sintaxis: WHERE no puede filtrar COUNT(*).',
            pista: 'Cambia WHERE por HAVING.',
            sqlEsperado: `SELECT estado, COUNT(*) AS total
FROM pedidos
GROUP BY estado
HAVING COUNT(*) > 2
ORDER BY total DESC, estado ASC;`,
            ordenada: true
        },
        {
            id: 'debug-tienda-join',
            titulo: 'Pedidos y clientes sin relación',
            nivel: 'intermedio',
            descripcion: 'Muestra el nombre del cliente, la fecha y el estado de cada pedido. Ordena por fecha.',
            brokenSql: `SELECT c.nombre, p.fecha, p.estado
FROM pedidos p
JOIN clientes c
ORDER BY p.fecha ASC;`,
            problema: 'La consulta devuelve combinaciones que no existen: el JOIN no tiene condición ON.',
            pista: 'Añade ON p.cliente_id = c.id.',
            sqlEsperado: `SELECT c.nombre, p.fecha, p.estado
FROM pedidos p
JOIN clientes c ON p.cliente_id = c.id
ORDER BY p.fecha ASC;`,
            ordenada: true
        },
        {
            id: 'debug-tienda-sum',
            titulo: 'Cuenta filas o suma unidades',
            nivel: 'avanzado',
            descripcion: 'Muestra los 3 productos con más unidades vendidas. Ordena por unidades descendente y nombre ascendente.',
            brokenSql: `SELECT pr.nombre, COUNT(d.cantidad) AS unidades
FROM detalle_pedidos d
JOIN productos pr ON pr.id = d.producto_id
GROUP BY pr.id, pr.nombre
ORDER BY unidades DESC, pr.nombre ASC
LIMIT 3;`,
            problema: 'COUNT cuenta líneas de pedido, no la cantidad de unidades vendidas.',
            pista: 'Cambia COUNT por SUM.',
            sqlEsperado: `SELECT pr.nombre, SUM(d.cantidad) AS unidades
FROM detalle_pedidos d
JOIN productos pr ON pr.id = d.producto_id
GROUP BY pr.id, pr.nombre
ORDER BY unidades DESC, pr.nombre ASC
LIMIT 3;`,
            ordenada: true
        },
        {
            id: 'debug-tienda-group',
            titulo: 'Producto arbitrario por categoría',
            nivel: 'avanzado',
            descripcion: 'Cuenta cuántos productos hay por categoría y nombre. Ordena por total descendente y luego por categoría y nombre.',
            brokenSql: `SELECT categoria, nombre, COUNT(*) AS total
FROM productos
GROUP BY categoria
ORDER BY total DESC, categoria ASC, nombre ASC;`,
            problema: 'La consulta se ejecuta, pero muestra un producto arbitrario por categoría porque nombre no está en GROUP BY.',
            pista: 'Agrupa por categoria y nombre.',
            sqlEsperado: `SELECT categoria, nombre, COUNT(*) AS total
FROM productos
GROUP BY categoria, nombre
ORDER BY total DESC, categoria ASC, nombre ASC;`,
            ordenada: true
        }
    ],
    biblioteca: [
        {
            id: 'debug-biblioteca-having',
            titulo: 'Filtra géneros después de agrupar',
            nivel: 'intermedio',
            descripcion: 'Muestra los géneros con más de un libro y su total. Ordena por total descendente y género ascendente.',
            brokenSql: `SELECT genero, COUNT(*) AS total
FROM libros
GROUP BY genero
WHERE COUNT(*) > 1
ORDER BY total DESC, genero ASC;`,
            problema: 'SQLite lanza un error de sintaxis: WHERE no puede filtrar COUNT(*).',
            pista: 'Cambia WHERE por HAVING.',
            sqlEsperado: `SELECT genero, COUNT(*) AS total
FROM libros
GROUP BY genero
HAVING COUNT(*) > 1
ORDER BY total DESC, genero ASC;`,
            ordenada: true
        },
        {
            id: 'debug-biblioteca-join',
            titulo: 'Libros y autores sin relación',
            nivel: 'intermedio',
            descripcion: 'Muestra el título de cada libro y el nombre de su autor. Ordena por título.',
            brokenSql: `SELECT l.titulo, a.nombre
FROM libros l
JOIN autores a
ORDER BY l.titulo ASC;`,
            problema: 'La consulta devuelve combinaciones que no existen: el JOIN no tiene condición ON.',
            pista: 'Añade ON l.autor_id = a.id.',
            sqlEsperado: `SELECT l.titulo, a.nombre
FROM libros l
JOIN autores a ON l.autor_id = a.id
ORDER BY l.titulo ASC;`,
            ordenada: true
        },
        {
            id: 'debug-biblioteca-subquery',
            titulo: 'Promedio dentro de WHERE',
            nivel: 'avanzado',
            descripcion: 'Muestra los libros publicados después del año medio. Ordena por año descendente y título ascendente.',
            brokenSql: `SELECT titulo, anio
FROM libros
WHERE anio > AVG(anio)
ORDER BY anio DESC, titulo ASC;`,
            problema: 'SQLite lanza misuse of aggregate function AVG(): no se puede usar AVG() directamente en un WHERE.',
            pista: 'Usa una subconsulta: (SELECT AVG(anio) FROM libros).',
            sqlEsperado: `SELECT titulo, anio
FROM libros
WHERE anio > (SELECT AVG(anio) FROM libros)
ORDER BY anio DESC, titulo ASC;`,
            ordenada: true
        },
        {
            id: 'debug-biblioteca-group',
            titulo: 'Disponibilidad arbitraria por género',
            nivel: 'avanzado',
            descripcion: 'Cuenta cuántos libros hay por género y disponibilidad. Ordena por total descendente y luego por género y disponibilidad.',
            brokenSql: `SELECT genero, disponible, COUNT(*) AS total
FROM libros
GROUP BY genero
ORDER BY total DESC, genero ASC, disponible ASC;`,
            problema: 'La consulta se ejecuta, pero muestra un valor arbitrario de disponible por género porque disponible no está en GROUP BY.',
            pista: 'Agrupa por genero y disponible.',
            sqlEsperado: `SELECT genero, disponible, COUNT(*) AS total
FROM libros
GROUP BY genero, disponible
ORDER BY total DESC, genero ASC, disponible ASC;`,
            ordenada: true
        }
    ]
};

const challengeCatalogByDataset = {
    escuela: challengeCatalog,
    tienda: [
        {
            id: 'tienda-stock-01',
            titulo: 'Productos con stock bajo',
            nivel: 'basico',
            descripcion: 'Muestra el nombre, la categoria y el stock de los productos con 10 unidades o menos. Ordena por stock ascendente y luego por nombre ascendente.',
            pista: 'Usa WHERE stock <= 10 y ORDER BY stock ASC, nombre ASC.',
            sqlEsperado: 'SELECT nombre, categoria, stock FROM productos WHERE stock <= 10 ORDER BY stock ASC, nombre ASC;',
            ordenada: true
        },
        {
            id: 'tienda-clientes-01',
            titulo: 'Clientes de Lima y Arequipa',
            nivel: 'basico',
            descripcion: 'Muestra el nombre y la ciudad de los clientes de Lima o Arequipa. Ordena por ciudad ascendente y luego por nombre ascendente.',
            pista: 'Usa el operador IN con las dos ciudades.',
            sqlEsperado: "SELECT nombre, ciudad FROM clientes WHERE ciudad IN ('Lima', 'Arequipa') ORDER BY ciudad ASC, nombre ASC;",
            ordenada: true
        },
        {
            id: 'tienda-estados-01',
            titulo: 'Pedidos por estado',
            nivel: 'intermedio',
            descripcion: 'Muestra cada estado de pedido y cuantos pedidos tiene. Ordena por cantidad descendente y luego por estado ascendente.',
            pista: 'Agrupa con GROUP BY estado y cuenta con COUNT(*).',
            sqlEsperado: 'SELECT estado, COUNT(*) AS pedidos FROM pedidos GROUP BY estado ORDER BY pedidos DESC, estado ASC;',
            ordenada: true
        },
        {
            id: 'tienda-detalle-01',
            titulo: 'Detalle completo de pedidos',
            nivel: 'intermedio',
            descripcion: 'Muestra el id del pedido, el cliente, el producto, la cantidad y el precio unitario de cada linea. Ordena por pedido y luego por producto.',
            pista: 'Une pedidos, clientes, detalle_pedidos y productos.',
            sqlEsperado: 'SELECT p.id AS pedido, c.nombre AS cliente, pr.nombre AS producto, d.cantidad, d.precio_unitario FROM pedidos p JOIN clientes c ON c.id = p.cliente_id JOIN detalle_pedidos d ON d.pedido_id = p.id JOIN productos pr ON pr.id = d.producto_id ORDER BY p.id ASC, pr.nombre ASC;',
            ordenada: true
        },
        {
            id: 'tienda-top-01',
            titulo: 'Top 3 productos vendidos',
            nivel: 'avanzado',
            descripcion: 'Muestra los 3 productos con mas unidades vendidas. Ordena por unidades descendente y, en empate, por nombre ascendente.',
            pista: 'Une detalle_pedidos con productos, agrupa por producto y suma cantidad.',
            sqlEsperado: 'SELECT pr.nombre, SUM(d.cantidad) AS unidades FROM detalle_pedidos d JOIN productos pr ON pr.id = d.producto_id GROUP BY pr.id, pr.nombre ORDER BY unidades DESC, pr.nombre ASC LIMIT 3;',
            ordenada: true
        },
        {
            id: 'tienda-having-01',
            titulo: 'Clientes con mas de un pedido',
            nivel: 'avanzado',
            descripcion: 'Muestra el nombre de los clientes que tienen mas de un pedido y cuantos pedidos tienen. Ordena por cantidad descendente y luego por nombre ascendente.',
            pista: 'Une clientes con pedidos, agrupa y filtra con HAVING COUNT(p.id) > 1.',
            sqlEsperado: 'SELECT c.nombre, COUNT(p.id) AS pedidos FROM clientes c JOIN pedidos p ON p.cliente_id = c.id GROUP BY c.id, c.nombre HAVING COUNT(p.id) > 1 ORDER BY pedidos DESC, c.nombre ASC;',
            ordenada: true
        }
    ],
    biblioteca: [
        {
            id: 'biblioteca-disponibles-01',
            titulo: 'Libros disponibles',
            nivel: 'basico',
            descripcion: 'Muestra el titulo, el genero y el anio de los libros disponibles. Ordena por titulo ascendente.',
            pista: 'Filtra con disponible = 1.',
            sqlEsperado: 'SELECT titulo, genero, anio FROM libros WHERE disponible = 1 ORDER BY titulo ASC;',
            ordenada: true
        },
        {
            id: 'biblioteca-activos-01',
            titulo: 'Prestamos sin devolver',
            nivel: 'basico',
            descripcion: 'Muestra el id del prestamo, el titulo del libro, el socio y la fecha de prestamo de los prestamos sin devolver. Ordena por id ascendente.',
            pista: 'Filtra con fecha_devolucion IS NULL y une libros y socios.',
            sqlEsperado: 'SELECT p.id, l.titulo, s.nombre AS socio, p.fecha_prestamo FROM prestamos p JOIN libros l ON l.id = p.libro_id JOIN socios s ON s.id = p.socio_id WHERE p.fecha_devolucion IS NULL ORDER BY p.id ASC;',
            ordenada: true
        },
        {
            id: 'biblioteca-generos-01',
            titulo: 'Libros por genero',
            nivel: 'intermedio',
            descripcion: 'Muestra cada genero y cuantos libros tiene. Ordena por cantidad descendente y luego por genero ascendente.',
            pista: 'Agrupa con GROUP BY genero y cuenta con COUNT(*).',
            sqlEsperado: 'SELECT genero, COUNT(*) AS libros FROM libros GROUP BY genero ORDER BY libros DESC, genero ASC;',
            ordenada: true
        },
        {
            id: 'biblioteca-autores-01',
            titulo: 'Libros con autor',
            nivel: 'intermedio',
            descripcion: 'Muestra el titulo del libro, el nombre del autor y su pais. Ordena por titulo ascendente.',
            pista: 'Une libros con autores usando autor_id.',
            sqlEsperado: 'SELECT l.titulo, a.nombre AS autor, a.pais FROM libros l JOIN autores a ON a.id = l.autor_id ORDER BY l.titulo ASC;',
            ordenada: true
        },
        {
            id: 'biblioteca-having-01',
            titulo: 'Autores con dos o mas libros',
            nivel: 'avanzado',
            descripcion: 'Muestra el nombre de los autores que tienen dos o mas libros y cuantos libros tienen. Ordena por cantidad descendente y luego por nombre ascendente.',
            pista: 'Une autores con libros, agrupa y filtra con HAVING COUNT(l.id) >= 2.',
            sqlEsperado: 'SELECT a.nombre, COUNT(l.id) AS libros FROM autores a JOIN libros l ON l.autor_id = a.id GROUP BY a.id, a.nombre HAVING COUNT(l.id) >= 2 ORDER BY libros DESC, a.nombre ASC;',
            ordenada: true
        },
        {
            id: 'biblioteca-top-01',
            titulo: 'Top 3 autores por libros',
            nivel: 'avanzado',
            descripcion: 'Muestra los 3 autores con mas libros. Ordena por cantidad descendente y, en empate, por nombre ascendente.',
            pista: 'Usa LEFT JOIN desde autores hacia libros, agrupa y limita a 3.',
            sqlEsperado: 'SELECT a.nombre, COUNT(l.id) AS libros FROM autores a LEFT JOIN libros l ON l.autor_id = a.id GROUP BY a.id, a.nombre ORDER BY libros DESC, a.nombre ASC LIMIT 3;',
            ordenada: true
        }
    ]
};

function getChallengeCatalog(datasetName = preferences.dataset) {
    return challengeCatalogByDataset[datasetName] || challengeCatalog;
}

function getActiveChallengeCatalog() {
    return getChallengeCatalog();
}

let currentChallengeId = null;
let challengeAttempts = 0;
let challengeProgress = {};
let selectedNoSQLChallengeId = null;
let learningPathProgress = {};
let nosqlCourseProgress = {};
let courseAssessment = {};
let currentLearningLessonId = null;
let currentCourseId = null;
let currentCourseView = 'catalog';
let currentLessonStep = 'concept';
let currentCheckpoint = null;
let learningPathEventsBound = false;

function loadChallengeProgress() {
    const stored = readStoredJSON(STORAGE_KEYS.challenges, {});
    challengeProgress = stored && typeof stored === 'object' && !Array.isArray(stored) ? stored : {};
}

function saveChallengeProgress() {
    writeStoredJSON(STORAGE_KEYS.challenges, challengeProgress);
}

function getChallengeById(id) {
    return getActiveChallengeCatalog().find(challenge => challenge.id === id) || null;
}

function getCompletedChallengeCount() {
    return getActiveChallengeCatalog().filter(challenge => challengeProgress[challenge.id]?.completed).length;
}

function renderChallengeProgress() {
    const completed = getCompletedChallengeCount();
    const total = getActiveChallengeCatalog().length;
    const percent = total > 0 ? Math.round((completed / total) * 100) : 0;

    const text = document.getElementById('challengeProgressText');
    const bar = document.getElementById('challengeProgressBar');
    const track = document.getElementById('challengeProgressTrack');
    if (text) text.textContent = `${completed} de ${total}`;
    if (bar) bar.style.width = `${percent}%`;
    if (track) track.setAttribute('aria-valuenow', String(percent));
}

function renderChallengeList() {
    const list = document.getElementById('challengeList');
    if (!list) return;

    list.innerHTML = getActiveChallengeCatalog().map(challenge => {
        const completed = Boolean(challengeProgress[challenge.id]?.completed);
        const active = challenge.id === currentChallengeId;
        return `
            <button type="button" class="challenge-card${completed ? ' completed' : ''}${active ? ' active' : ''}"
                onclick="openChallenge('${challenge.id}')"
                aria-pressed="${active}">
                <span class="challenge-card-title">
                    ${escapeHtml(challenge.titulo)}
                    ${completed ? '<i class="fas fa-circle-check" title="Completado"></i>' : ''}
                </span>
                <span class="challenge-card-meta">
                    <span class="challenge-level ${escapeHtml(challenge.nivel)}">${escapeHtml(challenge.nivel)}</span>
                    ${completed ? '<span>Completado</span>' : '<span>Pendiente</span>'}
                </span>
            </button>
        `;
    }).join('');

    renderChallengeProgress();
}

function renderChallengePlaceholder() {
    const detail = document.getElementById('challengeDetail');
    if (!detail) return;
    detail.innerHTML = `
        <div class="challenge-empty">
            <i class="fas fa-trophy"></i>
            <h3>Elige un reto para empezar</h3>
            <p>Los retos validan el resultado de tu consulta, no el texto exacto. Puedes resolverlos de varias formas.</p>
        </div>
    `;
}

function initChallenges() {
    loadChallengeProgress();
    renderChallengeList();
    renderChallengePlaceholder();
    renderDebugChallengeList();
    renderDebugChallengePlaceholder();
}

function refreshPracticeContentForDataset() {
    renderCategorySelector();
    lastSqlExample = null;

    const exampleStatus = document.getElementById('sqlExampleStatus');
    if (exampleStatus) {
        exampleStatus.textContent = 'Elige una categoría o pulsa «Siguiente ejemplo»';
    }

    currentChallengeId = null;
    challengeAttempts = 0;
    renderChallengeList();
    renderChallengePlaceholder();

    currentDebugChallengeId = null;
    debugChallengeAttempts = 0;
    renderDebugChallengeList();
    renderDebugChallengePlaceholder();

    analyzeSelectedTable = null;
    analyzeExplorerMode = 'view';

    refreshLearningPath({ selectFirst: true });
}

function openChallenge(id) {
    const challenge = getChallengeById(id);
    if (!challenge) return;

    currentChallengeId = id;
    challengeAttempts = 0;
    const detail = document.getElementById('challengeDetail');
    if (!detail) return;

    detail.innerHTML = `
        <div class="challenge-detail-header">
            <div>
                <h3>${escapeHtml(challenge.titulo)}</h3>
                <div class="challenge-detail-meta">
                    <span class="challenge-level ${escapeHtml(challenge.nivel)}">${escapeHtml(challenge.nivel)}</span>
                    <span class="text-muted">Validación por resultado</span>
                </div>
            </div>
        </div>
        <div class="challenge-description">${escapeHtml(challenge.descripcion)}</div>
        <label for="challengeEditor" class="sr-only">Consulta SQL para el reto</label>
        <textarea id="challengeEditor" spellcheck="false" placeholder="Escribe tu consulta SQL aquí..."></textarea>
        <div class="challenge-actions">
            <button type="button" id="challengeRunBtn" onclick="runChallenge()">
                <i class="fas fa-play"></i> Comprobar reto
            </button>
            <button type="button" class="btn-secondary" onclick="showChallengeHint()">
                <i class="fas fa-lightbulb"></i> Ver pista
            </button>
            <button type="button" class="btn-secondary" onclick="clearChallengeEditor()">
                <i class="fas fa-eraser"></i> Limpiar
            </button>
        </div>
        <div id="challengeHint" class="challenge-hint" hidden></div>
        <div id="challengeResult" class="challenge-result" aria-live="polite">
            <strong><i class="fas fa-circle-info"></i> Listo para intentarlo</strong>
            Escribe una consulta de solo lectura (SELECT o WITH) y pulsa “Comprobar reto”.
        </div>
    `;

    renderChallengeList();
    const editor = document.getElementById('challengeEditor');
    if (editor) editor.focus();
}

function clearChallengeEditor() {
    const editor = document.getElementById('challengeEditor');
    if (editor) {
        editor.value = '';
        editor.focus();
    }
}

function showChallengeHint() {
    const challenge = getChallengeById(currentChallengeId);
    const hint = document.getElementById('challengeHint');
    if (!challenge || !hint) return;
    hint.innerHTML = `<strong><i class="fas fa-lightbulb"></i> Pista:</strong> ${escapeHtml(challenge.pista)}`;
    hint.hidden = false;
}

function showChallengeSolution() {
    const challenge = getChallengeById(currentChallengeId);
    const editor = document.getElementById('challengeEditor');
    if (!challenge || !editor) return;
    editor.value = challenge.sqlEsperado;
    editor.focus();
    showToast('info', 'Solución cargada. Ejecútala para comprobar el resultado.');
}

function isReadOnlyQuery(sql) {
    const normalized = stripSqlComments(sql);
    if (!normalized) return false;

    // Sustituye literales antes de buscar puntos y comas o palabras reservadas.
    const withoutStrings = normalized
        .replace(/'(?:''|[^'])*'/g, "''")
        .replace(/"(?:\"\"|[^\"])*"/g, '""');
    const statements = withoutStrings.split(';').map(statement => statement.trim()).filter(Boolean);
    if (statements.length !== 1) return false;
    if (!/^(SELECT|WITH)\b/i.test(statements[0])) return false;

    return !/\b(INSERT|UPDATE|DELETE|DROP|ALTER|CREATE|REPLACE|TRUNCATE|PRAGMA|ATTACH|DETACH|VACUUM)\b/i.test(statements[0]);
}

function firstResultSet(result) {
    return (result || []).find(set => set && Array.isArray(set.columns) && set.columns.length > 0) || null;
}

function normalizeChallengeRows(set) {
    if (!set) return [];
    return set.values.map(row => row.map(value => value === null || value === undefined ? 'NULL' : String(value)));
}

function compareChallengeResults(expected, actual, ordered) {
    const expectedSet = firstResultSet(expected);
    const actualSet = firstResultSet(actual);

    if (!expectedSet) return { ok: false, reason: 'expected_empty' };
    if (!actualSet) return { ok: false, reason: 'no_result' };

    if (expectedSet.columns.length !== actualSet.columns.length) {
        return {
            ok: false,
            reason: 'columns',
            expectedColumns: expectedSet.columns.length,
            actualColumns: actualSet.columns.length
        };
    }

    const expectedRows = normalizeChallengeRows(expectedSet);
    const actualRows = normalizeChallengeRows(actualSet);

    if (expectedRows.length !== actualRows.length) {
        return {
            ok: false,
            reason: 'rows',
            expectedRows: expectedRows.length,
            actualRows: actualRows.length
        };
    }

    const serialize = row => JSON.stringify(row);
    const expectedSerialized = ordered ? expectedRows.map(serialize) : expectedRows.map(serialize).sort();
    const actualSerialized = ordered ? actualRows.map(serialize) : actualRows.map(serialize).sort();

    for (let i = 0; i < expectedSerialized.length; i++) {
        if (expectedSerialized[i] !== actualSerialized[i]) {
            return { ok: false, reason: 'values', row: i + 1 };
        }
    }

    return { ok: true };
}

function setChallengeResult(type, html) {
    const result = document.getElementById('challengeResult');
    if (!result) return;
    result.className = `challenge-result ${type}`;
    result.innerHTML = html;
}

function markChallengeComplete(challenge) {
    challengeProgress[challenge.id] = {
        completed: true,
        completedAt: new Date().toISOString()
    };
    saveChallengeProgress();
    renderChallengeList();
    renderLearningProgressDashboard();
}

function runChallenge() {
    const challenge = getChallengeById(currentChallengeId);
    if (!challenge) {
        showToast('warning', 'Elige un reto primero.');
        return;
    }
    if (!dbInitialized) {
        showToast('warning', 'Espera a que la base de datos termine de inicializarse.');
        return;
    }

    const editor = document.getElementById('challengeEditor');
    const query = editor ? editor.value.trim() : '';
    if (!query) {
        setChallengeResult('warning', '<strong><i class="fas fa-triangle-exclamation"></i> Consulta vacía</strong>Escribe una consulta antes de comprobar el reto.');
        if (editor) editor.focus();
        return;
    }
    if (!isReadOnlyQuery(query)) {
        setChallengeResult('error', '<strong><i class="fas fa-shield-halved"></i> Solo lectura</strong>Los retos aceptan una única consulta SELECT o WITH. No se permiten modificaciones.');
        return;
    }

    challengeAttempts += 1;

    try {
        const actual = db.exec(query);
        const expected = db.exec(challenge.sqlEsperado);
        const comparison = compareChallengeResults(expected, actual, challenge.ordenada);

        if (comparison.ok) {
            markChallengeComplete(challenge);
            playSound('success');
            setChallengeResult('success', `
                <strong><i class="fas fa-circle-check"></i> ¡Correcto!</strong>
                Tu consulta devuelve el mismo resultado que la solución esperada.
                <div class="challenge-result-actions">
                    <button type="button" class="btn-secondary" onclick="nextChallenge()">
                        <i class="fas fa-arrow-right"></i> Siguiente reto
                    </button>
                </div>
            `);
            return;
        }

        let message = 'Tu consulta todavía no coincide con el resultado esperado.';
        if (comparison.reason === 'columns') {
            message = `Se esperaban ${comparison.expectedColumns} columnas y tu consulta devolvió ${comparison.actualColumns}.`;
        } else if (comparison.reason === 'rows') {
            message = `Se esperaban ${comparison.expectedRows} filas y tu consulta devolvió ${comparison.actualRows}.`;
        } else if (comparison.reason === 'values') {
            message = `El número de filas y columnas coincide, pero los valores no son iguales (revisa el orden o los cálculos).`;
        } else if (comparison.reason === 'no_result') {
            message = 'Tu consulta no devolvió un conjunto de resultados.';
        }

        const canShowSolution = challengeAttempts >= 3;
        playSound('error');
        setChallengeResult('error', `
            <strong><i class="fas fa-circle-xmark"></i> Aún no</strong>
            ${escapeHtml(message)}
            <div class="challenge-result-actions">
                <button type="button" class="btn-secondary" onclick="showChallengeHint()">
                    <i class="fas fa-lightbulb"></i> Ver pista
                </button>
                ${canShowSolution ? `
                    <button type="button" class="btn-secondary" onclick="showChallengeSolution()">
                        <i class="fas fa-eye"></i> Ver solución
                    </button>
                ` : ''}
            </div>
        `);

        if (challengeAttempts >= 2) {
            showChallengeHint();
        }
    } catch (error) {
        playSound('error');
        setChallengeResult('error', `
            <strong><i class="fas fa-circle-exclamation"></i> Error en la consulta</strong>
            <code>${escapeHtml(error.message || String(error))}</code>
        `);
    }
}

function nextChallenge() {
    const activeCatalog = getActiveChallengeCatalog();
    const currentIndex = activeCatalog.findIndex(challenge => challenge.id === currentChallengeId);
    const next = activeCatalog[currentIndex + 1];
    if (next) {
        openChallenge(next.id);
    } else {
        showToast('success', '¡Has llegado al final de los retos de este dataset!');
    }
}

function resetChallengeProgress() {
    const datasetLabel = preferences.dataset === 'escuela'
        ? 'Escuela'
        : (window.SQL_ACADEMY_DATASETS?.[preferences.dataset]?.name || preferences.dataset);
    if (!confirm(`¿Reiniciar el progreso de los retos de ${datasetLabel}?`)) return;

    getActiveChallengeCatalog().forEach(challenge => {
        delete challengeProgress[challenge.id];
    });
    saveChallengeProgress();
    renderChallengeList();
    renderChallengePlaceholder();
    currentChallengeId = null;
    challengeAttempts = 0;
    renderLearningProgressDashboard();
    showToast('info', `Progreso de retos de ${datasetLabel} reiniciado.`);
}


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
            playSound('success');
            showDebugResult('success', `
                <strong><i class="fas fa-circle-check"></i> ¡Consulta corregida!</strong>
                ${wasCompleted ? 'Ya tenías este reto completado.' : 'El resultado coincide con la solución esperada.'}
            `);
            showDebugNext(challenge);
            showToast('success', 'Reto de depuración completado.');
            return;
        }

        debugChallengeAttempts += 1;
        playSound('error');
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
        playSound('error');
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

// ============================================
// PERFIL DE NIVEL Y TEST DE HABILIDAD
// ============================================

const SKILL_LEVELS = {
    basico: {
        id: 'basico',
        label: 'Básico',
        description: 'Empieza con lo esencial y gana confianza antes de combinar conceptos.',
        sqlRecommendation: 'SELECT, WHERE, ORDER BY y LIMIT.',
        nosqlRecommendation: 'find, filtros simples y proyecciones.'
    },
    intermedio: {
        id: 'intermedio',
        label: 'Intermedio',
        description: 'Ya puedes relacionar tablas y resumir datos; toca practicar combinaciones.',
        sqlRecommendation: 'JOIN, GROUP BY, HAVING, agregaciones y operadores.',
        nosqlRecommendation: 'sort, limit, CRUD y operadores de actualización.'
    },
    avanzado: {
        id: 'avanzado',
        label: 'Avanzado',
        description: 'Dominas las bases y puedes trabajar con consultas menos directas.',
        sqlRecommendation: 'subconsultas, LEFT JOIN con NULL, consultas combinadas y CRUD.',
        nosqlRecommendation: 'aggregate, $group, $match y $unwind.'
    }
};

const SKILL_LEVEL_ORDER = ['basico', 'intermedio', 'avanzado'];

const SQL_CATEGORY_LEVELS = {
    basicos: 'basico',
    filtros: 'basico',
    orden: 'basico',
    agregacion: 'intermedio',
    groupby: 'intermedio',
    having: 'intermedio',
    join: 'intermedio',
    operadores: 'intermedio',
    subconsultas: 'avanzado',
    avanzado: 'avanzado',
    modificacion: 'avanzado'
};

const NOSQL_EXAMPLE_LEVELS = {
    Consultas: 'basico',
    Filtros: 'basico',
    CRUD: 'intermedio',
    Agregación: 'avanzado'
};

const NOSQL_QUICK_SYNTAX = {
    basico: {
        examples: [
            'db.estudiantes.find({})',
            'db.estudiantes.find({ edad: { $gt: 18 } })',
            'db.estudiantes.find({}, { nombre: 1, carrera: 1 })'
        ],
        operators: ['$gt', '$gte', '$lt', '$in', '$and', '$or']
    },
    intermedio: {
        examples: [
            'db.estudiantes.find({}).sort({ promedio: -1 }).limit(5)',
            'db.estudiantes.updateMany({}, { $inc: { edad: 1 } })',
            'db.estudiantes.deleteOne({ _id: "est-008" })'
        ],
        operators: ['$set', '$inc', '$push', '$pull']
    },
    avanzado: {
        examples: [
            'db.estudiantes.aggregate([{ $group: { _id: "$carrera", total: { $sum: 1 } } }])',
            'db.pedidos.aggregate([{ $unwind: "$items" }, { $group: { _id: "$items.producto_nombre", total: { $sum: "$items.cantidad" } } }])'
        ],
        operators: ['$group', '$sum', '$avg', '$unwind', '$match', '$sort']
    }
};

const SKILL_TEST_LENGTH = 6;

const SKILL_TEST_QUESTIONS = {
    sql: [
        {
            id: 'sql-basico-1',
            level: 'basico',
            prompt: '¿Qué devuelve SELECT nombre FROM estudiantes WHERE edad > 20;?',
            options: [
                'Los nombres de los estudiantes mayores de 20 años.',
                'Todos los datos de los estudiantes.',
                'Los nombres de todos los estudiantes.'
            ],
            answer: 0
        },
        {
            id: 'sql-basico-2',
            level: 'basico',
            prompt: '¿Qué cláusula se usa para ordenar los resultados?',
            options: ['GROUP BY', 'ORDER BY', 'WHERE'],
            answer: 1
        },
        {
            id: 'sql-basico-3',
            level: 'basico',
            prompt: '¿Qué hace LIMIT 5 al final de una consulta?',
            options: ['Filtra las edades.', 'Crea una tabla nueva.', 'Devuelve como máximo 5 filas.'],
            answer: 2
        },
        {
            id: 'sql-intermedio-1',
            level: 'intermedio',
            prompt: '¿Qué cláusula filtra los grupos después de GROUP BY?',
            options: ['WHERE', 'ORDER BY', 'HAVING'],
            answer: 2
        },
        {
            id: 'sql-intermedio-2',
            level: 'intermedio',
            prompt: '¿Qué muestra SELECT carrera, COUNT(*) FROM estudiantes GROUP BY carrera;?',
            options: [
                'Todos los estudiantes uno por uno.',
                'Cuántos estudiantes hay por carrera.',
                'El promedio de cada carrera.'
            ],
            answer: 1
        },
        {
            id: 'sql-intermedio-3',
            level: 'intermedio',
            prompt: '¿Qué JOIN conserva todas las filas de la tabla izquierda aunque no tengan coincidencia?',
            options: ['LEFT JOIN', 'INNER JOIN', 'CROSS JOIN'],
            answer: 0
        },
        {
            id: 'sql-avanzado-1',
            level: 'avanzado',
            prompt: '¿Qué consulta obtiene los estudiantes con promedio superior al promedio general?',
            options: [
                'SELECT * FROM estudiantes WHERE promedio > AVG(promedio);',
                'SELECT * FROM estudiantes GROUP BY promedio HAVING promedio > AVG(promedio);',
                'SELECT * FROM estudiantes WHERE promedio > (SELECT AVG(promedio) FROM estudiantes);'
            ],
            answer: 2
        },
        {
            id: 'sql-avanzado-2',
            level: 'avanzado',
            prompt: '¿Qué devuelve SELECT e.nombre FROM estudiantes e LEFT JOIN inscripciones i ON e.id = i.estudiante_id WHERE i.id IS NULL;?',
            options: [
                'Estudiantes con al menos una inscripción.',
                'Estudiantes sin inscripciones.',
                'Todos los estudiantes con sus cursos.'
            ],
            answer: 1
        },
        {
            id: 'sql-avanzado-3',
            level: 'avanzado',
            prompt: '¿Qué hace una subconsulta dentro de WHERE?',
            options: [
                'Elimina la tabla original.',
                'Devuelve un valor o conjunto que usa la consulta exterior.',
                'Solo puede devolver texto.'
            ],
            answer: 1
        }
    ],
    nosql: [
        {
            id: 'nosql-basico-1',
            level: 'basico',
            prompt: '¿Qué devuelve db.estudiantes.find({})?',
            options: ['Todos los documentos.', 'Solo un documento.', 'Elimina la colección.'],
            answer: 0
        },
        {
            id: 'nosql-basico-2',
            level: 'basico',
            prompt: '¿Qué significa { edad: { $gte: 18 } }?',
            options: ['Edad distinta de 18.', 'Edad mayor o igual a 18.', 'Edad menor que 18.'],
            answer: 1
        },
        {
            id: 'nosql-basico-3',
            level: 'basico',
            prompt: '¿Qué hace una proyección como { nombre: 1, carrera: 1 }?',
            options: ['Devuelve todos los campos.', 'Elimina los documentos.', 'Devuelve solo esos campos.'],
            answer: 2
        },
        {
            id: 'nosql-intermedio-1',
            level: 'intermedio',
            prompt: '¿Qué hace .sort({ promedio: -1 })?',
            options: ['Ordena de menor a mayor.', 'Ordena de mayor a menor.', 'Ordena aleatoriamente.'],
            answer: 1
        },
        {
            id: 'nosql-intermedio-2',
            level: 'intermedio',
            prompt: '¿Qué operador actualiza un campo?',
            options: ['$set', '$and', '$in'],
            answer: 0
        },
        {
            id: 'nosql-intermedio-3',
            level: 'intermedio',
            prompt: '¿Qué hace db.estudiantes.updateMany({}, { $inc: { edad: 1 } })?',
            options: ['Elimina todos los documentos.', 'Pone la edad en 1.', 'Incrementa la edad de todos los documentos.'],
            answer: 2
        },
        {
            id: 'nosql-avanzado-1',
            level: 'avanzado',
            prompt: '¿Qué etapa de agregación agrupa documentos?',
            options: ['$sort', '$limit', '$group'],
            answer: 2
        },
        {
            id: 'nosql-avanzado-2',
            level: 'avanzado',
            prompt: '¿Qué hace $unwind?',
            options: ['Ordena documentos.', 'Convierte un arreglo en varios documentos.', 'Elimina un campo.'],
            answer: 1
        },
        {
            id: 'nosql-avanzado-3',
            level: 'avanzado',
            prompt: '¿Qué etapa filtra documentos antes de agrupar?',
            options: ['$match', '$project', '$sum'],
            answer: 0
        }
    ]
};

const SKILL_QUESTION_TARGETS = {
    'sql-basico-1': { concept: 'SELECT y WHERE', category: 'filtros', level: 'basico' },
    'sql-basico-2': { concept: 'ORDER BY', category: 'orden', level: 'basico' },
    'sql-basico-3': { concept: 'LIMIT', category: 'basicos', level: 'basico' },
    'sql-intermedio-1': { concept: 'HAVING', category: 'having', level: 'intermedio' },
    'sql-intermedio-2': { concept: 'GROUP BY', category: 'groupby', level: 'intermedio' },
    'sql-intermedio-3': { concept: 'JOIN', category: 'join', level: 'intermedio' },
    'sql-avanzado-1': { concept: 'Subconsultas', category: 'subconsultas', level: 'avanzado' },
    'sql-avanzado-2': { concept: 'LEFT JOIN y NULL', category: 'join', level: 'avanzado' },
    'sql-avanzado-3': { concept: 'Subconsultas', category: 'subconsultas', level: 'avanzado' },
    'nosql-basico-1': { concept: 'find', category: 'Consultas', level: 'basico' },
    'nosql-basico-2': { concept: 'Filtros', category: 'Filtros', level: 'basico' },
    'nosql-basico-3': { concept: 'Proyección', category: 'Consultas', level: 'basico' },
    'nosql-intermedio-1': { concept: 'sort', category: 'Consultas', level: 'intermedio' },
    'nosql-intermedio-2': { concept: 'Actualización', category: 'CRUD', level: 'intermedio' },
    'nosql-intermedio-3': { concept: '$inc', category: 'CRUD', level: 'intermedio' },
    'nosql-avanzado-1': { concept: '$group', category: 'Agregación', level: 'avanzado' },
    'nosql-avanzado-2': { concept: '$unwind', category: 'Agregación', level: 'avanzado' },
    'nosql-avanzado-3': { concept: '$match', category: 'Agregación', level: 'avanzado' }
};

let skillProfile = {
    sql: null,
    nosql: null,
    sqlShowAll: false,
    nosqlShowAll: false,
    sqlSource: null,
    nosqlSource: null,
    sqlTestedAt: null,
    nosqlTestedAt: null,
    sqlWeakConcepts: [],
    nosqlWeakConcepts: []
};

let skillTestState = null;

function normalizeSkillLevel(value) {
    return SKILL_LEVEL_ORDER.includes(value) ? value : null;
}

function normalizeSkillSource(value) {
    return value === 'test' || value === 'manual' ? value : null;
}

function loadSkillProfile() {
    const stored = readStoredJSON(STORAGE_KEYS.skillProfile, {});
    const data = stored && typeof stored === 'object' && !Array.isArray(stored) ? stored : {};
    skillProfile = {
        sql: normalizeSkillLevel(data.sql),
        nosql: normalizeSkillLevel(data.nosql),
        sqlShowAll: Boolean(data.sqlShowAll),
        nosqlShowAll: Boolean(data.nosqlShowAll),
        sqlSource: normalizeSkillSource(data.sqlSource),
        nosqlSource: normalizeSkillSource(data.nosqlSource),
        sqlTestedAt: typeof data.sqlTestedAt === 'string' ? data.sqlTestedAt : null,
        nosqlTestedAt: typeof data.nosqlTestedAt === 'string' ? data.nosqlTestedAt : null,
        sqlWeakConcepts: Array.isArray(data.sqlWeakConcepts)
            ? data.sqlWeakConcepts.filter(item => item && typeof item.concept === 'string' && typeof item.category === 'string')
            : [],
        nosqlWeakConcepts: Array.isArray(data.nosqlWeakConcepts)
            ? data.nosqlWeakConcepts.filter(item => item && typeof item.concept === 'string' && typeof item.category === 'string')
            : []
    };
}

function saveSkillProfile() {
    writeStoredJSON(STORAGE_KEYS.skillProfile, skillProfile);
}

function getSkillLevel(track) {
    return skillProfile[track] || 'basico';
}

function getEffectiveSkillLevel(track) {
    return skillProfile[`${track}ShowAll`] ? 'all' : getSkillLevel(track);
}

function getSkillLevelInfo(level) {
    return SKILL_LEVELS[level] || SKILL_LEVELS.basico;
}

function getExampleCategoryLevel(categoryKey) {
    return SQL_CATEGORY_LEVELS[categoryKey] || 'intermedio';
}

function getNoSQLExampleLevel(example) {
    return NOSQL_EXAMPLE_LEVELS[example.category] || 'intermedio';
}

function getVisibleExampleCategories(datasetName = preferences.dataset) {
    const categories = getExamplesByCategory(datasetName);
    const effectiveLevel = getEffectiveSkillLevel('sql');
    if (effectiveLevel === 'all') return categories;

    const filtered = Object.fromEntries(
        Object.entries(categories).filter(([key]) => getExampleCategoryLevel(key) === effectiveLevel)
    );
    return Object.keys(filtered).length ? filtered : categories;
}

function getWeakConcepts(track) {
    return Array.isArray(skillProfile[`${track}WeakConcepts`])
        ? skillProfile[`${track}WeakConcepts`]
        : [];
}

function collectWeakConcepts(track, answers) {
    const unique = new Map();
    answers.filter(answer => !answer.correct).forEach(answer => {
        const target = SKILL_QUESTION_TARGETS[answer.questionId];
        if (!target) return;
        unique.set(`${target.category}:${target.concept}`, { ...target, track });
    });
    return [...unique.values()];
}

function practiceSkillTarget(track, category, level = '') {
    if (track === 'sql') {
        if (!Object.keys(getVisibleExampleCategories()).includes(category)) {
            setSkillLevel('sql', 'all');
        }
        activateSection('practice');
        const selector = document.getElementById('categorySelector');
        if (selector) {
            selector.value = category;
            showExampleByCategory();
        }
        return;
    }

    setSkillLevel('nosql', 'all');
    activateSection('nosql');
    if (typeof window.refreshNoSQLExamples === 'function') {
        window.refreshNoSQLExamples();
    }
    const select = document.getElementById('nosqlExampleSelector');
    const datasetName = typeof window.getNoSQLActiveDataset === 'function'
        ? window.getNoSQLActiveDataset()
        : 'escuela';
    const examples = typeof window.getNoSQLExamplesForDataset === 'function'
        ? window.getNoSQLExamplesForDataset(datasetName)
        : [];
    const index = examples.findIndex(example => example.category === category);
    if (select && index >= 0) {
        select.value = String(index);
        if (typeof window.loadNoSQLExample === 'function') {
            window.loadNoSQLExample();
        }
    }
}

function filterNoSQLExamplesBySkill(examples) {
    const effectiveLevel = getEffectiveSkillLevel('nosql');
    if (effectiveLevel === 'all') return examples;
    const filtered = examples.filter(example => getNoSQLExampleLevel(example) === effectiveLevel);
    return filtered.length ? filtered : examples;
}

function setSkillLevel(track, value) {
    if (track !== 'sql' && track !== 'nosql') return;

    if (value === 'all') {
        skillProfile[`${track}ShowAll`] = true;
    } else {
        const level = normalizeSkillLevel(value);
        if (!level) return;
        skillProfile[track] = level;
        skillProfile[`${track}ShowAll`] = false;
    }

    skillProfile[`${track}Source`] = 'manual';

    saveSkillProfile();
    applySkillLevelUI();
    refreshSkillFilters();
    renderLearningProgressDashboard();
    showToast('info', `Nivel ${track === 'sql' ? 'SQL' : 'NoSQL'} actualizado.`);
}

function updateSkillBar(track, elements) {
    const level = getEffectiveSkillLevel(track);
    const info = getSkillLevelInfo(getSkillLevel(track));
    const configured = Boolean(skillProfile[`${track}Source`] || skillProfile[`${track}ShowAll`]);
    const bar = document.getElementById(elements.bar);
    const label = document.getElementById(elements.label);
    const description = document.getElementById(elements.description);
    const select = document.getElementById(elements.select);

    if (bar) bar.classList.toggle('is-onboarding', !configured);
    if (select) select.value = level === 'all' ? 'all' : getSkillLevel(track);
    if (label) {
        label.textContent = level === 'all'
            ? 'Ver todo'
            : (configured ? `Nivel ${info.label}` : `Nivel estimado: ${info.label}`);
    }
    if (description) {
        if (level === 'all') {
            description.textContent = 'Mostrando todos los niveles.';
        } else if (!configured) {
            description.textContent = 'Aún no has hecho el test. Empezamos por lo básico.';
        } else if (skillProfile[`${track}Source`] === 'test') {
            description.textContent = `Nivel recomendado. ${info.description}`;
        } else {
            description.textContent = info.description;
        }
    }
}

function renderNoSQLQuickSyntax() {
    const container = document.getElementById('nosqlQuickSyntax');
    if (!container) return;

    const level = getEffectiveSkillLevel('nosql');
    const levels = level === 'all' ? SKILL_LEVEL_ORDER : [level];
    const examples = levels.flatMap(item => NOSQL_QUICK_SYNTAX[item]?.examples || []);
    const operators = [...new Set(levels.flatMap(item => NOSQL_QUICK_SYNTAX[item]?.operators || []))];
    const operatorsContainer = document.getElementById('nosqlQuickOperators');

    container.innerHTML = examples.map(code => `<code tabindex="0">${escapeHtml(code)}</code>`).join('');
    if (operatorsContainer) {
        operatorsContainer.innerHTML = `Operadores: ${operators.map(operator => `<code tabindex="0">${escapeHtml(operator)}</code>`).join(', ')}.`;
    }
}

function applySkillLevelUI() {
    updateSkillBar('sql', {
        bar: 'sqlLevelBar',
        label: 'sqlLevelLabel',
        description: 'sqlLevelDescription',
        select: 'sqlLevelSelect'
    });
    updateSkillBar('nosql', {
        bar: 'nosqlLevelBar',
        label: 'nosqlLevelLabel',
        description: 'nosqlLevelDescription',
        select: 'nosqlLevelSelect'
    });
    renderNoSQLQuickSyntax();
}

function refreshSkillFilters() {
    if (document.getElementById('categorySelector')) {
        lastSqlExample = null;
        renderCategorySelector();
        const status = document.getElementById('sqlExampleStatus');
        if (status) status.textContent = 'Elige una categoría o pulsa «Siguiente ejemplo»';
    }

    if (typeof window.refreshNoSQLExamples === 'function') {
        window.refreshNoSQLExamples();
    }
    renderNoSQLQuickSyntax();
}

function getSkillProfileCard(track) {
    const label = track === 'sql' ? 'SQL' : 'NoSQL';
    const sectionLabel = track === 'sql' ? 'Practicar' : 'NoSQL';
    const icon = track === 'sql' ? 'fa-database' : 'fa-leaf';
    const level = getEffectiveSkillLevel(track);
    const selectedLevel = level === 'all' ? 'all' : getSkillLevel(track);
    const info = getSkillLevelInfo(getSkillLevel(track));
    const testedAt = skillProfile[`${track}TestedAt`];
    const source = skillProfile[`${track}Source`];
    const testButtonLabel = source === 'test' ? 'Repetir test' : 'Test de nivel';
    const meta = testedAt
        ? `Test realizado: ${formatLearningActivityDate(testedAt)}`
        : (source === 'manual' ? 'Nivel elegido manualmente' : 'Todavía sin test');
    const recommendation = track === 'sql' ? info.sqlRecommendation : info.nosqlRecommendation;
    const weakConcepts = getWeakConcepts(track);

    return `
        <article class="skill-profile-card">
            <div class="skill-profile-head">
                <span class="skill-profile-icon"><i class="fas ${icon}"></i></span>
                <div class="skill-profile-heading">
                    <span>Nivel ${label}</span>
                    <strong>${escapeHtml(info.label)}</strong>
                </div>
                <span class="challenge-level ${escapeHtml(level === 'all' ? 'intermedio' : getSkillLevel(track))}">${level === 'all' ? 'Ver todo' : escapeHtml(info.label)}</span>
            </div>
            <p class="skill-profile-description">${escapeHtml(info.description)}</p>
            <p class="skill-profile-next"><strong>Siguiente paso:</strong> ${escapeHtml(recommendation)}</p>
            ${weakConcepts.length ? `
                <div class="skill-profile-weak">
                    <span>Refuerza:</span>
                    ${weakConcepts.slice(0, 4).map(item => `
                        <button type="button" class="skill-weak-chip" onclick="practiceSkillTarget('${escapeHtml(track)}', '${escapeHtml(item.category)}', '${escapeHtml(item.level)}')">
                            ${escapeHtml(item.concept)}
                        </button>
                    `).join('')}
                </div>
            ` : ''}
            <div class="skill-profile-meta">${escapeHtml(meta)}</div>
            <div class="skill-profile-actions">
                <label class="skill-profile-select-label" for="dashboard${label}LevelSelect">Nivel</label>
                <select id="dashboard${label}LevelSelect" class="skill-profile-select" onchange="setSkillLevel('${track}', this.value)" aria-label="Nivel ${label}">
                    <option value="basico"${selectedLevel === 'basico' ? ' selected' : ''}>Básico</option>
                    <option value="intermedio"${selectedLevel === 'intermedio' ? ' selected' : ''}>Intermedio</option>
                    <option value="avanzado"${selectedLevel === 'avanzado' ? ' selected' : ''}>Avanzado</option>
                    <option value="all"${selectedLevel === 'all' ? ' selected' : ''}>Ver todo</option>
                </select>
                <button type="button" class="btn-secondary btn-sm" onclick="openSkillTest('${track}')">${testButtonLabel}</button>
                <button type="button" class="btn-ghost btn-sm" onclick="goToSkillTrack('${track}')">Ir a ${sectionLabel}</button>
            </div>
        </article>
    `;
}

function renderSkillProfileCards() {
    return `
        <div class="progress-section skill-profile-section">
            <div class="progress-section-head">
                <div>
                    <h3>Tu perfil de nivel</h3>
                    <p>Dos recorridos independientes para practicar sin ruido.</p>
                </div>
                <div class="progress-section-head-actions">
                    <span class="progress-section-badge">SQL + NoSQL</span>
                    <button type="button" class="btn-secondary btn-sm" onclick="openProgressReport()">
                        <i class="fas fa-print"></i> Reporte
                    </button>
                </div>
            </div>
            <div class="skill-profile-grid">
                ${getSkillProfileCard('sql')}
                ${getSkillProfileCard('nosql')}
            </div>
        </div>
    `;
}

function calculateSkillLevelFromAnswers(answers) {
    const correct = answers.filter(answer => answer.correct);
    const advancedCorrect = correct.filter(answer => answer.level === 'avanzado').length;
    const intermediateCorrect = correct.filter(answer => answer.level === 'intermedio').length;
    const basicCorrect = correct.filter(answer => answer.level === 'basico').length;

    if (advancedCorrect >= 2 && correct.length >= 4) return 'avanzado';
    if (intermediateCorrect >= 2 && correct.length >= 3) return 'intermedio';
    if (basicCorrect >= 2) return 'basico';
    return 'basico';
}

function getSkillTestQuestions(track) {
    return SKILL_TEST_QUESTIONS[track] || [];
}

function pickSkillTestQuestion(track, level, askedIds) {
    const bank = getSkillTestQuestions(track);
    const startIndex = Math.max(0, SKILL_LEVEL_ORDER.indexOf(level));
    const indexes = [startIndex, startIndex - 1, startIndex + 1, startIndex - 2, startIndex + 2]
        .filter(index => index >= 0 && index < SKILL_LEVEL_ORDER.length);

    for (const index of indexes) {
        const candidate = bank.find(question => (
            question.level === SKILL_LEVEL_ORDER[index] && !askedIds.includes(question.id)
        ));
        if (candidate) return candidate;
    }
    return null;
}

function loadNextSkillTestQuestion() {
    if (!skillTestState) return;
    const question = pickSkillTestQuestion(
        skillTestState.track,
        skillTestState.level,
        skillTestState.askedIds
    );

    if (!question) {
        finishSkillTest();
        return;
    }

    skillTestState.question = question;
    skillTestState.askedIds.push(question.id);
    skillTestState.selectedIndex = null;
    renderSkillTestQuestion();
}

function renderSkillTestQuestion() {
    const body = document.getElementById('skillTestBody');
    const state = skillTestState;
    if (!body || !state || !state.question) return;

    const question = state.question;
    const questionNumber = state.answers.length + 1;
    const progress = Math.round((state.answers.length / SKILL_TEST_LENGTH) * 100);
    const trackLabel = state.track === 'sql' ? 'SQL' : 'NoSQL';

    body.innerHTML = `
        <div class="skill-test-question">
            <div class="skill-test-question-head">
                <div>
                    <span class="skill-test-eyebrow">${trackLabel} · Pregunta ${questionNumber} de ${SKILL_TEST_LENGTH}</span>
                    <h3>${escapeHtml(question.prompt)}</h3>
                </div>
            </div>
            <div class="skill-test-progress" role="progressbar" aria-label="Progreso del test" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${progress}">
                <span style="width:${progress}%"></span>
            </div>
            <div class="skill-test-options" role="radiogroup" aria-label="Opciones de respuesta">
                ${question.options.map((option, index) => `
                    <button type="button"
                        class="skill-test-option${state.selectedIndex === index ? ' selected' : ''}"
                        role="radio"
                        aria-checked="${state.selectedIndex === index}"
                        onclick="selectSkillTestOption(${index})">
                        <span class="skill-test-option-letter">${String.fromCharCode(65 + index)}</span>
                        <span>${escapeHtml(option)}</span>
                    </button>
                `).join('')}
            </div>
            <div class="skill-test-footer">
                <button type="button" class="btn-ghost" onclick="skipSkillTestQuestion()">No estoy seguro</button>
                <button type="button" class="btn-primary" id="skillTestNextBtn" onclick="nextSkillTestQuestion()" ${state.selectedIndex === null ? 'disabled' : ''}>
                    ${questionNumber === SKILL_TEST_LENGTH ? 'Ver resultado' : 'Siguiente'}
                </button>
            </div>
        </div>
    `;
}

function selectSkillTestOption(index) {
    if (!skillTestState || !skillTestState.question) return;
    if (!Number.isInteger(index) || index < 0 || index >= skillTestState.question.options.length) return;
    skillTestState.selectedIndex = index;
    document.querySelectorAll('#skillTestBody .skill-test-option').forEach((button, buttonIndex) => {
        const selected = buttonIndex === index;
        button.classList.toggle('selected', selected);
        button.setAttribute('aria-checked', String(selected));
    });
    const nextButton = document.getElementById('skillTestNextBtn');
    if (nextButton) nextButton.disabled = false;
}

function advanceSkillTest(selectedIndex) {
    const state = skillTestState;
    if (!state || !state.question) return;

    const correct = selectedIndex !== null && selectedIndex === state.question.answer;
    state.answers.push({
        questionId: state.question.id,
        level: state.question.level,
        correct
    });

    const currentLevelIndex = SKILL_LEVEL_ORDER.indexOf(state.level);
    const nextLevelIndex = Math.max(
        0,
        Math.min(SKILL_LEVEL_ORDER.length - 1, currentLevelIndex + (correct ? 1 : -1))
    );
    state.level = SKILL_LEVEL_ORDER[nextLevelIndex];
    state.selectedIndex = null;

    if (state.answers.length >= SKILL_TEST_LENGTH) {
        finishSkillTest();
        return;
    }
    loadNextSkillTestQuestion();
}

function nextSkillTestQuestion() {
    if (!skillTestState || skillTestState.selectedIndex === null) return;
    advanceSkillTest(skillTestState.selectedIndex);
}

function skipSkillTestQuestion() {
    if (!skillTestState) return;
    advanceSkillTest(null);
}

function finishSkillTest() {
    const state = skillTestState;
    if (!state) return;

    const level = calculateSkillLevelFromAnswers(state.answers);
    skillProfile[state.track] = level;
    skillProfile[`${state.track}ShowAll`] = false;
    skillProfile[`${state.track}Source`] = 'test';
    skillProfile[`${state.track}TestedAt`] = new Date().toISOString();
    skillProfile[`${state.track}WeakConcepts`] = collectWeakConcepts(state.track, state.answers);
    saveSkillProfile();
    applySkillLevelUI();
    refreshSkillFilters();
    renderLearningProgressDashboard();
    renderSkillTestResult(level);
}

function renderSkillTestResult(level) {
    const body = document.getElementById('skillTestBody');
    const state = skillTestState;
    if (!body || !state) return;

    const info = getSkillLevelInfo(level);
    const track = state.track;
    const correctCount = state.answers.filter(answer => answer.correct).length;
    const recommendation = track === 'sql' ? info.sqlRecommendation : info.nosqlRecommendation;
    const weakConcepts = getWeakConcepts(track);

    body.innerHTML = `
        <div class="skill-test-result">
            <span class="skill-test-eyebrow">Test completado</span>
            <span class="challenge-level ${escapeHtml(level)}">${escapeHtml(info.label)}</span>
            <h3>Tu nivel recomendado es ${escapeHtml(info.label)}</h3>
            <p>${escapeHtml(info.description)}</p>
            <p class="skill-test-score">Acertaste ${correctCount} de ${state.answers.length} preguntas.</p>
            ${weakConcepts.length ? `
                <div class="skill-test-weak">
                    <span>Refuerza estos conceptos</span>
                    <div class="skill-test-weak-list">
                        ${weakConcepts.map(item => `
                            <button type="button" class="skill-weak-chip" onclick="practiceSkillTarget('${escapeHtml(track)}', '${escapeHtml(item.category)}', '${escapeHtml(item.level)}')">
                                ${escapeHtml(item.concept)}
                            </button>
                        `).join('')}
                    </div>
                </div>
            ` : '<p class="skill-test-score">No se detectaron conceptos débiles en este test.</p>'}
            <div class="skill-test-next">
                <span>Siguiente paso</span>
                <strong>${escapeHtml(recommendation)}</strong>
            </div>
            <div class="skill-test-result-actions">
                <button type="button" class="btn-primary" onclick="goToSkillTrack('${escapeHtml(track)}')">
                    Empezar en ${track === 'sql' ? 'Practicar' : 'NoSQL'}
                </button>
                <button type="button" class="btn-secondary" onclick="startSkillTest('${escapeHtml(track)}')">
                    Repetir test
                </button>
                <button type="button" class="btn-ghost" onclick="showAllSkillContent('${escapeHtml(track)}')">
                    Ver todo el contenido
                </button>
            </div>
        </div>
    `;
}

function startSkillTest(track = 'sql') {
    const normalizedTrack = track === 'nosql' ? 'nosql' : 'sql';
    const modal = document.getElementById('skillTestModal');
    const trackLabel = document.getElementById('skillTestTrackLabel');
    skillTestState = {
        track: normalizedTrack,
        level: 'intermedio',
        askedIds: [],
        answers: [],
        question: null,
        selectedIndex: null
    };
    if (trackLabel) {
        trackLabel.textContent = `${normalizedTrack === 'sql' ? 'SQL' : 'NoSQL'} · ${SKILL_TEST_LENGTH} preguntas`;
    }
    if (modal && !modal.classList.contains('active')) {
        openModal(modal);
    }
    loadNextSkillTestQuestion();
}

function getCurrentSkillTestQuestion() {
    return skillTestState?.question || null;
}

function openSkillTest(track = 'sql') {
    startSkillTest(track);
}

function goToSkillTrack(track) {
    closeSkillTest();
    activateSection(track === 'nosql' ? 'nosql' : 'practice');
}

function showAllSkillContent(track) {
    setSkillLevel(track, 'all');
    goToSkillTrack(track);
}

function closeSkillTest() {
    skillTestState = null;
    closeModal(document.getElementById('skillTestModal'));
}

// ============================================
// RECORRIDO GUIADO DE LA FERIA
// ============================================

const DEMO_TOUR_STEPS = [
    {
        title: 'Una academia que se adapta',
        description: 'SQL Academy combina teoría, práctica y juego. El recorrido empieza en Aprender.',
        section: 'learn'
    },
    {
        title: 'Descubre tu nivel',
        description: 'El test adaptativo recomienda un nivel para SQL y otro para NoSQL. Practicar y el laboratorio se ajustan a tu perfil.',
        section: 'practice',
        target: 'sqlLevelBar'
    },
    {
        title: 'Practica con datos reales',
        description: 'Elige un ejemplo, ejecútalo y revisa los resultados. La base SQLite funciona en el navegador.',
        section: 'practice',
        target: 'sqlEditor'
    },
    {
        title: 'Explora el laboratorio NoSQL',
        description: 'Los ejemplos y la sintaxis rápida también se filtran por nivel. La consola documental sigue disponible.',
        section: 'nosql',
        target: 'nosqlLevelBar'
    },
    {
        title: 'Ponte a prueba',
        description: 'Resuelve retos SQL, retos NoSQL o depuraciones con validación por resultado.',
        section: 'challenges'
    },
    {
        title: 'Sigue tus cursos',
        description: 'Consulta tu nivel, el avance por curso, las actividades completadas y el siguiente paso recomendado.',
        section: 'path',
        progress: true,
        target: 'learningProgressDashboard'
    },
    {
        title: 'Tecnología y aprendizaje',
        description: 'SQLite real en el navegador, PWA, pruebas automatizadas y un asistente IA opcional. Gracias por acompañar el recorrido.',
        section: null
    }
];

let demoTourIndex = 0;

function scrollToDemoTarget(targetId) {
    if (!targetId) return;
    const target = document.getElementById(targetId);
    if (target && typeof target.scrollIntoView === 'function') {
        const reduceMotion = typeof window.matchMedia === 'function'
            && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        target.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'center' });
    }
}

function renderDemoTourStep() {
    const bar = document.getElementById('demoTourBar');
    if (!bar) return;
    const step = DEMO_TOUR_STEPS[demoTourIndex];
    if (!step) {
        closeDemoTour();
        return;
    }

    bar.hidden = false;
    const stepLabel = document.getElementById('demoTourStepLabel');
    const title = document.getElementById('demoTourTitle');
    const description = document.getElementById('demoTourDescription');
    const previous = document.getElementById('demoTourPrevBtn');
    const next = document.getElementById('demoTourNextBtn');

    if (stepLabel) stepLabel.textContent = `Paso ${demoTourIndex + 1} de ${DEMO_TOUR_STEPS.length}`;
    if (title) title.textContent = step.title;
    if (description) description.textContent = step.description;
    if (previous) previous.disabled = demoTourIndex === 0;
    if (next) next.textContent = demoTourIndex === DEMO_TOUR_STEPS.length - 1 ? 'Finalizar' : 'Siguiente';

    if (step.section) {
        activateSection(step.section);
        if (step.progress) activatePathTab('progress');
    }
    if (step.target) {
        setTimeout(() => scrollToDemoTarget(step.target), 80);
    }
}

function startDemoTour() {
    demoTourIndex = 0;
    playSound('intro');
    renderDemoTourStep();
}

function nextDemoTourStep() {
    if (demoTourIndex >= DEMO_TOUR_STEPS.length - 1) {
        closeDemoTour();
        playSound('success');
        showToast('success', 'Recorrido completado. Gracias por acompañar SQL Academy.');
        return;
    }
    demoTourIndex += 1;
    renderDemoTourStep();
}

function previousDemoTourStep() {
    if (demoTourIndex <= 0) return;
    demoTourIndex -= 1;
    renderDemoTourStep();
}

function closeDemoTour() {
    const bar = document.getElementById('demoTourBar');
    if (bar) bar.hidden = true;
}

// ============================================
// REPORTE DE PROGRESO
// ============================================

function formatReportDate(value = new Date()) {
    const date = value instanceof Date ? value : new Date(value);
    if (Number.isNaN(date.getTime())) return '';
    return date.toLocaleDateString('es-ES', { day: '2-digit', month: 'long', year: 'numeric' });
}

function buildProgressReportHtml(studentName = '') {
    const stats = getLearningGlobalStats();
    const concepts = getLearningConceptStats();
    const recommendation = getLearningRecommendation();
    const sqlLevel = getSkillLevelInfo(getSkillLevel('sql'));
    const nosqlLevel = getSkillLevelInfo(getSkillLevel('nosql'));
    const sqlMeta = skillProfile.sqlTestedAt
        ? `Test: ${formatReportDate(skillProfile.sqlTestedAt)}`
        : (skillProfile.sqlSource === 'manual' ? 'Nivel elegido manualmente' : 'Sin test');
    const nosqlMeta = skillProfile.nosqlTestedAt
        ? `Test: ${formatReportDate(skillProfile.nosqlTestedAt)}`
        : (skillProfile.nosqlSource === 'manual' ? 'Nivel elegido manualmente' : 'Sin test');
    const weak = [...getWeakConcepts('sql'), ...getWeakConcepts('nosql')];
    const named = studentName.trim();

    const conceptRows = concepts.map(concept => `
        <tr>
            <td>${escapeHtml(concept.label)}</td>
            <td>${concept.percent}%</td>
            <td>${concept.completed}/${concept.total}</td>
        </tr>
    `).join('');

    return `<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="UTF-8">
<title>Reporte de aprendizaje - SQL Academy</title>
<style>
    @page { size: A4; margin: 16mm; }
    * { box-sizing: border-box; }
    body { margin: 0; color: #1e293b; font-family: Arial, Helvetica, sans-serif; line-height: 1.45; }
    .header { display: flex; justify-content: space-between; gap: 20px; padding-bottom: 14px; border-bottom: 3px solid #336791; }
    .brand { color: #336791; font-size: 20px; font-weight: 800; letter-spacing: .04em; }
    .subtitle { color: #64748b; font-size: 11px; margin-top: 3px; }
    .meta { color: #64748b; font-size: 11px; text-align: right; }
    h1 { margin: 22px 0 4px; font-size: 23px; }
    .student { color: #475569; font-size: 13px; margin: 0 0 18px; }
    .grid { display: flex; gap: 10px; margin: 16px 0; }
    .metric { flex: 1; padding: 11px; border: 1px solid #dbe4ee; border-radius: 8px; background: #f8fafc; }
    .metric span { display: block; color: #64748b; font-size: 9px; font-weight: 700; letter-spacing: .06em; text-transform: uppercase; }
    .metric strong { display: block; margin-top: 3px; font-size: 20px; color: #1e293b; }
    .levels { display: flex; gap: 10px; margin: 14px 0; }
    .level { flex: 1; padding: 12px; border-left: 4px solid #336791; border-radius: 7px; background: #f8fafc; }
    .level span { display: block; color: #64748b; font-size: 10px; text-transform: uppercase; letter-spacing: .05em; }
    .level strong { display: block; margin: 2px 0; color: #1e293b; font-size: 17px; }
    .level small { color: #64748b; font-size: 10px; }
    h2 { margin: 22px 0 8px; font-size: 14px; color: #334155; }
    table { width: 100%; border-collapse: collapse; font-size: 11px; }
    th { padding: 7px 8px; background: #eef4fa; color: #475569; text-align: left; border-bottom: 1px solid #dbe4ee; }
    td { padding: 6px 8px; border-bottom: 1px solid #edf2f7; }
    .recommendation { margin-top: 16px; padding: 11px 13px; border-left: 4px solid #f39c12; border-radius: 7px; background: #fff9e8; font-size: 11px; }
    .recommendation strong { display: block; color: #7a5a00; }
    .weak { margin-top: 10px; color: #8b1e1e; font-size: 11px; }
    .footer { margin-top: 30px; padding-top: 10px; border-top: 1px solid #dbe4ee; color: #94a3b8; font-size: 9px; display: flex; justify-content: space-between; }
</style>
</head>
<body>
    <div class="header">
        <div>
            <div class="brand">SQL ACADEMY</div>
            <div class="subtitle">Reporte de aprendizaje · MNTWARE</div>
        </div>
        <div class="meta">Generado el ${escapeHtml(formatReportDate())}</div>
    </div>

    <h1>Reporte de aprendizaje</h1>
    ${named ? `<p class="student">Preparado para: <strong>${escapeHtml(named)}</strong></p>` : '<p class="student">Resumen personal de tu recorrido en SQL Academy.</p>'}

    <div class="levels">
        <div class="level">
            <span>Nivel SQL</span>
            <strong>${escapeHtml(sqlLevel.label)}</strong>
            <small>${escapeHtml(sqlMeta)}</small>
        </div>
        <div class="level">
            <span>Nivel NoSQL</span>
            <strong>${escapeHtml(nosqlLevel.label)}</strong>
            <small>${escapeHtml(nosqlMeta)}</small>
        </div>
    </div>

    <div class="grid">
        <div class="metric"><span>Lecciones</span><strong>${stats.lessonsCompleted}/${stats.lessonsTotal}</strong></div>
        <div class="metric"><span>Retos SQL</span><strong>${stats.challengesCompleted}/${stats.challengesTotal}</strong></div>
        <div class="metric"><span>Actividades</span><strong>${stats.completed}/${stats.total}</strong></div>
        <div class="metric"><span>Avance global</span><strong>${stats.percent}%</strong></div>
    </div>

    <h2>Dominio por concepto</h2>
    <table>
        <thead><tr><th>Concepto</th><th>Dominio</th><th>Actividades</th></tr></thead>
        <tbody>${conceptRows}</tbody>
    </table>

    <div class="recommendation">
        <strong>Siguiente paso recomendado</strong>
        ${escapeHtml(recommendation.title)} — ${escapeHtml(recommendation.message)}
    </div>

    ${weak.length ? `<div class="weak"><strong>Refuerza:</strong> ${escapeHtml(weak.map(item => item.concept).join(', '))}</div>` : ''}

    <div class="footer">
        <span>SQL Academy · Aprende, practica y comprueba resultados.</span>
        <span>${escapeHtml(recommendation.action)}</span>
    </div>
</body>
</html>`;
}

function openProgressReport() {
    const body = document.getElementById('progressReportBody');
    const modal = document.getElementById('progressReportModal');
    if (!body || !modal) return;

    const stats = getLearningGlobalStats();
    const sqlLevel = getSkillLevelInfo(getSkillLevel('sql'));
    const nosqlLevel = getSkillLevelInfo(getSkillLevel('nosql'));

    body.innerHTML = `
        <div class="report-form">
            <p>Genera un resumen de tu recorrido para imprimir o guardar como PDF.</p>
            <label class="report-name-label" for="reportStudentName">Nombre para el reporte (opcional)</label>
            <input id="reportStudentName" type="text" maxlength="80" placeholder="Tu nombre">
            <div class="report-preview">
                <div><span>Nivel SQL</span><strong>${escapeHtml(sqlLevel.label)}</strong></div>
                <div><span>Nivel NoSQL</span><strong>${escapeHtml(nosqlLevel.label)}</strong></div>
                <div><span>Actividades</span><strong>${stats.completed}/${stats.total}</strong></div>
            </div>
            <div class="report-actions">
                <button type="button" class="btn-primary" onclick="printProgressReport()">
                    <i class="fas fa-print"></i> Imprimir / Guardar PDF
                </button>
                <button type="button" class="btn-secondary" onclick="closeProgressReport()">Cerrar</button>
            </div>
        </div>
    `;
    openModal(modal);
}

function printProgressReport() {
    const name = document.getElementById('reportStudentName')?.value.trim() || '';
    const report = buildProgressReportHtml(name);
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
        showToast('warning', 'Permite ventanas emergentes para imprimir el reporte.');
        return;
    }
    try { printWindow.opener = null; } catch (error) { /* ignorar */ }
    printWindow.document.open();
    printWindow.document.write(report);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => printWindow.print(), 300);
}

function closeProgressReport() {
    closeModal(document.getElementById('progressReportModal'));
}

// ============================================
// RUTA DE APRENDIZAJE SQL
// ============================================

const LEARNING_PATH_PROFILES = {
    escuela: {
        name: 'Escuela',
        mainTable: 'estudiantes',
        labelColumn: 'nombre',
        filterColumn: 'carrera',
        filterValue: 'Ingenieria',
        sortColumn: 'promedio',
        groupColumn: 'carrera',
        exampleGroup: { table: 'estudiantes', column: 'ciudad' },
        join: {
            left: 'estudiantes',
            right: 'inscripciones',
            leftKey: 'id',
            rightKey: 'estudiante_id',
            columns: 'estudiantes.nombre, inscripciones.anio, inscripciones.nota',
            description: 'Cada inscripción pertenece a un estudiante.'
        },
        advanced: {
            caseField: 'promedio',
            caseLabel: 'nivel',
            caseObjective: 'Clasifica a los estudiantes como Alto, Medio o Bajo según su promedio.',
            caseRules: [
                { operator: '>=', value: 17, label: 'Alto' },
                { operator: '>=', value: 14, label: 'Medio' }
            ],
            caseElse: 'Bajo'
        }
    },
    tienda: {
        name: 'Tienda',
        mainTable: 'productos',
        labelColumn: 'nombre',
        filterColumn: 'categoria',
        filterValue: 'Perifericos',
        sortColumn: 'precio',
        groupColumn: 'categoria',
        exampleGroup: { table: 'pedidos', column: 'estado' },
        join: {
            left: 'pedidos',
            right: 'clientes',
            leftKey: 'cliente_id',
            rightKey: 'id',
            columns: 'clientes.nombre, pedidos.fecha, pedidos.estado',
            description: 'Cada pedido pertenece a un cliente.'
        },
        advanced: {
            caseField: 'stock',
            caseLabel: 'nivel_stock',
            caseObjective: 'Clasifica los productos como Alto, Medio o Bajo según su stock.',
            caseRules: [
                { operator: '>=', value: 30, label: 'Alto' },
                { operator: '>=', value: 10, label: 'Medio' }
            ],
            caseElse: 'Bajo'
        }
    },
    biblioteca: {
        name: 'Biblioteca',
        mainTable: 'libros',
        labelColumn: 'titulo',
        filterColumn: 'genero',
        filterValue: 'Novela',
        sortColumn: 'anio',
        groupColumn: 'genero',
        exampleGroup: { table: 'libros', column: 'disponible' },
        join: {
            left: 'libros',
            right: 'autores',
            leftKey: 'autor_id',
            rightKey: 'id',
            columns: 'libros.titulo, autores.nombre',
            description: 'Cada libro tiene un autor.'
        },
        advanced: {
            caseField: 'anio',
            caseLabel: 'categoria',
            caseObjective: 'Clasifica los libros como Reciente, Moderno o Clásico según su año de publicación.',
            caseRules: [
                { operator: '>=', value: 2000, label: 'Reciente' },
                { operator: '>=', value: 1980, label: 'Moderno' }
            ],
            caseElse: 'Clásico'
        }
    }
};

const LEARNING_CONCEPTS = [
    { id: 'select', label: 'Seleccionar', icon: 'fa-table-columns', description: 'Elegir columnas y filas.' },
    { id: 'where', label: 'Filtros', icon: 'fa-filter', description: 'Filtrar con WHERE.' },
    { id: 'order', label: 'Ordenar', icon: 'fa-arrow-down-wide-short', description: 'Ordenar resultados.' },
    { id: 'limit', label: 'Limitar', icon: 'fa-scissors', description: 'Quedarte con el top N.' },
    { id: 'join', label: 'JOIN', icon: 'fa-link', description: 'Combinar tablas relacionadas.' },
    { id: 'group', label: 'Agrupar', icon: 'fa-layer-group', description: 'GROUP BY y COUNT.' },
    { id: 'having', label: 'HAVING', icon: 'fa-list-check', description: 'Filtrar grupos.' },
    { id: 'subquery', label: 'Subconsultas', icon: 'fa-code-branch', description: 'Consultas dentro de otras.' },
    { id: 'case', label: 'CASE', icon: 'fa-code-branch', description: 'Clasificar filas con condiciones.' },
    { id: 'cte', label: 'CTE', icon: 'fa-layer-group', description: 'Organizar consultas con WITH.' },
    { id: 'rank', label: 'Ranking', icon: 'fa-list-ol', description: 'Numerar filas con ventanas.' }
];

const CHALLENGE_CONCEPT_BY_ID = {
    'basico-01': 'select',
    'filtro-01': 'where',
    'orden-01': 'order',
    'agregacion-01': 'group',
    'join-01': 'join',
    'join-02': 'join',
    'subconsulta-01': 'subquery',
    'having-01': 'having',
    'tienda-stock-01': 'where',
    'tienda-clientes-01': 'where',
    'tienda-estados-01': 'group',
    'tienda-detalle-01': 'join',
    'tienda-top-01': 'join',
    'tienda-having-01': 'having',
    'biblioteca-disponibles-01': 'where',
    'biblioteca-activos-01': 'where',
    'biblioteca-generos-01': 'group',
    'biblioteca-autores-01': 'join',
    'biblioteca-having-01': 'having',
    'biblioteca-top-01': 'join'
};

function getChallengeConceptId(challenge) {
    if (CHALLENGE_CONCEPT_BY_ID[challenge.id]) return CHALLENGE_CONCEPT_BY_ID[challenge.id];
    const text = `${challenge.titulo || ''} ${challenge.descripcion || ''}`.toLowerCase();
    if (text.includes('having')) return 'having';
    if (text.includes('join')) return 'join';
    if (text.includes('subconsulta')) return 'subquery';
    if (text.includes('agrup') || text.includes('cuenta')) return 'group';
    if (text.includes('orden')) return 'order';
    if (text.includes('filtra') || text.includes('where')) return 'where';
    return 'select';
}

function getConceptLabel(conceptId) {
    return LEARNING_CONCEPTS.find(concept => concept.id === conceptId)?.label || conceptId;
}

function enrichLessonContent(lesson, profile, track) {
    const factory = window.COURSE_CONTENT?.[track]?.[lesson.id];
    const content = typeof factory === 'function' ? factory(profile) : {};
    return {
        ...lesson,
        track,
        objectives: content.objectives || [lesson.objective],
        theory: content.theory || [{
            title: 'Concepto',
            body: lesson.explanation,
            code: lesson.example
        }],
        commonMistakes: content.commonMistakes || [],
        demoQuery: lesson.example,
        demoNote: content.demoNote || 'Ejecuta el ejemplo y observa el resultado antes de practicar.',
        quiz: content.quiz || [],
        summary: content.summary || []
    };
}

function buildLearningLessons(profile) {
    const main = profile.mainTable;
    const label = profile.labelColumn;
    const filter = profile.filterColumn;
    const filterValue = profile.filterValue;
    const sort = profile.sortColumn;
    const group = profile.groupColumn;
    const exampleGroup = profile.exampleGroup || { table: main, column: group };
    const join = profile.join;
    const joinCondition = `${join.left}.${join.leftKey} = ${join.right}.${join.rightKey}`;
    const advanced = profile.advanced || {
        caseField: sort,
        caseLabel: 'nivel',
        caseObjective: `Clasifica las filas de ${main} según ${sort}.`,
        caseRules: [
            { operator: '>=', value: 0, label: 'Alto' }
        ],
        caseElse: 'Bajo'
    };
    const caseWhens = (advanced.caseRules || [])
        .map(rule => `WHEN ${advanced.caseField} ${rule.operator} ${rule.value} THEN '${rule.label}'`)
        .join('\n        ');
    const caseExpression = `CASE\n        ${caseWhens}\n        ELSE '${advanced.caseElse}'\n      END`;
    const firstCaseRule = advanced.caseRules?.[0] || { operator: '>=', value: 0, label: 'Alto' };
    const exampleCase = `CASE WHEN ${advanced.caseField} ${firstCaseRule.operator} ${firstCaseRule.value} THEN '${firstCaseRule.label}' ELSE '${advanced.caseElse}' END`;

    const lessons = [
        {
            id: 'select',
            title: 'Selecciona columnas',
            level: 'Básico',
            objective: `Aprende a elegir solo las columnas que necesitas de ${main}.`,
            explanation: `SELECT * devuelve todas las columnas. En una consulta real conviene pedir solo los datos que vas a usar: ${label} y ${sort}.`,
            example: `SELECT ${label}\nFROM ${main};`,
            starter: `SELECT *\nFROM ${main};`,
            expectedSql: `SELECT ${label}, ${sort}\nFROM ${main};`,
            hint: `Sustituye * por ${label}, ${sort}.`,
            ordered: false
        },
        {
            id: 'where',
            title: 'Filtra con WHERE',
            level: 'Básico',
            objective: `Filtra las filas de ${main} donde ${filter} sea '${filterValue}'.`,
            explanation: 'WHERE se ejecuta sobre cada fila y solo deja pasar las que cumplen la condición. Los textos van entre comillas simples.',
            example: `SELECT *\nFROM ${main}\nWHERE ${filter} = '${filterValue}';`,
            starter: `SELECT ${label}, ${filter}\nFROM ${main}\nWHERE ${filter} = '';`,
            expectedSql: `SELECT ${label}, ${filter}\nFROM ${main}\nWHERE ${filter} = '${filterValue}';`,
            hint: `Escribe '${filterValue}' entre las comillas simples del WHERE.`,
            ordered: false
        },
        {
            id: 'order',
            title: 'Ordena con ORDER BY',
            level: 'Básico',
            objective: `Ordena ${main} por ${sort} de mayor a menor. Si hay empate, usa ${label} de forma ascendente.`,
            explanation: 'ORDER BY ordena el resultado. ASC es ascendente y DESC descendente. Puedes indicar más de un criterio separándolos con comas.',
            example: `SELECT ${label}, ${sort}\nFROM ${main}\nORDER BY ${sort} ASC, ${label} ASC;`,
            starter: `SELECT ${label}, ${sort}\nFROM ${main}\nORDER BY ${sort};`,
            expectedSql: `SELECT ${label}, ${sort}\nFROM ${main}\nORDER BY ${sort} DESC, ${label} ASC;`,
            hint: `Añade DESC a ${sort} y un segundo criterio: ${label} ASC.`,
            ordered: true
        },
        {
            id: 'limit',
            title: 'Limita resultados',
            level: 'Básico',
            objective: `Muestra solo los 5 primeros resultados después de ordenar por ${sort} y desempatar por ${label}.`,
            explanation: 'LIMIT corta el resultado. Se suele combinar con ORDER BY para obtener el top N.',
            example: `SELECT ${label}, ${sort}\nFROM ${main}\nORDER BY ${sort} DESC, ${label} ASC\nLIMIT 3;`,
            starter: `SELECT ${label}, ${sort}\nFROM ${main}\nORDER BY ${sort} DESC, ${label} ASC\nLIMIT 3;`,
            expectedSql: `SELECT ${label}, ${sort}\nFROM ${main}\nORDER BY ${sort} DESC, ${label} ASC\nLIMIT 5;`,
            hint: 'Mantén el orden y cambia LIMIT 3 por LIMIT 5.',
            ordered: true
        },
        {
            id: 'join',
            title: 'Combina tablas con JOIN',
            level: 'Intermedio',
            objective: `Une ${join.left} con ${join.right} usando su clave.`,
            explanation: `${join.description} JOIN combina filas de dos tablas y ON indica la condición que las relaciona.`,
            example: `SELECT *\nFROM ${join.left}\nJOIN ${join.right}\n  ON ${joinCondition};`,
            starter: `SELECT *\nFROM ${join.left}\nJOIN ${join.right}\n  ON ${joinCondition};`,
            expectedSql: `SELECT ${join.columns}\nFROM ${join.left}\nJOIN ${join.right}\n  ON ${joinCondition};`,
            hint: `En el SELECT escribe: ${join.columns}.`,
            ordered: false
        },
        {
            id: 'group',
            title: 'Agrupa y cuenta',
            level: 'Intermedio',
            objective: `Cuenta cuántas filas hay para cada valor de ${group} y ordena de mayor a menor.`,
            explanation: 'GROUP BY agrupa filas que comparten un valor. COUNT(*) cuenta cuántas hay en cada grupo.',
            example: `SELECT ${exampleGroup.column}, COUNT(*)\nFROM ${exampleGroup.table}\nGROUP BY ${exampleGroup.column};`,
            starter: `SELECT ${group}, COUNT(*)\nFROM ${main};`,
            expectedSql: `SELECT ${group}, COUNT(*) AS total\nFROM ${main}\nGROUP BY ${group}\nORDER BY total DESC, ${group} ASC;`,
            hint: `Usa COUNT(*) AS total y ordena por total DESC; si hay empate, por ${group} ASC.`,
            ordered: true
        },
        {
            id: 'having',
            title: 'Filtra grupos con HAVING',
            level: 'Avanzado',
            objective: `Muestra solo los grupos de ${group} que tienen más de una fila, ordenados por total.`,
            explanation: 'WHERE filtra filas antes de agrupar; HAVING filtra grupos después de GROUP BY.',
            example: `SELECT ${exampleGroup.column}, COUNT(*) AS total\nFROM ${exampleGroup.table}\nGROUP BY ${exampleGroup.column}\nHAVING COUNT(*) > 2;`,
            starter: `SELECT ${group}, COUNT(*) AS total\nFROM ${main}\nGROUP BY ${group};`,
            expectedSql: `SELECT ${group}, COUNT(*) AS total\nFROM ${main}\nGROUP BY ${group}\nHAVING COUNT(*) > 1\nORDER BY total DESC, ${group} ASC;`,
            hint: `Añade HAVING COUNT(*) > 1 y ordena por total DESC, ${group} ASC.`,
            ordered: true
        },
        {
            id: 'subquery',
            title: 'Usa una subconsulta',
            level: 'Avanzado',
            objective: `Compara cada fila con el promedio de ${sort} usando una subconsulta.`,
            explanation: `Una subconsulta es una consulta dentro de otra. Aquí calcula el promedio de ${sort} y el WHERE lo usa como referencia.`,
            example: `SELECT ${label}, ${sort}\nFROM ${main}\nWHERE ${sort} > 0\nORDER BY ${sort} DESC, ${label} ASC;`,
            starter: `SELECT ${label}, ${sort}\nFROM ${main}\nWHERE ${sort} > 0\nORDER BY ${sort} DESC, ${label} ASC;`,
            expectedSql: `SELECT ${label}, ${sort}\nFROM ${main}\nWHERE ${sort} > (SELECT AVG(${sort}) FROM ${main})\nORDER BY ${sort} DESC, ${label} ASC;`,
            hint: `Sustituye 0 por (SELECT AVG(${sort}) FROM ${main}) y mantén el orden.`,
            ordered: true
        },
        {
            id: 'case',
            title: 'Clasifica con CASE',
            level: 'Avanzado',
            objective: advanced.caseObjective,
            explanation: 'CASE evalúa las condiciones en orden y devuelve la primera etiqueta que coincide. Es la forma de crear categorías dentro de una consulta sin modificar los datos.',
            example: `SELECT ${label}, ${advanced.caseField}, ${exampleCase} AS ${advanced.caseLabel}\nFROM ${main}\nORDER BY ${advanced.caseField} DESC, ${label} ASC;`,
            starter: `SELECT ${label}, ${advanced.caseField}, 'Pendiente' AS ${advanced.caseLabel}\nFROM ${main}\nORDER BY ${advanced.caseField} DESC, ${label} ASC;`,
            expectedSql: `SELECT ${label}, ${advanced.caseField}, ${caseExpression} AS ${advanced.caseLabel}\nFROM ${main}\nORDER BY ${advanced.caseField} DESC, ${label} ASC;`,
            hint: `Completa el CASE con las reglas ${advanced.caseRules.map(rule => `${advanced.caseField} ${rule.operator} ${rule.value} → ${rule.label}`).join(', ')} y el ELSE '${advanced.caseElse}'.`,
            ordered: true
        },
        {
            id: 'cte',
            title: 'Organiza con WITH',
            level: 'Avanzado',
            objective: `Resume ${main} por ${group} y calcula qué porcentaje representa cada grupo.`,
            explanation: 'Una CTE (Common Table Expression) es una consulta con nombre que puedes reutilizar dentro de otra. WITH hace que los pasos intermedios se lean como una historia.',
            example: `WITH resumen AS (\n    SELECT ${group}, COUNT(*) AS total\n    FROM ${main}\n    GROUP BY ${group}\n)\nSELECT ${group}, total\nFROM resumen\nORDER BY total DESC, ${group} ASC;`,
            starter: `SELECT ${group}, COUNT(*) AS total\nFROM ${main}\nGROUP BY ${group}\nORDER BY total DESC, ${group} ASC;`,
            expectedSql: `WITH resumen AS (\n    SELECT ${group}, COUNT(*) AS total\n    FROM ${main}\n    GROUP BY ${group}\n)\nSELECT ${group}, total,\n       ROUND(total * 100.0 / (SELECT COUNT(*) FROM ${main}), 1) AS porcentaje\nFROM resumen\nORDER BY total DESC, ${group} ASC;`,
            hint: 'Añade la columna porcentaje usando el total del grupo y el total de filas de la tabla.',
            ordered: true
        },
        {
            id: 'rank',
            title: 'Ranking con ventanas',
            level: 'Avanzado',
            objective: `Numera ${main} dentro de cada ${group} según ${sort} de mayor a menor.`,
            explanation: 'ROW_NUMBER() OVER (PARTITION BY ... ORDER BY ...) asigna un número a cada fila dentro de su grupo. Es ideal para rankings, comparativas y reportes por categoría.',
            example: `SELECT ${label}, ${group}, ${sort},\n       ROW_NUMBER() OVER (ORDER BY ${sort} DESC) AS posicion\nFROM ${main}\nORDER BY ${sort} DESC;`,
            starter: `SELECT ${label}, ${group}, ${sort}\nFROM ${main}\nORDER BY ${group} ASC, ${sort} DESC;`,
            expectedSql: `SELECT ${label}, ${group}, ${sort},\n       ROW_NUMBER() OVER (PARTITION BY ${group} ORDER BY ${sort} DESC, ${label} ASC) AS posicion\nFROM ${main}\nORDER BY ${group} ASC, posicion ASC;`,
            hint: `Usa PARTITION BY ${group} y ordena la ventana por ${sort} DESC, ${label} ASC.`,
            ordered: true
        }
    ];

    return lessons.map(lesson => enrichLessonContent(lesson, profile, 'sql'));
}

function getLearningDatasetName() {
    return LEARNING_PATH_PROFILES[preferences.dataset] ? preferences.dataset : 'escuela';
}

function getLearningProfile() {
    return LEARNING_PATH_PROFILES[getLearningDatasetName()];
}

function getLearningLessonsForDataset(datasetName) {
    return buildLearningLessons(LEARNING_PATH_PROFILES[datasetName] || LEARNING_PATH_PROFILES.escuela);
}

function getLearningLessons() {
    return getLearningLessonsForDataset(getLearningDatasetName());
}

function getLearningLessonById(id) {
    return getLearningLessons().find(lesson => lesson.id === id) || null;
}

function getLearningLevelClass(level) {
    if (level === 'Básico') return 'basico';
    if (level === 'Intermedio') return 'intermedio';
    return 'avanzado';
}

function getCourses() {
    return Array.isArray(window.SQL_ACADEMY_COURSES) ? window.SQL_ACADEMY_COURSES : [];
}

function getCourseById(id) {
    return getCourses().find(course => course.id === id) || null;
}

function getCourseLessonIds(course) {
    return (course?.modules || []).flatMap(module => Array.isArray(module.lessonIds) ? module.lessonIds : []);
}

function getNoSQLCourseProfile(datasetName = getNoSQLActiveDatasetName()) {
    return window.NOSQL_COURSE_PROFILES?.[datasetName]
        || window.NOSQL_COURSE_PROFILES?.escuela
        || null;
}

function buildNoSQLCourseLessons(datasetName = getNoSQLActiveDatasetName()) {
    const profile = getNoSQLCourseProfile(datasetName);
    if (!profile) return [];

    const collection = profile.collection;
    const projection = profile.fields.map(field => `${field}: 1`).join(', ');
    const sortProjection = `${profile.labelField}: 1, ${profile.sortField}: 1`;
    const filterClause = `{ ${profile.filterField}: { ${profile.filterOperator}: ${profile.filterValue} } }`;
    const groupId = "'$" + profile.groupField + "'";
    const groupStage = `{ $group: { _id: ${groupId}, total: { $sum: 1 } } }`;

    const lessons = [
        {
            id: 'nosql-find',
            track: 'nosql',
            title: 'Consulta documentos',
            level: 'Básico',
            objective: `Muestra solo ${profile.fields.join(', ')} de cada documento de ${collection}.`,
            explanation: 'find recibe un filtro y una proyección. El filtro decide qué documentos entran; la proyección decide qué campos salen. Así evitas traer datos que no necesitas.',
            example: `db.${collection}.findOne({})`,
            starter: `db.${collection}.find({})`,
            expectedQuery: `db.${collection}.find({}, { ${projection} })`,
            hint: `Añade un segundo argumento con ${profile.fields.map(field => `${field}: 1`).join(', ')}.`,
            ordered: true
        },
        {
            id: 'nosql-filter',
            track: 'nosql',
            title: 'Filtra con operadores',
            level: 'Básico',
            objective: `Encuentra los documentos con ${profile.filterDescription} y muestra ${profile.fields.join(', ')}.`,
            explanation: 'Los operadores $gt, $gte, $lt, $lte e $in comparan valores dentro del filtro. Es la forma documental de construir un WHERE.',
            example: `db.${collection}.find(${filterClause}, { ${projection} }).limit(1)`,
            starter: `db.${collection}.find({}, { ${projection} })`,
            expectedQuery: `db.${collection}.find(${filterClause}, { ${projection} })`,
            hint: `Usa ${filterClause} como primer argumento de find.`,
            ordered: true
        },
        {
            id: 'nosql-sort',
            track: 'nosql',
            title: 'Ordena y limita',
            level: 'Intermedio',
            objective: `Muestra los 3 documentos con ${profile.sortLabel} más alto, ordenados de mayor a menor.`,
            explanation: 'sort ordena los documentos y limit corta el resultado. Juntos construyen un top: primero ordenas por el criterio importante y después eliges cuántos quieres ver.',
            example: `db.${collection}.find({}, { ${sortProjection} }).sort({ ${profile.sortField}: 1 }).limit(2)`,
            starter: `db.${collection}.find({}, { ${sortProjection} }).limit(3)`,
            expectedQuery: `db.${collection}.find({}, { ${sortProjection} }).sort({ ${profile.sortField}: -1 }).limit(3)`,
            hint: `Encadena .sort({ ${profile.sortField}: -1 }) antes de .limit(3).`,
            ordered: true
        },
        {
            id: 'nosql-aggregate',
            track: 'nosql',
            title: 'Agrupa y cuenta',
            level: 'Intermedio',
            objective: `Cuenta cuántos documentos hay por ${profile.groupDescription} y ordena de mayor a menor por total.`,
            explanation: 'aggregate ejecuta un pipeline de etapas. $group crea un documento por categoría y $sum acumula el total. $sort ordena el resultado final, no los documentos originales.',
            example: `db.${collection}.aggregate([${groupStage}, { $limit: 1 }])`,
            starter: `db.${collection}.aggregate([${groupStage}, { $sort: { _id: 1 } }])`,
            expectedQuery: `db.${collection}.aggregate([${groupStage}, { $sort: { total: -1, _id: 1 } }])`,
            hint: `Añade { $sort: { total: -1, _id: 1 } } al final del pipeline.`,
            ordered: true
        }
    ];

    return lessons.map(lesson => enrichLessonContent(lesson, profile, 'nosql'));
}

function normalizeNoSQLCourseValue(value) {
    if (Array.isArray(value)) return value.map(normalizeNoSQLCourseValue);
    if (value && typeof value === 'object') {
        return Object.keys(value).sort().reduce((result, key) => {
            result[key] = normalizeNoSQLCourseValue(value[key]);
            return result;
        }, {});
    }
    return value;
}

function compareNoSQLCourseResults(expected, actual) {
    if (!Array.isArray(expected?.documents) || !Array.isArray(actual?.documents)) {
        return {
            ok: false,
            message: 'La consulta debe devolver una lista de documentos con find o aggregate.'
        };
    }

    if (expected.documents.length !== actual.documents.length) {
        return {
            ok: false,
            message: `Se esperaban ${expected.documents.length} documentos y tu consulta devolvió ${actual.documents.length}. Revisa el filtro y el límite.`
        };
    }

    const expectedValue = JSON.stringify(normalizeNoSQLCourseValue(expected.documents));
    const actualValue = JSON.stringify(normalizeNoSQLCourseValue(actual.documents));
    if (expectedValue === actualValue) {
        return { ok: true, message: '¡Correcto! Los documentos coinciden.' };
    }

    return {
        ok: false,
        message: 'Los documentos no coinciden. Revisa la proyección, el filtro y el orden.'
    };
}

function getCourseDatasetName(course = getActiveCourse()) {
    return course?.track === 'nosql' ? getNoSQLActiveDatasetName() : getLearningDatasetName();
}

function getCourseDatasetLabel(course = getActiveCourse()) {
    if (course?.track === 'nosql') {
        const profile = getNoSQLCourseProfile(getCourseDatasetName(course));
        return `Dataset NoSQL: ${profile?.name || getCourseDatasetName(course)}`;
    }
    return `Dataset SQL: ${getLearningProfile().name}`;
}

function getCourseLessons(course = getActiveCourse(), datasetName = getCourseDatasetName(course)) {
    if (!course) return [];
    if (course.track === 'nosql') return buildNoSQLCourseLessons(datasetName);

    const lessonsById = new Map(getLearningLessonsForDataset(datasetName).map(lesson => [lesson.id, lesson]));
    return getCourseLessonIds(course)
        .map(id => lessonsById.get(id))
        .filter(Boolean);
}

function getActiveCourseLessonById(id) {
    const course = getActiveCourse();
    if (!course) return getLearningLessonById(id);
    return getCourseLessons(course).find(lesson => lesson.id === id) || null;
}

function getCourseForLesson(lessonId) {
    return getCourses().find(course => getCourseLessonIds(course).includes(lessonId)) || null;
}

function getActiveCourse() {
    return getCourseById(currentCourseId)
        || getCourses().find(course => course.recommended)
        || getCourses()[0]
        || null;
}

function getActiveCourseLessons() {
    return getCourseLessons(getActiveCourse());
}

function getCourseModuleForLesson(course, lessonId) {
    return (course?.modules || []).find(module => (module.lessonIds || []).includes(lessonId)) || null;
}

function getCourseProgress(course = getActiveCourse(), datasetName = getCourseDatasetName(course)) {
    const lessons = getCourseLessons(course, datasetName);
    const completed = lessons.filter(lesson => (
        course?.track === 'nosql'
            ? isNoSQLCourseLessonCompleted(lesson.id, datasetName)
            : isLearningLessonCompletedForDataset(lesson.id, datasetName)
    )).length;
    return {
        total: lessons.length,
        completed,
        percent: lessons.length ? Math.round((completed / lessons.length) * 100) : 0
    };
}

function getCourseLessonStages(course, lessonId) {
    return course?.track === 'nosql'
        ? getNoSQLCourseLessonStages(lessonId)
        : getLearningLessonStages(lessonId);
}

function markCourseLessonTheoryRead(course, lessonId) {
    const result = course?.track === 'nosql'
        ? markNoSQLCourseTheoryRead(lessonId)
        : markLearningTheoryRead(lessonId);
    updateCourseCta();
    return result;
}

function markCourseLessonPracticeCompleted(course, lessonId) {
    return course?.track === 'nosql'
        ? markNoSQLCoursePracticeCompleted(lessonId)
        : markLearningPracticeCompleted(lessonId);
}

function markCourseLessonQuizPassed(course, lessonId) {
    return course?.track === 'nosql'
        ? markNoSQLCourseQuizPassed(lessonId)
        : markLearningQuizPassed(lessonId);
}

function isCourseLessonCompleted(course, lessonId) {
    return course?.track === 'nosql'
        ? isNoSQLCourseLessonCompleted(lessonId)
        : isLearningLessonCompleted(lessonId);
}

function hasCourseStarted(course = getActiveCourse()) {
    return getCourseLessons(course).some(lesson => {
        const stages = getCourseLessonStages(course, lesson.id);
        return stages.theoryRead || stages.practiceCompleted || stages.quizPassed;
    }) || Boolean(course && getCourseAssessmentRecord(course).projects[course.id]?.completedAt);
}

function getCourseStatusLabel(course, progress = getCourseProgress(course)) {
    if (!progress.total) return 'Sin lecciones';
    const completion = getCourseCompletionState(course);
    if (completion.complete) return 'Completado';
    if (!completion.lessonsComplete) return hasCourseStarted(course) ? 'En progreso' : 'Sin empezar';
    if (completion.checkpointsPassed < completion.checkpointsTotal) return 'Checkpoints pendientes';
    return 'Proyecto pendiente';
}

function getNextCourse(courseId) {
    const courses = getCourses();
    const index = courses.findIndex(course => course.id === courseId);
    return index >= 0 ? courses[index + 1] || null : null;
}

function getCourseNextMarkup(course, lessons, lesson) {
    const index = lessons.findIndex(item => item.id === lesson.id);
    const nextLesson = lessons[index + 1];
    const nextCourse = getNextCourse(course?.id);

    if (nextLesson) {
        return `<button type="button" class="btn-primary" onclick="nextLearningLesson()">Siguiente: ${escapeHtml(nextLesson.title)} <i class="fas fa-arrow-right"></i></button>`;
    }

    if (course) {
        const completion = getCourseCompletionState(course);
        if (!completion.lessonsComplete) {
            return '<div class="path-complete"><i class="fas fa-circle-check"></i> Lección completada. Aún quedan pendientes en el curso.</div>';
        }
        if (completion.checkpointsPassed < completion.checkpointsTotal) {
            return `
                <div class="path-complete"><i class="fas fa-circle-check"></i> Lecciones completadas. Quedan los checkpoints de módulo.</div>
                <button type="button" class="btn-primary" onclick="openCourse('${escapeHtml(course.id)}')">Completar checkpoints <i class="fas fa-arrow-right"></i></button>
            `;
        }
        if (!completion.projectComplete) {
            return `
                <div class="path-complete"><i class="fas fa-circle-check"></i> Checkpoints superados. Queda el proyecto final.</div>
                <button type="button" class="btn-primary" onclick="openCourse('${escapeHtml(course.id)}')">Completar proyecto final <i class="fas fa-arrow-right"></i></button>
            `;
        }
        if (nextCourse) {
            return `
                <div class="path-complete"><i class="fas fa-trophy"></i> ¡Curso completado!</div>
                <button type="button" class="btn-primary" onclick="openCourse('${escapeHtml(nextCourse.id)}')">Siguiente curso: ${escapeHtml(nextCourse.title)} <i class="fas fa-arrow-right"></i></button>
            `;
        }
        return `
            <div class="path-complete"><i class="fas fa-trophy"></i> ¡Completaste todos los cursos!</div>
            <button type="button" class="btn-secondary" onclick="showCourseCatalog()">Elegir otro curso</button>
        `;
    }

    const stats = getLearningProgressStats();
    if (stats.completed === stats.total) {
        return '<div class="path-complete"><i class="fas fa-trophy"></i> ¡Completaste la ruta!</div>';
    }
    return '<div class="path-complete"><i class="fas fa-circle-check"></i> Lección completada. Aún quedan pendientes en la ruta.</div>';
}

function loadActiveCourse() {
    const stored = readStoredJSON(STORAGE_KEYS.activeCourse, '');
    return getCourseById(stored) ? stored : null;
}

function saveActiveCourse() {
    writeStoredJSON(STORAGE_KEYS.activeCourse, currentCourseId || '');
}

function loadCourseAssessment() {
    const stored = readStoredJSON(STORAGE_KEYS.courseAssessment, {});
    courseAssessment = stored && typeof stored === 'object' && !Array.isArray(stored) ? stored : {};
}

function saveCourseAssessment() {
    writeStoredJSON(STORAGE_KEYS.courseAssessment, courseAssessment);
}

function getCourseAssessmentRecord(course = getActiveCourse()) {
    if (!course) return { checkpoints: {}, projects: {} };
    const key = `${course.track === 'nosql' ? 'nosql' : 'sql'}|${getCourseDatasetName(course)}`;
    if (!courseAssessment[key] || typeof courseAssessment[key] !== 'object') {
        courseAssessment[key] = { checkpoints: {}, projects: {} };
    }
    const record = courseAssessment[key];
    record.checkpoints ||= {};
    record.projects ||= {};
    return record;
}

function getModuleCheckpointQuestions(courseId, moduleId) {
    return window.COURSE_CHECKPOINTS?.[courseId]?.[moduleId] || [];
}

function isModuleLessonsComplete(course, module) {
    const lessons = getCourseLessons(course);
    const moduleLessons = (module.lessonIds || [])
        .map(id => lessons.find(lesson => lesson.id === id))
        .filter(Boolean);
    return moduleLessons.length > 0 && moduleLessons.every(lesson => isCourseLessonCompleted(course, lesson.id));
}

function isModuleCheckpointPassed(course, moduleId) {
    return Boolean(getCourseAssessmentRecord(course).checkpoints[moduleId]?.passedAt);
}

function markModuleCheckpointPassed(course, moduleId) {
    const record = getCourseAssessmentRecord(course);
    record.checkpoints[moduleId] = {
        passedAt: record.checkpoints[moduleId]?.passedAt || new Date().toISOString()
    };
    saveCourseAssessment();
}

function isCourseProjectCompleted(course) {
    return Boolean(getCourseAssessmentRecord(course).projects[course.id]?.completedAt);
}

function markCourseProjectCompleted(course, criteria) {
    const record = getCourseAssessmentRecord(course);
    record.projects[course.id] = {
        completedAt: new Date().toISOString(),
        criteria: Array.isArray(criteria) ? criteria : []
    };
    saveCourseAssessment();
}

function getCourseCompletionState(course = getActiveCourse()) {
    if (!course) {
        return { lessonsComplete: false, checkpointsTotal: 0, checkpointsPassed: 0, projectComplete: false, complete: false };
    }
    const lessons = getCourseLessons(course);
    const lessonsComplete = lessons.length > 0 && lessons.every(lesson => isCourseLessonCompleted(course, lesson.id));
    const modules = course.modules || [];
    const checkpointsPassed = modules.filter(module => isModuleCheckpointPassed(course, module.id)).length;
    const projectComplete = isCourseProjectCompleted(course);
    return {
        lessonsComplete,
        checkpointsTotal: modules.length,
        checkpointsPassed,
        projectComplete,
        complete: lessonsComplete && checkpointsPassed === modules.length && projectComplete
    };
}

function migrateProgressEntries(progress) {
    Object.values(progress || {}).forEach(entry => {
        if (!entry?.completed) return;
        entry.completedAt ||= new Date().toISOString();
        entry.theoryReadAt ||= entry.completedAt;
        entry.practiceCompletedAt ||= entry.completedAt;
        entry.quizPassedAt ||= entry.completedAt;
    });
}

function loadNoSQLCourseProgress() {
    const stored = readStoredJSON(STORAGE_KEYS.nosqlCourse, {});
    nosqlCourseProgress = stored && typeof stored === 'object' && !Array.isArray(stored) ? stored : {};
    Object.values(nosqlCourseProgress).forEach(migrateProgressEntries);
}

function saveNoSQLCourseProgress() {
    writeStoredJSON(STORAGE_KEYS.nosqlCourse, nosqlCourseProgress);
}

function getNoSQLCourseDatasetProgress(datasetName = getNoSQLActiveDatasetName()) {
    if (!nosqlCourseProgress[datasetName] || typeof nosqlCourseProgress[datasetName] !== 'object') {
        nosqlCourseProgress[datasetName] = {};
    }
    return nosqlCourseProgress[datasetName];
}

function getNoSQLCourseProgressEntry(id, datasetName = getNoSQLActiveDatasetName(), create = true) {
    if (!create && !nosqlCourseProgress[datasetName]?.[id]) return null;
    return getNoSQLCourseDatasetProgress(datasetName)[id] ||= {};
}

function getNoSQLCourseLessonStages(id, datasetName = getNoSQLActiveDatasetName()) {
    const entry = nosqlCourseProgress[datasetName]?.[id] || {};
    return {
        theoryRead: Boolean(entry.theoryReadAt),
        practiceCompleted: Boolean(entry.practiceCompletedAt),
        quizPassed: Boolean(entry.quizPassedAt),
        completed: Boolean(entry.completed)
    };
}

function finalizeNoSQLCourseLesson(id, entry) {
    if (!entry.theoryReadAt || !entry.practiceCompletedAt || !entry.quizPassedAt) return;
    entry.completed = true;
    entry.completedAt ||= new Date().toISOString();
}

function markNoSQLCourseTheoryRead(id) {
    const entry = getNoSQLCourseProgressEntry(id);
    entry.theoryReadAt ||= new Date().toISOString();
    finalizeNoSQLCourseLesson(id, entry);
    saveNoSQLCourseProgress();
    return entry;
}

function markNoSQLCoursePracticeCompleted(id) {
    const entry = getNoSQLCourseProgressEntry(id);
    entry.practiceCompletedAt ||= new Date().toISOString();
    finalizeNoSQLCourseLesson(id, entry);
    saveNoSQLCourseProgress();
    renderLearningProgressDashboard();
    return entry;
}

function markNoSQLCourseQuizPassed(id) {
    const entry = getNoSQLCourseProgressEntry(id);
    entry.quizPassedAt ||= new Date().toISOString();
    finalizeNoSQLCourseLesson(id, entry);
    saveNoSQLCourseProgress();
    renderLearningProgressDashboard();
    return entry;
}

function isNoSQLCourseLessonCompleted(id, datasetName = getNoSQLActiveDatasetName()) {
    return Boolean(nosqlCourseProgress[datasetName]?.[id]?.completed);
}

function markNoSQLCourseLessonCompleted(id) {
    const now = new Date().toISOString();
    const entry = getNoSQLCourseProgressEntry(id);
    entry.theoryReadAt ||= now;
    entry.practiceCompletedAt ||= now;
    entry.quizPassedAt ||= now;
    entry.completed = true;
    entry.completedAt ||= now;
    saveNoSQLCourseProgress();
    renderLearningProgressDashboard();
}

function loadLearningPathProgress() {
    const stored = readStoredJSON(STORAGE_KEYS.learningPath, {});
    learningPathProgress = stored && typeof stored === 'object' && !Array.isArray(stored) ? stored : {};
    Object.values(learningPathProgress).forEach(migrateProgressEntries);
}

function saveLearningPathProgress() {
    writeStoredJSON(STORAGE_KEYS.learningPath, learningPathProgress);
}

function getLearningDatasetProgressFor(datasetName = getLearningDatasetName()) {
    if (!learningPathProgress[datasetName] || typeof learningPathProgress[datasetName] !== 'object') {
        learningPathProgress[datasetName] = {};
    }
    return learningPathProgress[datasetName];
}

function getLearningDatasetProgress() {
    return getLearningDatasetProgressFor(getLearningDatasetName());
}

function getLearningProgressEntry(id, datasetName = getLearningDatasetName(), create = true) {
    if (!create && !learningPathProgress[datasetName]?.[id]) return null;
    return getLearningDatasetProgressFor(datasetName)[id] ||= {};
}

function getLearningLessonStages(id, datasetName = getLearningDatasetName()) {
    const entry = learningPathProgress[datasetName]?.[id] || {};
    return {
        theoryRead: Boolean(entry.theoryReadAt),
        practiceCompleted: Boolean(entry.practiceCompletedAt),
        quizPassed: Boolean(entry.quizPassedAt),
        completed: Boolean(entry.completed)
    };
}

function finalizeLearningLesson(id, entry) {
    if (!entry.theoryReadAt || !entry.practiceCompletedAt || !entry.quizPassedAt) return;
    entry.completed = true;
    entry.completedAt ||= new Date().toISOString();
}

function markLearningTheoryRead(id) {
    const entry = getLearningProgressEntry(id);
    entry.theoryReadAt ||= new Date().toISOString();
    finalizeLearningLesson(id, entry);
    saveLearningPathProgress();
    return entry;
}

function markLearningPracticeCompleted(id) {
    const entry = getLearningProgressEntry(id);
    entry.practiceCompletedAt ||= new Date().toISOString();
    finalizeLearningLesson(id, entry);
    saveLearningPathProgress();
    renderLearningProgressDashboard();
    return entry;
}

function markLearningQuizPassed(id) {
    const entry = getLearningProgressEntry(id);
    entry.quizPassedAt ||= new Date().toISOString();
    finalizeLearningLesson(id, entry);
    saveLearningPathProgress();
    renderLearningProgressDashboard();
    return entry;
}

function isLearningLessonCompletedForDataset(id, datasetName) {
    return Boolean(learningPathProgress[datasetName]?.[id]?.completed);
}

function isLearningLessonCompleted(id) {
    return isLearningLessonCompletedForDataset(id, getLearningDatasetName());
}

function markLearningLessonCompleted(id) {
    const now = new Date().toISOString();
    const entry = getLearningProgressEntry(id);
    entry.theoryReadAt ||= now;
    entry.practiceCompletedAt ||= now;
    entry.quizPassedAt ||= now;
    entry.completed = true;
    entry.completedAt ||= now;
    saveLearningPathProgress();
    renderLearningProgressDashboard();
}

function getLearningProgressStats() {
    const lessons = getLearningLessons();
    const completed = lessons.filter(lesson => isLearningLessonCompleted(lesson.id)).length;
    return {
        total: lessons.length,
        completed,
        percent: lessons.length ? Math.round((completed / lessons.length) * 100) : 0
    };
}

function getLearningDatasetStats(datasetName) {
    const lessons = getLearningLessonsForDataset(datasetName);
    const challenges = getChallengeCatalog(datasetName);
    const lessonsCompleted = lessons.filter(lesson => (
        isLearningLessonCompletedForDataset(lesson.id, datasetName)
    )).length;
    const challengesCompleted = challenges.filter(challenge => (
        Boolean(challengeProgress[challenge.id]?.completed)
    )).length;
    const total = lessons.length + challenges.length;
    const completed = lessonsCompleted + challengesCompleted;

    return {
        datasetName,
        name: LEARNING_PATH_PROFILES[datasetName]?.name || datasetName,
        lessonsTotal: lessons.length,
        lessonsCompleted,
        challengesTotal: challenges.length,
        challengesCompleted,
        total,
        completed,
        percent: total ? Math.round((completed / total) * 100) : 0
    };
}

function getLearningGlobalStats() {
    const datasetStats = Object.keys(LEARNING_PATH_PROFILES).map(getLearningDatasetStats);
    const totals = datasetStats.reduce((accumulator, stat) => ({
        lessonsTotal: accumulator.lessonsTotal + stat.lessonsTotal,
        lessonsCompleted: accumulator.lessonsCompleted + stat.lessonsCompleted,
        challengesTotal: accumulator.challengesTotal + stat.challengesTotal,
        challengesCompleted: accumulator.challengesCompleted + stat.challengesCompleted,
        total: accumulator.total + stat.total,
        completed: accumulator.completed + stat.completed
    }), {
        lessonsTotal: 0,
        lessonsCompleted: 0,
        challengesTotal: 0,
        challengesCompleted: 0,
        total: 0,
        completed: 0
    });

    return {
        ...totals,
        percent: totals.total ? Math.round((totals.completed / totals.total) * 100) : 0,
        datasetStats
    };
}

function getLearningConceptStats() {
    return LEARNING_CONCEPTS.map(concept => {
        const stats = {
            lessonsTotal: 0,
            lessonsCompleted: 0,
            challengesTotal: 0,
            challengesCompleted: 0
        };

        Object.keys(LEARNING_PATH_PROFILES).forEach(datasetName => {
            const lessons = getLearningLessonsForDataset(datasetName)
                .filter(lesson => lesson.id === concept.id);
            stats.lessonsTotal += lessons.length;
            stats.lessonsCompleted += lessons.filter(lesson => (
                isLearningLessonCompletedForDataset(lesson.id, datasetName)
            )).length;

            const challenges = getChallengeCatalog(datasetName)
                .filter(challenge => getChallengeConceptId(challenge) === concept.id);
            stats.challengesTotal += challenges.length;
            stats.challengesCompleted += challenges.filter(challenge => (
                Boolean(challengeProgress[challenge.id]?.completed)
            )).length;
        });

        const total = stats.lessonsTotal + stats.challengesTotal;
        const completed = stats.lessonsCompleted + stats.challengesCompleted;
        return {
            ...concept,
            ...stats,
            total,
            completed,
            percent: total ? Math.round((completed / total) * 100) : 0
        };
    });
}

function getRecentLearningActivity() {
    const activity = [];

    Object.entries(learningPathProgress).forEach(([datasetName, progress]) => {
        Object.entries(progress || {}).forEach(([lessonId, data]) => {
            if (!data?.completedAt) return;
            const lesson = getLearningLessonsForDataset(datasetName)
                .find(item => item.id === lessonId);
            if (!lesson) return;
            activity.push({
                type: 'Lección',
                title: lesson.title,
                datasetName,
                icon: 'fa-route',
                completedAt: data.completedAt
            });
        });
    });

    Object.entries(nosqlCourseProgress).forEach(([datasetName, progress]) => {
        Object.entries(progress || {}).forEach(([lessonId, data]) => {
            if (!data?.completedAt) return;
            const lesson = buildNoSQLCourseLessons(datasetName)
                .find(item => item.id === lessonId);
            if (!lesson) return;
            activity.push({
                type: 'Lección NoSQL',
                title: lesson.title,
                datasetName,
                icon: 'fa-leaf',
                completedAt: data.completedAt
            });
        });
    });

    Object.entries(challengeProgress).forEach(([challengeId, data]) => {
        if (!data?.completedAt) return;
        const datasetName = Object.keys(LEARNING_PATH_PROFILES).find(name => (
            getChallengeCatalog(name).some(challenge => challenge.id === challengeId)
        ));
        if (!datasetName) return;
        const challenge = getChallengeCatalog(datasetName)
            .find(item => item.id === challengeId);
        if (!challenge) return;
        activity.push({
            type: 'Reto',
            title: challenge.titulo,
            datasetName,
            icon: 'fa-trophy',
            completedAt: data.completedAt
        });
    });

    return activity
        .sort((left, right) => new Date(right.completedAt) - new Date(left.completedAt))
        .slice(0, 4);
}

function getLearningRecommendation() {
    const datasetName = getLearningDatasetName();
    const profile = LEARNING_PATH_PROFILES[datasetName];
    const lessons = getLearningLessonsForDataset(datasetName);
    const nextLesson = lessons.find(lesson => (
        !isLearningLessonCompletedForDataset(lesson.id, datasetName)
    ));
    if (nextLesson) {
        const course = getCourseForLesson(nextLesson.id);
        const courseLessons = course ? getCourseLessons(course, datasetName) : lessons;
        const completedLessons = course
            ? getCourseProgress(course, datasetName).completed
            : lessons.filter(lesson => isLearningLessonCompletedForDataset(lesson.id, datasetName)).length;
        const lessonIndex = Math.max(0, courseLessons.findIndex(lesson => lesson.id === nextLesson.id));
        return {
            kind: 'lesson',
            title: nextLesson.title,
            message: completedLessons > 0
                ? `Continúa ${course?.title || 'tu curso'} en ${profile.name} con la lección ${lessonIndex + 1}.`
                : `Empieza ${course?.title || 'tu curso'} en ${profile.name} con la lección ${lessonIndex + 1}.`,
            action: completedLessons > 0 ? 'Continuar lección' : 'Comenzar lección',
            onclick: `continueLearningLesson('${nextLesson.id}')`,
            icon: 'fa-graduation-cap'
        };
    }

    const nosqlCourse = getCourseById('nosql-esencial');
    if (nosqlCourse) {
        const nosqlLessons = getCourseLessons(nosqlCourse);
        const nextNoSQLLesson = nosqlLessons.find(lesson => !isNoSQLCourseLessonCompleted(lesson.id));
        if (nextNoSQLLesson) {
            const nosqlProfile = getNoSQLCourseProfile();
            return {
                kind: 'lesson',
                title: nextNoSQLLesson.title,
                message: `Explora ${nosqlCourse.title} en ${nosqlProfile?.name || getNoSQLActiveDatasetName()} con una lección corta.`,
                action: 'Continuar NoSQL',
                onclick: `continueLearningLesson('${nextNoSQLLesson.id}')`,
                icon: 'fa-leaf'
            };
        }
    }

    const challenges = getChallengeCatalog(datasetName);
    const nextChallenge = challenges.find(challenge => !challengeProgress[challenge.id]?.completed);
    if (nextChallenge) {
        return {
            kind: 'challenge',
            title: nextChallenge.titulo,
            message: `Practica ${getConceptLabel(getChallengeConceptId(nextChallenge))} con un reto de ${profile.name}.`,
            action: 'Practicar reto',
            onclick: `practiceLearningChallenge('${nextChallenge.id}')`,
            icon: 'fa-trophy'
        };
    }

    const otherDataset = Object.keys(LEARNING_PATH_PROFILES).find(name => {
        if (name === datasetName) return false;
        return getLearningLessonsForDataset(name).some(lesson => (
            !isLearningLessonCompletedForDataset(lesson.id, name)
        )) || getChallengeCatalog(name).some(challenge => !challengeProgress[challenge.id]?.completed);
    });

    if (otherDataset) {
        return {
            kind: 'dataset',
            title: `Cursos de ${profile.name} completados`,
            message: `Ya completaste este dataset. Cambia a ${LEARNING_PATH_PROFILES[otherDataset].name} desde Practicar para seguir avanzando.`,
            action: 'Ir a Practicar',
            onclick: "activateSection('practice')",
            icon: 'fa-arrow-right'
        };
    }

    return {
        kind: 'done',
        title: '¡Todo completado!',
        message: 'Has terminado las lecciones y retos de todos los datasets. Repasa o explora el laboratorio NoSQL.',
        action: 'Ir a Retos',
        onclick: 'openSQLChallenges()',
        icon: 'fa-trophy'
    };
}

function updateCourseCta() {
    const button = document.getElementById('pathCtaBtn');
    if (!button) return;
    const started = getCourses().some(course => hasCourseStarted(course));
    button.innerHTML = started
        ? 'Continuar cursos <i class="fas fa-arrow-right"></i>'
        : 'Explorar cursos <i class="fas fa-arrow-right"></i>';
}

function setCourseView(view) {
    currentCourseView = ['catalog', 'detail', 'player'].includes(view) ? view : 'catalog';
    const views = {
        catalog: document.getElementById('courseCatalogView'),
        detail: document.getElementById('courseDetailView'),
        player: document.getElementById('coursePlayerView')
    };
    Object.entries(views).forEach(([name, element]) => {
        if (!element) return;
        const active = name === currentCourseView;
        element.hidden = !active;
        element.classList.toggle('active', active);
    });
}

function renderCourseCatalog() {
    const container = document.getElementById('courseCatalogView');
    if (!container) return;

    const courses = getCourses();
    const profile = getLearningProfile();
    const nosqlProfile = getNoSQLCourseProfile();
    setCourseView('catalog');
    updateCourseCta();

    if (!courses.length) {
        container.innerHTML = '<div class="challenge-empty"><i class="fas fa-graduation-cap"></i><h3>No hay cursos disponibles.</h3><p>Vuelve a cargar la página para preparar el catálogo.</p></div>';
        return;
    }

    container.innerHTML = `
        <div class="course-catalog-hero">
            <div>
                <span class="course-eyebrow"><i class="fas fa-graduation-cap"></i> Aprende haciendo</span>
                <h3>Elige tu siguiente misión</h3>
                <p>Teoría breve, demostraciones, práctica, quiz, checkpoints y proyecto final. Tu progreso se guarda en cada dataset.</p>
            </div>
            <div class="course-catalog-dataset">
                <span>Datasets activos</span>
                <strong>SQL: ${escapeHtml(profile.name)}</strong>
                <small>NoSQL: ${escapeHtml(nosqlProfile?.name || getNoSQLActiveDatasetName())}</small>
            </div>
        </div>
        <div class="course-grid">
            ${courses.map(course => {
                const progress = getCourseProgress(course);
                const lessons = getCourseLessons(course);
                const isActive = currentCourseId === course.id;
                const started = hasCourseStarted(course);
                const completion = getCourseCompletionState(course);
                const status = getCourseStatusLabel(course, progress);
                const needsAssessment = progress.percent === 100 && !completion.complete;
                const cta = completion.complete
                    ? 'Repasar curso'
                    : needsAssessment
                        ? 'Completar curso'
                        : started
                            ? 'Continuar'
                            : 'Comenzar';
                const prerequisites = (course.prerequisites || []).length
                    ? `<span class="course-card-prerequisite">Después de ${escapeHtml(course.prerequisites.join(', '))}</span>`
                    : '';
                return `
                    <article class="course-card course-card-${escapeHtml(course.tone || 'blue')}${isActive ? ' is-active' : ''}">
                        <div class="course-card-top">
                            <span class="course-card-icon"><i class="fas ${escapeHtml(course.icon || 'fa-graduation-cap')}"></i></span>
                            <div class="course-card-badges">
                                ${course.recommended ? '<span class="course-card-recommended">Empieza aquí</span>' : ''}
                                <span class="challenge-level ${getLearningLevelClass(course.level)}">${escapeHtml(course.level)}</span>
                            </div>
                        </div>
                        <h3>${escapeHtml(course.title)}</h3>
                        <p class="course-card-subtitle">${escapeHtml(course.subtitle)}</p>
                        <p class="course-card-description">${escapeHtml(course.description)}</p>
                        <div class="course-card-meta">
                            <span><i class="fas fa-clock"></i> ${escapeHtml(course.duration)}</span>
                            <span><i class="fas fa-database"></i> ${course.track === 'nosql' ? 'NoSQL' : 'SQL'}</span>
                            <span><i class="fas fa-layer-group"></i> ${course.modules.length} módulos</span>
                            <span><i class="fas fa-list-check"></i> ${lessons.length} lecciones</span>
                        </div>
                        <div class="course-card-progress">
                            <div class="course-card-progress-head">
                                <span>${escapeHtml(status)}</span>
                                <strong>${progress.completed} de ${progress.total}</strong>
                            </div>
                            <div class="course-card-progress-track" role="progressbar" aria-label="Progreso de ${escapeHtml(course.title)}" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${progress.percent}">
                                <span style="width:${progress.percent}%"></span>
                            </div>
                        </div>
                        ${prerequisites}
                        <div class="course-card-actions">
                            <button type="button" class="btn-secondary" data-course-open="${escapeHtml(course.id)}">Ver temario</button>
                            <button type="button" class="btn-primary" ${needsAssessment ? `data-course-open="${escapeHtml(course.id)}"` : `data-course-start="${escapeHtml(course.id)}"`}>${cta} <i class="fas fa-arrow-right"></i></button>
                        </div>
                    </article>
                `;
            }).join('')}
        </div>
    `;

    container.querySelectorAll('[data-course-open]').forEach(button => {
        button.addEventListener('click', () => openCourse(button.dataset.courseOpen));
    });
    container.querySelectorAll('[data-course-start]').forEach(button => {
        button.addEventListener('click', () => startCourse(button.dataset.courseStart));
    });
}

function renderCourseAssessment(course) {
    const completion = getCourseCompletionState(course);
    const modules = course.modules || [];
    const checkpointRows = modules.map((module, index) => {
        const lessonsComplete = isModuleLessonsComplete(course, module);
        const passed = isModuleCheckpointPassed(course, module.id);
        const status = passed ? 'Superado' : lessonsComplete ? 'Listo para comprobar' : 'Completa las lecciones';
        return `
            <div class="course-checkpoint-row${passed ? ' passed' : ''}">
                <span class="course-checkpoint-index">${passed ? '<i class="fas fa-check"></i>' : index + 1}</span>
                <div class="course-checkpoint-copy">
                    <strong>${escapeHtml(module.title)}</strong>
                    <span>${status}</span>
                </div>
                <button type="button" class="btn-secondary btn-sm"
                    ${!lessonsComplete || passed ? 'disabled aria-disabled="true"' : ''}
                    onclick="openModuleCheckpoint('${escapeHtml(course.id)}', '${escapeHtml(module.id)}')">
                    ${passed ? 'Superado' : lessonsComplete ? 'Abrir' : 'Bloqueado'}
                </button>
            </div>
        `;
    }).join('');

    const criteria = course.finalProject?.criteria || [];
    const projectComplete = isCourseProjectCompleted(course);
    const projectMarkup = criteria.length ? `
        <div class="course-project-criteria">
            ${criteria.map((criterion, index) => `
                <label class="course-project-criterion">
                    <input type="checkbox" id="projectCriterion-${escapeHtml(course.id)}-${index}"
                        ${projectComplete ? 'checked disabled' : ''}>
                    <span>${escapeHtml(criterion)}</span>
                </label>
            `).join('')}
        </div>
        <button type="button" class="btn-primary btn-sm" ${projectComplete ? 'disabled' : ''} onclick="completeCourseProject('${escapeHtml(course.id)}')">
            <i class="fas fa-flag-checkered"></i> ${projectComplete ? 'Proyecto completado' : 'Marcar proyecto como completado'}
        </button>
    ` : '<p class="text-muted">Este curso no tiene criterios de proyecto.</p>';

    return `
        <div class="course-assessment-grid">
            <section class="course-assessment-card">
                <div class="course-assessment-head">
                    <div>
                        <span class="course-side-eyebrow"><i class="fas fa-circle-check"></i> Checkpoints de módulo</span>
                        <h4>${completion.checkpointsPassed} de ${completion.checkpointsTotal} superados</h4>
                    </div>
                    <span class="course-assessment-badge">${completion.checkpointsPassed === completion.checkpointsTotal ? 'Completo' : 'Pendiente'}</span>
                </div>
                <p>Completa las lecciones de cada módulo y supera su checkpoint de tres preguntas.</p>
                <div class="course-checkpoint-list">${checkpointRows || '<p class="text-muted">Este curso no tiene checkpoints.</p>'}</div>
            </section>
            <section class="course-assessment-card course-project-card">
                <div class="course-assessment-head">
                    <div>
                        <span class="course-side-eyebrow"><i class="fas fa-flag-checkered"></i> Proyecto final</span>
                        <h4>${escapeHtml(course.finalProject?.title || 'Proyecto final')}</h4>
                    </div>
                    <span class="course-assessment-badge${projectComplete ? ' is-complete' : ''}">${projectComplete ? 'Completado' : 'Pendiente'}</span>
                </div>
                <p>${escapeHtml(course.finalProject?.description || '')}</p>
                ${projectMarkup}
            </section>
        </div>
    `;
}

function openModuleCheckpoint(courseId, moduleId) {
    const course = getCourseById(courseId);
    const module = course?.modules?.find(item => item.id === moduleId);
    const questions = getModuleCheckpointQuestions(courseId, moduleId);
    const modal = document.getElementById('checkpointModal');
    const body = document.getElementById('checkpointBody');
    if (!course || !module || !modal || !body) return;
    if (!questions.length) {
        showToast('warning', 'Este checkpoint todavía no tiene preguntas.');
        return;
    }

    if (!isModuleLessonsComplete(course, module)) {
        showToast('info', 'Completa las lecciones del módulo antes de abrir su checkpoint.');
        return;
    }

    currentCheckpoint = { courseId, moduleId };
    document.getElementById('checkpointEyebrow').textContent = `${course.title} · ${module.title}`;
    document.getElementById('checkpointTitle').textContent = isModuleCheckpointPassed(course, moduleId)
        ? 'Checkpoint superado'
        : 'Checkpoint del módulo';

    if (isModuleCheckpointPassed(course, moduleId)) {
        body.innerHTML = `
            <div class="lesson-check-success">
                <i class="fas fa-circle-check"></i>
                <div>
                    <strong>Checkpoint superado</strong>
                    <p>Ya completaste esta comprobación. Puedes volver al temario para revisar el módulo.</p>
                </div>
            </div>
            <div class="lesson-step-actions">
                <button type="button" class="btn-secondary" onclick="closeCheckpointModal()">Cerrar</button>
            </div>
        `;
        openModal(modal);
        return;
    }

    const quizMarkup = questions.map((question, questionIndex) => `
        <fieldset class="lesson-quiz-question">
            <legend><span>${questionIndex + 1}</span> ${escapeHtml(question.question)}</legend>
            <div class="lesson-quiz-options">
                ${question.options.map((option, optionIndex) => `
                    <label class="lesson-quiz-option">
                        <input type="radio" name="checkpointQ${questionIndex}" value="${optionIndex}">
                        <span>${escapeHtml(option)}</span>
                    </label>
                `).join('')}
            </div>
        </fieldset>
    `).join('');

    body.innerHTML = `
        <div class="lesson-check-intro">
            <span class="course-side-eyebrow"><i class="fas fa-circle-check"></i> Checkpoint de ${escapeHtml(module.title)}</span>
            <p>Responde las ${questions.length} preguntas. Puedes reintentarlo sin perder el progreso de las lecciones.</p>
        </div>
        <form id="checkpointForm" class="lesson-quiz" onsubmit="submitModuleCheckpoint(event)">
            ${quizMarkup}
            <button type="submit" class="btn-primary">Comprobar checkpoint <i class="fas fa-arrow-right"></i></button>
        </form>
        <div id="checkpointResult" class="challenge-result" aria-live="polite" hidden></div>
    `;
    openModal(modal);
}

function submitModuleCheckpoint(event) {
    event.preventDefault();
    const form = event.currentTarget || document.getElementById('checkpointForm');
    const result = document.getElementById('checkpointResult');
    if (!currentCheckpoint || !form || !result) return;

    const course = getCourseById(currentCheckpoint.courseId);
    const questions = getModuleCheckpointQuestions(currentCheckpoint.courseId, currentCheckpoint.moduleId);
    const answers = questions.map((_, index) => (
        form.querySelector(`input[name="checkpointQ${index}"]:checked`)
    ));

    result.hidden = false;
    if (answers.some(answer => !answer)) {
        result.className = 'challenge-result warning';
        result.innerHTML = '<strong><i class="fas fa-circle-exclamation"></i> Faltan respuestas</strong> Responde todas las preguntas antes de comprobar.';
        return;
    }

    const wrong = answers
        .map((answer, index) => Number(answer.value) === questions[index].answer ? null : index)
        .filter(index => index !== null);

    if (wrong.length) {
        result.className = 'challenge-result error';
        result.innerHTML = `
            <strong><i class="fas fa-circle-xmark"></i> Revisa tus respuestas</strong>
            <p>Preguntas por revisar: ${wrong.map(index => index + 1).join(', ')}.</p>
            <ul>${wrong.map(index => `<li>${escapeHtml(questions[index].explanation)}</li>`).join('')}</ul>
        `;
        playSound('error');
        return;
    }

    markModuleCheckpointPassed(course, currentCheckpoint.moduleId);
    playSound('success');
    const courseId = currentCheckpoint.courseId;
    closeCheckpointModal();
    if (currentCourseView === 'detail' && currentCourseId === courseId) {
        renderCourseDetail(courseId);
    } else {
        renderCourseCatalog();
    }
    showToast('success', 'Checkpoint superado.');
}

function closeCheckpointModal() {
    currentCheckpoint = null;
    closeModal(document.getElementById('checkpointModal'));
}

function focusCourseAssessment() {
    const grid = document.querySelector('#courseDetailView .course-assessment-grid');
    if (!grid) return;
    if (typeof grid.scrollIntoView === 'function') {
        grid.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
    const firstAction = grid.querySelector('.course-checkpoint-row button:not([disabled])');
    if (firstAction) firstAction.focus();
}

function completeCourseProject(courseId) {
    const course = getCourseById(courseId);
    const criteria = course?.finalProject?.criteria || [];
    if (!course) return;
    if (!criteria.length) {
        showToast('warning', 'Este curso no tiene criterios de proyecto.');
        return;
    }

    const checked = criteria.map((_, index) => (
        document.getElementById(`projectCriterion-${courseId}-${index}`)?.checked
    ));
    if (checked.some(value => !value)) {
        showToast('warning', 'Marca todos los criterios del proyecto antes de completarlo.');
        return;
    }

    markCourseProjectCompleted(course, criteria);
    playSound('success');
    if (currentCourseView === 'detail' && currentCourseId === courseId) {
        renderCourseDetail(courseId);
    } else {
        renderCourseCatalog();
    }
    showToast('success', 'Proyecto final completado.');
}

function renderCourseDetail(courseId) {
    const container = document.getElementById('courseDetailView');
    const course = getCourseById(courseId);
    if (!container || !course) {
        showCourseCatalog();
        return;
    }

    currentCourseId = course.id;
    saveActiveCourse();
    updateCourseCta();
    setCourseView('detail');

    const progress = getCourseProgress(course);
    const completion = getCourseCompletionState(course);
    const needsAssessment = progress.percent === 100 && !completion.complete;
    const lessons = getCourseLessons(course);
    const lessonIndexById = new Map(lessons.map((lesson, index) => [lesson.id, index]));
    const moduleMarkup = course.modules.map((module, moduleIndex) => {
        const moduleLessons = (module.lessonIds || [])
            .map(id => lessons.find(lesson => lesson.id === id))
            .filter(Boolean);
        const completed = moduleLessons.filter(lesson => isCourseLessonCompleted(course, lesson.id)).length;
        return `
            <section class="course-module">
                <div class="course-module-head">
                    <div>
                        <span>Módulo ${moduleIndex + 1}</span>
                        <h4>${escapeHtml(module.title)}</h4>
                        <p>${escapeHtml(module.description || '')}</p>
                    </div>
                    <strong>${completed}/${moduleLessons.length}</strong>
                </div>
                <div class="course-module-lessons">
                    ${moduleLessons.map(lesson => {
                        const index = lessonIndexById.get(lesson.id) ?? 0;
                        const stages = getCourseLessonStages(course, lesson.id);
                        const done = stages.completed;
                        const status = done ? 'Completada' : stages.practiceCompleted ? 'Por comprobar' : 'Abrir';
                        return `
                            <button type="button" class="course-lesson-row${done ? ' completed' : ''}" data-course-lesson="${escapeHtml(lesson.id)}">
                                <span class="course-lesson-index">${done ? '<i class="fas fa-check"></i>' : index + 1}</span>
                                <span class="course-lesson-copy">
                                    <strong>${escapeHtml(lesson.title)}</strong>
                                    <span>${escapeHtml(lesson.level)} · Lección ${index + 1}</span>
                                </span>
                                <span class="course-lesson-status">${status}</span>
                            </button>
                        `;
                    }).join('')}
                </div>
            </section>
        `;
    }).join('');

    const practiceButtons = (course.practiceConcepts || []).length ? `
        <div class="course-practice-card">
            <span class="course-side-eyebrow"><i class="fas fa-bullseye"></i> Práctica recomendada</span>
            <p>Refuerza estos conceptos con práctica del dataset activo.</p>
            <div class="course-practice-buttons">
                ${course.practiceConcepts.map(concept => `
                    <button type="button" class="btn-ghost btn-sm" data-course-practice="${escapeHtml(concept)}">
                        ${escapeHtml(getConceptLabel(concept))} <i class="fas fa-arrow-right"></i>
                    </button>
                `).join('')}
            </div>
        </div>
    ` : '';

    const finalProject = course.finalProject || null;
    container.innerHTML = `
        <button type="button" class="course-back-btn" onclick="showCourseCatalog()">
            <i class="fas fa-arrow-left"></i> Volver a cursos
        </button>
        <div class="course-detail-hero course-detail-hero-${escapeHtml(course.tone || 'blue')}">
            <div class="course-detail-icon"><i class="fas ${escapeHtml(course.icon || 'fa-graduation-cap')}"></i></div>
            <div class="course-detail-copy">
                <span class="course-eyebrow">${course.recommended ? 'Curso recomendado' : 'Curso guiado'}</span>
                <h3>${escapeHtml(course.title)}</h3>
                <p>${escapeHtml(course.description)}</p>
                <div class="course-detail-meta">
                    <span class="challenge-level ${getLearningLevelClass(course.level)}">${escapeHtml(course.level)}</span>
                    <span><i class="fas fa-database"></i> ${course.track === 'nosql' ? 'NoSQL' : 'SQL'}</span>
                    <span><i class="fas fa-clock"></i> ${escapeHtml(course.duration)}</span>
                    <span><i class="fas fa-layer-group"></i> ${course.modules.length} módulos</span>
                    <span><i class="fas fa-list-check"></i> ${lessons.length} lecciones</span>
                </div>
                <p class="course-detail-flow"><i class="fas fa-bolt"></i> Cada lección combina teoría breve, demostración, práctica y comprobación; después, checkpoints y proyecto final.</p>
            </div>
            <div class="course-detail-score">
                <strong>${progress.percent}%</strong>
                <span>${progress.completed} de ${progress.total}</span>
            </div>
        </div>
        <div class="course-detail-grid">
            <section class="course-syllabus">
                <div class="course-syllabus-head">
                    <div>
                        <span class="course-side-eyebrow"><i class="fas fa-map"></i> Tu recorrido</span>
                        <h4>Temario</h4>
                    </div>
                    <span>${progress.completed} de ${progress.total} lecciones</span>
                </div>
                ${moduleMarkup}
            </section>
            <aside class="course-detail-side">
                <div class="course-outcomes">
                    <span class="course-side-eyebrow"><i class="fas fa-check-double"></i> Al terminar podrás</span>
                    <ul>${(course.outcomes || []).map(outcome => `<li>${escapeHtml(outcome)}</li>`).join('')}</ul>
                </div>
                ${practiceButtons}
                ${finalProject ? `
                    <div class="course-final-project">
                        <span class="course-side-eyebrow"><i class="fas fa-flag-checkered"></i> Proyecto final</span>
                        <h4>${escapeHtml(finalProject.title || 'Proyecto final')}</h4>
                        <p>${escapeHtml(finalProject.description || '')}</p>
                    </div>
                ` : ''}
            </aside>
        </div>
        ${renderCourseAssessment(course)}
        <div class="course-detail-actions">
            ${needsAssessment
                ? `<button type="button" class="btn-primary" onclick="focusCourseAssessment()">Completar evaluación <i class="fas fa-arrow-down"></i></button>`
                : `<button type="button" class="btn-primary" data-course-start="${escapeHtml(course.id)}">
                    ${completion.complete ? 'Repasar curso' : hasCourseStarted(course) ? 'Continuar curso' : 'Comenzar curso'} <i class="fas fa-arrow-right"></i>
                </button>`}
            <button type="button" class="btn-secondary" onclick="showCourseCatalog()">Elegir otro curso</button>
        </div>
    `;

    container.querySelectorAll('[data-course-lesson]').forEach(button => {
        button.addEventListener('click', () => startCourse(course.id, button.dataset.courseLesson));
    });
    container.querySelectorAll('[data-course-start]').forEach(button => {
        button.addEventListener('click', () => startCourse(course.id));
    });
    container.querySelectorAll('[data-course-practice]').forEach(button => {
        button.addEventListener('click', () => practiceCourseConcept(button.dataset.coursePractice));
    });
}

function showCourseCatalog() {
    activateSection('path');
    activatePathTab('lessons');
    renderCourseCatalog();
}

function openCourse(courseId) {
    const course = getCourseById(courseId);
    if (!course) return;
    activateSection('path');
    activatePathTab('lessons');
    renderCourseDetail(course.id);
}

function startCourse(courseId = currentCourseId, lessonId = null) {
    const course = getCourseById(courseId) || getActiveCourse();
    if (!course) return;

    activateSection('path');
    activatePathTab('lessons');
    currentCourseId = course.id;
    saveActiveCourse();
    const lessons = getCourseLessons(course);
    const requested = lessonId && lessons.some(lesson => lesson.id === lessonId) ? lessonId : null;
    const next = requested
        || lessons.find(lesson => !isCourseLessonCompleted(course, lesson.id))?.id
        || lessons[0]?.id
        || null;
    currentLearningLessonId = next;
    const nextLesson = lessons.find(lesson => lesson.id === next);
    currentLessonStep = nextLesson ? getDefaultLessonStep(course, nextLesson) : 'concept';
    setCourseView('player');
    renderCoursePlayer();
    const editor = document.getElementById('pathEditor');
    if (editor) editor.focus();
}

function refreshActiveCourseDataset() {
    const course = getActiveCourse();
    const pathSection = document.getElementById('section-path');
    const pathActive = pathSection?.classList.contains('active');
    if (currentCourseView === 'player') {
        if (pathActive && course?.track === 'nosql') {
            currentLearningLessonId = null;
            startCourse(course.id);
        }
        return;
    }
    if (currentCourseView === 'detail' && currentCourseId) {
        renderCourseDetail(currentCourseId);
        return;
    }
    renderCourseCatalog();
}

function renderCoursePlayer() {
    const course = getActiveCourse();
    const breadcrumb = document.getElementById('coursePlayerBreadcrumb');
    if (breadcrumb && course) {
        const lesson = getActiveCourseLessonById(currentLearningLessonId);
        breadcrumb.innerHTML = `
            <button type="button" class="course-back-btn" onclick="showCourseCatalog()">
                <i class="fas fa-arrow-left"></i> Cursos
            </button>
            <span class="course-breadcrumb-sep">/</span>
            <button type="button" class="course-back-btn" onclick="openCourse('${escapeHtml(course.id)}')">${escapeHtml(course.title)}</button>
            ${lesson ? `<span class="course-breadcrumb-sep">/</span><span>${escapeHtml(lesson.title)}</span>` : ''}
        `;
    }
    renderLearningPathList();
    renderLearningLessonDetail();
}

function practiceCourseConcept(conceptId) {
    const course = getActiveCourse();
    if (course) {
        currentCourseId = course.id;
        saveActiveCourse();
        const pendingLesson = getCourseLessons(course)
            .find(lesson => lesson.id === conceptId && !isCourseLessonCompleted(course, lesson.id));
        if (pendingLesson) {
            startCourse(course.id, pendingLesson.id);
            return;
        }
    }
    practiceLearningConcept(conceptId);
}

function formatLearningActivityDate(value) {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return '';
    const today = new Date();
    if (date.toDateString() === today.toDateString()) return 'Hoy';
    return date.toLocaleDateString('es-ES', { day: '2-digit', month: 'short' });
}

function renderLearningPathList() {
    const list = document.getElementById('pathLessonList');
    if (!list) return;

    const course = getActiveCourse();
    const lessons = course ? getCourseLessons(course) : getLearningLessons();
    const stats = course ? getCourseProgress(course) : getLearningProgressStats();
    const progressText = document.getElementById('pathProgressText');
    const progressBar = document.getElementById('pathProgressBar');
    const progressTrack = document.getElementById('pathProgressTrack');
    const progressLabel = document.getElementById('pathCourseProgressLabel');
    const datasetLabel = document.getElementById('pathDatasetLabel');

    if (progressText) progressText.textContent = `${stats.completed} de ${stats.total}`;
    if (progressBar) progressBar.style.width = `${stats.percent}%`;
    if (progressTrack) {
        progressTrack.setAttribute('aria-valuenow', String(stats.percent));
        progressTrack.setAttribute('aria-label', course ? `Progreso de ${course.title}` : 'Progreso del curso');
    }
    if (progressLabel) progressLabel.textContent = course ? 'Progreso del curso' : 'Tu progreso';
    if (datasetLabel) datasetLabel.textContent = getCourseDatasetLabel(course);

    if (!lessons.length) {
        list.innerHTML = '<p class="text-muted">Este curso no tiene lecciones disponibles.</p>';
        return;
    }

    if (!currentLearningLessonId || !lessons.some(lesson => lesson.id === currentLearningLessonId)) {
        const next = lessons.find(lesson => !isCourseLessonCompleted(course, lesson.id)) || lessons[0];
        currentLearningLessonId = next.id;
        currentLessonStep = getDefaultLessonStep(course, next);
    }

    const renderLessonRow = lesson => {
        const index = lessons.findIndex(item => item.id === lesson.id);
        const stages = getCourseLessonStages(course, lesson.id);
        const completed = stages.completed;
        const active = lesson.id === currentLearningLessonId;
        const status = completed ? 'Completada' : stages.practiceCompleted ? 'Por comprobar' : (active ? 'En curso' : 'Pendiente');
        return `
            <button type="button" class="challenge-card path-step${active ? ' active' : ''}${completed ? ' completed' : ''}" data-learning-lesson="${escapeHtml(lesson.id)}" aria-pressed="${active}">
                <span class="challenge-card-title">
                    <span class="path-step-index">${completed ? '<i class="fas fa-check"></i>' : index + 1}</span>
                    <span class="path-step-title">${escapeHtml(lesson.title)}</span>
                </span>
                <span class="challenge-card-meta">
                    <span class="challenge-level ${getLearningLevelClass(lesson.level)}">${escapeHtml(lesson.level)}</span>
                    <span>${status}</span>
                </span>
            </button>
        `;
    };

    if (course) {
        list.innerHTML = course.modules.map(module => {
            const moduleLessons = (module.lessonIds || [])
                .map(id => lessons.find(lesson => lesson.id === id))
                .filter(Boolean);
            const completed = moduleLessons.filter(lesson => isCourseLessonCompleted(course, lesson.id)).length;
            return `
                <div class="course-lesson-group">
                    <div class="course-lesson-group-head">
                        <span>${escapeHtml(module.title)}</span>
                        <span>${completed}/${moduleLessons.length}</span>
                    </div>
                    ${moduleLessons.map(renderLessonRow).join('')}
                </div>
            `;
        }).join('');
    } else {
        list.innerHTML = lessons.map(renderLessonRow).join('');
    }

    list.querySelectorAll('[data-learning-lesson]').forEach(button => {
        button.addEventListener('click', () => selectLearningLesson(button.dataset.learningLesson));
    });

    updateCourseCta();
    renderLearningProgressDashboard();
}

function renderCourseProgressSection() {
    const courses = getCourses();
    if (!courses.length) return '';
    return `
        <div class="progress-section course-progress-section">
            <div class="progress-section-head">
                <div>
                    <h3>Tus cursos</h3>
                    <p>Avance de cada itinerario con sus datasets activos.</p>
                </div>
                <button type="button" class="btn-secondary" onclick="showCourseCatalog()">
                    Ver cursos <i class="fas fa-arrow-right"></i>
                </button>
            </div>
            <div class="progress-course-grid">
                ${courses.map(course => {
                    const progress = getCourseProgress(course);
                    const status = getCourseStatusLabel(course, progress);
                    return `
                        <button type="button" class="progress-course-card" onclick="openCourse('${escapeHtml(course.id)}')">
                            <span class="progress-course-icon"><i class="fas ${escapeHtml(course.icon || 'fa-graduation-cap')}"></i></span>
                            <span class="progress-course-copy">
                                <strong>${escapeHtml(course.title)}</strong>
                                <span>${progress.completed} de ${progress.total} lecciones · ${status}</span>
                                <span class="progress-course-track" role="progressbar" aria-label="${escapeHtml(course.title)}" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${progress.percent}">
                                    <span style="width:${progress.percent}%"></span>
                                </span>
                            </span>
                            <span class="progress-course-percent">${progress.percent}%</span>
                        </button>
                    `;
                }).join('')}
            </div>
        </div>
    `;
}

function renderLearningProgressDashboard() {
    const container = document.getElementById('learningProgressDashboard');
    if (!container) return;

    const globalStats = getLearningGlobalStats();
    const conceptStats = getLearningConceptStats();
    const recommendation = getLearningRecommendation();
    const activity = getRecentLearningActivity();
    const dominated = conceptStats.filter(concept => concept.percent === 100).length;
    const started = conceptStats.filter(concept => concept.percent > 0).length;
    const profile = getLearningProfile();
    const conceptLibrary = getConceptMasteryStats();
    const sqlCourseCount = getCourses().filter(course => course.track !== 'nosql').length;

    const metrics = [
        {
            label: 'Lecciones SQL',
            value: `${globalStats.lessonsCompleted}/${globalStats.lessonsTotal}`,
            icon: 'fa-book-open',
            tone: 'tone-blue',
            hint: `${globalStats.lessonsTotal} lecciones en ${sqlCourseCount} cursos SQL`
        },
        {
            label: 'Retos',
            value: `${globalStats.challengesCompleted}/${globalStats.challengesTotal}`,
            icon: 'fa-trophy',
            tone: 'tone-amber',
            hint: 'Retos SQL'
        },
        {
            label: 'Actividades',
            value: `${globalStats.completed}/${globalStats.total}`,
            icon: 'fa-list-check',
            tone: 'tone-green',
            hint: 'Lecciones + retos'
        },
        {
            label: 'Conceptos de cursos',
            value: `${dominated}/${conceptStats.length}`,
            icon: 'fa-graduation-cap',
            tone: 'tone-violet',
            hint: 'Al 100%'
        }
    ];

    container.innerHTML = `
        <div class="progress-hero">
            <div class="progress-hero-copy">
                <span class="progress-eyebrow"><i class="fas fa-chart-simple"></i> Tu mapa de habilidades</span>
                <h3>Progreso global</h3>
                <p>Dataset activo: <strong>${escapeHtml(profile.name)}</strong>. Has completado ${globalStats.completed} de ${globalStats.total} actividades entre lecciones y retos de los tres datasets SQL.</p>
                <div class="progress-hero-bar" role="progressbar" aria-label="Progreso global" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${globalStats.percent}">
                    <span style="width:${globalStats.percent}%"></span>
                </div>
            </div>
            <div class="progress-hero-score">
                <strong>${globalStats.percent}%</strong>
                <span>global</span>
            </div>
        </div>

        ${renderSkillProfileCards()}

        ${renderCourseProgressSection()}

        <div class="progress-recommendation progress-recommendation-${recommendation.kind}">
            <span class="progress-recommendation-icon"><i class="fas ${recommendation.icon}"></i></span>
            <div class="progress-recommendation-copy">
                <span>Siguiente paso recomendado</span>
                <strong>${escapeHtml(recommendation.title)}</strong>
                <p>${escapeHtml(recommendation.message)}</p>
            </div>
            <button type="button" class="btn-primary" onclick="${recommendation.onclick}">
                ${escapeHtml(recommendation.action)} <i class="fas fa-arrow-right"></i>
            </button>
        </div>

        <div class="progress-summary">
            ${metrics.map(metric => `
                <div class="analyze-metric">
                    <span class="analyze-metric-icon ${metric.tone}"><i class="fas ${metric.icon}"></i></span>
                    <div>
                        <span class="analyze-metric-value">${metric.value}</span>
                        <span class="analyze-metric-label">${metric.label}</span>
                        <span class="analyze-metric-hint">${metric.hint}</span>
                    </div>
                </div>
            `).join('')}
        </div>

        <div class="progress-section">
            <div class="progress-section-head">
                <div>
                    <h3>Dominio por concepto</h3>
                    <p>Combinación de lecciones y retos de los tres datasets.</p>
                </div>
                <span class="progress-section-badge">${started} de ${conceptStats.length} iniciados</span>
            </div>
            <div class="concept-mastery-grid">
                ${conceptStats.map(concept => {
                    const levelClass = concept.percent === 100
                        ? 'is-complete'
                        : concept.percent >= 80
                            ? 'is-high'
                            : concept.percent > 0
                                ? 'is-progress'
                                : 'is-empty';
                    const status = concept.percent === 100
                        ? 'Dominado'
                        : concept.percent >= 80
                            ? 'Casi'
                            : concept.percent > 0
                                ? 'En progreso'
                                : 'Sin empezar';
                    return `
                        <article class="concept-mastery-card ${levelClass}">
                            <div class="concept-mastery-head">
                                <span class="concept-mastery-icon"><i class="fas ${concept.icon}"></i></span>
                                <div class="concept-mastery-copy">
                                    <h4>${escapeHtml(concept.label)}</h4>
                                    <p>${escapeHtml(concept.description)}</p>
                                </div>
                                <span class="concept-mastery-percent">${concept.percent}%</span>
                            </div>
                            <div class="concept-mastery-bar" role="progressbar" aria-label="${escapeHtml(concept.label)}" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${concept.percent}">
                                <span style="width:${concept.percent}%"></span>
                            </div>
                            <div class="concept-mastery-foot">
                                <span>${concept.completed} de ${concept.total} actividades · ${status}</span>
                                <button type="button" class="btn-ghost btn-sm" onclick="practiceLearningConcept('${concept.id}')">
                                    Practicar <i class="fas fa-arrow-right"></i>
                                </button>
                            </div>
                        </article>
                    `;
                }).join('')}
            </div>
        </div>

        <div class="progress-section concept-library-progress">
            <div class="progress-section-head">
                <div>
                    <h3>Biblioteca de conceptos</h3>
                    <p>Fichas completadas con el mini-quiz de Aprender.</p>
                </div>
                <span class="progress-section-badge">${conceptLibrary.completed} de ${conceptLibrary.total}</span>
            </div>
            <div class="concept-library-row">
                <div class="concept-library-bar" role="progressbar" aria-label="Biblioteca de conceptos" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${conceptLibrary.percent}">
                    <span style="width:${conceptLibrary.percent}%"></span>
                </div>
                <button type="button" class="btn-secondary" onclick="openConceptLibrary()">
                    Explorar conceptos <i class="fas fa-arrow-right"></i>
                </button>
            </div>
        </div>

        <div class="progress-columns">
            <div class="progress-section">
                <div class="progress-section-head">
                    <div>
                        <h3>Progreso por dataset</h3>
                        <p>Lecciones y retos completados en cada base.</p>
                    </div>
                </div>
                <div class="dataset-progress-list">
                    ${globalStats.datasetStats.map(stat => `
                        <article class="dataset-progress-card${stat.datasetName === getLearningDatasetName() ? ' is-active' : ''}">
                            <div class="dataset-progress-head">
                                <div>
                                    <strong>${escapeHtml(stat.name)}</strong>
                                    <span>${stat.completed} de ${stat.total} actividades</span>
                                </div>
                                <span class="dataset-progress-percent">${stat.percent}%</span>
                            </div>
                            <div class="dataset-progress-bar" role="progressbar" aria-label="${escapeHtml(stat.name)}" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${stat.percent}">
                                <span style="width:${stat.percent}%"></span>
                            </div>
                            <div class="dataset-progress-meta">
                                <span>${stat.lessonsCompleted}/${stat.lessonsTotal} lecciones</span>
                                <span>${stat.challengesCompleted}/${stat.challengesTotal} retos</span>
                            </div>
                        </article>
                    `).join('')}
                </div>
            </div>

            <div class="progress-section">
                <div class="progress-section-head">
                    <div>
                        <h3>Actividad SQL reciente</h3>
                        <p>Tus últimos avances en lecciones y retos SQL.</p>
                    </div>
                </div>
                ${activity.length ? `
                    <div class="recent-activity-list">
                        ${activity.map(item => `
                            <div class="recent-activity-item">
                                <span class="recent-activity-icon"><i class="fas ${item.icon}"></i></span>
                                <div>
                                    <strong title="${escapeHtml(item.title)}">${escapeHtml(item.title)}</strong>
                                    <span>${item.type} · ${escapeHtml(LEARNING_PATH_PROFILES[item.datasetName]?.name || item.datasetName)}</span>
                                </div>
                                <time datetime="${escapeHtml(item.completedAt)}">${escapeHtml(formatLearningActivityDate(item.completedAt))}</time>
                            </div>
                        `).join('')}
                    </div>
                ` : `
                    <div class="progress-empty">
                        <i class="fas fa-clock"></i>
                        <p>Aún no has completado actividades. Empieza con la primera lección.</p>
                    </div>
                `}
            </div>
        </div>
    `;
}

function activatePathTab(tabName) {
    const next = tabName === 'progress' ? 'progress' : 'lessons';
    const tabs = Array.from(document.querySelectorAll('.path-tab'));
    const panels = {
        lessons: document.getElementById('pathLessonsPanel'),
        progress: document.getElementById('pathProgressPanel')
    };

    tabs.forEach(tab => {
        const active = tab.dataset.pathTab === next;
        tab.classList.toggle('active', active);
        tab.setAttribute('aria-selected', String(active));
        tab.tabIndex = active ? 0 : -1;
    });

    Object.entries(panels).forEach(([name, panel]) => {
        if (!panel) return;
        const active = name === next;
        panel.hidden = !active;
        panel.classList.toggle('active', active);
    });

    if (next === 'progress') {
        renderLearningProgressDashboard();
    }
}

function openLearningPath() {
    activateSection('path');
    activatePathTab('lessons');
    showCourseCatalog();
}

function continueLearningLesson(id) {
    const course = getCourseForLesson(id);
    if (course) {
        activateSection('path');
        activatePathTab('lessons');
        startCourse(course.id, id);
        return;
    }
    openLearningPath();
    selectLearningLesson(id);
}

function openSQLChallenges() {
    activateSection('challenges');
    activateChallengeTab('sql');
}

function practiceLearningChallenge(id) {
    openSQLChallenges();
    openChallenge(id);
}

function practiceLearningConcept(conceptId) {
    const datasetName = getLearningDatasetName();
    const profile = LEARNING_PATH_PROFILES[datasetName];
    const lesson = getLearningLessonsForDataset(datasetName)
        .find(item => item.id === conceptId && !isLearningLessonCompletedForDataset(item.id, datasetName));
    if (lesson) {
        continueLearningLesson(lesson.id);
        return;
    }

    const challenge = getChallengeCatalog(datasetName)
        .find(item => getChallengeConceptId(item) === conceptId && !challengeProgress[item.id]?.completed);
    if (challenge) {
        practiceLearningChallenge(challenge.id);
        return;
    }

    const otherDataset = Object.keys(LEARNING_PATH_PROFILES).find(name => {
        if (name === datasetName) return false;
        const hasPendingLesson = getLearningLessonsForDataset(name).some(item => (
            item.id === conceptId && !isLearningLessonCompletedForDataset(item.id, name)
        ));
        const hasPendingChallenge = getChallengeCatalog(name).some(item => (
            getChallengeConceptId(item) === conceptId && !challengeProgress[item.id]?.completed
        ));
        return hasPendingLesson || hasPendingChallenge;
    });

    if (otherDataset) {
        showToast('info', `Este concepto ya está completo en ${profile.name}. Cambia a ${LEARNING_PATH_PROFILES[otherDataset].name} desde Practicar para seguir.`);
        return;
    }

    showToast('success', `¡Ya dominas ${getConceptLabel(conceptId)}!`);
}

function getDefaultLessonStep(course, lesson) {
    const stages = getCourseLessonStages(course, lesson.id);
    if (stages.completed) return 'concept';
    if (stages.practiceCompleted) return 'check';
    if (stages.theoryRead) return 'practice';
    return 'concept';
}

function renderLessonStepButton(step, number, label, icon, done, disabled = false) {
    const active = currentLessonStep === step;
    return `
        <button type="button" class="lesson-step${active ? ' active' : ''}${done ? ' completed' : ''}"
            data-lesson-step="${step}" role="tab" aria-selected="${active}" aria-controls="lessonStepContent"
            ${disabled ? 'disabled aria-disabled="true"' : ''}
            onclick="goToLessonStep('${step}')">
            <span class="lesson-step-number">${done ? '<i class="fas fa-check"></i>' : number}</span>
            <span class="lesson-step-label"><i class="fas ${icon}"></i> ${label}</span>
        </button>
    `;
}

function renderLessonConceptStep(lesson, course, stages) {
    const objectives = (lesson.objectives || []).map(item => `<li>${escapeHtml(item)}</li>`).join('');
    const theory = (lesson.theory || []).map(card => `
        <article class="lesson-theory-card">
            <h4>${escapeHtml(card.title)}</h4>
            <p>${escapeHtml(card.body)}</p>
            ${card.code ? `<pre><code>${escapeHtml(card.code)}</code></pre>` : ''}
        </article>
    `).join('');
    const mistakes = (lesson.commonMistakes || []).map(item => `
        <div class="lesson-mistake">
            <strong>${escapeHtml(item.mistake)}</strong>
            <p>${escapeHtml(item.fix)}</p>
        </div>
    `).join('');

    return `
        <div class="lesson-objectives">
            <span class="course-side-eyebrow"><i class="fas fa-bullseye"></i> Al terminar podrás</span>
            <ul>${objectives}</ul>
        </div>
        <div class="lesson-theory-grid">${theory}</div>
        <div class="lesson-demo-card">
            <div class="lesson-demo-head">
                <div>
                    <span class="course-side-eyebrow"><i class="fas fa-play"></i> Demostración guiada</span>
                    <p>Ejecuta el ejemplo y observa el resultado antes de escribir tu consulta.</p>
                </div>
                <button type="button" class="btn-secondary btn-sm" onclick="runLessonDemo()">
                    <i class="fas fa-play"></i> Ejecutar ejemplo
                </button>
            </div>
            <pre><code>${escapeHtml(lesson.demoQuery)}</code></pre>
            <p class="lesson-demo-note">${escapeHtml(lesson.demoNote)}</p>
            <div id="lessonDemoResult" class="lesson-demo-result" hidden></div>
        </div>
        ${mistakes ? `<div class="lesson-mistakes"><span class="course-side-eyebrow"><i class="fas fa-triangle-exclamation"></i> Errores comunes</span>${mistakes}</div>` : ''}
        <div class="lesson-step-actions">
            <button type="button" class="btn-primary" onclick="goToLessonStep('practice')">
                Continuar a la práctica <i class="fas fa-arrow-right"></i>
            </button>
            ${stages.theoryRead ? '' : `
                <button type="button" class="btn-ghost" onclick="markTheoryReadAndGoPractice()">
                    Ya conozco esto: ir a la práctica
                </button>
            `}
        </div>
    `;
}

function renderLessonPracticeStep(lesson, course, stages) {
    const isNoSQL = course?.track === 'nosql';
    const initialResult = stages.practiceCompleted
        ? '<strong><i class="fas fa-circle-check"></i> Práctica superada</strong> Puedes repetirla o continuar a la comprobación.'
        : `<strong><i class="fas fa-circle-info"></i> Listo para practicar</strong> ${isNoSQL ? 'Escribe un comando NoSQL' : 'Escribe tu consulta'} y pulsa «Comprobar lección».`;

    return `
        <div class="lesson-practice-intro">
            <span class="course-side-eyebrow"><i class="fas fa-laptop-code"></i> Tu turno</span>
            <h4>${escapeHtml(lesson.title)}</h4>
            <p>${escapeHtml(lesson.objective)}</p>
            <ul class="lesson-practice-checklist">
                <li>Revisa el concepto y la demostración si necesitas repasar.</li>
                <li>Completa la plantilla del editor con lo que pide la misión.</li>
                <li>Pulsa «Comprobar lección» y revisa el resultado.</li>
            </ul>
        </div>
        <div class="path-example">
            <div class="path-example-head">
                <span><i class="fas fa-code"></i> Ejemplo de apoyo</span>
                <button type="button" class="btn-ghost btn-sm" onclick="loadLearningExample()">
                    <i class="fas fa-arrow-down"></i> Usar ejemplo
                </button>
            </div>
            <pre><code>${escapeHtml(lesson.example)}</code></pre>
        </div>
        <label for="pathEditor" class="sr-only">${isNoSQL ? 'Comando NoSQL para la lección' : 'Consulta SQL para la lección'}</label>
        <textarea id="pathEditor" spellcheck="false" placeholder="${isNoSQL ? 'Escribe un comando NoSQL...' : 'Escribe tu consulta SQL aquí...'}">${escapeHtml(lesson.starter)}</textarea>
        <div class="challenge-actions">
            <button type="button" id="pathRunBtn" onclick="runLearningLesson()">
                <i class="fas fa-play"></i> Comprobar lección
            </button>
            <button type="button" id="pathHintBtn" class="btn-secondary" onclick="showLearningHint()">
                <i class="fas fa-lightbulb"></i> Ver pista
            </button>
            <button type="button" class="btn-secondary" onclick="clearLearningEditor()">
                <i class="fas fa-eraser"></i> Limpiar
            </button>
        </div>
        <div id="pathHint" class="challenge-hint" hidden>${escapeHtml(lesson.hint)}</div>
        <div id="pathResult" class="challenge-result" aria-live="polite">${initialResult}</div>
        <div id="pathNext" class="path-next" ${stages.practiceCompleted ? '' : 'hidden'}>
            ${stages.practiceCompleted ? '<button type="button" class="btn-primary" onclick="goToLessonStep(\'check\')">Ir a la comprobación <i class="fas fa-arrow-right"></i></button>' : ''}
        </div>
    `;
}

function renderLessonSummary(lesson) {
    return `
        <div class="lesson-summary-card">
            <span class="course-side-eyebrow"><i class="fas fa-bookmark"></i> Resumen</span>
            <ul>${(lesson.summary || []).map(item => `<li>${escapeHtml(item)}</li>`).join('')}</ul>
        </div>
    `;
}

function renderLessonCheckStep(lesson, course, lessons, stages, index) {
    if (!stages.practiceCompleted) {
        return '<div class="challenge-empty"><i class="fas fa-lock"></i><h3>Primero completa la práctica</h3><p>La comprobación se desbloquea cuando superas el laboratorio.</p></div>';
    }

    if (stages.completed) {
        return `
            ${renderLessonSummary(lesson)}
            <div class="lesson-check-success">
                <i class="fas fa-circle-check"></i>
                <div>
                    <strong>Lección completada</strong>
                    <p>Has leído el concepto, superado la práctica y aprobado la comprobación.</p>
                </div>
            </div>
            <div id="pathNext" class="path-next">
                ${getCourseNextMarkup(course, lessons, lesson)}
            </div>
        `;
    }

    const quiz = lesson.quiz || [];
    const quizMarkup = quiz.map((question, questionIndex) => `
        <fieldset class="lesson-quiz-question">
            <legend><span>${questionIndex + 1}</span> ${escapeHtml(question.question)}</legend>
            <div class="lesson-quiz-options">
                ${question.options.map((option, optionIndex) => `
                    <label class="lesson-quiz-option">
                        <input type="radio" name="lessonQuizQ${questionIndex}" value="${optionIndex}">
                        <span>${escapeHtml(option)}</span>
                    </label>
                `).join('')}
            </div>
        </fieldset>
    `).join('');

    return `
        <div class="lesson-check-intro">
            <span class="course-side-eyebrow"><i class="fas fa-circle-check"></i> Comprueba tu comprensión</span>
            <h4>${escapeHtml(lesson.title)}</h4>
            <p>Responde las ${quiz.length} preguntas. Si fallas alguna, puedes intentarlo de nuevo sin perder el progreso de la práctica.</p>
        </div>
        <form id="lessonQuizForm" class="lesson-quiz" onsubmit="submitLessonQuiz(event)">
            ${quizMarkup}
            <button type="submit" class="btn-primary">
                Comprobar respuestas <i class="fas fa-arrow-right"></i>
            </button>
        </form>
        <div id="lessonQuizResult" class="challenge-result" aria-live="polite" hidden></div>
        <p class="lesson-check-hint"><i class="fas fa-lock"></i> La siguiente lección se desbloquea al aprobar esta comprobación.</p>
    `;
}

function renderLessonStepContent(lesson, course, lessons, stages, index) {
    const container = document.getElementById('lessonStepContent');
    if (!container) return;
    if (currentLessonStep === 'practice') {
        container.innerHTML = renderLessonPracticeStep(lesson, course, stages);
    } else if (currentLessonStep === 'check') {
        container.innerHTML = renderLessonCheckStep(lesson, course, lessons, stages, index);
    } else {
        container.innerHTML = renderLessonConceptStep(lesson, course, stages);
    }
}

function renderLearningLessonDetail() {
    const detail = document.getElementById('pathLessonDetail');
    if (!detail) return;

    const course = getActiveCourse();
    const lessons = course ? getCourseLessons(course) : getLearningLessons();
    const lesson = lessons.find(item => item.id === currentLearningLessonId);
    if (!lesson) {
        detail.innerHTML = `
            <div class="challenge-empty">
                <i class="fas fa-graduation-cap"></i>
                <h3>Elige una lección</h3>
                <p>Selecciona una lección del curso para empezar a practicar.</p>
            </div>
        `;
        return;
    }

    if (course?.track !== 'nosql') {
        const profile = getLearningProfile();
        const tables = dbInitialized && typeof getUserTables === 'function' ? getUserTables() : [];
        if (tables.length > 0 && !tables.includes(profile.mainTable)) {
            detail.innerHTML = `
                <div class="challenge-empty">
                    <i class="fas fa-database"></i>
                    <h3>Dataset no compatible</h3>
                    <p>El curso de ${escapeHtml(profile.name)} necesita la tabla <code>${escapeHtml(profile.mainTable)}</code>. Cambia de dataset o reinicia la base para practicar.</p>
                </div>
            `;
            return;
        }
    }

    const index = lessons.findIndex(item => item.id === lesson.id);
    const stages = getCourseLessonStages(course, lesson.id);
    if (currentLessonStep === 'check' && !stages.practiceCompleted) currentLessonStep = 'practice';
    const module = getCourseModuleForLesson(course, lesson.id);
    const completed = stages.completed;

    detail.innerHTML = `
        <div class="challenge-detail-header">
            <div>
                <span class="course-lesson-eyebrow">${escapeHtml(course?.title || 'Curso')}${module ? ` · ${escapeHtml(module.title)}` : ''}</span>
                <h3>${index + 1}. ${escapeHtml(lesson.title)}</h3>
                <div class="challenge-detail-meta">
                    <span class="challenge-level ${getLearningLevelClass(lesson.level)}">${escapeHtml(lesson.level)}</span>
                    <span class="text-muted">Lección ${index + 1} de ${lessons.length}</span>
                    <span id="pathLessonStatus" class="path-completed-badge" ${completed ? '' : 'hidden'}><i class="fas fa-check"></i> Completada</span>
                </div>
            </div>
        </div>
        <div class="lesson-stepper" role="tablist" aria-label="Pasos de la lección">
            ${renderLessonStepButton('concept', 1, 'Concepto', 'fa-book-open', stages.theoryRead)}
            ${renderLessonStepButton('practice', 2, 'Práctica', 'fa-laptop-code', stages.practiceCompleted)}
            ${renderLessonStepButton('check', 3, 'Comprobación', 'fa-circle-check', stages.quizPassed, !stages.practiceCompleted)}
        </div>
        <div id="lessonStepContent" role="tabpanel"></div>
    `;

    detail.querySelectorAll('[data-lesson-step]').forEach(button => {
        button.addEventListener('click', () => goToLessonStep(button.dataset.lessonStep));
    });
    renderLessonStepContent(lesson, course, lessons, stages, index);
}

function goToLessonStep(step) {
    const course = getActiveCourse();
    const lesson = getActiveCourseLessonById(currentLearningLessonId);
    if (!lesson) return;
    const stages = getCourseLessonStages(course, lesson.id);
    if (step === 'check' && !stages.practiceCompleted) {
        showToast('info', 'Completa la práctica antes de abrir la comprobación.');
        return;
    }
    if (step === 'practice' && !stages.theoryRead) {
        markCourseLessonTheoryRead(course, lesson.id);
    }
    currentLessonStep = ['concept', 'practice', 'check'].includes(step) ? step : 'concept';
    renderLearningLessonDetail();
}

function markTheoryReadAndGoPractice() {
    const course = getActiveCourse();
    const lesson = getActiveCourseLessonById(currentLearningLessonId);
    if (!lesson) return;
    markCourseLessonTheoryRead(course, lesson.id);
    currentLessonStep = 'practice';
    renderLearningLessonDetail();
}

function renderLessonDemoSets(sets) {
    const set = sets?.[0];
    if (!set || !Array.isArray(set.values) || set.values.length === 0) {
        return '<p class="lesson-demo-empty">El ejemplo no devolvió filas.</p>';
    }
    const rows = set.values.slice(0, 6);
    return `
        <div class="lesson-demo-table-wrap">
            <table>
                <thead><tr>${set.columns.map(column => `<th>${escapeHtml(column)}</th>`).join('')}</tr></thead>
                <tbody>${rows.map(row => `<tr>${row.map(value => `<td>${escapeHtml(value === null ? '' : String(value))}</td>`).join('')}</tr>`).join('')}</tbody>
            </table>
        </div>
        ${set.values.length > rows.length ? `<p class="lesson-demo-more">Mostrando ${rows.length} de ${set.values.length} filas.</p>` : ''}
    `;
}

function runLessonDemo() {
    const result = document.getElementById('lessonDemoResult');
    const lesson = getActiveCourseLessonById(currentLearningLessonId);
    const course = getActiveCourse();
    if (!result || !lesson) return;

    try {
        if (course?.track === 'nosql') {
            if (!window.NoSQL || !window.NOSQL_DATASETS) throw new Error('El motor NoSQL no está disponible.');
            const command = window.NoSQL.createDatabase(window.NOSQL_DATASETS[getNoSQLActiveDatasetName()]);
            const output = window.NoSQL.executeCommand(command, lesson.demoQuery);
            const documents = output.documents || (output.document ? [output.document] : []);
            result.innerHTML = `<pre>${escapeHtml(JSON.stringify(documents.slice(0, 5), null, 2))}</pre>`;
        } else {
            if (!dbInitialized || !db) throw new Error('La base de datos aún no está lista.');
            if (!isReadOnlyQuery(lesson.demoQuery)) throw new Error('La demostración debe ser una consulta de lectura.');
            result.innerHTML = renderLessonDemoSets(db.exec(lesson.demoQuery));
        }
        result.hidden = false;
    } catch (error) {
        result.hidden = false;
        result.innerHTML = `<p class="lesson-demo-error">${escapeHtml(error.message || String(error))}</p>`;
    }
}

function renderLearningPath() {
    renderLearningPathList();
    renderLearningLessonDetail();
}

function refreshLearningPath(options = {}) {
    const course = getActiveCourse();
    if (!course) {
        renderCourseCatalog();
        return;
    }

    const player = document.getElementById('coursePlayerView');
    if (player && player.hidden) {
        if (currentCourseView === 'detail') {
            renderCourseDetail(course.id);
        } else {
            renderCourseCatalog();
        }
        return;
    }

    const lessons = getCourseLessons(course);
    if (options.selectFirst || !lessons.some(lesson => lesson.id === currentLearningLessonId)) {
        const next = lessons.find(lesson => !isCourseLessonCompleted(course, lesson.id)) || lessons[0];
        currentLearningLessonId = next?.id || null;
        currentLessonStep = next ? getDefaultLessonStep(course, next) : 'concept';
    }
    renderCoursePlayer();
}

function initLearningPath() {
    loadLearningPathProgress();
    loadNoSQLCourseProgress();
    loadCourseAssessment();
    currentCourseId = loadActiveCourse()
        || getCourses().find(course => course.recommended)?.id
        || getCourses()[0]?.id
        || null;
    currentLearningLessonId = null;
    currentCourseView = 'catalog';
    renderCourseCatalog();
    activatePathTab('lessons');

    if (learningPathEventsBound) return;
    learningPathEventsBound = true;

    document.querySelectorAll('.path-tab').forEach(tab => {
        tab.addEventListener('click', () => activatePathTab(tab.dataset.pathTab));
        tab.addEventListener('keydown', event => {
            if (event.key !== 'ArrowRight' && event.key !== 'ArrowLeft') return;
            const tabs = Array.from(document.querySelectorAll('.path-tab'));
            const index = tabs.indexOf(tab);
            if (index === -1) return;
            event.preventDefault();
            const offset = event.key === 'ArrowRight' ? 1 : -1;
            const nextTab = tabs[(index + offset + tabs.length) % tabs.length];
            nextTab.focus();
            activatePathTab(nextTab.dataset.pathTab);
        });
    });

    const nosqlSelector = document.getElementById('nosqlDatasetSelector');
    if (nosqlSelector) {
        nosqlSelector.addEventListener('change', () => {
            syncCourseDatasetControls();
            setTimeout(refreshActiveCourseDataset, 0);
        });
    }

    document.addEventListener('keydown', event => {
        if (event.target?.id !== 'pathEditor') return;
        if ((event.ctrlKey || event.metaKey) && event.key === 'Enter') {
            event.preventDefault();
            runLearningLesson();
        }
    });

    setTimeout(() => {
        syncCourseDatasetControls();
        refreshActiveCourseDataset();
    }, 0);
}

function selectLearningLesson(id) {
    const course = getActiveCourse();
    const lessons = course ? getCourseLessons(course) : getLearningLessons();
    if (!lessons.some(lesson => lesson.id === id)) {
        const targetCourse = getCourseForLesson(id);
        if (!targetCourse) return;
        startCourse(targetCourse.id, id);
        return;
    }
    const changed = currentLearningLessonId !== id;
    currentLearningLessonId = id;
    if (changed) {
        const lesson = lessons.find(item => item.id === id);
        currentLessonStep = lesson ? getDefaultLessonStep(course, lesson) : 'concept';
    }
    renderCoursePlayer();
    const editor = document.getElementById('pathEditor');
    if (editor) editor.focus();
}

function setLearningResult(type, html) {
    const result = document.getElementById('pathResult');
    if (!result) return;
    result.className = `challenge-result ${type}`;
    result.innerHTML = html;
}

function resetLearningResult() {
    const result = document.getElementById('pathResult');
    if (!result) return;
    const isNoSQL = getActiveCourse()?.track === 'nosql';
    result.className = 'challenge-result';
    result.innerHTML = `<strong><i class="fas fa-circle-info"></i> Listo para practicar</strong> ${isNoSQL ? 'Escribe un comando NoSQL' : 'Escribe tu consulta'} y pulsa «Comprobar lección».`;
}

function learningComparisonMessage(comparison) {
    if (comparison.reason === 'columns') {
        return `Se esperaban ${comparison.expectedColumns} columnas y tu consulta devolvió ${comparison.actualColumns}. Revisa el SELECT.`;
    }
    if (comparison.reason === 'rows') {
        return `Se esperaban ${comparison.expectedRows} filas y tu consulta devolvió ${comparison.actualRows}. Revisa el filtro, el JOIN o el LIMIT.`;
    }
    if (comparison.reason === 'values') {
        return 'Las filas y columnas coinciden, pero los valores no. Revisa el orden, los cálculos o las columnas seleccionadas.';
    }
    if (comparison.reason === 'no_result') {
        return 'Tu consulta no devolvió un conjunto de resultados.';
    }
    return 'Todavía no coincide con el resultado esperado.';
}

function showPracticeNext() {
    const container = document.getElementById('pathNext');
    if (!container) return;
    container.hidden = false;
    container.innerHTML = '<button type="button" class="btn-primary" onclick="goToLessonStep(\'check\')">Ir a la comprobación <i class="fas fa-arrow-right"></i></button>';
}

function submitLessonQuiz(event) {
    event.preventDefault();
    const course = getActiveCourse();
    const lesson = getActiveCourseLessonById(currentLearningLessonId);
    const form = event.currentTarget || document.getElementById('lessonQuizForm');
    const result = document.getElementById('lessonQuizResult');
    if (!lesson || !form || !result) return;

    const quiz = lesson.quiz || [];
    const answers = quiz.map((_, index) => (
        form.querySelector(`input[name="lessonQuizQ${index}"]:checked`)
    ));

    result.hidden = false;
    if (answers.some(answer => !answer)) {
        result.className = 'challenge-result warning';
        result.innerHTML = '<strong><i class="fas fa-circle-exclamation"></i> Faltan respuestas</strong> Responde todas las preguntas antes de comprobar.';
        return;
    }

    const wrong = answers
        .map((answer, index) => Number(answer.value) === quiz[index].answer ? null : index)
        .filter(index => index !== null);

    if (wrong.length) {
        result.className = 'challenge-result error';
        result.innerHTML = `
            <strong><i class="fas fa-circle-xmark"></i> Revisa tus respuestas</strong>
            <p>Preguntas por revisar: ${wrong.map(index => index + 1).join(', ')}.</p>
            <ul>${wrong.map(index => `<li>${escapeHtml(quiz[index].explanation)}</li>`).join('')}</ul>
        `;
        playSound('error');
        return;
    }

    markCourseLessonQuizPassed(course, lesson.id);
    playSound('success');
    renderLearningPathList();
    renderLearningLessonDetail();
    showToast('success', '¡Lección completada!');
}

function showLearningNext(lesson) {
    const container = document.getElementById('pathNext');
    if (!container) return;
    const course = getActiveCourse();
    const lessons = course ? getCourseLessons(course) : getLearningLessons();
    container.hidden = false;
    container.innerHTML = getCourseNextMarkup(course, lessons, lesson);
}

function runNoSQLCourseLesson() {
    const course = getActiveCourse();
    const lesson = course?.track === 'nosql'
        ? getCourseLessons(course).find(item => item.id === currentLearningLessonId)
        : null;
    const editor = document.getElementById('pathEditor');
    if (!lesson || !editor) return;

    const query = editor.value.trim();
    if (!query) {
        setLearningResult('warning', '<strong><i class="fas fa-circle-exclamation"></i> Falta el comando</strong> Escribe un comando NoSQL antes de comprobarlo.');
        return;
    }
    if (!window.NoSQL || !window.NOSQL_DATASETS) {
        setLearningResult('warning', '<strong><i class="fas fa-hourglass-half"></i> Motor NoSQL no disponible</strong> Recarga la página e inténtalo de nuevo.');
        return;
    }

    let command = null;
    try {
        command = window.NoSQL.parseCommand(query);
    } catch (error) {
        setLearningResult('error', `
            <strong><i class="fas fa-circle-exclamation"></i> Comando no válido</strong>
            <code>${escapeHtml(error.message || String(error))}</code>
        `);
        return;
    }

    const method = command.methods?.[0]?.name;
    if (!['find', 'findOne', 'aggregate'].includes(method)) {
        setLearningResult('warning', '<strong><i class="fas fa-lock"></i> Solo lectura</strong> El curso solo permite <code>find</code>, <code>findOne</code> y <code>aggregate</code>.');
        return;
    }

    try {
        const dataset = window.NOSQL_DATASETS[getNoSQLActiveDatasetName()];
        const state = window.NoSQL.createDatabase(dataset);
        const expected = window.NoSQL.executeCommand(state, lesson.expectedQuery);
        const actual = window.NoSQL.executeCommand(state, query);
        const comparison = compareNoSQLCourseResults(expected, actual);

        if (comparison.ok) {
            markCourseLessonPracticeCompleted(course, lesson.id);
            const stages = getCourseLessonStages(course, lesson.id);
            playSound('success');
            renderLearningPathList();
            const status = document.getElementById('pathLessonStatus');
            if (status) status.hidden = !stages.completed;
            setLearningResult('success', `
                <strong><i class="fas fa-circle-check"></i> ${stages.completed ? 'Lección completada' : 'Práctica superada'}</strong>
                ${stages.completed ? 'Ya puedes continuar con la siguiente lección.' : 'Tu comando devuelve los documentos esperados. Ahora completa la comprobación.'}
            `);
            showPracticeNext();
            showToast('success', stages.completed ? 'Lección completada.' : 'Práctica superada. Te falta la comprobación.');
            return;
        }

        playSound('error');
        setLearningResult('error', `
            <strong><i class="fas fa-circle-xmark"></i> Todavía no</strong>
            ${escapeHtml(comparison.message)}
        `);
    } catch (error) {
        playSound('error');
        setLearningResult('error', `
            <strong><i class="fas fa-circle-exclamation"></i> Error en el comando</strong>
            <code>${escapeHtml(error.message || String(error))}</code>
        `);
    }
}

function runLearningLesson(database = db, initialized = dbInitialized) {
    const course = getActiveCourse();
    if (course?.track === 'nosql') {
        runNoSQLCourseLesson();
        return;
    }

    const lesson = getLearningLessonById(currentLearningLessonId);
    const editor = document.getElementById('pathEditor');
    if (!lesson || !editor) return;

    const query = editor.value.trim();
    if (!query) {
        setLearningResult('warning', '<strong><i class="fas fa-circle-exclamation"></i> Falta la consulta</strong> Escribe una consulta antes de comprobarla.');
        return;
    }
    if (!isReadOnlyQuery(query)) {
        setLearningResult('warning', '<strong><i class="fas fa-lock"></i> Solo lectura</strong> El curso solo permite consultas <code>SELECT</code> o <code>WITH</code>.');
        return;
    }
    if (!initialized || !database) {
        setLearningResult('warning', '<strong><i class="fas fa-hourglass-half"></i> Base de datos no disponible</strong> Espera a que termine de inicializarse e inténtalo de nuevo.');
        return;
    }

    try {
        const expected = database.exec(lesson.expectedSql);
        const actual = database.exec(query);
        const comparison = compareChallengeResults(expected, actual, lesson.ordered);

        if (comparison.ok) {
            markCourseLessonPracticeCompleted(course, lesson.id);
            const stages = getCourseLessonStages(course, lesson.id);
            playSound('success');
            renderLearningPathList();
            const status = document.getElementById('pathLessonStatus');
            if (status) status.hidden = !stages.completed;
            setLearningResult('success', `
                <strong><i class="fas fa-circle-check"></i> ${stages.completed ? 'Lección completada' : 'Práctica superada'}</strong>
                ${stages.completed ? 'Ya puedes continuar con la siguiente lección.' : 'Tu consulta devuelve el resultado esperado. Ahora completa la comprobación.'}
            `);
            showPracticeNext();
            showToast('success', stages.completed ? 'Lección completada.' : 'Práctica superada. Te falta la comprobación.');
            return;
        }

        playSound('error');
        setLearningResult('error', `
            <strong><i class="fas fa-circle-xmark"></i> Todavía no</strong>
            ${escapeHtml(learningComparisonMessage(comparison))}
        `);
    } catch (error) {
        playSound('error');
        setLearningResult('error', `
            <strong><i class="fas fa-circle-exclamation"></i> Error en la consulta</strong>
            <code>${escapeHtml(error.message || String(error))}</code>
        `);
    }
}

function nextLearningLesson() {
    const course = getActiveCourse();
    const lessons = course ? getCourseLessons(course) : getLearningLessons();
    const index = lessons.findIndex(lesson => lesson.id === currentLearningLessonId);
    const next = lessons[index + 1];
    if (next) {
        selectLearningLesson(next.id);
    } else {
        showToast('success', course ? '¡Has llegado al final del curso!' : '¡Has llegado al final de la ruta!');
    }
}

function showLearningHint() {
    const hint = document.getElementById('pathHint');
    const button = document.getElementById('pathHintBtn');
    if (!hint) return;
    hint.hidden = !hint.hidden;
    if (button) {
        button.innerHTML = hint.hidden
            ? '<i class="fas fa-lightbulb"></i> Ver pista'
            : '<i class="fas fa-eye-slash"></i> Ocultar pista';
    }
}

function clearLearningEditor() {
    const editor = document.getElementById('pathEditor');
    if (!editor) return;
    editor.value = '';
    resetLearningResult();
    editor.focus();
}

function loadLearningExample() {
    const course = getActiveCourse();
    const lesson = course?.track === 'nosql'
        ? getCourseLessons(course).find(item => item.id === currentLearningLessonId)
        : getLearningLessonById(currentLearningLessonId);
    const editor = document.getElementById('pathEditor');
    if (!lesson || !editor) return;
    editor.value = lesson.example;
    resetLearningResult();
    editor.focus();
    showToast('info', 'Ejemplo cargado en el editor.');
}

function resetLearningProgress() {
    const course = getActiveCourse();
    const isNoSQL = course?.track === 'nosql';
    const datasetName = isNoSQL ? getNoSQLActiveDatasetName() : getLearningDatasetName();
    const datasetLabel = isNoSQL
        ? (getNoSQLCourseProfile(datasetName)?.name || datasetName)
        : getLearningProfile().name;
    const scope = course ? `el curso ${course.title}` : `la ruta de ${datasetLabel}`;
    if (!confirm(`¿Reiniciar tu progreso de ${scope} en ${datasetLabel}?`)) return;

    if (isNoSQL) {
        const datasetProgress = nosqlCourseProgress[datasetName];
        if (datasetProgress) {
            getCourseLessonIds(course).forEach(id => delete datasetProgress[id]);
            if (!Object.keys(datasetProgress).length) delete nosqlCourseProgress[datasetName];
        }
        saveNoSQLCourseProgress();
    } else if (course) {
        const datasetProgress = learningPathProgress[datasetName];
        if (datasetProgress) {
            getCourseLessonIds(course).forEach(id => delete datasetProgress[id]);
            if (!Object.keys(datasetProgress).length) delete learningPathProgress[datasetName];
        }
        saveLearningPathProgress();
    } else {
        delete learningPathProgress[datasetName];
        saveLearningPathProgress();
    }

    currentLearningLessonId = null;
    if (course) {
        const lessons = getCourseLessons(course);
        const nextLesson = lessons.find(lesson => !isCourseLessonCompleted(course, lesson.id)) || lessons[0] || null;
        currentLearningLessonId = nextLesson?.id || null;
        currentLessonStep = nextLesson ? getDefaultLessonStep(course, nextLesson) : 'concept';
        renderCoursePlayer();
    } else {
        refreshLearningPath({ selectFirst: true });
    }
    showToast('info', `Progreso de ${scope} en ${datasetLabel} reiniciado.`);
}

// ============================================
// RETOS NOSQL EN LA PAGINA DE RETOS
// ============================================

function getNoSQLActiveDatasetName() {
    if (typeof window.getNoSQLActiveDataset === 'function') {
        return window.getNoSQLActiveDataset();
    }
    const selector = document.getElementById('nosqlDatasetSelector');
    return selector?.value || 'escuela';
}

function getNoSQLHubChallenges() {
    const datasetName = getNoSQLActiveDatasetName();
    if (typeof window.getNoSQLChallengesForDataset === 'function') {
        return window.getNoSQLChallengesForDataset(datasetName);
    }
    return Array.isArray(window.NOSQL_CHALLENGES)
        ? window.NOSQL_CHALLENGES.filter(challenge => challenge.dataset === datasetName)
        : [];
}

function isNoSQLHubChallengeCompleted(id) {
    if (typeof window.isNoSQLChallengeCompleted === 'function') {
        return window.isNoSQLChallengeCompleted(id);
    }
    return false;
}

function getNoSQLChallengeLevelClass(level) {
    if (level === 'Básico') return 'basico';
    if (level === 'Intermedio') return 'intermedio';
    return 'avanzado';
}

function renderNoSQLHubPlaceholder() {
    const detail = document.getElementById('nosqlHubChallengeDetail');
    if (!detail) return;
    detail.innerHTML = `
        <div class="challenge-empty">
            <i class="fas fa-leaf"></i>
            <h3>Elige un reto NoSQL</h3>
            <p>Selecciona un reto de la lista para ver su descripción y abrirlo en el laboratorio.</p>
        </div>
    `;
}

function renderNoSQLHubDetail(challenge) {
    const detail = document.getElementById('nosqlHubChallengeDetail');
    if (!detail) return;
    if (!challenge) {
        renderNoSQLHubPlaceholder();
        return;
    }

    const completed = isNoSQLHubChallengeCompleted(challenge.id);
    detail.innerHTML = `
        <div class="challenge-detail-header">
            <div>
                <h3>${escapeHtml(challenge.title)}</h3>
                <div class="challenge-detail-meta">
                    <span class="challenge-level ${getNoSQLChallengeLevelClass(challenge.level)}">${escapeHtml(challenge.level)}</span>
                    <span class="text-muted">${completed ? 'Completado' : 'Validación por resultado'}</span>
                </div>
            </div>
        </div>
        <div class="challenge-description">${escapeHtml(challenge.description)}</div>
        <details class="nosql-hint">
            <summary><i class="fas fa-lightbulb"></i> Ver pista</summary>
            <p>${escapeHtml(challenge.hint)}</p>
        </details>
        <label for="nosqlHubEditor" class="sr-only">Comando NoSQL para el reto</label>
        <textarea id="nosqlHubEditor" spellcheck="false" placeholder="Escribe un comando NoSQL, por ejemplo: db.productos.find({ stock: { $lte: 10 } })">${escapeHtml(challenge.starter || '')}</textarea>
        <div class="challenge-actions">
            <button type="button" id="nosqlHubRunBtn" onclick="runNoSQLHubChallenge()">
                <i class="fas fa-play"></i> Comprobar reto
            </button>
            <button type="button" class="btn-secondary" onclick="clearNoSQLHubEditor()">
                <i class="fas fa-eraser"></i> Limpiar
            </button>
            <button type="button" class="btn-secondary" onclick="solveNoSQLChallengeInLab('${escapeHtml(challenge.id)}')">
                <i class="fas fa-flask"></i> Abrir en laboratorio
            </button>
        </div>
        <div id="nosqlHubFeedback" class="challenge-result" aria-live="polite">
            <strong><i class="fas fa-circle-info"></i> Listo para intentarlo</strong>
            Escribe un comando NoSQL y pulsa «Comprobar reto».
        </div>
    `;
}

function renderNoSQLHubList() {
    const list = document.getElementById('nosqlHubChallengeList');
    const datasetLabel = document.getElementById('nosqlHubDatasetLabel');
    const progressText = document.getElementById('nosqlHubProgressText');
    if (!list) return;

    const datasetName = getNoSQLActiveDatasetName();
    const dataset = window.NOSQL_DATASETS?.[datasetName];
    if (datasetLabel) {
        datasetLabel.textContent = `Dataset NoSQL: ${dataset?.name || datasetName}`;
    }

    const challenges = getNoSQLHubChallenges();
    const completed = challenges.filter(challenge => isNoSQLHubChallengeCompleted(challenge.id)).length;
    if (progressText) progressText.textContent = `${completed} de ${challenges.length}`;

    if (!challenges.length) {
        list.innerHTML = '<p class="text-muted">No hay retos NoSQL para este dataset.</p>';
        return;
    }

    list.innerHTML = challenges.map(challenge => {
        const isCompleted = isNoSQLHubChallengeCompleted(challenge.id);
        const active = challenge.id === selectedNoSQLChallengeId;
        return `
            <button type="button" class="challenge-card${active ? ' active' : ''}" data-nosql-challenge="${escapeHtml(challenge.id)}" aria-pressed="${active}">
                <span class="challenge-card-title">
                    ${escapeHtml(challenge.title)}
                    ${isCompleted ? '<i class="fas fa-circle-check" title="Completado"></i>' : ''}
                </span>
                <span class="challenge-card-meta">
                    <span class="challenge-level ${getNoSQLChallengeLevelClass(challenge.level)}">${escapeHtml(challenge.level)}</span>
                    ${isCompleted ? '<span>Completado</span>' : '<span>Pendiente</span>'}
                </span>
            </button>
        `;
    }).join('');

    list.querySelectorAll('[data-nosql-challenge]').forEach(button => {
        button.addEventListener('click', () => openNoSQLHubChallenge(button.dataset.nosqlChallenge));
    });
}

function renderNoSQLChallengeHub() {
    renderNoSQLHubList();
    const challenges = getNoSQLHubChallenges();
    const selectedChallenge = challenges.find(challenge => challenge.id === selectedNoSQLChallengeId);
    if (!selectedChallenge) {
        selectedNoSQLChallengeId = null;
        renderNoSQLHubPlaceholder();
    } else {
        renderNoSQLHubDetail(selectedChallenge);
    }
}

function openNoSQLHubChallenge(id) {
    const challenge = getNoSQLHubChallenges().find(item => item.id === id);
    if (!challenge) return;
    selectedNoSQLChallengeId = id;
    if (typeof window.loadNoSQLChallenge === 'function') {
        window.loadNoSQLChallenge(id, { focus: false });
    }
    renderNoSQLChallengeHub();
}

function runNoSQLHubChallenge() {
    const editor = document.getElementById('nosqlHubEditor');
    if (!editor) return;
    if (typeof window.runNoSQLChallengeCommand !== 'function') {
        showToast('warning', 'El motor NoSQL todavía no está disponible.');
        return;
    }

    const feedback = window.runNoSQLChallengeCommand(editor.value);
    if (!feedback) return;

    const container = document.getElementById('nosqlHubFeedback');
    if (container) {
        container.className = `challenge-result ${feedback.ok ? 'success' : 'error'}`;
        const solutionButton = feedback.canRevealSolution
            ? `<div class="challenge-result-actions">
                    <button type="button" class="btn-secondary" onclick="revealNoSQLHubSolution()">
                        <i class="fas fa-eye"></i> Ver solución
                    </button>
                </div>`
            : '';
        container.innerHTML = `<strong>${feedback.ok ? 'Reto completado' : 'Todavía no'}</strong><p>${escapeHtml(feedback.message)}</p>${solutionButton}`;
    }

    if (feedback.ok) {
        renderNoSQLHubList();
        const meta = document.querySelector('#nosqlHubChallengeDetail .challenge-detail-meta .text-muted');
        if (meta) meta.textContent = 'Completado';
    }
}

function revealNoSQLHubSolution() {
    const editor = document.getElementById('nosqlHubEditor');
    const challenge = getNoSQLHubChallenges().find(item => item.id === selectedNoSQLChallengeId);
    if (!editor || !challenge) return;
    editor.value = challenge.solution;
    editor.focus();
    showToast('info', 'Solución cargada. Pulsa «Comprobar reto» para validarla.');
}

function clearNoSQLHubEditor() {
    const editor = document.getElementById('nosqlHubEditor');
    if (!editor) return;
    editor.value = '';
    editor.focus();
}

function solveNoSQLChallengeInLab(id) {
    if (typeof window.loadNoSQLChallenge !== 'function') {
        showToast('warning', 'El laboratorio NoSQL todavía no está disponible.');
        return;
    }
    window.loadNoSQLChallenge(id, { focus: false });
    activateSection('nosql');
    const editor = document.getElementById('nosqlEditor');
    if (editor) editor.focus();
    showToast('info', 'Reto cargado en el laboratorio NoSQL.');
}

function openNoSQLLab() {
    activateSection('nosql');
}

function activateChallengeTab(tabName) {
    const tabs = Array.from(document.querySelectorAll('.challenge-tab'));
    const panels = {
        sql: document.getElementById('sqlChallengesPanel'),
        nosql: document.getElementById('nosqlChallengesPanel'),
        debug: document.getElementById('debugChallengesPanel')
    };
    const nextTab = ['sql', 'nosql', 'debug'].includes(tabName) ? tabName : 'sql';

    tabs.forEach(tab => {
        const active = tab.dataset.challengeTab === nextTab;
        tab.classList.toggle('active', active);
        tab.setAttribute('aria-selected', String(active));
        tab.tabIndex = active ? 0 : -1;
    });

    Object.entries(panels).forEach(([name, panel]) => {
        if (!panel) return;
        const active = name === nextTab;
        panel.hidden = !active;
        panel.classList.toggle('active', active);
    });

    if (nextTab === 'nosql') {
        renderNoSQLChallengeHub();
    } else if (nextTab === 'debug') {
        renderDebugChallengeList();
    }
}

function openNoSQLChallengesHub() {
    activateSection('challenges');
    activateChallengeTab('nosql');
}

function syncMobileNavigation(sectionName) {
    const moreSections = ['game', 'nosql', 'analyze'];
    document.querySelectorAll('[data-mobile-section]').forEach(button => {
        const active = button.dataset.mobileSection === sectionName;
        button.classList.toggle('active', active);
        if (active) {
            button.setAttribute('aria-current', 'page');
        } else {
            button.removeAttribute('aria-current');
        }
    });

    const moreActive = moreSections.includes(sectionName);
    const moreButton = document.getElementById('mobileMoreBtn');
    if (moreButton) {
        moreButton.classList.toggle('active', moreActive);
        if (moreActive) {
            moreButton.setAttribute('aria-current', 'page');
        } else {
            moreButton.removeAttribute('aria-current');
        }
    }

    document.querySelectorAll('[data-mobile-more-section]').forEach(button => {
        const active = button.dataset.mobileMoreSection === sectionName;
        button.classList.toggle('active', active);
        if (active) {
            button.setAttribute('aria-current', 'page');
        } else {
            button.removeAttribute('aria-current');
        }
    });
}

function openMobileMore() {
    const modal = document.getElementById('mobileMoreModal');
    const button = document.getElementById('mobileMoreBtn');
    if (!modal) return;
    button?.setAttribute('aria-expanded', 'true');
    openModal(modal);
}

function closeMobileMore() {
    const modal = document.getElementById('mobileMoreModal');
    if (!modal) return;
    closeModal(modal);
    document.getElementById('mobileMoreBtn')?.focus();
}

function activateSection(sectionName) {
    document.querySelectorAll('.nav-btn').forEach(btn => {
        const active = btn.dataset.section === sectionName;
        btn.classList.toggle('active', active);
        if (active) {
            btn.setAttribute('aria-current', 'page');
        } else {
            btn.removeAttribute('aria-current');
        }
    });

    document.querySelectorAll('.section').forEach(section => {
        section.classList.remove('active');
    });

    const target = document.getElementById('section-' + sectionName);
    if (target) {
        target.classList.add('active');
    }

    if (sectionName === 'challenges') {
        const activeTab = document.querySelector('.challenge-tab.active')?.dataset.challengeTab || 'sql';
        activateChallengeTab(activeTab);
    }

    if (sectionName === 'path') {
        if (currentCourseView === 'player') {
            renderCoursePlayer();
        } else if (currentCourseView === 'detail' && currentCourseId) {
            renderCourseDetail(currentCourseId);
        } else {
            renderCourseCatalog();
        }
    }

    syncMobileNavigation(sectionName);
}

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
    loadSoundPreference();
    applySoundPreference();
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

// ============================================
// GUÍA DE PRIMEROS PASOS EN SQL (CORREGIDA)
// ============================================

const sqlGuideSteps = [
    {
        id: 'intro',
        title: '¿Qué es SQL?',
        icon: 'fa-info-circle',
        color: '#336791',
        content: `
            <p style="font-size:1.05em; line-height:1.7;">
                SQL (<strong>S</strong>tructured <strong>Q</strong>uery <strong>L</strong>anguage) es el lenguaje estándar 
                para manejar bases de datos relacionales. Con SQL puedes:
            </p>
            <ul style="margin:12px 0; padding-left:20px; line-height:1.8;">
                <li><strong>Consultar</strong> datos (SELECT)</li>
                <li><strong>Insertar</strong> datos (INSERT)</li>
                <li><strong>Actualizar</strong> datos (UPDATE)</li>
                <li><strong>Eliminar</strong> datos (DELETE)</li>
                <li><strong>Crear</strong> tablas y bases de datos (CREATE)</li>
                <li><strong>Definir</strong> relaciones entre tablas</li>
            </ul>
            <div style="background:#f0f4ff; padding:12px 15px; border-radius:8px; border-left:4px solid #336791; margin-top:10px;">
                <i class="fas fa-lightbulb" style="color:#336791;"></i>
                <strong>Concepto clave:</strong> SQL es declarativo, describes <em>qué</em> quieres obtener, no <em>cómo</em> obtenerlo.
            </div>
        `
    },
    {
        id: 'create-database',
        title: 'Paso 1: Crear una Base de Datos',
        icon: 'fa-database',
        color: '#2ecc71',
        content: `
            <p>Una base de datos es un contenedor que organiza toda la información. Para crearla usamos <code>CREATE DATABASE</code>.</p>
            
            <h4 style="margin:15px 0 8px 0; color:#2ecc71;">Sintaxis:</h4>
            <div style="background:#1a1a2e; color:#e0e0e0; padding:12px 15px; border-radius:8px; font-family:'Courier New',monospace; font-size:13px; overflow-x:auto;">
                CREATE DATABASE nombre_de_la_base_datos;
            </div>

            <h4 style="margin:15px 0 8px 0; color:#2ecc71;">Ejemplo:</h4>
            <div style="background:#1a1a2e; color:#e0e0e0; padding:12px 15px; border-radius:8px; font-family:'Courier New',monospace; font-size:13px; overflow-x:auto;">
                CREATE DATABASE escuela;
            </div>

            <div style="background:#fff3cd; padding:10px 15px; border-radius:8px; border-left:4px solid #ffc107; margin-top:12px;">
                <i class="fas fa-exclamation-triangle" style="color:#ffc107;"></i>
                <strong>Importante:</strong> En este simulador ya tienes una base de datos creada. Este paso aplica en PostgreSQL/MySQL.
            </div>
        `
    },
    {
        id: 'create-table',
        title: 'Paso 2: Crear una Tabla',
        icon: 'fa-table',
        color: '#3498db',
        content: `
            <p>Las tablas almacenan los datos en filas y columnas. Para crearlas usamos <code>CREATE TABLE</code>.</p>
            
            <h4 style="margin:15px 0 8px 0; color:#3498db;">Sintaxis:</h4>
            <div style="background:#1a1a2e; color:#e0e0e0; padding:12px 15px; border-radius:8px; font-family:'Courier New',monospace; font-size:13px; overflow-x:auto;">
                CREATE TABLE nombre_tabla (
                    columna1 TIPO DE DATO,
                    columna2 TIPO DE DATO,
                    columna3 TIPO DE DATO
                );
            </div>

            <h4 style="margin:15px 0 8px 0; color:#3498db;">Tipos de datos comunes:</h4>
            <div style="display:grid; grid-template-columns:1fr 1fr; gap:8px; margin:8px 0;">
                <div style="background:#f8f9fa; padding:8px 12px; border-radius:6px;"><code>INTEGER</code> Números enteros</div>
                <div style="background:#f8f9fa; padding:8px 12px; border-radius:6px;"><code>VARCHAR(100)</code> Texto corto</div>
                <div style="background:#f8f9fa; padding:8px 12px; border-radius:6px;"><code>TEXT</code> Texto largo</div>
                <div style="background:#f8f9fa; padding:8px 12px; border-radius:6px;"><code>DATE</code> Fechas</div>
                <div style="background:#f8f9fa; padding:8px 12px; border-radius:6px;"><code>BOOLEAN</code> Verdadero/Falso</div>
                <div style="background:#f8f9fa; padding:8px 12px; border-radius:6px;"><code>DECIMAL(10,2)</code> Números con decimales</div>
            </div>

            <h4 style="margin:15px 0 8px 0; color:#3498db;">Ejemplo:</h4>
            <div style="background:#1a1a2e; color:#e0e0e0; padding:12px 15px; border-radius:8px; font-family:'Courier New',monospace; font-size:13px; overflow-x:auto;">
                CREATE TABLE estudiantes (
                    id INTEGER,
                    nombre VARCHAR(50),
                    edad INTEGER,
                    carrera VARCHAR(50)
                );
            </div>
        `
    },
    {
        id: 'primary-key',
        title: 'Paso 3: Agregar una Llave Primaria (PK)',
        icon: 'fa-key',
        color: '#e74c3c',
        content: `
            <p>La <strong>llave primaria (Primary Key)</strong> identifica de forma única cada fila de una tabla.</p>
            
            <h4 style="margin:15px 0 8px 0; color:#e74c3c;">Características:</h4>
            <ul style="margin:8px 0; padding-left:20px; line-height:1.8;">
                <li><i class="fas fa-check-circle" style="color:#28a745;"></i> Debe ser <strong>única</strong> (no se repite)</li>
                <li><i class="fas fa-check-circle" style="color:#28a745;"></i> No puede ser <strong>NULL</strong> (siempre tiene valor)</li>
                <li><i class="fas fa-check-circle" style="color:#28a745;"></i> Solo puede haber <strong>una</strong> por tabla</li>
            </ul>

            <h4 style="margin:15px 0 8px 0; color:#e74c3c;">Sintaxis:</h4>
            <div style="background:#1a1a2e; color:#e0e0e0; padding:12px 15px; border-radius:8px; font-family:'Courier New',monospace; font-size:13px; overflow-x:auto;">
                CREATE TABLE nombre_tabla (
                    id INTEGER PRIMARY KEY,
                    columna2 VARCHAR(50)
                );
            </div>

            <h4 style="margin:15px 0 8px 0; color:#e74c3c;">Ejemplo:</h4>
            <div style="background:#1a1a2e; color:#e0e0e0; padding:12px 15px; border-radius:8px; font-family:'Courier New',monospace; font-size:13px; overflow-x:auto;">
                CREATE TABLE estudiantes (
                    id INTEGER PRIMARY KEY,
                    nombre VARCHAR(50),
                    edad INTEGER
                );
            </div>

            <div style="background:#f0f4ff; padding:10px 15px; border-radius:8px; border-left:4px solid #e74c3c; margin-top:12px;">
                <i class="fas fa-lightbulb" style="color:#e74c3c;"></i>
                <strong>Tip:</strong> Usa <code>SERIAL</code> en PostgreSQL para que el ID se autoincremente automáticamente.
            </div>
        `
    },
    {
        id: 'foreign-key',
        title: 'Paso 4: Agregar una Llave Foránea (FK)',
        icon: 'fa-link',
        color: '#9b59b6',
        content: `
            <p>La <strong>llave foránea (Foreign Key)</strong> establece una relación entre dos tablas.</p>

            <h4 style="margin:15px 0 8px 0; color:#9b59b6;">Relaciones entre tablas:</h4>
            <div style="display:grid; grid-template-columns:1fr 1fr 1fr; gap:10px; margin:8px 0;">
                <div style="background:#f8f9fa; padding:10px; border-radius:8px; text-align:center; border:1px solid #e9ecef;">
                    <div style="font-size:1.5em;">1:1</div>
                    <div style="font-size:0.8em; color:#666;">Uno a uno</div>
                </div>
                <div style="background:#f8f9fa; padding:10px; border-radius:8px; text-align:center; border:1px solid #e9ecef;">
                    <div style="font-size:1.5em;">1:N</div>
                    <div style="font-size:0.8em; color:#666;">Uno a muchos</div>
                </div>
                <div style="background:#f8f9fa; padding:10px; border-radius:8px; text-align:center; border:1px solid #e9ecef;">
                    <div style="font-size:1.5em;">N:M</div>
                    <div style="font-size:0.8em; color:#666;">Muchos a muchos</div>
                </div>
            </div>

            <h4 style="margin:15px 0 8px 0; color:#9b59b6;">Ejemplo:</h4>
            <div style="background:#1a1a2e; color:#e0e0e0; padding:12px 15px; border-radius:8px; font-family:'Courier New',monospace; font-size:13px; overflow-x:auto;">
                CREATE TABLE inscripciones (
                    id INTEGER PRIMARY KEY,
                    estudiante_id INTEGER,
                    curso_id INTEGER,
                    FOREIGN KEY (estudiante_id) REFERENCES estudiantes(id),
                    FOREIGN KEY (curso_id) REFERENCES cursos(id)
                );
            </div>

            <div style="background:#f0f4ff; padding:10px 15px; border-radius:8px; border-left:4px solid #9b59b6; margin-top:12px;">
                <i class="fas fa-lightbulb" style="color:#9b59b6;"></i>
                <strong>Tip:</strong> Las FK aseguran la <strong>integridad referencial</strong> (no puedes insertar un valor que no exista en la otra tabla).
            </div>
        `
    },
    {
        id: 'insert-data',
        title: 'Paso 5: Insertar Datos',
        icon: 'fa-pen-to-square',
        color: '#f39c12',
        content: `
            <p>Para agregar datos a una tabla usamos <code>INSERT INTO</code>.</p>

            <h4 style="margin:15px 0 8px 0; color:#f39c12;">Sintaxis:</h4>
            <div style="background:#1a1a2e; color:#e0e0e0; padding:12px 15px; border-radius:8px; font-family:'Courier New',monospace; font-size:13px; overflow-x:auto;">
                INSERT INTO nombre_tabla (columna1, columna2) VALUES (valor1, valor2);
            </div>

            <h4 style="margin:15px 0 8px 0; color:#f39c12;">Ejemplo:</h4>
            <div style="background:#1a1a2e; color:#e0e0e0; padding:12px 15px; border-radius:8px; font-family:'Courier New',monospace; font-size:13px; overflow-x:auto;">
                INSERT INTO estudiantes (id, nombre, edad) VALUES (1, 'Ana', 20);
            </div>

            <h4 style="margin:15px 0 8px 0; color:#f39c12;">Insertar múltiples registros:</h4>
            <div style="background:#1a1a2e; color:#e0e0e0; padding:12px 15px; border-radius:8px; font-family:'Courier New',monospace; font-size:13px; overflow-x:auto;">
                INSERT INTO estudiantes (id, nombre, edad) VALUES 
                    (1, 'Ana', 20),
                    (2, 'Carlos', 22),
                    (3, 'Maria', 19);
            </div>
        `
    },
    {
        id: 'select-data',
        title: 'Paso 6: Consultar Datos (SELECT)',
        icon: 'fa-magnifying-glass',
        color: '#1abc9c',
        content: `
            <p>Para consultar datos usamos <code>SELECT</code>. Es el comando más utilizado en SQL.</p>

            <h4 style="margin:15px 0 8px 0; color:#1abc9c;">Sintaxis básica:</h4>
            <div style="background:#1a1a2e; color:#e0e0e0; padding:12px 15px; border-radius:8px; font-family:'Courier New',monospace; font-size:13px; overflow-x:auto;">
                SELECT * FROM nombre_tabla;
            </div>

            <h4 style="margin:15px 0 8px 0; color:#1abc9c;">Filtrar datos (WHERE):</h4>
            <div style="background:#1a1a2e; color:#e0e0e0; padding:12px 15px; border-radius:8px; font-family:'Courier New',monospace; font-size:13px; overflow-x:auto;">
                SELECT * FROM estudiantes WHERE edad > 18;
            </div>

            <h4 style="margin:15px 0 8px 0; color:#1abc9c;">Ordenar datos (ORDER BY):</h4>
            <div style="background:#1a1a2e; color:#e0e0e0; padding:12px 15px; border-radius:8px; font-family:'Courier New',monospace; font-size:13px; overflow-x:auto;">
                SELECT * FROM estudiantes ORDER BY edad DESC;
            </div>

            <div style="background:#f0f4ff; padding:10px 15px; border-radius:8px; border-left:4px solid #1abc9c; margin-top:12px;">
                <i class="fas fa-lightbulb" style="color:#1abc9c;"></i>
                <strong>Tip:</strong> <code>SELECT *</code> trae todas las columnas. Es mejor especificar las columnas que necesitas para optimizar.
            </div>
        `
    },
    {
        id: 'join-tables',
        title: 'Paso 7: Unir Tablas (JOIN)',
        icon: 'fa-link',
        color: '#e67e22',
        content: `
            <p><code>JOIN</code> se usa para combinar datos de dos o más tablas usando una llave foránea.</p>

            <h4 style="margin:15px 0 8px 0; color:#e67e22;">Tipos de JOIN:</h4>
            <div style="display:grid; grid-template-columns:1fr 1fr; gap:10px; margin:8px 0;">
                <div style="background:#f8f9fa; padding:10px; border-radius:8px; border-left:3px solid #28a745;">
                    <strong style="color:#28a745;">INNER JOIN</strong>
                    <div style="font-size:0.8em; color:#666;">Solo registros que coinciden en ambas tablas</div>
                </div>
                <div style="background:#f8f9fa; padding:10px; border-radius:8px; border-left:3px solid #3498db;">
                    <strong style="color:#3498db;">LEFT JOIN</strong>
                    <div style="font-size:0.8em; color:#666;">Todos los registros de la tabla izquierda</div>
                </div>
                <div style="background:#f8f9fa; padding:10px; border-radius:8px; border-left:3px solid #e74c3c;">
                    <strong style="color:#e74c3c;">RIGHT JOIN</strong>
                    <div style="font-size:0.8em; color:#666;">Todos los registros de la tabla derecha</div>
                </div>
                <div style="background:#f8f9fa; padding:10px; border-radius:8px; border-left:3px solid #9b59b6;">
                    <strong style="color:#9b59b6;">FULL OUTER JOIN</strong>
                    <div style="font-size:0.8em; color:#666;">Todos los registros de ambas tablas</div>
                </div>
            </div>

            <h4 style="margin:15px 0 8px 0; color:#e67e22;">Ejemplo:</h4>
            <div style="background:#1a1a2e; color:#e0e0e0; padding:12px 15px; border-radius:8px; font-family:'Courier New',monospace; font-size:13px; overflow-x:auto;">
                SELECT e.nombre, c.nombre AS curso
                FROM estudiantes e
                JOIN inscripciones i ON e.id = i.estudiante_id
                JOIN cursos c ON i.curso_id = c.id;
            </div>

            <div style="background:#f0f4ff; padding:10px 15px; border-radius:8px; border-left:4px solid #e67e22; margin-top:12px;">
                <i class="fas fa-lightbulb" style="color:#e67e22;"></i>
                <strong>Tip:</strong> Usa <strong>alias</strong> (e, i, c) para hacer las consultas más cortas y legibles.
            </div>
        `
    },
    {
        id: 'summary',
        title: '🎯 ¡Has completado la guía!',
        icon: 'fa-trophy',
        color: '#f1c40f',
        content: `
            <div style="text-align:center; padding:20px 0;">
                <div style="font-size:4em; color:#f1c40f; margin-bottom:15px;">
                    <i class="fas fa-trophy"></i>
                </div>
                <h3 style="color:#2c3e50; margin-bottom:10px;">¡Felicidades!</h3>
                <p style="color:#666; font-size:1.05em; line-height:1.7; max-width:500px; margin:0 auto;">
                    Ahora conoces los fundamentos de SQL:
                </p>
                <div style="display:grid; grid-template-columns:1fr 1fr; gap:10px; margin-top:15px; text-align:left; max-width:400px; margin-left:auto; margin-right:auto;">
                    <div style="background:#f0f4ff; padding:10px; border-radius:8px;"><i class="fas fa-check-circle" style="color:#28a745;"></i> CREATE DATABASE</div>
                    <div style="background:#f0f4ff; padding:10px; border-radius:8px;"><i class="fas fa-check-circle" style="color:#28a745;"></i> CREATE TABLE</div>
                    <div style="background:#f0f4ff; padding:10px; border-radius:8px;"><i class="fas fa-check-circle" style="color:#28a745;"></i> PRIMARY KEY</div>
                    <div style="background:#f0f4ff; padding:10px; border-radius:8px;"><i class="fas fa-check-circle" style="color:#28a745;"></i> FOREIGN KEY</div>
                    <div style="background:#f0f4ff; padding:10px; border-radius:8px;"><i class="fas fa-check-circle" style="color:#28a745;"></i> INSERT INTO</div>
                    <div style="background:#f0f4ff; padding:10px; border-radius:8px;"><i class="fas fa-check-circle" style="color:#28a745;"></i> SELECT</div>
                    <div style="background:#f0f4ff; padding:10px; border-radius:8px;"><i class="fas fa-check-circle" style="color:#28a745;"></i> WHERE</div>
                    <div style="background:#f0f4ff; padding:10px; border-radius:8px;"><i class="fas fa-check-circle" style="color:#28a745;"></i> JOIN</div>
                </div>
                <div style="margin-top:20px;">
                    <button onclick="closeSQLGuide()" class="btn-secondary">
                        <i class="fas fa-check"></i> Entendido
                    </button>
                    <button onclick="closeSQLGuideAndGoToPractice()" class="btn-secondary" style="margin-left:10px; background:#336791; color:white; border-color:#336791;">
                        <i class="fas fa-laptop-code"></i> Ir a Practicar
                    </button>
                </div>
            </div>
        `
    }
];

let currentGuideStep = 0;

function openSQLGuide() {
    const modal = document.getElementById('sqlGuideModal');
    currentGuideStep = 0;
    renderGuideStep(currentGuideStep);
    openModal(modal);
}

function closeSQLGuide() {
    closeModal(document.getElementById('sqlGuideModal'));
}

// ===== NUEVA FUNCIÓN: Cerrar guía e ir a Practicar =====
function closeSQLGuideAndGoToPractice() {
    closeSQLGuide();
    // Cambiar a la sección de Practicar
    const practiceBtn = document.querySelector('.nav-btn[data-section="practice"]');
    if (practiceBtn) {
        practiceBtn.click();
    }
}

function renderGuideStep(index) {
    const step = sqlGuideSteps[index];
    if (!step) return;

    // Mantiene sincronizado el paso actual aunque se navegue desde la barra de progreso.
    currentGuideStep = index;
    
    const body = document.getElementById('sqlGuideBody');
    const totalSteps = sqlGuideSteps.length;
    
    let html = `
        <!-- Barra de progreso -->
        <div style="display:flex; gap:6px; margin-bottom:20px; justify-content:center;">
            ${sqlGuideSteps.map((s, i) => `
                <button type="button"
                    aria-label="Ir al paso ${i + 1}"
                    title="Paso ${i + 1}"
                    ${i === index ? 'aria-current="step"' : ''}
                    style="
                        width: ${100 / totalSteps}%;
                        height: 4px;
                        background: ${i <= index ? s.color : '#e9ecef'};
                        border: none;
                        padding: 0;
                        border-radius: 2px;
                        transition: all 0.3s;
                        cursor: pointer;
                    "
                    onclick="renderGuideStep(${i})"></button>
            `).join('')}
        </div>
        
        <!-- Contenido -->
        <div style="display:flex; align-items:center; gap:12px; margin-bottom:15px;">
            <div style="
                width: 48px; 
                height: 48px; 
                background: ${step.color}20; 
                border-radius: 50%; 
                display:flex; 
                align-items:center; 
                justify-content:center;
                color: ${step.color};
                font-size: 1.5em;
            ">
                <i class="fas ${step.icon}"></i>
            </div>
            <div>
                <div style="font-size:0.8em; color:var(--text-muted);">Paso ${index + 1} de ${totalSteps}</div>
                <h3 style="color:#2c3e50; margin:0; font-size:1.2em;">${step.title}</h3>
            </div>
        </div>
        
        <div style="max-height: 50vh; overflow-y: auto; padding-right:5px;">
            ${step.content}
        </div>
        
        <!-- Navegación -->
        <div style="display:flex; justify-content:space-between; margin-top:20px; padding-top:15px; border-top:1px solid #e9ecef;">
            <button onclick="previousGuideStep()" class="btn-secondary" ${index === 0 ? 'style="visibility:hidden;"' : ''}>
                <i class="fas fa-arrow-left"></i> Anterior
            </button>
            <span style="color:var(--text-muted); font-size:0.85em; display:flex; align-items:center;">
                ${index + 1} / ${totalSteps}
            </span>
            <button onclick="nextGuideStep()" class="btn-secondary">
                ${index === totalSteps - 1 ? '<i class="fas fa-check"></i> Finalizar' : 'Siguiente <i class="fas fa-arrow-right"></i>'}
            </button>
        </div>
    `;
    
    body.innerHTML = html;
}

function nextGuideStep() {
    if (currentGuideStep < sqlGuideSteps.length - 1) {
        currentGuideStep++;
        renderGuideStep(currentGuideStep);
    } else {
        closeSQLGuide();
    }
}

function previousGuideStep() {
    if (currentGuideStep > 0) {
        currentGuideStep--;
        renderGuideStep(currentGuideStep);
    }
}

// EXPONER FUNCIONES GLOBALES
window.getSQLModule = () => SQLModule;
window.runQuery = runQuery;
window.resetDatabase = resetDatabase;
window.loadDataset = loadDataset;
window.showExamples = showExamples;
window.clearHistory = clearHistory;
window.loadHistoryQuery = loadHistoryQuery;
window.exportDatabase = exportDatabase;
window.closeToolbarMore = closeToolbarMore;
window.loadTableEditor = loadTableEditor;
window.deleteRow = deleteRow;
window.addRow = addRow;
window.setAnalyzeExplorerMode = setAnalyzeExplorerMode;
window.refreshAnalyzeTableEditor = refreshAnalyzeTableEditor;
window.restoreAnalyzeDatasetData = restoreAnalyzeDatasetData;
window.hasUnsavedTableEditorChanges = hasUnsavedTableEditorChanges;
window.renderAnalyzePanel = renderAnalyzePanel;
window.selectAnalyzeTable = selectAnalyzeTable;
window.getAnalyzeSummary = getAnalyzeSummary;
window.buildAnalyzeQualityChecks = buildAnalyzeQualityChecks;
window.copyAnalyzeSelect = copyAnalyzeSelect;
window.practiceAnalyzeTable = practiceAnalyzeTable;
window.clearEditor = clearEditor;
window.toggleSafeMode = toggleSafeMode;
window.toggleTheme = toggleTheme;
window.installApp = installApp;
window.formatEditorSql = formatEditorSql;
window.sortResult = sortResult;
window.showMoreResults = showMoreResults;
window.exportResultCSV = exportResultCSV;
window.exportResultJSON = exportResultJSON;
window.copyResultTable = copyResultTable;
window.copyResultCell = copyResultCell;
window.openChallenge = openChallenge;
window.runChallenge = runChallenge;
window.showChallengeHint = showChallengeHint;
window.showChallengeSolution = showChallengeSolution;
window.clearChallengeEditor = clearChallengeEditor;
window.nextChallenge = nextChallenge;
window.resetChallengeProgress = resetChallengeProgress;
window.getDebugChallengeCatalog = getDebugChallengeCatalog;
window.openDebugChallenge = openDebugChallenge;
window.runDebugChallenge = runDebugChallenge;
window.showDebugHint = showDebugHint;
window.showDebugSolution = showDebugSolution;
window.getSkillLevel = getSkillLevel;
window.getEffectiveSkillLevel = getEffectiveSkillLevel;
window.setSkillLevel = setSkillLevel;
window.openSkillTest = openSkillTest;
window.closeSkillTest = closeSkillTest;
window.selectSkillTestOption = selectSkillTestOption;
window.nextSkillTestQuestion = nextSkillTestQuestion;
window.skipSkillTestQuestion = skipSkillTestQuestion;
window.getCurrentSkillTestQuestion = getCurrentSkillTestQuestion;
window.calculateSkillLevelFromAnswers = calculateSkillLevelFromAnswers;
window.getVisibleExampleCategories = getVisibleExampleCategories;
window.getNoSQLExampleLevel = getNoSQLExampleLevel;
window.getSkillLevelInfo = getSkillLevelInfo;
window.getWeakConcepts = getWeakConcepts;
window.renderSkillProfileCards = renderSkillProfileCards;
window.practiceSkillTarget = practiceSkillTarget;
window.startDemoTour = startDemoTour;
window.nextDemoTourStep = nextDemoTourStep;
window.previousDemoTourStep = previousDemoTourStep;
window.closeDemoTour = closeDemoTour;
window.openProgressReport = openProgressReport;
window.printProgressReport = printProgressReport;
window.closeProgressReport = closeProgressReport;
window.buildProgressReportHtml = buildProgressReportHtml;
window.toggleSound = toggleSound;
window.playSound = playSound;
window.loadSoundPreference = loadSoundPreference;
window.applySoundPreference = applySoundPreference;
window.isSoundEnabled = () => soundEnabled;
window.filterNoSQLExamplesBySkill = filterNoSQLExamplesBySkill;
window.getSkillTestQuestions = getSkillTestQuestions;
window.renderNoSQLQuickSyntax = renderNoSQLQuickSyntax;
window.loadSkillProfile = loadSkillProfile;
window.resetDebugQuery = resetDebugQuery;
window.nextDebugChallenge = nextDebugChallenge;
window.resetDebugChallengeProgress = resetDebugChallengeProgress;
window.saveTableChanges = saveTableChanges;
window.generateDiagram = generateDiagram;
window.toggleDiagramView = toggleDiagramView;
window.showExampleByCategory = showExampleByCategory;
window.showDonationQR = showDonationQR;
window.openDBInfo = openDBInfo;
window.closeDBModal = closeDBModal;
window.openConcept = openConcept;
window.renderInstallGuides = renderInstallGuides;
window.filterInstallGuides = filterInstallGuides;
window.setInstallFilter = setInstallFilter;
window.openInstallGuide = openInstallGuide;
window.selectInstallOs = selectInstallOs;
window.copyInstallCommand = copyInstallCommand;
window.closeInstallGuide = closeInstallGuide;
window.openInstallFromDBInfo = openInstallFromDBInfo;
window.closeConceptModal = closeConceptModal;
window.openSQLGuide = openSQLGuide;
window.closeSQLGuide = closeSQLGuide;
window.closeSQLGuideAndGoToPractice = closeSQLGuideAndGoToPractice;
window.renderGuideStep = renderGuideStep;
window.nextGuideStep = nextGuideStep;
window.previousGuideStep = previousGuideStep;
window.openAIHelp = openAIHelp;
window.closeAIHelp = closeAIHelp;
window.retryAIHelp = retryAIHelp;
window.copyAIResponse = copyAIResponse;