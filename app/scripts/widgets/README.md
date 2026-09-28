# Extension widgets

For a complete example and the platform and security details, see the
[extension widget documentation](../../../docs/extension-widgets/README.md).

`widget.html` is the sole web-accessible widget page. It loads only
`widget-bootstrap.ts`; a widget UI bundle is imported after the background
claims that frame's registration. `ManifestPlugin` discovers the page from the
manifest and isolates its referenced bootstrap script for LavaMoat.

To add a widget:

1. Add its typed ID, allowed parent origins, and action names in `protocol.ts`.
2. Add its UI loader to `widget-bootstrap.ts`. The UI module receives a token
   and payload. It must validate the payload before use and can call
   `sendWidgetAction` for background requests.
3. Export its permitted background actions as a widget definition and add it to
   the single `registerWidgetBackgroundBridge` call in `background.js`.
4. Add a site-scoped content-script entry to both manifests. It should create a
   frame with `createWidgetFrame`, then call `show(payload)` for each instance.
   Use `sendUpdate(payload)` for feature-specific live state and `dispose()`
   when the instance is removed.
5. Add the site to the MV3 `widget.html` web-accessible resource matches and the
   extension-page `frame-ancestors` policy. MV2 exposes the page globally, so
   the background authorization remains essential there.

Each frame has a separate random token. The background binds it to the widget
ID, parent tab and document, and claimed frame and document. Never choose a UI
module or dispatch a background action from a URL parameter or an unclaimed
frame message. Registrations expire after 15 seconds if unclaimed, and each tab
can hold at most 32 live registrations.
