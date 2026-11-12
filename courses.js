// Catálogo de cursos guiados.
// Cada curso agrupa lecciones existentes de la ruta para no duplicar contenido.
window.SQL_ACADEMY_COURSES = [
    {
        id: 'sql-desde-cero',
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
    }
];
