# Troubleshooting Guide

## Module Registry Errors

### Error: no module registered for "XXXX" (number)

**Symptoms:**
- Error occurs when loading extension pages (popup, notification, etc.)
- Error message: `Error: no module registered for "7239" (number)` (or similar module ID)
- Occurs in LavaMoat's `loadModuleData` function

**Root Cause:**
This error occurs when there's a mismatch between:
1. The module IDs referenced in UI bundles (e.g., `ui-18.js`)
2. The module IDs registered in the LavaMoat module registry

This can happen when:
- Webpack cache contains stale module ID mappings
- New dependencies are added that alter module ID assignment (e.g., ESM-only packages like `lightweight-charts`)
- Builds are created without a clean install

**Solution:**

1. **Clear Webpack Cache:**
   ```bash
   yarn webpack:clearcache
   ```

2. **Clean Install Dependencies:**
   ```bash
   rm -rf node_modules
   yarn install
   ```
   Note: `yarn install` automatically runs `yarn webpack:clearcache` via the postinstall hook

3. **Rebuild the Extension:**
   ```bash
   yarn build:test  # For test builds
   # OR
   yarn dist        # For production builds
   ```

4. **Verify Fix:**
   - Check that the extension loads without errors
   - Verify module IDs are consistent across bundles

**Prevention:**

- Always run `yarn install` after pulling code changes that modify dependencies
- Ensure CI/CD pipelines do clean installs before production builds
- The postinstall hook automatically clears webpack cache, so following normal development workflows should prevent this issue

**Related Issues:**
- Issue METAMASK-XRSC: Module 7239 error after lightweight-charts dependency was added
- Commit 9f8e74d9a1: Added lightweight-charts dependency and updated LavaMoat policies

**Technical Details:**
- LavaMoat uses a module registry to track and load modules securely
- Module IDs are assigned during the bundling process
- When dependencies change (especially ESM-only packages), module ID assignment can shift
- Stale webpack cache can preserve old module ID references while the new build uses different IDs
- This creates a mismatch where bundles reference module IDs that don't exist in the registry
