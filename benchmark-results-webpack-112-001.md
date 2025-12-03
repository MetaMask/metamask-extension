# React Compiler Benchmark Comparison Report

**Generated:** 2025-12-02T20:37:07.977Z

| | Baseline | Compiler |
|---|---|---|
| **File** | benchmark-baseline-webpack-112-001.json | benchmark-compiler-webpack-112-001.json |
| **Duration** | 23m 43s | 24m 7s |
| **Flows** | 8/9 | 7/9 |

---

## Executive Summary

### ⚠️ Data Quality Warnings

**0 of 59 metrics have unreliable data** (high variance or insufficient samples).

Key issues:
  • Power User: Tab Switching: Baseline only has 1 iterations
  • Power User: Tab Switching: Compiler only has 1 iterations
  • Power User: Account Switching: Baseline only has 1 iterations
  • Power User: Account Switching: Compiler only has 1 iterations
  • Power User: Network Switching: Baseline only has 1 iterations
  • ... and 9 more warnings

**Flow Reliability:**
| Status | Count | Flows |
|--------|-------|-------|
| ✅ Reliable | 7 | Tab Switching, Account Switching, Network Switching, Token Search, Token Send, Tokens List Scrolling, Nft List Scrolling |

### Overall Assessment

✅ **NET POSITIVE**: Significantly more improvements than regressions.

### Statistics Overview (Reliable Data Only)

| Category | Count | Percentage |
|----------|-------|------------|
| Improvements | 29 | 49.2% |
| Regressions | 15 | 25.4% |
| Neutral | 15 | 25.4% |
| **Reliable Metrics** | 59 | - |
| ~~Unreliable (excluded)~~ | 0 | - |

### Performance by Category (Reliable Data)

| Category | Avg Change | Interpretation |
|----------|------------|----------------|
| React Rendering | +5.2% | ⚠️ 5.2% worse |
| Web Vitals (INP/FCP/TBT) | +40.8% | ⚠️ 40.8% worse |
| Network Requests | -7.8% | ✅ 7.8% better |
| Interaction Latency | -4.0% | ✅ 4.0% better |

### Key Observations

**Top Improvements (Not Statistically Verified):**
  • Power User: Token Send: tbt improved by 100.0% (235ms → 0ms) (needs more data)
  • Power User: Network Switching: inp improved by 99.3% (10.21s → 70ms) (needs more data)
  • Power User: Token Send: inp improved by 98.7% (10.23s → 132ms) (needs more data)
  • Power User: Nft List Scrolling: inp improved by 98.7% (3.93s → 53ms) (needs more data)
  • Power User: Network Switching: fcp improved by 98.1% (15.08s → 293ms) (needs more data)

**Areas Needing Attention:**
  • Power User: Nft List Scrolling: fcp regressed by 1131.2% (617ms → 7.60s) (may be noise)
  • Power User: Tab Switching: inp regressed by 125.8% (10.12s → 22.85s) (may be noise)
  • Power User: Tab Switching: renderTime regressed by 119.9% (1.68s → 3.70s) (may be noise)
  • Power User: Tab Switching: averageRenderTime regressed by 114.1% (3.05 → 6.53) (may be noise)
  • Power User: Tab Switching: tbt regressed by 102.0% (1.74s → 3.51s) (may be noise)

### Statistical Notes

- Results exclude metrics with CV > 50% (unreliable data)
- "Statistically significant" uses Welch's t-test at α=0.05
- Metrics marked "partial" have high variance in one dataset (CV 30-50%)
- Consider running more iterations for flows with data quality warnings


---

## 📊 Complete Data

All measurements comparing Baseline vs React Compiler.

### Tab Switching ✅
*0 improved, 6 regressed*

| Metric | Baseline | Compiler | Change | Sig? |
|--------|----------|----------|--------|------|
| numNetworkReqs | 129 | 139 | ⚠️ +7.8% |  |
| inp | 10.12s | 22.85s | ⚠️ +125.8% |  |
| inpCount | 8 | 8 | ➖ 0.0% |  |
| renderCount | 551 | 566 | ⚠️ +2.7% |  |
| renderTime | 1.68s | 3.70s | ⚠️ +119.9% |  |
| averageRenderTime | 3.05 | 6.53 | ⚠️ +114.1% |  |
| tbt | 1.74s | 3.51s | ⚠️ +102.0% |  |

### Account Switching ✅
*6 improved, 0 regressed*

| Metric | Baseline | Compiler | Change | Sig? |
|--------|----------|----------|--------|------|
| numNetworkReqs | 182 | 178 | ✅ -2.2% |  |
| inp | 16.58s | 10.24s | ✅ -38.2% |  |
| inpCount | 12 | 10 | ➖ -16.7% |  |
| renderCount | 285 | 264 | ✅ -7.4% |  |
| renderTime | 701ms | 599ms | ✅ -14.6% |  |
| averageRenderTime | 2.46 | 2.27 | ✅ -7.8% |  |
| tbt | 727ms | 389ms | ✅ -46.5% |  |

### Network Switching ✅
*6 improved, 0 regressed*

| Metric | Baseline | Compiler | Change | Sig? |
|--------|----------|----------|--------|------|
| numNetworkReqs | 53 | 36 | ✅ -32.1% |  |
| inp | 10.21s | 70ms | ✅ -99.3% |  |
| inpCount | 2 | 6 | ➖ +200.0% |  |
| renderCount | 32 | 32 | ➖ 0.0% |  |
| renderTime | 161ms | 132ms | ✅ -18.2% |  |
| averageRenderTime | 5.04 | 4.12 | ✅ -18.2% |  |
| fcp | 15.08s | 293ms | ✅ -98.1% |  |
| tbt | 58ms | 12ms | ✅ -79.3% |  |

### Token Search ✅
*1 improved, 3 regressed*

| Metric | Baseline | Compiler | Change | Sig? |
|--------|----------|----------|--------|------|
| numNetworkReqs | 11 | 16 | ⚠️ +45.5% |  |
| inp | 10.12s | 10.13s | ➖ +0.1% |  |
| inpCount | 2 | 2 | ➖ 0.0% |  |
| renderCount | 40 | 38 | ✅ -5.0% |  |
| renderTime | 116ms | 151ms | ⚠️ +30.4% |  |
| averageRenderTime | 2.90 | 3.97 | ⚠️ +37.3% |  |
| tbt | 0ms | 16ms | ➖ 0.0% |  |

### Token Send ✅
*6 improved, 0 regressed*

| Metric | Baseline | Compiler | Change | Sig? |
|--------|----------|----------|--------|------|
| numNetworkReqs | 26 | 17 | ✅ -34.6% |  |
| inp | 10.23s | 132ms | ✅ -98.7% |  |
| inpCount | 3 | 7 | ➖ +133.3% |  |
| renderCount | 83 | 77 | ✅ -7.2% |  |
| renderTime | 416ms | 207ms | ✅ -50.4% |  |
| averageRenderTime | 5.01 | 2.68 | ✅ -46.5% |  |
| tbt | 235ms | 0ms | ✅ -100.0% |  |

### Tokens List Scrolling ✅
*3 improved, 4 regressed*

| Metric | Baseline | Compiler | Change | Sig? |
|--------|----------|----------|--------|------|
| numNetworkReqs | 52 | 31 | ✅ -40.4% |  |
| inp | 315ms | 239ms | ✅ -24.3% |  |
| inpCount | 2 | 2 | ➖ 0.0% |  |
| renderCount | 462 | 464 | ➖ +0.4% |  |
| renderTime | 3.59s | 3.70s | ⚠️ +3.0% |  |
| averageRenderTime | 7.78 | 7.98 | ⚠️ +2.6% |  |
| interactionLatency | 14.49s | 13.27s | ✅ -8.4% |  |
| fcp | 860ms | 994ms | ⚠️ +15.6% |  |
| tbt | 4.20s | 4.55s | ⚠️ +8.5% |  |

### Nft List Scrolling ✅
*7 improved, 2 regressed*

| Metric | Baseline | Compiler | Change | Sig? |
|--------|----------|----------|--------|------|
| numNetworkReqs | 137 | 139 | ⚠️ +1.5% |  |
| inp | 3.93s | 53ms | ✅ -98.7% |  |
| inpCount | 2 | 1 | ➖ -50.0% |  |
| renderCount | 539 | 535 | ➖ -0.7% |  |
| renderTime | 3.71s | 3.23s | ✅ -12.9% |  |
| averageRenderTime | 6.88 | 6.04 | ✅ -12.3% |  |
| interactionLatency | 15.07s | 14.67s | ✅ -2.7% |  |
| fcp | 617ms | 7.60s | ⚠️ +1131.2% |  |
| tbt | 4.74s | 4.44s | ✅ -6.3% |  |
| scrollToLoadLatency | 5.87s | 5.72s | ✅ -2.5% |  |
| scrollEventCount | 2 | 2 | ➖ 0.0% |  |
| totalScrollDistance | 0 | 0 | ➖ 0.0% |  |
| assetsLoadedPerScroll | 0 | 0 | ➖ 0.0% |  |
| cumulativeLoadTime | 11.74s | 11.44s | ✅ -2.5% |  |

**Legend:** ✅ Improved | ⚠️ Regressed | ➖ No change | ✓ Statistically significant | ❌ Unreliable

---

## ⚛️ React Compiler Impact by Flow

Focus on key metrics that React Compiler directly affects: **renderCount**, **renderTime**, and downstream effects on **INP** and **TBT**.

### Tab Switching ✅

**🎯 React Compiler Effectiveness:**

- **Render Count:** 551 → 566 (+2.7%) ⚠️ More re-renders
- **Render Time:** 1.68s → 3.70s (+119.9%) ⚠️ More render work

**📊 Downstream Effects:**

- **inp:** 10.12s → 22.85s (+125.8%) ⚠️
- **averageRenderTime:** 3.05 → 6.53 (+114.1%) ⚠️
- **tbt:** 1.74s → 3.51s (+102.0%) ⚠️

<details>
<summary>📖 How React Compiler affects these metrics</summary>

**numNetworkReqs:** Not directly affected. Changes may indicate useEffect optimization or side effect deduplication.

**inp:** React Compiler reduces INP by memoizing components, preventing re-renders that block the main thread.

**renderCount:** ⭐ PRIMARY METRIC - React Compiler auto-memoizes to skip unnecessary renders.

**renderTime:** ⭐ PRIMARY METRIC - Directly measures time saved by skipping renders.

**averageRenderTime:** May increase slightly if cheap renders are eliminated, leaving only necessary ones.

**tbt:** React Compiler reduces TBT by eliminating unnecessary render work that blocks the main thread.

</details>

<details>
<summary>📋 Other Metrics</summary>

| Metric | Baseline | Compiler | Change |
|--------|----------|----------|--------|
| numNetworkReqs | 129 | 139 | ⚠️ +7.8% |
| inpCount | 8 | 8 | ➖ 0.0% |

</details>

---

### Account Switching ✅

**🎯 React Compiler Effectiveness:**

- **Render Count:** 285 → 264 (-7.4%) ✅ Fewer re-renders
- **Render Time:** 701ms → 599ms (-14.6%) ✅ Less render work

**📊 Downstream Effects:**

- **inp:** 16.58s → 10.24s (-38.2%) ✅
- **averageRenderTime:** 2.46 → 2.27 (-7.8%) ✅
- **tbt:** 727ms → 389ms (-46.5%) ✅

<details>
<summary>📖 How React Compiler affects these metrics</summary>

**numNetworkReqs:** Not directly affected. Changes may indicate useEffect optimization or side effect deduplication.

**inp:** React Compiler reduces INP by memoizing components, preventing re-renders that block the main thread.

**renderCount:** ⭐ PRIMARY METRIC - React Compiler auto-memoizes to skip unnecessary renders.

**renderTime:** ⭐ PRIMARY METRIC - Directly measures time saved by skipping renders.

**averageRenderTime:** May increase slightly if cheap renders are eliminated, leaving only necessary ones.

**tbt:** React Compiler reduces TBT by eliminating unnecessary render work that blocks the main thread.

</details>

<details>
<summary>📋 Other Metrics</summary>

| Metric | Baseline | Compiler | Change |
|--------|----------|----------|--------|
| numNetworkReqs | 182 | 178 | ✅ -2.2% |
| inpCount | 12 | 10 | ➖ -16.7% |

</details>

---

### Network Switching ✅

**🎯 React Compiler Effectiveness:**

- **Render Count:** 32 → 32 (0.0%) ➖ No significant change
- **Render Time:** 161ms → 132ms (-18.2%) ✅ Less render work

**📊 Downstream Effects:**

- **inp:** 10.21s → 70ms (-99.3%) ✅
- **averageRenderTime:** 5.04 → 4.12 (-18.2%) ✅
- **tbt:** 58ms → 12ms (-79.3%) ✅

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
| numNetworkReqs | 53 | 36 | ✅ -32.1% |
| inpCount | 2 | 6 | ➖ +200.0% |
| fcp | 15.08s | 293ms | ✅ -98.1% |

</details>

---

### Token Search ✅

**🎯 React Compiler Effectiveness:**

- **Render Count:** 40 → 38 (-5.0%) ✅ Fewer re-renders
- **Render Time:** 116ms → 151ms (+30.4%) ⚠️ More render work

**📊 Downstream Effects:**

- **inp:** 10.12s → 10.13s (+0.1%) ➖
- **averageRenderTime:** 2.90 → 3.97 (+37.3%) ⚠️
- **tbt:** 0ms → 16ms (0.0%) ➖

<details>
<summary>📖 How React Compiler affects these metrics</summary>

**numNetworkReqs:** Not directly affected. Changes may indicate useEffect optimization or side effect deduplication.

**inp:** React Compiler reduces INP by memoizing components, preventing re-renders that block the main thread.

**renderCount:** ⭐ PRIMARY METRIC - React Compiler auto-memoizes to skip unnecessary renders.

**renderTime:** ⭐ PRIMARY METRIC - Directly measures time saved by skipping renders.

**averageRenderTime:** May increase slightly if cheap renders are eliminated, leaving only necessary ones.

**tbt:** React Compiler reduces TBT by eliminating unnecessary render work that blocks the main thread.

</details>

<details>
<summary>📋 Other Metrics</summary>

| Metric | Baseline | Compiler | Change |
|--------|----------|----------|--------|
| numNetworkReqs | 11 | 16 | ⚠️ +45.5% |
| inpCount | 2 | 2 | ➖ 0.0% |

</details>

---

### Token Send ✅

**🎯 React Compiler Effectiveness:**

- **Render Count:** 83 → 77 (-7.2%) ✅ Fewer re-renders
- **Render Time:** 416ms → 207ms (-50.4%) ✅ Less render work

**📊 Downstream Effects:**

- **inp:** 10.23s → 132ms (-98.7%) ✅
- **averageRenderTime:** 5.01 → 2.68 (-46.5%) ✅
- **tbt:** 235ms → 0ms (-100.0%) ✅

<details>
<summary>📖 How React Compiler affects these metrics</summary>

**numNetworkReqs:** Not directly affected. Changes may indicate useEffect optimization or side effect deduplication.

**inp:** React Compiler reduces INP by memoizing components, preventing re-renders that block the main thread.

**renderCount:** ⭐ PRIMARY METRIC - React Compiler auto-memoizes to skip unnecessary renders.

**renderTime:** ⭐ PRIMARY METRIC - Directly measures time saved by skipping renders.

**averageRenderTime:** May increase slightly if cheap renders are eliminated, leaving only necessary ones.

**tbt:** React Compiler reduces TBT by eliminating unnecessary render work that blocks the main thread.

</details>

<details>
<summary>📋 Other Metrics</summary>

| Metric | Baseline | Compiler | Change |
|--------|----------|----------|--------|
| numNetworkReqs | 26 | 17 | ✅ -34.6% |
| inpCount | 3 | 7 | ➖ +133.3% |

</details>

---

### Tokens List Scrolling ✅

**🎯 React Compiler Effectiveness:**

- **Render Count:** 462 → 464 (+0.4%) ➖ No significant change
- **Render Time:** 3.59s → 3.70s (+3.0%) ⚠️ More render work

**📊 Downstream Effects:**

- **inp:** 315ms → 239ms (-24.3%) ✅
- **averageRenderTime:** 7.78 → 7.98 (+2.6%) ⚠️
- **interactionLatency:** 14.49s → 13.27s (-8.4%) ✅
- **tbt:** 4.20s → 4.55s (+8.5%) ⚠️

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
| numNetworkReqs | 52 | 31 | ✅ -40.4% |
| inpCount | 2 | 2 | ➖ 0.0% |
| fcp | 860ms | 994ms | ⚠️ +15.6% |

</details>

---

### Nft List Scrolling ✅

**🎯 React Compiler Effectiveness:**

- **Render Count:** 539 → 535 (-0.7%) ➖ No significant change
- **Render Time:** 3.71s → 3.23s (-12.9%) ✅ Less render work

**📊 Downstream Effects:**

- **inp:** 3.93s → 53ms (-98.7%) ✅
- **averageRenderTime:** 6.88 → 6.04 (-12.3%) ✅
- **interactionLatency:** 15.07s → 14.67s (-2.7%) ✅
- **tbt:** 4.74s → 4.44s (-6.3%) ✅

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
| numNetworkReqs | 137 | 139 | ⚠️ +1.5% |
| inpCount | 2 | 1 | ➖ -50.0% |
| fcp | 617ms | 7.60s | ⚠️ +1131.2% |
| scrollToLoadLatency | 5.87s | 5.72s | ✅ -2.5% |
| scrollEventCount | 2 | 2 | ➖ 0.0% |
| totalScrollDistance | 0 | 0 | ➖ 0.0% |
| assetsLoadedPerScroll | 0 | 0 | ➖ 0.0% |
| cumulativeLoadTime | 11.74s | 11.44s | ✅ -2.5% |

</details>

---

## 📌 Key Findings

- ⚠️ Power User: Tab Switching: 125.8% regression in inp (10.12s → 22.85s)
- ⚠️ Power User: Tab Switching: 119.9% regression in renderTime (1.68s → 3.70s)
- ⚠️ Power User: Tab Switching: 114.1% regression in averageRenderTime (3.05 → 6.53)
- ⚠️ Power User: Tab Switching: 102.0% regression in tbt (1.74s → 3.51s)
- Power User: Account Switching: 38.2% improvement in inp (16.58s → 10.24s)
- Power User: Account Switching: 46.5% improvement in tbt (727ms → 389ms)
- Power User: Network Switching: 32.1% improvement in numNetworkReqs (53 → 36)
- Power User: Network Switching: 99.3% improvement in inp (10.21s → 70ms)
- Power User: Network Switching: 18.2% improvement in averageRenderTime (5.04 → 4.12)
- Power User: Network Switching: 98.1% improvement in fcp (15.08s → 293ms)

## ⚠️ Data Quality Warnings

- Power User: Tab Switching: Baseline only has 1 iterations
- Power User: Tab Switching: Compiler only has 1 iterations
- Power User: Account Switching: Baseline only has 1 iterations
- Power User: Account Switching: Compiler only has 1 iterations
- Power User: Network Switching: Baseline only has 1 iterations
- Power User: Network Switching: Compiler only has 1 iterations
- Power User: Token Search: Baseline only has 1 iterations
- Power User: Token Search: Compiler only has 1 iterations
- Power User: Token Send: Baseline only has 1 iterations
- Power User: Token Send: Compiler only has 1 iterations
- Power User: Tokens List Scrolling: Baseline only has 1 iterations
- Power User: Tokens List Scrolling: Compiler only has 1 iterations
- Power User: Nft List Scrolling: Baseline only has 1 iterations
- Power User: Nft List Scrolling: Compiler only has 1 iterations

