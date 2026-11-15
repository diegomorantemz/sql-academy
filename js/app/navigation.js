// Navegación entre secciones, pestañas de retos y hoja móvil.

function activateChallengeTab(tabName) {
    const tabs = Array.from(document.querySelectorAll('.challenge-tab'));
    const panels = {
        sql: document.getElementById('sqlChallengesPanel'),
        nosql: document.getElementById('nosqlChallengesPanel'),
        debug: document.getElementById('debugChallengesPanel')
    };
    const nextTab = ['sql', 'nosql', 'debug'].includes(tabName) ? tabName : 'sql';

    tabs.forEach(tab => {
        const active = tab.dataset.challengeTab === nextTab;
        tab.classList.toggle('active', active);
        tab.setAttribute('aria-selected', String(active));
        tab.tabIndex = active ? 0 : -1;
    });

    Object.entries(panels).forEach(([name, panel]) => {
        if (!panel) return;
        const active = name === nextTab;
        panel.hidden = !active;
        panel.classList.toggle('active', active);
    });

    if (nextTab === 'nosql') {
        renderNoSQLChallengeHub();
    } else if (nextTab === 'debug') {
        renderDebugChallengeList();
    }
}

function syncMobileNavigation(sectionName) {
    const moreSections = ['game', 'nosql', 'analyze'];
    document.querySelectorAll('[data-mobile-section]').forEach(button => {
        const active = button.dataset.mobileSection === sectionName;
        button.classList.toggle('active', active);
        if (active) {
            button.setAttribute('aria-current', 'page');
        } else {
            button.removeAttribute('aria-current');
        }
    });

    const moreActive = moreSections.includes(sectionName);
    const moreButton = document.getElementById('mobileMoreBtn');
    if (moreButton) {
        moreButton.classList.toggle('active', moreActive);
        if (moreActive) {
            moreButton.setAttribute('aria-current', 'page');
        } else {
            moreButton.removeAttribute('aria-current');
        }
    }

    document.querySelectorAll('[data-mobile-more-section]').forEach(button => {
        const active = button.dataset.mobileMoreSection === sectionName;
        button.classList.toggle('active', active);
        if (active) {
            button.setAttribute('aria-current', 'page');
        } else {
            button.removeAttribute('aria-current');
        }
    });
}

function openMobileMore() {
    const modal = document.getElementById('mobileMoreModal');
    const button = document.getElementById('mobileMoreBtn');
    if (!modal) return;
    button?.setAttribute('aria-expanded', 'true');
    openModal(modal);
}

function closeMobileMore() {
    const modal = document.getElementById('mobileMoreModal');
    if (!modal) return;
    closeModal(modal);
    document.getElementById('mobileMoreBtn')?.focus();
}

function activateSection(sectionName) {
    document.querySelectorAll('.nav-btn').forEach(btn => {
        const active = btn.dataset.section === sectionName;
        btn.classList.toggle('active', active);
        if (active) {
            btn.setAttribute('aria-current', 'page');
        } else {
            btn.removeAttribute('aria-current');
        }
    });

    document.querySelectorAll('.section').forEach(section => {
        section.classList.remove('active');
    });

    const target = document.getElementById('section-' + sectionName);
    if (target) {
        target.classList.add('active');
    }

    if (sectionName === 'challenges') {
        const activeTab = document.querySelector('.challenge-tab.active')?.dataset.challengeTab || 'sql';
        activateChallengeTab(activeTab);
    }

    if (sectionName === 'path') {
        if (currentCourseView === 'player') {
            renderCoursePlayer();
        } else if (currentCourseView === 'detail' && currentCourseId) {
            renderCourseDetail(currentCourseId);
        } else {
            renderCourseCatalog();
        }
    }

    if (sectionName !== 'game' && window.Trompo) {
        window.Trompo.hide();
    }

    syncMobileNavigation(sectionName);
}
