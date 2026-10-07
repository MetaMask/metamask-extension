# Braze home banner

Custom React rendering using MetaMask design-system components, matching Mobile's
`refactor/repalce-braze-dismissal-by-sdk` implementation. Campaign HTML is never
inserted into the wallet DOM. MMDS does not provide this campaign card layout;
the card composes its Box, Text, and ButtonIcon components with token-based
Tailwind styling. Storybook MCP was unavailable; installed package types are the
API reference.

## Configuration

- Configure `BRAZE_WEB_API_KEY` and `BRAZE_SDK_ENDPOINT` and rebuild.
- Enable `brazeBannerHomeMinVersion` with
  `{ "enabled": true, "minimumVersion": "13.52.0" }` (wrapped rollout values also
  supported).
- Create placement **`extension-wallet-home`** in the Braze dashboard.
- Requires an unlocked wallet, basic functionality enabled, Profile Sync sign-in,
  and a canonical profile ID. Existing test builds disable Braze initialization.

## Campaign properties

| Property | Type | Use |
| --- | --- | --- |
| `body` | string | Required; blank bodies are ignored |
| `title` | string | Optional heading |
| `cta_label` | string | CTA text when no title is present |
| `image_url` | image or string | Optional HTTPS image, fetched without a referrer |
| `deeplink` | string | Optional HTTPS URL on an exact configured MetaMask universal-link host |
| `campaign_name` | string | Optional display/dismissal custom-event targeting |
| `variant_name` | string | Optional custom-event metadata |

Only the action surface opens the deeplink. The close button is an independent
keyboard-accessible target. Universal links open in a browser tab through the
existing deep-link interception flow; Braze does not gain trusted-origin routing.
Invalid links produce a noninteractive card.

## Lifecycle and SDK 7

Identification happens before subscribing to `subscribeToBannersEvents`.
`CACHE_REPLAY` synchronously provides warm-cache data; a placement-specific
`requestBannersRefresh` then requests fresh content. No additional SDK session is
opened by the banner. Expired/absent placements are represented by `undefined`,
and cache removal or `CACHE_LOAD` removes the rendered card. Analytics events on
the same stream are ignored by the content state machine. The SDK handles retries;
the hook does not retry terminal 4xx errors.

Loading renders nothing. A five-second startup window prevents late initial
campaigns from shifting the page; an already-visible banner may be replaced.
Repeated banner IDs are deduplicated. Subscriptions and timers are cleaned up
on unmount; identity changes remount the banner.

Dismissal hides the card immediately for this mount and calls the Web SDK's
`dismissBanner(banner)`. Braze owns cache removal, persistence, and campaign
re-eligibility. There is no Redux dismissal state or wallet migration. Display
and dismissal also log Mobile's `Banner Display` / `Banner Dismissed` custom
events when `campaign_name` exists. The Web Banner public API has no
`isTestSend` field; test-send behavior is delegated to the Web SDK.

The existing Contentful carousel remains available under `carouselBanners`.
