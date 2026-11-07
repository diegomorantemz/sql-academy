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
        <div id="demoTourBar" hidden>
            <span id="demoTourStepLabel"></span>
            <strong id="demoTourTitle"></strong>
            <p id="demoTourDescription"></p>
            <button id="demoTourPrevBtn"></button>
            <button id="demoTourNextBtn"></button>
        </div>
        <div id="toastContainer"></div>
        <details id="sqlMoreMenu"></details>
        <button id="soundToggle" class="header-icon-btn" aria-pressed="false"><i class="fas fa-volume-xmark"></i></button>
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
    assert.match(text, /No se detectaron conceptos débiles/);
    assert.equal(window.getSkillLevel('sql'), 'avanzado');
    assert.equal(window.getWeakConcepts('sql').length, 0);
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
    assert.match(text, /Refuerza estos conceptos/);
    assert.equal(window.getSkillLevel('nosql'), 'basico');
    assert.ok(window.getWeakConcepts('nosql').length > 0);
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

test('las recomendaciones abren el concepto en Practicar', () => {
    window.setSkillLevel('sql', 'basico');
    window.practiceSkillTarget('sql', 'join', 'intermedio');

    assert.equal(window.document.getElementById('categorySelector').value, 'join');
    assert.match(window.document.getElementById('sqlEditor').value, /JOIN/i);
});

test('el recorrido guiado avanza por los pasos y se puede cerrar', () => {
    window.startDemoTour();
    const bar = window.document.getElementById('demoTourBar');
    assert.equal(bar.hidden, false);
    assert.match(window.document.getElementById('demoTourStepLabel').textContent, /Paso 1 de 7/);
    assert.ok(window.document.getElementById('demoTourTitle').textContent.length > 0);

    window.nextDemoTourStep();
    assert.match(window.document.getElementById('demoTourStepLabel').textContent, /Paso 2 de 7/);
    assert.equal(window.document.getElementById('demoTourPrevBtn').disabled, false);

    window.previousDemoTourStep();
    assert.match(window.document.getElementById('demoTourStepLabel').textContent, /Paso 1 de 7/);
    assert.equal(window.document.getElementById('demoTourPrevBtn').disabled, true);

    window.closeDemoTour();
    assert.equal(bar.hidden, true);
});

test('el HTML incluye el recorrido de feria', () => {
    const html = fs.readFileSync(new URL('../index.html', import.meta.url), 'utf8');
    assert.match(html, /Recorrido de 5 minutos/);
    assert.match(html, /onclick="startDemoTour\(\)"/);
    assert.match(html, /id="demoTourBar"/);
});

test('el reporte de progreso incluye niveles y nombre', () => {
    window.setSkillLevel('sql', 'intermedio');
    window.setSkillLevel('nosql', 'avanzado');

    const html = window.buildProgressReportHtml('Ana Perez');

    assert.match(html, /Reporte de aprendizaje/);
    assert.match(html, /Ana Perez/);
    assert.match(html, /Nivel SQL/);
    assert.match(html, /Intermedio/);
    assert.match(html, /Nivel NoSQL/);
    assert.match(html, /Avanzado/);
    assert.match(html, /SQL ACADEMY/);
    assert.match(html, /Siguiente paso recomendado/);
});

test('la interfaz incluye el modal de reporte y el acceso desde progreso', () => {
    const html = fs.readFileSync(new URL('../index.html', import.meta.url), 'utf8');
    assert.match(html, /id="progressReportModal"/);
    assert.match(html, /id="progressReportBody"/);
    assert.match(html, /onclick="closeProgressReport\(\)"/);
});

test('el perfil de nivel aparece en el dashboard con refuerzos', () => {
    window.setSkillLevel('sql', 'intermedio');
    window.setSkillLevel('nosql', 'basico');

    const html = window.renderSkillProfileCards();

    assert.match(html, /Tu perfil de nivel/);
    assert.match(html, /Nivel SQL/);
    assert.match(html, /Intermedio/);
    assert.match(html, /Nivel NoSQL/);
    assert.match(html, /onclick="openProgressReport\(\)"/);
    assert.match(html, /skill-profile-grid/);
});

test('los controles nuevos incluyen etiquetas y estilos de accesibilidad', () => {
    const html = fs.readFileSync(new URL('../index.html', import.meta.url), 'utf8');
    const css = fs.readFileSync(new URL('../style.css', import.meta.url), 'utf8');

    assert.match(html, /role="region" aria-label="Nivel SQL"/);
    assert.match(html, /role="region" aria-label="Nivel NoSQL"/);
    assert.match(html, /aria-live="polite" aria-atomic="true"/);
    assert.match(html, /aria-haspopup="dialog" aria-controls="skillTestModal"/);
    assert.match(css, /@media \(prefers-reduced-motion: reduce\)/);
    assert.match(css, /#sqlLevelSelect:focus/);
    assert.match(css, /\.skill-test-option\.selected/);
});

test('el sonido se activa, se apaga y se persiste', () => {
    window.localStorage.removeItem('sql-academy-sound-enabled');
    window.loadSoundPreference();
    window.applySoundPreference();

    const button = window.document.getElementById('soundToggle');
    assert.equal(button.getAttribute('aria-pressed'), 'false');
    assert.match(button.innerHTML, /fa-volume-xmark/);

    window.toggleSound();
    assert.equal(window.localStorage.getItem('sql-academy-sound-enabled'), '1');
    assert.equal(button.getAttribute('aria-pressed'), 'true');
    assert.match(button.innerHTML, /fa-volume-high/);

    window.toggleSound();
    assert.equal(window.localStorage.getItem('sql-academy-sound-enabled'), '0');
    assert.equal(button.getAttribute('aria-pressed'), 'false');
    assert.match(button.innerHTML, /fa-volume-xmark/);
});

test('reproducir sonidos sin AudioContext no rompe la app', () => {
    window.toggleSound();
    assert.doesNotThrow(() => window.playSound('intro'));
    assert.doesNotThrow(() => window.playSound('success'));
    assert.doesNotThrow(() => window.playSound('error'));
    window.toggleSound();
});

test('la cabecera incluye el control de sonido', () => {
    const html = fs.readFileSync(new URL('../index.html', import.meta.url), 'utf8');
    assert.match(html, /id="soundToggle"/);
    assert.match(html, /onclick="toggleSound\(\)"/);
    assert.match(html, /fa-volume-xmark/);
});

test('el motor de sonido genera intro y feedback con Web Audio', () => {
    class FakeParam {
        constructor() { this.value = 0; }
        setValueAtTime() {}
        exponentialRampToValueAtTime() {}
        setTargetAtTime() {}
    }
    class FakeNode {
        constructor() {
            this.gain = new FakeParam();
            this.frequency = new FakeParam();
            this.Q = new FakeParam();
        }
        connect() { return this; }
        start() {}
        stop() {}
    }
    class FakeAudioContext {
        constructor() {
            this.currentTime = 0;
            this.sampleRate = 44100;
            this.state = 'running';
            this.destination = {};
        }
        createGain() { return new FakeNode(); }
        createOscillator() { return new FakeNode(); }
        createBufferSource() { return new FakeNode(); }
        createBiquadFilter() { return new FakeNode(); }
        createBuffer(channels, length) { return { getChannelData: () => new Float32Array(length) }; }
        resume() { return Promise.resolve(); }
    }

    const original = window.AudioContext;
    window.AudioContext = FakeAudioContext;
    window.toggleSound();

    assert.doesNotThrow(() => window.playSound('intro'));
    assert.doesNotThrow(() => window.playSound('success'));
    assert.doesNotThrow(() => window.playSound('error'));

    window.toggleSound();
    window.AudioContext = original;
});

test('el menú Más se puede cerrar desde código', () => {
    const menu = window.document.getElementById('sqlMoreMenu');
    menu.open = true;
    window.closeToolbarMore();
    assert.equal(menu.open, false);
});
