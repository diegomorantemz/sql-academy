import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { DatabaseSync } from 'node:sqlite';
import { JSDOM } from 'jsdom';

const dom = new JSDOM(
    `<!doctype html><html><body>
        <div id="analyzeSummary"></div>
        <div class="analyze-mode-toggle">
            <button type="button" class="analyze-mode-btn active" data-analyze-mode="view" aria-pressed="true"></button>
            <button type="button" class="analyze-mode-btn" data-analyze-mode="edit" aria-pressed="false"></button>
        </div>
        <div id="analyzeTableList"></div>
        <div id="analyzeTableDetail"></div>
        <div id="analyzeTableEditor" hidden>
            <strong id="analyzeEditorTableName"></strong>
            <span id="tableEditorStatus" hidden></span>
            <p id="tableEditorNote"></p>
            <button type="button" data-editor-action="add"></button>
            <button type="button" data-editor-action="save"></button>
            <button type="button" data-editor-action="restore"></button>
            <div id="tableEditorContent"></div>
        </div>
        <div id="analyzeQuality"></div>
        <textarea id="sqlEditor"></textarea>
        <ul id="historyList"></ul>
        <div id="resultOutput"></div>
        <div id="toastContainer"></div>
        <div id="challengeList"></div>
        <div id="challengeDetail"></div>
        <strong id="challengeProgressText"></strong>
        <div id="challengeProgressBar"></div>
        <div id="challengeProgressTrack"></div>
        <span id="currentYear"></span>
        <button id="installAppBtn"></button>
        <button id="themeToggle"></button>
        <select id="datasetSelector"></select>
        <input id="safeModeToggle" type="checkbox">
        <select id="categorySelector"></select>
        <span id="sqlExampleStatus"></span>
    </body></html>`,
    {
        url: 'https://sql-academy.test/',
        runScripts: 'outside-only',
        pretendToBeVisual: true
    }
);

const { window } = dom;
window.confirm = () => true;
window.eval(fs.readFileSync(new URL('../datasets.js', import.meta.url), 'utf8'));
window.eval(fs.readFileSync(new URL('../courses.js', import.meta.url), 'utf8'));
window.eval(fs.readFileSync(new URL('../course-content.js', import.meta.url), 'utf8'));
window.eval(fs.readFileSync(new URL('../checkpoint-content.js', import.meta.url), 'utf8'));
window.eval(fs.readFileSync(new URL('../script.js', import.meta.url), 'utf8'));

const database = new DatabaseSync(':memory:');
database.exec(`
    CREATE TABLE estudiantes (
        id INTEGER PRIMARY KEY,
        nombre TEXT NOT NULL,
        promedio REAL,
        carrera TEXT
    );
    INSERT INTO estudiantes VALUES
        (1, 'Ana', 15.5, 'Ingenieria'),
        (2, 'Luis', 17.2, 'Medicina'),
        (3, 'Eva', 12.8, 'Derecho');

    CREATE TABLE cursos (
        id INTEGER PRIMARY KEY,
        nombre TEXT NOT NULL
    );
    INSERT INTO cursos VALUES (1, 'SQL');
`);

const adapter = {
    exec(sql) {
        const statement = database.prepare(sql);
        const rows = statement.all();
        const columns = statement.columns().map(column => column.name);
        return [{
            columns,
            values: rows.map(row => columns.map(column => row[column]))
        }];
    }
};

function editorContent() {
    return window.document.getElementById('tableEditorContent');
}

test('el explorador alterna entre vista y edición de datos', () => {
    window.renderAnalyzePanel(adapter);
    window.selectAnalyzeTable('estudiantes', adapter);

    assert.equal(window.document.getElementById('analyzeTableDetail').hidden, false);
    assert.equal(window.document.getElementById('analyzeTableEditor').hidden, true);
    assert.match(window.document.getElementById('analyzeTableDetail').textContent, /estudiantes/);

    const editButton = window.document.querySelector('#analyzeTableDetail [data-analyze-action="edit"]');
    assert.ok(editButton, 'La vista de la tabla debe ofrecer acceso a la edición');
    editButton.click();

    assert.equal(window.document.getElementById('analyzeTableDetail').hidden, true);
    assert.equal(window.document.getElementById('analyzeTableEditor').hidden, false);
    assert.equal(window.document.getElementById('analyzeEditorTableName').textContent, 'estudiantes');
    assert.equal(editorContent().querySelectorAll('.cell-input').length, 12);
    assert.match(window.document.getElementById('tableEditorNote').textContent, /3 fila\(s\)/);
    assert.equal(window.document.querySelector('[data-editor-action="add"]').disabled, false);
    assert.equal(window.document.querySelector('[data-editor-action="save"]').disabled, false);
});

test('el editor avisa de cambios sin guardar y evita perderlos al cambiar de modo', () => {
    const input = editorContent().querySelector('.cell-input:not(.pk-input)');
    input.value = 'Ana Maria';
    input.dispatchEvent(new window.Event('input', { bubbles: true }));

    const status = window.document.getElementById('tableEditorStatus');
    assert.equal(status.hidden, false);
    assert.equal(window.hasUnsavedTableEditorChanges(), true);

    let confirmMessage = '';
    window.confirm = message => {
        confirmMessage = message;
        return false;
    };

    window.setAnalyzeExplorerMode('view', adapter);
    assert.match(confirmMessage, /cambios sin guardar/i);
    assert.equal(window.document.getElementById('analyzeTableEditor').hidden, false);

    window.confirm = () => true;
    window.setAnalyzeExplorerMode('view', adapter);
    assert.equal(window.document.getElementById('analyzeTableEditor').hidden, true);

    window.loadTableEditor('estudiantes', adapter);
    assert.equal(window.hasUnsavedTableEditorChanges(), false);
});

test('el editor bloquea tablas sin clave primaria', () => {
    database.exec(`
        CREATE TABLE sin_pk (nombre TEXT);
        INSERT INTO sin_pk VALUES ('Sin clave');
    `);

    window.selectAnalyzeTable('sin_pk', adapter);
    window.setAnalyzeExplorerMode('edit', adapter);

    assert.match(editorContent().textContent, /clave primaria/i);
    assert.equal(window.document.querySelector('[data-editor-action="add"]').disabled, true);
    assert.equal(window.document.querySelector('[data-editor-action="save"]').disabled, true);

    window.setAnalyzeExplorerMode('view', adapter);
});

test('el editor limita la carga a 100 filas y lo avisa', () => {
    database.exec('CREATE TABLE muchas (id INTEGER PRIMARY KEY, valor TEXT);');
    const insert = database.prepare('INSERT INTO muchas (valor) VALUES (?)');
    for (let index = 0; index < 105; index += 1) {
        insert.run(`fila ${index + 1}`);
    }

    window.selectAnalyzeTable('muchas', adapter);
    window.setAnalyzeExplorerMode('edit', adapter);

    assert.equal(editorContent().querySelectorAll('.cell-input').length, 200);
    assert.match(window.document.getElementById('tableEditorNote').textContent, /100 de 105 filas/);
});

test('el editor de datos vive en Analizar y ya no ocupa Practicar', () => {
    const html = fs.readFileSync(new URL('../index.html', import.meta.url), 'utf8');
    const document = new JSDOM(html).window.document;

    assert.match(html, /data-analyze-mode="edit"/);
    assert.doesNotMatch(html, /id="tableSelector"/);
    assert.match(html, /Los cambios que guardes afectan a la base de datos activa/);
    assert.match(html, /onclick="restoreAnalyzeDatasetData\(\)"/);
    assert.ok(document.querySelector('#section-analyze #analyzeTableEditor'));
    assert.ok(document.querySelector('#section-analyze #tableEditorContent'));
    assert.equal(document.querySelector('#section-practice #tableEditorContent'), null);
    assert.equal(document.querySelectorAll('#tableEditorContent').length, 1);
});
