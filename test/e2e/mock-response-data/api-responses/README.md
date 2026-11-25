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
  body: gasPricesJson satisfies Wallet.SwapsGasPrices,
  defaultMock: { params: ({ chainId }) => ({ chainId }) },
});
```

- `id` is the name of the endpoint's JSON fixture, `<id>.json`.
- `url` matches every request to the endpoint. `urlFor` matches one instance
  of it, such as one chain or one tx-sentinel host.
- `syncUrl` is the live URL the fixture was taken from. `$NAME` in it comes
  from the environment when the sync runs.
- `syncSkip` says why the sync does not fetch `syncUrl` (for example an API
  that now needs a parameter the fixture's request lacks). POST endpoints are
  never fetched.
- `syncMapPaths` lists objects whose keys are data, such as tickers or chain
  names (`''` is the root). The sync aligns their values and never adds or
  drops keys.
- `body` is the fixture. When the wallet reads it with a known type, the
  definition checks it with `satisfies` against `wallet-types.ts`, so
  `yarn lint:tsc` fails when a sync drops a field the wallet reads.
- `variants` holds responses with a different structure, if any.
- `build` turns the test's input into a response for endpoints whose entries
  are keyed by asset, token or account. Without it, the input is a set of
  overrides on top of `body`.
- `defaultMock` registers the endpoint's default in `mock-e2e.js`, in
  `API_ENDPOINTS` order. By default it serves `body`. Its options:
  - `params` narrows the default to one instance, such as the test's chain.
  - `query` narrows it to requests with these query values.
  - `always` keeps it answering after other matching rules.
  - `fallback` lets any rule at the default priority answer first.
  - `reply(request, body)` builds the default from the request, for a default
    that answers by query or from the request URL. `hasFixtureDefault` is
    false for these.

`API_ENDPOINTS` lists every endpoint. It is the only registry: the sync and
`index.test.ts` both fail when a JSON file in this folder has no definition,
a definition has no JSON file, or two definitions share an id, a URL matcher
or a sync URL.

## Syncing with the live APIs

`yarn test:e2e:sync-api-mocks` fetches each GET definition's `syncUrl` and
aligns `<id>.json` to the live response's **shape**. Existing values stay,
new fields get placeholders (`0`, `""`, `false`, `null`, `[]`), removed
fields are dropped, and a live `null` keeps the fixture value. In a list, a
field only some live items return stays only on fixture items that already
have it. See the root `README.md` and `.github/workflows/sync-e2e-api-mocks.yml`
for the weekly and pull-request jobs and the exit codes.

## Using an endpoint in a spec

```ts
testSpecificMock: async (server) => [
  await gasPrices.mock(server, { FastGasPrice: '99' }, { chainId: 1 }),
],
```

Use `mock()` or `response()` as the normal path. Use `rule()` only when the
handler has to match on a query or a request body, needs a completion rule
(`.once()` and similar), or builds its body when a request arrives.

- `mock(server, input?, params?)` serves the response with the test's values
  on top of the fixture. It uses `.always()`, so it replaces the default that
  `mock-e2e.js` registers after the test's mocks.
- `response(input?)` returns the same body without registering a mock, for
  handlers that build their response in a callback.
- `mockVariant(server, name, params?)` serves a named variant.
- `mockRaw(server, json, params?)` serves a body that is neither the fixture
  nor a variant. Like `mock()`, it answers every request.
- `rule(server, params?)` is the escape hatch: it returns the mockttp rule
  builder with the endpoint's matcher, so the URL still comes from the
  definition.

`body` and `variants` are deep-frozen, so a test cannot change the default for
later tests by editing them. `response()` returns a new object.

### One override per matcher

`mock()`, `mockVariant()` and `mockRaw()` use `.always()`, and mockttp serves
the first matching rule that is not complete. A rule with `.always()` is never
complete, so the first override for a matcher answers every request. A second
one for the same matcher on the same server throws, naming the endpoint that
registered the first. Put every entry the test needs in one call, or pass them
to the helper that already registered the mock; for example, `mockPriceApi`
takes `additionalSpotPrices` for this reason.

### `rule()` overrides

A `rule()` override of an endpoint that has a default answers only the first
request unless it ends in `.always()`: after that, the default answers. Every
`rule()` override of a defaulted endpoint now uses `.always()` or a completion
rule on purpose. The remaining `rule()` call sites match on a query or a
request body, use a completion rule, build their body when a request arrives,
or serve a literal body without `.always()` for an endpoint that has no
default.

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
