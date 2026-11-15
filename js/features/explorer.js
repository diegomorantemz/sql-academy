// Explorador de tablas, diagrama y análisis de datos.

function hasUnsavedTableEditorChanges() {
    return Array.from(document.querySelectorAll('#tableEditorContent .cell-input'))
        .some(input => input.value !== (input.dataset.original ?? ''));
}

function updateTableEditorDirtyState() {
    const status = document.getElementById('tableEditorStatus');
    if (!status) return;
    const dirty = hasUnsavedTableEditorChanges();
    status.hidden = !dirty;
    status.textContent = dirty ? 'Cambios sin guardar' : '';
}

function confirmDiscardTableEditorChanges(message) {
    if (!hasUnsavedTableEditorChanges()) return true;
    return confirm(`${message}\n\nTienes cambios sin guardar. Si continúas, se perderán.`);
}

function setAnalyzeEditorControlsEnabled(enabled) {
    document.querySelectorAll('#analyzeTableEditor [data-editor-action="add"], #analyzeTableEditor [data-editor-action="save"]')
        .forEach(button => {
            button.disabled = !enabled;
        });
}

function updateAnalyzeExplorerModeUI() {
    document.querySelectorAll('[data-analyze-mode]').forEach(button => {
        const active = button.dataset.analyzeMode === analyzeExplorerMode;
        button.classList.toggle('active', active);
        button.setAttribute('aria-pressed', String(active));
    });

    const detail = document.getElementById('analyzeTableDetail');
    const editor = document.getElementById('analyzeTableEditor');
    if (detail) detail.hidden = analyzeExplorerMode === 'edit';
    if (editor) editor.hidden = analyzeExplorerMode !== 'edit';
}

function setAnalyzeExplorerMode(mode, database = db) {
    const nextMode = mode === 'edit' ? 'edit' : 'view';
    if (nextMode === analyzeExplorerMode) return;
    if (analyzeExplorerMode === 'edit' && nextMode === 'view'
        && !confirmDiscardTableEditorChanges('Vas a cerrar el modo de edición.')) {
        return;
    }

    analyzeExplorerMode = nextMode;
    updateAnalyzeExplorerModeUI();
    if (nextMode === 'edit') {
        loadTableEditor(analyzeSelectedTable, database);
    }
}

function initAnalyzeExplorerControls() {
    document.querySelectorAll('[data-analyze-mode]').forEach(button => {
        if (button.dataset.bound === 'true') return;
        button.dataset.bound = 'true';
        button.addEventListener('click', () => setAnalyzeExplorerMode(button.dataset.analyzeMode));
    });
}

function refreshAnalyzeTableEditor() {
    if (!confirmDiscardTableEditorChanges('Vas a recargar la tabla.')) return;
    loadTableEditor(analyzeSelectedTable);
}

function renderAnalyzeTableEditor(table, database = db) {
    const editor = document.getElementById('analyzeTableEditor');
    if (!editor) return;

    const tableNameEl = document.getElementById('analyzeEditorTableName');
    if (tableNameEl) tableNameEl.textContent = table ? table.name : '—';

    updateAnalyzeExplorerModeUI();

    if (!table) {
        const content = document.getElementById('tableEditorContent');
        if (content) {
            content.innerHTML = '<p class="text-muted" style="text-align:center;padding:20px;"><i class="fas fa-inbox"></i> Selecciona una tabla para editarla.</p>';
        }
        setAnalyzeEditorControlsEnabled(false);
        return;
    }

    if (analyzeExplorerMode === 'edit') {
        loadTableEditor(table.name, database);
    }
}

function loadTableEditor(tableName = analyzeSelectedTable, database = db) {
    const content = document.getElementById('tableEditorContent');
    if (!content) return;

    const tableNameEl = document.getElementById('analyzeEditorTableName');
    if (tableNameEl) tableNameEl.textContent = tableName || '—';

    if (!database) {
        content.innerHTML = '<p class="text-muted" style="text-align:center;padding:20px;"><i class="fas fa-hourglass-half"></i> La base de datos todavía no está disponible.</p>';
        setAnalyzeEditorControlsEnabled(false);
        updateTableEditorDirtyState();
        return;
    }

    if (!tableName) {
        content.innerHTML = '<p class="text-muted" style="text-align:center;padding:20px;"><i class="fas fa-inbox"></i> No hay tablas para editar.</p>';
        setAnalyzeEditorControlsEnabled(false);
        updateTableEditorDirtyState();
        return;
    }

    try {
        const columns = getTableColumns(tableName, database);
        const pkColumn = columns.find(col => col.pk > 0) || null;
        const note = document.getElementById('tableEditorNote');

        if (!pkColumn) {
            content.innerHTML = '<p class="text-muted" style="text-align:center;padding:20px;"><i class="fas fa-lock"></i> Esta tabla no tiene clave primaria. Usa el editor SQL para modificarla.</p>';
            if (note) note.textContent = 'La edición visual requiere una clave primaria.';
            setAnalyzeEditorControlsEnabled(false);
            updateTableEditorDirtyState();
            return;
        }

        const countResult = database.exec(`SELECT COUNT(*) AS total FROM ${quoteIdent(tableName)}`);
        const totalRows = countResult.length > 0 ? Number(countResult[0].values[0][0]) || 0 : 0;
        const result = database.exec(
            `SELECT * FROM ${quoteIdent(tableName)} ORDER BY ${quoteIdent(pkColumn.name)} LIMIT ${TABLE_EDITOR_ROW_LIMIT}`
        );
        const selectColumns = result.length > 0 ? result[0].columns : [];
        const rows = result.length > 0 ? result[0].values : [];
        const pkIndex = selectColumns.indexOf(pkColumn.name);

        if (selectColumns.length === 0 || pkIndex < 0) {
            content.innerHTML = '<p class="text-muted" style="text-align:center;padding:20px;"><i class="fas fa-inbox"></i> Tabla vacía.</p>';
            if (note) note.textContent = `${totalRows} fila(s) en la tabla.`;
            setAnalyzeEditorControlsEnabled(true);
            updateTableEditorDirtyState();
            return;
        }

        if (note) {
            note.textContent = totalRows > TABLE_EDITOR_ROW_LIMIT
                ? `Mostrando las primeras ${TABLE_EDITOR_ROW_LIMIT} de ${totalRows} filas. Para editar el resto, usa el editor SQL.`
                : `${totalRows} fila(s) disponibles para editar.`;
        }

        setAnalyzeEditorControlsEnabled(true);

        let html = '<table>';
        html += '<thead><tr>';
        selectColumns.forEach(col => {
            const isPk = col === pkColumn.name;
            html += `<th>${isPk ? '<i class="fas fa-key" title="Clave primaria"></i> ' : ''}${escapeHtml(col)}</th>`;
        });
        html += '<th>Acciones</th></tr></thead>';

        html += '<tbody>';
        if (rows.length === 0) {
            html += `<tr><td colspan="${selectColumns.length + 1}" style="text-align:center;color:var(--text-muted);">
                Tabla vacía. Usa "Agregar fila" para crear un registro.
            </td></tr>`;
        } else {
            rows.forEach((row, rowIndex) => {
                const pkValue = row[pkIndex];
                html += `<tr data-row="${rowIndex}" data-pk="${escapeHtml(pkValue)}">`;
                row.forEach((value, colIdx) => {
                    const displayValue = value !== null && value !== undefined ? String(value) : '';
                    const isPk = colIdx === pkIndex;
                    html += `<td><input type="text" value="${escapeHtml(displayValue)}"
                        data-row="${rowIndex}" data-col="${colIdx}"
                        data-original="${escapeHtml(displayValue)}"
                        class="cell-input${isPk ? ' pk-input' : ''}"
                        ${isPk ? 'readonly title="La clave primaria no se puede editar"' : ''} /></td>`;
                });
                html += `<td><button type="button" class="delete-btn" data-pk="${escapeHtml(pkValue)}" title="Eliminar fila" aria-label="Eliminar fila"><i class="fas fa-trash"></i></button></td>`;
                html += '</tr>';
            });
        }
        html += '</tbody></table>';

        content.innerHTML = html;

        content.querySelectorAll('.cell-input').forEach(input => {
            input.addEventListener('input', updateTableEditorDirtyState);
        });
        content.querySelectorAll('.delete-btn').forEach(button => {
            button.addEventListener('click', () => deleteRow(tableName, button.dataset.pk));
        });
        updateTableEditorDirtyState();
    } catch (e) {
        content.innerHTML = `<p style="color:#dc3545;"><i class="fas fa-circle-exclamation"></i> Error: ${escapeHtml(e.message)}</p>`;
        setAnalyzeEditorControlsEnabled(false);
        updateTableEditorDirtyState();
    }
}

function saveTableChanges(tableName = analyzeSelectedTable) {
    if (!db) {
        showToast('error', 'La base de datos no está inicializada.');
        return;
    }
    if (!tableName) {
        showToast('warning', 'No hay ninguna tabla seleccionada.');
        return;
    }

    try {
        if (!getUserTables().includes(tableName)) {
            throw new Error(`La tabla ${tableName} no existe`);
        }

        const columns = getTableColumns(tableName);
        const pkColumn = columns.find(col => col.pk > 0);
        if (!pkColumn) {
            throw new Error('La tabla no tiene clave primaria; actualízala con una consulta SQL');
        }
        const pkIndex = columns.findIndex(col => col === pkColumn);

        const rows = new Map();
        document.querySelectorAll('#tableEditorContent .cell-input').forEach(input => {
            const rowIndex = Number(input.dataset.row);
            const colIndex = Number(input.dataset.col);
            if (!rows.has(rowIndex)) {
                rows.set(rowIndex, {
                    values: {},
                    originals: {},
                    pk: input.closest('tr')?.dataset.pk ?? ''
                });
            }
            const row = rows.get(rowIndex);
            row.values[colIndex] = input.value;
            row.originals[colIndex] = input.dataset.original ?? '';
        });

        let updatedCount = 0;
        db.run('BEGIN TRANSACTION;');
        try {
            for (const row of rows.values()) {
                const setClauses = [];
                const params = [];

                columns.forEach((column, colIndex) => {
                    if (colIndex === pkIndex) return;

                    const rawValue = row.values[colIndex];
                    const originalValue = row.originals[colIndex];
                    const current = rawValue === undefined ? '' : rawValue;
                    const original = originalValue === undefined ? '' : originalValue;

                    if (current === original) return;

                    const parsed = parseColumnValue(current, column);
                    setClauses.push(`${quoteIdent(column.name)} = ?`);
                    params.push(parsed);
                });

                if (setClauses.length === 0) continue;

                const pkValue = parseColumnValue(row.pk, pkColumn);
                params.push(pkValue);
                db.run(
                    `UPDATE ${quoteIdent(tableName)} SET ${setClauses.join(', ')} WHERE ${quoteIdent(pkColumn.name)} = ?`,
                    params
                );
                updatedCount++;
            }
            db.run('COMMIT;');
        } catch (e) {
            db.run('ROLLBACK;');
            throw e;
        }

        refreshAll();
        if (updatedCount === 0) {
            showToast('info', 'No había cambios que guardar.');
        } else {
            schedulePersistDatabase();
            showToast('success', `${updatedCount} fila(s) actualizada(s) en ${tableName}.`);
        }
    } catch (e) {
        showToast('error', `Error al guardar cambios: ${e.message}`);
        console.error(e);
    }
}

function deleteRow(tableName, pkValue) {
    if (!db) return;

    try {
        const pkColumn = getPrimaryKey(tableName);
        if (!pkColumn) {
            throw new Error('La tabla no tiene clave primaria; elimina el registro con una consulta SQL');
        }

        const dirtyWarning = hasUnsavedTableEditorChanges()
            ? '\n\nTienes cambios sin guardar en otras filas; se perderán.'
            : '';
        if (!confirm(`¿Eliminar el registro con ${pkColumn.name} = ${pkValue}?${dirtyWarning}`)) return;

        const value = parseColumnValue(pkValue, pkColumn);
        db.run(`DELETE FROM ${quoteIdent(tableName)} WHERE ${quoteIdent(pkColumn.name)} = ?`, [value]);
        refreshAll();
        schedulePersistDatabase();
        showToast('success', 'Registro eliminado correctamente.');
    } catch (e) {
        showToast('error', `Error al eliminar: ${e.message}`);
    }
}

function addRow(tableName = analyzeSelectedTable) {
    if (!db) return;
    if (!tableName) {
        showToast('warning', 'No hay ninguna tabla seleccionada.');
        return;
    }
    if (!confirmDiscardTableEditorChanges('Agregar una fila recargará la tabla.')) return;

    try {
        const columns = getTableColumns(tableName);
        if (columns.length === 0) {
            throw new Error(`La tabla ${tableName} no existe`);
        }

        const primaryKeys = columns.filter(col => col.pk > 0);
        const pkColumn = primaryKeys.length === 1 ? primaryKeys[0] : null;
        const autoPk = pkColumn && /INT/i.test(pkColumn.type);
        const insertColumns = columns.filter(col => !(autoPk && col === pkColumn));

        if (insertColumns.length === 0) {
            db.run(`INSERT INTO ${quoteIdent(tableName)} DEFAULT VALUES`);
        } else {
            const values = insertColumns.map(column => {
                if (column === pkColumn) {
                    return isNumericType(column.type) ? 0 : 'nuevo';
                }
                if (column.name === 'nombre') {
                    return 'Nuevo registro';
                }
                if (column.notnull && column.dflt_value === null) {
                    return isNumericType(column.type) ? 0 : '';
                }
                return null;
            });

            const columnList = insertColumns.map(col => quoteIdent(col.name)).join(', ');
            const placeholders = insertColumns.map(() => '?').join(', ');
            db.run(`INSERT INTO ${quoteIdent(tableName)} (${columnList}) VALUES (${placeholders})`, values);
        }

        refreshAll();
        schedulePersistDatabase();
        showToast('success', `Nueva fila agregada a ${tableName}.`);
    } catch (e) {
        showToast('error', `Error al agregar fila: ${e.message}`);
    }
}

// DIAGRAMA DE RELACIONES
function generateDiagram() {
    const container = document.getElementById('diagramContainer');

    if (!db) {
        container.innerHTML = '<p style="color:#dc3545;"><i class="fas fa-circle-exclamation"></i> Base de datos no inicializada</p>';
        return;
    }

    try {
        const tables = getUserTables();
        if (tables.length === 0) {
            container.innerHTML = '<p class="text-muted" style="text-align:center;padding:20px;"><i class="fas fa-inbox"></i> No hay tablas para mostrar</p>';
            return;
        }

        const entities = tables.map(tableName => {
            let foreignKeys = [];
            try {
                const fkResult = db.exec(`PRAGMA foreign_key_list(${quoteIdent(tableName)})`);
                if (fkResult.length > 0) {
                    foreignKeys = fkResult[0].values.map(row => ({
                        table: String(row[2]),
                        from: String(row[3]),
                        to: String(row[4]),
                        onDelete: String(row[6] || 'NO ACTION')
                    }));
                }
            } catch (e) {
                console.error(`No se pudieron leer las claves foráneas de ${tableName}:`, e);
            }
            return {
                name: tableName,
                columns: getTableColumns(tableName),
                foreignKeys
            };
        });

        let html = '<div class="diagram-erd">';
        entities.forEach(entity => {
            const fkByColumn = new Map(entity.foreignKeys.map(fk => [fk.from, fk]));

            html += `<div class="entity-box">`;
            html += `<div class="entity-title"><i class="fas fa-table"></i> ${escapeHtml(entity.name)}</div>`;
            html += '<ul>';
            entity.columns.forEach(column => {
                const isPk = column.pk > 0;
                const fk = fkByColumn.get(column.name);
                const className = isPk && fk ? 'pk-fk' : isPk ? 'pk' : fk ? 'fk' : '';
                const title = fk
                    ? ` title="Referencia a ${escapeHtml(fk.table)}.${escapeHtml(fk.to)}"`
                    : ` title="${escapeHtml(column.type || 'sin tipo')}"`;
                html += `<li class="${className}"${title}>${escapeHtml(column.name)}</li>`;
            });
            html += '</ul></div>';
        });
        html += '</div>';

        const relations = entities.flatMap(entity =>
            entity.foreignKeys.map(fk => ({ source: entity.name, ...fk }))
        );

        if (relations.length === 0) {
            html += '<p class="diagram-empty-relations"><i class="fas fa-info-circle"></i> No se detectaron claves foráneas.</p>';
        } else {
            html += '<div class="diagram-relations">';
            html += '<h4><i class="fas fa-link"></i> Relaciones detectadas</h4>';
            html += '<ul>';
            relations.forEach(relation => {
                html += `<li>
                    <code>${escapeHtml(relation.source)}.${escapeHtml(relation.from)}</code>
                    <span class="relation-arrow">→</span>
                    <code>${escapeHtml(relation.table)}.${escapeHtml(relation.to)}</code>
                    <span class="relation-cardinality">N : 1</span>
                    <span class="relation-delete">ON DELETE ${escapeHtml(relation.onDelete)}</span>
                </li>`;
            });
            html += '</ul></div>';
        }

        html += `
            <div class="diagram-legend">
                <span><i class="fas fa-key" style="color:#336791;"></i> Primary Key</span>
                <span><i class="fas fa-link" style="color:#764ba2;"></i> Foreign Key</span>
                <span><i class="fas fa-key" style="color:#dc3545;"></i><i class="fas fa-link" style="color:#dc3545;"></i> Primary + Foreign Key</span>
            </div>
        `;

        container.innerHTML = html;
    } catch (e) {
        container.innerHTML = `<p style="color:#dc3545;"><i class="fas fa-circle-exclamation"></i> Error al generar diagrama: ${escapeHtml(e.message)}</p>`;
    }
}

function toggleDiagramView() {
    const container = document.getElementById('diagramContainer');
    const overlay = document.getElementById('diagramOverlay') || createOverlay();
    const closeBtn = document.getElementById('closeDiagramBtn') || createCloseButton();
    
    diagramFullView = !diagramFullView;
    
    if (diagramFullView) {
        container.classList.add('full-view');
        overlay.classList.add('active');
        closeBtn.classList.add('visible');
    } else {
        container.classList.remove('full-view');
        overlay.classList.remove('active');
        closeBtn.classList.remove('visible');
    }
}

function createOverlay() {
    const overlay = document.createElement('div');
    overlay.id = 'diagramOverlay';
    overlay.className = 'diagram-overlay';
    overlay.onclick = toggleDiagramView;
    document.body.appendChild(overlay);
    return overlay;
}

function createCloseButton() {
    const btn = document.createElement('button');
    btn.id = 'closeDiagramBtn';
    btn.className = 'close-diagram-btn';
    btn.innerHTML = '<i class="fas fa-times"></i>';
    btn.onclick = toggleDiagramView;
    document.body.appendChild(btn);
    return btn;
}

// ANALISIS DE DATOS
function getTableForeignKeys(tableName, database = db) {
    if (!database) return [];
    try {
        const result = database.exec(`PRAGMA foreign_key_list(${quoteIdent(tableName)})`);
        if (result.length === 0) return [];
        return result[0].values.map(row => ({
            table: String(row[2]),
            from: String(row[3]),
            to: row[4] === null || row[4] === undefined ? '' : String(row[4]),
            onDelete: String(row[6] || 'NO ACTION')
        }));
    } catch (e) {
        console.error(`No se pudieron leer las claves foráneas de ${tableName}:`, e);
        return [];
    }
}

function getTableRowCount(tableName, database = db) {
    if (!database) return 0;
    try {
        const result = database.exec(`SELECT COUNT(*) FROM ${quoteIdent(tableName)}`);
        return result.length > 0 ? Number(result[0].values[0][0]) || 0 : 0;
    } catch (e) {
        console.error(`No se pudo contar las filas de ${tableName}:`, e);
        return 0;
    }
}

function getTablePreview(tableName, limit = 5, database = db) {
    if (!database) return { columns: [], values: [] };
    const safeLimit = Math.max(1, Math.min(50, Number(limit) || 5));
    try {
        const result = database.exec(`SELECT * FROM ${quoteIdent(tableName)} LIMIT ${safeLimit}`);
        if (result.length === 0) return { columns: [], values: [] };
        return {
            columns: result[0].columns.map(String),
            values: result[0].values
        };
    } catch (e) {
        console.error(`No se pudo leer una vista previa de ${tableName}:`, e);
        return { columns: [], values: [] };
    }
}

function getAnalyzeSummary(database = db) {
    const emptySummary = {
        tables: [],
        tableStats: [],
        columnCount: 0,
        rowCount: 0,
        relationCount: 0,
        emptyTables: [],
        largestTable: null
    };
    if (!database) return emptySummary;

    const tables = getUserTables(database);
    const tableStats = tables.map(name => {
        const columns = getTableColumns(name, database);
        const foreignKeys = getTableForeignKeys(name, database);
        const rowCount = getTableRowCount(name, database);
        return { name, columns, foreignKeys, rowCount };
    });

    return {
        tables,
        tableStats,
        columnCount: tableStats.reduce((total, table) => total + table.columns.length, 0),
        rowCount: tableStats.reduce((total, table) => total + table.rowCount, 0),
        relationCount: tableStats.reduce((total, table) => total + table.foreignKeys.length, 0),
        emptyTables: tableStats.filter(table => table.rowCount === 0).map(table => table.name),
        largestTable: tableStats.reduce(
            (largest, table) => (!largest || table.rowCount > largest.rowCount ? table : largest),
            null
        )
    };
}

function formatAnalyzeNumber(value) {
    return Number(value || 0).toLocaleString('es-ES');
}

function formatAnalyzeCell(value) {
    if (value === null || value === undefined) {
        return '<span class="null-value">NULL</span>';
    }
    return escapeHtml(String(value));
}

function renderAnalyzeSummary(summary) {
    const container = document.getElementById('analyzeSummary');
    if (!container) return;

    if (summary.tables.length === 0) {
        container.innerHTML = `
            <div class="analyze-empty-state analyze-empty-state-wide">
                <i class="fas fa-database"></i>
                <p>No hay tablas disponibles en este dataset.</p>
            </div>
        `;
        return;
    }

    const emptyTables = summary.emptyTables.length;
    const metrics = [
        { label: 'Tablas', value: summary.tables.length, icon: 'fa-table', tone: 'tone-blue', hint: 'Tablas de usuario' },
        { label: 'Columnas', value: summary.columnCount, icon: 'fa-columns', tone: 'tone-violet', hint: 'Campos en total' },
        { label: 'Filas', value: summary.rowCount, icon: 'fa-database', tone: 'tone-green', hint: 'Registros almacenados' },
        { label: 'Relaciones', value: summary.relationCount, icon: 'fa-link', tone: 'tone-orange', hint: 'Claves foráneas' },
        {
            label: 'Tablas vacías',
            value: emptyTables,
            icon: 'fa-inbox',
            tone: emptyTables ? 'tone-amber' : 'tone-green',
            hint: emptyTables ? 'Revisar datos' : 'Todas con datos'
        }
    ];

    container.innerHTML = metrics.map(metric => `
        <div class="analyze-metric">
            <span class="analyze-metric-icon ${metric.tone}"><i class="fas ${metric.icon}"></i></span>
            <div>
                <span class="analyze-metric-value">${formatAnalyzeNumber(metric.value)}</span>
                <span class="analyze-metric-label">${metric.label}</span>
                <span class="analyze-metric-hint">${metric.hint}</span>
            </div>
        </div>
    `).join('');
}

function renderAnalyzeTableList(summary) {
    const list = document.getElementById('analyzeTableList');
    if (!list) return;

    if (summary.tableStats.length === 0) {
        list.innerHTML = '<p class="analyze-empty-state"><i class="fas fa-inbox"></i> Sin tablas</p>';
        return;
    }

    if (!summary.tableStats.some(table => table.name === analyzeSelectedTable)) {
        analyzeSelectedTable = summary.tableStats[0].name;
    }

    list.innerHTML = summary.tableStats.map(table => {
        const active = table.name === analyzeSelectedTable;
        return `
            <button type="button"
                class="analyze-table-item${active ? ' active' : ''}"
                data-table="${escapeHtml(table.name)}"
                role="option"
                aria-selected="${active}">
                <span class="analyze-table-name"><i class="fas fa-table"></i> ${escapeHtml(table.name)}</span>
                <span class="analyze-table-meta">${formatAnalyzeNumber(table.rowCount)} filas · ${formatAnalyzeNumber(table.columns.length)} col.</span>
            </button>
        `;
    }).join('');

    list.querySelectorAll('[data-table]').forEach(button => {
        button.addEventListener('click', () => selectAnalyzeTable(button.dataset.table));
    });
}

function renderAnalyzeTableDetail(table, database = db) {
    const detail = document.getElementById('analyzeTableDetail');
    if (!detail) return;

    if (!table) {
        detail.innerHTML = `
            <div class="analyze-empty-state">
                <i class="fas fa-table"></i>
                <p>Selecciona una tabla para ver su estructura.</p>
            </div>
        `;
        return;
    }

    const foreignKeyByColumn = new Map(table.foreignKeys.map(fk => [fk.from, fk]));
    const preview = getTablePreview(table.name, 5, database);

    const columnRows = table.columns.map(column => {
        const isPk = column.pk > 0;
        const foreignKey = foreignKeyByColumn.get(column.name);
        let keyBadge = '<span class="key-badge key-none">—</span>';
        if (isPk && foreignKey) keyBadge = '<span class="key-badge key-pk-fk">PK/FK</span>';
        else if (isPk) keyBadge = '<span class="key-badge key-pk">PK</span>';
        else if (foreignKey) keyBadge = '<span class="key-badge key-fk">FK</span>';

        return `
            <tr>
                <td><code>${escapeHtml(column.name)}</code></td>
                <td>${escapeHtml(column.type || 'sin tipo')}</td>
                <td>${keyBadge}</td>
                <td>${column.notnull ? 'No' : 'Sí'}</td>
            </tr>
        `;
    }).join('');

    const previewRows = preview.values.map(row => `
        <tr>${preview.columns.map((_, index) => `<td>${formatAnalyzeCell(row[index])}</td>`).join('')}</tr>
    `).join('');

    const previewHtml = preview.columns.length
        ? `
            <div class="table-detail-preview" tabindex="0" role="region" aria-label="Vista previa de la tabla">
                <table class="table-detail-table">
                    <thead>
                        <tr>${preview.columns.map(column => `<th>${escapeHtml(column)}</th>`).join('')}</tr>
                    </thead>
                    <tbody>${previewRows}</tbody>
                </table>
            </div>
        `
        : `
            <div class="analyze-empty-state">
                <i class="fas fa-inbox"></i>
                <p>Esta tabla todavía no tiene registros.</p>
            </div>
        `;

    const relationText = table.foreignKeys.length
        ? `${table.foreignKeys.length} relación(es)`
        : 'Sin relaciones';

    detail.innerHTML = `
        <div class="table-detail-head">
            <div>
                <h4><i class="fas fa-table"></i> ${escapeHtml(table.name)}</h4>
                <p class="table-detail-meta">
                    ${formatAnalyzeNumber(table.rowCount)} filas · ${formatAnalyzeNumber(table.columns.length)} columnas · ${escapeHtml(relationText)}
                </p>
            </div>
            <div class="table-detail-actions">
                <button type="button" class="btn-secondary btn-sm" data-analyze-action="copy" data-table="${escapeHtml(table.name)}">
                    <i class="fas fa-copy"></i> Copiar SELECT
                </button>
                <button type="button" class="btn-secondary btn-sm" data-analyze-action="edit" data-table="${escapeHtml(table.name)}">
                    <i class="fas fa-pen"></i> Editar datos
                </button>
                <button type="button" class="btn-primary btn-sm" data-analyze-action="practice" data-table="${escapeHtml(table.name)}">
                    <i class="fas fa-play"></i> Practicar
                </button>
            </div>
        </div>

        <p class="table-detail-subtitle">Columnas</p>
        <div class="table-detail-table-wrap" tabindex="0" role="region" aria-label="Detalle de la tabla">
            <table class="table-detail-table">
                <thead>
                    <tr>
                        <th>Columna</th>
                        <th>Tipo</th>
                        <th>Clave</th>
                        <th>¿Nulo?</th>
                    </tr>
                </thead>
                <tbody>${columnRows}</tbody>
            </table>
        </div>

        <p class="table-detail-subtitle">Vista previa · ${formatAnalyzeNumber(preview.values.length)} fila(s)</p>
        ${previewHtml}
    `;

    detail.querySelectorAll('[data-analyze-action]').forEach(button => {
        button.addEventListener('click', () => {
            if (button.dataset.analyzeAction === 'copy') {
                copyAnalyzeSelect(button.dataset.table);
            } else if (button.dataset.analyzeAction === 'edit') {
                setAnalyzeExplorerMode('edit', database);
            } else if (button.dataset.analyzeAction === 'practice') {
                practiceAnalyzeTable(button.dataset.table);
            }
        });
    });
}

function selectAnalyzeTable(tableName, database = db) {
    if (tableName === analyzeSelectedTable && analyzeExplorerMode === 'edit') return;
    if (tableName !== analyzeSelectedTable && analyzeExplorerMode === 'edit'
        && !confirmDiscardTableEditorChanges('Vas a cambiar de tabla.')) {
        return;
    }

    analyzeSelectedTable = tableName;
    const summary = getAnalyzeSummary(database);
    const selectedTable = summary.tableStats.find(table => table.name === tableName) || null;
    renderAnalyzeTableList(summary);
    renderAnalyzeTableDetail(selectedTable, database);
    renderAnalyzeTableEditor(selectedTable, database);
}

function getAnalyzeOrphanIssues(summary, database = db) {
    if (!database) return [];
    const tableNames = new Set(summary.tables);
    const issues = [];

    summary.tableStats.forEach(table => {
        table.foreignKeys.forEach(foreignKey => {
            if (!tableNames.has(foreignKey.table)) return;
            const parentTable = summary.tableStats.find(item => item.name === foreignKey.table);
            const parentColumn = foreignKey.to || parentTable?.columns.find(column => column.pk > 0)?.name;
            if (!parentColumn) return;

            try {
                const result = database.exec(`
                    SELECT COUNT(*) AS total
                    FROM ${quoteIdent(table.name)} AS child
                    LEFT JOIN ${quoteIdent(foreignKey.table)} AS parent_row
                        ON child.${quoteIdent(foreignKey.from)} = parent_row.${quoteIdent(parentColumn)}
                    WHERE child.${quoteIdent(foreignKey.from)} IS NOT NULL
                        AND parent_row.${quoteIdent(parentColumn)} IS NULL
                `);
                const count = result.length > 0 ? Number(result[0].values[0][0]) || 0 : 0;
                if (count > 0) {
                    issues.push({
                        table: table.name,
                        column: foreignKey.from,
                        parentTable: foreignKey.table,
                        parentColumn,
                        count
                    });
                }
            } catch (e) {
                console.error(`No se pudo comprobar la relación ${table.name}.${foreignKey.from}:`, e);
            }
        });
    });

    return issues;
}

function getAnalyzeNullColumns(summary, database = db) {
    if (!database) return [];
    const issues = [];

    summary.tableStats.forEach(table => {
        if (table.rowCount === 0) return;
        const nullableColumns = table.columns.filter(column => !column.notnull);
        if (nullableColumns.length === 0) return;

        try {
            const selectParts = nullableColumns.map((column, index) => (
                `SUM(CASE WHEN ${quoteIdent(column.name)} IS NULL THEN 1 ELSE 0 END) AS n${index}`
            ));
            const result = database.exec(
                `SELECT ${selectParts.join(', ')} FROM ${quoteIdent(table.name)}`
            );
            const counts = result.length > 0 ? result[0].values[0] : [];
            nullableColumns.forEach((column, index) => {
                const count = Number(counts[index]) || 0;
                if (count > 0) {
                    issues.push({ table: table.name, column: column.name, count });
                }
            });
        } catch (e) {
            console.error(`No se pudieron contar los nulos de ${table.name}:`, e);
        }
    });

    return issues;
}

function buildAnalyzeQualityChecks(summary, database = db) {
    const checks = [];
    const emptyTables = summary.emptyTables;

    checks.push({
        status: emptyTables.length ? 'warning' : 'ok',
        title: 'Tablas con datos',
        detail: emptyTables.length
            ? `${emptyTables.length} tabla(s) sin registros: ${emptyTables.join(', ')}.`
            : 'Todas las tablas contienen registros.'
    });

    const tablesWithoutPk = summary.tableStats
        .filter(table => !table.columns.some(column => column.pk > 0))
        .map(table => table.name);
    checks.push({
        status: tablesWithoutPk.length ? 'warning' : 'ok',
        title: 'Claves primarias',
        detail: tablesWithoutPk.length
            ? `Sin clave primaria: ${tablesWithoutPk.join(', ')}.`
            : 'Todas las tablas tienen clave primaria.'
    });

    const orphanIssues = getAnalyzeOrphanIssues(summary, database);
    checks.push({
        status: orphanIssues.length ? 'error' : 'ok',
        title: 'Integridad referencial',
        detail: orphanIssues.length
            ? `${orphanIssues.length} relación(es) con registros huérfanos: ${orphanIssues.slice(0, 3).map(issue => `${issue.table}.${issue.column} (${issue.count})`).join(', ')}${orphanIssues.length > 3 ? '…' : ''}.`
            : 'No se detectaron registros huérfanos en las claves foráneas.'
    });

    const nullColumns = getAnalyzeNullColumns(summary, database);
    checks.push({
        status: nullColumns.length ? 'info' : 'ok',
        title: 'Valores nulos',
        detail: nullColumns.length
            ? `${nullColumns.length} columna(s) contienen nulos: ${nullColumns.slice(0, 3).map(issue => `${issue.table}.${issue.column} (${issue.count})`).join(', ')}${nullColumns.length > 3 ? '…' : ''}.`
            : 'No se encontraron valores nulos en las columnas consultadas.'
    });

    const untypedColumns = summary.tableStats.flatMap(table => table.columns
        .filter(column => !column.type)
        .map(column => `${table.name}.${column.name}`));
    checks.push({
        status: untypedColumns.length ? 'warning' : 'ok',
        title: 'Tipos declarados',
        detail: untypedColumns.length
            ? `${untypedColumns.length} columna(s) sin tipo: ${untypedColumns.slice(0, 3).join(', ')}${untypedColumns.length > 3 ? '…' : ''}.`
            : 'Todas las columnas tienen un tipo declarado.'
    });

    return checks;
}

function renderAnalyzeQuality(summary, database = db) {
    const container = document.getElementById('analyzeQuality');
    if (!container) return;

    if (summary.tableStats.length === 0) {
        container.innerHTML = `
            <div class="analyze-empty-state">
                <i class="fas fa-shield-halved"></i>
                <p>No hay datos para analizar.</p>
            </div>
        `;
        return;
    }

    const meta = {
        ok: { icon: 'fa-circle-check', label: 'Correcto' },
        warning: { icon: 'fa-triangle-exclamation', label: 'Revisar' },
        error: { icon: 'fa-circle-exclamation', label: 'Atención' },
        info: { icon: 'fa-circle-info', label: 'Info' }
    };

    container.innerHTML = buildAnalyzeQualityChecks(summary, database).map(check => {
        const checkMeta = meta[check.status] || meta.info;
        return `
            <div class="quality-item quality-${check.status}">
                <span class="quality-icon"><i class="fas ${checkMeta.icon}"></i></span>
                <div class="quality-copy">
                    <strong>${escapeHtml(check.title)}</strong>
                    <p>${escapeHtml(check.detail)}</p>
                </div>
                <span class="quality-badge">${checkMeta.label}</span>
            </div>
        `;
    }).join('');
}

function renderAnalyzePanel(database = db) {
    initAnalyzeExplorerControls();
    updateAnalyzeExplorerModeUI();

    const summary = getAnalyzeSummary(database);
    renderAnalyzeSummary(summary);
    renderAnalyzeTableList(summary);
    const selectedTable = summary.tableStats.find(table => table.name === analyzeSelectedTable) || summary.tableStats[0] || null;
    analyzeSelectedTable = selectedTable ? selectedTable.name : null;
    renderAnalyzeTableDetail(selectedTable, database);
    renderAnalyzeTableEditor(selectedTable, database);
    renderAnalyzeQuality(summary, database);
}

async function copyAnalyzeSelect(tableName) {
    const sql = `SELECT * FROM ${quoteIdent(tableName)} LIMIT 20;`;
    try {
        await copyTextToClipboard(sql);
        showToast('success', 'Consulta copiada al portapapeles.');
    } catch (e) {
        showToast('error', 'No se pudo copiar la consulta.');
    }
}

function practiceAnalyzeTable(tableName) {
    const editor = document.getElementById('sqlEditor');
    if (!editor) return;

    const sql = `SELECT * FROM ${quoteIdent(tableName)} LIMIT 20;`;
    editor.value = sql;
    editor.selectionStart = editor.selectionEnd = sql.length;
    activateSection('practice');
    editor.focus();
    runQuery();
}

// DATASETS
async function loadDataset(name) {
    const dataset = name === 'escuela' ? null : window.SQL_ACADEMY_DATASETS?.[name];
    if (name !== 'escuela' && !dataset) {
        showToast('error', 'El dataset seleccionado no está disponible.');
        syncDatasetSelector();
        return;
    }
    if (!SQLModule) {
        showToast('warning', 'Espera a que la base de datos termine de inicializarse.');
        syncDatasetSelector();
        return;
    }

    const label = name === 'escuela' ? 'Escuela' : dataset.name;
    const confirmed = confirm(
        `¿Cambiar al dataset ${label}?\n\nSe reemplazará la base de datos actual y se borrará la copia guardada. Exporta tu base si quieres conservarla.`
    );
    if (!confirmed) {
        syncDatasetSelector();
        return;
    }

    try {
        dbInitialized = false;
        lastQueryError = null;
        aiCooldownUntil = 0;
        aiResponseCache.clear();
        if (db) {
            try { db.close(); } catch (error) { /* ignorar */ }
            db = null;
        }
        await clearSavedDatabase();

        preferences.dataset = name;
        savePreferences();
        syncDatasetSelector();
        refreshPracticeContentForDataset();

        if (name === 'escuela') {
            initDatabase({ restore: false });
            return;
        }

        const nextDb = new SQLModule.Database();
        nextDb.run('PRAGMA foreign_keys = ON;');
        nextDb.run(dataset.sql);
        db = nextDb;
        dbInitialized = true;
        refreshAll();
        schedulePersistDatabase();
        showMessage(
            'success',
            `Dataset ${escapeHtml(dataset.name)} cargado`,
            `${escapeHtml(dataset.description)} Los ejemplos y retos se adaptan a este dataset.`
        );
        showToast('success', `Dataset ${dataset.name} listo.`);
    } catch (error) {
        console.error('No se pudo cargar el dataset:', error);
        preferences.dataset = 'escuela';
        savePreferences();
        syncDatasetSelector();
        refreshPracticeContentForDataset();
        showMessage('error', 'No se pudo cargar el dataset', `<code>${escapeHtml(error.message)}</code>`);
        showToast('error', 'Se restauró el dataset Escuela.');
        initDatabase({ restore: false });
    }
}

// REINICIAR BASE DE DATOS
async function resetDatabase(skipConfirm = false) {
    if (!skipConfirm && !confirm('¿Seguro que quieres reiniciar la base de datos a su estado original? Se borrará la copia guardada en este navegador.')) return;

    dbInitialized = false;
    lastQueryError = null;
    aiCooldownUntil = 0;
    preferences.dataset = 'escuela';
    savePreferences();
    syncDatasetSelector();
    refreshPracticeContentForDataset();
    showMessage('warning', 'Reiniciando base de datos...');
    await clearSavedDatabase();
    initDatabase({ restore: false });
}

async function restoreAnalyzeDatasetData() {
    const datasetName = preferences.dataset;
    const dataset = datasetName === 'escuela' ? null : window.SQL_ACADEMY_DATASETS?.[datasetName];
    const label = datasetName === 'escuela' ? 'Escuela' : dataset?.name || datasetName;

    if (datasetName !== 'escuela' && !dataset) {
        showToast('error', 'El dataset activo no está disponible.');
        return;
    }
    if (!SQLModule) {
        showToast('warning', 'Espera a que la base de datos termine de inicializarse.');
        return;
    }
    if (!confirm(`¿Restaurar los datos originales de ${label}? Se perderán los cambios guardados en este navegador.`)) return;

    if (datasetName === 'escuela') {
        await resetDatabase(true);
        showToast('info', 'Restaurando los datos originales de Escuela.');
        return;
    }

    try {
        const nextDb = new SQLModule.Database();
        nextDb.run('PRAGMA foreign_keys = ON;');
        nextDb.run(dataset.sql);

        if (db) {
            try { db.close(); } catch (error) { /* ignorar */ }
        }
        db = nextDb;
        dbInitialized = true;
        lastQueryError = null;
        aiCooldownUntil = 0;
        aiResponseCache.clear();

        await clearSavedDatabase();
        refreshAll();
        schedulePersistDatabase();
        showToast('success', `Datos originales de ${dataset.name} restaurados.`);
    } catch (error) {
        console.error('No se pudieron restaurar los datos del dataset:', error);
        showToast('error', `No se pudieron restaurar los datos: ${error.message}`);
    }
}

// EJEMPLOS POR CATEGORIAS
