import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const readText = path => fs.readFileSync(new URL(`../${path}`, import.meta.url), 'utf8');
const readJson = path => JSON.parse(readText(path));
const exists = path => fs.existsSync(new URL(`../${path}`, import.meta.url));

test('la licencia del proyecto es noncommercial', () => {
    const license = readText('LICENSE');
    const packageJson = readJson('package.json');

    assert.match(license, /PolyForm Noncommercial License 1\.0\.0/);
    assert.match(license, /Required Notice: Copyright \(c\) 2026 MNTWARE/);
    assert.doesNotMatch(license, /^MIT License/m);
    assert.equal(packageJson.license, 'PolyForm-Noncommercial-1.0.0');
});

test('los assets están centralizados y las rutas de la PWA existen', () => {
    const manifest = readJson('manifest.webmanifest');

    assert.equal(exists('assets/images/qr-yape.png'), true);
    assert.equal(exists('assets/images/qr-plin.png'), true);
    assert.equal(exists('assets/logos/postgresql.png'), true);
    assert.equal(exists('assets/icons/icon.svg'), true);
    assert.equal(exists('assets/icons/icon-32.png'), true);
    assert.equal(exists('assets/icons/icon-96.png'), true);
    assert.equal(exists('assets/icons/icon-180.png'), true);
    assert.equal(exists('assets/icons/icon-192.png'), true);
    assert.equal(exists('assets/icons/icon-512.png'), true);
    assert.equal(exists('assets/icons/icon-maskable-512.png'), true);
    assert.equal(exists('assets/icons/logo-mark.svg'), true);
    assert.equal(exists('logos/sqlacademy.png'), false);
    assert.equal(exists('logos/sqlacademy2.png'), false);

    for (const icon of manifest.icons) {
        assert.match(icon.src, /^assets\/icons\//);
        assert.equal(exists(icon.src), true, `No existe ${icon.src}`);
    }
});

test('los materiales de feria y su QR existen', () => {
    assert.equal(exists('FERIA.md'), true);
    assert.equal(exists('feria.html'), true);
    assert.equal(exists('assets/images/qr-demo.png'), true);
});
