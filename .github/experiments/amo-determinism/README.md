# AMO determinism experiment

Evidence for [#46829](https://github.com/MetaMask/metamask-extension/pull/46829): the two fixes
make `runtime.[contenthash].js` independent of the directory the build runs in.

## What it does

[`.github/workflows/amo-determinism-experiment.yml`](../../workflows/amo-determinism-experiment.yml)
builds the Firefox MV2 production bundle of **v13.47.1** — the release whose runtime chunk flaked
for Mozilla reviewers — 40 times on CI:

- **control** ×20: the tag untouched, each build in a directory whose absolute path has a
  different length (≈80 to ≈200 characters).
- **fixed** ×20: the same, after applying [`fix-46829-on-v13.47.1.patch`](./fix-46829-on-v13.47.1.patch),
  which is the #46829 change rebased onto that tag (`disableCharFreq` on the runtime chunk +
  the swc loader returning an object source map).

Each build records its runtime chunk filename and a digest of every file in `dist/firefox`.
A final **Report** job tabulates them in the run summary and fails if the fixed builds disagree.

## Expected result

| variant | runtime chunk |
| --- | --- |
| control | a mix of two names (the `c`/`l` alphabet flip described in the PR) |
| fixed | a single name across all 20 paths |

The fixed name is **not** the published `b574af00…` hash: `disableCharFreq` changes the mangled
identifiers, so the chunk content changes once. The point is that it then never changes again.

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
