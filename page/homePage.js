import { DatePickerHelper } from '../utils/DatePickerHelper.js';

export class HomePage {

    /**
     * @param {import('@playwright/test').Page} page
     */
    constructor(page) {
        this.page = page;

        this.cookieAcceptBtn = page.locator(
            '#onetrust-accept-btn-handler, ' +
            'button[data-gdpr-consent-accept], ' +
            'button:has-text("Accept"), ' +
            'button:has-text("I accept")'
        ).first();

        this.signInDismissBtn = page.locator(
            'button[aria-label="Dismiss sign-in info."], ' +
            'button:has-text("Continue as guest"), ' +
            'button:has-text("Sign in later")'
        ).first();

        this.destinationInput = page.locator(
            '[data-testid="destination-container"] input[name="ss"], ' +
            'input[name="ss"], ' +
            '[placeholder*="Where are you going"]'
        ).first();

        this.autocompleteList = page.locator(
            '[data-testid="autocomplete-results-container"], ' +
            'ul[role="listbox"]'
        ).first();

        this.firstAutocompleteResult = page.locator(
            '[data-testid="autocomplete-result-item"], ' +
            '[role="option"]'
        ).first();

        this.datePickerTrigger = page.locator(
            '[data-testid="searchbox-dates-container"], ' +
            '[data-testid="date-display-field-start"]'
        ).first();

        this.occupancyTrigger = page.locator(
            '[data-testid="occupancy-config"], ' +
            '[data-testid="searchbox-form"] [data-testid*="occupancy"]'
        ).first();
        this.adultsIncreaseBtn = page.locator(
            '[data-testid="occupancy-popup"] [data-testid="occupancy-adults-increase-button"], ' +
            '[class*="occupancy"] button[aria-label*="increase"]:near(:text("Adults"))'
        ).first();

        this.adultsDecreaseBtn = page.locator(
            '[data-testid="occupancy-popup"] [data-testid="occupancy-adults-decrease-button"], ' +
            '[class*="occupancy"] button[aria-label*="decrease"]:near(:text("Adults"))'
        ).first();

        this.adultsCount = page.locator(
            '[data-testid="occupancy-adults-value"], ' +
            '[class*="occupancy"] [aria-label*="Adults"] + span, ' +
            'span[data-testid*="adults-value"]'
        ).first();

        this.searchBtn = page.locator(
            '[data-testid="searchbox-form-submit"], ' +
            'button[type="submit"]:has-text("Search")'
        ).first();
    }

    async goto() {
        console.log('*** Navigating to Booking.com homepage...');
        await this.page.goto('/', { waitUntil: 'domcontentloaded' });
        await this.dismissOverlays();
        console.log('*** Homepage ready');
    }

    async dismissOverlays() {
        await this.page.waitForTimeout(2000);
        await this.dismissCookieConsent();
        await this.dismissSignInModal();
    }

    async dismissCookieConsent() {
        try {
            await this.cookieAcceptBtn.waitFor({ state: 'visible', timeout: 3000 });
            await this.cookieAcceptBtn.click();
            console.log('*** Cookie consent accepted');
            await this.page.waitForTimeout(500);
        } catch (e) {
            console.log('*** Cookie banner not found (skipping)');
        }
    }

    async dismissSignInModal() {
        try {
            await this.signInDismissBtn.waitFor({ state: 'visible', timeout: 5000 });
            await this.signInDismissBtn.click();
            console.log('*** Sign-in modal dismissed');
            await this.page.waitForTimeout(500);
        } catch (e) {
            await this.page.keyboard.press('Escape');
            console.log('*** Sign-in modal not detected explicitly (sent Escape)');
        }
    }

    async enterDestination(destination) {
        console.log(`*** Entering destination: "${destination}"`);

        await this.destinationInput.click();
        await this.destinationInput.clear();
        await this.destinationInput.pressSequentially(destination, { delay: 80 });

        await this.autocompleteList
            .waitFor({ state: 'visible', timeout: 10_000 })
            .catch(() => {
                console.warn('*** Autocomplete list did not appear — proceeding with typed value');
            });

        const suggestions = await this.firstAutocompleteResult.locator('xpath=following-sibling::* | self::*').all();
        let targetSuggestion = suggestions[0];

        for (const s of suggestions) {
            const text = await s.textContent().catch(() => '');
            if (text?.toLowerCase().includes('properties') || text?.toLowerCase().includes('hotels')) {
                targetSuggestion = s;
                break;
            }
        }

        if (targetSuggestion) {
            const suggestionText = await targetSuggestion.textContent();
            await targetSuggestion.click();
            console.log(`*** Selected: "${suggestionText?.trim()}"`);
        } else {
            await this.destinationInput.press('Enter');
            console.log('*** Destination accepted via Enter key');
        }

        await this.page.waitForTimeout(500);
    }



    /**
     * Select check-in and check-out dates using the calendar.
     * Booking.com calendar cells have a stable `data-date="YYYY-MM-DD"` attribute.
     *
     * @param {string} checkIn  - "YYYY-MM-DD"
     * @param {string} checkOut - "YYYY-MM-DD"
     */
    async selectDates(checkIn, checkOut) {
        console.log(`*** Setting dates: ${checkIn} → ${checkOut}`);

        const calendarPanel = this.page.locator(
            '[data-testid="searchbox-datepicker-calendar"], ' +
            '.bui-calendar'
        ).first();

        const isAlreadyOpen = await calendarPanel
            .isVisible({ timeout: 1000 })
            .catch(() => false);

        if (!isAlreadyOpen) {
            await this.datePickerTrigger.click();
        }
        await this.page.waitForTimeout(800);

        await DatePickerHelper.clickDate(this.page, checkIn, 'Check-in');
        await DatePickerHelper.clickDate(this.page, checkOut, 'Check-out');

        console.log(`*** Dates set: ${checkIn} → ${checkOut}`);
    }



    /**
     * Set adults count and add children with their individual ages.
     *
     * @param {number}   adults    - e.g. 2
     * @param {number[]} children  - array of child ages, e.g. [5, 3]
     */
    async setGuests(adults, children) {
        console.log(`*** Setting guests: ${adults} adults, ${children.length} children (ages: ${children.join(', ')})`);
        await this.occupancyTrigger.click();
        await this.page.waitForTimeout(800);

        await this.setAdults(adults);

        for (let i = 0; i < children.length; i++) {
            await this.addChild(i, children[i]);
        }
        await this.closeOccupancyPopup();

        console.log('*** Guests set');
    }

    async setAdults(targetAdults) {
        const currentText = await this.adultsCount.textContent({ timeout: 5000 }).catch(() => '2');
        let current = parseInt(currentText?.trim() || '2', 10);

        console.log(`*** Adults: current=${current}, target=${targetAdults}`);

        const diff = targetAdults - current;

        if (diff > 0) {
            for (let i = 0; i < diff; i++) {
                await this.adultsIncreaseBtn.click();
                await this.page.waitForTimeout(200);
            }
        } else if (diff < 0) {
            for (let i = 0; i < Math.abs(diff); i++) {
                await this.adultsDecreaseBtn.click();
                await this.page.waitForTimeout(200);
            }
        }
    }

    async addChild(childIndex, age) {
        console.log(`*** Adding child ${childIndex + 1}: age ${age}`);

        const childrenRow = this.page
            .getByText('Children', { exact: true })
            .locator('xpath=ancestor::*[.//button][1]');
        const increaseBtn = childrenRow.locator('button').last();

        await increaseBtn.click({ timeout: 5000 });
        await this.page.waitForTimeout(600);

        const ageSelects = this.page.locator(
            '[data-testid="occupancy-popup"] select[name*="age"], ' +
            '[data-testid="kids-ages-select"], ' +
            'select[id*="group_children_age"], ' +
            '.occupancy-popup select'
        );

        const selectCount = await ageSelects.count();

        if (selectCount === 0) {
            console.warn(`*** Age dropdown not found for child ${childIndex + 1} — skipping age selection`);
            return;
        }

        const thisSelect = ageSelects.nth(selectCount - 1);

        await thisSelect.selectOption({ value: String(age) });
        console.log(`*** Child ${childIndex + 1} age set to: ${age}`);

        await this.page.waitForTimeout(300);
    }

    async closeOccupancyPopup() {
        const doneBtn = this.page.locator(
            '[data-testid="occupancy-popup-done-cta"], ' +
            'button:has-text("Done"), ' +
            'button:has-text("Apply")'
        ).first();

        const hasDoneBtn = await doneBtn.isVisible({ timeout: 2000 }).catch(() => false);

        if (hasDoneBtn) {
            await doneBtn.click();
        } else {
            await this.page.keyboard.press('Escape');
        }

        await this.page.waitForTimeout(500);
    }

    async submitSearch() {
        console.log('*** Submitting search...');

        await this.searchBtn.click();
        await this.page.waitForURL('**/searchresults**', { timeout: 30_000 });

        console.log('*** Search submitted — on results page');
    }


    /**
     * Full search flow: open homepage → fill form → submit.
     *
     * @param {object}   params
     * @param {string}   params.destination  - e.g. "Goa, India"
     * @param {string}   params.checkIn      - "YYYY-MM-DD"
     * @param {string}   params.checkOut     - "YYYY-MM-DD"
     * @param {number}   params.adults       - e.g. 2
     * @param {number[]} params.children     - child ages, e.g. [5, 3]
     */
    async search({ destination, checkIn, checkOut, adults, children }) {
        await this.goto();
        await this.enterDestination(destination);
        await this.selectDates(checkIn, checkOut);
        await this.setGuests(adults, children);
        await this.submitSearch();
    }
}