# Extension widgets

This framework renders extension-owned UI inside a web page. A site-scoped
content script creates an iframe; the iframe loads the shared, web-accessible
`widget.html` page. That page stays empty until the background authorizes the
specific frame and widget instance. The current consumer is the X cashtag
widget.

## Start here

- [Build an MVP widget](./mvp.md): a complete `example.com` widget, including
  manifest, UI, background, and message snippets.
- [Platform wiring](./platform.md): how Webpack, ManifestPlugin, LavaMoat, and
  the MV2/MV3 manifests produce and load the widget page.
- [Security and protocol](./security.md): message sequence, authorization
  checks, lifecycle, limits, and verification.

## Current implementation

| Concern                                     | Source                                                                                                                       |
| ------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------- |
| Widget IDs, allowed origins, and URL helper | [`protocol.ts`](../../app/scripts/widgets/protocol.ts)                                                                       |
| Content-script frame lifecycle              | [`host.ts`](../../app/scripts/widgets/host.ts)                                                                               |
| Empty page and post-claim UI loader         | [`widget.html`](../../app/html/other/widget.html), [`widget-bootstrap.ts`](../../app/scripts/widgets/widget-bootstrap.ts)    |
| Background session and action routing       | [`authorization.ts`](../../app/scripts/widgets/authorization.ts), [`background.ts`](../../app/scripts/widgets/background.ts) |
| Authorized frame action client              | [`frame-runtime.ts`](../../app/scripts/widgets/frame-runtime.ts)                                                             |
| X-specific example                          | [`entry.ts`](../../app/scripts/cashtag/entry.ts), [`frame.tsx`](../../app/scripts/cashtag/widget/frame.tsx)                  |

The background has one widget listener. Each widget supplies a definition with
an enabled check and an explicit action allowlist. A site can create multiple
widget instances; each iframe gets its own registration token. Feature code
does not belong in the general content script when it only runs on one site.
