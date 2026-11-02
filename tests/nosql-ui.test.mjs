import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { JSDOM } from 'jsdom';

const dom = new JSDOM(
    `<!doctype html><html><body>
        <select id="nosqlDatasetSelector">
            <option value="escuela">Escuela</option>
            <option value="tienda">Tienda</option>
            <option value="biblioteca">Biblioteca</option>
        </select>
        <select id="nosqlExampleSelector"></select>
        <span id="nosqlExampleStatus"></span>
        <textarea id="nosqlEditor"></textarea>
        <div id="nosqlCollectionList"></div>
        <p id="nosqlCollectionSummary"></p>
        <div id="nosqlResultOutput"></div>
        <div id="nosqlChallengeList"></div>
        <div id="nosqlChallengeDetail"></div>
        <input id="nosqlSafeModeToggle" type="checkbox" checked>
        <span id="nosqlPersistenceStatus"></span>
        <ul id="nosqlHistoryList"></ul>
        <div id="toastContainer"></div>
    </body></html>`,
    {
        url: 'https://sql-academy.test/',
        runScripts: 'outside-only',
        pretendToBeVisual: true
    }
);

const { window } = dom;
window.confirm = () => true;
window.eval(fs.readFileSync(new URL('../nosql-datasets.js', import.meta.url), 'utf8'));
window.eval(fs.readFileSync(new URL('../nosql-engine.js', import.meta.url), 'utf8'));
window.eval(fs.readFileSync(new URL('../nosql.js', import.meta.url), 'utf8'));

await new Promise(resolve => setTimeout(resolve, 50));

function exampleCount() {
    return window.document.querySelectorAll('#nosqlExampleSelector option').length;
}

function challengeCount() {
    return window.document.querySelectorAll('#nosqlChallengeList [data-challenge]').length;
}

function getChallenge(id) {
    return window.NOSQL_CHALLENGES.find(challenge => challenge.id === id);
}

test('el laboratorio NoSQL filtra ejemplos y retos por dataset', () => {
    assert.equal(exampleCount(), 12);
    assert.equal(challengeCount(), 5);
    assert.match(window.document.querySelector('#nosqlCollectionSummary').textContent, /Escuela/);

    window.changeNoSQLDataset('tienda', { silent: true });
    assert.equal(exampleCount(), 8);
    assert.equal(challengeCount(), 4);
    assert.match(window.document.querySelector('#nosqlCollectionSummary').textContent, /Tienda/);

    window.changeNoSQLDataset('biblioteca', { silent: true });
    assert.equal(exampleCount(), 8);
    assert.equal(challengeCount(), 4);
    assert.match(window.document.querySelector('#nosqlCollectionSummary').textContent, /Biblioteca/);

    window.changeNoSQLDataset('escuela', { silent: true });
    assert.equal(exampleCount(), 12);
    assert.equal(challengeCount(), 5);
});

test('los ejemplos y retos cargan el contenido del dataset activo', () => {
    window.changeNoSQLDataset('tienda', { silent: true });
    window.loadNoSQLExample();

    const editor = window.document.querySelector('#nosqlEditor');
    const exampleStatus = window.document.querySelector('#nosqlExampleStatus');
    assert.match(editor.value, /^db\.productos\.find/);
    assert.match(exampleStatus.textContent, /^Ejemplo: /);
    assert.match(window.document.querySelector('#nosqlResultOutput').textContent, /documentos/);

    const firstExample = editor.value;
    window.loadNextNoSQLExample();
    assert.notEqual(editor.value, firstExample, 'Siguiente ejemplo debe cambiar el comando');
    assert.match(exampleStatus.textContent, /^Ejemplo: /);
    const challenge = getChallenge('nosql-tienda-stock');

    window.loadNoSQLChallenge(challenge.id);
    const feedback = window.document.querySelector('#nosqlChallengeFeedback');
    assert.equal(editor.value, challenge.starter);
    assert.notEqual(editor.value, challenge.solution);

    window.runNoSQLQuery();
    assert.match(feedback.textContent, /Todavía no/);
    assert.equal(feedback.querySelector('button'), null);

    window.runNoSQLQuery();
    assert.match(feedback.textContent, /Todavía no/);
    assert.ok(feedback.querySelector('button'));

    window.revealNoSQLSolution();
    assert.equal(editor.value, challenge.solution);
    window.runNoSQLQuery();
    assert.match(feedback.textContent, /Reto completado/);

    window.changeNoSQLDataset('biblioteca', { silent: true });
    const bibliotecaChallenge = getChallenge('nosql-biblioteca-disponibles');
    window.loadNoSQLChallenge(bibliotecaChallenge.id);
    const bibliotecaFeedback = window.document.querySelector('#nosqlChallengeFeedback');
    editor.value = bibliotecaChallenge.solution;
    window.runNoSQLQuery();
    assert.match(bibliotecaFeedback.textContent, /Reto completado/);

    window.changeNoSQLDataset('escuela', { silent: true });
    const escuelaChallenge = getChallenge('nosql-promedios');
    window.loadNoSQLChallenge(escuelaChallenge.id);
    const escuelaFeedback = window.document.querySelector('#nosqlChallengeFeedback');
    editor.value = escuelaChallenge.solution;
    window.runNoSQLQuery();
    assert.match(escuelaFeedback.textContent, /Reto completado/);
});
