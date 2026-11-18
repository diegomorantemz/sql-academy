import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { DatabaseSync } from 'node:sqlite';
import { JSDOM } from 'jsdom';

const deckbuilderSource = fs.readFileSync(new URL('../deckbuilder.js', import.meta.url), 'utf8');

const pureDom = new JSDOM('<!doctype html><html><body></body></html>', {
    url: 'https://sql-academy.test/',
    runScripts: 'outside-only'
});
pureDom.window.eval(deckbuilderSource);

const internals = pureDom.window.DeckbuilderInternals;

function normalizeSql(sql) {
    return sql
        .replace(/\s+/g, ' ')
        .replace(/\s*,\s*/g, ', ')
        .trim()
        .replace(/;$/, '')
        .toLowerCase();
}

test('la base del juego y todas las soluciones son válidas', () => {
    const database = new DatabaseSync(':memory:');
    try {
        database.exec(internals.GAME_SQL);

        for (const floor of internals.FLOORS) {
            const rows = database.prepare(floor.expectedSql).all();
            assert.ok(rows.length > 0, `${floor.id} no devuelve filas`);

            const cardsByUid = new Map(floor.cards.map(card => [card.uid, card]));
            assert.equal(
                floor.solution.every(uid => cardsByUid.has(uid)),
                true,
                `${floor.id} usa cartas que no están en la mano`
            );

            const composed = internals.composeQuery(
                floor.solution.map(uid => cardsByUid.get(uid))
            );
            assert.equal(
                normalizeSql(composed),
                normalizeSql(floor.expectedSql),
                `${floor.id}: la solución no compone la consulta esperada`
            );
        }
    } finally {
        database.close();
    }
});

test('la torre tiene seis pisos y un pool de recompensas', () => {
    assert.equal(internals.FLOORS.length, 6);
    assert.ok(internals.REWARD_CARD_IDS.length >= 6);

    for (const floor of internals.FLOORS) {
        assert.ok(floor.title);
        assert.ok(floor.objective);
        assert.ok(floor.hint);
        assert.ok(floor.cards.length > 0);
        assert.ok(floor.solution.length > 0);
    }

    const choices = internals.getRewardChoices(0, []);
    assert.equal(choices.length, 3);
    assert.equal(new Set(choices).size, 3);
});

test('el juego se renderiza y permite superar un piso con recompensa', async () => {
    const dom = new JSDOM(
        `<!doctype html><html><body>
            <section id="section-game" class="section active">
                <strong id="gameFloorLabel"></strong>
                <strong id="gameScoreLabel"></strong>
                <strong id="gameDeckLabel"></strong>
                <div id="gameTower"></div>
                <div id="gameEncounter"></div>
                <div id="gameQueryPanel">
                    <span id="gameQueryStatus"></span>
                    <div id="gameQueryBoard"></div>
                    <div id="gameQueryPreview"></div>
                </div>
                <div id="gameFeedback" hidden></div>
                <div id="gameActions">
                    <button id="gameRunBtn"></button>
                </div>
                <div id="gameReward" hidden></div>
                <div id="gameHandPanel">
                    <span id="gameHandCount"></span>
                    <div id="gameHand"></div>
                </div>
                <div id="gamepadStatus" hidden></div>
            </section>
        </body></html>`,
        {
            url: 'https://sql-academy.test/',
            runScripts: 'outside-only',
            pretendToBeVisual: true
        }
    );

    const { window } = dom;
    window.confirm = () => true;
    window.requestAnimationFrame = () => 0;
    window.getSQLModule = () => ({
        Database: class {
            constructor() {
                this.database = new DatabaseSync(':memory:');
            }

            run(sql) {
                this.database.exec(sql);
            }

            exec(sql) {
                const statement = this.database.prepare(sql);
                const rows = statement.all();
                const columns = statement.columns().map(column => column.name);
                return [{
                    columns,
                    values: rows.map(row => columns.map(column => row[column]))
                }];
            }
        }
    });

    window.eval(deckbuilderSource);
    window.Deckbuilder.init();
    await new Promise(resolve => setTimeout(resolve, 20));

    const document = window.document;
    assert.match(document.getElementById('gameEncounter').textContent, /Primer contacto/);
    assert.equal(document.querySelectorAll('#gameHand .game-card').length, 5);

    for (const uid of ['f1-select', 'f1-nombre', 'f1-from', 'f1-agentes']) {
        window.Deckbuilder.playCard(uid);
    }

    assert.match(document.getElementById('gameQueryPreview').textContent, /SELECT nombre FROM agentes/);
    window.Deckbuilder.runQuery();

    assert.match(document.getElementById('gameFeedback').textContent, /Piso superado/);
    assert.equal(document.getElementById('gameReward').hidden, false);

    const reward = window.DeckbuilderInternals.getRewardChoices(0, [])[0];
    window.Deckbuilder.chooseReward(reward);
    assert.match(document.getElementById('gameReward').textContent, /La carta se ha añadido/);

    window.Deckbuilder.continueAfterReward();
    assert.equal(document.getElementById('gameFloorLabel').textContent, '2 / 6');
    assert.equal(document.getElementById('gameDeckLabel').textContent, '1');

    const stored = JSON.parse(window.localStorage.getItem(window.DeckbuilderInternals.STORAGE_KEY));
    assert.equal(stored.floorIndex, 1);
    assert.ok(stored.completedFloors.includes('floor-1'));
    assert.ok(stored.rewardCardIds.includes(reward));

    dom.window.close();
});
