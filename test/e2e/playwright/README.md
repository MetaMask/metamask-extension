# Playwright E2E Testing Setup

## Overview

This directory contains Playwright end-to-end tests for MetaMask Extension. The tests are organized into different projects that run on both Chrome and Firefox browsers with comprehensive CI integration.

## Directory Structure

```
test/e2e/playwright/
├── global/
│   └── specs/
│       ├── about-metamask-ui-validation.spec.ts
│       └── protect-intrinsics.spec.ts
├── shared/
│   └── (shared utilities and page objects)
└── README.md (this file)
```

## Test Projects

The Playwright configuration includes multiple projects to ensure comprehensive browser coverage:

### Browser-Specific Projects
- **`chrome-global`**: Global/universal tests on Chrome
- **`firefox-global`**: Global/universal tests on Firefox

### Legacy Projects (for backward compatibility)
- **`global`**: Global tests (defaults to Firefox)

## Available Scripts

### Local Development
```bash
# Run all Playwright tests on Chrome
yarn test:e2e:pw:chrome

# Run all Playwright tests on Firefox
yarn test:e2e:pw:firefox

# Run all Playwright tests on both browsers
yarn test:e2e:pw:all

# Run legacy individual projects
yarn test:e2e:global  # Firefox global tests

# View test reports
yarn test:e2e:pw:report
```

### Advanced Usage
```bash
# Run specific project
yarn playwright test --project=chrome-global

# Run with UI mode (local development)
yarn playwright test --ui

# Generate code for new tests
yarn playwright codegen

# Update snapshots
yarn playwright test --update-snapshots
```

## CI/CD Integration

### Workflows

The Playwright tests are integrated into the CI/CD pipeline through two main workflows:

#### 1. `playwright-ci.yml` - Main CI Integration
- **Triggers**: PR changes to Playwright files, manual dispatch
- **Functionality**:
  - Builds the extension using `yarn build:test`
  - Downloads build artifacts if available
  - Runs comprehensive Playwright tests on both Chrome and Firefox
  - Posts test results as PR comments
  - Uploads test artifacts and reports

#### 2. `playwright-tests.yml` - Reusable Test Workflow
- **Type**: Reusable workflow called by other workflows
- **Functionality**:
  - Parallel execution of Chrome and Firefox tests
  - Artifact management and reporting
  - Comprehensive test result aggregation

### Artifact Management

The CI system manages several types of artifacts:

#### Test Artifacts
- **`playwright-chrome-results`**: Chrome test execution results and traces
- **`playwright-firefox-results`**: Firefox test execution results and traces
- **`playwright-combined-report`**: Aggregated results from both browsers

#### Report Types
- **HTML Reports**: Interactive test reports with screenshots and traces
- **JUnit XML**: For CI integration and test result parsing
- **JSON Reports**: Machine-readable test results
- **Screenshots & Videos**: Captured on test failures
- **Traces**: Detailed execution traces for debugging

## Test Execution Flow

### 1. Build Phase
```
Download Build Artifact (if available)
    ↓ (fallback if artifact missing)
Run yarn build:test
    ↓
Upload Build Artifact
```

### 2. Test Execution Phase
```
Chrome Tests (Parallel)          Firefox Tests (Parallel)
├── Install Chromium             ├── Install Firefox
├── Run chrome-swap tests        ├── Run firefox-swap tests
├── Run chrome-global tests      ├── Run firefox-global tests
├── Capture artifacts            ├── Capture artifacts
└── Upload results              └── Upload results
```

### 3. Reporting Phase
```
Aggregate Results
    ↓
Generate Combined Report
    ↓
Create GitHub Step Summary
    ↓
Post PR Comment (if applicable)
```

## Viewing Test Results

### 1. GitHub Actions UI
- Navigate to the "Actions" tab in GitHub
- Find your workflow run
- Click on individual jobs to see logs
- Download artifacts from the workflow summary

### 2. HTML Reports
- Download the `playwright-*-html-report` artifacts
- Extract and open `index.html` in a browser
- Interactive reports include:
  - Test results overview
  - Screenshots and videos
  - Execution traces
  - Error details

### 3. PR Comments
For pull requests, an automated comment provides:
- ✅/❌ Test status for each browser
- Links to detailed reports
- Workflow run information

### 4. GitHub Step Summary
Each workflow run includes a detailed summary with:
- Test execution status
- Quick statistics
- Direct links to artifacts
- Workflow metadata

## Configuration

### Playwright Config (`playwright.config.ts`)

Key configuration options:
- **Timeout**: 300 seconds per test
- **Retries**: 1 retry on CI, 0 locally
- **Workers**: 1 on CI, unlimited locally
- **Reporters**: HTML, JUnit, JSON, List
- **Artifacts**: Screenshots on failure, videos on failure, traces on retry

### Environment Variables
- `CI`: Enables CI-specific behaviors
- `PLAYWRIGHT_HTML_REPORT`: Custom report output location
- `DISPLAY`: X11 display for headless execution

## Writing Tests

### Test Structure
```typescript
import { test, expect } from '@playwright/test';

test.describe('Feature Name', () => {
  test('should perform expected behavior', async ({ page }) => {
    // Test implementation
    await page.goto('chrome-extension://...');
    await expect(page.locator('.element')).toBeVisible();
  });
});
```

### Best Practices
1. **Organize by feature**: Use the existing directory structure
2. **Use descriptive names**: Clear test and describe block names
3. **Page Object Pattern**: Utilize shared page objects for reusable elements
4. **Proper waits**: Use Playwright's auto-waiting features
5. **Clean test data**: Ensure tests don't depend on external state

### Test Categories
- **Global Tests**: Universal functionality (UI validation, security)
- **Swap Tests**: Trading and swap-specific functionality
- **Shared Utilities**: Common page objects and helpers

## Troubleshooting

### Common Issues

#### 1. Tests Timing Out
- Check if elements are properly loaded
- Verify correct selectors
- Increase timeout if necessary for slow operations

#### 2. Browser Installation Issues
```bash
# Reinstall browsers
yarn playwright install --with-deps
```

#### 3. Build Artifact Issues
- Ensure `yarn build:test` runs successfully locally
- Check if required build files are included in artifacts

#### 4. Report Generation Issues
- Verify output directories exist
- Check file permissions in CI environment

### Debugging

#### Local Debugging
```bash
# Run with headed browsers
yarn playwright test --headed

# Debug specific test
yarn playwright test --debug path/to/test.spec.ts

# Step through with UI
yarn playwright test --ui
```

#### CI Debugging
- Check workflow logs for specific error messages
- Download and examine test artifacts
- Review screenshots and videos of failures
- Analyze execution traces for detailed step-by-step debugging

## Contributing

When adding new tests:

1. Follow the existing directory structure
2. Add tests to appropriate project categories
3. Update this README if adding new features
4. Ensure tests work in both Chrome and Firefox (when applicable)
5. Verify CI workflows run successfully

## Related Documentation

- [Playwright Official Documentation](https://playwright.dev/)
- [MetaMask Extension E2E Testing Guide](../README.md)
- [GitHub Actions Workflow Documentation](.github/workflows/README.md)