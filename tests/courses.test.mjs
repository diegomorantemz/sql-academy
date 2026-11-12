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

for (const file of ['datasets.js', 'nosql-datasets.js', 'install-guides.js', 'courses.js', 'script.js']) {
    window.eval(fs.readFileSync(new URL(`../${file}`, import.meta.url), 'utf8'));
}

window.initLearningPath();

function clearCourseProgress(dataset = 'escuela') {
    window.localStorage.setItem('sql-academy-preferences-v1', JSON.stringify({ dataset, theme: 'light', safeMode: true }));
    window.loadPreferences();
    window.localStorage.removeItem('sql-academy-path-v1');
    window.loadLearningPathProgress();
    window.startCourse('sql-desde-cero');
}

test('el catálogo de cursos usa las ocho lecciones sin duplicados', () => {
    const courses = window.SQL_ACADEMY_COURSES;
    const expectedLessonIds = ['select', 'where', 'order', 'limit', 'join', 'group', 'having', 'subquery'];
    const courseIds = new Set();
    const lessonIds = [];

    assert.equal(courses.length, 2);
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
    const availableLessonIds = new Set(window.getLearningLessonsForDataset('escuela').map(lesson => lesson.id));
    for (const lessonId of flattened) {
        assert.ok(availableLessonIds.has(lessonId), `Lección inexistente: ${lessonId}`);
    }
    assert.deepEqual([...flattened].sort(), [...expectedLessonIds].sort());
    assert.equal(new Set(flattened).size, expectedLessonIds.length);
});

test('el catálogo muestra los dos cursos y su progreso', () => {
    clearCourseProgress();
    window.showCourseCatalog();

    const cards = [...document.querySelectorAll('#courseCatalogView .course-card')];
    assert.equal(cards.length, 2);
    assert.match(document.getElementById('courseCatalogView').textContent, /SQL desde cero/);
    assert.match(document.getElementById('courseCatalogView').textContent, /SQL intermedio/);
    assert.equal(cards[0].querySelector('.course-card-recommended').textContent, 'Empieza aquí');
    assert.match(cards[0].textContent, /0 de 4/);
    assert.match(cards[1].textContent, /0 de 4/);
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
    window.showLearningNext(window.getLearningLessonById('limit'));

    const next = document.getElementById('pathNext');
    assert.equal(next.hidden, false);
    assert.match(next.textContent, /Curso completado/);
    assert.match(next.textContent, /SQL intermedio/);
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
