# MetaMask Performance Optimization - Implementation Guide

## Quick Start 🚀

### 1. Run Bundle Analysis (5 minutes)
```bash
# Make script executable (if not already done)
chmod +x development/analyze-bundle.sh

# Run comprehensive bundle analysis
./development/analyze-bundle.sh
```

**What this does:**
- Builds the project with source maps
- Generates detailed size reports
- Creates optimization recommendations
- Sets up baseline tracking

### 2. Implement Quick Wins (30 minutes)
```bash
# Preview Lodash optimizations (safe to run)
node development/optimize-lodash.js --dry-run

# Apply Lodash optimizations
node development/optimize-lodash.js

# Test that everything still works
yarn test:unit
```

**Expected impact:** 50-60KB reduction (~5-8% smaller bundle)

### 3. Set Up Monitoring (10 minutes)
```bash
# Copy the CI workflow
cp development/bundle-size-monitor.yml .github/workflows/

# Commit and push to enable automated monitoring
git add .github/workflows/bundle-size-monitor.yml
git commit -m "feat: add bundle size monitoring"
git push
```

## Detailed Implementation Plan

### Phase 1: Analysis and Quick Wins (Week 1)

#### Day 1: Setup and Analysis
```bash
# 1. Run full analysis
./development/analyze-bundle.sh

# 2. Review generated reports
open build-artifacts/bundle-analysis/recommendations.md
open build-artifacts/bundle-analysis/size-report.txt
```

#### Day 2-3: Lodash Optimization
```bash
# 1. Analyze current Lodash usage
grep -r "import.*lodash" ui/ --include="*.js" --include="*.ts" --include="*.jsx" --include="*.tsx"

# 2. Test optimization in dry-run mode
node development/optimize-lodash.js --dry-run --path=ui

# 3. Apply optimizations
node development/optimize-lodash.js --path=ui

# 4. Verify the changes
yarn lint:fix
yarn test:unit
```

#### Day 4-5: Material-UI Analysis
```bash
# 1. Find Material-UI usage
grep -r "@material-ui" ui/ --include="*.js" --include="*.ts" --include="*.jsx" --include="*.tsx" | head -20

# 2. Identify replacement candidates
# Look for simple components like Button, TextField, Dialog
# Plan replacement strategy (manual process)
```

### Phase 2: Dependency Optimization (Weeks 2-4)

#### Week 2: Chart.js Optimization
```javascript
// Before (in Chart components)
import Chart from 'chart.js/auto';

// After - Selective imports
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);
```

#### Week 3-4: Material-UI Replacement Planning
1. **Audit current usage**
2. **Choose replacement strategy**:
   - Option A: Headless UI + Tailwind CSS
   - Option B: Radix UI primitives
   - Option C: Custom component library

### Phase 3: React and Architecture (Weeks 5-8)

#### Week 5-6: React 18 Migration
```json
{
  "dependencies": {
    "react": "^18.2.0",
    "react-dom": "^18.2.0"
  }
}
```

#### Week 7-8: Code Splitting Implementation
```typescript
// Route-based splitting
const TokensPage = lazy(() => import('./pages/Tokens'));
const SettingsPage = lazy(() => import('./pages/Settings'));

// Component-based splitting
const ChartComponent = lazy(() => import('./components/Chart'));
```

## Using the Optimization Tools

### Bundle Analysis Script

```bash
# Full analysis with all reports
./development/analyze-bundle.sh

# Generated reports location:
# - build-artifacts/bundle-analysis/size-report.txt
# - build-artifacts/bundle-analysis/dependency-analysis.txt
# - build-artifacts/bundle-analysis/recommendations.md
# - build-artifacts/bundle-analysis/size-baseline.json
```

### Lodash Optimizer

```bash
# See what would be changed
node development/optimize-lodash.js --dry-run

# Optimize specific directory
node development/optimize-lodash.js --path=ui/components

# Optimize entire UI directory
node development/optimize-lodash.js --path=ui

# Get help
node development/optimize-lodash.js --help
```

### CI/CD Integration

The bundle size monitor will:
- ✅ Run on every PR and push
- ✅ Compare against baseline
- ✅ Comment on PRs with size analysis
- ✅ Fail builds if size exceeds limits
- ✅ Upload detailed artifacts

## Monitoring and Maintenance

### Weekly Tasks (10 minutes)
```bash
# 1. Run bundle analysis
./development/analyze-bundle.sh

# 2. Check for new optimization opportunities
grep -r "import.*lodash" ui/ --include="*.js" --include="*.ts" | wc -l

# 3. Review size trends
cat build-artifacts/bundle-analysis/size-baseline.json
```

### Monthly Tasks (30 minutes)
1. **Review dependency updates**
2. **Check for new large dependencies**
3. **Analyze slow pages for code splitting opportunities**
4. **Update optimization documentation**

## Troubleshooting

### Common Issues

#### Build Fails After Lodash Optimization
```bash
# Check for missing imports
yarn lint

# Fix import issues
yarn lint:fix

# Run tests
yarn test:unit
```

#### Bundle Analysis Script Fails
```bash
# Check dependencies
which yarn node jq

# Install missing tools (Ubuntu/Debian)
sudo apt-get update
sudo apt-get install jq bc

# Install missing tools (macOS)
brew install jq
```

#### CI Bundle Check Fails
1. **Check the artifacts** for detailed analysis
2. **Run local analysis**: `./development/analyze-bundle.sh`
3. **Apply quick optimizations**: `node development/optimize-lodash.js`
4. **Review the generated recommendations**

### Performance Regression Debugging

```bash
# 1. Compare with baseline
git show main:build-artifacts/bundle-analysis/size-baseline.json

# 2. Identify largest changes
./development/analyze-bundle.sh
grep -A 10 "Largest Files" build-artifacts/bundle-analysis/size-report.txt

# 3. Use source map explorer
open build-artifacts/source-map-explorer/
```

## Measuring Success

### Key Metrics to Track

1. **Bundle Size**: Target <2MB total JavaScript
2. **Load Time**: Target <500ms for popup initialization
3. **Build Time**: Target <2 minutes for full build
4. **Developer Experience**: HMR enabled, fast rebuilds

### Before/After Comparison

```bash
# Before optimization
./development/analyze-bundle.sh > before-optimization.txt

# After Phase 1
./development/analyze-bundle.sh > after-phase1.txt

# Compare
diff before-optimization.txt after-phase1.txt
```

### Success Criteria

- ✅ **Phase 1**: 50-60KB reduction (Lodash optimization)
- ✅ **Phase 2**: 400-500KB reduction (Material-UI replacement)
- ✅ **Phase 3**: 20-30% faster load times (React 18 + code splitting)
- ✅ **Overall**: 45-65% bundle size reduction

## Next Steps

1. **Start with Phase 1** - quick wins with minimal risk
2. **Set up monitoring** to prevent regressions
3. **Plan Phase 2** based on team capacity and priorities
4. **Iterate and improve** based on real-world usage data

## Support and Resources

- **Bundle Analysis**: `./development/analyze-bundle.sh`
- **Lodash Optimization**: `node development/optimize-lodash.js --help`
- **Full Documentation**: `PERFORMANCE_OPTIMIZATION_ANALYSIS.md`
- **CI Configuration**: `development/bundle-size-monitor.yml`

---

**Remember**: Start small, measure impact, and iterate. Performance optimization is a journey, not a destination! 🎯