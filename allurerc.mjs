import { defineConfig } from "allure";
import { env } from "node:process";

// ─── Charts shared between awesome report and dashboard ───────────────────
const charts = [
    {
        type: "currentStatus",
        title: "Current Status",
        statuses: ["passed", "failed", "broken", "skipped", "unknown"],
        metric: "passed",
    },
    {
        type: "testResultSeverities",
        title: "Results by Severity",
        levels: ["blocker", "critical", "normal", "minor", "trivial"],
        statuses: ["passed", "failed", "broken", "skipped", "unknown"],
        includeUnset: true,
    },
    {
        type: "statusDynamics",
        title: "Status Dynamics",
        statuses: ["passed", "failed", "broken", "skipped", "unknown"],
        limit: 20,
    },
    {
        type: "statusTransitions",
        title: "Status Transitions",
        limit: 20,
    },
    {
        type: "testBaseGrowthDynamics",
        title: "Test Base Growth",
        statuses: ["passed", "failed", "broken", "skipped", "unknown"],
        limit: 20,
    },
    {
        type: "coverageDiff",
        title: "Coverage Diff Map",
    },
    {
        type: "successRateDistribution",
        title: "Success Rate Distribution",
    },
    {
        type: "stabilityDistribution",
        title: "Stability by Feature",
        threshold: 90,
        skipStatuses: ["skipped", "unknown"],
        groupBy: "feature",
    },
    {
        type: "stabilityDistribution",
        title: "Stability by Epic",
        threshold: 90,
        skipStatuses: ["skipped", "unknown"],
        groupBy: "epic",
    },
    {
        type: "problemsDistribution",
        title: "Problems by Environment",
        by: "environment",
    },
    {
        type: "durations",
        title: "Duration Histogram",
        groupBy: "none",
    },
    {
        type: "durations",
        title: "Duration by Layer",
        groupBy: "layer",
    },
    {
        type: "durationDynamics",
        title: "Duration Dynamics",
        limit: 20,
    },
    {
        type: "statusAgePyramid",
        title: "Status Age Pyramid",
        limit: 20,
    },
    {
        type: "testingPyramid",
        title: "Testing Pyramid",
        // Must match values used in allure.label("layer", ...)
        layers: ["Smoke", "Integration", "e2e", "Regression", "Sanity"],
    },
];

export default defineConfig({
    // ─── Core ──────────────────────────────────────────────────────────────
    name: "Booking.com E2E Testing Report",
    output: "./allure-report",

    // Single JSONL file that accumulates run history — required for all trend charts.
    // Commit this file to version control or persist it in CI artifacts.
    historyPath: "./allure-history.jsonl",
    appendHistory: true,

    // ─── Known Issues ───────────────────────────────────────────────────────
    // Generate/update via: allure known-issue ./allure-results
    knownIssuesPath: "./allure/known.json",

    // ─── Build-time variables (shown at top of Overview tab) ───────────────
    // For runtime-generated values, dynamically populate this at runtime.
    variables: {
        "App Version": env.APP_VERSION ?? "Live",
        Branch: env.BRANCH_NAME ?? "main",
        "Build Number": env.BUILD_NUMBER ?? "Live 1.0.0",
        Environment: env.TEST_ENV ?? "Live",
        "Node Version": process.version,
    },

    // ─── defaultLabels — fallback labels for tests that don't set their own ─
    defaultLabels: {
        severity: "normal",
        owner: "Arun",
        layer: "e2e",
    },

    // ─── Environments ───────────────────────────────────────────────────────
    // Matcher reads the "env" label set from tests
    environments: {
        production: {
            matcher: ({ labels }) =>
                labels.some(
                    ({ name, value }) => name === "env" && value === "production",
                ),
            variables: { Server: env.PROD_URL ?? "https://www.booking.com" },
        },
    },

    // ─── Quality Gate ───────────────────────────────────────────────────────
    // Fails the process (non-zero exit) if thresholds are breached — useful in CI.
    qualityGate: {
        rules: [
            {
                maxFailures: 0, // zero tolerance for failures on main branch
                fastFail: false, // set true to abort report generation immediately
            },
        ],
    },

    // ─── Plugins ────────────────────────────────────────────────────────────
    plugins: {
        // Primary report — modern "Awesome" UI
        awesome: {
            options: {
                reportName: "Booking.com E2E Testing Report",
                singleFile: false,
                reportLanguage: "en",
                // Behavior-based tree in the Tests tab
                groupBy: ["epic", "feature", "story"],
                charts,
            },
        },

        // Dashboard — standalone charts-only page, great for CI summary screens
        dashboard: {
            options: {
                reportName: "Test Dashboard",
                singleFile: false,
                reportLanguage: "en",
                layout: charts,
            },
        },

        // CSV export — pipe into spreadsheets or other tools
        csv: {
            options: {
                fileName: "allure-results.csv",
            },
        },

        // Console log — fast text summary for terminal / CI log output
        log: {
            options: {
                groupBy: "none",
                // Only print failures to keep CI logs clean
                filter: ({ status }) => status === "failed" || status === "broken",
            },
        },
    },
});