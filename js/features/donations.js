// Donaciones voluntarias y códigos QR.

// DONACIONES VOLUNTARIAS
const DONATION_METHODS = {
    yape: {
        id: 'yape',
        label: 'Yape',
        icon: 'fa-mobile-screen-button',
        enabled: true,
        type: 'qr',
        image: 'assets/images/qr-yape.png',
        alt: 'QR de Yape para donar a SQL Academy'
    },
    plin: {
        id: 'plin',
        label: 'Plin',
        icon: 'fa-bolt',
        enabled: true,
        type: 'qr',
        image: 'assets/images/qr-plin.png',
        alt: 'QR de Plin para donar a SQL Academy'
    },
    paypal: {
        id: 'paypal',
        label: 'PayPal',
        icon: 'fa-paypal',
        enabled: false,
        type: 'link',
        url: ''
    },
    kofi: {
        id: 'kofi',
        label: 'Ko-fi',
        icon: 'fa-mug-hot',
        enabled: false,
        type: 'link',
        url: ''
    }
};

const DONATION_QUOTES = [
    'Este código no se va a escribir solo... bueno, a veces sí.',
    'Tu donación es como un buen índice: hace que todo sea más rápido.',
    'Con esto compro café para seguir soñando con código limpio.',
    'Apoya a un programador, evita que tenga que usar Excel.',
    'El servidor también tiene sentimientos (y necesita café).',
    'Las donaciones son como las transacciones ACID: confiables y necesarias.',
    'Gracias a ti, este proyecto no muere en el olvido.',
    'Tu aporte es más rápido que un SELECT sin WHERE.',
    'Así como las bases de datos necesitan índices, yo necesito café.',
    'Cada café es un commit más en mi vida.',
    'Las donaciones son el motor que mueve este proyecto.',
    'Programar sin café es como SQL sin JOIN: incompleto.',
    'Tu donación me da energía para seguir debugueando.',
    'Café + código = felicidad.',
    'No es una donación, es una inversión en código de calidad.'
];

function getEnabledDonationMethods() {
    return Object.values(DONATION_METHODS).filter(method => (
        method.enabled && (method.type !== 'link' || Boolean(method.url))
    ));
}

function getDonationMethod(type) {
    const methods = getEnabledDonationMethods();
    return methods.find(method => method.id === type) || methods[0] || null;
}

function renderDonationMethodTabs(selectedId, methods) {
    return `
        <div class="donation-method-tabs" role="tablist" aria-label="Método de donación">
            ${methods.map(method => `
                <button type="button"
                    class="donation-method-tab${method.id === selectedId ? ' active' : ''}"
                    role="tab"
                    aria-selected="${method.id === selectedId}"
                    onclick="showDonationQR('${escapeHtml(method.id)}')">
                    <i class="fas ${escapeHtml(method.icon)}"></i> ${escapeHtml(method.label)}
                </button>
            `).join('')}
        </div>
    `;
}

function renderDonationMethodPanel(method) {
    if (!method) return '';

    if (method.type === 'qr') {
        return `
            <div class="donation-method-panel" role="tabpanel">
                <div class="donation-qr-card">
                    <a href="${escapeHtml(method.image)}" target="_blank" rel="noopener" class="donation-qr-link" title="Abrir QR de ${escapeHtml(method.label)} en tamaño completo">
                        <img src="${escapeHtml(method.image)}" alt="${escapeHtml(method.alt)}" class="donation-qr-image">
                        <span class="donation-qr-hint"><i class="fas fa-expand"></i> Ver QR en grande</span>
                    </a>
                </div>
                <div class="donation-method-copy">
                    <p class="donation-scan-copy"><i class="fas fa-qrcode"></i> Escanea el QR y elige el monto.</p>
                </div>
            </div>
        `;
    }

    if (method.type === 'link') {
        return `
            <div class="donation-method-panel donation-method-panel-link" role="tabpanel">
                <div class="donation-method-copy">
                    <h3>Donar con ${escapeHtml(method.label)}</h3>
                    <p>Serás redirigido a ${escapeHtml(method.label)} para completar la donación.</p>
                    <a href="${escapeHtml(method.url)}" target="_blank" rel="noopener" class="btn-primary donation-link-btn">
                        <i class="fas ${escapeHtml(method.icon)}"></i> Abrir ${escapeHtml(method.label)}
                    </a>
                </div>
            </div>
        `;
    }

    return '';
}

function showDonationQR(type = 'yape') {
    const modal = document.getElementById('donationModal');
    const body = document.getElementById('donationModalBody');

    if (!modal || !body) {
        console.error('No se encontró el modal de donaciones');
        return;
    }

    const methods = getEnabledDonationMethods();
    const method = getDonationMethod(type);

    if (!method) {
        body.innerHTML = '<p class="text-muted">No hay métodos de donación disponibles.</p>';
        return;
    }

    const quote = DONATION_QUOTES[Math.floor(Math.random() * DONATION_QUOTES.length)];

    body.innerHTML = `
        <div class="donation-card">
            <p class="donation-lead">
                Si te sirvió, puedes apoyar el proyecto con una donación voluntaria.
            </p>

            ${renderDonationMethodTabs(method.id, methods)}
            ${renderDonationMethodPanel(method)}

            <div class="donation-quote">“${escapeHtml(quote)}”</div>

            <div class="donation-impact">
                <i class="fas fa-server" aria-hidden="true"></i>
                <p>Tu apoyo mantiene SQL Academy en línea: <strong>hosting, dominio y mantenimiento</strong> para que siga siendo gratuito para quienes están empezando.</p>
            </div>
        </div>
    `;

    if (!modal.classList.contains('active')) {
        openModal(modal);
    } else {
        const activeTab = body.querySelector('.donation-method-tab.active');
        if (activeTab) activeTab.focus();
    }
}

function closeDonationModal() {
    closeModal(document.getElementById('donationModal'));
}
