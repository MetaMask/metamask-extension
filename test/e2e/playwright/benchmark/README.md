# MetaMask Playwright Page Load Benchmark

This directory contains the Playwright-based page load benchmark implementation for the MetaMask extension, following the strategy outlined in this [markdown](https://gist.github.com/ffmcgee725/2c4f67a5a3d6255ea985635510d19d47), created using [Playwright](https://playwright.dev/).

## Metrics Collected

- **Page Load Time**: Total time from navigation start to load event end
- **DOM Content Loaded**: Time to DOM content loaded event
- **First Paint**: Time to first paint
- **First Contentful Paint**: Time to first contentful paint
- **Largest Contentful Paint**: Time to largest contentful paint
- **Memory Usage**: JavaScript heap usage statistics

## Usage

If you run the tests for first time, you may need to install the browser dependency (Playwright will inform you in case you need):

```bash
yarn playwright install chromium
```

### Quick Start

```bash
# Run with default settings (10 browser loads, 10 page loads each)
yarn tsx test/e2e/playwright/benchmark/run-benchmark.ts

# Run with custom settings
yarn tsx test/e2e/playwright/benchmark/run-benchmark.ts --browser-loads=5 --page-loads=5
```

### Using Playwright Directly

```bash
# Run the benchmark test directly
yarn playwright test --project=benchmark

# Run with specific configuration
BENCHMARK_BROWSER_LOADS=5 BENCHMARK_PAGE_LOADS=5 yarn playwright test --project=benchmark
```

## Output

The benchmark generates a JSON file (`benchmark-results.json`) with the following structure:

```json
{
  "timestamp": "2024-01-01T00:00:00.000Z",
  "summary": [
    {
      "page": "https://metamask.github.io/test-dapp/",
      "samples": 100,
      "mean": {
        "pageLoadTime": 1200,
        "contentScriptLoadTime": 150,
        "backgroundScriptInitTime": 75
      },
      "p95": {
        "pageLoadTime": 1800,
        "contentScriptLoadTime": 250,
        "backgroundScriptInitTime": 120
      },
      "p99": {
        "pageLoadTime": 2200,
        "contentScriptLoadTime": 350,
        "backgroundScriptInitTime": 180
      },
      "min": { ... },
      "max": { ... },
      "standardDeviation": { ... }
    }
  ],
  "commit": "f111111e40\n",
  "rawResults": [
    {
      "page": "https://metamask.github.io/test-dapp/",
      "run": 0,
      "metrics": { ... },
      "timestamp": "2024-01-01T00:00:00.000Z"
    }
  ]
}
```

## Troubleshooting

### Common Issues

1. **Extension Build Failures**: Ensure all dependencies are installed and the build environment is properly configured
2. **Timeout Errors**: Increase the timeout in `playwright.config.ts` for the benchmark project
3. **Memory Issues**: Reduce the number of browser loads or page loads if running out of memory
4. **Network Issues**: Ensure the test pages are accessible from the test environment

### Debug Mode

To run with additional debugging:

```bash
DEBUG=pw:api yarn tsx test/e2e/playwright/benchmark/run-benchmark.ts
```

## Contact Wallet API-SDK team

If you encounter any problems while working on this spec, you can write into the Consensys Slack channel `#wallet-api-sdk`.
