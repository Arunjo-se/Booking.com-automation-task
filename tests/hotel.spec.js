// @ts-check
import { test, expect } from '../fixture/base.fixture.js';
import * as allure from "allure-js-commons";
import { HomePage } from '../page/homePage.js';
import { HotelListPage } from '../page/HotelListPage.js';
import searchConfig from '../data/testData.json';
import { exportWinnerData } from '../utils/exportHelper.js';

test.describe("Booking.com Hotel Search", () => {
    /** @type {HomePage} */
    let homePage;

    /** @type {HotelListPage} */
    let resultsPage;

    test.beforeEach(async ({ page }) => {
        homePage = new HomePage(page);
        resultsPage = new HotelListPage(page);

        await allure.epic('Property Search Engine');
        await allure.feature('Hotel Filtering high rating and low price');
        await allure.story(`Find Top Hotel in ${searchConfig.searchData.destination} with high rating and low price`);
        await allure.suite('Search Results');
        await allure.severity('critical');
        await allure.owner('Arun Jose');
        await allure.label('layer', 'e2e');
        await allure.label('env', 'production');
        await allure.tag('regression');
    });



    /**
     * Helper to wrap a block of code in an Allure step and append a screenshot automatically.
     * 
     * @param {string} name
     * @param {import('@playwright/test').Page} page
     * @param {() => Promise<any>} action
     */
    async function stepWithScreenshot(name, page, action) {
        return await allure.step(name, async () => {
            const result = await action();
            const pic = await page.screenshot({ type: "png" });
            await allure.attachment(`${name} - Screenshot`, pic, "image/png");
            return result;
        });
    }

    test('Booking.com Search and Scrape Top Result', async ({ page, browserName }, testInfo) => {
        await allure.tag(browserName);

        await stepWithScreenshot(`Submit search parameters [Browser: ${browserName}]`, page, async () => {
            await homePage.search(searchConfig.searchData);
        });
        await stepWithScreenshot("Sort results by rating and price", page, async () => {
            await resultsPage.applySort('Property rating and price');
            await page.waitForTimeout(2000);
        });

        await stepWithScreenshot("Apply the hotel filter", page, async () => {
            await resultsPage.applyHotelFilter();
            await page.waitForTimeout(2000);
        });

        const listingpageURL = page.url();

        const winner = await stepWithScreenshot("Scrape winner data and details", page, async () => {
            return await resultsPage.scrapeFirstCard();
        });

        if (!winner) {
            throw new Error('Failed to scrape the top property card.');
        }

        const checkIn = new Date(searchConfig.searchData.checkIn);
        const checkOut = new Date(searchConfig.searchData.checkOut);
        const nights = Math.round((checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60 * 24));

        const totalStayPrice = winner.pricePerNight;
        const pricePerNight = Math.round(totalStayPrice / nights);

        const resultLog = `  Target Criteria : Highest Property Rating → Lowest Price
  Target Rating   : ${winner.rating} out of 5
  Lowest Price    : ₹${pricePerNight.toLocaleString('en-IN')} (per night)
------------------------------------------------------------
  Hotel Name      : ${winner.name}
  City            : ${winner.city}
  Detailed Address: ${winner.address}
  Property Rating : ${winner.rating} out of 5
  Price per night : ₹${pricePerNight.toLocaleString('en-IN')} (INR)
  Total price for stay (${nights} nights): ₹${totalStayPrice.toLocaleString('en-IN')} (INR)
  Listing page URL: ${listingpageURL}
  Detail page URL : ${winner.url}`;

        console.log('\n' + '═'.repeat(60));
        console.log('  **  BEST HOTEL (Selection Results) **');
        console.log('═'.repeat(60));
        console.log(resultLog);
        console.log('═'.repeat(60) + '\n');

        const exportedData = {
            testFeature: "Hotel Filtering high rating and low price",
            testCase: testInfo.title,
            runDate: new Date().toISOString(),
            browser: browserName,
            targetCriteria: "Highest Property Rating → Lowest Price",
            hotelName: winner.name,
            rating: winner.rating,
            pricePerNight: pricePerNight,
            totalStayPrice: totalStayPrice,
            nights: nights,
            city: winner.city,
            detailedAddress: winner.address,
            listingPageURL: listingpageURL,
            detailPageURL: winner.url,
            rawWinnerData: winner
        };

        // Save locally
        const savedFilePath = exportWinnerData("Hotel", testInfo.title, exportedData);

        await allure.attachment("Result Summary", Buffer.from(resultLog, 'utf8'), "text/plain");
        await allure.attachment("Exported Winner JSON File", JSON.stringify(exportedData, null, 2), "application/json");

        expect(winner.name).toBeDefined();
        expect(winner.address).not.toBe('N/A');
    });
});
