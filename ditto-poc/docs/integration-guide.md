# MetaMask Ditto Integration Guide

This guide provides step-by-step instructions for integrating Ditto content management with MetaMask's localization system.

## Prerequisites

- Node.js 16.0.0 or higher
- Ditto account with API access
- MetaMask development environment
- Basic familiarity with MetaMask's build system

## Phase 1: Setup and Configuration

### 1.1 Ditto Workspace Setup

1. **Create Ditto Account**
   - Visit [dittowords.com](https://dittowords.com) and create an account
   - Set up a new workspace for MetaMask
   - Generate an API key from the developer settings

2. **Install Ditto CLI**
   ```bash
   npm install --save-dev @dittowords/cli
   ```

3. **Initialize Ditto Configuration**
   ```bash
   npx @dittowords/cli init
   ```

4. **Configure for MetaMask**
   - Copy the provided `ditto/config.yml` to your project
   - Update the configuration to match your Ditto workspace

### 1.2 Project Structure

Create the following directory structure:
```
metamask-extension/
├── ditto/
│   ├── config.yml
│   └── cache/
├── scripts/
│   ├── ditto-sync.js
│   └── ditto-build-integration.js
└── app/
    └── _locales/
        └── ... (existing locale files)
```

### 1.3 Environment Setup

1. **Set Environment Variables**
   ```bash
   export DITTO_API_KEY="your-api-key-here"
   ```

2. **Update .gitignore**
   ```
   ditto/cache/
   .ditto-cache/
   ```

## Phase 2: Content Migration

### 2.1 Analyze Current Strings

1. **Audit Existing Strings**
   ```bash
   node development/verify-locale-strings.js
   ```

2. **Categorize Strings**
   - Core UI strings
   - Error messages
   - Onboarding flow
   - Settings and preferences
   - Transaction flows

### 2.2 Import to Ditto

1. **Create Component Structure**
   - Set up components in Ditto matching your categorization
   - Use the component folders defined in `config.yml`

2. **Import Base Strings**
   ```bash
   # Custom import script (to be created)
   node scripts/import-to-ditto.js
   ```

3. **Set Up Variants**
   - Create variants for each supported locale
   - Map variant IDs to locale codes in config

### 2.3 Validate Migration

1. **Test Sync Process**
   ```bash
   npm run ditto:sync
   ```

2. **Compare Output**
   ```bash
   node scripts/compare-locales.js
   ```

## Phase 3: Build Integration

### 3.1 Gulp Integration

1. **Add Ditto Task to Gulpfile**
   ```javascript
   const DittoSyncManager = require('./scripts/ditto-sync');
   
   gulp.task('ditto-sync', async function() {
     const syncManager = new DittoSyncManager();
     await syncManager.run();
   });
   
   // Update existing tasks
   gulp.task('static', gulp.series('ditto-sync', 'static-original'));
   ```

2. **Update Build Scripts**
   - Modify `development/build/static.js`
   - Add pre-build hook for Ditto sync

### 3.2 Webpack Integration

1. **Add Webpack Plugin**
   ```javascript
   const DittoSyncPlugin = require('./scripts/ditto-webpack-plugin');
   
   module.exports = {
     plugins: [
       new DittoSyncPlugin({
         configPath: './ditto/config.yml',
         outputPath: './app/_locales'
       })
     ]
   };
   ```

2. **Update Webpack Config**
   - Add plugin to all webpack configurations
   - Configure for development and production builds

### 3.3 Error Handling

1. **Implement Fallback Strategy**
   ```javascript
   // In ditto-sync.js
   async function syncWithFallback() {
     try {
       await syncFromDitto();
     } catch (error) {
       console.warn('Ditto sync failed, using local files');
       await useLocalFiles();
     }
   }
   ```

2. **Add Validation**
   - Validate string completeness
   - Check for missing translations
   - Ensure required strings exist

## Phase 4: CI/CD Integration

### 4.1 GitHub Actions

1. **Add Workflow File**
   ```yaml
   # .github/workflows/ditto-sync.yml
   name: Ditto Sync
   
   on:
     schedule:
       - cron: '0 2 * * *'  # Daily at 2 AM
     workflow_dispatch:
   
   jobs:
     sync:
       runs-on: ubuntu-latest
       steps:
         - uses: actions/checkout@v3
         - name: Setup Node.js
           uses: actions/setup-node@v3
           with:
             node-version: '18'
         - name: Install dependencies
           run: npm ci
         - name: Sync from Ditto
           env:
             DITTO_API_KEY: ${{ secrets.DITTO_API_KEY }}
           run: npm run ditto:sync
         - name: Create Pull Request
           uses: peter-evans/create-pull-request@v5
           with:
             title: 'Update strings from Ditto'
             body: 'Automated string updates from Ditto'
   ```

2. **Add Secrets**
   - Add `DITTO_API_KEY` to GitHub repository secrets
   - Configure branch protection rules

### 4.2 Build Verification

1. **Add Build Checks**
   ```javascript
   // In CI build script
   async function verifyStrings() {
     const verifier = new DittoIntegrationVerifier();
     await verifier.run();
   }
   ```

2. **Performance Monitoring**
   - Monitor build time impact
   - Track string sync duration
   - Alert on sync failures

## Phase 5: Team Integration

### 5.1 Developer Workflow

1. **Adding New Strings**
   ```javascript
   // Developers can add strings directly in Ditto
   // Or use temporary keys that get replaced during sync
   const message = t('newFeature.title', 'Temporary Title');
   ```

2. **Local Development**
   ```bash
   # Sync during development
   npm run ditto:sync:watch
   
   # Build with latest strings
   npm run start
   ```

### 5.2 Translator Workflow

1. **Onboard Translators**
   - Provide Ditto workspace access
   - Train on Ditto interface
   - Set up approval workflows

2. **Translation Process**
   - Translators work in Ditto interface
   - Review and approval process
   - Automated sync to repository

### 5.3 Reviewer Workflow

1. **Review PRs**
   - Check automated string updates
   - Verify string consistency
   - Approve translation changes

2. **Quality Assurance**
   - Test string changes in builds
   - Validate translation quality
   - Monitor user feedback

## Phase 6: Monitoring and Maintenance

### 6.1 Monitoring

1. **String Coverage**
   - Monitor translation completeness
   - Track missing translations
   - Alert on string errors

2. **Performance Metrics**
   - Build time impact
   - Sync duration
   - Error rates

### 6.2 Maintenance

1. **Regular Tasks**
   - Update Ditto CLI
   - Review string usage
   - Clean up unused strings

2. **Troubleshooting**
   - Sync failures
   - Missing translations
   - Build errors

## Common Issues and Solutions

### Issue 1: Sync Failures
**Problem**: Ditto API unavailable during build
**Solution**: Implement fallback to local files

### Issue 2: Missing Translations
**Problem**: New strings not translated
**Solution**: Set up automated notifications to translators

### Issue 3: Build Performance
**Problem**: Sync process slows down builds
**Solution**: Implement caching and parallel processing

### Issue 4: String Consistency
**Problem**: Inconsistent string usage across locales
**Solution**: Add validation and automated checks

## Best Practices

1. **String Organization**
   - Use consistent naming conventions
   - Group related strings in components
   - Provide clear descriptions

2. **Translation Quality**
   - Provide context for translators
   - Use mockups and screenshots
   - Implement review processes

3. **Development Workflow**
   - Sync regularly during development
   - Test with multiple locales
   - Validate string changes

4. **Deployment Strategy**
   - Use staging environment for testing
   - Implement gradual rollout
   - Monitor for issues

## Support Resources

- **Ditto Documentation**: [developer.dittowords.com](https://developer.dittowords.com)
- **MetaMask i18n Guide**: [Link to existing guide]
- **Troubleshooting**: Check `docs/troubleshooting.md`
- **Community**: MetaMask Discord #dev-general

## Next Steps

1. Review this guide with the team
2. Set up Ditto workspace
3. Run the POC demo
4. Plan phased rollout
5. Begin with a small subset of strings
6. Gradually expand to full integration

---

*This guide is part of the MetaMask Ditto POC. For questions or issues, please refer to the troubleshooting guide or contact the development team.*