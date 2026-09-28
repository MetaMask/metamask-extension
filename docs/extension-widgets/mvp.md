# MVP: add a widget for `example.com`

This example adds a small widget that displays a message returned by an
explicit background action. The snippets are additions to the current
[framework](./README.md), not a second widget page or message listener. Replace
`example.com` and the demo action with the real feature's site and behavior.

## 1. Register the widget contract and site

Create `app/scripts/demo/actions.ts` for the widget's action names:

```ts
export const DEMO_ACTIONS = {
  Echo: 'demo.echo',
} as const;
```

Import `DEMO_ACTIONS` into
[`protocol.ts`](../../app/scripts/widgets/protocol.ts) and add a property to
the existing `WIDGETS` object:

```ts
import { DEMO_ACTIONS } from '../demo/actions';

Demo: defineWidget({
  id: 'demo',
  origins: ['https://example.com'],
  actions: [DEMO_ACTIONS.Echo],
}),
```

The origin has no path or trailing slash. `WidgetId` and the allowed action
names are derived from `WIDGETS`. Add the same ID to the frame loader and
background definition map below.

## 2. Declare the site-scoped content script and frame access

Append this entry to `content_scripts` in both
[`app/manifest/v3/_base.json`](../../app/manifest/v3/_base.json) and
[`app/manifest/v2/_base.json`](../../app/manifest/v2/_base.json):

```json
{
  "matches": ["https://example.com/*"],
  "js": ["scripts/demo/entry.ts"],
  "run_at": "document_idle",
  "all_frames": false
}
```

In the **existing** `widget.html` object in the MV3 `web_accessible_resources`
array, extend `matches`:

```json
{
  "resources": ["widget.html"],
  "matches": ["https://x.com/*", "https://www.x.com/*", "https://example.com/*"]
}
```

MV2 already lists `"widget.html"` in `web_accessible_resources`. Keep that
single entry; MV2 has no per-site WAR `matches` field.

Also add the new origin to `frame-ancestors`. These snippets show the relevant
property in each browser manifest; preserve the other properties in those
files. MV3 uses `content_security_policy.extension_pages` in
[`app/manifest/v3/chrome.json`](../../app/manifest/v3/chrome.json):

```json
"extension_pages": "script-src 'self' 'wasm-unsafe-eval'; object-src 'none'; frame-ancestors 'self' https://x.com https://www.x.com https://example.com; font-src 'self';"
```

MV2 uses `content_security_policy` in both
[`chrome.json`](../../app/manifest/v2/chrome.json) and
[`firefox.json`](../../app/manifest/v2/firefox.json):

```json
"content_security_policy": "frame-ancestors 'self' https://x.com https://www.x.com https://example.com; script-src 'self' 'wasm-unsafe-eval'; object-src 'none'; font-src 'self';"
```

This is an extension-page policy, so review the effect on other extension
pages before adding a site. A page can also block the iframe with its own
`frame-src` policy.

## 3. Add a site-scoped host entry

Create `app/scripts/demo/entry.ts`. It is the executable entry named by the
manifest. Keep reusable scan or placement logic in separate modules if this
grows beyond the example.

```ts
import { createWidgetFrame } from '../widgets/host';
import { WIDGETS } from '../widgets/protocol';

let widget: ReturnType<typeof createWidgetFrame> | undefined;

function mount() {
  widget = createWidgetFrame(WIDGETS.Demo);
  widget.element.style.cssText +=
    'position:fixed;right:24px;bottom:24px;width:240px;height:80px;z-index:2147483647;';
  document.documentElement.appendChild(widget.element);
  widget.show({ message: 'Hello from example.com' });
}

mount();
window.addEventListener('pagehide', () => {
  widget?.dispose();
  widget = undefined;
});
window.addEventListener('pageshow', (event) => {
  if (event.persisted) {
    mount();
  }
});
```

`show` creates a fresh random token, registers it with the background, and
then navigates the frame to the shared `widget.html`. Call `show` for each
visible instance, `hide` when hiding one, and `dispose` when removing it. For
widget-specific live state, call `sendUpdate(payload)` and validate that
payload in the frame.

## 4. Define an action and the frame UI

Create `app/scripts/demo/frame.ts`. The generic bootstrap calls `mountFrame`
only after the background claims this particular frame. Treat its payload and
the action response as untrusted data.

```ts
import { sendWidgetAction, setWidgetSession } from '../widgets/frame-runtime';
import { WIDGETS } from '../widgets/protocol';
import { DEMO_ACTIONS } from './actions';

export async function mountFrame({
  authToken,
  payload,
}: {
  authToken: string;
  payload: unknown;
}) {
  const root = document.getElementById('root');
  if (!root || !payload || typeof payload !== 'object') {
    return;
  }
  const message = (payload as { message?: unknown }).message;
  if (
    typeof message !== 'string' ||
    message.length < 1 ||
    message.length > 100
  ) {
    return;
  }

  setWidgetSession(WIDGETS.Demo.id, authToken);
  const response: unknown = await sendWidgetAction(DEMO_ACTIONS.Echo, {
    message,
  });
  const body =
    response && typeof response === 'object'
      ? (response as { body?: unknown }).body
      : undefined;
  const returnedMessage =
    body && typeof body === 'object'
      ? (body as { message?: unknown }).message
      : undefined;
  root.textContent =
    typeof returnedMessage === 'string' ? returnedMessage : 'Unavailable';
}
```

Add the loader to the existing `widgetLoaders` in
[`widget-bootstrap.ts`](../../app/scripts/widgets/widget-bootstrap.ts):

```ts
const widgetLoaders = {
  [WIDGETS.Cashtag.id]: () => import('../cashtag/widget/frame'),
  [WIDGETS.Demo.id]: () => import('../demo/frame'),
};
```

Do not add another HTML page. The loader is lazy, so the demo UI is absent
until a claimed demo frame requests it.

If this widget later needs live updates, the content script can call
`widget.sendUpdate({ type: 'demo.message', message: 'Updated' })`. In `frame.ts`,
subscribe with `onWidgetUpdate` from `../widgets/frame-updates` and validate the
unknown payload before applying it:

```ts
onWidgetUpdate((update) => {
  if (!update || typeof update !== 'object') {
    return;
  }
  const { type, message } = update as Record<string, unknown>;
  if (
    type === 'demo.message' &&
    typeof message === 'string' &&
    message.length >= 1 &&
    message.length <= 100
  ) {
    root.textContent = message;
  }
});
```

The generic transport authenticates the frame session. The widget defines the
update type and checks its payload; it does not add an update type to the
generic protocol.

## 5. Add an explicit background action

Create `app/scripts/demo/background.ts`:

```ts
import type { WidgetBackgroundDefinition } from '../widgets/background';
import { WIDGETS } from '../widgets/protocol';
import { DEMO_ACTIONS } from './actions';

export function createDemoWidgetDefinition(): WidgetBackgroundDefinition<
  typeof WIDGETS.Demo.id
> {
  return {
    isEnabled: () => true,
    actions: {
      [DEMO_ACTIONS.Echo]: (payload) => {
        const message = payload.message;
        return {
          type: DEMO_ACTIONS.Echo,
          body: {
            message:
              typeof message === 'string' &&
              message.length >= 1 &&
              message.length <= 100
                ? message
                : null,
          },
        };
      },
    },
  };
}
```

In [`app/scripts/background.js`](../../app/scripts/background.js), add this
import next to the widget imports:

```ts
import { createDemoWidgetDefinition } from './demo/background';
```

Add the key to the **existing** `registerWidgetBackgroundBridge` call, after
controller setup:

```ts
registerWidgetBackgroundBridge({
  [WIDGETS.Cashtag.id]: createCashtagWidgetDefinition(() => controller),
  [WIDGETS.Demo.id]: createDemoWidgetDefinition(),
});
```

The bridge checks the sender and claimed session before dispatching an action.
Each definition still validates its own action payload and checks its feature
gate or user state in `isEnabled`.

## 6. Verify

Add colocated tests for the feature's payload rules and actions. Then run the
smallest relevant test set, typecheck, and both browser builds:

```bash
yarn lint:changed:fix
yarn lint:tsc
yarn test:unit app/scripts/demo app/scripts/widgets --runInBand
yarn build:test
yarn build:test:mv2
```

Check the emitted manifests and `widget.html` as described in
[platform wiring](./platform.md). In each browser, load `example.com`, confirm
the frame renders, confirm a second instance gets its own session, and verify
that an unregistered frame stays blank. No dependency or LavaMoat policy update
is needed for this example; run `yarn lavamoat:auto` if a real widget changes
dependencies.
