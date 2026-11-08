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
window.eval(fs.readFileSync(new URL('../install-guides.js', import.meta.url), 'utf8'));
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

test('la biblioteca muestra la pestaña y las tarjetas de instalación', () => {
    document.getElementById('learnInstallTab').click();

    assert.equal(document.getElementById('learnInstallPanel').hidden, false);
    assert.equal(document.getElementById('learnGuidesPanel').hidden, true);
    assert.equal(document.querySelectorAll('[data-install-card]').length, 12);
    assert.match(document.getElementById('learnInstallPanel').textContent, /No necesitas instalar nada/);
    assert.match(document.getElementById('learnInstallPanel').textContent, /PostgreSQL/);
    assert.match(document.getElementById('learnInstallPanel').textContent, /MongoDB/);
    assert.match(document.getElementById('learnInstallPanel').textContent, /MariaDB/);
    assert.match(document.getElementById('learnInstallPanel').textContent, /Redis/);
    assert.match(document.getElementById('learnInstallPanel').textContent, /Neo4j/);
    assert.match(document.getElementById('learnInstallPanel').textContent, /Cassandra/);
    assert.match(document.getElementById('learnInstallPanel').textContent, /Elasticsearch/);
    assert.match(document.getElementById('learnInstallPanel').textContent, /Firebase/);
});

test('los filtros de instalación funcionan por texto, tipo y sistema operativo', () => {
    const search = document.getElementById('installSearch');
    search.value = 'postgres';
    window.filterInstallGuides();

    let visible = [...document.querySelectorAll('[data-install-card]')].filter(card => !card.hidden);
    assert.equal(visible.length, 1);
    assert.match(visible[0].textContent, /PostgreSQL/);

    search.value = '';
    window.setInstallFilter('sql');
    visible = [...document.querySelectorAll('[data-install-card]')].filter(card => !card.hidden);
    assert.equal(visible.length, 6);
    assert.ok(visible.every(card => card.dataset.type === 'sql'));

    window.setInstallFilter('recomendado');
    visible = [...document.querySelectorAll('[data-install-card]')].filter(card => !card.hidden);
    assert.ok(visible.length >= 3);
    assert.ok(visible.every(card => card.dataset.recommended === 'true'));

    window.setInstallFilter('all');
    document.getElementById('installOsFilter').value = 'docker';
    window.filterInstallGuides();
    visible = [...document.querySelectorAll('[data-install-card]')].filter(card => !card.hidden);
    assert.ok(visible.length >= 9);
    assert.ok(visible.every(card => card.dataset.os.includes('docker')));

    const firebaseCard = [...document.querySelectorAll('[data-install-card]')]
        .find(card => card.textContent.includes('Firebase'));
    assert.ok(firebaseCard);
    assert.equal(firebaseCard.hidden, true);

    for (const os of ['windows', 'macos', 'linux']) {
        document.getElementById('installOsFilter').value = os;
        window.filterInstallGuides();
        assert.equal(firebaseCard.hidden, false, `Firebase debería mostrarse en ${os}`);
    }

    document.getElementById('installOsFilter').value = 'all';
    window.filterInstallGuides();
});

test('una guía de instalación muestra pasos, OS y comandos copiables', () => {
    window.openInstallGuide('postgresql', 'windows');

    const modal = document.getElementById('installGuideModal');
    const body = document.getElementById('installGuideBody');
    assert.equal(modal.classList.contains('active'), true);
    assert.match(document.getElementById('installGuideTitle').textContent, /Cómo instalar PostgreSQL/);
    assert.match(body.textContent, /psql --version/);
    assert.ok(body.querySelectorAll('.install-os-tab').length >= 3);
    assert.ok(body.querySelector('.install-copy-btn'));

    const macTab = [...body.querySelectorAll('.install-os-tab')].find(tab => /macOS/.test(tab.textContent));
    assert.ok(macTab);
    window.selectInstallOs('macos');
    assert.match(body.textContent, /brew install postgresql@16/);

    window.closeInstallGuide();
    assert.equal(modal.classList.contains('active'), false);
});

test('una guía nueva muestra su ruta y comandos propios', () => {
    window.openInstallGuide('mariadb', 'linux');

    const modal = document.getElementById('installGuideModal');
    const body = document.getElementById('installGuideBody');
    assert.equal(modal.classList.contains('active'), true);
    assert.match(document.getElementById('installGuideTitle').textContent, /Cómo instalar MariaDB/);
    assert.match(body.textContent, /mariadb-secure-installation/);
    assert.ok(body.querySelectorAll('.install-os-tab').length >= 3);

    window.selectInstallOs('docker');
    assert.match(body.textContent, /sql-academy-mariadb/);
    assert.ok(body.querySelector('.install-copy-btn'));

    window.closeInstallGuide();
});

test('Firebase muestra las rutas de consola y emulador local', () => {
    window.openInstallGuide('firebase', 'web');

    const body = document.getElementById('installGuideBody');
    assert.match(document.getElementById('installGuideTitle').textContent, /Cómo instalar Firebase/);
    assert.match(body.textContent, /Consola web/);
    assert.match(body.textContent, /Emulador local/);

    window.selectInstallOs('emulator');
    assert.match(body.textContent, /firebase init emulators/);
    assert.match(body.textContent, /firebase emulators:start --only firestore/);

    window.closeInstallGuide();
});

test('la ficha de un gestor ofrece acceso a su guía de instalación', () => {
    window.openDBInfo('postgresql');

    const installButton = document.querySelector('#modalBody .db-install-cta button');
    assert.ok(installButton);
    assert.match(installButton.textContent, /Cómo instalarlo/);

    window.openInstallFromDBInfo('postgresql');
    assert.equal(document.getElementById('dbModal').classList.contains('active'), false);
    assert.equal(document.getElementById('installGuideModal').classList.contains('active'), true);
    assert.match(document.getElementById('installGuideTitle').textContent, /Cómo instalar PostgreSQL/);

    window.closeInstallGuide();
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

    assert.ok(fs.existsSync(new URL('../assets/logos/mysql-dark.png', import.meta.url)));
    assert.ok(fs.existsSync(new URL('../assets/logos/sqlite-dark.png', import.meta.url)));

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
