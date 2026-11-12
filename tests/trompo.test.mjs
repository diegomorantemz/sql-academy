import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { JSDOM } from 'jsdom';

const html = `<!DOCTYPE html>
<html lang="es">
<body>
    <div id="gameTrompoPanel"></div>
    <div id="trompoCanvas"></div>
    <div id="trompoOverlay"></div>
    <strong id="trompoLevelLabel"></strong>
    <strong id="trompoRowsLabel"></strong>
    <strong id="trompoScoreLabel"></strong>
    <strong id="trompoLivesLabel"></strong>
    <span id="trompoProgressBar"></span>
    <div id="trompoProgressTrack"></div>
    <button id="trompoPauseBtn"><i class="fas fa-pause"></i><span>Pausa</span></button>
    <button id="trompoMuteBtn"></button>
    <button id="trompoRollbackBtn"></button>
    <div id="trompoGamepadStatus" hidden></div>
</body>
</html>`;

const dom = new JSDOM(html, {
    url: 'https://sql-academy.test/',
    runScripts: 'outside-only',
    pretendToBeVisual: true
});
const { window } = dom;

window.eval(fs.readFileSync(new URL('../trompo.js', import.meta.url), 'utf8'));

test('Trompo define cinco niveles con nombres de SQL', () => {
    const levels = window.TrompoInternals.LEVELS;
    assert.equal(levels.length, 5);
    assert.deepEqual([...levels].map(level => level.name), ['FROM', 'WHERE', 'GROUP BY', 'ORDER BY', 'LIMIT']);
    assert.ok(levels.every(level => level.rows > 0 && level.speed > 0));
});

test('el estado inicial de Trompo conserva vidas, puntaje y progreso', () => {
    const { makeState, getProgress, getRunScore, ROW_PX } = window.TrompoInternals;
    const state = makeState(1, 500);
    assert.equal(state.level.name, 'WHERE');
    assert.equal(state.lives, 3);
    assert.equal(state.rows, 0);
    assert.equal(getProgress(state), 0);
    assert.equal(getRunScore(state), 500);

    state.rows = state.level.rows / 2;
    state.distance = state.rows * ROW_PX;
    state.score = 250;
    assert.equal(getProgress(state), 0.5);
    assert.equal(getRunScore(state), 750);
});

test('Trompo expone las acciones principales y el estado actual', () => {
    assert.equal(typeof window.Trompo.startGame, 'function');
    assert.equal(typeof window.Trompo.togglePause, 'function');
    assert.equal(typeof window.Trompo.restartLevel, 'function');
    assert.equal(typeof window.Trompo.getState, 'function');
    const state = window.Trompo.getState();
    assert.equal(state.mode, 'idle');
    assert.equal(state.levelIndex, 0);
    assert.equal(state.lives, 3);
});
