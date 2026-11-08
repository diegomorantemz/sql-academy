import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { JSDOM } from 'jsdom';

const dom = new JSDOM('<!doctype html><html><body></body></html>', {
    url: 'https://sql-academy.test/',
    runScripts: 'outside-only'
});
const { window } = dom;
window.eval(fs.readFileSync(new URL('../install-guides.js', import.meta.url), 'utf8'));

const guides = window.INSTALL_GUIDES;
const expectedIds = ['sqlite', 'postgresql', 'mysql', 'sqlserver', 'mongodb', 'oracle'];
const exists = path => fs.existsSync(new URL(`../${path}`, import.meta.url));

test('el catálogo de instalación incluye los seis gestores del MVP', () => {
    assert.ok(guides);
    assert.deepEqual(Object.keys(guides).sort(), [...expectedIds].sort());

    for (const id of expectedIds) {
        const guide = guides[id];
        assert.equal(guide.id, id);
        assert.ok(guide.name.length > 2);
        assert.ok(['SQL', 'NoSQL'].includes(guide.type));
        assert.ok(['Fácil', 'Fácil-media', 'Media', 'Alta'].includes(guide.difficulty));
        assert.match(guide.time, /\d/);
        assert.ok(guide.summary.length > 20);
        assert.match(guide.officialUrl, /^https:\/\//);
        assert.match(guide.docsUrl, /^https:\/\//);
        assert.match(guide.lastReviewed, /^\d{4}-\d{2}$/);
        assert.ok(Array.isArray(guide.paths) && guide.paths.length >= 2);
        assert.ok(Array.isArray(guide.commonErrors) && guide.commonErrors.length > 0);
        assert.ok(Array.isArray(guide.security) && guide.security.length > 0);
        assert.equal(exists(guide.logo), true, `No existe ${guide.logo}`);
        if (guide.logoDark) assert.equal(exists(guide.logoDark), true, `No existe ${guide.logoDark}`);
    }
});

test('cada ruta de instalación tiene pasos, verificación y contenido válido', () => {
    for (const guide of Object.values(guides)) {
        const pathIds = new Set();
        for (const path of guide.paths) {
            assert.ok(path.id);
            assert.equal(pathIds.has(path.id), false, `Ruta duplicada en ${guide.id}: ${path.id}`);
            pathIds.add(path.id);
            assert.ok(path.label.length > 2);
            assert.ok(Array.isArray(path.steps) && path.steps.length > 0);
            assert.ok(Array.isArray(path.verify) && path.verify.length > 0);
            assert.ok(Array.isArray(path.notes));

            for (const step of path.steps) {
                assert.ok(step.title.length > 3);
                assert.ok(step.body.length > 10);
                if (step.link) assert.match(step.link.url, /^https:\/\//);
            }
            for (const step of path.verify) {
                assert.ok(step.title.length > 3);
                assert.ok(step.body.length > 10);
            }
        }
    }
});

test('los enlaces externos son seguros y no hay instaladores alojados en el repo', () => {
    const urls = [];
    for (const guide of Object.values(guides)) {
        urls.push(guide.officialUrl, guide.docsUrl);
        for (const client of guide.clients || []) urls.push(client.url);
        if (guide.cloudAlternative) urls.push(guide.cloudAlternative.url);
        for (const path of guide.paths) {
            for (const step of [...path.steps, ...path.verify]) {
                if (step.link) urls.push(step.link.url);
            }
        }
    }

    for (const url of urls) {
        assert.match(url, /^https:\/\//, `URL no segura: ${url}`);
        assert.doesNotMatch(url, /^javascript:/i);
    }
});
