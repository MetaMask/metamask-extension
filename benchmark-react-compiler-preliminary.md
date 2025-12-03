### Key Observations

**Top Improvements:**
  • Power User: Token Search: fcp improved by 59.0% (330ms → 135ms) (needs more data)
  • Power User: Nft List Scrolling: inp improved by 51.4% (56ms → 27ms) (needs more data)
  • Power User: Network Switching: fcp improved by 37.3% (382ms → 239ms) (needs more data)
  • Power User: Tab Switching: interactionLatency improved by 19.7% (11.24s → 9.03s) (needs more data)
  • Power User: Network Switching: renderCount improved by 8.1% (92.50 → 85) (needs more data)

## 📊 Complete Data

### Tab Switching
| Metric | Baseline | Compiler | Change | Sig? |
|--------|----------|----------|--------|------|
| interactionLatency | 11.24s | 9.03s | ✅ -19.7% |  |
| fcp | 2.23s | 366ms | ✅ -83.6% | ✓ |

### Account Switching
| Metric | Baseline | Compiler | Change | Sig? |
|--------|----------|----------|--------|------|
| renderTime | 297ms | 284ms | -4.6% |  |
| averageRenderTime | 1.18 | 1.11 | -6.6% |  |
| fcp | 531ms | 206ms | ✅ -61.3% | |
| tbt | 16ms | 3ms | ✅ -81.5% | ✓ |

### Network Switching
| Metric | Baseline | Compiler | Change | Sig? |
|--------|----------|----------|--------|------|
| numNetworkReqs | 142 | 133 | -6.3% |  |
| renderCount | 92.50 | 85 | -8.1% |  |
| fcp | 382ms | 239ms | ✅ -37.3% |  |
| tbt | 71ms | 49ms | ✅ -31.1% | |

### Token Search
| Metric | Baseline | Compiler | Change | Sig? |
|--------|----------|----------|--------|------|
| fcp | 330ms | 135ms | ✅ -59.0% |  |

### Nft List Scrolling
| Metric | Baseline | Compiler | Change | Sig? |
|--------|----------|----------|--------|------|
| inp | 56ms | 27ms | ✅ -51.4% |  |
| inpCount | 2 | 0.50 | ✅ -75.0% | ✓ |
| renderCount | 536.67 | 533.67 | ➖ -0.6% |  |
| renderTime | 2.48s | 2.38s | -4.2% | |
| averageRenderTime | 4.59 | 4.43 | -3.4% | |
| tbt | 2.29s | 2.24s | -2.3% | |
