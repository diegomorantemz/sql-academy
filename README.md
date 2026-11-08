# SQL Academy - Simulador de Base de Datos

Simulador educativo de SQL y NoSQL que se ejecuta en el navegador. El laboratorio SQL usa una base de datos SQLite real mediante [sql.js](https://sql.js.org/); el laboratorio NoSQL incluye un motor documental propio inspirado en MongoDB. Incluye editores de consultas, ejemplos guiados, retos con validación automática, editor visual de tablas, diagrama de relaciones, panel de análisis con explorador de tablas y calidad de datos, persistencia local, PWA y un asistente opcional que explica errores y propone ejercicios en español.

**Demo:** [https://sql-academy.netlify.app](https://sql-academy.netlify.app)

**Materiales de feria:** [FERIA.md](FERIA.md) · [feria.html](feria.html)

El proyecto nació como parte de un curso de 18 semanas para practicar flujos de trabajo colaborativos con Git y GitHub.

## Puntos destacados

- Base de datos SQLite real en el navegador, sin backend para las consultas.
- Persistencia automática del archivo SQLite en IndexedDB y del historial, preferencias y progreso de retos, ruta y conceptos en `localStorage`.
- Modo seguro activado por defecto para confirmar `DROP`, `TRUNCATE`, `DELETE` sin `WHERE`, `UPDATE` sin `WHERE` y `ALTER TABLE ... DROP`.
- Resultados paginados, ordenables, copiables y exportables a CSV o JSON.
- Retos SQL y NoSQL por dataset con validación por resultados, pistas y progreso guardado.
- Retos de depuración **Encuentra el error**: consulta rota, síntoma, pista, editor de corrección y validación por resultado en los tres datasets SQL.
- Test de habilidad adaptativo con niveles separados para SQL y NoSQL. Practicar y el laboratorio filtran ejemplos y sintaxis según el nivel, con opción de ver todo.
- Ejemplos en un clic: al elegir una categoría o un ejemplo, la consulta se carga en el editor y se ejecuta con el botón «Ejecutar».
- Tres datasets de práctica en SQL y tres en NoSQL: Escuela, Tienda y Biblioteca.
- Panel **Analizar** con resumen del dataset, diagrama ERD, explorador de tablas con vista y edición de datos, y comprobaciones de calidad.
- Ruta de aprendizaje guiada con 8 lecciones SQL, editor propio, pistas y progreso persistente por dataset.
- Biblioteca de aprendizaje con guías, conceptos, buscador, filtros, asistente de motor y mini-quizzes.
- Guías de instalación paso a paso para doce gestores SQL y NoSQL, con rutas para Windows, macOS, Linux y Docker, comandos copiables y enlaces oficiales.
- Panel **Mi progreso** con dominio por concepto SQL, avance por dataset, actividad reciente y recomendaciones.
- **Torre de Datos:** minijuego deckbuilder con 6 pisos, cartas SQL, recompensas y soporte para teclado, ratón y mando.
- Autocompletado contextual de tablas, columnas, palabras clave, colecciones, métodos y campos en los editores SQL y NoSQL.
- Laboratorio NoSQL documental con consola tipo MongoDB, CRUD, agregaciones, ejemplos y retos por dataset.
- Asistente IA con modos de error, explicación, pista, revisión, generación de ejercicios y ayuda para comandos NoSQL.
- Aplicación instalable (PWA), modo oscuro y mejoras de accesibilidad.
- Sonido opcional: intro original sintetizada para el recorrido y feedback de aciertos/errores, apagado por defecto.
- Donaciones voluntarias con Yape y Plin desde S/1, sin montos obligatorios ni funciones bloqueadas.
- Tests automatizados, CI y escaneo de secretos con Gitleaks.

## Tecnologías

- HTML5, CSS3 y JavaScript sin frameworks.
- SQLite en el navegador con `sql.js`.
- Motor documental propio para el laboratorio NoSQL, sin `eval`.
- Font Awesome para los iconos.
- Gamepad API para el control del minijuego con mando.
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

> Las librerías de sql.js y Font Awesome se cargan desde CDN con versiones fijas. La primera visita necesita conexión; después el service worker puede servir el app shell desde caché.

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
├── autocomplete.js             # Sugerencias contextuales para los editores SQL y NoSQL
├── deckbuilder.js              # Minijuego Torre de Datos y soporte de mando
├── nosql-engine.js             # Motor documental seguro inspirado en MongoDB
├── nosql-datasets.js           # Documentos, ejemplos y retos NoSQL
├── install-guides.js           # Guías de instalación por gestor y sistema operativo
├── nosql.js                    # Interfaz, persistencia e historial del laboratorio NoSQL
├── datasets.js                 # Datasets Tienda y Biblioteca
├── service-worker.js           # Caché PWA y estrategia de red
├── manifest.webmanifest        # Configuración de la aplicación instalable
├── assets/
│   ├── icons/                  # Iconos PWA
│   ├── images/                 # QR de donaciones y de la demo
│   └── logos/                  # Logos de gestores SQL y NoSQL
├── netlify.toml                # Publicación, función, redirect e ignore de builds
├── _headers                    # Cabeceras de seguridad de Netlify
├── netlify/
│   └── functions/
│       └── explain.mjs         # Proxy seguro hacia Gemini
├── tests/
│   ├── core.test.mjs           # Utilidades del frontend con jsdom
│   ├── autocomplete.test.mjs   # Sugerencias contextuales SQL y NoSQL
│   ├── path.test.mjs           # Lecciones, progreso y validación de la ruta
│   ├── learn-ui.test.mjs       # Biblioteca, filtros, asistente y mini-quizzes
│   ├── install-guides.test.mjs # Catálogo, rutas y enlaces de instalación
│   ├── deckbuilder.test.mjs    # Torre de Datos, cartas y validación de pisos
│   ├── nosql.test.mjs          # Motor documental, filtros, CRUD y agregaciones
│   ├── nosql-ui.test.mjs       # Interfaz y revelado progresivo NoSQL
│   ├── challenges-ui.test.mjs  # Pestañas SQL, NoSQL y Depuración
│   ├── table-editor-ui.test.mjs # Vista y edición de tablas
│   ├── donation-ui.test.mjs    # Modal de donaciones
│   ├── skill-level.test.mjs    # Test adaptativo, filtros y sonido
│   ├── toolbar-ui.test.mjs     # Barra de herramientas y menú Más
│   ├── license.test.mjs        # Licencia y rutas de assets
│   └── explain.test.mjs        # Función de Netlify y prompts
├── .github/workflows/ci.yml    # Tests y Gitleaks en GitHub Actions
├── .gitleaks.toml              # Configuración del escaneo de secretos
├── .env.example                # Variables de entorno de ejemplo
├── package.json
├── package-lock.json
├── FERIA.md                    # Pitch, demo, arquitectura, impacto y FAQ
├── feria.html                  # One-pager imprimible para el stand
├── LICENSE
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

En SQL, los ejemplos y retos se adaptan al dataset activo. Al cambiar de dataset se cargan las categorías y los ejercicios correspondientes a Escuela, Tienda o Biblioteca.

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

### Sonido

- **Apagado por defecto:** no hay autoplay ni música invasiva.
- **Intro original:** secuencia sintetizada para empezar el recorrido de feria.
- **Feedback:** sonidos breves al acertar o fallar un reto.
- **Control:** botón de sonido en la cabecera y preferencia persistente.
- **Sin archivos externos:** se genera con Web Audio API, sin problemas de licencia.

### Niveles y test de habilidad

- **Test adaptativo:** seis preguntas que suben o bajan de dificultad según las respuestas.
- **Niveles separados:** SQL y NoSQL se evalúan y guardan de forma independiente.
- **Nivel recomendado:** el resultado explica qué practicar a continuación.
- **Filtros por nivel:** Practicar muestra solo las categorías del nivel activo; el laboratorio NoSQL filtra ejemplos y sintaxis rápida.
- **Control manual:** puedes cambiar de nivel o elegir **Ver todo** en cualquier momento.
- **Sin bloqueos:** el nivel es una guía; no oculta el editor, las tablas ni la consola.
- **Persistencia:** el perfil se guarda en `localStorage`.

### Análisis de datos

- **Resumen del dataset:** número de tablas, columnas, filas, relaciones y tablas vacías.
- **Diagrama ERD:** tablas, columnas, claves primarias y foráneas del esquema activo.
- **Explorador de tablas:** selecciona una tabla para ver sus columnas, tipos, claves, número de filas y una vista previa de sus registros.
- **Vista y edición:** cambia entre **Vista** y **Editar datos** sin salir del explorador. La edición permite actualizar celdas, agregar filas, eliminarlas y guardar los cambios.
- **Edición protegida:** aviso de cambios sin guardar, límite de 100 filas por carga, bloqueo de tablas sin clave primaria y botón para restaurar los datos originales del dataset.
- **Acciones rápidas:** copia un `SELECT` de la tabla o cárgalo en el editor para practicar.
- **Calidad de datos:** comprobaciones de tablas vacías, claves primarias, integridad referencial, valores nulos y columnas sin tipo declarado.
- Funciona con los tres datasets SQL y con bases importadas por el usuario.

### Biblioteca de aprendizaje

- **Guías y conceptos en un solo lugar:** pestañas para consultar motores SQL/NoSQL y fichas conceptuales.
- **Buscador y filtros:** por tecnología, tipo de base de datos, licencia, nivel o tema.
- **Asistente “¿Qué motor me conviene?”:** cuatro preguntas para recomendar PostgreSQL, MySQL, MongoDB, Redis, Neo4j, Cassandra, Firebase o Elasticsearch.
- **Fichas de concepto:** diagramas, ideas clave, errores comunes, ejemplo copiable y conceptos relacionados.
- **Práctica conectada:** cada ficha enlaza con la ruta, el editor SQL, el ERD o el laboratorio NoSQL cuando tiene sentido.
- **Mini-quiz de 2 preguntas:** al superarlo, el concepto se marca como dominado.
- **Progreso persistente:** el avance de los conceptos se guarda en `localStorage` y aparece en Mi progreso.

### Guías de instalación

- **Doce gestores:** SQLite, PostgreSQL, MySQL, SQL Server, MariaDB y Oracle en SQL; MongoDB, Redis, Neo4j, Cassandra, Elasticsearch y Firebase en NoSQL.
- **Rutas por sistema:** pasos para Windows, macOS, Linux y Docker según el gestor; Redis usa WSL2 en Windows, Neo4j y Cassandra priorizan Docker, y Firebase se configura desde la consola web o con un emulador local.
- **Contenido para principiantes:** requisitos, pasos, comandos copiables, verificación, notas, errores comunes y consejos de seguridad.
- **Enlaces oficiales:** cada guía enlaza a la descarga y la documentación del fabricante; la app no aloja instaladores ni capturas.
- **Acceso conectado:** pestaña **Instalación** en Aprender y botón **Cómo instalarlo** en la ficha de cada gestor.
- **Fecha de revisión:** el contenido indica cuándo se revisó por última vez.

### Ruta de aprendizaje

- **8 lecciones progresivas:** `SELECT`, `WHERE`, `ORDER BY`, `LIMIT`, `JOIN`, `GROUP BY`, `HAVING` y subconsultas.
- **Contenido adaptado al dataset activo:** las tablas, columnas y ejercicios cambian para Escuela, Tienda y Biblioteca.
- **Editor propio por lección:** cada ejercicio se resuelve sin salir de la ruta.
- **Ayudas:** objetivo, explicación, ejemplo de referencia y pista.
- **Validación por resultado:** se compara la consulta con el resultado esperado y se indica si faltan filas, columnas o valores.
- **Progreso persistente:** cada lección completada se guarda por dataset en `localStorage`.
- **Navegación guiada:** botón para pasar a la siguiente lección y opción de reiniciar la ruta.
- **Panel Mi progreso:** dominio por concepto, avance por dataset, actividad reciente y siguiente paso recomendado.
- **Recomendaciones accionables:** el panel propone continuar una lección, practicar un reto o cambiar de dataset.

### Torre de Datos (minijuego)

- **Deckbuilder SQL:** construye consultas seleccionando cartas de cláusulas, tablas, columnas, valores y funciones.
- **6 pisos progresivos:** `SELECT`, `WHERE`, orden y límite, `JOIN`, agrupaciones y un jefe final con `HAVING`.
- **Validación real:** cada consulta se ejecuta contra una base SQLite propia del juego y se compara con el resultado objetivo.
- **Recompensas:** al superar un piso eliges una carta nueva para tu mazo (`DISTINCT`, `LEFT JOIN`, `AVG`, etc.).
- **Puntuación y progreso:** puntos por piso, penalización suave por pistas o intentos y guardado en `localStorage`.
- **Controles:** ratón, teclado y mando mediante Gamepad API. El juego muestra el estado del mando y resalta el elemento enfocado.
- **Base independiente:** la torre usa su propio esquema y datos, sin modificar la base de práctica del usuario.

### Retos

- Ejercicios de nivel básico, intermedio y avanzado para cada dataset.
- Validación comparando columnas, filas y valores, no el texto exacto de la consulta.
- Solo se permiten consultas de lectura (`SELECT` o `WITH`).
- Pistas, solución después de varios intentos y progreso guardado en `localStorage`.
- Escuela, Tienda y Biblioteca tienen retos propios; el progreso se guarda por reto y dataset.
- La página Retos incluye pestañas SQL y NoSQL. Los retos NoSQL se resuelven en la propia pestaña con editor y validación por resultados.

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
- **Autocompletado contextual:** sugiere tablas después de `FROM`/`JOIN`, columnas después de un alias o en cláusulas como `SELECT`, `WHERE` y `ORDER BY`, además de palabras clave y funciones. Funciona en práctica, retos SQL, ruta de aprendizaje y editores NoSQL.
- Navegación con `↑`/`↓`, `Enter` o `Tab` para aceptar y `Esc` para cerrar.
- Historial persistente con recarga de consultas.
- Ejemplos guiados por categoría.
- Editor visual de tablas con alta, baja y edición de filas.

### Datasets

Selector con tres bases de práctica. Al cambiar de dataset se reemplaza la base actual y se borra la copia guardada, por lo que se pide confirmación. El dataset activo se conserva al recargar.

### Laboratorio NoSQL

El laboratorio NoSQL es un simulador documental educativo, no una instancia real de MongoDB. Los documentos se guardan como JSON y se ejecutan en el navegador con un motor propio que no usa `eval`.

- Colecciones y documentos con `_id` de texto.
- Autocompletado de colecciones, métodos, campos y operadores al escribir comandos.
- Consola simplificada de Mongo shell:
  ```js
  db.estudiantes.find({ edad: { $gt: 18 } }).sort({ promedio: -1 }).limit(5)
  ```
- Operaciones `find`, `findOne`, `insertOne`, `insertMany`, `updateOne`, `updateMany`, `deleteOne`, `deleteMany`, `countDocuments`, `distinct`, `aggregate` y `drop`.
- Operadores de consulta `$eq`, `$ne`, `$gt`, `$gte`, `$lt`, `$lte`, `$in`, `$nin`, `$exists`, `$regex`, `$and`, `$or`, `$nor` y `$elemMatch`.
- Actualizaciones con `$set`, `$unset`, `$inc`, `$push`, `$addToSet`, `$pull` y `$rename`.
- Aggregation con `$match`, `$project`, `$group`, `$sort`, `$skip`, `$limit`, `$count`, `$unwind`, `$addFields` y `$unset`.
- Datasets documentales de Escuela, Tienda y Biblioteca, con cursos, pedidos y préstamos embebidos.
- Historial y ejemplos guiados por dataset.
- Retos NoSQL accesibles desde la página Retos, con pestañas SQL/NoSQL, editor propio, validación por resultados y progreso persistente.
- Plantillas de reto sin solución y botón «Ver solución» tras dos intentos fallidos.
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

### Exportar base de datos

- Descarga una copia del archivo SQLite activo (`.sqlite`) desde el menú **Más** de Practicar.
- La importación de bases externas ya no está disponible en esta versión.

## Atajos de teclado

| Atajo | Acción |
| --- | --- |
| `Ctrl + Enter` | Ejecutar la consulta o la selección |
| `Ctrl + Shift + F` | Formatear la consulta o la selección |
| `Ctrl + L` | Limpiar el editor |
| `Ctrl + E` | Mostrar un ejemplo aleatorio |
| `Ctrl + Shift + R` | Reiniciar la base de datos |
| `↑` / `↓` | Navegar por las sugerencias de autocompletado |
| `Enter` / `Tab` | Aceptar la sugerencia seleccionada |
| `Esc` | Cerrar las sugerencias |

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

- `tests/core.test.mjs` cubre utilidades del frontend: escapado, modo seguro, formateo, comparación de retos, CSV/TSV, datasets y el panel de análisis.
- `tests/autocomplete.test.mjs` cubre sugerencias SQL/NoSQL, alias, cadenas, navegación y aplicación de sugerencias.
- `tests/learn-ui.test.mjs` cubre las pestañas de la biblioteca, la búsqueda, los filtros, el asistente de motor, la pestaña Instalación y el mini-quiz de conceptos.
- `tests/install-guides.test.mjs` cubre el catálogo de los doce gestores, las rutas por sistema, las plataformas de Firebase, los campos obligatorios, los logos y los enlaces oficiales.
- `tests/path.test.mjs` cubre las lecciones de la ruta, la ejecución de sus consultas esperadas, el progreso, el dashboard y la validación de ejercicios.
- `tests/deckbuilder.test.mjs` cubre la base del juego, las soluciones de los 6 pisos, las recompensas, el avance de piso y la persistencia.
- `tests/nosql.test.mjs` cubre el parser seguro, filtros, proyecciones, CRUD, agregaciones y modo seguro del laboratorio NoSQL.
- `tests/nosql-ui.test.mjs` cubre la interfaz NoSQL, las plantillas sin solución y el revelado progresivo.
- `tests/challenges-ui.test.mjs` cubre las pestañas SQL/NoSQL/Depuración y la navegación al laboratorio.
- `tests/table-editor-ui.test.mjs` cubre los modos Vista/Editar del explorador, el aviso de cambios sin guardar, el bloqueo sin clave primaria y el límite de filas.
- `tests/donation-ui.test.mjs` cubre el modal de donaciones, el cambio Yape/Plin, la ausencia de números y la presencia de los QR.
- `tests/skill-level.test.mjs` cubre el perfil de nivel, el test adaptativo, los filtros SQL/NoSQL, la persistencia y el control de sonido.
- `tests/toolbar-ui.test.mjs` cubre la agrupación de acciones, el menú Más y la retirada de la importación de bases.
- `tests/license.test.mjs` cubre la licencia noncommercial, la nota de copyright y las rutas de los assets de la PWA.
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
- El editor visual vive en **Analizar → Explorador de tablas → Editar datos**. Asume que la tabla tiene una clave primaria y carga como máximo 100 filas por vez. Para tablas sin clave primaria o para editar el resto de los registros, usa consultas SQL.
- `sql.js` implementa SQLite, por lo que algunas funciones específicas de PostgreSQL, MySQL u Oracle no están disponibles.
- La PWA necesita HTTPS (Netlify lo proporciona). El asistente IA requiere conexión y la Netlify Function desplegada.
- En SQL, NoSQL y Depuración, los ejemplos y retos se adaptan al dataset activo. Al cambiar de dataset se muestra el contenido correspondiente a Escuela, Tienda o Biblioteca.
- Las guías de instalación son orientativas y enlazan a sitios oficiales; no sustituyen la documentación del fabricante ni incluyen instaladores propios.
- Firebase es un servicio en la nube: su guía cubre la consola web y el emulador local, no una instalación de servidor propio.

## Release Notes

### v1.14.0

- **Catálogo ampliado a doce gestores:** se suman MariaDB, Redis, Neo4j, Cassandra, Elasticsearch y Firebase.
- **Rutas específicas:** MariaDB y Elasticsearch incluyen Windows, macOS, Linux y Docker; Redis añade WSL2; Neo4j usa Desktop o Docker; Cassandra combina Docker y Homebrew.
- **Firebase sin servidor local:** la guía explica la consola web y el emulador de Firestore con Node.js y Java.
- **Contenido de soporte:** comandos de verificación, errores comunes, notas y seguridad para cada motor.
- **Fichas actualizadas:** licencias de Redis y Elasticsearch alineadas con sus versiones actuales.
- **Calidad:** pruebas para las doce guías, las plataformas de Firebase y la caché PWA `v31`.

### v1.13.0

- **Nueva pestaña Instalación:** tercera pestaña de Aprender con guías para SQLite, PostgreSQL, MySQL, SQL Server, MongoDB y Oracle.
- **Rutas por sistema operativo:** Windows, macOS, Linux y Docker según el gestor, con pasos y verificación.
- **Comandos copiables:** botón de copia en cada comando y enlaces a descargas y documentación oficial.
- **Errores y seguridad:** solución de problemas comunes, notas y recomendaciones para no exponer servicios locales.
- **Acceso desde las fichas:** botón **Cómo instalarlo** en el modal de cada gestor.
- **Contenido mantenible:** catálogo separado en `install-guides.js` con fecha de revisión.
- **Calidad:** nuevas pruebas del catálogo y de la interfaz, y caché PWA actualizada.

### v1.12.0

- **Barra de Practicar más limpia:** Reiniciar, Exportar y Guía se agrupan en el menú **Más**.
- **Importación retirada:** se eliminó el botón de importar bases SQLite y su lógica asociada.
- **Estado separado:** Guardado local y Modo seguro pasan a una barra secundaria, sin competir con las acciones principales.
- **NoSQL consistente:** el laboratorio usa la misma separación entre acciones y estado.
- **Accesibilidad:** cierre del menú con clic fuera o Escape y foco visible.
- **Caché PWA:** actualizada para la nueva interfaz.

### v1.11.0

- **Sonido opcional:** intro original sintetizada para el recorrido y feedback breve en aciertos y errores.
- **Sin autoplay:** el sonido está apagado por defecto y se activa desde la cabecera.
- **Preferencia persistente:** el estado se guarda en `localStorage`.
- **Sin licencias externas:** los sonidos se generan con Web Audio API.
- **Caché PWA:** actualizada para la nueva versión.

### v1.10.0

- **Perfil de nivel en Mi progreso:** niveles SQL/NoSQL, fecha del test, cambio manual, repetición del test y siguiente paso.
- **Acciones después del test:** conceptos a reforzar con acceso directo a la práctica correspondiente.
- **Recorrido de 5 minutos:** barra guiada para presentar la app en la feria paso a paso.
- **Reporte de aprendizaje:** resumen imprimible o guardable como PDF con niveles, actividad, conceptos y siguiente paso.
- **Pulido de experiencia:** etiquetas accesibles, foco visible, modo oscuro, responsive y respeto por movimiento reducido.
- **Materiales de feria:** `FERIA.md` con pitch, demo, arquitectura, impacto, roadmap y FAQ; `feria.html` como one-pager imprimible.
- **QR de demo:** código QR listo para el stand.
- **Caché PWA:** actualizada para la nueva versión.

### v1.9.0

- **Test de habilidad adaptativo:** seis preguntas por recorrido que ajustan la dificultad según las respuestas.
- **Niveles separados:** perfil independiente para SQL y NoSQL, guardado en `localStorage`.
- **Practicar por nivel:** las categorías de ejemplos SQL se filtran según el nivel activo y se pueden mostrar todas.
- **NoSQL por nivel:** los ejemplos y la sintaxis rápida se adaptan al nivel; la consola y las colecciones siguen disponibles.
- **Control manual:** selector de nivel, opción **Ver todo** y botón para empezar desde cero.
- **Resultado accionable:** el test recomienda el siguiente paso y permite repetirlo.
- **Calidad:** pruebas del test adaptativo, filtros, persistencia y banco de preguntas.
- **Caché PWA:** actualizada para el nuevo onboarding y los filtros.

### v1.8.0

- **Licencia noncommercial:** el proyecto pasa a PolyForm Noncommercial 1.0.0; el uso comercial requiere permiso escrito.
- **Licencia comercial:** se añade la vía de contacto para empresas, academias y bootcamps.
- **Marca:** se aclara que MNTWARE y SQL Academy no pueden usarse para promocionar derivados sin permiso.
- **Assets ordenados:** iconos PWA, QR de donaciones y logos quedan dentro de `assets/`.
- **Repositorio más limpio:** se eliminaron dos logos sin uso y archivos `.gitkeep` innecesarios.
- **Caché PWA:** actualizada para las nuevas rutas de assets.

### v1.7.10

- **QR centrado:** el modal de donaciones usa una columna centrada, sin el espacio vacío lateral.
- **Interfaz más compacta:** el QR, las instrucciones y el monto libre comparten el mismo eje visual.
- **Sin emojis:** se retiraron los emojis de las frases y el icono de corazón de la donación.
- **Caché PWA:** actualizada para el nuevo layout.

### v1.7.9

- **Donación más directa:** el modal reduce el texto a una frase de introducción, el QR y una línea de monto libre.
- **Menos pasos:** se eliminaron las listas de instrucciones y transparencia; el QR y las pestañas Yape/Plin concentran la acción.
- **Mismo enfoque voluntario:** se mantiene “desde S/1”, la frase de humor y el aviso de que no bloquea funciones.
- **Caché PWA:** actualizada para el modal simplificado.

### v1.7.8

- **Donaciones voluntarias:** nuevo modal **Apoyar SQL Academy** con Yape y Plin, sin exponer números de teléfono.
- **Monto libre:** se puede donar desde S/1 sin montos fijos ni obligación.
- **Más confianza:** explicación del destino del apoyo, QR ampliable y mensaje de agradecimiento.
- **Enfoque transparente:** se aclara que la donación no desbloquea funciones ni certificados.
- **Preparado para crecer:** PayPal y Ko-fi quedan definidos en el código, ocultos hasta que se activen.
- **Calidad:** pruebas del modal, cambio de método, ausencia de números y presencia de ambos QR.
- **Caché PWA:** actualizada para los nuevos estilos y el QR de Plin.

### v1.7.7

- **Editor de datos integrado en Analizar:** el explorador de tablas ahora tiene modos **Vista** y **Editar datos**.
- **Practicar más limpio:** el bloque de edición dejó de ocupar el ancho completo al final de la sección de práctica.
- **Edición más segura:** aviso de cambios sin guardar, confirmación al cambiar de tabla o de modo, bloqueo de tablas sin clave primaria y límite de 100 filas por carga.
- **Restaurar datos:** botón para recuperar los datos originales del dataset activo sin salir del explorador.
- **Mejor jerarquía:** la edición comparte el espacio con la estructura y la vista previa de la tabla seleccionada.
- **Calidad:** pruebas de modos, cambios sin guardar, tablas sin clave primaria y límite de filas.
- **Caché PWA:** actualizada para los nuevos estilos y controles.

### v1.7.6

- **Retos de depuración:** nueva pestaña **Depuración** en Retos con 4 ejercicios **Encuentra el error** por dataset.
- **Aprendizaje aplicado:** cada reto muestra una consulta rota, el síntoma, una pista y un editor para corregirla.
- **Validación por resultado:** la corrección se compara con la solución esperada; no importa el texto exacto.
- **Progreso propio:** avance, reinicio y solución después de dos intentos fallidos, sin afectar a los retos SQL.
- **Tres datasets:** Escuela, Tienda y Biblioteca, con errores de `JOIN`, `GROUP BY`, `HAVING` y subconsultas.
- **Autocompletado:** el editor de depuración sugiere tablas, columnas y palabras clave.
- **Calidad:** pruebas de catálogo, ejecución de soluciones, consultas rotas y flujo de la pestaña.
- **Caché PWA:** actualizada para el nuevo contenido.

### v1.7.5

- **Distribución de Práctica SQL:** la barra de ejemplos ahora vive en la columna del editor, igual que en el laboratorio NoSQL.
- **Mejor jerarquía:** ejemplos, editor, historial y resultados comparten la misma columna; las tablas quedan en la barra lateral.
- **Responsive:** en pantallas estrechas se mantiene el orden de NoSQL: barra lateral y después editor con ejemplos.
- **Caché PWA:** actualizada para el nuevo layout.

### v1.7.4

- **Limpiar en NoSQL:** el botón «Limpiar» del editor ahora vacía el comando, igual que en SQL.
- **Limpiar resultados:** se añadió una acción independiente en el panel de resultados.
- **Historial intacto:** limpiar el editor ya no afecta al historial ni a los resultados.
- **Calidad:** pruebas de limpieza de editor y de resultados NoSQL.

### v1.7.3

- **Ejemplos sin auto-ejecución:** al elegir un ejemplo SQL o NoSQL, la consulta se carga en el editor pero no se ejecuta.
- **Botón Ejecutar útil:** ahora puedes revisar, editar o formatear el ejemplo antes de lanzarlo.
- **Resultados claros:** el panel muestra «Ejemplo cargado. Pulsa Ejecutar» en lugar de dejar resultados antiguos.
- **Textos actualizados:** las barras de ejemplos explican el nuevo flujo.

### v1.7.2

- **Logos en modo oscuro:** se eliminaron los rellenos blancos internos de la Q de MySQL y de la Q/e de SQLite.
- **Transparencia completa:** los huecos de las letras ahora muestran el fondo de la tarjeta.
- **Caché PWA:** actualizada para servir las imágenes corregidas.

### v1.7.1

- **Modo oscuro:** los logos de MySQL y SQLite ya no muestran el fondo blanco.
- **Variantes de logo:** se añadieron versiones transparentes y variantes con texto claro para fondos oscuros.
- **Biblioteca y fichas:** el cambio se aplica tanto a las tarjetas de Aprender como al modal de cada motor.
- **Caché PWA:** actualizada para servir los nuevos recursos.

### v1.7.0

- **Biblioteca de aprendizaje:** Aprender y Conceptos se unifican en una sola sección con pestañas.
- **Buscador y filtros:** encuentra motores y conceptos por texto, tecnología, nivel o tema.
- **Asistente de motor:** un cuestionario de cuatro preguntas recomienda el motor más adecuado y explica cuándo evitarlo.
- **Fichas de concepto mejoradas:** diagramas, errores comunes, ejemplos copiables, conceptos relacionados y acciones de práctica.
- **Mini-quizzes:** dos preguntas por concepto, respuestas rotadas y progreso persistente.
- **Mi progreso:** nueva sección de biblioteca de conceptos con avance y acceso directo.
- **Contenido ampliado:** nuevas fichas de Tipos de JOIN y Teorema CAP, además de textos y tildes revisados.
- **Calidad:** pruebas de pestañas, filtros, asistente, quiz y progreso.

### v1.6.0

- **Torre de Datos:** nuevo minijuego deckbuilder con 6 pisos, cartas SQL y una base de datos propia.
- **Construcción de consultas con cartas:** cláusulas, tablas, columnas, valores, funciones y operadores.
- **Deckbuilding:** después de cada piso eliges una recompensa que se añade a tu mazo para los siguientes niveles.
- **Controles para todos:** ratón, teclado y mando con Gamepad API (stick/D-pad, A, B, X, Y).
- **Progreso de juego:** puntuación, pistas, intentos, pisos completados y recompensas guardadas en `localStorage`.
- **Validación real:** cada piso se comprueba ejecutando la consulta contra SQLite y comparando el resultado.
- **Calidad:** pruebas de la base del juego, las soluciones de los pisos, las recompensas y el flujo de juego.

### v1.5.9

- **Panel Mi progreso:** nueva pestaña dentro de la Ruta con resumen global de lecciones y retos.
- **Dominio por concepto:** barras y porcentajes para `SELECT`, filtros, ordenación, `LIMIT`, `JOIN`, agrupaciones, `HAVING` y subconsultas.
- **Progreso por dataset:** avance independiente de Escuela, Tienda y Biblioteca.
- **Siguiente paso recomendado:** botones para continuar una lección, practicar un reto o cambiar de dataset.
- **Actividad reciente:** últimas lecciones y retos completados con su fecha.
- **Calidad:** pruebas del dashboard, métricas, recomendaciones y actividad reciente.

### v1.5.8

- **Ruta de aprendizaje SQL:** 8 lecciones progresivas con editor propio, objetivo, explicación, ejemplo y pista.
- **Contenido adaptado:** las lecciones cambian según el dataset activo (Escuela, Tienda o Biblioteca).
- **Validación por resultado:** se comparan columnas, filas y valores de la consulta del usuario con la solución esperada.
- **Progreso persistente:** cada lección completada se guarda por dataset y se puede reiniciar desde la propia ruta.
- **Navegación guiada:** botón para continuar con la siguiente lección y acceso directo desde la barra principal.
- **Calidad:** pruebas de las 8 lecciones en los tres datasets, del progreso y de la validación de ejercicios.

### v1.5.7

- **Autocompletado contextual:** sugerencias de tablas, columnas, palabras clave y funciones en SQL; colecciones, métodos, campos y operadores en NoSQL.
- **Sugerencias inteligentes:** resuelve alias de tablas, califica columnas cuando hay varias tablas y evita activarse dentro de cadenas o comentarios.
- **Navegación por teclado:** `↑`/`↓` para moverse, `Enter` o `Tab` para aceptar y `Esc` para cerrar.
- **Integrado en todos los editores:** práctica SQL, retos SQL, laboratorio NoSQL y retos NoSQL de la página Retos.
- **Calidad:** pruebas de sugerencias SQL/NoSQL, alias, cadenas y aplicación con teclado.

### v1.5.6

- **Reto NoSQL en la página Retos:** el panel «Reto NoSQL activo» se quitó del laboratorio y ahora el reto se resuelve en la pestaña Retos, con editor propio, pista y validación por resultados.
- **Flujo unificado:** los retos SQL y NoSQL se resuelven en el mismo lugar, con botones «Comprobar reto», «Limpiar» y «Ver solución».
- **Botón para abrir en laboratorio:** se puede seguir llevando el reto al laboratorio NoSQL para practicar libremente.
- **Calidad:** pruebas del editor NoSQL en Retos, de la validación sin el laboratorio y de la ausencia del panel antiguo.

### v1.5.5

- **Pestaña Analizar renovada:** resumen del dataset, explorador de tablas y panel de calidad de datos.
- **Sin gráficos dependientes del dataset:** se eliminó Chart.js y los gráficos que solo funcionaban con la tabla `estudiantes`.
- **Explorador útil para cualquier base:** columnas, tipos, claves, filas y vista previa de cada tabla.
- **Acciones rápidas:** copiar un `SELECT` o cargarlo en el editor para practicar.
- **Calidad de datos:** detección de tablas vacías, tablas sin clave primaria, relaciones huérfanas, valores nulos y columnas sin tipo.
- **Diseño:** nuevos estilos responsive y overrides de modo oscuro para el panel.
- **Calidad:** pruebas del resumen, del explorador, de los checks y de la ausencia de Chart.js.

### v1.5.4

- **Ejemplos en un clic:** los ejemplos SQL se ejecutan al cambiar de categoría o pulsar «Siguiente ejemplo»; los ejemplos NoSQL se ejecutan al seleccionarlos.
- **Menos fricción:** barras de ejemplo dedicadas, estado del ejemplo cargado y botón «Siguiente ejemplo» en SQL y NoSQL.
- **Interfaz más clara:** toolbars agrupadas por acción, historial con limpieza en su cabecera y placeholders de resultados más útiles.
- **Diseño refinado:** superficies, bordes, sombras y espaciados consistentes; mejoras de modo oscuro y responsive.
- **Calidad:** pruebas de auto-ejecución, estado de ejemplos y cambio al siguiente ejemplo.

### v1.5.3

- **Retos NoSQL más justos:** al abrir un reto se carga una plantilla mínima, no la solución.
- **Solución progresiva:** el botón «Ver solución» aparece tras dos intentos fallidos y solo rellena el editor.
- **Página Retos unificada:** pestañas SQL/NoSQL; los retos NoSQL se exploran desde Retos y se resuelven en el laboratorio.
- **Calidad:** pruebas de plantillas, revelado de solución, pestañas y navegación al laboratorio.

### v1.5.2

- **Práctica SQL por dataset:** los ejemplos guiados y los retos ahora se adaptan a Escuela, Tienda y Biblioteca.
- **Tienda SQL:** ejemplos de consultas, filtros, orden, agregaciones, `GROUP BY`, `HAVING`, `JOIN`, subconsultas, operadores y CRUD.
- **Biblioteca SQL:** ejemplos equivalentes sobre autores, libros, socios y préstamos.
- **Retos nuevos:** seis retos para Tienda y seis para Biblioteca, con validación por resultados.
- **Selector dinámico:** las categorías de ejemplos se actualizan al cambiar de dataset.
- **Calidad:** pruebas de catálogos, ejecución de SQL con SQLite y cambio de dataset en la interfaz.

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

Este proyecto usa la **PolyForm Noncommercial License 1.0.0**. Consulta el archivo `LICENSE`.

- **Permitido:** uso personal, educativo, investigación y proyectos no comerciales.
- **No permitido sin permiso escrito:** vender el proyecto, revenderlo, ofrecerlo como servicio de pago o incluirlo en un producto comercial.
- **Licencia comercial:** si necesitas usar SQL Academy con fines comerciales, contacta con MNTWARE a través de [GitHub](https://github.com/diegomorantemz).
- La licencia cubre el código y el contenido original del proyecto.
- Las versiones publicadas antes de la v1.8.0 se distribuyeron bajo licencia MIT.
- Las dependencias y recursos de terceros conservan sus propias licencias.

## Marca

MNTWARE y SQL Academy son nombres del autor. No se permite usar sus nombres o logos para promocionar productos derivados sin permiso previo.
