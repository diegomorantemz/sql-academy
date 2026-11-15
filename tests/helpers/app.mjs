import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import { JSDOM } from 'jsdom';

const PROJECT_ROOT = new URL('../../', import.meta.url);
const DEFAULT_HTML = '<!doctype html><html><body></body></html>';

export const CORE_SCRIPTS = [
    'js/core/state.js',
    'js/core/storage.js',
    'js/core/dom.js',
    'js/core/format.js',
    'js/core/database.js'
];

export const APP_SCRIPTS = [
    ...CORE_SCRIPTS,
    'js/data/datasets.js',
    'js/data/nosql-datasets.js',
    'js/data/install-guides.js',
    'js/data/courses.js',
    'js/data/course-content.js',
    'js/data/checkpoint-content.js',
    'js/features/nosql/engine.js',
    'js/app.js',
    'js/app/navigation.js',
    'js/features/onboarding.js',
    'js/features/nosql/challenges.js',
    'js/features/fair-tour.js',
    'js/features/progress.js',
    'js/features/donations.js',
    'js/features/database-managers.js',
    'js/features/learn-library.js',
    'js/features/challenges.js',
    'js/features/debug-challenges.js',
    'js/features/skill-test.js',
    'js/features/learning-path.js',
    'js/features/courses.js',
    'js/features/dashboard.js',
    'js/features/lessons.js',
    'js/features/assistant.js',
    'js/features/results.js',
    'js/features/explorer.js',
    'js/features/examples.js',
    'js/features/nosql/ui.js',
    'js/features/autocomplete.js',
    'js/games/deckbuilder.js',
    'js/games/trompo.js',
    'js/global-exports.js'
];

export const STYLE_FILES = [
    'styles/base.css',
    'styles/learning.css',
    'styles/editor.css',
    'styles/challenges.css',
    'styles/components.css',
    'styles/layout.css',
    'styles/themes.css',
    'styles/nosql.css',
    'styles/learning-path.css',
    'styles/games.css',
    'styles/library.css',
    'styles/install-guides.css',
    'styles/courses.css',
    'styles/lessons.css',
    'styles/mobile.css',
    'styles/trompo.css'
];

export const APP_DATA_SCRIPTS = [
    'js/data/datasets.js',
    'js/data/nosql-datasets.js',
    'js/data/install-guides.js',
    'js/data/courses.js',
    'js/data/course-content.js',
    'js/data/checkpoint-content.js'
];

export function projectFile(relativePath) {
    return fileURLToPath(new URL(relativePath, PROJECT_ROOT));
}

export function readProjectFile(relativePath) {
    return fs.readFileSync(projectFile(relativePath), 'utf8');
}

export function readStyles() {
    return STYLE_FILES.map(readProjectFile).join('\n');
}

export function createDom(html = DEFAULT_HTML, options = {}) {
    return new JSDOM(html, {
        url: 'https://sql-academy.test/',
        runScripts: 'dangerously',
        pretendToBeVisual: true,
        ...options
    });
}

export function loadScripts(window, scripts = APP_SCRIPTS) {
    const files = [
        ...CORE_SCRIPTS.filter(file => !scripts.includes(file)),
        ...scripts
    ];
    for (const file of files) {
        const script = window.document.createElement('script');
        script.textContent = readProjectFile(file);
        window.document.body.appendChild(script);
    }
}

export function createAppDom({
    html = DEFAULT_HTML,
    scripts = APP_SCRIPTS,
    beforeLoad,
    ...options
} = {}) {
    const dom = createDom(html, options);
    if (beforeLoad) beforeLoad(dom.window);
    loadScripts(dom.window, scripts);
    return dom;
}
