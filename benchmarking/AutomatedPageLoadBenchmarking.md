# Automated Page Load Speed Benchmarking for MetaMask Extension

## Problem Statement

The MetaMask extension team currently tracks page load performance through manual benchmarking using browser console scripts and existing CI pipeline metrics. However, this approach has several limitations:

1. **Limited Integration**: While the CI pipeline includes UI startup metrics and bundle size tracking, there's no automated page load speed benchmarking
2. **No Regression Detection**: Performance regressions may go undetected until manual testing reveals issues

## Current Architecture Overview

### Existing Benchmarking Infrastructure

The MetaMask extension already has a sophisticated benchmarking pipeline:

1. **RPC Pipeline**: Well-documented communication flow between dApps, content scripts, and background processes
2. **CI Integration**: GitHub Actions workflows that run benchmarks on pull requests
3. **Metrics Collection**: Existing scripts that measure UI startup times and bundle sizes
4. **Bot Reporting**: `development/metamaskbot-build-announce.ts` [script](https://github.com/MetaMask/metamask-extension/blob/main/development/metamaskbot-build-announce.ts) automatically reports metrics on PRs

### Current Benchmarking Scripts

- **E2E Benchmark**: `test/e2e/benchmark.mjs` [script](https://github.com/MetaMask/metamask-extension/blob/main/test/e2e/benchmark.mjs) - Automated page load benchmarking using Selenium
- **User Actions**: `test/e2e/user-actions-benchmark.ts` [script](https://github.com/MetaMask/metamask-extension/blob/main/test/e2e/user-actions-benchmark.ts) - Benchmarking specific user interactions
- **CI Workflow**: `.github/workflows/run-benchmarks.yml` [markdown](https://github.com/MetaMask/metamask-extension/blob/main/.github/workflows/run-benchmarks.yml) - Orchestrates benchmark execution

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
   // test/e2e/puppeteer-benchmark-runner.ts
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

### Recommended Baseline Strategy

#### 1. Automated Baseline Collection

**Implementation**:
- Run automated benchmarks on main branch daily
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

### Phase 1: Foundation

1. **Set up Puppeteer infrastructure**
   - Create Puppeteer benchmark runner
   - Integrate with existing CI workflow
   - Establish baseline collection pipeline

2. **Define metrics and thresholds**
   - Standardize performance metrics
   - Set initial baseline thresholds
   - Create regression detection logic

### Phase 2: Integration

1. **CI Pipeline Integration**
   - Add Puppeteer benchmarks to PR workflow
   - Integrate with existing bot reporting
   - Set up artifact storage and retrieval

2. **Baseline Establishment**
   - Run baseline collection for 1-2 weeks
   - Establish statistical significance
   - Document baseline values

### Phase 3: Optimization

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

1. **Automate** the benchmarking process
2. **Establish** reliable baselines through statistical analysis
3. **Integrate** seamlessly with existing CI/CD pipeline
4. **Provide** actionable feedback to developers
5. **Scale** with the growing complexity of the MetaMask extension

### Implementation Strategy

Based on the analysis and requirements, the following implementation approach is recommended:

#### **Sample Size and Statistical Rigor**
- **100 total page loads per benchmark**: 10 runs × 10 page loads per run
- This large sample size provides high statistical confidence and reduces the impact of outliers
- Enables reliable detection of performance regressions with minimal false positives

#### **PR Integration Workflow**
1. **Benchmark Execution**: On each PR against main branch, run the 100-page-load benchmark
2. **Results Storage**: Push benchmark metrics into the existing commit JSON structure
3. **PR Feedback**: Display results in PR comments via the existing `metamaskbot-build-announce.ts` script
4. **Regression Detection**: Compare against baseline with generous thresholds to avoid blocking on minor fluctuations

#### **Main Branch Baseline Management**
1. **Commit Tracking**: When PR is merged to main, add a new key to the baseline JSON file
2. **Key Structure**: `{commit_hash}: {benchmark_results}`
3. **Historical Data**: Maintain rolling baseline using recent main branch commits
4. **Baseline Calculation**: Use statistical analysis of recent commits to establish performance expectations

#### **Visualization and Monitoring**
1. **Static HTML Dashboard**: Generate a static HTML file that fetches the baseline JSON
2. **Interactive Charts**: Create visualizations showing performance trends over time
3. **Regression Alerts**: Highlight significant performance changes
4. **Accessibility**: Make dashboard available via GitHub Pages or similar static hosting

#### **Threshold Strategy**
- **Short-term fluctuations**: Use generous thresholds to avoid blocking on minor variations
- **Significant regressions**: Gate only on changes that exceed reasonable performance degradation limits
- **Threshold determination**: Establish thresholds based on historical variance and business impact
- **Gradual tightening**: Start with conservative thresholds and adjust based on system stability

### Benefits of This Approach

1. **High Confidence**: Large sample size ensures reliable performance measurements
2. **Seamless Integration**: Builds on existing CI/CD infrastructure without major changes
3. **Historical Tracking**: Maintains performance history for trend analysis
4. **Developer-Friendly**: Provides immediate feedback without blocking development velocity
5. **Scalable**: Can accommodate additional metrics and test scenarios as needed

The implementation should prioritize reliability and developer experience while maintaining the flexibility to adapt to changing performance requirements. The generous thresholds and large sample sizes will ensure that the system catches real performance issues while avoiding false positives that could slow down development.
