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

- new fields are added with a stable placeholder (`0`, `""`, `false`, `null`).
  A new object is an object of those placeholders, and a new array of objects
  gets one such object. No live values are copied.
- fields the API no longer returns are removed. On a list, a field joins
  the shared shape when at least two entries include it, so one odd token
  cannot add and remove a field on every run. A response with a single object
  still contributes all of that object's fields
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
(and on demand via workflow dispatch). When a fixture changes, the job
commits it and opens or updates a PR. A fetch that fails is logged. If any
fixture was already written, the job still opens that PR. The job fails only
when a fixture that should have been written could not be fetched and nothing
was written.

Every E2E API mock is one row in [`api-mock-catalog.md`](./api-mock-catalog.md),
with its method, endpoint and mock file. `write:<fixture>` and
`write:<fixture>#<key>`, plus `spot`, `countries` and `contentful`, update the
fixture. Values tests assert are pinned in `api-fixtures.js` (and the price
and phishing helpers) after the fixture is read, so a shape sync cannot
change them. `skip` rows give the reason they are not called (non-JSON,
request-specific POST, intentional error, test-only host, or auth). Contentful
needs `CONTENTFUL_ACCESS_SPACE_ID` and `CONTENTFUL_ACCESS_TOKEN`; without them
it is skipped with a message. Per-spec mocks are grouped rows.

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
