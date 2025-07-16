#!/usr/bin/env node

/**
 * MetaMask Ditto POC Demo
 * 
 * This script demonstrates the complete Ditto integration workflow
 * including setup, sync, and build integration.
 */

const fs = require('fs-extra');
const path = require('path');
const { promisify } = require('util');
const { exec } = require('child_process');

const execAsync = promisify(exec);

class DittoPOCDemo {
  constructor() {
    this.pocRoot = path.join(__dirname, '..');
    this.sampleRoot = path.join(this.pocRoot, 'sample-implementation');
    this.step = 0;
  }

  async run() {
    console.log('🚀 Starting MetaMask Ditto POC Demo\n');
    
    try {
      await this.setupDemo();
      await this.demonstrateSync();
      await this.demonstrateBuildIntegration();
      await this.demonstrateWorkflow();
      await this.showResults();
      
      console.log('\n✅ Demo completed successfully!');
      console.log('📚 Check the generated files in sample-implementation/');
      
    } catch (error) {
      console.error('\n❌ Demo failed:', error.message);
      process.exit(1);
    }
  }

  async setupDemo() {
    this.logStep('Setting up demo environment');
    
    // Create sample directories
    await fs.ensureDir(path.join(this.sampleRoot, 'ditto'));
    await fs.ensureDir(path.join(this.sampleRoot, '_locales'));
    await fs.ensureDir(path.join(this.sampleRoot, 'build'));
    
    // Create sample Ditto data (simulating what would come from Ditto API)
    await this.createSampleDittoData();
    
    console.log('  ✓ Created sample directory structure');
    console.log('  ✓ Generated sample Ditto data');
  }

  async createSampleDittoData() {
    // Sample English strings
    const englishStrings = {
      'appName': 'MetaMask',
      'appDescription': 'Ethereum browser extension',
      'connectWallet': 'Connect Wallet',
      'disconnectWallet': 'Disconnect Wallet',
      'accountBalance': 'Account Balance',
      'sendTransaction': 'Send Transaction',
      'receiveTokens': 'Receive Tokens',
      'transactionHistory': 'Transaction History',
      'settings': 'Settings',
      'security': 'Security',
      'networks': 'Networks',
      'addNetwork': 'Add Network',
      'customNetwork': 'Custom Network',
      'networkName': 'Network Name',
      'rpcUrl': 'RPC URL',
      'chainId': 'Chain ID',
      'currencySymbol': 'Currency Symbol',
      'blockExplorer': 'Block Explorer',
      'save': 'Save',
      'cancel': 'Cancel',
      'confirm': 'Confirm',
      'reject': 'Reject',
      'loading': 'Loading...',
      'error': 'Error',
      'success': 'Success',
      'warning': 'Warning',
      'info': 'Info',
      'copy': 'Copy',
      'copied': 'Copied',
      'paste': 'Paste',
      'clear': 'Clear',
      'refresh': 'Refresh',
      'back': 'Back',
      'next': 'Next',
      'previous': 'Previous',
      'close': 'Close',
      'open': 'Open',
      'edit': 'Edit',
      'delete': 'Delete',
      'add': 'Add',
      'remove': 'Remove',
      'update': 'Update',
      'upgrade': 'Upgrade',
      'downgrade': 'Downgrade',
      'enable': 'Enable',
      'disable': 'Disable',
      'lock': 'Lock',
      'unlock': 'Unlock',
      'import': 'Import',
      'export': 'Export',
      'backup': 'Backup',
      'restore': 'Restore'
    };

    // Sample Spanish strings
    const spanishStrings = {
      'appName': 'MetaMask',
      'appDescription': 'Extensión de navegador Ethereum',
      'connectWallet': 'Conectar Billetera',
      'disconnectWallet': 'Desconectar Billetera',
      'accountBalance': 'Saldo de Cuenta',
      'sendTransaction': 'Enviar Transacción',
      'receiveTokens': 'Recibir Tokens',
      'transactionHistory': 'Historial de Transacciones',
      'settings': 'Configuración',
      'security': 'Seguridad',
      'networks': 'Redes',
      'addNetwork': 'Agregar Red',
      'customNetwork': 'Red Personalizada',
      'networkName': 'Nombre de Red',
      'rpcUrl': 'URL RPC',
      'chainId': 'ID de Cadena',
      'currencySymbol': 'Símbolo de Moneda',
      'blockExplorer': 'Explorador de Bloques',
      'save': 'Guardar',
      'cancel': 'Cancelar',
      'confirm': 'Confirmar',
      'reject': 'Rechazar',
      'loading': 'Cargando...',
      'error': 'Error',
      'success': 'Éxito',
      'warning': 'Advertencia',
      'info': 'Información',
      'copy': 'Copiar',
      'copied': 'Copiado',
      'paste': 'Pegar',
      'clear': 'Limpiar',
      'refresh': 'Actualizar',
      'back': 'Atrás',
      'next': 'Siguiente',
      'previous': 'Anterior',
      'close': 'Cerrar',
      'open': 'Abrir',
      'edit': 'Editar',
      'delete': 'Eliminar',
      'add': 'Agregar',
      'remove': 'Remover',
      'update': 'Actualizar',
      'upgrade': 'Actualizar',
      'downgrade': 'Degradar',
      'enable': 'Habilitar',
      'disable': 'Deshabilitar',
      'lock': 'Bloquear',
      'unlock': 'Desbloquear',
      'import': 'Importar',
      'export': 'Exportar',
      'backup': 'Respaldo',
      'restore': 'Restaurar'
    };

    // Sample French strings
    const frenchStrings = {
      'appName': 'MetaMask',
      'appDescription': 'Extension de navigateur Ethereum',
      'connectWallet': 'Connecter le Portefeuille',
      'disconnectWallet': 'Déconnecter le Portefeuille',
      'accountBalance': 'Solde du Compte',
      'sendTransaction': 'Envoyer Transaction',
      'receiveTokens': 'Recevoir Tokens',
      'transactionHistory': 'Historique des Transactions',
      'settings': 'Paramètres',
      'security': 'Sécurité',
      'networks': 'Réseaux',
      'addNetwork': 'Ajouter Réseau',
      'customNetwork': 'Réseau Personnalisé',
      'networkName': 'Nom du Réseau',
      'rpcUrl': 'URL RPC',
      'chainId': 'ID de Chaîne',
      'currencySymbol': 'Symbole de Devise',
      'blockExplorer': 'Explorateur de Blocs',
      'save': 'Sauvegarder',
      'cancel': 'Annuler',
      'confirm': 'Confirmer',
      'reject': 'Rejeter',
      'loading': 'Chargement...',
      'error': 'Erreur',
      'success': 'Succès',
      'warning': 'Avertissement',
      'info': 'Information',
      'copy': 'Copier',
      'copied': 'Copié',
      'paste': 'Coller',
      'clear': 'Effacer',
      'refresh': 'Actualiser',
      'back': 'Retour',
      'next': 'Suivant',
      'previous': 'Précédent',
      'close': 'Fermer',
      'open': 'Ouvrir',
      'edit': 'Éditer',
      'delete': 'Supprimer',
      'add': 'Ajouter',
      'remove': 'Retirer',
      'update': 'Mettre à jour',
      'upgrade': 'Améliorer',
      'downgrade': 'Rétrograder',
      'enable': 'Activer',
      'disable': 'Désactiver',
      'lock': 'Verrouiller',
      'unlock': 'Déverrouiller',
      'import': 'Importer',
      'export': 'Exporter',
      'backup': 'Sauvegarde',
      'restore': 'Restaurer'
    };

    // Save sample data
    await fs.outputJson(path.join(this.sampleRoot, 'ditto', 'en.json'), englishStrings, { spaces: 2 });
    await fs.outputJson(path.join(this.sampleRoot, 'ditto', 'es.json'), spanishStrings, { spaces: 2 });
    await fs.outputJson(path.join(this.sampleRoot, 'ditto', 'fr.json'), frenchStrings, { spaces: 2 });
  }

  async demonstrateSync() {
    this.logStep('Demonstrating Ditto sync process');
    
    // Run the sync script
    const DittoSyncManager = require('./ditto-sync');
    const syncManager = new DittoSyncManager({
      outputPath: path.join(this.sampleRoot, 'ditto'),
      localesPath: path.join(this.sampleRoot, '_locales')
    });
    
    await syncManager.run();
    
    console.log('  ✓ Ditto sync completed');
    console.log('  ✓ Generated Chrome extension format locale files');
    console.log('  ✓ Created TypeScript definitions');
  }

  async demonstrateBuildIntegration() {
    this.logStep('Demonstrating build integration');
    
    // Run the build integration script
    const BuildIntegration = require('./build-integration');
    const buildIntegration = new BuildIntegration({
      outputPath: path.join(this.sampleRoot, 'build'),
      dittoPath: path.join(this.sampleRoot, '_locales'),
      targetPath: path.join(this.sampleRoot, 'dist')
    });
    
    await buildIntegration.run();
    
    console.log('  ✓ Build integration completed');
    console.log('  ✓ Generated build artifacts');
    console.log('  ✓ Created CI/CD configuration');
  }

  async demonstrateWorkflow() {
    this.logStep('Demonstrating translation workflow');
    
    // Create workflow documentation
    const workflowDoc = this.generateWorkflowDoc();
    await fs.outputFile(
      path.join(this.sampleRoot, 'workflow-demo.md'),
      workflowDoc
    );
    
    // Create comparison table
    const comparisonTable = this.generateComparisonTable();
    await fs.outputFile(
      path.join(this.sampleRoot, 'comparison.md'),
      comparisonTable
    );
    
    console.log('  ✓ Generated workflow documentation');
    console.log('  ✓ Created comparison table');
  }

  generateWorkflowDoc() {
    return `
# MetaMask Ditto Translation Workflow

## Current Workflow
1. Developer creates PR with new strings
2. Community translates via GitHub comments/PRs
3. Maintainers review and merge translations
4. Strings deployed with release

## Proposed Ditto Workflow
1. Developer adds strings to Ditto or uses existing
2. Ditto notifies translators of new content
3. Translators work in Ditto's interface
4. Automated sync creates PR with updates
5. Maintainers review and merge
6. Strings available immediately

## Benefits
- **Faster Translation**: Dedicated translation interface
- **Better Context**: Translators see mockups and context
- **Quality Control**: Built-in review and approval workflows
- **Automation**: Reduced manual work for maintainers
- **Real-time Updates**: Strings can be updated without releases

## Migration Path
1. **Phase 1**: Set up Ditto workspace with existing strings
2. **Phase 2**: Train translators on Ditto interface
3. **Phase 3**: Implement automated sync
4. **Phase 4**: Full migration to Ditto workflow
`;
  }

  generateComparisonTable() {
    return `
# Current vs. Ditto Comparison

| Aspect | Current System | Ditto System |
|--------|---------------|--------------|
| **String Management** | Manual JSON files | Centralized platform |
| **Translation Interface** | GitHub/Text editors | Dedicated UI with context |
| **Collaboration** | GitHub comments | Built-in review system |
| **Progress Tracking** | Manual tracking | Automatic progress tracking |
| **Quality Assurance** | Manual review | Built-in QA tools |
| **Updates** | Release-dependent | Real-time or build-time |
| **Developer Experience** | Copy/paste from files | API/CLI integration |
| **Translator Experience** | Context-free editing | Rich context with mockups |
| **Maintenance** | High (manual processes) | Low (automated workflows) |
| **Scalability** | Limited by manual processes | Scales with team size |
| **Cost** | Developer/maintainer time | Platform subscription |
| **Open Source** | Fully open | Requires coordination |

## Technical Comparison

### Build Integration
- **Current**: Copy static files
- **Ditto**: API fetch + build integration

### Error Handling
- **Current**: Runtime errors for missing strings
- **Ditto**: Build-time validation + fallbacks

### Performance
- **Current**: No network requests
- **Ditto**: Build-time fetch, runtime caching

### Maintenance
- **Current**: Manual file management
- **Ditto**: Automated sync + validation
`;
  }

  async showResults() {
    this.logStep('Showing demo results');
    
    // Show generated files
    console.log('\n📁 Generated Files:');
    await this.showDirectoryTree(this.sampleRoot, '  ');
    
    // Show sample translation
    console.log('\n🌍 Sample Translation:');
    const englishFile = path.join(this.sampleRoot, '_locales', 'en', 'messages.json');
    const spanishFile = path.join(this.sampleRoot, '_locales', 'es', 'messages.json');
    
    if (await fs.pathExists(englishFile) && await fs.pathExists(spanishFile)) {
      const english = await fs.readJson(englishFile);
      const spanish = await fs.readJson(spanishFile);
      
      console.log(`  English: ${english.connectWallet.message}`);
      console.log(`  Spanish: ${spanish.connectWallet.message}`);
      console.log(`  French: ${english.connectWallet.message}`);
    }
    
    // Show metrics
    console.log('\n📊 Demo Metrics:');
    const buildReport = path.join(this.sampleRoot, 'build', 'build-report.json');
    if (await fs.pathExists(buildReport)) {
      const report = await fs.readJson(buildReport);
      console.log(`  Build Time: ${report.buildTime}ms`);
      console.log(`  Node Version: ${report.performance.nodeVersion}`);
      console.log(`  Memory Usage: ${Math.round(report.performance.memoryUsage.heapUsed / 1024 / 1024)}MB`);
    }
    
    // Show string manifest
    const manifestFile = path.join(this.sampleRoot, 'build', 'string-manifest.json');
    if (await fs.pathExists(manifestFile)) {
      const manifest = await fs.readJson(manifestFile);
      console.log(`  Total Strings: ${manifest.totalStrings}`);
      console.log(`  Locales: ${manifest.locales.length}`);
      console.log(`  Average Coverage: ${Math.round(manifest.locales.reduce((sum, locale) => sum + locale.coverage, 0) / manifest.locales.length)}%`);
    }
  }

  async showDirectoryTree(dirPath, prefix = '') {
    const items = await fs.readdir(dirPath);
    
    for (const item of items.slice(0, 10)) { // Show first 10 items
      const itemPath = path.join(dirPath, item);
      const stats = await fs.stat(itemPath);
      
      if (stats.isDirectory()) {
        console.log(`${prefix}📁 ${item}/`);
        if (item !== 'node_modules') {
          await this.showDirectoryTree(itemPath, prefix + '  ');
        }
      } else {
        console.log(`${prefix}📄 ${item}`);
      }
    }
    
    if (items.length > 10) {
      console.log(`${prefix}... and ${items.length - 10} more items`);
    }
  }

  logStep(message) {
    this.step++;
    console.log(`\n${this.step}. ${message}`);
    console.log('─'.repeat(50));
  }
}

// Main execution
if (require.main === module) {
  const demo = new DittoPOCDemo();
  demo.run();
}

module.exports = DittoPOCDemo;