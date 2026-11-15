import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readdirSync } from 'node:fs';
import { APP_SCRIPTS, projectFile, readProjectFile } from './helpers/app.mjs';

function localScripts(html) {
    return [...html.matchAll(/<script\s+[^>]*src="([^"]+)"/g)]
        .map(match => match[1])
        .filter(source => !/^https?:/i.test(source));
}

function localStyles(html) {
    return [...html.matchAll(/<link\s+[^>]*rel="stylesheet"[^>]*href="([^"]+)"/g)]
        .map(match => match[1])
        .filter(href => !/^https?:/i.test(href));
}

function readAppShell() {
    const source = readProjectFile('service-worker.js');
    const block = source.match(/const APP_SHELL = \[([\s\S]*?)\];/);
    assert.ok(block, 'No se encontró APP_SHELL en service-worker.js');
    return [...block[1].matchAll(/'([^']+)'/g)]
        .map(match => match[1].replace(/^\.\//, ''));
}

test('APP_SCRIPTS coincide con el orden de los scripts de index.html', () => {
    const html = readProjectFile('index.html');
    assert.deepEqual(localScripts(html), APP_SCRIPTS);
});

test('todos los scripts y estilos locales existen y están en el app shell', () => {
    const html = readProjectFile('index.html');
    const appShell = new Set(readAppShell());
    const assets = [...localScripts(html), ...localStyles(html)];

    for (const asset of assets) {
        assert.equal(existsSync(projectFile(asset)), true, `No existe ${asset}`);
        assert.equal(appShell.has(asset), true, `Falta ${asset} en APP_SHELL`);
    }
});

test('el app shell no contiene rutas inexistentes', () => {
    for (const entry of readAppShell()) {
        if (!entry || entry.endsWith('/')) continue;
        assert.equal(existsSync(projectFile(entry)), true, `Ruta inexistente en APP_SHELL: ${entry}`);
    }
});

test('no hay scripts duplicados en el arranque', () => {
    assert.equal(new Set(APP_SCRIPTS).size, APP_SCRIPTS.length);
    assert.equal(new Set(readAppShell()).size, readAppShell().length);
});

test('la raíz solo conserva el service worker como JavaScript', () => {
    const rootFiles = readdirSync(projectFile('.'));
    assert.deepEqual(rootFiles.filter(file => file.endsWith('.js')), ['service-worker.js']);
    assert.deepEqual(rootFiles.filter(file => file.endsWith('.css')), []);
});
