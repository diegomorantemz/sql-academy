# SQL Academy en la feria

Materiales de apoyo para presentar el proyecto: pitch, recorrido de demo, arquitectura, impacto, roadmap y preguntas frecuentes.

## Pitch de 30 segundos

SQL Academy es una academia interactiva para aprender SQL y NoSQL con una base de datos real en el navegador. Primero detecta tu nivel con un test adaptativo, después te muestra práctica adecuada para ese nivel y te acompaña con retos, explicaciones y progreso. No necesitas instalar nada.

## Pitch de 1 minuto

Aprender SQL suele ser abstracto: muchos cursos muestran teoría, pero el estudiante no practica con datos reales ni sabe si está en el nivel correcto. SQL Academy resuelve eso con una experiencia guiada: un test adaptativo recomienda un nivel para SQL y otro para NoSQL; Practicar y el laboratorio filtran ejemplos y sintaxis; los retos validan resultados reales; y el panel de progreso muestra qué sigue.

Todo funciona en el navegador con SQLite real y un motor NoSQL propio. La base de datos y el progreso se guardan localmente. El asistente IA es opcional y recibe solo la consulta, el error y el esquema, nunca los registros.

## Demo de 5 minutos

### 0:00 — Problema

"Los cursos tradicionales no se adaptan al nivel del estudiante y separan la teoría de la práctica. El estudiante se pierde entre conceptos, sintaxis y ejemplos que no corresponden a su nivel."

### 0:45 — Test de nivel

1. Abrir **Practicar**.
2. Mostrar la barra **Tu nivel SQL**.
3. Pulsar **Test de nivel**.
4. Responder algunas preguntas y llegar al resultado.
5. Mostrar el nivel recomendado y los conceptos a reforzar.

Mensaje: "La app no solo dice el nivel: recomienda qué practicar después."

### 1:45 — Práctica personalizada

1. Volver a Practicar.
2. Mostrar que las categorías y ejemplos están filtrados por nivel.
3. Cambiar a **Ver todo** y mostrar que no hay bloqueos.
4. Elegir un ejemplo y pulsar **Ejecutar**.
5. Mostrar resultados reales y la tabla de datos.

Mensaje: "El estudiante practica con una base SQLite real, no con una simulación falsa."

### 2:45 — Laboratorio NoSQL

1. Abrir **NoSQL**.
2. Mostrar la barra de nivel NoSQL.
3. Ver cómo los ejemplos y la sintaxis rápida cambian según el nivel.
4. Ejecutar un `find` o una agregación.

Mensaje: "También cubrimos el modelo documental, con una consola segura y sin ejecutar JavaScript arbitrario."

### 3:30 — Retos y depuración

1. Abrir **Retos**.
2. Mostrar un reto SQL o una depuración.
3. Ejecutar una solución o una consulta incorrecta.
4. Mostrar la validación por resultado.

Mensaje: "No validamos texto: validamos el resultado real de la consulta."

### 4:15 — Progreso

1. Abrir **Ruta → Mi progreso**.
2. Mostrar el perfil SQL/NoSQL, actividades, conceptos y siguiente paso.
3. Mostrar el reporte de aprendizaje.

Mensaje: "El estudiante ve su avance y puede imprimir un reporte tangible."

### 4:45 — Cierre técnico

- SQLite real en el navegador con `sql.js`.
- Motor NoSQL documental propio.
- PWA instalable.
- Datos y progreso locales.
- Asistente IA opcional mediante proxy seguro.
- Más de 100 pruebas automatizadas.

## Diapositiva de arquitectura

```text
Navegador
├── Interfaz estática: HTML + CSS + JavaScript
├── SQLite real con sql.js
├── Motor NoSQL documental propio
├── IndexedDB: base SQLite persistente
├── localStorage: preferencias, progreso y nivel
├── Service Worker: PWA y caché
└── Asistente IA opcional
        └── Netlify Function → Gemini
```

Mensaje clave:

- Las consultas no salen del navegador.
- No hay backend para practicar SQL.
- La IA es opcional y no recibe registros.
- La app funciona como PWA.

## Diapositiva de impacto

- **Personalización:** test adaptativo y niveles separados para SQL y NoSQL.
- **Aprendizaje activo:** práctica con datos reales, validación por resultados y feedback inmediato.
- **Bajo costo:** funciona en el navegador y no necesita servidores para las consultas.
- **Privacidad:** los datos de práctica se quedan en el dispositivo.
- **Accesibilidad:** interfaz responsive, modo oscuro y navegación por teclado.
- **Escalabilidad educativa:** puede crecer hacia aulas, rutas personalizadas y reportes docentes.

## Roadmap

1. Modo docente con grupos, asignaciones y progreso del aula.
2. Reportes de grupo exportables.
3. Sincronización opcional en la nube.
4. Certificaciones con evaluación más rigurosa.
5. Nuevas rutas: entrevistas, análisis de datos, modelado y rendimiento.
6. Más ejercicios de depuración y análisis de resultados.

## Preguntas frecuentes del jurado

### ¿Esto es solo un editor SQL?

No. Incluye test de nivel, ruta guiada, ejemplos adaptados, retos, depuración, laboratorio NoSQL, juego, análisis de datos, progreso y reportes.

### ¿Cómo se adapta al estudiante?

Con un test adaptativo de seis preguntas, niveles independientes para SQL y NoSQL, filtros de ejemplos y recomendaciones de refuerzo.

### ¿Qué pasa si el test se equivoca?

El nivel no bloquea contenido. El estudiante puede cambiarlo manualmente, elegir **Ver todo** o repetir el test.

### ¿Dónde se guardan los datos?

La base SQLite y el progreso se guardan localmente en el navegador. No hay un servidor que almacene las consultas.

### ¿La IA ve mis datos?

No. El asistente recibe la consulta, el error y el esquema de la base. Nunca los registros.

### ¿En qué se diferencia de ChatGPT?

SQL Academy tiene una secuencia pedagógica, ejercicios validados, una base de datos real y progreso persistente. ChatGPT puede explicar, pero no comprobar el resultado de una consulta contra una base real ni acompañar una ruta estructurada.

### ¿Es gratis?

Sí. El núcleo educativo es gratuito. Hay donaciones voluntarias y una licencia noncommercial para evitar usos comerciales sin permiso.

### ¿Se puede usar en un aula?

Sí. El siguiente paso es un modo docente con grupos, asignaciones y reportes. Hoy ya se puede usar de forma individual.

### ¿Cómo se monetiza?

Donaciones voluntarias y, más adelante, licencias comerciales, planes para aulas o contenidos avanzados. Sin anuncios invasivos.

## Checklist para la feria

- [ ] Laptop cargada y cargador.
- [ ] Demo abierta en una pestaña y app limpia en otra.
- [ ] Perfil de prueba y recorrido de 5 minutos revisados.
- [ ] QR de la demo impreso o visible.
- [ ] Video de respaldo grabado por si falla la conexión.
- [ ] Versión offline comprobada.
- [ ] Diapositivas en PDF y en markdown.
- [ ] Pitch de 30 segundos ensayado.
- [ ] Demo de 5 minutos ensayada.
- [ ] Respuestas a las preguntas frecuentes.
- [ ] Reporte de aprendizaje de ejemplo impreso.
- [ ] Contacto o GitHub visible.

## Métricas para mencionar

- 3 datasets SQL y 3 datasets NoSQL.
- 8 lecciones por dataset.
- Retos SQL, NoSQL y de depuración.
- 6 pisos en Torre de Datos.
- Más de 100 pruebas automatizadas.
- PWA instalable.
- Sin backend para ejecutar consultas.

## Recomendación final

No presentes la app como una lista de funciones. Preséntala como un recorrido:

1. El estudiante no sabe dónde empezar.
2. La app detecta su nivel.
3. Le muestra práctica adecuada.
4. Practica con datos reales.
5. Recibe feedback y ve su progreso.
6. Puede seguir avanzando.

Ese es el hilo que el jurado debe recordar.
