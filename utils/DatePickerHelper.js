/**
 * DatePickerHelper.js
 *
 * Utility for interacting with the Booking.com calendar widget.
 *
 * Why a util and not a POM method?
 *  - Calendar interaction is reusable across any page that has a date picker
 *    (homepage search form, modify-search on results page, hotel detail page).
 *  - It takes `page` as a parameter rather than storing it — making it
 *    stateless and safe to call from any context.
 *  - No locators stored in a constructor; all selectors are local to each method.
 */

export class DatePickerHelper {
    /**
     * Selectors for the "next month" navigation button.
     * Listed primary → fallback.
     */
    static NEXT_MONTH_BTN = 'button[aria-label="Next month"]';

    /** How many months ahead we'll scroll before giving up */
    static MAX_MONTHS_FORWARD = 6;

    // ────────────────────────────────────────────────────────────
    // PUBLIC API
    // ────────────────────────────────────────────────────────────

    /**
     * Click a specific date cell on the open Booking.com calendar.
     *
     * Booking.com calendar cells carry a `data-date="YYYY-MM-DD"` attribute —
     * the most stable selector on the site. The calendar initially shows the
     * current and next month; this method scrolls forward month-by-month
     * until the target date is visible, then clicks it.
     *
     * @param {import('@playwright/test').Page} page
     * @param {string} dateStr  - "YYYY-MM-DD"
     * @param {string} label    - Human label for logs, e.g. "Check-in"
     *
     * @throws {Error} if the date cell is not found within MAX_MONTHS_FORWARD
     */
    static async clickDate(page, dateStr, label) {
        const dateCell = page.locator(`[data-date="${dateStr}"]`).first();

        for (let month = 0; month < DatePickerHelper.MAX_MONTHS_FORWARD; month++) {

            // ── Is the target date visible in the current calendar view? ──
            const isVisible = await dateCell
                .isVisible({ timeout: 2000 })
                .catch(() => false);

            if (isVisible) {
                // Scroll into view to ensure clickability
                await dateCell.scrollIntoViewIfNeeded();
                await dateCell.click();
                console.log(`  *** ${label}: ${dateStr}`);
                await page.waitForTimeout(500);
                return;
            }

            // ── Not yet visible — try scrolling to the next month ─────────
            console.log(`  *** ${label} (${dateStr}) not in view — advancing month (${month + 1}/${DatePickerHelper.MAX_MONTHS_FORWARD})`);
            await DatePickerHelper.goToNextMonth(page);
        }

        // If we exhausted all attempts without finding the date, fail loudly
        throw new Error(
            `DatePickerHelper: could not find [data-date="${dateStr}"] (${label}) ` +
            `after scrolling ${DatePickerHelper.MAX_MONTHS_FORWARD} months forward.`
        );
    }

    // ────────────────────────────────────────────────────────────
    // PRIVATE HELPERS
    // ────────────────────────────────────────────────────────────

    /**
     * Click the "next month" arrow on the calendar.
     *
     * @param {import('@playwright/test').Page} page
     * @throws {Error} if the button is not found (calendar may be at its max)
     */
    static async goToNextMonth(page) {
        const nextBtn = page.locator(DatePickerHelper.NEXT_MONTH_BTN).first();

        const isClickable = await nextBtn
            .isVisible({ timeout: 2000 })
            .catch(() => false);

        if (!isClickable) {
            throw new Error(
                'DatePickerHelper: "next month" button not found or disabled. ' +
                'The target date may be beyond the calendar\'s allowed range.'
            );
        }

        await nextBtn.click();
        await page.waitForTimeout(400); // let the calendar re-render
    }
}