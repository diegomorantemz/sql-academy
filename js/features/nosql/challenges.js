// Retos NoSQL dentro de la página de Retos.

// ============================================
// RETOS NOSQL EN LA PAGINA DE RETOS
// ============================================

function getNoSQLActiveDatasetName() {
    if (typeof window.getNoSQLActiveDataset === 'function') {
        return window.getNoSQLActiveDataset();
    }
    const selector = document.getElementById('nosqlDatasetSelector');
    return selector?.value || 'escuela';
}

function getNoSQLHubChallenges() {
    const datasetName = getNoSQLActiveDatasetName();
    if (typeof window.getNoSQLChallengesForDataset === 'function') {
        return window.getNoSQLChallengesForDataset(datasetName);
    }
    return Array.isArray(window.NOSQL_CHALLENGES)
        ? window.NOSQL_CHALLENGES.filter(challenge => challenge.dataset === datasetName)
        : [];
}

function isNoSQLHubChallengeCompleted(id) {
    if (typeof window.isNoSQLChallengeCompleted === 'function') {
        return window.isNoSQLChallengeCompleted(id);
    }
    return false;
}

function getNoSQLChallengeLevelClass(level) {
    if (level === 'Básico') return 'basico';
    if (level === 'Intermedio') return 'intermedio';
    return 'avanzado';
}

function renderNoSQLHubPlaceholder() {
    const detail = document.getElementById('nosqlHubChallengeDetail');
    if (!detail) return;
    detail.innerHTML = `
        <div class="challenge-empty">
            <i class="fas fa-leaf"></i>
            <h3>Elige un reto NoSQL</h3>
            <p>Selecciona un reto de la lista para ver su descripción y abrirlo en el laboratorio.</p>
        </div>
    `;
}

function renderNoSQLHubDetail(challenge) {
    const detail = document.getElementById('nosqlHubChallengeDetail');
    if (!detail) return;
    if (!challenge) {
        renderNoSQLHubPlaceholder();
        return;
    }

    const completed = isNoSQLHubChallengeCompleted(challenge.id);
    detail.innerHTML = `
        <div class="challenge-detail-header">
            <div>
                <h3>${escapeHtml(challenge.title)}</h3>
                <div class="challenge-detail-meta">
                    <span class="challenge-level ${getNoSQLChallengeLevelClass(challenge.level)}">${escapeHtml(challenge.level)}</span>
                    <span class="text-muted">${completed ? 'Completado' : 'Validación por resultado'}</span>
                </div>
            </div>
        </div>
        <div class="challenge-description">${escapeHtml(challenge.description)}</div>
        <details class="nosql-hint">
            <summary><i class="fas fa-lightbulb"></i> Ver pista</summary>
            <p>${escapeHtml(challenge.hint)}</p>
        </details>
        <label for="nosqlHubEditor" class="sr-only">Comando NoSQL para el reto</label>
        <textarea id="nosqlHubEditor" spellcheck="false" placeholder="Escribe un comando NoSQL, por ejemplo: db.productos.find({ stock: { $lte: 10 } })">${escapeHtml(challenge.starter || '')}</textarea>
        <div class="challenge-actions">
            <button type="button" id="nosqlHubRunBtn" onclick="runNoSQLHubChallenge()">
                <i class="fas fa-play"></i> Comprobar reto
            </button>
            <button type="button" class="btn-secondary" onclick="clearNoSQLHubEditor()">
                <i class="fas fa-eraser"></i> Limpiar
            </button>
            <button type="button" class="btn-secondary" onclick="solveNoSQLChallengeInLab('${escapeHtml(challenge.id)}')">
                <i class="fas fa-flask"></i> Abrir en laboratorio
            </button>
        </div>
        <div id="nosqlHubFeedback" class="challenge-result" aria-live="polite">
            <strong><i class="fas fa-circle-info"></i> Listo para intentarlo</strong>
            Escribe un comando NoSQL y pulsa «Comprobar reto».
        </div>
    `;
}

function renderNoSQLHubList() {
    const list = document.getElementById('nosqlHubChallengeList');
    const datasetLabel = document.getElementById('nosqlHubDatasetLabel');
    const progressText = document.getElementById('nosqlHubProgressText');
    if (!list) return;

    const datasetName = getNoSQLActiveDatasetName();
    const dataset = window.NOSQL_DATASETS?.[datasetName];
    if (datasetLabel) {
        datasetLabel.textContent = `Dataset NoSQL: ${dataset?.name || datasetName}`;
    }

    const challenges = getNoSQLHubChallenges();
    const completed = challenges.filter(challenge => isNoSQLHubChallengeCompleted(challenge.id)).length;
    if (progressText) progressText.textContent = `${completed} de ${challenges.length}`;

    if (!challenges.length) {
        list.innerHTML = '<p class="text-muted">No hay retos NoSQL para este dataset.</p>';
        return;
    }

    list.innerHTML = challenges.map(challenge => {
        const isCompleted = isNoSQLHubChallengeCompleted(challenge.id);
        const active = challenge.id === selectedNoSQLChallengeId;
        return `
            <button type="button" class="challenge-card${active ? ' active' : ''}" data-nosql-challenge="${escapeHtml(challenge.id)}" aria-pressed="${active}">
                <span class="challenge-card-title">
                    ${escapeHtml(challenge.title)}
                    ${isCompleted ? '<i class="fas fa-circle-check" title="Completado"></i>' : ''}
                </span>
                <span class="challenge-card-meta">
                    <span class="challenge-level ${getNoSQLChallengeLevelClass(challenge.level)}">${escapeHtml(challenge.level)}</span>
                    ${isCompleted ? '<span>Completado</span>' : '<span>Pendiente</span>'}
                </span>
            </button>
        `;
    }).join('');

    list.querySelectorAll('[data-nosql-challenge]').forEach(button => {
        button.addEventListener('click', () => openNoSQLHubChallenge(button.dataset.nosqlChallenge));
    });
}

function renderNoSQLChallengeHub() {
    renderNoSQLHubList();
    const challenges = getNoSQLHubChallenges();
    const selectedChallenge = challenges.find(challenge => challenge.id === selectedNoSQLChallengeId);
    if (!selectedChallenge) {
        selectedNoSQLChallengeId = null;
        renderNoSQLHubPlaceholder();
    } else {
        renderNoSQLHubDetail(selectedChallenge);
    }
}

function openNoSQLHubChallenge(id) {
    const challenge = getNoSQLHubChallenges().find(item => item.id === id);
    if (!challenge) return;
    selectedNoSQLChallengeId = id;
    if (typeof window.loadNoSQLChallenge === 'function') {
        window.loadNoSQLChallenge(id, { focus: false });
    }
    renderNoSQLChallengeHub();
}

function runNoSQLHubChallenge() {
    const editor = document.getElementById('nosqlHubEditor');
    if (!editor) return;
    if (typeof window.runNoSQLChallengeCommand !== 'function') {
        showToast('warning', 'El motor NoSQL todavía no está disponible.');
        return;
    }

    const feedback = window.runNoSQLChallengeCommand(editor.value);
    if (!feedback) return;

    const container = document.getElementById('nosqlHubFeedback');
    if (container) {
        container.className = `challenge-result ${feedback.ok ? 'success' : 'error'}`;
        const solutionButton = feedback.canRevealSolution
            ? `<div class="challenge-result-actions">
                    <button type="button" class="btn-secondary" onclick="revealNoSQLHubSolution()">
                        <i class="fas fa-eye"></i> Ver solución
                    </button>
                </div>`
            : '';
        container.innerHTML = `<strong>${feedback.ok ? 'Reto completado' : 'Todavía no'}</strong><p>${escapeHtml(feedback.message)}</p>${solutionButton}`;
    }

    if (feedback.ok) {
        renderNoSQLHubList();
        const meta = document.querySelector('#nosqlHubChallengeDetail .challenge-detail-meta .text-muted');
        if (meta) meta.textContent = 'Completado';
    }
}

function revealNoSQLHubSolution() {
    const editor = document.getElementById('nosqlHubEditor');
    const challenge = getNoSQLHubChallenges().find(item => item.id === selectedNoSQLChallengeId);
    if (!editor || !challenge) return;
    editor.value = challenge.solution;
    editor.focus();
    showToast('info', 'Solución cargada. Pulsa «Comprobar reto» para validarla.');
}

function clearNoSQLHubEditor() {
    const editor = document.getElementById('nosqlHubEditor');
    if (!editor) return;
    editor.value = '';
    editor.focus();
}

function solveNoSQLChallengeInLab(id) {
    if (typeof window.loadNoSQLChallenge !== 'function') {
        showToast('warning', 'El laboratorio NoSQL todavía no está disponible.');
        return;
    }
    window.loadNoSQLChallenge(id, { focus: false });
    activateSection('nosql');
    const editor = document.getElementById('nosqlEditor');
    if (editor) editor.focus();
    showToast('info', 'Reto cargado en el laboratorio NoSQL.');
}

function openNoSQLLab() {
    activateSection('nosql');
}

function openNoSQLChallengesHub() {
    activateSection('challenges');
    activateChallengeTab('nosql');
}
