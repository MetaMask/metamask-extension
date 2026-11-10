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
