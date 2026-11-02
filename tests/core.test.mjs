import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { DatabaseSync } from 'node:sqlite';
import { JSDOM } from 'jsdom';

const dom = new JSDOM(
    `<!doctype html><html><body>
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
        <select id="tableSelector"></select>
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

test('Tienda y Biblioteca tienen ejemplos y retos SQL propios', () => {
    for (const datasetName of ['tienda', 'biblioteca']) {
        const categories = window.getExamplesByCategory(datasetName);
        const examples = Object.values(categories).flatMap(category => category.ejemplos);
        const challenges = window.getChallengeCatalog(datasetName);

        assert.ok(Object.keys(categories).length >= 8, `${datasetName} necesita categorías`);
        assert.ok(examples.length >= 20, `${datasetName} necesita ejemplos`);
        assert.ok(challenges.length >= 4, `${datasetName} necesita retos`);

        for (const challenge of challenges) {
            assert.equal(typeof challenge.id, 'string');
            assert.match(challenge.sqlEsperado, /^SELECT\b/i);
            assert.equal(typeof challenge.ordenada, 'boolean');
        }
    }
});

test('los ejemplos y retos SQL de Tienda y Biblioteca se ejecutan', () => {
    for (const datasetName of ['tienda', 'biblioteca']) {
        const dataset = window.SQL_ACADEMY_DATASETS[datasetName];
        const categories = window.getExamplesByCategory(datasetName);

        for (const [category, data] of Object.entries(categories)) {
            for (const example of data.ejemplos) {
                const db = new DatabaseSync(':memory:');
                try {
                    db.exec('PRAGMA foreign_keys = ON;');
                    db.exec(dataset.sql);
                    db.exec(example.sql);
                } catch (error) {
                    assert.fail(`${datasetName}/${category}/${example.titulo}: ${error.message}`);
                } finally {
                    db.close();
                }
            }
        }

        for (const challenge of window.getChallengeCatalog(datasetName)) {
            const db = new DatabaseSync(':memory:');
            try {
                db.exec('PRAGMA foreign_keys = ON;');
                db.exec(dataset.sql);
                const rows = db.prepare(challenge.sqlEsperado).all();
                assert.ok(rows.length > 0, `${datasetName}/${challenge.id} no devuelve filas`);
            } catch (error) {
                assert.fail(`${datasetName}/${challenge.id}: ${error.message}`);
            } finally {
                db.close();
            }
        }
    }
});

test('los ejemplos SQL cargan tablas del dataset activo', () => {
    const cases = [
        ['tienda', /FROM (clientes|productos|pedidos|detalle_pedidos)\b/i],
        ['biblioteca', /FROM (autores|libros|socios|prestamos)\b/i]
    ];

    for (const [datasetName, tablePattern] of cases) {
        window.localStorage.setItem(
            'sql-academy-preferences-v1',
            JSON.stringify({ dataset: datasetName, theme: 'light', safeMode: true })
        );
        window.loadPreferences();
        window.refreshPracticeContentForDataset();
        window.document.getElementById('categorySelector').value = 'basicos';
        window.showExampleByCategory();

        const editor = window.document.getElementById('sqlEditor');
        assert.match(editor.value, tablePattern);
        assert.match(
            window.document.getElementById('sqlExampleStatus').textContent,
            /^Ejemplo: /
        );
        assert.match(
            window.document.getElementById('resultOutput').textContent,
            /Esperando que la base de datos/
        );

        const firstExample = editor.value;
        window.showExampleByCategory();
        assert.notEqual(editor.value, firstExample, 'Siguiente ejemplo debe cambiar la consulta');
    }
});

test('el cambio de dataset actualiza categorías y retos SQL', () => {
    window.localStorage.setItem(
        'sql-academy-preferences-v1',
        JSON.stringify({ dataset: 'tienda', theme: 'light', safeMode: true })
    );
    window.loadPreferences();
    window.refreshPracticeContentForDataset();

    const tiendaCategories = Array.from(
        window.document.querySelectorAll('#categorySelector option')
    ).map(option => option.value);
    assert.ok(tiendaCategories.includes('join'));
    assert.equal(window.document.querySelectorAll('#challengeList .challenge-card').length, 6);
    assert.match(window.document.querySelector('#challengeList').textContent, /Productos con stock bajo/);

    window.localStorage.setItem(
        'sql-academy-preferences-v1',
        JSON.stringify({ dataset: 'biblioteca', theme: 'light', safeMode: true })
    );
    window.loadPreferences();
    window.refreshPracticeContentForDataset();

    assert.equal(window.document.querySelectorAll('#challengeList .challenge-card').length, 6);
    assert.match(window.document.querySelector('#challengeList').textContent, /Libros disponibles/);
    assert.match(window.document.querySelector('#challengeDetail').textContent, /Elige un reto/);
});
