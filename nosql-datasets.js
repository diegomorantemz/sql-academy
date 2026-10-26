/**
 * Datasets del laboratorio NoSQL.
 *
 * Los documentos usan _id de tipo texto para que sean fáciles de leer y de
 * comparar en los ejemplos. La estructura es deliberadamente denormalizada:
 * los cursos de un estudiante y los items de un pedido viven dentro del
 * documento principal para mostrar una diferencia clave frente a SQL.
 */
const NOSQL_DATASETS = {
    escuela: {
        name: 'Escuela',
        description: 'Estudiantes con sus cursos embebidos, cursos e inscripciones.',
        collections: {
            estudiantes: [
                {
                    _id: 'est-001',
                    nombre: 'Ana Torres',
                    edad: 20,
                    carrera: 'Ingeniería de Sistemas',
                    promedio: 18.5,
                    ciudad: 'Lima',
                    fecha_ingreso: '2023-03-01',
                    cursos: [
                        { codigo: 'MAT101', nombre: 'Matemática I', nota: 18 },
                        { codigo: 'PROG101', nombre: 'Programación I', nota: 19 }
                    ]
                },
                {
                    _id: 'est-002',
                    nombre: 'Luis Ramírez',
                    edad: 22,
                    carrera: 'Ingeniería de Sistemas',
                    promedio: 16.2,
                    ciudad: 'Arequipa',
                    fecha_ingreso: '2022-03-01',
                    cursos: [
                        { codigo: 'MAT101', nombre: 'Matemática I', nota: 15 },
                        { codigo: 'BD101', nombre: 'Base de Datos I', nota: 17 }
                    ]
                },
                {
                    _id: 'est-003',
                    nombre: 'María Fernández',
                    edad: 19,
                    carrera: 'Administración',
                    promedio: 17.8,
                    ciudad: 'Lima',
                    fecha_ingreso: '2024-03-01',
                    cursos: [
                        { codigo: 'ADM101', nombre: 'Fundamentos de Administración', nota: 18 },
                        { codigo: 'EST101', nombre: 'Estadística I', nota: 17 }
                    ]
                },
                {
                    _id: 'est-004',
                    nombre: 'Carlos Mendoza',
                    edad: 24,
                    carrera: 'Ingeniería de Sistemas',
                    promedio: 14.5,
                    ciudad: 'Trujillo',
                    fecha_ingreso: '2021-03-01',
                    cursos: [
                        { codigo: 'PROG101', nombre: 'Programación I', nota: 14 },
                        { codigo: 'BD101', nombre: 'Base de Datos I', nota: 15 }
                    ]
                },
                {
                    _id: 'est-005',
                    nombre: 'Sofía Vargas',
                    edad: 21,
                    carrera: 'Administración',
                    promedio: 19.1,
                    ciudad: 'Arequipa',
                    fecha_ingreso: '2023-08-01',
                    cursos: [
                        { codigo: 'ADM101', nombre: 'Fundamentos de Administración', nota: 19 },
                        { codigo: 'MKT101', nombre: 'Marketing', nota: 20 }
                    ]
                },
                {
                    _id: 'est-006',
                    nombre: 'Diego Salazar',
                    edad: 20,
                    carrera: 'Ingeniería de Sistemas',
                    promedio: 15.7,
                    ciudad: 'Lima',
                    fecha_ingreso: '2024-03-01',
                    cursos: [
                        { codigo: 'MAT101', nombre: 'Matemática I', nota: 16 },
                        { codigo: 'PROG101', nombre: 'Programación I', nota: 15 }
                    ]
                },
                {
                    _id: 'est-007',
                    nombre: 'Valeria Rojas',
                    edad: 23,
                    carrera: 'Administración',
                    promedio: 17.2,
                    ciudad: 'Cusco',
                    fecha_ingreso: '2022-08-01',
                    cursos: [
                        { codigo: 'MKT101', nombre: 'Marketing', nota: 18 },
                        { codigo: 'EST101', nombre: 'Estadística I', nota: 16 }
                    ]
                },
                {
                    _id: 'est-008',
                    nombre: 'Jorge Paredes',
                    edad: 25,
                    carrera: 'Ingeniería de Sistemas',
                    promedio: 13.9,
                    ciudad: 'Trujillo',
                    fecha_ingreso: '2020-03-01',
                    cursos: [
                        { codigo: 'BD101', nombre: 'Base de Datos I', nota: 14 },
                        { codigo: 'MAT101', nombre: 'Matemática I', nota: 13 }
                    ]
                }
            ],
            cursos: [
                { _id: 'cur-001', codigo: 'MAT101', nombre: 'Matemática I', creditos: 4, profesor: 'Rosa Medina', departamento: 'Ciencias', semestre: 1 },
                { _id: 'cur-002', codigo: 'PROG101', nombre: 'Programación I', creditos: 5, profesor: 'Hugo Salas', departamento: 'Sistemas', semestre: 1 },
                { _id: 'cur-003', codigo: 'BD101', nombre: 'Base de Datos I', creditos: 5, profesor: 'Elena Castro', departamento: 'Sistemas', semestre: 2 },
                { _id: 'cur-004', codigo: 'ADM101', nombre: 'Fundamentos de Administración', creditos: 3, profesor: 'Marco Díaz', departamento: 'Gestión', semestre: 1 },
                { _id: 'cur-005', codigo: 'EST101', nombre: 'Estadística I', creditos: 4, profesor: 'Lucía Prado', departamento: 'Ciencias', semestre: 2 },
                { _id: 'cur-006', codigo: 'MKT101', nombre: 'Marketing', creditos: 3, profesor: 'Andrea León', departamento: 'Gestión', semestre: 2 }
            ],
            inscripciones: [
                { _id: 'ins-001', estudiante_id: 'est-001', curso_codigo: 'MAT101', anio: 2025, ciclo: '2025-I', nota: 18 },
                { _id: 'ins-002', estudiante_id: 'est-001', curso_codigo: 'PROG101', anio: 2025, ciclo: '2025-I', nota: 19 },
                { _id: 'ins-003', estudiante_id: 'est-002', curso_codigo: 'MAT101', anio: 2025, ciclo: '2025-I', nota: 15 },
                { _id: 'ins-004', estudiante_id: 'est-002', curso_codigo: 'BD101', anio: 2025, ciclo: '2025-II', nota: 17 },
                { _id: 'ins-005', estudiante_id: 'est-003', curso_codigo: 'ADM101', anio: 2025, ciclo: '2025-I', nota: 18 },
                { _id: 'ins-006', estudiante_id: 'est-004', curso_codigo: 'PROG101', anio: 2024, ciclo: '2024-II', nota: 14 },
                { _id: 'ins-007', estudiante_id: 'est-005', curso_codigo: 'MKT101', anio: 2025, ciclo: '2025-I', nota: 20 },
                { _id: 'ins-008', estudiante_id: 'est-006', curso_codigo: 'MAT101', anio: 2025, ciclo: '2025-I', nota: 16 },
                { _id: 'ins-009', estudiante_id: 'est-007', curso_codigo: 'EST101', anio: 2024, ciclo: '2024-II', nota: 16 },
                { _id: 'ins-010', estudiante_id: 'est-008', curso_codigo: 'BD101', anio: 2024, ciclo: '2024-II', nota: 14 }
            ]
        }
    },
    tienda: {
        name: 'Tienda',
        description: 'Clientes, productos y pedidos con sus items embebidos.',
        collections: {
            clientes: [
                { _id: 'cli-001', nombre: 'Lucía Gómez', email: 'lucia@example.com', ciudad: 'Lima', segmento: 'premium' },
                { _id: 'cli-002', nombre: 'Mateo Ruiz', email: 'mateo@example.com', ciudad: 'Arequipa', segmento: 'regular' },
                { _id: 'cli-003', nombre: 'Elena Díaz', email: 'elena@example.com', ciudad: 'Lima', segmento: 'premium' },
                { _id: 'cli-004', nombre: 'Pablo Herrera', email: 'pablo@example.com', ciudad: 'Cusco', segmento: 'regular' },
                { _id: 'cli-005', nombre: 'Nadia Flores', email: 'nadia@example.com', ciudad: 'Trujillo', segmento: 'nuevo' }
            ],
            productos: [
                { _id: 'prod-001', nombre: 'Teclado mecánico', categoria: 'Periféricos', precio: 180, stock: 12, tags: ['tecnología', 'gaming'] },
                { _id: 'prod-002', nombre: 'Mouse inalámbrico', categoria: 'Periféricos', precio: 75, stock: 25, tags: ['tecnología', 'oficina'] },
                { _id: 'prod-003', nombre: 'Monitor 24 pulgadas', categoria: 'Pantallas', precio: 620, stock: 6, tags: ['tecnología', 'hogar'] },
                { _id: 'prod-004', nombre: 'Cuaderno A4', categoria: 'Papelería', precio: 12, stock: 80, tags: ['escolar'] },
                { _id: 'prod-005', nombre: 'Mochila urbana', categoria: 'Accesorios', precio: 95, stock: 0, tags: ['moda', 'viaje'] },
                { _id: 'prod-006', nombre: 'Lámpara LED', categoria: 'Hogar', precio: 48, stock: 18, tags: ['hogar', 'oficina'] }
            ],
            pedidos: [
                {
                    _id: 'ped-001',
                    cliente_id: 'cli-001',
                    fecha: '2026-01-12',
                    estado: 'pagado',
                    items: [
                        { producto_id: 'prod-001', cantidad: 1, precio_unitario: 180 },
                        { producto_id: 'prod-002', cantidad: 2, precio_unitario: 75 }
                    ],
                    total: 330
                },
                {
                    _id: 'ped-002',
                    cliente_id: 'cli-002',
                    fecha: '2026-01-18',
                    estado: 'pagado',
                    items: [
                        { producto_id: 'prod-004', cantidad: 10, precio_unitario: 12 }
                    ],
                    total: 120
                },
                {
                    _id: 'ped-003',
                    cliente_id: 'cli-001',
                    fecha: '2026-02-02',
                    estado: 'pendiente',
                    items: [
                        { producto_id: 'prod-003', cantidad: 1, precio_unitario: 620 }
                    ],
                    total: 620
                },
                {
                    _id: 'ped-004',
                    cliente_id: 'cli-003',
                    fecha: '2026-02-10',
                    estado: 'pagado',
                    items: [
                        { producto_id: 'prod-006', cantidad: 3, precio_unitario: 48 },
                        { producto_id: 'prod-004', cantidad: 5, precio_unitario: 12 }
                    ],
                    total: 204
                },
                {
                    _id: 'ped-005',
                    cliente_id: 'cli-004',
                    fecha: '2026-02-15',
                    estado: 'cancelado',
                    items: [
                        { producto_id: 'prod-002', cantidad: 1, precio_unitario: 75 }
                    ],
                    total: 75
                }
            ]
        }
    }
};

const NOSQL_EXAMPLES = [
    {
        category: 'Consultas',
        title: 'Ver todos los estudiantes',
        query: 'db.estudiantes.find({})'
    },
    {
        category: 'Consultas',
        title: 'Ordenar por promedio',
        query: 'db.estudiantes.find({}).sort({ promedio: -1 }).limit(5)'
    },
    {
        category: 'Filtros',
        title: 'Mayores de 20 años',
        query: 'db.estudiantes.find({ edad: { $gt: 20 } }, { nombre: 1, edad: 1, carrera: 1 })'
    },
    {
        category: 'Filtros',
        title: 'Estudiantes de Lima o Arequipa',
        query: "db.estudiantes.find({ ciudad: { $in: ['Lima', 'Arequipa'] } }, { nombre: 1, ciudad: 1 })"
    },
    {
        category: 'Filtros',
        title: 'Cursos con nota alta',
        query: "db.estudiantes.find({ 'cursos.nota': { $gte: 18 } }, { nombre: 1, cursos: 1 })"
    },
    {
        category: 'CRUD',
        title: 'Insertar un estudiante',
        query: "db.estudiantes.insertOne({ nombre: 'Nuevo Estudiante', edad: 18, carrera: 'Ingeniería de Sistemas', promedio: 16, ciudad: 'Lima', cursos: [] })"
    },
    {
        category: 'CRUD',
        title: 'Actualizar promedios',
        query: "db.estudiantes.updateMany({ carrera: 'Administración' }, { $inc: { promedio: 0.5 } })"
    },
    {
        category: 'CRUD',
        title: 'Eliminar un documento',
        query: "db.estudiantes.deleteOne({ _id: 'est-008' })"
    },
    {
        category: 'Agregación',
        title: 'Promedio por carrera',
        query: "db.estudiantes.aggregate([{ $group: { _id: '$carrera', estudiantes: { $sum: 1 }, promedio: { $avg: '$promedio' } } }, { $sort: { promedio: -1 } }])"
    },
    {
        category: 'Agregación',
        title: 'Ciudades con más estudiantes',
        query: "db.estudiantes.aggregate([{ $group: { _id: '$ciudad', total: { $sum: 1 } } }, { $sort: { total: -1 } }])"
    },
    {
        category: 'Tienda',
        title: 'Productos con stock bajo',
        query: 'db.productos.find({ stock: { $lte: 10 } }, { nombre: 1, categoria: 1, precio: 1, stock: 1 })'
    },
    {
        category: 'Tienda',
        title: 'Pedidos con items de más de 2 unidades',
        query: "db.pedidos.find({ 'items.cantidad': { $gte: 2 } }, { cliente_id: 1, fecha: 1, total: 1 })"
    },
    {
        category: 'Tienda',
        title: 'Ventas por estado',
        query: "db.pedidos.aggregate([{ $group: { _id: '$estado', pedidos: { $sum: 1 }, total: { $sum: '$total' } } }, { $sort: { total: -1 } }])"
    }
];

const NOSQL_CHALLENGES = [
    {
        id: 'nosql-promedios',
        title: 'Promedios destacados',
        level: 'Básico',
        description: 'Encuentra a los estudiantes con promedio mayor o igual a 17 y ordénalos de mayor a menor. Devuelve solo nombre, carrera y promedio.',
        hint: 'Usa find con el operador $gte y encadena sort({ promedio: -1 }).',
        starter: 'db.estudiantes.find({ promedio: { $gte: 17 } }, { nombre: 1, carrera: 1, promedio: 1 })',
        expectedIds: ['est-001', 'est-003', 'est-005', 'est-007']
    },
    {
        id: 'nosql-ciudades',
        title: 'Ciudades con más estudiantes',
        level: 'Intermedio',
        description: 'Agrupa a los estudiantes por ciudad y cuenta cuántos hay en cada una. Ordena el resultado de mayor a menor por cantidad.',
        hint: 'Usa aggregate con $group, $sum y $sort.',
        starter: "db.estudiantes.aggregate([{ $group: { _id: '$ciudad', total: { $sum: 1 } } }, { $sort: { total: -1 } }])",
        expectedCities: ['Lima', 'Arequipa', 'Trujillo', 'Cusco']
    },
    {
        id: 'nosql-cursos',
        title: 'Cursos con nota sobresaliente',
        level: 'Avanzado',
        description: 'Encuentra los estudiantes que tengan al menos un curso con nota mayor o igual a 18. Devuelve nombre y el arreglo de cursos.',
        hint: 'Puedes consultar un campo dentro de un arreglo con la ruta cursos.nota y el operador $gte.',
        starter: "db.estudiantes.find({ 'cursos.nota': { $gte: 18 } }, { nombre: 1, cursos: 1 })",
        expectedIds: ['est-001', 'est-003', 'est-005', 'est-007']
    }
];

if (typeof window !== 'undefined') {
    window.NOSQL_DATASETS = NOSQL_DATASETS;
    window.NOSQL_EXAMPLES = NOSQL_EXAMPLES;
    window.NOSQL_CHALLENGES = NOSQL_CHALLENGES;
}
