// Catálogo de ejemplos SQL por categoría y dataset.

function getEscuelaExamplesByCategory() {
    return {
        'basicos': {
            titulo: 'Consultas Basicas',
            ejemplos: [
                { titulo: 'Todos los estudiantes', sql: 'SELECT * FROM estudiantes;' },
                { titulo: 'Todos los cursos', sql: 'SELECT * FROM cursos;' },
                { titulo: 'Todas las inscripciones', sql: 'SELECT * FROM inscripciones;' },
                { titulo: 'Nombres y carreras', sql: 'SELECT nombre, carrera FROM estudiantes;' },
                { titulo: 'Top 5 estudiantes', sql: 'SELECT * FROM estudiantes LIMIT 5;' }
            ]
        },
        'filtros': {
            titulo: 'Filtros (WHERE)',
            ejemplos: [
                { titulo: 'Estudiantes de Ingenieria', sql: "SELECT * FROM estudiantes WHERE carrera = 'Ingenieria';" },
                { titulo: 'Estudiantes mayores de 21', sql: 'SELECT * FROM estudiantes WHERE edad > 21;' },
                { titulo: 'Estudiantes con promedio >= 16', sql: 'SELECT * FROM estudiantes WHERE promedio >= 16.0;' },
                { titulo: 'Estudiantes de Lima', sql: "SELECT * FROM estudiantes WHERE ciudad = 'Lima';" },
                { titulo: 'Ingenieria y edad >= 20', sql: "SELECT * FROM estudiantes WHERE carrera = 'Ingenieria' AND edad >= 20;" },
                { titulo: 'Medicina o Derecho', sql: "SELECT * FROM estudiantes WHERE carrera = 'Medicina' OR carrera = 'Derecho';" },
                { titulo: 'NO son de Ingenieria', sql: "SELECT * FROM estudiantes WHERE carrera != 'Ingenieria';" }
            ]
        },
        'orden': {
            titulo: 'Ordenamiento (ORDER BY)',
            ejemplos: [
                { titulo: 'Mejores promedios (mayor a menor)', sql: 'SELECT * FROM estudiantes ORDER BY promedio DESC;' },
                { titulo: 'Peores promedios (menor a mayor)', sql: 'SELECT * FROM estudiantes ORDER BY promedio ASC;' },
                { titulo: 'Por edad (jovenes a mayores)', sql: 'SELECT * FROM estudiantes ORDER BY edad;' },
                { titulo: 'Alfabeticamente por nombre', sql: 'SELECT * FROM estudiantes ORDER BY nombre ASC;' },
                { titulo: 'Por carrera y luego por promedio', sql: 'SELECT * FROM estudiantes ORDER BY carrera, promedio DESC;' }
            ]
        },
        'agregacion': {
            titulo: 'Agregaciones (AVG, COUNT, MAX, MIN, SUM)',
            ejemplos: [
                { titulo: 'Contar todos los estudiantes', sql: 'SELECT COUNT(*) as total FROM estudiantes;' },
                { titulo: 'Promedio de edad', sql: 'SELECT AVG(edad) as edad_promedio FROM estudiantes;' },
                { titulo: 'Promedio general de calificaciones', sql: 'SELECT AVG(promedio) as promedio_general FROM estudiantes;' },
                { titulo: 'Edad maxima', sql: 'SELECT MAX(edad) as edad_maxima FROM estudiantes;' },
                { titulo: 'Edad minima', sql: 'SELECT MIN(edad) as edad_minima FROM estudiantes;' },
                { titulo: 'Suma de creditos', sql: 'SELECT SUM(creditos) as total_creditos FROM cursos;' }
            ]
        },
        'groupby': {
            titulo: 'Agrupaciones (GROUP BY)',
            ejemplos: [
                { titulo: 'Estudiantes por carrera', sql: 'SELECT carrera, COUNT(*) as cantidad FROM estudiantes GROUP BY carrera;' },
                { titulo: 'Promedio de edad por carrera', sql: 'SELECT carrera, AVG(edad) as edad_promedio FROM estudiantes GROUP BY carrera;' },
                { titulo: 'Promedio de calificaciones por carrera', sql: 'SELECT carrera, ROUND(AVG(promedio), 2) as promedio FROM estudiantes GROUP BY carrera;' },
                { titulo: 'Estudiantes por ciudad', sql: 'SELECT ciudad, COUNT(*) as cantidad FROM estudiantes GROUP BY ciudad;' },
                { titulo: 'Cursos por profesor', sql: 'SELECT profesor, COUNT(*) as cantidad FROM cursos GROUP BY profesor;' }
            ]
        },
        'having': {
            titulo: 'Filtros de Agrupacion (HAVING)',
            ejemplos: [
                { titulo: 'Carreras con mas de 3 estudiantes', sql: 'SELECT carrera, COUNT(*) as cantidad FROM estudiantes GROUP BY carrera HAVING COUNT(*) > 3;' },
                { titulo: 'Carreras con promedio > 16', sql: 'SELECT carrera, ROUND(AVG(promedio), 2) as promedio FROM estudiantes GROUP BY carrera HAVING AVG(promedio) > 16.0;' }
            ]
        },
        'join': {
            titulo: 'JOIN (Relaciones entre tablas)',
            ejemplos: [
                { titulo: 'Estudiantes con sus cursos', sql: 'SELECT e.nombre, c.nombre as curso FROM estudiantes e JOIN inscripciones i ON e.id = i.estudiante_id JOIN cursos c ON i.curso_id = c.id LIMIT 10;' },
                { titulo: 'Ingenieria con sus cursos', sql: "SELECT e.nombre, c.nombre as curso FROM estudiantes e JOIN inscripciones i ON e.id = i.estudiante_id JOIN cursos c ON i.curso_id = c.id WHERE e.carrera = 'Ingenieria' LIMIT 10;" },
                { titulo: 'Cursos con cantidad de inscritos', sql: 'SELECT c.nombre, COUNT(i.estudiante_id) as inscritos FROM cursos c LEFT JOIN inscripciones i ON c.id = i.curso_id GROUP BY c.nombre ORDER BY inscritos DESC;' },
                { titulo: 'Profesores con total de estudiantes', sql: 'SELECT c.profesor, COUNT(i.estudiante_id) as total FROM cursos c LEFT JOIN inscripciones i ON c.id = i.curso_id GROUP BY c.profesor ORDER BY total DESC;' },
                { titulo: 'Estudiantes, curso y profesor', sql: 'SELECT e.nombre as estudiante, c.nombre as curso, c.profesor FROM estudiantes e JOIN inscripciones i ON e.id = i.estudiante_id JOIN cursos c ON i.curso_id = c.id ORDER BY e.nombre LIMIT 10;' }
            ]
        },
        'subconsultas': {
            titulo: 'Subconsultas',
            ejemplos: [
                { titulo: 'Promedio mayor al general', sql: 'SELECT * FROM estudiantes WHERE promedio > (SELECT AVG(promedio) FROM estudiantes);' },
                { titulo: 'Mas jovenes que el promedio', sql: 'SELECT * FROM estudiantes WHERE edad < (SELECT AVG(edad) FROM estudiantes);' },
                { titulo: 'Cursos con mas creditos que el promedio', sql: 'SELECT * FROM cursos WHERE creditos > (SELECT AVG(creditos) FROM cursos);' },
                { titulo: 'Estudiantes con la edad maxima', sql: 'SELECT * FROM estudiantes WHERE edad = (SELECT MAX(edad) FROM estudiantes);' },
                { titulo: 'Estudiantes con el mejor promedio', sql: 'SELECT * FROM estudiantes WHERE promedio = (SELECT MAX(promedio) FROM estudiantes);' }
            ]
        },
        'operadores': {
            titulo: 'Operadores Especiales',
            ejemplos: [
                { titulo: 'IN: Ingenieria o Medicina', sql: "SELECT * FROM estudiantes WHERE carrera IN ('Ingenieria', 'Medicina');" },
                { titulo: 'NOT IN: No son de Derecho o Arquitectura', sql: "SELECT * FROM estudiantes WHERE carrera NOT IN ('Derecho', 'Arquitectura');" },
                { titulo: 'BETWEEN: Edad entre 20 y 22', sql: 'SELECT * FROM estudiantes WHERE edad BETWEEN 20 AND 22;' },
                { titulo: 'BETWEEN: Promedio entre 14 y 18', sql: 'SELECT * FROM estudiantes WHERE promedio BETWEEN 14.0 AND 18.0;' },
                { titulo: 'LIKE: Nombres que empiezan con "A"', sql: "SELECT * FROM estudiantes WHERE nombre LIKE 'A%';" },
                { titulo: 'LIKE: Nombres que contienen "a"', sql: "SELECT * FROM estudiantes WHERE nombre LIKE '%a%';" },
                { titulo: 'DISTINCT: Carreras unicas', sql: 'SELECT DISTINCT carrera FROM estudiantes;' }
            ]
        },
        'avanzado': {
            titulo: 'Consultas Avanzadas',
            ejemplos: [
                { titulo: 'Top 3 carreras con mejor promedio', sql: 'SELECT carrera, ROUND(AVG(promedio), 2) as promedio FROM estudiantes GROUP BY carrera ORDER BY promedio DESC LIMIT 3;' },
                { titulo: 'Estudiantes que cursan mas de 2 materias', sql: 'SELECT e.nombre, COUNT(i.curso_id) as cursos FROM estudiantes e JOIN inscripciones i ON e.id = i.estudiante_id GROUP BY e.nombre HAVING COUNT(i.curso_id) > 2;' },
                { titulo: 'Promedio de creditos por carrera', sql: 'SELECT e.carrera, ROUND(AVG(c.creditos), 2) as promedio_creditos FROM estudiantes e JOIN inscripciones i ON e.id = i.estudiante_id JOIN cursos c ON i.curso_id = c.id GROUP BY e.carrera;' },
                { titulo: 'Profesores con mas de 3 estudiantes', sql: 'SELECT c.profesor, COUNT(i.estudiante_id) as total FROM cursos c JOIN inscripciones i ON c.id = i.curso_id GROUP BY c.profesor HAVING COUNT(i.estudiante_id) >= 3;' },
                { titulo: 'Estudiantes sin cursos', sql: 'SELECT e.nombre FROM estudiantes e LEFT JOIN inscripciones i ON e.id = i.estudiante_id WHERE i.estudiante_id IS NULL;' }
            ]
        },
        'modificacion': {
            titulo: 'Modificacion (INSERT, UPDATE, DELETE)',
            ejemplos: [
                { titulo: 'INSERT: Agregar estudiante', sql: "INSERT INTO estudiantes (id, nombre, edad, carrera, promedio, ciudad, fecha_ingreso) VALUES (26, 'Nuevo Estudiante', 20, 'Ingenieria', 14.0, 'Lima', '2024-06-01');" },
                { titulo: 'INSERT: Agregar curso', sql: "INSERT INTO cursos (id, nombre, creditos, profesor, departamento, semestre) VALUES (16, 'Inteligencia Artificial', 5, 'Dr. Perez', 'Ingenieria', 4);" },
                { titulo: 'UPDATE: Actualizar promedio', sql: "UPDATE estudiantes SET promedio = 18.5 WHERE nombre = 'Ana Garcia';" },
                { titulo: 'UPDATE: Cambiar carrera', sql: "UPDATE estudiantes SET carrera = 'Ingenieria de Software' WHERE id = 4;" },
                { titulo: 'UPDATE: Incrementar edad', sql: 'UPDATE estudiantes SET edad = edad + 1;' },
                { titulo: 'DELETE: Eliminar estudiante', sql: 'DELETE FROM estudiantes WHERE id = 26;' }
            ]
        }
    };
}

const SQL_ADDITIONAL_EXAMPLE_CATALOGS = {
    tienda: {
        basicos: {
            titulo: 'Consultas Basicas',
            ejemplos: [
                { titulo: 'Todos los clientes', sql: 'SELECT * FROM clientes;' },
                { titulo: 'Todos los productos', sql: 'SELECT * FROM productos;' },
                { titulo: 'Todos los pedidos', sql: 'SELECT * FROM pedidos;' },
                { titulo: 'Nombres y ciudades', sql: 'SELECT nombre, ciudad FROM clientes;' }
            ]
        },
        filtros: {
            titulo: 'Filtros (WHERE)',
            ejemplos: [
                { titulo: 'Productos con stock bajo', sql: 'SELECT nombre, categoria, precio, stock FROM productos WHERE stock <= 10;' },
                { titulo: 'Clientes de Lima', sql: "SELECT nombre, ciudad FROM clientes WHERE ciudad = 'Lima';" },
                { titulo: 'Pedidos pagados', sql: "SELECT * FROM pedidos WHERE estado = 'pagado';" },
                { titulo: 'Lineas con cantidad mayor a 1', sql: 'SELECT pedido_id, producto_id, cantidad FROM detalle_pedidos WHERE cantidad > 1;' }
            ]
        },
        orden: {
            titulo: 'Ordenamiento (ORDER BY)',
            ejemplos: [
                { titulo: 'Productos por precio', sql: 'SELECT nombre, precio FROM productos ORDER BY precio DESC;' },
                { titulo: 'Productos por stock', sql: 'SELECT nombre, stock FROM productos ORDER BY stock ASC, nombre ASC;' },
                { titulo: 'Clientes por ciudad', sql: 'SELECT nombre, ciudad FROM clientes ORDER BY ciudad ASC, nombre ASC;' },
                { titulo: 'Pedidos recientes', sql: 'SELECT id, fecha, estado FROM pedidos ORDER BY fecha DESC;' }
            ]
        },
        agregacion: {
            titulo: 'Agregaciones (AVG, COUNT, MAX, MIN, SUM)',
            ejemplos: [
                { titulo: 'Contar clientes', sql: 'SELECT COUNT(*) AS total FROM clientes;' },
                { titulo: 'Precio promedio', sql: 'SELECT ROUND(AVG(precio), 2) AS precio_promedio FROM productos;' },
                { titulo: 'Stock total', sql: 'SELECT SUM(stock) AS stock_total FROM productos;' },
                { titulo: 'Precio maximo y minimo', sql: 'SELECT MAX(precio) AS maximo, MIN(precio) AS minimo FROM productos;' }
            ]
        },
        groupby: {
            titulo: 'Agrupaciones (GROUP BY)',
            ejemplos: [
                { titulo: 'Productos por categoria', sql: 'SELECT categoria, COUNT(*) AS productos FROM productos GROUP BY categoria ORDER BY productos DESC, categoria ASC;' },
                { titulo: 'Pedidos por estado', sql: 'SELECT estado, COUNT(*) AS pedidos FROM pedidos GROUP BY estado ORDER BY pedidos DESC, estado ASC;' },
                { titulo: 'Stock por categoria', sql: 'SELECT categoria, SUM(stock) AS stock_total FROM productos GROUP BY categoria ORDER BY stock_total DESC, categoria ASC;' },
                { titulo: 'Precio promedio por categoria', sql: 'SELECT categoria, ROUND(AVG(precio), 2) AS precio_promedio FROM productos GROUP BY categoria ORDER BY categoria ASC;' }
            ]
        },
        having: {
            titulo: 'Filtros de Agrupacion (HAVING)',
            ejemplos: [
                { titulo: 'Categorias con mas de un producto', sql: 'SELECT categoria, COUNT(*) AS productos FROM productos GROUP BY categoria HAVING COUNT(*) > 1 ORDER BY productos DESC, categoria ASC;' },
                { titulo: 'Clientes con mas de un pedido', sql: 'SELECT cliente_id, COUNT(*) AS pedidos FROM pedidos GROUP BY cliente_id HAVING COUNT(*) > 1 ORDER BY pedidos DESC, cliente_id ASC;' }
            ]
        },
        join: {
            titulo: 'JOIN (Relaciones entre tablas)',
            ejemplos: [
                { titulo: 'Pedidos con cliente', sql: 'SELECT p.id AS pedido, c.nombre AS cliente, p.fecha, p.estado FROM pedidos p JOIN clientes c ON c.id = p.cliente_id ORDER BY p.id ASC;' },
                { titulo: 'Detalle con producto', sql: 'SELECT d.pedido_id, pr.nombre AS producto, d.cantidad, d.precio_unitario FROM detalle_pedidos d JOIN productos pr ON pr.id = d.producto_id ORDER BY d.pedido_id ASC, pr.nombre ASC;' },
                { titulo: 'Total por pedido', sql: 'SELECT p.id AS pedido, SUM(d.cantidad * d.precio_unitario) AS total FROM pedidos p JOIN detalle_pedidos d ON d.pedido_id = p.id GROUP BY p.id ORDER BY p.id ASC;' },
                { titulo: 'Ventas por categoria', sql: 'SELECT pr.categoria, SUM(d.cantidad * d.precio_unitario) AS total FROM detalle_pedidos d JOIN productos pr ON pr.id = d.producto_id GROUP BY pr.categoria ORDER BY total DESC, pr.categoria ASC;' }
            ]
        },
        subconsultas: {
            titulo: 'Subconsultas',
            ejemplos: [
                { titulo: 'Productos sobre el precio promedio', sql: 'SELECT nombre, precio FROM productos WHERE precio > (SELECT AVG(precio) FROM productos) ORDER BY precio DESC;' },
                { titulo: 'Clientes con pedidos', sql: 'SELECT nombre FROM clientes WHERE id IN (SELECT cliente_id FROM pedidos) ORDER BY nombre ASC;' },
                { titulo: 'Pedido con mayor total', sql: 'SELECT pedido_id, SUM(cantidad * precio_unitario) AS total FROM detalle_pedidos GROUP BY pedido_id ORDER BY total DESC LIMIT 1;' }
            ]
        },
        operadores: {
            titulo: 'Operadores Especiales',
            ejemplos: [
                { titulo: 'IN: Lima o Arequipa', sql: "SELECT nombre, ciudad FROM clientes WHERE ciudad IN ('Lima', 'Arequipa') ORDER BY nombre ASC;" },
                { titulo: 'NOT IN: Sin perifericos ni audio', sql: "SELECT nombre, categoria FROM productos WHERE categoria NOT IN ('Perifericos', 'Audio') ORDER BY nombre ASC;" },
                { titulo: 'BETWEEN: Precio entre 40 y 100', sql: 'SELECT nombre, precio FROM productos WHERE precio BETWEEN 40 AND 100 ORDER BY precio ASC;' },
                { titulo: 'LIKE: Nombres que empiezan con A', sql: "SELECT nombre FROM clientes WHERE nombre LIKE 'A%';" },
                { titulo: 'DISTINCT: Categorias unicas', sql: 'SELECT DISTINCT categoria FROM productos ORDER BY categoria ASC;' }
            ]
        },
        avanzado: {
            titulo: 'Consultas Avanzadas',
            ejemplos: [
                { titulo: 'Top 3 productos por unidades', sql: 'SELECT pr.nombre, SUM(d.cantidad) AS unidades FROM detalle_pedidos d JOIN productos pr ON pr.id = d.producto_id GROUP BY pr.id, pr.nombre ORDER BY unidades DESC, pr.nombre ASC LIMIT 3;' },
                { titulo: 'Top 3 clientes por total gastado', sql: 'SELECT c.nombre, SUM(d.cantidad * d.precio_unitario) AS total FROM clientes c JOIN pedidos p ON p.cliente_id = c.id JOIN detalle_pedidos d ON d.pedido_id = p.id GROUP BY c.id, c.nombre ORDER BY total DESC, c.nombre ASC LIMIT 3;' },
                { titulo: 'Pedidos sobre el total promedio', sql: 'SELECT p.id AS pedido, SUM(d.cantidad * d.precio_unitario) AS total FROM pedidos p JOIN detalle_pedidos d ON d.pedido_id = p.id GROUP BY p.id HAVING SUM(d.cantidad * d.precio_unitario) > (SELECT AVG(total) FROM (SELECT SUM(cantidad * precio_unitario) AS total FROM detalle_pedidos GROUP BY pedido_id)) ORDER BY total DESC;' }
            ]
        },
        modificacion: {
            titulo: 'Modificacion (INSERT, UPDATE, DELETE)',
            ejemplos: [
                { titulo: 'INSERT: Agregar cliente', sql: "INSERT INTO clientes (id, nombre, ciudad, email) VALUES (7, 'Gabriela Nunez', 'Lima', 'gabriela@example.com');" },
                { titulo: 'INSERT: Agregar producto', sql: "INSERT INTO productos (id, nombre, categoria, precio, stock) VALUES (9, 'Tablet 10 pulgadas', 'Computadoras', 320.00, 8);" },
                { titulo: 'UPDATE: Incrementar stock', sql: 'UPDATE productos SET stock = stock + 5 WHERE id = 8;' },
                { titulo: 'DELETE: Eliminar producto', sql: 'DELETE FROM productos WHERE id = 9;' }
            ]
        }
    },
    biblioteca: {
        basicos: {
            titulo: 'Consultas Basicas',
            ejemplos: [
                { titulo: 'Todos los autores', sql: 'SELECT * FROM autores;' },
                { titulo: 'Todos los libros', sql: 'SELECT * FROM libros;' },
                { titulo: 'Todos los socios', sql: 'SELECT * FROM socios;' },
                { titulo: 'Todos los prestamos', sql: 'SELECT * FROM prestamos;' }
            ]
        },
        filtros: {
            titulo: 'Filtros (WHERE)',
            ejemplos: [
                { titulo: 'Libros disponibles', sql: 'SELECT titulo, genero, disponible FROM libros WHERE disponible = 1;' },
                { titulo: 'Libros de Novela', sql: "SELECT titulo, genero FROM libros WHERE genero = 'Novela';" },
                { titulo: 'Autores de Colombia', sql: "SELECT nombre, pais FROM autores WHERE pais = 'Colombia';" },
                { titulo: 'Prestamos sin devolver', sql: 'SELECT * FROM prestamos WHERE fecha_devolucion IS NULL;' }
            ]
        },
        orden: {
            titulo: 'Ordenamiento (ORDER BY)',
            ejemplos: [
                { titulo: 'Libros por anio', sql: 'SELECT titulo, anio FROM libros ORDER BY anio DESC, titulo ASC;' },
                { titulo: 'Libros por titulo', sql: 'SELECT titulo FROM libros ORDER BY titulo ASC;' },
                { titulo: 'Socios por fecha de alta', sql: 'SELECT nombre, fecha_alta FROM socios ORDER BY fecha_alta DESC;' },
                { titulo: 'Prestamos recientes', sql: 'SELECT id, fecha_prestamo FROM prestamos ORDER BY fecha_prestamo DESC;' }
            ]
        },
        agregacion: {
            titulo: 'Agregaciones (AVG, COUNT, MAX, MIN, SUM)',
            ejemplos: [
                { titulo: 'Contar libros', sql: 'SELECT COUNT(*) AS total FROM libros;' },
                { titulo: 'Anio promedio', sql: 'SELECT ROUND(AVG(anio), 0) AS anio_promedio FROM libros;' },
                { titulo: 'Libros disponibles', sql: 'SELECT COUNT(*) AS disponibles FROM libros WHERE disponible = 1;' },
                { titulo: 'Anio maximo y minimo', sql: 'SELECT MAX(anio) AS maximo, MIN(anio) AS minimo FROM libros;' }
            ]
        },
        groupby: {
            titulo: 'Agrupaciones (GROUP BY)',
            ejemplos: [
                { titulo: 'Libros por genero', sql: 'SELECT genero, COUNT(*) AS libros FROM libros GROUP BY genero ORDER BY libros DESC, genero ASC;' },
                { titulo: 'Autores por pais', sql: 'SELECT pais, COUNT(*) AS autores FROM autores GROUP BY pais ORDER BY autores DESC, pais ASC;' },
                { titulo: 'Prestamos por socio', sql: 'SELECT socio_id, COUNT(*) AS prestamos FROM prestamos GROUP BY socio_id ORDER BY prestamos DESC, socio_id ASC;' },
                { titulo: 'Libros por autor', sql: 'SELECT autor_id, COUNT(*) AS libros FROM libros GROUP BY autor_id ORDER BY libros DESC, autor_id ASC;' }
            ]
        },
        having: {
            titulo: 'Filtros de Agrupacion (HAVING)',
            ejemplos: [
                { titulo: 'Generos con mas de dos libros', sql: 'SELECT genero, COUNT(*) AS libros FROM libros GROUP BY genero HAVING COUNT(*) > 2 ORDER BY libros DESC, genero ASC;' },
                { titulo: 'Socios con mas de un prestamo', sql: 'SELECT socio_id, COUNT(*) AS prestamos FROM prestamos GROUP BY socio_id HAVING COUNT(*) > 1 ORDER BY prestamos DESC, socio_id ASC;' }
            ]
        },
        join: {
            titulo: 'JOIN (Relaciones entre tablas)',
            ejemplos: [
                { titulo: 'Libros con autor', sql: 'SELECT l.titulo, a.nombre AS autor FROM libros l JOIN autores a ON a.id = l.autor_id ORDER BY l.titulo ASC;' },
                { titulo: 'Prestamos con libro y socio', sql: 'SELECT p.id, l.titulo, s.nombre AS socio, p.fecha_prestamo, p.fecha_devolucion FROM prestamos p JOIN libros l ON l.id = p.libro_id JOIN socios s ON s.id = p.socio_id ORDER BY p.id ASC;' },
                { titulo: 'Libros por autor', sql: 'SELECT a.nombre, COUNT(l.id) AS libros FROM autores a LEFT JOIN libros l ON l.autor_id = a.id GROUP BY a.id, a.nombre ORDER BY libros DESC, a.nombre ASC;' },
                { titulo: 'Prestamos por socio', sql: 'SELECT s.nombre, COUNT(p.id) AS prestamos FROM socios s LEFT JOIN prestamos p ON p.socio_id = s.id GROUP BY s.id, s.nombre ORDER BY prestamos DESC, s.nombre ASC;' }
            ]
        },
        subconsultas: {
            titulo: 'Subconsultas',
            ejemplos: [
                { titulo: 'Libros anteriores al promedio', sql: 'SELECT titulo, anio FROM libros WHERE anio < (SELECT AVG(anio) FROM libros) ORDER BY anio ASC;' },
                { titulo: 'Libros del autor con mas libros', sql: 'SELECT titulo FROM libros WHERE autor_id = (SELECT autor_id FROM libros GROUP BY autor_id ORDER BY COUNT(*) DESC, autor_id ASC LIMIT 1) ORDER BY titulo ASC;' },
                { titulo: 'Socio con mas prestamos', sql: 'SELECT socio_id, COUNT(*) AS prestamos FROM prestamos GROUP BY socio_id ORDER BY prestamos DESC, socio_id ASC LIMIT 1;' }
            ]
        },
        operadores: {
            titulo: 'Operadores Especiales',
            ejemplos: [
                { titulo: 'IN: Colombia o Argentina', sql: "SELECT nombre, pais FROM autores WHERE pais IN ('Colombia', 'Argentina') ORDER BY nombre ASC;" },
                { titulo: 'NOT IN: Libros que no son Novela', sql: "SELECT titulo, genero FROM libros WHERE genero NOT IN ('Novela') ORDER BY titulo ASC;" },
                { titulo: 'BETWEEN: Libros entre 1940 y 1970', sql: 'SELECT titulo, anio FROM libros WHERE anio BETWEEN 1940 AND 1970 ORDER BY anio ASC;' },
                { titulo: 'LIKE: Titulos que contienen la', sql: "SELECT titulo FROM libros WHERE titulo LIKE '%la%' ORDER BY titulo ASC;" },
                { titulo: 'DISTINCT: Generos unicos', sql: 'SELECT DISTINCT genero FROM libros ORDER BY genero ASC;' }
            ]
        },
        avanzado: {
            titulo: 'Consultas Avanzadas',
            ejemplos: [
                { titulo: 'Top 3 autores por libros', sql: 'SELECT a.nombre, COUNT(l.id) AS libros FROM autores a LEFT JOIN libros l ON l.autor_id = a.id GROUP BY a.id, a.nombre ORDER BY libros DESC, a.nombre ASC LIMIT 3;' },
                { titulo: 'Socios con prestamos activos', sql: 'SELECT s.nombre, COUNT(p.id) AS activos FROM socios s JOIN prestamos p ON p.socio_id = s.id WHERE p.fecha_devolucion IS NULL GROUP BY s.id, s.nombre ORDER BY activos DESC, s.nombre ASC;' },
                { titulo: 'Autores con libros disponibles', sql: 'SELECT a.nombre, COUNT(l.id) AS disponibles FROM autores a JOIN libros l ON l.autor_id = a.id WHERE l.disponible = 1 GROUP BY a.id, a.nombre ORDER BY disponibles DESC, a.nombre ASC;' }
            ]
        },
        modificacion: {
            titulo: 'Modificacion (INSERT, UPDATE, DELETE)',
            ejemplos: [
                { titulo: 'INSERT: Agregar autor', sql: "INSERT INTO autores (id, nombre, pais) VALUES (5, 'Julio Cortazar', 'Argentina');" },
                { titulo: 'INSERT: Agregar libro', sql: "INSERT INTO libros (id, titulo, autor_id, anio, genero, disponible) VALUES (9, 'La fiesta del chivo', 4, 2000, 'Novela', 1);" },
                { titulo: 'UPDATE: Marcar libro no disponible', sql: 'UPDATE libros SET disponible = 0 WHERE id = 1;' },
                { titulo: 'DELETE: Eliminar libro', sql: 'DELETE FROM libros WHERE id = 9;' }
            ]
        }
    }
};

function getExamplesByCategory(datasetName = preferences.dataset) {
    if (datasetName === 'escuela') return getEscuelaExamplesByCategory();
    return SQL_ADDITIONAL_EXAMPLE_CATALOGS[datasetName] || getEscuelaExamplesByCategory();
}

function renderCategorySelector() {
    const selector = document.getElementById('categorySelector');
    if (!selector) return;

    const previous = selector.value;
    const categories = getVisibleExampleCategories();
    const keys = Object.keys(categories);
    const showLevels = getEffectiveSkillLevel('sql') === 'all';
    const options = keys.map(key => {
        const levelLabel = showLevels
            ? `[${getSkillLevelInfo(getExampleCategoryLevel(key)).label}] `
            : '';
        return `<option value="${escapeHtml(key)}">${levelLabel}${escapeHtml(categories[key].titulo)}</option>`;
    });
    options.push('<option value="aleatorio">Aleatorio</option>');
    selector.innerHTML = options.join('');

    if (keys.includes(previous)) {
        selector.value = previous;
    } else {
        selector.value = keys[0] || 'aleatorio';
    }
}

// CARGAR EJEMPLO POR CATEGORIA
let lastSqlExample = null;

function showExampleByCategory() {
    const selector = document.getElementById('categorySelector');
    if (!selector) {
        console.error('No se encontro el selector de categorias');
        return;
    }

    const category = selector.value;
    const categories = getVisibleExampleCategories();
    const keys = Object.keys(categories);
    if (!keys.length) {
        showMessage('warning', 'No hay ejemplos para este nivel', 'Cambia de nivel o escribe una consulta directamente en el editor.');
        return;
    }

    let selectedCategory = category;
    if (category === 'aleatorio' || !categories[selectedCategory]) {
        selectedCategory = keys[Math.floor(Math.random() * keys.length)];
    }

    const categoryData = categories[selectedCategory];
    if (!categoryData || !Array.isArray(categoryData.ejemplos) || !categoryData.ejemplos.length) return;

    const ejemplos = categoryData.ejemplos;
    let ejemplo = ejemplos[Math.floor(Math.random() * ejemplos.length)];
    let exampleKey = `${selectedCategory}:${ejemplo.sql}`;

    if (ejemplos.length > 1 && exampleKey === lastSqlExample) {
        const alternatives = ejemplos.filter(item => `${selectedCategory}:${item.sql}` !== lastSqlExample);
        if (alternatives.length) {
            ejemplo = alternatives[Math.floor(Math.random() * alternatives.length)];
            exampleKey = `${selectedCategory}:${ejemplo.sql}`;
        }
    }

    lastSqlExample = exampleKey;

    const editor = document.getElementById('sqlEditor');
    if (editor) {
        editor.value = ejemplo.sql;
        editor.selectionStart = editor.selectionEnd = editor.value.length;
        editor.focus();
    }

    const status = document.getElementById('sqlExampleStatus');
    if (status) {
        status.textContent = `Ejemplo cargado: ${ejemplo.titulo}`;
    }

    resetSqlResultPanel();
    if (editor) editor.focus();
}

function showExamples() {
    showExampleByCategory();
}
