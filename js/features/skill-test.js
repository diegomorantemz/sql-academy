// Perfil de nivel y test de habilidad.

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
