let db;
let dbInitialized = false;

// Inicializar la base de datos
function initDatabase() {
    initSqlJs({
        locateFile: file => `https://sql.js.org/dist/${file}`
    }).then(SQL => {
        // Crear una nueva base de datos en memoria
        db = new SQL.Database();
        
        // ===== CREAR TABLAS Y DATOS DE EJEMPLO =====
        
        // 1. Tabla de estudiantes
        db.run(`
            CREATE TABLE estudiantes (
                id INTEGER PRIMARY KEY,
                nombre TEXT NOT NULL,
                edad INTEGER,
                carrera TEXT,
                promedio REAL
            )
        `);
        
        db.run(`
            INSERT INTO estudiantes VALUES 
                (1, 'Ana García', 20, 'Ingeniería', 8.5),
                (2, 'Carlos López', 22, 'Medicina', 9.2),
                (3, 'María Torres', 19, 'Derecho', 7.8),
                (4, 'Juan Pérez', 21, 'Arquitectura', 8.9),
                (5, 'Laura Sánchez', 20, 'Ingeniería', 9.5)
        `);
        
        // 2. Tabla de cursos
        db.run(`
            CREATE TABLE cursos (
                id INTEGER PRIMARY KEY,
                nombre TEXT NOT NULL,
                creditos INTEGER,
                profesor TEXT
            )
        `);
        
        db.run(`
            INSERT INTO cursos VALUES 
                (1, 'Matemáticas', 4, 'Dr. Ramírez'),
                (2, 'Programación', 6, 'Dra. Martínez'),
                (3, 'Física', 3, 'Dr. Gómez'),
                (4, 'Química', 4, 'Dra. Fernández')
        `);
        
        // 3. Tabla de inscripciones (relación muchos a muchos)
        db.run(`
            CREATE TABLE inscripciones (
                estudiante_id INTEGER,
                curso_id INTEGER,
                año INTEGER,
                FOREIGN KEY (estudiante_id) REFERENCES estudiantes(id),
                FOREIGN KEY (curso_id) REFERENCES cursos(id)
            )
        `);
        
        db.run(`
            INSERT INTO inscripciones VALUES 
                (1, 1, 2025),
                (1, 2, 2025),
                (2, 3, 2025),
                (3, 2, 2025),
                (4, 1, 2025),
                (4, 4, 2025),
                (5, 2, 2025),
                (5, 3, 2025)
        `);
        
        dbInitialized = true;
        showTablesInfo();
        document.getElementById('resultOutput').innerHTML = '✅ Base de datos lista. ¡Escribe una consulta SQL!';
    }).catch(error => {
        document.getElementById('resultOutput').innerHTML = `❌ Error al cargar SQL.js: ${error.message}`;
    });
}

// Mostrar información de las tablas
function showTablesInfo() {
    try {
        const tables = ['estudiantes', 'cursos', 'inscripciones'];
        let html = '<table>';
        
        tables.forEach(tableName => {
            const result = db.exec(`SELECT * FROM ${tableName} LIMIT 3`);
            if (result.length > 0) {
                const cols = result[0].columns;
                const rows = result[0].values;
                html += `<tr><th colspan="${cols.length}" style="color:#667eea;">📋 ${tableName}</th></tr>`;
                html += '<tr>';
                cols.forEach(col => html += `<th style="font-size:0.8em;">${col}</th>`);
                html += '</tr>';
                rows.forEach(row => {
                    html += '<tr>';
                    row.forEach(val => html += `<td style="font-size:0.8em;">${val}</td>`);
                    html += '</tr>';
                });
                html += `<tr><td colspan="${cols.length}" style="text-align:center;font-size:0.8em;color:#999;">
                    ... y más registros
                </td></tr>`;
            }
        });
        
        html += '</table>';
        document.getElementById('tableInfo').innerHTML = html;
    } catch(e) {
        document.getElementById('tableInfo').innerHTML = 'Error cargando tablas';
    }
}

// Ejecutar consulta SQL
function runQuery() {
    if (!dbInitialized) {
        document.getElementById('resultOutput').innerHTML = '⏳ Esperando que la base de datos se inicialice...';
        return;
    }
    
    const query = document.getElementById('sqlEditor').value.trim();
    
    if (!query) {
        document.getElementById('resultOutput').innerHTML = '⚠️ Por favor, escribe una consulta SQL';
        return;
    }
    
    try {
        // Ejecutar la consulta
        const result = db.exec(query);
        
        if (result.length === 0) {
            // Si es una consulta que no devuelve datos (INSERT, UPDATE, DELETE)
            document.getElementById('resultOutput').innerHTML = '✅ Consulta ejecutada correctamente.';
            showTablesInfo(); // Actualizar la info de tablas
            return;
        }
        
        // Mostrar resultados en tabla
        let html = `<div style="font-size:0.9em;color:#666;margin-bottom:10px;">
            📊 ${result[0].values.length} filas encontradas
        </div>`;
        html += '<table>';
        
        // Encabezados
        html += '<tr>';
        result[0].columns.forEach(col => {
            html += `<th>${col}</th>`;
        });
        html += '</tr>';
        
        // Datos
        result[0].values.forEach(row => {
            html += '<tr>';
            row.forEach(value => {
                html += `<td>${value !== null ? value : 'NULL'}</td>`;
            });
            html += '</tr>';
        });
        
        html += '</table>';
        document.getElementById('resultOutput').innerHTML = html;
        
    } catch(error) {
        document.getElementById('resultOutput').innerHTML = `
            <div style="color:#dc3545;">
                ❌ Error en la consulta:<br>
                <code>${error.message}</code>
            </div>
        `;
    }
}

// Reiniciar la base de datos
function resetDatabase() {
    if (confirm('¿Seguro que quieres reiniciar la base de datos a su estado original?')) {
        dbInitialized = false;
        document.getElementById('resultOutput').innerHTML = '⏳ Reiniciando base de datos...';
        initDatabase();
    }
}

// Mostrar ejemplos
function showExamples() {
    const examples = [
        "-- Todos los estudiantes\nSELECT * FROM estudiantes;",
        "-- Estudiantes de Ingeniería\nSELECT * FROM estudiantes WHERE carrera = 'Ingeniería';",
        "-- Ordenar por promedio\nSELECT * FROM estudiantes ORDER BY promedio DESC;",
        "-- Consulta con JOIN\nSELECT e.nombre, c.nombre, c.creditos \nFROM estudiantes e\nJOIN inscripciones i ON e.id = i.estudiante_id\nJOIN cursos c ON i.curso_id = c.id\nWHERE e.carrera = 'Ingeniería';",
        "-- Promedio de edad por carrera\nSELECT carrera, AVG(edad) as edad_promedio \nFROM estudiantes \nGROUP BY carrera;"
    ];
    
    const currentExample = examples[Math.floor(Math.random() * examples.length)];
    document.getElementById('sqlEditor').value = currentExample;
}

// Configurar atajo de teclado (Ctrl+Enter para ejecutar)
document.addEventListener('DOMContentLoaded', function() {
    document.getElementById('sqlEditor').addEventListener('keydown', function(e) {
        if (e.ctrlKey && e.key === 'Enter') {
            e.preventDefault();
            runQuery();
        }
    });
    
    // Inicializar la base de datos
    initDatabase();
});

// Exponer funciones globalmente
window.runQuery = runQuery;
window.resetDatabase = resetDatabase;
window.showExamples = showExamples;