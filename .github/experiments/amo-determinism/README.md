# AMO determinism experiment

Evidence for the AMO build-determinism fix (see #46829 and its successor PR): the fixes
make `runtime.[contenthash].js` independent of the directory the build runs in.

## What it does

[`.github/workflows/amo-determinism-experiment.yml`](../../workflows/amo-determinism-experiment.yml)
builds the Firefox MV2 production bundle of **v13.47.1** — the release whose runtime chunk flaked
for Mozilla reviewers — 60 times on CI:

- **control** ×20: the tag untouched, each build in a directory whose absolute path has a
  different length (≈80 to ≈200 characters).
- **fixed** ×20: the end state — [`fix-endstate-v4-on-v13.47.1.patch`](./fix-endstate-v4-on-v13.47.1.patch)
  (the swc loader returning an object source map; `html-bundler-webpack-plugin` emitting
  issuer-relative `require()` requests instead of absolute paths; plus the `.ts`/`.tsx` loader split
  and `IN_TEST` inlining that `@swc/core` 1.16 needs) and `yarn up @swc/core@1.16.2`.
  Frequency-ordered mangling stays on; no runtime-chunk special case.
  (The earlier `fix-endstate-on-v13.47.1.patch`, without the html-bundler change, still flipped
  17/3 — run 36864195140 — which is how the third path leak was found. `…-v2…` made the
  loader emit relative requests but broke the plugin's render step, which the build script
  reports as a success; the workflow now fails on webpack errors.)
- **charfreq** ×20: the earlier #46829 approach for comparison —
  [`fix-46829-on-v13.47.1.patch`](./fix-46829-on-v13.47.1.patch) (`mangle.disableCharFreq` on the
  runtime chunk + the loader fix), still on `@swc/core` 1.13.3.

Each build records its runtime chunk filename and a digest of every file in `dist/firefox`.
A final **Report** job tabulates them in the run summary and fails if the fixed builds disagree.

## Expected result

| variant | runtime chunk |
| --- | --- |
| control | a mix of two names (the `c`/`l` alphabet flip described in the PR) |
| fixed | a single name across all 20 paths |
| charfreq | a single name across all 20 paths |

Neither fixed name equals the published `b574af00…` hash: the experiment uses placeholder API
keys (and `disableCharFreq` changes identifiers), so chunk contents differ from the release once.
The point is that they then never change again.

## Why v13.47.1 and not the PR branch

The flip needs `c` and `l` to be near-tied in SWC's letter frequency count for the runtime chunk.
On v13.47.1 the margin was 1 character; on today's `main` it is several hundred, so a build of
`main` would look stable with or without the fix. Building the tree that actually failed is the
only honest before/after.

## Why not `prepare_release.sh`

The earlier 100-build experiment ran `prepare_release.sh`, which downloads the *released source
zip* and so cannot exercise a patch. This workflow clones the tag and patches it in place.

## Re-running

`gh workflow run amo-determinism-experiment.yml --ref test/amo-determinism-proof`

This branch is an experiment and is not meant to be merged.
