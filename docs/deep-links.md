# Extension deep links

## Explore Search

Use this link for campaigns that should open Explore Search with results spanning
tokens, perps, stocks, and RWAs:

```text
https://link.metamask.io/trending?screen=search&q=Apple
```

Contract:

- `screen=search` opens Explore Search.
- `q` is the preferred search query parameter.
- `query` is accepted as an alias when `q` is missing or empty.
- A missing or empty query opens Explore Search with an empty search field.
- Query values must be URL-encoded. For example, use `q=Apple%20Inc`.
- Users can edit or clear the pre-populated query normally.

The Extension deep-link security interstitial still applies. Explore Search must
also be available through the `extensionUXSearch` feature flag.
