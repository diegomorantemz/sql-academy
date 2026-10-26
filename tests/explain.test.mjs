import test from 'node:test';
import assert from 'node:assert/strict';
import handler, {
    ALLOWED_MODES,
    buildUserPrompt,
    cleanString,
    getGeminiErrorCode,
    getModeSystemPrompt,
    resolveModel
} from '../netlify/functions/explain.mjs';

test('ALLOWED_MODES contiene todos los modos del asistente', () => {
    assert.deepEqual(
        [...ALLOWED_MODES].sort(),
        ['error', 'exercise', 'explain', 'hint', 'nosql', 'review']
    );
});

test('cleanString ignora valores no textuales y recorta', () => {
    assert.equal(cleanString('  hola  ', 4), '  ho');
    assert.equal(cleanString(123, 10), '');
    assert.equal(cleanString(null, 10), '');
});

test('resolveModel usa el fallback cuando el valor está vacío', () => {
    assert.equal(resolveModel('  gemini-custom  ', 'fallback'), 'gemini-custom');
    assert.equal(resolveModel('', 'fallback'), 'fallback');
    assert.equal(resolveModel(null, 'fallback'), 'fallback');
});

test('getGeminiErrorCode traduce los estados HTTP', () => {
    assert.equal(getGeminiErrorCode(400), 'gemini_bad_request');
    assert.equal(getGeminiErrorCode(401), 'gemini_auth');
    assert.equal(getGeminiErrorCode(403), 'gemini_auth');
    assert.equal(getGeminiErrorCode(404), 'model_unavailable');
    assert.equal(getGeminiErrorCode(429), 'quota');
    assert.equal(getGeminiErrorCode(500), 'gemini_unavailable');
    assert.equal(getGeminiErrorCode(503), 'model_overloaded');
    assert.equal(getGeminiErrorCode(418), 'upstream');
});

test('getModeSystemPrompt añade instrucciones específicas', () => {
    assert.match(getModeSystemPrompt('hint'), /PISTA/);
    assert.match(getModeSystemPrompt('exercise'), /EJERCICIO/);
    assert.match(getModeSystemPrompt('review'), /REVISIÓN/);
    assert.match(getModeSystemPrompt('explain'), /EXPLICACIÓN/);
    assert.match(getModeSystemPrompt('error'), /ERROR/);
    assert.match(getModeSystemPrompt('nosql'), /NOSQL/);
});

test('buildUserPrompt cambia según el modo', () => {
    const schema = 'CREATE TABLE estudiantes (id INTEGER);';

    const hint = buildUserPrompt({
        query: 'SELECT * FROM estudiantes;',
        schema,
        mode: 'hint'
    });
    assert.match(hint, /pista/i);
    assert.match(hint, /SELECT \* FROM estudiantes/);
    assert.match(hint, /No escribas la solución completa/);

    const exercise = buildUserPrompt({
        query: '',
        schema,
        mode: 'exercise'
    });
    assert.match(exercise, /Diseña un ejercicio/);
    assert.match(exercise, /CREATE TABLE estudiantes/);
    assert.match(exercise, /No incluyas la consulta solución/);

    const review = buildUserPrompt({
        query: 'SELECT 1;',
        schema,
        mode: 'review'
    });
    assert.match(review, /Revisa esta consulta SQL/);
    assert.match(review, /SELECT 1/);

    const error = buildUserPrompt({
        query: 'SELEC 1;',
        error: 'near "SELEC": syntax error',
        schema,
        mode: 'error'
    });
    assert.match(error, /near "SELEC"/);
    assert.match(error, /consulta corregida/);

    const nosql = buildUserPrompt({
        query: 'db.estudiantes.find({ edad: { $gt: 18 } })',
        schema: 'estudiantes(_id:string, nombre:string, edad:number)',
        mode: 'nosql'
    });
    assert.match(nosql, /consola educativa de MongoDB/);
    assert.match(nosql, /db\.estudiantes\.find/);
    assert.match(nosql, /No lo ejecutes/);
});

test('el handler rechaza métodos no POST y claves ausentes', async () => {
    const originalKey = process.env.GEMINI_API_KEY;

    try {
        delete process.env.GEMINI_API_KEY;

        const getResponse = await handler(
            new Request('https://example.com/api/explain', { method: 'GET' }),
            {}
        );
        assert.equal(getResponse.status, 405);
        assert.equal((await getResponse.json()).error, 'method_not_allowed');

        const postResponse = await handler(
            new Request('https://example.com/api/explain', {
                method: 'POST',
                body: JSON.stringify({ query: 'SELECT 1;' })
            }),
            {}
        );
        assert.equal(postResponse.status, 503);
        assert.equal((await postResponse.json()).error, 'missing_key');
    } finally {
        if (originalKey === undefined) delete process.env.GEMINI_API_KEY;
        else process.env.GEMINI_API_KEY = originalKey;
    }
});

test('el handler valida JSON, consulta y esquema', async () => {
    const originalKey = process.env.GEMINI_API_KEY;
    process.env.GEMINI_API_KEY = 'test-key';

    try {
        const invalidJson = await handler(
            new Request('https://example.com/api/explain', {
                method: 'POST',
                body: '{'
            }),
            {}
        );
        assert.equal(invalidJson.status, 400);
        assert.equal((await invalidJson.json()).error, 'invalid_json');

        const emptyQuery = await handler(
            new Request('https://example.com/api/explain', {
                method: 'POST',
                body: JSON.stringify({ mode: 'explain' })
            }),
            {}
        );
        assert.equal(emptyQuery.status, 400);
        assert.equal((await emptyQuery.json()).error, 'empty_query');

        const emptySchema = await handler(
            new Request('https://example.com/api/explain', {
                method: 'POST',
                body: JSON.stringify({ mode: 'exercise' })
            }),
            {}
        );
        assert.equal(emptySchema.status, 400);
        assert.equal((await emptySchema.json()).error, 'empty_schema');
    } finally {
        if (originalKey === undefined) delete process.env.GEMINI_API_KEY;
        else process.env.GEMINI_API_KEY = originalKey;
    }
});

test('el handler envía el modo y devuelve la respuesta de Gemini', async () => {
    const originalKey = process.env.GEMINI_API_KEY;
    const originalFetch = globalThis.fetch;
    let requestBody = null;

    process.env.GEMINI_API_KEY = 'test-key';
    globalThis.fetch = async (url, options) => {
        requestBody = JSON.parse(options.body);
        return new Response(JSON.stringify({
            candidates: [{ content: { parts: [{ text: 'Pista de prueba' }] } }]
        }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' }
        });
    };

    try {
        const response = await handler(
            new Request('https://example.com/api/explain', {
                method: 'POST',
                headers: { 'x-nf-client-connection-ip': '127.0.0.9' },
                body: JSON.stringify({
                    query: 'SELECT * FROM estudiantes;',
                    schema: 'CREATE TABLE estudiantes (id INTEGER);',
                    mode: 'hint'
                })
            }),
            {}
        );

        assert.equal(response.status, 200);
        const data = await response.json();
        assert.equal(data.explanation, 'Pista de prueba');
        assert.equal(data.mode, 'hint');
        assert.match(requestBody.systemInstruction.parts[0].text, /PISTA/);
        assert.match(requestBody.contents[0].parts[0].text, /SELECT \* FROM estudiantes/);
    } finally {
        globalThis.fetch = originalFetch;
        if (originalKey === undefined) delete process.env.GEMINI_API_KEY;
        else process.env.GEMINI_API_KEY = originalKey;
    }
});
