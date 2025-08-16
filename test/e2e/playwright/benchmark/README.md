# MetaMask Page Load Benchmark

This directory contains the Playwright-based page load benchmark implementation for the MetaMask extension, following the strategy outlined in `benchmarking/AutomatedPageLoadBenchmarking.md`.

## Overview

The benchmark measures page load performance with the MetaMask extension loaded, collecting both standard web performance metrics and extension-specific metrics.

## Features

- **Extension Integration**: Automatically builds and loads the MetaMask extension
- **Comprehensive Metrics**: Measures standard web vitals and extension-specific timing
- **Statistical Analysis**: Provides mean, percentiles (p95, p99), min/max, and standard deviation
- **Configurable Sampling**: Adjustable number of browser loads and page loads per browser
- **JSON Output**: Saves detailed results for further analysis

## Metrics Collected

### Standard Web Performance

- **Page Load Time**: Total time from navigation start to load event end
- **DOM Content Loaded**: Time to DOM content loaded event
- **First Paint**: Time to first paint
- **First Contentful Paint**: Time to first contentful paint
- **Largest Contentful Paint**: Time to largest contentful paint
- **Memory Usage**: JavaScript heap usage statistics

### Extension-Specific Metrics

- **Content Script Load Time**: Time for MetaMask content script to be available
- **Background Script Init Time**: Time for background script initialization
- **Total Extension Load Time**: Overall extension loading overhead

## Usage

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

### Environment Variables

- `BENCHMARK_BROWSER_LOADS`: Number of browser instances to test (default: 10)
- `BENCHMARK_PAGE_LOADS`: Number of page loads per browser (default: 10)

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

## Implementation Details

### Extension Loading

The benchmark automatically:

1. Builds the MetaMask extension using `yarn build:test`
2. Launches Chrome with the extension loaded
3. Waits for the extension to be fully initialized
4. Measures performance with the extension active

### Performance Measurement

- Uses the Performance API to collect navigation timing
- Monitors paint events and largest contentful paint
- Measures extension-specific timing through custom instrumentation
- Collects memory usage statistics when available

### Statistical Analysis

- Calculates comprehensive statistics for each metric
- Provides percentile analysis (p95, p99) for outlier detection
- Includes standard deviation for variance analysis
- Groups results by test page for comparison

## Configuration

### Test Pages

Currently configured to test:

- `https://metamask.github.io/test-dapp/`

Additional test pages can be added by modifying the `testUrls` array in `page-load-benchmark.spec.ts`.

### Browser Configuration

The benchmark uses Chrome with the following optimizations:

- Disabled background throttling
- Disabled renderer backgrounding
- Disabled IPC flooding protection
- Consistent viewport and user agent

## Integration with CI

The benchmark is designed to integrate with the existing CI pipeline:

1. **Baseline Collection**: Run on main branch to establish performance baselines
2. **PR Testing**: Run on pull requests to detect regressions
3. **Artifact Storage**: Results are saved as JSON for further analysis
4. **Reporting**: Can be integrated with existing bot reporting

## Future Enhancements

- **Network Throttling**: Add support for testing under different network conditions
- **Memory Tracking**: Enhanced memory usage monitoring
- **Cross-Browser Testing**: Extend to Firefox and Safari
- **Regression Detection**: Automated comparison against baselines
- **Dashboard**: Web-based visualization of results
- **Alerting**: Notifications for performance regressions

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

## Contributing

When modifying the benchmark:

1. Follow the existing code style and patterns
2. Add appropriate error handling and logging
3. Update this README for any new features
4. Test with different configurations to ensure reliability
5. Consider the impact on CI execution time
