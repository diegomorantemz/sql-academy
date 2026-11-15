import test from 'node:test';
import assert from 'node:assert/strict';
import { createAppDom, readProjectFile } from './helpers/app.mjs';

const dom = createAppDom({
    html: readProjectFile('index.html'),
    scripts: ['datasets.js', 'nosql-datasets.js', 'install-guides.js', 'courses.js', 'course-content.js', 'checkpoint-content.js', 'nosql-engine.js', 'script.js'],
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
