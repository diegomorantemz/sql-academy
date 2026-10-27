// Datasets adicionales para practicar SQL. Se cargan bajo demanda en el navegador.
window.SQL_ACADEMY_DATASETS = {
    tienda: {
        name: 'Tienda',
        description: 'Clientes, productos, pedidos y detalle de pedidos.',
        sql: `
            CREATE TABLE clientes (
                id INTEGER PRIMARY KEY,
                nombre TEXT NOT NULL,
                ciudad TEXT,
                email TEXT
            );
            INSERT INTO clientes VALUES
                (1, 'Ana Torres', 'Lima', 'ana@example.com'),
                (2, 'Bruno Diaz', 'Arequipa', 'bruno@example.com'),
                (3, 'Carla Ruiz', 'Cusco', 'carla@example.com'),
                (4, 'Diego Paz', 'Lima', 'diego@example.com'),
                (5, 'Elena Soto', 'Trujillo', 'elena@example.com'),
                (6, 'Felipe Rojas', 'Arequipa', 'felipe@example.com');

            CREATE TABLE productos (
                id INTEGER PRIMARY KEY,
                nombre TEXT NOT NULL,
                categoria TEXT,
                precio REAL,
                stock INTEGER
            );
            INSERT INTO productos VALUES
                (1, 'Teclado mecanico', 'Perifericos', 45.90, 18),
                (2, 'Mouse inalambrico', 'Perifericos', 25.50, 30),
                (3, 'Monitor 24 pulgadas', 'Pantallas', 180.00, 10),
                (4, 'Laptop 14 pulgadas', 'Computadoras', 850.00, 6),
                (5, 'Audifonos Bluetooth', 'Audio', 65.00, 22),
                (6, 'Webcam HD', 'Perifericos', 39.90, 14),
                (7, 'Disco SSD 1TB', 'Almacenamiento', 120.00, 12),
                (8, 'Silla ergonomica', 'Muebles', 210.00, 4);

            CREATE TABLE pedidos (
                id INTEGER PRIMARY KEY,
                cliente_id INTEGER,
                fecha TEXT,
                estado TEXT,
                FOREIGN KEY (cliente_id) REFERENCES clientes(id)
            );
            INSERT INTO pedidos VALUES
                (1, 1, '2024-01-10', 'pagado'),
                (2, 1, '2024-02-05', 'pagado'),
                (3, 2, '2024-02-12', 'pendiente'),
                (4, 3, '2024-03-01', 'pagado'),
                (5, 4, '2024-03-15', 'cancelado'),
                (6, 5, '2024-04-02', 'pagado'),
                (7, 6, '2024-04-20', 'pendiente');

            CREATE TABLE detalle_pedidos (
                id INTEGER PRIMARY KEY,
                pedido_id INTEGER,
                producto_id INTEGER,
                cantidad INTEGER,
                precio_unitario REAL,
                FOREIGN KEY (pedido_id) REFERENCES pedidos(id),
                FOREIGN KEY (producto_id) REFERENCES productos(id)
            );
            INSERT INTO detalle_pedidos VALUES
                (1, 1, 1, 1, 45.90),
                (2, 1, 2, 2, 25.50),
                (3, 2, 5, 1, 65.00),
                (4, 2, 6, 1, 39.90),
                (5, 3, 3, 1, 180.00),
                (6, 4, 4, 1, 850.00),
                (7, 4, 7, 2, 120.00),
                (8, 5, 2, 1, 25.50),
                (9, 6, 1, 2, 45.90),
                (10, 6, 5, 1, 65.00),
                (11, 6, 8, 1, 210.00),
                (12, 7, 3, 1, 180.00),
                (13, 7, 6, 2, 39.90),
                (14, 7, 7, 1, 120.00);
        `
    },

    biblioteca: {
        name: 'Biblioteca',
        description: 'Autores, libros, socios y prestamos.',
        sql: `
            CREATE TABLE autores (
                id INTEGER PRIMARY KEY,
                nombre TEXT NOT NULL,
                pais TEXT
            );
            INSERT INTO autores VALUES
                (1, 'Gabriel Garcia Marquez', 'Colombia'),
                (2, 'Jorge Luis Borges', 'Argentina'),
                (3, 'Isabel Allende', 'Chile'),
                (4, 'Mario Vargas Llosa', 'Peru');

            CREATE TABLE libros (
                id INTEGER PRIMARY KEY,
                titulo TEXT NOT NULL,
                autor_id INTEGER,
                anio INTEGER,
                genero TEXT,
                disponible INTEGER DEFAULT 1,
                FOREIGN KEY (autor_id) REFERENCES autores(id)
            );
            INSERT INTO libros VALUES
                (1, 'Cien anos de soledad', 1, 1967, 'Novela', 1),
                (2, 'El amor en los tiempos del colera', 1, 1985, 'Novela', 0),
                (3, 'Ficciones', 2, 1944, 'Cuento', 1),
                (4, 'El aleph', 2, 1949, 'Cuento', 0),
                (5, 'La casa de los espiritus', 3, 1982, 'Novela', 1),
                (6, 'Eva Luna', 3, 1987, 'Novela', 1),
                (7, 'La ciudad y los perros', 4, 1963, 'Novela', 0),
                (8, 'Conversacion en La Catedral', 4, 1969, 'Novela', 1);

            CREATE TABLE socios (
                id INTEGER PRIMARY KEY,
                nombre TEXT NOT NULL,
                ciudad TEXT,
                fecha_alta TEXT
            );
            INSERT INTO socios VALUES
                (1, 'Lucia Ramos', 'Lima', '2023-01-15'),
                (2, 'Mateo Silva', 'Arequipa', '2023-03-20'),
                (3, 'Nora Vega', 'Cusco', '2023-06-10'),
                (4, 'Oscar Leon', 'Lima', '2024-01-05'),
                (5, 'Patricia Mena', 'Trujillo', '2024-02-18');

            CREATE TABLE prestamos (
                id INTEGER PRIMARY KEY,
                libro_id INTEGER,
                socio_id INTEGER,
                fecha_prestamo TEXT,
                fecha_devolucion TEXT,
                FOREIGN KEY (libro_id) REFERENCES libros(id),
                FOREIGN KEY (socio_id) REFERENCES socios(id)
            );
            INSERT INTO prestamos VALUES
                (1, 2, 1, '2024-03-01', '2024-03-15'),
                (2, 4, 2, '2024-03-05', NULL),
                (3, 7, 3, '2024-03-10', '2024-03-24'),
                (4, 1, 4, '2024-04-01', '2024-04-12'),
                (5, 3, 1, '2024-04-05', '2024-04-19'),
                (6, 5, 5, '2024-04-10', NULL),
                (7, 6, 2, '2024-04-15', '2024-04-29'),
                (8, 8, 4, '2024-05-01', NULL);
        `
    }
};
