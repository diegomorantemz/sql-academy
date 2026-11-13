/**
 * Monte Mamut: runner de descanso protagonizado por Trompo, un mamut azul.
 * Funciona con teclado, controles táctiles y mando (Gamepad API).
 */
(function (global) {
    'use strict';

    const STORAGE_KEY = 'sql-academy-monte-mamut-v1';
    const MUTE_KEY = 'sql-academy-monte-mamut-muted';
    const VIEW_W = 1000;
    const VIEW_H = 360;
    const GROUND_Y = 292;
    const ROW_PX = 12;
    const PLAYER_X = 140;

    const LEVELS = [
        {
            id: 'base',
            name: 'Base del cerro',
            rows: 1680,
            speed: 270,
            spawn: 1.15,
            accent: '#5b8db8'
        },
        {
            id: 'forest',
            name: 'Bosque nevado',
            rows: 1960,
            speed: 300,
            spawn: 1.0,
            accent: '#3f7f6a'
        },
        {
            id: 'summit',
            name: 'Cumbre',
            rows: 2240,
            speed: 330,
            spawn: 0.86,
            accent: '#7c5cbf'
        },
        {
            id: 'beach',
            name: 'Playa',
            rows: 2100,
            speed: 350,
            spawn: 0.82,
            accent: '#0ea5e9',
            theme: 'beach'
        },
        {
            id: 'gotham',
            name: 'Ciudad Gótica',
            rows: 2200,
            speed: 370,
            spawn: 0.8,
            accent: '#7c3aed',
            theme: 'city'
        }
    ];

    const ALLIES = {
        python: {
            name: 'Serpiente',
            label: 'PYTHON',
            color: '#16a34a',
            ink: '#052e16',
            duration: 8,
            effect: 'Doble salto'
        },
        git: {
            name: 'Gato',
            label: 'GIT',
            color: '#ea580c',
            ink: '#431407',
            duration: 8,
            effect: 'Checkpoint'
        },
        docker: {
            name: 'Ballena',
            label: 'DOCKER',
            color: '#0284c7',
            ink: '#082f49',
            duration: 8,
            effect: 'Escudo'
        },
        go: {
            name: 'Topo',
            label: 'GO',
            color: '#0ea5e9',
            ink: '#082f49',
            duration: 6,
            effect: 'Velocidad'
        },
        rust: {
            name: 'Cangrejo',
            label: 'RUST',
            color: '#dc2626',
            ink: '#450a0a',
            duration: 8,
            effect: 'Armadura'
        }
    };

    let canvas = null;
    let ctx = null;
    let overlay = null;
    let els = {};
    let game = null;
    let mode = 'idle';
    let rafId = null;
    let lastTime = 0;
    let audioContext = null;
    let masterGain = null;
    let muted = false;
    let previousGamepadButtons = [];
    let duckReleaseTimer = null;
    let keyDuckHeld = false;
    let reduceMotion = false;
    let best = { score: 0, level: 0, completed: false };

    function clamp(value, min, max) {
        return Math.max(min, Math.min(max, value));
    }

    function formatNumber(value) {
        return Math.round(value).toLocaleString('es-PE');
    }

    function getRunScore(state = game) {
        return state.totalScore + state.score;
    }

    function getProgress(state = game) {
        if (!state || !state.level) return 0;
        return clamp(state.rows / state.level.rows, 0, 1);
    }

    function makeSnow() {
        return Array.from({ length: 42 }, () => ({
            x: Math.random() * VIEW_W,
            y: Math.random() * VIEW_H,
            size: 1 + Math.random() * 2.6,
            speed: 14 + Math.random() * 34,
            drift: -8 + Math.random() * 16
        }));
    }

    function makeState(levelIndex = 0, totalScore = 0) {
        const level = LEVELS[levelIndex] || LEVELS[0];
        return {
            levelIndex,
            level,
            totalScore,
            distance: 0,
            rows: 0,
            score: 0,
            health: 100,
            maxHealth: 100,
            shield: 0,
            maxShield: 100,
            combo: 0,
            maxCombo: 0,
            insects: 0,
            flightTimer: 0,
            invincible: 0,
            boost: 0,
            armorTimer: 0,
            extraJumpTimer: 0,
            checkpointActive: false,
            checkpointTimer: 0,
            dockerTimer: 0,
            ducking: false,
            stompTimer: 0,
            attackTimer: 0,
            attackCooldown: 0,
            playerY: GROUND_Y,
            vy: 0,
            onGround: true,
            airJumps: 0,
            obstacles: [],
            powerups: [],
            particles: [],
            snow: makeSnow(),
            spawnTimer: 1.1,
            powerTimer: 8,
            allySpawns: [0.36, 0.72],
            allySpawnIndex: 0,
            alliesUsed: [],
            vochoSpawned: false,
            shake: 0,
            flash: 0,
            flashText: '',
            elapsed: 0
        };
    }

    function readStored(key, fallback) {
        try {
            const raw = localStorage.getItem(key);
            return raw ? JSON.parse(raw) : fallback;
        } catch (error) {
            return fallback;
        }
    }

    function writeStored(key, value) {
        try {
            localStorage.setItem(key, JSON.stringify(value));
        } catch (error) {
            // El juego sigue funcionando aunque localStorage esté bloqueado.
        }
    }

    function loadBest() {
        const stored = readStored(STORAGE_KEY, null);
        if (!stored || typeof stored !== 'object') return { score: 0, level: 0, completed: false };
        return {
            score: Number(stored.score) || 0,
            level: Number(stored.level) || 0,
            completed: Boolean(stored.completed)
        };
    }

    function saveBest(score, level, completed = false) {
        if (score > best.score) {
            best = { score, level, completed };
        } else if (completed && !best.completed) {
            best = { ...best, completed: true };
        }
        writeStored(STORAGE_KEY, best);
    }

    function ensureAudio() {
        if (audioContext) {
            if (audioContext.state === 'suspended') {
                audioContext.resume().catch(() => {});
            }
            return audioContext;
        }

        const AudioContextClass = global.AudioContext || global.webkitAudioContext;
        if (!AudioContextClass) return null;

        try {
            audioContext = new AudioContextClass();
            masterGain = audioContext.createGain();
            masterGain.gain.value = muted ? 0 : 0.1;
            masterGain.connect(audioContext.destination);
            if (audioContext.state === 'suspended') {
                audioContext.resume().catch(() => {});
            }
            return audioContext;
        } catch (error) {
            audioContext = null;
            masterGain = null;
            return null;
        }
    }

    function playTone({ frequency, endFrequency = frequency, duration = 0.12, type = 'sine', gain = 0.045, delay = 0 }) {
        if (muted) return;
        const context = ensureAudio();
        if (!context || !masterGain) return;

        const start = context.currentTime + delay;
        const oscillator = context.createOscillator();
        const envelope = context.createGain();
        oscillator.type = type;
        oscillator.frequency.setValueAtTime(Math.max(20, frequency), start);
        oscillator.frequency.exponentialRampToValueAtTime(Math.max(20, endFrequency), start + duration);
        envelope.gain.setValueAtTime(0.0001, start);
        envelope.gain.exponentialRampToValueAtTime(gain, start + Math.min(0.02, duration / 4));
        envelope.gain.exponentialRampToValueAtTime(0.0001, start + duration);
        oscillator.connect(envelope).connect(masterGain);
        oscillator.start(start);
        oscillator.stop(start + duration + 0.04);
    }

    function playSound(name) {
        if (muted) return;
        if (name === 'jump') {
            playTone({ frequency: 350, endFrequency: 620, duration: 0.13, type: 'sine', gain: 0.04 });
        } else if (name === 'trunk') {
            playTone({ frequency: 190, endFrequency: 95, duration: 0.12, type: 'square', gain: 0.04 });
        } else if (name === 'squash') {
            playTone({ frequency: 125, endFrequency: 55, duration: 0.13, type: 'square', gain: 0.045 });
        } else if (name === 'hit') {
            playTone({ frequency: 180, endFrequency: 65, duration: 0.28, type: 'sawtooth', gain: 0.045 });
        } else if (name === 'energy') {
            playTone({ frequency: 600, endFrequency: 920, duration: 0.15, type: 'triangle', gain: 0.04 });
        } else if (name === 'vocho') {
            playTone({ frequency: 280, endFrequency: 560, duration: 0.18, type: 'triangle', gain: 0.05 });
            playTone({ frequency: 420, endFrequency: 840, duration: 0.2, type: 'sine', gain: 0.04, delay: 0.14 });
        } else if (name === 'ally') {
            playTone({ frequency: 720, endFrequency: 980, duration: 0.12, type: 'triangle', gain: 0.04 });
        } else if (name === 'checkpoint') {
            playTone({ frequency: 440, endFrequency: 660, duration: 0.16, type: 'sine', gain: 0.04 });
        } else if (name === 'level') {
            [523.25, 659.25, 783.99].forEach((frequency, index) => {
                playTone({ frequency, duration: 0.16, type: 'triangle', gain: 0.04, delay: index * 0.12 });
            });
        } else if (name === 'gameover') {
            [330, 262, 196].forEach((frequency, index) => {
                playTone({ frequency, endFrequency: frequency * 0.78, duration: 0.24, type: 'sine', gain: 0.04, delay: index * 0.14 });
            });
        }
    }

    function updateMuteButton() {
        const button = els.mute;
        if (!button) return;
        button.setAttribute('aria-pressed', String(muted));
        button.innerHTML = muted
            ? '<i class="fas fa-volume-xmark"></i> <span>Silencio</span>'
            : '<i class="fas fa-volume-high"></i> <span>Sonido</span>';
        if (masterGain && audioContext) {
            masterGain.gain.setTargetAtTime(muted ? 0 : 0.1, audioContext.currentTime, 0.02);
        }
    }

    function toggleMute() {
        muted = !muted;
        writeStored(MUTE_KEY, muted);
        updateMuteButton();
        if (!muted) playSound('ally');
    }

    function getEffects(state = game) {
        const effects = [];
        if (state.flightTimer > 0) effects.push({ label: 'ENERGÍA', time: Math.ceil(state.flightTimer), tone: 'orange' });
        if (state.extraJumpTimer > 0) effects.push({ label: 'PYTHON', time: Math.ceil(state.extraJumpTimer), tone: 'green' });
        if (state.checkpointActive) effects.push({ label: 'GIT', time: Math.ceil(state.checkpointTimer), tone: 'orange' });
        if (state.dockerTimer > 0) effects.push({ label: 'DOCKER', time: Math.ceil(state.dockerTimer), tone: 'blue' });
        if (state.boost > 0) effects.push({ label: 'GO', time: Math.ceil(state.boost), tone: 'blue' });
        if (state.armorTimer > 0) effects.push({ label: 'RUST', time: Math.ceil(state.armorTimer), tone: 'red' });
        return effects;
    }

    function updateEffects() {
        if (!els.effects || !game) return;
        const effects = getEffects();
        const signature = effects.map(effect => `${effect.label}-${effect.time}`).join('|');
        if (els.effects.dataset.signature === signature) return;
        els.effects.dataset.signature = signature;
        els.effects.innerHTML = effects.map(effect => `
            <span class="trompo-effect trompo-effect-${effect.tone}">${effect.label} <b>${effect.time}s</b></span>
        `).join('');
    }

    function updateHud() {
        if (!game) return;
        if (els.level) els.level.textContent = `${game.levelIndex + 1} / ${LEVELS.length}`;
        if (els.score) els.score.textContent = formatNumber(getRunScore());
        if (els.healthBar) els.healthBar.style.width = `${Math.round(game.health / game.maxHealth * 100)}%`;
        if (els.healthLabel) els.healthLabel.textContent = `${Math.round(game.health)} / ${game.maxHealth}`;
        if (els.shieldBar) els.shieldBar.style.width = `${Math.round(game.shield / game.maxShield * 100)}%`;
        if (els.shieldLabel) els.shieldLabel.textContent = `${Math.round(game.shield)} / ${game.maxShield}`;
        if (els.progressBar) els.progressBar.style.width = `${Math.round(getProgress() * 100)}%`;
        if (els.progressTrack) {
            els.progressTrack.setAttribute('aria-valuenow', String(Math.round(getProgress() * 100)));
        }
        if (els.pause) {
            const labels = {
                idle: { text: 'Jugar', icon: 'fa-play' },
                running: { text: 'Pausa', icon: 'fa-pause' },
                paused: { text: 'Continuar', icon: 'fa-play' },
                levelComplete: { text: 'Siguiente', icon: 'fa-arrow-right' },
                gameOver: { text: 'Reiniciar', icon: 'fa-rotate-left' },
                victory: { text: 'Reiniciar', icon: 'fa-rotate-left' }
            };
            const current = labels[mode] || labels.idle;
            if (els.pause.dataset.mode !== mode) {
                els.pause.dataset.mode = mode;
                const icon = els.pause.querySelector('i');
                const label = els.pause.querySelector('span');
                if (icon) icon.className = `fas ${current.icon}`;
                if (label) label.textContent = current.text;
            }
        }
        updateEffects();
    }

    function setOverlayContent(html) {
        if (!overlay) return;
        overlay.innerHTML = `<div class="trompo-overlay-card">${html}</div>`;
        overlay.hidden = false;
    }

    function hideOverlay() {
        if (overlay) {
            overlay.hidden = true;
            overlay.innerHTML = '';
        }
    }

    function showStartOverlay() {
        const bestText = best.score > 0
            ? `<p class="trompo-overlay-note">Mejor puntaje: <strong>${formatNumber(best.score)}</strong></p>`
            : '';
        setOverlayContent(`
            <span class="trompo-overlay-kicker">5 niveles · modo descanso</span>
            <h3>Monte Mamut</h3>
            <p>Acompaña a Trompo por montañas nevadas, una playa y una ciudad gótica. Salta, usa la trompa y aplasta criaturas.</p>
            <p class="trompo-relax-phrase">“No todo es estudiar o programar. También hay tiempo para jugar.”</p>
            <div class="trompo-level-list">
                ${LEVELS.map((level, index) => `
                    <button type="button" class="trompo-level-choice${index === 0 ? ' is-next' : ''}" data-trompo-action="level" data-level="${index}">
                        <b>${index + 1}</b> ${level.name}
                    </button>
                `).join('')}
            </div>
            ${bestText}
            <div class="trompo-overlay-actions">
                <button type="button" class="btn-primary" data-trompo-action="start">
                    <i class="fas fa-play"></i> Comenzar en la base
                </button>
                ${mode === 'paused' ? `<button type="button" class="btn-secondary" data-trompo-action="resume">
                    <i class="fas fa-arrow-left"></i> Volver a la pausa
                </button>` : ''}
            </div>
            <p class="trompo-overlay-note">Puedes empezar por cualquier nivel. Bebe energía para volar; el Vocho o el pingüino recuperan vida y escudo.</p>
            <p class="trompo-overlay-note">Espacio salta · X usa la trompa · ↓ o S aplasta · P pausa.</p>
        `);
    }

    function showPauseOverlay() {
        setOverlayContent(`
            <span class="trompo-overlay-kicker">La aventura puede esperar</span>
            <h3>Pausa</h3>
            <p>El nivel ${game.level.name} está detenido. Puedes continuar, reiniciar o elegir otro nivel.</p>
            <div class="trompo-overlay-actions">
                <button type="button" class="btn-primary" data-trompo-action="resume">
                    <i class="fas fa-play"></i> Continuar
                </button>
                <button type="button" class="btn-secondary" data-trompo-action="restart">
                    <i class="fas fa-rotate-left"></i> Reiniciar nivel
                </button>
                <button type="button" class="btn-secondary" data-trompo-action="levels">
                    <i class="fas fa-list"></i> Elegir nivel
                </button>
            </div>
        `);
    }

    function showLevelOverlay(completed) {
        const next = LEVELS[game.levelIndex + 1];
        setOverlayContent(`
            <span class="trompo-overlay-kicker">Nivel ${game.levelIndex + 1} de ${LEVELS.length}</span>
            <h3>${completed ? 'Nivel superado' : 'Trompo se quedó sin fuerza'}</h3>
            <p>${completed
                ? `Llegaste al final de <strong>${game.level.name}</strong>. ${next ? `Ahora toca ${next.name}.` : 'Terminaste la aventura.'}`
                : `La montaña puede esperar. Descansa un momento y vuelve a intentar <strong>${game.level.name}</strong>.`}</p>
            <div class="trompo-summary">
                <div><span>Puntos</span><strong>${formatNumber(getRunScore())}</strong></div>
                <div><span>Criaturas</span><strong>${formatNumber(game.insects)}</strong></div>
                <div><span>Vida</span><strong>${Math.round(game.health)}</strong></div>
                <div><span>Combo</span><strong>x${game.maxCombo}</strong></div>
            </div>
            <div class="trompo-overlay-actions">
                ${completed && next
                    ? `<button type="button" class="btn-primary" data-trompo-action="next">
                        <i class="fas fa-arrow-right"></i> Ir a ${next.name}
                    </button>`
                    : completed
                        ? `<button type="button" class="btn-primary" data-trompo-action="restart-game">
                            <i class="fas fa-rotate-left"></i> Jugar de nuevo
                        </button>`
                        : `<button type="button" class="btn-primary" data-trompo-action="restart">
                            <i class="fas fa-rotate-left"></i> Reintentar nivel
                        </button>`}
                ${completed && next ? `
                    <button type="button" class="btn-secondary" data-trompo-action="restart">
                        Repetir nivel
                    </button>
                ` : ''}
                <button type="button" class="btn-secondary" data-trompo-action="levels">
                    <i class="fas fa-list"></i> Elegir nivel
                </button>
            </div>
        `);
    }

    function showVictoryOverlay() {
        setOverlayContent(`
            <span class="trompo-overlay-kicker">Aventura completada</span>
            <h3>¡Trompo llegó a Ciudad Gótica!</h3>
            <p>Terminaste los cinco niveles. La montaña, el mar y la ciudad pueden esperar; tú también puedes descansar.</p>
            <p class="trompo-relax-phrase">“No todo es estudiar o programar. También hay tiempo para jugar.”</p>
            <div class="trompo-summary">
                <div><span>Puntos</span><strong>${formatNumber(getRunScore())}</strong></div>
                <div><span>Criaturas</span><strong>${formatNumber(game.insects)}</strong></div>
                <div><span>Nivel</span><strong>${LEVELS.length} / ${LEVELS.length}</strong></div>
            </div>
            <div class="trompo-overlay-actions">
                <button type="button" class="btn-primary" data-trompo-action="restart-game">
                    <i class="fas fa-rotate-left"></i> Jugar de nuevo
                </button>
                <button type="button" class="btn-secondary" data-trompo-action="levels">
                    <i class="fas fa-list"></i> Elegir nivel
                </button>
            </div>
        `);
    }

    function startLevel(index, totalScore = 0) {
        const safeIndex = clamp(index, 0, LEVELS.length - 1);
        game = makeState(safeIndex, totalScore);
        mode = 'running';
        hideOverlay();
        updateHud();
        ensureAudio();
        startLoop();
    }

    function startGame() {
        startLevel(0, 0);
    }

    function restartLevel() {
        if (!game) return;
        startLevel(game.levelIndex, game.totalScore);
    }

    function nextLevel() {
        if (!game) return;
        if (game.levelIndex >= LEVELS.length - 1) {
            startGame();
            return;
        }
        startLevel(game.levelIndex + 1, game.totalScore + game.score);
    }

    function resume() {
        if (mode !== 'paused') return;
        mode = 'running';
        hideOverlay();
        updateHud();
        lastTime = performance.now();
        startLoop();
    }

    function togglePause() {
        if (mode === 'running') {
            mode = 'paused';
            stopLoop();
            updateHud();
            showPauseOverlay();
        } else if (mode === 'paused') {
            resume();
        } else if (mode === 'idle') {
            startGame();
        } else if (mode === 'levelComplete') {
            nextLevel();
        } else if (mode === 'gameOver' || mode === 'victory') {
            restartLevel();
        }
    }

    function hide() {
        if (mode === 'running') {
            mode = 'paused';
            stopLoop();
            updateHud();
            showPauseOverlay();
        }
    }

    function show() {
        if (mode === 'idle') {
            showStartOverlay();
        } else if (mode === 'paused') {
            showPauseOverlay();
        }
    }

    function jump() {
        if (mode !== 'running') return;
        if (game.flightTimer > 0) {
            game.vy = -430;
            game.onGround = false;
            game.ducking = false;
            game.stompTimer = 0;
            playSound('jump');
            return;
        }
        if (game.onGround) {
            game.vy = -620;
            game.onGround = false;
            game.airJumps = 0;
            game.ducking = false;
            game.stompTimer = 0;
            playSound('jump');
            return;
        }
        if (game.extraJumpTimer > 0 && game.airJumps < 1) {
            game.vy = -520;
            game.airJumps += 1;
            playSound('jump');
        }
    }

    function attack() {
        if (mode !== 'running' || game.attackCooldown > 0) return;
        game.attackTimer = 0.28;
        game.attackCooldown = 0.42;
        game.ducking = false;
        playSound('trunk');
    }

    function stomp() {
        if (mode !== 'running') return;
        game.ducking = true;
        game.stompTimer = 0.3;
        if (!keyDuckHeld) {
            clearTimeout(duckReleaseTimer);
            duckReleaseTimer = setTimeout(() => {
                if (mode === 'running' && !keyDuckHeld) {
                    game.ducking = false;
                    game.stompTimer = 0;
                }
            }, 300);
        }
    }

    function applyEnergy(state = game) {
        state.flightTimer = 8;
        return state;
    }

    function applyVocho(state = game) {
        state.health = state.maxHealth;
        state.shield = state.maxShield;
        state.score += 150;
        return state;
    }

    function applyAlly(state = game, type) {
        const ally = ALLIES[type];
        if (!ally) return state;
        state.score += 40;
        if (type === 'python') state.extraJumpTimer = ally.duration;
        else if (type === 'git') {
            state.checkpointActive = true;
            state.checkpointTimer = ally.duration;
        } else if (type === 'docker') {
            state.shield = Math.min(state.maxShield, state.shield + 60);
            state.dockerTimer = ally.duration;
        } else if (type === 'go') {
            state.boost = ally.duration;
        } else if (type === 'rust') {
            state.armorTimer = ally.duration;
        }
        return state;
    }

    function applyDamageToState(state, amount) {
        let remaining = amount;
        if (state.armorTimer > 0) remaining *= 0.5;
        if (state.shield > 0) {
            const absorbed = Math.min(state.shield, remaining);
            state.shield -= absorbed;
            remaining -= absorbed;
        }
        if (remaining > 0) {
            state.health = Math.max(0, state.health - remaining);
        }
        return { state, remaining };
    }

    function damage(amount = 22) {
        if (mode !== 'running' || game.invincible > 0) return;

        if (game.checkpointActive) {
            game.checkpointActive = false;
            game.checkpointTimer = 0;
            game.invincible = 1.2;
            game.flashText = 'CHECKPOINT';
            game.flash = 0.4;
            playSound('checkpoint');
            updateHud();
            return;
        }

        const result = applyDamageToState(game, amount);
        game.invincible = 1.2;
        game.combo = 0;
        game.shake = 0.6;
        game.flashText = result.remaining > 0 ? `-${Math.round(result.remaining)}` : 'ESCUDO';
        game.flash = 0.32;
        playSound('hit');
        updateHud();
        if (game.health <= 0) gameOver();
    }

    function gameOver() {
        if (mode !== 'running') return;
        mode = 'gameOver';
        stopLoop();
        saveBest(getRunScore(), game.levelIndex);
        updateHud();
        showLevelOverlay(false);
        playSound('gameover');
    }

    function completeLevel() {
        if (mode !== 'running') return;
        const isLast = game.levelIndex >= LEVELS.length - 1;
        mode = isLast ? 'victory' : 'levelComplete';
        stopLoop();
        saveBest(getRunScore(), game.levelIndex + 1, isLast);
        updateHud();
        if (isLast) showVictoryOverlay();
        else showLevelOverlay(true);
        playSound('level');
    }

    function startLoop() {
        stopLoop();
        lastTime = performance.now();
        rafId = global.requestAnimationFrame(loop);
    }

    function stopLoop() {
        if (rafId !== null) {
            global.cancelAnimationFrame(rafId);
            rafId = null;
        }
    }

    function loop(now) {
        if (mode !== 'running') return;
        const dt = Math.min(0.05, Math.max(0, (now - lastTime) / 1000 || 0));
        lastTime = now;
        update(dt);
        draw();
        if (mode === 'running') {
            rafId = global.requestAnimationFrame(loop);
        }
    }

    function getSpeed() {
        const base = game.level.speed * (1 + 0.2 * getProgress());
        const boost = game.boost > 0 ? 1.22 : 1;
        return base * boost;
    }

    function update(dt) {
        const speed = getSpeed();
        const previousRows = game.rows;
        game.distance += speed * dt;
        game.rows = Math.floor(game.distance / ROW_PX);
        if (game.rows > previousRows) {
            game.score += (game.rows - previousRows) * 2;
        }
        game.elapsed += dt;

        if (game.rows >= game.level.rows) {
            game.rows = game.level.rows;
            completeLevel();
            return;
        }

        if (game.flightTimer > 0) game.flightTimer = Math.max(0, game.flightTimer - dt);
        if (game.invincible > 0) game.invincible = Math.max(0, game.invincible - dt);
        if (game.boost > 0) game.boost = Math.max(0, game.boost - dt);
        if (game.armorTimer > 0) game.armorTimer = Math.max(0, game.armorTimer - dt);
        if (game.extraJumpTimer > 0) game.extraJumpTimer = Math.max(0, game.extraJumpTimer - dt);
        if (game.dockerTimer > 0) game.dockerTimer = Math.max(0, game.dockerTimer - dt);
        if (game.checkpointTimer > 0) {
            game.checkpointTimer = Math.max(0, game.checkpointTimer - dt);
            if (game.checkpointTimer === 0) game.checkpointActive = false;
        }
        if (game.attackTimer > 0) game.attackTimer = Math.max(0, game.attackTimer - dt);
        if (game.attackCooldown > 0) game.attackCooldown = Math.max(0, game.attackCooldown - dt);
        if (game.stompTimer > 0) {
            game.stompTimer = Math.max(0, game.stompTimer - dt);
            if (game.stompTimer === 0 && !keyDuckHeld) game.ducking = false;
        }
        if (game.shake > 0) game.shake = Math.max(0, game.shake - dt * 2.5);
        if (game.flash > 0) {
            game.flash = Math.max(0, game.flash - dt * 2);
            if (game.flash === 0) game.flashText = '';
        }

        if (!game.onGround) {
            game.vy += (game.flightTimer > 0 ? 760 : 1650) * dt;
            game.playerY += game.vy * dt;
            if (game.playerY >= GROUND_Y) {
                game.playerY = GROUND_Y;
                game.vy = 0;
                game.onGround = true;
                game.airJumps = 0;
            }
        }

        game.spawnTimer -= dt;
        if (game.spawnTimer <= 0) {
            spawnEnemy();
            game.spawnTimer = Math.max(0.62, game.level.spawn - game.levelIndex * 0.06) + Math.random() * 0.5;
        }

        game.powerTimer -= dt;
        if (game.powerTimer <= 0) {
            spawnEnergy();
            game.powerTimer = 12 + Math.random() * 5;
        }

        if (!game.vochoSpawned && getProgress() >= 0.55) {
            game.vochoSpawned = true;
            spawnVocho();
        }

        while (game.allySpawnIndex < game.allySpawns.length && getProgress() >= game.allySpawns[game.allySpawnIndex]) {
            spawnAlly();
            game.allySpawnIndex += 1;
        }

        moveEntities(speed, dt);
        checkCollisions();
        updateSnow(dt);
        updateParticles(dt);
        pollGamepad();
        updateHud();
    }

    function moveEntities(speed, dt) {
        for (const insect of game.obstacles) {
            insect.x -= speed * (insect.speedFactor || 1) * dt;
            if (insect.variant === 'cricket') {
                insect.y = insect.baseY - Math.abs(Math.sin(game.elapsed * 5 + insect.seed)) * 22;
            } else if (insect.sea) {
                insect.y = insect.baseY + Math.sin(game.elapsed * 2.8 + insect.seed) * 8;
            } else if (insect.flying) {
                insect.y = insect.baseY + Math.sin(game.elapsed * 3.2 + insect.seed) * 18;
            }
            if (insect.x + insect.w < -40) insect.dead = true;
        }

        for (const item of game.powerups) {
            item.x -= speed * dt;
            item.y += Math.sin(game.elapsed * 4 + item.seed) * 8 * dt;
            if (item.x + item.w < -40) item.dead = true;
        }

        game.obstacles = game.obstacles.filter(insect => !insect.dead);
        game.powerups = game.powerups.filter(item => !item.dead);
    }

    function spawnEnemy() {
        if (game.level.theme === 'beach') {
            spawnSeaEnemy();
            return;
        }

        const pool = ['cockroach', 'cricket'];
        if (game.levelIndex >= 1) pool.push('mantis', 'fly');
        if (game.levelIndex >= 2) pool.push('moth', 'fly', 'cockroach');
        if (game.level.theme === 'city') pool.push('bat', 'bat', 'fly');
        const variant = pool[Math.floor(Math.random() * pool.length)];
        const insect = {
            variant,
            x: VIEW_W + 30,
            y: GROUND_Y,
            w: 38,
            h: 24,
            baseY: GROUND_Y,
            seed: Math.random() * Math.PI * 2,
            flying: false,
            hp: 1,
            speedFactor: 1,
            dead: false
        };

        if (variant === 'cockroach') {
            insect.w = 42;
            insect.h = 25;
        } else if (variant === 'cricket') {
            insect.w = 46;
            insect.h = 34;
        } else if (variant === 'mantis') {
            insect.w = 48;
            insect.h = 58;
        } else if (variant === 'fly') {
            insect.w = 48;
            insect.h = 30;
            insect.flying = true;
            insect.baseY = GROUND_Y - 98;
        } else if (variant === 'moth') {
            insect.w = 50;
            insect.h = 34;
            insect.flying = true;
            insect.baseY = GROUND_Y - 124;
        } else if (variant === 'bat') {
            insect.w = 56;
            insect.h = 34;
            insect.flying = true;
            insect.baseY = GROUND_Y - 112;
        }

        insect.y = insect.baseY - insect.h;
        game.obstacles.push(insect);
    }

    function spawnSeaEnemy() {
        const roll = Math.random();
        const variant = roll < 0.62 ? 'dolphin' : roll < 0.9 ? 'orca' : 'whale';
        const enemy = {
            variant,
            x: VIEW_W + 60,
            y: GROUND_Y,
            w: 72,
            h: 38,
            baseY: GROUND_Y - 18,
            seed: Math.random() * Math.PI * 2,
            flying: false,
            sea: true,
            hp: 1,
            speedFactor: 1,
            dead: false
        };

        if (variant === 'dolphin') {
            enemy.w = 76;
            enemy.h = 38;
            enemy.baseY = GROUND_Y - 24;
            enemy.speedFactor = 1.12;
        } else if (variant === 'orca') {
            enemy.w = 98;
            enemy.h = 50;
            enemy.baseY = GROUND_Y - 28;
            enemy.hp = 1;
            enemy.speedFactor = 0.92;
        } else if (variant === 'whale') {
            enemy.w = 150;
            enemy.h = 64;
            enemy.baseY = GROUND_Y - 30;
            enemy.hp = 1;
            enemy.speedFactor = 0.76;
        }

        enemy.y = enemy.baseY - enemy.h;
        game.obstacles.push(enemy);
    }

    function spawnEnergy() {
        game.powerups.push({
            type: 'energy',
            x: VIEW_W + 30,
            y: GROUND_Y - 86,
            w: 40,
            h: 40,
            seed: Math.random() * Math.PI * 2,
            dead: false
        });
    }

    function spawnVocho() {
        const type = game.level.theme === 'beach' ? 'penguin' : 'vocho';
        game.powerups.push({
            type,
            x: VIEW_W + 30,
            y: GROUND_Y - 76,
            w: 64,
            h: 48,
            seed: Math.random() * Math.PI * 2,
            dead: false
        });
    }

    function spawnAlly() {
        const available = Object.keys(ALLIES).filter(type => !game.alliesUsed.includes(type));
        const type = available.length
            ? available[Math.floor(Math.random() * available.length)]
            : Object.keys(ALLIES)[Math.floor(Math.random() * Object.keys(ALLIES).length)];
        game.alliesUsed.push(type);
        game.powerups.push({
            type: 'ally',
            ally: type,
            x: VIEW_W + 30,
            y: GROUND_Y - 112 - Math.random() * 20,
            w: 44,
            h: 44,
            seed: Math.random() * Math.PI * 2,
            dead: false
        });
    }

    function getPlayerRect() {
        const height = game.ducking ? 28 : 52;
        return {
            x: PLAYER_X - 28,
            y: game.playerY - height,
            w: 56,
            h: height
        };
    }

    function getTrunkHitbox() {
        return {
            x: PLAYER_X + 14,
            y: game.playerY - 102,
            w: 112,
            h: 104
        };
    }

    function overlaps(a, b) {
        return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
    }

    function checkCollisions() {
        const player = getPlayerRect();
        const trunk = game.attackTimer > 0 ? getTrunkHitbox() : null;

        for (const insect of game.obstacles) {
            if (insect.dead) continue;

            if (trunk && overlaps(trunk, insect)) {
                hitEnemy(insect, true);
                continue;
            }

            if (!overlaps(player, insect)) continue;

            if (game.flightTimer > 0) {
                hitEnemy(insect, false);
                continue;
            }

            if (game.stompTimer > 0 && !insect.flying) {
                hitEnemy(insect, false);
                continue;
            }

            insect.dead = true;
            damage(insect.variant === 'orca' || insect.variant === 'whale' ? 28 : insect.flying ? 18 : 22);
        }

        for (const item of game.powerups) {
            if (item.dead || !overlaps(player, item)) continue;
            item.dead = true;
            collectPowerup(item);
        }
    }

    function hitEnemy(enemy, fromTrunk) {
        enemy.hp = (enemy.hp || 1) - 1;
        if (enemy.hp > 0) {
            game.score += fromTrunk ? 12 : 6;
            game.shake = 0.18;
            burst(enemy.x + enemy.w / 2, enemy.y + enemy.h / 2, '#94a3b8', 6);
            playSound('trunk');
            return;
        }

        enemy.dead = true;
        game.insects += 1;
        game.combo += 1;
        game.maxCombo = Math.max(game.maxCombo, game.combo);
        game.score += (fromTrunk ? 35 : 25) * clamp(game.combo, 1, 5);
        game.shake = 0.2;
        burst(enemy.x + enemy.w / 2, enemy.y + enemy.h / 2, '#8b5a2b', 10);
        playSound(fromTrunk ? 'trunk' : 'squash');
    }

    function collectPowerup(item) {
        if (item.type === 'energy') {
            applyEnergy();
            game.flashText = 'ENERGÍA';
            game.flash = 0.55;
            playSound('energy');
        } else if (item.type === 'vocho' || item.type === 'penguin') {
            applyVocho();
            game.flashText = item.type === 'penguin' ? 'LINUX' : 'VOCHO';
            game.flash = 0.85;
            playSound('vocho');
        } else if (item.type === 'ally') {
            applyAlly(game, item.ally);
            game.flashText = ALLIES[item.ally].label;
            game.flash = 0.5;
            playSound('ally');
        }
        burst(item.x + item.w / 2, item.y + item.h / 2, item.type === 'vocho' ? '#dc2626' : '#16a34a', 14);
        updateHud();
    }

    function updateSnow(dt) {
        for (const flake of game.snow) {
            flake.y += flake.speed * dt;
            flake.x += flake.drift * dt;
            if (flake.y > VIEW_H + 5) {
                flake.y = -5;
                flake.x = Math.random() * VIEW_W;
            }
            if (flake.x < -5) flake.x = VIEW_W + 5;
            if (flake.x > VIEW_W + 5) flake.x = -5;
        }
    }

    function burst(x, y, color, count) {
        const amount = reduceMotion ? Math.ceil(count / 2) : count;
        for (let index = 0; index < amount; index += 1) {
            game.particles.push({
                x,
                y,
                vx: (Math.random() - 0.5) * 180,
                vy: -Math.random() * 160 - 20,
                life: 0.45 + Math.random() * 0.35,
                maxLife: 0.8,
                color,
                size: 3 + Math.random() * 4
            });
        }
    }

    function updateParticles(dt) {
        for (const particle of game.particles) {
            particle.x += particle.vx * dt;
            particle.y += particle.vy * dt;
            particle.vy += 420 * dt;
            particle.life -= dt;
        }
        game.particles = game.particles.filter(particle => particle.life > 0);
    }

    function pollGamepad() {
        if (typeof navigator.getGamepads !== 'function') return;
        const pads = Array.from(navigator.getGamepads()).filter(Boolean);
        const pad = pads[0];
        if (!pad) {
            if (previousGamepadButtons.length) {
                previousGamepadButtons = [];
                setGamepadStatus(false);
            }
            return;
        }

        setGamepadStatus(true);
        const pressed = Array.from(pad.buttons || []).map(button => Boolean(button && button.pressed));
        const justPressed = index => Boolean(pressed[index] && !previousGamepadButtons[index]);

        if (justPressed(0) || justPressed(12)) jump();
        if (justPressed(2) || justPressed(13)) attack();
        if (justPressed(1)) stomp();
        if (justPressed(9)) togglePause();
        previousGamepadButtons = pressed;
    }

    function setGamepadStatus(connected) {
        if (!els.gamepad) return;
        els.gamepad.hidden = !connected;
    }

    function draw() {
        if (!ctx) return;
        ctx.clearRect(0, 0, VIEW_W, VIEW_H);
        const shake = reduceMotion ? 0 : game.shake;
        const offsetX = shake > 0 ? (Math.random() - 0.5) * 10 * shake : 0;
        const offsetY = shake > 0 ? (Math.random() - 0.5) * 7 * shake : 0;

        ctx.save();
        ctx.translate(offsetX, offsetY);
        drawBackground();
        drawGround();
        drawPowerups();
        drawInsects();
        drawMammoth();
        drawParticles();
        drawFlash();
        ctx.restore();
    }

    function drawBackground() {
        if (game.level.theme === 'beach') {
            drawBeachBackground();
            return;
        }
        if (game.level.theme === 'city') {
            drawCityBackground();
            return;
        }

        ctx.fillStyle = '#cfe8f5';
        ctx.fillRect(0, 0, VIEW_W, VIEW_H);

        drawMountainLayer(0.04, '#a9c3d6', '#f8fafc', GROUND_Y - 60, 165, 270);
        drawMountainLayer(0.08, '#7e9fb6', '#eef6fb', GROUND_Y - 20, 125, 205);
        drawPineLayer(0.16, '#2f5d50', '#f8fafc', GROUND_Y - 8, 86, 120);

        for (const flake of game.snow) {
            ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
            ctx.beginPath();
            ctx.arc(flake.x, flake.y, flake.size, 0, Math.PI * 2);
            ctx.fill();
        }

        ctx.save();
        ctx.globalAlpha = 0.9;
        ctx.fillStyle = 'rgba(255, 255, 255, 0.55)';
        ctx.beginPath();
        ctx.arc(860, 68, 30, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();

        ctx.save();
        ctx.globalAlpha = 0.18;
        ctx.fillStyle = game.level.accent;
        ctx.font = '800 42px "Segoe UI", Arial, sans-serif';
        ctx.textAlign = 'right';
        ctx.fillText(game.level.name.toUpperCase(), VIEW_W - 24, 66);
        ctx.font = '600 11px "Segoe UI", Arial, sans-serif';
        ctx.fillText('MONTE MAMUT', VIEW_W - 24, 84);
        ctx.restore();
    }

    function drawCityBackground() {
        ctx.fillStyle = '#0f172a';
        ctx.fillRect(0, 0, VIEW_W, VIEW_H);
        ctx.fillStyle = '#f8fafc';
        ctx.beginPath();
        ctx.arc(850, 68, 30, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
        for (let index = 0; index < 50; index += 1) {
            const x = (index * 191 + 37) % VIEW_W;
            const y = (index * 83 + 19) % 190;
            ctx.beginPath();
            ctx.arc(x, y, 1 + (index % 2), 0, Math.PI * 2);
            ctx.fill();
        }

        drawBuildingLayer(0.04, '#1e293b', '#facc15', GROUND_Y - 15, 150, 155);
        drawBuildingLayer(0.09, '#273449', '#93c5fd', GROUND_Y - 5, 110, 120);

        ctx.save();
        ctx.globalAlpha = 0.13;
        ctx.fillStyle = '#e0f2fe';
        ctx.beginPath();
        ctx.moveTo(730, 0);
        ctx.lineTo(930, 0);
        ctx.lineTo(760, 230);
        ctx.closePath();
        ctx.fill();
        ctx.beginPath();
        ctx.moveTo(160, 0);
        ctx.lineTo(260, 0);
        ctx.lineTo(390, 230);
        ctx.closePath();
        ctx.fill();
        ctx.restore();

        ctx.strokeStyle = 'rgba(148, 163, 184, 0.6)';
        ctx.lineWidth = 1.5;
        for (const flake of game.snow) {
            const x = flake.x - 4;
            const y = (flake.y * 1.2) % VIEW_H;
            ctx.beginPath();
            ctx.moveTo(x, y);
            ctx.lineTo(x - 3, y + 11);
            ctx.stroke();
        }

        ctx.save();
        ctx.globalAlpha = 0.2;
        ctx.fillStyle = game.level.accent;
        ctx.font = '800 42px "Segoe UI", Arial, sans-serif';
        ctx.textAlign = 'right';
        ctx.fillText('CIUDAD GÓTICA', VIEW_W - 24, 66);
        ctx.font = '600 11px "Segoe UI", Arial, sans-serif';
        ctx.fillText('MONTE MAMUT', VIEW_W - 24, 84);
        ctx.restore();
    }

    function drawBuildingLayer(parallax, color, windowColor, baseY, height, spacing) {
        const offset = -(game.distance * parallax) % spacing;
        for (let x = offset - spacing; x < VIEW_W + spacing; x += spacing) {
            const buildingHeight = height * (0.55 + ((Math.floor((x + 1000) / spacing) * 37) % 10) / 18);
            ctx.fillStyle = color;
            ctx.strokeStyle = '#020617';
            ctx.lineWidth = 2;
            ctx.fillRect(x + 8, baseY - buildingHeight, spacing - 18, buildingHeight);
            ctx.strokeRect(x + 8, baseY - buildingHeight, spacing - 18, buildingHeight);
            ctx.fillStyle = windowColor;
            const rows = Math.max(2, Math.floor(buildingHeight / 24));
            for (let row = 0; row < rows; row += 1) {
                for (let column = 0; column < 3; column += 1) {
                    if ((row + column + Math.floor(x)) % 4 === 0) continue;
                    ctx.fillRect(x + 17 + column * 30, baseY - buildingHeight + 14 + row * 22, 10, 8);
                }
            }
        }
    }

    function drawBeachBackground() {
        ctx.fillStyle = '#bfe9ff';
        ctx.fillRect(0, 0, VIEW_W, VIEW_H);

        ctx.fillStyle = '#fde68a';
        ctx.beginPath();
        ctx.arc(850, 72, 34, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = 'rgba(255, 255, 255, 0.75)';
        ctx.beginPath();
        ctx.ellipse(760, 86, 54, 15, 0, 0, Math.PI * 2);
        ctx.ellipse(815, 80, 37, 12, 0, 0, Math.PI * 2);
        ctx.ellipse(185, 74, 42, 12, 0, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#7dd3fc';
        ctx.fillRect(0, 165, VIEW_W, GROUND_Y - 165);
        ctx.fillStyle = '#38bdf8';
        ctx.fillRect(0, 190, VIEW_W, GROUND_Y - 190);

        const islandOffset = -(game.distance * 0.05) % 420;
        ctx.fillStyle = '#fcd34d';
        ctx.beginPath();
        ctx.ellipse(islandOffset + 250, 188, 95, 13, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#0f766e';
        ctx.fillRect(islandOffset + 238, 148, 6, 42);
        ctx.beginPath();
        ctx.ellipse(islandOffset + 241, 145, 28, 8, -0.2, 0, Math.PI * 2);
        ctx.ellipse(islandOffset + 229, 151, 22, 7, 0.3, 0, Math.PI * 2);
        ctx.fill();

        ctx.strokeStyle = 'rgba(255, 255, 255, 0.8)';
        ctx.lineWidth = 3;
        const waveOffset = -(game.distance * 0.25) % 120;
        for (let x = waveOffset - 120; x < VIEW_W + 120; x += 120) {
            ctx.beginPath();
            ctx.arc(x + 30, 225, 34, 0.15, Math.PI - 0.15);
            ctx.stroke();
            ctx.beginPath();
            ctx.arc(x + 92, 252, 42, 0.1, Math.PI - 0.1);
            ctx.stroke();
        }

        ctx.strokeStyle = '#334155';
        ctx.lineWidth = 2;
        for (let x = 80; x < VIEW_W; x += 260) {
            ctx.beginPath();
            ctx.moveTo(x, 78);
            ctx.quadraticCurveTo(x + 7, 70, x + 14, 78);
            ctx.stroke();
        }

        for (const flake of game.snow) {
            ctx.fillStyle = 'rgba(255, 255, 255, 0.75)';
            ctx.beginPath();
            ctx.arc(flake.x, flake.y * 0.8 + 100, flake.size * 0.8, 0, Math.PI * 2);
            ctx.fill();
        }

        ctx.save();
        ctx.globalAlpha = 0.2;
        ctx.fillStyle = game.level.accent;
        ctx.font = '800 42px "Segoe UI", Arial, sans-serif';
        ctx.textAlign = 'right';
        ctx.fillText('PLAYA', VIEW_W - 24, 66);
        ctx.font = '600 11px "Segoe UI", Arial, sans-serif';
        ctx.fillText('MONTE MAMUT', VIEW_W - 24, 84);
        ctx.restore();
    }

    function drawMountainLayer(parallax, color, snowColor, baseY, height, spacing) {
        const offset = -(game.distance * parallax) % spacing;
        ctx.lineWidth = 2;
        ctx.strokeStyle = '#5d7486';
        for (let x = offset - spacing; x < VIEW_W + spacing; x += spacing) {
            ctx.fillStyle = color;
            ctx.beginPath();
            ctx.moveTo(x, baseY);
            ctx.lineTo(x + spacing * 0.5, baseY - height);
            ctx.lineTo(x + spacing, baseY);
            ctx.closePath();
            ctx.fill();
            ctx.stroke();

            ctx.fillStyle = snowColor;
            ctx.beginPath();
            ctx.moveTo(x + spacing * 0.5, baseY - height);
            ctx.lineTo(x + spacing * 0.38, baseY - height * 0.7);
            ctx.lineTo(x + spacing * 0.46, baseY - height * 0.78);
            ctx.lineTo(x + spacing * 0.54, baseY - height * 0.66);
            ctx.lineTo(x + spacing * 0.62, baseY - height * 0.7);
            ctx.closePath();
            ctx.fill();
        }
    }

    function drawPineLayer(parallax, color, snowColor, baseY, height, spacing) {
        const offset = -(game.distance * parallax) % spacing;
        for (let x = offset - spacing; x < VIEW_W + spacing; x += spacing) {
            const y = baseY - height;
            ctx.fillStyle = color;
            ctx.strokeStyle = '#1f3a33';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(x + spacing * 0.5, y);
            ctx.lineTo(x + spacing * 0.78, baseY);
            ctx.lineTo(x + 2, baseY);
            ctx.closePath();
            ctx.fill();
            ctx.stroke();

            ctx.fillStyle = snowColor;
            ctx.beginPath();
            ctx.moveTo(x + spacing * 0.5, y);
            ctx.lineTo(x + spacing * 0.58, y + height * 0.28);
            ctx.lineTo(x + spacing * 0.42, y + height * 0.28);
            ctx.closePath();
            ctx.fill();
        }
    }

    function drawGround() {
        if (game.level.theme === 'beach') {
            drawBeachGround();
            return;
        }
        if (game.level.theme === 'city') {
            drawCityGround();
            return;
        }

        ctx.fillStyle = '#eaf4fb';
        ctx.fillRect(0, GROUND_Y, VIEW_W, VIEW_H - GROUND_Y);
        ctx.fillStyle = '#c7dbe8';
        ctx.fillRect(0, GROUND_Y, VIEW_W, 4);
        ctx.strokeStyle = '#9fb8c9';
        ctx.lineWidth = 2;
        const offset = -(game.distance * 0.8) % 74;
        for (let x = offset; x < VIEW_W + 74; x += 74) {
            ctx.beginPath();
            ctx.moveTo(x, GROUND_Y + 8);
            ctx.lineTo(x - 18, VIEW_H);
            ctx.stroke();
        }
        ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
        for (let x = 50; x < VIEW_W; x += 160) {
            ctx.beginPath();
            ctx.ellipse(x, GROUND_Y + 18, 35, 7, 0, 0, Math.PI * 2);
            ctx.fill();
        }
    }

    function drawBeachGround() {
        ctx.fillStyle = '#0284c7';
        ctx.fillRect(0, GROUND_Y, VIEW_W, VIEW_H - GROUND_Y);
        ctx.fillStyle = '#38bdf8';
        ctx.fillRect(0, GROUND_Y, VIEW_W, 7);
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.8)';
        ctx.lineWidth = 3;
        const offset = -(game.distance * 1.1) % 90;
        for (let x = offset; x < VIEW_W + 90; x += 90) {
            ctx.beginPath();
            ctx.arc(x, GROUND_Y + 12, 38, 0.1, Math.PI - 0.1);
            ctx.stroke();
        }
        ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
        for (let x = 28; x < VIEW_W; x += 150) {
            ctx.beginPath();
            ctx.ellipse(x, GROUND_Y + 22, 31, 5, 0, 0, Math.PI * 2);
            ctx.fill();
        }
    }

    function drawCityGround() {
        ctx.fillStyle = '#1e293b';
        ctx.fillRect(0, GROUND_Y, VIEW_W, VIEW_H - GROUND_Y);
        ctx.fillStyle = '#334155';
        ctx.fillRect(0, GROUND_Y, VIEW_W, 5);
        ctx.fillStyle = '#facc15';
        const offset = -(game.distance * 0.9) % 130;
        for (let x = offset; x < VIEW_W + 130; x += 130) {
            ctx.fillRect(x, GROUND_Y + 38, 58, 4);
        }
        ctx.fillStyle = 'rgba(148, 163, 184, 0.35)';
        for (let x = 40; x < VIEW_W; x += 190) {
            ctx.beginPath();
            ctx.ellipse(x, GROUND_Y + 14, 30, 3, 0, 0, Math.PI * 2);
            ctx.fill();
        }
    }

    function drawPowerups() {
        for (const item of game.powerups) {
            if (item.dead) continue;
            const float = Math.sin(game.elapsed * 5 + item.seed) * 5;
            if (item.type === 'energy') drawEnergy(item, float);
            else if (item.type === 'vocho') drawVocho(item, float);
            else if (item.type === 'penguin') drawPenguin(item, float);
            else if (item.type === 'ally') drawAlly(item, float);
        }
    }

    function drawEnergy(item, float) {
        ctx.save();
        ctx.translate(item.x, item.y + float);
        ctx.fillStyle = '#e2e8f0';
        ctx.strokeStyle = '#475569';
        ctx.lineWidth = 2;
        roundedRect(8, 2, 24, 36, 5);
        ctx.fill();
        ctx.stroke();
        ctx.fillStyle = '#1d4ed8';
        roundedRect(8, 9, 24, 12, 2);
        ctx.fill();
        ctx.fillStyle = '#f8fafc';
        roundedRect(10, 3, 20, 5, 2);
        ctx.fill();
        ctx.fillStyle = '#facc15';
        ctx.beginPath();
        ctx.moveTo(20, 10);
        ctx.lineTo(14, 21);
        ctx.lineTo(20, 20);
        ctx.lineTo(17, 30);
        ctx.lineTo(27, 17);
        ctx.lineTo(21, 18);
        ctx.closePath();
        ctx.fill();
        ctx.fillStyle = '#fff';
        ctx.font = '800 6px "Segoe UI", Arial, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('ENERGÍA', 20, 47);
        ctx.restore();
    }

    function drawVocho(item, float) {
        ctx.save();
        ctx.translate(item.x, item.y + float);
        ctx.fillStyle = '#dc2626';
        ctx.strokeStyle = '#7f1d1d';
        ctx.lineWidth = 2;
        roundedRect(4, 12, 56, 25, 12);
        ctx.fill();
        ctx.stroke();
        ctx.fillStyle = '#fca5a5';
        roundedRect(14, 4, 36, 18, 9);
        ctx.fill();
        ctx.stroke();
        ctx.fillStyle = '#bae6fd';
        roundedRect(18, 7, 12, 9, 3);
        ctx.fill();
        roundedRect(34, 7, 12, 9, 3);
        ctx.fill();
        ctx.fillStyle = '#fef08a';
        ctx.beginPath();
        ctx.arc(8, 24, 4, 0, Math.PI * 2);
        ctx.arc(56, 24, 4, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#1e293b';
        ctx.beginPath();
        ctx.arc(16, 39, 6, 0, Math.PI * 2);
        ctx.arc(48, 39, 6, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#fff';
        ctx.font = '800 7px "Segoe UI", Arial, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('VOCHO', 32, 58);
        ctx.restore();
    }

    function drawPenguin(item, float) {
        ctx.save();
        ctx.translate(item.x, item.y + float);
        ctx.fillStyle = '#0f172a';
        ctx.strokeStyle = '#020617';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.ellipse(32, 28, 22, 26, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
        ctx.fillStyle = '#f8fafc';
        ctx.beginPath();
        ctx.ellipse(32, 31, 13, 18, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#f97316';
        ctx.beginPath();
        ctx.moveTo(28, 18);
        ctx.lineTo(36, 18);
        ctx.lineTo(32, 25);
        ctx.closePath();
        ctx.fill();
        ctx.beginPath();
        ctx.ellipse(22, 51, 8, 4, 0, 0, Math.PI * 2);
        ctx.ellipse(42, 51, 8, 4, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#f8fafc';
        ctx.beginPath();
        ctx.arc(26, 16, 3, 0, Math.PI * 2);
        ctx.arc(38, 16, 3, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#0f172a';
        ctx.beginPath();
        ctx.arc(27, 16, 1.2, 0, Math.PI * 2);
        ctx.arc(37, 16, 1.2, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#fff';
        ctx.font = '800 7px "Segoe UI", Arial, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('LINUX', 32, 62);
        ctx.restore();
    }

    function drawAlly(item, float) {
        const ally = ALLIES[item.ally];
        ctx.save();
        ctx.translate(item.x, item.y + float);
        ctx.shadowColor = ally.color;
        ctx.shadowBlur = 14;
        ctx.fillStyle = ally.color;
        roundedRect(0, 0, item.w, item.h, 10);
        ctx.fill();
        ctx.shadowBlur = 0;
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 2;
        roundedRect(3, 3, item.w - 6, item.h - 6, 7);
        ctx.stroke();
        drawAllyIcon(item.ally, item.w / 2, 17);
        ctx.fillStyle = '#fff';
        ctx.font = '800 7px "Segoe UI", Arial, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(ally.label, item.w / 2, 37);
        ctx.restore();
    }

    function drawAllyIcon(type, x, y) {
        ctx.save();
        ctx.translate(x, y);
        ctx.strokeStyle = '#fff';
        ctx.fillStyle = '#fff';
        ctx.lineWidth = 2;
        if (type === 'python') {
            ctx.beginPath();
            ctx.moveTo(-10, 7);
            ctx.quadraticCurveTo(-2, -8, 7, 2);
            ctx.quadraticCurveTo(12, 8, 13, 0);
            ctx.stroke();
            ctx.beginPath();
            ctx.arc(13, -1, 3, 0, Math.PI * 2);
            ctx.fill();
        } else if (type === 'git') {
            ctx.beginPath();
            ctx.arc(0, 1, 9, 0, Math.PI * 2);
            ctx.fill();
            ctx.beginPath();
            ctx.moveTo(-8, -4);
            ctx.lineTo(-10, -12);
            ctx.lineTo(-3, -7);
            ctx.moveTo(8, -4);
            ctx.lineTo(10, -12);
            ctx.lineTo(3, -7);
            ctx.fill();
            ctx.fillStyle = '#ea580c';
            ctx.beginPath();
            ctx.arc(-3, 0, 1.5, 0, Math.PI * 2);
            ctx.arc(3, 0, 1.5, 0, Math.PI * 2);
            ctx.fill();
        } else if (type === 'docker') {
            ctx.beginPath();
            ctx.ellipse(0, 2, 12, 7, 0, 0, Math.PI * 2);
            ctx.fill();
            ctx.beginPath();
            ctx.moveTo(10, 0);
            ctx.lineTo(18, -6);
            ctx.lineTo(16, 7);
            ctx.closePath();
            ctx.fill();
            ctx.fillStyle = '#0284c7';
            ctx.beginPath();
            ctx.arc(-5, -2, 1.5, 0, Math.PI * 2);
            ctx.fill();
        } else if (type === 'go') {
            ctx.beginPath();
            ctx.arc(0, 1, 9, 0, Math.PI * 2);
            ctx.fill();
            ctx.beginPath();
            ctx.arc(-4, -13, 2, 0, Math.PI * 2);
            ctx.arc(4, -13, 2, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = '#0ea5e9';
            ctx.beginPath();
            ctx.arc(-3, 0, 1.4, 0, Math.PI * 2);
            ctx.arc(3, 0, 1.4, 0, Math.PI * 2);
            ctx.fill();
        } else if (type === 'rust') {
            ctx.beginPath();
            ctx.ellipse(0, 1, 10, 8, 0, 0, Math.PI * 2);
            ctx.fill();
            ctx.beginPath();
            ctx.moveTo(-9, -3);
            ctx.lineTo(-17, -8);
            ctx.lineTo(-12, 1);
            ctx.moveTo(9, -3);
            ctx.lineTo(17, -8);
            ctx.lineTo(12, 1);
            ctx.fill();
            ctx.fillStyle = '#dc2626';
            ctx.beginPath();
            ctx.arc(-3, 0, 1.4, 0, Math.PI * 2);
            ctx.arc(3, 0, 1.4, 0, Math.PI * 2);
            ctx.fill();
        }
        ctx.restore();
    }

    function drawInsects() {
        for (const insect of game.obstacles) {
            if (insect.dead) continue;
            if (insect.variant === 'cockroach') drawCockroach(insect);
            else if (insect.variant === 'cricket') drawCricket(insect);
            else if (insect.variant === 'mantis') drawMantis(insect);
            else if (insect.variant === 'fly') drawFly(insect);
            else if (insect.variant === 'moth') drawMoth(insect);
            else if (insect.variant === 'bat') drawBat(insect);
            else if (insect.variant === 'dolphin') drawDolphin(insect);
            else if (insect.variant === 'orca') drawOrca(insect);
            else if (insect.variant === 'whale') drawWhale(insect);
        }
    }

function drawCockroach(insect) {
        const x = insect.x;
        const y = insect.y;
        ctx.save();
        ctx.strokeStyle = '#3f2412';
        ctx.lineWidth = 2;
        for (let index = 0; index < 3; index += 1) {
            const legY = y + 10 + index * 5;
            ctx.beginPath();
            ctx.moveTo(x + 17, legY);
            ctx.lineTo(x + 8, legY + 8);
            ctx.lineTo(x + 2, legY + 4);
            ctx.moveTo(x + 25, legY);
            ctx.lineTo(x + 35, legY + 8);
            ctx.lineTo(x + 41, legY + 4);
            ctx.stroke();
        }
        ctx.strokeStyle = '#2f1a0b';
        ctx.beginPath();
        ctx.moveTo(x + 9, y + 7);
        ctx.quadraticCurveTo(x - 2, y - 4, x - 7, y + 3);
        ctx.moveTo(x + 13, y + 5);
        ctx.quadraticCurveTo(x + 4, y - 8, x - 2, y - 3);
        ctx.stroke();
        ctx.fillStyle = '#9a6234';
        ctx.strokeStyle = '#4a2c12';
        ctx.beginPath();
        ctx.ellipse(x + 23, y + 14, 16, 9, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
        ctx.fillStyle = '#6b3f1d';
        ctx.beginPath();
        ctx.ellipse(x + 12, y + 12, 7, 7, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
        ctx.fillStyle = '#4a2c12';
        ctx.beginPath();
        ctx.arc(x + 7, y + 11, 5, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
        ctx.strokeStyle = '#d6a46a';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(x + 13, y + 7);
        ctx.lineTo(x + 33, y + 12);
        ctx.stroke();
        ctx.fillStyle = '#fef3c7';
        ctx.beginPath();
        ctx.arc(x + 5, y + 9, 1.4, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
    }
function drawCricket(insect) {
        const x = insect.x;
        const y = insect.y;
        ctx.save();
        ctx.strokeStyle = '#365314';
        ctx.lineWidth = 2;
        ctx.fillStyle = '#65a30d';
        ctx.beginPath();
        ctx.ellipse(x + 24, y + 18, 15, 9, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
        ctx.fillStyle = '#4d7c0f';
        ctx.beginPath();
        ctx.ellipse(x + 13, y + 16, 8, 8, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
        ctx.fillStyle = '#3f6212';
        ctx.beginPath();
        ctx.arc(x + 6, y + 14, 6, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
        ctx.strokeStyle = '#365314';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(x + 20, y + 23);
        ctx.lineTo(x + 8, y + 34);
        ctx.lineTo(x + 3, y + 29);
        ctx.moveTo(x + 32, y + 22);
        ctx.lineTo(x + 44, y + 32);
        ctx.lineTo(x + 40, y + 37);
        ctx.stroke();
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(x + 4, y + 10);
        ctx.quadraticCurveTo(x - 6, y - 2, x - 12, y + 5);
        ctx.moveTo(x + 8, y + 8);
        ctx.quadraticCurveTo(x + 2, y - 5, x - 5, y - 2);
        ctx.stroke();
        ctx.strokeStyle = '#a3e635';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(x + 10, y + 12);
        ctx.lineTo(x + 31, y + 18);
        ctx.stroke();
        ctx.fillStyle = '#f8fafc';
        ctx.beginPath();
        ctx.arc(x + 5, y + 12, 1.6, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
    }
function drawMantis(insect) {
        const x = insect.x;
        const y = insect.y;
        ctx.save();
        ctx.strokeStyle = '#14532d';
        ctx.lineWidth = 2;
        ctx.fillStyle = '#22c55e';
        ctx.beginPath();
        ctx.ellipse(x + 24, y + 34, 10, 23, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
        ctx.fillStyle = '#15803d';
        ctx.beginPath();
        ctx.moveTo(x + 24, y + 8);
        ctx.lineTo(x + 34, y + 16);
        ctx.lineTo(x + 24, y + 22);
        ctx.lineTo(x + 14, y + 16);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        ctx.strokeStyle = '#166534';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(x + 15, y + 25);
        ctx.lineTo(x + 4, y + 12);
        ctx.lineTo(x + 12, y + 2);
        ctx.moveTo(x + 33, y + 25);
        ctx.lineTo(x + 44, y + 12);
        ctx.lineTo(x + 36, y + 2);
        ctx.stroke();
        ctx.lineWidth = 1.5;
        for (let index = 0; index < 3; index += 1) {
            ctx.beginPath();
            ctx.moveTo(x + 8 + index * 3, y + 10 - index * 2);
            ctx.lineTo(x + 4 + index * 3, y + 6 - index * 2);
            ctx.stroke();
            ctx.beginPath();
            ctx.moveTo(x + 40 - index * 3, y + 10 - index * 2);
            ctx.lineTo(x + 44 - index * 3, y + 6 - index * 2);
            ctx.stroke();
        }
        ctx.strokeStyle = '#15803d';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(x + 18, y + 10);
        ctx.quadraticCurveTo(x + 10, y - 4, x + 4, y + 2);
        ctx.moveTo(x + 30, y + 10);
        ctx.quadraticCurveTo(x + 38, y - 4, x + 44, y + 2);
        ctx.stroke();
        ctx.fillStyle = '#f8fafc';
        ctx.beginPath();
        ctx.arc(x + 20, y + 14, 2.4, 0, Math.PI * 2);
        ctx.arc(x + 28, y + 14, 2.4, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#052e16';
        ctx.beginPath();
        ctx.arc(x + 21, y + 14, 1, 0, Math.PI * 2);
        ctx.arc(x + 29, y + 14, 1, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
    }
function drawFly(insect) {
        const x = insect.x;
        const y = insect.y;
        ctx.save();
        ctx.strokeStyle = '#334155';
        ctx.lineWidth = 2;
        for (let index = 0; index < 3; index += 1) {
            ctx.beginPath();
            ctx.moveTo(x + 20, y + 17 + index * 4);
            ctx.lineTo(x + 10, y + 25 + index * 4);
            ctx.moveTo(x + 30, y + 17 + index * 4);
            ctx.lineTo(x + 40, y + 25 + index * 4);
            ctx.stroke();
        }
        ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
        ctx.beginPath();
        ctx.ellipse(x + 14, y + 9, 14, 7, -0.4, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
        ctx.beginPath();
        ctx.ellipse(x + 34, y + 9, 14, 7, 0.4, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
        ctx.fillStyle = '#334155';
        ctx.beginPath();
        ctx.ellipse(x + 24, y + 17, 10, 8, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
        ctx.fillStyle = '#0f172a';
        ctx.beginPath();
        ctx.ellipse(x + 16, y + 14, 6, 5, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#ef4444';
        ctx.beginPath();
        ctx.arc(x + 14, y + 12, 2.5, 0, Math.PI * 2);
        ctx.arc(x + 19, y + 12, 2.5, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
    }
function drawMoth(insect) {
        const x = insect.x;
        const y = insect.y;
        ctx.save();
        ctx.fillStyle = '#fef3c7';
        ctx.strokeStyle = '#a16207';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.ellipse(x + 14, y + 13, 15, 11, -0.3, 0, Math.PI * 2);
        ctx.ellipse(x + 34, y + 13, 15, 11, 0.3, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
        ctx.fillStyle = '#f59e0b';
        ctx.beginPath();
        ctx.arc(x + 14, y + 13, 3, 0, Math.PI * 2);
        ctx.arc(x + 34, y + 13, 3, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#92400e';
        ctx.beginPath();
        ctx.ellipse(x + 24, y + 19, 5, 10, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#78350f';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(x + 21, y + 10);
        ctx.quadraticCurveTo(x + 12, y - 2, x + 8, y + 3);
        ctx.moveTo(x + 27, y + 10);
        ctx.quadraticCurveTo(x + 36, y - 2, x + 40, y + 3);
        ctx.stroke();
        ctx.fillStyle = '#fff';
        ctx.beginPath();
        ctx.arc(x + 22, y + 14, 1.5, 0, Math.PI * 2);
        ctx.arc(x + 26, y + 14, 1.5, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
    }
    function drawBat(enemy) {
        const x = enemy.x;
        const y = enemy.y;
        const flap = Math.sin(game.elapsed * 12 + enemy.seed) * 8;
        ctx.save();
        ctx.fillStyle = '#0f172a';
        ctx.strokeStyle = '#020617';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(x + 28, y + 17);
        ctx.quadraticCurveTo(x + 8, y - 4 + flap, x - 2, y + 16);
        ctx.quadraticCurveTo(x + 12, y + 14, x + 20, y + 23);
        ctx.quadraticCurveTo(x + 8, y + 27 + flap, x + 2, y + 31);
        ctx.quadraticCurveTo(x + 18, y + 31, x + 28, y + 23);
        ctx.quadraticCurveTo(x + 38, y + 31, x + 54, y + 31);
        ctx.quadraticCurveTo(x + 48, y + 25 + flap, x + 36, y + 23);
        ctx.quadraticCurveTo(x + 44, y + 14, x + 58, y + 16);
        ctx.quadraticCurveTo(x + 48, y - 4 + flap, x + 28, y + 17);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        ctx.fillStyle = '#1e293b';
        ctx.beginPath();
        ctx.ellipse(x + 28, y + 20, 8, 11, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
        ctx.fillStyle = '#ef4444';
        ctx.beginPath();
        ctx.arc(x + 25, y + 17, 2, 0, Math.PI * 2);
        ctx.arc(x + 31, y + 17, 2, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#f8fafc';
        ctx.beginPath();
        ctx.moveTo(x + 24, y + 24);
        ctx.lineTo(x + 27, y + 28);
        ctx.lineTo(x + 30, y + 24);
        ctx.closePath();
        ctx.fill();
        ctx.restore();
    }

    function drawDolphin(enemy) {
        const x = enemy.x;
        const y = enemy.y;
        ctx.save();
        ctx.fillStyle = '#94a3b8';
        ctx.strokeStyle = '#475569';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.ellipse(x + 36, y + 20, 27, 13, -0.08, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
        ctx.fillStyle = '#e2e8f0';
        ctx.beginPath();
        ctx.ellipse(x + 37, y + 25, 20, 6, -0.05, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#94a3b8';
        ctx.beginPath();
        ctx.moveTo(x + 35, y + 7);
        ctx.lineTo(x + 41, y - 5);
        ctx.lineTo(x + 48, y + 8);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(x + 10, y + 17);
        ctx.lineTo(x - 2, y + 7);
        ctx.lineTo(x + 2, y + 25);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        ctx.fillStyle = '#94a3b8';
        ctx.beginPath();
        ctx.moveTo(x + 62, y + 16);
        ctx.lineTo(x + 75, y + 20);
        ctx.lineTo(x + 63, y + 24);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        ctx.fillStyle = '#0f172a';
        ctx.beginPath();
        ctx.arc(x + 54, y + 15, 2.2, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#e0f2fe';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(x + 34, y + 27, 17, 0.4, Math.PI - 0.4);
        ctx.stroke();
        drawEnemyHp(enemy, x + enemy.w / 2, y - 12);
        ctx.restore();
    }

    function drawOrca(enemy) {
        const x = enemy.x;
        const y = enemy.y;
        ctx.save();
        ctx.fillStyle = '#0f172a';
        ctx.strokeStyle = '#020617';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.ellipse(x + 47, y + 27, 37, 18, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
        ctx.fillStyle = '#f8fafc';
        ctx.beginPath();
        ctx.ellipse(x + 48, y + 36, 28, 8, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#0f172a';
        ctx.beginPath();
        ctx.moveTo(x + 46, y + 8);
        ctx.lineTo(x + 53, y - 10);
        ctx.lineTo(x + 62, y + 10);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(x + 13, y + 23);
        ctx.lineTo(x - 3, y + 9);
        ctx.lineTo(x + 4, y + 34);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        ctx.fillStyle = '#f8fafc';
        ctx.beginPath();
        ctx.ellipse(x + 75, y + 18, 7, 5, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#0f172a';
        ctx.beginPath();
        ctx.arc(x + 77, y + 18, 2, 0, Math.PI * 2);
        ctx.fill();
        drawEnemyHp(enemy, x + enemy.w / 2, y - 14);
        ctx.restore();
    }

    function drawWhale(enemy) {
        const x = enemy.x;
        const y = enemy.y;
        ctx.save();
        ctx.fillStyle = '#3b82f6';
        ctx.strokeStyle = '#1e3a8a';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.ellipse(x + 72, y + 34, 62, 26, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
        ctx.fillStyle = '#bfdbfe';
        ctx.beginPath();
        ctx.ellipse(x + 72, y + 46, 48, 11, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#3b82f6';
        ctx.beginPath();
        ctx.moveTo(x + 20, y + 29);
        ctx.lineTo(x - 12, y + 10);
        ctx.lineTo(x + 2, y + 48);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        ctx.fillStyle = '#93c5fd';
        ctx.beginPath();
        ctx.moveTo(x + 63, y + 13);
        ctx.quadraticCurveTo(x + 67, y - 8, x + 73, y + 11);
        ctx.quadraticCurveTo(x + 69, y - 2, x + 63, y + 13);
        ctx.fill();
        ctx.strokeStyle = '#93c5fd';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(x + 68, y + 12);
        ctx.lineTo(x + 68, y - 6);
        ctx.stroke();
        ctx.fillStyle = '#0f172a';
        ctx.beginPath();
        ctx.arc(x + 113, y + 34, 3, 0, Math.PI * 2);
        ctx.fill();
        drawEnemyHp(enemy, x + enemy.w / 2, y - 16);
        ctx.restore();
    }

    function drawEnemyHp(enemy, x, y) {
        if (!enemy.hp || enemy.hp <= 1) return;
        for (let index = 0; index < enemy.hp; index += 1) {
            ctx.fillStyle = '#ef4444';
            ctx.beginPath();
            ctx.arc(x - (enemy.hp - 1) * 5 + index * 10, y, 3, 0, Math.PI * 2);
            ctx.fill();
        }
    }

    function drawSurfboard(feet) {
        ctx.save();
        ctx.translate(PLAYER_X, feet + 2);
        ctx.rotate(reduceMotion ? 0 : Math.sin(game.elapsed * 4) * 0.035);
        ctx.fillStyle = '#f59e0b';
        ctx.strokeStyle = '#92400e';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.ellipse(0, 0, 55, 7, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
        ctx.strokeStyle = '#fef3c7';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(-38, 0);
        ctx.lineTo(38, 0);
        ctx.stroke();
        ctx.fillStyle = 'rgba(255, 255, 255, 0.75)';
        ctx.beginPath();
        ctx.ellipse(-48, 3, 11, 4, -0.2, 0, Math.PI * 2);
        ctx.ellipse(48, 3, 11, 4, 0.2, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
    }

    function drawSkateboard(feet) {
        ctx.save();
        ctx.translate(PLAYER_X, feet + 3);
        ctx.rotate(reduceMotion ? 0 : Math.sin(game.elapsed * 5) * 0.025);
        ctx.fillStyle = '#7c3aed';
        ctx.strokeStyle = '#3b0764';
        ctx.lineWidth = 2;
        roundedRect(-52, -2, 104, 8, 4);
        ctx.fill();
        ctx.stroke();
        ctx.fillStyle = '#facc15';
        roundedRect(-32, 0, 64, 3, 1.5);
        ctx.fill();
        ctx.fillStyle = '#1e293b';
        ctx.beginPath();
        ctx.arc(-32, 8, 5, 0, Math.PI * 2);
        ctx.arc(32, 8, 5, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#94a3b8';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.arc(-32, 8, 2, 0, Math.PI * 2);
        ctx.arc(32, 8, 2, 0, Math.PI * 2);
        ctx.stroke();
        ctx.restore();
    }

    function drawWings(bodyY, dark, color) {
        const flap = reduceMotion ? 0 : Math.sin(game.elapsed * 14) * 0.12;
        ctx.save();
        ctx.translate(PLAYER_X, bodyY);
        ctx.fillStyle = '#e0f2fe';
        ctx.strokeStyle = '#38bdf8';
        ctx.lineWidth = 2;
        for (const side of [-1, 1]) {
            ctx.save();
            ctx.scale(side, 1);
            ctx.rotate(-0.18 + flap);
            ctx.beginPath();
            ctx.moveTo(-8, 2);
            ctx.quadraticCurveTo(-36, -26, -51, -4);
            ctx.quadraticCurveTo(-38, 7, -8, 8);
            ctx.closePath();
            ctx.fill();
            ctx.stroke();
            ctx.strokeStyle = 'rgba(56, 189, 248, 0.7)';
            ctx.beginPath();
            ctx.moveTo(-12, 3);
            ctx.lineTo(-37, -8);
            ctx.moveTo(-12, 5);
            ctx.lineTo(-40, 0);
            ctx.stroke();
            ctx.strokeStyle = '#38bdf8';
            ctx.restore();
        }
        ctx.restore();
    }

    function drawMammoth() {
        const feet = game.playerY;
        const height = game.ducking ? 31 : 56;
        const bodyY = feet - height * 0.62;
        const headY = feet - height * 0.86;
        const headX = PLAYER_X + 25;
        const color = '#557a94';
        const dark = '#1f3a4d';
        const light = '#8fb3c9';
        const eyeColor = '#fff';
        const flying = game.flightTimer > 0;
        const attack = game.attackTimer > 0 ? 1 - game.attackTimer / 0.28 : 0;
        const bob = game.onGround ? (reduceMotion ? 0 : Math.sin(game.elapsed * 13) * 1.4) : 0;
        const legSwing = game.onGround && !reduceMotion ? Math.sin(game.elapsed * 16) * 5 : 0;

        ctx.save();
        if (game.invincible > 0 && Math.floor(game.elapsed * 20) % 2 === 0) {
            ctx.globalAlpha = 0.55;
        }
        ctx.translate(0, bob);

        ctx.fillStyle = 'rgba(31, 58, 77, 0.18)';
        ctx.beginPath();
        ctx.ellipse(PLAYER_X, GROUND_Y + 5, 40, 7, 0, 0, Math.PI * 2);
        ctx.fill();

        if (game.level.theme === 'beach') {
            drawSurfboard(feet);
        } else if (game.level.theme === 'city') {
            drawSkateboard(feet);
        }

        if (flying) {
            drawWings(bodyY, dark, color);
        }

        // Cola.
        ctx.strokeStyle = dark;
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.moveTo(PLAYER_X - 29, bodyY + 7);
        ctx.quadraticCurveTo(PLAYER_X - 45, bodyY, PLAYER_X - 42, bodyY + 17);
        ctx.stroke();

        // Patas.
        drawMammothLeg(PLAYER_X - 17, feet, legSwing, game.onGround, dark, color);
        drawMammothLeg(PLAYER_X + 8, feet, -legSwing, game.onGround, dark, color);

        // Cuerpo.
        ctx.fillStyle = color;
        ctx.strokeStyle = dark;
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.ellipse(PLAYER_X, bodyY, 31, height * 0.38, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        // Panza.
        ctx.fillStyle = light;
        ctx.beginPath();
        ctx.ellipse(PLAYER_X - 2, bodyY + 8, 18, 9, 0, 0, Math.PI * 2);
        ctx.fill();

        // Pelaje del lomo.
        ctx.fillStyle = dark;
        for (let index = 0; index < 5; index += 1) {
            const x = PLAYER_X - 24 + index * 11;
            const y = bodyY - height * 0.35;
            ctx.beginPath();
            ctx.moveTo(x, y + 5);
            ctx.lineTo(x + 4, y - 6);
            ctx.lineTo(x + 8, y + 5);
            ctx.closePath();
            ctx.fill();
        }

        // Oreja.
        ctx.fillStyle = dark;
        ctx.beginPath();
        ctx.ellipse(headX - 12, headY + 1, 13, 17, -0.2, 0, Math.PI * 2);
        ctx.fill();

        // Cabeza.
        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.arc(headX, headY, 18, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        // Mechón.
        ctx.fillStyle = dark;
        ctx.beginPath();
        ctx.moveTo(headX - 5, headY - 17);
        ctx.lineTo(headX + 1, headY - 27);
        ctx.lineTo(headX + 7, headY - 16);
        ctx.closePath();
        ctx.fill();

        // Ojos estilo dibujo animado.
        ctx.fillStyle = eyeColor;
        ctx.beginPath();
        ctx.ellipse(headX + 6, headY - 5, 5.8, 6.4, 0, 0, Math.PI * 2);
        ctx.ellipse(headX + 16, headY - 5, 4.8, 5.7, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#132a43';
        ctx.beginPath();
        ctx.arc(headX + 8, headY - 5, 2.2, 0, Math.PI * 2);
        ctx.arc(headX + 17, headY - 5, 1.8, 0, Math.PI * 2);
        ctx.fill();

        // Trompa. Se estira cuando ataca.
        const trunkX = headX + 18 + attack * 42;
        const trunkY = headY + 9 - attack * 28;
        ctx.strokeStyle = dark;
        ctx.lineWidth = 12;
        ctx.beginPath();
        ctx.moveTo(headX + 14, headY + 7);
        ctx.quadraticCurveTo(headX + 29, headY + 18, trunkX, trunkY);
        ctx.stroke();
        ctx.strokeStyle = color;
        ctx.lineWidth = 8;
        ctx.beginPath();
        ctx.moveTo(headX + 14, headY + 7);
        ctx.quadraticCurveTo(headX + 29, headY + 18, trunkX, trunkY);
        ctx.stroke();

        // Colmillos, delante de la trompa para que se vean.
        ctx.fillStyle = '#f8fafc';
        ctx.strokeStyle = dark;
        ctx.lineWidth = 2;
        for (const offset of [0, -6]) {
            ctx.beginPath();
            ctx.moveTo(headX + 7 + offset, headY + 10);
            ctx.quadraticCurveTo(headX + 17 + offset, headY + 22, headX + 28 + offset, headY + 17);
            ctx.quadraticCurveTo(headX + 18 + offset, headY + 16, headX + 9 + offset, headY + 13);
            ctx.closePath();
            ctx.fill();
            ctx.stroke();
        }

        if (attack > 0.15) {
            ctx.strokeStyle = 'rgba(248, 250, 252, 0.85)';
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.arc(trunkX + 9, trunkY - 4, 11 + attack * 9, -1.2, 0.5);
            ctx.stroke();
        }

        ctx.restore();
    }

    function drawMammothLeg(x, feet, swing, grounded, dark, color) {
        ctx.save();
        ctx.translate(x, feet);
        ctx.rotate((grounded ? swing : -8) * Math.PI / 180);
        ctx.fillStyle = color;
        ctx.strokeStyle = dark;
        ctx.lineWidth = 2;
        roundedRect(-5.5, -20, 11, 20, 4);
        ctx.fill();
        ctx.stroke();
        ctx.fillStyle = dark;
        roundedRect(-7, -7, 14, 7, 3);
        ctx.fill();
        ctx.restore();
    }

    function drawParticles() {
        for (const particle of game.particles) {
            ctx.save();
            ctx.globalAlpha = clamp(particle.life / particle.maxLife, 0, 1);
            ctx.fillStyle = particle.color;
            ctx.fillRect(particle.x, particle.y, particle.size, particle.size);
            ctx.restore();
        }
    }

    function drawFlash() {
        if (game.flash <= 0 || !game.flashText) return;
        ctx.save();
        ctx.globalAlpha = Math.min(0.9, game.flash + 0.2);
        ctx.fillStyle = '#132a43';
        ctx.font = '800 22px "Segoe UI", Arial, sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(game.flashText, VIEW_W / 2, 48);
        ctx.restore();
    }

    function roundedRect(x, y, width, height, radius) {
        const r = Math.min(radius, width / 2, height / 2);
        ctx.beginPath();
        ctx.moveTo(x + r, y);
        ctx.lineTo(x + width - r, y);
        ctx.quadraticCurveTo(x + width, y, x + width, y + r);
        ctx.lineTo(x + width, y + height - r);
        ctx.quadraticCurveTo(x + width, y + height, x + width - r, y + height);
        ctx.lineTo(x + r, y + height);
        ctx.quadraticCurveTo(x, y + height, x, y + height - r);
        ctx.lineTo(x, y + r);
        ctx.quadraticCurveTo(x, y, x + r, y);
        ctx.closePath();
    }

    function handleOverlayClick(event) {
        const button = event.target.closest('[data-trompo-action]');
        if (!button) return;
        const action = button.dataset.trompoAction;
        if (action === 'start' || action === 'restart-game') startGame();
        else if (action === 'resume') resume();
        else if (action === 'next') nextLevel();
        else if (action === 'restart') restartLevel();
        else if (action === 'levels') showStartOverlay();
        else if (action === 'level') startLevel(Number(button.dataset.level) || 0, 0);
    }

    function handleKeydown(event) {
        if (event.target && /^(INPUT|TEXTAREA|SELECT)$/.test(event.target.tagName)) return;
        const key = event.key;

        if (key === ' ' || key === 'Spacebar' || key === 'ArrowUp' || key === 'w' || key === 'W') {
            event.preventDefault();
            if (mode === 'running') jump();
            else if (mode === 'idle') startGame();
            else if (mode === 'paused') resume();
            else if (mode === 'levelComplete') nextLevel();
            else if (mode === 'gameOver' || mode === 'victory') restartLevel();
            return;
        }

        if (key === 'x' || key === 'X' || key === 'k' || key === 'K') {
            event.preventDefault();
            if (mode === 'running') attack();
            return;
        }

        if (key === 'ArrowDown' || key === 's' || key === 'S') {
            event.preventDefault();
            keyDuckHeld = true;
            stomp();
            return;
        }

        if (key === 'p' || key === 'P' || key === 'Escape') {
            if (mode === 'running' || mode === 'paused') {
                event.preventDefault();
                togglePause();
            }
            return;
        }

        if (key === 'Enter' && mode !== 'running') {
            event.preventDefault();
            if (mode === 'idle') startGame();
            else if (mode === 'paused') resume();
            else if (mode === 'levelComplete') nextLevel();
            else if (mode === 'gameOver' || mode === 'victory') restartLevel();
        }
    }

    function handleKeyup(event) {
        if (event.key === 'ArrowDown' || event.key === 's' || event.key === 'S') {
            keyDuckHeld = false;
            if (game && game.stompTimer <= 0) game.ducking = false;
        }
    }

    function bindEvents() {
        if (overlay) overlay.addEventListener('click', handleOverlayClick);

        const jumpButton = document.getElementById('trompoJumpBtn');
        const trunkButton = document.getElementById('trompoTrunkBtn');
        const stompButton = document.getElementById('trompoStompBtn');

        if (jumpButton) {
            jumpButton.addEventListener('click', event => {
                event.preventDefault();
                if (mode === 'running') jump();
                else if (mode === 'idle') startGame();
                else if (mode === 'paused') resume();
                else if (mode === 'levelComplete') nextLevel();
                else if (mode === 'gameOver' || mode === 'victory') restartLevel();
            });
        }

        if (trunkButton) {
            trunkButton.addEventListener('click', event => {
                event.preventDefault();
                attack();
            });
        }

        if (stompButton) {
            stompButton.addEventListener('pointerdown', event => {
                event.preventDefault();
                stomp();
            });
        }

        if (canvas) {
            canvas.addEventListener('pointerdown', event => {
                if (mode !== 'running') return;
                event.preventDefault();
                jump();
            });
        }

        document.addEventListener('keydown', handleKeydown);
        document.addEventListener('keyup', handleKeyup);
        global.addEventListener('gamepadconnected', () => setGamepadStatus(true));
        global.addEventListener('gamepaddisconnected', () => setGamepadStatus(false));
    }

    function init() {
        canvas = document.getElementById('trompoCanvas');
        if (!canvas) return;

        try {
            ctx = canvas.getContext('2d');
        } catch (error) {
            ctx = null;
        }

        overlay = document.getElementById('trompoOverlay');
        els = {
            level: document.getElementById('trompoLevelLabel'),
            healthBar: document.getElementById('trompoHealthBar'),
            healthLabel: document.getElementById('trompoHealthLabel'),
            shieldBar: document.getElementById('trompoShieldBar'),
            shieldLabel: document.getElementById('trompoShieldLabel'),
            score: document.getElementById('trompoScoreLabel'),
            progressBar: document.getElementById('trompoProgressBar'),
            progressTrack: document.getElementById('trompoProgressTrack'),
            effects: document.getElementById('trompoEffects'),
            pause: document.getElementById('trompoPauseBtn'),
            mute: document.getElementById('trompoMuteBtn'),
            gamepad: document.getElementById('trompoGamepadStatus')
        };

        muted = readStored(MUTE_KEY, false) === true;
        best = loadBest();
        reduceMotion = typeof global.matchMedia === 'function'
            && global.matchMedia('(prefers-reduced-motion: reduce)').matches;
        game = makeState(0);
        bindEvents();
        updateMuteButton();
        updateHud();
        showStartOverlay();
        if (ctx) draw();
    }

    function switchGameMode(value) {
        const deckPanel = document.getElementById('gameDeckbuilderPanel');
        const trompoPanel = document.getElementById('gameTrompoPanel');
        const deckButton = document.getElementById('gameModeDeckbuilderBtn');
        const trompoButton = document.getElementById('gameModeTrompoBtn');
        const isTrompo = value === 'trompo';

        if (deckPanel) {
            deckPanel.hidden = isTrompo;
            deckPanel.classList.toggle('active', !isTrompo);
        }
        if (trompoPanel) {
            trompoPanel.hidden = !isTrompo;
            trompoPanel.classList.toggle('active', isTrompo);
        }
        if (deckButton) {
            deckButton.classList.toggle('active', !isTrompo);
            deckButton.setAttribute('aria-selected', String(!isTrompo));
        }
        if (trompoButton) {
            trompoButton.classList.toggle('active', isTrompo);
            trompoButton.setAttribute('aria-selected', String(isTrompo));
        }

        if (isTrompo) show();
        else hide();
    }

    global.switchGameMode = switchGameMode;
    global.Trompo = {
        init,
        show,
        hide,
        startGame,
        startLevel,
        restartLevel,
        nextLevel,
        togglePause,
        resume,
        jump,
        attack,
        stomp,
        toggleMute,
        getState: () => ({
            mode,
            levelIndex: game ? game.levelIndex : 0,
            rows: game ? game.rows : 0,
            score: game ? getRunScore() : 0,
            health: game ? game.health : 100,
            shield: game ? game.shield : 0,
            onGround: game ? game.onGround : true,
            playerY: game ? game.playerY : GROUND_Y,
            insects: game ? game.insects : 0,
            flightTimer: game ? game.flightTimer : 0,
            effects: game ? getEffects() : []
        })
    };
    global.TrompoInternals = {
        LEVELS,
        ALLIES,
        ROW_PX,
        makeState,
        getProgress,
        getRunScore,
        getEffects,
        applyEnergy,
        applyVocho,
        applyAlly,
        applyDamageToState,
        formatNumber
    };

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
}(typeof window !== 'undefined' ? window : globalThis));
