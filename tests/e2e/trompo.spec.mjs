import { test, expect } from '@playwright/test';

async function openGame(page) {
    await page.route('https://cdn.jsdelivr.net/**', route => route.abort());
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    await expect(page.locator('.app-header')).toBeVisible();
    await page.evaluate(() => window.activateSection('game'));
}

test('Monte Mamut corre, salta, ataca y pausa sin afectar Torre de Datos', async ({ page }, testInfo) => {
    test.skip(!['mobile-390', 'desktop-1280'].includes(testInfo.project.name), 'Prueba en móvil y escritorio');

    await openGame(page);
    await expect(page.locator('#gameDeckbuilderPanel')).toBeVisible();
    await page.locator('#gameModeTrompoBtn').click();
    await expect(page.locator('#gameTrompoPanel')).toBeVisible();
    await expect(page.locator('#gameDeckbuilderPanel')).toBeHidden();
    await expect(page.locator('#trompoCanvas')).toBeVisible();

    await page.locator('[data-trompo-action="start"]').click();
    await expect(page.locator('#trompoOverlay')).toBeHidden();
    await expect.poll(async () => page.evaluate(() => window.Trompo.getState().rows)).toBeGreaterThan(0);
    expect(await page.evaluate(() => window.Trompo.getState().score)).toBeGreaterThan(0);

    await page.locator('#trompoMuteBtn').click();
    await expect(page.locator('#trompoMuteBtn')).toHaveAttribute('aria-pressed', 'true');
    await page.locator('#trompoMuteBtn').click();
    await expect(page.locator('#trompoMuteBtn')).toHaveAttribute('aria-pressed', 'false');

    await page.keyboard.press('Space');
    await page.waitForTimeout(150);
    expect(await page.evaluate(() => window.Trompo.getState().onGround)).toBe(false);

    await page.locator('#trompoTrunkBtn').click();
    await page.locator('#trompoStompBtn').dispatchEvent('pointerdown');
    await page.waitForTimeout(120);
    expect(await page.evaluate(() => window.Trompo.getState().mode)).toBe('running');

    await page.locator('#trompoPauseBtn').click();
    await expect(page.locator('#trompoOverlay')).toBeVisible();
    await expect(page.locator('#trompoOverlay')).toContainText('Pausa');
    await page.locator('[data-trompo-action="resume"]').click();
    await expect(page.locator('#trompoOverlay')).toBeHidden();

    await page.locator('#gameModeDeckbuilderBtn').click();
    await expect(page.locator('#gameDeckbuilderPanel')).toBeVisible();
    await expect(page.locator('#gameTrompoPanel')).toBeHidden();
});

test('Monte Mamut completa un nivel y avanza al siguiente', async ({ page }, testInfo) => {
    test.skip(!['mobile-390', 'desktop-1280'].includes(testInfo.project.name), 'Prueba en móvil y escritorio');

    await openGame(page);
    await page.locator('#gameModeTrompoBtn').click();
    await page.evaluate(() => {
        window.TrompoInternals.LEVELS[0].rows = 5;
    });
    await page.locator('[data-trompo-action="start"]').click();
    await expect(page.locator('#trompoOverlay')).toContainText('Nivel superado', { timeout: 5000 });
    await page.locator('[data-trompo-action="next"]').click();
    await expect(page.locator('#trompoLevelLabel')).toHaveText('2 / 4');
    await expect(page.locator('#trompoOverlay')).toBeHidden();
});

test('Monte Mamut responde a un mando conectado', async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== 'desktop-1280', 'Prueba de mando en escritorio');

    await page.addInitScript(() => {
        const pad = {
            id: 'Mando de prueba',
            connected: true,
            buttons: Array.from({ length: 16 }, () => ({ pressed: false, value: 0 })),
            axes: [0, 0, 0, 0]
        };
        window.__fakeGamepad = pad;
        Object.defineProperty(navigator, 'getGamepads', {
            configurable: true,
            value: () => [pad]
        });
    });

    await openGame(page);
    await page.locator('#gameModeTrompoBtn').click();
    await page.locator('[data-trompo-action="start"]').click();
    await page.waitForTimeout(300);

    await page.evaluate(() => {
        window.__fakeGamepad.buttons[0].pressed = true;
        window.dispatchEvent(new Event('gamepadconnected'));
    });
    await page.waitForTimeout(120);
    expect(await page.evaluate(() => window.Trompo.getState().onGround)).toBe(false);
    await expect(page.locator('#trompoGamepadStatus')).toBeVisible();

    await page.evaluate(() => {
        window.__fakeGamepad.buttons[0].pressed = false;
    });
    await page.waitForTimeout(900);
    expect(await page.evaluate(() => window.Trompo.getState().onGround)).toBe(true);
});
