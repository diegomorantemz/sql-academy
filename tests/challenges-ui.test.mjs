import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { JSDOM } from 'jsdom';

const dom = new JSDOM(
    `<!doctype html><html><body>
        <nav>
            <button class="nav-btn active" data-section="learn"></button>
            <button class="nav-btn" data-section="practice"></button>
            <button class="nav-btn" data-section="nosql"></button>
            <button class="nav-btn" data-section="challenges"></button>
        </nav>
        <section id="section-learn" class="section active"></section>
        <section id="section-practice" class="section"></section>
        <section id="section-nosql" class="section">
            <textarea id="nosqlEditor"></textarea>
            <select id="nosqlDatasetSelector">
                <option value="escuela">Escuela</option>
                <option value="tienda">Tienda</option>
                <option value="biblioteca">Biblioteca</option>
            </select>
            <div id="nosqlChallengeDetail"></div>
        </section>
        <section id="section-challenges" class="section">
            <button id="sqlChallengesTab" class="challenge-tab active" data-challenge-tab="sql"></button>
            <button id="nosqlChallengesTab" class="challenge-tab" data-challenge-tab="nosql"></button>
            <div id="sqlChallengesPanel" class="challenge-tab-panel active"></div>
            <div id="nosqlChallengesPanel" class="challenge-tab-panel" hidden>
                <p id="nosqlHubDatasetLabel"></p>
                <strong id="nosqlHubProgressText"></strong>
                <div id="nosqlHubChallengeList"></div>
                <div id="nosqlHubChallengeDetail"></div>
            </div>
        </section>
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
window.eval(fs.readFileSync(new URL('../nosql-datasets.js', import.meta.url), 'utf8'));
window.eval(fs.readFileSync(new URL('../script.js', import.meta.url), 'utf8'));

await new Promise(resolve => setTimeout(resolve, 20));

function hubChallengeCount() {
    return window.document.querySelectorAll('#nosqlHubChallengeList [data-nosql-challenge]').length;
}

test('la página Retos muestra los retos NoSQL del dataset activo', () => {
    const selector = window.document.getElementById('nosqlDatasetSelector');
    selector.value = 'escuela';

    window.activateChallengeTab('nosql');

    assert.equal(hubChallengeCount(), 5);
    assert.match(window.document.getElementById('nosqlHubDatasetLabel').textContent, /Escuela/);
    assert.equal(window.document.getElementById('sqlChallengesPanel').hidden, true);
    assert.equal(window.document.getElementById('nosqlChallengesPanel').hidden, false);

    selector.value = 'tienda';
    window.renderNoSQLChallengeHub();

    assert.equal(hubChallengeCount(), 4);
    assert.match(window.document.getElementById('nosqlHubDatasetLabel').textContent, /Tienda/);
    assert.match(window.document.getElementById('nosqlHubChallengeList').textContent, /Stock bajo/);

    selector.value = 'biblioteca';
    window.renderNoSQLChallengeHub();

    assert.equal(hubChallengeCount(), 4);
    assert.match(window.document.getElementById('nosqlHubDatasetLabel').textContent, /Biblioteca/);
    assert.match(window.document.getElementById('nosqlHubChallengeList').textContent, /Libros disponibles/);
});

test('el hub usa el dataset y el progreso del laboratorio NoSQL', () => {
    window.getNoSQLActiveDataset = () => 'biblioteca';
    window.isNoSQLChallengeCompleted = id => id === 'nosql-biblioteca-premium';

    window.renderNoSQLChallengeHub();

    assert.equal(hubChallengeCount(), 4);
    assert.match(window.document.getElementById('nosqlHubDatasetLabel').textContent, /Biblioteca/);
    assert.equal(window.document.getElementById('nosqlHubProgressText').textContent, '1 de 4');
    assert.match(window.document.getElementById('nosqlHubChallengeList').textContent, /Socios premium/);

    delete window.getNoSQLActiveDataset;
    delete window.isNoSQLChallengeCompleted;
});

test('un reto NoSQL se abre en el laboratorio con la plantilla', () => {
    window.document.getElementById('nosqlDatasetSelector').value = 'tienda';
    window.activateChallengeTab('nosql');
    window.openNoSQLHubChallenge('nosql-tienda-stock');

    const detail = window.document.getElementById('nosqlHubChallengeDetail');
    assert.match(detail.textContent, /productos con 10 unidades o menos/i);
    assert.match(detail.textContent, /Ver pista/);

    const challenge = window.NOSQL_CHALLENGES.find(item => item.id === 'nosql-tienda-stock');
    let loaded = null;
    window.loadNoSQLChallenge = (id, options) => {
        loaded = { id, options };
        window.document.getElementById('nosqlEditor').value = challenge.starter;
    };

    window.solveNoSQLChallengeInLab('nosql-tienda-stock');

    assert.equal(loaded.id, 'nosql-tienda-stock');
    assert.equal(loaded.options.focus, false);
    assert.ok(window.document.getElementById('section-nosql').classList.contains('active'));
    assert.ok(window.document.querySelector('.nav-btn[data-section="nosql"]').classList.contains('active'));
    assert.equal(window.document.getElementById('nosqlEditor').value, challenge.starter);
    assert.notEqual(window.document.getElementById('nosqlEditor').value, challenge.solution);
});

test('el reto NoSQL se resuelve en la pestaña Retos con editor propio', () => {
    window.document.getElementById('nosqlDatasetSelector').value = 'tienda';
    window.openNoSQLHubChallenge('nosql-tienda-stock');

    const detail = window.document.getElementById('nosqlHubChallengeDetail');
    assert.ok(detail.querySelector('#nosqlHubEditor'), 'El hub debe incluir un editor NoSQL');
    assert.match(detail.textContent, /Comprobar reto/);
    assert.equal(detail.querySelector('#nosqlHubEditor').value, 'db.productos.find({})');
});

test('el laboratorio NoSQL ya no muestra el panel de reto activo', () => {
    const html = fs.readFileSync(new URL('../index.html', import.meta.url), 'utf8');
    assert.doesNotMatch(html, /Reto NoSQL activo/);
    assert.doesNotMatch(html, /id="nosqlChallengeDetail"/);
});
