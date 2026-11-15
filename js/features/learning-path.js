// Datos, progreso y estadísticas de la ruta de aprendizaje.

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
