# SQL Academy - Simulador de Base de Datos

Simulador educativo de SQL que se ejecuta completamente en el navegador. Incluye una base de datos SQLite real (mediante [sql.js](https://sql.js.org/)), un editor de consultas, ejemplos guiados, un editor visual de tablas, diagramas de relaciones y gráficos estadísticos.

El proyecto nació como parte de un curso de 18 semanas para practicar flujos de trabajo colaborativos con Git y GitHub.

## Tecnologías

- HTML5, CSS3 y JavaScript (sin frameworks)
- SQLite en el navegador con `sql.js`
- Chart.js para los gráficos
- Font Awesome para los iconos

## Cómo ejecutarlo

No requiere instalación ni backend. Basta con abrir `index.html` en un navegador moderno.

Para evitar restricciones de algunos navegadores con WebAssembly y archivos locales, se recomienda servir la carpeta con un servidor estático:

```bash
python3 -m http.server 8000
# o
npx serve .
```

Después abre `http://localhost:8000`.

> **Conexión a internet:** las librerías (sql.js, Chart.js y Font Awesome) se cargan desde CDN con versiones fijas. Sin conexión, la aplicación no inicializará la base de datos.

## Estructura del proyecto

```
sql-academy/
├── index.html          # Estructura de la interfaz y modales
├── style.css           # Estilos, diseño responsive y componentes
├── script.js           # Lógica de la base de datos y de la interfaz
├── images/
│   └── qr-yape.png     # Imagen del QR de donaciones
├── logos/              # Logos de los gestores SQL y NoSQL
└── README.md
```

## Modelo de datos

La base de datos de ejemplo se crea al cargar la página y se puede reiniciar desde la interfaz.

### `estudiantes`

| Columna | Tipo | Descripción |
| --- | --- | --- |
| `id` | INTEGER | Clave primaria |
| `nombre` | TEXT | Nombre del estudiante |
| `edad` | INTEGER | Edad |
| `carrera` | TEXT | Carrera |
| `promedio` | REAL | Promedio (0 a 20) |
| `ciudad` | TEXT | Ciudad |
| `fecha_ingreso` | TEXT | Fecha de ingreso |

### `cursos`

| Columna | Tipo | Descripción |
| --- | --- | --- |
| `id` | INTEGER | Clave primaria |
| `nombre` | TEXT | Nombre del curso |
| `creditos` | INTEGER | Créditos |
| `profesor` | TEXT | Profesor |
| `departamento` | TEXT | Departamento |
| `semestre` | INTEGER | Semestre |

### `inscripciones`

| Columna | Tipo | Descripción |
| --- | --- | --- |
| `id` | INTEGER | Clave primaria |
| `estudiante_id` | INTEGER | FK → `estudiantes.id` |
| `curso_id` | INTEGER | FK → `cursos.id` |
| `anio` | INTEGER | Año de la inscripción |
| `ciclo` | TEXT | Ciclo académico |
| `nota` | REAL | Nota obtenida |

Las claves foráneas se aplican con `PRAGMA foreign_keys = ON`, por lo que no se puede eliminar un estudiante o un curso que tenga inscripciones asociadas.

## Funcionalidades

- **Aprender:** fichas de gestores SQL y NoSQL con características, ventajas, desventajas y casos de uso.
- **Practicar:** editor SQL con ejecución (`Ctrl+Enter`), historial de consultas, ejemplos por categoría y resultados en tabla.
- **Editor de tablas:** edición en línea de filas, alta y baja de registros, con validación de tipos y claves primarias protegidas. En columnas de texto, escribe `NULL` para asignar un nulo explícito; una celda vacía se guarda como cadena vacía. En columnas numéricas, una celda vacía se guarda como `NULL`.
- **Analizar:** diagrama ERD generado desde el esquema real y gráficos de estudiantes por carrera y promedio por carrera.
- **Conceptos:** modales educativos sobre modelo entidad-relación, normalización, llaves, ACID, índices y modelos NoSQL.
- **Guía SQL:** recorrido paso a paso desde `CREATE TABLE` hasta `JOIN`.
- **Exportar / importar:** descarga y carga de la base de datos en formato SQLite (`.sqlite`).
- **Reiniciar BD:** restaura los datos de ejemplo.

## Atajos de teclado

| Atajo | Acción |
| --- | --- |
| `Ctrl + Enter` | Ejecutar la consulta |
| `Ctrl + L` | Limpiar el editor |
| `Ctrl + E` | Mostrar un ejemplo aleatorio |
| `Ctrl + Shift + R` | Reiniciar la base de datos |

## Notas y limitaciones

- Los cambios viven en memoria: al recargar la página se restaura la base de datos de ejemplo. Usa **Exportar** si quieres conservar tu trabajo.
- El simulador ejecuta SQL real, incluidas sentencias `DROP` o `DELETE`. No hay confirmación adicional para sentencias destructivas: usa **Reiniciar BD** si necesitas recuperar el estado inicial.
- El editor visual asume que la tabla tiene una clave primaria. Para tablas creadas sin clave primaria, utiliza consultas SQL.
- `sql.js` implementa SQLite, por lo que algunas funciones específicas de PostgreSQL, MySQL u Oracle no están disponibles.

## Release Notes

### v1.2.0

- **Correcciones:**
  - Se incorporó la hoja de estilos completa que faltaba en la rama principal.
  - Se corrigió la edición de filas: la clave primaria ya no se puede modificar y los valores se guardan con su tipo real.
  - Se eliminó la inserción de datos de relleno incorrectos (`'texto'`) al agregar filas.
  - Se activó la integridad referencial (`PRAGMA foreign_keys = ON`).
  - Se escaparon los datos mostrados en tablas, resultados, editor e historial para evitar HTML roto e inyección de scripts.
  - Se corrigió la navegación de la guía SQL desde la barra de progreso.
  - Se unificó el cierre de modales con `Escape` y clic fuera.
  - Se agregaron las categorías `HAVING` y `Operadores` al selector de ejemplos.
- **Mejoras:**
  - Diagrama ERD generado dinámicamente desde el esquema.
  - Soporte para varias sentencias `SELECT` en una misma ejecución.
  - Importación de bases de datos SQLite.
  - Tablas creadas por el usuario disponibles en el editor y el diagrama.
  - Versiones fijas de las dependencias CDN.
  - Mejoras de accesibilidad en modales, navegación y panel de resultados.
  - README con estructura, modelo de datos y guía de uso.

### v1.1.0

- Diseño responsive y barras de desplazamiento personalizadas.
- Estilos de las secciones de aprendizaje y modales.
- Mejoras en el editor y en el panel de resultados.
