/**
 * Trompo: runner educativo con un elefante azul y referencias a bases de datos.
 * Funciona con teclado, controles táctiles y mando (Gamepad API).
 */
(function (global) {
    'use strict';

    const STORAGE_KEY = 'sql-academy-trompo-v1';
    const MUTE_KEY = 'sql-academy-trompo-muted';
    const VIEW_W = 1000;
    const VIEW_H = 360;
    const GROUND_Y = 292;
    const ROW_PX = 12;
    const PLAYER_X = 138;

    const LEVELS = [
        {
            id: 'from',
            name: 'FROM',
            title: 'El inicio de la consulta',
            rows: 1200,
            speed: 260,
            spawn: 1.3,
            accent: '#2563eb'
        },
        {
            id: 'where',
            name: 'WHERE',
            title: 'Filtra los errores',
            rows: 1400,
            speed: 292,
            spawn: 1.2,
            accent: '#0f766e'
        },
        {
            id: 'group',
            name: 'GROUP BY',
            title: 'Agrupa y resiste',
            rows: 1600,
            speed: 324,
            spawn: 1.08,
            accent: '#7c3aed'
        },
        {
            id: 'order',
            name: 'ORDER BY',
            title: 'Ordena el caos',
            rows: 1800,
            speed: 356,
            spawn: 0.96,
            accent: '#b45309'
        },
        {
            id: 'limit',
            name: 'LIMIT',
            title: 'La recta final',
            rows: 2000,
            speed: 388,
            spawn: 0.84,
            accent: '#be123c'
        }
    ];

    const POWERUPS = {
        index: { label: 'INDEX', color: '#16a34a', ink: '#052e16' },
        cache: { label: 'CACHÉ', color: '#0284c7', ink: '#082f49' },
        backup: { label: 'BACKUP', color: '#9333ea', ink: '#2e1065' },
        truncate: { label: 'TRUNC', color: '#ea580c', ink: '#431407' }
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

    function makeState(levelIndex = 0, totalScore = 0) {
        const level = LEVELS[levelIndex] || LEVELS[0];
        return {
            levelIndex,
            level,
            totalScore,
            distance: 0,
            rows: 0,
            score: 0,
            lives: 3,
            maxLives: 3,
            combo: 0,
            maxCombo: 0,
            bugs: 0,
            shield: 0,
            invincible: 0,
            boost: 0,
            rollbackAvailable: true,
            ducking: false,
            smashTimer: 0,
            playerY: GROUND_Y,
            vy: 0,
            onGround: true,
            obstacles: [],
            powerups: [],
            particles: [],
            spawnTimer: 1.2,
            powerTimer: 6,
            shake: 0,
            flash: 0,
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
            masterGain.gain.value = muted ? 0 : 0.11;
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

    function playTone({ frequency, endFrequency = frequency, duration = 0.12, type = 'sine', gain = 0.05, delay = 0 }) {
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
            playTone({ frequency: 360, endFrequency: 640, duration: 0.13, type: 'sine', gain: 0.045 });
        } else if (name === 'smash') {
            playTone({ frequency: 120, endFrequency: 55, duration: 0.14, type: 'square', gain: 0.05 });
        } else if (name === 'collect') {
            playTone({ frequency: 720, endFrequency: 980, duration: 0.11, type: 'triangle', gain: 0.045 });
        } else if (name === 'hit') {
            playTone({ frequency: 190, endFrequency: 70, duration: 0.28, type: 'sawtooth', gain: 0.045 });
        } else if (name === 'rollback') {
            playTone({ frequency: 280, endFrequency: 880, duration: 0.22, type: 'triangle', gain: 0.04 });
            playTone({ frequency: 440, endFrequency: 220, duration: 0.18, type: 'sine', gain: 0.035, delay: 0.18 });
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
            masterGain.gain.setTargetAtTime(muted ? 0 : 0.11, audioContext.currentTime, 0.02);
        }
    }

    function toggleMute() {
        muted = !muted;
        writeStored(MUTE_KEY, muted);
        updateMuteButton();
        if (!muted) playSound('collect');
    }

    function updateHud() {
        if (!game) return;
        if (els.level) els.level.textContent = `${game.levelIndex + 1} / ${LEVELS.length}`;
        if (els.rows) els.rows.textContent = `${formatNumber(game.rows)} / ${formatNumber(game.level.rows)}`;
        if (els.score) els.score.textContent = formatNumber(getRunScore());
        if (els.lives) els.lives.textContent = `${game.lives} / ${game.maxLives}`;
        if (els.progressBar) els.progressBar.style.width = `${Math.round(getProgress() * 100)}%`;
        if (els.progressTrack) {
            els.progressTrack.setAttribute('aria-valuenow', String(Math.round(getProgress() * 100)));
        }
        if (els.rollback) {
            els.rollback.disabled = !game.rollbackAvailable;
            els.rollback.setAttribute('aria-disabled', String(!game.rollbackAvailable));
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

    function levelLabel(level) {
        return `${level.name} · ${level.title}`;
    }

    function showStartOverlay() {
        const bestText = best.score > 0
            ? `<p class="trompo-overlay-note">Mejor puntaje: <strong>${formatNumber(best.score)}</strong></p>`
            : '';
        setOverlayContent(`
            <span class="trompo-overlay-kicker">5 niveles · 5 minutos</span>
            <h3>Trompo</h3>
            <p>Corre por la tabla, salta los <strong>NULL</strong> y aplasta los <strong>bugs</strong>. Recoge índices, caché y backups para llegar al final de la consulta.</p>
            <div class="trompo-level-list">
                ${LEVELS.map((level, index) => `
                    <span class="${index === 0 ? 'is-next' : ''}">
                        <b>${index + 1}</b> ${level.name}
                    </span>
                `).join('')}
            </div>
            ${bestText}
            <div class="trompo-overlay-actions">
                <button type="button" class="btn-primary" data-trompo-action="start">
                    <i class="fas fa-play"></i> Comenzar nivel 1
                </button>
            </div>
            <p class="trompo-overlay-note">Teclado: Espacio para saltar · ↓ o S para aplastar · R para ROLLBACK · P para pausa.</p>
        `);
    }

    function showPauseOverlay() {
        setOverlayContent(`
            <span class="trompo-overlay-kicker">Consulta en pausa</span>
            <h3>Pausa</h3>
            <p>El nivel ${game.level.name} está detenido. Puedes continuar o reiniciar este nivel.</p>
            <div class="trompo-overlay-actions">
                <button type="button" class="btn-primary" data-trompo-action="resume">
                    <i class="fas fa-play"></i> Continuar
                </button>
                <button type="button" class="btn-secondary" data-trompo-action="restart">
                    <i class="fas fa-rotate-left"></i> Reiniciar nivel
                </button>
            </div>
        `);
    }

    function showLevelOverlay(completed) {
        const runScore = getRunScore();
        const next = LEVELS[game.levelIndex + 1];
        setOverlayContent(`
            <span class="trompo-overlay-kicker">Nivel ${game.levelIndex + 1} de ${LEVELS.length}</span>
            <h3>${completed ? 'Nivel completado' : 'Consulta interrumpida'}</h3>
            <p>${completed
                ? `Superaste <strong>${game.level.name}</strong>. ${next ? `Ahora toca ${next.name}.` : 'Completaste todos los niveles.'}`
                : `Trompo chocó con un error en <strong>${game.level.name}</strong>. Puedes intentarlo otra vez.`}</p>
            <div class="trompo-summary">
                <div><span>Puntos</span><strong>${formatNumber(runScore)}</strong></div>
                <div><span>Filas</span><strong>${formatNumber(game.rows)}</strong></div>
                <div><span>Bugs</span><strong>${formatNumber(game.bugs)}</strong></div>
                <div><span>Combo</span><strong>x${game.maxCombo}</strong></div>
            </div>
            <div class="trompo-overlay-actions">
                ${completed && next
                    ? `<button type="button" class="btn-primary" data-trompo-action="next">
                        <i class="fas fa-arrow-right"></i> Jugar ${next.name}
                    </button>`
                    : completed
                        ? `<button type="button" class="btn-primary" data-trompo-action="restart-game">
                            <i class="fas fa-rotate-left"></i> Jugar de nuevo
                        </button>`
                        : `<button type="button" class="btn-primary" data-trompo-action="restart">
                            <i class="fas fa-rotate-left"></i> Reintentar ${game.level.name}
                        </button>`}
                ${completed && next ? `
                    <button type="button" class="btn-secondary" data-trompo-action="restart">
                        Repetir nivel
                    </button>
                ` : ''}
            </div>
        `);
    }

    function showVictoryOverlay() {
        setOverlayContent(`
            <span class="trompo-overlay-kicker">Consulta completada</span>
            <h3>¡Trompo llegó al LIMIT!</h3>
            <p>Completaste los cinco niveles. La consulta terminó sin errores.</p>
            <div class="trompo-summary">
                <div><span>Puntos</span><strong>${formatNumber(getRunScore())}</strong></div>
                <div><span>Bugs</span><strong>${formatNumber(game.bugs)}</strong></div>
                <div><span>Nivel</span><strong>${LEVELS.length} / ${LEVELS.length}</strong></div>
            </div>
            <div class="trompo-overlay-actions">
                <button type="button" class="btn-primary" data-trompo-action="restart-game">
                    <i class="fas fa-rotate-left"></i> Jugar de nuevo
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
        if (mode !== 'running' || !game.onGround) return;
        game.vy = -590;
        game.onGround = false;
        game.ducking = false;
        game.smashTimer = 0;
        playSound('jump');
    }

    function smash(hold = false) {
        if (mode !== 'running') return;
        game.ducking = true;
        game.smashTimer = 0.28;
        if (!hold) {
            clearTimeout(duckReleaseTimer);
            duckReleaseTimer = setTimeout(() => {
                if (mode === 'running' && !keyDuckHeld) {
                    game.ducking = false;
                    game.smashTimer = 0;
                }
            }, 280);
        }
    }

    function rollback() {
        if (mode !== 'running' || !game.rollbackAvailable) return;
        game.rollbackAvailable = false;
        game.obstacles.forEach(obstacle => { obstacle.dead = true; });
        game.invincible = 1.4;
        game.shake = 0.7;
        game.flash = 0.55;
        playSound('rollback');
        updateHud();
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

    function update(dt) {
        const level = game.level;
        const speed = level.speed * (1 + 0.28 * getProgress()) + (game.boost > 0 ? 95 : 0);
        const previousRows = game.rows;
        game.distance += speed * dt;
        game.rows = Math.floor(game.distance / ROW_PX);
        if (game.rows > previousRows) {
            game.score += (game.rows - previousRows) * 2;
        }
        game.elapsed += dt;

        if (game.rows >= level.rows) {
            game.rows = level.rows;
            completeLevel();
            return;
        }

        if (game.boost > 0) game.boost = Math.max(0, game.boost - dt);
        if (game.shield > 0) game.shield = Math.max(0, game.shield - dt);
        if (game.invincible > 0) game.invincible = Math.max(0, game.invincible - dt);
        if (game.shake > 0) game.shake = Math.max(0, game.shake - dt * 2.5);
        if (game.flash > 0) game.flash = Math.max(0, game.flash - dt * 2);

        if (!game.onGround) {
            game.vy += 1600 * dt;
            game.playerY += game.vy * dt;
            if (game.playerY >= GROUND_Y) {
                game.playerY = GROUND_Y;
                game.vy = 0;
                game.onGround = true;
            }
        }

        if (game.smashTimer > 0) {
            game.smashTimer = Math.max(0, game.smashTimer - dt);
            if (game.smashTimer === 0 && !keyDuckHeld) game.ducking = false;
        }

        game.spawnTimer -= dt;
        if (game.spawnTimer <= 0) {
            spawnObstacle();
            game.spawnTimer = Math.max(0.62, level.spawn - game.levelIndex * 0.04) + Math.random() * 0.52;
        }

        game.powerTimer -= dt;
        if (game.powerTimer <= 0) {
            spawnPowerup();
            game.powerTimer = 7 + Math.random() * 4;
        }

        moveEntities(game.obstacles, speed, dt);
        moveEntities(game.powerups, speed, dt);
        checkCollisions();
        updateParticles(dt);
        pollGamepad();
        updateHud();
    }

    function moveEntities(entities, speed, dt) {
        for (const entity of entities) {
            entity.x -= speed * dt;
            if (entity.type === 'bird') {
                entity.y += Math.sin(game.elapsed * 4 + entity.seed) * 12 * dt;
            }
            if (entity.x + entity.w < -30) entity.dead = true;
        }
        game.obstacles = game.obstacles.filter(entity => !entity.dead);
        game.powerups = game.powerups.filter(entity => !entity.dead);
    }

    function spawnObstacle() {
        const options = ['null', 'bug', 'lock'];
        if (game.levelIndex >= 1) options.push('bird');
        if (game.levelIndex >= 2) options.push('duplicate');
        if (game.levelIndex >= 3) options.push('bug', 'null');
        const type = options[Math.floor(Math.random() * options.length)];
        const obstacle = {
            type,
            x: VIEW_W + 30,
            y: GROUND_Y,
            w: 36,
            h: 46,
            seed: Math.random() * Math.PI * 2,
            dead: false
        };

        if (type === 'bug') {
            obstacle.w = 40;
            obstacle.h = 24;
            obstacle.y = GROUND_Y - obstacle.h;
        } else if (type === 'lock') {
            obstacle.w = 48;
            obstacle.h = 60;
            obstacle.y = GROUND_Y - obstacle.h;
        } else if (type === 'bird') {
            obstacle.w = 54;
            obstacle.h = 28;
            obstacle.y = GROUND_Y - 92;
        } else if (type === 'duplicate') {
            obstacle.w = 58;
            obstacle.h = 44;
            obstacle.y = GROUND_Y - obstacle.h;
        } else {
            obstacle.y = GROUND_Y - obstacle.h;
        }

        game.obstacles.push(obstacle);
    }

    function spawnPowerup() {
        const types = ['index', 'cache', 'backup'];
        if (game.levelIndex >= 2) types.push('truncate');
        const type = types[Math.floor(Math.random() * types.length)];
        game.powerups.push({
            type,
            x: VIEW_W + 30,
            y: GROUND_Y - 92 - Math.random() * 45,
            w: 36,
            h: 36,
            seed: Math.random() * Math.PI * 2,
            dead: false
        });
    }

    function getPlayerRect() {
        const height = game.ducking ? 27 : 50;
        return {
            x: PLAYER_X - 29,
            y: game.playerY - height,
            w: 58,
            h: height
        };
    }

    function overlaps(a, b) {
        return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
    }

    function checkCollisions() {
        const player = getPlayerRect();

        for (const obstacle of game.obstacles) {
            if (obstacle.dead || !overlaps(player, obstacle)) continue;

            if (obstacle.type === 'bug' && game.smashTimer > 0) {
                squashBug(obstacle);
                continue;
            }

            if (game.invincible > 0) continue;

            if (game.shield > 0) {
                game.shield = 0;
                game.invincible = 0.8;
                obstacle.dead = true;
                game.shake = 0.35;
                burst(obstacle.x + obstacle.w / 2, obstacle.y, '#38bdf8', 8);
                playSound('hit');
                continue;
            }

            obstacle.dead = true;
            hit();
        }

        for (const powerup of game.powerups) {
            if (powerup.dead || !overlaps(player, powerup)) continue;
            powerup.dead = true;
            collectPowerup(powerup);
        }
    }

    function squashBug(obstacle) {
        obstacle.dead = true;
        game.bugs += 1;
        game.combo += 1;
        game.maxCombo = Math.max(game.maxCombo, game.combo);
        game.score += 25 * clamp(game.combo, 1, 5);
        game.shake = 0.25;
        burst(obstacle.x + obstacle.w / 2, obstacle.y + obstacle.h / 2, '#a855f7', 10);
        playSound('smash');
    }

    function collectPowerup(powerup) {
        game.score += 50;
        if (powerup.type === 'index') {
            game.boost = 5;
            playSound('collect');
        } else if (powerup.type === 'cache') {
            game.shield = 7;
            playSound('collect');
        } else if (powerup.type === 'backup') {
            game.lives = Math.min(game.maxLives, game.lives + 1);
            game.score += 25;
            playSound('collect');
        } else if (powerup.type === 'truncate') {
            game.obstacles.forEach(obstacle => { obstacle.dead = true; });
            game.score += 100;
            game.flash = 0.45;
            playSound('rollback');
        }
        burst(powerup.x + powerup.w / 2, powerup.y + powerup.h / 2, POWERUPS[powerup.type].color, 12);
    }

    function hit() {
        game.lives -= 1;
        game.combo = 0;
        game.invincible = 1.7;
        game.shake = 0.65;
        playSound('hit');
        if (game.lives <= 0) {
            game.lives = 0;
            gameOver();
        }
    }

    function gameOver() {
        mode = 'gameOver';
        stopLoop();
        saveBest(getRunScore(), game.levelIndex);
        updateHud();
        showLevelOverlay(false);
        playSound('gameover');
    }

    function completeLevel() {
        const isLast = game.levelIndex >= LEVELS.length - 1;
        mode = isLast ? 'victory' : 'levelComplete';
        stopLoop();
        saveBest(getRunScore(), game.levelIndex + 1, isLast);
        updateHud();
        if (isLast) {
            showVictoryOverlay();
        } else {
            showLevelOverlay(true);
        }
        playSound('level');
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
        if (justPressed(2) || justPressed(13)) smash(false);
        if (justPressed(1)) rollback();
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
        drawObstacles();
        drawElephant();
        drawParticles();
        drawFlash();
        ctx.restore();
    }

    function drawBackground() {
        const gradient = ctx.createLinearGradient(0, 0, 0, VIEW_H);
        gradient.addColorStop(0, '#dbeafe');
        gradient.addColorStop(0.7, '#eff6ff');
        gradient.addColorStop(1, '#e2e8f0');
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, VIEW_W, VIEW_H);

        ctx.save();
        ctx.globalAlpha = 0.14;
        ctx.strokeStyle = '#2563eb';
        ctx.lineWidth = 1;
        const offset = -(game.distance * 0.12) % 90;
        for (let x = offset; x < VIEW_W + 90; x += 90) {
            ctx.beginPath();
            ctx.moveTo(x, 0);
            ctx.lineTo(x, GROUND_Y);
            ctx.stroke();
        }
        for (let y = 60; y < GROUND_Y; y += 52) {
            ctx.beginPath();
            ctx.moveTo(0, y);
            ctx.lineTo(VIEW_W, y);
            ctx.stroke();
        }
        ctx.restore();

        ctx.save();
        ctx.globalAlpha = 0.18;
        ctx.fillStyle = game.level.accent;
        ctx.font = '700 46px "Segoe UI", Arial, sans-serif';
        ctx.textAlign = 'right';
        ctx.fillText(game.level.name, VIEW_W - 24, 72);
        ctx.font = '600 12px "Segoe UI", Arial, sans-serif';
        ctx.fillText('consulta en progreso', VIEW_W - 24, 92);
        ctx.restore();

        if (game.boost > 0) {
            ctx.save();
            ctx.globalAlpha = 0.35;
            ctx.strokeStyle = '#16a34a';
            ctx.lineWidth = 3;
            for (let index = 0; index < 4; index += 1) {
                const y = 110 + index * 42 + Math.sin(game.elapsed * 10 + index) * 8;
                ctx.beginPath();
                ctx.moveTo(40, y);
                ctx.lineTo(180 + index * 18, y);
                ctx.stroke();
            }
            ctx.restore();
        }
    }

    function drawGround() {
        ctx.fillStyle = '#cbd5e1';
        ctx.fillRect(0, GROUND_Y, VIEW_W, VIEW_H - GROUND_Y);
        ctx.fillStyle = '#94a3b8';
        ctx.fillRect(0, GROUND_Y, VIEW_W, 4);
        ctx.save();
        ctx.globalAlpha = 0.45;
        ctx.strokeStyle = '#64748b';
        ctx.lineWidth = 1;
        const offset = -(game.distance * 0.8) % 64;
        for (let x = offset; x < VIEW_W + 64; x += 64) {
            ctx.beginPath();
            ctx.moveTo(x, GROUND_Y + 8);
            ctx.lineTo(x - 12, VIEW_H);
            ctx.stroke();
        }
        ctx.restore();
        ctx.save();
        ctx.globalAlpha = 0.5;
        ctx.fillStyle = '#475569';
        ctx.font = '700 9px "Courier New", monospace';
        ctx.fillText('ROW', 18, VIEW_H - 14);
        ctx.fillText(`#${formatNumber(game.rows)}`, 54, VIEW_H - 14);
        ctx.restore();
    }

    function drawPowerups() {
        for (const powerup of game.powerups) {
            if (powerup.dead) continue;
            const info = POWERUPS[powerup.type];
            const float = Math.sin(game.elapsed * 5 + powerup.seed) * 5;
            ctx.save();
            ctx.translate(powerup.x, powerup.y + float);
            ctx.shadowColor = info.color;
            ctx.shadowBlur = 16;
            ctx.fillStyle = info.color;
            roundedRect(0, 0, powerup.w, powerup.h, 10);
            ctx.fill();
            ctx.shadowBlur = 0;
            ctx.strokeStyle = '#fff';
            ctx.lineWidth = 2;
            roundedRect(3, 3, powerup.w - 6, powerup.h - 6, 7);
            ctx.stroke();
            ctx.fillStyle = '#fff';
            ctx.font = '800 9px "Segoe UI", Arial, sans-serif';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(info.label, powerup.w / 2, powerup.h / 2 + 1);
            ctx.restore();
        }
    }

    function drawObstacles() {
        for (const obstacle of game.obstacles) {
            if (obstacle.dead) continue;
            if (obstacle.type === 'null') drawNullCactus(obstacle);
            else if (obstacle.type === 'bug') drawBug(obstacle);
            else if (obstacle.type === 'lock') drawLock(obstacle);
            else if (obstacle.type === 'bird') drawBird(obstacle);
            else if (obstacle.type === 'duplicate') drawDuplicate(obstacle);
        }
    }

    function drawNullCactus(obstacle) {
        const x = obstacle.x;
        const y = obstacle.y;
        ctx.save();
        ctx.fillStyle = '#15803d';
        ctx.strokeStyle = '#14532d';
        ctx.lineWidth = 2;
        roundedRect(x + 9, y, 18, obstacle.h, 8);
        ctx.fill();
        ctx.stroke();
        roundedRect(x, y + 18, 13, 8, 4);
        ctx.fill();
        ctx.stroke();
        roundedRect(x + 23, y + 26, 13, 8, 4);
        ctx.fill();
        ctx.stroke();
        ctx.strokeStyle = '#86efac';
        ctx.lineWidth = 2;
        for (let index = 0; index < 3; index += 1) {
            ctx.beginPath();
            ctx.moveTo(x + 12 + index * 5, y + 7);
            ctx.lineTo(x + 9 + index * 5, y + 1);
            ctx.stroke();
        }
        ctx.fillStyle = '#b91c1c';
        roundedRect(x - 4, y + obstacle.h - 16, obstacle.w + 8, 15, 4);
        ctx.fill();
        ctx.fillStyle = '#fff';
        ctx.font = '800 9px "Courier New", monospace';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('NULL', x + obstacle.w / 2, y + obstacle.h - 8);
        ctx.restore();
    }

    function drawBug(obstacle) {
        const x = obstacle.x;
        const y = obstacle.y;
        const centerX = x + obstacle.w / 2;
        const centerY = y + obstacle.h / 2;
        ctx.save();
        ctx.strokeStyle = '#581c87';
        ctx.lineWidth = 2;
        for (let index = 0; index < 3; index += 1) {
            ctx.beginPath();
            ctx.moveTo(centerX - 12, centerY + 2 + index * 4);
            ctx.lineTo(centerX - 20, centerY + 8 + index * 5);
            ctx.moveTo(centerX + 12, centerY + 2 + index * 4);
            ctx.lineTo(centerX + 20, centerY + 8 + index * 5);
            ctx.stroke();
        }
        ctx.fillStyle = '#a855f7';
        ctx.strokeStyle = '#6b21a8';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.ellipse(centerX, centerY, 17, 11, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
        ctx.fillStyle = '#fff';
        ctx.beginPath();
        ctx.arc(centerX - 5, centerY - 3, 3, 0, Math.PI * 2);
        ctx.arc(centerX + 5, centerY - 3, 3, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#312e81';
        ctx.beginPath();
        ctx.arc(centerX - 5, centerY - 3, 1.2, 0, Math.PI * 2);
        ctx.arc(centerX + 5, centerY - 3, 1.2, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#4c1d95';
        ctx.font = '800 8px "Segoe UI", Arial, sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('BUG', centerX, centerY + 8);
        ctx.restore();
    }

    function drawLock(obstacle) {
        const x = obstacle.x;
        const y = obstacle.y;
        ctx.save();
        ctx.fillStyle = '#475569';
        ctx.strokeStyle = '#1e293b';
        ctx.lineWidth = 2;
        roundedRect(x, y, obstacle.w, obstacle.h, 7);
        ctx.fill();
        ctx.stroke();
        ctx.fillStyle = '#cbd5e1';
        roundedRect(x + 10, y + 12, obstacle.w - 20, 6, 3);
        ctx.fill();
        ctx.fillStyle = '#fff';
        ctx.font = '800 8px "Courier New", monospace';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('LOCK', x + obstacle.w / 2, y + 34);
        ctx.restore();
    }

    function drawBird(obstacle) {
        const x = obstacle.x;
        const y = obstacle.y;
        const wing = Math.sin(game.elapsed * 10 + obstacle.seed) * 6;
        ctx.save();
        ctx.fillStyle = '#eab308';
        ctx.strokeStyle = '#713f12';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.ellipse(x + 28, y + 14, 18, 10, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(x + 18, y + 12);
        ctx.quadraticCurveTo(x + 5, y + 2 + wing, x - 2, y + 17);
        ctx.quadraticCurveTo(x + 12, y + 19, x + 18, y + 12);
        ctx.fill();
        ctx.stroke();
        ctx.fillStyle = '#fff';
        ctx.beginPath();
        ctx.arc(x + 38, y + 11, 3, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#713f12';
        ctx.beginPath();
        ctx.arc(x + 38, y + 11, 1.2, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#92400e';
        ctx.font = '800 7px "Courier New", monospace';
        ctx.textAlign = 'center';
        ctx.fillText('SELECT', x + 27, y + 30);
        ctx.restore();
    }

    function drawDuplicate(obstacle) {
        const x = obstacle.x;
        const y = obstacle.y;
        ctx.save();
        ctx.fillStyle = '#0f766e';
        ctx.strokeStyle = '#134e4a';
        ctx.lineWidth = 2;
        roundedRect(x, y, obstacle.w, 18, 5);
        ctx.fill();
        ctx.stroke();
        roundedRect(x + 6, y + 22, obstacle.w, 18, 5);
        ctx.fill();
        ctx.stroke();
        ctx.fillStyle = '#fff';
        ctx.font = '800 8px "Courier New", monospace';
        ctx.textAlign = 'center';
        ctx.fillText('x2', x + obstacle.w / 2, y + 12);
        ctx.fillText('x2', x + obstacle.w / 2 + 6, y + 34);
        ctx.restore();
    }

    function drawElephant() {
        const feet = game.playerY;
        const height = game.ducking ? 29 : 50;
        const bodyY = feet - height * 0.5;
        const headY = feet - height * 0.78;
        const headX = PLAYER_X + 21;
        const bob = game.onGround ? (reduceMotion ? 0 : Math.sin(game.elapsed * 13) * 1.3) : 0;
        const legSwing = game.onGround && !reduceMotion ? Math.sin(game.elapsed * 16) * 5 : 0;

        ctx.save();
        ctx.translate(0, bob);
        ctx.fillStyle = 'rgba(15, 23, 42, 0.16)';
        ctx.beginPath();
        ctx.ellipse(PLAYER_X, GROUND_Y + 5, 38, 7, 0, 0, Math.PI * 2);
        ctx.fill();

        ctx.strokeStyle = '#132a43';
        ctx.lineWidth = 2;
        ctx.fillStyle = '#2563eb';

        // Cola.
        ctx.beginPath();
        ctx.moveTo(PLAYER_X - 30, bodyY + 4);
        ctx.quadraticCurveTo(PLAYER_X - 44, bodyY - 2, PLAYER_X - 42, bodyY + 12);
        ctx.lineWidth = 4;
        ctx.strokeStyle = '#1d4ed8';
        ctx.stroke();
        ctx.lineWidth = 2;

        // Patas.
        drawElephantLeg(PLAYER_X - 17, feet, legSwing, game.onGround);
        drawElephantLeg(PLAYER_X + 8, feet, -legSwing, game.onGround);

        // Cuerpo.
        ctx.fillStyle = '#2563eb';
        ctx.strokeStyle = '#132a43';
        ctx.beginPath();
        ctx.ellipse(PLAYER_X, bodyY, 33, height * 0.48, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        // Panza.
        ctx.fillStyle = '#60a5fa';
        ctx.beginPath();
        ctx.ellipse(PLAYER_X - 2, bodyY + 9, 20, 10, 0, 0, Math.PI * 2);
        ctx.fill();

        // Oreja.
        ctx.fillStyle = '#1d4ed8';
        ctx.strokeStyle = '#132a43';
        ctx.beginPath();
        ctx.ellipse(headX - 10, headY, 14, 17, -0.2, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        // Cabeza.
        ctx.fillStyle = '#2563eb';
        ctx.beginPath();
        ctx.arc(headX, headY, 17, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        // Ojo.
        ctx.fillStyle = '#fff';
        ctx.beginPath();
        ctx.arc(headX + 7, headY - 5, 4.3, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#132a43';
        ctx.beginPath();
        ctx.arc(headX + 8.5, headY - 5, 2, 0, Math.PI * 2);
        ctx.fill();

        // Colmillo.
        ctx.fillStyle = '#f8fafc';
        ctx.beginPath();
        ctx.moveTo(headX + 9, headY + 9);
        ctx.lineTo(headX + 16, headY + 12);
        ctx.lineTo(headX + 10, headY + 14);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        // Trompa.
        ctx.strokeStyle = '#132a43';
        ctx.lineWidth = 9;
        ctx.beginPath();
        ctx.moveTo(headX + 13, headY + 5);
        ctx.quadraticCurveTo(headX + 27, headY + 11, headX + 22, headY + 24);
        ctx.stroke();
        ctx.strokeStyle = '#2563eb';
        ctx.lineWidth = 6;
        ctx.beginPath();
        ctx.moveTo(headX + 13, headY + 5);
        ctx.quadraticCurveTo(headX + 27, headY + 11, headX + 22, headY + 24);
        ctx.stroke();

        // Etiqueta del personaje.
        ctx.fillStyle = '#132a43';
        ctx.font = '800 8px "Segoe UI", Arial, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('TROMPO', PLAYER_X, bodyY + 2);
        ctx.restore();
    }

    function drawElephantLeg(x, feet, swing, grounded) {
        ctx.save();
        ctx.translate(x, feet);
        ctx.rotate((grounded ? swing : -8) * Math.PI / 180);
        ctx.fillStyle = '#1d4ed8';
        ctx.strokeStyle = '#132a43';
        ctx.lineWidth = 2;
        roundedRect(-6, -18, 12, 18, 5);
        ctx.fill();
        ctx.stroke();
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
        if (game.flash <= 0) return;
        ctx.save();
        ctx.fillStyle = `rgba(255, 255, 255, ${Math.min(0.35, game.flash)})`;
        ctx.fillRect(0, 0, VIEW_W, VIEW_H);
        ctx.fillStyle = `rgba(19, 42, 67, ${Math.min(0.8, game.flash)})`;
        ctx.font = '800 28px "Segoe UI", Arial, sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('ROLLBACK', VIEW_W / 2, 80);
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

        if (key === 'ArrowDown' || key === 's' || key === 'S') {
            event.preventDefault();
            keyDuckHeld = true;
            smash(true);
            return;
        }

        if (key === 'r' || key === 'R') {
            event.preventDefault();
            rollback();
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
            if (game && game.smashTimer <= 0) game.ducking = false;
        }
    }

    function bindEvents() {
        if (overlay) overlay.addEventListener('click', handleOverlayClick);

        const jumpButton = document.getElementById('trompoJumpBtn');
        const smashButton = document.getElementById('trompoSmashBtn');
        const rollbackButton = document.getElementById('trompoRollbackBtn');

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

        if (smashButton) {
            smashButton.addEventListener('pointerdown', event => {
                event.preventDefault();
                smash(false);
            });
        }

        if (rollbackButton) {
            rollbackButton.addEventListener('click', event => {
                event.preventDefault();
                rollback();
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
            rows: document.getElementById('trompoRowsLabel'),
            score: document.getElementById('trompoScoreLabel'),
            lives: document.getElementById('trompoLivesLabel'),
            progressBar: document.getElementById('trompoProgressBar'),
            progressTrack: document.getElementById('trompoProgressTrack'),
            pause: document.getElementById('trompoPauseBtn'),
            mute: document.getElementById('trompoMuteBtn'),
            rollback: document.getElementById('trompoRollbackBtn'),
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

        if (isTrompo) {
            show();
        } else {
            hide();
        }
    }

    global.switchGameMode = switchGameMode;
    global.Trompo = {
        init,
        show,
        hide,
        startGame,
        restartLevel,
        nextLevel,
        togglePause,
        resume,
        jump,
        smash,
        rollback,
        toggleMute,
        getState: () => ({
            mode,
            levelIndex: game ? game.levelIndex : 0,
            rows: game ? game.rows : 0,
            score: game ? getRunScore() : 0,
            lives: game ? game.lives : 0,
            onGround: game ? game.onGround : true,
            playerY: game ? game.playerY : GROUND_Y,
            obstacles: game ? game.obstacles.length : 0,
            rollbackAvailable: game ? game.rollbackAvailable : false
        })
    };
    global.TrompoInternals = {
        LEVELS,
        ROW_PX,
        makeState,
        getProgress,
        getRunScore,
        formatNumber
    };

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
}(typeof window !== 'undefined' ? window : globalThis));
