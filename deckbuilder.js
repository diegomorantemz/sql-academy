/**
 * Torre de Datos: mini deckbuilder educativo para construir consultas SQL.
 * Funciona con ratón, teclado y mando (Gamepad API).
 */
(function (global) {
    'use strict';

    const STORAGE_KEY = 'sql-academy-deckbuilder-v1';

    const GAME_SQL = `
        PRAGMA foreign_keys = ON;

        CREATE TABLE agentes (
            id INTEGER PRIMARY KEY,
            nombre TEXT NOT NULL,
            rango TEXT,
            nivel INTEGER,
            ciudad TEXT
        );

        CREATE TABLE misiones (
            id INTEGER PRIMARY KEY,
            agente_id INTEGER,
            codigo TEXT,
            dificultad INTEGER,
            completada INTEGER,
            FOREIGN KEY (agente_id) REFERENCES agentes(id)
        );

        INSERT INTO agentes (id, nombre, rango, nivel, ciudad) VALUES
            (1, 'Nova', 'Elite', 5, 'Neo Lima'),
            (2, 'Echo', 'Operativa', 4, 'Arequipa'),
            (3, 'Cipher', 'Elite', 5, 'Cusco'),
            (4, 'Lumen', 'Cadete', 2, 'Lima'),
            (5, 'Vega', 'Operativa', 3, 'Trujillo'),
            (6, 'Orion', 'Cadete', 1, 'Cusco');

        INSERT INTO misiones (id, agente_id, codigo, dificultad, completada) VALUES
            (1, 1, 'M-101', 5, 1),
            (2, 1, 'M-102', 4, 1),
            (3, 1, 'M-103', 3, 0),
            (4, 2, 'M-201', 4, 1),
            (5, 3, 'M-301', 5, 1),
            (6, 3, 'M-302', 2, 0),
            (7, 4, 'M-401', 1, 1),
            (8, 5, 'M-501', 3, 1),
            (9, 6, 'M-601', 1, 0);
    `;

    const CARD_TYPE_LABELS = {
        keyword: 'Cláusula',
        table: 'Tabla',
        column: 'Columna',
        value: 'Valor',
        function: 'Función',
        operator: 'Operador',
        punctuation: 'Signo',
        reward: 'Recompensa'
    };

    const CARD_TYPE_ICONS = {
        keyword: 'fa-code',
        table: 'fa-table',
        column: 'fa-columns',
        value: 'fa-quote-right',
        function: 'fa-calculator',
        operator: 'fa-equals',
        punctuation: 'fa-ellipsis',
        reward: 'fa-star'
    };

    const GAME_CARDS = {
        select: { text: 'SELECT', type: 'keyword', description: 'Indica las columnas que quieres mostrar.' },
        from: { text: 'FROM', type: 'keyword', description: 'Indica la tabla de origen.' },
        where: { text: 'WHERE', type: 'keyword', description: 'Filtra filas antes de agrupar.' },
        groupBy: { text: 'GROUP BY', type: 'keyword', description: 'Agrupa filas que comparten un valor.' },
        having: { text: 'HAVING', type: 'keyword', description: 'Filtra grupos después de agrupar.' },
        orderBy: { text: 'ORDER BY', type: 'keyword', description: 'Ordena el resultado.' },
        limit: { text: 'LIMIT', type: 'keyword', description: 'Limita el número de filas devueltas.' },
        join: { text: 'JOIN', type: 'keyword', description: 'Combina filas de dos tablas.' },
        on: { text: 'ON', type: 'keyword', description: 'Condición que relaciona las tablas del JOIN.' },
        as: { text: 'AS', type: 'keyword', description: 'Asigna un alias a una columna o expresión.' },
        desc: { text: 'DESC', type: 'keyword', description: 'Orden descendente.' },
        asc: { text: 'ASC', type: 'keyword', description: 'Orden ascendente.' },
        star: { text: '*', type: 'operator', description: 'Todas las columnas.' },
        gt: { text: '>', type: 'operator', description: 'Mayor que.' },
        eq: { text: '=', type: 'operator', description: 'Igual a.' },
        comma: { text: ',', type: 'punctuation', description: 'Separa columnas o criterios.' },
        countAll: { text: 'COUNT(*)', type: 'function', description: 'Cuenta filas.' },
        countMissions: { text: 'COUNT(misiones.id)', type: 'function', description: 'Cuenta misiones no nulas.' },
        nombre: { text: 'nombre', type: 'column', description: 'Nombre del agente.' },
        nivel: { text: 'nivel', type: 'column', description: 'Nivel del agente.' },
        agenteId: { text: 'agente_id', type: 'column', description: 'Identificador del agente en misiones.' },
        total: { text: 'total', type: 'column', description: 'Alias del total calculado.' },
        agentes: { text: 'agentes', type: 'table', description: 'Tabla de agentes.' },
        misiones: { text: 'misiones', type: 'table', description: 'Tabla de misiones.' },
        agentesNombre: { text: 'agentes.nombre', type: 'column', description: 'Nombre del agente.' },
        misionesCodigo: { text: 'misiones.codigo', type: 'column', description: 'Código de la misión.' },
        agentesId: { text: 'agentes.id', type: 'column', description: 'ID del agente.' },
        misionesAgenteId: { text: 'misiones.agente_id', type: 'column', description: 'Agente asignado a la misión.' },
        number1: { text: '1', type: 'value', description: 'Valor numérico 1.' },
        number3: { text: '3', type: 'value', description: 'Valor numérico 3.' },
        distinct: { text: 'DISTINCT', type: 'keyword', reward: true, rarity: 'rare', description: 'Elimina filas duplicadas.' },
        leftJoin: { text: 'LEFT JOIN', type: 'keyword', reward: true, rarity: 'rare', description: 'Conserva todas las filas de la tabla izquierda.' },
        avgNivel: { text: 'AVG(nivel)', type: 'function', reward: true, rarity: 'rare', description: 'Calcula el nivel medio.' },
        sumDificultad: { text: 'SUM(dificultad)', type: 'function', reward: true, rarity: 'rare', description: 'Suma la dificultad de las misiones.' },
        coalesceCiudad: { text: "COALESCE(ciudad, 'N/A')", type: 'function', reward: true, rarity: 'epic', description: 'Sustituye valores nulos de ciudad.' },
        countDistinct: { text: 'COUNT(DISTINCT agente_id)', type: 'function', reward: true, rarity: 'epic', description: 'Cuenta agentes distintos.' },
        substrNombre: { text: 'SUBSTR(nombre, 1, 3)', type: 'function', reward: true, rarity: 'rare', description: 'Extrae los tres primeros caracteres del nombre.' },
        number5: { text: '5', type: 'value', reward: true, rarity: 'basic', description: 'Valor numérico 5.' }
    };

    const REWARD_CARD_IDS = Object.keys(GAME_CARDS).filter(id => GAME_CARDS[id].reward);

    const FLOORS = [
        {
            id: 'floor-1',
            title: 'Primer contacto',
            difficulty: 'Inicio',
            story: 'La Torre de Datos ha detectado actividad. Necesitas identificar a todos los agentes registrados antes de avanzar.',
            objective: 'Muestra el nombre de todos los agentes.',
            hint: 'Empieza con SELECT nombre FROM agentes.',
            expectedSql: 'SELECT nombre FROM agentes;',
            ordered: false,
            cards: [
                { uid: 'f1-select', card: 'select' },
                { uid: 'f1-star', card: 'star' },
                { uid: 'f1-nombre', card: 'nombre' },
                { uid: 'f1-from', card: 'from' },
                { uid: 'f1-agentes', card: 'agentes' }
            ],
            solution: ['f1-select', 'f1-nombre', 'f1-from', 'f1-agentes']
        },
        {
            id: 'floor-2',
            title: 'Agentes de élite',
            difficulty: 'Filtro',
            story: 'El acceso está bloqueado por los agentes de mayor nivel. Encuentra a los que superan el nivel 3.',
            objective: 'Muestra el nombre y el nivel de los agentes con nivel mayor que 3.',
            hint: 'Usa WHERE nivel > 3.',
            expectedSql: 'SELECT nombre, nivel FROM agentes WHERE nivel > 3;',
            ordered: false,
            cards: [
                { uid: 'f2-select', card: 'select' },
                { uid: 'f2-nombre', card: 'nombre' },
                { uid: 'f2-comma', card: 'comma' },
                { uid: 'f2-nivel', card: 'nivel' },
                { uid: 'f2-from', card: 'from' },
                { uid: 'f2-agentes', card: 'agentes' },
                { uid: 'f2-where', card: 'where' },
                { uid: 'f2-nivel-2', card: 'nivel' },
                { uid: 'f2-gt', card: 'gt' },
                { uid: 'f2-number3', card: 'number3' }
            ],
            solution: [
                'f2-select', 'f2-nombre', 'f2-comma', 'f2-nivel', 'f2-from',
                'f2-agentes', 'f2-where', 'f2-nivel-2', 'f2-gt', 'f2-number3'
            ]
        },
        {
            id: 'floor-3',
            title: 'El código de salida',
            difficulty: 'Orden',
            story: 'La puerta necesita un código: los tres agentes con mayor nivel. Si hay empate, el nombre decide.',
            objective: 'Muestra el top 3 de agentes por nivel. Desempata por nombre ascendente.',
            hint: 'Ordena por nivel DESC, nombre ASC y usa LIMIT 3.',
            expectedSql: 'SELECT nombre, nivel FROM agentes ORDER BY nivel DESC, nombre ASC LIMIT 3;',
            ordered: true,
            cards: [
                { uid: 'f3-select', card: 'select' },
                { uid: 'f3-nombre', card: 'nombre' },
                { uid: 'f3-comma', card: 'comma' },
                { uid: 'f3-nivel', card: 'nivel' },
                { uid: 'f3-from', card: 'from' },
                { uid: 'f3-agentes', card: 'agentes' },
                { uid: 'f3-order', card: 'orderBy' },
                { uid: 'f3-nivel-2', card: 'nivel' },
                { uid: 'f3-desc', card: 'desc' },
                { uid: 'f3-comma-2', card: 'comma' },
                { uid: 'f3-nombre-2', card: 'nombre' },
                { uid: 'f3-asc', card: 'asc' },
                { uid: 'f3-limit', card: 'limit' },
                { uid: 'f3-number3', card: 'number3' }
            ],
            solution: [
                'f3-select', 'f3-nombre', 'f3-comma', 'f3-nivel', 'f3-from', 'f3-agentes',
                'f3-order', 'f3-nivel-2', 'f3-desc', 'f3-comma-2', 'f3-nombre-2', 'f3-asc',
                'f3-limit', 'f3-number3'
            ]
        },
        {
            id: 'floor-4',
            title: 'Registro de misiones',
            difficulty: 'JOIN',
            story: 'Las misiones están vinculadas a los agentes. Cruza ambas tablas para reconstruir el registro perdido.',
            objective: 'Muestra el nombre del agente y el código de cada misión.',
            hint: 'Une agentes con misiones usando agentes.id = misiones.agente_id.',
            expectedSql: 'SELECT agentes.nombre, misiones.codigo FROM agentes JOIN misiones ON agentes.id = misiones.agente_id;',
            ordered: false,
            cards: [
                { uid: 'f4-select', card: 'select' },
                { uid: 'f4-agentes-nombre', card: 'agentesNombre' },
                { uid: 'f4-comma', card: 'comma' },
                { uid: 'f4-misiones-codigo', card: 'misionesCodigo' },
                { uid: 'f4-from', card: 'from' },
                { uid: 'f4-agentes', card: 'agentes' },
                { uid: 'f4-join', card: 'join' },
                { uid: 'f4-misiones', card: 'misiones' },
                { uid: 'f4-on', card: 'on' },
                { uid: 'f4-agentes-id', card: 'agentesId' },
                { uid: 'f4-eq', card: 'eq' },
                { uid: 'f4-misiones-agente', card: 'misionesAgenteId' }
            ],
            solution: [
                'f4-select', 'f4-agentes-nombre', 'f4-comma', 'f4-misiones-codigo', 'f4-from',
                'f4-agentes', 'f4-join', 'f4-misiones', 'f4-on', 'f4-agentes-id', 'f4-eq',
                'f4-misiones-agente'
            ]
        },
        {
            id: 'floor-5',
            title: 'La sala de conteo',
            difficulty: 'Agrupación',
            story: 'El sistema quiere saber quién está acumulando misiones. Agrupa, cuenta y ordena a los agentes.',
            objective: 'Cuenta las misiones por agente y ordena por total descendente. Desempata por agente ascendente.',
            hint: 'Usa GROUP BY agente_id y ORDER BY total DESC, agente_id ASC.',
            expectedSql: 'SELECT agente_id, COUNT(*) AS total FROM misiones GROUP BY agente_id ORDER BY total DESC, agente_id ASC;',
            ordered: true,
            cards: [
                { uid: 'f5-select', card: 'select' },
                { uid: 'f5-agente-id', card: 'agenteId' },
                { uid: 'f5-comma', card: 'comma' },
                { uid: 'f5-count', card: 'countAll' },
                { uid: 'f5-as', card: 'as' },
                { uid: 'f5-total', card: 'total' },
                { uid: 'f5-from', card: 'from' },
                { uid: 'f5-misiones', card: 'misiones' },
                { uid: 'f5-group', card: 'groupBy' },
                { uid: 'f5-agente-id-2', card: 'agenteId' },
                { uid: 'f5-order', card: 'orderBy' },
                { uid: 'f5-total-2', card: 'total' },
                { uid: 'f5-desc', card: 'desc' },
                { uid: 'f5-comma-2', card: 'comma' },
                { uid: 'f5-agente-id-3', card: 'agenteId' },
                { uid: 'f5-asc', card: 'asc' }
            ],
            solution: [
                'f5-select', 'f5-agente-id', 'f5-comma', 'f5-count', 'f5-as', 'f5-total',
                'f5-from', 'f5-misiones', 'f5-group', 'f5-agente-id-2', 'f5-order',
                'f5-total-2', 'f5-desc', 'f5-comma-2', 'f5-agente-id-3', 'f5-asc'
            ]
        },
        {
            id: 'floor-6',
            title: 'El núcleo de la torre',
            difficulty: 'Jefe',
            story: 'El núcleo está protegido por los agentes con más de una misión. Solo los que dominan JOIN, GROUP BY y HAVING pueden abrirlo.',
            objective: 'Muestra los agentes con más de una misión y cuántas tienen.',
            hint: 'Usa JOIN, GROUP BY agentes.nombre y HAVING COUNT(misiones.id) > 1.',
            expectedSql: 'SELECT agentes.nombre, COUNT(misiones.id) AS total FROM agentes JOIN misiones ON agentes.id = misiones.agente_id GROUP BY agentes.nombre HAVING COUNT(misiones.id) > 1 ORDER BY total DESC;',
            ordered: true,
            cards: [
                { uid: 'f6-select', card: 'select' },
                { uid: 'f6-agentes-nombre', card: 'agentesNombre' },
                { uid: 'f6-comma', card: 'comma' },
                { uid: 'f6-count', card: 'countMissions' },
                { uid: 'f6-as', card: 'as' },
                { uid: 'f6-total', card: 'total' },
                { uid: 'f6-from', card: 'from' },
                { uid: 'f6-agentes', card: 'agentes' },
                { uid: 'f6-join', card: 'join' },
                { uid: 'f6-misiones', card: 'misiones' },
                { uid: 'f6-on', card: 'on' },
                { uid: 'f6-agentes-id', card: 'agentesId' },
                { uid: 'f6-eq', card: 'eq' },
                { uid: 'f6-misiones-agente', card: 'misionesAgenteId' },
                { uid: 'f6-group', card: 'groupBy' },
                { uid: 'f6-agentes-nombre-2', card: 'agentesNombre' },
                { uid: 'f6-having', card: 'having' },
                { uid: 'f6-count-2', card: 'countMissions' },
                { uid: 'f6-gt', card: 'gt' },
                { uid: 'f6-number1', card: 'number1' },
                { uid: 'f6-order', card: 'orderBy' },
                { uid: 'f6-total-2', card: 'total' },
                { uid: 'f6-desc', card: 'desc' }
            ],
            solution: [
                'f6-select', 'f6-agentes-nombre', 'f6-comma', 'f6-count', 'f6-as', 'f6-total',
                'f6-from', 'f6-agentes', 'f6-join', 'f6-misiones', 'f6-on', 'f6-agentes-id',
                'f6-eq', 'f6-misiones-agente', 'f6-group', 'f6-agentes-nombre-2', 'f6-having',
                'f6-count-2', 'f6-gt', 'f6-number1', 'f6-order', 'f6-total-2', 'f6-desc'
            ]
        }
    ];

    const DEFAULT_STATE = {
        floorIndex: 0,
        score: 0,
        completedFloors: [],
        rewardCardIds: [],
        pendingReward: null
    };

    let initialized = false;
    let gameDb = null;
    let gameDbReady = false;
    let gameDbAttempts = 0;
    let gameState = { ...DEFAULT_STATE };
    let gameFloor = null;
    let gameHand = [];
    let gameQuery = [];
    let gameFloorAttempts = 0;
    let gameHintUsed = false;
    let gameHintVisible = false;
    let gameFloorCompleted = false;
    let gameRewardChoices = [];
    let gameRewardChosen = null;
    let gameFeedbackState = null;
    let gamepadConnected = false;
    let gamepadHasFocus = false;
    let gamepadFocusIndex = 0;
    let gamepadPreviousButtons = [];
    let gamepadPreviousAxis = null;

    function getElement(id) {
        return document.getElementById(id);
    }

    function escapeHtml(value) {
        return String(value)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;');
    }

    function readStoredJSON(key, fallback) {
        try {
            const raw = global.localStorage?.getItem(key);
            if (!raw) return fallback;
            const parsed = JSON.parse(raw);
            return parsed && typeof parsed === 'object' ? parsed : fallback;
        } catch (error) {
            return fallback;
        }
    }

    function writeStoredJSON(key, value) {
        try {
            global.localStorage?.setItem(key, JSON.stringify(value));
        } catch (error) {
            /* almacenamiento no disponible */
        }
    }

    function loadGameState() {
        const stored = readStoredJSON(STORAGE_KEY, {});
        const completedFloors = Array.isArray(stored.completedFloors)
            ? Array.from(new Set(stored.completedFloors.filter(id => FLOORS.some(floor => floor.id === id))))
            : [];
        const rewardCardIds = Array.isArray(stored.rewardCardIds)
            ? Array.from(new Set(stored.rewardCardIds.filter(id => GAME_CARDS[id]?.reward)))
            : [];
        let floorIndex = Number.isInteger(stored.floorIndex) ? stored.floorIndex : 0;
        floorIndex = Math.max(0, Math.min(floorIndex, FLOORS.length));

        if (floorIndex < FLOORS.length && completedFloors.includes(FLOORS[floorIndex].id)) {
            const firstIncomplete = FLOORS.findIndex(floor => !completedFloors.includes(floor.id));
            floorIndex = firstIncomplete === -1 ? FLOORS.length : firstIncomplete;
        }
        if (completedFloors.length === FLOORS.length) floorIndex = FLOORS.length;

        let pendingReward = null;
        if (
            stored.pendingReward
            && Number.isInteger(stored.pendingReward.floorIndex)
            && stored.pendingReward.floorIndex >= 0
            && stored.pendingReward.floorIndex < FLOORS.length
            && completedFloors.includes(FLOORS[stored.pendingReward.floorIndex].id)
        ) {
            const choices = Array.isArray(stored.pendingReward.choices)
                ? stored.pendingReward.choices.filter(id => REWARD_CARD_IDS.includes(id))
                : [];
            const chosen = GAME_CARDS[stored.pendingReward.chosen]?.reward
                ? stored.pendingReward.chosen
                : null;
            pendingReward = {
                floorIndex: stored.pendingReward.floorIndex,
                choices,
                chosen
            };
        }

        return {
            floorIndex,
            score: Number.isFinite(stored.score) ? Math.max(0, Math.round(stored.score)) : 0,
            completedFloors,
            rewardCardIds,
            pendingReward
        };
    }

    function saveGameState() {
        writeStoredJSON(STORAGE_KEY, gameState);
    }

    function composeQuery(cards) {
        const text = cards
            .map(entry => GAME_CARDS[entry.card]?.text || '')
            .filter(Boolean)
            .join(' ');
        return text.replace(/\s+,/g, ',').replace(/,\s*/g, ', ');
    }

    function firstResultSet(result) {
        return Array.isArray(result) && result.length > 0 ? result[0] : null;
    }

    function normalizeRows(resultSet) {
        return resultSet.values.map(row => row.map(value => (
            value === null || value === undefined ? null : String(value)
        )));
    }

    function compareGameResults(expected, actual, ordered) {
        const expectedSet = firstResultSet(expected);
        const actualSet = firstResultSet(actual);

        if (!expectedSet) return { ok: false, reason: 'expected_empty' };
        if (!actualSet) return { ok: false, reason: 'no_result' };

        if (expectedSet.columns.length !== actualSet.columns.length) {
            return {
                ok: false,
                reason: 'columns',
                expectedColumns: expectedSet.columns.length,
                actualColumns: actualSet.columns.length
            };
        }

        const expectedRows = normalizeRows(expectedSet);
        const actualRows = normalizeRows(actualSet);
        if (expectedRows.length !== actualRows.length) {
            return {
                ok: false,
                reason: 'rows',
                expectedRows: expectedRows.length,
                actualRows: actualRows.length
            };
        }

        const serialize = row => JSON.stringify(row);
        const expectedSerialized = ordered
            ? expectedRows.map(serialize)
            : expectedRows.map(serialize).sort();
        const actualSerialized = ordered
            ? actualRows.map(serialize)
            : actualRows.map(serialize).sort();

        for (let index = 0; index < expectedSerialized.length; index += 1) {
            if (expectedSerialized[index] !== actualSerialized[index]) {
                return { ok: false, reason: 'values' };
            }
        }

        return { ok: true };
    }

    function describeComparison(comparison) {
        if (comparison.reason === 'columns') {
            return `Se esperaban ${comparison.expectedColumns} columnas y tu consulta devolvió ${comparison.actualColumns}.`;
        }
        if (comparison.reason === 'rows') {
            return `Se esperaban ${comparison.expectedRows} filas y tu consulta devolvió ${comparison.actualRows}.`;
        }
        if (comparison.reason === 'values') {
            return 'Las filas y columnas coinciden, pero los valores o el orden no son los esperados.';
        }
        if (comparison.reason === 'no_result') {
            return 'Tu consulta no devolvió un conjunto de resultados.';
        }
        return 'Todavía no coincide con el objetivo del piso.';
    }

    function getRewardChoices(floorIndex, ownedIds) {
        const owned = new Set(ownedIds || []);
        const pool = REWARD_CARD_IDS.filter(id => !owned.has(id));
        if (!pool.length) return [];
        const start = floorIndex % pool.length;
        const choices = [];
        for (let index = 0; index < Math.min(3, pool.length); index += 1) {
            choices.push(pool[(start + index) % pool.length]);
        }
        return choices;
    }

    function cardMarkup(cardId, entry, extraClass = '') {
        const card = GAME_CARDS[cardId];
        if (!card) return '';
        const type = card.reward ? 'reward' : card.type;
        const typeLabel = CARD_TYPE_LABELS[type] || 'Carta';
        const icon = CARD_TYPE_ICONS[type] || 'fa-star';
        return `
            <button type="button" class="game-card game-card-${type}${card.reward ? ' game-card-offer' : ''}${extraClass ? ` ${extraClass}` : ''}" data-game-focus onclick="Deckbuilder.playCard('${escapeHtml(entry.uid)}')" title="${escapeHtml(card.description || '')}">
                <span class="game-card-type"><i class="fas ${icon}"></i> ${typeLabel}</span>
                <strong>${escapeHtml(card.text)}</strong>
            </button>
        `;
    }

    function setFeedback(type, title, message) {
        gameFeedbackState = { type, title, message };
        renderFeedback();
    }

    function clearFeedback() {
        gameFeedbackState = null;
        renderFeedback();
    }

    function renderFeedback() {
        const container = getElement('gameFeedback');
        if (!container) return;
        if (!gameFeedbackState) {
            container.hidden = true;
            container.className = 'game-feedback';
            container.innerHTML = '';
            return;
        }
        container.hidden = false;
        container.className = `game-feedback game-feedback-${gameFeedbackState.type}`;
        container.innerHTML = `
            <strong>${escapeHtml(gameFeedbackState.title)}</strong>
            <p>${escapeHtml(gameFeedbackState.message)}</p>
        `;
    }

    function renderHud() {
        const floorLabel = getElement('gameFloorLabel');
        const scoreLabel = getElement('gameScoreLabel');
        const deckLabel = getElement('gameDeckLabel');
        if (floorLabel) {
            floorLabel.textContent = gameState.floorIndex >= FLOORS.length
                ? `${FLOORS.length} / ${FLOORS.length}`
                : `${gameState.floorIndex + 1} / ${FLOORS.length}`;
        }
        if (scoreLabel) scoreLabel.textContent = String(gameState.score);
        if (deckLabel) deckLabel.textContent = String(gameState.rewardCardIds.length);
    }

    function renderTower() {
        const tower = getElement('gameTower');
        if (!tower) return;
        tower.innerHTML = FLOORS.map((floor, index) => {
            const completed = gameState.completedFloors.includes(floor.id);
            const current = index === gameState.floorIndex && !completed;
            const locked = index > gameState.floorIndex && !completed;
            const status = completed ? 'Completado' : current ? 'En curso' : locked ? 'Bloqueado' : 'Pendiente';
            const icon = completed ? 'fa-circle-check' : current ? 'fa-location-dot' : locked ? 'fa-lock' : 'fa-circle';
            return `
                <div class="game-floor${completed ? ' is-complete' : ''}${current ? ' is-current' : ''}${locked ? ' is-locked' : ''}">
                    <span class="game-floor-index">${index + 1}</span>
                    <div class="game-floor-copy">
                        <strong>${escapeHtml(floor.title)}</strong>
                        <span>${escapeHtml(floor.difficulty)} · ${status}</span>
                    </div>
                    <i class="fas ${icon}" aria-hidden="true"></i>
                </div>
            `;
        }).join('');
    }

    function renderEncounter() {
        const encounter = getElement('gameEncounter');
        if (!encounter) return;
        if (!gameFloor) {
            renderVictory();
            return;
        }
        encounter.innerHTML = `
            <div class="game-encounter-top">
                <span class="game-floor-badge">Piso ${gameState.floorIndex + 1} · ${escapeHtml(gameFloor.difficulty)}</span>
                <span class="game-encounter-code">${escapeHtml(gameFloor.id.toUpperCase())}</span>
            </div>
            <h3>${escapeHtml(gameFloor.title)}</h3>
            <p class="game-story">${escapeHtml(gameFloor.story)}</p>
            <div class="game-objective">
                <span>Objetivo</span>
                <p>${escapeHtml(gameFloor.objective)}</p>
            </div>
            ${gameHintVisible ? `
                <div class="game-hint">
                    <i class="fas fa-lightbulb"></i>
                    <p>${escapeHtml(gameFloor.hint)}</p>
                </div>
            ` : ''}
        `;
    }

    function renderQuery() {
        const board = getElement('gameQueryBoard');
        const preview = getElement('gameQueryPreview');
        const status = getElement('gameQueryStatus');
        const runButton = getElement('gameRunBtn');
        if (!board || !preview) return;

        if (gameFloorCompleted) {
            board.innerHTML = '<p class="game-empty">Piso superado. Elige tu recompensa para continuar.</p>';
        } else if (!gameQuery.length) {
            board.innerHTML = '<p class="game-empty">Haz clic en las cartas de abajo para construir tu consulta.</p>';
        } else {
            board.innerHTML = gameQuery.map(entry => `
                <button type="button" class="game-query-token" data-game-focus onclick="Deckbuilder.removeCard('${escapeHtml(entry.uid)}')" title="Quitar esta carta">
                    ${escapeHtml(GAME_CARDS[entry.card]?.text || '')}
                    <i class="fas fa-xmark" aria-hidden="true"></i>
                </button>
            `).join('');
        }

        const sql = composeQuery(gameQuery);
        preview.innerHTML = sql
            ? `<code>${escapeHtml(sql)}</code>`
            : 'Selecciona cartas para construir tu consulta.';
        if (status) status.textContent = `${gameQuery.length} ${gameQuery.length === 1 ? 'carta' : 'cartas'}`;
        if (runButton) runButton.disabled = !gameDbReady || gameFloorCompleted || gameQuery.length === 0;
    }

    function renderHand() {
        const hand = getElement('gameHand');
        const count = getElement('gameHandCount');
        if (!hand) return;

        if (count) count.textContent = `${gameHand.length} ${gameHand.length === 1 ? 'carta' : 'cartas'}`;
        if (gameFloorCompleted) {
            hand.innerHTML = '<p class="game-empty">Piso completado. Sigue con la recompensa.</p>';
            return;
        }
        if (!gameHand.length) {
            hand.innerHTML = '<p class="game-empty">No quedan cartas. Deshaz alguna jugada.</p>';
            return;
        }
        hand.innerHTML = gameHand.map(entry => cardMarkup(entry.card, entry)).join('');
    }

    function renderReward() {
        const reward = getElement('gameReward');
        const actions = getElement('gameActions');
        const handPanel = getElement('gameHandPanel');
        const queryPanel = getElement('gameQueryPanel');
        if (!reward) return;

        if (!gameFloorCompleted) {
            reward.hidden = true;
            reward.innerHTML = '';
            if (actions) actions.hidden = false;
            if (handPanel) handPanel.hidden = false;
            if (queryPanel) queryPanel.hidden = false;
            return;
        }

        if (actions) actions.hidden = true;
        if (handPanel) handPanel.hidden = true;
        if (queryPanel) queryPanel.hidden = true;
        reward.hidden = false;

        if (gameRewardChosen) {
            const chosen = GAME_CARDS[gameRewardChosen];
            reward.innerHTML = `
                <div class="game-reward-chosen">
                    <i class="fas fa-star"></i>
                    <div>
                        <strong>${escapeHtml(chosen?.text || 'Recompensa añadida')}</strong>
                        <p>La carta se ha añadido a tu mazo para los próximos pisos.</p>
                    </div>
                </div>
                <button type="button" class="btn-primary" data-game-focus onclick="Deckbuilder.continueAfterReward()">
                    Continuar <i class="fas fa-arrow-right"></i>
                </button>
            `;
            return;
        }

        if (!gameRewardChoices.length) {
            reward.innerHTML = `
                <div class="game-reward-head">
                    <span class="game-floor-badge">Piso superado</span>
                    <h3>La torre sigue en pie</h3>
                    <p>No quedan cartas de recompensa disponibles. Continúa al siguiente piso.</p>
                </div>
                <button type="button" class="btn-primary" data-game-focus onclick="Deckbuilder.continueAfterReward()">
                    Continuar <i class="fas fa-arrow-right"></i>
                </button>
            `;
            return;
        }

        reward.innerHTML = `
            <div class="game-reward-head">
                <span class="game-floor-badge">Piso superado</span>
                <h3>Elige una recompensa</h3>
                <p>Añade una carta a tu mazo para los próximos pisos.</p>
            </div>
            <div class="game-reward-cards">
                ${gameRewardChoices.map(cardId => {
                    const card = GAME_CARDS[cardId];
                    const type = card.reward ? 'reward' : card.type;
                    const typeLabel = CARD_TYPE_LABELS[type] || 'Carta';
                    const icon = CARD_TYPE_ICONS[type] || 'fa-star';
                    return `
                        <button type="button" class="game-card game-card-reward game-card-offer" data-game-focus onclick="Deckbuilder.chooseReward('${escapeHtml(cardId)}')" title="${escapeHtml(card.description || '')}">
                            <span class="game-card-type"><i class="fas ${icon}"></i> ${typeLabel}</span>
                            <strong>${escapeHtml(card.text)}</strong>
                            <small>${escapeHtml(card.description || '')}</small>
                        </button>
                    `;
                }).join('')}
            </div>
        `;
    }

    function renderVictory() {
        const encounter = getElement('gameEncounter');
        const queryPanel = getElement('gameQueryPanel');
        const actions = getElement('gameActions');
        const handPanel = getElement('gameHandPanel');
        const reward = getElement('gameReward');
        const feedback = getElement('gameFeedback');
        if (encounter) {
            encounter.innerHTML = `
                <div class="game-victory">
                    <span class="game-victory-icon"><i class="fas fa-trophy"></i></span>
                    <span class="game-floor-badge">Torre completada</span>
                    <h3>Has llegado a la cima</h3>
                    <p>Superaste los ${FLOORS.length} pisos con ${gameState.score} puntos y ${gameState.rewardCardIds.length} cartas de recompensa.</p>
                    <button type="button" class="btn-primary" data-game-focus onclick="Deckbuilder.resetGame()">
                        <i class="fas fa-rotate-left"></i> Jugar de nuevo
                    </button>
                </div>
            `;
        }
        if (queryPanel) queryPanel.hidden = true;
        if (actions) actions.hidden = true;
        if (handPanel) handPanel.hidden = true;
        if (reward) {
            reward.hidden = true;
            reward.innerHTML = '';
        }
        if (feedback) {
            feedback.hidden = true;
            feedback.innerHTML = '';
        }
        updateGamepadFocus();
    }

    function renderGame() {
        if (!initialized) return;
        const section = getElement('section-game');
        if (!section) return;

        renderHud();
        renderTower();

        if (!gameDbReady) {
            const encounter = getElement('gameEncounter');
            if (encounter) {
                encounter.innerHTML = `
                    <div class="game-encounter-empty">
                        <i class="fas fa-hourglass-half"></i>
                        <h3>Cargando la torre...</h3>
                        <p>Preparando el motor de datos.</p>
                    </div>
                `;
            }
            const queryPanel = getElement('gameQueryPanel');
            const actions = getElement('gameActions');
            const handPanel = getElement('gameHandPanel');
            const reward = getElement('gameReward');
            if (queryPanel) queryPanel.hidden = true;
            if (actions) actions.hidden = true;
            if (handPanel) handPanel.hidden = true;
            if (reward) reward.hidden = true;
            return;
        }

        if (!gameFloor) {
            renderVictory();
            return;
        }

        renderEncounter();
        renderQuery();
        renderHand();
        renderFeedback();
        renderReward();
        updateGamepadFocus();
    }

    function startFloor(index, options = {}) {
        gameState.floorIndex = Math.max(0, Math.min(index, FLOORS.length));
        if (!options.keepPending) gameState.pendingReward = null;
        gameFloor = FLOORS[gameState.floorIndex] || null;
        gameHand = [];
        gameQuery = [];
        gameFloorAttempts = 0;
        gameHintUsed = false;
        gameHintVisible = false;
        gameFloorCompleted = false;
        gameRewardChoices = [];
        gameRewardChosen = null;
        gameFeedbackState = null;

        if (gameFloor) {
            gameHand = gameFloor.cards.map(entry => ({ ...entry }));
            gameState.rewardCardIds.forEach((cardId, rewardIndex) => {
                gameHand.push({
                    uid: `reward-${gameState.floorIndex}-${cardId}-${rewardIndex}`,
                    card: cardId
                });
            });
        }

        saveGameState();
        renderGame();
    }

    function initGameDatabase() {
        if (gameDbReady) return;
        const SQL = typeof global.getSQLModule === 'function' ? global.getSQLModule() : null;
        if (!SQL) {
            gameDbAttempts += 1;
            if (gameDbAttempts < 40) {
                global.setTimeout(initGameDatabase, 250);
            } else {
                const encounter = getElement('gameEncounter');
                if (encounter) {
                    encounter.innerHTML = `
                        <div class="game-encounter-empty">
                            <i class="fas fa-circle-exclamation"></i>
                            <h3>No se pudo cargar el motor SQL</h3>
                            <p>Recarga la página para volver a intentarlo.</p>
                        </div>
                    `;
                }
                const queryPanel = getElement('gameQueryPanel');
                const actions = getElement('gameActions');
                const handPanel = getElement('gameHandPanel');
                const reward = getElement('gameReward');
                if (queryPanel) queryPanel.hidden = true;
                if (actions) actions.hidden = true;
                if (handPanel) handPanel.hidden = true;
                if (reward) reward.hidden = true;
            }
            return;
        }

        try {
            gameDb = new SQL.Database();
            gameDb.run(GAME_SQL);
            gameDbReady = true;
            renderGame();
        } catch (error) {
            console.error('No se pudo iniciar Torre de Datos:', error);
            const encounter = getElement('gameEncounter');
            if (encounter) {
                encounter.innerHTML = `
                    <div class="game-encounter-empty">
                        <i class="fas fa-circle-exclamation"></i>
                        <h3>Error al preparar la torre</h3>
                        <p>${escapeHtml(error.message || 'No se pudo crear la base de datos del juego.')}</p>
                    </div>
                `;
            }
            const queryPanel = getElement('gameQueryPanel');
            const actions = getElement('gameActions');
            const handPanel = getElement('gameHandPanel');
            const reward = getElement('gameReward');
            if (queryPanel) queryPanel.hidden = true;
            if (actions) actions.hidden = true;
            if (handPanel) handPanel.hidden = true;
            if (reward) reward.hidden = true;
        }
    }

    function playCard(uid) {
        if (!gameDbReady || gameFloorCompleted || !gameFloor) return;
        const index = gameHand.findIndex(entry => entry.uid === uid);
        if (index === -1) return;
        const [entry] = gameHand.splice(index, 1);
        gameQuery.push(entry);
        clearFeedback();
        renderGame();
    }

    function removeCard(uid) {
        const index = gameQuery.findIndex(entry => entry.uid === uid);
        if (index === -1) return;
        const [entry] = gameQuery.splice(index, 1);
        gameHand.push(entry);
        clearFeedback();
        renderGame();
    }

    function undo() {
        if (!gameQuery.length || gameFloorCompleted) return;
        const entry = gameQuery.pop();
        gameHand.push(entry);
        clearFeedback();
        renderGame();
    }

    function clearQuery() {
        if (!gameQuery.length || gameFloorCompleted) return;
        gameHand = gameHand.concat(gameQuery);
        gameQuery = [];
        clearFeedback();
        renderGame();
    }

    function showHint() {
        if (!gameFloor || gameFloorCompleted) return;
        if (!gameHintVisible) {
            gameHintVisible = true;
            gameHintUsed = true;
            renderGame();
        }
    }

    function runQuery() {
        if (!gameDbReady) {
            setFeedback('warning', 'Motor no disponible', 'Espera a que la torre termine de cargar.');
            return;
        }
        if (!gameFloor || gameFloorCompleted) return;
        if (!gameQuery.length) {
            setFeedback('warning', 'Consulta vacía', 'Coloca algunas cartas antes de ejecutar.');
            return;
        }

        const sql = composeQuery(gameQuery);
        try {
            const expected = gameDb.exec(gameFloor.expectedSql);
            const actual = gameDb.exec(sql);
            const comparison = compareGameResults(expected, actual, gameFloor.ordered);

            if (!comparison.ok) {
                gameFloorAttempts += 1;
                setFeedback('error', 'Todavía no', describeComparison(comparison));
                renderGame();
                return;
            }

            gameState.completedFloors = Array.from(new Set([...gameState.completedFloors, gameFloor.id]));
            const baseScore = 100 + (gameFloorAttempts === 0 ? 25 : 0) - (gameHintUsed ? 20 : 0);
            const gained = Math.max(20, baseScore - gameFloorAttempts * 10);
            gameState.score += gained;
            gameFloorCompleted = true;
            gameRewardChosen = null;
            gameRewardChoices = getRewardChoices(gameState.floorIndex, gameState.rewardCardIds);
            gameState.pendingReward = {
                floorIndex: gameState.floorIndex,
                choices: gameRewardChoices,
                chosen: null
            };
            saveGameState();
            setFeedback('success', 'Piso superado', `Consulta correcta. Has ganado ${gained} puntos.`);
            renderGame();
        } catch (error) {
            gameFloorAttempts += 1;
            setFeedback('error', 'Error en la consulta', error.message || String(error));
            renderGame();
        }
    }

    function chooseReward(cardId) {
        if (!gameFloorCompleted || gameRewardChosen || !gameRewardChoices.includes(cardId)) return;
        if (!gameState.rewardCardIds.includes(cardId)) {
            gameState.rewardCardIds.push(cardId);
        }
        gameRewardChosen = cardId;
        gameRewardChoices = [];
        gameState.pendingReward = {
            floorIndex: gameState.floorIndex,
            choices: [],
            chosen: cardId
        };
        saveGameState();
        setFeedback('info', 'Recompensa añadida', `${GAME_CARDS[cardId]?.text || cardId} se ha añadido a tu mazo.`);
        renderGame();
    }

    function continueAfterReward() {
        if (!gameFloorCompleted) return;
        if (gameRewardChoices.length && !gameRewardChosen) return;
        gameState.pendingReward = null;
        startFloor(gameState.floorIndex + 1);
    }

    function resetGame() {
        if (!global.confirm('¿Reiniciar la partida de Torre de Datos?')) return;
        try {
            global.localStorage?.removeItem(STORAGE_KEY);
        } catch (error) {
            /* almacenamiento no disponible */
        }
        gameState = { ...DEFAULT_STATE, completedFloors: [], rewardCardIds: [] };
        startFloor(0);
    }

    function isGameActive() {
        return Boolean(getElement('section-game')?.classList.contains('active'));
    }

    function getGamepadFocusables() {
        return Array.from(document.querySelectorAll('#section-game [data-game-focus]'))
            .filter(element => !element.disabled && element.getClientRects().length > 0);
    }

    function updateGamepadFocus() {
        const focusables = getGamepadFocusables();
        document.querySelectorAll('#section-game .is-gamepad-focused').forEach(element => {
            element.classList.remove('is-gamepad-focused');
        });
        if (!gamepadHasFocus || !focusables.length) return;
        gamepadFocusIndex = Math.max(0, Math.min(gamepadFocusIndex, focusables.length - 1));
        const element = focusables[gamepadFocusIndex];
        if (element) {
            element.classList.add('is-gamepad-focused');
            if (typeof element.scrollIntoView === 'function') {
                element.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
            }
        }
    }

    function moveGamepadFocus(delta) {
        const focusables = getGamepadFocusables();
        if (!focusables.length) return;
        gamepadHasFocus = true;
        gamepadFocusIndex = (gamepadFocusIndex + delta + focusables.length) % focusables.length;
        updateGamepadFocus();
    }

    function activateGamepadFocus() {
        const focusables = getGamepadFocusables();
        if (!focusables.length) return;
        gamepadHasFocus = true;
        gamepadFocusIndex = Math.max(0, Math.min(gamepadFocusIndex, focusables.length - 1));
        focusables[gamepadFocusIndex].click();
    }

    function setGamepadStatus(connected) {
        gamepadConnected = connected;
        const status = getElement('gamepadStatus');
        if (status) status.hidden = !connected;
        if (!connected) {
            gamepadHasFocus = false;
            updateGamepadFocus();
        }
    }

    function pollGamepad() {
        if (typeof global.requestAnimationFrame === 'function') {
            global.requestAnimationFrame(pollGamepad);
        }
        const pads = typeof global.navigator?.getGamepads === 'function'
            ? Array.from(global.navigator.getGamepads()).filter(Boolean)
            : [];
        const pad = pads[0];
        const connected = Boolean(pad);
        if (connected !== gamepadConnected) {
            setGamepadStatus(connected);
        }
        if (!pad || !isGameActive()) {
            gamepadPreviousButtons = [];
            gamepadPreviousAxis = null;
            return;
        }

        const buttons = pad.buttons.map(button => button.pressed);
        const justPressed = index => Boolean(buttons[index] && !gamepadPreviousButtons[index]);
        const axisX = pad.axes[0] || 0;
        const axisY = pad.axes[1] || 0;
        const deadzone = 0.55;
        let direction = null;
        if (axisY < -deadzone) direction = 'up';
        else if (axisY > deadzone) direction = 'down';
        else if (axisX < -deadzone) direction = 'left';
        else if (axisX > deadzone) direction = 'right';

        if (justPressed(12) || direction === 'up' && gamepadPreviousAxis !== 'up') {
            moveGamepadFocus(-1);
        } else if (justPressed(13) || direction === 'down' && gamepadPreviousAxis !== 'down') {
            moveGamepadFocus(1);
        } else if (justPressed(14) || direction === 'left' && gamepadPreviousAxis !== 'left') {
            moveGamepadFocus(-1);
        } else if (justPressed(15) || direction === 'right' && gamepadPreviousAxis !== 'right') {
            moveGamepadFocus(1);
        }

        if (justPressed(0)) activateGamepadFocus();
        if (justPressed(1)) undo();
        if (justPressed(2)) runQuery();
        if (justPressed(3)) showHint();

        gamepadPreviousButtons = buttons;
        gamepadPreviousAxis = direction;
    }

    function handleKeydown(event) {
        if (!isGameActive()) return;
        if (document.querySelector('.modal.active')) return;
        const target = event.target;
        if (target && target.matches && target.matches('input, textarea, select')) return;

        if ((event.ctrlKey || event.metaKey) && event.key === 'Enter') {
            event.preventDefault();
            runQuery();
            return;
        }
        if (event.key === 'Backspace') {
            event.preventDefault();
            undo();
        }
    }

    function init() {
        if (initialized) return;
        initialized = true;
        const section = getElement('section-game');
        if (!section) return;

        gameState = loadGameState();
        const pendingReward = gameState.pendingReward;
        if (pendingReward) {
            startFloor(pendingReward.floorIndex, { keepPending: true });
            gameFloorCompleted = true;
            gameRewardChoices = pendingReward.choices;
            gameRewardChosen = pendingReward.chosen;
            gameFeedbackState = pendingReward.chosen
                ? { type: 'info', title: 'Recompensa elegida', message: 'La carta ya está en tu mazo. Continúa al siguiente piso.' }
                : { type: 'success', title: 'Piso superado', message: 'Elige una recompensa para continuar.' };
            renderGame();
        } else {
            startFloor(gameState.floorIndex);
        }
        initGameDatabase();

        document.addEventListener('keydown', handleKeydown);
        global.addEventListener('gamepadconnected', event => {
            setGamepadStatus(true);
            gamepadHasFocus = false;
            if (event.gamepad) {
                setFeedback('info', 'Mando conectado', `${event.gamepad.id}. Usa el D-pad o el stick para navegar.`);
            }
        });
        global.addEventListener('gamepaddisconnected', () => {
            setGamepadStatus(false);
        });
        if (typeof global.requestAnimationFrame === 'function') {
            global.requestAnimationFrame(pollGamepad);
        }
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

    global.Deckbuilder = {
        init,
        playCard,
        removeCard,
        undo,
        clearQuery,
        showHint,
        runQuery,
        chooseReward,
        continueAfterReward,
        resetGame
    };

    global.DeckbuilderInternals = {
        STORAGE_KEY,
        GAME_SQL,
        GAME_CARDS,
        FLOORS,
        REWARD_CARD_IDS,
        composeQuery,
        compareGameResults,
        getRewardChoices
    };
}(typeof window !== 'undefined' ? window : globalThis));
