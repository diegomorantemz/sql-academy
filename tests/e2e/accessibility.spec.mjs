import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test.beforeEach(async ({ page }) => {
    await page.route('https://cdn.jsdelivr.net/**', route => route.abort());
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    await expect(page.locator('.app-header')).toBeVisible();
});

async function auditSections(page, prefix = '') {
    for (const section of ['learn', 'path', 'practice', 'challenges', 'nosql', 'analyze']) {
        await page.evaluate(name => window.activateSection(name), section);
        await page.waitForTimeout(350);
        const results = await new AxeBuilder({ page }).analyze();
        const serious = results.violations.filter(violation => (
            violation.impact === 'critical' || violation.impact === 'serious'
        ));
        expect(
            serious,
            `${prefix}${section}: ${serious.map(violation => `${violation.id} (${violation.nodes.length})`).join(', ')}`
        ).toEqual([]);
    }
}

test('las secciones principales no tienen violaciones graves de accesibilidad', async ({ page }, testInfo) => {
    test.skip(!['mobile-390', 'desktop-1280'].includes(testInfo.project.name), 'Auditoría en móvil y escritorio');
    await auditSections(page);
});

test('el modo oscuro mantiene la accesibilidad', async ({ page }, testInfo) => {
    test.skip(!['mobile-390', 'desktop-1280'].includes(testInfo.project.name), 'Auditoría en móvil y escritorio');
    await page.evaluate(() => window.toggleTheme());
    await auditSections(page, 'oscuro/');
});

test('la hoja Más mantiene la accesibilidad en modo oscuro', async ({ page }, testInfo) => {
    test.skip(!testInfo.project.name.startsWith('mobile'), 'Solo aplica a móvil');
    await page.evaluate(() => window.toggleTheme());
    await page.evaluate(() => window.openMobileMore());
    await expect(page.locator('#mobileMoreModal')).toHaveClass(/active/);
    await page.waitForTimeout(350);

    const results = await new AxeBuilder({ page }).analyze();
    const serious = results.violations.filter(violation => (
        violation.impact === 'critical' || violation.impact === 'serious'
    ));
    expect(serious, serious.map(violation => violation.id).join(', ')).toEqual([]);
});

test('el modal de instalación no tiene violaciones graves', async ({ page }, testInfo) => {
    test.skip(!['mobile-390', 'desktop-1280'].includes(testInfo.project.name), 'Auditoría en móvil y escritorio');
    await page.evaluate(() => window.openInstallGuide('postgresql'));
    await expect(page.locator('#installGuideModal')).toHaveClass(/active/);
    await page.waitForTimeout(350);

    const results = await new AxeBuilder({ page }).analyze();
    const serious = results.violations.filter(violation => (
        violation.impact === 'critical' || violation.impact === 'serious'
    ));
    expect(serious, serious.map(violation => violation.id).join(', ')).toEqual([]);
});
