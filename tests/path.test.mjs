import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { DatabaseSync } from 'node:sqlite';
import { JSDOM } from 'jsdom';

const dom = new JSDOM(
    `<!doctype html><html><body>
        <textarea id="sqlEditor"></textarea>
        <ul id="historyList"></ul>
        <div id="resultOutput"></div>
        <div id="toastContainer"></div>
        <div id="challengeList"></div>
        <div id="challengeDetail"></div>
        <strong id="challengeProgressText"></strong>
        <div id="challengeProgressBar"></div>
        <div id="challengeProgressTrack"></div>
        <span id="currentYear"></span>
        <button id="installAppBtn"></button>
        <button id="themeToggle"></button>
        <select id="datasetSelector"></select>
        <input id="safeModeToggle" type="checkbox">
        <select id="categorySelector"></select>
        <span id="sqlExampleStatus"></span>
        <button id="pathLessonsTab" class="path-tab active" data-path-tab="lessons"></button>
        <button id="pathProgressTab" class="path-tab" data-path-tab="progress"></button>
        <div id="pathLessonsPanel" class="path-tab-panel active">
            <div id="pathLessonList"></div>
            <div id="pathLessonDetail"></div>
            <strong id="pathProgressText"></strong>
            <div id="pathProgressBar"></div>
            <div id="pathProgressTrack"></div>
            <p id="pathDatasetLabel"></p>
        </div>
        <div id="pathProgressPanel" class="path-tab-panel" hidden>
            <div id="learningProgressDashboard"></div>
        </div>
        <section id="section-path" class="section"></section>
        <section id="section-challenges" class="section"></section>
    </body></html>`,
    {
        url: 'https://sql-academy.test/',
        runScripts: 'outside-only',
        pretendToBeVisual: true
    }
);

const { window } = dom;
const { document } = window;
window.confirm = () => true;
window.localStorage.setItem(
    'sql-academy-preferences-v1',
    JSON.stringify({ dataset: 'tienda', theme: 'light', safeMode: true })
);
window.eval(fs.readFileSync(new URL('../datasets.js', import.meta.url), 'utf8'));
window.eval(fs.readFileSync(new URL('../courses.js', import.meta.url), 'utf8'));
window.eval(fs.readFileSync(new URL('../course-content.js', import.meta.url), 'utf8'));
window.eval(fs.readFileSync(new URL('../checkpoint-content.js', import.meta.url), 'utf8'));
window.eval(fs.readFileSync(new URL('../script.js', import.meta.url), 'utf8'));

await new Promise(resolve => setTimeout(resolve, 30));

const ESCUELA_FIXTURE_SQL = `
    CREATE TABLE estudiantes (
        id INTEGER PRIMARY KEY,
        nombre TEXT NOT NULL,
        edad INTEGER,
        carrera TEXT,
        promedio REAL,
        ciudad TEXT,
        fecha_ingreso TEXT
    );
    CREATE TABLE cursos (
        id INTEGER PRIMARY KEY,
        nombre TEXT NOT NULL,
        creditos INTEGER,
        profesor TEXT,
        departamento TEXT,
        semestre INTEGER
    );
    CREATE TABLE inscripciones (
        id INTEGER PRIMARY KEY,
        estudiante_id INTEGER,
        curso_id INTEGER,
        anio INTEGER,
        ciclo TEXT,
        nota REAL
    );
    INSERT INTO estudiantes (id, nombre, edad, carrera, promedio, ciudad, fecha_ingreso) VALUES
        (1, 'Ana Garcia', 20, 'Ingenieria', 15.5, 'Lima', '2023-03-15'),
        (2, 'Carlos Lopez', 22, 'Medicina', 17.2, 'Arequipa', '2022-02-10'),
        (3, 'Maria Torres', 19, 'Derecho', 12.8, 'Cusco', '2024-01-20'),
        (4, 'Juan Perez', 21, 'Arquitectura', 16.9, 'Lima', '2023-04-05'),
        (5, 'Laura Sanchez', 20, 'Ingenieria', 18.5, 'Trujillo', '2023-03-01'),
        (6, 'Pedro Diaz', 23, 'Ingenieria', 14.2, 'Lima', '2022-01-15'),
        (7, 'Sofia Romero', 21, 'Medicina', 17.1, 'Arequipa', '2023-02-20');
    INSERT INTO cursos (id, nombre, creditos, profesor, departamento, semestre) VALUES
        (1, 'Matematicas I', 4, 'Dr. Ramirez', 'Ciencias', 1),
        (2, 'Programacion I', 4, 'Ing. Torres', 'Sistemas', 1);
    INSERT INTO inscripciones (id, estudiante_id, curso_id, anio, ciclo, nota) VALUES
        (1, 1, 1, 2024, 'I', 16),
        (2, 1, 2, 2024, 'I', 18),
        (3, 2, 1, 2024, 'I', 15),
        (4, 5, 2, 2024, 'I', 19);
`;

function createSqliteAdapter(sql) {
    const database = new DatabaseSync(':memory:');
    database.exec('PRAGMA foreign_keys = ON;');
    database.exec(sql);

    return {
        database,
        adapter: {
            exec(query) {
                const statement = database.prepare(query);
                const rows = statement.all();
                const columns = statement.columns().map(column => column.name);
                return [{
                    columns,
                    values: rows.map(row => columns.map(column => row[column]))
                }];
            }
        }
    };
}

test('la ruta tiene once lecciones por dataset', () => {
    const expectedIds = ['select', 'where', 'order', 'limit', 'join', 'group', 'having', 'subquery', 'case', 'cte', 'rank'];

    for (const datasetName of ['escuela', 'tienda', 'biblioteca']) {
        const lessons = window.getLearningLessonsForDataset(datasetName);
        assert.equal(lessons.length, 11);
        assert.deepEqual([...lessons.map(lesson => lesson.id)], expectedIds);

        for (const lesson of lessons) {
            assert.match(lesson.expectedSql, /^(SELECT|WITH)\b/i);
            assert.ok(lesson.objective);
            assert.ok(lesson.explanation);
            assert.ok(lesson.example);
            assert.ok(lesson.hint);
            assert.ok(lesson.starter);
            assert.notEqual(lesson.starter, lesson.expectedSql);
        }
    }
});

test('las consultas esperadas de la ruta devuelven filas en los tres datasets', () => {
    for (const datasetName of ['escuela', 'tienda', 'biblioteca']) {
        const sql = datasetName === 'escuela'
            ? ESCUELA_FIXTURE_SQL
            : window.SQL_ACADEMY_DATASETS[datasetName].sql;
        const { database, adapter } = createSqliteAdapter(sql);

        try {
            for (const lesson of window.getLearningLessonsForDataset(datasetName)) {
                const result = adapter.exec(lesson.expectedSql);
                assert.ok(
                    result[0].values.length > 0,
                    `${datasetName}/${lesson.id} no devuelve filas`
                );
            }
        } finally {
            database.close();
        }
    }
});

test('las plantillas iniciales no resuelven la lección', () => {
    for (const datasetName of ['escuela', 'tienda', 'biblioteca']) {
        const sql = datasetName === 'escuela'
            ? ESCUELA_FIXTURE_SQL
            : window.SQL_ACADEMY_DATASETS[datasetName].sql;
        const { database, adapter } = createSqliteAdapter(sql);

        try {
            for (const lesson of window.getLearningLessonsForDataset(datasetName)) {
                const expected = adapter.exec(lesson.expectedSql);
                const starter = adapter.exec(lesson.starter);
                const comparison = window.compareChallengeResults(expected, starter, lesson.ordered);
                assert.equal(
                    comparison.ok,
                    false,
                    `${datasetName}/${lesson.id}: la plantilla ya resuelve la lección`
                );
            }
        } finally {
            database.close();
        }
    }
});

test('los ejemplos de la ruta no resuelven el ejercicio directamente', () => {
    for (const datasetName of ['escuela', 'tienda', 'biblioteca']) {
        const sql = datasetName === 'escuela'
            ? ESCUELA_FIXTURE_SQL
            : window.SQL_ACADEMY_DATASETS[datasetName].sql;
        const { database, adapter } = createSqliteAdapter(sql);

        try {
            for (const lesson of window.getLearningLessonsForDataset(datasetName)) {
                const expected = adapter.exec(lesson.expectedSql);
                const example = adapter.exec(lesson.example);
                const comparison = window.compareChallengeResults(expected, example, lesson.ordered);
                assert.equal(
                    comparison.ok,
                    false,
                    `${datasetName}/${lesson.id}: el ejemplo ya resuelve la lección`
                );
            }
        } finally {
            database.close();
        }
    }
});

test('el curso renderiza pasos, editor, dataset y progreso', () => {
    window.localStorage.setItem(
        'sql-academy-preferences-v1',
        JSON.stringify({ dataset: 'tienda', theme: 'light', safeMode: true })
    );
    window.loadPreferences();
    window.startCourse('sql-desde-cero');
    window.goToLessonStep('practice');

    assert.equal(document.querySelectorAll('#pathLessonList [data-learning-lesson]').length, 4);
    assert.match(document.getElementById('pathDatasetLabel').textContent, /Tienda/);
    assert.equal(document.getElementById('pathProgressText').textContent, '0 de 4');
    assert.ok(document.getElementById('pathEditor'));
    assert.match(document.getElementById('pathEditor').value, /productos/);

    window.markLearningLessonCompleted('select');
    window.renderLearningPathList();

    assert.equal(document.getElementById('pathProgressText').textContent, '1 de 4');
    assert.equal(document.querySelectorAll('#pathLessonList .completed').length, 1);

    window.resetLearningProgress();
    assert.equal(document.getElementById('pathProgressText').textContent, '0 de 4');
});

test('el dashboard muestra progreso, conceptos, actividad y recomendación', () => {
    window.localStorage.setItem(
        'sql-academy-preferences-v1',
        JSON.stringify({ dataset: 'tienda', theme: 'light', safeMode: true })
    );
    window.loadPreferences();
    window.resetLearningProgress();
    window.resetChallengeProgress();
    window.markLearningLessonCompleted('select');
    window.markChallengeComplete({ id: 'tienda-stock-01' });
    window.refreshLearningPath({ selectFirst: true });
    document.getElementById('pathProgressTab').click();

    const dashboard = document.getElementById('learningProgressDashboard');
    assert.equal(document.getElementById('pathProgressPanel').hidden, false);
    assert.equal(document.getElementById('pathLessonsPanel').hidden, true);
    assert.match(dashboard.textContent, /Progreso global/);
    assert.match(dashboard.textContent, /Dataset activo: Tienda/);
    assert.match(dashboard.textContent, /Dominio por concepto/);
    assert.match(dashboard.textContent, /1\/33/);
    assert.match(dashboard.textContent, /1\/20/);
    assert.match(dashboard.textContent, /Seleccionar/);
    assert.match(dashboard.textContent, /Filtros/);
    assert.match(dashboard.textContent, /2 de 17 actividades/);
    assert.match(dashboard.textContent, /Selecciona columnas/);
    assert.match(dashboard.textContent, /Productos con stock bajo/);
    assert.match(dashboard.textContent, /Siguiente paso recomendado/);
    assert.match(
        dashboard.querySelector('.progress-recommendation').textContent,
        /Filtra con WHERE/
    );

    document.getElementById('pathLessonsTab').click();
    assert.equal(document.getElementById('pathProgressPanel').hidden, true);
    assert.equal(document.getElementById('pathLessonsPanel').hidden, false);
});

test('las acciones del dashboard abren la lección y el reto correctos', () => {
    window.localStorage.setItem(
        'sql-academy-preferences-v1',
        JSON.stringify({ dataset: 'tienda', theme: 'light', safeMode: true })
    );
    window.loadPreferences();
    window.resetLearningProgress();
    window.refreshLearningPath({ selectFirst: true });

    window.practiceLearningConcept('where');
    assert.ok(document.getElementById('section-path').classList.contains('active'));
    assert.match(document.getElementById('pathLessonDetail').textContent, /Filtra con WHERE/);
    assert.equal(document.getElementById('pathProgressPanel').hidden, true);

    window.practiceLearningChallenge('tienda-stock-01');
    assert.ok(document.getElementById('section-challenges').classList.contains('active'));
    assert.match(document.getElementById('challengeDetail').textContent, /Productos con stock bajo/);
});

test('runLearningLesson valida una consulta y muestra el siguiente paso', () => {
    window.resetLearningProgress();
    const { database, adapter } = createSqliteAdapter(window.SQL_ACADEMY_DATASETS.tienda.sql);

    try {
        window.startCourse('sql-desde-cero');
        window.goToLessonStep('practice');
        const editor = document.getElementById('pathEditor');
        editor.value = 'SELECT nombre, precio FROM productos;';
        window.runLearningLesson(adapter, true);

        assert.match(document.getElementById('pathResult').textContent, /Práctica superada/);
        assert.equal(document.getElementById('pathProgressText').textContent, '0 de 4');
        assert.equal(document.getElementById('pathNext').hidden, false);

        window.markLearningQuizPassed('select');
        window.renderLearningPathList();
        assert.equal(document.getElementById('pathProgressText').textContent, '1 de 4');

        window.selectLearningLesson('where');
        window.goToLessonStep('practice');
        document.getElementById('pathEditor').value = "SELECT nombre, categoria FROM productos WHERE categoria = 'Audio';";
        window.runLearningLesson(adapter, true);

        assert.match(document.getElementById('pathResult').textContent, /Todavía no/);
        assert.equal(document.getElementById('pathProgressText').textContent, '1 de 4');
    } finally {
        database.close();
    }
});
