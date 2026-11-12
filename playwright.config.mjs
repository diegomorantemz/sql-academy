import { defineConfig } from '@playwright/test';

export default defineConfig({
    testDir: './tests/e2e',
    fullyParallel: false,
    timeout: 30000,
    expect: {
        timeout: 5000
    },
    use: {
        baseURL: 'http://127.0.0.1:4173',
        trace: 'retain-on-failure'
    },
    webServer: {
        command: 'python3 -m http.server 4173 --bind 127.0.0.1',
        url: 'http://127.0.0.1:4173',
        reuseExistingServer: !process.env.CI,
        timeout: 30000
    },
    projects: [
        {
            name: 'mobile-360',
            use: { browserName: 'chromium', viewport: { width: 360, height: 800 }, isMobile: true, hasTouch: true, deviceScaleFactor: 2 }
        },
        {
            name: 'mobile-390',
            use: { browserName: 'chromium', viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, deviceScaleFactor: 2 }
        },
        {
            name: 'tablet-768',
            use: { browserName: 'chromium', viewport: { width: 768, height: 1024 }, isMobile: true, hasTouch: true, deviceScaleFactor: 1 }
        },
        {
            name: 'laptop-1024',
            use: { browserName: 'chromium', viewport: { width: 1024, height: 768 } }
        },
        {
            name: 'desktop-1280',
            use: { browserName: 'chromium', viewport: { width: 1280, height: 800 } }
        }
    ]
});
