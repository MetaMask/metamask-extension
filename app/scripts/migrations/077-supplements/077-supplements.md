# 077 Supplements

As of the time this file was first PR'd, we had not yet had to do what was done in this PR, which is to fix an old migration and also supplement it with state transformations
to handle problems that could be introduced by future migrations.

The document explains the need for these new state transformations and the rationale behind each. It also explains why other state transformations were not included.

## Background

As of release 10.34.0, we started having a `No metadata found for 'previousProviderStore'` error thrown from the `deriveStateFromMetadata` function in `BaseControllerV2.js`.
This was occuring when there was data on the NetworkController state for which the NetworkController + BaseController expect metadata, but no metadata exists. In particular,
`previousProviderStore` was on the NetworkController state when it should not have been.

`previousProviderStore` should not have been on the NetworkController state because of migration 85, which explictly deletes it.

We discovered that for some users, that migration had failed to run because of an error in an earlier migration: `TypeError#1: MetaMask Migration Error #77: Cannot convert undefined or null to object`.
This error was thrown from this line https://github.com/MetaMask/metamask-extension/commit/8f18e04b97af02e5a8a72e3e4872aac66595d1d8#diff-9e76a7c60c1e37cd949f729222338b23ab743e44938ccf63a4a6dab7d84ed8bcR38

So the `data` property of the objects within `TokenListController.tokensChainsCache` could be undefined, and migration 77 didn't handle that case. It could be undefined because of the way the assets controller
code was as of the core controller libraries 14.0.2 release https://github.com/MetaMask/core/blame/19f7bf3b9fd8abe6cef9cb1ac1fe831d9f651ae0/src/assets/TokenListController.ts#L270 (the `safelyExecute` call there
will return undefined if the network call failed)

For users who were in that situation, where a `TokenListController.tokensChainsCache[chainId].data` property was undefined, some significant problems would occur after updating to v10.24.0, which is the
release where migration 77 was shipped. In particular, migration 77 would fail, and all subsequent migrations would not run. The most plain case of this would be a user who was on v10.23.0
with `TokenListController.tokensChainsCache[chainId].data === undefined`. Then suppose they didn't update until v10.34.0. None of migrations 77-89 would run. Leaving their state in a form that doesn't match
with assumptions throughout our codebase. Various bugs could be caused, but the sentry error describe above is the worst case, where MetaMask simply could not be opened and users would hit the error screen.

To correct this situation we had to fix migration 77. Once we do that, all users who were in this situation (and then upgraded to the version which included the fixes for migration 77) would have all migrations
from 77 upwards run for the first time. This could be problematic for users who had used the wallet on versions 10.24.0-10.34.0, where our controllers would be writing data to state under the assumption that
the migrations had run.

As such, we had to also add code to migration 77 to avoid new errors being introduced by the migrations running on code that had been modified by controllers on versions 10.24.0 to 10.34.0

## Introducing migration 77 supplements

To correct the aforementioned problems with the data, new state transformation functions were added to this directory, to be run in migration 77 after the pre-existing migration 77 code had run.
Each file in this directory exports a state transformation function which is then imported in the migration 77 file and applied to state in sequence, after the state transformation function in
077.js itself has run and returns state. These have been split into their own files for each of use, and so that they could be grouped with this documentation.

## The chosen supplements

We added supplements for migrations 82, 84, 86 and 88 for the following reasons and with the following effects ->

**Migration 82**

Attempts to convert `frequentRpcListDetail` - an array of objects with network related data - to a `networkConfigurations` object, with the objects that were in the array keyed by a unique id.
If this migration had not run, then (prior to v10.34.0) a user would still have been able to use MetaMask, but the data they had in `frequentRpcListDetail` would now be ignored by application code,
and subsequent network data would between written to and modified in state in the `networkConfigurations` object. If migration 82 was later run (after fixing migration 77), the old `frequentRpcListDetail`
data could overwrite the existing `networkConfigurations` data, and the user could lose `networkConfigurations` data that had been written to their state since migration 82 had first failed to run.

To fix this, the migration 82 supplement deletes `frequentRpcListDetail` if the `networkConfigurations` object exists. Users in such a scenario will have network data in `networkConfigurations` that
they have been using, while the `frequentRpcListDetail` data would not have been seen for some time. So the best thing to do for them is delete their old data and preserve the data they have most recently
used.

**Migration 84**

Replaces the `NetworkController.network` property with a `networkId` and `networkStatus` property. If this migration had not run, the NetworkController would have a `network` property and
`networkId` and `networkStatus` properties. If migration 84 later ran on this state, the old (and forgotten) `network` property could cause the `networkId` and `networkStatus` to be overwritten,
affecting the state the user's experience was currently depending on.

The fix in the migration 84 supplement is to delete the `NetworkController.network` property if the `NetworkId` property already exists.

**Migration 86**

Renamed the `NetworkController.provider` property to `providerConfig`. If this migration had not run, the NetworkController would have a `provider` property and
a `providerConfig` property. If migration 86 later ran on this state, the old (and forgotten) `provider` property could cause the `providerConfig` property to be overwritten,
affecting the state the user's experience was currently depending on.

The fix in the migration 86 supplement is to delete the `NetworkController.provider` property if the `providerConfig` property already exists.

**Migration 88**

Attempted to change the keys of multiple parts of state related to tokens. In particular, `NftController.allNftContracts`, `NftController.allNfts`, `TokenListController.tokensChainsCache`, `TokensController.allTokens`, `TokensController.allIgnoredTokens` and `TokensController.allDetectedTokens`. All of these objects were keyed by chainId in decimal number form. The migration's
purpose was to change those decimal chain ID keys to hexadecimal. If migration 77 failed, and then the user added or modified tokens, they could have duplicates within these parts of state:
some with decimal keys and others with an equivalent hexadecimal key. If the data pointed to by those keys was modified at all, and the migration 88 was later run, the most recent data (under
the hexadecimal key) could be overwritten by the old data under the decimal key.

The migration 88 supplement fixes this by deleting the properties with decimal keys if an equivalent hexadecimal key exists.

## Migrations that were not supplemented

**Migration 78** was not supplemented because it only deletes data; it does not overwrite data. It's failure to run will have left rogue data in state, but that will be removed when it is run after the migration
77 fix.

**Migration 79** was not supplemented because it only deletes data; it does not overwrite data.

**Migration 80** was not supplemented because it only deletes data; it does not overwrite data.

**Migration 81** was not supplemented because it modifies data that could only be in state on a flask build. The bug that caused the undefined data in tokenlistcontroller state was present on v14.0.2 and v14.1.0 of
the controllers, but fixed in v14.2.0 of the controllers. By the time flask was released to prod, controllers was at v25.0

**Migration 83** just builds on migration 82. No additional fix is needed for 83 given that we have the 82 supplement.

**Migration 85** was not supplemented because it only deletes data; it does not overwrite data.

**Migration 87** was not supplemented because it only deletes data; it does not overwrite data.

**Migration 89** just builds on migration 82 and 84. No additional fix is needed for 89 given that we have the 82 and 84 supplement.

**Migration 90** was not supplemented because it only deletes data; it does not overwrite data.
