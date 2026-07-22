# Cashtag content script

Hover card for `$BTC` / `$ETH` on X.

```text
cashtag/
  content.ts            # bootstrap (manifest entry)
  background.ts         # BG bridge
  README.md
  lib/
    constants.ts
    types.ts
    ui.ts               # shadow host + CSS load
    helpers.ts          # formatUsd + cashtag link discovery
  pill/
    inject.ts           # injectPills
    styles.css
  widget/
    inject.ts           # injectWidget + bindWidgetTriggers
    widget.tsx
    widget.css          # shadow UI
    page.css            # popover host + interest-delay (page)
```

Surfaces are independent:

- **pill** — paint pills + price (`pill/styles.css` only)
- **widget** — find links, bind `interestfor`, popover (`widget/page.css` + `widget/widget.css`)
- Both use `lib/helpers.ts` to find X cashtag links; neither depends on the other.

Flow: flag → whitelist → pills + inject widget + bind triggers → hover → Swap.

```ts
const pills = await injectPills(assetsBySymbol, { getAssetPrice });
const widget = await injectWidget({ getAssetPrice });
const triggers = bindWidgetTriggers(widget, assetsBySymbol);
```

Restart watch after CSS / CopyPlugin / WAR changes. Pill + widget CSS must be in
`web_accessible_resources` so the content script can `fetch` them.
