// Persistencia, inicialización y estructura de la base de datos.

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
