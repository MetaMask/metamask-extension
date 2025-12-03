# React Compiler Benchmark Comparison Report

**Generated:** 2025-12-02T19:49:51.724Z

| | Baseline | Compiler |
|---|---|---|
| **File** | benchmark-baseline-webpack-232-003.json | benchmark-compiler-webpack-232-003.json |
| **Duration** | 1h 34m 49s | 52m 57s |
| **Flows** | 9/9 | 9/9 |

---

## Executive Summary

### ⚠️ Data Quality Warnings

**7 of 82 metrics have unreliable data** (high variance or insufficient samples).

Key issues:
  • Power User: Tab Switching: Baseline only has 3 iterations
  • Power User: Network Adding: Compiler only has 3 iterations
  • Power User: Import Srp: Baseline only has 2 iterations
  • Power User: Import Srp: Compiler only has 2 iterations
  • Power User: Token Search: Baseline only has 3 iterations
  • ... and 3 more warnings

**Flow Reliability:**
| Status | Count | Flows |
|--------|-------|-------|
| ✅ Reliable | 4 | Tab Switching, Account Switching, Import Srp, Nft List Scrolling |
| ⚠️ Partial | 5 | Network Switching, Network Adding, Token Search, Token Send, Tokens List Scrolling |

### Overall Assessment

✅ **NET POSITIVE**: Significantly more improvements than regressions.

### Statistics Overview (Reliable Data Only)

| Category | Count | Percentage |
|----------|-------|------------|
| Improvements | 33 | 44.0% |
| Regressions | 9 | 12.0% |
| Neutral | 33 | 44.0% |
| **Reliable Metrics** | 75 | - |
| ~~Unreliable (excluded)~~ | 7 | - |

### Performance by Category (Reliable Data)

| Category | Avg Change | Interpretation |
|----------|------------|----------------|
| React Rendering | -9.7% | ✅ 9.7% better |
| Web Vitals (INP/FCP/TBT) | +374.2% | ⚠️ 374.2% worse |
| Network Requests | 0.0% | ➖ No significant change |
| Interaction Latency | -0.2% | ➖ No significant change |

### Key Observations

**Top Improvements (Statistically Significant):**
  • Power User: Token Search: tbt improved by 100.0% (39ms → 0ms) ⚠️ CV: 47%/0%
  • Power User: Token Search: renderTime improved by 33.1% (158ms → 106ms)
  • Power User: Token Search: averageRenderTime improved by 32.2% (4.74 → 3.21)
  • Power User: Network Adding: renderTime improved by 14.4% (673ms → 576ms)
  • Power User: Token Send: renderTime improved by 13.6% (124ms → 107ms)

**Areas Needing Attention:**
  • Power User: Network Adding: inp regressed by 7364.3% (24ms → 1.75s) (may be noise)
  • Power User: Import Srp: fcp regressed by 20.4% (690ms → 830ms) (may be noise)
  • Power User: Import Srp: interactionLatency regressed by 8.5% (10.01s → 10.86s) (statistically significant)
  • Power User: Network Switching: fcp regressed by 3.6% (268ms → 278ms) (may be noise)
  • Power User: Network Adding: fcp regressed by 3.0% (376ms → 388ms) (may be noise)

### Statistical Notes

- Results exclude metrics with CV > 50% (unreliable data)
- "Statistically significant" uses Welch's t-test at α=0.05
- Metrics marked "partial" have high variance in one dataset (CV 30-50%)
- Consider running more iterations for flows with data quality warnings


---

## 📊 Data Overview

Quick reference table showing all measurements with expected value assessments.

### Tab Switching ✅

| Metric | Baseline | Rating | Compiler | Rating | Change | Sig? |
|--------|----------|--------|----------|--------|--------|------|
| numNetworkReqs | 0 | 🟢 | 54.50 | 🟠 | → 0.0% | ✓ |
| inp | 223ms | 🟡 | 226ms | 🟡 | ↑ +1.3% | — |
| inpCount | 8 | — | 8 | — | → 0.0% | — |
| renderCount | 542.33 | 🟡 | 541.83 | 🟡 | → -0.1% | — |
| renderTime | 899ms | 🟠 | 730ms | 🟠 | ↓ 18.9% | — |
| averageRenderTime | 1.66 | 🟢 | 1.35 | 🟢 | ↓ 18.7% | — |
| interactionLatency | 3.49s | 🟡 | 3.22s | 🟡 | ↓ 7.8% | — |
| fcp | 333ms | 🟢 | 293ms | 🟢 | ↓ 12.0% | — |
| tbt | 556ms | 🟡 | 431ms | 🟡 | ↓ 22.5% | — |

### Account Switching ✅

| Metric | Baseline | Rating | Compiler | Rating | Change | Sig? |
|--------|----------|--------|----------|--------|--------|------|
| numNetworkReqs | 0 | 🟢 | 233.50 | 🔴 | → 0.0% | ✓ |
| inp | 39ms | 🟢 | 35ms | 🟢 | ↓ 10.6% | — |
| inpCount | 6 | — | 6 | — | → 0.0% | — |
| renderCount | 256.17 | 🟠 | 254.80 | 🟠 | → -0.5% | — |
| renderTime | 310ms | 🟡 | 294ms | 🟡 | ↓ 5.1% | — |
| averageRenderTime | 1.21 | 🟢 | 1.14 | 🟢 | ↓ 5.9% | — |
| interactionLatency | 5.11s | 🟡 | 5.05s | 🟡 | ↓ 1.2% | — |
| fcp | 169ms | 🟢 | 156ms | 🟢 | ↓ 7.9% | — |
| tbt | 21ms | 🟢 | 17ms | 🟢 | ↓ 20.6% | — |

### Network Switching ⚠️

| Metric | Baseline | Rating | Compiler | Rating | Change | Sig? |
|--------|----------|--------|----------|--------|--------|------|
| numNetworkReqs | 0 | 🟢 | 187.67 | 🔴 | → 0.0% | ✓ |
| inp | 5ms | 🟢 | 9ms | 🟢 | ↑ +79.3% | ❌ |
| inpCount | 0.83 | — | 2 | — | → 140.0% | ❌ |
| renderCount | 20.67 | 🟢 | 21.20 | 🟢 | ↑ +2.6% | — |
| renderTime | 88ms | 🟢 | 87ms | 🟢 | ↓ 1.2% | — |
| averageRenderTime | 4.16 | 🟡 | 3.98 | 🟡 | ↓ 4.3% | — |
| fcp | 268ms | 🟢 | 278ms | 🟢 | ↑ +3.6% | — |
| tbt | 5ms | 🟢 | 6ms | 🟢 | ↑ +18.5% | ❌ |

> ⚠️ **Data Quality Note:** Some metrics have high variance

### Network Adding ⚠️

| Metric | Baseline | Rating | Compiler | Rating | Change | Sig? |
|--------|----------|--------|----------|--------|--------|------|
| numNetworkReqs | 0 | 🟢 | 221 | 🔴 | → 0.0% | ✓ |
| inp | 24ms | 🟢 | 1.75s | 🔴 | ↑ +7364.3% | — |
| inpCount | 95 | — | 93 | — | → -2.1% | — |
| renderCount | 249.50 | 🟠 | 244 | 🟠 | ↓ 2.2% | — |
| renderTime | 673ms | 🟠 | 576ms | 🟠 | ↓ 14.4% | ✓ |
| averageRenderTime | 2.70 | 🟡 | 2.36 | 🟡 | ↓ 12.5% | ✓ |
| fcp | 376ms | 🟢 | 388ms | 🟢 | ↑ +3.0% | — |
| tbt | 64ms | 🟢 | 47ms | 🟢 | ↓ 26.3% | ❌ |

> ⚠️ **Data Quality Note:** Some metrics have high variance

### Import Srp ✅

| Metric | Baseline | Rating | Compiler | Rating | Change | Sig? |
|--------|----------|--------|----------|--------|--------|------|
| numNetworkReqs | 0 | 🟢 | 143 | 🔴 | → 0.0% | ✓ |
| inp | 0ms | 🟢 | 0ms | 🟢 | → 0.0% | — |
| inpCount | 0 | — | 0 | — | → 0.0% | — |
| renderCount | 227 | 🟠 | 225.50 | 🟠 | → -0.7% | — |
| renderTime | 344ms | 🟡 | 269ms | 🟡 | ↓ 21.7% | — |
| averageRenderTime | 1.52 | 🟢 | 1.19 | 🟢 | ↓ 21.8% | — |
| interactionLatency | 10.01s | 🟡 | 10.86s | 🟡 | ↑ +8.5% | ✓ |
| fcp | 690ms | 🟢 | 830ms | 🟢 | ↑ +20.4% | — |
| tbt | 0ms | 🟢 | 0ms | 🟢 | → 0.0% | — |

### Token Search ⚠️

| Metric | Baseline | Rating | Compiler | Rating | Change | Sig? |
|--------|----------|--------|----------|--------|--------|------|
| numNetworkReqs | 0 | 🟢 | 22.67 | 🟡 | → 0.0% | ✓ |
| inp | 240ms | 🟡 | 14ms | 🟢 | ↓ 94.0% | — |
| inpCount | 3.67 | — | 20 | — | → 445.5% | ✓ |
| renderCount | 33.33 | 🟢 | 32 | 🟢 | ↓ 4.0% | ✓ |
| renderTime | 158ms | 🟡 | 106ms | 🟡 | ↓ 33.1% | ✓ |
| averageRenderTime | 4.74 | 🟡 | 3.21 | 🟡 | ↓ 32.2% | ✓ |
| interactionLatency | 14.05s | 🟡 | 13.61s | 🟡 | ↓ 3.1% | — |
| fcp | 14.80s | 🔴 | 201ms | 🟢 | ↓ 98.6% | ✓ |
| tbt | 39ms | 🟢 | 0ms | 🟢 | ↓ 100.0% | ✓ |

> ⚠️ **Data Quality Note:** Some metrics have high variance

### Token Send ⚠️

| Metric | Baseline | Rating | Compiler | Rating | Change | Sig? |
|--------|----------|--------|----------|--------|--------|------|
| numNetworkReqs | 0 | 🟢 | 12 | 🟢 | → 0.0% | ✓ |
| inp | 0ms | 🟢 | 1.19s | 🔴 | → 0.0% | — |
| inpCount | 0 | — | 3 | — | → 0.0% | ✓ |
| renderCount | 32 | 🟢 | 31.50 | 🟢 | ↓ 1.6% | — |
| renderTime | 124ms | 🟡 | 107ms | 🟡 | ↓ 13.6% | ✓ |
| averageRenderTime | 3.68 | 🟡 | 3.24 | 🟡 | ↓ 12.1% | — |
| interactionLatency | 19.93s | 🟠 | 19.87s | 🟠 | → -0.3% | — |
| tbt | 6ms | 🟢 | 4ms | 🟢 | ↓ 34.5% | ❌ |

> ⚠️ **Data Quality Note:** Some metrics have high variance

### Tokens List Scrolling ⚠️

| Metric | Baseline | Rating | Compiler | Rating | Change | Sig? |
|--------|----------|--------|----------|--------|--------|------|
| numNetworkReqs | 0 | 🟢 | 42.33 | 🟡 | → 0.0% | ✓ |
| inp | 0ms | 🟢 | 196ms | 🟢 | → 0.0% | ✓ |
| inpCount | 0 | — | 2 | — | → 0.0% | ✓ |
| renderCount | 453.60 | 🟡 | 461.17 | 🟡 | ↑ +1.7% | — |
| renderTime | 3.65s | 🔴 | 3.39s | 🔴 | ↓ 7.0% | — |
| averageRenderTime | 8.06 | 🟠 | 7.35 | 🟠 | ↓ 8.8% | — |
| interactionLatency | 13.19s | 🟡 | 13.44s | 🟡 | ↑ +1.9% | — |
| fcp | 7.14s | 🔴 | 1.01s | 🟢 | ↓ 85.9% | ❌ |
| tbt | 4.42s | 🟠 | 3.88s | 🟠 | ↓ 12.2% | — |

> ⚠️ **Data Quality Note:** Some metrics have high variance

### Nft List Scrolling ✅

| Metric | Baseline | Rating | Compiler | Rating | Change | Sig? |
|--------|----------|--------|----------|--------|--------|------|
| numNetworkReqs | 0 | 🟢 | 125.25 | 🟠 | → 0.0% | ✓ |
| inp | 0ms | 🟢 | 25ms | 🟢 | → 0.0% | — |
| inpCount | 0 | — | 1 | — | → 0.0% | — |
| renderCount | 542.67 | 🟡 | 539.83 | 🟡 | → -0.5% | — |
| renderTime | 3.89s | 🔴 | 3.40s | 🔴 | ↓ 12.4% | ✓ |
| averageRenderTime | 7.16 | 🟠 | 6.30 | 🟠 | ↓ 12.1% | ✓ |
| interactionLatency | 13.11s | 🟡 | 13.03s | 🟡 | → -0.6% | — |
| tbt | 4.00s | 🟠 | 3.87s | 🟠 | ↓ 3.1% | — |
| scrollToLoadLatency | 5.08s | 🔴 | 5.11s | 🔴 | → 0.6% | — |
| scrollEventCount | 2 | — | 2 | — | → 0.0% | — |
| totalScrollDistance | 0 | — | 0 | — | → 0.0% | — |
| assetsLoadedPerScroll | 0 | — | 0 | — | → 0.0% | — |
| cumulativeLoadTime | 10.16s | 🟠 | 10.22s | 🟠 | → 0.6% | — |

**Rating Legend:** 🟢 Excellent | 🟡 Good | 🟠 Needs Work | 🔴 Poor | ✓ Statistically Significant

---

## 🔍 Detailed Analysis

In-depth breakdown with business/UX implications and value assessments.

### Tab Switching ✅

**Summary:** 5 improvements, 1 regressions

<details>
<summary>⚠️ Data Quality Issues</summary>

- Baseline has insufficient iterations (3/4 minimum)
- Baseline had 1 error(s)

</details>

#### 🌐 Web Vitals (Core Performance)

#### ⚠️ inp

| | Value | Assessment |
|---|---|---|
| **Baseline** | 223ms | 🟡 **223.0 ms** is acceptable (target: <500 ms) |
| **Compiler** | 226ms | 🟡 **225.9 ms** is acceptable (target: <500 ms) |
| **Change** | +1.3% | 3ms slower Interaction to Next Paint (INP) - investigate potential performance regression. |

<details>
<summary>📖 About this metric</summary>

**What it measures:** Time from user interaction to visual feedback

**UX Impact:** Directly affects perceived responsiveness. Users notice delays >100ms.

**Business Impact:** Poor INP correlates with higher bounce rates and lower engagement.

</details>

#### ✅ fcp

| | Value | Assessment |
|---|---|---|
| **Baseline** | 333ms | 🟢 **332.9 ms** is excellent (target: <1800 ms) |
| **Compiler** | 293ms | 🟢 **293.0 ms** is excellent (target: <1800 ms) |
| **Change** | -12.0% | 40ms improvement in First Contentful Paint (FCP) means faster, more responsive interactions. |

<details>
<summary>📖 About this metric</summary>

**What it measures:** Time until first content appears on screen

**UX Impact:** Users perceive blank screens >1s as slow loading.

**Business Impact:** Every 100ms delay in FCP can reduce conversions by 1-2%.

</details>

> ⚠️ **High variance** - CV: 7% / 46%

#### ✅ tbt

| | Value | Assessment |
|---|---|---|
| **Baseline** | 556ms | 🟡 **556.0 ms** is acceptable (target: <600 ms) |
| **Compiler** | 431ms | 🟡 **430.8 ms** is acceptable (target: <600 ms) |
| **Change** | -22.5% | 125ms improvement in Total Blocking Time (TBT) means faster, more responsive interactions. |

<details>
<summary>📖 About this metric</summary>

**What it measures:** Total time main thread was blocked during load

**UX Impact:** Blocked thread = unresponsive UI. Users may think app is frozen.

**Business Impact:** High TBT causes user frustration and abandonment.

</details>

> ⚠️ **High variance** - CV: 40% / 18%

#### ⚛️ React Performance

#### ➖ renderCount

| | Value | Assessment |
|---|---|---|
| **Baseline** | 542.33 | 🟡 **542.3 renders** is acceptable (target: <600 renders) |
| **Compiler** | 541.83 | 🟡 **541.8 renders** is acceptable (target: <600 renders) |
| **Change** | -0.1% | Minimal change in React component renders (-0.1%). |

<details>
<summary>📖 About this metric</summary>

**What it measures:** Number of React component re-renders during flow

**UX Impact:** Excessive re-renders cause jank and slow interactions.

**Business Impact:** React Compiler should reduce this significantly via auto-memoization.

</details>

#### ✅ renderTime

| | Value | Assessment |
|---|---|---|
| **Baseline** | 899ms | 🟠 **899.1 ms** needs improvement (+80% over target 500 ms) |
| **Compiler** | 730ms | 🟠 **729.5 ms** needs improvement (+46% over target 500 ms) |
| **Change** | -18.9% | 18.9% reduction in total render time indicates React Compiler is successfully memoizing components and reducing unnecessary re-renders. |

<details>
<summary>📖 About this metric</summary>

**What it measures:** Total time spent in React render phase

**UX Impact:** Long render times block the main thread.

**Business Impact:** Key metric for React Compiler effectiveness.

</details>

#### ✅ averageRenderTime

| | Value | Assessment |
|---|---|---|
| **Baseline** | 1.66 | 🟢 **1.7 ms/render** is excellent (target: <2 ms/render) |
| **Compiler** | 1.35 | 🟢 **1.3 ms/render** is excellent (target: <2 ms/render) |
| **Change** | -18.7% | 18.7% reduction in average render time indicates React Compiler is successfully memoizing components and reducing unnecessary re-renders. |

<details>
<summary>📖 About this metric</summary>

**What it measures:** Average time per component render

**UX Impact:** Indicates component complexity and optimization.

**Business Impact:** High values suggest components need optimization.

</details>

#### 📡 Network

#### ➖ numNetworkReqs

| | Value | Assessment |
|---|---|---|
| **Baseline** | 0 | 🟢 **0.0 requests** is excellent (target: <20 requests) |
| **Compiler** | 54.50 | 🟠 **54.5 requests** needs improvement (+9% over target 50 requests) |
| **Change** | 0.0% | Minimal change in network requests (0.0%). |

<details>
<summary>📖 About this metric</summary>

**What it measures:** Number of network requests during flow

**UX Impact:** More requests = more latency, especially on slow connections.

**Business Impact:** Affects data costs for mobile users and server load.

</details>

#### ⏱️ Latency

#### ✅ interactionLatency

| | Value | Assessment |
|---|---|---|
| **Baseline** | 3.49s | 🟡 **3490.7 ms** is acceptable (target: <5000 ms) |
| **Compiler** | 3.22s | 🟡 **3218.6 ms** is acceptable (target: <5000 ms) |
| **Change** | -7.8% | 272ms improvement in interaction latency means faster, more responsive interactions. |

<details>
<summary>📖 About this metric</summary>

**What it measures:** Total time for user flow completion

**UX Impact:** Overall task completion time affects satisfaction.

**Business Impact:** Faster flows = better user retention and task completion.

</details>

#### 📋 Other Metrics

#### ➖ inpCount

| | Value | Assessment |
|---|---|---|
| **Baseline** | 8 | — |
| **Compiler** | 8 | — |
| **Change** | 0.0% | INP interaction count decreased by 0.0% (informational metric). |

#### 💡 Recommendations

- Investigate 1 metric regression(s) in this flow.
- React Compiler optimization is effective - 5 metric(s) improved.
- Focus on high-impact metrics: averageRenderTime.

---

### Account Switching ✅

**Summary:** 6 improvements, 0 regressions

#### 🌐 Web Vitals (Core Performance)

#### ✅ inp

| | Value | Assessment |
|---|---|---|
| **Baseline** | 39ms | 🟢 **39.1 ms** is excellent (target: <200 ms) |
| **Compiler** | 35ms | 🟢 **35.0 ms** is excellent (target: <200 ms) |
| **Change** | -10.6% | 4ms improvement in Interaction to Next Paint (INP) means faster, more responsive interactions. |

<details>
<summary>📖 About this metric</summary>

**What it measures:** Time from user interaction to visual feedback

**UX Impact:** Directly affects perceived responsiveness. Users notice delays >100ms.

**Business Impact:** Poor INP correlates with higher bounce rates and lower engagement.

</details>

> ⚠️ **High variance** - CV: 29% / 33%

#### ✅ fcp

| | Value | Assessment |
|---|---|---|
| **Baseline** | 169ms | 🟢 **169.1 ms** is excellent (target: <1800 ms) |
| **Compiler** | 156ms | 🟢 **155.8 ms** is excellent (target: <1800 ms) |
| **Change** | -7.9% | 13ms improvement in First Contentful Paint (FCP) means faster, more responsive interactions. |

<details>
<summary>📖 About this metric</summary>

**What it measures:** Time until first content appears on screen

**UX Impact:** Users perceive blank screens >1s as slow loading.

**Business Impact:** Every 100ms delay in FCP can reduce conversions by 1-2%.

</details>

#### ✅ tbt

| | Value | Assessment |
|---|---|---|
| **Baseline** | 21ms | 🟢 **21.0 ms** is excellent (target: <200 ms) |
| **Compiler** | 17ms | 🟢 **16.7 ms** is excellent (target: <200 ms) |
| **Change** | -20.6% | 4ms improvement in Total Blocking Time (TBT) means faster, more responsive interactions. |

<details>
<summary>📖 About this metric</summary>

**What it measures:** Total time main thread was blocked during load

**UX Impact:** Blocked thread = unresponsive UI. Users may think app is frozen.

**Business Impact:** High TBT causes user frustration and abandonment.

</details>

> ⚠️ **High variance** - CV: 12% / 69%

#### ⚛️ React Performance

#### ➖ renderCount

| | Value | Assessment |
|---|---|---|
| **Baseline** | 256.17 | 🟠 **256.2 renders** needs improvement (+28% over target 200 renders) |
| **Compiler** | 254.80 | 🟠 **254.8 renders** needs improvement (+27% over target 200 renders) |
| **Change** | -0.5% | Minimal change in React component renders (-0.5%). |

<details>
<summary>📖 About this metric</summary>

**What it measures:** Number of React component re-renders during flow

**UX Impact:** Excessive re-renders cause jank and slow interactions.

**Business Impact:** React Compiler should reduce this significantly via auto-memoization.

</details>

#### ✅ renderTime

| | Value | Assessment |
|---|---|---|
| **Baseline** | 310ms | 🟡 **309.8 ms** is acceptable (target: <500 ms) |
| **Compiler** | 294ms | 🟡 **294.0 ms** is acceptable (target: <500 ms) |
| **Change** | -5.1% | 5.1% reduction in total render time indicates React Compiler is successfully memoizing components and reducing unnecessary re-renders. |

<details>
<summary>📖 About this metric</summary>

**What it measures:** Total time spent in React render phase

**UX Impact:** Long render times block the main thread.

**Business Impact:** Key metric for React Compiler effectiveness.

</details>

#### ✅ averageRenderTime

| | Value | Assessment |
|---|---|---|
| **Baseline** | 1.21 | 🟢 **1.2 ms/render** is excellent (target: <2 ms/render) |
| **Compiler** | 1.14 | 🟢 **1.1 ms/render** is excellent (target: <2 ms/render) |
| **Change** | -5.9% | 5.9% reduction in average render time indicates React Compiler is successfully memoizing components and reducing unnecessary re-renders. |

<details>
<summary>📖 About this metric</summary>

**What it measures:** Average time per component render

**UX Impact:** Indicates component complexity and optimization.

**Business Impact:** High values suggest components need optimization.

</details>

#### 📡 Network

#### ➖ numNetworkReqs

| | Value | Assessment |
|---|---|---|
| **Baseline** | 0 | 🟢 **0.0 requests** is excellent (target: <20 requests) |
| **Compiler** | 233.50 | 🔴 **233.5 requests** is poor (+134% over threshold 100 requests) |
| **Change** | 0.0% | Minimal change in network requests (0.0%). |

<details>
<summary>📖 About this metric</summary>

**What it measures:** Number of network requests during flow

**UX Impact:** More requests = more latency, especially on slow connections.

**Business Impact:** Affects data costs for mobile users and server load.

</details>

#### ⏱️ Latency

#### ✅ interactionLatency

| | Value | Assessment |
|---|---|---|
| **Baseline** | 5.11s | 🟡 **5107.3 ms** is acceptable (target: <15000 ms) |
| **Compiler** | 5.05s | 🟡 **5048.4 ms** is acceptable (target: <15000 ms) |
| **Change** | -1.2% | 59ms improvement in interaction latency means faster, more responsive interactions. |

<details>
<summary>📖 About this metric</summary>

**What it measures:** Total time for user flow completion

**UX Impact:** Overall task completion time affects satisfaction.

**Business Impact:** Faster flows = better user retention and task completion.

</details>

#### 📋 Other Metrics

#### ➖ inpCount

| | Value | Assessment |
|---|---|---|
| **Baseline** | 6 | — |
| **Compiler** | 6 | — |
| **Change** | 0.0% | INP interaction count decreased by 0.0% (informational metric). |

#### 💡 Recommendations

- React Compiler optimization is effective - 6 metric(s) improved.

---

### Network Switching ⚠️

**Summary:** 2 improvements, 4 regressions | **[PARTIAL DATA]**

#### 🌐 Web Vitals (Core Performance)

#### ⚠️ inp

| | Value | Assessment |
|---|---|---|
| **Baseline** | 5ms | 🟢 **4.9 ms** is excellent (target: <200 ms) |
| **Compiler** | 9ms | 🟢 **8.8 ms** is excellent (target: <200 ms) |
| **Change** | +79.3% | 4ms slower Interaction to Next Paint (INP) - investigate potential performance regression. |

<details>
<summary>📖 About this metric</summary>

**What it measures:** Time from user interaction to visual feedback

**UX Impact:** Directly affects perceived responsiveness. Users notice delays >100ms.

**Business Impact:** Poor INP correlates with higher bounce rates and lower engagement.

</details>

> ❌ **Unreliable data** - CV: 200% / 88% (threshold: 50%)

#### ⚠️ fcp

| | Value | Assessment |
|---|---|---|
| **Baseline** | 268ms | 🟢 **268.0 ms** is excellent (target: <1800 ms) |
| **Compiler** | 278ms | 🟢 **277.7 ms** is excellent (target: <1800 ms) |
| **Change** | +3.6% | 10ms slower First Contentful Paint (FCP) - investigate potential performance regression. |

<details>
<summary>📖 About this metric</summary>

**What it measures:** Time until first content appears on screen

**UX Impact:** Users perceive blank screens >1s as slow loading.

**Business Impact:** Every 100ms delay in FCP can reduce conversions by 1-2%.

</details>

#### ⚠️ tbt

| | Value | Assessment |
|---|---|---|
| **Baseline** | 5ms | 🟢 **5.4 ms** is excellent (target: <200 ms) |
| **Compiler** | 6ms | 🟢 **6.4 ms** is excellent (target: <200 ms) |
| **Change** | +18.5% | 18.5% regression in Total Blocking Time (TBT). |

<details>
<summary>📖 About this metric</summary>

**What it measures:** Total time main thread was blocked during load

**UX Impact:** Blocked thread = unresponsive UI. Users may think app is frozen.

**Business Impact:** High TBT causes user frustration and abandonment.

</details>

> ❌ **Unreliable data** - CV: 200% / 93% (threshold: 50%)

#### ⚛️ React Performance

#### ⚠️ renderCount

| | Value | Assessment |
|---|---|---|
| **Baseline** | 20.67 | 🟢 **20.7 renders** is excellent (target: <50 renders) |
| **Compiler** | 21.20 | 🟢 **21.2 renders** is excellent (target: <50 renders) |
| **Change** | +2.6% | 2.6% increase in React component renders suggests potential regression in component memoization. |

<details>
<summary>📖 About this metric</summary>

**What it measures:** Number of React component re-renders during flow

**UX Impact:** Excessive re-renders cause jank and slow interactions.

**Business Impact:** React Compiler should reduce this significantly via auto-memoization.

</details>

#### ✅ renderTime

| | Value | Assessment |
|---|---|---|
| **Baseline** | 88ms | 🟢 **87.7 ms** is excellent (target: <100 ms) |
| **Compiler** | 87ms | 🟢 **86.7 ms** is excellent (target: <100 ms) |
| **Change** | -1.2% | 1.2% reduction in total render time indicates React Compiler is successfully memoizing components and reducing unnecessary re-renders. |

<details>
<summary>📖 About this metric</summary>

**What it measures:** Total time spent in React render phase

**UX Impact:** Long render times block the main thread.

**Business Impact:** Key metric for React Compiler effectiveness.

</details>

#### ✅ averageRenderTime

| | Value | Assessment |
|---|---|---|
| **Baseline** | 4.16 | 🟡 **4.2 ms/render** is acceptable (target: <5 ms/render) |
| **Compiler** | 3.98 | 🟡 **4.0 ms/render** is acceptable (target: <5 ms/render) |
| **Change** | -4.3% | 4.3% reduction in average render time indicates React Compiler is successfully memoizing components and reducing unnecessary re-renders. |

<details>
<summary>📖 About this metric</summary>

**What it measures:** Average time per component render

**UX Impact:** Indicates component complexity and optimization.

**Business Impact:** High values suggest components need optimization.

</details>

#### 📡 Network

#### ➖ numNetworkReqs

| | Value | Assessment |
|---|---|---|
| **Baseline** | 0 | 🟢 **0.0 requests** is excellent (target: <30 requests) |
| **Compiler** | 187.67 | 🔴 **187.7 requests** is poor (+88% over threshold 100 requests) |
| **Change** | 0.0% | Minimal change in network requests (0.0%). |

<details>
<summary>📖 About this metric</summary>

**What it measures:** Number of network requests during flow

**UX Impact:** More requests = more latency, especially on slow connections.

**Business Impact:** Affects data costs for mobile users and server load.

</details>

> ⚠️ **High variance** - CV: 0% / 59%

#### 📋 Other Metrics

#### ➖ inpCount

| | Value | Assessment |
|---|---|---|
| **Baseline** | 0.83 | — |
| **Compiler** | 2 | — |
| **Change** | +140.0% | INP interaction count increased by 140.0% (informational metric). |

> ❌ **Unreliable data** - CV: 146% / 71% (threshold: 50%)

#### 💡 Recommendations

- ⚠️ Some metrics have high variance - interpret results with caution.
- Investigate 2 metric regression(s) in this flow.
- React Compiler optimization is effective - 2 metric(s) improved.

---

### Network Adding ⚠️

**Summary:** 4 improvements, 2 regressions | **[PARTIAL DATA]**

<details>
<summary>⚠️ Data Quality Issues</summary>

- Compiler has insufficient iterations (3/4 minimum)

</details>

#### 🌐 Web Vitals (Core Performance)

#### ⚠️ inp

| | Value | Assessment |
|---|---|---|
| **Baseline** | 24ms | 🟢 **23.5 ms** is excellent (target: <200 ms) |
| **Compiler** | 1.75s | 🔴 **1754.1 ms** is poor (+75% over threshold 1000 ms) |
| **Change** | +7364.3% | 1731ms slower Interaction to Next Paint (INP) - investigate potential performance regression. |

<details>
<summary>📖 About this metric</summary>

**What it measures:** Time from user interaction to visual feedback

**UX Impact:** Directly affects perceived responsiveness. Users notice delays >100ms.

**Business Impact:** Poor INP correlates with higher bounce rates and lower engagement.

</details>

> ⚠️ **High variance** - CV: 19% / 139%

#### ⚠️ fcp

| | Value | Assessment |
|---|---|---|
| **Baseline** | 376ms | 🟢 **376.4 ms** is excellent (target: <1800 ms) |
| **Compiler** | 388ms | 🟢 **387.7 ms** is excellent (target: <1800 ms) |
| **Change** | +3.0% | 11ms slower First Contentful Paint (FCP) - investigate potential performance regression. |

<details>
<summary>📖 About this metric</summary>

**What it measures:** Time until first content appears on screen

**UX Impact:** Users perceive blank screens >1s as slow loading.

**Business Impact:** Every 100ms delay in FCP can reduce conversions by 1-2%.

</details>

> ⚠️ **High variance** - CV: 14% / 47%

#### ✅ tbt

| | Value | Assessment |
|---|---|---|
| **Baseline** | 64ms | 🟢 **64.2 ms** is excellent (target: <200 ms) |
| **Compiler** | 47ms | 🟢 **47.3 ms** is excellent (target: <200 ms) |
| **Change** | -26.3% | 17ms improvement in Total Blocking Time (TBT) means faster, more responsive interactions. |

<details>
<summary>📖 About this metric</summary>

**What it measures:** Total time main thread was blocked during load

**UX Impact:** Blocked thread = unresponsive UI. Users may think app is frozen.

**Business Impact:** High TBT causes user frustration and abandonment.

</details>

> ❌ **Unreliable data** - CV: 40% / 98% (threshold: 50%)

#### ⚛️ React Performance

#### ✅ renderCount

| | Value | Assessment |
|---|---|---|
| **Baseline** | 249.50 | 🟠 **249.5 renders** needs improvement (+25% over target 200 renders) |
| **Compiler** | 244 | 🟠 **244.0 renders** needs improvement (+22% over target 200 renders) |
| **Change** | -2.2% | 2.2% reduction in React component renders indicates React Compiler is successfully memoizing components and reducing unnecessary re-renders. |

<details>
<summary>📖 About this metric</summary>

**What it measures:** Number of React component re-renders during flow

**UX Impact:** Excessive re-renders cause jank and slow interactions.

**Business Impact:** React Compiler should reduce this significantly via auto-memoization.

</details>

#### ✅ renderTime

| | Value | Assessment |
|---|---|---|
| **Baseline** | 673ms | 🟠 **672.7 ms** needs improvement (+35% over target 500 ms) |
| **Compiler** | 576ms | 🟠 **575.8 ms** needs improvement (+15% over target 500 ms) |
| **Change** | -14.4% | 14.4% reduction in total render time indicates React Compiler is successfully memoizing components and reducing unnecessary re-renders. |

<details>
<summary>📖 About this metric</summary>

**What it measures:** Total time spent in React render phase

**UX Impact:** Long render times block the main thread.

**Business Impact:** Key metric for React Compiler effectiveness.

</details>

> ✓ **Statistically significant** (p < 0.05)

#### ✅ averageRenderTime

| | Value | Assessment |
|---|---|---|
| **Baseline** | 2.70 | 🟡 **2.7 ms/render** is acceptable (target: <5 ms/render) |
| **Compiler** | 2.36 | 🟡 **2.4 ms/render** is acceptable (target: <5 ms/render) |
| **Change** | -12.5% | 12.5% reduction in average render time indicates React Compiler is successfully memoizing components and reducing unnecessary re-renders. |

<details>
<summary>📖 About this metric</summary>

**What it measures:** Average time per component render

**UX Impact:** Indicates component complexity and optimization.

**Business Impact:** High values suggest components need optimization.

</details>

> ✓ **Statistically significant** (p < 0.05)

#### 📡 Network

#### ➖ numNetworkReqs

| | Value | Assessment |
|---|---|---|
| **Baseline** | 0 | 🟢 **0.0 requests** is excellent (target: <20 requests) |
| **Compiler** | 221 | 🔴 **221.0 requests** is poor (+121% over threshold 100 requests) |
| **Change** | 0.0% | Minimal change in network requests (0.0%). |

<details>
<summary>📖 About this metric</summary>

**What it measures:** Number of network requests during flow

**UX Impact:** More requests = more latency, especially on slow connections.

**Business Impact:** Affects data costs for mobile users and server load.

</details>

> ⚠️ **High variance** - CV: 0% / 52%

#### 📋 Other Metrics

#### ➖ inpCount

| | Value | Assessment |
|---|---|---|
| **Baseline** | 95 | — |
| **Compiler** | 93 | — |
| **Change** | -2.1% | INP interaction count decreased by 2.1% (informational metric). |

#### 💡 Recommendations

- ⚠️ Some metrics have high variance - interpret results with caution.
- Investigate 2 metric regression(s) in this flow.
- React Compiler optimization is effective - 3 metric(s) improved.
- Focus on high-impact metrics: inp.

---

### Import Srp ✅

**Summary:** 2 improvements, 2 regressions

<details>
<summary>⚠️ Data Quality Issues</summary>

- Baseline has insufficient iterations (2/4 minimum)
- Compiler has insufficient iterations (2/4 minimum)

</details>

#### 🌐 Web Vitals (Core Performance)

#### ➖ inp

| | Value | Assessment |
|---|---|---|
| **Baseline** | 0ms | 🟢 **0.0 ms** is excellent (target: <200 ms) |
| **Compiler** | 0ms | 🟢 **0.0 ms** is excellent (target: <200 ms) |
| **Change** | 0.0% | Minimal change in Interaction to Next Paint (INP) (0.0%). |

<details>
<summary>📖 About this metric</summary>

**What it measures:** Time from user interaction to visual feedback

**UX Impact:** Directly affects perceived responsiveness. Users notice delays >100ms.

**Business Impact:** Poor INP correlates with higher bounce rates and lower engagement.

</details>

#### ⚠️ fcp

| | Value | Assessment |
|---|---|---|
| **Baseline** | 690ms | 🟢 **689.5 ms** is excellent (target: <1800 ms) |
| **Compiler** | 830ms | 🟢 **830.1 ms** is excellent (target: <1800 ms) |
| **Change** | +20.4% | 141ms slower First Contentful Paint (FCP) - investigate potential performance regression. |

<details>
<summary>📖 About this metric</summary>

**What it measures:** Time until first content appears on screen

**UX Impact:** Users perceive blank screens >1s as slow loading.

**Business Impact:** Every 100ms delay in FCP can reduce conversions by 1-2%.

</details>

> ⚠️ **High variance** - CV: 11% / 79%

#### ➖ tbt

| | Value | Assessment |
|---|---|---|
| **Baseline** | 0ms | 🟢 **0.0 ms** is excellent (target: <200 ms) |
| **Compiler** | 0ms | 🟢 **0.0 ms** is excellent (target: <200 ms) |
| **Change** | 0.0% | Minimal change in Total Blocking Time (TBT) (0.0%). |

<details>
<summary>📖 About this metric</summary>

**What it measures:** Total time main thread was blocked during load

**UX Impact:** Blocked thread = unresponsive UI. Users may think app is frozen.

**Business Impact:** High TBT causes user frustration and abandonment.

</details>

#### ⚛️ React Performance

#### ➖ renderCount

| | Value | Assessment |
|---|---|---|
| **Baseline** | 227 | 🟠 **227.0 renders** needs improvement (+14% over target 200 renders) |
| **Compiler** | 225.50 | 🟠 **225.5 renders** needs improvement (+13% over target 200 renders) |
| **Change** | -0.7% | Minimal change in React component renders (-0.7%). |

<details>
<summary>📖 About this metric</summary>

**What it measures:** Number of React component re-renders during flow

**UX Impact:** Excessive re-renders cause jank and slow interactions.

**Business Impact:** React Compiler should reduce this significantly via auto-memoization.

</details>

#### ✅ renderTime

| | Value | Assessment |
|---|---|---|
| **Baseline** | 344ms | 🟡 **344.1 ms** is acceptable (target: <500 ms) |
| **Compiler** | 269ms | 🟡 **269.4 ms** is acceptable (target: <500 ms) |
| **Change** | -21.7% | 21.7% reduction in total render time indicates React Compiler is successfully memoizing components and reducing unnecessary re-renders. |

<details>
<summary>📖 About this metric</summary>

**What it measures:** Total time spent in React render phase

**UX Impact:** Long render times block the main thread.

**Business Impact:** Key metric for React Compiler effectiveness.

</details>

#### ✅ averageRenderTime

| | Value | Assessment |
|---|---|---|
| **Baseline** | 1.52 | 🟢 **1.5 ms/render** is excellent (target: <2 ms/render) |
| **Compiler** | 1.19 | 🟢 **1.2 ms/render** is excellent (target: <2 ms/render) |
| **Change** | -21.8% | 21.8% reduction in average render time indicates React Compiler is successfully memoizing components and reducing unnecessary re-renders. |

<details>
<summary>📖 About this metric</summary>

**What it measures:** Average time per component render

**UX Impact:** Indicates component complexity and optimization.

**Business Impact:** High values suggest components need optimization.

</details>

#### 📡 Network

#### ➖ numNetworkReqs

| | Value | Assessment |
|---|---|---|
| **Baseline** | 0 | 🟢 **0.0 requests** is excellent (target: <20 requests) |
| **Compiler** | 143 | 🔴 **143.0 requests** is poor (+43% over threshold 100 requests) |
| **Change** | 0.0% | Minimal change in network requests (0.0%). |

<details>
<summary>📖 About this metric</summary>

**What it measures:** Number of network requests during flow

**UX Impact:** More requests = more latency, especially on slow connections.

**Business Impact:** Affects data costs for mobile users and server load.

</details>

#### ⏱️ Latency

#### ⚠️ interactionLatency

| | Value | Assessment |
|---|---|---|
| **Baseline** | 10.01s | 🟡 **10007.0 ms** is acceptable (target: <15000 ms) |
| **Compiler** | 10.86s | 🟡 **10856.0 ms** is acceptable (target: <15000 ms) |
| **Change** | +8.5% | 849ms slower interaction latency - investigate potential performance regression. |

<details>
<summary>📖 About this metric</summary>

**What it measures:** Total time for user flow completion

**UX Impact:** Overall task completion time affects satisfaction.

**Business Impact:** Faster flows = better user retention and task completion.

</details>

> ✓ **Statistically significant** (p < 0.05)

#### 📋 Other Metrics

#### ➖ inpCount

| | Value | Assessment |
|---|---|---|
| **Baseline** | 0 | — |
| **Compiler** | 0 | — |
| **Change** | 0.0% | INP interaction count decreased by 0.0% (informational metric). |

#### 💡 Recommendations

- Investigate 2 metric regression(s) in this flow.
- React Compiler optimization is effective - 2 metric(s) improved.
- Focus on high-impact metrics: renderTime, averageRenderTime.

---

### Token Search ⚠️

**Summary:** 7 improvements, 0 regressions | **[PARTIAL DATA]**

<details>
<summary>⚠️ Data Quality Issues</summary>

- Baseline has insufficient iterations (3/4 minimum)
- Baseline had 1 error(s)

</details>

#### 🌐 Web Vitals (Core Performance)

#### ✅ inp

| | Value | Assessment |
|---|---|---|
| **Baseline** | 240ms | 🟡 **240.4 ms** is acceptable (target: <500 ms) |
| **Compiler** | 14ms | 🟢 **14.3 ms** is excellent (target: <200 ms) |
| **Change** | -94.0% | 226ms improvement in Interaction to Next Paint (INP) means faster, more responsive interactions. |

<details>
<summary>📖 About this metric</summary>

**What it measures:** Time from user interaction to visual feedback

**UX Impact:** Directly affects perceived responsiveness. Users notice delays >100ms.

**Business Impact:** Poor INP correlates with higher bounce rates and lower engagement.

</details>

> ⚠️ **High variance** - CV: 141% / 9%

#### ✅ fcp

| | Value | Assessment |
|---|---|---|
| **Baseline** | 14.80s | 🔴 **14799.7 ms** is poor (+196% over threshold 5000 ms) |
| **Compiler** | 201ms | 🟢 **200.8 ms** is excellent (target: <1800 ms) |
| **Change** | -98.6% | 14599ms improvement in First Contentful Paint (FCP) means faster, more responsive interactions. |

<details>
<summary>📖 About this metric</summary>

**What it measures:** Time until first content appears on screen

**UX Impact:** Users perceive blank screens >1s as slow loading.

**Business Impact:** Every 100ms delay in FCP can reduce conversions by 1-2%.

</details>

> ❌ **Unreliable data** - CV: 42% / 37% (threshold: 50%)

#### ✅ tbt

| | Value | Assessment |
|---|---|---|
| **Baseline** | 39ms | 🟢 **38.7 ms** is excellent (target: <200 ms) |
| **Compiler** | 0ms | 🟢 **0.0 ms** is excellent (target: <200 ms) |
| **Change** | -100.0% | 39ms improvement in Total Blocking Time (TBT) means faster, more responsive interactions. |

<details>
<summary>📖 About this metric</summary>

**What it measures:** Total time main thread was blocked during load

**UX Impact:** Blocked thread = unresponsive UI. Users may think app is frozen.

**Business Impact:** High TBT causes user frustration and abandonment.

</details>

> ⚠️ **High variance** - CV: 47% / 0%

#### ⚛️ React Performance

#### ✅ renderCount

| | Value | Assessment |
|---|---|---|
| **Baseline** | 33.33 | 🟢 **33.3 renders** is excellent (target: <50 renders) |
| **Compiler** | 32 | 🟢 **32.0 renders** is excellent (target: <50 renders) |
| **Change** | -4.0% | 4.0% reduction in React component renders indicates React Compiler is successfully memoizing components and reducing unnecessary re-renders. |

<details>
<summary>📖 About this metric</summary>

**What it measures:** Number of React component re-renders during flow

**UX Impact:** Excessive re-renders cause jank and slow interactions.

**Business Impact:** React Compiler should reduce this significantly via auto-memoization.

</details>

> ✓ **Statistically significant** (p < 0.05)

#### ✅ renderTime

| | Value | Assessment |
|---|---|---|
| **Baseline** | 158ms | 🟡 **157.9 ms** is acceptable (target: <500 ms) |
| **Compiler** | 106ms | 🟡 **105.7 ms** is acceptable (target: <500 ms) |
| **Change** | -33.1% | 33.1% reduction in total render time indicates React Compiler is successfully memoizing components and reducing unnecessary re-renders. |

<details>
<summary>📖 About this metric</summary>

**What it measures:** Total time spent in React render phase

**UX Impact:** Long render times block the main thread.

**Business Impact:** Key metric for React Compiler effectiveness.

</details>

> ✓ **Statistically significant** (p < 0.05)

#### ✅ averageRenderTime

| | Value | Assessment |
|---|---|---|
| **Baseline** | 4.74 | 🟡 **4.7 ms/render** is acceptable (target: <5 ms/render) |
| **Compiler** | 3.21 | 🟡 **3.2 ms/render** is acceptable (target: <5 ms/render) |
| **Change** | -32.2% | 32.2% reduction in average render time indicates React Compiler is successfully memoizing components and reducing unnecessary re-renders. |

<details>
<summary>📖 About this metric</summary>

**What it measures:** Average time per component render

**UX Impact:** Indicates component complexity and optimization.

**Business Impact:** High values suggest components need optimization.

</details>

> ✓ **Statistically significant** (p < 0.05)

#### 📡 Network

#### ➖ numNetworkReqs

| | Value | Assessment |
|---|---|---|
| **Baseline** | 0 | 🟢 **0.0 requests** is excellent (target: <20 requests) |
| **Compiler** | 22.67 | 🟡 **22.7 requests** is acceptable (target: <50 requests) |
| **Change** | 0.0% | Minimal change in network requests (0.0%). |

<details>
<summary>📖 About this metric</summary>

**What it measures:** Number of network requests during flow

**UX Impact:** More requests = more latency, especially on slow connections.

**Business Impact:** Affects data costs for mobile users and server load.

</details>

> ⚠️ **High variance** - CV: 0% / 48%

#### ⏱️ Latency

#### ✅ interactionLatency

| | Value | Assessment |
|---|---|---|
| **Baseline** | 14.05s | 🟡 **14046.3 ms** is acceptable (target: <15000 ms) |
| **Compiler** | 13.61s | 🟡 **13614.7 ms** is acceptable (target: <15000 ms) |
| **Change** | -3.1% | 432ms improvement in interaction latency means faster, more responsive interactions. |

<details>
<summary>📖 About this metric</summary>

**What it measures:** Total time for user flow completion

**UX Impact:** Overall task completion time affects satisfaction.

**Business Impact:** Faster flows = better user retention and task completion.

</details>

#### 📋 Other Metrics

#### ➖ inpCount

| | Value | Assessment |
|---|---|---|
| **Baseline** | 3.67 | — |
| **Compiler** | 20 | — |
| **Change** | +445.5% | INP interaction count increased by 445.5% (informational metric). |

> ⚠️ **High variance** - CV: 141% / 0%

#### 💡 Recommendations

- ⚠️ Some metrics have high variance - interpret results with caution.
- React Compiler optimization is effective - 6 metric(s) improved.
- Focus on high-impact metrics: inp, inpCount, renderTime, averageRenderTime.

---

### Token Send ⚠️

**Summary:** 4 improvements, 0 regressions | **[PARTIAL DATA]**

#### 🌐 Web Vitals (Core Performance)

#### ➖ inp

| | Value | Assessment |
|---|---|---|
| **Baseline** | 0ms | 🟢 **0.0 ms** is excellent (target: <200 ms) |
| **Compiler** | 1.19s | 🔴 **1190.3 ms** is poor (+19% over threshold 1000 ms) |
| **Change** | 0.0% | Minimal change in Interaction to Next Paint (INP) (0.0%). |

<details>
<summary>📖 About this metric</summary>

**What it measures:** Time from user interaction to visual feedback

**UX Impact:** Directly affects perceived responsiveness. Users notice delays >100ms.

**Business Impact:** Poor INP correlates with higher bounce rates and lower engagement.

</details>

> ⚠️ **High variance** - CV: 0% / 151%

#### ✅ tbt

| | Value | Assessment |
|---|---|---|
| **Baseline** | 6ms | 🟢 **5.6 ms** is excellent (target: <200 ms) |
| **Compiler** | 4ms | 🟢 **3.7 ms** is excellent (target: <200 ms) |
| **Change** | -34.5% | 2ms improvement in Total Blocking Time (TBT) means faster, more responsive interactions. |

<details>
<summary>📖 About this metric</summary>

**What it measures:** Total time main thread was blocked during load

**UX Impact:** Blocked thread = unresponsive UI. Users may think app is frozen.

**Business Impact:** High TBT causes user frustration and abandonment.

</details>

> ❌ **Unreliable data** - CV: 58% / 142% (threshold: 50%)

#### ⚛️ React Performance

#### ✅ renderCount

| | Value | Assessment |
|---|---|---|
| **Baseline** | 32 | 🟢 **32.0 renders** is excellent (target: <50 renders) |
| **Compiler** | 31.50 | 🟢 **31.5 renders** is excellent (target: <50 renders) |
| **Change** | -1.6% | 1.6% reduction in React component renders indicates React Compiler is successfully memoizing components and reducing unnecessary re-renders. |

<details>
<summary>📖 About this metric</summary>

**What it measures:** Number of React component re-renders during flow

**UX Impact:** Excessive re-renders cause jank and slow interactions.

**Business Impact:** React Compiler should reduce this significantly via auto-memoization.

</details>

#### ✅ renderTime

| | Value | Assessment |
|---|---|---|
| **Baseline** | 124ms | 🟡 **124.3 ms** is acceptable (target: <500 ms) |
| **Compiler** | 107ms | 🟡 **107.4 ms** is acceptable (target: <500 ms) |
| **Change** | -13.6% | 13.6% reduction in total render time indicates React Compiler is successfully memoizing components and reducing unnecessary re-renders. |

<details>
<summary>📖 About this metric</summary>

**What it measures:** Total time spent in React render phase

**UX Impact:** Long render times block the main thread.

**Business Impact:** Key metric for React Compiler effectiveness.

</details>

> ✓ **Statistically significant** (p < 0.05)

#### ✅ averageRenderTime

| | Value | Assessment |
|---|---|---|
| **Baseline** | 3.68 | 🟡 **3.7 ms/render** is acceptable (target: <5 ms/render) |
| **Compiler** | 3.24 | 🟡 **3.2 ms/render** is acceptable (target: <5 ms/render) |
| **Change** | -12.1% | 12.1% reduction in average render time indicates React Compiler is successfully memoizing components and reducing unnecessary re-renders. |

<details>
<summary>📖 About this metric</summary>

**What it measures:** Average time per component render

**UX Impact:** Indicates component complexity and optimization.

**Business Impact:** High values suggest components need optimization.

</details>

#### 📡 Network

#### ➖ numNetworkReqs

| | Value | Assessment |
|---|---|---|
| **Baseline** | 0 | 🟢 **0.0 requests** is excellent (target: <20 requests) |
| **Compiler** | 12 | 🟢 **12.0 requests** is excellent (target: <20 requests) |
| **Change** | 0.0% | Minimal change in network requests (0.0%). |

<details>
<summary>📖 About this metric</summary>

**What it measures:** Number of network requests during flow

**UX Impact:** More requests = more latency, especially on slow connections.

**Business Impact:** Affects data costs for mobile users and server load.

</details>

> ⚠️ **High variance** - CV: 0% / 74%

#### ⏱️ Latency

#### ➖ interactionLatency

| | Value | Assessment |
|---|---|---|
| **Baseline** | 19.93s | 🟠 **19933.8 ms** needs improvement (+33% over target 15000 ms) |
| **Compiler** | 19.87s | 🟠 **19869.5 ms** needs improvement (+32% over target 15000 ms) |
| **Change** | -0.3% | Minimal change in interaction latency (-0.3%). |

<details>
<summary>📖 About this metric</summary>

**What it measures:** Total time for user flow completion

**UX Impact:** Overall task completion time affects satisfaction.

**Business Impact:** Faster flows = better user retention and task completion.

</details>

#### 📋 Other Metrics

#### ➖ inpCount

| | Value | Assessment |
|---|---|---|
| **Baseline** | 0 | — |
| **Compiler** | 3 | — |
| **Change** | 0.0% | INP interaction count increased by 0.0% (informational metric). |

#### 💡 Recommendations

- ⚠️ Some metrics have high variance - interpret results with caution.
- React Compiler optimization is effective - 3 metric(s) improved.
- Focus on high-impact metrics: inp.

---

### Tokens List Scrolling ⚠️

**Summary:** 4 improvements, 2 regressions | **[PARTIAL DATA]**

#### 🌐 Web Vitals (Core Performance)

#### ➖ inp

| | Value | Assessment |
|---|---|---|
| **Baseline** | 0ms | 🟢 **0.0 ms** is excellent (target: <200 ms) |
| **Compiler** | 196ms | 🟢 **196.0 ms** is excellent (target: <200 ms) |
| **Change** | 0.0% | Minimal change in Interaction to Next Paint (INP) (0.0%). |

<details>
<summary>📖 About this metric</summary>

**What it measures:** Time from user interaction to visual feedback

**UX Impact:** Directly affects perceived responsiveness. Users notice delays >100ms.

**Business Impact:** Poor INP correlates with higher bounce rates and lower engagement.

</details>

> ⚠️ **High variance** - CV: 0% / 80%

#### ✅ fcp

| | Value | Assessment |
|---|---|---|
| **Baseline** | 7.14s | 🔴 **7143.9 ms** is poor (+43% over threshold 5000 ms) |
| **Compiler** | 1.01s | 🟢 **1006.7 ms** is excellent (target: <1800 ms) |
| **Change** | -85.9% | 6137ms improvement in First Contentful Paint (FCP) means faster, more responsive interactions. |

<details>
<summary>📖 About this metric</summary>

**What it measures:** Time until first content appears on screen

**UX Impact:** Users perceive blank screens >1s as slow loading.

**Business Impact:** Every 100ms delay in FCP can reduce conversions by 1-2%.

</details>

> ❌ **Unreliable data** - CV: 98% / 95% (threshold: 50%)

#### ✅ tbt

| | Value | Assessment |
|---|---|---|
| **Baseline** | 4.42s | 🟠 **4416.7 ms** needs improvement (+47% over target 3000 ms) |
| **Compiler** | 3.88s | 🟠 **3877.0 ms** needs improvement (+29% over target 3000 ms) |
| **Change** | -12.2% | 540ms improvement in Total Blocking Time (TBT) means faster, more responsive interactions. |

<details>
<summary>📖 About this metric</summary>

**What it measures:** Total time main thread was blocked during load

**UX Impact:** Blocked thread = unresponsive UI. Users may think app is frozen.

**Business Impact:** High TBT causes user frustration and abandonment.

</details>

#### ⚛️ React Performance

#### ⚠️ renderCount

| | Value | Assessment |
|---|---|---|
| **Baseline** | 453.60 | 🟡 **453.6 renders** is acceptable (target: <500 renders) |
| **Compiler** | 461.17 | 🟡 **461.2 renders** is acceptable (target: <500 renders) |
| **Change** | +1.7% | 1.7% increase in React component renders suggests potential regression in component memoization. |

<details>
<summary>📖 About this metric</summary>

**What it measures:** Number of React component re-renders during flow

**UX Impact:** Excessive re-renders cause jank and slow interactions.

**Business Impact:** React Compiler should reduce this significantly via auto-memoization.

</details>

#### ✅ renderTime

| | Value | Assessment |
|---|---|---|
| **Baseline** | 3.65s | 🔴 **3645.5 ms** is poor (+265% over threshold 1000 ms) |
| **Compiler** | 3.39s | 🔴 **3390.9 ms** is poor (+239% over threshold 1000 ms) |
| **Change** | -7.0% | 7.0% reduction in total render time indicates React Compiler is successfully memoizing components and reducing unnecessary re-renders. |

<details>
<summary>📖 About this metric</summary>

**What it measures:** Total time spent in React render phase

**UX Impact:** Long render times block the main thread.

**Business Impact:** Key metric for React Compiler effectiveness.

</details>

#### ✅ averageRenderTime

| | Value | Assessment |
|---|---|---|
| **Baseline** | 8.06 | 🟠 **8.1 ms/render** needs improvement (+61% over target 5 ms/render) |
| **Compiler** | 7.35 | 🟠 **7.3 ms/render** needs improvement (+47% over target 5 ms/render) |
| **Change** | -8.8% | 8.8% reduction in average render time indicates React Compiler is successfully memoizing components and reducing unnecessary re-renders. |

<details>
<summary>📖 About this metric</summary>

**What it measures:** Average time per component render

**UX Impact:** Indicates component complexity and optimization.

**Business Impact:** High values suggest components need optimization.

</details>

#### 📡 Network

#### ➖ numNetworkReqs

| | Value | Assessment |
|---|---|---|
| **Baseline** | 0 | 🟢 **0.0 requests** is excellent (target: <20 requests) |
| **Compiler** | 42.33 | 🟡 **42.3 requests** is acceptable (target: <50 requests) |
| **Change** | 0.0% | Minimal change in network requests (0.0%). |

<details>
<summary>📖 About this metric</summary>

**What it measures:** Number of network requests during flow

**UX Impact:** More requests = more latency, especially on slow connections.

**Business Impact:** Affects data costs for mobile users and server load.

</details>

> ⚠️ **High variance** - CV: 0% / 45%

#### ⏱️ Latency

#### ⚠️ interactionLatency

| | Value | Assessment |
|---|---|---|
| **Baseline** | 13.19s | 🟡 **13192.2 ms** is acceptable (target: <15000 ms) |
| **Compiler** | 13.44s | 🟡 **13442.3 ms** is acceptable (target: <15000 ms) |
| **Change** | +1.9% | 250ms slower interaction latency - investigate potential performance regression. |

<details>
<summary>📖 About this metric</summary>

**What it measures:** Total time for user flow completion

**UX Impact:** Overall task completion time affects satisfaction.

**Business Impact:** Faster flows = better user retention and task completion.

</details>

#### 📋 Other Metrics

#### ➖ inpCount

| | Value | Assessment |
|---|---|---|
| **Baseline** | 0 | — |
| **Compiler** | 2 | — |
| **Change** | 0.0% | INP interaction count increased by 0.0% (informational metric). |

#### 💡 Recommendations

- ⚠️ Some metrics have high variance - interpret results with caution.
- Investigate 2 metric regression(s) in this flow.
- React Compiler optimization is effective - 3 metric(s) improved.
- Focus on high-impact metrics: inp, tbt.

---

### Nft List Scrolling ✅

**Summary:** 3 improvements, 0 regressions

<details>
<summary>⚠️ Data Quality Issues</summary>

- Baseline has insufficient iterations (3/4 minimum)
- Baseline had 1 error(s)

</details>

#### 🌐 Web Vitals (Core Performance)

#### ➖ inp

| | Value | Assessment |
|---|---|---|
| **Baseline** | 0ms | 🟢 **0.0 ms** is excellent (target: <200 ms) |
| **Compiler** | 25ms | 🟢 **25.2 ms** is excellent (target: <200 ms) |
| **Change** | 0.0% | Minimal change in Interaction to Next Paint (INP) (0.0%). |

<details>
<summary>📖 About this metric</summary>

**What it measures:** Time from user interaction to visual feedback

**UX Impact:** Directly affects perceived responsiveness. Users notice delays >100ms.

**Business Impact:** Poor INP correlates with higher bounce rates and lower engagement.

</details>

> ⚠️ **High variance** - CV: 0% / 122%

#### ✅ tbt

| | Value | Assessment |
|---|---|---|
| **Baseline** | 4.00s | 🟠 **3999.3 ms** needs improvement (+33% over target 3000 ms) |
| **Compiler** | 3.87s | 🟠 **3874.5 ms** needs improvement (+29% over target 3000 ms) |
| **Change** | -3.1% | 125ms improvement in Total Blocking Time (TBT) means faster, more responsive interactions. |

<details>
<summary>📖 About this metric</summary>

**What it measures:** Total time main thread was blocked during load

**UX Impact:** Blocked thread = unresponsive UI. Users may think app is frozen.

**Business Impact:** High TBT causes user frustration and abandonment.

</details>

#### ⚛️ React Performance

#### ➖ renderCount

| | Value | Assessment |
|---|---|---|
| **Baseline** | 542.67 | 🟡 **542.7 renders** is acceptable (target: <600 renders) |
| **Compiler** | 539.83 | 🟡 **539.8 renders** is acceptable (target: <600 renders) |
| **Change** | -0.5% | Minimal change in React component renders (-0.5%). |

<details>
<summary>📖 About this metric</summary>

**What it measures:** Number of React component re-renders during flow

**UX Impact:** Excessive re-renders cause jank and slow interactions.

**Business Impact:** React Compiler should reduce this significantly via auto-memoization.

</details>

#### ✅ renderTime

| | Value | Assessment |
|---|---|---|
| **Baseline** | 3.89s | 🔴 **3887.2 ms** is poor (+289% over threshold 1000 ms) |
| **Compiler** | 3.40s | 🔴 **3404.1 ms** is poor (+240% over threshold 1000 ms) |
| **Change** | -12.4% | 12.4% reduction in total render time indicates React Compiler is successfully memoizing components and reducing unnecessary re-renders. |

<details>
<summary>📖 About this metric</summary>

**What it measures:** Total time spent in React render phase

**UX Impact:** Long render times block the main thread.

**Business Impact:** Key metric for React Compiler effectiveness.

</details>

> ✓ **Statistically significant** (p < 0.05)

#### ✅ averageRenderTime

| | Value | Assessment |
|---|---|---|
| **Baseline** | 7.16 | 🟠 **7.2 ms/render** needs improvement (+43% over target 5 ms/render) |
| **Compiler** | 6.30 | 🟠 **6.3 ms/render** needs improvement (+26% over target 5 ms/render) |
| **Change** | -12.1% | 12.1% reduction in average render time indicates React Compiler is successfully memoizing components and reducing unnecessary re-renders. |

<details>
<summary>📖 About this metric</summary>

**What it measures:** Average time per component render

**UX Impact:** Indicates component complexity and optimization.

**Business Impact:** High values suggest components need optimization.

</details>

> ✓ **Statistically significant** (p < 0.05)

#### 📡 Network

#### ➖ numNetworkReqs

| | Value | Assessment |
|---|---|---|
| **Baseline** | 0 | 🟢 **0.0 requests** is excellent (target: <80 requests) |
| **Compiler** | 125.25 | 🟠 **125.3 requests** needs improvement (+4% over target 120 requests) |
| **Change** | 0.0% | Minimal change in network requests (0.0%). |

<details>
<summary>📖 About this metric</summary>

**What it measures:** Number of network requests during flow

**UX Impact:** More requests = more latency, especially on slow connections.

**Business Impact:** Affects data costs for mobile users and server load.

</details>

#### ⏱️ Latency

#### ➖ interactionLatency

| | Value | Assessment |
|---|---|---|
| **Baseline** | 13.11s | 🟡 **13107.0 ms** is acceptable (target: <15000 ms) |
| **Compiler** | 13.03s | 🟡 **13026.2 ms** is acceptable (target: <15000 ms) |
| **Change** | -0.6% | Minimal change in interaction latency (-0.6%). |

<details>
<summary>📖 About this metric</summary>

**What it measures:** Total time for user flow completion

**UX Impact:** Overall task completion time affects satisfaction.

**Business Impact:** Faster flows = better user retention and task completion.

</details>

#### ➖ scrollToLoadLatency

| | Value | Assessment |
|---|---|---|
| **Baseline** | 5.08s | 🔴 **5080.3 ms** is poor (+69% over threshold 3000 ms) |
| **Compiler** | 5.11s | 🔴 **5110.2 ms** is poor (+70% over threshold 3000 ms) |
| **Change** | +0.6% | Minimal change in scroll-to-load latency (+0.6%). |

<details>
<summary>📖 About this metric</summary>

**What it measures:** Time from scroll to content appearing

**UX Impact:** Affects infinite scroll and lazy-loading experiences.

**Business Impact:** Slow scroll-to-load reduces content engagement.

</details>

#### ➖ cumulativeLoadTime

| | Value | Assessment |
|---|---|---|
| **Baseline** | 10.16s | 🟠 **10160.7 ms** needs improvement (+27% over target 8000 ms) |
| **Compiler** | 10.22s | 🟠 **10220.3 ms** needs improvement (+28% over target 8000 ms) |
| **Change** | +0.6% | Minimal change in cumulative load time (+0.6%). |

<details>
<summary>📖 About this metric</summary>

**What it measures:** Total time loading all assets during flow

**UX Impact:** Affects overall flow experience.

**Business Impact:** High cumulative load times indicate optimization opportunities.

</details>

#### 📋 Other Metrics

#### ➖ inpCount

| | Value | Assessment |
|---|---|---|
| **Baseline** | 0 | — |
| **Compiler** | 1 | — |
| **Change** | 0.0% | INP interaction count increased by 0.0% (informational metric). |

> ⚠️ **High variance** - CV: 0% / 100%

#### ➖ scrollEventCount

| | Value | Assessment |
|---|---|---|
| **Baseline** | 2 | — |
| **Compiler** | 2 | — |
| **Change** | 0.0% | scrollEventCount decreased by 0.0% (informational metric). |

#### ➖ totalScrollDistance

| | Value | Assessment |
|---|---|---|
| **Baseline** | 0 | — |
| **Compiler** | 0 | — |
| **Change** | 0.0% | totalScrollDistance decreased by 0.0% (informational metric). |

#### ➖ assetsLoadedPerScroll

| | Value | Assessment |
|---|---|---|
| **Baseline** | 0 | — |
| **Compiler** | 0 | — |
| **Change** | 0.0% | assetsLoadedPerScroll decreased by 0.0% (informational metric). |

#### 💡 Recommendations

- React Compiler optimization is effective - 3 metric(s) improved.

---

## 📌 Key Findings

- Power User: Tab Switching: 18.7% improvement in averageRenderTime (1.66 → 1.35)
- ⚠️ Power User: Network Adding: 7364.3% regression in inp (24ms → 1.75s) (⚠️ partial data)
- Power User: Import Srp: 21.7% improvement in renderTime (344ms → 269ms)
- Power User: Import Srp: 21.8% improvement in averageRenderTime (1.52 → 1.19)
- Power User: Token Search: 94.0% improvement in inp (240ms → 14ms) (⚠️ partial data)
- Power User: Token Search: 33.1% improvement in renderTime (158ms → 106ms)
- Power User: Token Search: 32.2% improvement in averageRenderTime (4.74 → 3.21)
- Power User: Tokens List Scrolling: 12.2% improvement in tbt (4.42s → 3.88s)

## ⚠️ Data Quality Warnings

- Power User: Tab Switching: Baseline only has 3 iterations
- Power User: Network Adding: Compiler only has 3 iterations
- Power User: Import Srp: Baseline only has 2 iterations
- Power User: Import Srp: Compiler only has 2 iterations
- Power User: Token Search: Baseline only has 3 iterations
- Power User: Token Search: fcp shows 98.6% change (14.80s → 201ms) but data is UNRELIABLE (CV: baseline 42%, compiler 37%)
- Power User: Tokens List Scrolling: fcp shows 85.9% change (7.14s → 1.01s) but data is UNRELIABLE (CV: baseline 98%, compiler 95%)
- Power User: Nft List Scrolling: Baseline only has 3 iterations

