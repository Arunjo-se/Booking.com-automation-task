# Booking.com End-to-End Test Automation Framework

This project is an advanced, fully-featured UI automation framework built with **Playwright**, utilizing the **Page Object Model (POM)** design pattern, and deeply integrated with **Allure v3** for rich, analytical test reporting and automatic artifact capture (Screenshots, Video, Traces).

## 1. Project Initialization

The project was scaffolded using the official Playwright initialization command:
```bash
npm init playwright@latest
```
*Options selected during setup:*
- JavaScript (No TypeScript wrapper, but `@ts-check` used for strict type enforcement)
- Added GitHub Actions workflow (default)
- Installed Playwright browsers (`npx playwright install`)

## 2. Dependencies & Configuration

After initializing Playwright, the following tooling was installed to power the reporting and environment configurations:

```bash
# Install dotenv for environment variable management
npm install dotenv

# Install Allure CLI globally (v3 Native)
npm install -g allure

# Install Allure Playwright Reporter plugin
npm install --save-dev allure-playwright
```

### Config Files Setup:
1. **`playwright.config.js`:** 
   - Configured to use both the standard HTML reporter and `allure-playwright`.
   - Tuned with specific retry mechanisms (`retries: 1`).
   - Automatically captures trace diagnostics (`trace: 'on-first-retry'`).
   - Automatically captures screenshots and videos on test failures.
2. **`allurerc.mjs`:** 
   - Uses the cutting-edge **Allure v3 (Awesome Report)** configuration.
   - Specifically configured to label the environment as `production` targeting `https://www.booking.com`.
   - Configured custom analytical charts for the dashboard.
3. **`.env`:** Used to store secure credentials and URLs dynamically.

## 3. Project Architecture (Page Object Model)

The framework is strictly divided by responsibility:

- `/tests`: Contains the suite-level test scripts (`resort.spec.js`, `hotel.spec.js`, `allProperty.spec.js`).
- `/page`: Contains the Page Classes encapsulating locators and actions (`homePage.js`, `HotelListPage.js`).
- `/data`: Contains structured JSON test data (`testData.json`) allowing data-driven tests without hardcoding variables into the specs.
- `/utils` & `/fixture`: Contains helper classes like `exportHelper.js` and base Playwright fixtures.
- `/output`: Contains the exported winner data.

## 4. Key Features & Implementation Details

### Strict Typing in JavaScript
Files contain `// @ts-check` combined with JSDoc annotations (e.g. `/** @type {HomePage} */`) to provide immediate IDE intellisense and strict compilation without requiring full TypeScript translation.

### Advanced Tab Handling & Browser Context Navigation
The `HotelListPage` gracefully intercepts listing URLs and spins up entirely pristine browser tabs using `context.newPage()` to securely extract detailed address information without relying on flaky popup-catching logic.

### Dynamic Allure Metadata Integration
Every test relies on a `beforeEach` hook to inject robust tracking metadata directly into the Allure report:
- `allure.epic('Property Search Engine')`
- `allure.feature()`
- `allure.story(Dynamic test data interpolation)`
- `allure.label('layer', 'e2e')`
- `allure.label('env', 'production')`

### Automatic Checkpoint Screenshots
Rather than duplicating `page.screenshot()` throughout the framework, the project utilizes a lightweight decorator method `stepWithScreenshot()` wrapping test actions to automatically append synchronized visual checkpoints perfectly bound to Allure Steps.

## 5. Execution Pipeline

Commands to run the framework are bound into the `package.json` scripts:

**1. Run the Tests:**
To run tests across browsers visually:
```bash
npx playwright test --headed
```

**2. Generate the Allure Report:**
Once results populate into the nested `allure-results` folder, process them into a static html portal:
```bash
npm run allure:generate
```
*(Runs underneath: `allure generate allure-results`)*

**3. Serve the "Awesome" Dashboard:**
To spin up a local host viewing the advanced Allure analytics and deeply embedded Video/Screenshot execution artifacts:
```bash
npm run allure:open
```
*(Runs underneath: `allure open allure-report`)*

**4. Clean previous runs:**
```bash
rm -r -fo allure-results allure-report
```
