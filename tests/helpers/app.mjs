import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import { JSDOM } from 'jsdom';

const PROJECT_ROOT = new URL('../../', import.meta.url);
const DEFAULT_HTML = '<!doctype html><html><body></body></html>';

export const APP_SCRIPTS = [
    'datasets.js',
    'nosql-datasets.js',
    'install-guides.js',
    'courses.js',
    'course-content.js',
    'checkpoint-content.js',
    'nosql-engine.js',
    'script.js',
    'nosql.js',
    'autocomplete.js',
    'deckbuilder.js',
    'trompo.js'
];

export const APP_DATA_SCRIPTS = [
    'datasets.js',
    'nosql-datasets.js',
    'install-guides.js',
    'courses.js',
    'course-content.js',
    'checkpoint-content.js'
];

export function projectFile(relativePath) {
    return fileURLToPath(new URL(relativePath, PROJECT_ROOT));
}

export function readProjectFile(relativePath) {
    return fs.readFileSync(projectFile(relativePath), 'utf8');
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
    for (const file of scripts) {
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
