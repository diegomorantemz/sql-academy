/**
 * Escapa texto para insertarlo de forma segura en HTML.
 * Se usa tanto en contenido como en valores de atributos.
 */
function escapeHtml(value) {
    if (value === null || value === undefined) return '';
    return String(value)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

/** Muestra una notificación breve sin sustituir los resultados de la consulta. */
function showToast(type, message, duration = 2800) {
    const container = document.getElementById('toastContainer');
    if (!container) return;

    const icons = {
        success: 'fa-check-circle',
        warning: 'fa-triangle-exclamation',
        error: 'fa-circle-exclamation',
        info: 'fa-circle-info'
    };
    const toast = document.createElement('div');
    toast.className = `toast toast-${icons[type] ? type : 'info'}`;
    toast.setAttribute('role', type === 'error' ? 'alert' : 'status');
    toast.innerHTML = `
        <i class="fas ${icons[type] || icons.info}" aria-hidden="true"></i>
        <span>${escapeHtml(message)}</span>
    `;
    container.appendChild(toast);

    setTimeout(() => {
        toast.classList.add('toast-hiding');
        setTimeout(() => toast.remove(), 220);
    }, duration);
}
