import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { JSDOM } from 'jsdom';

const dom = new JSDOM(
    `<!doctype html><html><body>
        <div id="sqlLevelBar" class="level-bar is-onboarding">
            <strong id="sqlLevelLabel"></strong>
            <p id="sqlLevelDescription"></p>
            <select id="sqlLevelSelect">
                <option value="basico">Básico</option>
                <option value="intermedio">Intermedio</option>
                <option value="avanzado">Avanzado</option>
                <option value="all">Ver todo</option>
            </select>
        </div>
        <div id="nosqlLevelBar" class="level-bar is-onboarding">
            <strong id="nosqlLevelLabel"></strong>
            <p id="nosqlLevelDescription"></p>
            <select id="nosqlLevelSelect">
                <option value="basico">Básico</option>
                <option value="intermedio">Intermedio</option>
                <option value="avanzado">Avanzado</option>
                <option value="all">Ver todo</option>
            </select>
        </div>
        <select id="categorySelector"></select>
        <span id="sqlExampleStatus"></span>
        <div id="nosqlQuickSyntax"></div>
        <p id="nosqlQuickOperators"></p>
        <div id="skillTestModal" class="modal">
            <div class="modal-content skill-test-content">
                <div class="modal-header">
                    <span id="skillTestTrackLabel"></span>
                    <h2 id="skillTestTitle">Test de nivel</h2>
                    <button type="button" class="modal-close">&times;</button>
                </div>
                <div id="skillTestBody"></div>
            </div>
        </div>
        <div id="toastContainer"></div>
        <textarea id="sqlEditor"></textarea>
        <ul id="historyList"></ul>
        <div id="resultOutput"></div>
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

function categoryKeys() {
    return Array.from(window.document.querySelectorAll('#categorySelector option'))
        .map(option => option.value)
        .filter(value => value !== 'aleatorio');
}

function noSQLCategories(level) {
    window.setSkillLevel('nosql', level);
    return window.filterNoSQLExamplesBySkill(window.getNoSQLExamplesForDataset('escuela'))
        .map(example => example.category);
}

test('el perfil empieza en básico y filtra las categorías SQL', () => {
    window.setSkillLevel('sql', 'basico');
    const keys = categoryKeys();

    assert.equal(window.getSkillLevel('sql'), 'basico');
    assert.equal(window.getEffectiveSkillLevel('sql'), 'basico');
    assert.deepEqual(keys, ['basicos', 'filtros', 'orden']);
    assert.equal(window.document.getElementById('sqlLevelSelect').value, 'basico');
    assert.match(window.document.getElementById('sqlLevelLabel').textContent, /Básico/);
});

test('cambiar de nivel actualiza los filtros, el selector y localStorage', () => {
    window.setSkillLevel('sql', 'intermedio');

    assert.ok(categoryKeys().includes('join'));
    assert.equal(categoryKeys().includes('basicos'), false);
    assert.equal(window.document.getElementById('sqlLevelSelect').value, 'intermedio');
    assert.match(window.document.getElementById('sqlLevelLabel').textContent, /Intermedio/);

    const stored = JSON.parse(window.localStorage.getItem('sql-academy-skill-profile-v1'));
    assert.equal(stored.sql, 'intermedio');
    assert.equal(stored.sqlSource, 'manual');

    window.setSkillLevel('sql', 'all');
    assert.ok(categoryKeys().includes('basicos'));
    assert.ok(categoryKeys().includes('join'));
    assert.equal(window.document.getElementById('sqlLevelSelect').value, 'all');
    assert.match(window.document.getElementById('sqlLevelLabel').textContent, /Ver todo/);
});

test('los ejemplos NoSQL se filtran por nivel y actualizan la sintaxis rápida', () => {
    assert.deepEqual(
        [...new Set(noSQLCategories('basico'))].sort(),
        ['Consultas', 'Filtros']
    );
    assert.deepEqual(
        [...new Set(noSQLCategories('intermedio'))],
        ['CRUD']
    );
    assert.deepEqual(
        [...new Set(noSQLCategories('avanzado'))],
        ['Agregación']
    );

    window.setSkillLevel('nosql', 'basico');
    assert.match(window.document.getElementById('nosqlQuickSyntax').textContent, /find/);
    assert.doesNotMatch(window.document.getElementById('nosqlQuickSyntax').textContent, /aggregate/);

    window.setSkillLevel('nosql', 'avanzado');
    assert.match(window.document.getElementById('nosqlQuickSyntax').textContent, /aggregate/);
    assert.match(window.document.getElementById('nosqlQuickOperators').textContent, /\$unwind/);
});

test('el test adaptativo recomienda avanzado con respuestas correctas', () => {
    window.openSkillTest('sql');

    for (let index = 0; index < 6; index += 1) {
        const question = window.getCurrentSkillTestQuestion();
        assert.ok(question, `No hay pregunta ${index + 1}`);
        window.selectSkillTestOption(question.answer);
        window.nextSkillTestQuestion();
    }

    const text = window.document.getElementById('skillTestBody').textContent;
    assert.match(text, /Tu nivel recomendado es Avanzado/);
    assert.match(text, /Avanzado/);
    assert.equal(window.getSkillLevel('sql'), 'avanzado');
    window.closeSkillTest();
});

test('el test adaptativo recomienda básico cuando no se acierta', () => {
    window.openSkillTest('nosql');

    for (let index = 0; index < 6; index += 1) {
        const question = window.getCurrentSkillTestQuestion();
        assert.ok(question, `No hay pregunta ${index + 1}`);
        const wrong = (question.answer + 1) % question.options.length;
        window.selectSkillTestOption(wrong);
        window.nextSkillTestQuestion();
    }

    const text = window.document.getElementById('skillTestBody').textContent;
    assert.match(text, /Tu nivel recomendado es Básico/);
    assert.equal(window.getSkillLevel('nosql'), 'basico');
    window.closeSkillTest();
});

test('el banco de preguntas tiene las tres dificultades y respuestas válidas', () => {
    for (const track of ['sql', 'nosql']) {
        const questions = window.getSkillTestQuestions(track);
        assert.ok(questions.length >= 9);
        assert.deepEqual(
            [...new Set(questions.map(question => question.level))].sort(),
            ['avanzado', 'basico', 'intermedio']
        );
        for (const question of questions) {
            assert.ok(question.options.length >= 3);
            assert.ok(Number.isInteger(question.answer));
            assert.ok(question.answer >= 0 && question.answer < question.options.length);
            assert.equal(
                new Set(questions.map(item => item.id)).size,
                questions.length,
                `IDs duplicados en ${track}`
            );
        }
    }
});

test('la interfaz incluye las barras de nivel y el modal del test', () => {
    const html = fs.readFileSync(new URL('../index.html', import.meta.url), 'utf8');

    assert.match(html, /id="sqlLevelBar"/);
    assert.match(html, /id="nosqlLevelBar"/);
    assert.match(html, /id="sqlLevelSelect"/);
    assert.match(html, /id="nosqlLevelSelect"/);
    assert.match(html, /id="skillTestModal"/);
    assert.match(html, /id="skillTestBody"/);
    assert.match(html, /onclick="openSkillTest\('sql'\)"/);
    assert.match(html, /onclick="openSkillTest\('nosql'\)"/);
});
