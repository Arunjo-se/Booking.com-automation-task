import * as allure from "allure-js-commons";

export class HotelListPage {
    constructor(page) {
        this.page = page;

        this.propertyCards = page.locator('[data-testid="property-card"]');

        this.sortDropdown = page.locator('[data-testid="sorters-dropdown-trigger"]');

        const popularFiltersGroup = page.locator('fieldset', {
            has: page.locator('legend', { hasText: 'Popular filters' })
        });

        this.resortFilter = popularFiltersGroup.getByRole('checkbox', { name: /^Resorts/ });
        this.hotelFilter = popularFiltersGroup.getByRole('checkbox', { name: /^Hotels/ });
    }

    async waitForFirstResult() {
        console.log('&&& Waiting for results...');
        await this.propertyCards.first().waitFor({ state: 'visible', timeout: 30_000 });
    }

    async applySort(optionName) {
        console.log(`&&& Sorting results by: "${optionName}"...`);

        await this.sortDropdown.click();
        const option = this.page.getByRole('option', { name: optionName });
        await option.waitFor({ state: 'visible', timeout: 5000 });
        await option.click();

        await this.waitForFirstResult();
        await this.page.waitForTimeout(2000);
    }

    async applyResortFilter() {
        console.log('&&& Applying Resort filter...');
        const isVisible = await this.resortFilter.isVisible({ timeout: 5000 }).catch(() => false);

        if (isVisible) {
            await this.resortFilter.check();
        } else {
            console.log('&&& Resort checkbox not found, using search fallback...');
            const searchInput = this.page.locator('textarea[name="request"]');
            const submitBtn = this.page.locator('button:has-text("Find properties")');
            await searchInput.pressSequentially('resort', { delay: 100 });
            await submitBtn.click();
        }

        await this.waitForFirstResult();
        await this.page.waitForTimeout(2000);
    }

    async applyHotelFilter() {
        console.log('&&& Applying Hotel filter...');
        const isVisible = await this.hotelFilter.isVisible({ timeout: 5000 }).catch(() => false);

        if (isVisible) {
            await this.hotelFilter.check();
        } else {
            console.log('&&& Hotel checkbox not found, using search fallback...');
            const searchInput = this.page.locator('textarea[name="request"]');
            const submitBtn = this.page.locator('button:has-text("Find properties")');
            await searchInput.pressSequentially('hotel', { delay: 100 });
            await submitBtn.click();
        }

        await this.waitForFirstResult();
        await this.page.waitForTimeout(2000);
    }

    /**
     * Scrape the very first property card, then open its detail page
     * in a new tab to extract the precise address.
     *
     * @returns {Promise<HotelResult|null>}
     */
    async scrapeFirstCard() {
        console.log('&&& Extracting data for the top-ranked property...');

        const firstCard = this.propertyCards.first();
        await firstCard.waitFor({ state: 'visible', timeout: 15000 });

        const basicData = await this.extractCardData(firstCard);
        if (!basicData || !basicData.url) {
            throw new Error('Could not extract basic data or URL from the first card.');
        }

        const context = this.page.context();
        const detailPage = await context.newPage();

        try {
            await detailPage.goto(basicData.url, { waitUntil: 'domcontentloaded', timeout: 60000 });

            const pic = await detailPage.screenshot({ type: "png" });
            await allure.attachment("Winner Hotel Details Tab - Screenshot", pic, "image/png");

            const detailedAddress = await this.getDetailedAddress(detailPage);

            return {
                ...basicData,
                address: detailedAddress
            };
        } finally {
            await detailPage.close();
        }
    }

    /**
     * Extract data from a single property card.
     *
     * @param {import('@playwright/test').Locator} card
     * @returns {Promise<HotelResult|null>}
     */
    async extractCardData(card) {
        const nameEl = card.locator('[data-testid="title"]');
        const name = (await nameEl.textContent({ timeout: 5000 }))?.trim();
        if (!name) return null;
        const rating = await this.extractRating(card);
        const pricePerNight = await this.extractPrice(card);
        const city = await this.extractCity(card);
        const url = await this.extractUrl(card);

        if (!rating || !pricePerNight) return null;

        return {
            name,
            city,
            rating,
            pricePerNight,
            url,
        };
    }

    async extractRating(card) {
        const starRatingEl = card.locator('[data-testid="rating-stars"], [data-testid="rating-squares"], [aria-label*="out of 5"]').first();
        const starAria = await starRatingEl.getAttribute('aria-label').catch(() => null);
        if (starAria) {
            const match = starAria.match(/(\d+\.?\d*)/);
            if (match) return parseFloat(match[1]);
        }
        return 0;
    }

    async extractPrice(card) {
        const selectors = [
            '[data-testid="price-and-discounted-price"]',
            '[data-testid="priceColumn"] .fcab3ed991',
            '.bui-price-display__value',
        ];

        for (const sel of selectors) {
            const el = card.locator(sel).first();
            if (await el.count() > 0) {
                const text = (await el.textContent().catch(() => '')) || '';
                const cleaned = text.replace(/[₹,\s]/g, '').replace(/INR/gi, '');
                const match = cleaned.match(/(\d+)/);
                if (match) {
                    return parseInt(match[1]);
                }
            }
        }
        return 0;
    }

    async extractCity(card) {
        const selectors = [
            '[data-testid="address"] span',
            '[data-testid="address"]',
            '.a3392d02cc',
        ];

        for (const sel of selectors) {
            const el = card.locator(sel).first();
            if (await el.count() > 0) {
                let text = (await el.textContent().catch(() => ''))?.trim();
                if (text) {
                    text = text.split('Show on map')[0].trim();
                    if (text) return text;
                }
            }
        }
        return 'N/A';
    }

    async extractUrl(card) {
        const linkEl = card.locator('[data-testid="title-link"], a[href*="/hotel/"]').first();
        if (await linkEl.count() > 0) {
            const href = await linkEl.getAttribute('href');
            if (href) {
                return href.startsWith('http') ? href : `https://www.booking.com${href}`;
            }
        }
        return 'N/A';
    }

    /**
     * Navigate to a detail page and extract the precise address.
     * @param {import('@playwright/test').Page} detailPage
     */
    async getDetailedAddress(detailPage) {
        console.log('&&& Extracting detailed address from new tab...');
        try {
            const addressLocator = detailPage.locator('main button:has-text(","), [data-testid="address_button"]').first();
            await addressLocator.waitFor({ state: 'visible', timeout: 30000 });

            const address = await addressLocator.evaluate(el => {
                let fullText = el.innerText || '';
                let cleanText = fullText.split('\n')[0];
                return cleanText.split('Excellent location')[0].split('Show map')[0].trim();
            });

            if (!address || address.length < 5) throw new Error('Short address');
            console.log(`&&& Detailed address found: ${address}`);
            return address;
        } catch (err) {
            console.warn(`&&& Detailed address extraction failed: ${err.message}`);
            return 'N/A';
        }
    }
}

/**
 * @typedef {Object} HotelResult
 * @property {string} name
 * @property {string} city
 * @property {string} address
 * @property {number} rating
 * @property {number} pricePerNight
 * @property {string} url
 */

