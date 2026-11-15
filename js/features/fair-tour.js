// Recorrido guiado de la feria.

// ============================================
// RECORRIDO GUIADO DE LA FERIA
// ============================================

const DEMO_TOUR_STEPS = [
    {
        title: 'Una academia para empezar',
        description: 'Guías, conceptos e instalación para doce gestores. El recorrido empieza en Aprender.',
        section: 'learn'
    },
    {
        title: 'Descubre tu nivel',
        description: 'El test adaptativo recomienda un nivel para SQL y otro para NoSQL. Practicar y el laboratorio se ajustan a tu perfil.',
        section: 'practice',
        target: 'sqlLevelBar'
    },
    {
        title: 'Practica con datos reales',
        description: 'Elige un ejemplo, ejecútalo y revisa los resultados. La base SQLite funciona en el navegador.',
        section: 'practice',
        target: 'sqlEditor'
    },
    {
        title: 'Cursos con proyecto final',
        description: 'Cuatro itinerarios, 15 lecciones, quizzes, checkpoints y proyecto final. Cambia el dataset SQL o NoSQL y el avance se guarda por separado.',
        section: 'path',
        courseCatalog: true,
        target: 'courseCatalogView'
    },
    {
        title: 'Explora el laboratorio NoSQL',
        description: 'Consola documental tipo MongoDB con CRUD, agregaciones y retos. Los ejemplos también se filtran por nivel.',
        section: 'nosql',
        target: 'nosqlEditor'
    },
    {
        title: 'Ponte a prueba',
        description: 'Retos SQL, retos NoSQL y depuraciones con validación por resultado, pistas y progreso guardado.',
        section: 'challenges',
        target: 'sqlChallengesTab'
    },
    {
        title: 'Juega con la Torre de Datos',
        description: 'Un deckbuilder de 6 pisos: construye consultas con cartas y supera cada piso. Funciona con teclado, ratón o mando.',
        section: 'game',
        gameMode: 'deckbuilder',
        target: 'gameTower'
    },
    {
        title: 'Corre con Monte Mamut',
        description: 'Un runner de cinco niveles: montañas nevadas, playa con criaturas marinas y Ciudad Gótica en patineta. Salta, usa la trompa, come espinaca en la montaña, bebe energía para volar en la ciudad y encuentra aliados tecnológicos. Puedes empezar por cualquier nivel y también se juega con mando.',
        section: 'game',
        gameMode: 'trompo',
        target: 'trompoCanvas'
    },
    {
        title: 'Analiza el dataset',
        description: 'Revisa el resumen, el diagrama ERD, el explorador y editor de tablas, y las comprobaciones de calidad.',
        section: 'analyze',
        target: 'analyzeSummary'
    },
    {
        title: 'Sigue tu progreso',
        description: 'Consulta tu nivel, el avance por curso, la actividad completada y el siguiente paso. También puedes generar un reporte imprimible.',
        section: 'path',
        progress: true,
        target: 'learningProgressDashboard'
    },
    {
        title: 'Tecnología y aprendizaje',
        description: 'SQLite real en el navegador, PWA instalable, navegación móvil, accesibilidad y asistente IA opcional. Gracias por acompañar el recorrido.',
        section: null
    }
];

let demoTourIndex = 0;

function scrollToDemoTarget(targetId) {
    if (!targetId) return;
    const target = document.getElementById(targetId);
    if (target && typeof target.scrollIntoView === 'function') {
        const reduceMotion = typeof window.matchMedia === 'function'
            && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        target.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'center' });
    }
}

function renderDemoTourStep() {
    const bar = document.getElementById('demoTourBar');
    if (!bar) return;
    const step = DEMO_TOUR_STEPS[demoTourIndex];
    if (!step) {
        closeDemoTour();
        return;
    }

    bar.hidden = false;
    const stepLabel = document.getElementById('demoTourStepLabel');
    const title = document.getElementById('demoTourTitle');
    const description = document.getElementById('demoTourDescription');
    const previous = document.getElementById('demoTourPrevBtn');
    const next = document.getElementById('demoTourNextBtn');

    if (stepLabel) stepLabel.textContent = `Paso ${demoTourIndex + 1} de ${DEMO_TOUR_STEPS.length}`;
    if (title) title.textContent = step.title;
    if (description) description.textContent = step.description;
    if (previous) previous.disabled = demoTourIndex === 0;
    if (next) next.textContent = demoTourIndex === DEMO_TOUR_STEPS.length - 1 ? 'Finalizar' : 'Siguiente';

    if (step.section) {
        activateSection(step.section);
        if (step.progress) activatePathTab('progress');
        if (step.courseCatalog) {
            activatePathTab('lessons');
            renderCourseCatalog();
        }
        if (step.gameMode && typeof window.switchGameMode === 'function') {
            window.switchGameMode(step.gameMode);
        }
    }
    if (step.target) {
        setTimeout(() => scrollToDemoTarget(step.target), 80);
    }
}

function startDemoTour() {
    demoTourIndex = 0;
    renderDemoTourStep();
}

function nextDemoTourStep() {
    if (demoTourIndex >= DEMO_TOUR_STEPS.length - 1) {
        closeDemoTour();
        showToast('success', 'Recorrido completado. Gracias por acompañar SQL Academy.');
        return;
    }
    demoTourIndex += 1;
    renderDemoTourStep();
}

function previousDemoTourStep() {
    if (demoTourIndex <= 0) return;
    demoTourIndex -= 1;
    renderDemoTourStep();
}

function closeDemoTour() {
    const bar = document.getElementById('demoTourBar');
    if (bar) bar.hidden = true;
}
