import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { JSDOM } from 'jsdom';
import { createAppDom, projectFile, readProjectFile } from './helpers/app.mjs';

const dom = createAppDom({
    html: `<!doctype html><html><body>
        <div id="donationModal" class="modal" role="dialog" aria-modal="true" aria-labelledby="donationModalTitle">
            <div class="modal-content donation-modal-content">
                <div class="modal-header">
                    <h2 id="donationModalTitle">Apoyar SQL Academy</h2>
                    <button type="button" class="modal-close" aria-label="Cerrar apoyo">&times;</button>
                </div>
                <div class="modal-body" id="donationModalBody"></div>
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
        <select id="categorySelector"></select>
        <span id="sqlExampleStatus"></span>
    </body></html>`,
    scripts: ['js/data/datasets.js', 'js/data/courses.js', 'js/data/course-content.js', 'js/data/checkpoint-content.js', 'js/app.js', 'js/app/navigation.js', 'js/features/nosql/challenges.js', 'js/features/donations.js', 'js/features/learn-library.js', 'js/features/challenges.js', 'js/features/debug-challenges.js', 'js/features/skill-test.js', 'js/features/learning-path.js', 'js/features/courses.js', 'js/features/dashboard.js', 'js/features/lessons.js', 'js/features/assistant.js', 'js/features/results.js', 'js/features/explorer.js', 'js/features/examples.js'],
    beforeLoad(window) {
        window.confirm = () => true;
    }
});

const { window } = dom;

function modalBody() {
    return window.document.getElementById('donationModalBody');
}

test('el modal de donaciones abre en Yape y muestra las opciones actuales', () => {
    window.showDonationQR();

    const modal = window.document.getElementById('donationModal');
    const body = modalBody();

    assert.ok(modal.classList.contains('active'));
    assert.match(body.textContent, /Si te sirvió/);
    assert.match(body.textContent, /Escanea el QR y elige el monto/);
    assert.doesNotMatch(body.textContent, /Monto libre desde S\/1/);
    assert.doesNotMatch(body.textContent, /100% voluntario/);
    assert.match(body.textContent, /hosting, dominio y mantenimiento/);
    assert.match(body.textContent, /quienes están empezando/);
    assert.ok(body.querySelector('.donation-impact'));
    assert.equal(body.querySelector('.donation-amount'), null);
    assert.equal(body.querySelector('.donation-voluntary'), null);
    assert.equal(body.querySelector('.donation-footnote'), null);
    assert.equal(body.querySelectorAll('.donation-method-tab').length, 2);
    assert.equal(body.querySelectorAll('.donation-steps, .donation-transparency').length, 0);
    assert.equal(body.querySelector('.fa-heart'), null);
    assert.doesNotMatch(body.textContent, /[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}]/u);
    assert.match(body.textContent, /Yape/);
    assert.match(body.textContent, /Plin/);
    assert.doesNotMatch(body.textContent, /PayPal/);
    assert.doesNotMatch(body.textContent, /Ko-fi/);

    const image = body.querySelector('.donation-qr-image');
    assert.ok(image, 'Debe mostrarse el QR del método seleccionado');
    assert.match(image.getAttribute('src'), /qr-yape\.png$/);
    assert.match(image.getAttribute('alt'), /QR de Yape/);

    const qrLink = body.querySelector('.donation-qr-link');
    assert.equal(qrLink.getAttribute('target'), '_blank');
    assert.match(qrLink.getAttribute('rel'), /noopener/);
    assert.match(qrLink.textContent, /Ver QR en grande/);
});

test('el modal cambia a Plin y no expone números de teléfono', () => {
    window.showDonationQR('plin');

    const body = modalBody();
    const tabs = [...body.querySelectorAll('.donation-method-tab')];
    const activeTab = tabs.find(tab => tab.classList.contains('active'));

    assert.equal(activeTab.textContent.trim(), 'Plin');
    assert.equal(activeTab.getAttribute('aria-selected'), 'true');
    assert.match(body.querySelector('.donation-qr-image').getAttribute('src'), /qr-plin\.png$/);
    assert.doesNotMatch(body.textContent, /\d{9}/);
    assert.equal(body.querySelectorAll('a[href^="tel:"]').length, 0);
});

test('el footer y el título usan el enfoque voluntario acordado', () => {
    const html = readProjectFile('index.html');
    const document = new JSDOM(html).window.document;

    assert.equal(
        document.querySelector('.footer-donation button').textContent.trim(),
        'Apoyar el proyecto'
    );
    assert.match(document.getElementById('donationModalTitle').textContent, /Apoyar SQL Academy/);
    assert.match(html, /onclick="showDonationQR\(\)"/);
    assert.doesNotMatch(html, /showDonationQR\('yape'\)/);
});

test('los QR de Yape y Plin existen en el proyecto', () => {
    assert.equal(fs.existsSync(projectFile('assets/images/qr-yape.png')), true);
    assert.equal(fs.existsSync(projectFile('assets/images/qr-plin.png')), true);
});
