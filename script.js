let db;
let SQLModule = null;
let dbInitialized = false;
let chartCarreras, chartPromedios;
let queryHistory = [];
let diagramFullView = false;

// ============================================
// PERSISTENCIA LOCAL
// ============================================

const STORAGE_KEYS = {
    history: 'sql-academy-history-v1',
    preferences: 'sql-academy-preferences-v1',
    challenges: 'sql-academy-challenges-v1'
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
function getUserTables() {
    if (!db) return [];
    try {
        const result = db.exec(
            "SELECT name FROM sqlite_master WHERE type = 'table' AND name NOT LIKE 'sqlite_%' ORDER BY name"
        );
        return result.length > 0 ? result[0].values.map(row => String(row[0])) : [];
    } catch (e) {
        console.error('No se pudieron leer las tablas:', e);
        return [];
    }
}

/** Devuelve la estructura de una tabla usando PRAGMA table_info. */
function getTableColumns(tableName) {
    if (!db) return [];
    try {
        const result = db.exec(`PRAGMA table_info(${quoteIdent(tableName)})`);
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
    refreshTableSelector();
    showTablesInfo();
    loadTableEditor();
    updateCharts();
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
                html += `<div class="table-scroll">`;
                html += `<table class="info-table">`;

                html += '<thead><tr>';
                cols.forEach(col => {
                    html += `<th>${escapeHtml(col)}</th>`;
                });
                html += '</tr></thead>';

                html += '<tbody>';
                if (rows.length === 0) {
                    html += `<tr><td colspan="${cols.length}" style="text-align:center;color:#999;">Sin datos</td></tr>`;
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
                        html += `<tr><td colspan="${cols.length}" style="text-align:center;color:#999;font-style:italic;">
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
                            ? `<tr><td colspan="${colCount}" style="text-align:center;color:#999;">Sin filas</td></tr>`
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

function syncDatasetSelector() {
    const selector = document.getElementById('datasetSelector');
    if (selector) selector.value = preferences.dataset;
}

function applyPreferences() {
    const safeModeToggle = document.getElementById('safeModeToggle');
    if (safeModeToggle) safeModeToggle.checked = preferences.safeMode;
    syncDatasetSelector();

    const isDark = preferences.theme === 'dark';
    document.documentElement.dataset.theme = isDark ? 'dark' : 'light';
    const themeMeta = document.querySelector('meta[name="theme-color"]');
    if (themeMeta) themeMeta.setAttribute('content', isDark ? '#111827' : '#336791');

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
    if (dbInitialized) updateCharts();
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
        empty.textContent = 'No hay consultas aun';
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

// EXPORTAR / IMPORTAR
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

function importDatabase() {
    if (!SQLModule) {
        showMessage('warning', 'Espera a que la base de datos termine de inicializarse');
        return;
    }

    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.sqlite,.sqlite3,.db,application/x-sqlite3';
    input.style.display = 'none';
    input.addEventListener('change', () => {
        const file = input.files && input.files[0];
        input.remove();
        if (!file) return;

        const reader = new FileReader();
        reader.onload = () => {
            let imported = null;
            try {
                imported = new SQLModule.Database(new Uint8Array(reader.result));
                // Fuerza la lectura del esquema para detectar archivos que no son SQLite.
                imported.exec('SELECT name FROM sqlite_master LIMIT 1;');
                imported.run('PRAGMA foreign_keys = ON;');
                if (db) db.close();
                db = imported;
                dbInitialized = true;
                lastQueryError = null;
                aiCooldownUntil = 0;
                aiResponseCache.clear();
                refreshAll();
                schedulePersistDatabase();
                showMessage('success', 'Base de datos importada correctamente', `Archivo: ${escapeHtml(file.name)}`);
            } catch (e) {
                if (imported) {
                    try { imported.close(); } catch (closeError) { /* ignorar */ }
                }
                showMessage('error', 'No se pudo importar el archivo', `<code>${escapeHtml(e.message)}</code>`);
            }
        };
        reader.onerror = () => {
            showMessage('error', 'No se pudo leer el archivo seleccionado');
        };
        reader.readAsArrayBuffer(file);
    });
    document.body.appendChild(input);
    input.click();
}

// EDITOR DE TABLAS
function refreshTableSelector() {
    if (!db) return;
    const selector = document.getElementById('tableSelector');
    if (!selector) return;

    const previous = selector.value;
    const tables = getUserTables();

    selector.innerHTML = '';

    if (tables.length === 0) {
        const option = document.createElement('option');
        option.value = '';
        option.textContent = 'Sin tablas';
        option.disabled = true;
        option.selected = true;
        selector.appendChild(option);
        return;
    }

    tables.forEach(tableName => {
        const option = document.createElement('option');
        option.value = tableName;
        option.textContent = tableName;
        selector.appendChild(option);
    });

    selector.value = tables.includes(previous) ? previous : tables[0];
}

function loadTableEditor() {
    if (!db) return;
    const tableName = document.getElementById('tableSelector').value;
    const content = document.getElementById('tableEditorContent');

    if (!tableName) {
        content.innerHTML = '<p class="text-muted" style="text-align:center;padding:20px;"><i class="fas fa-inbox"></i> No hay tablas para editar</p>';
        return;
    }

    try {
        const columns = getTableColumns(tableName);
        const result = db.exec(`SELECT * FROM ${quoteIdent(tableName)}`);
        if (result.length === 0 || columns.length === 0) {
            content.innerHTML = '<p class="text-muted" style="text-align:center;padding:20px;"><i class="fas fa-inbox"></i> Tabla vacia</p>';
            return;
        }

        const selectColumns = result[0].columns;
        const rows = result[0].values;
        const pkColumn = columns.find(col => col.pk > 0) || null;
        const pkIndex = pkColumn ? selectColumns.indexOf(pkColumn.name) : -1;

        let html = '<table>';
        html += '<thead><tr>';
        selectColumns.forEach(col => {
            const isPk = pkColumn && col === pkColumn.name;
            html += `<th>${isPk ? '<i class="fas fa-key" title="Clave primaria"></i> ' : ''}${escapeHtml(col)}</th>`;
        });
        html += '<th>Acciones</th></tr></thead>';

        html += '<tbody>';
        if (rows.length === 0) {
            html += `<tr><td colspan="${selectColumns.length + 1}" style="text-align:center;color:#999;">
                Tabla vacía. Usa "Agregar fila" para crear un registro.
            </td></tr>`;
        } else {
            rows.forEach((row, rowIndex) => {
                const pkValue = pkIndex >= 0 ? row[pkIndex] : null;
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
                html += pkColumn
                    ? `<td><button type="button" class="delete-btn" data-pk="${escapeHtml(pkValue)}" title="Eliminar fila" aria-label="Eliminar fila"><i class="fas fa-trash"></i></button></td>`
                    : '<td><span title="La tabla no tiene clave primaria">—</span></td>';
                html += '</tr>';
            });
        }
        html += '</tbody></table>';

        content.innerHTML = html;

        content.querySelectorAll('.delete-btn').forEach(button => {
            button.addEventListener('click', () => deleteRow(tableName, button.dataset.pk));
        });
    } catch (e) {
        content.innerHTML = `<p style="color:#dc3545;"><i class="fas fa-circle-exclamation"></i> Error: ${escapeHtml(e.message)}</p>`;
    }
}

function saveTableChanges(tableName) {
    if (!db) {
        showMessage('error', 'La base de datos no está inicializada');
        return;
    }
    if (!tableName) {
        showMessage('warning', 'No hay ninguna tabla seleccionada');
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
            showMessage('info', 'No había cambios que guardar');
        } else {
            schedulePersistDatabase();
            showMessage('success', 'Cambios guardados correctamente', `${updatedCount} fila(s) actualizada(s) en ${escapeHtml(tableName)}`);
        }
    } catch (e) {
        showMessage('error', 'Error al guardar cambios', `<code>${escapeHtml(e.message)}</code>`);
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

        if (!confirm(`¿Eliminar el registro con ${pkColumn.name} = ${pkValue}?`)) return;

        const value = parseColumnValue(pkValue, pkColumn);
        db.run(`DELETE FROM ${quoteIdent(tableName)} WHERE ${quoteIdent(pkColumn.name)} = ?`, [value]);
        refreshAll();
        schedulePersistDatabase();
        showMessage('success', 'Registro eliminado correctamente');
    } catch (e) {
        showMessage('error', 'Error al eliminar', `<code>${escapeHtml(e.message)}</code>`);
    }
}

function addRow(tableName) {
    if (!db) return;
    if (!tableName) {
        showMessage('warning', 'No hay ninguna tabla seleccionada');
        return;
    }

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
        showMessage('success', `Nueva fila agregada a ${tableName}`);
    } catch (e) {
        showMessage('error', 'Error al agregar fila', `<code>${escapeHtml(e.message)}</code>`);
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

// GRAFICOS
function updateCharts() {
    if (!db) return;
    if (typeof Chart === 'undefined') {
        console.warn('Chart.js no está disponible; se omiten los gráficos.');
        return;
    }

    const isDarkTheme = document.documentElement.dataset.theme === 'dark';
    Chart.defaults.color = isDarkTheme ? '#e2e8f0' : '#2C3E50';
    Chart.defaults.borderColor = isDarkTheme ? 'rgba(148, 163, 184, 0.18)' : 'rgba(0, 0, 0, 0.1)';

    const hasStudentsTable = getUserTables().includes('estudiantes');
    if (!hasStudentsTable) {
        if (chartCarreras) { chartCarreras.destroy(); chartCarreras = null; }
        if (chartPromedios) { chartPromedios.destroy(); chartPromedios = null; }
        return;
    }

    try {
        if (chartCarreras) { chartCarreras.destroy(); chartCarreras = null; }
        const resultCarreras = db.exec(`SELECT carrera, COUNT(*) as cantidad FROM estudiantes GROUP BY carrera`);
        if (resultCarreras.length > 0 && resultCarreras[0].values.length > 0) {
            const labels = resultCarreras[0].values.map(row => row[0]);
            const data = resultCarreras[0].values.map(row => row[1]);
            const colors = ['#336791', '#764ba2', '#f093fb', '#4facfe', '#43e97b', '#fa709a', '#fee140', '#a18cd1'];

            const ctx = document.getElementById('chartCarreras').getContext('2d');
            chartCarreras = new Chart(ctx, {
                type: 'bar',
                data: {
                    labels: labels,
                    datasets: [{
                        label: 'Estudiantes por carrera',
                        data: data,
                        backgroundColor: colors.slice(0, data.length),
                        borderColor: colors.slice(0, data.length).map(c => c + 'cc'),
                        borderWidth: 2
                    }]
                },
                options: {
                    responsive: true,
                    plugins: {
                        legend: { display: false },
                        title: {
                            display: true,
                            text: 'Estudiantes por Carrera'
                        }
                    },
                    scales: {
                        y: {
                            beginAtZero: true,
                            stepSize: 1
                        }
                    }
                }
            });
        }
    } catch(e) {
        if (chartCarreras) { chartCarreras.destroy(); chartCarreras = null; }
        console.log('Error en grafico de carreras:', e);
    }
    
    try {
        if (chartPromedios) { chartPromedios.destroy(); chartPromedios = null; }
        const resultPromedios = db.exec(`SELECT carrera, ROUND(AVG(promedio), 2) as promedio FROM estudiantes GROUP BY carrera`);
        if (resultPromedios.length > 0 && resultPromedios[0].values.length > 0) {
            const labels = resultPromedios[0].values.map(row => row[0]);
            const data = resultPromedios[0].values.map(row => row[1]);
            
            const ctx = document.getElementById('chartPromedios').getContext('2d');
            chartPromedios = new Chart(ctx, {
                type: 'line',
                data: {
                    labels: labels,
                    datasets: [{
                        label: 'Promedio por carrera',
                        data: data,
                        borderColor: '#336791',
                        backgroundColor: 'rgba(51, 103, 145, 0.1)',
                        tension: 0.4,
                        fill: true,
                        pointBackgroundColor: '#336791',
                        pointBorderColor: '#336791',
                        pointRadius: 6,
                        pointHoverRadius: 8
                    }]
                },
                options: {
                    responsive: true,
                    plugins: {
                        legend: { display: false },
                        title: {
                            display: true,
                            text: 'Promedio por Carrera'
                        }
                    },
                    scales: {
                        y: {
                            min: 0,
                            max: 20,
                            title: {
                                display: true,
                                text: 'Promedio (0-20)'
                            }
                        }
                    }
                }
            });
        }
    } catch(e) {
        if (chartPromedios) { chartPromedios.destroy(); chartPromedios = null; }
        console.log('Error en grafico de promedios:', e);
    }
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
            `${escapeHtml(dataset.description)} Los retos y los ejemplos guiados siguen usando el dataset Escuela.`
        );
        showToast('success', `Dataset ${dataset.name} listo.`);
    } catch (error) {
        console.error('No se pudo cargar el dataset:', error);
        preferences.dataset = 'escuela';
        savePreferences();
        syncDatasetSelector();
        showMessage('error', 'No se pudo cargar el dataset', `<code>${escapeHtml(error.message)}</code>`);
        showToast('error', 'Se restauró el dataset Escuela.');
        initDatabase({ restore: false });
    }
}

// REINICIAR BASE DE DATOS
async function resetDatabase() {
    if (confirm('¿Seguro que quieres reiniciar la base de datos a su estado original? Se borrará la copia guardada en este navegador.')) {
        dbInitialized = false;
        lastQueryError = null;
        aiCooldownUntil = 0;
        preferences.dataset = 'escuela';
        savePreferences();
        syncDatasetSelector();
        showMessage('warning', 'Reiniciando base de datos...');
        await clearSavedDatabase();
        initDatabase({ restore: false });
    }
}

// EJEMPLOS POR CATEGORIAS
function getExamplesByCategory() {
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

// MOSTRAR EJEMPLO POR CATEGORIA
function showExampleByCategory() {
    const selector = document.getElementById('categorySelector');
    if (!selector) {
        console.error('No se encontro el selector de categorias');
        return;
    }

    if (!getUserTables().includes('estudiantes')) {
        showMessage(
            'warning',
            'Los ejemplos guiados usan el dataset Escuela',
            'Cambia el dataset a “Escuela” para usar estos ejemplos, o escribe tus propias consultas sobre las tablas actuales.'
        );
        return;
    }
    
    const category = selector.value;
    const categories = getExamplesByCategory();
    
    let selectedCategory = category;
    if (category === 'aleatorio') {
        const keys = Object.keys(categories);
        selectedCategory = keys[Math.floor(Math.random() * keys.length)];
    }
    
    const categoryData = categories[selectedCategory];
    if (!categoryData) return;
    
    const ejemplos = categoryData.ejemplos;
    const ejemplo = ejemplos[Math.floor(Math.random() * ejemplos.length)];
    
    const editor = document.getElementById('sqlEditor');
    if (editor) {
        editor.value = ejemplo.sql;
        editor.focus();
    }
    
    document.getElementById('resultOutput').classList.remove('result-placeholder');
    document.getElementById('resultOutput').innerHTML = `
        <div style="padding: 15px; background: #f0f4ff; border-radius: 8px; border-left: 4px solid #336791;">
            <div style="color: #336791; font-weight: 700; font-size: 16px; margin-bottom: 5px;">
                <i class="fas fa-book"></i> ${escapeHtml(categoryData.titulo)}
            </div>
            <div style="color: #555; font-size: 14px; margin-bottom: 8px;">
                <i class="fas fa-lightbulb"></i> ${escapeHtml(ejemplo.titulo)}
            </div>
            <div style="background: #f8f9fa; padding: 10px; border-radius: 5px; font-family: 'Courier New', monospace; font-size: 13px; overflow-x: auto; white-space: pre-wrap; word-break: break-all;">
                ${escapeHtml(ejemplo.sql)}
            </div>
            <div style="margin-top: 8px; font-size: 12px; color: #999;">
                <i class="fas fa-clock"></i> Presiona <strong>"Ejecutar"</strong> o <strong>Ctrl+Enter</strong> para ver el resultado
            </div>
        </div>
    `;
}

function showExamples() {
    showExampleByCategory();
}

// DONACIONES 
function showDonationQR(type) {
    const modal = document.getElementById('donationModal');
    const body = document.getElementById('donationModalBody');
    
    if (!modal || !body) {
        console.error('No se encontró el modal de donaciones');
        return;
    }
    
    const qrData = {
        'yape': {
            title: 'Yape',
            image: 'images/qr-yape.png'
        }
    };
    
    const data = qrData[type];
    if (!data) return;
    
    const funnyMessages = [
        'Este código no se va a escribir solo... bueno, a veces sí, pero con café es más rápido ☕',
        'Tu donación es como un buen índice: hace que todo sea más rápido 🚀',
        'Con esto compro café para seguir soñando con código limpio 🧠',
        'Apoya a un programador, evita que tenga que usar Excel 🐛',
        'El servidor también tiene sentimientos (y necesita café) ❤️',
        'Las donaciones son como las transacciones ACID: confiables y necesarias 🔑',
        'Gracias a ti, este proyecto no muere en el olvido 🤖',
        'Tu aporte es más rápido que un SELECT sin WHERE 😎',
        'Así como las bases de datos necesitan índices, yo necesito café 📊',
        'Cada café es un commit más en mi vida ☕💻',
        'Las donaciones son el motor que mueve este proyecto 🚀',
        'Programar sin café es como SQL sin JOIN: incompleto 😅',
        'Tu donación me da energía para seguir debugueando 🔍',
        'Café + código = felicidad (y bases de datos funcionales) ☕💻',
        'No es una donación, es una inversión en código de calidad 📈'
    ];
    
    const randomMessage = funnyMessages[Math.floor(Math.random() * funnyMessages.length)];
    
    body.innerHTML = `
        <div style="text-align:center; padding:10px 0;">
            <div style="font-size:0.8em; color:#999; margin-bottom:12px;">
                <i class="fas fa-qrcode"></i> QR para transferencia
            </div>
            <img src="${data.image}" alt="QR para ${data.title}" style="max-width:200px; border-radius:8px; border:2px solid #e9ecef; background:white; padding:8px;">
            <div style="margin-top:14px; background:#f8f9fa; padding:10px 15px; border-radius:8px; border-left:3px solid #f39c12;">
                <p style="color:#555; font-size:0.9em; margin:0; font-style:italic;">
                    "${randomMessage}"
                </p>
            </div>
            <div style="margin-top:10px; font-size:0.7em; color:#999;">
                <i class="fas fa-code-branch" style="color:#dc3545;"></i> Totalmente voluntario · Sin presión
            </div>
        </div>
    `;
    
    openModal(modal);
}

function closeDonationModal() {
    closeModal(document.getElementById('donationModal'));
}

// GESTORES DE BD - INFORMACION
const dbInfo = {
    'postgresql': {
        title: 'PostgreSQL',
        logo: 'logos/postgresql.png',
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
        logo: 'logos/mysql.png',
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
        logo: 'logos/sqlserver.png',
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
        logo: 'logos/oracle.png',
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
        logo: 'logos/mariadb.png',
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
        logo: 'logos/sqlite.png',
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
    logo: 'logos/mongodb.png',
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
    logo: 'logos/firebase.png',
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
    logo: 'logos/redis.png',
    description: 'Redis es la base de datos clave-valor más rápida del mundo. Es ampliamente utilizada como caché, para sesiones de usuario y para aplicaciones que requieren baja latencia.',
    type: 'NoSQL (Clave-Valor)',
    licencia: 'Open Source (BSD)',
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
    logo: 'logos/cassandra.png',
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
    logo: 'logos/neo4j.png',
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
    logo: 'logos/elasticsearch.png',
    description: 'Elasticsearch es el motor de búsqueda y análisis de datos más popular. Está basado en Lucene y permite consultas full-text en tiempo real.',
    type: 'NoSQL (Busqueda)',
    licencia: 'Open Source (Apache 2.0)',
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
        <div class="db-logo-large">
            <img src="${info.logo}" alt="${info.title}">
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
    `;
    
    body.innerHTML = html;
    openModal(modal);
}

function closeDBModal() {
    closeModal(document.getElementById('dbModal'));
}

// CONCEPTOS CLAVE
const conceptInfo = {
    'mer': {
        title: 'Modelo Entidad-Relacion (MER)',
        icon: 'sitemap',
        description: 'El Modelo Entidad-Relacion es un modelo conceptual para disenar bases de datos. Representa las entidades (tablas) y sus relaciones.',
        conceptos: [
            'Entidad: Objeto del mundo real (ej: Estudiante, Curso)',
            'Atributo: Caracteristica de una entidad (ej: nombre, edad)',
            'Relacion: Asociacion entre entidades (ej: un estudiante se inscribe en un curso)',
            'Cardinalidad: Numero de elementos que participan (1:1, 1:N, N:M)'
        ],
        ejemplo: 'Un Estudiante se inscribe en varios Cursos. Un Curso tiene muchos Estudiantes. (Relacion N:M)'
    },
    'normalizacion': {
        title: 'Normalizacion de Bases de Datos',
        icon: 'layer-group',
        description: 'La normalizacion es el proceso de organizar los datos en una base de datos para reducir la redundancia y mejorar la integridad.',
        conceptos: [
            '1FN (Primera Forma Normal): Eliminar grupos repetidos, crear tabla separada',
            '2FN (Segunda Forma Normal): Dependencia funcional completa de la clave primaria',
            '3FN (Tercera Forma Normal): Eliminar dependencias transitivas',
            'BCNF (Forma Normal de Boyce-Codd): Version mas estricta de 3FN'
        ],
        ejemplo: 'Dividir una tabla de estudiantes que tambien contiene cursos en dos tablas: Estudiantes y Cursos'
    },
    'llaves': {
        title: 'Tipos de Llaves en Bases de Datos',
        icon: 'key',
        description: 'Las llaves son atributos que identifican de manera unica los registros en una tabla.',
        conceptos: [
            'Primary Key (PK): Identificador unico de cada registro',
            'Foreign Key (FK): Llave que referencia la PK de otra tabla',
            'Unique Key: Garantiza valores unicos en una columna',
            'Composite Key: Llave compuesta por multiples columnas'
        ],
        ejemplo: 'En una tabla de Inscripciones, la combinacion (estudiante_id, curso_id) es una llave compuesta'
    },
    'sql': {
        title: 'Comandos SQL (DDL, DML, DCL, TCL)',
        icon: 'code',
        description: 'SQL se divide en varios tipos de comandos segun su funcion en la base de datos.',
        conceptos: [
            'DDL (Data Definition Language): CREATE, ALTER, DROP (definir estructura)',
            'DML (Data Manipulation Language): SELECT, INSERT, UPDATE, DELETE (manipular datos)',
            'DCL (Data Control Language): GRANT, REVOKE (control de permisos)',
            'TCL (Transaction Control Language): COMMIT, ROLLBACK, SAVEPOINT (gestionar transacciones)'
        ],
        ejemplo: 'CREATE TABLE estudiantes (id INT PRIMARY KEY, nombre VARCHAR(100));'
    },
    'acid': {
        title: 'Propiedades ACID',
        icon: 'shield-halved',
        description: 'ACID son las propiedades que garantizan la integridad de las transacciones en una base de datos.',
        conceptos: [
            'Atomicidad: La transaccion se completa completamente o no se realiza',
            'Consistencia: La transaccion mantiene las reglas de la base de datos',
            'Aislamiento: Las transacciones concurrentes no interfieren entre si',
            'Durabilidad: Los cambios persisten incluso despues de fallos'
        ],
        ejemplo: 'Una transferencia bancaria: Si falla, no se debe perder dinero (Atomicidad)'
    },
    'indices': {
        title: 'Indices en Bases de Datos',
        icon: 'list',
        description: 'Los indices mejoran la velocidad de las consultas al permitir busquedas mas rapidas.',
        conceptos: [
            'Indice B-Tree: El mas comun, organiza datos en arbol balanceado',
            'Indice Hash: Busquedas exactas muy rapidas',
            'Indice Full-Text: Busqueda de texto completo',
            'Trade-off: Mejora lecturas pero ralentiza escrituras'
        ],
        ejemplo: 'CREATE INDEX idx_nombre ON estudiantes(nombre);'
    },

// CONCEPTOS NoSQL
'nosql': {
    title: 'Bases de Datos NoSQL',
    icon: 'database',
    description: 'Las bases de datos NoSQL (Not Only SQL) son sistemas de gestion de bases de datos que no utilizan el modelo relacional tradicional. Estan diseñadas para manejar grandes volumenes de datos no estructurados o semiestructurados.',
    conceptos: [
        'NoSQL significa "Not Only SQL" (No solo SQL)',
        'No requieren un esquema fijo (schema-less)',
        'Escalabilidad horizontal (distribucion en multiples servidores)',
        'Mayor flexibilidad para datos no estructurados',
        'Ideal para Big Data y aplicaciones en tiempo real',
        'Tipos: Documentos, Clave-Valor, Columnas, Grafos'
    ],
    ejemplo: 'MongoDB es la base de datos NoSQL mas popular. Almacena datos en documentos JSON flexibles.'
},
'documentales': {
    title: 'Bases de Datos Documentales',
    icon: 'file-lines',
    description: 'Las bases de datos documentales almacenan datos en documentos (generalmente JSON o XML). Cada documento puede tener una estructura diferente, lo que permite gran flexibilidad.',
    conceptos: [
        'Almacenan datos en documentos (JSON, BSON, XML)',
        'Estructura flexible: cada documento puede tener campos diferentes',
        'Ideal para datos semiestructurados',
        'Consultas por contenido del documento',
        'Indexacion de campos para busquedas rapidas',
        'Ejemplos: MongoDB, Firestore, CouchDB'
    ],
    ejemplo: 'En MongoDB, un documento de usuario puede tener campos como nombre, email, direccion, y cada usuario puede tener campos diferentes.'
},
'clave-valor': {
    title: 'Bases de Datos Clave-Valor',
    icon: 'key',
    description: 'Las bases de datos clave-valor son las mas simples. Almacenan datos como pares de clave y valor, donde la clave es unica y el valor puede ser cualquier tipo de dato.',
    conceptos: [
        'Estructura simple: clave unica → valor',
        'Altisimo rendimiento en lecturas/escrituras',
        'Ideal para cache y sesiones de usuario',
        'Escalabilidad horizontal nativa',
        'Sin esquema fijo',
        'Ejemplos: Redis, DynamoDB, Riak'
    ],
    ejemplo: 'En Redis, puedes almacenar la sesion de un usuario con clave "user:123" y valor "{nombre: Juan, rol: admin}"'
},
'columnas': {
    title: 'Bases de Datos por Columnas',
    icon: 'table-cells',
    description: 'Las bases de datos columnares almacenan datos por columnas en lugar de filas. Esto las hace muy eficientes para consultas analiticas que solo necesitan algunas columnas.',
    conceptos: [
        'Almacenamiento orientado a columnas (no a filas)',
        'Excelente para consultas analiticas (OLAP)',
        'Compresion de datos muy eficiente',
        'Ideal para Big Data y data warehouses',
        'Escalabilidad horizontal',
        'Ejemplos: Cassandra, HBase, Bigtable'
    ],
    ejemplo: 'En Cassandra, los datos se organizan en column families (familias de columnas) para consultas rapidas.'
},
'grafos': {
    title: 'Bases de Datos de Grafos',
    icon: 'share-nodes',
    description: 'Las bases de datos de grafos estan diseñadas para representar y consultar relaciones complejas entre datos. Son ideales para redes sociales, recomendaciones y sistemas de conexiones.',
    conceptos: [
        'Representan datos como nodos, aristas y propiedades',
        'Excelentes para relaciones complejas y conexiones',
        'Consultas eficientes en profundidad (amigos de amigos)',
        'Ideal para redes sociales, fraudes, recomendaciones',
        'Escalables para grandes volumenes de relaciones',
        'Ejemplos: Neo4j, Amazon Neptune, ArangoDB'
    ],
    ejemplo: 'En Neo4j, puedes consultar la red de amigos de un usuario con una consulta como: MATCH (user:Person)-[:FRIENDS]->(friends) RETURN friends'
},
'tiempo-real': {
    title: 'Bases de Datos en Tiempo Real',
    icon: 'bolt',
    description: 'Las bases de datos en tiempo real estan diseñadas para aplicaciones que requieren actualizaciones instantaneas y sincronizacion en milisegundos.',
    conceptos: [
        'Sincronizacion en tiempo real (sub-milisegundo)',
        'Actualizaciones instantaneas para todos los clientes',
        'Ideal para aplicaciones colaborativas y juegos',
        'Escalabilidad horizontal para millones de usuarios',
        'Soporte para eventos y streams de datos',
        'Ejemplos: Firebase Realtime Database, RethinkDB, Supabase'
    ],
    ejemplo: 'Firebase Realtime Database permite que multiples usuarios vean cambios en tiempo real, como en una aplicacion de chat o colaboracion.'
}
};

// ABRIR MODAL DE CONCEPTOS
function openConcept(conceptKey) {
    const info = conceptInfo[conceptKey];
    if (!info) return;
    
    const modal = document.getElementById('conceptModal');
    const title = document.getElementById('conceptModalTitle');
    const body = document.getElementById('conceptModalBody');
    
    title.innerHTML = `<i class="fas fa-${info.icon}"></i> ${info.title}`;
    
    let html = `
        <p style="font-size:1.05em; color:#444; line-height:1.7;">${info.description}</p>
        
        <h3><i class="fas fa-list"></i> Conceptos Clave</h3>
        <ul>
            ${info.conceptos.map(c => `<li>${c}</li>`).join('')}
        </ul>
        
        <h3><i class="fas fa-lightbulb"></i> Ejemplo Practico</h3>
        <div style="background: #f8f9fa; padding: 15px; border-radius: 8px; border-left: 4px solid #336791; color: #555;">
            ${info.ejemplo}
        </div>
        
        <div style="margin-top: 15px; padding: 12px; background: #e9ecef; border-radius: 8px; font-size:0.85em; color:#666;">
            <i class="fas fa-info-circle" style="color: #336791;"></i>
            Este concepto forma parte de los fundamentos que te ayudarán a elegir y diseñar el modelo de datos adecuado.
        </div>
    `;
    
    body.innerHTML = html;
    openModal(modal);
}

function closeConceptModal() {
    closeModal(document.getElementById('conceptModal'));
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

let currentChallengeId = null;
let challengeAttempts = 0;
let challengeProgress = {};

function loadChallengeProgress() {
    const stored = readStoredJSON(STORAGE_KEYS.challenges, {});
    challengeProgress = stored && typeof stored === 'object' && !Array.isArray(stored) ? stored : {};
}

function saveChallengeProgress() {
    writeStoredJSON(STORAGE_KEYS.challenges, challengeProgress);
}

function getChallengeById(id) {
    return challengeCatalog.find(challenge => challenge.id === id) || null;
}

function getCompletedChallengeCount() {
    return challengeCatalog.filter(challenge => challengeProgress[challenge.id]?.completed).length;
}

function renderChallengeProgress() {
    const completed = getCompletedChallengeCount();
    const total = challengeCatalog.length;
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

    list.innerHTML = challengeCatalog.map(challenge => {
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

function initChallenges() {
    loadChallengeProgress();
    renderChallengeList();
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

    if (!getUserTables().includes('estudiantes')) {
        setChallengeResult(
            'warning',
            '<strong><i class="fas fa-triangle-exclamation"></i> Dataset incompatible</strong>Los retos están diseñados para el dataset Escuela. Cambia el dataset desde la sección Practicar para resolverlos.'
        );
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
        setChallengeResult('error', `
            <strong><i class="fas fa-circle-exclamation"></i> Error en la consulta</strong>
            <code>${escapeHtml(error.message || String(error))}</code>
        `);
    }
}

function nextChallenge() {
    const currentIndex = challengeCatalog.findIndex(challenge => challenge.id === currentChallengeId);
    const next = challengeCatalog[currentIndex + 1];
    if (next) {
        openChallenge(next.id);
    } else {
        showToast('success', '¡Has llegado al final de los retos!');
    }
}

function resetChallengeProgress() {
    if (!confirm('¿Reiniciar el progreso de todos los retos?')) return;
    challengeProgress = {};
    removeStoredItem(STORAGE_KEYS.challenges);
    renderChallengeList();
    if (currentChallengeId) {
        openChallenge(currentChallengeId);
    }
    showToast('info', 'Progreso de retos reiniciado.');
}

// NAVEGACIÓN ENTRE SECCIONES
document.addEventListener('DOMContentLoaded', function() {
    // Navegación por pestañas del navbar
    document.querySelectorAll('.nav-btn').forEach(btn => {
        if (btn.classList.contains('active')) {
            btn.setAttribute('aria-current', 'page');
        }

        btn.addEventListener('click', function() {
            // Remover active de todos los botones
            document.querySelectorAll('.nav-btn').forEach(b => {
                b.classList.remove('active');
                b.removeAttribute('aria-current');
            });
            this.classList.add('active');
            this.setAttribute('aria-current', 'page');
            
            // Ocultar todas las secciones
            document.querySelectorAll('.section').forEach(s => s.classList.remove('active'));
            
            // Mostrar la sección correspondiente
            const sectionId = 'section-' + this.dataset.section;
            const targetSection = document.getElementById(sectionId);
            if (targetSection) {
                targetSection.classList.add('active');
            }
        });
    });
    
    // Preferencias e historial guardados en el navegador.
    loadPreferences();
    applyPreferences();
    loadHistoryFromStorage();
    updateHistoryDisplay();
    initChallenges();

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
                <div style="font-size:0.8em; color:#999;">Paso ${index + 1} de ${totalSteps}</div>
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
            <span style="color:#999; font-size:0.85em; display:flex; align-items:center;">
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
window.runQuery = runQuery;
window.resetDatabase = resetDatabase;
window.loadDataset = loadDataset;
window.showExamples = showExamples;
window.clearHistory = clearHistory;
window.loadHistoryQuery = loadHistoryQuery;
window.exportDatabase = exportDatabase;
window.importDatabase = importDatabase;
window.loadTableEditor = loadTableEditor;
window.deleteRow = deleteRow;
window.addRow = addRow;
window.updateCharts = updateCharts;
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
window.saveTableChanges = saveTableChanges;
window.generateDiagram = generateDiagram;
window.toggleDiagramView = toggleDiagramView;
window.showExampleByCategory = showExampleByCategory;
window.showDonationQR = showDonationQR;
window.openDBInfo = openDBInfo;
window.closeDBModal = closeDBModal;
window.openConcept = openConcept;
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