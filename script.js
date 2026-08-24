// ============================================
// SQL ACADEMY - BACKEND (Semana 2 - Jueves)
// ============================================

// ===== VARIABLES GLOBALES =====
let db;
let dbInitialized = false;

// ===== INICIALIZAR BASE DE DATOS =====
function initDatabase() {
    console.log('🔄 Inicializando base de datos SQLite...');
    
    // Cargar sql.js desde CDN
    const script = document.createElement('script');
    script.src = 'https://sql.js.org/dist/sql-wasm.js';
    script.onload = function() {
        console.log('✅ sql.js cargado correctamente');
        createDatabase();
    };
    script.onerror = function() {
        console.error('❌ Error al cargar sql.js');
        document.getElementById('resultOutput').innerHTML = `
            <div style="padding:20px;text-align:center;color:#dc3545;background:#fff5f5;border-radius:8px;">
                <i class="fas fa-circle-exclamation"></i> Error al cargar el motor de base de datos
            </div>
        `;
    };
    document.head.appendChild(script);
}

// ===== CREAR BASE DE DATOS =====
function createDatabase() {
    try {
        // Inicializar SQLite en memoria
        db = new SQL.Database();
        dbInitialized = true;
        console.log('✅ Base de datos creada correctamente');
        
        // Mostrar mensaje de éxito
        document.getElementById('resultOutput').innerHTML = `
            <div style="padding:20px;text-align:center;color:#28a745;background:#f0fff4;border-radius:8px;">
                <i class="fas fa-check-circle"></i> Base de datos lista. ¡Escribe una consulta SQL!
            </div>
        `;
        
        // Crear tablas (para el domingo)
        // createTables();
        
    } catch(error) {
        console.error('❌ Error al crear la base de datos:', error);
        document.getElementById('resultOutput').innerHTML = `
            <div style="padding:15px;background:#fff5f5;border-radius:8px;border-left:4px solid #dc3545;">
                <div style="color:#dc3545;font-weight:600;">
                    <i class="fas fa-circle-exclamation"></i> Error al crear la base de datos
                </div>
                <code style="display:block;padding:10px;background:white;border-radius:6px;font-size:13px;margin-top:5px;">
                    ${error.message}
                </code>
            </div>
        `;
    }
}

// ===== EJECUTAR CONSULTA (placeholder para el domingo) =====
function runQuery() {
    if (!dbInitialized) {
        document.getElementById('resultOutput').innerHTML = `
            <div style="padding:20px;text-align:center;color:#f59e0b;background:#fffbeb;border-radius:8px;">
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
    
    try {
        const result = db.exec(query);
        displayResults(result);
    } catch(error) {
        document.getElementById('resultOutput').innerHTML = `
            <div style="padding:15px;background:#fff5f5;border-radius:8px;border-left:4px solid #dc3545;">
                <div style="color:#dc3545;font-weight:600;margin-bottom:5px;">
                    <i class="fas fa-circle-exclamation"></i> Error en la consulta
                </div>
                <code style="display:block;padding:10px;background:white;border-radius:6px;font-size:13px;color:#333;margin-top:5px;">
                    ${error.message}
                </code>
            </div>
        `;
    }
}

// ===== MOSTRAR RESULTADOS (placeholder) =====
function displayResults(result) {
    if (!result || result.length === 0) {
        document.getElementById('resultOutput').innerHTML = `
            <div style="padding:20px;text-align:center;color:#28a745;background:#f0fff4;border-radius:8px;">
                <i class="fas fa-check-circle"></i> Consulta ejecutada correctamente
            </div>
        `;
        return;
    }
    
    // Mostrar resultados básicos
    let html = `
        <div style="padding:10px;background:#f8f9fa;border-radius:5px;overflow-x:auto;">
            <table style="width:100%;border-collapse:collapse;font-size:13px;">
                <thead>
                    <tr style="background:#336791;color:white;">
                        ${result[0].columns.map(col => `<th style="padding:8px 12px;text-align:left;">${col}</th>`).join('')}
                    </tr>
                </thead>
                <tbody>
                    ${result[0].values.map(row => `
                        <tr style="border-bottom:1px solid #e9ecef;">
                            ${row.map(value => `<td style="padding:8px 12px;">${value !== null ? value : 'NULL'}</td>`).join('')}
                        </tr>
                    `).join('')}
                </tbody>
            </table>
            <div style="margin-top:8px;font-size:12px;color:#999;">
                <i class="fas fa-list"></i> ${result[0].values.length} filas encontradas
            </div>
        </div>
    `;
    
    document.getElementById('resultOutput').innerHTML = html;
}

// ===== LIMPIAR EDITOR =====
function clearEditor() {
    const editor = document.getElementById('sqlEditor');
    if (editor) {
        editor.value = '';
        editor.focus();
        document.getElementById('resultOutput').innerHTML = `
            <div style="padding:20px;text-align:center;color:#f59e0b;background:#fffbeb;border-radius:8px;">
                <i class="fas fa-eraser"></i> Editor limpiado
            </div>
        `;
    }
}

// ============================================
// EXPONER FUNCIONES GLOBALES (Jueves)
// ============================================
window.initDatabase = initDatabase;
window.runQuery = runQuery;
window.clearEditor = clearEditor;

// ============================================
// INICIALIZAR AL CARGAR LA PÁGINA
// ============================================
document.addEventListener('DOMContentLoaded', function() {
    console.log('🚀 SQL Academy - Iniciando...');
    initDatabase();
});