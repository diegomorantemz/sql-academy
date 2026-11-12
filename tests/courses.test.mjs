import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { JSDOM } from 'jsdom';

const html = fs.readFileSync(new URL('../index.html', import.meta.url), 'utf8');
const dom = new JSDOM(html, {
    url: 'https://sql-academy.test/',
    runScripts: 'outside-only',
    pretendToBeVisual: true
});

const { window } = dom;
const { document } = window;
window.confirm = () => true;
window.requestAnimationFrame = () => 0;

for (const file of ['datasets.js', 'nosql-datasets.js', 'install-guides.js', 'courses.js', 'course-content.js', 'nosql-engine.js', 'script.js']) {
    window.eval(fs.readFileSync(new URL(`../${file}`, import.meta.url), 'utf8'));
}

window.initLearningPath();

function clearCourseProgress(dataset = 'escuela') {
    window.localStorage.setItem('sql-academy-preferences-v1', JSON.stringify({ dataset, theme: 'light', safeMode: true }));
    window.loadPreferences();
    window.localStorage.removeItem('sql-academy-path-v1');
    window.localStorage.removeItem('sql-academy-nosql-course-v1');
    window.loadLearningPathProgress();
    window.loadNoSQLCourseProgress();
    window.startCourse('sql-desde-cero');
}

test('el catálogo de cursos usa las lecciones sin duplicados', () => {
    const courses = window.SQL_ACADEMY_COURSES;
    const expectedLessonIds = ['select', 'where', 'order', 'limit', 'join', 'group', 'having', 'subquery', 'case', 'cte', 'rank', 'nosql-find', 'nosql-filter', 'nosql-sort', 'nosql-aggregate'];
    const courseIds = new Set();
    const lessonIds = [];

    assert.equal(courses.length, 4);
    for (const course of courses) {
        assert.ok(course.id);
        assert.equal(courseIds.has(course.id), false, `Curso duplicado: ${course.id}`);
        courseIds.add(course.id);
        assert.ok(Array.isArray(course.modules) && course.modules.length > 0);
        for (const module of course.modules) {
            assert.ok(module.title);
            for (const lessonId of module.lessonIds || []) lessonIds.push(`${course.id}/${lessonId}`);
        }
    }

    const flattened = lessonIds.map(item => item.split('/')[1]);
    const sqlLessonIds = new Set(window.getLearningLessonsForDataset('escuela').map(lesson => lesson.id));
    const nosqlLessonIds = new Set(window.getCourseLessons(window.getCourseById('nosql-esencial'), 'escuela').map(lesson => lesson.id));
    for (const lessonId of flattened) {
        assert.ok(sqlLessonIds.has(lessonId) || nosqlLessonIds.has(lessonId), `Lección inexistente: ${lessonId}`);
    }
    assert.deepEqual([...flattened].sort(), [...expectedLessonIds].sort());
    assert.equal(new Set(flattened).size, expectedLessonIds.length);
});

test('el catálogo muestra los cuatro cursos y su progreso', () => {
    clearCourseProgress();
    window.showCourseCatalog();

    const cards = [...document.querySelectorAll('#courseCatalogView .course-card')];
    assert.equal(cards.length, 4);
    assert.match(document.getElementById('courseCatalogView').textContent, /SQL desde cero/);
    assert.match(document.getElementById('courseCatalogView').textContent, /SQL intermedio/);
    assert.match(document.getElementById('courseCatalogView').textContent, /SQL avanzado/);
    assert.match(document.getElementById('courseCatalogView').textContent, /NoSQL esencial/);
    assert.equal(cards[0].querySelector('.course-card-recommended').textContent, 'Empieza aquí');
    assert.match(cards[0].textContent, /0 de 4/);
    assert.match(cards[1].textContent, /0 de 4/);
    assert.match(cards[2].textContent, /0 de 3/);
    assert.match(cards[3].textContent, /0 de 4/);
});

test('el temario del curso muestra módulos, lecciones y proyecto final', () => {
    clearCourseProgress();
    window.openCourse('sql-desde-cero');

    const detail = document.getElementById('courseDetailView');
    assert.equal(detail.hidden, false);
    assert.equal(document.getElementById('courseCatalogView').hidden, true);
    assert.match(detail.textContent, /Primeros pasos/);
    assert.match(detail.textContent, /Resultados útiles/);
    assert.match(detail.textContent, /Selecciona columnas/);
    assert.match(detail.textContent, /Mini reporte de estudiantes/);
    assert.equal(detail.querySelectorAll('[data-course-lesson]').length, 4);

    detail.querySelector('[data-course-lesson="where"]').click();
    assert.equal(document.getElementById('coursePlayerView').hidden, false);
    assert.match(document.getElementById('pathLessonDetail').textContent, /Filtra con WHERE/);
});

test('desde Mi progreso se abre el curso y la práctica recomendada', () => {
    clearCourseProgress();
    document.getElementById('pathProgressTab').click();

    const courseCard = document.querySelector('.progress-course-card');
    assert.ok(courseCard);
    window.openCourse('sql-desde-cero');

    assert.equal(document.getElementById('pathProgressPanel').hidden, true);
    assert.equal(document.getElementById('courseDetailView').hidden, false);

    const practice = document.querySelector('[data-course-practice="where"]');
    assert.ok(practice);
    practice.click();

    assert.equal(document.getElementById('coursePlayerView').hidden, false);
    assert.match(document.getElementById('pathLessonDetail').textContent, /Filtra con WHERE/);
});

test('el reproductor avanza y actualiza el progreso del curso', () => {
    clearCourseProgress();
    window.startCourse('sql-desde-cero');

    assert.equal(document.querySelectorAll('#pathLessonList [data-learning-lesson]').length, 4);
    assert.equal(document.getElementById('pathProgressText').textContent, '0 de 4');
    assert.match(document.getElementById('pathLessonDetail').textContent, /Selecciona columnas/);

    window.markLearningLessonCompleted('select');
    window.renderLearningPathList();
    window.selectLearningLesson('where');

    assert.equal(document.getElementById('pathProgressText').textContent, '1 de 4');
    assert.match(document.getElementById('pathLessonDetail').textContent, /Filtra con WHERE/);
    assert.match(document.getElementById('coursePlayerBreadcrumb').textContent, /SQL desde cero/);
});

test('al completar un curso se ofrece el siguiente', () => {
    clearCourseProgress();
    for (const lessonId of ['select', 'where', 'order', 'limit']) {
        window.markLearningLessonCompleted(lessonId);
    }
    window.startCourse('sql-desde-cero');
    window.selectLearningLesson('limit');
    window.goToLessonStep('check');

    const next = document.getElementById('pathNext');
    assert.equal(next.hidden, false);
    assert.match(next.textContent, /Curso completado/);
    assert.match(next.textContent, /SQL intermedio/);

    for (const lessonId of ['join', 'group', 'having', 'subquery']) {
        window.markLearningLessonCompleted(lessonId);
    }
    window.startCourse('sql-intermedio');
    window.selectLearningLesson('subquery');
    window.goToLessonStep('check');

    assert.match(document.getElementById('pathNext').textContent, /SQL avanzado/);

    for (const lessonId of ['case', 'cte', 'rank']) {
        window.markLearningLessonCompleted(lessonId);
    }
    window.startCourse('sql-avanzado');
    window.selectLearningLesson('rank');
    window.goToLessonStep('check');

    assert.match(document.getElementById('pathNext').textContent, /NoSQL esencial/);
});

test('reiniciar un curso no borra el avance de otro curso', () => {
    clearCourseProgress();
    window.markLearningLessonCompleted('select');
    window.markLearningLessonCompleted('join');
    window.startCourse('sql-desde-cero');

    const before = window.getCourseProgress(window.getCourseById('sql-intermedio'));
    assert.equal(before.completed, 1);

    window.resetLearningProgress();

    assert.equal(window.getCourseProgress(window.getCourseById('sql-desde-cero')).completed, 0);
    assert.equal(window.getCourseProgress(window.getCourseById('sql-intermedio')).completed, 1);
});

test('el curso NoSQL genera cuatro lecciones válidas por dataset', () => {
    const course = window.getCourseById('nosql-esencial');
    for (const datasetName of ['escuela', 'tienda', 'biblioteca']) {
        const lessons = window.getCourseLessons(course, datasetName);
        assert.equal(lessons.length, 4);
        assert.ok(lessons.every(lesson => lesson.track === 'nosql'));

        const state = window.NoSQL.createDatabase(window.NOSQL_DATASETS[datasetName]);
        for (const lesson of lessons) {
            const expected = window.NoSQL.executeCommand(state, lesson.expectedQuery);
            const starter = window.NoSQL.executeCommand(state, lesson.starter);
            const example = window.NoSQL.executeCommand(state, lesson.example);

            assert.ok(Array.isArray(expected.documents) && expected.documents.length > 0, `${datasetName}/${lesson.id}: la solución no devuelve documentos`);
            assert.equal(window.compareNoSQLCourseResults(expected, starter).ok, false, `${datasetName}/${lesson.id}: la plantilla ya resuelve`);
            assert.equal(window.compareNoSQLCourseResults(expected, example).ok, false, `${datasetName}/${lesson.id}: el ejemplo ya resuelve`);
        }
    }
});

test('el curso NoSQL valida comandos y guarda progreso por dataset', () => {
    clearCourseProgress();
    const course = window.getCourseById('nosql-esencial');
    const schoolLessons = window.getCourseLessons(course, 'escuela');
    window.startCourse('nosql-esencial');

    assert.equal(document.getElementById('pathProgressText').textContent, '0 de 4');
    assert.match(document.getElementById('pathDatasetLabel').textContent, /NoSQL: Escuela/);
    assert.equal(document.querySelectorAll('#pathLessonList [data-learning-lesson]').length, 4);

    window.goToLessonStep('practice');
    const editor = document.getElementById('pathEditor');
    editor.value = schoolLessons[0].expectedQuery;
    window.runNoSQLCourseLesson();

    assert.match(document.getElementById('pathResult').textContent, /Práctica superada/);
    assert.equal(document.getElementById('pathProgressText').textContent, '0 de 4');
    assert.equal(window.getCourseProgress(course).completed, 0);

    window.markNoSQLCourseQuizPassed('nosql-find');
    window.renderLearningPathList();
    assert.equal(document.getElementById('pathProgressText').textContent, '1 de 4');
    assert.equal(window.getCourseProgress(course).completed, 1);

    const selector = document.getElementById('nosqlDatasetSelector');
    selector.value = 'tienda';
    window.refreshLearningPath({ selectFirst: true });
    assert.match(document.getElementById('pathDatasetLabel').textContent, /NoSQL: Tienda/);
    assert.equal(document.getElementById('pathProgressText').textContent, '0 de 4');
    assert.equal(window.getCourseProgress(course).completed, 0);

    selector.value = 'escuela';
    window.refreshLearningPath({ selectFirst: true });
    assert.equal(document.getElementById('pathProgressText').textContent, '1 de 4');
});

test('al completar las lecciones SQL se recomienda el curso NoSQL', () => {
    clearCourseProgress();
    for (const lessonId of ['select', 'where', 'order', 'limit', 'join', 'group', 'having', 'subquery', 'case', 'cte', 'rank']) {
        window.markLearningLessonCompleted(lessonId);
    }

    const recommendation = window.getLearningRecommendation();
    assert.match(recommendation.title, /Consulta documentos/);
    assert.match(recommendation.onclick, /nosql-find/);
    assert.equal(recommendation.icon, 'fa-leaf');
});

test('todas las lecciones tienen teoría, errores y quiz válidos', () => {
    const sqlLessons = ['escuela', 'tienda', 'biblioteca']
        .flatMap(dataset => window.getLearningLessonsForDataset(dataset));
    const nosqlLessons = ['escuela', 'tienda', 'biblioteca']
        .flatMap(dataset => window.getCourseLessons(window.getCourseById('nosql-esencial'), dataset));
    const allLessons = [...sqlLessons, ...nosqlLessons];

    for (const lesson of allLessons) {
        assert.ok(Array.isArray(lesson.objectives) && lesson.objectives.length > 0, `${lesson.id}: objetivos`);
        assert.ok(lesson.theory.length >= 2, `${lesson.id}: teoría`);
        assert.ok(lesson.theory.every(section => section.title && section.body), `${lesson.id}: secciones`);
        assert.ok(lesson.commonMistakes.length > 0, `${lesson.id}: errores comunes`);
        assert.ok(lesson.demoQuery, `${lesson.id}: demostración`);
        assert.ok(lesson.demoNote, `${lesson.id}: nota de demostración`);
        if (lesson.track === 'nosql') {
            const command = window.NoSQL.parseCommand(lesson.demoQuery);
            assert.ok(['find', 'findOne', 'aggregate'].includes(command.methods?.[0]?.name), `${lesson.id}: demostración NoSQL de lectura`);
        } else {
            assert.equal(window.isReadOnlyQuery(lesson.demoQuery), true, `${lesson.id}: demostración SQL de lectura`);
        }
        assert.equal(lesson.quiz.length, 2, `${lesson.id}: quiz`);
        assert.ok(lesson.summary.length >= 2, `${lesson.id}: resumen`);
        for (const question of lesson.quiz) {
            assert.ok(question.question);
            assert.ok(question.options.length >= 2);
            assert.ok(Number.isInteger(question.answer));
            assert.ok(question.answer >= 0 && question.answer < question.options.length);
            assert.ok(question.explanation);
        }
    }
});

test('la lección exige concepto, práctica y comprobación', () => {
    clearCourseProgress();
    const course = window.getCourseById('sql-desde-cero');
    const lesson = window.getCourseLessons(course)[0];
    window.startCourse(course.id);

    assert.ok(document.querySelector('#lessonStepContent .lesson-objectives'));
    assert.equal(document.getElementById('pathEditor'), null);

    window.goToLessonStep('check');
    assert.equal(document.getElementById('lessonQuizForm'), null);

    window.goToLessonStep('practice');
    assert.ok(document.getElementById('pathEditor'));

    window.markCourseLessonPracticeCompleted(course, lesson.id);
    window.goToLessonStep('practice');
    assert.equal(document.getElementById('pathNext').hidden, false);

    window.goToLessonStep('check');
    const form = document.getElementById('lessonQuizForm');
    assert.ok(form);
    lesson.quiz.forEach((question, index) => {
        form.querySelector(`input[name="lessonQuizQ${index}"][value="${question.answer}"]`).checked = true;
    });
    window.submitLessonQuiz({ preventDefault() {}, currentTarget: form });

    assert.equal(window.isCourseLessonCompleted(course, lesson.id), true);
    assert.match(document.getElementById('pathLessonDetail').textContent, /Lección completada/);
});

test('la demostración NoSQL ejecuta el ejemplo del concepto', () => {
    clearCourseProgress();
    window.startCourse('nosql-esencial');

    window.runLessonDemo();

    const result = document.getElementById('lessonDemoResult');
    assert.equal(result.hidden, false);
    assert.match(result.textContent, /est-001/);
});

test('Cursos sincroniza los selectores de dataset SQL y NoSQL', () => {
    const sqlSelector = document.getElementById('courseSqlDatasetSelector');
    const nosqlSelector = document.getElementById('courseNoSQLDatasetSelector');
    const labSelector = document.getElementById('nosqlDatasetSelector');
    assert.ok(sqlSelector);
    assert.ok(nosqlSelector);

    window.localStorage.setItem('sql-academy-preferences-v1', JSON.stringify({ dataset: 'tienda', theme: 'light', safeMode: true }));
    window.loadPreferences();
    labSelector.value = 'biblioteca';
    window.syncCourseDatasetControls();

    assert.equal(sqlSelector.value, 'tienda');
    assert.equal(nosqlSelector.value, 'biblioteca');

    window.localStorage.setItem('sql-academy-preferences-v1', JSON.stringify({ dataset: 'escuela', theme: 'light', safeMode: true }));
    window.loadPreferences();
    labSelector.value = 'escuela';
    window.syncCourseDatasetControls();
    assert.equal(sqlSelector.value, 'escuela');
    assert.equal(nosqlSelector.value, 'escuela');
});
