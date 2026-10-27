import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { JSDOM } from 'jsdom';

const dom = new JSDOM(
    `<!doctype html><html><body>
        <textarea id="sqlEditor"></textarea>
        <ul id="historyList"></ul>
        <div id="resultOutput"></div>
        <div id="toastContainer"></div>
        <div id="challengeList"></div>
        <strong id="challengeProgressText"></strong>
        <div id="challengeProgressBar"></div>
        <div id="challengeProgressTrack"></div>
        <span id="currentYear"></span>
        <button id="installAppBtn"></button>
        <button id="themeToggle"></button>
        <select id="datasetSelector"></select>
        <input id="safeModeToggle" type="checkbox">
        <select id="tableSelector"></select>
        <select id="categorySelector"></select>
    </body></html>`,
    {
        url: 'https://sql-academy.test/',
        runScripts: 'outside-only',
        pretendToBeVisual: true
    }
);

const { window } = dom;
window.eval(fs.readFileSync(new URL('../datasets.js', import.meta.url), 'utf8'));
window.eval(fs.readFileSync(new URL('../script.js', import.meta.url), 'utf8'));

test('escapeHtml escapa caracteres peligrosos', () => {
    assert.equal(
        window.escapeHtml('<script>&"\''),
        '&lt;script&gt;&amp;&quot;&#39;'
    );
});

test('quoteIdent duplica comillas internas', () => {
    assert.equal(window.quoteIdent('mi"tabla'), '"mi""tabla"');
});

test('isWriteQuery detecta escrituras y comentarios', () => {
    assert.equal(window.isWriteQuery('SELECT * FROM estudiantes'), false);
    assert.equal(window.isWriteQuery('-- comentario\nDELETE FROM estudiantes'), true);
    assert.equal(window.isWriteQuery('  PRAGMA foreign_keys = ON;'), true);
    assert.equal(window.isWriteQuery('WITH x AS (SELECT 1) SELECT * FROM x'), false);
});

test('getDangerousQueryReason detecta consultas destructivas', () => {
    assert.match(window.getDangerousQueryReason('DROP TABLE estudiantes'), /DROP/);
    assert.match(window.getDangerousQueryReason('TRUNCATE TABLE estudiantes'), /TRUNCATE/);
    assert.match(window.getDangerousQueryReason('DELETE FROM estudiantes'), /DELETE sin WHERE/);
    assert.match(window.getDangerousQueryReason('UPDATE estudiantes SET edad = 20'), /UPDATE sin WHERE/);
    assert.match(window.getDangerousQueryReason('ALTER TABLE estudiantes DROP COLUMN edad'), /ALTER TABLE/);
    assert.equal(window.getDangerousQueryReason('DELETE FROM estudiantes WHERE id = 1'), '');
    assert.equal(window.getDangerousQueryReason('UPDATE estudiantes SET edad = 20 WHERE id = 1'), '');
    assert.equal(window.getDangerousQueryReason('SELECT * FROM estudiantes'), '');
});

test('isReadOnlyQuery acepta SELECT/WITH y rechaza escrituras', () => {
    assert.equal(window.isReadOnlyQuery('SELECT * FROM estudiantes;'), true);
    assert.equal(window.isReadOnlyQuery('WITH x AS (SELECT 1) SELECT * FROM x'), true);
    assert.equal(window.isReadOnlyQuery("SELECT 'delete' AS palabra"), true);
    assert.equal(window.isReadOnlyQuery("SELECT 'a;b' AS texto"), true);
    assert.equal(window.isReadOnlyQuery('DELETE FROM estudiantes'), false);
    assert.equal(window.isReadOnlyQuery('SELECT 1; SELECT 2'), false);
    assert.equal(window.isReadOnlyQuery('PRAGMA table_info(estudiantes)'), false);
});

test('formatSql coloca cláusulas en líneas separadas y protege literales', () => {
    const formatted = window.formatSql(
        "select e.nombre from estudiantes e left join inscripciones i on e.id=i.estudiante_id where e.nombre = 'FROM WHERE' order by e.nombre limit 5"
    );

    assert.match(formatted, /^SELECT /);
    assert.match(formatted, /\nFROM /);
    assert.match(formatted, /\nLEFT JOIN /);
    assert.match(formatted, /\n\s+ON /);
    assert.match(formatted, /\nWHERE /);
    assert.match(formatted, /\nORDER BY /);
    assert.match(formatted, /'FROM WHERE'/);
});

test('compareChallengeResults compara filas y columnas', () => {
    const expected = { columns: ['a', 'b'], values: [[1, 'x'], [2, 'y']] };

    assert.equal(
        window.compareChallengeResults([expected], [expected], true).ok,
        true
    );

    assert.equal(
        window.compareChallengeResults(
            [expected],
            [{ columns: ['a', 'b'], values: [[2, 'y'], [1, 'x']] }],
            true
        ).ok,
        false
    );

    assert.equal(
        window.compareChallengeResults(
            [expected],
            [{ columns: ['a', 'b'], values: [[2, 'y'], [1, 'x']] }],
            false
        ).ok,
        true
    );

    assert.equal(
        window.compareChallengeResults(
            [expected],
            [{ columns: ['a'], values: [[1], [2]] }],
            true
        ).reason,
        'columns'
    );

    assert.equal(
        window.compareChallengeResults(
            [expected],
            [{ columns: ['a', 'b'], values: [[1, 'x']] }],
            true
        ).reason,
        'rows'
    );
});

test('resultSetToCsv escapa comas, comillas y valores nulos', () => {
    const csv = window.resultSetToCsv({
        columns: ['nombre', 'nota'],
        values: [['Ana, "A"', 15], [null, 20]]
    });

    assert.equal(csv, 'nombre,nota\r\n"Ana, ""A""",15\r\n,20');
});

test('resultSetToTsv y resultSetToObjects convierten el resultado', () => {
    const set = {
        columns: ['nombre', 'nota'],
        values: [['Ana', 15], ['Luis', null]]
    };

    assert.equal(window.resultSetToTsv(set), 'nombre\tnota\nAna\t15\nLuis\t');
    const objects = window.resultSetToObjects(set);
    assert.equal(objects.length, 2);
    assert.equal(objects[0].nombre, 'Ana');
    assert.equal(objects[0].nota, 15);
    assert.equal(objects[1].nombre, 'Luis');
    assert.equal(objects[1].nota, null);
});

test('formatDuration devuelve una etiqueta legible', () => {
    assert.equal(window.formatDuration(0), '0.0 ms');
    assert.equal(window.formatDuration(12.4), '12 ms');
    assert.equal(window.formatDuration(null), '');
});

test('los datasets adicionales tienen nombre, descripción y SQL', () => {
    const datasets = window.SQL_ACADEMY_DATASETS;
    for (const key of ['tienda', 'biblioteca']) {
        assert.equal(typeof datasets[key].name, 'string');
        assert.match(datasets[key].sql, /CREATE TABLE/i);
        assert.match(datasets[key].sql, /INSERT INTO/i);
    }
});
