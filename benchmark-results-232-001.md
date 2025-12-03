
=== Benchmark Comparison Report ===

Before: benchmark-baseline-webpack-232-001.json
After: benchmark-compiler-webpack-232-001.json
Generated: 2025-12-02T13:59:12.345Z

--- Benchmark Run Details ---
Before Run:
  Duration: 35m 20s
  Flows: 8/9 successful
  ⚠️ Failed: 1
After Run:
  Duration: 35m 10s
  Flows: 9/9 successful

## Executive Summary

### ⚠️ Data Quality Warnings

**18 of 77 metrics have unreliable data** (high variance or insufficient samples).

Key issues:
  • Power User: Network Adding: fcp shows 98.5% change (11.03s) but data is UNRELIABLE (CV: baseline 135%, compiler 43%)
  • Power User: Tokens List Scrolling: Compiler only has 3 iterations
  • Power User: Nft List Scrolling: inp shows 92.7% change (1.13s) but data is UNRELIABLE (CV: baseline 201%, compiler 78%)

**Flow Reliability:**
| Status | Count | Flows |
|--------|-------|-------|
| ⚠️ Partial | 8 | Tab Switching, Account Switching, Network Switching, Network Adding, Token Search, Token Send, Tokens List Scrolling, Nft List Scrolling |

### Overall Assessment

✅ **NET POSITIVE**: Significantly more improvements than regressions.

### Statistics Overview (Reliable Data Only)

| Category | Count | Percentage |
|----------|-------|------------|
| Improvements | 23 | 39.0% |
| Regressions | 15 | 25.4% |
| Neutral | 21 | 35.6% |
| **Reliable Metrics** | 59 | - |
| ~~Unreliable (excluded)~~ | 18 | - |

### Performance by Category (Reliable Data)

| Category | Avg Change | Interpretation |
|----------|------------|----------------|
| React Rendering | -6.0% | ✅ 6.0% better |
| Web Vitals (INP/FCP/TBT) | -29.0% | ✅ 29.0% better |
| Network Requests | +1.9% | ⚠️ 1.9% worse |
| Interaction Latency | -6.7% | ✅ 6.7% better |

### Key Observations

**Top Improvements (Statistically Significant):**
  • Power User: Network Switching: tbt improved by 100.0% (8ms) ⚠️ CV: 74%/0%
  • Power User: Network Switching: renderTime improved by 66.0% (157ms)
  • Power User: Network Switching: renderCount improved by 62.8% (37.67)
  • Power User: Network Switching: numNetworkReqs improved by 42.6% (26)
  • Power User: Network Switching: interactionLatency improved by 40.3% (32.32s)

**Areas Needing Attention:**
  • Power User: Network Adding: numNetworkReqs regressed by 42.3% (+13.33) (may be noise)
  • Power User: Network Adding: renderTime regressed by 36.2% (+113ms) (may be noise)
  • Power User: Network Adding: renderCount regressed by 29.4% (+48.33) (may be noise)
  • Power User: Tokens List Scrolling: inp regressed by 21.3% (+9ms) (may be noise)
  • Power User: Nft List Scrolling: numNetworkReqs regressed by 19.0% (+19.67) (may be noise)

### Statistical Notes

- Results exclude metrics with CV > 50% (unreliable data)
- "Statistically significant" uses Welch's t-test at α=0.05
- Metrics marked "partial" have high variance in one dataset (CV 30-50%)
- Consider running more iterations for flows with data quality warnings

--- Overall Summary ---
Overall: 37 metrics improved across 8 flows, 19 regressions detected. Data quality: 0 reliable, 8 partial, 0 unreliable flows.

--- Key Findings ---
  • Power User: Tab Switching: 25.1% improvement in numNetworkReqs (-15.83)
  • Power User: Tab Switching: 46.9% improvement in inp (-188ms) (⚠️ partial data)
  • Power User: Tab Switching: 18.6% improvement in averageRenderTime (-0.30)
  • Power User: Network Switching: 42.6% improvement in numNetworkReqs (-26)
  • Power User: Network Switching: 62.8% improvement in renderCount (-37.67)
  • Power User: Network Switching: 66.0% improvement in renderTime (-157ms)
  • Power User: Network Switching: 40.3% improvement in interactionLatency (-32.32s)
  • ⚠️ Power User: Network Adding: 42.3% regression in numNetworkReqs (+13.33) (⚠️ partial data)
  • Power User: Network Adding: 99.8% improvement in inp (-12.86s) (⚠️ partial data)
  • ⚠️ Power User: Network Adding: 29.4% regression in renderCount (+48.33) (⚠️ partial data)

--- Flow-by-Flow Analysis ---

### Power User: Tab Switching (HIGH Impact) ⚠️
7 metrics improved, 0 regressed. **[PARTIAL DATA]**

**High Impact Changes:**
  ↓ numNetworkReqs: 63.00 → 47.17 (-25.1%, -15.83) ✓sig
    25.1% fewer network requests indicates improved efficiency and reduced overhead.
  ↓ inp: 400.00 → 212.27 (-46.9%, -188ms) ⚠️ CV: 58%/8%
    188ms improvement in Interaction to Next Paint (INP) means faster, more responsive interactions.
  ↓ averageRenderTime: 1.60 → 1.30 (-18.6%, -0.30)
    18.6% reduction in average render time indicates React Compiler is successfully memoizing components and reducing unnecessary re-renders.

**Medium Impact Changes:**
  ↓ renderTime: 866.02 → 706.63 (-18.4%, -159ms)
    18.4% reduction in total render time indicates React Compiler is successfully memoizing components and reducing unnecessary re-renders.
  ↓ interactionLatency: 3670.60 → 3227.00 (-12.1%, -444ms) ✓sig
    444ms improvement in interaction latency means faster, more responsive interactions.
  ↓ tbt: 575.40 → 411.50 (-28.5%, -164ms)
    164ms improvement in Total Blocking Time (TBT) means faster, more responsive interactions.

**Low Impact / Minor Changes:**
  → inpCount: 8.20 → 8.00 (-2.4%, -0.20)
    INP interaction count decreased by 2.4% (informational metric).
  → renderCount: 542.20 → 543.50 (+0.2%, +1.30)
    Minimal change in React component renders (+0.2%).
  ↓ fcp: 351.32 → 318.60 (-9.3%, -33ms) ❌ UNRELIABLE (CV: 62%/41%)
    33ms improvement in First Contentful Paint (FCP) means faster, more responsive interactions.

Recommendations:
  • ⚠️ Some metrics have high variance - interpret results with caution.
  • React Compiler optimization is effective - 6 metric(s) improved.
  • Focus on high-impact metrics: numNetworkReqs, inp, averageRenderTime.

### Power User: Account Switching (LOW Impact) ⚠️
5 metrics improved, 0 regressed. **[PARTIAL DATA]**

**Low Impact / Minor Changes:**
  → numNetworkReqs: 150.00 → 149.17 (-0.6%, -0.83)
    Minimal change in network requests (-0.6%).
  ↓ inp: 35.82 → 35.17 (-1.8%, -1ms) ❌ UNRELIABLE (CV: 33%/37%)
    1.8% improvement in Interaction to Next Paint (INP).
  → inpCount: 6.00 → 6.00 (0.0%, -0)
    INP interaction count decreased by 0.0% (informational metric).
  → renderCount: 254.50 → 254.33 (-0.1%, -0.17)
    Minimal change in React component renders (-0.1%).
  ↓ renderTime: 277.75 → 273.55 (-1.5%, -4ms)
    1.5% reduction in total render time indicates React Compiler is successfully memoizing components and reducing unnecessary re-renders.
  ↓ averageRenderTime: 1.09 → 1.08 (-1.5%, -0.02)
    1.5% reduction in average render time indicates React Compiler is successfully memoizing components and reducing unnecessary re-renders.
  → interactionLatency: 5037.67 → 5022.17 (-0.3%, -16ms)
    Minimal change in interaction latency (-0.3%).
  ↓ fcp: 227.82 → 159.60 (-29.9%, -68ms) ❌ UNRELIABLE (CV: 68%/42%)
    68ms improvement in First Contentful Paint (FCP) means faster, more responsive interactions.
  ↓ tbt: 6.33 → 1.33 (-78.9%, -5ms) ❌ UNRELIABLE (CV: 196%/71%)
    5ms improvement in Total Blocking Time (TBT) means faster, more responsive interactions.

Recommendations:
  • ⚠️ Some metrics have high variance - interpret results with caution.
  • React Compiler optimization is effective - 2 metric(s) improved.

### Power User: Network Switching (HIGH Impact) ⚠️
8 metrics improved, 0 regressed. **[PARTIAL DATA]**

**High Impact Changes:**
  ↓ numNetworkReqs: 61.00 → 35.00 (-42.6%, -26) ✓sig
    42.6% fewer network requests indicates improved efficiency and reduced overhead.
  → inpCount: 4.00 → 2.00 (-50.0%, -2)
    INP interaction count decreased by 50.0% (informational metric).
  ↓ renderCount: 60.00 → 22.33 (-62.8%, -37.67) ✓sig
    62.8% reduction in React component renders indicates React Compiler is successfully memoizing components and reducing unnecessary re-renders.
  ↓ renderTime: 238.53 → 81.07 (-66.0%, -157ms) ✓sig
    66.0% reduction in total render time indicates React Compiler is successfully memoizing components and reducing unnecessary re-renders.
  ↓ interactionLatency: 80202.83 → 47883.50 (-40.3%, -32.32s) ✓sig
    32319ms improvement in interaction latency means faster, more responsive interactions.

**Medium Impact Changes:**
  ↓ averageRenderTime: 3.97 → 3.63 (-8.5%, -0.34)
    8.5% reduction in average render time indicates React Compiler is successfully memoizing components and reducing unnecessary re-renders.

**Low Impact / Minor Changes:**
  ↓ inp: 11.90 → 9.45 (-20.6%, -2ms) ❌ UNRELIABLE (CV: 53%/93%)
    2ms improvement in Interaction to Next Paint (INP) means faster, more responsive interactions.
  ↓ fcp: 186.80 → 164.85 (-11.8%, -22ms) ⚠️ CV: 19%/39%
    22ms improvement in First Contentful Paint (FCP) means faster, more responsive interactions.
  ↓ tbt: 8.17 → 0.00 (-100.0%, -8ms) ⚠️ CV: 74%/0% ✓sig
    8ms improvement in Total Blocking Time (TBT) means faster, more responsive interactions.

Recommendations:
  • ⚠️ Some metrics have high variance - interpret results with caution.
  • React Compiler optimization is effective - 7 metric(s) improved.
  • Focus on high-impact metrics: numNetworkReqs, inpCount, renderCount, renderTime, interactionLatency.

### Power User: Network Adding (HIGH Impact) ⚠️
4 metrics improved, 4 regressed. **[PARTIAL DATA]**

**High Impact Changes:**
  ↑ numNetworkReqs: 31.50 → 44.83 (+42.3%, +13.33) ⚠️ CV: 58%/5%
    42.3% more network requests may indicate additional API calls or inefficient data fetching.
  ↓ inp: 12880.95 → 24.72 (-99.8%, -12.86s) ⚠️ CV: 103%/17%
    12856ms improvement in Interaction to Next Paint (INP) means faster, more responsive interactions.
  → inpCount: 74.83 → 92.00 (+22.9%, +17.17) ⚠️ CV: 43%/0%
    INP interaction count increased by 22.9% (informational metric).
  ↑ renderCount: 164.50 → 212.83 (+29.4%, +48.33) ⚠️ CV: 41%/2%
    29.4% increase in React component renders suggests potential regression in component memoization.
  ↑ renderTime: 312.08 → 424.92 (+36.2%, +113ms) ⚠️ CV: 41%/4%
    36.2% increase in total render time suggests potential regression in component memoization.
  ↓ fcp: 11207.53 → 172.75 (-98.5%, -11.03s) ❌ UNRELIABLE (CV: 135%/43%)
    11035ms improvement in First Contentful Paint (FCP) means faster, more responsive interactions.

**Medium Impact Changes:**
  ↓ interactionLatency: 32415.67 → 27173.50 (-16.2%, -5.24s)
    5242ms improvement in interaction latency means faster, more responsive interactions.

**Low Impact / Minor Changes:**
  ↓ averageRenderTime: 2.15 → 2.00 (-7.2%, -0.15) ⚠️ CV: 39%/4%
    7.2% reduction in average render time indicates React Compiler is successfully memoizing components and reducing unnecessary re-renders.
  ↑ tbt: 4.83 → 5.67 (+17.2%, +1ms) ❌ UNRELIABLE (CV: 108%/75%)
    17.2% regression in Total Blocking Time (TBT).

Recommendations:
  • ⚠️ Some metrics have high variance - interpret results with caution.
  • Investigate 3 metric regression(s) in this flow.
  • React Compiler optimization is effective - 3 metric(s) improved.
  • Focus on high-impact metrics: numNetworkReqs, inp, inpCount, renderCount, renderTime.

### Power User: Token Search (MEDIUM Impact) ⚠️
5 metrics improved, 1 regressed. **[PARTIAL DATA]**

**Medium Impact Changes:**
  ↓ numNetworkReqs: 4.67 → 4.00 (-14.3%, -0.67) ❌ UNRELIABLE (CV: 51%/71%)
    14.3% fewer network requests indicates improved efficiency and reduced overhead.

**Low Impact / Minor Changes:**
  ↓ inp: 15.50 → 14.82 (-4.4%, -1ms) ⚠️ CV: 32%/9%
    4.4% improvement in Interaction to Next Paint (INP).
  → inpCount: 8.00 → 8.00 (0.0%, -0)
    INP interaction count decreased by 0.0% (informational metric).
  ↓ renderCount: 29.00 → 27.00 (-6.9%, -2) ✓sig
    6.9% reduction in React component renders indicates React Compiler is successfully memoizing components and reducing unnecessary re-renders.
  ↓ renderTime: 87.97 → 84.65 (-3.8%, -3ms)
    3.8% reduction in total render time indicates React Compiler is successfully memoizing components and reducing unnecessary re-renders.
  ↑ averageRenderTime: 3.03 → 3.13 (+3.3%, +0.10)
    3.3% increase in average render time suggests potential regression in component memoization.
  → interactionLatency: 10979.67 → 10982.83 (+0.0%, +3ms)
    Minimal change in interaction latency (+0.0%).
  ↓ fcp: 224.07 → 219.97 (-1.8%, -4ms) ❌ UNRELIABLE (CV: 65%/83%)
    4ms improvement in First Contentful Paint (FCP) means faster, more responsive interactions.
  → tbt: 0.00 → 0.00 (0.0%, -0ms)
    Minimal change in Total Blocking Time (TBT) (0.0%).

Recommendations:
  • ⚠️ Some metrics have high variance - interpret results with caution.
  • Investigate 1 metric regression(s) in this flow.
  • React Compiler optimization is effective - 3 metric(s) improved.

### Power User: Token Send (MEDIUM Impact) ⚠️
1 metrics improved, 4 regressed. **[PARTIAL DATA]**

**Medium Impact Changes:**
  ↓ numNetworkReqs: 4.67 → 4.00 (-14.3%, -0.67) ❌ UNRELIABLE (CV: 51%/71%)
    14.3% fewer network requests indicates improved efficiency and reduced overhead.

**Low Impact / Minor Changes:**
  ↑ inp: 12.42 → 13.65 (+9.9%, +1ms)
    1ms slower Interaction to Next Paint (INP) - investigate potential performance regression.
  → inpCount: 2.00 → 2.00 (0.0%, -0)
    INP interaction count decreased by 0.0% (informational metric).
  → renderCount: 31.17 → 31.17 (0.0%, -0)
    Minimal change in React component renders (0.0%).
  ↑ renderTime: 94.95 → 96.43 (+1.6%, +1ms)
    1.6% increase in total render time suggests potential regression in component memoization.
  ↑ averageRenderTime: 3.04 → 3.10 (+1.7%, +0.05)
    1.7% increase in average render time suggests potential regression in component memoization.
  → interactionLatency: 9301.33 → 9283.50 (-0.2%, -18ms)
    Minimal change in interaction latency (-0.2%).
  ↑ fcp: 197.63 → 214.42 (+8.5%, +17ms) ❌ UNRELIABLE (CV: 58%/55%)
    17ms slower First Contentful Paint (FCP) - investigate potential performance regression.
  → tbt: 0.00 → 0.00 (0.0%, -0ms)
    Minimal change in Total Blocking Time (TBT) (0.0%).

Recommendations:
  • ⚠️ Some metrics have high variance - interpret results with caution.
  • Investigate 3 metric regression(s) in this flow.

### Power User: Tokens List Scrolling (HIGH Impact) ⚠️
4 metrics improved, 4 regressed. **[PARTIAL DATA]**

**Data Quality Issues:**
  ⚠️ Compiler has insufficient iterations (3/4 minimum)
  ⚠️ Compiler had 1 error(s)

**High Impact Changes:**
  → inpCount: 0.83 → 2.00 (+140.0%, +1.17) ⚠️ CV: 108%/0%
    INP interaction count increased by 140.0% (informational metric).

**Medium Impact Changes:**
  ↑ numNetworkReqs: 28.17 → 33.33 (+18.3%, +5.17)
    18.3% more network requests may indicate additional API calls or inefficient data fetching.
  ↓ tbt: 2567.33 → 2411.33 (-6.1%, -156ms) ❌ UNRELIABLE (CV: 42%/54%)
    156ms improvement in Total Blocking Time (TBT) means faster, more responsive interactions.

**Low Impact / Minor Changes:**
  ↑ inp: 43.50 → 52.77 (+21.3%, +9ms) ⚠️ CV: 172%/3%
    9ms slower Interaction to Next Paint (INP) - investigate potential performance regression.
  ↑ renderCount: 446.00 → 454.67 (+1.9%, +8.67)
    1.9% increase in React component renders suggests potential regression in component memoization.
  ↓ renderTime: 2489.37 → 2366.00 (-5.0%, -123ms) ❌ UNRELIABLE (CV: 37%/46%)
    5.0% reduction in total render time indicates React Compiler is successfully memoizing components and reducing unnecessary re-renders.
  ↓ averageRenderTime: 5.51 → 5.10 (-7.4%, -0.41) ❌ UNRELIABLE (CV: 34%/44%)
    7.4% reduction in average render time indicates React Compiler is successfully memoizing components and reducing unnecessary re-renders.
  ↓ interactionLatency: 12988.17 → 12566.00 (-3.3%, -422ms)
    422ms improvement in interaction latency means faster, more responsive interactions.
  ↑ fcp: 204.38 → 215.73 (+5.6%, +11ms) ⚠️ CV: 30%/29%
    11ms slower First Contentful Paint (FCP) - investigate potential performance regression.

Recommendations:
  • ⚠️ Some metrics have high variance - interpret results with caution.
  • Investigate 4 metric regression(s) in this flow.
  • React Compiler optimization is effective - 1 metric(s) improved.
  • Focus on high-impact metrics: inpCount.

### Power User: Nft List Scrolling (HIGH Impact) ⚠️
3 metrics improved, 6 regressed. **[PARTIAL DATA]**

**High Impact Changes:**
  ↓ inp: 1214.43 → 89.25 (-92.7%, -1.13s) ❌ UNRELIABLE (CV: 201%/78%)
    1125ms improvement in Interaction to Next Paint (INP) means faster, more responsive interactions.
  → inpCount: 1.00 → 2.00 (+100.0%, +1) ⚠️ CV: 82%/0%
    INP interaction count increased by 100.0% (informational metric).
  ↓ fcp: 4205.10 → 269.67 (-93.6%, -3.94s) ⚠️ CV: 152%/29%
    3935ms improvement in First Contentful Paint (FCP) means faster, more responsive interactions.

**Medium Impact Changes:**
  ↑ numNetworkReqs: 103.50 → 123.17 (+19.0%, +19.67)
    19.0% more network requests may indicate additional API calls or inefficient data fetching.
  ↓ tbt: 2715.33 → 2569.00 (-5.4%, -146ms) ❌ UNRELIABLE (CV: 60%/54%)
    146ms improvement in Total Blocking Time (TBT) means faster, more responsive interactions.

**Low Impact / Minor Changes:**
  → renderCount: 535.17 → 536.33 (+0.2%, +1.17)
    Minimal change in React component renders (+0.2%).
  ↑ renderTime: 2637.87 → 2688.95 (+1.9%, +51ms) ❌ UNRELIABLE (CV: 47%/44%)
    1.9% increase in total render time suggests potential regression in component memoization.
  ↑ averageRenderTime: 4.89 → 4.97 (+1.6%, +0.08) ❌ UNRELIABLE (CV: 46%/43%)
    1.6% increase in average render time suggests potential regression in component memoization.
  ↑ interactionLatency: 12787.33 → 13003.33 (+1.7%, +216ms)
    216ms slower interaction latency - investigate potential performance regression.
  ↑ scrollToLoadLatency: 5103.33 → 5194.92 (+1.8%, +92ms)
    1.8% regression in scroll-to-load latency.
  → scrollEventCount: 2.00 → 2.00 (0.0%, -0)
    scrollEventCount decreased by 0.0% (informational metric).
  → totalScrollDistance: 0.00 → 0.00 (0.0%, -0)
    totalScrollDistance decreased by 0.0% (informational metric).
  → assetsLoadedPerScroll: 0.00 → 0.00 (0.0%, -0)
    assetsLoadedPerScroll decreased by 0.0% (informational metric).
  ↑ cumulativeLoadTime: 10206.67 → 10389.83 (+1.8%, +183ms)
    1.8% regression in cumulative load time.

Recommendations:
  • ⚠️ Some metrics have high variance - interpret results with caution.
  • Investigate 4 metric regression(s) in this flow.
  • React Compiler optimization is effective - 1 metric(s) improved.
  • Focus on high-impact metrics: inpCount, fcp.

