# Deep links: signature verification and review

A deep link is attacker-supplied input that arrives looking like navigation. Its signature makes some of that input trustworthy, and reviewing a deep-link change always comes down to which part. This document describes how `shared/lib/deep-links/` decides that, and what to check when a change touches it.

## How a link is processed

`parse()` in [`shared/lib/deep-links/parse.ts`](../shared/lib/deep-links/parse.ts) applies three steps, in this order:

1. **`canonicalize(url)`** ([`canonicalize.ts`](../shared/lib/deep-links/canonicalize.ts)) builds the string the signature covers. It replaces an alternate deep-link host with the canonical signing origin. When `sig_params` is present, it keeps every value of each parameter that list names, adds `sig_params` itself, and sorts them. When `sig_params` is absent, it keeps every parameter except `sig`, for backward compatibility.
2. **The route handler receives the canonical parameters, with `sig_params` removed.** This happens before verification and whatever the signature turns out to be, so the handler of an unsigned or invalid link still runs and still computes a destination.
3. **`verify(url)`** ([`verify.ts`](../shared/lib/deep-links/verify.ts)) checks `sig` against the canonical string with the deep-link public key and returns `valid`, `invalid` or `missing`. The status decides which interstitial the user sees. It does not change what the handler received.

Attribution for the deep-link analytics event is computed separately, from the original URL, in [`metrics.ts`](../shared/lib/deep-links/metrics.ts).

Two mechanisms that older pull requests refer to no longer exist. The per-route `handlerSearchParams: 'original'` opt-in was removed by #45103 (Prevent unsigned parameter forwarding to route handlers). The per-route `signatureRequiredSearchParams` list was proposed in #45123 (forward signed deeplink attribution) and not merged. A change that brings either back reopens that decision.

## Reviewing a change

Ask these of any change to `shared/lib/deep-links/`, a new or changed route, or a pull request that says a parameter is signed.

1. **Does the signature still bind the parameter list?** `canonicalize` adds `sig_params` to the signed string, which is what makes the list tamper-evident: rewrite the list and the signature fails. A change to canonicalization has to keep that property.
2. **Is "canonical" being read as "validated"?** Canonical means "the parameters the signature covers" only when `sig_params` is present. Without it, canonical is the whole supplied query minus `sig`, so "the handler receives canonical parameters only" bounds nothing on such a link.
3. **Does anything give a handler or destination more than the canonical parameters?** Every handler is called with `canonicalUrl.searchParams`. Look for reads that go around it: `url.searchParams`, `window.location`, or a value passed past `parse`.
4. **Does the route forward attribution, and from where?** A route that writes `utm_*`, `source` or `attributionId` into its destination forwards whatever its handler received, which on an unsigned link is unsigned. There is no per-route list that declares such parameters, so the check is the handler's own forwarding.
5. **Where does a value go after the parser hands it off?** The parser's guarantees end at the destination. A value written into a hash query and read back later by client code is whatever the hash holds at that moment, which other code can write.
6. **Is the destination a feature, or a page for the link?** A handler maps a link onto a feature that exists without it. A page, component or hook named for the link, or one that behaves differently because a link opened it, makes the feature depend on its entry point. Such pages are also where link-reached assumptions tend to sit, such as an action started on mount, so read them under questions 3 and 5 as well.

## Where a valid signature covers less than it appears to

`valid` answers one question: does `sig` match the canonical string. Check these on any change here.

- **An empty `sig_params`** makes the canonical string the signing origin and path followed by `?sig_params=`, and nothing else. Everything else in the URL is outside it, and the signature still verifies.
- **Repeated parameters.** `canonicalize` reads `sig_params` with `.get()`, which takes the first occurrence, and each named parameter with `.getAll()`. A handler or destination that reads a parameter differently from how `canonicalize` selected it can act on a value the signature does not cover.
- **A signature is bound to a path**, so it cannot be replayed onto another route. Within a path it constrains only what the canonical string contains.

For each, the question is whether a route in the change consumes a parameter that reaches it this way, not whether the case is exploitable in the abstract.

## Testing

The unit tests do not sign with a real key. [`verify.test.ts`](../shared/lib/deep-links/verify.test.ts) mocks `getKeyData` and stubs `crypto.subtle`, and [`parse.test.ts`](../shared/lib/deep-links/parse.test.ts) mocks `verify`. Real P-256 signing happens in the end-to-end specs under [`test/e2e/tests/deep-link/`](../test/e2e/tests/deep-link/). A route's own tests call its `handler` directly, so they exercise the destination logic and have no power over the signature boundary.

A unit test with a real key is cheap: run it under `@jest-environment node`, generate a P-256 key pair with `crypto.subtle.generateKey`, and replace only `getKeyData` with the generated public key. When writing one:

- **Assert absence, not inequality.** A test that checks a specific value did not arrive still passes when a different unsigned value does. Assert the key is absent.
- **Vary values across cases.** If the accepted case and the rejected cases use the same literal for a parameter, no assertion can tell "correctly stripped" from "never checked".
- **Test the strip and the verification separately.** Break each on its own and note which tests fail. A suite can guard one and not the other, and its totals will not show it.
