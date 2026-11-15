// Lecciones guiadas, práctica, quiz y checkpoints.

function getDefaultLessonStep(course, lesson) {
    const stages = getCourseLessonStages(course, lesson.id);
    if (stages.completed) return 'concept';
    if (stages.practiceCompleted) return 'check';
    if (stages.theoryRead) return 'practice';
    return 'concept';
}

function renderLessonStepButton(step, number, label, icon, done, disabled = false) {
    const active = currentLessonStep === step;
    return `
        <button type="button" class="lesson-step${active ? ' active' : ''}${done ? ' completed' : ''}"
            data-lesson-step="${step}" role="tab" aria-selected="${active}" aria-controls="lessonStepContent"
            ${disabled ? 'disabled aria-disabled="true"' : ''}
            onclick="goToLessonStep('${step}')">
            <span class="lesson-step-number">${done ? '<i class="fas fa-check"></i>' : number}</span>
            <span class="lesson-step-label"><i class="fas ${icon}"></i> ${label}</span>
        </button>
    `;
}

function renderLessonConceptStep(lesson, course, stages) {
    const objectives = (lesson.objectives || []).map(item => `<li>${escapeHtml(item)}</li>`).join('');
    const theory = (lesson.theory || []).map(card => `
        <article class="lesson-theory-card">
            <h4>${escapeHtml(card.title)}</h4>
            <p>${escapeHtml(card.body)}</p>
            ${card.code ? `<pre><code>${escapeHtml(card.code)}</code></pre>` : ''}
        </article>
    `).join('');
    const mistakes = (lesson.commonMistakes || []).map(item => `
        <div class="lesson-mistake">
            <strong>${escapeHtml(item.mistake)}</strong>
            <p>${escapeHtml(item.fix)}</p>
        </div>
    `).join('');

    return `
        <div class="lesson-objectives">
            <span class="course-side-eyebrow"><i class="fas fa-bullseye"></i> Al terminar podrás</span>
            <ul>${objectives}</ul>
        </div>
        <div class="lesson-theory-grid">${theory}</div>
        <div class="lesson-demo-card">
            <div class="lesson-demo-head">
                <div>
                    <span class="course-side-eyebrow"><i class="fas fa-play"></i> Demostración guiada</span>
                    <p>Ejecuta el ejemplo y observa el resultado antes de escribir tu consulta.</p>
                </div>
                <button type="button" class="btn-secondary btn-sm" onclick="runLessonDemo()">
                    <i class="fas fa-play"></i> Ejecutar ejemplo
                </button>
            </div>
            <pre><code>${escapeHtml(lesson.demoQuery)}</code></pre>
            <p class="lesson-demo-note">${escapeHtml(lesson.demoNote)}</p>
            <div id="lessonDemoResult" class="lesson-demo-result" hidden></div>
        </div>
        ${mistakes ? `<div class="lesson-mistakes"><span class="course-side-eyebrow"><i class="fas fa-triangle-exclamation"></i> Errores comunes</span>${mistakes}</div>` : ''}
        <div class="lesson-step-actions">
            <button type="button" class="btn-primary" onclick="goToLessonStep('practice')">
                Continuar a la práctica <i class="fas fa-arrow-right"></i>
            </button>
            ${stages.theoryRead ? '' : `
                <button type="button" class="btn-ghost" onclick="markTheoryReadAndGoPractice()">
                    Ya conozco esto: ir a la práctica
                </button>
            `}
        </div>
    `;
}

function renderLessonPracticeStep(lesson, course, stages) {
    const isNoSQL = course?.track === 'nosql';
    const initialResult = stages.practiceCompleted
        ? '<strong><i class="fas fa-circle-check"></i> Práctica superada</strong> Puedes repetirla o continuar a la comprobación.'
        : `<strong><i class="fas fa-circle-info"></i> Listo para practicar</strong> ${isNoSQL ? 'Escribe un comando NoSQL' : 'Escribe tu consulta'} y pulsa «Comprobar lección».`;

    return `
        <div class="lesson-practice-intro">
            <span class="course-side-eyebrow"><i class="fas fa-laptop-code"></i> Tu turno</span>
            <h4>${escapeHtml(lesson.title)}</h4>
            <p>${escapeHtml(lesson.objective)}</p>
            <ul class="lesson-practice-checklist">
                <li>Revisa el concepto y la demostración si necesitas repasar.</li>
                <li>Completa la plantilla del editor con lo que pide la misión.</li>
                <li>Pulsa «Comprobar lección» y revisa el resultado.</li>
            </ul>
        </div>
        <div class="path-example">
            <div class="path-example-head">
                <span><i class="fas fa-code"></i> Ejemplo de apoyo</span>
                <button type="button" class="btn-ghost btn-sm" onclick="loadLearningExample()">
                    <i class="fas fa-arrow-down"></i> Usar ejemplo
                </button>
            </div>
            <pre><code>${escapeHtml(lesson.example)}</code></pre>
        </div>
        <label for="pathEditor" class="sr-only">${isNoSQL ? 'Comando NoSQL para la lección' : 'Consulta SQL para la lección'}</label>
        <textarea id="pathEditor" spellcheck="false" placeholder="${isNoSQL ? 'Escribe un comando NoSQL...' : 'Escribe tu consulta SQL aquí...'}">${escapeHtml(lesson.starter)}</textarea>
        <div class="challenge-actions">
            <button type="button" id="pathRunBtn" onclick="runLearningLesson()">
                <i class="fas fa-play"></i> Comprobar lección
            </button>
            <button type="button" id="pathHintBtn" class="btn-secondary" onclick="showLearningHint()">
                <i class="fas fa-lightbulb"></i> Ver pista
            </button>
            <button type="button" class="btn-secondary" onclick="clearLearningEditor()">
                <i class="fas fa-eraser"></i> Limpiar
            </button>
        </div>
        <div id="pathHint" class="challenge-hint" hidden>${escapeHtml(lesson.hint)}</div>
        <div id="pathResult" class="challenge-result" aria-live="polite">${initialResult}</div>
        <div id="pathNext" class="path-next" ${stages.practiceCompleted ? '' : 'hidden'}>
            ${stages.practiceCompleted ? '<button type="button" class="btn-primary" onclick="goToLessonStep(\'check\')">Ir a la comprobación <i class="fas fa-arrow-right"></i></button>' : ''}
        </div>
    `;
}

function renderLessonSummary(lesson) {
    return `
        <div class="lesson-summary-card">
            <span class="course-side-eyebrow"><i class="fas fa-bookmark"></i> Resumen</span>
            <ul>${(lesson.summary || []).map(item => `<li>${escapeHtml(item)}</li>`).join('')}</ul>
        </div>
    `;
}

function renderLessonCheckStep(lesson, course, lessons, stages, index) {
    if (!stages.practiceCompleted) {
        return '<div class="challenge-empty"><i class="fas fa-lock"></i><h3>Primero completa la práctica</h3><p>La comprobación se desbloquea cuando superas el laboratorio.</p></div>';
    }

    if (stages.completed) {
        return `
            ${renderLessonSummary(lesson)}
            <div class="lesson-check-success">
                <i class="fas fa-circle-check"></i>
                <div>
                    <strong>Lección completada</strong>
                    <p>Has leído el concepto, superado la práctica y aprobado la comprobación.</p>
                </div>
            </div>
            <div id="pathNext" class="path-next">
                ${getCourseNextMarkup(course, lessons, lesson)}
            </div>
        `;
    }

    const quiz = lesson.quiz || [];
    const quizMarkup = quiz.map((question, questionIndex) => `
        <fieldset class="lesson-quiz-question">
            <legend><span>${questionIndex + 1}</span> ${escapeHtml(question.question)}</legend>
            <div class="lesson-quiz-options">
                ${question.options.map((option, optionIndex) => `
                    <label class="lesson-quiz-option">
                        <input type="radio" name="lessonQuizQ${questionIndex}" value="${optionIndex}">
                        <span>${escapeHtml(option)}</span>
                    </label>
                `).join('')}
            </div>
        </fieldset>
    `).join('');

    return `
        <div class="lesson-check-intro">
            <span class="course-side-eyebrow"><i class="fas fa-circle-check"></i> Comprueba tu comprensión</span>
            <h4>${escapeHtml(lesson.title)}</h4>
            <p>Responde las ${quiz.length} preguntas. Si fallas alguna, puedes intentarlo de nuevo sin perder el progreso de la práctica.</p>
        </div>
        <form id="lessonQuizForm" class="lesson-quiz" onsubmit="submitLessonQuiz(event)">
            ${quizMarkup}
            <button type="submit" class="btn-primary">
                Comprobar respuestas <i class="fas fa-arrow-right"></i>
            </button>
        </form>
        <div id="lessonQuizResult" class="challenge-result" aria-live="polite" hidden></div>
        <p class="lesson-check-hint"><i class="fas fa-lock"></i> La siguiente lección se desbloquea al aprobar esta comprobación.</p>
    `;
}

function renderLessonStepContent(lesson, course, lessons, stages, index) {
    const container = document.getElementById('lessonStepContent');
    if (!container) return;
    if (currentLessonStep === 'practice') {
        container.innerHTML = renderLessonPracticeStep(lesson, course, stages);
    } else if (currentLessonStep === 'check') {
        container.innerHTML = renderLessonCheckStep(lesson, course, lessons, stages, index);
    } else {
        container.innerHTML = renderLessonConceptStep(lesson, course, stages);
    }
}

function renderLearningLessonDetail() {
    const detail = document.getElementById('pathLessonDetail');
    if (!detail) return;

    const course = getActiveCourse();
    const lessons = course ? getCourseLessons(course) : getLearningLessons();
    const lesson = lessons.find(item => item.id === currentLearningLessonId);
    if (!lesson) {
        detail.innerHTML = `
            <div class="challenge-empty">
                <i class="fas fa-graduation-cap"></i>
                <h3>Elige una lección</h3>
                <p>Selecciona una lección del curso para empezar a practicar.</p>
            </div>
        `;
        return;
    }

    if (course?.track !== 'nosql') {
        const profile = getLearningProfile();
        const tables = dbInitialized && typeof getUserTables === 'function' ? getUserTables() : [];
        if (tables.length > 0 && !tables.includes(profile.mainTable)) {
            detail.innerHTML = `
                <div class="challenge-empty">
                    <i class="fas fa-database"></i>
                    <h3>Dataset no compatible</h3>
                    <p>El curso de ${escapeHtml(profile.name)} necesita la tabla <code>${escapeHtml(profile.mainTable)}</code>. Cambia de dataset o reinicia la base para practicar.</p>
                </div>
            `;
            return;
        }
    }

    const index = lessons.findIndex(item => item.id === lesson.id);
    const stages = getCourseLessonStages(course, lesson.id);
    if (currentLessonStep === 'check' && !stages.practiceCompleted) currentLessonStep = 'practice';
    const module = getCourseModuleForLesson(course, lesson.id);
    const completed = stages.completed;

    detail.innerHTML = `
        <div class="challenge-detail-header">
            <div>
                <span class="course-lesson-eyebrow">${escapeHtml(course?.title || 'Curso')}${module ? ` · ${escapeHtml(module.title)}` : ''}</span>
                <h3>${index + 1}. ${escapeHtml(lesson.title)}</h3>
                <div class="challenge-detail-meta">
                    <span class="challenge-level ${getLearningLevelClass(lesson.level)}">${escapeHtml(lesson.level)}</span>
                    <span class="text-muted">Lección ${index + 1} de ${lessons.length}</span>
                    <span id="pathLessonStatus" class="path-completed-badge" ${completed ? '' : 'hidden'}><i class="fas fa-check"></i> Completada</span>
                </div>
            </div>
        </div>
        <div class="lesson-stepper" role="tablist" aria-label="Pasos de la lección">
            ${renderLessonStepButton('concept', 1, 'Concepto', 'fa-book-open', stages.theoryRead)}
            ${renderLessonStepButton('practice', 2, 'Práctica', 'fa-laptop-code', stages.practiceCompleted)}
            ${renderLessonStepButton('check', 3, 'Comprobación', 'fa-circle-check', stages.quizPassed, !stages.practiceCompleted)}
        </div>
        <div id="lessonStepContent" role="tabpanel"></div>
    `;

    detail.querySelectorAll('[data-lesson-step]').forEach(button => {
        button.addEventListener('click', () => goToLessonStep(button.dataset.lessonStep));
    });
    renderLessonStepContent(lesson, course, lessons, stages, index);
}

function goToLessonStep(step) {
    const course = getActiveCourse();
    const lesson = getActiveCourseLessonById(currentLearningLessonId);
    if (!lesson) return;
    const stages = getCourseLessonStages(course, lesson.id);
    if (step === 'check' && !stages.practiceCompleted) {
        showToast('info', 'Completa la práctica antes de abrir la comprobación.');
        return;
    }
    if (step === 'practice' && !stages.theoryRead) {
        markCourseLessonTheoryRead(course, lesson.id);
    }
    currentLessonStep = ['concept', 'practice', 'check'].includes(step) ? step : 'concept';
    renderLearningLessonDetail();
}

function markTheoryReadAndGoPractice() {
    const course = getActiveCourse();
    const lesson = getActiveCourseLessonById(currentLearningLessonId);
    if (!lesson) return;
    markCourseLessonTheoryRead(course, lesson.id);
    currentLessonStep = 'practice';
    renderLearningLessonDetail();
}

function renderLessonDemoSets(sets) {
    const set = sets?.[0];
    if (!set || !Array.isArray(set.values) || set.values.length === 0) {
        return '<p class="lesson-demo-empty">El ejemplo no devolvió filas.</p>';
    }
    const rows = set.values.slice(0, 6);
    return `
        <div class="lesson-demo-table-wrap">
            <table>
                <thead><tr>${set.columns.map(column => `<th>${escapeHtml(column)}</th>`).join('')}</tr></thead>
                <tbody>${rows.map(row => `<tr>${row.map(value => `<td>${escapeHtml(value === null ? '' : String(value))}</td>`).join('')}</tr>`).join('')}</tbody>
            </table>
        </div>
        ${set.values.length > rows.length ? `<p class="lesson-demo-more">Mostrando ${rows.length} de ${set.values.length} filas.</p>` : ''}
    `;
}

function runLessonDemo() {
    const result = document.getElementById('lessonDemoResult');
    const lesson = getActiveCourseLessonById(currentLearningLessonId);
    const course = getActiveCourse();
    if (!result || !lesson) return;

    try {
        if (course?.track === 'nosql') {
            if (!window.NoSQL || !window.NOSQL_DATASETS) throw new Error('El motor NoSQL no está disponible.');
            const command = window.NoSQL.createDatabase(window.NOSQL_DATASETS[getNoSQLActiveDatasetName()]);
            const output = window.NoSQL.executeCommand(command, lesson.demoQuery);
            const documents = output.documents || (output.document ? [output.document] : []);
            result.innerHTML = `<pre>${escapeHtml(JSON.stringify(documents.slice(0, 5), null, 2))}</pre>`;
        } else {
            if (!dbInitialized || !db) throw new Error('La base de datos aún no está lista.');
            if (!isReadOnlyQuery(lesson.demoQuery)) throw new Error('La demostración debe ser una consulta de lectura.');
            result.innerHTML = renderLessonDemoSets(db.exec(lesson.demoQuery));
        }
        result.hidden = false;
    } catch (error) {
        result.hidden = false;
        result.innerHTML = `<p class="lesson-demo-error">${escapeHtml(error.message || String(error))}</p>`;
    }
}

function renderLearningPath() {
    renderLearningPathList();
    renderLearningLessonDetail();
}

function refreshLearningPath(options = {}) {
    const course = getActiveCourse();
    if (!course) {
        renderCourseCatalog();
        return;
    }

    const player = document.getElementById('coursePlayerView');
    if (player && player.hidden) {
        if (currentCourseView === 'detail') {
            renderCourseDetail(course.id);
        } else {
            renderCourseCatalog();
        }
        return;
    }

    const lessons = getCourseLessons(course);
    if (options.selectFirst || !lessons.some(lesson => lesson.id === currentLearningLessonId)) {
        const next = lessons.find(lesson => !isCourseLessonCompleted(course, lesson.id)) || lessons[0];
        currentLearningLessonId = next?.id || null;
        currentLessonStep = next ? getDefaultLessonStep(course, next) : 'concept';
    }
    renderCoursePlayer();
}

function initLearningPath() {
    loadLearningPathProgress();
    loadNoSQLCourseProgress();
    loadCourseAssessment();
    currentCourseId = loadActiveCourse()
        || getCourses().find(course => course.recommended)?.id
        || getCourses()[0]?.id
        || null;
    currentLearningLessonId = null;
    currentCourseView = 'catalog';
    renderCourseCatalog();
    activatePathTab('lessons');

    if (learningPathEventsBound) return;
    learningPathEventsBound = true;

    document.querySelectorAll('.path-tab').forEach(tab => {
        tab.addEventListener('click', () => activatePathTab(tab.dataset.pathTab));
        tab.addEventListener('keydown', event => {
            if (event.key !== 'ArrowRight' && event.key !== 'ArrowLeft') return;
            const tabs = Array.from(document.querySelectorAll('.path-tab'));
            const index = tabs.indexOf(tab);
            if (index === -1) return;
            event.preventDefault();
            const offset = event.key === 'ArrowRight' ? 1 : -1;
            const nextTab = tabs[(index + offset + tabs.length) % tabs.length];
            nextTab.focus();
            activatePathTab(nextTab.dataset.pathTab);
        });
    });

    const nosqlSelector = document.getElementById('nosqlDatasetSelector');
    if (nosqlSelector) {
        nosqlSelector.addEventListener('change', () => {
            syncCourseDatasetControls();
            setTimeout(refreshActiveCourseDataset, 0);
        });
    }

    document.addEventListener('keydown', event => {
        if (event.target?.id !== 'pathEditor') return;
        if ((event.ctrlKey || event.metaKey) && event.key === 'Enter') {
            event.preventDefault();
            runLearningLesson();
        }
    });

    setTimeout(() => {
        syncCourseDatasetControls();
        refreshActiveCourseDataset();
    }, 0);
}

function selectLearningLesson(id) {
    const course = getActiveCourse();
    const lessons = course ? getCourseLessons(course) : getLearningLessons();
    if (!lessons.some(lesson => lesson.id === id)) {
        const targetCourse = getCourseForLesson(id);
        if (!targetCourse) return;
        startCourse(targetCourse.id, id);
        return;
    }
    const changed = currentLearningLessonId !== id;
    currentLearningLessonId = id;
    if (changed) {
        const lesson = lessons.find(item => item.id === id);
        currentLessonStep = lesson ? getDefaultLessonStep(course, lesson) : 'concept';
    }
    renderCoursePlayer();
    const editor = document.getElementById('pathEditor');
    if (editor) editor.focus();
}

function setLearningResult(type, html) {
    const result = document.getElementById('pathResult');
    if (!result) return;
    result.className = `challenge-result ${type}`;
    result.innerHTML = html;
}

function resetLearningResult() {
    const result = document.getElementById('pathResult');
    if (!result) return;
    const isNoSQL = getActiveCourse()?.track === 'nosql';
    result.className = 'challenge-result';
    result.innerHTML = `<strong><i class="fas fa-circle-info"></i> Listo para practicar</strong> ${isNoSQL ? 'Escribe un comando NoSQL' : 'Escribe tu consulta'} y pulsa «Comprobar lección».`;
}

function learningComparisonMessage(comparison) {
    if (comparison.reason === 'columns') {
        return `Se esperaban ${comparison.expectedColumns} columnas y tu consulta devolvió ${comparison.actualColumns}. Revisa el SELECT.`;
    }
    if (comparison.reason === 'rows') {
        return `Se esperaban ${comparison.expectedRows} filas y tu consulta devolvió ${comparison.actualRows}. Revisa el filtro, el JOIN o el LIMIT.`;
    }
    if (comparison.reason === 'values') {
        return 'Las filas y columnas coinciden, pero los valores no. Revisa el orden, los cálculos o las columnas seleccionadas.';
    }
    if (comparison.reason === 'no_result') {
        return 'Tu consulta no devolvió un conjunto de resultados.';
    }
    return 'Todavía no coincide con el resultado esperado.';
}

function showPracticeNext() {
    const container = document.getElementById('pathNext');
    if (!container) return;
    container.hidden = false;
    container.innerHTML = '<button type="button" class="btn-primary" onclick="goToLessonStep(\'check\')">Ir a la comprobación <i class="fas fa-arrow-right"></i></button>';
}

function submitLessonQuiz(event) {
    event.preventDefault();
    const course = getActiveCourse();
    const lesson = getActiveCourseLessonById(currentLearningLessonId);
    const form = event.currentTarget || document.getElementById('lessonQuizForm');
    const result = document.getElementById('lessonQuizResult');
    if (!lesson || !form || !result) return;

    const quiz = lesson.quiz || [];
    const answers = quiz.map((_, index) => (
        form.querySelector(`input[name="lessonQuizQ${index}"]:checked`)
    ));

    result.hidden = false;
    if (answers.some(answer => !answer)) {
        result.className = 'challenge-result warning';
        result.innerHTML = '<strong><i class="fas fa-circle-exclamation"></i> Faltan respuestas</strong> Responde todas las preguntas antes de comprobar.';
        return;
    }

    const wrong = answers
        .map((answer, index) => Number(answer.value) === quiz[index].answer ? null : index)
        .filter(index => index !== null);

    if (wrong.length) {
        result.className = 'challenge-result error';
        result.innerHTML = `
            <strong><i class="fas fa-circle-xmark"></i> Revisa tus respuestas</strong>
            <p>Preguntas por revisar: ${wrong.map(index => index + 1).join(', ')}.</p>
            <ul>${wrong.map(index => `<li>${escapeHtml(quiz[index].explanation)}</li>`).join('')}</ul>
        `;
        return;
    }

    markCourseLessonQuizPassed(course, lesson.id);
    renderLearningPathList();
    renderLearningLessonDetail();
    showToast('success', '¡Lección completada!');
}

function showLearningNext(lesson) {
    const container = document.getElementById('pathNext');
    if (!container) return;
    const course = getActiveCourse();
    const lessons = course ? getCourseLessons(course) : getLearningLessons();
    container.hidden = false;
    container.innerHTML = getCourseNextMarkup(course, lessons, lesson);
}

function runNoSQLCourseLesson() {
    const course = getActiveCourse();
    const lesson = course?.track === 'nosql'
        ? getCourseLessons(course).find(item => item.id === currentLearningLessonId)
        : null;
    const editor = document.getElementById('pathEditor');
    if (!lesson || !editor) return;

    const query = editor.value.trim();
    if (!query) {
        setLearningResult('warning', '<strong><i class="fas fa-circle-exclamation"></i> Falta el comando</strong> Escribe un comando NoSQL antes de comprobarlo.');
        return;
    }
    if (!window.NoSQL || !window.NOSQL_DATASETS) {
        setLearningResult('warning', '<strong><i class="fas fa-hourglass-half"></i> Motor NoSQL no disponible</strong> Recarga la página e inténtalo de nuevo.');
        return;
    }

    let command = null;
    try {
        command = window.NoSQL.parseCommand(query);
    } catch (error) {
        setLearningResult('error', `
            <strong><i class="fas fa-circle-exclamation"></i> Comando no válido</strong>
            <code>${escapeHtml(error.message || String(error))}</code>
        `);
        return;
    }

    const method = command.methods?.[0]?.name;
    if (!['find', 'findOne', 'aggregate'].includes(method)) {
        setLearningResult('warning', '<strong><i class="fas fa-lock"></i> Solo lectura</strong> El curso solo permite <code>find</code>, <code>findOne</code> y <code>aggregate</code>.');
        return;
    }

    try {
        const dataset = window.NOSQL_DATASETS[getNoSQLActiveDatasetName()];
        const state = window.NoSQL.createDatabase(dataset);
        const expected = window.NoSQL.executeCommand(state, lesson.expectedQuery);
        const actual = window.NoSQL.executeCommand(state, query);
        const comparison = compareNoSQLCourseResults(expected, actual);

        if (comparison.ok) {
            markCourseLessonPracticeCompleted(course, lesson.id);
            const stages = getCourseLessonStages(course, lesson.id);
            renderLearningPathList();
            const status = document.getElementById('pathLessonStatus');
            if (status) status.hidden = !stages.completed;
            setLearningResult('success', `
                <strong><i class="fas fa-circle-check"></i> ${stages.completed ? 'Lección completada' : 'Práctica superada'}</strong>
                ${stages.completed ? 'Ya puedes continuar con la siguiente lección.' : 'Tu comando devuelve los documentos esperados. Ahora completa la comprobación.'}
            `);
            showPracticeNext();
            showToast('success', stages.completed ? 'Lección completada.' : 'Práctica superada. Te falta la comprobación.');
            return;
        }

        setLearningResult('error', `
            <strong><i class="fas fa-circle-xmark"></i> Todavía no</strong>
            ${escapeHtml(comparison.message)}
        `);
    } catch (error) {
        setLearningResult('error', `
            <strong><i class="fas fa-circle-exclamation"></i> Error en el comando</strong>
            <code>${escapeHtml(error.message || String(error))}</code>
        `);
    }
}

function runLearningLesson(database = db, initialized = dbInitialized) {
    const course = getActiveCourse();
    if (course?.track === 'nosql') {
        runNoSQLCourseLesson();
        return;
    }

    const lesson = getLearningLessonById(currentLearningLessonId);
    const editor = document.getElementById('pathEditor');
    if (!lesson || !editor) return;

    const query = editor.value.trim();
    if (!query) {
        setLearningResult('warning', '<strong><i class="fas fa-circle-exclamation"></i> Falta la consulta</strong> Escribe una consulta antes de comprobarla.');
        return;
    }
    if (!isReadOnlyQuery(query)) {
        setLearningResult('warning', '<strong><i class="fas fa-lock"></i> Solo lectura</strong> El curso solo permite consultas <code>SELECT</code> o <code>WITH</code>.');
        return;
    }
    if (!initialized || !database) {
        setLearningResult('warning', '<strong><i class="fas fa-hourglass-half"></i> Base de datos no disponible</strong> Espera a que termine de inicializarse e inténtalo de nuevo.');
        return;
    }

    try {
        const expected = database.exec(lesson.expectedSql);
        const actual = database.exec(query);
        const comparison = compareChallengeResults(expected, actual, lesson.ordered);

        if (comparison.ok) {
            markCourseLessonPracticeCompleted(course, lesson.id);
            const stages = getCourseLessonStages(course, lesson.id);
            renderLearningPathList();
            const status = document.getElementById('pathLessonStatus');
            if (status) status.hidden = !stages.completed;
            setLearningResult('success', `
                <strong><i class="fas fa-circle-check"></i> ${stages.completed ? 'Lección completada' : 'Práctica superada'}</strong>
                ${stages.completed ? 'Ya puedes continuar con la siguiente lección.' : 'Tu consulta devuelve el resultado esperado. Ahora completa la comprobación.'}
            `);
            showPracticeNext();
            showToast('success', stages.completed ? 'Lección completada.' : 'Práctica superada. Te falta la comprobación.');
            return;
        }

        setLearningResult('error', `
            <strong><i class="fas fa-circle-xmark"></i> Todavía no</strong>
            ${escapeHtml(learningComparisonMessage(comparison))}
        `);
    } catch (error) {
        setLearningResult('error', `
            <strong><i class="fas fa-circle-exclamation"></i> Error en la consulta</strong>
            <code>${escapeHtml(error.message || String(error))}</code>
        `);
    }
}

function nextLearningLesson() {
    const course = getActiveCourse();
    const lessons = course ? getCourseLessons(course) : getLearningLessons();
    const index = lessons.findIndex(lesson => lesson.id === currentLearningLessonId);
    const next = lessons[index + 1];
    if (next) {
        selectLearningLesson(next.id);
    } else {
        showToast('success', course ? '¡Has llegado al final del curso!' : '¡Has llegado al final de la ruta!');
    }
}

function showLearningHint() {
    const hint = document.getElementById('pathHint');
    const button = document.getElementById('pathHintBtn');
    if (!hint) return;
    hint.hidden = !hint.hidden;
    if (button) {
        button.innerHTML = hint.hidden
            ? '<i class="fas fa-lightbulb"></i> Ver pista'
            : '<i class="fas fa-eye-slash"></i> Ocultar pista';
    }
}

function clearLearningEditor() {
    const editor = document.getElementById('pathEditor');
    if (!editor) return;
    editor.value = '';
    resetLearningResult();
    editor.focus();
}

function loadLearningExample() {
    const course = getActiveCourse();
    const lesson = course?.track === 'nosql'
        ? getCourseLessons(course).find(item => item.id === currentLearningLessonId)
        : getLearningLessonById(currentLearningLessonId);
    const editor = document.getElementById('pathEditor');
    if (!lesson || !editor) return;
    editor.value = lesson.example;
    resetLearningResult();
    editor.focus();
    showToast('info', 'Ejemplo cargado en el editor.');
}

function resetLearningProgress() {
    const course = getActiveCourse();
    const isNoSQL = course?.track === 'nosql';
    const datasetName = isNoSQL ? getNoSQLActiveDatasetName() : getLearningDatasetName();
    const datasetLabel = isNoSQL
        ? (getNoSQLCourseProfile(datasetName)?.name || datasetName)
        : getLearningProfile().name;
    const scope = course ? `el curso ${course.title}` : `la ruta de ${datasetLabel}`;
    if (!confirm(`¿Reiniciar tu progreso de ${scope} en ${datasetLabel}?`)) return;

    if (isNoSQL) {
        const datasetProgress = nosqlCourseProgress[datasetName];
        if (datasetProgress) {
            getCourseLessonIds(course).forEach(id => delete datasetProgress[id]);
            if (!Object.keys(datasetProgress).length) delete nosqlCourseProgress[datasetName];
        }
        saveNoSQLCourseProgress();
    } else if (course) {
        const datasetProgress = learningPathProgress[datasetName];
        if (datasetProgress) {
            getCourseLessonIds(course).forEach(id => delete datasetProgress[id]);
            if (!Object.keys(datasetProgress).length) delete learningPathProgress[datasetName];
        }
        saveLearningPathProgress();
    } else {
        delete learningPathProgress[datasetName];
        saveLearningPathProgress();
    }

    currentLearningLessonId = null;
    if (course) {
        const lessons = getCourseLessons(course);
        const nextLesson = lessons.find(lesson => !isCourseLessonCompleted(course, lesson.id)) || lessons[0] || null;
        currentLearningLessonId = nextLesson?.id || null;
        currentLessonStep = nextLesson ? getDefaultLessonStep(course, nextLesson) : 'concept';
        renderCoursePlayer();
    } else {
        refreshLearningPath({ selectFirst: true });
    }
    showToast('info', `Progreso de ${scope} en ${datasetLabel} reiniciado.`);
}
