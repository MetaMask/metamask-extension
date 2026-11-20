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
- `body` is the fixture. `variants` holds responses with a different
  structure, if any.
- `build` turns the test's input into a response for endpoints whose entries
  are keyed by asset, token or account. Without it, the input is a set of
  overrides on top of `body`.
- `defaultMock` makes `mock-e2e.js` register `body` as the default response.

`API_ENDPOINTS` lists every endpoint. `index.test.ts` fails when a JSON file
in this folder has no definition, or a definition has no JSON file.

## Using an endpoint in a spec

```ts
testSpecificMock: async (server) => [
  await gasPrices.mock(server, { FastGasPrice: '99' }, { chainId: 1 }),
],
```

- `mock(server, input?, params?)` serves the response with the test's values
  on top of the fixture. It uses `.always()`, so it replaces the default that
  `mock-e2e.js` registers after the test's mocks. Without `.always()`, mockttp
  serves a rule with no completion check only for the first request; later
  requests go to the default.
- `response(input?)` returns the same body without registering a mock, for
  handlers that build their response in a callback.
- `mockVariant(server, name, params?)` serves a named variant.
- `rule(server, params?)` is the escape hatch: it returns the mockttp rule
  builder with the endpoint's matcher, for handlers that match on a query or a
  request body, answer from a callback, or need a completion rule other than
  `.always()`.
- `mockRaw(server, json, params?)` is the escape hatch for a body that is
  neither the fixture nor a variant.

Overrides follow one rule: nested objects merge, arrays and scalars replace.
Entries keyed by asset, token or account start from the fixture entry's shape
with neutral values, so one asset's id or market data never lands on another.
Their input types require the identity field (`id`, `assetId`, `address`,
`accountId`, or the 4byte signature) and reject unknown keys. A spot price
`id` is the Price API slug, such as `ethereum` or `usd-coin`, never the CAIP
asset id.

## Variants

A different value is an override, not a new file. A variant is only for a
response with a different structure from `body`, for example an error body in
place of a status object.

## Other layouts

`test/e2e/tests/bridge/mocks/*.json` holds bridge quote scenarios in a separate
layout. Moving them here as one quote endpoint with variants is a follow-up.
