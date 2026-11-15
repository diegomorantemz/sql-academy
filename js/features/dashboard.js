// Lista de la ruta y dashboard de progreso.

function formatLearningActivityDate(value) {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return '';
    const today = new Date();
    if (date.toDateString() === today.toDateString()) return 'Hoy';
    return date.toLocaleDateString('es-ES', { day: '2-digit', month: 'short' });
}

function renderLearningPathList() {
    const list = document.getElementById('pathLessonList');
    if (!list) return;

    const course = getActiveCourse();
    const lessons = course ? getCourseLessons(course) : getLearningLessons();
    const stats = course ? getCourseProgress(course) : getLearningProgressStats();
    const progressText = document.getElementById('pathProgressText');
    const progressBar = document.getElementById('pathProgressBar');
    const progressTrack = document.getElementById('pathProgressTrack');
    const progressLabel = document.getElementById('pathCourseProgressLabel');
    const datasetLabel = document.getElementById('pathDatasetLabel');

    if (progressText) progressText.textContent = `${stats.completed} de ${stats.total}`;
    if (progressBar) progressBar.style.width = `${stats.percent}%`;
    if (progressTrack) {
        progressTrack.setAttribute('aria-valuenow', String(stats.percent));
        progressTrack.setAttribute('aria-label', course ? `Progreso de ${course.title}` : 'Progreso del curso');
    }
    if (progressLabel) progressLabel.textContent = course ? 'Progreso del curso' : 'Tu progreso';
    if (datasetLabel) datasetLabel.textContent = getCourseDatasetLabel(course);

    if (!lessons.length) {
        list.innerHTML = '<p class="text-muted">Este curso no tiene lecciones disponibles.</p>';
        return;
    }

    if (!currentLearningLessonId || !lessons.some(lesson => lesson.id === currentLearningLessonId)) {
        const next = lessons.find(lesson => !isCourseLessonCompleted(course, lesson.id)) || lessons[0];
        currentLearningLessonId = next.id;
        currentLessonStep = getDefaultLessonStep(course, next);
    }

    const renderLessonRow = lesson => {
        const index = lessons.findIndex(item => item.id === lesson.id);
        const stages = getCourseLessonStages(course, lesson.id);
        const completed = stages.completed;
        const active = lesson.id === currentLearningLessonId;
        const status = completed ? 'Completada' : stages.practiceCompleted ? 'Por comprobar' : (active ? 'En curso' : 'Pendiente');
        return `
            <button type="button" class="challenge-card path-step${active ? ' active' : ''}${completed ? ' completed' : ''}" data-learning-lesson="${escapeHtml(lesson.id)}" aria-pressed="${active}">
                <span class="challenge-card-title">
                    <span class="path-step-index">${completed ? '<i class="fas fa-check"></i>' : index + 1}</span>
                    <span class="path-step-title">${escapeHtml(lesson.title)}</span>
                </span>
                <span class="challenge-card-meta">
                    <span class="challenge-level ${getLearningLevelClass(lesson.level)}">${escapeHtml(lesson.level)}</span>
                    <span>${status}</span>
                </span>
            </button>
        `;
    };

    if (course) {
        list.innerHTML = course.modules.map(module => {
            const moduleLessons = (module.lessonIds || [])
                .map(id => lessons.find(lesson => lesson.id === id))
                .filter(Boolean);
            const completed = moduleLessons.filter(lesson => isCourseLessonCompleted(course, lesson.id)).length;
            return `
                <div class="course-lesson-group">
                    <div class="course-lesson-group-head">
                        <span>${escapeHtml(module.title)}</span>
                        <span>${completed}/${moduleLessons.length}</span>
                    </div>
                    ${moduleLessons.map(renderLessonRow).join('')}
                </div>
            `;
        }).join('');
    } else {
        list.innerHTML = lessons.map(renderLessonRow).join('');
    }

    list.querySelectorAll('[data-learning-lesson]').forEach(button => {
        button.addEventListener('click', () => selectLearningLesson(button.dataset.learningLesson));
    });

    updateCourseCta();
    renderLearningProgressDashboard();
}

function renderCourseProgressSection() {
    const courses = getCourses();
    if (!courses.length) return '';
    return `
        <div class="progress-section course-progress-section">
            <div class="progress-section-head">
                <div>
                    <h3>Tus cursos</h3>
                    <p>Avance de cada itinerario con sus datasets activos.</p>
                </div>
                <button type="button" class="btn-secondary" onclick="showCourseCatalog()">
                    Ver cursos <i class="fas fa-arrow-right"></i>
                </button>
            </div>
            <div class="progress-course-grid">
                ${courses.map(course => {
                    const progress = getCourseProgress(course);
                    const status = getCourseStatusLabel(course, progress);
                    return `
                        <button type="button" class="progress-course-card" onclick="openCourse('${escapeHtml(course.id)}')">
                            <span class="progress-course-icon"><i class="fas ${escapeHtml(course.icon || 'fa-graduation-cap')}"></i></span>
                            <span class="progress-course-copy">
                                <strong>${escapeHtml(course.title)}</strong>
                                <span>${progress.completed} de ${progress.total} lecciones · ${status}</span>
                                <span class="progress-course-track" role="progressbar" aria-label="${escapeHtml(course.title)}" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${progress.percent}">
                                    <span style="width:${progress.percent}%"></span>
                                </span>
                            </span>
                            <span class="progress-course-percent">${progress.percent}%</span>
                        </button>
                    `;
                }).join('')}
            </div>
        </div>
    `;
}

function renderLearningProgressDashboard() {
    const container = document.getElementById('learningProgressDashboard');
    if (!container) return;

    const globalStats = getLearningGlobalStats();
    const conceptStats = getLearningConceptStats();
    const recommendation = getLearningRecommendation();
    const activity = getRecentLearningActivity();
    const dominated = conceptStats.filter(concept => concept.percent === 100).length;
    const started = conceptStats.filter(concept => concept.percent > 0).length;
    const profile = getLearningProfile();
    const conceptLibrary = getConceptMasteryStats();
    const sqlCourseCount = getCourses().filter(course => course.track !== 'nosql').length;

    const metrics = [
        {
            label: 'Lecciones SQL',
            value: `${globalStats.lessonsCompleted}/${globalStats.lessonsTotal}`,
            icon: 'fa-book-open',
            tone: 'tone-blue',
            hint: `${globalStats.lessonsTotal} lecciones en ${sqlCourseCount} cursos SQL`
        },
        {
            label: 'Retos',
            value: `${globalStats.challengesCompleted}/${globalStats.challengesTotal}`,
            icon: 'fa-trophy',
            tone: 'tone-amber',
            hint: 'Retos SQL'
        },
        {
            label: 'Actividades',
            value: `${globalStats.completed}/${globalStats.total}`,
            icon: 'fa-list-check',
            tone: 'tone-green',
            hint: 'Lecciones + retos'
        },
        {
            label: 'Conceptos de cursos',
            value: `${dominated}/${conceptStats.length}`,
            icon: 'fa-graduation-cap',
            tone: 'tone-violet',
            hint: 'Al 100%'
        }
    ];

    container.innerHTML = `
        <div class="progress-hero">
            <div class="progress-hero-copy">
                <span class="progress-eyebrow"><i class="fas fa-chart-simple"></i> Tu mapa de habilidades</span>
                <h3>Progreso global</h3>
                <p>Dataset activo: <strong>${escapeHtml(profile.name)}</strong>. Has completado ${globalStats.completed} de ${globalStats.total} actividades entre lecciones y retos de los tres datasets SQL.</p>
                <div class="progress-hero-bar" role="progressbar" aria-label="Progreso global" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${globalStats.percent}">
                    <span style="width:${globalStats.percent}%"></span>
                </div>
            </div>
            <div class="progress-hero-score">
                <strong>${globalStats.percent}%</strong>
                <span>global</span>
            </div>
        </div>

        ${renderSkillProfileCards()}

        ${renderCourseProgressSection()}

        <div class="progress-recommendation progress-recommendation-${recommendation.kind}">
            <span class="progress-recommendation-icon"><i class="fas ${recommendation.icon}"></i></span>
            <div class="progress-recommendation-copy">
                <span>Siguiente paso recomendado</span>
                <strong>${escapeHtml(recommendation.title)}</strong>
                <p>${escapeHtml(recommendation.message)}</p>
            </div>
            <button type="button" class="btn-primary" onclick="${recommendation.onclick}">
                ${escapeHtml(recommendation.action)} <i class="fas fa-arrow-right"></i>
            </button>
        </div>

        <div class="progress-summary">
            ${metrics.map(metric => `
                <div class="analyze-metric">
                    <span class="analyze-metric-icon ${metric.tone}"><i class="fas ${metric.icon}"></i></span>
                    <div>
                        <span class="analyze-metric-value">${metric.value}</span>
                        <span class="analyze-metric-label">${metric.label}</span>
                        <span class="analyze-metric-hint">${metric.hint}</span>
                    </div>
                </div>
            `).join('')}
        </div>

        <div class="progress-section">
            <div class="progress-section-head">
                <div>
                    <h3>Dominio por concepto</h3>
                    <p>Combinación de lecciones y retos de los tres datasets.</p>
                </div>
                <span class="progress-section-badge">${started} de ${conceptStats.length} iniciados</span>
            </div>
            <div class="concept-mastery-grid">
                ${conceptStats.map(concept => {
                    const levelClass = concept.percent === 100
                        ? 'is-complete'
                        : concept.percent >= 80
                            ? 'is-high'
                            : concept.percent > 0
                                ? 'is-progress'
                                : 'is-empty';
                    const status = concept.percent === 100
                        ? 'Dominado'
                        : concept.percent >= 80
                            ? 'Casi'
                            : concept.percent > 0
                                ? 'En progreso'
                                : 'Sin empezar';
                    return `
                        <article class="concept-mastery-card ${levelClass}">
                            <div class="concept-mastery-head">
                                <span class="concept-mastery-icon"><i class="fas ${concept.icon}"></i></span>
                                <div class="concept-mastery-copy">
                                    <h4>${escapeHtml(concept.label)}</h4>
                                    <p>${escapeHtml(concept.description)}</p>
                                </div>
                                <span class="concept-mastery-percent">${concept.percent}%</span>
                            </div>
                            <div class="concept-mastery-bar" role="progressbar" aria-label="${escapeHtml(concept.label)}" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${concept.percent}">
                                <span style="width:${concept.percent}%"></span>
                            </div>
                            <div class="concept-mastery-foot">
                                <span>${concept.completed} de ${concept.total} actividades · ${status}</span>
                                <button type="button" class="btn-ghost btn-sm" onclick="practiceLearningConcept('${concept.id}')">
                                    Practicar <i class="fas fa-arrow-right"></i>
                                </button>
                            </div>
                        </article>
                    `;
                }).join('')}
            </div>
        </div>

        <div class="progress-section concept-library-progress">
            <div class="progress-section-head">
                <div>
                    <h3>Biblioteca de conceptos</h3>
                    <p>Fichas completadas con el mini-quiz de Aprender.</p>
                </div>
                <span class="progress-section-badge">${conceptLibrary.completed} de ${conceptLibrary.total}</span>
            </div>
            <div class="concept-library-row">
                <div class="concept-library-bar" role="progressbar" aria-label="Biblioteca de conceptos" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${conceptLibrary.percent}">
                    <span style="width:${conceptLibrary.percent}%"></span>
                </div>
                <button type="button" class="btn-secondary" onclick="openConceptLibrary()">
                    Explorar conceptos <i class="fas fa-arrow-right"></i>
                </button>
            </div>
        </div>

        <div class="progress-columns">
            <div class="progress-section">
                <div class="progress-section-head">
                    <div>
                        <h3>Progreso por dataset</h3>
                        <p>Lecciones y retos completados en cada base.</p>
                    </div>
                </div>
                <div class="dataset-progress-list">
                    ${globalStats.datasetStats.map(stat => `
                        <article class="dataset-progress-card${stat.datasetName === getLearningDatasetName() ? ' is-active' : ''}">
                            <div class="dataset-progress-head">
                                <div>
                                    <strong>${escapeHtml(stat.name)}</strong>
                                    <span>${stat.completed} de ${stat.total} actividades</span>
                                </div>
                                <span class="dataset-progress-percent">${stat.percent}%</span>
                            </div>
                            <div class="dataset-progress-bar" role="progressbar" aria-label="${escapeHtml(stat.name)}" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${stat.percent}">
                                <span style="width:${stat.percent}%"></span>
                            </div>
                            <div class="dataset-progress-meta">
                                <span>${stat.lessonsCompleted}/${stat.lessonsTotal} lecciones</span>
                                <span>${stat.challengesCompleted}/${stat.challengesTotal} retos</span>
                            </div>
                        </article>
                    `).join('')}
                </div>
            </div>

            <div class="progress-section">
                <div class="progress-section-head">
                    <div>
                        <h3>Actividad SQL reciente</h3>
                        <p>Tus últimos avances en lecciones y retos SQL.</p>
                    </div>
                </div>
                ${activity.length ? `
                    <div class="recent-activity-list">
                        ${activity.map(item => `
                            <div class="recent-activity-item">
                                <span class="recent-activity-icon"><i class="fas ${item.icon}"></i></span>
                                <div>
                                    <strong title="${escapeHtml(item.title)}">${escapeHtml(item.title)}</strong>
                                    <span>${item.type} · ${escapeHtml(LEARNING_PATH_PROFILES[item.datasetName]?.name || item.datasetName)}</span>
                                </div>
                                <time datetime="${escapeHtml(item.completedAt)}">${escapeHtml(formatLearningActivityDate(item.completedAt))}</time>
                            </div>
                        `).join('')}
                    </div>
                ` : `
                    <div class="progress-empty">
                        <i class="fas fa-clock"></i>
                        <p>Aún no has completado actividades. Empieza con la primera lección.</p>
                    </div>
                `}
            </div>
        </div>
    `;
}

function activatePathTab(tabName) {
    const next = tabName === 'progress' ? 'progress' : 'lessons';
    const tabs = Array.from(document.querySelectorAll('.path-tab'));
    const panels = {
        lessons: document.getElementById('pathLessonsPanel'),
        progress: document.getElementById('pathProgressPanel')
    };

    tabs.forEach(tab => {
        const active = tab.dataset.pathTab === next;
        tab.classList.toggle('active', active);
        tab.setAttribute('aria-selected', String(active));
        tab.tabIndex = active ? 0 : -1;
    });

    Object.entries(panels).forEach(([name, panel]) => {
        if (!panel) return;
        const active = name === next;
        panel.hidden = !active;
        panel.classList.toggle('active', active);
    });

    if (next === 'progress') {
        renderLearningProgressDashboard();
    }
}

function openLearningPath() {
    activateSection('path');
    activatePathTab('lessons');
    showCourseCatalog();
}

function continueLearningLesson(id) {
    const course = getCourseForLesson(id);
    if (course) {
        activateSection('path');
        activatePathTab('lessons');
        startCourse(course.id, id);
        return;
    }
    openLearningPath();
    selectLearningLesson(id);
}

function openSQLChallenges() {
    activateSection('challenges');
    activateChallengeTab('sql');
}

function practiceLearningChallenge(id) {
    openSQLChallenges();
    openChallenge(id);
}

function practiceLearningConcept(conceptId) {
    const datasetName = getLearningDatasetName();
    const profile = LEARNING_PATH_PROFILES[datasetName];
    const lesson = getLearningLessonsForDataset(datasetName)
        .find(item => item.id === conceptId && !isLearningLessonCompletedForDataset(item.id, datasetName));
    if (lesson) {
        continueLearningLesson(lesson.id);
        return;
    }

    const challenge = getChallengeCatalog(datasetName)
        .find(item => getChallengeConceptId(item) === conceptId && !challengeProgress[item.id]?.completed);
    if (challenge) {
        practiceLearningChallenge(challenge.id);
        return;
    }

    const otherDataset = Object.keys(LEARNING_PATH_PROFILES).find(name => {
        if (name === datasetName) return false;
        const hasPendingLesson = getLearningLessonsForDataset(name).some(item => (
            item.id === conceptId && !isLearningLessonCompletedForDataset(item.id, name)
        ));
        const hasPendingChallenge = getChallengeCatalog(name).some(item => (
            getChallengeConceptId(item) === conceptId && !challengeProgress[item.id]?.completed
        ));
        return hasPendingLesson || hasPendingChallenge;
    });

    if (otherDataset) {
        showToast('info', `Este concepto ya está completo en ${profile.name}. Cambia a ${LEARNING_PATH_PROFILES[otherDataset].name} desde Practicar para seguir.`);
        return;
    }

    showToast('success', `¡Ya dominas ${getConceptLabel(conceptId)}!`);
}
