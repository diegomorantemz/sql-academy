# SQL Academy - Simulador de Base de Datos

Simulador educativo de SQL y NoSQL que se ejecuta en el navegador. El laboratorio SQL usa una base de datos SQLite real mediante [sql.js](https://sql.js.org/); el laboratorio NoSQL incluye un motor documental propio inspirado en MongoDB. Incluye editores de consultas, ejemplos guiados, retos con validación automática, editor visual de tablas, diagrama de relaciones, gráficos, persistencia local, PWA y un asistente opcional que explica errores y propone ejercicios en español.

**Demo:** [https://sql-academy.netlify.app](https://sql-academy.netlify.app)

El proyecto nació como parte de un curso de 18 semanas para practicar flujos de trabajo colaborativos con Git y GitHub.

## Puntos destacados

- Base de datos SQLite real en el navegador, sin backend para las consultas.
- Persistencia automática del archivo SQLite en IndexedDB y del historial/preferencias en `localStorage`.
- Modo seguro activado por defecto para confirmar `DROP`, `TRUNCATE`, `DELETE` sin `WHERE`, `UPDATE` sin `WHERE` y `ALTER TABLE ... DROP`.
- Resultados paginados, ordenables, copiables y exportables a CSV o JSON.
- Ocho retos con validación por resultados, pistas y progreso guardado.
- Tres datasets de práctica en SQL y tres en NoSQL: Escuela, Tienda y Biblioteca.
- Laboratorio NoSQL documental con consola tipo MongoDB, CRUD, agregaciones, ejemplos y retos por dataset.
- Asistente IA con modos de error, explicación, pista, revisión, generación de ejercicios y ayuda para comandos NoSQL.
- Aplicación instalable (PWA), modo oscuro y mejoras de accesibilidad.
- Tests automatizados, CI y escaneo de secretos con Gitleaks.

## Tecnologías

- HTML5, CSS3 y JavaScript sin frameworks.
- SQLite en el navegador con `sql.js`.
- Motor documental propio para el laboratorio NoSQL, sin `eval`.
- Chart.js para los gráficos.
- Font Awesome para los iconos.
- IndexedDB y `localStorage` para persistencia.
- Service Worker y Web App Manifest para la PWA.
- Netlify Functions como proxy seguro para el asistente IA.
- Gemini API para las explicaciones.
- Node.js + `node:test` + jsdom para los tests.

## Cómo ejecutarlo

### Servidor estático

El simulador funciona sin backend para las consultas. Para evitar restricciones con WebAssembly y archivos locales, se recomienda servir la carpeta:

```bash
python3 -m http.server 8000
# o
npx serve .
```

Después abre `http://localhost:8000`.

> Las librerías de sql.js, Chart.js y Font Awesome se cargan desde CDN con versiones fijas. La primera visita necesita conexión; después el service worker puede servir el app shell desde caché.

### Con Netlify CLI (incluye el asistente IA)

```bash
npm install
npx netlify-cli dev
```

La aplicación queda disponible normalmente en `http://localhost:8888` y las peticiones a `/api/explain` se dirigen a la función de Netlify.

Para que la función use tu clave en local, crea un archivo `.env` a partir de `.env.example` y coloca el valor real. `.env` está excluido por `.gitignore`.

## Tests y comprobaciones

Requiere Node.js 20 o superior.

```bash
npm ci
npm test
npm run check
```

- `npm test` ejecuta los tests de utilidades del frontend y de la función de Netlify.
- `npm run check` valida la sintaxis de los archivos JavaScript y ejecuta toda la suite.

## Estructura del proyecto

```text
sql-academy/
├── index.html                  # Interfaz, secciones, modales y metadatos PWA
├── style.css                   # Estilos responsive, componentes y modo oscuro
├── script.js                   # Lógica de la app, persistencia, retos, IA y editor
├── nosql-engine.js             # Motor documental seguro inspirado en MongoDB
├── nosql-datasets.js           # Documentos, ejemplos y retos NoSQL
├── nosql.js                    # Interfaz, persistencia e historial del laboratorio NoSQL
├── datasets.js                 # Datasets Tienda y Biblioteca
├── service-worker.js           # Caché PWA y estrategia de red
├── manifest.webmanifest        # Configuración de la aplicación instalable
├── icons/                      # Iconos PWA
├── netlify.toml                # Publicación, función, redirect e ignore de builds
├── _headers                    # Cabeceras de seguridad de Netlify
├── netlify/
│   └── functions/
│       └── explain.mjs         # Proxy seguro hacia Gemini
├── tests/
│   ├── core.test.mjs           # Utilidades del frontend con jsdom
│   ├── nosql.test.mjs          # Motor documental, filtros, CRUD y agregaciones
│   └── explain.test.mjs        # Función de Netlify y prompts
├── .github/workflows/ci.yml    # Tests y Gitleaks en GitHub Actions
├── .gitleaks.toml              # Configuración del escaneo de secretos
├── .env.example                # Variables de entorno de ejemplo
├── package.json
├── package-lock.json
├── LICENSE
├── images/
│   └── qr-yape.png             # QR de donaciones
├── logos/                      # Logos de gestores SQL y NoSQL
└── README.md
```

## Modelo de datos

La base de datos de ejemplo se crea al cargar la página y se puede reiniciar desde la interfaz. El dataset activo se guarda en el navegador.

### Dataset Escuela (por defecto)

#### `estudiantes`

| Columna | Tipo | Descripción |
| --- | --- | --- |
| `id` | INTEGER | Clave primaria |
| `nombre` | TEXT | Nombre del estudiante |
| `edad` | INTEGER | Edad |
| `carrera` | TEXT | Carrera |
| `promedio` | REAL | Promedio (0 a 20) |
| `ciudad` | TEXT | Ciudad |
| `fecha_ingreso` | TEXT | Fecha de ingreso |

#### `cursos`

| Columna | Tipo | Descripción |
| --- | --- | --- |
| `id` | INTEGER | Clave primaria |
| `nombre` | TEXT | Nombre del curso |
| `creditos` | INTEGER | Créditos |
| `profesor` | TEXT | Profesor |
| `departamento` | TEXT | Departamento |
| `semestre` | INTEGER | Semestre |

#### `inscripciones`

| Columna | Tipo | Descripción |
| --- | --- | --- |
| `id` | INTEGER | Clave primaria |
| `estudiante_id` | INTEGER | FK → `estudiantes.id` |
| `curso_id` | INTEGER | FK → `cursos.id` |
| `anio` | INTEGER | Año de la inscripción |
| `ciclo` | TEXT | Ciclo académico |
| `nota` | REAL | Nota obtenida |

Las claves foráneas se aplican con `PRAGMA foreign_keys = ON`, por lo que no se puede eliminar un estudiante o un curso que tenga inscripciones asociadas.

### Otros datasets

- **Tienda:** `clientes`, `productos`, `pedidos` y `detalle_pedidos`.
- **Biblioteca:** `autores`, `libros`, `socios` y `prestamos`.

En SQL, los retos y los ejemplos guiados están diseñados para el dataset Escuela. Si cambias de dataset, la app lo avisa y puedes volver a Escuela desde la barra de herramientas.

## Funcionalidades

### Persistencia

- El archivo SQLite se guarda automáticamente en IndexedDB después de cambios de datos, importaciones o ejecución de consultas de escritura.
- Al recargar, se restaura la última base guardada.
- El historial de consultas, el tema, el modo seguro y el dataset se guardan en `localStorage`.
- **Reiniciar BD** borra la copia guardada y vuelve al dataset Escuela original.
- **Exportar** permite descargar un `.sqlite` antes de reiniciar o cambiar de dataset.

### Modo seguro

Activado por defecto. Antes de ejecutar una consulta potencialmente destructiva se pide confirmación:

- `DROP` de tablas, vistas, índices, triggers o bases de datos.
- `TRUNCATE`.
- `DELETE` sin `WHERE`.
- `UPDATE` sin `WHERE`.
- `ALTER TABLE ... DROP COLUMN|CONSTRAINT`.

Es una comprobación heurística pensada para principiantes, no un parser SQL completo. El modo se puede desactivar desde la barra de herramientas y la preferencia se conserva.

### Resultados

- Tiempo de ejecución por consulta.
- Tabla con cabeceras ordenables.
- Paginación de 100 filas con opción de mostrar más.
- Copia de toda la tabla o de una celda con doble clic.
- Exportación a CSV y JSON.
- Soporte para varias sentencias `SELECT` en una misma ejecución.

### Retos

- Ocho ejercicios de nivel básico, intermedio y avanzado.
- Validación comparando columnas, filas y valores, no el texto exacto de la consulta.
- Solo se permiten consultas de lectura (`SELECT` o `WITH`).
- Pistas, solución después de varios intentos y progreso guardado en `localStorage`.
- Los retos usan el dataset Escuela para que el resultado esperado sea estable.

### Asistente IA

Modos disponibles:

| Modo | Uso |
| --- | --- |
| `error` | Diagnostica un error y propone la corrección |
| `explain` | Explica qué hace la consulta |
| `hint` | Da una pista sin revelar la solución completa |
| `review` | Revisa legibilidad, riesgos y mejoras |
| `exercise` | Genera un ejercicio a partir del esquema actual |
| `nosql` | Explica un comando del laboratorio documental |

El modo se valida en el backend con una allowlist. El frontend envía la consulta, el error cuando existe y un resumen del esquema; **nunca los valores de las filas ni el archivo SQLite**.

### Editor

- Ejecución con `Ctrl+Enter`.
- Si hay texto seleccionado, se ejecuta solo esa selección.
- **Formatear** consulta con el botón o con `Ctrl+Shift+F`; también formatea solo la selección.
- Historial persistente con recarga de consultas.
- Ejemplos guiados por categoría.
- Editor visual de tablas con alta, baja y edición de filas.

### Datasets

Selector con tres bases de práctica. Al cambiar de dataset se reemplaza la base actual y se borra la copia guardada, por lo que se pide confirmación. El dataset activo se conserva al recargar.

### Laboratorio NoSQL

El laboratorio NoSQL es un simulador documental educativo, no una instancia real de MongoDB. Los documentos se guardan como JSON y se ejecutan en el navegador con un motor propio que no usa `eval`.

- Colecciones y documentos con `_id` de texto.
- Consola simplificada de Mongo shell:
  ```js
  db.estudiantes.find({ edad: { $gt: 18 } }).sort({ promedio: -1 }).limit(5)
  ```
- Operaciones `find`, `findOne`, `insertOne`, `insertMany`, `updateOne`, `updateMany`, `deleteOne`, `deleteMany`, `countDocuments`, `distinct`, `aggregate` y `drop`.
- Operadores de consulta `$eq`, `$ne`, `$gt`, `$gte`, `$lt`, `$lte`, `$in`, `$nin`, `$exists`, `$regex`, `$and`, `$or`, `$nor` y `$elemMatch`.
- Actualizaciones con `$set`, `$unset`, `$inc`, `$push`, `$addToSet`, `$pull` y `$rename`.
- Aggregation con `$match`, `$project`, `$group`, `$sort`, `$skip`, `$limit`, `$count`, `$unwind`, `$addFields` y `$unset`.
- Datasets documentales de Escuela, Tienda y Biblioteca, con cursos, pedidos y préstamos embebidos.
- Historial, ejemplos guiados y retos por dataset con validación y progreso persistente.
- Modo seguro para `deleteMany({})`, `updateMany({})` y `drop()`.
- Persistencia en IndexedDB y ayuda opcional con IA para comandos NoSQL.

La sintaxis está limitada a un subconjunto seguro: no se aceptan funciones, llamadas arbitrarias ni JavaScript ejecutable. Las claves pueden escribirse sin comillas y los textos deben ir entre comillas simples o dobles.

### PWA, modo oscuro y accesibilidad

- Manifest, service worker e iconos para instalar la app.
- Caché del app shell y de los recursos CDN visitados; `/api/` nunca se cachea.
- Botón de instalación cuando el navegador lo permite.
- Modo oscuro persistente y `theme-color` dinámico.
- Enlace para saltar al contenido, foco atrapado en modales, etiquetas ARIA y estilo `prefers-reduced-motion`.
- Toasts accesibles para avisos sin sustituir los resultados.

### Exportar e importar

- Descarga y carga de archivos SQLite (`.sqlite`, `.sqlite3`, `.db`).
- Al importar, el archivo se guarda en IndexedDB y pasa a ser la base activa.

## Atajos de teclado

| Atajo | Acción |
| --- | --- |
| `Ctrl + Enter` | Ejecutar la consulta o la selección |
| `Ctrl + Shift + F` | Formatear la consulta o la selección |
| `Ctrl + L` | Limpiar el editor |
| `Ctrl + E` | Mostrar un ejemplo aleatorio |
| `Ctrl + Shift + R` | Reiniciar la base de datos |

## Asistente IA (opcional)

El asistente usa **Gemini API** mediante una **Netlify Function**. La API Key nunca se incluye en el frontend ni en el repositorio: se guarda como variable de entorno en Netlify.

### Configuración en Netlify

1. Crea una API Key gratuita en [Google AI Studio](https://aistudio.google.com/apikey).
2. En Netlify, entra en **Site configuration → Environment variables**.
3. Añade `GEMINI_API_KEY` con el valor de tu clave.
4. Opcionalmente, añade `GEMINI_MODEL` para cambiar el modelo. El valor por defecto es `gemini-3.5-flash-lite`.
5. Opcionalmente, añade `GEMINI_FALLBACK_MODEL` para indicar el modelo de respaldo. El valor por defecto es `gemini-3.5-flash`; se usa si el modelo principal devuelve `404` o `503`.
6. Vuelve a desplegar el sitio. La función se publica desde `netlify/functions` y el frontend llama a `/api/explain`.

> **Nota sobre modelos:** `gemini-2.5-flash` ya no está disponible para proyectos nuevos. Usa `gemini-3.5-flash-lite` o `gemini-3.5-flash`. El reintento con el modelo de respaldo solo se hace ante `404` o `503`.

> **Importante:** arrastrar la carpeta a Netlify solo publica los archivos estáticos. Para desplegar la función usa Git o Netlify CLI (`npx netlify-cli deploy --prod`). No subas tu `.env` real al repositorio; `.gitignore` ya lo excluye.

### Privacidad y límites

- Solo se envían la consulta, el mensaje de error (cuando exista) y un resumen del esquema (nombres de tablas o colecciones y campos). **Nunca se envían los valores de las filas ni los documentos.**
- En el modo `exercise` no se envía la consulta; solo el esquema.
- La explicación se solicita únicamente al pulsar un botón. No se envía automáticamente al ejecutar una consulta.
- El frontend guarda una caché en memoria y aplica un pequeño tiempo de espera entre solicitudes para cuidar la cuota gratuita. La función también limita las peticiones por IP.
- Los errores del proveedor se sanean antes de registrarse y la clave se redacta de los logs.
- Si la IA falla, no está configurada o se agota la cuota, el simulador sigue funcionando con normalidad.
- Revisa las condiciones de Gemini API: en el plan gratuito Google puede usar las solicitudes para mejorar sus productos. No envíes información sensible.

## Tests, CI y seguridad

- `tests/core.test.mjs` cubre utilidades del frontend: escapado, modo seguro, formateo, comparación de retos, CSV/TSV y datasets.
- `tests/nosql.test.mjs` cubre el parser seguro, filtros, proyecciones, CRUD, agregaciones y modo seguro del laboratorio NoSQL.
- `tests/explain.test.mjs` cubre prompts, códigos de error, validaciones y la llamada simulada a Gemini.
- `.github/workflows/ci.yml` ejecuta `npm ci`, `npm run check` y Gitleaks en cada push o pull request.
- `_headers` añade `X-Content-Type-Options`, `X-Frame-Options`, `Referrer-Policy`, `Permissions-Policy`, HSTS y cachés específicas.
- `netlify.toml` incluye un `ignore` para evitar builds cuando solo cambian documentación, tests, CI o archivos de dependencias.

Si una API Key llegó a exponerse, revócala en Google AI Studio, genera una nueva y actualiza `GEMINI_API_KEY` en Netlify. No intentes "ocultarla" solo borrando el archivo: el historial de Git conserva el contenido.

## Flujo de ramas y despliegue

- `diego-dev` y `oscar-dev` son ramas personales de desarrollo.
- `main` se reserva para la versión publicada en producción y solo recibe cambios revisados.
- Los cambios se agrupan en commits por fase (persistencia, modo seguro, resultados, retos, IA, PWA, datasets, calidad).
- Antes de fusionar con `main`, ejecutar `npm run check` y probar la app con `npx netlify-cli dev`.
- La configuración de Netlify puede construir automáticamente al recibir cambios en la rama de producción. No hagas push ni merge a esa rama hasta estar listo para consumir créditos de build.

## Notas y limitaciones

- La persistencia es local al navegador y al perfil. No se sincroniza entre dispositivos.
- Si se borran los datos del sitio o se usa una ventana privada, se pierde la copia de IndexedDB.
- El simulador ejecuta SQL real, incluidas sentencias destructivas. El modo seguro ayuda, pero no sustituye una copia de seguridad.
- El editor visual asume que la tabla tiene una clave primaria. Para tablas sin clave primaria, usa consultas SQL.
- `sql.js` implementa SQLite, por lo que algunas funciones específicas de PostgreSQL, MySQL u Oracle no están disponibles.
- La PWA necesita HTTPS (Netlify lo proporciona). El asistente IA requiere conexión y la Netlify Function desplegada.
- En NoSQL, los ejemplos y retos se adaptan al dataset activo. Al cambiar de dataset se muestra el contenido correspondiente a Escuela, Tienda o Biblioteca.

## Release Notes

### v1.5.1

- **Biblioteca NoSQL:** nuevo dataset documental con libros, socios y préstamos, incluyendo autores embebidos y multas.
- **Contenido por dataset:** los ejemplos y retos ahora se filtran según el dataset activo.
- **Más práctica:** Escuela amplía sus retos, Tienda incorpora retos propios y Biblioteca incluye ejemplos y retos de consulta, filtros, CRUD y agregación.
- **Validación flexible:** soporte para comparar documentos, valores ordenados y filas de agregaciones.
- **Calidad:** pruebas de integridad del contenido, consultas de los tres datasets y caché PWA actualizada.

### v1.5.0

- **Laboratorio NoSQL documental:** consola tipo MongoDB, colecciones JSON, proyecciones, orden, límites y agregaciones.
- **CRUD seguro:** inserción, actualización y eliminación con operadores de actualización y confirmación de operaciones destructivas.
- **Datasets NoSQL:** Escuela y Tienda con documentos embebidos para comparar el modelo relacional con el documental.
- **Aprendizaje:** ejemplos guiados, tres retos con validación y progreso persistente.
- **Persistencia e IA:** estado en IndexedDB, historial local y modo `nosql` del asistente.
- **Calidad:** tests del motor, documentación y caché PWA actualizada.

### v1.4.0

- **Persistencia local:** SQLite en IndexedDB, historial y preferencias en `localStorage`, restauración automática y borrado al reiniciar.
- **Modo seguro:** confirmación de consultas destructivas y preferencia persistente.
- **Resultados:** paginación, ordenación, copia, exportación CSV/JSON y tiempo de ejecución.
- **Retos:** ocho ejercicios con validación por resultados, pistas, solución y progreso.
- **Asistente IA:** modos `error`, `explain`, `hint`, `exercise` y `review`, con allowlist en el backend.
- **Datasets:** Escuela, Tienda y Biblioteca, con avisos cuando un contenido requiere Escuela.
- **Editor:** formateo de SQL y ejecución de la selección.
- **PWA:** manifest, service worker, iconos e instalación.
- **Modo oscuro y accesibilidad:** tema persistente, skip link, foco atrapado, ARIA y reducción de movimiento.
- **Calidad:** tests con Node y jsdom, CI, Gitleaks, cabeceras de seguridad e `ignore` de builds.

### v1.3.1

- **Corrección del asistente IA:**
  - Se actualizó el modelo por defecto a `gemini-3.5-flash-lite`, porque `gemini-2.5-flash` ya no está disponible para proyectos nuevos.
  - Se añadió `GEMINI_FALLBACK_MODEL` para reintentar con `gemini-3.5-flash` si el modelo principal está saturado o no disponible.
  - Se añadieron mensajes específicos para modelos saturados, modelos no disponibles y errores de autenticación.

### v1.3.0

- **Asistente IA opcional:**
  - Explicación en español de errores SQL mediante Gemini API y una Netlify Function.
  - Panel lateral con la consulta, el error y la explicación, sin historial de conversación.
  - Botón manual **Ayudante IA** y botón contextual al producirse un error.
  - La API Key se configura solo en Netlify; nunca se expone en el frontend.
  - Solo se envían consulta, error y esquema de tablas, sin datos de registros.
  - Caché en memoria, tiempo de espera entre solicitudes y manejo de errores para no romper el simulador.
  - Documentación de configuración, privacidad y límites del plan gratuito.

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

## Licencia

MIT. Consulta el archivo `LICENSE`.
