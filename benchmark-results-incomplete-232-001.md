# React Compiler Benchmark Comparison Report

**Generated:** 2025-12-03T16:24:40.175Z

| | Baseline | Compiler |
|---|---|---|
| **File** | benchmark-baseline-incomplete-232-001.json | benchmark-compiler-incomplete-232-001.json |
| **Duration** | 50m 28s | 47m 51s |
| **Flows** | 7/7 | 6/7 |

---

## Executive Summary

### ⚠️ Data Quality Warnings

**14 of 63 metrics have unreliable data** (high variance or insufficient samples).

Key issues:
  • Power User: Tab Switching: inp shows 2837.9% change (3ms → 92ms) but data is UNRELIABLE (CV: baseline 200%, compiler 123%)
  • Power User: Tab Switching: fcp shows 83.6% change (2.23s → 366ms) but data is UNRELIABLE (CV: baseline 74%, compiler 46%)
  • Power User: Account Switching: fcp shows 61.3% change (531ms → 206ms) but data is UNRELIABLE (CV: baseline 67%, compiler 60%)
  • Power User: Token Search: inp shows 1305.0% change (5ms → 74ms) but data is UNRELIABLE (CV: baseline 142%, compiler 190%)

**Flow Reliability:**
| Status | Count | Flows |
|--------|-------|-------|
| ⚠️ Partial | 6 | Tab Switching, Account Switching, Network Switching, Token Search, Tokens List Scrolling, Nft List Scrolling |

### Overall Assessment

❌ **NET NEGATIVE**: More regressions than improvements detected.

### Statistics Overview (Reliable Data Only)

| Category | Count | Percentage |
|----------|-------|------------|
| Improvements | 8 | 16.3% |
| Regressions | 14 | 28.6% |
| Neutral | 27 | 55.1% |
| **Reliable Metrics** | 49 | - |
| ~~Unreliable (excluded)~~ | 14 | - |

### Performance by Category (Reliable Data)

| Category | Avg Change | Interpretation |
|----------|------------|----------------|
| React Rendering | +2.7% | ⚠️ 2.7% worse |
| Web Vitals (INP/FCP/TBT) | +8.8% | ⚠️ 8.8% worse |
| Network Requests | +13.6% | ⚠️ 13.6% worse |
| Interaction Latency | +7.8% | ⚠️ 7.8% worse |

### Key Observations

**Top Improvements (Not Statistically Verified):**
  • Power User: Token Search: fcp improved by 59.0% (330ms → 135ms) (needs more data)
  • Power User: Nft List Scrolling: inp improved by 51.4% (56ms → 27ms) (needs more data)
  • Power User: Network Switching: fcp improved by 37.3% (382ms → 239ms) (needs more data)
  • Power User: Tab Switching: interactionLatency improved by 19.7% (11.24s → 9.03s) (needs more data)
  • Power User: Network Switching: renderCount improved by 8.1% (92.50 → 85) (needs more data)

**Areas Needing Attention:**
  • Power User: Account Switching: inp regressed by 146.1% (175ms → 431ms) (may be noise)
  • Power User: Account Switching: interactionLatency regressed by 81.3% (5.57s → 10.09s) (may be noise)
  • Power User: Tokens List Scrolling: numNetworkReqs regressed by 65.0% (16.67 → 27.50) (statistically significant)
  • Power User: Tokens List Scrolling: fcp regressed by 51.2% (369ms → 559ms) (may be noise)
  • Power User: Network Switching: inp regressed by 29.5% (105ms → 136ms) (may be noise)

### Statistical Notes

- Results exclude metrics with CV > 50% (unreliable data)
- "Statistically significant" uses Welch's t-test at α=0.05
- Metrics marked "partial" have high variance in one dataset (CV 30-50%)
- Consider running more iterations for flows with data quality warnings


---

## 📊 Complete Data

All measurements comparing Baseline vs React Compiler.

### Tab Switching ⚠️


| Metric | Baseline | Compiler | Change | Sig? |
|--------|----------|----------|--------|------|
| numNetworkReqs | 81.50 | 93.33 | ⚠️ +14.5% |  |
| inp | 3ms | 92ms | ⚠️ +2837.9% | ❌ |
| inpCount | 4.20 | 5.17 | ➖ +23.0% |  |
| renderCount | 546.33 | 546.80 | ➖ +0.1% |  |
| renderTime | 1.24s | 1.23s | ➖ -0.5% |  |
| averageRenderTime | 2.26 | 2.25 | ➖ -0.4% |  |
| interactionLatency | 11.24s | 9.03s | ✅ -19.7% |  |
| fcp | 2.23s | 366ms | ✅ -83.6% | ✓ |
| tbt | 843ms | 847ms | ➖ +0.5% |  |

> ⚠️ Some metrics have high variance

### Account Switching ⚠️


| Metric | Baseline | Compiler | Change | Sig? |
|--------|----------|----------|--------|------|
| numNetworkReqs | 134.50 | 135.83 | ➖ +1.0% |  |
| inp | 175ms | 431ms | ⚠️ +146.1% |  |
| inpCount | 12 | 11.60 | ➖ -3.3% |  |
| renderCount | 256.60 | 256.50 | ➖ -0.0% |  |
| renderTime | 297ms | 284ms | ✅ -4.6% |  |
| averageRenderTime | 1.18 | 1.11 | ✅ -6.6% |  |
| interactionLatency | 5.57s | 10.09s | ⚠️ +81.3% |  |
| fcp | 531ms | 206ms | ✅ -61.3% | ❌ |
| tbt | 16ms | 3ms | ✅ -81.5% | ✓ |

> ⚠️ Some metrics have high variance

### Network Switching ⚠️


| Metric | Baseline | Compiler | Change | Sig? |
|--------|----------|----------|--------|------|
| numNetworkReqs | 142 | 133 | ✅ -6.3% |  |
| inp | 105ms | 136ms | ⚠️ +29.5% |  |
| inpCount | 12 | 12 | ➖ 0.0% |  |
| renderCount | 92.50 | 85 | ✅ -8.1% |  |
| renderTime | 366ms | 413ms | ⚠️ +12.8% |  |
| averageRenderTime | 3.99 | 4.86 | ⚠️ +21.8% |  |
| fcp | 382ms | 239ms | ✅ -37.3% |  |
| tbt | 71ms | 49ms | ✅ -31.1% | ❌ |

> ⚠️ Some metrics have high variance

### Token Search ⚠️


| Metric | Baseline | Compiler | Change | Sig? |
|--------|----------|----------|--------|------|
| numNetworkReqs | 4.67 | 5 | ⚠️ +7.1% |  |
| inp | 5ms | 74ms | ⚠️ +1305.0% | ❌ |
| inpCount | 7.33 | 8.33 | ➖ +13.6% | ❌ |
| renderCount | 34.33 | 35 | ⚠️ +1.9% |  |
| renderTime | 100ms | 113ms | ⚠️ +12.6% |  |
| averageRenderTime | 2.90 | 3.14 | ⚠️ +8.1% |  |
| interactionLatency | 14.71s | 15.78s | ⚠️ +7.3% |  |
| fcp | 330ms | 135ms | ✅ -59.0% |  |
| tbt | 0ms | 2ms | ➖ 0.0% |  |

> ⚠️ Some metrics have high variance

### Tokens List Scrolling ⚠️


| Metric | Baseline | Compiler | Change | Sig? |
|--------|----------|----------|--------|------|
| numNetworkReqs | 16.67 | 27.50 | ⚠️ +65.0% | ✓ |
| inp | 0ms | 132ms | ➖ 0.0% |  |
| inpCount | 0 | 1.33 | ➖ 0.0% | ✓ |
| renderCount | 438.33 | 446.50 | ⚠️ +1.9% |  |
| renderTime | 2.34s | 2.48s | ⚠️ +6.3% | ❌ |
| averageRenderTime | 5.26 | 5.47 | ⚠️ +4.0% | ❌ |
| interactionLatency | 12.73s | 12.85s | ➖ +0.9% |  |
| fcp | 369ms | 559ms | ⚠️ +51.2% |  |
| tbt | 2.74s | 2.65s | ✅ -3.2% | ❌ |
| scrollToLoadLatency | 5.05s | 5.06s | ➖ +0.2% |  |
| scrollEventCount | 2 | 2 | ➖ 0.0% |  |
| totalScrollDistance | 600 | 600 | ➖ 0.0% |  |
| assetsLoadedPerScroll | 0 | 0 | ➖ 0.0% |  |
| cumulativeLoadTime | 10.10s | 10.12s | ➖ +0.2% |  |

> ⚠️ Some metrics have high variance

### Nft List Scrolling ⚠️


| Metric | Baseline | Compiler | Change | Sig? |
|--------|----------|----------|--------|------|
| numNetworkReqs | 114.60 | 115 | ➖ +0.3% |  |
| inp | 56ms | 27ms | ✅ -51.4% |  |
| inpCount | 2 | 0.50 | ➖ -75.0% | ✓ |
| renderCount | 536.67 | 533.67 | ➖ -0.6% |  |
| renderTime | 2.48s | 2.38s | ✅ -4.2% | ❌ |
| averageRenderTime | 4.59 | 4.43 | ✅ -3.4% | ❌ |
| interactionLatency | 12.58s | 12.66s | ➖ +0.7% |  |
| fcp | 305ms | 379ms | ⚠️ +24.2% | ❌ |
| tbt | 2.29s | 2.24s | ✅ -2.3% | ❌ |
| scrollToLoadLatency | 5.07s | 5.05s | ➖ -0.4% |  |
| scrollEventCount | 2 | 2 | ➖ 0.0% |  |
| totalScrollDistance | 600 | 600 | ➖ 0.0% |  |
| assetsLoadedPerScroll | 0 | 0 | ➖ 0.0% |  |
| cumulativeLoadTime | 10.14s | 10.11s | ➖ -0.4% |  |

> ⚠️ Some metrics have high variance

**Legend:** ✅ Improved | ⚠️ Regressed | ➖ No change | ✓ Statistically significant | ❌ Unreliable

---

## ⚛️ React Compiler Impact by Flow

Focus on key metrics that React Compiler directly affects: **renderCount**, **renderTime**, and downstream effects on **INP** and **TBT**.

### Tab Switching ⚠️

**🎯 React Compiler Effectiveness:**

- **Render Count:** 546.33 → 546.80 (+0.1%) ➖ No significant change
- **Render Time:** 1.24s → 1.23s (-0.5%) ➖ No significant change

**📊 Downstream Effects:**

- **inp:** 3ms → 92ms (+2837.9%) ⚠️
- **averageRenderTime:** 2.26 → 2.25 (-0.4%) ➖
- **interactionLatency:** 11.24s → 9.03s (-19.7%) ✅
- **tbt:** 843ms → 847ms (+0.5%) ➖

> ⚠️ **Data Quality:** Some metrics have high variance - interpret with caution

<details>
<summary>📖 How React Compiler affects these metrics</summary>

**numNetworkReqs:** Not directly affected. Changes may indicate useEffect optimization or side effect deduplication.

**inp:** React Compiler reduces INP by memoizing components, preventing re-renders that block the main thread.

**renderCount:** ⭐ PRIMARY METRIC - React Compiler auto-memoizes to skip unnecessary renders.

**renderTime:** ⭐ PRIMARY METRIC - Directly measures time saved by skipping renders.

**averageRenderTime:** May increase slightly if cheap renders are eliminated, leaving only necessary ones.

**interactionLatency:** Benefits from reduced render time. Faster renders = faster flow completion.

**fcp:** FCP is less affected by React Compiler - it measures initial paint before React hydration.

**tbt:** React Compiler reduces TBT by eliminating unnecessary render work that blocks the main thread.

</details>

<details>
<summary>📋 Other Metrics</summary>

| Metric | Baseline | Compiler | Change |
|--------|----------|----------|--------|
| numNetworkReqs | 81.50 | 93.33 | ⚠️ +14.5% |
| inpCount | 4.20 | 5.17 | ➖ +23.0% |
| fcp | 2.23s | 366ms | ✅ -83.6% |

</details>

---

### Account Switching ⚠️

**🎯 React Compiler Effectiveness:**

- **Render Count:** 256.60 → 256.50 (-0.0%) ➖ No significant change
- **Render Time:** 297ms → 284ms (-4.6%) ✅ Less render work

**📊 Downstream Effects:**

- **inp:** 175ms → 431ms (+146.1%) ⚠️
- **averageRenderTime:** 1.18 → 1.11 (-6.6%) ✅
- **interactionLatency:** 5.57s → 10.09s (+81.3%) ⚠️
- **tbt:** 16ms → 3ms (-81.5%) ✅

> ⚠️ **Data Quality:** Some metrics have high variance - interpret with caution

<details>
<summary>📖 How React Compiler affects these metrics</summary>

**numNetworkReqs:** Not directly affected. Changes may indicate useEffect optimization or side effect deduplication.

**inp:** React Compiler reduces INP by memoizing components, preventing re-renders that block the main thread.

**renderCount:** ⭐ PRIMARY METRIC - React Compiler auto-memoizes to skip unnecessary renders.

**renderTime:** ⭐ PRIMARY METRIC - Directly measures time saved by skipping renders.

**averageRenderTime:** May increase slightly if cheap renders are eliminated, leaving only necessary ones.

**interactionLatency:** Benefits from reduced render time. Faster renders = faster flow completion.

**fcp:** FCP is less affected by React Compiler - it measures initial paint before React hydration.

**tbt:** React Compiler reduces TBT by eliminating unnecessary render work that blocks the main thread.

</details>

<details>
<summary>📋 Other Metrics</summary>

| Metric | Baseline | Compiler | Change |
|--------|----------|----------|--------|
| numNetworkReqs | 134.50 | 135.83 | ➖ +1.0% |
| inpCount | 12 | 11.60 | ➖ -3.3% |
| fcp | 531ms | 206ms | ✅ -61.3% |

</details>

---

### Network Switching ⚠️

**🎯 React Compiler Effectiveness:**

- **Render Count:** 92.50 → 85 (-8.1%) ✅ Fewer re-renders
- **Render Time:** 366ms → 413ms (+12.8%) ⚠️ More render work

**📊 Downstream Effects:**

- **inp:** 105ms → 136ms (+29.5%) ⚠️
- **averageRenderTime:** 3.99 → 4.86 (+21.8%) ⚠️
- **tbt:** 71ms → 49ms (-31.1%) ✅

> ⚠️ **Data Quality:** Some metrics have high variance - interpret with caution

<details>
<summary>📖 How React Compiler affects these metrics</summary>

**numNetworkReqs:** Not directly affected. Changes may indicate useEffect optimization or side effect deduplication.

**inp:** React Compiler reduces INP by memoizing components, preventing re-renders that block the main thread.

**renderCount:** ⭐ PRIMARY METRIC - React Compiler auto-memoizes to skip unnecessary renders.

**renderTime:** ⭐ PRIMARY METRIC - Directly measures time saved by skipping renders.

**averageRenderTime:** May increase slightly if cheap renders are eliminated, leaving only necessary ones.

**fcp:** FCP is less affected by React Compiler - it measures initial paint before React hydration.

**tbt:** React Compiler reduces TBT by eliminating unnecessary render work that blocks the main thread.

</details>

<details>
<summary>📋 Other Metrics</summary>

| Metric | Baseline | Compiler | Change |
|--------|----------|----------|--------|
| numNetworkReqs | 142 | 133 | ✅ -6.3% |
| inpCount | 12 | 12 | ➖ 0.0% |
| fcp | 382ms | 239ms | ✅ -37.3% |

</details>

---

### Token Search ⚠️

**🎯 React Compiler Effectiveness:**

- **Render Count:** 34.33 → 35 (+1.9%) ⚠️ More re-renders
- **Render Time:** 100ms → 113ms (+12.6%) ⚠️ More render work

**📊 Downstream Effects:**

- **inp:** 5ms → 74ms (+1305.0%) ⚠️
- **averageRenderTime:** 2.90 → 3.14 (+8.1%) ⚠️
- **interactionLatency:** 14.71s → 15.78s (+7.3%) ⚠️
- **tbt:** 0ms → 2ms (0.0%) ➖

> ⚠️ **Data Quality:** Some metrics have high variance - interpret with caution

<details>
<summary>📖 How React Compiler affects these metrics</summary>

**numNetworkReqs:** Not directly affected. Changes may indicate useEffect optimization or side effect deduplication.

**inp:** React Compiler reduces INP by memoizing components, preventing re-renders that block the main thread.

**renderCount:** ⭐ PRIMARY METRIC - React Compiler auto-memoizes to skip unnecessary renders.

**renderTime:** ⭐ PRIMARY METRIC - Directly measures time saved by skipping renders.

**averageRenderTime:** May increase slightly if cheap renders are eliminated, leaving only necessary ones.

**interactionLatency:** Benefits from reduced render time. Faster renders = faster flow completion.

**fcp:** FCP is less affected by React Compiler - it measures initial paint before React hydration.

**tbt:** React Compiler reduces TBT by eliminating unnecessary render work that blocks the main thread.

</details>

<details>
<summary>📋 Other Metrics</summary>

| Metric | Baseline | Compiler | Change |
|--------|----------|----------|--------|
| numNetworkReqs | 4.67 | 5 | ⚠️ +7.1% |
| inpCount | 7.33 | 8.33 | ➖ +13.6% |
| fcp | 330ms | 135ms | ✅ -59.0% |

</details>

---

### Tokens List Scrolling ⚠️

**🎯 React Compiler Effectiveness:**

- **Render Count:** 438.33 → 446.50 (+1.9%) ⚠️ More re-renders
- **Render Time:** 2.34s → 2.48s (+6.3%) ⚠️ More render work

**📊 Downstream Effects:**

- **inp:** 0ms → 132ms (0.0%) ➖
- **averageRenderTime:** 5.26 → 5.47 (+4.0%) ⚠️
- **interactionLatency:** 12.73s → 12.85s (+0.9%) ➖
- **tbt:** 2.74s → 2.65s (-3.2%) ✅

> ⚠️ **Data Quality:** Some metrics have high variance - interpret with caution

<details>
<summary>📖 How React Compiler affects these metrics</summary>

**numNetworkReqs:** Not directly affected. Changes may indicate useEffect optimization or side effect deduplication.

**inp:** React Compiler reduces INP by memoizing components, preventing re-renders that block the main thread.

**renderCount:** ⭐ PRIMARY METRIC - React Compiler auto-memoizes to skip unnecessary renders.

**renderTime:** ⭐ PRIMARY METRIC - Directly measures time saved by skipping renders.

**averageRenderTime:** May increase slightly if cheap renders are eliminated, leaving only necessary ones.

**interactionLatency:** Benefits from reduced render time. Faster renders = faster flow completion.

**fcp:** FCP is less affected by React Compiler - it measures initial paint before React hydration.

**tbt:** React Compiler reduces TBT by eliminating unnecessary render work that blocks the main thread.

**scrollToLoadLatency:** Benefits from memoized list items that render faster during virtualized scrolling.

**cumulativeLoadTime:** Network-bound metric, not directly affected by React Compiler.

</details>

<details>
<summary>📋 Other Metrics</summary>

| Metric | Baseline | Compiler | Change |
|--------|----------|----------|--------|
| numNetworkReqs | 16.67 | 27.50 | ⚠️ +65.0% |
| inpCount | 0 | 1.33 | ➖ 0.0% |
| fcp | 369ms | 559ms | ⚠️ +51.2% |
| scrollToLoadLatency | 5.05s | 5.06s | ➖ +0.2% |
| scrollEventCount | 2 | 2 | ➖ 0.0% |
| totalScrollDistance | 600 | 600 | ➖ 0.0% |
| assetsLoadedPerScroll | 0 | 0 | ➖ 0.0% |
| cumulativeLoadTime | 10.10s | 10.12s | ➖ +0.2% |

</details>

---

### Nft List Scrolling ⚠️

**🎯 React Compiler Effectiveness:**

- **Render Count:** 536.67 → 533.67 (-0.6%) ➖ No significant change
- **Render Time:** 2.48s → 2.38s (-4.2%) ✅ Less render work

**📊 Downstream Effects:**

- **inp:** 56ms → 27ms (-51.4%) ✅
- **averageRenderTime:** 4.59 → 4.43 (-3.4%) ✅
- **interactionLatency:** 12.58s → 12.66s (+0.7%) ➖
- **tbt:** 2.29s → 2.24s (-2.3%) ✅

> ⚠️ **Data Quality:** Some metrics have high variance - interpret with caution

<details>
<summary>📖 How React Compiler affects these metrics</summary>

**numNetworkReqs:** Not directly affected. Changes may indicate useEffect optimization or side effect deduplication.

**inp:** React Compiler reduces INP by memoizing components, preventing re-renders that block the main thread.

**renderCount:** ⭐ PRIMARY METRIC - React Compiler auto-memoizes to skip unnecessary renders.

**renderTime:** ⭐ PRIMARY METRIC - Directly measures time saved by skipping renders.

**averageRenderTime:** May increase slightly if cheap renders are eliminated, leaving only necessary ones.

**interactionLatency:** Benefits from reduced render time. Faster renders = faster flow completion.

**fcp:** FCP is less affected by React Compiler - it measures initial paint before React hydration.

**tbt:** React Compiler reduces TBT by eliminating unnecessary render work that blocks the main thread.

**scrollToLoadLatency:** Benefits from memoized list items that render faster during virtualized scrolling.

**cumulativeLoadTime:** Network-bound metric, not directly affected by React Compiler.

</details>

<details>
<summary>📋 Other Metrics</summary>

| Metric | Baseline | Compiler | Change |
|--------|----------|----------|--------|
| numNetworkReqs | 114.60 | 115 | ➖ +0.3% |
| inpCount | 2 | 0.50 | ➖ -75.0% |
| fcp | 305ms | 379ms | ⚠️ +24.2% |
| scrollToLoadLatency | 5.07s | 5.05s | ➖ -0.4% |
| scrollEventCount | 2 | 2 | ➖ 0.0% |
| totalScrollDistance | 600 | 600 | ➖ 0.0% |
| assetsLoadedPerScroll | 0 | 0 | ➖ 0.0% |
| cumulativeLoadTime | 10.14s | 10.11s | ➖ -0.4% |

</details>

---

## 📌 Key Findings

- ⚠️ Power User: Account Switching: 146.1% regression in inp (175ms → 431ms) (⚠️ partial data)
- ⚠️ Power User: Account Switching: 81.3% regression in interactionLatency (5.57s → 10.09s) (⚠️ partial data)
- ⚠️ Power User: Network Switching: 21.8% regression in averageRenderTime (3.99 → 4.86) (⚠️ partial data)
- ⚠️ Power User: Tokens List Scrolling: 65.0% regression in numNetworkReqs (16.67 → 27.50)

## ⚠️ Data Quality Warnings

- Power User: Tab Switching: inp shows 2837.9% change (3ms → 92ms) but data is UNRELIABLE (CV: baseline 200%, compiler 123%)
- Power User: Tab Switching: fcp shows 83.6% change (2.23s → 366ms) but data is UNRELIABLE (CV: baseline 74%, compiler 46%)
- Power User: Account Switching: fcp shows 61.3% change (531ms → 206ms) but data is UNRELIABLE (CV: baseline 67%, compiler 60%)
- Power User: Token Search: inp shows 1305.0% change (5ms → 74ms) but data is UNRELIABLE (CV: baseline 142%, compiler 190%)

