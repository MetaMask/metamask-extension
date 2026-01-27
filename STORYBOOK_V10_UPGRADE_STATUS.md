# Storybook v7 to v10 Upgrade Status

## CI Fixes Required

### 1. PR Title
The PR title needs a conventional commit prefix. Suggested title:
```
build: Upgrade Storybook from v7 to v10 (WIP - blocked by React 18 requirement)
```

### 2. CHANGELOG Entry
Add to PR description:
```
CHANGELOG entry: null
```
(This is not end-user facing since it's blocked and won't be merged as-is)

### 3. Socket Security Alerts
The Socket Security bot flagged several packages. These are expected for a major Storybook upgrade:
- `storybook@10.2.1` - Obfuscated code (standard for bundled tools)
- Network access alerts for test-runner dependencies (needed for test execution)
- These should be reviewed by the security team before merge

## Summary

Attempted to upgrade Storybook from v7.6.21 to v10.2.0. The upgrade is **partially complete** but **blocked by a critical dependency issue**.

**CI Status**: Both `Build Storybook` and `Test Storybook` jobs fail with the React 18 requirement error, as expected.

## Critical Blocker: React 18 Required

**Storybook v10 requires React 18+, but this project uses React 17.0.2.**

The build fails with the following error:
```
ERROR: export 'useInsertionEffect' (imported as 'React') was not found in 'react'
```

`useInsertionEffect` is a React 18+ hook that Storybook v10 depends on. This means **the project must upgrade to React 18 before Storybook v10 can be used**.

## What Was Completed

### 1. Package Upgrades ✅
- Upgraded `storybook` from ^7.6.21 to ^10.2.0
- Upgraded `@storybook/react` from ^7.6.21 to ^10.2.0
- Upgraded `@storybook/react-webpack5` from ^7.6.21 to ^10.2.0
- Upgraded `@storybook/addon-a11y` from ^7.6.21 to ^10.2.0
- Upgraded `@storybook/addon-docs` from ^7.6.21 to ^10.2.0
- Upgraded `@storybook/test-runner` from ^0.14.1 to ^0.24.2
- Upgraded `eslint-plugin-storybook` from ^0.6.15 to ^10.2.0
- Added `@storybook/addon-webpack5-compiler-swc` for TypeScript compilation
- Removed deprecated packages: `@storybook/addons`, `@storybook/api`, `@storybook/client-api`, `@storybook/components`, `@storybook/theming`

### 2. Configuration Updates ✅
- Converted `.storybook/main.js` to `.storybook/main.ts` (ESM format required by v10)
- Added proper ESM imports using `import.meta.url` and `createRequire`
- Updated webpack configuration to work with ESM
- Added SWC compiler addon for TypeScript support
- Updated `.yarnrc.yml` to preapprove `@storybook/*` packages (bypassing 3-day age gate)

### 3. Preview Configuration Updates ✅
- Updated `@storybook/addon-docs` import to use new path
- Updated `@storybook/theming` import to use `storybook/theming`

### 4. Custom Addon Updates ⚠️
- Updated `.storybook/i18n-party-addon/register.js` to use new v10 APIs
- Converted JSX to `React.createElement` calls (temporarily disabled due to React 18 requirement)

### 5. Story File Import Updates ✅
- Fixed 25 story files importing `useArgs` from deprecated `@storybook/client-api` → now use `storybook/internal/preview-api`
- Fixed 2 story files incorrectly importing `useState` from `@storybook/addons` → now use React's `useState`
- Fixed 4 MDX files importing from `@storybook/blocks` → now use `@storybook/addon-docs/blocks`

### 6. Dependency Management ✅
- Updated `allow-scripts` configuration
- Ran `yarn dedupe` to optimize lockfile
- Updated `.yarnrc.yml` to allow Storybook packages

## What Needs To Be Done

### 1. **Upgrade React to v18** (CRITICAL)
This is the blocking issue. The project needs to:
- Upgrade `react` from 17.0.2 to 18.x
- Upgrade `react-dom` from 17.0.2 to 18.x
- Update all React-related code to be compatible with React 18
- Test the entire application with React 18

### 2. MDX Stories Migration
The following MDX story files were temporarily disabled and need migration:
- `.storybook/1.INTRODUCTION.stories.mdx`
- `.storybook/2.DOCUMENTATION.stories.mdx`
- `.storybook/3.COLORS.stories.mdx`
- `.storybook/4.SHADOW.stories.mdx`
- `.storybook/5.BREAKPOINTS.stories.mdx`
- `ui/components/component-library/COMPONENT-LIBRARY.stories.mdx`

These files use the deprecated `.stories.mdx` format. They need to be:
- Converted to `.mdx` files (for pure documentation)
- OR converted to `.stories.js`/`.stories.tsx` files with CSF format

### 3. Custom i18n Addon
The custom i18n party addon (`.storybook/i18n-party-addon/register.js`) was temporarily disabled. It needs:
- Full rewrite to use v10 APIs
- Proper React 18 compatibility
- Testing after React 18 upgrade

### 4. LavaMoat Policies
After React 18 upgrade and successful Storybook build:
```bash
yarn lavamoat:auto
```

### 5. Attributions
After all dependencies are finalized:
```bash
yarn attributions:generate
```

### 6. Testing
- Build Storybook: `yarn storybook:build`
- Run Storybook dev server: `yarn storybook`
- Run Storybook tests: `yarn test-storybook`
- Verify all stories render correctly
- Re-enable and test custom addon
- Re-enable and test MDX documentation

## Migration Guide References

The following migration guides were reviewed:
- [Storybook 7→8 Migration](https://github.com/storybookjs/storybook/blob/next/MIGRATION.md#from-version-7x-to-800)
- [Storybook 8→9 Migration](https://github.com/storybookjs/storybook/blob/next/MIGRATION.md#from-version-8x-to-900)
- [Storybook 9→10 Migration](https://github.com/storybookjs/storybook/blob/next/MIGRATION.md#from-version-9x-to-1000)

## Key Breaking Changes in Storybook v10

1. **Node.js 20.19+ or 22.12+ required** ✅ (using 24.13.0)
2. **Main config must be valid ESM** ✅ (converted to .ts)
3. **React 18+ required** ❌ (BLOCKER)
4. **Removed deprecated packages** ✅ (cleaned up)
5. **MDX3 only** ⚠️ (needs migration)
6. **Actions, Controls, Interactions, Viewport moved to core** ✅ (handled)

## Recommendation

**Do not merge this PR until React 18 upgrade is complete.**

The React 18 upgrade is a significant change that affects the entire application, not just Storybook. It should be:
1. Planned as a separate initiative
2. Thoroughly tested across all components
3. Reviewed for breaking changes in React 18
4. Coordinated with the team

Once React 18 is upgraded, this Storybook v10 upgrade can be completed by:
1. Re-enabling the custom addon
2. Migrating MDX files
3. Running full test suite
4. Updating LavaMoat policies and attributions
