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
    assert.match(window.document.querySelector('#nosqlEditor').value, /^db\.productos\.find/);

    window.loadNoSQLChallenge('nosql-tienda-stock');
    window.runNoSQLQuery();
    assert.match(
        window.document.querySelector('#nosqlChallengeFeedback').textContent,
        /Reto completado/
    );

    window.changeNoSQLDataset('biblioteca', { silent: true });
    window.loadNoSQLChallenge('nosql-biblioteca-disponibles');
    window.runNoSQLQuery();
    assert.match(
        window.document.querySelector('#nosqlChallengeFeedback').textContent,
        /Reto completado/
    );

    window.changeNoSQLDataset('escuela', { silent: true });
    window.loadNoSQLChallenge('nosql-promedios');
    window.runNoSQLQuery();
    assert.match(
        window.document.querySelector('#nosqlChallengeFeedback').textContent,
        /Reto completado/
    );
});
