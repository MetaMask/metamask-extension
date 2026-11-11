# Deep links: signature verification and review

A deep link is attacker-supplied input that arrives looking like navigation. Its signature makes some of that input trustworthy, and reviewing a deep-link change always comes down to which part. This document describes how `shared/lib/deep-links/` decides that, and what to check when a change touches it.

## How a link is processed

A link reaches `parse()` from one of two places. [`deep-link-router.ts`](../app/scripts/lib/deep-links/deep-link-router.ts) intercepts top-level navigations to the hosts in `DEEP_LINK_HOSTS` ([`common.ts`](../shared/lib/deep-links/common.ts)), and leaves any URL longer than `DEEP_LINK_MAX_LENGTH` (2,048 characters) to load as an ordinary web page. A deferred link is the `referringLink` of the `deferred_deeplink` cookie on MetaMask's websites, read at install by [`install-attribution.ts`](../shared/lib/install-attribution.ts) and parsed by `getDeferredDeepLinkRoute` ([`utils.ts`](../shared/lib/deep-links/utils.ts)) when onboarding completes, unless it is more than two hours old.

[`parse()`](../shared/lib/deep-links/parse.ts) finds the route by the lowercased path and returns `false` for an unknown one, which the router answers with its 404 page and the deferred flow by dropping the link. It then applies three steps, in this order:

1. **`canonicalize(url)`** ([`canonicalize.ts`](../shared/lib/deep-links/canonicalize.ts)) builds the string the signature covers. It replaces an alternate deep-link host with the canonical signing origin. When `sig_params` is present, it keeps every value of each parameter that list names, adds `sig_params` itself, and sorts them. When `sig_params` is absent, it keeps every parameter except `sig`, for backward compatibility.
2. **The route handler receives the canonical parameters, with `sig_params` removed.** This happens before verification and whatever the signature turns out to be, so the handler of an unsigned or invalid link still runs and still computes a destination. A handler that throws makes `parse()` return `false` as well.
3. **`verify(url)`** ([`verify.ts`](../shared/lib/deep-links/verify.ts)) checks `sig` against the canonical string with the deep-link public key, locally (ECDSA, P-256, SHA-256). If that fails and the link is HTTPS on a configured deep-link host with no port, it tries the same signed path and query under each other configured host. It returns `valid`, `invalid`, or `missing` when there is no `sig`. The status decides which interstitial the user sees, and `shouldShowDeepLinkInterstitial` in [`security-policy.ts`](../shared/lib/deep-links/security-policy.ts) decides whether they see one at all: a deferred link skips it only when `valid`, and an intercepted link skips it when it comes from a trusted MetaMask web origin, or when it is `valid` and the user has turned the warning off. Neither changes what the handler received.

When the interstitial is shown, the link's original path and query go to [`deep-link.tsx`](../ui/pages/deep-link/deep-link.tsx) as `u`, and that page parses `https://<canonical host><u>` again, so the destination the user continues to is computed from the canonical parameters as well. A `redirectTo` destination leaves the extension, so its origin and path should be constants. A handler that copies its parameters into that URL's query forwards whatever it received.

Attribution is computed separately, from the original URL. The analytics event built in [`metrics.ts`](../shared/lib/deep-links/metrics.ts) reads every parameter except `sig`, and records the last value of a repeated key. So on a `valid` link signed with `sig_params`, the event's `signature: valid` sits beside UTM, `attributionId` and `referral` values that the signature may not cover. The deferred flow's UTM parameters are also read from the stored link itself, by `getDeferredDeepLinkParameters` in `ui/selectors/selectors.js`.

Two mechanisms that older pull requests refer to no longer exist. The per-route `handlerSearchParams: 'original'` opt-in was removed by #45103 (Prevent unsigned parameter forwarding to route handlers). The per-route `signatureRequiredSearchParams` list was proposed in #45123 (forward signed deeplink attribution) and not merged. A change that brings either back reopens that decision.

The interstitial is the security boundary, and a change that would show it less often needs documented approval from the Extension Security team, as the deep-link interstitial rule in [`AGENTS.md`](../AGENTS.md) states.

## Reviewing a change

Ask these of any change to `shared/lib/deep-links/`, a new or changed route, or a pull request that says a parameter is signed.

1. **Does the signature still bind the parameter list?** `canonicalize` adds `sig_params` to the signed string, which is what makes the list tamper-evident: rewrite the list and the signature fails. A change to canonicalization has to keep that property.
2. **Is "canonical" being read as "validated"?** Canonical means the parameters a valid signature covers. Whether they are covered is the verification status, and the handler never sees it: it runs before `verify()`, on every status. On an unsigned or invalid link the author writes `sig_params` too, so canonical is whatever they chose to list, and without `sig_params` it is the whole query minus `sig`. "The handler receives canonical parameters only" bounds nothing unless the link is `valid`.
3. **Does anything give a handler, a title or a destination more than the canonical parameters?** Every handler is called with `canonicalUrl.searchParams`. Look for reads that go around it: `url.searchParams`, `window.location`, a value passed past `parse`, or a route's `getTitle`, which the interstitial page calls with the link's original parameters.
4. **Does the route forward attribution, and from where?** A route that writes `utm_*`, `source` or `attributionId` into its destination forwards whatever its handler received, which on an unsigned link is unsigned. There is no per-route list that declares such parameters, so the check is the handler's own forwarding.
5. **Where does a value go after the parser hands it off?** The parser's guarantees end at the destination. A value written into a hash query and read back later by client code is whatever the hash holds at that moment, which other code can write.
6. **Is the destination a feature, or a page for the link?** A handler maps a link onto a feature that exists without it. A page, component or hook named for the link, or one that behaves differently because a link opened it, makes the feature depend on its entry point. Such pages are also where link-reached assumptions tend to sit, such as an action started on mount, so read them under questions 3 and 5 as well.

## Where a valid signature covers less than it appears to

`valid` answers one question: does `sig` match the canonical string. Check these on any change here.

- **An empty `sig_params`** makes the canonical string the signing origin and path followed by `?sig_params=`, and nothing else. The handler then receives no parameters. Everything else in the URL is outside the signature, which still verifies, and reaches only code that reads the original URL, such as the analytics event.
- **Repeated parameters.** `canonicalize` reads `sig_params` with `.get()`, which takes the first occurrence, and each named parameter with `.getAll()`, so every value a handler can read is in the canonical string. Code that reads the original URL can pick a different value: the analytics event records the last one.
- **A signature is bound to the signing origin and the path as written**, so it cannot be replayed onto another route. The route lookup lowercases the path; the signature does not. Within a path it constrains only what the canonical string contains.

For each, the question is whether a route in the change consumes a parameter that reaches it this way, not whether the case is exploitable in the abstract.

## Testing

The unit tests do not sign with a real key. [`verify.test.ts`](../shared/lib/deep-links/verify.test.ts) mocks `getKeyData` and stubs `crypto.subtle`, and [`parse.test.ts`](../shared/lib/deep-links/parse.test.ts) mocks `verify`. Real P-256 signing happens in the end-to-end specs under [`test/e2e/tests/deep-link/`](../test/e2e/tests/deep-link/). A route's own tests call its `handler` directly, so they exercise the destination logic and have no power over the signature boundary.

A unit test with a real key is cheap: run it under `@jest-environment node`, generate a P-256 key pair with `crypto.subtle.generateKey`, and replace only `getKeyData` with the generated public key. When writing one:

- **Assert absence, not inequality.** A test that checks a specific value did not arrive still passes when a different unsigned value does. Assert the key is absent.
- **Vary values across cases.** If the accepted case and the rejected cases use the same literal for a parameter, no assertion can tell "correctly stripped" from "never checked".
- **Test the strip and the verification separately.** Break each on its own and note which tests fail. A suite can guard one and not the other, and its totals will not show it.
