import test from 'node:test';
import assert from 'node:assert/strict';
import { createAppDom, readProjectFile } from '../helpers/app.mjs';

const dom = createAppDom({
    html: readProjectFile('index.html'),
    scripts: ['js/data/datasets.js', 'js/data/nosql-datasets.js', 'js/data/install-guides.js', 'js/data/courses.js', 'js/data/course-content.js', 'js/data/checkpoint-content.js', 'js/features/nosql/engine.js', 'js/app.js', 'js/app/navigation.js', 'js/features/nosql/challenges.js', 'js/features/learn-library.js', 'js/features/challenges.js', 'js/features/debug-challenges.js', 'js/features/skill-test.js', 'js/features/learning-path.js', 'js/features/courses.js', 'js/features/dashboard.js', 'js/features/lessons.js', 'js/features/assistant.js', 'js/features/results.js', 'js/features/explorer.js', 'js/features/examples.js'],
    beforeLoad(window) {
        window.confirm = () => true;
        window.requestAnimationFrame = () => 0;
    }
});

const { window } = dom;
const { document } = window;

test('la navegación móvil sincroniza la sección activa', () => {
    window.activateSection('practice');
    assert.equal(document.querySelector('[data-mobile-section="practice"]').classList.contains('active'), true);
    assert.equal(document.getElementById('mobileMoreBtn').classList.contains('active'), false);

    window.activateSection('nosql');
    assert.equal(document.getElementById('mobileMoreBtn').classList.contains('active'), true);
    assert.equal(document.getElementById('mobileMoreBtn').getAttribute('aria-current'), 'page');
    assert.equal(document.querySelector('[data-mobile-more-section="nosql"]').classList.contains('active'), true);

    window.activateSection('learn');
});

test('la hoja Más se abre y se cierra con estado accesible', () => {
    const modal = document.getElementById('mobileMoreModal');
    const button = document.getElementById('mobileMoreBtn');

    window.openMobileMore();
    assert.equal(modal.classList.contains('active'), true);
    assert.equal(button.getAttribute('aria-expanded'), 'true');

    window.closeMobileMore();
    assert.equal(modal.classList.contains('active'), false);
    assert.equal(button.getAttribute('aria-expanded'), 'false');
});

test('la barra móvil incluye cinco accesos y Más contiene las secciones secundarias', () => {
    assert.equal(document.querySelectorAll('[data-mobile-section]').length, 4);
    assert.ok(document.getElementById('mobileMoreBtn'));
    assert.deepEqual(
        [...document.querySelectorAll('[data-mobile-more-section]')].map(button => button.dataset.mobileMoreSection),
        ['game', 'nosql', 'analyze']
    );
});
