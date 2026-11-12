# SQL Academy

Aplicación web para aprender SQL y NoSQL practicando con consultas reales en el navegador.

**Demo:** [https://sql-academy.netlify.app](https://sql-academy.netlify.app)

**Materiales de feria:** [FERIA.md](FERIA.md) · [feria.html](feria.html)

## Resumen

SQL Academy es una página web que hice para un curso de 18 semanas. Sirve para aprender SQL y NoSQL practicando: escribes una consulta, la ejecutas y ves el resultado al instante, sin instalar un gestor de bases de datos.

La base SQL funciona con SQLite dentro del navegador y el laboratorio NoSQL tiene una consola parecida a MongoDB. También hay cursos, retos y tres bases de práctica. El progreso se guarda solo, y el asistente con IA es opcional para explicar errores o dar pistas.

## Puntos destacados

- Base de datos SQLite real en el navegador, sin backend para las consultas.
- Persistencia automática del archivo SQLite en IndexedDB y del historial, preferencias y progreso de retos, cursos y conceptos en `localStorage`.
- Modo seguro activado por defecto para confirmar `DROP`, `TRUNCATE`, `DELETE` sin `WHERE`, `UPDATE` sin `WHERE` y `ALTER TABLE ... DROP`.
- Resultados paginados, ordenables, copiables y exportables a CSV o JSON.
- Retos SQL y NoSQL por dataset con validación por resultados, pistas y progreso guardado.
- Retos de depuración **Encuentra el error**: consulta rota, síntoma, pista, editor de corrección y validación por resultado en los tres datasets SQL.
- Test de habilidad adaptativo con niveles separados para SQL y NoSQL. Practicar y el laboratorio filtran ejemplos y sintaxis según el nivel, con opción de ver todo.
- Ejemplos en un clic: al elegir una categoría o un ejemplo, la consulta se carga en el editor y se ejecuta con el botón «Ejecutar».
- Tres datasets de práctica en SQL y tres en NoSQL: Escuela, Tienda y Biblioteca.
- Panel **Analizar** con resumen del dataset, diagrama ERD, explorador de tablas con vista y edición de datos, y comprobaciones de calidad.
- Cursos guiados con tres itinerarios SQL y uno NoSQL, 15 lecciones teórico-prácticas, quizzes, checkpoints de módulo, proyecto final evaluable, progreso por etapas y selector de dataset.
- Biblioteca de aprendizaje con guías, conceptos, buscador, filtros, asistente de motor y mini-quizzes.
- Guías de instalación paso a paso para doce gestores SQL y NoSQL, con rutas para Windows, macOS, Linux y Docker, comandos copiables y enlaces oficiales.
- Panel **Mi progreso** con avance por curso, dominio por concepto SQL, progreso por dataset, actividad reciente y recomendaciones.
- **Torre de Datos:** minijuego deckbuilder con 6 pisos, cartas SQL, recompensas y soporte para teclado, ratón y mando.
- Autocompletado contextual de tablas, columnas, palabras clave, colecciones, métodos y campos en los editores SQL y NoSQL.
- Laboratorio NoSQL documental con consola tipo MongoDB, CRUD, agregaciones, ejemplos y retos por dataset.
- Asistente IA con modos de error, explicación, pista, revisión, generación de ejercicios y ayuda para comandos NoSQL.
- Aplicación instalable (PWA) con icono propio, modo oscuro, barra inferior en móvil y auditoría de accesibilidad con axe.
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
