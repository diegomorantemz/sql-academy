// Biblioteca de aprendizaje: conceptos, guías y recomendador.

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
