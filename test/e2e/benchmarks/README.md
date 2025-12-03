# MetaMask E2E Benchmarks

This directory contains benchmark implementations for measuring MetaMask extension performance.

## Benchmark Suites

### Page Load Benchmark (`benchmark.ts`)

Measures page load performance metrics using the standard and power user personas.

**Metrics Collected:**
- **UI Startup**: Time to UI startup
- **Load**: Navigation load event end time
- **DOM Content Loaded**: DOM content loaded event end time
- **DOM Interactive**: DOM interactive time
- **First Paint**: Time to first paint
- **Background Connect**: Background connection time
- **First React Render**: First React render time
- **Get State**: Time to get state
- **Initial Actions**: Initial actions time
- **Load Scripts**: Script loading time
- **Setup Store**: Store setup time
- **Network Requests**: Number of network requests

**Usage:**
```bash
# Run with default settings (power user, 10 browser loads, 10 page loads)
tsx test/e2e/benchmarks/benchmark.ts --persona powerUser

# Run with custom settings
tsx test/e2e/benchmarks/benchmark.ts \
  --persona powerUser \
  --pages HOME \
  --browserLoads 5 \
  --pageLoads 5 \
  --out results.json
```

**React Profiler Integration:**
The benchmark uses React's built-in `Profiler` component (enabled in non-production builds) to collect accurate render metrics. The Profiler tracks:
- Component render counts by component ID
- Actual render duration (time spent rendering)
- Base duration (time without memoization)
- Render phases (mount, update)
- Commit timestamps

This provides more accurate metrics than alternative methods and directly measures React Compiler's memoization effectiveness.

### React Compiler Performance Benchmark (`react-compiler-benchmark.ts`)

Measures React Compiler performance improvements across critical user flows. This benchmark uses the power user persona to stress test the application and highlight performance improvements from React Compiler memoization.

**Metrics Collected:**
- **Standard Metrics**: All metrics from page load benchmark
- **INP (Interaction to Next Paint)**: 75th percentile of interaction latencies
- **INP Count**: Number of interactions measured
- **Render Count**: Total number of React component renders (from React Profiler)
- **Render Time**: Total time spent rendering (ms)
- **Average Render Time**: Average time per render (ms)
- **Interaction Latency**: Time from user interaction to visual update
- **Component Render Counts**: Render counts per component (from React Profiler)
- **FCP (First Contentful Paint)**: Time to first contentful paint (ms)
- **LCP (Largest Contentful Paint)**: Time to largest contentful paint (ms)
- **TTI (Time to Interactive)**: Time until page becomes interactive (ms)
- **TBT (Total Blocking Time)**: Total time the main thread was blocked (ms)
- **CLS (Cumulative Layout Shift)**: Visual stability metric
- **FID (First Input Delay)**: Delay before first user interaction (ms)

**Power User Persona:**
The React Compiler benchmark uses a power user persona with:
- 30 accounts
- 40 confirmed transactions
- 40 contacts
- ERC20 tokens enabled
- Multiple networks
- 20 NFTs
- Preferences configured
- 15 unread notifications

**Usage:**
```bash
# Run all flows with default settings (5 browser loads, 5 iterations each)
tsx test/e2e/benchmarks/react-compiler-benchmark.ts

# Run specific flows
tsx test/e2e/benchmarks/react-compiler-benchmark.ts \
  --flows tab-switching account-switching tokens-list-scrolling \
  --browserLoads 3 \
  --iterations 3 \
  --out react-compiler-results.json

# Run with retries
tsx test/e2e/benchmarks/react-compiler-benchmark.ts \
  --retries 2 \
  --out results.json
```

**React Profiler Integration:**
The benchmark uses React's built-in `Profiler` component (enabled in non-production builds via `ui/index.js`) to collect accurate render metrics. The Profiler tracks:
- Component render counts by component ID
- Actual render duration (time spent rendering)
- Base duration (time without memoization)
- Render phases (mount, update)
- Commit timestamps

This provides more accurate metrics than alternative methods and directly measures React Compiler's memoization effectiveness.

**Output:**
Results are saved incrementally to the specified JSON file as each flow completes. The output includes statistical analysis (mean, min, max, std dev, p75, p95) for all collected metrics.

**Available Flows:**
- O`tab-switching` - Tests switching between different tabs in the UI
- O`account-switching` - Tests switching between different accounts
- O`network-switching` - Tests switching between different networks
- X`network-adding` - Tests the network adding flow
- O`import-srp` - Tests onboarding flow and app load time when importing SRP
- O`token-search` - Tests token search functionality in asset picker
- X`token-send` - Tests token send flow performance, measuring delays to access Send page and Next button clicks
- O`tokens-list-scrolling` - Tests scrolling through the tokens list
- O`nft-list-scrolling` - Tests scrolling through the NFT list

### Benchmark Comparison Tool (`compare-benchmark-results.ts`)

Compares two benchmark result files (before/after) and provides detailed analysis of performance changes, including UX and business impact assessment.

**Features:**
- Calculates percentage changes for each metric
- Determines improvement direction (better/worse/neutral)
- Assesses impact level (high/medium/low) based on thresholds
- Generates explanations for metric changes
- Provides UX/business impact analysis
- Outputs actionable recommendations

**Usage:**
```bash
# Compare two benchmark results (text format)
tsx test/e2e/benchmarks/compare-benchmark-results.ts \
  --before before-results.json \
  --after after-results.json \
  --out comparison-report.txt \
  --format text

# Compare and output JSON format
tsx test/e2e/benchmarks/compare-benchmark-results.ts \
  --before before-results.json \
  --after after-results.json \
  --out comparison-report.json \
  --format json
```

**Output Format:**
The comparison report includes:
- Overall summary of improvements and regressions
- Key findings (top 10 significant changes)
- Flow-by-flow analysis with:
  - Significant metric changes
  - Explanations for each change
  - Impact assessment
  - Recommendations

**Impact Thresholds:**
- **High Impact**: Changes that significantly affect user experience (>20% for render metrics, >50ms for time metrics)
- **Medium Impact**: Noticeable changes (>10% for render metrics, >25ms for time metrics)
- **Low Impact**: Minor changes (<10% for render metrics, <25ms for time metrics)

## Output Format

Both benchmarks generate JSON files with statistical summaries:

```json
{
  "powerUserTabSwitching": {
    "mean": {
      "inp": 150,
      "renderCount": 45,
      "renderTime": 1200,
      "averageRenderTime": 26.67,
      "interactionLatency": 300,
      "fcp": 1200,
      "tbt": 150
    },
    "min": { ... },
    "max": { ... },
    "stdDev": { ... },
    "p75": { ... },
    "p95": { ... }
  }
}
```

## Requirements

- Extension must be built: `yarn build:test`
- Power user persona requires `WITH_STATE` environment variable (automatically set)
- Network mocking may be required for some flows

## Troubleshooting

### Common Issues

1. **Extension Build Failures**: Ensure all dependencies are installed and the build environment is properly configured
2. **Timeout Errors**: Increase delays or reduce iterations if tests timeout
3. **Memory Issues**: Reduce the number of browser loads or iterations if running out of memory
4. **Network Issues**: Ensure test networks are properly configured

### Debug Mode

To run with additional debugging:
```bash
DEBUG=* tsx test/e2e/benchmarks/react-compiler-benchmark.ts
```

## Implementation Details

The React Compiler benchmark:
- Uses React Profiler component (from `ui/index.js`) to track component renders accurately
- Collects Web Vitals metrics (FCP, LCP, TBT, CLS) from Performance API
- Tracks INP (Interaction to Next Paint) for user interaction responsiveness
- Collects metrics after each flow execution
- Calculates statistical summaries (mean, min, max, std dev, percentiles)
- Saves results incrementally to JSON file as flows complete

The benchmark infrastructure:
- Uses Selenium WebDriver with custom Driver wrapper
- Leverages existing page objects and fixtures
- Supports power user persona via `generateWalletState`
- Handles errors gracefully and continues with remaining iterations

