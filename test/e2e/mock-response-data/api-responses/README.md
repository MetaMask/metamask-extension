# E2E API responses

Response bodies for the external APIs that E2E tests and helpers mock. Specs
import them through the builders in `index.ts`, not by reading the JSON files
directly.

## One file per endpoint

- Each `<id>.json` holds one typical response of one live endpoint. The id is
  the file name without `.json`.
- `sources.json` registers every file: `method`, the live `url` the sync
  compares the file against, and `mode` (`write`, `derived` with `follows`, or
  `skip` with a `reason`). `write` is GET only.
- `API_RESPONSES` in `index.ts` exports every file under its id.
- `index.test.ts` fails when these three lists differ.

Use the ids from the API mock catalog (`api-mock-catalog.md` in #47760). The
same endpoint gets the same id, and a shared id must have the same body.

## Variants come from builder overrides

A test that needs a different response for an endpoint calls the endpoint's
builder with the values it asserts. It does not add a file.

- Envelope builders (`buildGasPrices`, `buildTxSentinelNetwork`,
  `buildBridgeTxStatus`, ...) start from the fixture and put the test's values
  on top. Nested objects merge, and arrays and scalars are replaced
  (`withOverrides`, the same rule as `withPins` in #47760). Fields a sync adds
  therefore reach the wallet.
- Entry builders (`buildSpotPrice`, `buildTokensV3Asset`,
  `buildTokenListToken`, `buildBridgePopularToken`, `buildBridgeTokensSearch`,
  `buildMultiaccountBalancesV5`, `buildFourByteSignatures`) build one asset,
  token, row or signature. They start from the fixture entry's shape with
  neutral values (`placeholderOf`, the same as `placeholder` in #47760) and put
  the test's values on top, so one asset's id or market data never lands on
  another. Their types require the identity field (`id`, `assetId`,
  `address`, `accountId`, or the signature) and reject unknown keys.

### Exception: a response that cannot be an override

Some responses differ in structure, not in values: a failed bridge status
(an error body instead of a status object), or a Solana spot price shaped
differently from the EVM entry. Those get a separate file named
`<id>-<variant>.json`, for example `bridge-get-tx-status-failed.json`. Register
it in `sources.json` with the same `url` as the base endpoint, `mode: "derived"`
and `follows: "<id>"`, so the sync does not fetch it on its own. Use this only
when the response cannot be built from the base fixture.

## Other layouts

- `api-fixtures.json` (#47760) holds the global mocks registered in
  `mock-e2e.js`, one key per id. When #47888 is rebased onto #47760, the
  catalog becomes the only registry: its rows point at
  `write:api-responses/<id>.json`, the shared ids move here, and
  `sources.json` is removed.
- `test/e2e/tests/bridge/mocks/*.json` holds bridge quote scenarios. It is a
  third layout and a follow-up: those quotes should move here as one quote
  fixture per endpoint, with the scenarios built as overrides.
