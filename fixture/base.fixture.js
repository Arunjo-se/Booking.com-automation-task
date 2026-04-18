/**
 * base.fixture.js
 *
 * Extends Playwright's built-in `test` with:
 *  - Browser launch / close  (worker scope)
 *  - Context creation / close
 *  - Page creation / close
 *
 * Every stage has its own try/catch so failures are attributed
 * precisely (launch vs context vs page vs action) and cleanup
 * always runs even when a previous step threw.
 */

import { test as base } from '@playwright/test';

const loggedBase = base.extend({
    // ─────────────────────────────────────────────────────────────
    // 1. BROWSER  (worker scope — one browser shared across all
    //             tests in a worker process)
    // ─────────────────────────────────────────────────────────────
    browser: [
        async ({ playwright, browserName, launchOptions }, use) => {
            let browser;

            try {
                console.log(`--- Launching browser: [${browserName}]`);
                browser = await playwright[browserName].launch(launchOptions);
                console.log(`--- Browser launched: [${browserName}]`);
            } catch (launchError) {
                console.error(
                    `--- Failed to launch browser [${browserName}]: ` +
                    (launchError instanceof Error ? launchError.message : String(launchError))
                );
                throw launchError;
            }

            try {
                await use(browser);
            } finally {
                try {
                    await browser.close();
                    console.log(`--- Browser closed: [${browserName}]`);
                } catch (closeError) {
                    console.warn(
                        `--- Browser did not close cleanly [${browserName}]: ` +
                        (closeError instanceof Error ? closeError.message : String(closeError))
                    );
                }
            }
        },
        { scope: 'worker' },
    ],

    // ─────────────────────────────────────────────────────────────
    // 2. CONTEXT  (test scope — fresh context per test for isolation)
    // ─────────────────────────────────────────────────────────────
    context: async ({ browser, contextOptions }, use) => {
        let context;


        try {
            console.log(`--- Creating browser context...`);
            context = await browser.newContext(contextOptions);
            console.log(`--- Context ready`);
        } catch (contextError) {
            console.error(
                `--- Context creation failed: ` +
                (contextError instanceof Error ? contextError.message : String(contextError))
            );
            throw contextError;
        }

        try {
            await use(context);
        } finally {
            try {
                await context.close();
                console.log(`--- Context closed`);
            } catch (closeError) {
                console.warn(
                    `--- Context did not close cleanly: ` +
                    (closeError instanceof Error ? closeError.message : String(closeError))
                );
            }
        }
    },

    // ─────────────────────────────────────────────────────────────
    // 3. PAGE  (test scope — one page per test)
    //    testInfo gives us the test title for precise error logging
    // ─────────────────────────────────────────────────────────────
    page: async ({ context }, use, testInfo) => {
        let page;

        try {
            console.log(`--- Opening page for: "${testInfo.title}"`);
            page = await context.newPage();
            console.log(`--- Page opened`);
        } catch (pageError) {
            console.error(
                `--- Page creation failed: ` +
                (pageError instanceof Error ? pageError.message : String(pageError))
            );
            throw pageError;
        }

        try {
            await use(page);
        } catch (actionError) {
            console.error(
                `--- Action failed in test "${testInfo.title}": ` +
                (actionError instanceof Error ? actionError.message : String(actionError))
            );
            throw actionError;
        } finally {
            try {
                await page.close();
                console.log(`--- Page closed: "${testInfo.title}"`);
            } catch (closeError) {
                console.warn(
                    `--- Page did not close cleanly: ` +
                    (closeError instanceof Error ? closeError.message : String(closeError))
                );
            }
        }
    },
});

export { loggedBase as test };
export { expect } from '@playwright/test';