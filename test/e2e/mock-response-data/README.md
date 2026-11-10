# E2E mock response data

## Typed API mocks

Several production crashes came from API responses the wallet didn't handle,
which our E2E mocks never exercised (#43953, #44088, #44091, #44089, #44087).
To keep the mocks in sync with what the wallet expects, mock payloads for
these APIs are typed with the **response types the wallet code and its
controller packages already use to consume them**, declared in
[`api-response-types.ts`](./api-response-types.ts):

| API                                | Type                               | Mocks                                                                     |
| ---------------------------------- | ---------------------------------- | ------------------------------------------------------------------------- |
| Contentful promotional banners     | `ContentfulBannerResponse`         | `global-api-responses.ts`                                                 |
| Notification API v4 list           | `UnprocessedRawNotification[]`     | `global-api-responses.ts`                                                 |
| Ramps `v2/regions/countries`       | `Country[]`                        | `global-api-responses.ts`                                                 |
| Price API `v3/spot-prices`         | `Omit<MarketDataDetails, …>`       | `price-api.ts`                                                            |
| DeFi adapters `positions/:address` | `{ data: DefiPositionResponse[] }` | `tests/confirmations/helpers.ts`, `benchmarks/mocks/performance-mocks.ts` |

`yarn lint:tsc` (run in CI on every PR) fails when a mock no longer matches
its type, for example when a package bump adds a required field or the wallet
code changes the shape it reads.

## Keeping mocks aligned with the live APIs

`yarn test:e2e:sync-api-mocks` fetches the live responses and updates the
fixture JSON so its **shape** matches:

- new fields are added with a stable placeholder (`0`, `""`, `false`, `null`,
  or a single placeholder element)
- fields the API no longer returns are removed
- a field whose type changed (for example `number` to `null`) is replaced with
  that placeholder
- values already in the fixture stay, including prices, balances and ids
- an empty array stays empty, so the "no countries / no notifications / no
  banners" responses tests rely on are never filled with live data

Ethereum and Monad prices are then re-applied from `DEFAULT_ETH_USD_PRICE`,
and the Bitcoin price from `DEFAULT_BTC_CONVERSION_RATE`, so a sync cannot
move the numbers E2E assertions use.

The same command runs every Monday in
[`.github/workflows/sync-e2e-api-mocks.yml`](../../../.github/workflows/sync-e2e-api-mocks.yml)
(and on demand via workflow dispatch). When a fixture changes, the job commits
it and opens or updates a PR for review. A fixture that no longer satisfies
its consumer type fails `yarn lint:tsc` on that PR: update the wallet's type,
or adjust the fixture, before merging.

| Fixture                                  | Live call                                               | Without credentials                                                                                |
| ---------------------------------------- | ------------------------------------------------------- | -------------------------------------------------------------------------------------------------- |
| `price-api.json`                         | `price.api.cx.metamask.io/v3/spot-prices`               | public                                                                                             |
| `global-api-responses.json` `countries`  | `on-ramp-cache.api.cx.metamask.io/v2/regions/countries` | public; the empty list is kept                                                                     |
| `global-api-responses.json` `contentful` | `cdn.contentful.com` promotional banners                | skipped. Needs `CONTENTFUL_ACCESS_SPACE_ID` and `CONTENTFUL_ACCESS_TOKEN` (the build secrets)      |
| notifications                            | not called                                              | needs a profile bearer token; the empty list is hand-maintained                                    |
| DeFi positions                           | not called                                              | the fixture in `tests/confirmations/helpers.ts` is asserted by E2E tests, so it is hand-maintained |

Assets the price API does not list (Sepolia, localhost) follow the Ethereum
template's shape.

### Adding an API

1. Find the code that reads the response and the type it uses. Prefer a type
   the package exports; otherwise export it from the wallet code, or import it
   from the package's published `.d.ts` (see `DefiPositionResponse`).
2. Add an alias to `api-response-types.ts`, composing existing types only
   (e.g. `{ data: X[] }`). Never redefine a response shape by hand.
3. Move the mock payload into a TypeScript module here (if it is inline in
   `mock-e2e.js`) and annotate it with the type, or add
   `satisfies YourType` where it is defined in a TypeScript test helper.

### When `yarn lint:tsc` fails on a mock

The consumer type changed. Update the mock to the new shape (the error names
the missing or mistyped fields), then run the E2E tests that use it. If the
mock is right and the type is wrong, fix the type in the consuming code
instead of loosening the mock.
