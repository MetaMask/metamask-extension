# Autoresearch: MetaMask Extension Build Performance

## Objective

Reduce the wall-clock build time of `yarn dist` (Browserify production build) while maintaining full correctness. Every kept experiment must produce a working, production-valid build with LavaMoat enabled.

## Baseline (M4 Max, 128GB RAM)

- **Total build time**: 184.5s (3m 4.5s)
- **Critical path**: `standardEntryPoints` at 179.4s (97% of total)
- **Total JS bundle size**: 24.5 MB (dist/chrome/\*.js)
- **Total scripts size**: 3.7 MB (dist/chrome/scripts/\*.js)
- **Total dist size**: 85 MB (dist/chrome/)
- **JS bundle count**: 58 files
- **Build output**: dist/chrome/ and dist/firefox/

## Primary Metric

**`build_time_seconds`** — Wall-clock time of `yarn dist` from start to "Finished 'dist'". Lower is better.

An experiment is a SUCCESS if `build_time_seconds` is lower than the current best AND all checks pass. Even a 0.5s improvement counts — small wins compound.

## Secondary Metrics (tracked, not optimized)

- `bundle_size_total_kb` — Total size of all JS bundles in dist/chrome/. Must not increase by more than 5%.
- `bundle_count` — Number of JS files in dist/chrome/. Informational.
- `standard_entry_points_seconds` — Time for the `standardEntryPoints` task specifically (the bottleneck).

## Correctness Gate

Run `autoresearch.checks.sh` BEFORE measuring metrics. If checks fail, the experiment is DISCARDED immediately — do not even measure build time.

The checks verify:

1. `yarn dist` exits with code 0 (build succeeds with LavaMoat)
2. Expected output files exist (background, ui, common, content-script bundles)
3. Bundle sizes are sane (not empty, not suspiciously small)
4. Extension manifest is valid JSON

## Files In Scope (you MAY modify these)

```
babel.config.js                              # Babel transpilation config (targets, plugins, presets)
development/build/scripts.js                 # Browserify bundling pipeline, transforms, minification
development/build/config.js                  # Build configuration, feature flags
development/build/styles.js                  # SCSS compilation pipeline
development/build/static.js                  # Static asset processing
development/build/manifest.js                # Manifest generation
development/build/utils.js                   # Build utilities
development/build/transforms/               # Custom Browserify transforms (all files)
development/build/set-environment-variables.js  # Env var setup
```

## Files FROZEN (you must NOT modify these)

```
development/autoresearch/                    # All autoresearch infrastructure
development/build/index.js                   # Build orchestration (task ordering)
development/build/task.js                    # Task execution and timing infrastructure
development/build/display.js                 # Task timeline display
development/build/constants.js               # Build constants
package.json                                 # Dependencies are fixed
yarn.lock                                    # Lockfile is fixed
lavamoat/                                    # LavaMoat policies (frozen for experiments)
app/                                         # Application source code
ui/                                          # UI source code
shared/                                      # Shared code
```

## Constraints

1. **LavaMoat must remain enabled** — Every experiment runs with `--apply-lavamoat=true` (the default). We are optimizing build speed, not bypassing security.
2. **No dependency changes** — Do not add, remove, or update packages. `package.json` and `yarn.lock` are frozen.
3. **No application code changes** — Only build infrastructure files may be modified.
4. **Bundle output must be functionally equivalent** — The built extension must work the same. Bundle size may vary slightly due to different minification/transpilation, but must not increase by more than 5%.
5. **One change per experiment** — Make a single, focused change per iteration. This makes it clear what helped and what didn't.
6. **Simplicity wins** — Removing something and getting equal or better results is a great outcome. Simpler build configs are easier to maintain.

## Strategic Direction

The `standardEntryPoints` task dominates at 179.4s (97% of total). This task does:

1. Browserify bundling of `background.js`, `ui.js`, `content-script.js`, `offscreen.ts`
2. `bify-module-groups` factoring (split common modules, group by 2MB size limit)
3. LavaMoat compartmentalization
4. Terser minification (per-bundle, sequential)
5. Source map generation

Within this, the approximate cost breakdown is:

- **Terser minification**: ~40-50% of bundle time (LARGEST single cost)
- **Babel transpilation**: ~20-30% (two passes: top-level + dependencies)
- **LavaMoat static analysis + wrapping**: ~15-20%
- **bify-module-groups factoring**: ~10-15%
- **Source maps**: ~10-15%

### High-value directions

- **Terser parallelization**: Currently each bundle is minified sequentially via through2 stream. If minification could be parallelized across CPU cores, the ~70s spent in Terser could drop significantly.
- **Babel configuration**: The config targets `chrome >= 89, firefox >= 89`. Modern browsers support most ES2020+ natively — there may be unnecessary transpilation happening. Removing transforms for features the target browsers already support would reduce Babel's work.
- **Babel transform deduplication**: Two Babelify passes are configured — one for top-level code, one for an explicit list of ~30 ESM-only `node_modules` packages. There may be overlap or unnecessary inclusion.
- **Browserify plugin efficiency**: `bify-module-groups` splits by dependency then by size (2MB limit). The size limit, splitting strategy, or factoring algorithm might have tuning opportunities.
- **Source map strategy**: Source maps are generated inline then written out. Cheaper source map strategies exist that sacrifice debuggability for speed.
- **Stream pipeline efficiency**: The labeled-stream-splicer pipeline (groups → vinyl → scuttle → sourcemaps:init → minify → sourcemaps:write → dest) has overhead per stage. Reducing stages or combining them could help.

### What has NOT worked (dead ends)

_No experiments run yet. This section will be updated as experiments are completed._

## Experiment Protocol

1. Read this file and the current `autoresearch.ideas.md`
2. Pick ONE idea to try
3. Make the code change (single focused edit)
4. Run `./development/autoresearch/autoresearch.sh`
5. Check the output:
   - `CHECKS: PASSED` and `build_time_seconds` < current best → **SUCCESS** — commit with message `autoresearch: <description of what changed>`
   - `CHECKS: FAILED` or `build_time_seconds` >= current best → **FAILURE** — revert all changes with `git checkout -- .`
6. Update `autoresearch.ideas.md`: move the idea to "Tried" with the result
7. Repeat from step 1
