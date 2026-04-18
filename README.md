# Booking.com End-to-End Test Automation Framework

## Tech Stack

### Core Automation & Testing

- **Playwright** - Modern cross-browser automation framework (Chromium, Firefox, WebKit)
- **Node.js** - JavaScript runtime for test execution
- **JavaScript (ES6+)** - Primary programming language with `@ts-check` for type safety

### Testing & Assertions

- **Playwright Built-in Assertions** - Native assertion library for reliable test validation
- **Page Object Model (POM)** - Design pattern for maintainable test structure

### Reporting & Analytics

- **Allure v3 (Awesome Report)** - Advanced test reporting with analytics dashboard
- **allure-playwright** - Playwright plugin for automatic artifact capture
- **Screenshots & Videos** - Automatic capture on test failures
- **Trace Diagnostics** - On-first-retry trace capture for debugging

### Environment & Configuration

- **dotenv** - Environment variable management for secure credentials
- **GitHub Actions** - CI/CD workflow integration (currently disabled)

### Project Structure

- **Page Classes** (`/page`) - Encapsulate locators and page interactions
- **Test Specs** (`/tests`) - Test scenarios using POM pattern
- **Test Data** (`/data`) - JSON-based test data for data-driven testing
- **Utilities** (`/utils`) - Helper functions and export utilities
- **Fixtures** (`/fixture`) - Playwright base fixtures and configurations

### Browser Support

- Chromium
- Firefox
- WebKit

### Key Features

✅ Advanced Tab Handling & Browser Context Navigation
✅ Dynamic Allure Metadata Integration
✅ Automatic Checkpoint Screenshots
✅ Strict JavaScript Typing with JSDoc
✅ Data-Driven Testing Support

---

For detailed project information, see [PROJECT.md](./PROJECT.md)
