// Shared zone definitions for `import-x/no-restricted-paths`.
//
// These are required (not extended) by both `.eslintrc.base.js` and
// `.eslintrc.js`, so the same zone list is used wherever the rule needs
// to be configured (notably the router-registry override in `.eslintrc.js`
// re-enables only the non-route-isolation source-boundary zones).
//
// Kept outside `.eslintrc*.js` because ESLint v8 validates every config
// it loads and rejects unknown top-level exports.
//
// See ADR 0021 (modularize-routes):
// https://github.com/MetaMask/decisions/tree/main/decisions/core/0021-modularize-routes.md

const fs = require('node:fs');
const path = require('node:path');

// Architectural boundaries between the three top-level source trees:
// - `app/`     (background script — service worker, controllers, RPC)
// - `ui/`      (React UI rendered in the extension popup/expanded view)
// - `shared/`  (code safe to import from either side)
const architecturalZones = [
  {
    target: './app',
    from: './ui',
    message:
      'Should not import from UI in background, use shared directory instead',
  },
  {
    target: './ui',
    from: './app',
    message:
      'Should not import from background in UI, use shared directory instead',
  },
  {
    target: './shared',
    from: './app',
    message: 'Should not import from background in shared',
  },
  {
    target: './shared',
    from: './ui',
    message: 'Should not import from UI in shared',
  },
];

const buildSystemZones = [
  {
    target: './app',
    from: './development',
    message:
      'Should not import build-system modules in background, use shared directory instead',
  },
  {
    target: './ui',
    from: './development',
    message:
      'Should not import build-system modules in UI, use shared directory instead',
  },
  {
    target: './shared',
    from: './development',
    message:
      'Should not import build-system modules in shared, use shared constants or utilities instead',
  },
];

// Top-level route directories under `ui/pages/`. Each top-level directory
// is treated as a "route module" per ADR 0021 (modularize-routes). The
// `routes` subdirectory holds the React Router registry (which must
// reference every route by design) and is exempted via overrides in
// `.eslintrc.js`.
const PAGES_DIR = path.join(__dirname, '..', 'ui/pages');
const ROUTE_ISOLATION_EXEMPT_DIRS = new Set(['routes']);
const routeDirs = fs
  .readdirSync(PAGES_DIR, { withFileTypes: true })
  .filter(
    (entry) =>
      entry.isDirectory() && !ROUTE_ISOLATION_EXEMPT_DIRS.has(entry.name),
  )
  .map((entry) => entry.name);

// For each route, forbid imports from anywhere else inside `ui/pages/`
// except itself and the router registry. `import-x/no-restricted-paths`
// resolves `except` paths relative to `from`, so we can keep one zone
// per route instead of a quadratic pair list.
const routeIsolationZones = routeDirs.map((route) => ({
  target: `./ui/pages/${route}`,
  from: './ui/pages',
  except: [`./${route}`, './routes'],
  message:
    `Route directories must be isolated. "${route}" must not import ` +
    `from a sibling route directory. See ADR 0021 (modularize-routes).`,
}));

module.exports = { architecturalZones, buildSystemZones, routeIsolationZones };
