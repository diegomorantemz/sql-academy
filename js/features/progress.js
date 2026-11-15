// Reporte de progreso imprimible.

// ============================================
// REPORTE DE PROGRESO
// ============================================

function formatReportDate(value = new Date()) {
    const date = value instanceof Date ? value : new Date(value);
    if (Number.isNaN(date.getTime())) return '';
    return date.toLocaleDateString('es-ES', { day: '2-digit', month: 'long', year: 'numeric' });
}

function buildProgressReportHtml(studentName = '') {
    const stats = getLearningGlobalStats();
    const concepts = getLearningConceptStats();
    const recommendation = getLearningRecommendation();
    const sqlLevel = getSkillLevelInfo(getSkillLevel('sql'));
    const nosqlLevel = getSkillLevelInfo(getSkillLevel('nosql'));
    const sqlMeta = skillProfile.sqlTestedAt
        ? `Test: ${formatReportDate(skillProfile.sqlTestedAt)}`
        : (skillProfile.sqlSource === 'manual' ? 'Nivel elegido manualmente' : 'Sin test');
    const nosqlMeta = skillProfile.nosqlTestedAt
        ? `Test: ${formatReportDate(skillProfile.nosqlTestedAt)}`
        : (skillProfile.nosqlSource === 'manual' ? 'Nivel elegido manualmente' : 'Sin test');
    const weak = [...getWeakConcepts('sql'), ...getWeakConcepts('nosql')];
    const named = studentName.trim();

    const conceptRows = concepts.map(concept => `
        <tr>
            <td>${escapeHtml(concept.label)}</td>
            <td>${concept.percent}%</td>
            <td>${concept.completed}/${concept.total}</td>
        </tr>
    `).join('');

    return `<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="UTF-8">
<title>Reporte de aprendizaje - SQL Academy</title>
<style>
    @page { size: A4; margin: 16mm; }
    * { box-sizing: border-box; }
    body { margin: 0; color: #1e293b; font-family: Arial, Helvetica, sans-serif; line-height: 1.45; }
    .header { display: flex; justify-content: space-between; gap: 20px; padding-bottom: 14px; border-bottom: 3px solid #336791; }
    .brand { color: #336791; font-size: 20px; font-weight: 800; letter-spacing: .04em; }
    .subtitle { color: #64748b; font-size: 11px; margin-top: 3px; }
    .meta { color: #64748b; font-size: 11px; text-align: right; }
    h1 { margin: 22px 0 4px; font-size: 23px; }
    .student { color: #475569; font-size: 13px; margin: 0 0 18px; }
    .grid { display: flex; gap: 10px; margin: 16px 0; }
    .metric { flex: 1; padding: 11px; border: 1px solid #dbe4ee; border-radius: 8px; background: #f8fafc; }
    .metric span { display: block; color: #64748b; font-size: 9px; font-weight: 700; letter-spacing: .06em; text-transform: uppercase; }
    .metric strong { display: block; margin-top: 3px; font-size: 20px; color: #1e293b; }
    .levels { display: flex; gap: 10px; margin: 14px 0; }
    .level { flex: 1; padding: 12px; border-left: 4px solid #336791; border-radius: 7px; background: #f8fafc; }
    .level span { display: block; color: #64748b; font-size: 10px; text-transform: uppercase; letter-spacing: .05em; }
    .level strong { display: block; margin: 2px 0; color: #1e293b; font-size: 17px; }
    .level small { color: #64748b; font-size: 10px; }
    h2 { margin: 22px 0 8px; font-size: 14px; color: #334155; }
    table { width: 100%; border-collapse: collapse; font-size: 11px; }
    th { padding: 7px 8px; background: #eef4fa; color: #475569; text-align: left; border-bottom: 1px solid #dbe4ee; }
    td { padding: 6px 8px; border-bottom: 1px solid #edf2f7; }
    .recommendation { margin-top: 16px; padding: 11px 13px; border-left: 4px solid #f39c12; border-radius: 7px; background: #fff9e8; font-size: 11px; }
    .recommendation strong { display: block; color: #7a5a00; }
    .weak { margin-top: 10px; color: #8b1e1e; font-size: 11px; }
    .footer { margin-top: 30px; padding-top: 10px; border-top: 1px solid #dbe4ee; color: #94a3b8; font-size: 9px; display: flex; justify-content: space-between; }
</style>
</head>
<body>
    <div class="header">
        <div>
            <div class="brand">SQL ACADEMY</div>
            <div class="subtitle">Reporte de aprendizaje · MNTWARE</div>
        </div>
        <div class="meta">Generado el ${escapeHtml(formatReportDate())}</div>
    </div>

    <h1>Reporte de aprendizaje</h1>
    ${named ? `<p class="student">Preparado para: <strong>${escapeHtml(named)}</strong></p>` : '<p class="student">Resumen personal de tu recorrido en SQL Academy.</p>'}

    <div class="levels">
        <div class="level">
            <span>Nivel SQL</span>
            <strong>${escapeHtml(sqlLevel.label)}</strong>
            <small>${escapeHtml(sqlMeta)}</small>
        </div>
        <div class="level">
            <span>Nivel NoSQL</span>
            <strong>${escapeHtml(nosqlLevel.label)}</strong>
            <small>${escapeHtml(nosqlMeta)}</small>
        </div>
    </div>

    <div class="grid">
        <div class="metric"><span>Lecciones</span><strong>${stats.lessonsCompleted}/${stats.lessonsTotal}</strong></div>
        <div class="metric"><span>Retos SQL</span><strong>${stats.challengesCompleted}/${stats.challengesTotal}</strong></div>
        <div class="metric"><span>Actividades</span><strong>${stats.completed}/${stats.total}</strong></div>
        <div class="metric"><span>Avance global</span><strong>${stats.percent}%</strong></div>
    </div>

    <h2>Dominio por concepto</h2>
    <table>
        <thead><tr><th>Concepto</th><th>Dominio</th><th>Actividades</th></tr></thead>
        <tbody>${conceptRows}</tbody>
    </table>

    <div class="recommendation">
        <strong>Siguiente paso recomendado</strong>
        ${escapeHtml(recommendation.title)} — ${escapeHtml(recommendation.message)}
    </div>

    ${weak.length ? `<div class="weak"><strong>Refuerza:</strong> ${escapeHtml(weak.map(item => item.concept).join(', '))}</div>` : ''}

    <div class="footer">
        <span>SQL Academy · Aprende, practica y comprueba resultados.</span>
        <span>${escapeHtml(recommendation.action)}</span>
    </div>
</body>
</html>`;
}

function openProgressReport() {
    const body = document.getElementById('progressReportBody');
    const modal = document.getElementById('progressReportModal');
    if (!body || !modal) return;

    const stats = getLearningGlobalStats();
    const sqlLevel = getSkillLevelInfo(getSkillLevel('sql'));
    const nosqlLevel = getSkillLevelInfo(getSkillLevel('nosql'));

    body.innerHTML = `
        <div class="report-form">
            <p>Genera un resumen de tu recorrido para imprimir o guardar como PDF.</p>
            <label class="report-name-label" for="reportStudentName">Nombre para el reporte (opcional)</label>
            <input id="reportStudentName" type="text" maxlength="80" placeholder="Tu nombre">
            <div class="report-preview">
                <div><span>Nivel SQL</span><strong>${escapeHtml(sqlLevel.label)}</strong></div>
                <div><span>Nivel NoSQL</span><strong>${escapeHtml(nosqlLevel.label)}</strong></div>
                <div><span>Actividades</span><strong>${stats.completed}/${stats.total}</strong></div>
            </div>
            <div class="report-actions">
                <button type="button" class="btn-primary" onclick="printProgressReport()">
                    <i class="fas fa-print"></i> Imprimir / Guardar PDF
                </button>
                <button type="button" class="btn-secondary" onclick="closeProgressReport()">Cerrar</button>
            </div>
        </div>
    `;
    openModal(modal);
}

function printProgressReport() {
    const name = document.getElementById('reportStudentName')?.value.trim() || '';
    const report = buildProgressReportHtml(name);
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
        showToast('warning', 'Permite ventanas emergentes para imprimir el reporte.');
        return;
    }
    try { printWindow.opener = null; } catch (error) { /* ignorar */ }
    printWindow.document.open();
    printWindow.document.write(report);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => printWindow.print(), 300);
}

function closeProgressReport() {
    closeModal(document.getElementById('progressReportModal'));
}
