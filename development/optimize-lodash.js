#!/usr/bin/env node

/**
 * @file Lodash Import Optimizer
 * Automatically converts full lodash imports to individual function imports
 *
 * Usage: node development/optimize-lodash.js [--dry-run] [--path=src]
 *
 * This script finds files with full lodash imports and converts them to
 * individual imports, reducing bundle size significantly.
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Common lodash functions used in the codebase
const COMMON_LODASH_FUNCTIONS = [
  'debounce',
  'throttle',
  'memoize',
  'cloneDeep',
  'merge',
  'pick',
  'omit',
  'get',
  'set',
  'isEmpty',
  'isEqual',
  'isFunction',
  'isObject',
  'isArray',
  'isString',
  'isNumber',
  'flatten',
  'uniq',
  'groupBy',
  'sortBy',
  'filter',
  'map',
  'reduce',
  'find',
  'findIndex',
  'includes',
  'forEach',
  'some',
  'every',
  'startsWith',
  'endsWith',
  'capitalize',
  'camelCase',
  'snakeCase',
  'kebabCase',
];

// Native alternatives for common lodash functions
const NATIVE_ALTERNATIVES = {
  'isArray': 'Array.isArray',
  'isEmpty': 'custom',
  'includes': 'array.includes',
  'forEach': 'array.forEach',
  'map': 'array.map',
  'filter': 'array.filter',
  'reduce': 'array.reduce',
  'find': 'array.find',
  'findIndex': 'array.findIndex',
  'some': 'array.some',
  'every': 'array.every',
  'startsWith': 'string.startsWith',
  'endsWith': 'string.endsWith',
};

class LodashOptimizer {
  constructor(options = {}) {
    this.dryRun = options.dryRun || false;
    this.targetPath = options.path || '.';
    this.stats = {
      filesProcessed: 0,
      filesModified: 0,
      importsOptimized: 0,
      potentialSavings: 0,
    };
  }

  log(message, type = 'info') {
    const colors = {
      info: '\x1b[36m',    // cyan
      success: '\x1b[32m', // green
      warning: '\x1b[33m', // yellow
      error: '\x1b[31m',   // red
      reset: '\x1b[0m',
    };

    const prefix = {
      info: 'ℹ',
      success: '✓',
      warning: '⚠',
      error: '✗',
    };

    console.log(`${colors[type]}${prefix[type]} ${message}${colors.reset}`);
  }

  findJSFiles(directory) {
    const files = [];
    const entries = fs.readdirSync(directory, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = path.join(directory, entry.name);

      if (entry.isDirectory() && !this.shouldSkipDirectory(entry.name)) {
        files.push(...this.findJSFiles(fullPath));
      } else if (entry.isFile() && this.isJSFile(entry.name)) {
        files.push(fullPath);
      }
    }

    return files;
  }

  shouldSkipDirectory(dirname) {
    const skipDirs = ['node_modules', '.git', 'dist', 'build', 'coverage'];
    return skipDirs.includes(dirname);
  }

  isJSFile(filename) {
    return /\.(js|ts|jsx|tsx)$/.test(filename);
  }

  analyzeLodashUsage(content) {
    const usage = {
      hasFullImport: false,
      hasIndividualImports: false,
      functions: new Set(),
      fullImportPattern: null,
      individualImports: [],
    };

    // Check for full lodash import patterns
    const fullImportPatterns = [
      /import\s+_\s+from\s+['"]lodash['"];?/g,
      /import\s+\*\s+as\s+_\s+from\s+['"]lodash['"];?/g,
      /const\s+_\s+=\s+require\(['"]lodash['"]\);?/g,
    ];

    for (const pattern of fullImportPatterns) {
      const match = content.match(pattern);
      if (match) {
        usage.hasFullImport = true;
        usage.fullImportPattern = match[0];
        break;
      }
    }

    // Check for individual imports
    const individualPattern = /import\s+\{([^}]+)\}\s+from\s+['"]lodash['"];?/g;
    let match;
    while ((match = individualPattern.exec(content)) !== null) {
      usage.hasIndividualImports = true;
      usage.individualImports.push(match[0]);
    }

    // Find lodash function usage
    if (usage.hasFullImport) {
      for (const func of COMMON_LODASH_FUNCTIONS) {
        const patterns = [
          new RegExp(`_\\.${func}\\b`, 'g'),
          new RegExp(`_\\['${func}'\\]`, 'g'),
        ];

        for (const pattern of patterns) {
          if (pattern.test(content)) {
            usage.functions.add(func);
          }
        }
      }
    }

    return usage;
  }

  generateOptimizedImports(functions) {
    const nativeFunctions = [];
    const lodashFunctions = [];
    const customUtilities = [];

    for (const func of functions) {
      if (NATIVE_ALTERNATIVES[func]) {
        if (NATIVE_ALTERNATIVES[func] === 'custom') {
          customUtilities.push(func);
        } else {
          nativeFunctions.push(func);
        }
      } else {
        lodashFunctions.push(func);
      }
    }

    let imports = '';
    let utilities = '';

    // Add individual lodash imports
    if (lodashFunctions.length > 0) {
      const sortedFunctions = lodashFunctions.sort();
      imports += `import { ${sortedFunctions.join(', ')} } from 'lodash';\n`;
    }

    // Add custom utilities for functions that can be replaced
    if (customUtilities.includes('isEmpty')) {
      utilities += `
// Custom utility to replace lodash isEmpty
const isEmpty = (value) => {
  return value == null ||
    (typeof value === 'object' && Object.keys(value).length === 0) ||
    (typeof value === 'string' && value.length === 0) ||
    (Array.isArray(value) && value.length === 0);
};
`;
    }

    return { imports, utilities };
  }

  optimizeFile(filePath) {
    this.stats.filesProcessed++;

    const content = fs.readFileSync(filePath, 'utf8');
    const usage = this.analyzeLodashUsage(content);

    if (!usage.hasFullImport) {
      return false; // No optimization needed
    }

    if (usage.functions.size === 0) {
      this.log(`No lodash function usage found in ${filePath}`, 'warning');
      return false;
    }

    const { imports, utilities } = this.generateOptimizedImports(usage.functions);

    // Replace the full import with individual imports
    let optimizedContent = content.replace(usage.fullImportPattern, '');

    // Add the new imports at the top of the file
    const importSection = imports + utilities;
    optimizedContent = importSection + optimizedContent;

    // Clean up any double newlines
    optimizedContent = optimizedContent.replace(/\n\n\n+/g, '\n\n');

    if (!this.dryRun) {
      fs.writeFileSync(filePath, optimizedContent);
    }

    this.stats.filesModified++;
    this.stats.importsOptimized++;
    this.stats.potentialSavings += this.estimateSavings(usage.functions.size);

    this.log(`Optimized ${filePath} (${usage.functions.size} functions)`, 'success');

    if (this.dryRun) {
      console.log('Would replace:');
      console.log(`  ${usage.fullImportPattern}`);
      console.log('With:');
      console.log(`  ${imports.trim()}`);
      if (utilities) {
        console.log('And add utilities:');
        console.log(utilities.trim());
      }
      console.log('');
    }

    return true;
  }

  estimateSavings(functionCount) {
    // Rough estimate: full lodash is ~70KB, individual imports are ~2-5KB per function
    const fullLodashSize = 70 * 1024; // 70KB
    const individualSize = functionCount * 3 * 1024; // ~3KB per function
    return Math.max(0, fullLodashSize - individualSize);
  }

  run() {
    this.log(`Starting lodash optimization ${this.dryRun ? '(DRY RUN)' : ''}...`);
    this.log(`Scanning directory: ${this.targetPath}`);

    try {
      const files = this.findJSFiles(this.targetPath);
      this.log(`Found ${files.length} JavaScript files`);

      for (const file of files) {
        this.optimizeFile(file);
      }

      this.printStats();

      if (!this.dryRun && this.stats.filesModified > 0) {
        this.log('Running prettier to format modified files...', 'info');
        try {
          execSync('yarn prettier --write --cache .', { stdio: 'pipe' });
          this.log('Code formatting completed', 'success');
        } catch (error) {
          this.log('Warning: Could not run prettier', 'warning');
        }
      }

    } catch (error) {
      this.log(`Error: ${error.message}`, 'error');
      process.exit(1);
    }
  }

  printStats() {
    console.log('\n=== Optimization Statistics ===');
    console.log(`Files processed: ${this.stats.filesProcessed}`);
    console.log(`Files modified: ${this.stats.filesModified}`);
    console.log(`Imports optimized: ${this.stats.importsOptimized}`);
    console.log(`Estimated savings: ${(this.stats.potentialSavings / 1024).toFixed(1)} KB`);

    if (this.stats.filesModified > 0) {
      console.log('\n=== Next Steps ===');
      console.log('1. Review the changes and test your application');
      console.log('2. Run your test suite to ensure everything works');
      console.log('3. Build and measure the actual bundle size reduction');
      console.log('4. Commit the changes if everything looks good');
    }
  }
}

// CLI Interface
function main() {
  const args = process.argv.slice(2);
  const options = {
    dryRun: args.includes('--dry-run'),
    path: (args.find(arg => arg.startsWith('--path=')) || '').replace('--path=', '') || 'ui',
  };

  if (args.includes('--help')) {
    console.log(`
Lodash Import Optimizer

Usage: node development/optimize-lodash.js [options]

Options:
  --dry-run        Show what would be changed without making changes
  --path=<path>    Target directory to optimize (default: ui)
  --help          Show this help message

Examples:
  node development/optimize-lodash.js --dry-run
  node development/optimize-lodash.js --path=ui/components
  node development/optimize-lodash.js
`);
    return;
  }

  const optimizer = new LodashOptimizer(options);
  optimizer.run();
}

if (require.main === module) {
  main();
}

module.exports = LodashOptimizer;