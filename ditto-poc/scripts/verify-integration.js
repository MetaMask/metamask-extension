#!/usr/bin/env node

/**
 * MetaMask Ditto Integration Verification Script
 * 
 * This script verifies that the Ditto integration is working correctly
 * by checking generated files, string consistency, and build artifacts.
 */

const fs = require('fs-extra');
const path = require('path');
const glob = require('glob');
const { promisify } = require('util');

const globAsync = promisify(glob);

class DittoIntegrationVerifier {
  constructor(options = {}) {
    this.options = {
      pocRoot: path.join(__dirname, '..'),
      sampleRoot: path.join(__dirname, '..', 'sample-implementation'),
      ...options
    };
    
    this.results = {
      passed: [],
      failed: [],
      warnings: []
    };
  }

  async run() {
    console.log('🔍 Verifying Ditto integration...\n');
    
    try {
      await this.verifyFileStructure();
      await this.verifyLocaleFiles();
      await this.verifyBuildArtifacts();
      await this.verifyStringConsistency();
      await this.verifyTypeDefinitions();
      await this.verifyConfiguration();
      
      this.printResults();
      
      if (this.results.failed.length > 0) {
        console.log('\n❌ Verification failed!');
        process.exit(1);
      } else {
        console.log('\n✅ Verification passed!');
      }
      
    } catch (error) {
      console.error('❌ Verification error:', error.message);
      process.exit(1);
    }
  }

  async verifyFileStructure() {
    console.log('📁 Verifying file structure...');
    
    const requiredFiles = [
      'ditto/config.yml',
      'scripts/ditto-sync.js',
      'scripts/build-integration.js',
      'scripts/demo.js',
      'scripts/verify-integration.js',
      'package.json',
      'README.md'
    ];
    
    for (const file of requiredFiles) {
      const filePath = path.join(this.options.pocRoot, file);
      if (await fs.pathExists(filePath)) {
        this.pass(`Required file exists: ${file}`);
      } else {
        this.fail(`Missing required file: ${file}`);
      }
    }
    
    // Check sample implementation structure
    const sampleFiles = [
      'sample-implementation/_locales',
      'sample-implementation/ditto',
      'sample-implementation/build'
    ];
    
    for (const file of sampleFiles) {
      const filePath = path.join(this.options.pocRoot, file);
      if (await fs.pathExists(filePath)) {
        this.pass(`Sample directory exists: ${file}`);
      } else {
        this.warn(`Sample directory missing: ${file} (run npm run poc:demo to create)`);
      }
    }
  }

  async verifyLocaleFiles() {
    console.log('\n🌍 Verifying locale files...');
    
    const localesDir = path.join(this.options.sampleRoot, '_locales');
    
    if (!await fs.pathExists(localesDir)) {
      this.warn('Locales directory not found - run npm run poc:demo first');
      return;
    }
    
    const locales = await fs.readdir(localesDir);
    const expectedLocales = ['en', 'es', 'fr'];
    
    for (const locale of expectedLocales) {
      const localeDir = path.join(localesDir, locale);
      const messagesFile = path.join(localeDir, 'messages.json');
      
      if (await fs.pathExists(messagesFile)) {
        this.pass(`Locale file exists: ${locale}/messages.json`);
        
        // Verify file structure
        const messages = await fs.readJson(messagesFile);
        const stringCount = Object.keys(messages).length;
        
        if (stringCount > 0) {
          this.pass(`Locale has ${stringCount} strings: ${locale}`);
        } else {
          this.fail(`Locale has no strings: ${locale}`);
        }
        
        // Verify message format
        const firstKey = Object.keys(messages)[0];
        const firstMessage = messages[firstKey];
        
        if (firstMessage && firstMessage.message) {
          this.pass(`Correct message format: ${locale}`);
        } else {
          this.fail(`Incorrect message format: ${locale}`);
        }
        
      } else {
        this.fail(`Missing messages.json: ${locale}`);
      }
    }
    
    // Check index.json
    const indexFile = path.join(localesDir, 'index.json');
    if (await fs.pathExists(indexFile)) {
      this.pass('Locale index.json exists');
      
      const index = await fs.readJson(indexFile);
      if (Array.isArray(index) && index.length > 0) {
        this.pass(`Index contains ${index.length} locales`);
      } else {
        this.fail('Index.json is empty or malformed');
      }
    } else {
      this.warn('Locale index.json not found');
    }
  }

  async verifyBuildArtifacts() {
    console.log('\n🏗️  Verifying build artifacts...');
    
    const buildDir = path.join(this.options.sampleRoot, 'build');
    
    if (!await fs.pathExists(buildDir)) {
      this.warn('Build directory not found - run npm run poc:build first');
      return;
    }
    
    const requiredArtifacts = [
      'string-manifest.json',
      'build-report.json',
      'github-actions.yml',
      'gulp-integration.js',
      'webpack-plugin.js',
      'webpack-config.js'
    ];
    
    for (const artifact of requiredArtifacts) {
      const artifactPath = path.join(buildDir, artifact);
      if (await fs.pathExists(artifactPath)) {
        this.pass(`Build artifact exists: ${artifact}`);
      } else {
        this.fail(`Missing build artifact: ${artifact}`);
      }
    }
    
    // Verify string manifest
    const manifestPath = path.join(buildDir, 'string-manifest.json');
    if (await fs.pathExists(manifestPath)) {
      const manifest = await fs.readJson(manifestPath);
      
      if (manifest.version && manifest.locales && manifest.totalStrings) {
        this.pass('String manifest has required fields');
        
        if (manifest.totalStrings > 0) {
          this.pass(`String manifest reports ${manifest.totalStrings} total strings`);
        } else {
          this.fail('String manifest reports 0 total strings');
        }
        
        if (manifest.locales.length > 0) {
          this.pass(`String manifest reports ${manifest.locales.length} locales`);
        } else {
          this.fail('String manifest reports no locales');
        }
      } else {
        this.fail('String manifest missing required fields');
      }
    }
    
    // Verify build report
    const reportPath = path.join(buildDir, 'build-report.json');
    if (await fs.pathExists(reportPath)) {
      const report = await fs.readJson(reportPath);
      
      if (report.buildTime && report.timestamp && report.performance) {
        this.pass('Build report has required fields');
        
        if (report.buildTime < 10000) { // Less than 10 seconds
          this.pass(`Build time acceptable: ${report.buildTime}ms`);
        } else {
          this.warn(`Build time high: ${report.buildTime}ms`);
        }
      } else {
        this.fail('Build report missing required fields');
      }
    }
  }

  async verifyStringConsistency() {
    console.log('\n🔄 Verifying string consistency...');
    
    const localesDir = path.join(this.options.sampleRoot, '_locales');
    
    if (!await fs.pathExists(localesDir)) {
      this.warn('Locales directory not found - skipping consistency check');
      return;
    }
    
    const locales = await fs.readdir(localesDir);
    const localeData = {};
    
    // Load all locale files
    for (const locale of locales) {
      if (locale === 'index.json') continue;
      
      const messagesFile = path.join(localesDir, locale, 'messages.json');
      if (await fs.pathExists(messagesFile)) {
        localeData[locale] = await fs.readJson(messagesFile);
      }
    }
    
    if (Object.keys(localeData).length === 0) {
      this.warn('No locale data found for consistency check');
      return;
    }
    
    // Use English as reference
    const englishKeys = Object.keys(localeData.en || {});
    
    if (englishKeys.length === 0) {
      this.warn('No English strings found for consistency check');
      return;
    }
    
    // Check consistency across locales
    for (const [locale, messages] of Object.entries(localeData)) {
      if (locale === 'en') continue;
      
      const localeKeys = Object.keys(messages);
      const missingKeys = englishKeys.filter(key => !localeKeys.includes(key));
      const extraKeys = localeKeys.filter(key => !englishKeys.includes(key));
      
      if (missingKeys.length === 0) {
        this.pass(`No missing keys in ${locale}`);
      } else {
        this.warn(`Missing keys in ${locale}: ${missingKeys.slice(0, 3).join(', ')}${missingKeys.length > 3 ? '...' : ''}`);
      }
      
      if (extraKeys.length === 0) {
        this.pass(`No extra keys in ${locale}`);
      } else {
        this.warn(`Extra keys in ${locale}: ${extraKeys.slice(0, 3).join(', ')}${extraKeys.length > 3 ? '...' : ''}`);
      }
      
      // Check for empty strings
      const emptyStrings = localeKeys.filter(key => 
        !messages[key].message || messages[key].message.trim() === ''
      );
      
      if (emptyStrings.length === 0) {
        this.pass(`No empty strings in ${locale}`);
      } else {
        this.warn(`Empty strings in ${locale}: ${emptyStrings.length}`);
      }
    }
  }

  async verifyTypeDefinitions() {
    console.log('\n📝 Verifying TypeScript definitions...');
    
    const dittoDir = path.join(this.options.sampleRoot, 'ditto');
    
    if (!await fs.pathExists(dittoDir)) {
      this.warn('Ditto directory not found - skipping type definition check');
      return;
    }
    
    const typeDefFile = path.join(dittoDir, 'types.d.ts');
    
    if (await fs.pathExists(typeDefFile)) {
      this.pass('TypeScript definitions file exists');
      
      const typeDefContent = await fs.readFile(typeDefFile, 'utf8');
      
      if (typeDefContent.includes('MetaMaskStringKeys')) {
        this.pass('TypeScript definitions contain MetaMaskStringKeys');
      } else {
        this.fail('TypeScript definitions missing MetaMaskStringKeys');
      }
      
      if (typeDefContent.includes('MetaMaskStrings')) {
        this.pass('TypeScript definitions contain MetaMaskStrings interface');
      } else {
        this.fail('TypeScript definitions missing MetaMaskStrings interface');
      }
      
      if (typeDefContent.includes('export declare function t')) {
        this.pass('TypeScript definitions contain t function declaration');
      } else {
        this.fail('TypeScript definitions missing t function declaration');
      }
    } else {
      this.fail('TypeScript definitions file not found');
    }
  }

  async verifyConfiguration() {
    console.log('\n⚙️  Verifying configuration...');
    
    const configFile = path.join(this.options.pocRoot, 'ditto', 'config.yml');
    
    if (await fs.pathExists(configFile)) {
      this.pass('Ditto config.yml exists');
      
      const configContent = await fs.readFile(configFile, 'utf8');
      
      if (configContent.includes('sources:')) {
        this.pass('Config contains sources configuration');
      } else {
        this.fail('Config missing sources configuration');
      }
      
      if (configContent.includes('variants: true')) {
        this.pass('Config enables variants');
      } else {
        this.warn('Config does not enable variants');
      }
      
      if (configContent.includes('localeMapping:')) {
        this.pass('Config contains locale mapping');
      } else {
        this.warn('Config missing locale mapping');
      }
    } else {
      this.fail('Ditto config.yml not found');
    }
    
    // Check package.json
    const packageFile = path.join(this.options.pocRoot, 'package.json');
    if (await fs.pathExists(packageFile)) {
      this.pass('Package.json exists');
      
      const packageData = await fs.readJson(packageFile);
      
      if (packageData.dependencies && packageData.dependencies['@dittowords/cli']) {
        this.pass('Package.json includes Ditto CLI dependency');
      } else {
        this.fail('Package.json missing Ditto CLI dependency');
      }
      
      if (packageData.scripts && packageData.scripts['ditto:sync']) {
        this.pass('Package.json includes Ditto sync script');
      } else {
        this.fail('Package.json missing Ditto sync script');
      }
    } else {
      this.fail('Package.json not found');
    }
  }

  pass(message) {
    this.results.passed.push(message);
    console.log(`  ✅ ${message}`);
  }

  fail(message) {
    this.results.failed.push(message);
    console.log(`  ❌ ${message}`);
  }

  warn(message) {
    this.results.warnings.push(message);
    console.log(`  ⚠️  ${message}`);
  }

  printResults() {
    console.log('\n📊 Verification Results:');
    console.log(`  Passed: ${this.results.passed.length}`);
    console.log(`  Failed: ${this.results.failed.length}`);
    console.log(`  Warnings: ${this.results.warnings.length}`);
    
    if (this.results.failed.length > 0) {
      console.log('\n❌ Failed Checks:');
      this.results.failed.forEach(failure => console.log(`  - ${failure}`));
    }
    
    if (this.results.warnings.length > 0) {
      console.log('\n⚠️  Warnings:');
      this.results.warnings.forEach(warning => console.log(`  - ${warning}`));
    }
  }
}

// Main execution
if (require.main === module) {
  const verifier = new DittoIntegrationVerifier();
  verifier.run();
}

module.exports = DittoIntegrationVerifier;