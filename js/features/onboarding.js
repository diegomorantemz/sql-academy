// Guía de primeros pasos en SQL: recorrido, pasos y acciones.

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
