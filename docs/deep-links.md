# Deep links

A deep link is untrusted input that arrives looking like navigation: most links come from MetaMask, but anyone can build one. Its signature makes some of that input trustworthy, and reviewing a deep-link change comes down to which part. This document describes how a link is processed from interception to destination, what its signature covers, how to add a route, and how to review and test a change that touches it.

## How a link is processed

A link reaches `parse()` from one of two places. [`deep-link-router.ts`](../app/scripts/lib/deep-links/deep-link-router.ts) intercepts top-level navigations to the hosts in `DEEP_LINK_HOSTS` ([`common.ts`](../shared/lib/deep-links/common.ts)), and leaves any URL longer than `DEEP_LINK_MAX_LENGTH` (2,048 characters) to load as an ordinary web page. A deferred link is the `referringLink` of the `deferred_deeplink` cookie on MetaMask's websites, read at install by [`install-attribution.ts`](../shared/lib/install-attribution.ts) and parsed by `getDeferredDeepLinkRoute` ([`utils.ts`](../shared/lib/deep-links/utils.ts)) when onboarding completes, unless it is more than two hours old.

[`parse()`](../shared/lib/deep-links/parse.ts) finds the route by the lowercased path and returns `false` for an unknown one, which the router answers with its 404 page and the deferred flow by dropping the link. It then applies three steps, in this order:

1. **`canonicalize(url)`** ([`canonicalize.ts`](../shared/lib/deep-links/canonicalize.ts)) builds the string the signature covers. It replaces an alternate deep-link host with the canonical signing origin, `https://link.metamask.io` unless `CANONICAL_DEEP_LINK_HOST` overrides it. When `sig_params` is present, it keeps every value of each parameter that list names, adds `sig_params` itself, and sorts them. When `sig_params` is absent, it keeps every parameter except `sig`, for backward compatibility.
2. **The route handler receives the canonical parameters, with `sig_params` removed.** This happens before verification and whatever the signature turns out to be, so the handler of an unsigned or invalid link still runs and still computes a destination. A handler that throws makes `parse()` return `false` as well.
3. **`verify(url)`** ([`verify.ts`](../shared/lib/deep-links/verify.ts)) checks `sig` against the canonical string with the deep-link public key, locally (ECDSA, P-256, SHA-256). If that fails and the link is HTTPS on a configured deep-link host with no port, it tries the same signed path and query under each other configured host. It returns `valid`, `invalid`, or `missing` when there is no `sig`.

The status decides which interstitial the user sees: a `valid` link gets the trusted one ("Redirecting to MetaMask"), and any other status gets the untrusted one ("Proceed with caution"). These are the two flows in MetaMask's deep-linking decision record, [Deep Linking Into Wallet](https://github.com/MetaMask/decisions/blob/aa3ad7e1c642cf5e080fafa92c450b323fe8ddca/decisions/core/0011-deep-linking-into-wallet.md#both-public-and-private-deep-links) (`decisions/core/0011`). `shouldShowDeepLinkInterstitial` in [`security-policy.ts`](../shared/lib/deep-links/security-policy.ts) decides whether the user sees one at all: a deferred link skips it only when `valid`, and an intercepted link skips it when it comes from one of the `TRUSTED_WEB_ORIGINS`, or when it is `valid` and either onboarding is incomplete or the user has turned the warning off. Neither changes what the handler received.

The interstitial is the security boundary, and a change that would show it less often needs documented approval from the Extension Security team, as the deep-link interstitial rule in [`AGENTS.md`](../AGENTS.md) states.

When the interstitial is shown, the link's original path and query go to [`deep-link.tsx`](../ui/pages/deep-link/deep-link.tsx) as `u`, and that page parses `https://<canonical host><u>` again, so the destination the user continues to is computed from the canonical parameters as well. A `redirectTo` destination leaves the extension, so its origin and path should be constants. A handler that copies its parameters into that URL's query forwards whatever it received.

Attribution is computed separately, from the original URL. The analytics event built in [`metrics.ts`](../shared/lib/deep-links/metrics.ts) reads every parameter except `sig`, and records the last value of a repeated key, except `ref`, which it records only when it appears once. So on a `valid` link signed with `sig_params`, the event's `signature: valid` sits beside UTM, `attributionId` and `referral_code` values that the signature may not cover. The deferred flow's UTM parameters are also read from the stored link itself, by `getDeferredDeepLinkParameters` in [`selectors.js`](../ui/selectors/selectors.js).

A referral code is read from the original URL too. `getReferralCode` in [`referral.ts`](../shared/lib/deep-links/referral.ts) accepts `ref` only when it appears once and is a well-formed code, and `withReferralCode` adds it to the destination after the handler has run: in the router when no interstitial is shown, and on the interstitial page when the user continues. A deferred link's code is read when onboarding completes, by [`useOnboardingCompletion`](../ui/pages/onboarding-flow/hooks/useOnboardingCompletion.ts). `ref` is read whether or not `sig_params` lists it, because that is how referral links are built: a signed link with each sharer's `ref` added after signing. The code reaches the referral invite, which shows it to the user, who decides whether to accept it.

Three mechanisms are deliberately absent:

- **No route opts in to the original parameters.** A handler receives the canonical parameters and nothing else.
- **No route declares parameters that must be signed.** A route that forwards attribution decides what to forward in its own handler, under question 4 below.
- **`ref` is not ignored when `sig_params` leaves it out.** Referral links add `ref` after signing, so ignoring an unlisted `ref` drops the code from every link built that way. Both ways of keeping the code would cost the referral program. Signatures come from an admin interface MetaMask operates ([Deep Linking Into Wallet](https://github.com/MetaMask/decisions/blob/aa3ad7e1c642cf5e080fafa92c450b323fe8ddca/decisions/core/0011-deep-linking-into-wallet.md#both-public-and-private-deep-links)), so every sharer's code would need its own link signed there. An unsigned link instead shows every recipient the untrusted interstitial wherever one is shown.

## Adding a route

A route is a `Route` in [`shared/lib/deep-links/routes/`](../shared/lib/deep-links/routes/). Adding one is the feature team's change, and the parsing, verification and interstitial code around it belongs to the Extension Security team. [`.github/CODEOWNERS`](../.github/CODEOWNERS) draws the line:

- **The feature team** owns the route file, `routes/<name>.ts`, and its registration in `routes/index.ts`.
- **Extension Security** owns `routes/route*`, and `parse*`, `verify*`, `utils*` and `security-policy*` under `shared/lib/deep-links/`, as well as the router, `resolve-deep-link-href*` and `ui/pages/deep-link/`.

A change that reaches the second group is more than adding a route, and the review questions below apply to it in full. Two changes reach it without looking like they do:

- A route file whose name starts with `route` matches `routes/route*`, so Extension Security owns it.
- A destination constant that [`routes/route.ts`](../shared/lib/deep-links/routes/route.ts) does not already export has to be added to that file's export list.

The steps:

1. **Write the route file.** A `Route` takes a `pathname`, a `getTitle` that returns an i18n message key rather than display text, and a `handler` that returns `{ path, query }` or `{ redirectTo }` and may throw when it cannot process the parameters. [`shield.ts`](../shared/lib/deep-links/routes/shield.ts) is a short example of a handler whose destination depends on a parameter it read.
2. **Register it** with `addRoute` in [`routes/index.ts`](../shared/lib/deep-links/routes/index.ts). Registration makes the destination reachable, including unsigned and without an interstitial from the `TRUSTED_WEB_ORIGINS`. In `DEBUG` builds, `addRoute` throws when two routes claim one pathname.
3. **Add an end-to-end test** under [`test/e2e/tests/deep-link/`](../test/e2e/tests/deep-link/), signing the link with the helpers there.
4. **Add a CODEOWNERS entry** for the route file when a team owns the feature, as `routes/perps.ts` has.

## Reviewing a change

Ask these of any change to `shared/lib/deep-links/`, a new or changed route, or a pull request that says a parameter is signed.

1. **Does the signature still bind the parameter list?** `canonicalize` adds `sig_params` to the signed string, which is what makes the list tamper-evident: rewrite the list and the signature fails. A change to canonicalization has to keep that property.
2. **Is "canonical" being read as "validated"?** Canonical means the parameters a valid signature covers. Whether they are covered is the verification status, and the handler never sees it: it runs before `verify()`, on every status. On an unsigned or invalid link the author writes `sig_params` too, so canonical is whatever they chose to list, and without `sig_params` it is the whole query minus `sig`. "The handler receives canonical parameters only" bounds nothing unless the link is `valid`.
3. **Does anything give a handler, a title or a destination more than the canonical parameters?** Every handler is called with `canonicalUrl.searchParams`. Look for reads that go around it: `url.searchParams`, `window.location`, a value passed past `parse`, or a route's `getTitle`, which the interstitial page calls with the link's original parameters. `withReferralCode` is the one deliberate exception: it adds a single well-formed `ref` from the original URL to the destination.
4. **Does the route forward attribution, and from where?** A route that writes `utm_*`, `source` or `attributionId` into its destination forwards whatever its handler received, which on an unsigned link is unsigned. There is no per-route list that declares such parameters, so the check is the handler's own forwarding.
5. **Where does a value go after the parser hands it off?** The parser's guarantees end at the destination. A value written into a hash query and read back later by client code is whatever the hash holds at that moment, which other code can write.
6. **Is the destination a feature, or a page for the link?** A handler maps a link onto a feature that exists without it. A page, component or hook named for the link, or one that behaves differently because a link opened it, makes the feature depend on its entry point. Such pages are also where link-reached assumptions tend to sit, such as an action started on mount, so read them under questions 3 and 5 as well.

## Where a valid signature covers less than it appears to

`valid` answers one question: does `sig` match the canonical string. Check these on any change here.

- **An empty `sig_params`** makes the canonical string the signing origin and path followed by `?sig_params=`, and nothing else. The handler then receives no parameters. Everything else in the URL is outside the signature, which still verifies, and reaches only code that reads the original URL, such as the analytics event.
- **Repeated parameters.** `canonicalize` reads `sig_params` with `.get()`, which takes the first occurrence, and each named parameter with `.getAll()`, so every value a handler can read is in the canonical string. Code that reads the original URL can pick a different value: the analytics event records the last one. No reader accepts a repeated `ref`.
- **A parameter added after signing.** `sig_params` lets a value the signer never saw travel on a `valid` link, and referral links depend on it. To code that reads the original URL, such a value looks the same as a signed one. A value that has to be tamper-evident is listed in `sig_params` when the link is signed, so that changing it fails verification. A value left outside is acceptable only where its consumer shows it to the user and acts on their choice, as the referral invite does.
- **A signature is bound to the signing origin and the path as written**, so it cannot be replayed onto another route. The route lookup lowercases the path; the signature does not. Within a path it constrains only what the canonical string contains.

For each, the question is whether a route in the change consumes a parameter that reaches it this way, not whether the case is exploitable in the abstract.

## Testing

[`signature-boundary.test.ts`](../shared/lib/deep-links/signature-boundary.test.ts) asserts what a handler receives, what a valid signature covers and when `verify()` retries, signing with a real P-256 key.

The other suites reach the signature boundary less directly:

- [`verify.test.ts`](../shared/lib/deep-links/verify.test.ts) mocks `getKeyData` and stubs `crypto.subtle`, and [`parse.test.ts`](../shared/lib/deep-links/parse.test.ts) mocks `verify`, so neither signs with a real key.
- The end-to-end specs under [`test/e2e/tests/deep-link/`](../test/e2e/tests/deep-link/) do sign with a real P-256 key, through [`helpers.ts`](../test/e2e/tests/deep-link/helpers.ts).
- A route's own tests call its `handler` directly, so they exercise the destination logic and have no power over the signature boundary.

A unit test with a real key is cheap, and `signature-boundary.test.ts` shows the pattern: run it under `@jest-environment node`, generate a P-256 key pair with `crypto.subtle.generateKey`, and replace only `getKeyData` with the generated public key. When writing one:

- **Assert absence, not inequality.** A test that checks a specific value did not arrive still passes when a different unsigned value does. Assert the key is absent.
- **Vary values across cases.** If the accepted case and the rejected cases use the same literal for a parameter, no assertion can tell "correctly stripped" from "never checked".
- **Test the strip and the verification separately.** Break each on its own and note which tests fail. A suite can guard one and not the other, and its totals will not show it.
