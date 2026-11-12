# Ramps Buy E2E

`ramps-buy.spec.ts` covers the in-app Ramps Buy flow against a captured,
client-facing ramps contract. It requires **no local services**.

```bash
yarn start:test          # or yarn build:test
yarn test:e2e:single test/e2e/tests/ramps/ramps-buy.spec.ts --browser=chrome
```

Coverage:

```text
Home Buy -> token selection (ETH) -> build quote -> captured quote
-> Continue -> mocked provider checkout tab -> Complete purchase
-> callback -> order resolution -> Activity (Ethereum Mainnet) -> Bought ETH
```

The client-facing ramps responses live in `ramps-fixtures.ts`. They are derived
from the local `onramp-api` + `ramp-provider` stack, not hand-invented.

The spec mocks only the ramps hosts and the fake provider page:

- `on-ramp-cache.uat-api.cx.metamask.io` catalog
- `on-ramp.uat-api.cx.metamask.io` quotes, callback, orders
- `on-ramp-content.uat-api.cx.metamask.io` callback page
- `provider-mock.test` widget HTML

Everything else in the extension E2E harness remains mocked as usual.

The privacy snapshot includes the two mock-only hosts
(`provider-mock.test`, `127.0.0.1:8000`).

Do not commit unrelated local-network hosts, such as an ISP CDN that Chrome
happens to request on your machine. If one appears, run with
`--update-privacy-snapshot` to diagnose it, then revert that host before
committing. CI runners do not make that request.
