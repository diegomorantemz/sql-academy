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
            <button id="debugChallengesTab" class="challenge-tab" data-challenge-tab="debug"></button>
            <div id="sqlChallengesPanel" class="challenge-tab-panel active"></div>
            <div id="nosqlChallengesPanel" class="challenge-tab-panel" hidden>
                <p id="nosqlHubDatasetLabel"></p>
                <strong id="nosqlHubProgressText"></strong>
                <div id="nosqlHubChallengeList"></div>
                <div id="nosqlHubChallengeDetail"></div>
            </div>
            <div id="debugChallengesPanel" class="challenge-tab-panel" hidden>
                <strong id="debugProgressText"></strong>
                <div id="debugProgressBar"></div>
                <div id="debugProgressTrack"></div>
                <div id="debugChallengeList"></div>
                <div id="debugChallengeDetail"></div>
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
window.eval(fs.readFileSync(new URL('../courses.js', import.meta.url), 'utf8'));
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

test('la pestaña Depuración muestra los retos del dataset activo', () => {
    window.localStorage.setItem(
        'sql-academy-preferences-v1',
        JSON.stringify({ dataset: 'tienda', theme: 'light', safeMode: true })
    );
    window.loadPreferences();
    window.refreshPracticeContentForDataset();

    window.activateChallengeTab('debug');

    const panel = window.document.getElementById('debugChallengesPanel');
    const list = window.document.getElementById('debugChallengeList');
    assert.equal(window.document.getElementById('sqlChallengesPanel').hidden, true);
    assert.equal(window.document.getElementById('nosqlChallengesPanel').hidden, true);
    assert.equal(panel.hidden, false);
    assert.equal(list.querySelectorAll('.challenge-card').length, 4);
    assert.match(list.textContent, /Filtra estados después de agrupar/);
    assert.equal(window.document.getElementById('debugProgressText').textContent, '0 de 4');
    assert.equal(window.document.getElementById('debugChallengesTab').getAttribute('aria-selected'), 'true');
});

test('un reto de depuración muestra consulta rota, síntoma, editor, pista y solución', () => {
    window.openDebugChallenge('debug-tienda-join');

    const detail = window.document.getElementById('debugChallengeDetail');
    const challenge = window.getDebugChallengeById('debug-tienda-join');
    assert.ok(challenge, 'El reto debe existir en el catálogo activo');
    assert.match(detail.textContent, /Pedidos y clientes sin relación/);
    assert.match(detail.textContent, /Qué ocurre/);
    assert.match(detail.textContent, /JOIN no tiene condición ON/);
    assert.match(detail.textContent, /Comprobar corrección/);

    const editor = detail.querySelector('#debugEditor');
    assert.ok(editor, 'El detalle debe incluir un editor de corrección');
    assert.equal(editor.value, challenge.brokenSql);

    const hint = detail.querySelector('#debugHint');
    assert.equal(hint.hidden, true);
    window.showDebugHint();
    assert.equal(hint.hidden, false);
    assert.match(hint.textContent, /ON p\.cliente_id = c\.id/);

    editor.value = 'SELECT 1';
    window.resetDebugQuery();
    assert.equal(editor.value, challenge.brokenSql);

    window.showDebugSolution();
    assert.equal(editor.value, challenge.sqlEsperado);
});

test('el progreso de depuración se guarda y se reinicia sin tocar los retos SQL', () => {
    const storageKey = 'sql-academy-challenges-v1';
    window.localStorage.setItem(storageKey, JSON.stringify({
        'debug-tienda-join': { completed: true, completedAt: '2024-01-01T00:00:00.000Z' },
        'tienda-stock-01': { completed: true, completedAt: '2024-01-01T00:00:00.000Z' }
    }));

    window.loadChallengeProgress();
    window.renderDebugChallengeList();

    assert.equal(window.document.getElementById('debugProgressText').textContent, '1 de 4');
    assert.match(window.document.getElementById('debugChallengeList').textContent, /Completado/);

    window.resetDebugChallengeProgress();

    const stored = JSON.parse(window.localStorage.getItem(storageKey));
    assert.equal(stored['debug-tienda-join'], undefined);
    assert.ok(stored['tienda-stock-01'], 'El reinicio de depuración no debe borrar los retos SQL');
    assert.equal(window.document.getElementById('debugProgressText').textContent, '0 de 4');
    assert.match(window.document.getElementById('debugChallengeDetail').textContent, /Encuentra el error/);
});

test('index.html incluye la tercera pestaña y el panel de depuración', () => {
    const html = fs.readFileSync(new URL('../index.html', import.meta.url), 'utf8');
    assert.match(html, /data-challenge-tab="debug"/);
    assert.match(html, /id="debugChallengesPanel"/);
    assert.match(html, /id="debugChallengeList"/);
    assert.match(html, /id="debugChallengeDetail"/);
    assert.match(html, /Tu progreso de depuración/);
});
