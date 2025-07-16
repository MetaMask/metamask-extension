#!/usr/bin/env node

/**
 * MetaMask Ditto Sync Script
 * 
 * This script handles syncing strings from Ditto and converting them
 * to MetaMask's expected locale format.
 * 
 * Usage:
 *   node scripts/ditto-sync.js
 *   node scripts/ditto-sync.js --watch
 *   node scripts/ditto-sync.js --locales=en,es,fr
 */

const fs = require('fs-extra');
const path = require('path');
const { exec } = require('child_process');
const { promisify } = require('util');
const glob = require('glob');
const _ = require('lodash');

const execAsync = promisify(exec);

class DittoSyncManager {
  constructor(options = {}) {
    this.options = {
      configPath: path.join(__dirname, '..', 'ditto', 'config.yml'),
      outputPath: path.join(__dirname, '..', 'sample-implementation', 'ditto'),
      localesPath: path.join(__dirname, '..', 'sample-implementation', '_locales'),
      watch: false,
      locales: null,
      ...options
    };
    
    this.stats = {
      totalStrings: 0,
      translatedStrings: 0,
      locales: [],
      errors: []
    };
  }

  async run() {
    try {
      console.log('🚀 Starting Ditto sync process...');
      
      // Step 1: Run Ditto CLI to fetch latest strings
      await this.runDittoCli();
      
      // Step 2: Process the fetched data
      await this.processStrings();
      
      // Step 3: Generate locale files
      await this.generateLocaleFiles();
      
      // Step 4: Generate TypeScript definitions
      await this.generateTypeDefinitions();
      
      // Step 5: Validate output
      await this.validateOutput();
      
      console.log('✅ Ditto sync completed successfully!');
      this.printStats();
      
    } catch (error) {
      console.error('❌ Ditto sync failed:', error.message);
      process.exit(1);
    }
  }

  async runDittoCli() {
    console.log('📡 Fetching strings from Ditto...');
    
    try {
      const command = `npx @dittowords/cli pull --config ${this.options.configPath}`;
      const { stdout, stderr } = await execAsync(command);
      
      if (stderr) {
        console.warn('⚠️  Ditto CLI warnings:', stderr);
      }
      
      console.log('📦 Ditto CLI output:', stdout);
      
    } catch (error) {
      // Handle case where Ditto API is unavailable
      console.warn('⚠️  Ditto API unavailable, using cached/local strings');
      await this.useFallbackStrings();
    }
  }

  async processStrings() {
    console.log('🔄 Processing fetched strings...');
    
    const dittoOutputPath = this.options.outputPath;
    
    if (!await fs.pathExists(dittoOutputPath)) {
      throw new Error(`Ditto output directory not found: ${dittoOutputPath}`);
    }
    
    // Read the generated strings
    const stringFiles = await glob('**/*.json', { cwd: dittoOutputPath });
    
    for (const file of stringFiles) {
      const filePath = path.join(dittoOutputPath, file);
      const content = await fs.readJson(filePath);
      
      // Process and validate the content
      await this.processStringFile(file, content);
    }
    
    console.log(`📊 Processed ${stringFiles.length} string files`);
  }

  async processStringFile(file, content) {
    // Convert Ditto format to MetaMask format
    const processed = {};
    
    Object.entries(content).forEach(([key, value]) => {
      processed[key] = {
        message: value,
        description: this.generateDescription(key, value)
      };
    });
    
    // Save processed file
    const outputPath = path.join(this.options.outputPath, file);
    await fs.outputJson(outputPath, processed, { spaces: 2 });
    
    this.stats.totalStrings += Object.keys(content).length;
  }

  generateDescription(key, value) {
    // Generate meaningful descriptions based on key patterns
    const keyLower = key.toLowerCase();
    
    if (keyLower.includes('error')) {
      return `Error message: ${value}`;
    } else if (keyLower.includes('button')) {
      return `Button text: ${value}`;
    } else if (keyLower.includes('title')) {
      return `Title text: ${value}`;
    } else if (keyLower.includes('description')) {
      return `Description text: ${value}`;
    } else if (keyLower.includes('label')) {
      return `Label text: ${value}`;
    } else {
      return `UI text: ${value}`;
    }
  }

  async generateLocaleFiles() {
    console.log('🌍 Generating locale files...');
    
    const localesDir = this.options.localesPath;
    await fs.ensureDir(localesDir);
    
    // Create locale directory structure matching MetaMask's format
    const localeMap = {
      'en': 'en',
      'es': 'es',
      'fr': 'fr',
      'de': 'de',
      'it': 'it',
      'pt': 'pt',
      'pt_BR': 'pt_BR',
      'ru': 'ru',
      'ja': 'ja',
      'ko': 'ko',
      'zh_CN': 'zh_CN',
      'zh_TW': 'zh_TW'
    };
    
    for (const [dittoLocale, metamaskLocale] of Object.entries(localeMap)) {
      const sourceFile = path.join(this.options.outputPath, `${dittoLocale}.json`);
      const targetDir = path.join(localesDir, metamaskLocale);
      const targetFile = path.join(targetDir, 'messages.json');
      
      if (await fs.pathExists(sourceFile)) {
        await fs.ensureDir(targetDir);
        await fs.copy(sourceFile, targetFile);
        
        this.stats.locales.push(metamaskLocale);
        console.log(`  ✓ Generated ${metamaskLocale}/messages.json`);
      } else {
        console.warn(`  ⚠️  Missing strings for locale: ${dittoLocale}`);
      }
    }
    
    // Generate index.json
    await this.generateLocaleIndex();
  }

  async generateLocaleIndex() {
    const indexPath = path.join(this.options.localesPath, 'index.json');
    
    const index = this.stats.locales.map(locale => ({
      code: locale,
      name: this.getLocaleName(locale)
    }));
    
    await fs.outputJson(indexPath, index, { spaces: 2 });
    console.log('  ✓ Generated index.json');
  }

  getLocaleName(locale) {
    const names = {
      'en': 'English',
      'es': 'Español',
      'fr': 'Français',
      'de': 'Deutsch',
      'it': 'Italiano',
      'pt': 'Português',
      'pt_BR': 'Português (Brasil)',
      'ru': 'Русский',
      'ja': '日本語',
      'ko': '한국어',
      'zh_CN': '中文(简体)',
      'zh_TW': '中文(繁體)'
    };
    
    return names[locale] || locale;
  }

  async generateTypeDefinitions() {
    console.log('📝 Generating TypeScript definitions...');
    
    const englishStrings = path.join(this.options.localesPath, 'en', 'messages.json');
    
    if (await fs.pathExists(englishStrings)) {
      const strings = await fs.readJson(englishStrings);
      const keys = Object.keys(strings);
      
      const typeDef = `
// Auto-generated TypeScript definitions for MetaMask strings
// Generated on: ${new Date().toISOString()}

export type MetaMaskStringKeys = ${keys.map(key => `'${key}'`).join(' | ')};

export interface MetaMaskStrings {
${keys.map(key => `  '${key}': string;`).join('\n')}
}

export declare function t(key: MetaMaskStringKeys, ...args: any[]): string;
`;
      
      const typeDefPath = path.join(this.options.outputPath, 'types.d.ts');
      await fs.outputFile(typeDefPath, typeDef);
      
      console.log('  ✓ Generated TypeScript definitions');
    }
  }

  async validateOutput() {
    console.log('✅ Validating output...');
    
    const localesDir = this.options.localesPath;
    const locales = await fs.readdir(localesDir);
    
    let hasErrors = false;
    
    for (const locale of locales) {
      if (locale === 'index.json') continue;
      
      const messagesPath = path.join(localesDir, locale, 'messages.json');
      
      if (await fs.pathExists(messagesPath)) {
        const messages = await fs.readJson(messagesPath);
        
        // Validate structure
        for (const [key, value] of Object.entries(messages)) {
          if (!value.message) {
            console.error(`  ❌ Missing message for key "${key}" in locale "${locale}"`);
            hasErrors = true;
          }
        }
        
        console.log(`  ✓ Validated ${locale} (${Object.keys(messages).length} strings)`);
      } else {
        console.warn(`  ⚠️  Missing messages.json for locale: ${locale}`);
      }
    }
    
    if (hasErrors) {
      throw new Error('Validation failed - see errors above');
    }
  }

  async useFallbackStrings() {
    console.log('🔄 Using fallback strings...');
    
    // Copy from existing MetaMask locale files as fallback
    const fallbackPath = path.join(__dirname, '..', '..', 'app', '_locales');
    const outputPath = this.options.localesPath;
    
    if (await fs.pathExists(fallbackPath)) {
      await fs.copy(fallbackPath, outputPath);
      console.log('  ✓ Copied fallback strings');
    } else {
      // Create minimal English strings for demo
      const minimal = {
        'appName': { message: 'MetaMask', description: 'App name' },
        'appDescription': { message: 'Ethereum browser extension', description: 'App description' }
      };
      
      await fs.outputJson(path.join(outputPath, 'en', 'messages.json'), minimal, { spaces: 2 });
      console.log('  ✓ Created minimal fallback strings');
    }
  }

  printStats() {
    console.log('\n📊 Sync Statistics:');
    console.log(`  Total strings: ${this.stats.totalStrings}`);
    console.log(`  Locales processed: ${this.stats.locales.length}`);
    console.log(`  Locales: ${this.stats.locales.join(', ')}`);
    
    if (this.stats.errors.length > 0) {
      console.log(`  Errors: ${this.stats.errors.length}`);
      this.stats.errors.forEach(error => console.log(`    - ${error}`));
    }
  }
}

// Main execution
if (require.main === module) {
  const args = process.argv.slice(2);
  const options = {};
  
  // Parse command line arguments
  args.forEach(arg => {
    if (arg === '--watch') {
      options.watch = true;
    } else if (arg.startsWith('--locales=')) {
      options.locales = arg.split('=')[1].split(',');
    }
  });
  
  const syncManager = new DittoSyncManager(options);
  syncManager.run();
}

module.exports = DittoSyncManager;