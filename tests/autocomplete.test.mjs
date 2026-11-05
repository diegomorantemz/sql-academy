import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { JSDOM } from 'jsdom';

const dom = new JSDOM(
    `<!doctype html><html><body>
        <textarea id="sqlEditor"></textarea>
        <textarea id="nosqlEditor"></textarea>
    </body></html>`,
    {
        url: 'https://sql-academy.test/',
        runScripts: 'outside-only',
        pretendToBeVisual: true
    }
);

const { window } = dom;
const { document } = window;
window.eval(fs.readFileSync(new URL('../autocomplete.js', import.meta.url), 'utf8'));

const autocomplete = window.SQLAcademyAutocomplete;
autocomplete.init();

function marked(text) {
    const caret = text.indexOf('|');
    return { value: text.replace('|', ''), caret };
}

const sqlSchema = [
    { name: 'estudiantes', columns: ['id', 'nombre', 'carrera_id'] },
    { name: 'carreras', columns: ['id', 'nombre'] }
];

const noSqlSchema = [
    { name: 'estudiantes', fields: ['_id', 'nombre', 'edad', 'carrera'] }
];

test('el autocompletado SQL sugiere tablas después de FROM', () => {
    const { value, caret } = marked('SELECT * FROM est|');
    const result = autocomplete.buildSqlSuggestions(value, caret, sqlSchema);

    assert.ok(result);
    assert.ok(result.items.some(item => item.label === 'estudiantes'));
    assert.equal(result.start, value.length - 3);
    assert.equal(result.end, caret);
});

test('el autocompletado SQL sugiere columnas y palabras clave después de SELECT', () => {
    const { value, caret } = marked('SELECT |FROM estudiantes');
    const result = autocomplete.buildSqlSuggestions(value, caret, sqlSchema);

    assert.ok(result);
    assert.ok(result.items.some(item => item.label === 'nombre'));
    assert.ok(result.items.some(item => item.kind === 'keyword'));
});

test('el autocompletado SQL resuelve alias de tabla', () => {
    const { value, caret } = marked('SELECT e.| FROM estudiantes e');
    const result = autocomplete.buildSqlSuggestions(value, caret, sqlSchema);

    assert.ok(result);
    assert.deepEqual(
        [...result.items.map(item => item.label)],
        ['id', 'nombre', 'carrera_id']
    );
});

test('el autocompletado SQL califica columnas cuando hay varias tablas', () => {
    const { value, caret } = marked('SELECT | FROM estudiantes e JOIN carreras c ON e.carrera_id = c.id');
    const result = autocomplete.buildSqlSuggestions(value, caret, sqlSchema);

    assert.ok(result);
    assert.ok(result.items.some(item => item.label === 'e.nombre'));
    assert.ok(result.items.some(item => item.label === 'c.nombre'));
});

test('el autocompletado SQL no se activa dentro de cadenas o comentarios', () => {
    const stringCase = marked("SELECT 'est|'");
    assert.equal(autocomplete.isInsideSqlStringOrComment(stringCase.value, stringCase.caret), true);

    const commentCase = marked('SELECT * FROM estudiantes -- est|');
    assert.equal(autocomplete.isInsideSqlStringOrComment(commentCase.value, commentCase.caret), true);

    const normalCase = marked('SELECT * FROM estudiantes|');
    assert.equal(autocomplete.isInsideSqlStringOrComment(normalCase.value, normalCase.caret), false);
});

test('el autocompletado NoSQL sugiere colecciones, métodos, campos y operadores', () => {
    const collectionCase = marked('db.|');
    const collections = autocomplete.buildNoSQLSuggestions(collectionCase.value, collectionCase.caret, noSqlSchema);
    assert.ok(collections.items.some(item => item.label === 'estudiantes'));

    const methodCase = marked('db.estudiantes.|');
    const methods = autocomplete.buildNoSQLSuggestions(methodCase.value, methodCase.caret, noSqlSchema);
    assert.ok(methods.items.some(item => item.label === 'find'));

    const fieldCase = marked('db.estudiantes.find({ | })');
    const fields = autocomplete.buildNoSQLSuggestions(fieldCase.value, fieldCase.caret, noSqlSchema);
    assert.ok(fields.items.some(item => item.label === 'nombre'));

    const operatorCase = marked('db.estudiantes.find({ $| })');
    const operators = autocomplete.buildNoSQLSuggestions(operatorCase.value, operatorCase.caret, noSqlSchema);
    assert.ok(operators.items.some(item => item.label === '$gt'));
});

test('el autocompletado NoSQL detecta cadenas', () => {
    const { value, caret } = marked('db.estudiantes.find({ carrera: "Ing|" })');
    assert.equal(autocomplete.isInsideNoSQLString(value, caret), true);
});

test('el popup se abre, navega y aplica una sugerencia con Enter', () => {
    window.getUserTables = () => ['estudiantes', 'carreras'];
    window.getTableColumns = name => (
        name === 'estudiantes'
            ? [{ name: 'id' }, { name: 'nombre' }, { name: 'carrera_id' }]
            : [{ name: 'id' }, { name: 'nombre' }]
    );

    const textarea = document.getElementById('sqlEditor');
    textarea.value = 'SELECT * FROM est';
    textarea.setSelectionRange(textarea.value.length, textarea.value.length);
    textarea.dispatchEvent(new window.Event('input', { bubbles: true }));

    const popup = document.getElementById('autocompletePopover');
    assert.ok(popup);
    assert.equal(popup.hidden, false);
    assert.match(popup.textContent, /estudiantes/);

    textarea.dispatchEvent(new window.KeyboardEvent('keydown', {
        key: 'Enter',
        bubbles: true,
        cancelable: true
    }));

    assert.equal(textarea.value, 'SELECT * FROM estudiantes');
    assert.equal(popup.hidden, true);
});

test('el popup funciona también en el editor NoSQL', () => {
    window.getNoSQLAutocompleteSchema = () => noSqlSchema;

    const textarea = document.getElementById('nosqlEditor');
    textarea.value = 'db.';
    textarea.setSelectionRange(textarea.value.length, textarea.value.length);
    textarea.dispatchEvent(new window.Event('input', { bubbles: true }));

    const popup = document.getElementById('autocompletePopover');
    assert.equal(popup.hidden, false);
    assert.match(popup.textContent, /estudiantes/);
});
