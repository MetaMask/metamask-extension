# Platform wiring

Read the [MVP](./mvp.md) for concrete additions to each file. This page
explains why those additions are necessary.

## Build path

1. The MV2 and MV3 manifests declare a site-scoped content script. The
   [ManifestPlugin](../../development/webpack/utils/plugins/ManifestPlugin/index.ts)
   collects that TypeScript entry and emits a self-contained JavaScript file.
   Cashtags use `scripts/cashtag/entry.ts` in source and
   `scripts/cashtag/entry.js` in the built manifest.
2. The manifests declare `widget.html` as a web-accessible resource. The plugin
   scans `app/html/other`, so it picks up
   [`widget.html`](../../app/html/other/widget.html) without another webpack
   entry declaration. HtmlBundler turns the referenced
   `widget-bootstrap.ts` into the emitted script tag.
3. The plugin reads scripts referenced by web-accessible HTML and marks their
   entrypoints self-contained and isolated. The
   [LavaMoat plugin](../../development/webpack/utils/plugins/LavamoatPlugin/index.ts)
   uses that metadata to protect the bootstrap and every manifest content
   script with its own safe runtime. The generic bootstrap dynamically imports
   a widget UI bundle only after a successful background claim.

`ManifestPlugin` discovers **build entries**. It does not decide which sites may
frame the page. The site must still be listed in the MV3 web-accessible resource
matches, the widget origin registry, and the relevant `frame-ancestors` policy.

## URL and assets

Content scripts call [`createWidgetFrame`](../../app/scripts/widgets/host.ts),
which obtains the page URL through `getWidgetPageUrl()`. That helper is the
single runtime location for the stable `widget.html` output path. The page URL
contains no widget ID, data, or token.

Do not use `new URL('./widget.html', import.meta.url)` for this HTML entry
without verifying the emitted output. Webpack can treat that expression as an
asset dependency and emit another HTML file outside HtmlBundler's page entry.
Feature-specific images and CSS still need their own build handling; the
cashtag widget currently loads its copied CSS from the authorized frame.

## Manifest V3 and V2

MV3 web-accessible resources have `matches`, so the manifest can restrict
`widget.html` to selected sites. MV2 lists the resource by filename and exposes
it more broadly; background authorization is required in both versions. The
extension-page `frame-ancestors` policy applies to extension pages generally,
so widening it needs a security review. Being able to frame an extension page
does not by itself grant access to pages absent from the web-accessible
resource list.

The host site's own `frame-src` policy can also prevent loading the iframe.
The extension cannot guarantee that a site will continue to permit it.

## Verify emitted output

The build tooling itself is compiled into `development/.webpack`. Compile it
before testing plugin changes, then inspect each build immediately because a
later build can replace `dist`:

```bash
yarn webpack:tsc
yarn build:test
# Inspect dist/chrome/manifest.json and dist/chrome/widget.html.
yarn build:test:mv2
# Inspect dist/firefox/manifest.json and dist/firefox/widget.html.
```

Check that the general content-script entry is still site-agnostic, the new
entry is matched only on its site, `widget.html` is the only widget WAR page,
and the emitted HTML initially references only the shared bootstrap. Inspect
the build output for `ERROR in` as well as the command exit status.
