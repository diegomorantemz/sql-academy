const STORAGE_KEYS = {
    history: 'sql-academy-history-v1',
    preferences: 'sql-academy-preferences-v1',
    challenges: 'sql-academy-challenges-v1',
    learningPath: 'sql-academy-path-v1',
    activeCourse: 'sql-academy-active-course-v1',
    nosqlCourse: 'sql-academy-nosql-course-v1',
    courseAssessment: 'sql-academy-course-assessment-v1',
    skillProfile: 'sql-academy-skill-profile-v1'
};
const PERSIST_DB_NAME = 'sql-academy';
const PERSIST_DB_VERSION = 1;
const PERSIST_STORE = 'database';
const HISTORY_LIMIT = 30;

/** Lee un valor JSON de localStorage sin romper la app si está bloqueado. */
function readStoredJSON(key, fallback) {
    try {
        const raw = window.localStorage.getItem(key);
        if (!raw) return fallback;
        const parsed = JSON.parse(raw);
        return parsed ?? fallback;
    } catch (error) {
        console.warn(`No se pudo leer ${key} de localStorage:`, error);
        return fallback;
    }
}

/** Guarda un valor JSON en localStorage. */
function writeStoredJSON(key, value) {
    try {
        window.localStorage.setItem(key, JSON.stringify(value));
        return true;
    } catch (error) {
        console.warn(`No se pudo guardar ${key} en localStorage:`, error);
        return false;
    }
}

function removeStoredItem(key) {
    try {
        window.localStorage.removeItem(key);
    } catch (error) {
        console.warn(`No se pudo eliminar ${key} de localStorage:`, error);
    }
}
