# Rive Animations - WASM File Management

## Current Situation

We maintain our own copy of `rive.wasm` in this directory instead of importing it from the `@rive-app/canvas` npm package.

## Why We Keep Our Own Copy

### Primary Blocker: Browserify

MetaMask's build system uses both **Webpack** and **Browserify**. WASM support differs significantly between these bundlers, and **Browserify cannot properly resolve and bundle WASM files** as modules, which causes build failures when trying to import the WASM binary from the npm package.

## Current Implementation

**Runtime Loading** (see `ui/pages/onboarding-flow/rive-wasm/init.ts`):

```typescript
const RIVE_WASM_URL = './images/riv_animations/rive.wasm';
RuntimeLoader.setWasmUrl(RIVE_WASM_URL);
await RuntimeLoader.awaitInstance();
```

**Build Process**:

1. WASM file is copied to `dist/chrome/images/riv_animations/` during build
2. Loaded at runtime via URL instead of bundled as a module
3. Initialized once in `OnboardingFlow` component
4. Shared across all Rive animation components

## Advantages of Current Approach

1. Works with both Webpack AND Browserify
2. Avoids build-time WASM bundling complexity
3. Better browser caching (WASM as separate asset)
4. Single initialization across all animations
5. No LavaMoat module resolution conflicts

## Disadvantages of Current Approach

1. Manual WASM file management (must keep in sync with package version)
2. Extra initialization code complexity
3. Runtime overhead for WASM loading
4. Cannot leverage tree-shaking/optimization
5. Bundle size

---

## How to Migrate Back to Package WASM

### Preconditions

Before we can remove our own WASM copy and use the npm package version:

1. **Remove Browserify from the build pipeline**
   - Migrate all background scripts to Webpack
   - This is the main blocker

2. **Configure Webpack for WASM**
   - Configure WASM loader rules
   - Test with LavaMoat policies

3. **Verify LavaMoat compatibility**
   - Ensure WASM imports work within LavaMoat sandbox
   - Update policies if needed

### Migration Steps

Once preconditions are met:

1. **Configure Webpack for WASM bundling**

2. **Update Rive initialization code**

   ```typescript
   // Instead of runtime loading:
   import { RuntimeLoader } from '@rive-app/react-canvas';
   // Just use default WASM from package (no setWasmUrl needed)
   ```

3. **Remove manual WASM file**
   - Delete `app/images/riv_animations/rive.wasm`

4. **Test thoroughly**
   - Verify animations work in all contexts
   - Ensure LavaMoat policies are correct
   - Test in both Chrome and Firefox builds

### Expected Benefits After Migration

---

## Version Management

**Current WASM Version**: From `@rive-app/canvas` v2.31.6

**How to Update**:

1. Check the version in `package.json`
2. Extract WASM from `node_modules/@rive-app/canvas/rive.wasm`
3. Copy to this directory
4. Test animations thoroughly

---
