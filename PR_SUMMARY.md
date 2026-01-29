# Pull Request Summary

## Fix: TypeError in react-tippy when component unmounts before delayed hide callback

**Fixes:** METAMASK-XPEP

### Problem
Users were experiencing crashes with the error: `TypeError: can't access property "settings", r is undefined` in the react-tippy library. This occurred when tooltip components with delayed show/hide unmounted before the scheduled setTimeout callbacks executed.

### Root Cause
React-tippy's `hide()` function at line 2317 accessed `data.settings` without checking if `data` was defined. When rapid UI navigation caused tooltip components to unmount before their delayed hide callbacks executed, `data` became `undefined`, causing a TypeError.

### Solution
Created a Yarn patch for `react-tippy@1.2.2` that adds a null check before accessing `data.settings`:

```javascript
// Guard against undefined data (component may have unmounted)
if (!data || !data.settings) {
  return;
}
```

### Changes Made
1. **Patch file:** `.yarn/patches/react-tippy-npm-1.2.2-9a7f96e94f.patch`
   - Added null check in the `hide()` function
   - Prevents accessing properties on undefined data
   
2. **package.json:** Updated react-tippy reference to use the patch
3. **yarn.lock:** Updated with patch reference
4. **Documentation:** Added comprehensive fix documentation at `.cursor/fixes/react-tippy-unmount-fix.md`

### Testing
✅ All existing tooltip tests pass (16 tests total)
✅ TypeScript compilation succeeds
✅ Webpack production build succeeds
✅ No breaking changes to existing functionality

**Test Commands:**
```bash
yarn test:unit ui/components/multichain-accounts/multichain-site-cell/tool-tip/multichain-site-cell-tooltip.test.tsx
# PASS - 13 tests passed

yarn test:unit ui/components/multichain/pages/gator-permissions/components/permissions-cell-tooltip.test.tsx
# PASS - 3 tests passed

yarn lint:tsc
# SUCCESS

yarn webpack --env production
# SUCCESS - compiled in 83.7s
```

### Affected Components
Components using react-tippy with `delay` prop:
- `MultichainSiteCellTooltip`
- `PermissionsCellTooltip`
- `SiteCellTooltip`
- Any other tooltip components with delayed interactions

### Impact
- **Before:** Random crashes when users quickly navigate between pages
- **After:** Graceful handling of unmount race conditions, no crashes

### CHANGELOG Entry
Fixed a crash that occurred when quickly navigating away from pages with tooltips

### Future Considerations
React-tippy is deprecated (last updated 3+ years ago). Consider migrating to a maintained alternative like `@tippyjs/react` or `react-tooltip` in a future PR.

### Files Changed
- `.yarn/patches/react-tippy-npm-1.2.2-9a7f96e94f.patch` (new)
- `package.json` (react-tippy reference updated)
- `yarn.lock` (patch reference added)
- `.cursor/fixes/react-tippy-unmount-fix.md` (new documentation)

### Verification Steps
1. Install dependencies: `yarn install`
2. Verify patch is applied: Check that `node_modules/react-tippy/dist/react-tippy.js` line 2317 contains the null check
3. Run tests: `yarn test:unit` for tooltip-related tests
4. Build: `yarn webpack --env production` to verify build succeeds
