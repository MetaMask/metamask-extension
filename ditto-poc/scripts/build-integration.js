#!/usr/bin/env node

/**
 * MetaMask Build Integration Script
 * 
 * This script demonstrates how to integrate Ditto sync into MetaMask's build process.
 * It can be integrated into both the gulp and webpack build systems.
 * 
 * Usage:
 *   node scripts/build-integration.js
 *   node scripts/build-integration.js --build-system=gulp
 *   node scripts/build-integration.js --build-system=webpack
 */

const fs = require('fs-extra');
const path = require('path');
const { exec } = require('child_process');
const { promisify } = require('util');

const execAsync = promisify(exec);

class BuildIntegration {
  constructor(options = {}) {
    this.options = {
      buildSystem: 'gulp', // 'gulp' or 'webpack'
      outputPath: path.join(__dirname, '..', 'sample-implementation', 'build'),
      dittoPath: path.join(__dirname, '..', 'sample-implementation', '_locales'),
      targetPath: path.join(__dirname, '..', 'sample-implementation', 'dist'),
      ...options
    };
    
    this.buildStart = Date.now();
  }

  async run() {
    try {
      console.log('🔧 Starting build integration...');
      
      // Step 1: Pre-build - Sync from Ditto
      await this.preBuildSync();
      
      // Step 2: Validate strings
      await this.validateStrings();
      
      // Step 3: Process locale files
      await this.processLocaleFiles();
      
      // Step 4: Generate build artifacts
      await this.generateBuildArtifacts();
      
      // Step 5: Post-build validation
      await this.postBuildValidation();
      
      const buildTime = Date.now() - this.buildStart;
      console.log(`✅ Build integration completed in ${buildTime}ms`);
      
    } catch (error) {
      console.error('❌ Build integration failed:', error.message);
      process.exit(1);
    }
  }

  async preBuildSync() {
    console.log('📡 Pre-build: Syncing from Ditto...');
    
    // Run Ditto sync with error handling
    try {
      const DittoSyncManager = require('./ditto-sync');
      const syncManager = new DittoSyncManager();
      await syncManager.run();
      
      console.log('  ✓ Ditto sync completed');
    } catch (error) {
      console.warn('  ⚠️  Ditto sync failed, using existing strings');
      await this.useExistingStrings();
    }
  }

  async useExistingStrings() {
    // Fallback to existing strings if Ditto sync fails
    const existingStrings = path.join(__dirname, '..', '..', 'app', '_locales');
    
    if (await fs.pathExists(existingStrings)) {
      await fs.copy(existingStrings, this.options.dittoPath);
      console.log('  ✓ Using existing locale files');
    } else {
      throw new Error('No fallback strings available');
    }
  }

  async validateStrings() {
    console.log('✅ Validating strings...');
    
    const localesDir = this.options.dittoPath;
    const locales = await fs.readdir(localesDir);
    
    let totalStrings = 0;
    let errors = [];
    
    for (const locale of locales) {
      if (locale === 'index.json') continue;
      
      const messagesPath = path.join(localesDir, locale, 'messages.json');
      
      if (await fs.pathExists(messagesPath)) {
        const messages = await fs.readJson(messagesPath);
        
        // Check for required strings
        const requiredStrings = ['appName', 'appDescription'];
        for (const required of requiredStrings) {
          if (!messages[required]) {
            errors.push(`Missing required string "${required}" in locale "${locale}"`);
          }
        }
        
        // Check for empty strings
        for (const [key, value] of Object.entries(messages)) {
          if (!value.message || value.message.trim() === '') {
            errors.push(`Empty string "${key}" in locale "${locale}"`);
          }
        }
        
        totalStrings += Object.keys(messages).length;
      } else {
        errors.push(`Missing messages.json for locale: ${locale}`);
      }
    }
    
    if (errors.length > 0) {
      console.error('❌ Validation errors:');
      errors.forEach(error => console.error(`  - ${error}`));
      
      if (this.options.strictMode) {
        throw new Error('String validation failed');
      }
    }
    
    console.log(`  ✓ Validated ${totalStrings} strings across ${locales.length - 1} locales`);
  }

  async processLocaleFiles() {
    console.log('🔄 Processing locale files...');
    
    const localesDir = this.options.dittoPath;
    const locales = await fs.readdir(localesDir);
    
    for (const locale of locales) {
      if (locale === 'index.json') continue;
      
      const messagesPath = path.join(localesDir, locale, 'messages.json');
      
      if (await fs.pathExists(messagesPath)) {
        const messages = await fs.readJson(messagesPath);
        
        // Process messages for build system
        const processed = await this.processMessages(messages, locale);
        
        // Save processed messages
        await fs.outputJson(messagesPath, processed, { spaces: 2 });
      }
    }
    
    console.log('  ✓ Processed locale files');
  }

  async processMessages(messages, locale) {
    const processed = {};
    
    for (const [key, value] of Object.entries(messages)) {
      processed[key] = {
        message: value.message,
        description: value.description || `String for ${key}`,
        // Add MetaMask-specific metadata
        ...(locale === 'en' && { isBaseString: true }),
        lastModified: new Date().toISOString()
      };
    }
    
    return processed;
  }

  async generateBuildArtifacts() {
    console.log('🏗️  Generating build artifacts...');
    
    await fs.ensureDir(this.options.outputPath);
    
    // Generate different artifacts based on build system
    if (this.options.buildSystem === 'gulp') {
      await this.generateGulpArtifacts();
    } else if (this.options.buildSystem === 'webpack') {
      await this.generateWebpackArtifacts();
    }
    
    // Generate common artifacts
    await this.generateCommonArtifacts();
  }

  async generateGulpArtifacts() {
    console.log('  📦 Generating Gulp artifacts...');
    
    // Generate gulp task integration
    const gulpTaskCode = `
const DittoSyncManager = require('./ditto-poc/scripts/ditto-sync');

// Add to your gulpfile.js
const dittoSync = async () => {
  const syncManager = new DittoSyncManager();
  await syncManager.run();
};

// Add to your build tasks
const buildWithDitto = gulp.series(
  dittoSync,
  gulp.parallel(
    // ... your existing tasks
  )
);
`;
    
    await fs.outputFile(
      path.join(this.options.outputPath, 'gulp-integration.js'),
      gulpTaskCode
    );
    
    console.log('    ✓ Generated Gulp integration');
  }

  async generateWebpackArtifacts() {
    console.log('  📦 Generating Webpack artifacts...');
    
    // Generate webpack plugin
    const webpackPluginCode = `
const DittoSyncManager = require('./ditto-poc/scripts/ditto-sync');

class DittoSyncPlugin {
  constructor(options = {}) {
    this.options = options;
  }

  apply(compiler) {
    compiler.hooks.beforeRun.tapAsync('DittoSyncPlugin', async (compilation, callback) => {
      try {
        const syncManager = new DittoSyncManager(this.options);
        await syncManager.run();
        callback();
      } catch (error) {
        callback(error);
      }
    });
  }
}

module.exports = DittoSyncPlugin;
`;
    
    await fs.outputFile(
      path.join(this.options.outputPath, 'webpack-plugin.js'),
      webpackPluginCode
    );
    
    // Generate webpack config modification
    const webpackConfigCode = `
const DittoSyncPlugin = require('./ditto-poc/sample-implementation/build/webpack-plugin');

// Add to your webpack.config.js plugins array
plugins: [
  new DittoSyncPlugin({
    // Plugin options
  }),
  // ... other plugins
]
`;
    
    await fs.outputFile(
      path.join(this.options.outputPath, 'webpack-config.js'),
      webpackConfigCode
    );
    
    console.log('    ✓ Generated Webpack integration');
  }

  async generateCommonArtifacts() {
    console.log('  📦 Generating common artifacts...');
    
    // Generate string manifest
    const stringManifest = await this.generateStringManifest();
    await fs.outputJson(
      path.join(this.options.outputPath, 'string-manifest.json'),
      stringManifest,
      { spaces: 2 }
    );
    
    // Generate build report
    const buildReport = await this.generateBuildReport();
    await fs.outputJson(
      path.join(this.options.outputPath, 'build-report.json'),
      buildReport,
      { spaces: 2 }
    );
    
    // Generate CI/CD configuration
    const ciConfig = await this.generateCIConfig();
    await fs.outputFile(
      path.join(this.options.outputPath, 'github-actions.yml'),
      ciConfig
    );
    
    console.log('    ✓ Generated common artifacts');
  }

  async generateStringManifest() {
    const manifest = {
      version: '1.0.0',
      generated: new Date().toISOString(),
      locales: [],
      totalStrings: 0,
      coverage: {}
    };
    
    const localesDir = this.options.dittoPath;
    const locales = await fs.readdir(localesDir);
    
    for (const locale of locales) {
      if (locale === 'index.json') continue;
      
      const messagesPath = path.join(localesDir, locale, 'messages.json');
      
      if (await fs.pathExists(messagesPath)) {
        const messages = await fs.readJson(messagesPath);
        const stringCount = Object.keys(messages).length;
        
        manifest.locales.push({
          code: locale,
          stringCount,
          coverage: this.calculateCoverage(messages)
        });
        
        manifest.totalStrings += stringCount;
      }
    }
    
    return manifest;
  }

  calculateCoverage(messages) {
    const total = Object.keys(messages).length;
    const complete = Object.values(messages).filter(
      msg => msg.message && msg.message.trim() !== ''
    ).length;
    
    return Math.round((complete / total) * 100);
  }

  async generateBuildReport() {
    const buildTime = Date.now() - this.buildStart;
    
    return {
      buildSystem: this.options.buildSystem,
      buildTime,
      timestamp: new Date().toISOString(),
      version: process.env.npm_package_version || '1.0.0',
      environment: process.env.NODE_ENV || 'development',
      performance: {
        buildTime,
        memoryUsage: process.memoryUsage(),
        nodeVersion: process.version
      }
    };
  }

  async generateCIConfig() {
    return `
name: Ditto Sync

on:
  push:
    branches: [ main, develop ]
  pull_request:
    branches: [ main ]
  schedule:
    # Run daily at 2 AM UTC
    - cron: '0 2 * * *'

jobs:
  ditto-sync:
    runs-on: ubuntu-latest
    
    steps:
    - uses: actions/checkout@v3
    
    - name: Setup Node.js
      uses: actions/setup-node@v3
      with:
        node-version: '18'
        cache: 'npm'
    
    - name: Install dependencies
      run: npm ci
    
    - name: Sync from Ditto
      env:
        DITTO_API_KEY: \${{ secrets.DITTO_API_KEY }}
      run: npm run ditto:sync
    
    - name: Validate strings
      run: npm run poc:verify
    
    - name: Create Pull Request
      if: github.event_name == 'schedule'
      uses: peter-evans/create-pull-request@v5
      with:
        token: \${{ secrets.GITHUB_TOKEN }}
        commit-message: 'chore: update strings from Ditto'
        title: 'Update strings from Ditto'
        body: |
          This PR updates the localization strings from Ditto.
          
          **Changes:**
          - Updated translations from Ditto platform
          - Validated string consistency
          - Generated new string manifest
          
          Please review the changes and merge if everything looks correct.
        branch: ditto-sync-update
        delete-branch: true
`;
  }

  async postBuildValidation() {
    console.log('✅ Post-build validation...');
    
    // Validate that all expected files were generated
    const requiredFiles = [
      'string-manifest.json',
      'build-report.json',
      'github-actions.yml'
    ];
    
    for (const file of requiredFiles) {
      const filePath = path.join(this.options.outputPath, file);
      if (!await fs.pathExists(filePath)) {
        throw new Error(`Missing required build artifact: ${file}`);
      }
    }
    
    // Copy processed locale files to target
    await fs.copy(this.options.dittoPath, this.options.targetPath);
    
    console.log('  ✓ Post-build validation completed');
  }
}

// Main execution
if (require.main === module) {
  const args = process.argv.slice(2);
  const options = {};
  
  // Parse command line arguments
  args.forEach(arg => {
    if (arg.startsWith('--build-system=')) {
      options.buildSystem = arg.split('=')[1];
    } else if (arg === '--strict') {
      options.strictMode = true;
    }
  });
  
  const buildIntegration = new BuildIntegration(options);
  buildIntegration.run();
}

module.exports = BuildIntegration;