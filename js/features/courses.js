// Catálogo, evaluación y reproductor de cursos guiados.

function updateCourseCta() {
    const button = document.getElementById('pathCtaBtn');
    if (!button) return;
    const started = getCourses().some(course => hasCourseStarted(course));
    button.innerHTML = started
        ? 'Continuar cursos <i class="fas fa-arrow-right"></i>'
        : 'Explorar cursos <i class="fas fa-arrow-right"></i>';
}

function setCourseView(view) {
    currentCourseView = ['catalog', 'detail', 'player'].includes(view) ? view : 'catalog';
    const views = {
        catalog: document.getElementById('courseCatalogView'),
        detail: document.getElementById('courseDetailView'),
        player: document.getElementById('coursePlayerView')
    };
    Object.entries(views).forEach(([name, element]) => {
        if (!element) return;
        const active = name === currentCourseView;
        element.hidden = !active;
        element.classList.toggle('active', active);
    });
}

function renderCourseCatalog() {
    const container = document.getElementById('courseCatalogView');
    if (!container) return;

    const courses = getCourses();
    const profile = getLearningProfile();
    const nosqlProfile = getNoSQLCourseProfile();
    setCourseView('catalog');
    updateCourseCta();

    if (!courses.length) {
        container.innerHTML = '<div class="challenge-empty"><i class="fas fa-graduation-cap"></i><h3>No hay cursos disponibles.</h3><p>Vuelve a cargar la página para preparar el catálogo.</p></div>';
        return;
    }

    container.innerHTML = `
        <div class="course-catalog-hero">
            <div>
                <span class="course-eyebrow"><i class="fas fa-graduation-cap"></i> Aprende haciendo</span>
                <h3>Elige tu siguiente misión</h3>
                <p>Teoría breve, demostraciones, práctica, quiz, checkpoints y proyecto final. Tu progreso se guarda en cada dataset.</p>
            </div>
            <div class="course-catalog-dataset">
                <span>Datasets activos</span>
                <strong>SQL: ${escapeHtml(profile.name)}</strong>
                <small>NoSQL: ${escapeHtml(nosqlProfile?.name || getNoSQLActiveDatasetName())}</small>
            </div>
        </div>
        <div class="course-grid">
            ${courses.map(course => {
                const progress = getCourseProgress(course);
                const lessons = getCourseLessons(course);
                const isActive = currentCourseId === course.id;
                const started = hasCourseStarted(course);
                const completion = getCourseCompletionState(course);
                const status = getCourseStatusLabel(course, progress);
                const needsAssessment = progress.percent === 100 && !completion.complete;
                const cta = completion.complete
                    ? 'Repasar curso'
                    : needsAssessment
                        ? 'Completar curso'
                        : started
                            ? 'Continuar'
                            : 'Comenzar';
                const prerequisites = (course.prerequisites || []).length
                    ? `<span class="course-card-prerequisite">Después de ${escapeHtml(course.prerequisites.join(', '))}</span>`
                    : '';
                return `
                    <article class="course-card course-card-${escapeHtml(course.tone || 'blue')}${isActive ? ' is-active' : ''}">
                        <div class="course-card-top">
                            <span class="course-card-icon"><i class="fas ${escapeHtml(course.icon || 'fa-graduation-cap')}"></i></span>
                            <div class="course-card-badges">
                                ${course.recommended ? '<span class="course-card-recommended">Empieza aquí</span>' : ''}
                                <span class="challenge-level ${getLearningLevelClass(course.level)}">${escapeHtml(course.level)}</span>
                            </div>
                        </div>
                        <h3>${escapeHtml(course.title)}</h3>
                        <p class="course-card-subtitle">${escapeHtml(course.subtitle)}</p>
                        <p class="course-card-description">${escapeHtml(course.description)}</p>
                        <div class="course-card-meta">
                            <span><i class="fas fa-clock"></i> ${escapeHtml(course.duration)}</span>
                            <span><i class="fas fa-database"></i> ${course.track === 'nosql' ? 'NoSQL' : 'SQL'}</span>
                            <span><i class="fas fa-layer-group"></i> ${course.modules.length} módulos</span>
                            <span><i class="fas fa-list-check"></i> ${lessons.length} lecciones</span>
                        </div>
                        <div class="course-card-progress">
                            <div class="course-card-progress-head">
                                <span>${escapeHtml(status)}</span>
                                <strong>${progress.completed} de ${progress.total}</strong>
                            </div>
                            <div class="course-card-progress-track" role="progressbar" aria-label="Progreso de ${escapeHtml(course.title)}" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${progress.percent}">
                                <span style="width:${progress.percent}%"></span>
                            </div>
                        </div>
                        ${prerequisites}
                        <div class="course-card-actions">
                            <button type="button" class="btn-secondary" data-course-open="${escapeHtml(course.id)}">Ver temario</button>
                            <button type="button" class="btn-primary" ${needsAssessment ? `data-course-open="${escapeHtml(course.id)}"` : `data-course-start="${escapeHtml(course.id)}"`}>${cta} <i class="fas fa-arrow-right"></i></button>
                        </div>
                    </article>
                `;
            }).join('')}
        </div>
    `;

    container.querySelectorAll('[data-course-open]').forEach(button => {
        button.addEventListener('click', () => openCourse(button.dataset.courseOpen));
    });
    container.querySelectorAll('[data-course-start]').forEach(button => {
        button.addEventListener('click', () => startCourse(button.dataset.courseStart));
    });
}

function renderCourseAssessment(course) {
    const completion = getCourseCompletionState(course);
    const modules = course.modules || [];
    const checkpointRows = modules.map((module, index) => {
        const lessonsComplete = isModuleLessonsComplete(course, module);
        const passed = isModuleCheckpointPassed(course, module.id);
        const status = passed ? 'Superado' : lessonsComplete ? 'Listo para comprobar' : 'Completa las lecciones';
        return `
            <div class="course-checkpoint-row${passed ? ' passed' : ''}">
                <span class="course-checkpoint-index">${passed ? '<i class="fas fa-check"></i>' : index + 1}</span>
                <div class="course-checkpoint-copy">
                    <strong>${escapeHtml(module.title)}</strong>
                    <span>${status}</span>
                </div>
                <button type="button" class="btn-secondary btn-sm"
                    ${!lessonsComplete || passed ? 'disabled aria-disabled="true"' : ''}
                    onclick="openModuleCheckpoint('${escapeHtml(course.id)}', '${escapeHtml(module.id)}')">
                    ${passed ? 'Superado' : lessonsComplete ? 'Abrir' : 'Bloqueado'}
                </button>
            </div>
        `;
    }).join('');

    const criteria = course.finalProject?.criteria || [];
    const projectComplete = isCourseProjectCompleted(course);
    const projectMarkup = criteria.length ? `
        <div class="course-project-criteria">
            ${criteria.map((criterion, index) => `
                <label class="course-project-criterion">
                    <input type="checkbox" id="projectCriterion-${escapeHtml(course.id)}-${index}"
                        ${projectComplete ? 'checked disabled' : ''}>
                    <span>${escapeHtml(criterion)}</span>
                </label>
            `).join('')}
        </div>
        <button type="button" class="btn-primary btn-sm" ${projectComplete ? 'disabled' : ''} onclick="completeCourseProject('${escapeHtml(course.id)}')">
            <i class="fas fa-flag-checkered"></i> ${projectComplete ? 'Proyecto completado' : 'Marcar proyecto como completado'}
        </button>
    ` : '<p class="text-muted">Este curso no tiene criterios de proyecto.</p>';

    return `
        <div class="course-assessment-grid">
            <section class="course-assessment-card">
                <div class="course-assessment-head">
                    <div>
                        <span class="course-side-eyebrow"><i class="fas fa-circle-check"></i> Checkpoints de módulo</span>
                        <h4>${completion.checkpointsPassed} de ${completion.checkpointsTotal} superados</h4>
                    </div>
                    <span class="course-assessment-badge">${completion.checkpointsPassed === completion.checkpointsTotal ? 'Completo' : 'Pendiente'}</span>
                </div>
                <p>Completa las lecciones de cada módulo y supera su checkpoint de tres preguntas.</p>
                <div class="course-checkpoint-list">${checkpointRows || '<p class="text-muted">Este curso no tiene checkpoints.</p>'}</div>
            </section>
            <section class="course-assessment-card course-project-card">
                <div class="course-assessment-head">
                    <div>
                        <span class="course-side-eyebrow"><i class="fas fa-flag-checkered"></i> Proyecto final</span>
                        <h4>${escapeHtml(course.finalProject?.title || 'Proyecto final')}</h4>
                    </div>
                    <span class="course-assessment-badge${projectComplete ? ' is-complete' : ''}">${projectComplete ? 'Completado' : 'Pendiente'}</span>
                </div>
                <p>${escapeHtml(course.finalProject?.description || '')}</p>
                ${projectMarkup}
            </section>
        </div>
    `;
}

function openModuleCheckpoint(courseId, moduleId) {
    const course = getCourseById(courseId);
    const module = course?.modules?.find(item => item.id === moduleId);
    const questions = getModuleCheckpointQuestions(courseId, moduleId);
    const modal = document.getElementById('checkpointModal');
    const body = document.getElementById('checkpointBody');
    if (!course || !module || !modal || !body) return;
    if (!questions.length) {
        showToast('warning', 'Este checkpoint todavía no tiene preguntas.');
        return;
    }

    if (!isModuleLessonsComplete(course, module)) {
        showToast('info', 'Completa las lecciones del módulo antes de abrir su checkpoint.');
        return;
    }

    currentCheckpoint = { courseId, moduleId };
    document.getElementById('checkpointEyebrow').textContent = `${course.title} · ${module.title}`;
    document.getElementById('checkpointTitle').textContent = isModuleCheckpointPassed(course, moduleId)
        ? 'Checkpoint superado'
        : 'Checkpoint del módulo';

    if (isModuleCheckpointPassed(course, moduleId)) {
        body.innerHTML = `
            <div class="lesson-check-success">
                <i class="fas fa-circle-check"></i>
                <div>
                    <strong>Checkpoint superado</strong>
                    <p>Ya completaste esta comprobación. Puedes volver al temario para revisar el módulo.</p>
                </div>
            </div>
            <div class="lesson-step-actions">
                <button type="button" class="btn-secondary" onclick="closeCheckpointModal()">Cerrar</button>
            </div>
        `;
        openModal(modal);
        return;
    }

    const quizMarkup = questions.map((question, questionIndex) => `
        <fieldset class="lesson-quiz-question">
            <legend><span>${questionIndex + 1}</span> ${escapeHtml(question.question)}</legend>
            <div class="lesson-quiz-options">
                ${question.options.map((option, optionIndex) => `
                    <label class="lesson-quiz-option">
                        <input type="radio" name="checkpointQ${questionIndex}" value="${optionIndex}">
                        <span>${escapeHtml(option)}</span>
                    </label>
                `).join('')}
            </div>
        </fieldset>
    `).join('');

    body.innerHTML = `
        <div class="lesson-check-intro">
            <span class="course-side-eyebrow"><i class="fas fa-circle-check"></i> Checkpoint de ${escapeHtml(module.title)}</span>
            <p>Responde las ${questions.length} preguntas. Puedes reintentarlo sin perder el progreso de las lecciones.</p>
        </div>
        <form id="checkpointForm" class="lesson-quiz" onsubmit="submitModuleCheckpoint(event)">
            ${quizMarkup}
            <button type="submit" class="btn-primary">Comprobar checkpoint <i class="fas fa-arrow-right"></i></button>
        </form>
        <div id="checkpointResult" class="challenge-result" aria-live="polite" hidden></div>
    `;
    openModal(modal);
}

function submitModuleCheckpoint(event) {
    event.preventDefault();
    const form = event.currentTarget || document.getElementById('checkpointForm');
    const result = document.getElementById('checkpointResult');
    if (!currentCheckpoint || !form || !result) return;

    const course = getCourseById(currentCheckpoint.courseId);
    const questions = getModuleCheckpointQuestions(currentCheckpoint.courseId, currentCheckpoint.moduleId);
    const answers = questions.map((_, index) => (
        form.querySelector(`input[name="checkpointQ${index}"]:checked`)
    ));

    result.hidden = false;
    if (answers.some(answer => !answer)) {
        result.className = 'challenge-result warning';
        result.innerHTML = '<strong><i class="fas fa-circle-exclamation"></i> Faltan respuestas</strong> Responde todas las preguntas antes de comprobar.';
        return;
    }

    const wrong = answers
        .map((answer, index) => Number(answer.value) === questions[index].answer ? null : index)
        .filter(index => index !== null);

    if (wrong.length) {
        result.className = 'challenge-result error';
        result.innerHTML = `
            <strong><i class="fas fa-circle-xmark"></i> Revisa tus respuestas</strong>
            <p>Preguntas por revisar: ${wrong.map(index => index + 1).join(', ')}.</p>
            <ul>${wrong.map(index => `<li>${escapeHtml(questions[index].explanation)}</li>`).join('')}</ul>
        `;
        return;
    }

    markModuleCheckpointPassed(course, currentCheckpoint.moduleId);
    const courseId = currentCheckpoint.courseId;
    closeCheckpointModal();
    if (currentCourseView === 'detail' && currentCourseId === courseId) {
        renderCourseDetail(courseId);
    } else {
        renderCourseCatalog();
    }
    showToast('success', 'Checkpoint superado.');
}

function closeCheckpointModal() {
    currentCheckpoint = null;
    closeModal(document.getElementById('checkpointModal'));
}

function focusCourseAssessment() {
    const grid = document.querySelector('#courseDetailView .course-assessment-grid');
    if (!grid) return;
    if (typeof grid.scrollIntoView === 'function') {
        grid.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
    const firstAction = grid.querySelector('.course-checkpoint-row button:not([disabled])');
    if (firstAction) firstAction.focus();
}

function completeCourseProject(courseId) {
    const course = getCourseById(courseId);
    const criteria = course?.finalProject?.criteria || [];
    if (!course) return;
    if (!criteria.length) {
        showToast('warning', 'Este curso no tiene criterios de proyecto.');
        return;
    }

    const checked = criteria.map((_, index) => (
        document.getElementById(`projectCriterion-${courseId}-${index}`)?.checked
    ));
    if (checked.some(value => !value)) {
        showToast('warning', 'Marca todos los criterios del proyecto antes de completarlo.');
        return;
    }

    markCourseProjectCompleted(course, criteria);
    if (currentCourseView === 'detail' && currentCourseId === courseId) {
        renderCourseDetail(courseId);
    } else {
        renderCourseCatalog();
    }
    showToast('success', 'Proyecto final completado.');
}

function renderCourseDetail(courseId) {
    const container = document.getElementById('courseDetailView');
    const course = getCourseById(courseId);
    if (!container || !course) {
        showCourseCatalog();
        return;
    }

    currentCourseId = course.id;
    saveActiveCourse();
    updateCourseCta();
    setCourseView('detail');

    const progress = getCourseProgress(course);
    const completion = getCourseCompletionState(course);
    const needsAssessment = progress.percent === 100 && !completion.complete;
    const lessons = getCourseLessons(course);
    const lessonIndexById = new Map(lessons.map((lesson, index) => [lesson.id, index]));
    const moduleMarkup = course.modules.map((module, moduleIndex) => {
        const moduleLessons = (module.lessonIds || [])
            .map(id => lessons.find(lesson => lesson.id === id))
            .filter(Boolean);
        const completed = moduleLessons.filter(lesson => isCourseLessonCompleted(course, lesson.id)).length;
        return `
            <section class="course-module">
                <div class="course-module-head">
                    <div>
                        <span>Módulo ${moduleIndex + 1}</span>
                        <h4>${escapeHtml(module.title)}</h4>
                        <p>${escapeHtml(module.description || '')}</p>
                    </div>
                    <strong>${completed}/${moduleLessons.length}</strong>
                </div>
                <div class="course-module-lessons">
                    ${moduleLessons.map(lesson => {
                        const index = lessonIndexById.get(lesson.id) ?? 0;
                        const stages = getCourseLessonStages(course, lesson.id);
                        const done = stages.completed;
                        const status = done ? 'Completada' : stages.practiceCompleted ? 'Por comprobar' : 'Abrir';
                        return `
                            <button type="button" class="course-lesson-row${done ? ' completed' : ''}" data-course-lesson="${escapeHtml(lesson.id)}">
                                <span class="course-lesson-index">${done ? '<i class="fas fa-check"></i>' : index + 1}</span>
                                <span class="course-lesson-copy">
                                    <strong>${escapeHtml(lesson.title)}</strong>
                                    <span>${escapeHtml(lesson.level)} · Lección ${index + 1}</span>
                                </span>
                                <span class="course-lesson-status">${status}</span>
                            </button>
                        `;
                    }).join('')}
                </div>
            </section>
        `;
    }).join('');

    const practiceButtons = (course.practiceConcepts || []).length ? `
        <div class="course-practice-card">
            <span class="course-side-eyebrow"><i class="fas fa-bullseye"></i> Práctica recomendada</span>
            <p>Refuerza estos conceptos con práctica del dataset activo.</p>
            <div class="course-practice-buttons">
                ${course.practiceConcepts.map(concept => `
                    <button type="button" class="btn-ghost btn-sm" data-course-practice="${escapeHtml(concept)}">
                        ${escapeHtml(getConceptLabel(concept))} <i class="fas fa-arrow-right"></i>
                    </button>
                `).join('')}
            </div>
        </div>
    ` : '';

    const finalProject = course.finalProject || null;
    container.innerHTML = `
        <button type="button" class="course-back-btn" onclick="showCourseCatalog()">
            <i class="fas fa-arrow-left"></i> Volver a cursos
        </button>
        <div class="course-detail-hero course-detail-hero-${escapeHtml(course.tone || 'blue')}">
            <div class="course-detail-icon"><i class="fas ${escapeHtml(course.icon || 'fa-graduation-cap')}"></i></div>
            <div class="course-detail-copy">
                <span class="course-eyebrow">${course.recommended ? 'Curso recomendado' : 'Curso guiado'}</span>
                <h3>${escapeHtml(course.title)}</h3>
                <p>${escapeHtml(course.description)}</p>
                <div class="course-detail-meta">
                    <span class="challenge-level ${getLearningLevelClass(course.level)}">${escapeHtml(course.level)}</span>
                    <span><i class="fas fa-database"></i> ${course.track === 'nosql' ? 'NoSQL' : 'SQL'}</span>
                    <span><i class="fas fa-clock"></i> ${escapeHtml(course.duration)}</span>
                    <span><i class="fas fa-layer-group"></i> ${course.modules.length} módulos</span>
                    <span><i class="fas fa-list-check"></i> ${lessons.length} lecciones</span>
                </div>
                <p class="course-detail-flow"><i class="fas fa-bolt"></i> Cada lección combina teoría breve, demostración, práctica y comprobación; después, checkpoints y proyecto final.</p>
            </div>
            <div class="course-detail-score">
                <strong>${progress.percent}%</strong>
                <span>${progress.completed} de ${progress.total}</span>
            </div>
        </div>
        <div class="course-detail-grid">
            <section class="course-syllabus">
                <div class="course-syllabus-head">
                    <div>
                        <span class="course-side-eyebrow"><i class="fas fa-map"></i> Tu recorrido</span>
                        <h4>Temario</h4>
                    </div>
                    <span>${progress.completed} de ${progress.total} lecciones</span>
                </div>
                ${moduleMarkup}
            </section>
            <aside class="course-detail-side">
                <div class="course-outcomes">
                    <span class="course-side-eyebrow"><i class="fas fa-check-double"></i> Al terminar podrás</span>
                    <ul>${(course.outcomes || []).map(outcome => `<li>${escapeHtml(outcome)}</li>`).join('')}</ul>
                </div>
                ${practiceButtons}
                ${finalProject ? `
                    <div class="course-final-project">
                        <span class="course-side-eyebrow"><i class="fas fa-flag-checkered"></i> Proyecto final</span>
                        <h4>${escapeHtml(finalProject.title || 'Proyecto final')}</h4>
                        <p>${escapeHtml(finalProject.description || '')}</p>
                    </div>
                ` : ''}
            </aside>
        </div>
        ${renderCourseAssessment(course)}
        <div class="course-detail-actions">
            ${needsAssessment
                ? `<button type="button" class="btn-primary" onclick="focusCourseAssessment()">Completar evaluación <i class="fas fa-arrow-down"></i></button>`
                : `<button type="button" class="btn-primary" data-course-start="${escapeHtml(course.id)}">
                    ${completion.complete ? 'Repasar curso' : hasCourseStarted(course) ? 'Continuar curso' : 'Comenzar curso'} <i class="fas fa-arrow-right"></i>
                </button>`}
            <button type="button" class="btn-secondary" onclick="showCourseCatalog()">Elegir otro curso</button>
        </div>
    `;

    container.querySelectorAll('[data-course-lesson]').forEach(button => {
        button.addEventListener('click', () => startCourse(course.id, button.dataset.courseLesson));
    });
    container.querySelectorAll('[data-course-start]').forEach(button => {
        button.addEventListener('click', () => startCourse(course.id));
    });
    container.querySelectorAll('[data-course-practice]').forEach(button => {
        button.addEventListener('click', () => practiceCourseConcept(button.dataset.coursePractice));
    });
}

function showCourseCatalog() {
    activateSection('path');
    activatePathTab('lessons');
    renderCourseCatalog();
}

function openCourse(courseId) {
    const course = getCourseById(courseId);
    if (!course) return;
    activateSection('path');
    activatePathTab('lessons');
    renderCourseDetail(course.id);
}

function startCourse(courseId = currentCourseId, lessonId = null) {
    const course = getCourseById(courseId) || getActiveCourse();
    if (!course) return;

    activateSection('path');
    activatePathTab('lessons');
    currentCourseId = course.id;
    saveActiveCourse();
    const lessons = getCourseLessons(course);
    const requested = lessonId && lessons.some(lesson => lesson.id === lessonId) ? lessonId : null;
    const next = requested
        || lessons.find(lesson => !isCourseLessonCompleted(course, lesson.id))?.id
        || lessons[0]?.id
        || null;
    currentLearningLessonId = next;
    const nextLesson = lessons.find(lesson => lesson.id === next);
    currentLessonStep = nextLesson ? getDefaultLessonStep(course, nextLesson) : 'concept';
    setCourseView('player');
    renderCoursePlayer();
    const editor = document.getElementById('pathEditor');
    if (editor) editor.focus();
}

function refreshActiveCourseDataset() {
    const course = getActiveCourse();
    const pathSection = document.getElementById('section-path');
    const pathActive = pathSection?.classList.contains('active');
    if (currentCourseView === 'player') {
        if (pathActive && course?.track === 'nosql') {
            currentLearningLessonId = null;
            startCourse(course.id);
        }
        return;
    }
    if (currentCourseView === 'detail' && currentCourseId) {
        renderCourseDetail(currentCourseId);
        return;
    }
    renderCourseCatalog();
}

function renderCoursePlayer() {
    const course = getActiveCourse();
    const breadcrumb = document.getElementById('coursePlayerBreadcrumb');
    if (breadcrumb && course) {
        const lesson = getActiveCourseLessonById(currentLearningLessonId);
        breadcrumb.innerHTML = `
            <button type="button" class="course-back-btn" onclick="showCourseCatalog()">
                <i class="fas fa-arrow-left"></i> Cursos
            </button>
            <span class="course-breadcrumb-sep">/</span>
            <button type="button" class="course-back-btn" onclick="openCourse('${escapeHtml(course.id)}')">${escapeHtml(course.title)}</button>
            ${lesson ? `<span class="course-breadcrumb-sep">/</span><span>${escapeHtml(lesson.title)}</span>` : ''}
        `;
    }
    renderLearningPathList();
    renderLearningLessonDetail();
}

function practiceCourseConcept(conceptId) {
    const course = getActiveCourse();
    if (course) {
        currentCourseId = course.id;
        saveActiveCourse();
        const pendingLesson = getCourseLessons(course)
            .find(lesson => lesson.id === conceptId && !isCourseLessonCompleted(course, lesson.id));
        if (pendingLesson) {
            startCourse(course.id, pendingLesson.id);
            return;
        }
    }
    practiceLearningConcept(conceptId);
}
