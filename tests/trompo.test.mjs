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
    <span id="trompoHealthBar"></span>
    <strong id="trompoHealthLabel"></strong>
    <span id="trompoShieldBar"></span>
    <strong id="trompoShieldLabel"></strong>
    <strong id="trompoScoreLabel"></strong>
    <span id="trompoProgressBar"></span>
    <div id="trompoProgressTrack"></div>
    <div id="trompoEffects"></div>
    <button id="trompoPauseBtn"><i class="fas fa-pause"></i><span>Pausa</span></button>
    <button id="trompoMuteBtn"></button>
    <button id="trompoJumpBtn"></button>
    <button id="trompoTrunkBtn"></button>
    <button id="trompoStompBtn"></button>
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

test('Monte Mamut define cinco niveles largos', () => {
    const levels = window.TrompoInternals.LEVELS;
    assert.equal(levels.length, 5);
    assert.deepEqual([...levels].map(level => level.name), ['Base del cerro', 'Bosque nevado', 'Cumbre', 'Playa', 'Ciudad Gótica']);
    assert.deepEqual([...levels].map(level => level.rows), [1680, 1960, 2240, 2100, 2200]);
    assert.equal(levels[3].theme, 'beach');
    assert.equal(levels[4].theme, 'city');
});

test('el estado inicial tiene vida y escudo, no vidas sueltas', () => {
    const { makeState, getProgress, getRunScore, ROW_PX } = window.TrompoInternals;
    const state = makeState(1, 500);
    assert.equal(state.level.name, 'Bosque nevado');
    assert.equal(state.health, 100);
    assert.equal(state.maxHealth, 100);
    assert.equal(state.shield, 0);
    assert.equal(state.maxShield, 100);
    assert.equal(state.rows, 0);
    assert.equal(getProgress(state), 0);
    assert.equal(getRunScore(state), 500);

    state.rows = state.level.rows / 2;
    state.distance = state.rows * ROW_PX;
    state.score = 250;
    assert.equal(getProgress(state), 0.5);
    assert.equal(getRunScore(state), 750);
});

test('la bebida energética activa el vuelo durante ocho segundos', () => {
    const { makeState, applyEnergy } = window.TrompoInternals;
    const state = makeState(0);
    state.health = 40;
    applyEnergy(state);
    assert.equal(state.health, 40);
    assert.equal(state.flightTimer, 8);
});

test('el escarabajo Vocho recupera vida y llena el escudo', () => {
    const { makeState, applyVocho } = window.TrompoInternals;
    const state = makeState(0);
    state.health = 15;
    state.shield = 0;
    applyVocho(state);
    assert.equal(state.health, 100);
    assert.equal(state.shield, 100);
});

test('los aliados tecnológicos activan efectos temporales', () => {
    const { makeState, applyAlly } = window.TrompoInternals;
    const state = makeState(0);
    applyAlly(state, 'python');
    assert.equal(state.extraJumpTimer, 8);
    applyAlly(state, 'git');
    assert.equal(state.checkpointActive, true);
    applyAlly(state, 'docker');
    assert.ok(state.shield >= 60);
    applyAlly(state, 'go');
    assert.equal(state.boost, 6);
    applyAlly(state, 'rust');
    assert.equal(state.armorTimer, 8);
});

test('el daño consume primero el escudo', () => {
    const { makeState, applyDamageToState } = window.TrompoInternals;
    const state = makeState(0);
    state.shield = 100;
    const first = applyDamageToState(state, 22);
    assert.equal(first.remaining, 0);
    assert.equal(state.health, 100);
    assert.equal(state.shield, 78);

    const second = applyDamageToState(state, 100);
    assert.equal(second.remaining, 22);
    assert.equal(state.health, 78);
    assert.equal(state.shield, 0);
});

test('Trompo expone las acciones actuales', () => {
    assert.equal(typeof window.Trompo.startGame, 'function');
    assert.equal(typeof window.Trompo.attack, 'function');
    assert.equal(typeof window.Trompo.stomp, 'function');
    assert.equal(typeof window.Trompo.togglePause, 'function');
    assert.equal(typeof window.Trompo.getState, 'function');
    const state = window.Trompo.getState();
    assert.equal(state.mode, 'idle');
    assert.equal(state.levelIndex, 0);
    assert.equal(state.health, 100);
    assert.equal(state.shield, 0);
    assert.equal(state.flightTimer, 0);
});
