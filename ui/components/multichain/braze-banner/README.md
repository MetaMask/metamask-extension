# Braze home banner

Renders the Braze banner for the `extension-wallet-home` placement with
MetaMask design-system components. The Braze SDK does not run in UI documents:
the component asks `BrazeService` for the banner through the route messenger
and receives plain fields (see `BrazeBanner` in `shared/lib/braze.ts`).
Campaign HTML never reaches the UI. How banners are synced and gated is
described in `app/braze/braze.md`.

## Configuration

- Build with `BRAZE_WEB_API_KEY` and `BRAZE_SDK_ENDPOINT`. Test builds never
  enable Braze.
- Enable the `brazeBannerHomeMinVersion` remote flag, for example
  `{ "enabled": true, "minimumVersion": "13.52.0" }`. When the flag is on, the
  Braze banner replaces the carousel on the wallet home, as on Mobile, whether
  or not a campaign is available.
- In the Braze dashboard, create the **`extension-wallet-home`** placement and
  target it with a Banner campaign.
- A banner is only served to an unlocked wallet with Basic Functionality on,
  signed in to Profile Sync.

## Campaign properties

| Property        | Type            | Use                                                               |
| --------------- | --------------- | ----------------------------------------------------------------- |
| `body`          | string          | Required; banners without a body are not shown                    |
| `title`         | string          | Optional heading                                                  |
| `cta_label`     | string          | Action text, shown only when there is no title                    |
| `image_url`     | image or string | Optional `https` image, loaded without a referrer                 |
| `deeplink`      | string          | Optional `https` link on a MetaMask universal-link host           |
| `campaign_name` | string          | Adds the `Banner Display`, `Banner Select` and `Banner Dismissed` |
|                 |                 | custom events                                                     |
| `variant_name`  | string          | Optional property of those custom events                          |

Values that do not meet these rules are dropped by the host: an image that is
not `https` is not shown, and a link on another host makes the banner
non-interactive. Unlike Mobile, external `https` links are not allowed. A
universal link opens in a tab and goes through the deep-link router, including
its interstitial, so a campaign cannot open an arbitrary site or skip the
confirmation.

## Behavior

- The banner is requested once per mount. Loading renders nothing, and the
  background waits up to five seconds for Braze, so a late campaign shows on
  the next visit instead of shifting the page.
- The impression is logged when the banner is received. Control banners (users
  held out of the campaign) render nothing but still log their impression, so
  the campaign can compare both groups; they log no custom event.
- Clicking the card logs the click and opens the link. The close button is a
  separate target: it hides the banner immediately and dismisses it in Braze,
  which then stops serving it to the user. Braze can only record a dismissal
  for banners that have a stable key, which Banner campaigns provide; without
  one the banner returns on the next visit.
- The banner does not send Segment events, so Cloud Mode does not forward a
  second copy of the custom events. The carousel's Segment events share their
  names; see the Braze SDK section of `app/scripts/lib/segment/README.md`.
