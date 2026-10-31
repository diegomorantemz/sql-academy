/**
 * Datasets del laboratorio NoSQL.
 *
 * Los documentos usan _id de tipo texto para que sean fáciles de leer y de
 * comparar en los ejemplos. La estructura es deliberadamente denormalizada:
 * los cursos de un estudiante, los items de un pedido y los datos del libro
 * en un préstamo viven dentro del documento principal para mostrar una
 * diferencia clave frente a SQL.
 *
 * Cada ejemplo y reto declara su dataset para que la interfaz muestre solo el
 * contenido del dataset activo.
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
                        { producto_id: 'prod-001', producto_nombre: 'Teclado mecánico', cantidad: 1, precio_unitario: 180 },
                        { producto_id: 'prod-002', producto_nombre: 'Mouse inalámbrico', cantidad: 2, precio_unitario: 75 }
                    ],
                    total: 330
                },
                {
                    _id: 'ped-002',
                    cliente_id: 'cli-002',
                    fecha: '2026-01-18',
                    estado: 'pagado',
                    items: [
                        { producto_id: 'prod-004', producto_nombre: 'Cuaderno A4', cantidad: 10, precio_unitario: 12 }
                    ],
                    total: 120
                },
                {
                    _id: 'ped-003',
                    cliente_id: 'cli-001',
                    fecha: '2026-02-02',
                    estado: 'pendiente',
                    items: [
                        { producto_id: 'prod-003', producto_nombre: 'Monitor 24 pulgadas', cantidad: 1, precio_unitario: 620 }
                    ],
                    total: 620
                },
                {
                    _id: 'ped-004',
                    cliente_id: 'cli-003',
                    fecha: '2026-02-10',
                    estado: 'pagado',
                    items: [
                        { producto_id: 'prod-006', producto_nombre: 'Lámpara LED', cantidad: 3, precio_unitario: 48 },
                        { producto_id: 'prod-004', producto_nombre: 'Cuaderno A4', cantidad: 5, precio_unitario: 12 }
                    ],
                    total: 204
                },
                {
                    _id: 'ped-005',
                    cliente_id: 'cli-004',
                    fecha: '2026-02-15',
                    estado: 'cancelado',
                    items: [
                        { producto_id: 'prod-002', producto_nombre: 'Mouse inalámbrico', cantidad: 1, precio_unitario: 75 }
                    ],
                    total: 75
                }
            ]
        }
    },
    biblioteca: {
        name: 'Biblioteca',
        description: 'Libros con autores embebidos, socios y préstamos con multas.',
        collections: {
            libros: [
                {
                    _id: 'lib-001',
                    titulo: 'Cien años de soledad',
                    autor: { nombre: 'Gabriel García Márquez', nacionalidad: 'Colombia' },
                    genero: 'Realismo mágico',
                    anio: 1967,
                    ejemplares: 4,
                    disponibles: 2,
                    tags: ['clásico', 'latinoamericano']
                },
                {
                    _id: 'lib-002',
                    titulo: 'La ciudad y los perros',
                    autor: { nombre: 'Mario Vargas Llosa', nacionalidad: 'Perú' },
                    genero: 'Novela',
                    anio: 1963,
                    ejemplares: 3,
                    disponibles: 0,
                    tags: ['clásico', 'peruano']
                },
                {
                    _id: 'lib-003',
                    titulo: 'El principito',
                    autor: { nombre: 'Antoine de Saint-Exupéry', nacionalidad: 'Francia' },
                    genero: 'Fábula',
                    anio: 1943,
                    ejemplares: 5,
                    disponibles: 3,
                    tags: ['infantil', 'clásico']
                },
                {
                    _id: 'lib-004',
                    titulo: 'Sapiens',
                    autor: { nombre: 'Yuval Noah Harari', nacionalidad: 'Israel' },
                    genero: 'Historia',
                    anio: 2011,
                    ejemplares: 2,
                    disponibles: 1,
                    tags: ['divulgación', 'historia']
                },
                {
                    _id: 'lib-005',
                    titulo: 'Clean Code',
                    autor: { nombre: 'Robert C. Martin', nacionalidad: 'Estados Unidos' },
                    genero: 'Tecnología',
                    anio: 2008,
                    ejemplares: 3,
                    disponibles: 2,
                    tags: ['programación', 'ingeniería']
                },
                {
                    _id: 'lib-006',
                    titulo: 'Dune',
                    autor: { nombre: 'Frank Herbert', nacionalidad: 'Estados Unidos' },
                    genero: 'Ciencia ficción',
                    anio: 1965,
                    ejemplares: 4,
                    disponibles: 0,
                    tags: ['ciencia ficción', 'clásico']
                },
                {
                    _id: 'lib-007',
                    titulo: 'Rayuela',
                    autor: { nombre: 'Julio Cortázar', nacionalidad: 'Argentina' },
                    genero: 'Novela',
                    anio: 1963,
                    ejemplares: 2,
                    disponibles: 1,
                    tags: ['latinoamericano', 'clásico']
                },
                {
                    _id: 'lib-008',
                    titulo: 'Breves respuestas a las grandes preguntas',
                    autor: { nombre: 'Stephen Hawking', nacionalidad: 'Reino Unido' },
                    genero: 'Divulgación científica',
                    anio: 2018,
                    ejemplares: 3,
                    disponibles: 2,
                    tags: ['ciencia', 'divulgación']
                }
            ],
            socios: [
                { _id: 'soc-001', nombre: 'Ana Torres', email: 'ana@example.com', ciudad: 'Lima', membresia: 'premium', activo: true, fecha_alta: '2024-02-10' },
                { _id: 'soc-002', nombre: 'Luis Ramírez', email: 'luis@example.com', ciudad: 'Arequipa', membresia: 'regular', activo: true, fecha_alta: '2023-08-15' },
                { _id: 'soc-003', nombre: 'María Fernández', email: 'maria@example.com', ciudad: 'Lima', membresia: 'premium', activo: true, fecha_alta: '2024-01-20' },
                { _id: 'soc-004', nombre: 'Carlos Mendoza', email: 'carlos@example.com', ciudad: 'Trujillo', membresia: 'estudiante', activo: true, fecha_alta: '2025-03-05' },
                { _id: 'soc-005', nombre: 'Sofía Vargas', email: 'sofia@example.com', ciudad: 'Cusco', membresia: 'regular', activo: false, fecha_alta: '2022-11-12' },
                { _id: 'soc-006', nombre: 'Diego Salazar', email: 'diego@example.com', ciudad: 'Lima', membresia: 'estudiante', activo: true, fecha_alta: '2025-06-01' }
            ],
            prestamos: [
                {
                    _id: 'pre-001',
                    libro_id: 'lib-001',
                    libro_titulo: 'Cien años de soledad',
                    socio_id: 'soc-001',
                    socio_nombre: 'Ana Torres',
                    fecha_prestamo: '2026-01-05',
                    fecha_devolucion: '2026-01-19',
                    estado: 'devuelto',
                    multa: 0,
                    mes: '2026-01'
                },
                {
                    _id: 'pre-002',
                    libro_id: 'lib-002',
                    libro_titulo: 'La ciudad y los perros',
                    socio_id: 'soc-002',
                    socio_nombre: 'Luis Ramírez',
                    fecha_prestamo: '2026-01-10',
                    fecha_devolucion: '2026-01-24',
                    estado: 'devuelto',
                    multa: 0,
                    mes: '2026-01'
                },
                {
                    _id: 'pre-003',
                    libro_id: 'lib-003',
                    libro_titulo: 'El principito',
                    socio_id: 'soc-003',
                    socio_nombre: 'María Fernández',
                    fecha_prestamo: '2026-01-15',
                    fecha_devolucion: '2026-01-29',
                    estado: 'devuelto',
                    multa: 0,
                    mes: '2026-01'
                },
                {
                    _id: 'pre-004',
                    libro_id: 'lib-001',
                    libro_titulo: 'Cien años de soledad',
                    socio_id: 'soc-004',
                    socio_nombre: 'Carlos Mendoza',
                    fecha_prestamo: '2026-02-02',
                    fecha_devolucion: '2026-02-16',
                    estado: 'devuelto',
                    multa: 0,
                    mes: '2026-02'
                },
                {
                    _id: 'pre-005',
                    libro_id: 'lib-006',
                    libro_titulo: 'Dune',
                    socio_id: 'soc-001',
                    socio_nombre: 'Ana Torres',
                    fecha_prestamo: '2026-02-10',
                    fecha_devolucion: '2026-02-24',
                    estado: 'vencido',
                    multa: 12,
                    mes: '2026-02'
                },
                {
                    _id: 'pre-006',
                    libro_id: 'lib-004',
                    libro_titulo: 'Sapiens',
                    socio_id: 'soc-005',
                    socio_nombre: 'Sofía Vargas',
                    fecha_prestamo: '2026-02-14',
                    fecha_devolucion: '2026-02-28',
                    estado: 'vencido',
                    multa: 8,
                    mes: '2026-02'
                },
                {
                    _id: 'pre-007',
                    libro_id: 'lib-005',
                    libro_titulo: 'Clean Code',
                    socio_id: 'soc-006',
                    socio_nombre: 'Diego Salazar',
                    fecha_prestamo: '2026-03-01',
                    fecha_devolucion: '2026-03-15',
                    estado: 'activo',
                    multa: 0,
                    mes: '2026-03'
                },
                {
                    _id: 'pre-008',
                    libro_id: 'lib-003',
                    libro_titulo: 'El principito',
                    socio_id: 'soc-001',
                    socio_nombre: 'Ana Torres',
                    fecha_prestamo: '2026-03-05',
                    fecha_devolucion: '2026-03-19',
                    estado: 'activo',
                    multa: 0,
                    mes: '2026-03'
                },
                {
                    _id: 'pre-009',
                    libro_id: 'lib-007',
                    libro_titulo: 'Rayuela',
                    socio_id: 'soc-003',
                    socio_nombre: 'María Fernández',
                    fecha_prestamo: '2026-03-10',
                    fecha_devolucion: '2026-03-24',
                    estado: 'devuelto',
                    multa: 0,
                    mes: '2026-03'
                },
                {
                    _id: 'pre-010',
                    libro_id: 'lib-006',
                    libro_titulo: 'Dune',
                    socio_id: 'soc-002',
                    socio_nombre: 'Luis Ramírez',
                    fecha_prestamo: '2026-03-12',
                    fecha_devolucion: '2026-03-26',
                    estado: 'vencido',
                    multa: 15,
                    mes: '2026-03'
                },
                {
                    _id: 'pre-011',
                    libro_id: 'lib-001',
                    libro_titulo: 'Cien años de soledad',
                    socio_id: 'soc-003',
                    socio_nombre: 'María Fernández',
                    fecha_prestamo: '2026-03-15',
                    fecha_devolucion: '2026-03-29',
                    estado: 'activo',
                    multa: 0,
                    mes: '2026-03'
                }
            ]
        }
    }
};

const NOSQL_EXAMPLES = [
    {
        dataset: 'escuela',
        category: 'Consultas',
        title: 'Ver todos los estudiantes',
        query: 'db.estudiantes.find({})'
    },
    {
        dataset: 'escuela',
        category: 'Consultas',
        title: 'Ordenar por promedio',
        query: 'db.estudiantes.find({}).sort({ promedio: -1 }).limit(5)'
    },
    {
        dataset: 'escuela',
        category: 'Consultas',
        title: 'Buscar un estudiante por _id',
        query: "db.estudiantes.findOne({ _id: 'est-001' })"
    },
    {
        dataset: 'escuela',
        category: 'Filtros',
        title: 'Mayores de 20 años',
        query: 'db.estudiantes.find({ edad: { $gt: 20 } }, { nombre: 1, edad: 1, carrera: 1 })'
    },
    {
        dataset: 'escuela',
        category: 'Filtros',
        title: 'Estudiantes de Lima o Arequipa',
        query: "db.estudiantes.find({ ciudad: { $in: ['Lima', 'Arequipa'] } }, { nombre: 1, ciudad: 1 })"
    },
    {
        dataset: 'escuela',
        category: 'Filtros',
        title: 'Cursos con nota alta',
        query: "db.estudiantes.find({ 'cursos.nota': { $gte: 18 } }, { nombre: 1, cursos: 1 })"
    },
    {
        dataset: 'escuela',
        category: 'CRUD',
        title: 'Insertar un estudiante',
        query: "db.estudiantes.insertOne({ nombre: 'Nuevo Estudiante', edad: 18, carrera: 'Ingeniería de Sistemas', promedio: 16, ciudad: 'Lima', cursos: [] })"
    },
    {
        dataset: 'escuela',
        category: 'CRUD',
        title: 'Actualizar promedios',
        query: "db.estudiantes.updateMany({ carrera: 'Administración' }, { $inc: { promedio: 0.5 } })"
    },
    {
        dataset: 'escuela',
        category: 'CRUD',
        title: 'Eliminar un documento',
        query: "db.estudiantes.deleteOne({ _id: 'est-008' })"
    },
    {
        dataset: 'escuela',
        category: 'Agregación',
        title: 'Promedio por carrera',
        query: "db.estudiantes.aggregate([{ $group: { _id: '$carrera', estudiantes: { $sum: 1 }, promedio: { $avg: '$promedio' } } }, { $sort: { promedio: -1 } }])"
    },
    {
        dataset: 'escuela',
        category: 'Agregación',
        title: 'Ciudades con más estudiantes',
        query: "db.estudiantes.aggregate([{ $group: { _id: '$ciudad', total: { $sum: 1 } } }, { $sort: { total: -1 } }])"
    },
    {
        dataset: 'escuela',
        category: 'Agregación',
        title: 'Cursos por departamento',
        query: "db.cursos.aggregate([{ $group: { _id: '$departamento', cursos: { $sum: 1 }, creditos: { $sum: '$creditos' } } }, { $sort: { cursos: -1, _id: 1 } }])"
    },
    {
        dataset: 'tienda',
        category: 'Consultas',
        title: 'Ver todos los productos',
        query: 'db.productos.find({})'
    },
    {
        dataset: 'tienda',
        category: 'Filtros',
        title: 'Productos con stock bajo',
        query: 'db.productos.find({ stock: { $lte: 10 } }, { nombre: 1, categoria: 1, precio: 1, stock: 1 })'
    },
    {
        dataset: 'tienda',
        category: 'Filtros',
        title: 'Clientes premium',
        query: "db.clientes.find({ segmento: 'premium' }, { nombre: 1, ciudad: 1, segmento: 1 })"
    },
    {
        dataset: 'tienda',
        category: 'Filtros',
        title: 'Pedidos con items de más de 2 unidades',
        query: "db.pedidos.find({ 'items.cantidad': { $gte: 2 } }, { cliente_id: 1, fecha: 1, total: 1 })"
    },
    {
        dataset: 'tienda',
        category: 'Agregación',
        title: 'Ventas por estado',
        query: "db.pedidos.aggregate([{ $group: { _id: '$estado', pedidos: { $sum: 1 }, total: { $sum: '$total' } } }, { $sort: { total: -1 } }])"
    },
    {
        dataset: 'tienda',
        category: 'Agregación',
        title: 'Productos más vendidos',
        query: "db.pedidos.aggregate([{ $unwind: '$items' }, { $group: { _id: '$items.producto_nombre', unidades: { $sum: '$items.cantidad' } } }, { $sort: { unidades: -1, _id: 1 } }, { $limit: 3 }])"
    },
    {
        dataset: 'tienda',
        category: 'CRUD',
        title: 'Insertar un producto',
        query: "db.productos.insertOne({ nombre: 'Webcam HD', categoria: 'Periféricos', precio: 140, stock: 10, tags: ['tecnología', 'oficina'] })"
    },
    {
        dataset: 'tienda',
        category: 'CRUD',
        title: 'Actualizar stock',
        query: "db.productos.updateOne({ _id: 'prod-005' }, { $inc: { stock: 10 } })"
    },
    {
        dataset: 'biblioteca',
        category: 'Consultas',
        title: 'Ver todos los libros',
        query: 'db.libros.find({})'
    },
    {
        dataset: 'biblioteca',
        category: 'Filtros',
        title: 'Libros disponibles',
        query: 'db.libros.find({ disponibles: { $gt: 0 } }, { titulo: 1, autor: 1, disponibles: 1 })'
    },
    {
        dataset: 'biblioteca',
        category: 'Filtros',
        title: 'Libros de novela',
        query: "db.libros.find({ genero: 'Novela' }, { titulo: 1, autor: 1, anio: 1 })"
    },
    {
        dataset: 'biblioteca',
        category: 'Filtros',
        title: 'Socios premium activos',
        query: "db.socios.find({ membresia: 'premium', activo: true }, { nombre: 1, ciudad: 1, membresia: 1 })"
    },
    {
        dataset: 'biblioteca',
        category: 'Agregación',
        title: 'Préstamos por estado',
        query: "db.prestamos.aggregate([{ $group: { _id: '$estado', prestamos: { $sum: 1 }, multas: { $sum: '$multa' } } }, { $sort: { prestamos: -1, _id: 1 } }])"
    },
    {
        dataset: 'biblioteca',
        category: 'Agregación',
        title: 'Libros más prestados',
        query: "db.prestamos.aggregate([{ $group: { _id: '$libro_titulo', prestamos: { $sum: 1 } } }, { $sort: { prestamos: -1, _id: 1 } }, { $limit: 3 }])"
    },
    {
        dataset: 'biblioteca',
        category: 'CRUD',
        title: 'Insertar un libro',
        query: "db.libros.insertOne({ titulo: 'Nuevo libro', autor: { nombre: 'Autor Ejemplo', nacionalidad: 'Perú' }, genero: 'Ensayo', anio: 2026, ejemplares: 2, disponibles: 2, tags: ['nuevo'] })"
    },
    {
        dataset: 'biblioteca',
        category: 'CRUD',
        title: 'Actualizar disponibilidad',
        query: "db.libros.updateOne({ _id: 'lib-001' }, { $inc: { disponibles: -1 } })"
    }
];

const NOSQL_CHALLENGES = [
    {
        dataset: 'escuela',
        id: 'nosql-promedios',
        title: 'Promedios destacados',
        level: 'Básico',
        description: 'Encuentra a los estudiantes con promedio mayor o igual a 17 y ordénalos de mayor a menor. Devuelve solo nombre, carrera y promedio.',
        hint: 'Usa find con el operador $gte y encadena sort({ promedio: -1 }).',
        starter: "db.estudiantes.find({ promedio: { $gte: 17 } }, { nombre: 1, carrera: 1, promedio: 1 }).sort({ promedio: -1 })",
        expectedValues: ['est-005', 'est-001', 'est-003', 'est-007'],
        expectedField: '_id'
    },
    {
        dataset: 'escuela',
        id: 'nosql-ciudades',
        title: 'Ciudades con más estudiantes',
        level: 'Intermedio',
        description: 'Agrupa a los estudiantes por ciudad y cuenta cuántos hay en cada una. Ordena el resultado de mayor a menor por cantidad.',
        hint: 'Usa aggregate con $group, $sum y $sort.',
        starter: "db.estudiantes.aggregate([{ $group: { _id: '$ciudad', total: { $sum: 1 } } }, { $sort: { total: -1, _id: 1 } }])",
        expectedValues: ['Lima', 'Arequipa', 'Trujillo', 'Cusco'],
        expectedField: '_id'
    },
    {
        dataset: 'escuela',
        id: 'nosql-cursos',
        title: 'Cursos con nota sobresaliente',
        level: 'Avanzado',
        description: 'Encuentra los estudiantes que tengan al menos un curso con nota mayor o igual a 18. Devuelve nombre y el arreglo de cursos.',
        hint: 'Puedes consultar un campo dentro de un arreglo con la ruta cursos.nota y el operador $gte.',
        starter: "db.estudiantes.find({ 'cursos.nota': { $gte: 18 } }, { nombre: 1, cursos: 1 })",
        expectedIds: ['est-001', 'est-003', 'est-005', 'est-007']
    },
    {
        dataset: 'escuela',
        id: 'nosql-cursos-cinco-creditos',
        title: 'Cursos de cinco créditos',
        level: 'Básico',
        description: 'Encuentra los cursos que otorgan 5 créditos. Devuelve código, nombre y créditos.',
        hint: 'Filtra por el campo creditos con el valor 5.',
        starter: 'db.cursos.find({ creditos: 5 }, { codigo: 1, nombre: 1, creditos: 1 })',
        expectedIds: ['cur-002', 'cur-003']
    },
    {
        dataset: 'escuela',
        id: 'nosql-estudiantes-carrera',
        title: 'Estudiantes por carrera',
        level: 'Avanzado',
        description: 'Agrupa a los estudiantes por carrera, cuenta cuántos hay y ordena de mayor a menor por cantidad. En empate, ordena por nombre de carrera.',
        hint: 'Usa aggregate con $group, $sum y $sort con dos campos.',
        starter: "db.estudiantes.aggregate([{ $group: { _id: '$carrera', estudiantes: { $sum: 1 } } }, { $sort: { estudiantes: -1, _id: 1 } }])",
        expectedRows: [
            { _id: 'Ingeniería de Sistemas', estudiantes: 5 },
            { _id: 'Administración', estudiantes: 3 }
        ]
    },
    {
        dataset: 'tienda',
        id: 'nosql-tienda-stock',
        title: 'Stock bajo',
        level: 'Básico',
        description: 'Encuentra los productos con 10 unidades o menos. Devuelve nombre, categoría, precio y stock.',
        hint: 'Usa find con el operador $lte.',
        starter: 'db.productos.find({ stock: { $lte: 10 } }, { nombre: 1, categoria: 1, precio: 1, stock: 1 })',
        expectedIds: ['prod-003', 'prod-005']
    },
    {
        dataset: 'tienda',
        id: 'nosql-tienda-premium',
        title: 'Clientes premium',
        level: 'Básico',
        description: 'Encuentra los clientes del segmento premium. Devuelve nombre, ciudad y segmento.',
        hint: 'Filtra por el campo segmento.',
        starter: "db.clientes.find({ segmento: 'premium' }, { nombre: 1, ciudad: 1, segmento: 1 })",
        expectedIds: ['cli-001', 'cli-003']
    },
    {
        dataset: 'tienda',
        id: 'nosql-tienda-ventas',
        title: 'Ventas por estado',
        level: 'Intermedio',
        description: 'Agrupa los pedidos por estado, cuenta cuántos hay y suma el total. Ordena de mayor a menor por total.',
        hint: 'Usa $group con $sum y $sort.',
        starter: "db.pedidos.aggregate([{ $group: { _id: '$estado', pedidos: { $sum: 1 }, total: { $sum: '$total' } } }, { $sort: { total: -1 } }])",
        expectedRows: [
            { _id: 'pagado', pedidos: 3, total: 654 },
            { _id: 'pendiente', pedidos: 1, total: 620 },
            { _id: 'cancelado', pedidos: 1, total: 75 }
        ]
    },
    {
        dataset: 'tienda',
        id: 'nosql-tienda-top-productos',
        title: 'Productos más vendidos',
        level: 'Avanzado',
        description: 'Descompón los items de los pedidos, suma las unidades vendidas por producto y muestra los 3 primeros. Ordena de mayor a menor por unidades y, en empate, por nombre.',
        hint: 'Usa $unwind sobre items, $group por items.producto_nombre, $sum de items.cantidad y $sort con dos campos.',
        starter: "db.pedidos.aggregate([{ $unwind: '$items' }, { $group: { _id: '$items.producto_nombre', unidades: { $sum: '$items.cantidad' } } }, { $sort: { unidades: -1, _id: 1 } }, { $limit: 3 }])",
        expectedRows: [
            { _id: 'Cuaderno A4', unidades: 15 },
            { _id: 'Lámpara LED', unidades: 3 },
            { _id: 'Mouse inalámbrico', unidades: 3 }
        ]
    },
    {
        dataset: 'biblioteca',
        id: 'nosql-biblioteca-disponibles',
        title: 'Libros disponibles',
        level: 'Básico',
        description: 'Encuentra los libros con al menos un ejemplar disponible. Devuelve título, autor y disponibles.',
        hint: 'Usa el campo disponibles con el operador $gt.',
        starter: 'db.libros.find({ disponibles: { $gt: 0 } }, { titulo: 1, autor: 1, disponibles: 1 })',
        expectedIds: ['lib-001', 'lib-003', 'lib-004', 'lib-005', 'lib-007', 'lib-008']
    },
    {
        dataset: 'biblioteca',
        id: 'nosql-biblioteca-premium',
        title: 'Socios premium',
        level: 'Básico',
        description: 'Encuentra los socios con membresía premium que estén activos. Devuelve nombre, ciudad y membresía.',
        hint: 'Combina dos condiciones en el filtro.',
        starter: "db.socios.find({ membresia: 'premium', activo: true }, { nombre: 1, ciudad: 1, membresia: 1 })",
        expectedIds: ['soc-001', 'soc-003']
    },
    {
        dataset: 'biblioteca',
        id: 'nosql-biblioteca-prestamos',
        title: 'Préstamos por estado',
        level: 'Intermedio',
        description: 'Agrupa los préstamos por estado, cuenta cuántos hay y suma las multas. Ordena de mayor a menor por cantidad de préstamos.',
        hint: 'Usa $group con $sum y $sort.',
        starter: "db.prestamos.aggregate([{ $group: { _id: '$estado', prestamos: { $sum: 1 }, multas: { $sum: '$multa' } } }, { $sort: { prestamos: -1, _id: 1 } }])",
        expectedRows: [
            { _id: 'devuelto', prestamos: 5, multas: 0 },
            { _id: 'activo', prestamos: 3, multas: 0 },
            { _id: 'vencido', prestamos: 3, multas: 35 }
        ]
    },
    {
        dataset: 'biblioteca',
        id: 'nosql-biblioteca-top-libros',
        title: 'Libros más prestados',
        level: 'Avanzado',
        description: 'Agrupa los préstamos por título, cuenta cuántas veces se prestó cada libro y muestra los 3 primeros. Ordena de mayor a menor y, en empate, por título.',
        hint: 'Usa $group por libro_titulo, $sum, $sort con dos campos y $limit.',
        starter: "db.prestamos.aggregate([{ $group: { _id: '$libro_titulo', prestamos: { $sum: 1 } } }, { $sort: { prestamos: -1, _id: 1 } }, { $limit: 3 }])",
        expectedRows: [
            { _id: 'Cien años de soledad', prestamos: 3 },
            { _id: 'Dune', prestamos: 2 },
            { _id: 'El principito', prestamos: 2 }
        ]
    }
];

function valuesEqual(left, right) {
    if (typeof left === 'number' && typeof right === 'number') {
        return Math.abs(left - right) < 0.0001;
    }
    return JSON.stringify(left) === JSON.stringify(right);
}

function validateNoSQLChallenge(challenge, result) {
    if (!challenge) {
        return { ok: false, message: 'No se encontró el reto.' };
    }

    if (!result || !['find', 'aggregate'].includes(result.type)) {
        return { ok: false, message: 'Este reto se comprueba con una consulta de lectura: find o aggregate.' };
    }

    const documents = Array.isArray(result.documents) ? result.documents : [];

    if (Array.isArray(challenge.expectedIds)) {
        const actual = documents.map(document => document._id).filter(Boolean).sort();
        const expected = challenge.expectedIds.slice().sort();
        const ok = actual.length === expected.length && actual.every((id, index) => id === expected[index]);
        return {
            ok,
            message: ok
                ? '¡Correcto! Encontraste todos los documentos esperados.'
                : `Aún no coincide. Se esperaban ${expected.length} documentos y obtuviste ${actual.length}. Revisa el filtro y la proyección.`
        };
    }

    if (Array.isArray(challenge.expectedRows)) {
        const fields = challenge.expectedRows.length ? Object.keys(challenge.expectedRows[0]) : [];
        const actualRows = documents.map(document => fields.map(field => document[field]));
        const expectedRows = challenge.expectedRows.map(row => fields.map(field => row[field]));
        const ok = actualRows.length === expectedRows.length
            && actualRows.every((row, rowIndex) => row.every((value, valueIndex) => valuesEqual(value, expectedRows[rowIndex][valueIndex])));
        return {
            ok,
            message: ok
                ? '¡Correcto! La agrupación, los cálculos y el orden son correctos.'
                : `Aún no coincide. Se esperaban ${expectedRows.length} filas y obtuviste ${actualRows.length}. Revisa $group, los acumuladores y $sort.`
        };
    }

    if (Array.isArray(challenge.expectedValues)) {
        const field = challenge.expectedField || '_id';
        const actual = documents.map(document => document[field]);
        const expected = challenge.expectedValues;
        const ok = actual.length === expected.length
            && actual.every((value, index) => valuesEqual(value, expected[index]));
        return {
            ok,
            message: ok
                ? '¡Correcto! Los valores y el orden son correctos.'
                : `Aún no coincide. Se esperaban ${expected.length} valores y obtuviste ${actual.length}. Revisa el filtro, la agrupación y el orden.`
        };
    }

    return { ok: false, message: 'Este reto no tiene un validador configurado.' };
}

function getNoSQLExamplesForDataset(datasetName) {
    return NOSQL_EXAMPLES.filter(example => example.dataset === datasetName);
}

function getNoSQLChallengesForDataset(datasetName) {
    return NOSQL_CHALLENGES.filter(challenge => challenge.dataset === datasetName);
}

if (typeof window !== 'undefined') {
    window.NOSQL_DATASETS = NOSQL_DATASETS;
    window.NOSQL_EXAMPLES = NOSQL_EXAMPLES;
    window.NOSQL_CHALLENGES = NOSQL_CHALLENGES;
    window.getNoSQLExamplesForDataset = getNoSQLExamplesForDataset;
    window.getNoSQLChallengesForDataset = getNoSQLChallengesForDataset;
    window.validateNoSQLChallenge = validateNoSQLChallenge;
}
