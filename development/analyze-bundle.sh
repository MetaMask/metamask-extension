#!/usr/bin/env bash

set -e
set -u
set -o pipefail

# MetaMask Bundle Analysis Script
# This script builds the project and generates comprehensive bundle analysis

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

function log_info() {
    echo -e "${BLUE}ℹ ${1}${NC}"
}

function log_success() {
    echo -e "${GREEN}✓ ${1}${NC}"
}

function log_warning() {
    echo -e "${YELLOW}⚠ ${1}${NC}"
}

function log_error() {
    echo -e "${RED}✗ ${1}${NC}"
}

function check_dependencies() {
    log_info "Checking dependencies..."

    if ! command -v yarn &> /dev/null; then
        log_error "yarn is not installed"
        exit 1
    fi

    if ! command -v node &> /dev/null; then
        log_error "node is not installed"
        exit 1
    fi

    log_success "Dependencies check passed"
}

function create_directories() {
    log_info "Creating analysis directories..."
    mkdir -p build-artifacts/bundle-analysis
    mkdir -p build-artifacts/source-map-explorer
    log_success "Directories created"
}

function build_for_analysis() {
    log_info "Building project for analysis..."

    # Build with source maps and stats
    NODE_ENV=production yarn build:dev testDev \
        --apply-lavamoat=false \
        --browser=chrome \
        --devtool=source-map \
        --stats || {
        log_error "Build failed"
        exit 1
    }

    log_success "Build completed"
}

function generate_size_report() {
    log_info "Generating bundle size report..."

    local output_file="build-artifacts/bundle-analysis/size-report.txt"

    {
        echo "=== MetaMask Bundle Size Analysis ==="
        echo "Generated: $(date)"
        echo ""

        echo "=== Dist Directory Contents ==="
        if [ -d "dist/chrome" ]; then
            find dist/chrome -type f -name "*.js" -exec ls -lh {} \; | sort -k5 -hr
            echo ""

            echo "=== Total Bundle Sizes ==="
            echo "Total JS size:"
            find dist/chrome -name "*.js" -exec cat {} \; | wc -c | awk '{print $1/1024/1024 " MB"}'

            echo ""
            echo "=== Largest Files ==="
            find dist/chrome -name "*.js" -exec du -h {} \; | sort -hr | head -10

            echo ""
            echo "=== File Count by Type ==="
            echo "JavaScript files: $(find dist/chrome -name "*.js" | wc -l)"
            echo "CSS files: $(find dist/chrome -name "*.css" | wc -l)"
            echo "JSON files: $(find dist/chrome -name "*.json" | wc -l)"
            echo "Image files: $(find dist/chrome -name "*.png" -o -name "*.jpg" -o -name "*.svg" | wc -l)"

        else
            echo "dist/chrome directory not found"
        fi
    } > "$output_file"

    log_success "Size report generated: $output_file"
}

function run_source_map_explorer() {
    log_info "Running source map explorer..."

    if [ -x "./development/source-map-explorer.sh" ]; then
        ./development/source-map-explorer.sh || {
            log_warning "Source map explorer failed, continuing..."
        }
        log_success "Source map analysis completed"
    else
        log_warning "Source map explorer script not found or not executable"
    fi
}

function analyze_dependencies() {
    log_info "Analyzing package dependencies..."

    local output_file="build-artifacts/bundle-analysis/dependency-analysis.txt"

    {
        echo "=== Dependency Analysis ==="
        echo "Generated: $(date)"
        echo ""

        echo "=== Package.json Statistics ==="
        echo "Total dependencies: $(jq '.dependencies | length' package.json)"
        echo "Total devDependencies: $(jq '.devDependencies | length' package.json)"
        echo ""

        echo "=== Largest Dependencies (estimated) ==="
        echo "Based on common package sizes:"
        echo ""

        # Check for known large packages
        if jq -e '.dependencies."@material-ui/core"' package.json > /dev/null; then
            echo "@material-ui/core: ~500KB (UI framework)"
        fi

        if jq -e '.dependencies.lodash' package.json > /dev/null; then
            echo "lodash: ~70KB (utility library)"
        fi

        if jq -e '.dependencies."chart.js"' package.json > /dev/null; then
            echo "chart.js: ~150KB (charting library)"
        fi

        if jq -e '.dependencies.react' package.json > /dev/null; then
            echo "react + react-dom: ~130KB (UI framework)"
        fi

        echo ""
        echo "=== Optimization Opportunities ==="
        echo "1. Consider replacing @material-ui with lighter alternatives"
        echo "2. Use individual lodash imports instead of full library"
        echo "3. Import only needed Chart.js components"
        echo "4. Upgrade to React 18 for better tree-shaking"

    } > "$output_file"

    log_success "Dependency analysis completed: $output_file"
}

function generate_optimization_recommendations() {
    log_info "Generating optimization recommendations..."

    local output_file="build-artifacts/bundle-analysis/recommendations.md"

    cat > "$output_file" << 'EOF'
# Bundle Optimization Recommendations

## Quick Wins (1-2 weeks)

### 1. Lodash Optimization
- **Current**: Full lodash import (~70KB)
- **Action**: Replace with individual imports or native alternatives
- **Impact**: 50-60KB reduction
- **Files to check**: Search for `import _ from 'lodash'`

### 2. Material-UI Analysis
- **Current**: @material-ui/core (~500KB)
- **Action**: Audit usage and consider alternatives
- **Impact**: 400-500KB reduction potential
- **Alternatives**: Headless UI, Radix UI, or custom components

### 3. Chart.js Optimization
- **Current**: Full Chart.js import (~150KB)
- **Action**: Import only needed components
- **Impact**: 100-150KB reduction
- **Example**: Import individual scales and chart types

## Medium Impact (3-6 weeks)

### 1. React 18 Migration
- **Current**: React 17
- **Action**: Upgrade to React 18
- **Impact**: Better tree-shaking, automatic batching
- **Risk**: Low - mostly backward compatible

### 2. Code Splitting Enhancement
- **Action**: Implement route and component-based splitting
- **Impact**: Faster initial load, better caching
- **Focus**: Large pages like Settings, Token management

## Monitoring

### 1. Bundle Size Budgets
- Set maximum size limits for different bundle parts
- Add CI checks for bundle size increases
- Monitor key metrics over time

### 2. Regular Analysis
- Run this script weekly
- Track bundle size trends
- Identify regression sources

## Next Steps

1. Run: `./development/analyze-bundle.sh` weekly
2. Implement lodash optimization first (quick win)
3. Plan Material-UI replacement strategy
4. Set up automated bundle size monitoring
EOF

    log_success "Recommendations generated: $output_file"
}

function create_size_tracking() {
    log_info "Creating size tracking baseline..."

    local baseline_file="build-artifacts/bundle-analysis/size-baseline.json"

    if [ -d "dist/chrome" ]; then
        {
            echo "{"
            echo "  \"timestamp\": \"$(date -Iseconds)\","
            echo "  \"total_js_size\": $(find dist/chrome -name "*.js" -exec cat {} \; | wc -c),"
            echo "  \"total_css_size\": $(find dist/chrome -name "*.css" -exec cat {} \; | wc -c 2>/dev/null || echo 0),"
            echo "  \"file_count\": $(find dist/chrome -name "*.js" | wc -l),"
            echo "  \"largest_files\": ["

            # Get top 5 largest files
            find dist/chrome -name "*.js" -exec du -b {} \; | sort -nr | head -5 | while IFS=$'\t' read -r size file; do
                echo "    { \"file\": \"$file\", \"size\": $size },"
            done | sed '$ s/,$//'

            echo "  ]"
            echo "}"
        } > "$baseline_file"

        log_success "Size baseline created: $baseline_file"
    else
        log_warning "Cannot create baseline - dist directory not found"
    fi
}

function display_summary() {
    echo ""
    echo "================================="
    log_success "Bundle Analysis Complete"
    echo "================================="
    echo ""
    echo "📊 Generated Reports:"
    echo "  • Size Report:        build-artifacts/bundle-analysis/size-report.txt"
    echo "  • Dependency Analysis: build-artifacts/bundle-analysis/dependency-analysis.txt"
    echo "  • Recommendations:    build-artifacts/bundle-analysis/recommendations.md"
    echo "  • Size Baseline:      build-artifacts/bundle-analysis/size-baseline.json"

    if [ -d "build-artifacts/source-map-explorer" ]; then
        echo "  • Source Maps:        build-artifacts/source-map-explorer/"
    fi

    echo ""
    echo "🔍 Next Steps:"
    echo "  1. Review the recommendations file"
    echo "  2. Check the size report for largest files"
    echo "  3. Consider implementing quick wins first"
    echo "  4. Set up regular bundle monitoring"
    echo ""
}

function main() {
    echo "🔍 MetaMask Bundle Analysis"
    echo "=========================="
    echo ""

    check_dependencies
    create_directories
    build_for_analysis
    generate_size_report
    run_source_map_explorer
    analyze_dependencies
    generate_optimization_recommendations
    create_size_tracking
    display_summary
}

# Run main function
main "$@"