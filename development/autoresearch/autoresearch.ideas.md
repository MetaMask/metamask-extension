# Autoresearch Ideas Backlog

This file is maintained by the autoresearch agent. It tracks ideas to try, what has been tried, and what worked or didn't.

## Untried Ideas

### Terser Optimization (highest priority — 40-50% of build time)

- [ ] Enable Terser `compress.passes: 2` or `3` — more compression passes might produce smaller output but take longer, OR fewer passes (default is 1) might be faster with negligible size impact
- [ ] Terser `mangle.properties` with reserved list — more aggressive mangling
- [x] Terser `compress.pure_getters: true` — allows more aggressive dead code elimination (experiment 2)
- [x] Terser `compress.unsafe_math: true` — allows math optimizations (experiment 4)
- [ ] Explore if terser can be run in parallel using worker_threads (currently runs sequentially through through2 stream per bundle file, but multiple files could be minified concurrently)
- [ ] Try `compress: false` with only `mangle: true` — skip compression entirely and only mangle variable names. Compression is the expensive part; mangling alone might give 80% of size reduction at 20% of the time (experiment 6)
- [x] Adjust terser `sourceMap` handling — generating source maps during minification is expensive (experiment 8)

### Babel Configuration (20-30% of build time)

- [ ] Audit `@babel/preset-env` output — with targets `chrome >= 89, firefox >= 89`, many transforms may be unnecessary. Chrome 89 supports: optional chaining, nullish coalescing, BigInt, dynamic import, class fields, etc. These features should NOT be transpiled.
- [ ] Set `@babel/preset-env` `bugfixes: true` — uses more targeted transforms instead of broad ones
- [ ] Set `@babel/preset-env` `useBuiltIns: 'usage'` with explicit corejs version — only import polyfills that are actually used
- [ ] Test `@babel/preset-env` `modules: false` — might reduce transform work if Browserify handles modules
- [ ] Reduce the second Babelify pass's `only` list — some of those ~30 packages might no longer need transpilation if their latest versions ship compatible code
- [x] Disable `babel-plugin-react-compiler` — removed the override that applies this plugin to UI components. Hypothesis: the plugin adds transpilation overhead without essential benefits for production builds (experiment 7)
- [x] Set `api.cache(true)` instead of `api.cache(false)` in babel.config.js — currently Babel cache is explicitly DISABLED. Enabling it could save significant time on repeated module transpilation (experiment 5)
- [ ] Use `@babel/preset-typescript` with `optimizeConstEnums: true`

### Browserify Pipeline

- [x] Increase `bify-module-groups` size limit from 2MB to 4MB — fewer, larger chunks means less factoring overhead and fewer separate minification passes (experiment 9)
- [ ] Decrease `bify-module-groups` size limit — smaller chunks might parallelize better
- [ ] Test different `browserify` options: `noParse` for known pre-built modules (lodash, moment, etc.) that don't need AST parsing
- [ ] Add `browserify` `extensions` option tuning — currently `.js, .ts, .tsx`. Removing `.tsx` from non-UI bundles might speed up resolution
- [ ] Investigate `browserify` `cache` and `packageCache` options (currently only set for watchify/dev mode, not production)

### Source Maps

- [ ] Use cheaper source map init options in `gulp-sourcemaps`
- [ ] Defer source map writing — generate maps but write them in a separate pass

### Build Structure

- [ ] Build only Chrome platform during experiments (`--platform=chrome`) — cuts duplicate work if building both platforms
- [ ] Skip the zip task — it runs after all builds and adds ~1.3s
- [ ] SCSS compilation: check if PostCSS plugins can be reduced or parallelized
- [ ] Look at the `loose-envify` transform — could it be replaced by a faster string replacement

### Transform Pipeline

- [ ] Remove or optimize `createRemoveFencedCodeTransform` — it runs on every file and optionally lints. Even with linting off, the AST parsing for fence detection has cost.
- [ ] Reorder transforms — put the cheapest transforms first to fail fast on syntax errors
- [ ] Check if any transforms could be replaced by Browserify plugins (plugins run once vs transforms per-file)

## Tried — Successful

- Terser `compress.drop_console: true` — Added `drop_console: true` to Terser compress options to remove console.log statements in production, reducing code to minify (experiment 1)
- Terser `compress.pure_getters: true` — Added `pure_getters: true` to Terser compress options to allow more aggressive dead code elimination (experiment 2)
- Terser `compress.unsafe_math: true` — Added `unsafe_math: true` to Terser compress options to allow math optimizations (experiment 4)

## Tried — Failed / No Improvement

- Terser `compress: false` with only `mangle: true` — Set `compress: false` to skip compression entirely and only mangle variable names. Hypothesis: compression is the expensive part; mangling alone might give 80% of size reduction at 20% of the time (experiment 6)
- Terser `sourceMap: false` — Disabled source map generation in Terser since gulp-sourcemaps handles it separately. Hypothesis: avoiding duplicate source map generation will reduce minification time (experiment 8)

## Tried — Crashed / Invalid

_No experiments completed yet._
