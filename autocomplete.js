/**
 * Autocompletado contextual para los editores SQL y NoSQL.
 * Usa el esquema activo para sugerir tablas, columnas, colecciones, campos y operadores.
 */
(function (global) {
    'use strict';

    const SQL_EDITOR_IDS = new Set(['sqlEditor', 'challengeEditor']);
    const NOSQL_EDITOR_IDS = new Set(['nosqlEditor', 'nosqlHubEditor']);
    const EDITOR_SELECTOR = '#sqlEditor, #challengeEditor, #nosqlEditor, #nosqlHubEditor';
    const SCHEMA_TTL_MS = 1500;

    const SQL_KEYWORDS = [
        'SELECT', 'FROM', 'WHERE', 'GROUP BY', 'ORDER BY', 'HAVING', 'LIMIT', 'OFFSET',
        'JOIN', 'LEFT JOIN', 'INNER JOIN', 'RIGHT JOIN', 'FULL JOIN', 'ON', 'AS',
        'DISTINCT', 'AND', 'OR', 'NOT', 'NULL', 'IS NULL', 'IS NOT NULL', 'LIKE',
        'IN', 'BETWEEN', 'CASE', 'WHEN', 'THEN', 'ELSE', 'END', 'UNION', 'UNION ALL',
        'EXISTS', 'INSERT INTO', 'VALUES', 'UPDATE', 'SET', 'DELETE FROM', 'CREATE TABLE',
        'DROP TABLE', 'ALTER TABLE', 'PRIMARY KEY', 'FOREIGN KEY', 'REFERENCES', 'UNIQUE',
        'CHECK', 'DEFAULT', 'WITH', 'ASC', 'DESC'
    ];

    const SQL_FUNCTIONS = [
        { label: 'COUNT', insert: 'COUNT()', caretOffset: -1 },
        { label: 'SUM', insert: 'SUM()', caretOffset: -1 },
        { label: 'AVG', insert: 'AVG()', caretOffset: -1 },
        { label: 'MIN', insert: 'MIN()', caretOffset: -1 },
        { label: 'MAX', insert: 'MAX()', caretOffset: -1 },
        { label: 'ROUND', insert: 'ROUND()', caretOffset: -1 },
        { label: 'COALESCE', insert: 'COALESCE()', caretOffset: -1 },
        { label: 'IFNULL', insert: 'IFNULL()', caretOffset: -1 },
        { label: 'LOWER', insert: 'LOWER()', caretOffset: -1 },
        { label: 'UPPER', insert: 'UPPER()', caretOffset: -1 },
        { label: 'LENGTH', insert: 'LENGTH()', caretOffset: -1 },
        { label: 'SUBSTR', insert: 'SUBSTR()', caretOffset: -1 },
        { label: 'ABS', insert: 'ABS()', caretOffset: -1 },
        { label: 'CAST', insert: 'CAST()', caretOffset: -1 },
        { label: 'STRFTIME', insert: 'STRFTIME()', caretOffset: -1 }
    ];

    const NOSQL_METHODS = [
        'find', 'findOne', 'insertOne', 'insertMany', 'updateOne', 'updateMany',
        'deleteOne', 'deleteMany', 'countDocuments', 'distinct', 'aggregate', 'drop'
    ];

    const NOSQL_OPERATORS = [
        '$eq', '$ne', '$gt', '$gte', '$lt', '$lte', '$in', '$nin', '$exists',
        '$regex', '$and', '$or', '$nor', '$elemMatch', '$set', '$unset', '$inc',
        '$push', '$addToSet', '$pull', '$rename', '$match', '$project', '$group',
        '$sort', '$skip', '$limit', '$count', '$unwind', '$addFields'
    ];

    const SQL_RESERVED = new Set([
        'SELECT', 'FROM', 'WHERE', 'JOIN', 'LEFT', 'RIGHT', 'INNER', 'OUTER', 'FULL',
        'ON', 'GROUP', 'ORDER', 'BY', 'HAVING', 'LIMIT', 'OFFSET', 'AS', 'AND', 'OR',
        'NOT', 'NULL', 'IS', 'LIKE', 'IN', 'BETWEEN', 'CASE', 'WHEN', 'THEN', 'ELSE',
        'END', 'UNION', 'ALL', 'DISTINCT', 'INSERT', 'INTO', 'VALUES', 'UPDATE', 'SET',
        'DELETE', 'CREATE', 'TABLE', 'DROP', 'ALTER', 'REFERENCES', 'PRIMARY', 'KEY',
        'FOREIGN', 'UNIQUE', 'CHECK', 'DEFAULT', 'WITH', 'EXISTS', 'USING', 'ASC', 'DESC',
        'CROSS', 'NATURAL'
    ]);

    const KIND_META = {
        table: { icon: 'fa-table', detail: 'tabla' },
        column: { icon: 'fa-columns', detail: 'columna' },
        keyword: { icon: 'fa-code', detail: 'palabra clave' },
        function: { icon: 'fa-code', detail: 'función' },
        collection: { icon: 'fa-layer-group', detail: 'colección' },
        method: { icon: 'fa-bolt', detail: 'método' },
        field: { icon: 'fa-tag', detail: 'campo' },
        operator: { icon: 'fa-filter', detail: 'operador' }
    };

    const KIND_RANK = {
        column: 0,
        field: 0,
        table: 1,
        collection: 1,
        method: 2,
        function: 3,
        keyword: 4,
        operator: 5
    };

    let initialized = false;
    let popup = null;
    let activeTextarea = null;
    let activeItems = [];
    let selectedIndex = 0;
    let replaceStart = 0;
    let replaceEnd = 0;
    let isOpen = false;
    let suppressInput = false;
    let composing = false;
    let sqlSchemaCache = { at: 0, tables: [] };
    let noSqlSchemaCache = { at: 0, collections: [] };

    function isEditor(element) {
        return Boolean(
            element
            && element.tagName === 'TEXTAREA'
            && typeof element.matches === 'function'
            && element.matches(EDITOR_SELECTOR)
        );
    }

    function getEditorKind(textarea) {
        if (SQL_EDITOR_IDS.has(textarea.id)) return 'sql';
        if (NOSQL_EDITOR_IDS.has(textarea.id)) return 'nosql';
        return null;
    }

    function getSqlSchema() {
        const now = Date.now();
        if (now - sqlSchemaCache.at < SCHEMA_TTL_MS) return sqlSchemaCache.tables;
        if (typeof global.getUserTables !== 'function' || typeof global.getTableColumns !== 'function') {
            return [];
        }

        const tables = global.getUserTables().map(name => ({
            name,
            columns: (global.getTableColumns(name) || []).map(column => column.name)
        }));
        if (tables.length > 0) sqlSchemaCache = { at: now, tables };
        return tables;
    }

    function getNoSQLSchema() {
        const now = Date.now();
        if (now - noSqlSchemaCache.at < SCHEMA_TTL_MS) return noSqlSchemaCache.collections;

        let collections = [];
        if (typeof global.getNoSQLAutocompleteSchema === 'function') {
            collections = global.getNoSQLAutocompleteSchema() || [];
        } else {
            const datasetName = typeof global.getNoSQLActiveDataset === 'function'
                ? global.getNoSQLActiveDataset()
                : 'escuela';
            const dataset = global.NOSQL_DATASETS && global.NOSQL_DATASETS[datasetName];
            collections = Object.entries((dataset && dataset.collections) || {}).map(([name, documents]) => {
                const fields = new Set();
                (documents || []).slice(0, 20).forEach(document => {
                    Object.keys(document || {}).forEach(key => fields.add(key));
                });
                return { name, fields: Array.from(fields).slice(0, 40) };
            });
        }

        if (collections.length > 0) noSqlSchemaCache = { at: now, collections };
        return collections;
    }

    function invalidateSchema() {
        sqlSchemaCache = { at: 0, tables: [] };
        noSqlSchemaCache = { at: 0, collections: [] };
    }

    function stripIdentifier(value) {
        if (value.startsWith('"') && value.endsWith('"')) {
            return value.slice(1, -1).replace(/""/g, '"');
        }
        if (value.startsWith('`') && value.endsWith('`')) {
            return value.slice(1, -1).replace(/``/g, '`');
        }
        return value;
    }

    function isInsideSqlStringOrComment(value, caret) {
        let quote = null;
        let lineComment = false;
        let blockComment = false;

        for (let index = 0; index < caret; index += 1) {
            const character = value[index];
            const next = value[index + 1];

            if (lineComment) {
                if (character === '\n') lineComment = false;
                continue;
            }
            if (blockComment) {
                if (character === '*' && next === '/') {
                    blockComment = false;
                    index += 1;
                }
                continue;
            }
            if (quote) {
                if (character === quote) {
                    if (quote === "'" && next === "'") {
                        index += 1;
                        continue;
                    }
                    quote = null;
                }
                continue;
            }
            if (character === '-' && next === '-') {
                lineComment = true;
                index += 1;
                continue;
            }
            if (character === '/' && next === '*') {
                blockComment = true;
                index += 1;
                continue;
            }
            if (character === "'" || character === '"' || character === '`') {
                quote = character;
            }
        }

        return Boolean(quote || lineComment || blockComment);
    }

    function isInsideNoSQLString(value, caret) {
        let quote = null;
        let escaped = false;

        for (let index = 0; index < caret; index += 1) {
            const character = value[index];
            if (escaped) {
                escaped = false;
                continue;
            }
            if (character === '\\') {
                escaped = true;
                continue;
            }
            if (quote) {
                if (character === quote) quote = null;
                continue;
            }
            if (character === "'" || character === '"' || character === '`') {
                quote = character;
            }
        }

        return Boolean(quote);
    }

    function lastWordBefore(text) {
        const match = text.match(/([A-Za-z_]+)\s*$/);
        return match ? match[1].toUpperCase() : '';
    }

    function isSqlTableContext(beforePrefix) {
        const word = lastWordBefore(beforePrefix);
        if (['FROM', 'JOIN', 'INTO', 'UPDATE', 'REFERENCES'].includes(word)) return true;

        if (!/,\s*$/.test(beforePrefix)) return false;
        const upper = beforePrefix.toUpperCase();
        const fromIndex = Math.max(upper.lastIndexOf('FROM'), upper.lastIndexOf('JOIN'));
        if (fromIndex === -1) return false;
        const clause = upper.slice(fromIndex);
        return !/\b(WHERE|GROUP\s+BY|ORDER\s+BY|HAVING|LIMIT|SET|ON|USING|VALUES)\b/.test(clause);
    }

    function isSqlClauseTrigger(beforePrefix) {
        if (/(?:^|\s)(SELECT|WHERE|ON|HAVING|SET|AND|OR|BY|USING|DISTINCT|IS|NOT)\s+$/i.test(beforePrefix)) {
            return true;
        }
        return /[(,]\s*$/.test(beforePrefix);
    }

    function analyzeSqlContext(value, caret) {
        const before = value.slice(0, caret);
        const qualifierMatch = before.match(/([A-Za-z_]\w*)\.([A-Za-z_]\w*)?$/);
        if (qualifierMatch) {
            const prefix = qualifierMatch[2] || '';
            return {
                kind: 'column',
                qualifier: qualifierMatch[1],
                prefix,
                start: caret - prefix.length
            };
        }

        const tokenMatch = before.match(/[A-Za-z_]\w*$/);
        const prefix = tokenMatch ? tokenMatch[0] : '';
        const start = caret - prefix.length;
        const beforePrefix = before.slice(0, start);

        if (isSqlTableContext(beforePrefix)) {
            return { kind: 'table', prefix, start };
        }
        if (prefix.length > 0 || isSqlClauseTrigger(beforePrefix)) {
            return { kind: 'column', prefix, start };
        }
        return null;
    }

    function extractSqlTableRefs(value, tableNames) {
        const refs = [];
        const seen = new Set();
        const clauseRegex = /\b(?:FROM|JOIN|UPDATE|INTO)\b([\s\S]*?)(?=\b(?:WHERE|GROUP\s+BY|ORDER\s+BY|HAVING|LIMIT|UNION|JOIN|ON|USING|SET|VALUES)\b|$)/gi;
        let clauseMatch;

        while ((clauseMatch = clauseRegex.exec(value))) {
            const parts = clauseMatch[1].split(',');
            parts.forEach(part => {
                const tableMatch = part.trim().match(/^("(?:[^"]|"")+"|`(?:[^`]|``)+`|[A-Za-z_]\w*)(?:\s+(?:AS\s+)?([A-Za-z_]\w*))?/i);
                if (!tableMatch) return;

                const table = stripIdentifier(tableMatch[1]);
                if (!tableNames.has(table.toLowerCase())) return;

                let alias = tableMatch[2] || table;
                if (SQL_RESERVED.has(alias.toUpperCase())) alias = table;

                const key = `${table.toLowerCase()}|${alias.toLowerCase()}`;
                if (seen.has(key)) return;
                seen.add(key);
                refs.push({ table, alias });
            });
        }

        return refs;
    }

    function addItem(items, seen, item) {
        const key = `${item.label}|${item.insert}`;
        if (seen.has(key)) return;
        seen.add(key);
        items.push(item);
    }

    function filterItems(items, prefix) {
        const normalized = prefix.toLowerCase();
        const filtered = items.filter(item => {
            return item.label.toLowerCase().startsWith(normalized)
                || item.insert.toLowerCase().startsWith(normalized);
        });

        filtered.sort((left, right) => {
            const leftStarts = left.label.toLowerCase().startsWith(normalized) ? 0 : 1;
            const rightStarts = right.label.toLowerCase().startsWith(normalized) ? 0 : 1;
            if (leftStarts !== rightStarts) return leftStarts - rightStarts;
            const leftRank = KIND_RANK[left.kind] ?? 9;
            const rightRank = KIND_RANK[right.kind] ?? 9;
            if (leftRank !== rightRank) return leftRank - rightRank;
            if (left.label.length !== right.label.length) return left.label.length - right.label.length;
            return left.label.localeCompare(right.label);
        });

        return filtered.slice(0, 40);
    }

    function buildSqlSuggestions(value, caret, schema) {
        if (isInsideSqlStringOrComment(value, caret)) return null;
        const tables = schema || getSqlSchema();
        const context = analyzeSqlContext(value, caret);
        if (!context) return null;

        const tableByName = new Map(tables.map(table => [table.name.toLowerCase(), table]));
        const tableNames = new Set(tableByName.keys());
        const refs = extractSqlTableRefs(value, tableNames);
        const items = [];
        const seen = new Set();

        if (context.qualifier) {
            const qualifier = context.qualifier.toLowerCase();
            const ref = refs.find(item => (item.alias || item.table).toLowerCase() === qualifier);
            const table = ref ? tableByName.get(ref.table.toLowerCase()) : tableByName.get(qualifier);
            (table ? table.columns : []).forEach(column => {
                addItem(items, seen, {
                    label: column,
                    insert: column,
                    detail: table.name,
                    kind: 'column'
                });
            });
        } else if (context.kind === 'table') {
            tables.forEach(table => {
                addItem(items, seen, {
                    label: table.name,
                    insert: table.name,
                    detail: `${table.columns.length} columnas`,
                    kind: 'table'
                });
            });
        } else {
            const before = value.slice(0, caret);
            const beforePrefix = before.slice(0, context.start);
            const isSelectStart = /(?:^|\s)SELECT\s+(?:DISTINCT\s+)?$/i.test(beforePrefix);
            const qualify = refs.length > 1;
            refs.forEach(ref => {
                const table = tableByName.get(ref.table.toLowerCase());
                if (!table) return;
                const qualifier = ref.alias || ref.table;
                table.columns.forEach(column => {
                    addItem(items, seen, {
                        label: qualify ? `${qualifier}.${column}` : column,
                        insert: qualify ? `${qualifier}.${column}` : column,
                        detail: table.name,
                        kind: 'column'
                    });
                });
            });

            if (isSelectStart) {
                addItem(items, seen, {
                    label: '*',
                    insert: '*',
                    detail: 'todas las columnas',
                    kind: 'column'
                });
            }

            SQL_FUNCTIONS.forEach(fn => {
                addItem(items, seen, {
                    label: fn.label,
                    insert: fn.insert,
                    detail: 'función',
                    kind: 'function',
                    caretOffset: fn.caretOffset
                });
            });

            SQL_KEYWORDS.forEach(keyword => {
                addItem(items, seen, {
                    label: keyword,
                    insert: keyword,
                    detail: 'palabra clave',
                    kind: 'keyword'
                });
            });
        }

        const filtered = filterItems(items, context.prefix);
        if (!filtered.length) return null;
        return { items: filtered, start: context.start, end: caret };
    }

    function getLastNoSQLCollection(before, collectionNames) {
        const regex = /\bdb\.([A-Za-z_]\w*)/g;
        let match;
        let last = null;
        while ((match = regex.exec(before))) {
            const name = match[1];
            if (collectionNames.has(name.toLowerCase())) last = name;
        }
        return last;
    }

    function buildNoSQLSuggestions(value, caret, schema) {
        if (isInsideNoSQLString(value, caret)) return null;
        const collections = schema || getNoSQLSchema();
        const collectionByName = new Map(collections.map(collection => [collection.name.toLowerCase(), collection]));
        const collectionNames = new Set(collectionByName.keys());
        const before = value.slice(0, caret);
        const items = [];
        const seen = new Set();

        const methodMatch = before.match(/\bdb\.([A-Za-z_]\w*)\.([A-Za-z_]\w*)?$/);
        if (methodMatch) {
            const prefix = methodMatch[2] || '';
            NOSQL_METHODS.forEach(method => {
                addItem(items, seen, {
                    label: method,
                    insert: method,
                    detail: 'método',
                    kind: 'method'
                });
            });
            const filtered = filterItems(items, prefix);
            return filtered.length ? { items: filtered, start: caret - prefix.length, end: caret } : null;
        }

        const collectionMatch = before.match(/\bdb\.([A-Za-z_]\w*)?$/);
        if (collectionMatch) {
            const prefix = collectionMatch[1] || '';
            collections.forEach(collection => {
                addItem(items, seen, {
                    label: collection.name,
                    insert: collection.name,
                    detail: `${collection.fields.length} campos`,
                    kind: 'collection'
                });
            });
            const filtered = filterItems(items, prefix);
            return filtered.length ? { items: filtered, start: caret - prefix.length, end: caret } : null;
        }

        const tokenMatch = before.match(/[$\w]+$/);
        const prefix = tokenMatch ? tokenMatch[0] : '';
        const beforePrefix = before.slice(0, caret - prefix.length);
        if (/:\s*$/.test(beforePrefix)) return null;

        const lastCollection = getLastNoSQLCollection(before, collectionNames);
        if (!lastCollection && !prefix.startsWith('$')) return null;

        if (lastCollection) {
            const collection = collectionByName.get(lastCollection.toLowerCase());
            const fields = collection ? collection.fields : [];
            fields.forEach(field => {
                addItem(items, seen, {
                    label: field,
                    insert: field,
                    detail: collection.name,
                    kind: 'field'
                });
            });
        }

        NOSQL_OPERATORS.forEach(operator => {
            addItem(items, seen, {
                label: operator,
                insert: operator,
                detail: 'operador',
                kind: 'operator'
            });
        });

        if (prefix.length === 0 && !/[{(,\[]\s*$/.test(beforePrefix)) {
            return null;
        }

        const filtered = filterItems(items, prefix);
        return filtered.length ? { items: filtered, start: caret - prefix.length, end: caret } : null;
    }

    function ensurePopup() {
        if (popup) return popup;
        popup = document.createElement('div');
        popup.id = 'autocompletePopover';
        popup.className = 'autocomplete-popover';
        popup.setAttribute('role', 'listbox');
        popup.setAttribute('aria-label', 'Sugerencias');
        popup.hidden = true;
        document.body.appendChild(popup);
        return popup;
    }

    function optionId(index) {
        return `autocomplete-option-${index}`;
    }

    function renderPopup() {
        if (!popup) return;
        popup.innerHTML = '';

        activeItems.forEach((item, index) => {
            const option = document.createElement('div');
            option.className = 'autocomplete-option';
            option.id = optionId(index);
            option.setAttribute('role', 'option');
            option.setAttribute('aria-selected', index === selectedIndex ? 'true' : 'false');

            const main = document.createElement('span');
            main.className = 'autocomplete-option-main';

            const icon = document.createElement('i');
            const meta = KIND_META[item.kind] || KIND_META.keyword;
            icon.className = `fas ${meta.icon}`;
            icon.setAttribute('aria-hidden', 'true');

            const label = document.createElement('span');
            label.className = 'autocomplete-option-label';
            label.textContent = item.label;

            const detail = document.createElement('span');
            detail.className = 'autocomplete-option-detail';
            detail.textContent = item.detail || meta.detail;

            main.append(icon, label);
            option.append(main, detail);

            option.addEventListener('mousedown', event => {
                event.preventDefault();
                acceptSuggestion(index);
            });

            popup.appendChild(option);
        });

        const selected = popup.children[selectedIndex];
        if (selected) {
            if (selected.offsetTop < popup.scrollTop) {
                popup.scrollTop = selected.offsetTop;
            } else if (selected.offsetTop + selected.offsetHeight > popup.scrollTop + popup.clientHeight) {
                popup.scrollTop = selected.offsetTop + selected.offsetHeight - popup.clientHeight;
            }
        }
    }

    function getCaretRect(textarea) {
        const style = global.getComputedStyle(textarea);
        const mirror = document.createElement('div');
        const properties = [
            'boxSizing', 'width', 'height', 'overflowX', 'overflowY',
            'borderTopWidth', 'borderRightWidth', 'borderBottomWidth', 'borderLeftWidth',
            'paddingTop', 'paddingRight', 'paddingBottom', 'paddingLeft',
            'fontStyle', 'fontVariant', 'fontWeight', 'fontStretch', 'fontSize',
            'fontFamily', 'lineHeight', 'letterSpacing', 'wordSpacing', 'textAlign',
            'textIndent', 'textTransform', 'whiteSpace', 'wordBreak', 'tabSize'
        ];

        mirror.style.position = 'absolute';
        mirror.style.visibility = 'hidden';
        mirror.style.top = '0';
        mirror.style.left = '-9999px';
        properties.forEach(property => {
            if (style[property]) mirror.style[property] = style[property];
        });
        mirror.style.whiteSpace = 'pre-wrap';
        mirror.style.wordWrap = 'break-word';
        mirror.style.overflow = 'hidden';

        const caret = textarea.selectionStart || 0;
        mirror.textContent = textarea.value.substring(0, caret);
        const marker = document.createElement('span');
        marker.textContent = textarea.value.substring(caret) || '.';
        mirror.appendChild(marker);
        document.body.appendChild(mirror);

        const coordinates = {
            top: marker.offsetTop + (parseFloat(style.borderTopWidth) || 0) - textarea.scrollTop,
            left: marker.offsetLeft + (parseFloat(style.borderLeftWidth) || 0) - textarea.scrollLeft
        };
        mirror.remove();

        const rect = textarea.getBoundingClientRect();
        const lineHeight = parseFloat(style.lineHeight) || parseFloat(style.fontSize) * 1.4 || 20;
        return {
            top: rect.top + coordinates.top,
            left: rect.left + coordinates.left,
            bottom: rect.top + coordinates.top + lineHeight,
            lineHeight
        };
    }

    function positionPopup() {
        if (!isOpen || !activeTextarea || !popup) return;
        const caretRect = getCaretRect(activeTextarea);
        const popupWidth = popup.offsetWidth || 300;
        const popupHeight = popup.offsetHeight || 220;
        const viewportWidth = global.innerWidth || document.documentElement.clientWidth || 1024;
        const viewportHeight = global.innerHeight || document.documentElement.clientHeight || 768;

        let left = caretRect.left;
        let top = caretRect.bottom + 4;

        if (left + popupWidth > viewportWidth - 8) left = viewportWidth - popupWidth - 8;
        if (left < 8) left = 8;
        if (top + popupHeight > viewportHeight - 8) top = caretRect.top - popupHeight - 4;
        if (top < 8) top = 8;

        popup.style.left = `${left}px`;
        popup.style.top = `${top}px`;
    }

    function openPopup(textarea, suggestions) {
        if (activeTextarea && activeTextarea !== textarea) {
            activeTextarea.setAttribute('aria-expanded', 'false');
            activeTextarea.removeAttribute('aria-activedescendant');
        }

        ensurePopup();
        activeTextarea = textarea;
        activeItems = suggestions.items;
        replaceStart = suggestions.start;
        replaceEnd = suggestions.end;
        selectedIndex = 0;
        isOpen = true;
        renderPopup();
        popup.hidden = false;
        positionPopup();

        textarea.setAttribute('aria-autocomplete', 'list');
        textarea.setAttribute('aria-expanded', 'true');
        textarea.setAttribute('aria-controls', popup.id);
        textarea.setAttribute('aria-activedescendant', optionId(0));
    }

    function closePopup() {
        if (!isOpen && (!popup || popup.hidden)) return;
        isOpen = false;
        activeItems = [];
        selectedIndex = 0;
        if (popup) popup.hidden = true;
        if (activeTextarea) {
            activeTextarea.setAttribute('aria-expanded', 'false');
            activeTextarea.removeAttribute('aria-activedescendant');
        }
        activeTextarea = null;
    }

    function moveSelection(direction) {
        if (!activeItems.length) return;
        selectedIndex = (selectedIndex + direction + activeItems.length) % activeItems.length;
        renderPopup();
        if (activeTextarea) {
            activeTextarea.setAttribute('aria-activedescendant', optionId(selectedIndex));
        }
    }

    function acceptSuggestion(index) {
        if (!activeTextarea || !activeItems[index]) return;
        const textarea = activeTextarea;
        const item = activeItems[index];
        const insert = item.insert;
        const caretOffset = Number(item.caretOffset) || 0;

        textarea.focus();
        textarea.setRangeText(insert, replaceStart, replaceEnd, 'end');
        const caret = replaceStart + insert.length + caretOffset;
        textarea.setSelectionRange(caret, caret);
        closePopup();

        suppressInput = true;
        textarea.dispatchEvent(new Event('input', { bubbles: true }));
        suppressInput = false;
    }

    function updateSuggestions(textarea) {
        if (!isEditor(textarea) || textarea.readOnly || textarea.disabled) {
            closePopup();
            return;
        }

        const value = textarea.value;
        const caret = textarea.selectionStart;
        if (caret !== textarea.selectionEnd) {
            closePopup();
            return;
        }

        const kind = getEditorKind(textarea);
        if (kind === 'sql') {
            if (isInsideSqlStringOrComment(value, caret)) {
                closePopup();
                return;
            }
            const suggestions = buildSqlSuggestions(value, caret, getSqlSchema());
            if (!suggestions) {
                closePopup();
                return;
            }
            openPopup(textarea, suggestions);
            return;
        }

        if (kind === 'nosql') {
            if (isInsideNoSQLString(value, caret)) {
                closePopup();
                return;
            }
            const suggestions = buildNoSQLSuggestions(value, caret, getNoSQLSchema());
            if (!suggestions) {
                closePopup();
                return;
            }
            openPopup(textarea, suggestions);
        }
    }

    function handleInput(event) {
        if (suppressInput || composing || !isEditor(event.target)) return;
        updateSuggestions(event.target);
    }

    function handleCompositionStart() {
        composing = true;
        closePopup();
    }

    function handleCompositionEnd(event) {
        composing = false;
        if (isEditor(event.target)) updateSuggestions(event.target);
    }

    function handleClick(event) {
        if (popup && popup.contains(event.target)) return;
        if (isEditor(event.target)) {
            updateSuggestions(event.target);
        } else {
            closePopup();
        }
    }

    function handleKeydown(event) {
        if (event.isComposing) return;
        if (!isOpen || event.target !== activeTextarea) return;
        if (event.ctrlKey || event.metaKey || event.altKey) return;

        if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
            event.preventDefault();
            event.stopPropagation();
            moveSelection(event.key === 'ArrowDown' ? 1 : -1);
            return;
        }

        if (event.key === 'Enter' || event.key === 'Tab') {
            event.preventDefault();
            event.stopPropagation();
            acceptSuggestion(selectedIndex);
            return;
        }

        if (event.key === 'Escape') {
            event.preventDefault();
            event.stopPropagation();
            closePopup();
            return;
        }

        if (['ArrowLeft', 'ArrowRight', 'Home', 'End', 'PageUp', 'PageDown'].includes(event.key)) {
            closePopup();
        }
    }

    function handleFocusOut(event) {
        if (event.target !== activeTextarea) return;
        global.setTimeout(closePopup, 120);
    }

    function handleScroll(event) {
        if (!isOpen || (popup && popup.contains(event.target))) return;
        if (event.target === activeTextarea) {
            positionPopup();
            return;
        }
        closePopup();
    }

    function init() {
        if (initialized) return;
        initialized = true;

        document.addEventListener('input', handleInput);
        document.addEventListener('click', handleClick);
        document.addEventListener('keydown', handleKeydown, true);
        document.addEventListener('focusout', handleFocusOut);
        document.addEventListener('scroll', handleScroll, true);
        document.addEventListener('compositionstart', handleCompositionStart);
        document.addEventListener('compositionend', handleCompositionEnd);
        global.addEventListener('resize', closePopup);

        document.querySelectorAll(EDITOR_SELECTOR).forEach(textarea => {
            textarea.setAttribute('aria-autocomplete', 'list');
            textarea.setAttribute('aria-expanded', 'false');
        });
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

    global.SQLAcademyAutocomplete = {
        init,
        close: closePopup,
        invalidateSchema,
        buildSqlSuggestions,
        buildNoSQLSuggestions,
        isInsideSqlStringOrComment,
        isInsideNoSQLString,
        getPopup: () => popup
    };
}(typeof window !== 'undefined' ? window : globalThis));
