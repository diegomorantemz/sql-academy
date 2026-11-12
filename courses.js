// Catálogo de cursos guiados.
// Cada curso agrupa lecciones existentes de la ruta para no duplicar contenido.
window.SQL_ACADEMY_COURSES = [
    {
        id: 'sql-desde-cero',
        track: 'sql',
        title: 'SQL desde cero',
        subtitle: 'Tu primera conversación con los datos',
        description: 'Aprende a pedir datos, filtrar lo que importa y presentar resultados claros con lecciones cortas y ejemplos que puedes ejecutar.',
        level: 'Básico',
        duration: '25-35 min',
        icon: 'fa-seedling',
        tone: 'blue',
        recommended: true,
        prerequisites: [],
        outcomes: [
            'Elegir columnas y entender qué devuelve una consulta.',
            'Filtrar filas con condiciones claras.',
            'Ordenar y limitar resultados para responder preguntas.',
            'Completar un mini reporte con el dataset activo.'
        ],
        modules: [
            {
                id: 'primeros-pasos',
                title: 'Primeros pasos',
                description: 'Aprende a pedir datos y a quedarte solo con lo que importa.',
                lessonIds: ['select', 'where']
            },
            {
                id: 'resultados-utiles',
                title: 'Resultados útiles',
                description: 'Ordena y recorta la salida para convertir datos en respuestas.',
                lessonIds: ['order', 'limit']
            }
        ],
        practiceConcepts: ['where', 'order'],
        finalProject: {
            title: 'Mini reporte de estudiantes',
            description: 'Elige un dataset, muestra dos columnas útiles, filtra un grupo y presenta un top 5. No hay una única respuesta: combina lo aprendido y explica qué pregunta responde tu consulta.'
        }
    },
    {
        id: 'sql-intermedio',
        track: 'sql',
        title: 'SQL intermedio',
        subtitle: 'Combina, resume y compara',
        description: 'Da el salto a consultas que cruzan tablas, resumen información y comparan resultados para responder preguntas de negocio.',
        level: 'Intermedio',
        duration: '35-50 min',
        icon: 'fa-diagram-project',
        tone: 'violet',
        recommended: false,
        prerequisites: ['SQL desde cero'],
        outcomes: [
            'Combinar tablas relacionadas con JOIN.',
            'Resumir datos con GROUP BY y COUNT.',
            'Filtrar grupos con HAVING.',
            'Comparar resultados con subconsultas.'
        ],
        modules: [
            {
                id: 'relaciones',
                title: 'Cruza tablas',
                description: 'Une datos que viven en tablas distintas.',
                lessonIds: ['join']
            },
            {
                id: 'agregaciones',
                title: 'Resume datos',
                description: 'Cuenta, agrupa y filtra grupos para construir reportes.',
                lessonIds: ['group', 'having']
            },
            {
                id: 'subconsultas',
                title: 'Compara y profundiza',
                description: 'Usa el resultado de una consulta dentro de otra.',
                lessonIds: ['subquery']
            }
        ],
        practiceConcepts: ['join', 'group', 'having', 'subquery'],
        finalProject: {
            title: 'Panel de análisis',
            description: 'Combina dos tablas, agrupa por una categoría, calcula un total y muestra solo los grupos que superan un umbral. Ordena el resultado para presentarlo como un pequeño panel de análisis.'
        }
    },
    {
        id: 'sql-avanzado',
        track: 'sql',
        title: 'SQL avanzado',
        subtitle: 'Decisiones, CTE y rankings',
        description: 'Aprende a clasificar filas, organizar consultas con WITH y construir rankings por categoría con funciones de ventana.',
        level: 'Avanzado',
        duration: '30-40 min',
        icon: 'fa-chart-line',
        tone: 'amber',
        recommended: false,
        prerequisites: ['SQL intermedio'],
        outcomes: [
            'Clasificar filas con CASE sin modificar los datos.',
            'Dividir una consulta en pasos legibles con CTE.',
            'Construir rankings por grupo con ROW_NUMBER.',
            'Preparar reportes más expresivos sin salir de SQL.'
        ],
        modules: [
            {
                id: 'decisiones-sql',
                title: 'Decisiones con CASE',
                description: 'Crea categorías y etiquetas a partir de condiciones.',
                lessonIds: ['case']
            },
            {
                id: 'consultas-cte',
                title: 'Consultas organizadas',
                description: 'Usa WITH para separar pasos y reutilizar resultados.',
                lessonIds: ['cte']
            },
            {
                id: 'ranking-sql',
                title: 'Rankings con ventanas',
                description: 'Numera filas dentro de cada grupo con ROW_NUMBER.',
                lessonIds: ['rank']
            }
        ],
        practiceConcepts: [],
        finalProject: {
            title: 'Reporte avanzado',
            description: 'Clasifica las filas de un dataset, resume sus grupos con una CTE y genera un ranking por categoría. Explica qué decisiones tomaste para ordenar y presentar el resultado.'
        }
    },
    {
        id: 'nosql-esencial',
        track: 'nosql',
        title: 'NoSQL esencial',
        subtitle: 'Piensa en documentos, no en tablas',
        description: 'Aprende a leer, filtrar, ordenar y agrupar documentos con una consola guiada. Es la base para trabajar con MongoDB y bases documentales.',
        level: 'Básico',
        duration: '25-35 min',
        icon: 'fa-leaf',
        tone: 'green',
        recommended: false,
        prerequisites: [],
        outcomes: [
            'Leer documentos y elegir solo los campos necesarios.',
            'Filtrar con operadores como $gt, $lte e $in.',
            'Ordenar y limitar resultados para obtener un top.',
            'Agrupar documentos y contar cuántos hay por categoría.'
        ],
        modules: [
            {
                id: 'documentos',
                title: 'Documentos y colecciones',
                description: 'Consulta una colección y decide qué campos devolver.',
                lessonIds: ['nosql-find']
            },
            {
                id: 'filtros-nosql',
                title: 'Filtra lo que importa',
                description: 'Usa operadores para quedarte con los documentos relevantes.',
                lessonIds: ['nosql-filter']
            },
            {
                id: 'orden-nosql',
                title: 'Ordena resultados',
                description: 'Ordena y limita para construir un top útil.',
                lessonIds: ['nosql-sort']
            },
            {
                id: 'agregaciones-nosql',
                title: 'Agrupa y cuenta',
                description: 'Resume una colección con el pipeline de agregación.',
                lessonIds: ['nosql-aggregate']
            }
        ],
        practiceConcepts: [],
        finalProject: {
            title: 'Mini catálogo documental',
            description: 'Elige una colección, muestra solo los campos necesarios, filtra por una condición, ordena el resultado y agrupa por una categoría. Explica qué decisión de modelado tomaste y por qué.'
        }
    }
];

window.NOSQL_COURSE_PROFILES = {
    escuela: {
        name: 'Escuela',
        collection: 'estudiantes',
        labelField: 'nombre',
        fields: ['nombre', 'carrera', 'promedio'],
        filterField: 'promedio',
        filterOperator: '$gte',
        filterValue: 17,
        filterDescription: 'promedio mayor o igual a 17',
        sortField: 'promedio',
        sortLabel: 'promedio',
        groupField: 'carrera',
        groupDescription: 'carrera'
    },
    tienda: {
        name: 'Tienda',
        collection: 'productos',
        labelField: 'nombre',
        fields: ['nombre', 'categoria', 'precio'],
        filterField: 'stock',
        filterOperator: '$lte',
        filterValue: 10,
        filterDescription: 'stock menor o igual a 10',
        sortField: 'precio',
        sortLabel: 'precio',
        groupField: 'categoria',
        groupDescription: 'categoría'
    },
    biblioteca: {
        name: 'Biblioteca',
        collection: 'libros',
        labelField: 'titulo',
        fields: ['titulo', 'genero', 'disponibles'],
        filterField: 'disponibles',
        filterOperator: '$gt',
        filterValue: 0,
        filterDescription: 'disponibles mayor que 0',
        sortField: 'anio',
        sortLabel: 'año',
        groupField: 'genero',
        groupDescription: 'género'
    }
};
