# E2E API endpoints

The external API endpoints that E2E tests mock. Each endpoint is defined once,
in `index.ts`, with `defineApiMock`:

```ts
export const gasPrices = defineApiMock({
  id: 'gas-prices',
  method: 'GET',
  url: /^https:\/\/gas\.api\.cx\.metamask\.io\/networks\/\d+\/gasPrices(?:\?.*)?$/u,
  urlFor: ({ chainId }: { chainId: number }) =>
    `https://gas.api.cx.metamask.io/networks/${chainId}/gasPrices`,
  syncUrl: 'https://gas.api.cx.metamask.io/networks/1/gasPrices',
  body: gasPricesJson,
});
```

- `id` is the name of the endpoint's JSON fixture, `<id>.json`.
- `url` matches every request to the endpoint. `urlFor` matches one instance
  of it, such as one chain or one tx-sentinel host.
- `syncUrl` is the live URL the fixture was taken from.
  `yarn test:e2e:sync-api-mocks` fetches it and aligns `<id>.json` to the
  live response's shape. `syncSkip` says why it is not fetched; POST
  endpoints never are. `syncMapPaths` marks objects whose keys are data.
- `body` is the fixture. `variants` holds responses with a different
  structure, if any.
- `build` turns the test's input into a response for endpoints whose entries
  are keyed by asset, token or account. Without it, the input is a set of
  overrides on top of `body`.
- `defaultMock` makes `mock-e2e.js` register `body` as the default response.

`API_ENDPOINTS` lists every endpoint and is the only registry. `index.test.ts`
and the sync fail when a JSON file in this folder has no definition, a
definition has no JSON file, or two definitions share an id, a URL matcher or
a sync URL.

## Using an endpoint in a spec

```ts
testSpecificMock: async (server) => [
  await gasPrices.mock(server, { FastGasPrice: '99' }, { chainId: 1 }),
],
```

Use `mock()` or `response()` as the normal path. Use `rule()` only when the
handler has to match on a query or a request body, needs a completion rule
(`.once()` and similar), or answers from a callback.

- `mock(server, input?, params?)` serves the response with the test's values
  on top of the fixture. It uses `.always()`, so it replaces the default that
  `mock-e2e.js` registers after the test's mocks.
- `response(input?)` returns the same body without registering a mock, for
  handlers that build their response in a callback.
- `mockVariant(server, name, params?)` serves a named variant.
- `rule(server, params?)` is the escape hatch: it returns the mockttp rule
  builder with the endpoint's matcher, so the URL still comes from the
  definition. See "When to use `rule()`" below.
- `mockRaw(server, json, params?)` is the escape hatch for a body that is
  neither the fixture nor a variant.
- `hasFixtureDefault` is true when `mock-e2e.js` serves the fixture `body` as
  the endpoint's default. The other endpoints that have a default in
  `mock-e2e.js` register it with `rule()` and their own handler.

`body` and `variants` are deep-frozen, so a test cannot change the default for
later tests by editing them. `response()` returns a new object.

### One `mock()` per matcher

`mock()`, `mockVariant()` and `mockRaw()` use `.always()`, and mockttp serves
the first matching rule that is not complete. A rule with `.always()` is never
complete, so the first of them for a matcher answers every request. A second
one for the same matcher on the same server would never be served, so it
logs a warning. Put every
entry the test needs in one call, or pass them to the helper that already
registered the mock; for example, `mockPriceApi` takes `additionalSpotPrices`
for this reason. The gasless swap fixtures in `bridge-test-utils.ts` still
register the tx-sentinel `/network` mock twice; fixing them and turning the
warning into an error is planned for PR 3.

### When to use `rule()`

Most call sites still use `rule()`: it was the way to move a hand-written URL
into the definition without changing the handler. Moving them to `mock()` or
`response()` is a follow-up.

`rule()` keeps mockttp's behaviour. A `rule()` override of an endpoint that has a
default in `mock-e2e.js` answers only the first request unless it ends in
`.always()`: after that, the default answers. Add `.always()` to any `rule()`
override that has to answer every request. The overrides that lacked it now
use `mock()`, `mockRaw()` or `.always()`, except the Ledger swap mocks in
`hardware-wallets/ledger/mocks.ts` (planned for PR 3). A second
`rule().always()` for the same matcher is still not detected.

Overrides follow one rule: nested objects merge, arrays and scalars replace.
Entries keyed by asset, token or account start from the fixture entry's shape
with neutral values, so one asset's id or market data never lands on another.
Their input types require the identity field (`id`, `assetId`, `address`,
`accountId`, or the 4byte signature) and reject unknown keys. A spot price
`id` is the Price API slug, such as `ethereum` or `usd-coin`, never the CAIP
asset id. A balance row also requires its `balance`.

## Variants

A different value is an override, not a new file. A variant is only for a
response with a different structure from `body`, for example an error body in
place of a status object.

## Other layouts

`test/e2e/tests/bridge/mocks/*.json` holds bridge quote scenarios in a separate
layout. Moving them here as one quote endpoint with variants is a follow-up.
