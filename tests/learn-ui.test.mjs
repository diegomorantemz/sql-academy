import test, { after } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { JSDOM } from 'jsdom';

const html = fs.readFileSync(new URL('../index.html', import.meta.url), 'utf8');
const dom = new JSDOM(html, {
    url: 'https://sql-academy.test/',
    runScripts: 'outside-only',
    pretendToBeVisual: true
});

const { window } = dom;
window.confirm = () => true;
window.requestAnimationFrame = () => 0;
window.eval(fs.readFileSync(new URL('../datasets.js', import.meta.url), 'utf8'));
window.eval(fs.readFileSync(new URL('../script.js', import.meta.url), 'utf8'));
window.initLearnLibrary();

await new Promise(resolve => setTimeout(resolve, 20));

const { document } = window;

function visibleConceptKeys() {
    return [...document.querySelectorAll('[data-concept-card]')]
        .filter(card => !card.hidden)
        .map(card => card.dataset.conceptKey);
}

function visibleGuideCards() {
    return [...document.querySelectorAll('[data-guide-card]')]
        .filter(card => !card.hidden);
}

test('la biblioteca muestra las pestañas de guías y conceptos', () => {
    assert.equal(document.getElementById('learnGuidesPanel').hidden, false);
    assert.equal(document.getElementById('learnConceptsPanel').hidden, true);

    document.getElementById('learnConceptsTab').click();
    assert.equal(document.getElementById('learnConceptsPanel').hidden, false);
    assert.equal(document.getElementById('learnGuidesPanel').hidden, true);
    assert.equal(document.getElementById('conceptProgressText').textContent, '0 de 14');
    assert.equal(document.querySelectorAll('[data-concept-card]').length, 14);

    document.getElementById('learnGuidesTab').click();
    assert.equal(document.getElementById('learnGuidesPanel').hidden, false);
});

test('la búsqueda y los filtros de guías funcionan', () => {
    const search = document.getElementById('guideSearch');
    search.value = 'redis';
    window.filterLearnGuides();
    const visible = visibleGuideCards();
    assert.ok(visible.some(card => card.textContent.includes('Redis')));

    search.value = '';
    window.setGuideFilter('nosql');
    const nosqlCards = [...document.querySelectorAll('.learn-card[data-guide-card]')]
        .filter(card => !card.hidden);
    assert.equal(nosqlCards.length, 6);
    assert.ok(nosqlCards.every(card => card.dataset.tags.includes('nosql')));

    window.setGuideFilter('all');
});

test('la búsqueda y los filtros de conceptos funcionan', () => {
    document.getElementById('learnConceptsTab').click();
    const search = document.getElementById('conceptSearch');
    search.value = 'indices';
    window.filterConcepts();
    assert.deepEqual(visibleConceptKeys(), ['indices']);

    search.value = '';
    window.setConceptFilter('sql');
    assert.equal(visibleConceptKeys().length, 7);
    assert.ok(visibleConceptKeys().includes('joins'));

    window.setConceptFilter('avanzado');
    assert.deepEqual(visibleConceptKeys(), ['cap']);

    window.setConceptFilter('all');
});

test('MySQL y SQLite tienen variantes de logo para modo claro y oscuro', () => {
    for (const name of ['MySQL', 'SQLite']) {
        const card = [...document.querySelectorAll('.learn-card')]
            .find(item => item.querySelector('h3')?.textContent === name);
        assert.ok(card, `No se encontró la tarjeta de ${name}`);
        assert.ok(card.querySelector('.learn-card-icon.has-dark-logo'));
        assert.ok(card.querySelector('.db-logo-light'));
        assert.ok(card.querySelector('.db-logo-dark'));
    }

    assert.ok(fs.existsSync(new URL('../logos/mysql-dark.png', import.meta.url)));
    assert.ok(fs.existsSync(new URL('../logos/sqlite-dark.png', import.meta.url)));

    window.openDBInfo('mysql');
    assert.ok(document.querySelector('#modalBody .db-logo-large.has-dark-logo'));
    assert.equal(document.querySelectorAll('#modalBody .db-logo-large img').length, 2);
    window.closeDBModal();
});

test('el asistente recomienda motores según las respuestas', () => {
    window.toggleMotorFinder();
    assert.equal(document.getElementById('motorFinderBody').hidden, false);

    document.getElementById('motorFinderType').value = 'graph';
    document.getElementById('motorFinderTransactions').value = 'no';
    document.getElementById('motorFinderScale').value = 'yes';
    document.getElementById('motorFinderRealtime').value = 'no';
    window.recommendMotor();
    assert.match(document.getElementById('motorFinderResult').textContent, /Neo4j/);

    document.getElementById('motorFinderType').value = 'documents';
    document.getElementById('motorFinderRealtime').value = 'no';
    window.recommendMotor();
    assert.match(document.getElementById('motorFinderResult').textContent, /MongoDB/);

    document.getElementById('motorFinderType').value = 'structured';
    document.getElementById('motorFinderTransactions').value = 'yes';
    window.recommendMotor();
    assert.match(document.getElementById('motorFinderResult').textContent, /PostgreSQL/);

    document.getElementById('motorFinderTransactions').value = 'no';
    document.getElementById('motorFinderScale').value = 'no';
    window.recommendMotor();
    assert.match(document.getElementById('motorFinderResult').textContent, /MySQL/);
    assert.ok(document.querySelector('#motorFinderResult .motor-result-logo.has-dark-logo'));
    assert.equal(document.querySelectorAll('#motorFinderResult .motor-result-logo img').length, 2);
});

test('el mini-quiz marca un concepto como dominado y actualiza el progreso', () => {
    window.closeConceptModal();
    window.openConcept('mer');

    assert.equal(document.getElementById('conceptModal').classList.contains('active'), true);
    assert.ok(document.querySelector('#conceptModalBody .concept-diagram'));
    assert.ok(document.querySelector('#conceptModalBody .concept-quiz'));

    const form = document.querySelector('#conceptModalBody form.concept-quiz-form');
    const correctAnswers = ['Un objeto del mundo real', 'Un elemento se relaciona con muchos'];
    correctAnswers.forEach(answer => {
        const label = [...form.querySelectorAll('.concept-quiz-option')]
            .find(option => option.textContent.includes(answer));
        assert.ok(label, `No se encontró la respuesta: ${answer}`);
        label.querySelector('input').checked = true;
    });

    window.submitConceptQuiz({ preventDefault() {}, target: form }, 'mer');

    assert.match(document.getElementById('conceptQuizResult').textContent, /Concepto dominado/);
    assert.equal(document.getElementById('conceptProgressText').textContent, '1 de 14');
    assert.equal(document.querySelector('[data-concept-badge="mer"]').hidden, false);
    assert.ok(window.localStorage.getItem('sql-academy-concepts-v1'));

    window.renderLearningProgressDashboard();
    assert.match(document.getElementById('learningProgressDashboard').textContent, /Biblioteca de conceptos/);
    assert.match(document.getElementById('learningProgressDashboard').textContent, /1 de 14/);

    window.closeConceptModal();
    window.openConcept('mer');
    assert.match(document.getElementById('conceptModalStatus').textContent, /Dominado/);
    window.closeConceptModal();
});

after(() => {
    dom.window.close();
});
