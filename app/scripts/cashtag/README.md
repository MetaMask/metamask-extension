# Cashtag

Hover card for `$BTC` / `$ETH` / `$USDC` on X.

```text
content.ts      → ask BG for assets, inject pills + widget
background.ts   → GET_ASSET_DATA, OPEN_SWAP_PAGE
lib/assets.ts   → whitelist + one Price API fetch
pill/           → DOM pills
widget/         → React popover (createRoot in shadow)
```

Flow: flag → `GET_ASSET_DATA` once → paint pills → hover shows widget → Swap.
