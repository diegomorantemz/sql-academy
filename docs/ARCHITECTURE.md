# Arquitectura del proyecto

SQL Academy es una aplicación estática: no hay bundler ni paso de compilación. `index.html` carga scripts clásicos en orden y el service worker precarga el app shell.

## Carpetas

```text
js/
  app.js                 Utilidades, editor, preferencias y arranque
  app/navigation.js      Navegación entre secciones y hoja móvil
  core/                  Estado, almacenamiento, DOM, formatos y base de datos
  data/                  Datasets, cursos, lecciones y guías de instalación
  features/              Funciones por dominio
  games/                 Torre de Datos y Monte Mamut
styles/                  Estilos separados por área, en orden de cascade
tests/unit/              Pruebas unitarias con node:test y JSDOM
tests/e2e/               Pruebas de navegador con Playwright
tests/helpers/           Arranque compartido de las pruebas
scripts/                 Verificación de sintaxis
```

## Orden de carga

1. `js/core/state.js`
2. `js/core/storage.js`, `dom.js`, `format.js`, `database.js`
3. `js/data/*`
4. `js/features/nosql/engine.js`
5. `js/app.js` y `js/app/navigation.js`
6. `js/features/*`
7. `js/games/*`

Los scripts comparten el ámbito global. El estado mutable compartido vive en `js/core/state.js`; el resto de las funciones se declaran en su archivo de dominio y quedan disponibles para los `onclick` del HTML.

## Cómo agregar un archivo

1. Crear el archivo en la carpeta del dominio.
2. Agregar el `<script>` en `index.html` respetando el orden anterior.
3. Agregar la ruta a `APP_SHELL` en `service-worker.js`.
4. Agregar la ruta a `APP_SCRIPTS` en `tests/helpers/app.mjs` si debe cargarse con la app.
5. Ejecutar `npm run check` y `npm run test:e2e`.
6. Subir `CACHE_VERSION` en `service-worker.js` si cambian assets del app shell.

## Pruebas

- `npm test`: pruebas unitarias.
- `npm run check`: sintaxis de todos los archivos y pruebas unitarias.
- `npm run test:e2e`: pruebas de navegador en varios viewports.

`tests/structure.test.mjs` verifica que `index.html`, `APP_SCRIPTS`, `STYLE_FILES` y `APP_SHELL` sigan sincronizados.

## Restricciones actuales

- No se usan ES modules para no romper los `onclick` inline ni el modelo de scripts clásicos.
- Las funciones globales que usa el HTML no deben renombrarse sin actualizar `index.html`.
- Los materiales de feria y los QR se mantienen en la raíz para no romper enlaces impresos.
