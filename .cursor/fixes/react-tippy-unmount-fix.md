# React-Tippy Unmount Race Condition Fix

## Issue
**Error:** `TypeError: can't access property "settings", r is undefined`

**Location:** `node_modules/react-tippy/dist/react-tippy.js` Line 2317

**Sentry ID:** METAMASK-XPEP

## Root Cause

React-tippy's delayed hide callback attempts to access `data.settings` after the component has unmounted, causing a TypeError. This occurs when:

1. A tooltip component is rendered with a `delay` prop (e.g., `delay={50}`)
2. User triggers the tooltip to show
3. A `setTimeout` is scheduled to hide the tooltip after the delay
4. User rapidly navigates or interacts, causing the component to unmount
5. The scheduled `setTimeout` callback executes, but `data` is now `undefined`
6. Accessing `data.settings` throws: `TypeError: can't access property "settings", r is undefined`

## The Problem Code

```javascript
// node_modules/react-tippy/dist/react-tippy.js [Line 2317]
if (data.settings.disabled === false && data.settings.open) {
  return;
}
```

The code assumes `data` and `data.settings` exist, but when the component unmounts before the delayed callback executes, `data` becomes `undefined`.

## The Fix

Added a null check before accessing `data.settings`:

```javascript
// Guard against undefined data (component may have unmounted)
if (!data || !data.settings) {
  return;
}

if (data.settings.disabled === false && data.settings.open) {
  return;
}
```

## Implementation

The fix was implemented as a Yarn patch for `react-tippy@1.2.2`:
- **Patch file:** `.yarn/patches/react-tippy-npm-1.2.2-9a7f96e94f.patch`
- **Applied automatically** during `yarn install`

## Impact

### Before
- Random crashes in production when users quickly navigate between pages
- Error appears in Sentry: "can't access property 'settings', r is undefined"
- Occurs most frequently with tooltip components using delays (e.g., multichain site cells, permissions tooltips)

### After
- No more TypeError when components unmount before delayed callbacks
- Graceful handling of race conditions
- Existing tooltip functionality remains unchanged
- All existing tests pass

## Affected Components

Components using `react-tippy` with `delay` prop:
- `MultichainSiteCellTooltip` (delay: 50ms)
- `PermissionsCellTooltip` (delay: 50ms)
- Any other tooltip components with delayed show/hide

## Testing

Verified the fix by:
1. ✅ Running existing tooltip tests - all pass
2. ✅ TypeScript compilation passes
3. ✅ Linting passes
4. ✅ No breaking changes to existing functionality

### Test Results

```bash
$ yarn test:unit ui/components/multichain-accounts/multichain-site-cell/tool-tip/multichain-site-cell-tooltip.test.tsx
PASS - 13 tests passed

$ yarn test:unit ui/components/multichain/pages/gator-permissions/components/permissions-cell-tooltip.test.tsx
PASS - 3 tests passed
```

## Why Not Replace react-tippy?

While react-tippy is deprecated (last updated 3+ years ago), replacing it requires:
- Evaluating and testing alternative tooltip libraries
- Updating all tooltip components across the codebase
- Ensuring consistent behavior and styling
- Extensive E2E testing

This patch provides an immediate fix while allowing for a proper migration plan in the future.

## Maintenance Notes

- The patch is automatically applied during `yarn install`
- If upgrading react-tippy version, the patch hash will change and needs to be regenerated
- Consider migrating to a maintained tooltip library (e.g., `@tippyjs/react`, `react-tooltip`) in a future PR

## Related Files

- Patch: `.yarn/patches/react-tippy-npm-1.2.2-9a7f96e94f.patch`
- Package config: `package.json` (updated react-tippy reference)
- Yarn lock: `yarn.lock` (updated with patch reference)

## Future Work

Consider replacing react-tippy with a maintained alternative:
- [ ] Evaluate modern tooltip libraries
- [ ] Create migration plan
- [ ] Update all tooltip components
- [ ] Test across all browsers and scenarios
