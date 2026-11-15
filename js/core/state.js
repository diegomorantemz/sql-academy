// Estado compartido de la aplicación.

let db;
let SQLModule = null;
let dbInitialized = false;
let queryHistory = [];
let diagramFullView = false;
let analyzeSelectedTable = null;
let analyzeExplorerMode = 'view';
const TABLE_EDITOR_ROW_LIMIT = 100;

// ============================================
// PERSISTENCIA LOCAL
// ============================================

let persistenceDbPromise = null;
let persistTimer = null;
let preferences = {
    theme: 'light',
    safeMode: true,
    dataset: 'escuela'
};

// ============================================
// ASISTENTE IA
// ============================================

const AI_ENDPOINT = '/api/explain';
const AI_MAX_QUERY_CHARS = 4000;
const AI_CACHE_LIMIT = 20;
const AI_COOLDOWN_MS = 15000;
const AI_REQUEST_TIMEOUT_MS = 25000;

let lastQueryError = null;
let aiLastContext = null;
let aiLastResponse = '';
let aiRequestInFlight = false;
let aiAbortController = null;
let aiCooldownUntil = 0;

const aiResponseCache = new Map();

// ============================================
// RESULTADOS
// ============================================

const RESULTS_PAGE_SIZE = 100;
let lastResultSets = [];
let lastQueryMeta = { durationMs: 0, executedAt: null };
let resultRowLimits = [];
let resultSortState = [];
let lastFocusedElement = null;
let deferredInstallPrompt = null;

const FOCUSABLE_SELECTOR = 'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])';

// Estado compartido de retos y aprendizaje
let currentChallengeId = null;
let challengeAttempts = 0;
let challengeProgress = {};
let selectedNoSQLChallengeId = null;
let learningPathProgress = {};
let nosqlCourseProgress = {};
let courseAssessment = {};
let currentLearningLessonId = null;
let currentCourseId = null;
let currentCourseView = 'catalog';
let currentLessonStep = 'concept';
let currentCheckpoint = null;
let learningPathEventsBound = false;
