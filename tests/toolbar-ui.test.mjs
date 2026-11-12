import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const html = fs.readFileSync(new URL('../index.html', import.meta.url), 'utf8');
const script = fs.readFileSync(new URL('../script.js', import.meta.url), 'utf8');
const readme = fs.readFileSync(new URL('../README.md', import.meta.url), 'utf8');

test('la barra de Practicar agrupa las acciones secundarias', () => {
    assert.doesNotMatch(html, /importDatabase/);
    assert.doesNotMatch(html, /Importar BD/);
    assert.doesNotMatch(script, /function importDatabase/);
    assert.doesNotMatch(script, /window\.importDatabase/);

    assert.match(html, /id="sqlMoreMenu"/);
    assert.match(html, /class="toolbar-more-menu"/);
    assert.match(html, /Reiniciar base/);
    assert.match(html, /Exportar base/);
    assert.match(html, /Guía de primeros pasos/);
    assert.match(html, /id="datasetSelector"/);
    assert.match(html, /id="aiHelpBtn"/);
    assert.match(html, /class="editor-statusbar"/);
    assert.match(html, /onclick="closeToolbarMore\(\);/);
});

test('la barra NoSQL mantiene el estado separado de las acciones', () => {
    assert.match(html, /id="nosqlPersistenceStatus"/);
    assert.match(html, /id="nosqlSafeModeToggle"/);
    assert.match(html, /class="editor-statusbar"/);

    const nosqlToolbar = html.slice(
        html.indexOf('class="editor-toolbar nosql-toolbar"'),
        html.indexOf('class="editor-statusbar"', html.indexOf('class="editor-toolbar nosql-toolbar"'))
    );
    assert.doesNotMatch(nosqlToolbar, /nosqlPersistenceStatus/);
    assert.doesNotMatch(nosqlToolbar, /nosqlSafeModeToggle/);
});

test('la documentación ya no promete importar bases externas', () => {
    assert.doesNotMatch(readme, /Al importar/);
    assert.doesNotMatch(readme, /Descarga y carga de archivos SQLite/);
});
