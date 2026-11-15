// Renderizado, orden, exportación y copia de resultados.

function compareResultValues(a, b) {
    if (a === b) return 0;
    if (a === null || a === undefined) return -1;
    if (b === null || b === undefined) return 1;
    if (typeof a === 'number' && typeof b === 'number') return a - b;
    return String(a).localeCompare(String(b), 'es', { numeric: true, sensitivity: 'base' });
}

function getSortedResultSet(index) {
    const set = lastResultSets[index];
    if (!set) return null;
    const sort = resultSortState[index];
    if (!sort) return set;

    const values = set.values.map(row => row.slice());
    values.sort((left, right) => {
        const comparison = compareResultValues(left[sort.column], right[sort.column]);
        return sort.direction === 'asc' ? comparison : -comparison;
    });

    return { ...set, values };
}

function resultSetToObjects(set) {
    if (!set) return [];
    return set.values.map(row => {
        const object = {};
        set.columns.forEach((column, index) => {
            object[column] = row[index] === undefined ? null : row[index];
        });
        return object;
    });
}

function escapeCsvCell(value) {
    const text = value === null || value === undefined ? '' : String(value);
    return /[",\r\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

function resultSetToCsv(set) {
    if (!set) return '';
    const header = set.columns.map(escapeCsvCell).join(',');
    const rows = set.values.map(row => row.map(escapeCsvCell).join(','));
    return [header, ...rows].join('\r\n');
}

function resultSetToTsv(set) {
    if (!set) return '';
    const clean = value => String(value ?? '').replace(/\t/g, ' ').replace(/\r?\n/g, ' ');
    const header = set.columns.map(clean).join('\t');
    const rows = set.values.map(row => row.map(clean).join('\t'));
    return [header, ...rows].join('\n');
}

function downloadTextFile(content, filename, mimeType) {
    const blob = new Blob([content], { type: `${mimeType};charset=utf-8` });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    link.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function resultFileTimestamp() {
    return new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
}

async function copyTextToClipboard(text) {
    if (navigator.clipboard && typeof navigator.clipboard.writeText === 'function') {
        await navigator.clipboard.writeText(text);
        return;
    }

    const textarea = document.createElement('textarea');
    textarea.value = text;
    textarea.setAttribute('readonly', '');
    textarea.style.position = 'fixed';
    textarea.style.opacity = '0';
    document.body.appendChild(textarea);
    textarea.select();
    const copied = typeof document.execCommand === 'function' ? document.execCommand('copy') : false;
    textarea.remove();
    if (!copied) throw new Error('No se pudo copiar al portapapeles');
}

function renderResultSets() {
    const output = document.getElementById('resultOutput');
    if (!output) return;

    const multiple = lastResultSets.length > 1;
    let html = '';

    lastResultSets.forEach((set, index) => {
        const sortedSet = getSortedResultSet(index) || set;
        const rowCount = sortedSet.values.length;
        const colCount = sortedSet.columns.length;
        const limit = Math.max(RESULTS_PAGE_SIZE, resultRowLimits[index] || RESULTS_PAGE_SIZE);
        const visibleRows = sortedSet.values.slice(0, limit);
        const sort = resultSortState[index];
        const duration = index === 0 ? formatDuration(lastQueryMeta.durationMs) : '';

        html += `
            <div class="result-meta">
                <span class="result-summary">
                    <i class="fas fa-list"></i>
                    ${multiple ? `Resultado ${index + 1} de ${lastResultSets.length}: ` : ''}
                    ${rowCount} ${rowCount === 1 ? 'fila' : 'filas'} | ${colCount} columnas
                    ${duration ? `<span class="result-time"><i class="fas fa-stopwatch"></i> ${escapeHtml(duration)}</span>` : ''}
                </span>
                <span class="result-actions">
                    <button type="button" class="result-action-btn" onclick="copyResultTable(${index})" title="Copiar toda la tabla">
                        <i class="fas fa-copy"></i> Copiar
                    </button>
                    <button type="button" class="result-action-btn" onclick="exportResultCSV(${index})" title="Descargar como CSV">
                        <i class="fas fa-file-csv"></i> CSV
                    </button>
                    <button type="button" class="result-action-btn" onclick="exportResultJSON(${index})" title="Descargar como JSON">
                        <i class="fas fa-file-code"></i> JSON
                    </button>
                </span>
            </div>
            <div class="result-container">
                <table>
                    <thead>
                        <tr>
                            ${sortedSet.columns.map((col, colIndex) => {
                                const ariaSort = sort && sort.column === colIndex
                                    ? (sort.direction === 'asc' ? 'ascending' : 'descending')
                                    : 'none';
                                const icon = sort && sort.column === colIndex
                                    ? (sort.direction === 'asc' ? 'fa-arrow-up-short-wide' : 'fa-arrow-down-wide-short')
                                    : 'fa-sort';
                                return `<th class="sortable-result" tabindex="0" scope="col" aria-sort="${ariaSort}"
                                    title="Ordenar por ${escapeHtml(col)}"
                                    onclick="sortResult(${index}, ${colIndex})"
                                    onkeydown="if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); sortResult(${index}, ${colIndex}); }">
                                    ${escapeHtml(col)} <i class="fas ${icon}" aria-hidden="true"></i>
                                </th>`;
                            }).join('')}
                        </tr>
                    </thead>
                    <tbody>
                        ${rowCount === 0
                            ? `<tr><td colspan="${colCount}" style="text-align:center;color:var(--text-muted);">Sin filas</td></tr>`
                            : visibleRows.map(row => `
                                <tr>
                                    ${row.map(value => {
                                        const displayValue = value !== null && value !== undefined ? String(value) : 'NULL';
                                        const truncated = displayValue.length > 50 ? displayValue.substring(0, 50) + '...' : displayValue;
                                        return `<td class="copyable-cell" title="${escapeHtml(displayValue)} (doble clic para copiar)"
                                            data-copy-value="${escapeHtml(displayValue)}">${escapeHtml(truncated)}</td>`;
                                    }).join('')}
                                </tr>
                            `).join('')}
                    </tbody>
                </table>
            </div>
        `;

        if (rowCount > limit) {
            const remaining = rowCount - limit;
            html += `
                <div class="result-more">
                    <span>Mostrando ${visibleRows.length} de ${rowCount} filas.</span>
                    <button type="button" class="result-action-btn" onclick="showMoreResults(${index})">
                        <i class="fas fa-plus"></i> Mostrar ${Math.min(RESULTS_PAGE_SIZE, remaining)} más
                    </button>
                </div>
            `;
        }
    });

    html += `
        <div class="result-scroll-hint">
            <span><i class="fas fa-arrow-left"></i><i class="fas fa-arrow-right"></i> Scroll horizontal</span>
            <span><i class="fas fa-arrow-up"></i><i class="fas fa-arrow-down"></i> Scroll vertical</span>
            <span><i class="fas fa-copy"></i> Doble clic en una celda para copiarla</span>
        </div>
    `;

    output.classList.remove('result-placeholder');
    output.innerHTML = html;
}

function displayResults(result, meta = {}) {
    const resultSets = (result || []).filter(set => set && set.columns && set.columns.length > 0);
    lastQueryMeta = {
        durationMs: Number(meta.durationMs) || 0,
        executedAt: new Date()
    };

    if (resultSets.length === 0) {
        const time = formatDuration(lastQueryMeta.durationMs);
        showMessage('success', 'Consulta ejecutada correctamente', time ? `<span class="result-time"><i class="fas fa-stopwatch"></i> ${escapeHtml(time)}</span>` : '');
        lastResultSets = [];
        return;
    }

    lastResultSets = resultSets;
    resultRowLimits = resultSets.map(() => RESULTS_PAGE_SIZE);
    resultSortState = resultSets.map(() => null);
    renderResultSets();
}

function sortResult(index, column) {
    if (!lastResultSets[index]) return;
    const current = resultSortState[index];
    resultSortState[index] = current && current.column === column
        ? { column, direction: current.direction === 'asc' ? 'desc' : 'asc' }
        : { column, direction: 'asc' };
    renderResultSets();
}

function showMoreResults(index) {
    if (!lastResultSets[index]) return;
    resultRowLimits[index] = (resultRowLimits[index] || RESULTS_PAGE_SIZE) + RESULTS_PAGE_SIZE;
    renderResultSets();
}

function exportResultCSV(index) {
    const set = getSortedResultSet(index);
    if (!set) return;
    downloadTextFile(resultSetToCsv(set), `resultado_${resultFileTimestamp()}.csv`, 'text/csv');
    showToast('success', 'Resultado exportado como CSV.');
}

function exportResultJSON(index) {
    const set = getSortedResultSet(index);
    if (!set) return;
    downloadTextFile(JSON.stringify(resultSetToObjects(set), null, 2), `resultado_${resultFileTimestamp()}.json`, 'application/json');
    showToast('success', 'Resultado exportado como JSON.');
}

async function copyResultTable(index) {
    const set = getSortedResultSet(index);
    if (!set) return;
    try {
        await copyTextToClipboard(resultSetToTsv(set));
        showToast('success', 'Resultado copiado al portapapeles.');
    } catch (error) {
        showToast('error', 'No se pudo copiar. Selecciona la tabla manualmente.');
    }
}

async function copyResultCell(value) {
    try {
        await copyTextToClipboard(value);
        showToast('success', 'Celda copiada al portapapeles.');
    } catch (error) {
        showToast('error', 'No se pudo copiar la celda.');
    }
}

// ============================================
// ASISTENTE IA: CONTEXTO Y PETICIONES
// ============================================

/** Muestra un error de consulta con acceso directo al asistente. */
