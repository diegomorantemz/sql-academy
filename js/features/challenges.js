// Retos SQL y su progreso.

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
