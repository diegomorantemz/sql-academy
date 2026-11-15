/**
 * Motor documental mínimo, inspirado en MongoDB.
 *
 * No ejecuta JavaScript del usuario: las consultas se tokenizan y se parsean
 * con un subconjunto seguro de la sintaxis de Mongo shell. El estado es un
 * objeto JSON normal, de modo que se puede guardar en IndexedDB y testear sin
 * navegador.
 */
(function (global) {
    'use strict';

    const MAX_RESULTS = 500;
    const BLOCKED_KEYS = new Set(['__proto__', 'prototype', 'constructor']);
    const CURSOR_METHODS = new Set(['sort', 'skip', 'limit', 'project']);
    const WRITE_METHODS = new Set([
        'insertOne',
        'insertMany',
        'updateOne',
        'updateMany',
        'deleteOne',
        'deleteMany',
        'drop'
    ]);

    let generatedIdCounter = 0;

    function deepClone(value) {
        if (value === undefined) return undefined;
        return JSON.parse(JSON.stringify(value));
    }

    function isPlainObject(value) {
        return value !== null && typeof value === 'object' && !Array.isArray(value);
    }

    function assertSafeKey(key) {
        if (BLOCKED_KEYS.has(String(key))) {
            throw new Error(`Clave no permitida: ${key}`);
        }
    }

    function assertSafeValue(value) {
        if (Array.isArray(value)) {
            value.forEach(assertSafeValue);
            return;
        }
        if (!isPlainObject(value)) return;
        Object.entries(value).forEach(([key, item]) => {
            assertSafeKey(key);
            assertSafeValue(item);
        });
    }

    function deepEqual(a, b) {
        if (a === b) return true;
        if (Number.isNaN(a) && Number.isNaN(b)) return true;
        if (a === null || b === null || a === undefined || b === undefined) return false;
        if (typeof a !== typeof b) return false;
        if (Array.isArray(a) || Array.isArray(b)) {
            if (!Array.isArray(a) || !Array.isArray(b) || a.length !== b.length) return false;
            return a.every((item, index) => deepEqual(item, b[index]));
        }
        if (isPlainObject(a) && isPlainObject(b)) {
            const keysA = Object.keys(a);
            const keysB = Object.keys(b);
            if (keysA.length !== keysB.length) return false;
            return keysA.every(key => Object.prototype.hasOwnProperty.call(b, key) && deepEqual(a[key], b[key]));
        }
        return false;
    }

    /** Devuelve todos los valores que coinciden con una ruta con notación de puntos. */
    function getPathValues(value, path) {
        const parts = String(path).split('.').filter(Boolean);
        parts.forEach(assertSafeKey);

        function walk(current, index) {
            if (index >= parts.length) return [current];

            if (Array.isArray(current)) {
                return current.reduce((acc, item) => acc.concat(walk(item, index)), []);
            }

            if (isPlainObject(current) && Object.prototype.hasOwnProperty.call(current, parts[index])) {
                return walk(current[parts[index]], index + 1);
            }

            return [];
        }

        return walk(value, 0);
    }

    function getPathValue(value, path) {
        const values = getPathValues(value, path);
        return values.length ? values[0] : undefined;
    }

    function setPath(target, path, value) {
        const parts = String(path).split('.').filter(Boolean);
        if (!parts.length) return;
        parts.forEach(assertSafeKey);

        let current = target;
        for (let index = 0; index < parts.length - 1; index += 1) {
            const key = parts[index];
            if (!isPlainObject(current[key])) current[key] = {};
            current = current[key];
        }
        current[parts[parts.length - 1]] = value;
    }

    function unsetPath(target, path) {
        const parts = String(path).split('.').filter(Boolean);
        if (!parts.length) return;
        parts.forEach(assertSafeKey);

        let current = target;
        for (let index = 0; index < parts.length - 1; index += 1) {
            const key = parts[index];
            if (!isPlainObject(current[key])) return;
            current = current[key];
        }
        delete current[parts[parts.length - 1]];
    }

    function compareValues(a, b) {
        if (a === b) return 0;
        if (a === undefined || a === null) return -1;
        if (b === undefined || b === null) return 1;
        if (typeof a === 'number' && typeof b === 'number') return a - b;
        if (typeof a === 'string' && typeof b === 'string') return a.localeCompare(b);
        if (typeof a === 'boolean' && typeof b === 'boolean') return a === b ? 0 : (a ? 1 : -1);
        return String(a).localeCompare(String(b));
    }

    function regexFrom(value, options) {
        if (value instanceof RegExp) return value;
        const pattern = String(value);
        try {
            return new RegExp(pattern, options || '');
        } catch (error) {
            throw new Error(`Expresión regular inválida: ${pattern}`);
        }
    }

    function matchesCondition(values, condition) {
        if (isPlainObject(condition)) {
            const keys = Object.keys(condition);
            const hasOperator = keys.some(key => key.startsWith('$'));

            if (!hasOperator) {
                return values.some(value => deepEqual(value, condition));
            }

            return keys.every(operator => {
                const expected = condition[operator];

                switch (operator) {
                    case '$eq':
                        return values.some(value => deepEqual(value, expected));
                    case '$ne':
                        return !values.some(value => deepEqual(value, expected));
                    case '$gt':
                        return values.some(value => value !== undefined && compareValues(value, expected) > 0);
                    case '$gte':
                        return values.some(value => value !== undefined && compareValues(value, expected) >= 0);
                    case '$lt':
                        return values.some(value => value !== undefined && compareValues(value, expected) < 0);
                    case '$lte':
                        return values.some(value => value !== undefined && compareValues(value, expected) <= 0);
                    case '$in':
                        if (!Array.isArray(expected)) throw new Error('$in necesita un arreglo');
                        return values.some(value => expected.some(item => {
                            if (item instanceof RegExp) return item.test(String(value));
                            return deepEqual(value, item);
                        }));
                    case '$nin':
                        if (!Array.isArray(expected)) throw new Error('$nin necesita un arreglo');
                        return !values.some(value => expected.some(item => deepEqual(value, item)));
                    case '$exists':
                        return expected ? values.length > 0 : values.length === 0;
                    case '$regex':
                        return values.some(value => regexFrom(expected, condition.$options || '').test(String(value)));
                    case '$options':
                        return true;
                    case '$size':
                        return values.some(value => Array.isArray(value) && value.length === Number(expected));
                    case '$all':
                        if (!Array.isArray(expected)) throw new Error('$all necesita un arreglo');
                        return values.some(value => Array.isArray(value) && expected.every(item => value.some(entry => deepEqual(entry, item))));
                    case '$elemMatch':
                        return values.some(value => Array.isArray(value) && value.some(item => matchesFilter(item, expected)));
                    case '$not':
                        return !matchesCondition(values, expected);
                    default:
                        throw new Error(`Operador no soportado: ${operator}`);
                }
            });
        }

        return values.some(value => deepEqual(value, condition));
    }

    function matchesFilter(document, filter) {
        if (!filter || !isPlainObject(filter) || Object.keys(filter).length === 0) return true;

        return Object.entries(filter).every(([key, condition]) => {
            if (key === '$and') {
                if (!Array.isArray(condition)) throw new Error('$and necesita un arreglo');
                return condition.every(item => matchesFilter(document, item));
            }
            if (key === '$or') {
                if (!Array.isArray(condition)) throw new Error('$or necesita un arreglo');
                return condition.some(item => matchesFilter(document, item));
            }
            if (key === '$nor') {
                if (!Array.isArray(condition)) throw new Error('$nor necesita un arreglo');
                return !condition.some(item => matchesFilter(document, item));
            }
            if (key === '$not') {
                return !matchesFilter(document, condition);
            }
            if (key.startsWith('$')) {
                throw new Error(`Operador lógico no soportado: ${key}`);
            }

            return matchesCondition(getPathValues(document, key), condition);
        });
    }

    function sortDocuments(documents, sort) {
        if (!sort || !isPlainObject(sort)) return documents;
        const fields = Object.entries(sort);
        return documents.slice().sort((left, right) => {
            for (const [field, direction] of fields) {
                const order = Number(direction) < 0 ? -1 : 1;
                const leftValue = getPathValue(left, field);
                const rightValue = getPathValue(right, field);
                const comparison = compareValues(leftValue, rightValue);
                if (comparison !== 0) return comparison * order;
            }
            return 0;
        });
    }

    function evaluateExpression(document, expression) {
        if (typeof expression === 'string' && expression.startsWith('$')) {
            return getPathValue(document, expression.slice(1));
        }

        if (Array.isArray(expression)) {
            return expression.map(item => evaluateExpression(document, item));
        }

        if (isPlainObject(expression)) {
            const keys = Object.keys(expression);
            if (keys.length === 1 && keys[0].startsWith('$')) {
                const operator = keys[0];
                const value = expression[operator];

                switch (operator) {
                    case '$literal':
                        return value;
                    case '$add':
                        return (Array.isArray(value) ? value : []).reduce((total, item) => total + Number(evaluateExpression(document, item) || 0), 0);
                    case '$subtract': {
                        const values = (Array.isArray(value) ? value : []).map(item => Number(evaluateExpression(document, item) || 0));
                        return (values[0] || 0) - (values[1] || 0);
                    }
                    case '$multiply':
                        return (Array.isArray(value) ? value : []).reduce((total, item) => total * Number(evaluateExpression(document, item) || 0), 1);
                    case '$divide': {
                        const values = (Array.isArray(value) ? value : []).map(item => Number(evaluateExpression(document, item) || 0));
                        return values[1] ? values[0] / values[1] : null;
                    }
                    case '$concat':
                        return (Array.isArray(value) ? value : []).map(item => evaluateExpression(document, item)).join('');
                    case '$toUpper':
                        return String(evaluateExpression(document, value) || '').toUpperCase();
                    case '$toLower':
                        return String(evaluateExpression(document, value) || '').toLowerCase();
                    case '$size':
                        return Array.isArray(evaluateExpression(document, value)) ? evaluateExpression(document, value).length : 0;
                    case '$ifNull': {
                        const values = Array.isArray(value) ? value : [];
                        const first = evaluateExpression(document, values[0]);
                        return first === null || first === undefined ? evaluateExpression(document, values[1]) : first;
                    }
                    default:
                        throw new Error(`Expresión no soportada: ${operator}`);
                }
            }

            keys.forEach(assertSafeKey);
            return Object.fromEntries(keys.map(key => [key, evaluateExpression(document, expression[key])]));
        }

        return expression;
    }

    function projectDocument(document, projection, allowExpressions) {
        if (!projection || !isPlainObject(projection)) return deepClone(document);

        const keys = Object.keys(projection);
        keys.forEach(assertSafeKey);
        const includeMode = keys.some(key => {
            const value = projection[key];
            return value === 1 || (allowExpressions && value !== 0);
        });

        if (!includeMode) {
            const result = deepClone(document);
            keys.forEach(key => {
                if (projection[key] === 0) unsetPath(result, key);
            });
            return result;
        }

        const result = {};
        keys.forEach(key => {
            const value = projection[key];
            if (value === 0) return;
            if (value === 1) {
                const current = getPathValue(document, key);
                if (current !== undefined) setPath(result, key, deepClone(current));
                return;
            }
            if (allowExpressions) {
                setPath(result, key, deepClone(evaluateExpression(document, value)));
            }
        });

        if (projection._id !== 0 && document._id !== undefined && result._id === undefined) {
            result._id = document._id;
        }

        return result;
    }

    function applyUpdate(document, update) {
        if (!isPlainObject(update)) throw new Error('La actualización debe ser un objeto JSON.');
        assertSafeValue(update);

        const operatorKeys = Object.keys(update).filter(key => key.startsWith('$'));
        if (operatorKeys.length === 0) {
            const originalId = document._id;
            Object.keys(document).forEach(key => delete document[key]);
            Object.assign(document, deepClone(update));
            if (originalId !== undefined) document._id = originalId;
            return document;
        }

        operatorKeys.forEach(operator => {
            const values = update[operator];
            if (!isPlainObject(values)) throw new Error(`${operator} necesita un objeto`);

            switch (operator) {
                case '$set':
                    Object.entries(values).forEach(([path, value]) => setPath(document, path, deepClone(value)));
                    break;
                case '$unset':
                    Object.keys(values).forEach(path => unsetPath(document, path));
                    break;
                case '$inc':
                    Object.entries(values).forEach(([path, value]) => {
                        const current = Number(getPathValue(document, path));
                        setPath(document, path, (Number.isFinite(current) ? current : 0) + Number(value));
                    });
                    break;
                case '$push':
                    Object.entries(values).forEach(([path, value]) => {
                        const current = getPathValue(document, path);
                        if (!Array.isArray(current)) setPath(document, path, []);
                        const target = getPathValue(document, path);
                        if (isPlainObject(value) && Array.isArray(value.$each)) {
                            value.$each.forEach(item => target.push(deepClone(item)));
                        } else {
                            target.push(deepClone(value));
                        }
                    });
                    break;
                case '$addToSet':
                    Object.entries(values).forEach(([path, value]) => {
                        const current = getPathValue(document, path);
                        if (!Array.isArray(current)) setPath(document, path, []);
                        const target = getPathValue(document, path);
                        const items = isPlainObject(value) && Array.isArray(value.$each) ? value.$each : [value];
                        items.forEach(item => {
                            if (!target.some(entry => deepEqual(entry, item))) target.push(deepClone(item));
                        });
                    });
                    break;
                case '$pull':
                    Object.entries(values).forEach(([path, value]) => {
                        const current = getPathValue(document, path);
                        if (!Array.isArray(current)) return;
                        setPath(document, path, current.filter(item => !deepEqual(item, value)));
                    });
                    break;
                case '$rename':
                    Object.entries(values).forEach(([from, to]) => {
                        const current = getPathValue(document, from);
                        if (current === undefined) return;
                        unsetPath(document, from);
                        setPath(document, String(to), current);
                    });
                    break;
                default:
                    throw new Error(`Operador de actualización no soportado: ${operator}`);
            }
        });

        return document;
    }

    /**
     * Tokenizador seguro. Los comentarios y los espacios se ignoran fuera de
     * las cadenas. No se usa eval ni Function.
     */
    function tokenize(input) {
        const tokens = [];
        let index = 0;

        function isIdentifierStart(char) {
            return /[A-Za-z_$]/.test(char);
        }

        function isIdentifierPart(char) {
            return /[A-Za-z0-9_$]/.test(char);
        }

        function skipWhitespaceAndComments() {
            while (index < input.length) {
                const char = input[index];
                if (/\s/.test(char)) {
                    index += 1;
                    continue;
                }
                if (char === '/' && input[index + 1] === '/') {
                    index += 2;
                    while (index < input.length && input[index] !== '\n') index += 1;
                    continue;
                }
                if (char === '/' && input[index + 1] === '*') {
                    index += 2;
                    while (index < input.length && !(input[index] === '*' && input[index + 1] === '/')) index += 1;
                    index += 2;
                    continue;
                }
                break;
            }
        }

        while (index < input.length) {
            skipWhitespaceAndComments();
            if (index >= input.length) break;

            const char = input[index];

            if ('{}[](),:.;'.includes(char)) {
                tokens.push({ type: 'punct', value: char });
                index += 1;
                continue;
            }

            if (char === '"' || char === "'") {
                const quote = char;
                index += 1;
                let value = '';
                while (index < input.length && input[index] !== quote) {
                    if (input[index] === '\\') {
                        index += 1;
                        const escaped = input[index];
                        const escapes = { n: '\n', r: '\r', t: '\t', b: '\b', f: '\f', '\\': '\\', '"': '"', "'": "'" };
                        if (escaped === 'u') {
                            const hex = input.slice(index + 1, index + 5);
                            value += String.fromCharCode(parseInt(hex, 16) || 0);
                            index += 5;
                            continue;
                        }
                        value += escapes[escaped] !== undefined ? escapes[escaped] : escaped;
                        index += 1;
                        continue;
                    }
                    value += input[index];
                    index += 1;
                }
                if (input[index] !== quote) throw new Error('Cadena sin cerrar');
                index += 1;
                tokens.push({ type: 'string', value });
                continue;
            }

            if (/[0-9-]/.test(char) && (char !== '-' || /[0-9]/.test(input[index + 1]))) {
                const start = index;
                index += 1;
                while (index < input.length && /[0-9.eE+-]/.test(input[index])) index += 1;
                const raw = input.slice(start, index);
                const value = Number(raw);
                if (!Number.isFinite(value)) throw new Error(`Número inválido: ${raw}`);
                tokens.push({ type: 'number', value });
                continue;
            }

            if (isIdentifierStart(char)) {
                const start = index;
                index += 1;
                while (index < input.length && isIdentifierPart(input[index])) index += 1;
                tokens.push({ type: 'identifier', value: input.slice(start, index) });
                continue;
            }

            throw new Error(`Carácter no válido: ${char}`);
        }

        tokens.push({ type: 'eof', value: '' });
        return tokens;
    }

    function createParser(tokens) {
        let index = 0;

        function peek() {
            return tokens[index];
        }

        function consume() {
            const token = tokens[index];
            index += 1;
            return token;
        }

        function expect(type, value) {
            const token = peek();
            if (token.type !== type || (value !== undefined && token.value !== value)) {
                throw new Error(`Se esperaba ${value || type} y se encontró ${token.value || token.type}`);
            }
            return consume();
        }

        function parseValue() {
            const token = peek();

            if (token.type === 'string' || token.type === 'number') {
                return consume().value;
            }

            if (token.type === 'identifier') {
                const value = consume().value;
                if (value === 'true') return true;
                if (value === 'false') return false;
                if (value === 'null') return null;
                if (value === 'undefined') return undefined;

                if (value === 'ObjectId') {
                    expect('punct', '(');
                    const id = parseValue();
                    expect('punct', ')');
                    return String(id);
                }

                return value;
            }

            if (token.type === 'punct' && token.value === '{') {
                return parseObject();
            }

            if (token.type === 'punct' && token.value === '[') {
                return parseArray();
            }

            throw new Error(`Valor no válido: ${token.value || token.type}`);
        }

        function parseObject() {
            expect('punct', '{');
            const result = {};

            while (!(peek().type === 'punct' && peek().value === '}')) {
                const keyToken = consume();
                if (!['identifier', 'string', 'number'].includes(keyToken.type)) {
                    throw new Error(`Clave no válida: ${keyToken.value}`);
                }
                expect('punct', ':');
                assertSafeKey(String(keyToken.value));
                result[String(keyToken.value)] = parseValue();

                if (peek().type === 'punct' && peek().value === ',') {
                    consume();
                    continue;
                }
                if (!(peek().type === 'punct' && peek().value === '}')) {
                    throw new Error('Falta una coma entre propiedades');
                }
            }

            expect('punct', '}');
            return result;
        }

        function parseArray() {
            expect('punct', '[');
            const result = [];

            while (!(peek().type === 'punct' && peek().value === ']')) {
                result.push(parseValue());
                if (peek().type === 'punct' && peek().value === ',') {
                    consume();
                    continue;
                }
                if (!(peek().type === 'punct' && peek().value === ']')) {
                    throw new Error('Falta una coma entre elementos del arreglo');
                }
            }

            expect('punct', ']');
            return result;
        }

        function parseArguments() {
            expect('punct', '(');
            const args = [];

            while (!(peek().type === 'punct' && peek().value === ')')) {
                args.push(parseValue());
                if (peek().type === 'punct' && peek().value === ',') {
                    consume();
                    continue;
                }
                if (!(peek().type === 'punct' && peek().value === ')')) {
                    throw new Error('Falta una coma entre argumentos');
                }
            }

            expect('punct', ')');
            return args;
        }

        return { peek, consume, expect, parseValue, parseArguments };
    }

    function parseCommand(input) {
        if (typeof input !== 'string' || !input.trim()) {
            throw new Error('Escribe un comando NoSQL.');
        }

        const parser = createParser(tokenize(input));
        const dbToken = parser.expect('identifier');
        if (dbToken.value !== 'db') throw new Error('El comando debe empezar con db.');

        parser.expect('punct', '.');

        let collection;
        const first = parser.expect('identifier');
        if (first.value === 'getCollection') {
            parser.expect('punct', '(');
            collection = String(parser.parseValue());
            parser.expect('punct', ')');
        } else {
            collection = first.value;
        }

        const methods = [];
        while (parser.peek().type === 'punct' && parser.peek().value === '.') {
            parser.consume();
            const method = parser.expect('identifier').value;
            const args = parser.parseArguments();
            methods.push({ name: method, args });
        }

        if (parser.peek().type === 'punct' && parser.peek().value === ';') parser.consume();
        parser.expect('eof');

        if (!methods.length) throw new Error('Falta un método después de la colección.');

        return { collection, methods };
    }

    function generateId(collectionName) {
        generatedIdCounter += 1;
        return `${collectionName}-${Date.now().toString(36)}-${generatedIdCounter}`;
    }

    function createDatabase(dataset) {
        if (!dataset || !dataset.collections) {
            throw new Error('El dataset NoSQL no es válido.');
        }

        const collections = {};
        Object.entries(dataset.collections).forEach(([name, documents]) => {
            if (!Array.isArray(documents)) throw new Error(`La colección ${name} debe ser un arreglo.`);
            collections[name] = deepClone(documents);
        });

        return {
            name: dataset.name || 'NoSQL',
            collections
        };
    }

    function getCollection(state, name) {
        if (!state || !state.collections) throw new Error('La base NoSQL no está inicializada.');
        assertSafeKey(name);
        const collection = state.collections[name];
        if (!Array.isArray(collection)) throw new Error(`La colección ${name} no existe.`);
        return collection;
    }

    function findDocuments(state, collectionName, filter, options) {
        const collection = getCollection(state, collectionName);
        let documents = collection.filter(document => matchesFilter(document, filter || {}));
        const settings = options || {};

        if (settings.sort) documents = sortDocuments(documents, settings.sort);
        if (Number.isFinite(Number(settings.skip)) && Number(settings.skip) > 0) {
            documents = documents.slice(Number(settings.skip));
        }
        if (Number.isFinite(Number(settings.limit)) && Number(settings.limit) >= 0) {
            documents = documents.slice(0, Number(settings.limit));
        }
        if (settings.projection) {
            documents = documents.map(document => projectDocument(document, settings.projection, false));
        }

        return documents.slice(0, MAX_RESULTS).map(deepClone);
    }

    function aggregateDocuments(state, collectionName, pipeline) {
        if (!Array.isArray(pipeline)) throw new Error('aggregate necesita un arreglo de etapas.');
        let documents = getCollection(state, collectionName).map(deepClone);

        pipeline.forEach(stage => {
            if (!isPlainObject(stage) || Object.keys(stage).length !== 1) {
                throw new Error('Cada etapa de aggregate debe tener una sola clave.');
            }

            const [operator, value] = Object.entries(stage)[0];

            switch (operator) {
                case '$match':
                    documents = documents.filter(document => matchesFilter(document, value));
                    break;
                case '$project':
                    documents = documents.map(document => projectDocument(document, value, true));
                    break;
                case '$addFields':
                case '$set':
                    documents = documents.map(document => {
                        const result = deepClone(document);
                        Object.entries(value || {}).forEach(([path, expression]) => {
                            setPath(result, path, deepClone(evaluateExpression(result, expression)));
                        });
                        return result;
                    });
                    break;
                case '$unset':
                    documents = documents.map(document => {
                        const result = deepClone(document);
                        (Array.isArray(value) ? value : [value]).forEach(path => unsetPath(result, String(path)));
                        return result;
                    });
                    break;
                case '$sort':
                    documents = sortDocuments(documents, value);
                    break;
                case '$skip':
                    documents = documents.slice(Math.max(0, Number(value) || 0));
                    break;
                case '$limit':
                    documents = documents.slice(0, Math.max(0, Number(value) || 0));
                    break;
                case '$count': {
                    const field = typeof value === 'string' ? value : 'count';
                    documents = [{ [field]: documents.length }];
                    break;
                }
                case '$unwind': {
                    const settings = typeof value === 'string'
                        ? { path: value, preserveNullAndEmptyArrays: false }
                        : (value || {});
                    const path = String(settings.path || '').replace(/^\$/, '');
                    const preserve = settings.preserveNullAndEmptyArrays === true;
                    const unwound = [];

                    documents.forEach(document => {
                        const current = getPathValue(document, path);
                        if (Array.isArray(current)) {
                            if (!current.length && preserve) unwound.push(document);
                            current.forEach(item => {
                                const copy = deepClone(document);
                                setPath(copy, path, deepClone(item));
                                unwound.push(copy);
                            });
                        } else if (current === undefined || current === null) {
                            if (preserve) unwound.push(document);
                        } else {
                            unwound.push(document);
                        }
                    });

                    documents = unwound;
                    break;
                }
                case '$group': {
                    const groups = new Map();
                    const groupSpec = value || {};
                    const accumulatorEntries = Object.entries(groupSpec).filter(([key]) => key !== '_id');

                    documents.forEach(document => {
                        const groupKey = evaluateExpression(document, groupSpec._id);
                        const mapKey = JSON.stringify(groupKey === undefined ? null : groupKey);

                        if (!groups.has(mapKey)) {
                            const groupDocument = { _id: groupKey === undefined ? null : groupKey };
                            accumulatorEntries.forEach(([field, accumulator]) => {
                                const [accOperator, accValue] = Object.entries(accumulator || {})[0] || [];
                                if (accOperator === '$sum') groupDocument[field] = 0;
                                else if (accOperator === '$avg') groupDocument[field] = { sum: 0, count: 0 };
                                else if (accOperator === '$push' || accOperator === '$addToSet') groupDocument[field] = [];
                                else groupDocument[field] = undefined;
                            });
                            groups.set(mapKey, groupDocument);
                        }

                        const groupDocument = groups.get(mapKey);
                        accumulatorEntries.forEach(([field, accumulator]) => {
                            const [accOperator, accValue] = Object.entries(accumulator || {})[0] || [];
                            const currentValue = evaluateExpression(document, accValue);

                            switch (accOperator) {
                                case '$sum':
                                    groupDocument[field] += Number(currentValue) || 0;
                                    break;
                                case '$avg':
                                    if (currentValue !== null && currentValue !== undefined && Number.isFinite(Number(currentValue))) {
                                        groupDocument[field].sum += Number(currentValue);
                                        groupDocument[field].count += 1;
                                    }
                                    break;
                                case '$min':
                                    if (groupDocument[field] === undefined || compareValues(currentValue, groupDocument[field]) < 0) {
                                        groupDocument[field] = currentValue;
                                    }
                                    break;
                                case '$max':
                                    if (groupDocument[field] === undefined || compareValues(currentValue, groupDocument[field]) > 0) {
                                        groupDocument[field] = currentValue;
                                    }
                                    break;
                                case '$first':
                                    if (groupDocument[field] === undefined) groupDocument[field] = currentValue;
                                    break;
                                case '$last':
                                    groupDocument[field] = currentValue;
                                    break;
                                case '$push':
                                    groupDocument[field].push(deepClone(currentValue));
                                    break;
                                case '$addToSet':
                                    if (!groupDocument[field].some(item => deepEqual(item, currentValue))) {
                                        groupDocument[field].push(deepClone(currentValue));
                                    }
                                    break;
                                default:
                                    throw new Error(`Acumulador no soportado: ${accOperator}`);
                            }
                        });
                    });

                    documents = Array.from(groups.values()).map(document => {
                        Object.entries(document).forEach(([field, current]) => {
                            if (isPlainObject(current) && Object.prototype.hasOwnProperty.call(current, 'sum') && Object.prototype.hasOwnProperty.call(current, 'count')) {
                                document[field] = current.count ? current.sum / current.count : null;
                            }
                        });
                        return document;
                    });
                    break;
                }
                default:
                    throw new Error(`Etapa de aggregate no soportada: ${operator}`);
            }
        });

        return documents.slice(0, MAX_RESULTS);
    }

    function executeCommand(state, input) {
        const command = typeof input === 'string' ? parseCommand(input) : input;
        const collectionName = command.collection;
        const firstMethod = command.methods[0];
        const methodName = firstMethod.name;
        const args = firstMethod.args;

        if (methodName === 'find' || methodName === 'findOne') {
            const filter = args[0] || {};
            const options = {};

            if (methodName === 'find') {
                if (args[1]) options.projection = args[1];
                command.methods.slice(1).forEach(method => {
                    if (!CURSOR_METHODS.has(method.name)) {
                        throw new Error(`Método de cursor no soportado: ${method.name}`);
                    }
                    if (method.name === 'sort') options.sort = method.args[0];
                    if (method.name === 'skip') options.skip = method.args[0];
                    if (method.name === 'limit') options.limit = method.args[0];
                    if (method.name === 'project') options.projection = method.args[0];
                });
            } else if (command.methods.length > 1) {
                throw new Error('findOne no admite métodos encadenados.');
            }

            if (methodName === 'findOne') {
                const documents = findDocuments(state, collectionName, filter, { projection: args[1] });
                return {
                    ok: true,
                    type: 'document',
                    collection: collectionName,
                    document: documents.length ? documents[0] : null
                };
            }

            const documents = findDocuments(state, collectionName, filter, options);
            return {
                ok: true,
                type: 'find',
                collection: collectionName,
                documents,
                count: documents.length
            };
        }

        if (command.methods.length > 1 && !CURSOR_METHODS.has(methodName)) {
            throw new Error(`${methodName} no admite métodos encadenados.`);
        }

        if (methodName === 'insertOne') {
            const collection = getCollection(state, collectionName);
            const document = deepClone(args[0]);
            if (!isPlainObject(document)) throw new Error('insertOne necesita un documento.');
            assertSafeValue(document);
            if (document._id === undefined) document._id = generateId(collectionName);
            if (collection.some(item => deepEqual(item._id, document._id))) {
                throw new Error(`Ya existe un documento con _id ${document._id}.`);
            }
            collection.push(document);
            return { ok: true, type: 'write', collection: collectionName, operation: methodName, insertedId: document._id, insertedCount: 1 };
        }

        if (methodName === 'insertMany') {
            const collection = getCollection(state, collectionName);
            const documents = args[0];
            if (!Array.isArray(documents)) throw new Error('insertMany necesita un arreglo de documentos.');

            const insertedIds = [];
            documents.forEach(item => {
                if (!isPlainObject(item)) throw new Error('Cada documento debe ser un objeto.');
                const document = deepClone(item);
                assertSafeValue(document);
                if (document._id === undefined) document._id = generateId(collectionName);
                if (collection.some(existing => deepEqual(existing._id, document._id))) {
                    throw new Error(`Ya existe un documento con _id ${document._id}.`);
                }
                collection.push(document);
                insertedIds.push(document._id);
            });

            return { ok: true, type: 'write', collection: collectionName, operation: methodName, insertedIds, insertedCount: insertedIds.length };
        }

        if (methodName === 'updateOne' || methodName === 'updateMany') {
            const collection = getCollection(state, collectionName);
            const filter = args[0] || {};
            const update = args[1];
            const options = args[2] || {};
            if (!isPlainObject(update)) throw new Error(`${methodName} necesita un objeto de actualización.`);

            let matchedCount = 0;
            let modifiedCount = 0;
            let upsertedId;

            for (const document of collection) {
                if (!matchesFilter(document, filter)) continue;
                matchedCount += 1;
                const before = JSON.stringify(document);
                applyUpdate(document, update);
                if (JSON.stringify(document) !== before) modifiedCount += 1;
                if (methodName === 'updateOne') break;
            }

            if (matchedCount === 0 && options && options.upsert === true) {
                const base = {};
                Object.entries(filter).forEach(([key, value]) => {
                    if (!key.startsWith('$')) setPath(base, key, deepClone(value));
                });
                applyUpdate(base, update);
                if (base._id === undefined) base._id = generateId(collectionName);
                collection.push(base);
                matchedCount = 1;
                modifiedCount = 1;
                upsertedId = base._id;
            }

            return {
                ok: true,
                type: 'write',
                collection: collectionName,
                operation: methodName,
                matchedCount,
                modifiedCount,
                ...(upsertedId !== undefined ? { upsertedId } : {})
            };
        }

        if (methodName === 'deleteOne' || methodName === 'deleteMany') {
            const collection = getCollection(state, collectionName);
            const filter = args[0] || {};
            let deletedCount = 0;

            for (let index = collection.length - 1; index >= 0; index -= 1) {
                if (!matchesFilter(collection[index], filter)) continue;
                collection.splice(index, 1);
                deletedCount += 1;
                if (methodName === 'deleteOne') break;
            }

            return { ok: true, type: 'write', collection: collectionName, operation: methodName, deletedCount };
        }

        if (methodName === 'countDocuments') {
            const documents = findDocuments(state, collectionName, args[0] || {}, {});
            return { ok: true, type: 'count', collection: collectionName, count: documents.length };
        }

        if (methodName === 'distinct') {
            const field = String(args[0] || '');
            if (!field) throw new Error('distinct necesita un campo.');
            const documents = findDocuments(state, collectionName, args[1] || {}, {});
            const values = [];
            documents.forEach(document => {
                getPathValues(document, field).forEach(value => {
                    if (!values.some(item => deepEqual(item, value))) values.push(value);
                });
            });
            return { ok: true, type: 'distinct', collection: collectionName, field, values };
        }

        if (methodName === 'aggregate') {
            const documents = aggregateDocuments(state, collectionName, args[0]);
            return { ok: true, type: 'aggregate', collection: collectionName, documents, count: documents.length };
        }

        if (methodName === 'drop') {
            const collection = getCollection(state, collectionName);
            const deletedCount = collection.length;
            delete state.collections[collectionName];
            return { ok: true, type: 'write', collection: collectionName, operation: methodName, deletedCount };
        }

        throw new Error(`Método no soportado: ${methodName}`);
    }

    function getDangerousCommandReason(input) {
        let command;
        try {
            command = typeof input === 'string' ? parseCommand(input) : input;
        } catch (error) {
            return '';
        }

        const method = command.methods[0];
        if (!method) return '';
        if (method.name === 'drop') return 'drop';
        if (method.name === 'deleteMany' || method.name === 'updateMany') {
            const filter = method.args[0];
            if (!filter || (isPlainObject(filter) && Object.keys(filter).length === 0)) {
                return method.name;
            }
        }
        return '';
    }

    function getCollectionSummary(state) {
        return Object.entries(state.collections).map(([name, documents]) => ({
            name,
            count: documents.length
        }));
    }

    function getSchemaSummary(state) {
        return Object.entries(state.collections).map(([name, documents]) => {
            const sample = documents[0] || {};
            const fields = Object.keys(sample).map(key => {
                const value = sample[key];
                let type = typeof value;
                if (Array.isArray(value)) type = 'array';
                else if (value === null) type = 'null';
                return `${key}:${type}`;
            });
            return `${name}(${fields.join(', ')})`;
        }).join('\n').slice(0, 5000);
    }

    const api = {
        MAX_RESULTS,
        aggregateDocuments,
        applyUpdate,
        createDatabase,
        deepClone,
        deepEqual,
        executeCommand,
        findDocuments,
        getCollectionSummary,
        getDangerousCommandReason,
        getPathValue,
        getPathValues,
        getSchemaSummary,
        matchesFilter,
        parseCommand,
        projectDocument,
        sortDocuments
    };

    global.NoSQL = api;
    if (typeof module !== 'undefined' && module.exports) {
        module.exports = api;
    }
}(typeof window !== 'undefined' ? window : globalThis));
