# Getting Started with MetaMask Ditto POC

This guide will help you quickly set up and run the MetaMask Ditto POC to see how Ditto integration would work.

## Quick Start (5 minutes)

1. **Navigate to the POC directory**
   ```bash
   cd ditto-poc
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Run the complete demo**
   ```bash
   npm run poc:demo
   ```

4. **View the results**
   ```bash
   # Check generated files
   ls -la sample-implementation/
   
   # View sample translations
   cat sample-implementation/_locales/en/messages.json
   cat sample-implementation/_locales/es/messages.json
   ```

That's it! You now have a working demonstration of Ditto integration.

## What Just Happened?

The demo script:
1. ✅ Created sample Ditto data (simulating API responses)
2. ✅ Converted strings to MetaMask's Chrome extension format
3. ✅ Generated TypeScript definitions
4. ✅ Created build integration scripts
5. ✅ Generated CI/CD configurations
6. ✅ Produced comparison and workflow documentation

## Exploring the Results

### Generated Files
```
sample-implementation/
├── _locales/           # Chrome extension format locale files
│   ├── en/messages.json
│   ├── es/messages.json
│   ├── fr/messages.json
│   └── index.json
├── ditto/              # Raw Ditto output
│   ├── en.json
│   ├── es.json
│   ├── fr.json
│   └── types.d.ts
├── build/              # Build integration artifacts
│   ├── string-manifest.json
│   ├── build-report.json
│   ├── github-actions.yml
│   ├── gulp-integration.js
│   └── webpack-plugin.js
├── dist/               # Final build output
└── workflow-demo.md    # Documentation
```

### Key Artifacts to Review

1. **Locale Files** (`sample-implementation/_locales/`)
   - See how Ditto strings are converted to MetaMask format
   - Compare translations across languages
   - Validate Chrome extension i18n structure

2. **Build Integration** (`sample-implementation/build/`)
   - Review generated build scripts
   - Check CI/CD workflow configuration
   - Examine performance metrics

3. **Documentation** (`sample-implementation/workflow-demo.md`)
   - Understand the proposed workflow
   - See current vs. Ditto comparison
   - Review benefits and migration path

## Testing Individual Components

### Test String Sync Only
```bash
npm run poc:sync
```

### Test Build Integration Only
```bash
npm run poc:build
```

### Test Full Integration
```bash
npm run poc:test
```

### Verify Everything Works
```bash
npm run poc:verify
```

## Understanding the Architecture

### 1. Ditto Configuration (`ditto/config.yml`)
- Defines component structure
- Maps locales to MetaMask format
- Configures output format

### 2. Sync Script (`scripts/ditto-sync.js`)
- Fetches strings from Ditto API
- Converts to MetaMask format
- Generates TypeScript definitions
- Handles fallback scenarios

### 3. Build Integration (`scripts/build-integration.js`)
- Integrates with Gulp/Webpack
- Validates strings
- Generates build artifacts
- Creates CI/CD configs

## Sample Workflow

1. **Developer adds new feature**
   ```bash
   # Add strings to Ditto (via web interface)
   # Or use temporary keys in code
   const title = t('newFeature.title', 'Temporary Title');
   ```

2. **Sync during development**
   ```bash
   npm run ditto:sync
   ```

3. **Build with latest strings**
   ```bash
   npm run start
   ```

4. **Automated sync in CI**
   ```yaml
   # GitHub Actions runs daily
   - name: Sync from Ditto
     run: npm run ditto:sync
   ```

## Key Features Demonstrated

### ✅ Automated Sync
- Fetches latest strings from Ditto
- Converts to MetaMask format
- Handles API failures gracefully

### ✅ Build Integration
- Works with both Gulp and Webpack
- Pre-build string fetching
- Validation and error handling

### ✅ Type Safety
- Generated TypeScript definitions
- IntelliSense support
- Compile-time string validation

### ✅ Fallback System
- Local file fallback
- Error recovery
- Graceful degradation

### ✅ CI/CD Ready
- GitHub Actions workflow
- Automated PR creation
- Performance monitoring

## Next Steps

### For Evaluation
1. **Review the generated files** to understand the output format
2. **Check the workflow documentation** to see process changes
3. **Examine build integration** to understand implementation
4. **Review performance metrics** in the build report

### For Implementation
1. **Set up Ditto workspace** with real API keys
2. **Import existing strings** to Ditto
3. **Configure build system** integration
4. **Test with real translation workflow**

### For Questions
1. **Check the documentation** in the `docs/` folder
2. **Review the integration guide** for detailed steps
3. **Examine the migration plan** for rollout strategy
4. **Run the verification script** to validate setup

## Troubleshooting

### Common Issues

**Q: Demo fails with permission errors**
A: Ensure you have write permissions in the directory

**Q: Build integration doesn't work**
A: Check that Node.js version is 16+ and dependencies are installed

**Q: Generated files are empty**
A: Run `npm run poc:clean` then `npm run poc:demo` again

**Q: Verification script fails**
A: Make sure you've run the demo first with `npm run poc:demo`

### Getting Help

1. **Check the logs** for detailed error messages
2. **Review the documentation** for setup requirements
3. **Run individual scripts** to isolate issues
4. **Check the verification script** for specific failures

## Demo Customization

### Modify Sample Data
Edit `scripts/demo.js` to change the sample strings and locales.

### Add More Languages
Update the language arrays in the demo script to include additional locales.

### Test Different Scenarios
Modify the sync and build scripts to test different integration scenarios.

## Success Metrics

After running the POC, you should see:
- ✅ Valid Chrome extension locale files
- ✅ TypeScript definitions generated
- ✅ Build integration scripts created
- ✅ CI/CD workflow configured
- ✅ Performance metrics collected
- ✅ Documentation generated

## Understanding the Value

This POC demonstrates:
1. **Technical Feasibility** - Ditto can integrate with MetaMask
2. **Workflow Improvements** - Better translation process
3. **Developer Experience** - Easier string management
4. **Quality Assurance** - Automated validation
5. **Operational Efficiency** - Reduced manual work

---

**Ready to see Ditto in action?** Run `npm run poc:demo` and explore the results!