# How to Bump MetaMask's Version Automatically

```
yarn version:bump patch
```

MetaMask publishes using a loose [semver](https://semver.org/) interpretation. We divide the three segments of our version into three types of version bump:

## Major

Means a breaking change, either an API removed, or a major user expectation changed.

## Minor

Means a new API or new user feature.

## Patch

Means a fix for a bug, or correcting something that should have been assumed to work a different way.

# Bumping the version

`yarn version:bump $BUMP_TYPE` where `$BUMP_TYPE` is one of `major`, `minor`, or `patch`.

This will increment the version in the `app/manifest.json` and `CHANGELOG.md` files according to our current protocol, where the manifest's version is updated, and any line items currently under the changelog's "master" section are now under the new dated version section.

# Modifying the bump script

The script that is executed lives [here](../development/run-version-bump.js).
The main functions all live [here](../development/version-bump.js).
The test for this behavior is at `test/unit/development/version-bump-test.js`.


