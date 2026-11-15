// Preguntas de los checkpoints de módulo.
// Cada módulo tiene tres preguntas conceptuales o de predicción.
window.COURSE_CHECKPOINTS = {
    'sql-desde-cero': {
        'primeros-pasos': [
            {
                question: '¿Qué cláusula indica la tabla de la que salen los datos?',
                options: ['SELECT', 'FROM', 'WHERE'],
                answer: 1,
                explanation: 'FROM indica la tabla de origen.'
            },
            {
                question: '¿Qué hace WHERE en una consulta?',
                options: ['Elige columnas', 'Filtra filas', 'Ordena el resultado'],
                answer: 1,
                explanation: 'WHERE aplica una condición a cada fila.'
            },
            {
                question: '¿Cómo se escribe un texto en una condición SQL?',
                options: ['Sin comillas', 'Entre comillas simples', 'Entre corchetes'],
                answer: 1,
                explanation: 'Los textos literales van entre comillas simples.'
            }
        ],
        'resultados-utiles': [
            {
                question: '¿Cuál es la dirección de ordenación por defecto de ORDER BY?',
                options: ['DESC', 'ASC', 'Aleatoria'],
                answer: 1,
                explanation: 'Sin dirección explícita, SQL ordena de forma ascendente.'
            },
            {
                question: '¿Dónde debe colocarse LIMIT?',
                options: ['Antes de SELECT', 'Después de ORDER BY', 'Antes de FROM'],
                answer: 1,
                explanation: 'LIMIT se aplica al final del resultado.'
            },
            {
                question: '¿Qué necesita una consulta para devolver un top 3 fiable?',
                options: ['Solo LIMIT', 'ORDER BY y LIMIT', 'Solo SELECT *'],
                answer: 1,
                explanation: 'Primero se ordena y después se limita el resultado.'
            }
        ]
    },

    'sql-intermedio': {
        'relaciones': [
            {
                question: '¿Qué indica ON en un JOIN?',
                options: ['Las columnas que se muestran', 'La condición que relaciona las tablas', 'El orden final'],
                answer: 1,
                explanation: 'ON empareja filas de las dos tablas.'
            },
            {
                question: '¿Qué ocurre si se omite ON?',
                options: ['La consulta siempre falla', 'Se produce un producto cartesiano', 'Se eliminan las tablas'],
                answer: 1,
                explanation: 'Cada fila se combina con todas las de la otra tabla.'
            },
            {
                question: '¿Qué columnas suelen relacionar dos tablas?',
                options: ['Clave primaria y clave foránea', 'Dos columnas de texto cualquiera', 'Solo la columna id'],
                answer: 0,
                explanation: 'La relación se apoya en una clave primaria y su clave foránea.'
            }
        ],
        'agregaciones': [
            {
                question: '¿Qué hace GROUP BY?',
                options: ['Ordena filas', 'Reúne filas que comparten un valor', 'Filtra columnas'],
                answer: 1,
                explanation: 'GROUP BY crea grupos para calcular resúmenes.'
            },
            {
                question: '¿Qué cuenta COUNT(*)?',
                options: ['Las columnas', 'Las filas de cada grupo', 'Solo los valores no nulos'],
                answer: 1,
                explanation: 'COUNT(*) cuenta filas.'
            },
            {
                question: '¿Qué cláusula filtra grupos?',
                options: ['WHERE', 'HAVING', 'LIMIT'],
                answer: 1,
                explanation: 'HAVING actúa después de GROUP BY.'
            }
        ],
        'subconsultas': [
            {
                question: '¿Dónde se escribe una subconsulta?',
                options: ['Siempre en FROM', 'Dentro de otra consulta, entre paréntesis', 'Fuera de SQL'],
                answer: 1,
                explanation: 'La subconsulta forma parte de otra consulta.'
            },
            {
                question: '¿Qué devuelve AVG(columna) en una subconsulta?',
                options: ['Una tabla completa', 'Un único valor promedio', 'Todas las filas'],
                answer: 1,
                explanation: 'AVG calcula un valor agregado.'
            },
            {
                question: '¿Qué operador conviene si la subconsulta devuelve varios valores?',
                options: ['=', 'IN', 'ORDER BY'],
                answer: 1,
                explanation: 'IN permite comparar con una lista de valores.'
            }
        ]
    },

    'sql-avanzado': {
        'decisiones-sql': [
            {
                question: '¿Qué condición de CASE se aplica primero?',
                options: ['La última WHEN', 'La primera WHEN que coincida', 'Siempre ELSE'],
                answer: 1,
                explanation: 'CASE se detiene en la primera condición que se cumple.'
            },
            {
                question: '¿Para qué sirve ELSE en CASE?',
                options: ['Para ordenar', 'Para cubrir los casos restantes', 'Para crear tablas'],
                answer: 1,
                explanation: 'ELSE define el valor cuando ninguna condición coincide.'
            },
            {
                question: '¿Por qué importa el orden de las reglas de CASE?',
                options: ['Porque una regla general puede ocultar una específica', 'Porque SQL ordena alfabéticamente', 'No importa'],
                answer: 0,
                explanation: 'Las reglas generales deben ir después de las específicas.'
            }
        ],
        'consultas-cte': [
            {
                question: '¿Qué palabra introduce una CTE?',
                options: ['WITH', 'HAVING', 'JOIN'],
                answer: 0,
                explanation: 'WITH ... AS (...) define una CTE.'
            },
            {
                question: '¿Cuánto tiempo existe una CTE?',
                options: ['Permanentemente', 'Durante la consulta actual', 'Hasta reiniciar la base'],
                answer: 1,
                explanation: 'La CTE solo vive dentro de la consulta que la usa.'
            },
            {
                question: '¿Para qué sirve una CTE?',
                options: ['Para guardar contraseñas', 'Para separar pasos y mejorar la lectura', 'Para eliminar índices'],
                answer: 1,
                explanation: 'Una CTE da nombre a un resultado intermedio.'
            }
        ],
        'ranking-sql': [
            {
                question: '¿Qué hace PARTITION BY en una ventana?',
                options: ['Ordena la tabla original', 'Reinicia el cálculo por grupo', 'Elimina duplicados'],
                answer: 1,
                explanation: 'PARTITION BY divide las filas en grupos de cálculo.'
            },
            {
                question: '¿Qué devuelve ROW_NUMBER?',
                options: ['Un total acumulado', 'Un número de fila dentro de la ventana', 'Una etiqueta de texto'],
                answer: 1,
                explanation: 'ROW_NUMBER asigna un número secuencial dentro de la ventana.'
            },
            {
                question: '¿Dónde se filtra por el resultado de una función de ventana?',
                options: ['En WHERE', 'En una CTE o subconsulta', 'En SELECT'],
                answer: 1,
                explanation: 'Calcula la ventana en una CTE y filtra después.'
            }
        ]
    },

    'nosql-esencial': {
        'documentos': [
            {
                question: '¿Qué agrupa una colección?',
                options: ['Tablas relacionadas', 'Documentos', 'Índices SQL'],
                answer: 1,
                explanation: 'Una colección contiene documentos.'
            },
            {
                question: '¿Qué devuelve find?',
                options: ['Un documento', 'Una lista de documentos', 'Una colección nueva'],
                answer: 1,
                explanation: 'find devuelve todos los documentos que cumplen el filtro.'
            },
            {
                question: '¿Para qué sirve el segundo argumento de find?',
                options: ['Para filtrar', 'Para elegir campos', 'Para ordenar'],
                answer: 1,
                explanation: 'El segundo argumento es la proyección.'
            }
        ],
        'filtros-nosql': [
            {
                question: '¿Qué significa $gte?',
                options: ['Mayor que', 'Mayor o igual que', 'Distinto de'],
                answer: 1,
                explanation: '$gte significa greater than or equal.'
            },
            {
                question: '¿Dónde se coloca el operador?',
                options: ['Antes del campo', 'Dentro del campo que se compara', 'Después de find'],
                answer: 1,
                explanation: 'El operador va dentro del objeto del campo.'
            },
            {
                question: '¿Qué operador comprueba una lista de valores?',
                options: ['$in', '$sum', '$group'],
                answer: 0,
                explanation: '$in compara con una lista.'
            }
        ],
        'orden-nosql': [
            {
                question: '¿Qué dirección usa sort con -1?',
                options: ['Ascendente', 'Descendente', 'Aleatoria'],
                answer: 1,
                explanation: '-1 ordena de mayor a menor.'
            },
            {
                question: '¿Qué hace limit?',
                options: ['Ordena', 'Corta la lista de resultados', 'Filtra campos'],
                answer: 1,
                explanation: 'limit restringe el número de documentos.'
            },
            {
                question: '¿Qué orden conviene para un top?',
                options: ['limit y después sort', 'sort y después limit', 'Solo find'],
                answer: 1,
                explanation: 'Primero se ordena y después se limita.'
            }
        ],
        'agregaciones-nosql': [
            {
                question: '¿Qué ejecuta aggregate?',
                options: ['Una lista de etapas', 'Una sola tabla', 'Un índice'],
                answer: 0,
                explanation: 'aggregate recibe un pipeline de etapas.'
            },
            {
                question: '¿Qué representa _id en $group?',
                options: ['El identificador original', 'La categoría agrupada', 'El total calculado'],
                answer: 1,
                explanation: '_id define la expresión del grupo.'
            },
            {
                question: '¿Qué acumulador cuenta documentos?',
                options: ['$sort', '$sum', '$limit'],
                answer: 1,
                explanation: '$sum acumula valores; con 1 cuenta documentos.'
            }
        ]
    }
};
