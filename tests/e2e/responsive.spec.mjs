import { test, expect } from '@playwright/test';

test.beforeEach(async ({ page }) => {
    await page.route('https://cdn.jsdelivr.net/**', route => route.abort());
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    await expect(page.locator('.app-header')).toBeVisible();
});

const isMobileProject = testInfo => testInfo.project.name.startsWith('mobile') || testInfo.project.name.startsWith('tablet');

test('las secciones principales no generan scroll horizontal', async ({ page }) => {
    for (const section of ['learn', 'path', 'practice', 'challenges', 'nosql', 'analyze']) {
        await page.evaluate(name => window.activateSection(name), section);
        await page.waitForTimeout(30);

        const overflow = await page.evaluate(() => (
            Math.max(document.documentElement.scrollWidth, document.body.scrollWidth)
            - document.documentElement.clientWidth
        ));
        expect(overflow, `desbordamiento horizontal en ${section}`).toBeLessThanOrEqual(1);
    }
});

test('la navegación cambia entre barra superior y barra inferior', async ({ page }, testInfo) => {
    if (isMobileProject(testInfo)) {
        await expect(page.locator('.mobile-nav')).toBeVisible();
        await expect(page.locator('.main-nav')).toBeHidden();

        await page.locator('[data-mobile-section="practice"]').click();
        await expect(page.locator('[data-mobile-section="practice"]')).toHaveClass(/active/);
        await expect(page.locator('#section-practice')).toHaveClass(/active/);

        await page.locator('#mobileMoreBtn').click();
        await expect(page.locator('#mobileMoreModal')).toHaveClass(/active/);
        await expect(page.locator('[data-mobile-more-section="nosql"]')).toBeVisible();

        await page.waitForTimeout(350);
        const sheetBox = await page.locator('#mobileMoreModal .modal-content').boundingBox();
        const viewport = page.viewportSize();
        expect(sheetBox.x).toBeGreaterThanOrEqual(0);
        expect(sheetBox.width).toBeLessThanOrEqual(viewport.width + 1);
        expect(sheetBox.y + sheetBox.height).toBeLessThanOrEqual(viewport.height + 1);

        await page.locator('[data-mobile-more-section="nosql"]').click();
        await expect(page.locator('#section-nosql')).toHaveClass(/active/);
        await expect(page.locator('#mobileMoreModal')).not.toHaveClass(/active/);
    } else {
        await expect(page.locator('.main-nav')).toBeVisible();
        await expect(page.locator('.mobile-nav')).toBeHidden();
    }
});

test('la app prefiere la red antes que un CSS viejo en caché', async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== 'mobile-390', 'Regresión de caché en móvil');

    await page.evaluate(() => navigator.serviceWorker.ready);
    await page.reload({ waitUntil: 'domcontentloaded' });
    await page.waitForFunction(() => Boolean(navigator.serviceWorker.controller));

    await page.evaluate(async () => {
        const keys = await caches.keys();
        const cacheKey = keys.find(key => key.startsWith('sql-academy-'));
        if (!cacheKey) throw new Error('No se encontró la caché de la app');

        const cache = await caches.open(cacheKey);
        const cssUrl = new URL('./style.css', window.location.href).href;
        await cache.put(cssUrl, new Response(
            '@media (max-width: 768px) { .main-nav { display: flex !important; } }',
            { headers: { 'Content-Type': 'text/css' } }
        ));
    });

    await page.reload({ waitUntil: 'domcontentloaded' });
    await expect(page.locator('.app-header')).toBeVisible();
    await expect(page.locator('.main-nav')).toBeHidden();
    await expect(page.locator('.mobile-nav')).toBeVisible();
});

test('los accesos táctiles de la barra inferior son cómodos', async ({ page }, testInfo) => {
    test.skip(!isMobileProject(testInfo), 'Solo aplica a viewports móviles');
    const heights = await page.locator('.mobile-nav-btn').evaluateAll(buttons => (
        buttons.map(button => button.getBoundingClientRect().height)
    ));
    expect(Math.min(...heights)).toBeGreaterThanOrEqual(44);
});

test('el curso muestra concepto antes del editor y la práctica después', async ({ page }) => {
    await page.evaluate(() => window.activateSection('path'));
    await expect(page.locator('#courseCatalogView .course-card')).toHaveCount(4);
    await expect(page.locator('#courseSqlDatasetSelector')).toBeVisible();
    await expect(page.locator('#courseNoSQLDatasetSelector')).toBeVisible();

    await page.locator('[data-course-start="sql-desde-cero"]').click();
    await expect(page.locator('#lessonStepContent .lesson-objectives')).toBeVisible();
    await expect(page.locator('#pathEditor')).toHaveCount(0);

    await page.locator('[data-lesson-step="practice"]').click();
    await expect(page.locator('#pathEditor')).toBeVisible();
});

test('los formularios evitan el zoom automático en móvil', async ({ page }, testInfo) => {
    test.skip(!isMobileProject(testInfo), 'Solo aplica a viewports móviles');
    await page.evaluate(() => window.activateSection('learn'));
    const fontSize = await page.locator('#guideSearch').evaluate(element => (
        Number.parseFloat(getComputedStyle(element).fontSize)
    ));
    expect(fontSize).toBeGreaterThanOrEqual(16);
});

test('los modales caben en el viewport y se cierran con Escape', async ({ page }) => {
    await page.evaluate(() => window.openInstallGuide('postgresql'));
    const modal = page.locator('#installGuideModal');
    await expect(modal).toHaveClass(/active/);

    const box = await modal.locator('.modal-content').boundingBox();
    const viewport = page.viewportSize();
    expect(box.x).toBeGreaterThanOrEqual(0);
    expect(box.y).toBeGreaterThanOrEqual(0);
    expect(box.width).toBeLessThanOrEqual(viewport.width + 1);
    expect(box.height).toBeLessThanOrEqual(viewport.height + 1);

    await page.keyboard.press('Escape');
    await expect(modal).not.toHaveClass(/active/);
});
