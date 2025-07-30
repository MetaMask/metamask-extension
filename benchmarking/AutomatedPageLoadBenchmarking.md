# Automated Page Load Speed Benchmarking for MetaMask Extension

## Problem Statement

The MetaMask extension team currently tracks page load performance through manual benchmarking using browser console scripts and existing CI pipeline metrics. However, this approach has several limitations:

1. **Manual Process**: Current benchmarking relies on running `benchmarking/ManualPageLoadBenchmarkingScript.js` as a browser snippet, which requires manual intervention and is not scalable
2. **Inconsistent Baselines**: Establishing reliable baseline metrics is challenging with manual processes
3. **Limited Integration**: While the CI pipeline includes UI startup metrics and bundle size tracking, there's no automated page load speed benchmarking
4. **No Regression Detection**: Performance regressions may go undetected until manual testing reveals issues

## Current Architecture Overview

### Existing Benchmarking Infrastructure

The MetaMask extension already has a sophisticated benchmarking pipeline:

1. **RPC Pipeline**: Well-documented communication flow between dApps, content scripts, and background processes
2. **CI Integration**: GitHub Actions workflows that run benchmarks on pull requests
3. **Metrics Collection**: Existing scripts that measure UI startup times and bundle sizes
4. **Bot Reporting**: `development/metamaskbot-build-announce.ts` automatically reports metrics on PRs

### Current Benchmarking Scripts

- **Manual Script**: `benchmarking/ManualPageLoadBenchmarkingScript.js` - Browser console snippet for manual testing
- **E2E Benchmark**: `test/e2e/benchmark.mjs` - Automated page load benchmarking using Selenium
- **User Actions**: `test/e2e/user-actions-benchmark.ts` - Benchmarking specific user interactions
- **CI Workflow**: `.github/workflows/run-benchmarks.yml` - Orchestrates benchmark execution

## Suggested Approaches for Automated Page Load Speed Benchmarking

### Approach 1: Enhanced Puppeteer-Based Solution (Recommended)

**Overview**: Extend the existing benchmarking infrastructure with Puppeteer for more reliable and consistent page load measurements.

**Advantages**:
- More reliable than Selenium for performance testing
- Better control over browser environment
- Native support for performance APIs
- Faster execution than current Selenium-based approach
- Better integration with modern web performance metrics

**Implementation Strategy**:

1. **Create Puppeteer Benchmark Runner**
   ```typescript
   // benchmarking/puppeteer-benchmark-runner.ts
   - Load extension in Puppeteer
   - Navigate to test pages
   - Collect performance metrics using Performance API
   - Measure extension-specific metrics (content script load time, background script initialization)
   ```

2. **Integration Points**:
   - Extend existing `run-benchmarks.yml` workflow
   - Add Puppeteer as an alternative to Selenium for performance tests
   - Maintain compatibility with existing metrics format

3. **Metrics to Collect**:
   - Standard Web Vitals (LCP, FID, CLS)
   - Extension-specific metrics (content script injection time, background script startup)
   - Network timing (TTFB, DOM processing time)
   - Memory usage during page load

### Approach 2: Playwright-Based Solution

**Overview**: Leverage Playwright for cross-browser performance testing with better automation capabilities.

**Advantages**:
- Cross-browser support (Chrome, Firefox, Safari)
- Built-in performance monitoring
- Better handling of modern web features
- More stable than Selenium

**Implementation Strategy**:
- Create Playwright test suite for performance benchmarking
- Integrate with existing CI pipeline
- Use Playwright's built-in performance APIs

### Approach 3: Hybrid Approach (Current + Puppeteer)

**Overview**: Keep existing Selenium-based benchmarks for E2E testing while adding Puppeteer specifically for performance benchmarking.

**Advantages**:
- Minimal disruption to existing workflow
- Leverage strengths of both tools
- Gradual migration path

## Baseline Establishment Strategies

### Current Approach Assessment

The current manual script approach has these characteristics:

**Strengths**:
- Direct measurement in real browser environment
- Captures actual user experience
- Simple to understand and debug

**Weaknesses**:
- Inconsistent execution environment
- Manual intervention required
- No historical tracking
- Limited statistical significance

### Recommended Baseline Strategy

#### 1. Automated Baseline Collection

**Implementation**:
- Run automated benchmarks on main/master branch daily
- Store results in time-series database or JSON files
- Calculate rolling averages and percentiles
- Establish confidence intervals for each metric

**Baseline Metrics**:
```json
{
  "baseline": {
    "uiStartup": {
      "mean": 1200,
      "p95": 1800,
      "p99": 2200,
      "confidence_interval": [1150, 1250]
    },
    "contentScriptLoad": {
      "mean": 150,
      "p95": 250,
      "p99": 350
    },
    "pageLoadTime": {
      "mean": 800,
      "p95": 1200,
      "p99": 1500
    }
  }
}
```

#### 2. Regression Detection

**Thresholds**:
- **Warning**: 10% degradation from baseline
- **Failure**: 20% degradation from baseline
- **Critical**: 50% degradation from baseline

**Implementation**:
- Compare PR benchmark results against baseline
- Generate alerts for significant regressions
- Block merges on critical regressions

#### 3. Statistical Significance

**Requirements**:
- Minimum 10 samples per benchmark
- Confidence level: 95%
- Account for variance in measurements

## Implementation Roadmap

### Phase 1: Foundation (Weeks 1-2)

1. **Set up Puppeteer infrastructure**
   - Create Puppeteer benchmark runner
   - Integrate with existing CI workflow
   - Establish baseline collection pipeline

2. **Define metrics and thresholds**
   - Standardize performance metrics
   - Set initial baseline thresholds
   - Create regression detection logic

### Phase 2: Integration (Weeks 3-4)

1. **CI Pipeline Integration**
   - Add Puppeteer benchmarks to PR workflow
   - Integrate with existing bot reporting
   - Set up artifact storage and retrieval

2. **Baseline Establishment**
   - Run baseline collection for 1-2 weeks
   - Establish statistical significance
   - Document baseline values

### Phase 3: Optimization (Weeks 5-6)

1. **Performance Optimization**
   - Optimize benchmark execution time
   - Implement parallel testing
   - Add caching for faster feedback

2. **Advanced Features**
   - Add memory usage tracking
   - Implement network throttling tests
   - Create performance regression alerts

## Technical Considerations

### Environment Consistency

**Requirements**:
- Consistent hardware specifications in CI
- Controlled network conditions
- Standardized browser versions
- Isolated testing environment

**Implementation**:
- Use GitHub Actions runners with consistent specs
- Implement network throttling for realistic conditions
- Pin browser versions in CI

### Data Storage and Analysis

**Storage Options**:
1. **GitHub Artifacts**: Current approach, good for PR feedback
2. **Time-series Database**: Better for historical analysis
3. **Cloud Storage**: Scalable for long-term data retention

**Recommended**: Hybrid approach
- GitHub artifacts for immediate PR feedback
- Cloud storage for historical analysis and baseline management

### Integration with Existing Tools

**Current Integration Points**:
- `metamaskbot-build-announce.ts` - PR reporting
- `run-benchmarks.yml` - CI workflow
- `benchmark.mjs` - E2E testing

**Proposed Enhancements**:
- Extend bot reporting with page load metrics
- Add performance regression warnings
- Include content script size tracking

## Success Metrics

### Quantitative Metrics

1. **Detection Rate**: Percentage of performance regressions caught before merge
2. **False Positive Rate**: Percentage of false regression alerts
3. **Feedback Time**: Time from PR creation to benchmark results
4. **Coverage**: Percentage of PRs with benchmark results

### Qualitative Metrics

1. **Developer Experience**: Ease of understanding benchmark results
2. **Maintenance Overhead**: Time spent maintaining benchmark infrastructure
3. **Actionability**: Quality of insights provided by benchmark results

## Risk Mitigation

### Technical Risks

1. **Flaky Tests**: Implement retry logic and statistical analysis
2. **Environment Drift**: Pin dependencies and use consistent environments
3. **Performance Overhead**: Optimize benchmark execution time

### Process Risks

1. **False Positives**: Implement confidence intervals and trend analysis
2. **Maintenance Burden**: Automate baseline updates and threshold adjustments
3. **Developer Resistance**: Provide clear, actionable feedback

## Conclusion

The recommended approach combines the reliability of Puppeteer with the existing CI infrastructure to create a robust, automated page load speed benchmarking system. This solution will:

1. **Automate** the currently manual benchmarking process
2. **Establish** reliable baselines through statistical analysis
3. **Integrate** seamlessly with existing CI/CD pipeline
4. **Provide** actionable feedback to developers
5. **Scale** with the growing complexity of the MetaMask extension

The implementation should prioritize reliability and developer experience while maintaining the flexibility to adapt to changing performance requirements.
