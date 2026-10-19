let db;
let dbInitialized = false;
let chartCarreras, chartPromedios;
let history = [];
let diagramFullView = false;

// LIMPIAR EDITOR
function clearEditor() {
    const editor = document.getElementById('sqlEditor');
    if (editor.value.trim() !== '') {
        editor.value = '';
        editor.focus();
        document.getElementById('resultOutput').innerHTML = `
            <div style="padding:20px;text-align:center;color:#f59e0b;background:#fffbeb;border-radius:8px;">
                <i class="fas fa-eraser"></i> Editor limpiado
            </div>
        `;
    }
}

// INICIALIZAR BASE DE DATOS
function initDatabase() {
    initSqlJs({
        locateFile: file => `https://sql.js.org/dist/${file}`
    }).then(SQL => {
        db = new SQL.Database();
        
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
                año INTEGER,
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
        showTablesInfo();
        loadTableEditor();
        updateCharts();
        generateDiagram();
        
        document.getElementById('resultOutput').innerHTML = `
            <div style="padding:20px;text-align:center;color:#28a745;background:#f0fff4;border-radius:8px;">
                <i class="fas fa-check-circle"></i> Base de datos lista. Escribe una consulta SQL.
            </div>
        `;
    }).catch(error => {
        document.getElementById('resultOutput').innerHTML = `
            <div style="padding:15px;background:#fff5f5;border-radius:8px;border-left:4px solid #dc3545;">
                <div style="color:#dc3545;font-weight:600;"><i class="fas fa-circle-exclamation"></i> Error al cargar SQL.js</div>
                <code style="display:block;padding:10px;background:white;border-radius:6px;font-size:13px;margin-top:5px;">${error.message}</code>
            </div>
        `;
    });
}

// MOSTRAR INFO DE TABLAS
function showTablesInfo() {
    if (!db) return;
    try {
        const tables = ['estudiantes', 'cursos', 'inscripciones'];
        let html = '';
        
        tables.forEach(tableName => {
            const result = db.exec(`SELECT * FROM ${tableName} LIMIT 5`);
            if (result.length > 0) {
                const cols = result[0].columns;
                const rows = result[0].values;
                
                const countResult = db.exec(`SELECT COUNT(*) as total FROM ${tableName}`);
                const totalRows = countResult.length > 0 ? countResult[0].values[0][0] : 0;
                
                html += `<div class="table-card">`;
                html += `<div class="table-title"><i class="fas fa-table"></i> ${tableName} <span class="badge-count">${totalRows} registros</span></div>`;
                html += `<div class="table-scroll">`;
                html += `<table class="info-table">`;
                
                html += '<thead><tr>';
                cols.forEach(col => {
                    html += `<th>${col}</th>`;
                });
                html += '</tr></thead>';
                
                html += '<tbody>';
                if (rows.length === 0) {
                    html += `<tr><td colspan="${cols.length}" style="text-align:center;color:#999;">Sin datos</td></tr>`;
                } else {
                    rows.forEach(row => {
                        html += '<tr>';
                        row.forEach(val => {
                            const displayVal = val !== null ? String(val) : 'NULL';
                            const truncated = displayVal.length > 20 ? displayVal.substring(0, 20) + '...' : displayVal;
                            html += `<td title="${displayVal}">${truncated}</td>`;
                        });
                        html += '</tr>';
                    });
                    if (totalRows > 5) {
                        html += `<tr><td colspan="${cols.length}" style="text-align:center;color:#999;font-style:italic;">
                            ... y ${totalRows - 5} registros mas
                        </td></tr>`;
                    }
                }
                
                html += '</tbody></table>';
                html += '</div></div>';
            }
        });
        
        document.getElementById('tableInfo').innerHTML = html || '<p class="text-muted">No hay tablas disponibles</p>';
    } catch(e) {
        document.getElementById('tableInfo').innerHTML = `<p style="color:#dc3545;"><i class="fas fa-circle-exclamation"></i> Error: ${e.message}</p>`;
    }
}

// MOSTRAR RESULTADOS
function displayResults(result) {
    if (!result || result.length === 0) {
        document.getElementById('resultOutput').innerHTML = `
            <div style="padding:20px;text-align:center;color:#28a745;background:#f0fff4;border-radius:8px;">
                <i class="fas fa-check-circle"></i> Consulta ejecutada correctamente
            </div>
        `;
        return;
    }
    
    const rowCount = result[0].values.length;
    const colCount = result[0].columns.length;
    
    let html = `
        <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:10px; margin-bottom:12px; padding:8px 12px; background:white; border-radius:8px; border:1px solid #e9ecef;">
            <span style="font-weight:600; color:#333;">
                <i class="fas fa-list"></i> ${rowCount} ${rowCount === 1 ? 'fila' : 'filas'} encontradas | ${colCount} columnas
            </span>
            <span style="font-size:12px; color:#999;">
                <i class="fas fa-arrows-left-right"></i> <strong>Desliza</strong> horizontal y verticalmente
            </span>
        </div>
        <div class="result-container">
            <table>
                <thead>
                    <tr>
                        ${result[0].columns.map(col => `<th>${col}</th>`).join('')}
                    </tr>
                </thead>
                <tbody>
                    ${result[0].values.map(row => `
                        <tr>
                            ${row.map(value => {
                                const displayValue = value !== null && value !== undefined ? String(value) : 'NULL';
                                const truncated = displayValue.length > 50 ? displayValue.substring(0, 50) + '...' : displayValue;
                                return `<td title="${displayValue.replace(/"/g, '&quot;')}">${truncated}</td>`;
                            }).join('')}
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        </div>
        <div style="margin-top:8px; font-size:11px; color:#999; text-align:center; display:flex; justify-content:center; gap:20px; flex-wrap:wrap;">
            <span><i class="fas fa-arrow-left"></i><i class="fas fa-arrow-right"></i> Scroll horizontal</span>
            <span><i class="fas fa-arrow-up"></i><i class="fas fa-arrow-down"></i> Scroll vertical</span>
        </div>
    `;
    
    document.getElementById('resultOutput').innerHTML = html;
}

// EJECUTAR CONSULTA
function runQuery() {
    if (!dbInitialized) {
        document.getElementById('resultOutput').innerHTML = `
            <div style="padding:20px;text-align:center;color:#999;background:#f8f9fa;border-radius:8px;">
                <i class="fas fa-spinner fa-spin"></i> Esperando que la base de datos se inicialice...
            </div>
        `;
        return;
    }
    
    const editor = document.getElementById('sqlEditor');
    const query = editor.value.trim();
    
    if (!query) {
        document.getElementById('resultOutput').innerHTML = `
            <div style="padding:20px;text-align:center;color:#f59e0b;background:#fffbeb;border-radius:8px;">
                <i class="fas fa-exclamation-triangle"></i> Por favor, escribe una consulta SQL
            </div>
        `;
        return;
    }
    
    addToHistory(query);
    
    try {
        const result = db.exec(query);
        
        if (result.length === 0) {
            document.getElementById('resultOutput').innerHTML = `
                <div style="padding:20px;text-align:center;color:#28a745;background:#f0fff4;border-radius:8px;">
                    <i class="fas fa-check-circle"></i> Consulta ejecutada correctamente
                </div>
            `;
            showTablesInfo();
            loadTableEditor();
            updateCharts();
            generateDiagram();
            return;
        }
        
        displayResults(result);
        showTablesInfo();
        loadTableEditor();
        updateCharts();
        generateDiagram();
        
    } catch(error) {
        document.getElementById('resultOutput').innerHTML = `
            <div style="padding:15px;background:#fff5f5;border-radius:8px;border-left:4px solid #dc3545;">
                <div style="color:#dc3545;font-weight:600;margin-bottom:5px;"><i class="fas fa-circle-exclamation"></i> Error en la consulta</div>
                <code style="display:block;padding:10px;background:white;border-radius:6px;font-size:13px;color:#333;margin-top:5px;overflow:auto;white-space:pre-wrap;word-break:break-all;">
                    ${error.message}
                </code>
            </div>
        `;
    }
}

// HISTORIAL
function addToHistory(query) {
    if (!query || query.trim() === '') return;
    if (history.includes(query)) return;
    history.unshift(query);
    if (history.length > 20) history.pop();
    updateHistoryDisplay();
}

function updateHistoryDisplay() {
    const list = document.getElementById('historyList');
    if (history.length === 0) {
        list.innerHTML = '<li class="empty-history" style="color:#999;border-left-color:#999;">No hay consultas aun</li>';
        return;
    }
    list.innerHTML = history.map(query => {
        const truncated = query.length > 60 ? query.substring(0, 60) + '...' : query;
        return `<li onclick="loadHistoryQuery('${query.replace(/'/g, "\\'").replace(/"/g, '&quot;')}')" title="${query.replace(/"/g, '&quot;')}">${truncated}</li>`;
    }).join('');
}

function loadHistoryQuery(query) {
    const editor = document.getElementById('sqlEditor');
    editor.value = query;
    editor.focus();
}

function clearHistory() {
    if (confirm('¿Limpiar todo el historial?')) {
        history = [];
        updateHistoryDisplay();
        document.getElementById('resultOutput').innerHTML = `
            <div style="padding:20px;text-align:center;color:#999;background:#f8f9fa;border-radius:8px;">
                <i class="fas fa-trash"></i> Historial limpiado
            </div>
        `;
    }
}

// EXPORTAR / IMPORTAR
function exportDatabase() {
    if (!db) return;
    const data = db.export();
    const blob = new Blob([data], {type: 'application/x-sqlite3'});
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `database_${new Date().toISOString().slice(0,10)}.sqlite`;
    a.click();
    URL.revokeObjectURL(url);
}

// EDITOR DE TABLAS
function loadTableEditor() {
    if (!db) return;
    const tableName = document.getElementById('tableSelector').value;
    const content = document.getElementById('tableEditorContent');
    
    try {
        const result = db.exec(`SELECT * FROM ${tableName}`);
        if (result.length === 0) {
            content.innerHTML = '<p class="text-muted" style="text-align:center;padding:20px;"><i class="fas fa-inbox"></i> Tabla vacia</p>';
            return;
        }
        
        let html = '<table>';
        html += '<thead><tr>';
        result[0].columns.forEach(col => {
            html += `<th>${col}</th>`;
        });
        html += '<th>Acciones</th></tr></thead>';
        
        html += '<tbody>';
        result[0].values.forEach((row, idx) => {
            html += `<tr>`;
            row.forEach((value, colIdx) => {
                const displayValue = value !== null && value !== undefined ? value : '';
                html += `<td><input type="text" value="${displayValue}" data-row="${idx}" data-col="${colIdx}" class="cell-input" /></td>`;
            });
            html += `<td><button onclick="deleteRow('${tableName}', ${row[0]})" class="delete-btn"><i class="fas fa-trash"></i></button></td>`;
            html += '</tr>';
        });
        html += '</tbody></table>';
        content.innerHTML = html;
    } catch(e) {
        content.innerHTML = `<p style="color:#dc3545;"><i class="fas fa-circle-exclamation"></i> Error: ${e.message}</p>`;
    }
}

function saveTableChanges(tableName) {
    if (!db) return;
    
    try {
        const inputs = document.querySelectorAll('#tableEditorContent .cell-input');
        
        const tableInfo = db.exec(`PRAGMA table_info(${tableName})`);
        if (tableInfo.length === 0) {
            document.getElementById('resultOutput').innerHTML = `
                <div style="padding:15px;background:#fff5f5;border-radius:8px;border-left:4px solid #dc3545;">
                    <div style="color:#dc3545;font-weight:600;"><i class="fas fa-circle-exclamation"></i> Error: No se pudo obtener la estructura de la tabla</div>
                </div>
            `;
            return;
        }
        
        const columns = tableInfo[0].values.map(v => v[1]);
        
        const rowData = {};
        inputs.forEach(input => {
            const row = parseInt(input.dataset.row);
            const col = parseInt(input.dataset.col);
            const value = input.value;
            
            if (!rowData[row]) rowData[row] = {};
            rowData[row][col] = value;
        });
        
        let updatedCount = 0;
        for (const rowIndex in rowData) {
            const data = rowData[rowIndex];
            const id = data[0];
            
            const setClauses = [];
            
            for (let colIndex = 1; colIndex < columns.length; colIndex++) {
                const colName = columns[colIndex];
                const value = data[colIndex];
                
                const isNumber = !isNaN(value) && value !== '' && value !== null && value !== undefined;
                const isNull = value === '' || value === null || value === undefined || value === 'NULL';
                
                if (isNull) {
                    setClauses.push(`${colName} = NULL`);
                } else if (isNumber) {
                    setClauses.push(`${colName} = ${value}`);
                } else {
                    setClauses.push(`${colName} = '${String(value).replace(/'/g, "''")}'`);
                }
            }
            
            if (setClauses.length > 0) {
                const sql = `UPDATE ${tableName} SET ${setClauses.join(', ')} WHERE id = ${id}`;
                db.run(sql);
                updatedCount++;
            }
        }
        
        loadTableEditor();
        showTablesInfo();
        updateCharts();
        generateDiagram();
        
        document.getElementById('resultOutput').innerHTML = `
            <div style="padding:15px;background:#f0fff4;border-radius:8px;border-left:4px solid #28a745;">
                <div style="color:#28a745;font-weight:600;"><i class="fas fa-check-circle"></i> Cambios guardados correctamente</div>
                <div style="color:#666;font-size:13px;margin-top:5px;">${updatedCount} fila(s) actualizada(s) en ${tableName}</div>
            </div>
        `;
        
    } catch(e) {
        document.getElementById('resultOutput').innerHTML = `
            <div style="padding:15px;background:#fff5f5;border-radius:8px;border-left:4px solid #dc3545;">
                <div style="color:#dc3545;font-weight:600;"><i class="fas fa-circle-exclamation"></i> Error al guardar cambios</div>
                <code style="display:block;padding:10px;background:white;border-radius:6px;font-size:13px;margin-top:5px;">${e.message}</code>
            </div>
        `;
        console.error(e);
    }
}

function deleteRow(tableName, id) {
    if (!confirm(`¿Eliminar registro con ID ${id}?`)) return;
    try {
        db.run(`DELETE FROM ${tableName} WHERE id = ${id}`);
        loadTableEditor();
        showTablesInfo();
        updateCharts();
        generateDiagram();
        document.getElementById('resultOutput').innerHTML = `
            <div style="padding:15px;background:#f0fff4;border-radius:8px;border-left:4px solid #28a745;">
                <div style="color:#28a745;font-weight:600;"><i class="fas fa-check-circle"></i> Registro eliminado correctamente</div>
            </div>
        `;
    } catch(e) {
        document.getElementById('resultOutput').innerHTML = `
            <div style="padding:15px;background:#fff5f5;border-radius:8px;border-left:4px solid #dc3545;">
                <div style="color:#dc3545;font-weight:600;"><i class="fas fa-circle-exclamation"></i> Error al eliminar</div>
                <code style="display:block;padding:10px;background:white;border-radius:6px;font-size:13px;margin-top:5px;">${e.message}</code>
            </div>
        `;
    }
}

function addRow(tableName) {
    if (!db) return;
    try {
        const result = db.exec(`PRAGMA table_info(${tableName})`);
        if (result.length === 0) return;
        
        const columns = result[0].values.map(v => v[1]);
        const columnsWithoutId = columns.filter(c => c !== 'id');
        
        const placeholders = columnsWithoutId.map(() => '?').join(',');
        const values = columnsWithoutId.map(col => {
            if (col === 'nombre') return 'Nuevo registro';
            if (col === 'edad' || col === 'creditos' || col === 'año') return 0;
            if (col === 'promedio') return 0.0;
            return 'texto';
        });
        
        db.run(`INSERT INTO ${tableName} (${columnsWithoutId.join(',')}) VALUES (${placeholders})`, values);
        loadTableEditor();
        showTablesInfo();
        updateCharts();
        generateDiagram();
        document.getElementById('resultOutput').innerHTML = `
            <div style="padding:15px;background:#f0fff4;border-radius:8px;border-left:4px solid #28a745;">
                <div style="color:#28a745;font-weight:600;"><i class="fas fa-check-circle"></i> Nueva fila agregada a ${tableName}</div>
            </div>
        `;
    } catch(e) {
        document.getElementById('resultOutput').innerHTML = `
            <div style="padding:15px;background:#fff5f5;border-radius:8px;border-left:4px solid #dc3545;">
                <div style="color:#dc3545;font-weight:600;"><i class="fas fa-circle-exclamation"></i> Error al agregar fila</div>
                <code style="display:block;padding:10px;background:white;border-radius:6px;font-size:13px;margin-top:5px;">${e.message}</code>
            </div>
        `;
    }
}

// DIAGRAMA DE RELACIONES
function generateDiagram() {
    if (!db) {
        document.getElementById('diagramContainer').innerHTML = 
            '<p style="color:#dc3545;"><i class="fas fa-circle-exclamation"></i> Base de datos no inicializada</p>';
        return;
    }
    
    try {
        const container = document.getElementById('diagramContainer');
        
        const entities = {
            'estudiantes': {
                columns: ['id', 'nombre', 'edad', 'carrera', 'promedio', 'ciudad', 'fecha_ingreso'],
                primaryKey: 'id',
                foreignKeys: [],
                label: 'Estudiantes'
            },
            'cursos': {
                columns: ['id', 'nombre', 'creditos', 'profesor', 'departamento', 'semestre'],
                primaryKey: 'id',
                foreignKeys: [],
                label: 'Cursos'
            },
            'inscripciones': {
                columns: ['id', 'estudiante_id', 'curso_id', 'año', 'ciclo', 'nota'],
                primaryKey: 'id',
                foreignKeys: ['estudiante_id', 'curso_id'],
                label: 'Inscripciones'
            }
        };
        
        let html = '<div class="diagram-erd">';
        
        const entityNames = Object.keys(entities);
        entityNames.forEach((name, index) => {
            const info = entities[name];
            
            html += `<div class="entity-box">`;
            html += `<div class="entity-title"><i class="fas fa-table"></i> ${info.label}</div>`;
            html += `<ul>`;
            
            info.columns.forEach(col => {
                let className = '';
                let displayCol = col;
                
                if (col === info.primaryKey && info.foreignKeys.includes(col)) {
                    className = 'pk-fk';
                    displayCol = col;
                } else if (col === info.primaryKey) {
                    className = 'pk';
                    displayCol = col;
                } else if (info.foreignKeys.includes(col)) {
                    className = 'fk';
                    displayCol = col;
                }
                
                html += `<li class="${className}">${displayCol}</li>`;
            });
            
            html += `</ul></div>`;
            
            if (index < entityNames.length - 1) {
                const currentName = name;
                const nextName = entityNames[index + 1];
                
                let relationLabel = '';
                let relationSymbol = '───';
                
                if (currentName === 'estudiantes' && nextName === 'inscripciones') {
                    relationLabel = '1 : N';
                } else if (currentName === 'cursos' && nextName === 'inscripciones') {
                    relationLabel = '1 : N';
                } else {
                    relationLabel = '⟷';
                }
                
                html += `<div class="relation-group">`;
                html += `<div class="relation-line">${relationSymbol}</div>`;
                html += `<div class="relation-label">${relationLabel}</div>`;
                html += `</div>`;
            }
        });
        
        html += '</div>';
        
        html += `
            <div style="display:flex; justify-content:center; gap:20px; margin-top:15px; flex-wrap:wrap; font-size:12px; color:#666; border-top:1px solid #e9ecef; padding-top:15px;">
                <span><span style="color:#336791; font-weight:bold;"><i class="fas fa-key"></i></span> Primary Key</span>
                <span><span style="color:#764ba2; font-weight:bold;"><i class="fas fa-link"></i></span> Foreign Key</span>
                <span><span style="color:#dc3545; font-weight:bold;"><i class="fas fa-key"></i><i class="fas fa-link"></i></span> Primary + Foreign Key</span>
            </div>
        `;
        
        container.innerHTML = html;
        
    } catch(e) {
        document.getElementById('diagramContainer').innerHTML = 
            `<p style="color:#dc3545;"><i class="fas fa-circle-exclamation"></i> Error al generar diagrama: ${e.message}</p>`;
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
    
    try {
        const resultCarreras = db.exec(`SELECT carrera, COUNT(*) as cantidad FROM estudiantes GROUP BY carrera`);
        if (resultCarreras.length > 0 && resultCarreras[0].values.length > 0) {
            const labels = resultCarreras[0].values.map(row => row[0]);
            const data = resultCarreras[0].values.map(row => row[1]);
            const colors = ['#336791', '#764ba2', '#f093fb', '#4facfe', '#43e97b', '#fa709a', '#fee140', '#a18cd1'];
            
            if (chartCarreras) chartCarreras.destroy();
            
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
        console.log('Error en grafico de carreras:', e);
    }
    
    try {
        const resultPromedios = db.exec(`SELECT carrera, ROUND(AVG(promedio), 2) as promedio FROM estudiantes GROUP BY carrera`);
        if (resultPromedios.length > 0 && resultPromedios[0].values.length > 0) {
            const labels = resultPromedios[0].values.map(row => row[0]);
            const data = resultPromedios[0].values.map(row => row[1]);
            
            if (chartPromedios) chartPromedios.destroy();
            
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
        console.log('Error en grafico de promedios:', e);
    }
}

// REINICIAR BASE DE DATOS
function resetDatabase() {
    if (confirm('¿Seguro que quieres reiniciar la base de datos a su estado original?')) {
        dbInitialized = false;
        document.getElementById('resultOutput').innerHTML = `
            <div style="padding:20px;text-align:center;color:#f59e0b;background:#fffbeb;border-radius:8px;">
                <i class="fas fa-spinner fa-spin"></i> Reiniciando base de datos...
            </div>
        `;
        initDatabase();
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
    
    const category = selector.value;
    const categories = getExamplesByCategory();
    
    let selectedCategory = category;
    if (category === 'aleatorio') {
        const keys = Object.keys(categories);
        selectedCategory = keys[Math.floor(Math.random() * keys.length)];
        selector.value = selectedCategory;
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
    
    document.getElementById('resultOutput').innerHTML = `
        <div style="padding: 15px; background: #f0f4ff; border-radius: 8px; border-left: 4px solid #336791;">
            <div style="color: #336791; font-weight: 700; font-size: 16px; margin-bottom: 5px;">
                <i class="fas fa-book"></i> ${categoryData.titulo}
            </div>
            <div style="color: #555; font-size: 14px; margin-bottom: 8px;">
                <i class="fas fa-lightbulb"></i> ${ejemplo.titulo}
            </div>
            <div style="background: #f8f9fa; padding: 10px; border-radius: 5px; font-family: 'Courier New', monospace; font-size: 13px; overflow-x: auto; white-space: pre-wrap; word-break: break-all;">
                ${ejemplo.sql}
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
    
    modal.classList.add('active');
    document.body.style.overflow = 'hidden';
}

function closeDonationModal() {
    const modal = document.getElementById('donationModal');
    if (modal) {
        modal.classList.remove('active');
        document.body.style.overflow = 'auto';
    }
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
            <strong>Tip:</strong> ${info.title} es una excelente opcion para <strong>aplicaciones que requieren consistencia y relaciones complejas</strong>.
        </div>
    `;
    
    body.innerHTML = html;
    modal.classList.add('active');
    document.body.style.overflow = 'hidden';
}

function closeDBModal() {
    const modal = document.getElementById('dbModal');
    modal.classList.remove('active');
    document.body.style.overflow = 'auto';
}

// Cerrar modal con clic fuera
document.addEventListener('click', function(e) {
    const modal = document.getElementById('dbModal');
    if (e.target === modal) {
        closeDBModal();
    }
});

// Cerrar modal con tecla ESC
document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape') {
        closeDBModal();
    }
});

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
            Este concepto es fundamental para el diseño y optimizacion de bases de datos relacionales.
        </div>
    `;
    
    body.innerHTML = html;
    modal.classList.add('active');
    document.body.style.overflow = 'hidden';
}

function closeConceptModal() {
    const modal = document.getElementById('conceptModal');
    modal.classList.remove('active');
    document.body.style.overflow = 'auto';
}

// Cerrar modal de conceptos con clic fuera
document.addEventListener('click', function(e) {
    const modal = document.getElementById('conceptModal');
    if (e.target === modal) {
        closeConceptModal();
    }
});

// Cerrar modal de conceptos con tecla ESC
document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape') {
        closeConceptModal();
    }
});

// NAVEGACIÓN ENTRE SECCIONES
document.addEventListener('DOMContentLoaded', function() {
    // Navegación por pestañas del navbar
    document.querySelectorAll('.nav-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            // Remover active de todos los botones
            document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
            this.classList.add('active');
            
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
    
    // Inicializar base de datos
    initDatabase();
    
    // Año automático en el footer
    const yearSpan = document.getElementById('currentYear');
    if (yearSpan) {
        yearSpan.textContent = new Date().getFullYear();
    }
});

// ATAJOS DE TECLADO
document.addEventListener('keydown', function(e) {
    if (e.ctrlKey && e.key === 'Enter') {
        e.preventDefault();
        runQuery();
    }
    if (e.ctrlKey && e.shiftKey && e.key === 'R') {
        e.preventDefault();
        resetDatabase();
    }
    if (e.ctrlKey && e.key === 'e') {
        e.preventDefault();
        showExamples();
    }
    if (e.ctrlKey && e.key === 'l') {
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
                SELECT e.nombre, c.nombre_curso 
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
    const body = document.getElementById('sqlGuideBody');
    
    currentGuideStep = 0;
    renderGuideStep(currentGuideStep);
    modal.classList.add('active');
    document.body.style.overflow = 'hidden';
}

function closeSQLGuide() {
    const modal = document.getElementById('sqlGuideModal');
    modal.classList.remove('active');
    document.body.style.overflow = 'auto';
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
    
    const body = document.getElementById('sqlGuideBody');
    const totalSteps = sqlGuideSteps.length;
    
    let html = `
        <!-- Barra de progreso -->
        <div style="display:flex; gap:6px; margin-bottom:20px; justify-content:center;">
            ${sqlGuideSteps.map((s, i) => `
                <div style="
                    width: ${100 / totalSteps}%;
                    height: 4px;
                    background: ${i <= index ? s.color : '#e9ecef'};
                    border-radius: 2px;
                    transition: all 0.3s;
                    cursor: pointer;
                " onclick="renderGuideStep(${i})"></div>
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
window.showExamples = showExamples;
window.clearHistory = clearHistory;
window.loadHistoryQuery = loadHistoryQuery;
window.exportDatabase = exportDatabase;
window.loadTableEditor = loadTableEditor;
window.deleteRow = deleteRow;
window.addRow = addRow;
window.updateCharts = updateCharts;
window.clearEditor = clearEditor;
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