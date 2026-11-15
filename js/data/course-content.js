// Contenido teórico y comprobaciones de los cursos guiados.
// Las funciones reciben el perfil del dataset activo para generar ejemplos contextualizados.
window.COURSE_CONTENT = {
    sql: {
        select: (profile) => ({
            objectives: [
                'Identificar las partes básicas de una consulta SELECT.',
                'Elegir columnas concretas en lugar de devolver toda la tabla.',
                'Explicar qué tabla se está consultando.'
            ],
            theory: [
                {
                    title: 'Qué hace SELECT',
                    body: 'SELECT no modifica la base: construye una tabla de resultados. FROM indica de dónde salen las filas y las columnas del SELECT deciden qué información quieres ver.',
                    code: `SELECT ${profile.labelColumn}, ${profile.sortColumn}\nFROM ${profile.mainTable};`
                },
                {
                    title: 'Columnas explícitas frente a *',
                    body: 'SELECT * devuelve todas las columnas. En una consulta real conviene pedir solo las que necesitas: el resultado se lee mejor y evitas transportar datos innecesarios.',
                    code: `SELECT *\nFROM ${profile.mainTable};`
                }
            ],
            commonMistakes: [
                {
                    mistake: 'Usar SELECT * aunque el ejercicio pida dos columnas concretas.',
                    fix: 'Escribe los nombres de las columnas separados por comas.'
                },
                {
                    mistake: 'Olvidar la coma entre dos columnas.',
                    fix: `Comprueba que ${profile.labelColumn} y ${profile.sortColumn} estén separados por una coma.`
                }
            ],
            demoNote: 'La demostración devuelve una tabla más pequeña porque solo pide las columnas necesarias.',
            quiz: [
                {
                    question: '¿Qué parte de la consulta indica la tabla de origen?',
                    options: ['SELECT', 'FROM', 'WHERE'],
                    answer: 1,
                    explanation: 'FROM indica la tabla de la que se leen las filas.'
                },
                {
                    question: '¿Qué devuelve SELECT nombre FROM estudiantes;?',
                    options: ['Todas las columnas', 'Solo la columna nombre', 'Solo la primera fila'],
                    answer: 1,
                    explanation: 'Una lista de columnas en SELECT limita el resultado a esas columnas.'
                }
            ],
            summary: [
                'SELECT elige las columnas del resultado.',
                'FROM indica la tabla que se consulta.',
                'Pedir columnas concretas hace que la consulta sea más clara.'
            ]
        }),

        where: (profile) => ({
            objectives: [
                'Filtrar filas con WHERE.',
                'Usar operadores de comparación.',
                'Escribir condiciones con textos y números correctamente.'
            ],
            theory: [
                {
                    title: 'WHERE decide qué filas pasan',
                    body: 'WHERE se evalúa fila a fila. Solo las filas que cumplen la condición llegan al resultado. No cambia la tabla original: cambia lo que devuelve la consulta.',
                    code: `SELECT ${profile.labelColumn}, ${profile.filterColumn}\nFROM ${profile.mainTable}\nWHERE ${profile.filterColumn} = '${profile.filterValue}';`
                },
                {
                    title: 'Operadores de comparación',
                    body: 'Puedes comparar con =, <>, >, >=, < y <=. Los textos se escriben entre comillas simples; los números no necesitan comillas.',
                    code: `SELECT ${profile.labelColumn}\nFROM ${profile.mainTable}\nWHERE ${profile.sortColumn} > 10;`
                }
            ],
            commonMistakes: [
                {
                    mistake: 'Escribir == en lugar de =.',
                    fix: 'En SQL la igualdad se escribe con un solo signo igual.'
                },
                {
                    mistake: 'Olvidar las comillas simples alrededor de un texto.',
                    fix: `La condición debe ser ${profile.filterColumn} = '${profile.filterValue}'.`
                }
            ],
            demoNote: 'La demostración solo muestra las filas que cumplen la condición del WHERE.',
            quiz: [
                {
                    question: '¿Qué hace WHERE en una consulta?',
                    options: ['Elige columnas', 'Filtra filas', 'Ordena el resultado'],
                    answer: 1,
                    explanation: 'WHERE aplica una condición a cada fila antes de devolver el resultado.'
                },
                {
                    question: '¿Cómo se escribe un texto en una condición SQL?',
                    options: ['Sin comillas', 'Entre comillas simples', 'Entre corchetes'],
                    answer: 1,
                    explanation: 'Los textos literales se escriben entre comillas simples.'
                }
            ],
            summary: [
                'WHERE filtra filas, no columnas.',
                'Los textos van entre comillas simples.',
                'Los operadores permiten comparar valores.'
            ]
        }),

        order: (profile) => ({
            objectives: [
                'Ordenar resultados con ORDER BY.',
                'Usar ASC y DESC.',
                'Combinar varios criterios de ordenación.'
            ],
            theory: [
                {
                    title: 'ORDER BY ordena la salida',
                    body: 'ORDER BY se aplica después de seleccionar y filtrar. Sin una dirección explícita, SQL usa ASC (ascendente).',
                    code: `SELECT ${profile.labelColumn}, ${profile.sortColumn}\nFROM ${profile.mainTable}\nORDER BY ${profile.sortColumn} DESC;`
                },
                {
                    title: 'Varios criterios',
                    body: 'Puedes ordenar por más de una columna. El segundo criterio resuelve los empates del primero.',
                    code: `SELECT ${profile.labelColumn}, ${profile.sortColumn}\nFROM ${profile.mainTable}\nORDER BY ${profile.sortColumn} DESC, ${profile.labelColumn} ASC;`
                }
            ],
            commonMistakes: [
                {
                    mistake: 'Pensar que ORDER BY se ejecuta antes que WHERE.',
                    fix: 'Primero se filtran las filas y después se ordena el resultado.'
                },
                {
                    mistake: 'No indicar un segundo criterio cuando hay empates.',
                    fix: `Añade ${profile.labelColumn} ASC para que el orden sea predecible.`
                }
            ],
            demoNote: 'La demostración ordena de mayor a menor y usa una segunda columna para desempatar.',
            quiz: [
                {
                    question: '¿Cuál es la dirección de ordenación por defecto?',
                    options: ['DESC', 'ASC', 'Ninguna'],
                    answer: 1,
                    explanation: 'Si no indicas dirección, SQL ordena de forma ascendente.'
                },
                {
                    question: '¿Para qué sirve el segundo criterio de ORDER BY?',
                    options: ['Para filtrar filas', 'Para resolver empates', 'Para cambiar el nombre de la tabla'],
                    answer: 1,
                    explanation: 'El segundo criterio se aplica cuando el primero produce empates.'
                }
            ],
            summary: [
                'ORDER BY ordena el resultado final.',
                'ASC sube y DESC baja.',
                'Los criterios adicionales resuelven empates.'
            ]
        }),

        limit: (profile) => ({
            objectives: [
                'Limitar el número de filas con LIMIT.',
                'Combinar LIMIT con ORDER BY.',
                'Explicar qué es un top N.'
            ],
            theory: [
                {
                    title: 'LIMIT corta el resultado',
                    body: 'LIMIT indica cuántas filas quieres devolver. Para que el corte sea significativo, primero debes ordenar: si no, el resultado puede cambiar entre ejecuciones.',
                    code: `SELECT ${profile.labelColumn}, ${profile.sortColumn}\nFROM ${profile.mainTable}\nORDER BY ${profile.sortColumn} DESC\nLIMIT 3;`
                },
                {
                    title: 'El orden de las cláusulas importa',
                    body: 'La estructura habitual es SELECT, FROM, WHERE, ORDER BY y LIMIT. LIMIT va al final porque trabaja sobre el resultado ya ordenado.',
                    code: 'SELECT ...\nFROM ...\nWHERE ...\nORDER BY ...\nLIMIT ...;'
                }
            ],
            commonMistakes: [
                {
                    mistake: 'Usar LIMIT sin ORDER BY y esperar un top.',
                    fix: 'Añade ORDER BY antes de LIMIT.'
                },
                {
                    mistake: 'Colocar LIMIT antes de ORDER BY.',
                    fix: 'ORDER BY debe ir antes que LIMIT.'
                }
            ],
            demoNote: 'La demostración devuelve solo las tres primeras filas del resultado ordenado.',
            quiz: [
                {
                    question: '¿Qué hace LIMIT 5?',
                    options: ['Filtra cinco filas', 'Devuelve como máximo cinco filas', 'Ordena cinco filas'],
                    answer: 1,
                    explanation: 'LIMIT restringe el número de filas del resultado.'
                },
                {
                    question: '¿Dónde debe ir LIMIT en una consulta?',
                    options: ['Antes de SELECT', 'Después de ORDER BY', 'Antes de FROM'],
                    answer: 1,
                    explanation: 'LIMIT se aplica al final, después de ordenar.'
                }
            ],
            summary: [
                'LIMIT controla cuántas filas se devuelven.',
                'Se combina con ORDER BY para obtener un top.',
                'El orden de las cláusulas no es arbitrario.'
            ]
        }),

        join: (profile) => ({
            objectives: [
                'Combinar dos tablas relacionadas.',
                'Usar JOIN y ON.',
                'Evitar productos cartesianos accidentales.'
            ],
            theory: [
                {
                    title: 'JOIN une filas relacionadas',
                    body: 'JOIN combina filas de dos tablas cuando se cumple una condición. ON explica cómo se relacionan, normalmente mediante una clave.',
                    code: `SELECT ${profile.join.columns}\nFROM ${profile.join.left}\nJOIN ${profile.join.right}\n  ON ${profile.join.left}.${profile.join.leftKey} = ${profile.join.right}.${profile.join.rightKey};`
                },
                {
                    title: 'La condición ON es obligatoria',
                    body: 'Si olvidas ON, la base intenta combinar cada fila con todas las de la otra tabla. Ese producto cartesiano suele ser enorme y casi nunca es lo que quieres.',
                    code: `SELECT *\nFROM ${profile.join.left}\nJOIN ${profile.join.right}\n  ON ${profile.join.left}.${profile.join.leftKey} = ${profile.join.right}.${profile.join.rightKey};`
                }
            ],
            commonMistakes: [
                {
                    mistake: 'Olvidar la condición ON.',
                    fix: 'Relaciona las tablas por su clave primaria y foránea.'
                },
                {
                    mistake: 'Seleccionar columnas ambiguas sin indicar la tabla.',
                    fix: 'Usa tabla.columna cuando el mismo nombre exista en ambas tablas.'
                }
            ],
            demoNote: 'La demostración cruza las dos tablas mediante su clave y muestra columnas de ambas.',
            quiz: [
                {
                    question: '¿Qué indica la cláusula ON?',
                    options: ['Qué columnas mostrar', 'Cómo se relacionan las tablas', 'El orden del resultado'],
                    answer: 1,
                    explanation: 'ON define la condición que empareja filas de las dos tablas.'
                },
                {
                    question: '¿Qué ocurre si olvidas ON en un JOIN?',
                    options: ['La consulta falla siempre', 'Se produce un producto cartesiano', 'Se ordenan las tablas'],
                    answer: 1,
                    explanation: 'Sin condición, cada fila se combina con todas las de la otra tabla.'
                }
            ],
            summary: [
                'JOIN combina tablas relacionadas.',
                'ON indica la condición de unión.',
                'Usa alias o nombres completos para evitar ambigüedades.'
            ]
        }),

        group: (profile) => ({
            objectives: [
                'Agrupar filas con GROUP BY.',
                'Contar elementos con COUNT.',
                'Entender qué columnas pueden mostrarse con una agrupación.'
            ],
            theory: [
                {
                    title: 'GROUP BY crea grupos',
                    body: 'GROUP BY reúne las filas que comparten un valor. Después puedes calcular un resumen por grupo con funciones como COUNT, SUM o AVG.',
                    code: `SELECT ${profile.groupColumn}, COUNT(*) AS total\nFROM ${profile.mainTable}\nGROUP BY ${profile.groupColumn};`
                },
                {
                    title: 'Columnas agrupadas y agregadas',
                    body: 'Las columnas del SELECT deben estar en GROUP BY o dentro de una función de agregación. Si mezclas una columna suelta, el resultado deja de ser determinista.',
                    code: `SELECT ${profile.groupColumn}, COUNT(*) AS total\nFROM ${profile.mainTable}\nGROUP BY ${profile.groupColumn}\nORDER BY total DESC;`
                }
            ],
            commonMistakes: [
                {
                    mistake: 'Mostrar una columna que no está en GROUP BY ni agregada.',
                    fix: 'Añádela a GROUP BY o envuélvela en una función de agregación.'
                },
                {
                    mistake: 'Confundir COUNT(*) con COUNT(columna).',
                    fix: 'COUNT(*) cuenta filas; COUNT(columna) ignora los valores nulos.'
                }
            ],
            demoNote: 'La demostración devuelve una fila por grupo con el número de elementos de cada uno.',
            quiz: [
                {
                    question: '¿Qué hace GROUP BY?',
                    options: ['Ordena filas', 'Reúne filas que comparten un valor', 'Elimina columnas'],
                    answer: 1,
                    explanation: 'GROUP BY forma grupos para calcular resúmenes.'
                },
                {
                    question: '¿Qué columna puedes mostrar junto a COUNT(*)?',
                    options: ['Cualquier columna', 'Una columna incluida en GROUP BY', 'Solo la clave primaria'],
                    answer: 1,
                    explanation: 'Las columnas no agregadas deben formar parte de la agrupación.'
                }
            ],
            summary: [
                'GROUP BY agrupa filas por un valor.',
                'COUNT(*) cuenta filas por grupo.',
                'Las columnas del SELECT deben ser válidas para la agrupación.'
            ]
        }),

        having: (profile) => ({
            objectives: [
                'Filtrar grupos con HAVING.',
                'Distinguir WHERE de HAVING.',
                'Ordenar el resultado de una agrupación.'
            ],
            theory: [
                {
                    title: 'WHERE filtra filas; HAVING filtra grupos',
                    body: 'WHERE se aplica antes de agrupar. HAVING se aplica después y puede usar funciones de agregación como COUNT o SUM.',
                    code: `SELECT ${profile.groupColumn}, COUNT(*) AS total\nFROM ${profile.mainTable}\nGROUP BY ${profile.groupColumn}\nHAVING COUNT(*) > 1;`
                },
                {
                    title: 'Un filtro de grupos',
                    body: 'HAVING no sustituye a WHERE: cada uno trabaja en una fase distinta. Puedes usar ambos en la misma consulta.',
                    code: `SELECT ${profile.groupColumn}, COUNT(*) AS total\nFROM ${profile.mainTable}\nWHERE ${profile.sortColumn} > 0\nGROUP BY ${profile.groupColumn}\nHAVING COUNT(*) > 1;`
                }
            ],
            commonMistakes: [
                {
                    mistake: 'Usar WHERE COUNT(*) > 1.',
                    fix: 'Las funciones de agregación se filtran con HAVING.'
                },
                {
                    mistake: 'Pensar que HAVING puede ir sin GROUP BY en cualquier caso.',
                    fix: 'HAVING tiene sentido cuando hay una agrupación o una agregación.'
                }
            ],
            demoNote: 'La demostración conserva solo los grupos que superan la condición de HAVING.',
            quiz: [
                {
                    question: '¿Qué cláusula filtra grupos?',
                    options: ['WHERE', 'HAVING', 'ORDER BY'],
                    answer: 1,
                    explanation: 'HAVING actúa después de GROUP BY.'
                },
                {
                    question: '¿Se puede usar COUNT(*) en WHERE?',
                    options: ['Sí, siempre', 'No, se usa en HAVING', 'Solo con ORDER BY'],
                    answer: 1,
                    explanation: 'Las agregaciones se filtran después de agrupar, con HAVING.'
                }
            ],
            summary: [
                'WHERE filtra filas antes de agrupar.',
                'HAVING filtra grupos después de agrupar.',
                'Puedes combinar ambos filtros.'
            ]
        }),

        subquery: (profile) => ({
            objectives: [
                'Escribir una consulta dentro de otra.',
                'Usar el resultado de una subconsulta en WHERE.',
                'Reconocer cuándo una subconsulta facilita la lectura.'
            ],
            theory: [
                {
                    title: 'Una consulta dentro de otra',
                    body: 'Una subconsulta calcula un valor o una lista que la consulta principal puede usar. Va entre paréntesis y se ejecuta como parte de la consulta exterior.',
                    code: `SELECT ${profile.labelColumn}, ${profile.sortColumn}\nFROM ${profile.mainTable}\nWHERE ${profile.sortColumn} > (SELECT AVG(${profile.sortColumn}) FROM ${profile.mainTable});`
                },
                {
                    title: 'Valor escalar frente a lista',
                    body: 'Si la subconsulta devuelve un solo valor, puedes comparar con =, > o <. Si devuelve varios, necesitas operadores como IN.',
                    code: `SELECT ${profile.labelColumn}\nFROM ${profile.mainTable}\nWHERE ${profile.sortColumn} > 0;`
                }
            ],
            commonMistakes: [
                {
                    mistake: 'Olvidar los paréntesis de la subconsulta.',
                    fix: 'La subconsulta debe ir entre paréntesis.'
                },
                {
                    mistake: 'Usar = con una subconsulta que devuelve varias filas.',
                    fix: 'Usa IN o limita la subconsulta a un único valor.'
                }
            ],
            demoNote: 'La demostración compara cada fila con un valor calculado por la subconsulta.',
            quiz: [
                {
                    question: '¿Dónde se escribe una subconsulta?',
                    options: ['Siempre en FROM', 'Dentro de otra consulta, entre paréntesis', 'Fuera de SQL'],
                    answer: 1,
                    explanation: 'La subconsulta forma parte de otra consulta y se agrupa entre paréntesis.'
                },
                {
                    question: '¿Qué devuelve AVG(columna) en una subconsulta?',
                    options: ['Una tabla completa', 'Un único valor promedio', 'Todas las filas'],
                    answer: 1,
                    explanation: 'AVG calcula un único valor agregado.'
                }
            ],
            summary: [
                'Una subconsulta se escribe dentro de otra consulta.',
                'Puede devolver un valor o una lista.',
                'Los paréntesis son obligatorios.'
            ]
        }),

        case: (profile) => {
            const rules = profile.advanced.caseRules;
            const ruleLines = rules.map(rule => `WHEN ${profile.advanced.caseField} ${rule.operator} ${rule.value} THEN '${rule.label}'`).join('\n        ');
            return {
                objectives: [
                    'Crear categorías con CASE.',
                    'Entender el orden de evaluación de WHEN.',
                    'Usar ELSE para cubrir el resto de casos.'
                ],
                theory: [
                    {
                        title: 'CASE devuelve una etiqueta',
                        body: 'CASE evalúa sus condiciones en orden y devuelve el primer resultado que coincide. Es una expresión: puedes usarla en SELECT, ORDER BY o GROUP BY.',
                        code: `CASE\n        ${ruleLines}\n        ELSE '${profile.advanced.caseElse}'\n      END`
                    },
                    {
                        title: 'El orden de las reglas importa',
                        body: 'Si una condición amplia va antes que una específica, la específica nunca se alcanza. Escribe primero los casos más restrictivos y deja ELSE para el resto.',
                        code: `SELECT ${profile.labelColumn},\n       CASE WHEN ${profile.advanced.caseField} ${rules[0].operator} ${rules[0].value} THEN '${rules[0].label}' ELSE '${profile.advanced.caseElse}' END AS ${profile.advanced.caseLabel}\nFROM ${profile.mainTable};`
                    }
                ],
                commonMistakes: [
                    {
                        mistake: 'Colocar una condición general antes que una específica.',
                        fix: 'Ordena las reglas de la más restrictiva a la más general.'
                    },
                    {
                        mistake: 'Olvidar ELSE y dejar casos sin etiqueta.',
                        fix: `Añade ELSE '${profile.advanced.caseElse}' para cubrir el resto.`
                    }
                ],
                demoNote: 'La demostración clasifica cada fila en una categoría calculada, sin modificar los datos.',
                quiz: [
                    {
                        question: '¿Qué condición se aplica primero en CASE?',
                        options: ['La última WHEN', 'La primera WHEN que coincida', 'Siempre ELSE'],
                        answer: 1,
                        explanation: 'CASE se detiene en la primera condición que se cumple.'
                    },
                    {
                        question: '¿Para qué sirve ELSE en CASE?',
                        options: ['Para ordenar', 'Para cubrir los casos restantes', 'Para crear una tabla'],
                        answer: 1,
                        explanation: 'ELSE define el valor cuando ninguna condición anterior coincide.'
                    }
                ],
                summary: [
                    'CASE crea etiquetas condicionales.',
                    'Las reglas se evalúan en orden.',
                    'ELSE evita dejar casos sin cubrir.'
                ]
            };
        },

        cte: (profile) => ({
            objectives: [
                'Organizar una consulta con WITH.',
                'Reutilizar un resultado intermedio.',
                'Calcular porcentajes sobre una agrupación.'
            ],
            theory: [
                {
                    title: 'Una CTE da nombre a un paso',
                    body: 'WITH crea una consulta temporal con nombre. Puedes usarla como si fuera una tabla dentro de la consulta principal, sin guardarla en la base.',
                    code: `WITH resumen AS (\n    SELECT ${profile.groupColumn}, COUNT(*) AS total\n    FROM ${profile.mainTable}\n    GROUP BY ${profile.groupColumn}\n)\nSELECT ${profile.groupColumn}, total\nFROM resumen;`
                },
                {
                    title: 'Varios pasos, una consulta',
                    body: 'Las CTE hacen que los cálculos intermedios se lean de arriba abajo. Son útiles cuando una consulta tiene agrupaciones, filtros y cálculos derivados.',
                    code: `WITH resumen AS (\n    SELECT ${profile.groupColumn}, COUNT(*) AS total\n    FROM ${profile.mainTable}\n    GROUP BY ${profile.groupColumn}\n)\nSELECT ${profile.groupColumn}, total\nFROM resumen\nORDER BY total DESC;`
                }
            ],
            commonMistakes: [
                {
                    mistake: 'Creer que una CTE guarda datos permanentemente.',
                    fix: 'La CTE existe solo durante la ejecución de esa consulta.'
                },
                {
                    mistake: 'Olvidar los paréntesis o la coma entre varias CTE.',
                    fix: 'Cada CTE necesita su bloque AS (...) y las definiciones se separan con comas.'
                }
            ],
            demoNote: 'La demostración calcula primero el resumen y después lo presenta como una tabla legible.',
            quiz: [
                {
                    question: '¿Qué es una CTE?',
                    options: ['Una tabla permanente', 'Una consulta temporal con nombre', 'Un índice'],
                    answer: 1,
                    explanation: 'Una CTE es una consulta con nombre que vive dentro de la consulta actual.'
                },
                {
                    question: '¿Qué palabra introduce una CTE?',
                    options: ['WITH', 'HAVING', 'LIMIT'],
                    answer: 0,
                    explanation: 'WITH ... AS (...) define una CTE.'
                }
            ],
            summary: [
                'WITH define pasos intermedios con nombre.',
                'La CTE se usa dentro de la consulta actual.',
                'Separar pasos mejora la lectura de consultas complejas.'
            ]
        }),

        rank: (profile) => ({
            objectives: [
                'Entender qué es una función de ventana.',
                'Numerar filas por grupo con ROW_NUMBER.',
                'Usar PARTITION BY y ORDER BY dentro de una ventana.'
            ],
            theory: [
                {
                    title: 'Una ventana no agrupa filas',
                    body: 'Las funciones de ventana calculan un valor para cada fila sin reducir el número de filas. OVER define la ventana: el conjunto de filas que se tiene en cuenta.',
                    code: `SELECT ${profile.labelColumn}, ${profile.groupColumn},\n       ROW_NUMBER() OVER (PARTITION BY ${profile.groupColumn} ORDER BY ${profile.sortColumn} DESC) AS posicion\nFROM ${profile.mainTable};`
                },
                {
                    title: 'PARTITION BY y ORDER BY',
                    body: 'PARTITION BY reinicia el cálculo en cada grupo. ORDER BY decide qué fila recibe el número 1, el 2 y así sucesivamente.',
                    code: `ROW_NUMBER() OVER (\n  PARTITION BY ${profile.groupColumn}\n  ORDER BY ${profile.sortColumn} DESC, ${profile.labelColumn} ASC\n)`
                }
            ],
            commonMistakes: [
                {
                    mistake: 'Olvidar PARTITION BY y numerar toda la tabla.',
                    fix: `Añade PARTITION BY ${profile.groupColumn} si quieres un ranking dentro de cada grupo.`
                },
                {
                    mistake: 'Intentar filtrar directamente por una función de ventana en WHERE.',
                    fix: 'Calcula la ventana en una CTE o subconsulta y filtra después.'
                }
            ],
            demoNote: 'La demostración numera filas sin separar por grupo. En la práctica añadirás PARTITION BY para crear un ranking por categoría.',
            quiz: [
                {
                    question: '¿Qué hace PARTITION BY en una ventana?',
                    options: ['Ordena la tabla original', 'Reinicia el cálculo por grupo', 'Elimina duplicados'],
                    answer: 1,
                    explanation: 'PARTITION BY divide las filas en grupos para el cálculo de la ventana.'
                },
                {
                    question: '¿Qué devuelve ROW_NUMBER?',
                    options: ['Un total acumulado', 'Un número de fila dentro de la ventana', 'Una etiqueta de texto'],
                    answer: 1,
                    explanation: 'ROW_NUMBER asigna un número secuencial dentro de cada ventana.'
                }
            ],
            summary: [
                'Las funciones de ventana calculan sin perder filas.',
                'PARTITION BY define grupos de cálculo.',
                'ORDER BY decide el orden del ranking.'
            ]
        })
    },

    nosql: {
        'nosql-find': (profile) => {
            const projection = profile.fields.map(field => `${field}: 1`).join(', ');
            return {
                objectives: [
                    'Entender qué es un documento y una colección.',
                    'Consultar documentos con find.',
                    'Elegir campos con una proyección.'
                ],
                theory: [
                    {
                        title: 'Documentos y colecciones',
                        body: 'En una base documental, cada registro es un documento con campos. Los documentos relacionados viven en una colección, como estudiantes o productos.',
                        code: `db.${profile.collection}.find({})`
                    },
                    {
                        title: 'Filtro y proyección',
                        body: 'find recibe dos argumentos: el filtro decide qué documentos entran y la proyección decide qué campos salen. El primer objeto puede estar vacío para no filtrar.',
                        code: `db.${profile.collection}.find({}, { ${projection} })`
                    }
                ],
                commonMistakes: [
                    {
                        mistake: 'Pensar que find devuelve un solo documento.',
                        fix: 'find devuelve una lista; findOne devuelve un único documento.'
                    },
                    {
                        mistake: 'Confundir la proyección con el filtro.',
                        fix: 'El primer argumento filtra documentos; el segundo elige campos.'
                    }
                ],
                demoNote: 'La demostración usa findOne y devuelve un documento completo. En la práctica usarás find con una proyección para elegir los campos.',
                quiz: [
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
                        explanation: 'El segundo argumento es la proyección de campos.'
                    }
                ],
                summary: [
                    'Una colección agrupa documentos.',
                    'find devuelve una lista de documentos.',
                    'La proyección decide qué campos se muestran.'
                ]
            };
        },

        'nosql-filter': (profile) => {
            const projection = profile.fields.map(field => `${field}: 1`).join(', ');
            return {
                objectives: [
                    'Filtrar documentos con operadores.',
                    'Usar $gt, $gte, $lt, $lte e $in.',
                    'Consultar campos dentro de documentos.'
                ],
                theory: [
                    {
                        title: 'Operadores de filtro',
                        body: 'Los operadores empiezan por $ y se colocan dentro del campo que quieres comparar. $gt significa mayor que, $lte menor o igual, e $in comprueba una lista de valores.',
                        code: `db.${profile.collection}.find({ ${profile.filterField}: { ${profile.filterOperator}: ${profile.filterValue} } }, { ${projection} })`
                    },
                    {
                        title: 'Filtros sobre campos anidados',
                        body: 'Puedes usar la ruta completa de un campo, por ejemplo cursos.nota, para filtrar documentos que contienen arreglos u objetos.',
                        code: `db.${profile.collection}.find({ ${profile.filterField}: { ${profile.filterOperator}: ${profile.filterValue} } })`
                    }
                ],
                commonMistakes: [
                    {
                        mistake: 'Escribir == en lugar del operador de MongoDB.',
                        fix: 'Usa $gt, $gte, $lt, $lte o $in dentro del filtro.'
                    },
                    {
                        mistake: 'Olvidar el símbolo $ en el operador.',
                        fix: 'El operador debe empezar por $, por ejemplo $gte.'
                    }
                ],
                demoNote: 'La demostración devuelve un documento que cumple el operador. En la práctica aplicarás el filtro a toda la colección.',
                quiz: [
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
                        explanation: 'El operador va dentro del objeto del campo filtrado.'
                    }
                ],
                summary: [
                    'Los operadores permiten filtrar por comparación.',
                    'El operador va dentro del campo.',
                    'Los filtros se aplican antes de la proyección.'
                ]
            };
        },

        'nosql-sort': (profile) => {
            const projection = `${profile.labelField}: 1, ${profile.sortField}: 1`;
            return {
                objectives: [
                    'Ordenar documentos con sort.',
                    'Limitar resultados con limit.',
                    'Construir un top significativo.'
                ],
                theory: [
                    {
                        title: 'Ordenar antes de limitar',
                        body: 'sort recibe un objeto con el campo y la dirección: 1 para ascendente y -1 para descendente. limit se aplica después y corta la lista.',
                        code: `db.${profile.collection}.find({}, { ${projection} }).sort({ ${profile.sortField}: -1 }).limit(3)`
                    },
                    {
                        title: 'Un top necesita criterio',
                        body: 'Si usas limit sin sort, no puedes predecir qué documentos aparecerán. Para un top, ordena primero por la métrica que quieres destacar.',
                        code: `db.${profile.collection}.find({}, { ${projection} }).sort({ ${profile.sortField}: -1 })`
                    }
                ],
                commonMistakes: [
                    {
                        mistake: 'Usar limit sin ordenar.',
                        fix: 'Encadena sort antes de limit.'
                    },
                    {
                        mistake: 'Confundir 1 y -1 con verdadero y falso.',
                        fix: '1 ordena ascendente y -1 descendente.'
                    }
                ],
                demoNote: 'La demostración ordena y después recorta la lista con limit.',
                quiz: [
                    {
                        question: '¿Qué dirección usa sort con -1?',
                        options: ['Ascendente', 'Descendente', 'Aleatoria'],
                        answer: 1,
                        explanation: '-1 ordena de mayor a menor.'
                    },
                    {
                        question: '¿Qué método corta la lista de resultados?',
                        options: ['find', 'limit', 'project'],
                        answer: 1,
                        explanation: 'limit restringe el número de documentos devueltos.'
                    }
                ],
                summary: [
                    'sort ordena documentos.',
                    'limit corta la lista.',
                    'Para un top, ordena antes de limitar.'
                ]
            };
        },

        'nosql-aggregate': (profile) => {
            const groupId = "'$" + profile.groupField + "'";
            const groupStage = `{ $group: { _id: ${groupId}, total: { $sum: 1 } } }`;
            return {
                objectives: [
                    'Entender el pipeline de agregación.',
                    'Agrupar documentos con $group.',
                    'Contar y ordenar grupos con $sum y $sort.'
                ],
                theory: [
                    {
                        title: 'Un pipeline de etapas',
                        body: 'aggregate recibe una lista de etapas. Cada etapa transforma el resultado de la anterior. $group crea un documento por categoría y $sum acumula valores.',
                        code: `db.${profile.collection}.aggregate([${groupStage}])`
                    },
                    {
                        title: 'El grupo se llama _id',
                        body: 'El campo _id del resultado de $group representa la categoría agrupada. Después puedes ordenar por el total calculado.',
                        code: `db.${profile.collection}.aggregate([\n  ${groupStage},\n  { $sort: { total: -1, _id: 1 } }\n])`
                    }
                ],
                commonMistakes: [
                    {
                        mistake: `Escribir ${profile.groupField} sin $ en la expresión de grupo.`,
                        fix: `Para referirte a un campo dentro de $group usa '$${profile.groupField}'.`
                    },
                    {
                        mistake: 'Ordenar antes de agrupar y esperar el total.',
                        fix: 'Coloca $sort después de $group para ordenar los grupos.'
                    }
                ],
                demoNote: 'La demostración muestra el primer grupo del pipeline. En la práctica calcularás todos los grupos y los ordenarás por total.',
                quiz: [
                    {
                        question: '¿Qué hace $group?',
                        options: ['Ordena documentos', 'Agrupa por una expresión', 'Elimina campos'],
                        answer: 1,
                        explanation: '$group crea un resultado por cada valor agrupado.'
                    },
                    {
                        question: '¿Qué representa _id en el resultado de $group?',
                        options: ['El identificador original', 'La categoría agrupada', 'El total calculado'],
                        answer: 1,
                        explanation: 'En $group, _id es la expresión que define el grupo.'
                    }
                ],
                summary: [
                    'aggregate ejecuta etapas en orden.',
                    '$group crea grupos y $sum los cuenta.',
                    '$sort ordena el resultado final.'
                ]
            };
        }
    }
};
