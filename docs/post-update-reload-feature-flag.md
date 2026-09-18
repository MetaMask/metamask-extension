# Automatic post-update reload flag

This is intended to be a temporary test to evaluate the production behavior of
the automatic post-update reload mechanism. It is not possible to reliably test
the full update path deterministically in chromium-based browsers. Sometimes,
the first launch of the extension after an update results in a broken extension.
Chromium is broken in a few ways:

1. the service-worker starts, with `chrome.runtime.*` does not exist. We can't
   fix this one. The service-worker will _not_ be running in this case.
2. the service-worker starts, but when the service-worker attempts to load the
   files necessary to start the background process, they return 404 not found. We
   _might_ be able to fix this by detecting and performing a
   `chrome.runtime.reload()` call.
3. the service-worker starts, the background starts, the UI starts, but the UI
   and background cannot communicate. We attempt to fix this by calling `reload`
   after _every_ update.
4. the service-worker starts, the background starts, the UI starts, the UI
   and background CAN communicate. But the fix for #3 kicks in, and when the
   service-worker starts up again, the background and UI can NOT communicate.

In my extensive testing (well over 10,000 automated tests with real chrome,
across about 10 versions of chrome), #4 occurs most often. However, the tests I ran were under artificial conditions, and
sometimes the failure rate of a test run could be as low as 5%, and sometimes
it might be as high as 50%! I couldn't find a reason explaining why.

Failure #3 occurs rarely, especially on chrome >= 152.

So, in local testing, while `reload` could still potential fix some instances of failure #3, it
is often cause failure #4, I recommend we disable the automatic post-update
reload. Because the failure rates varied so wildly, I am not confident this is
the best decision. For that reason, i'd like to test this with a feature flag.

If we see a reduction in "background connection unresponsive" errors, and
related errors. We should _remove_ the post-update `reload` from the codebase in
a future release.

The flag I propose is `extensionAutomaticReloadAfterUpdate`. `extensionAutomaticReloadAfterUpdate`
is a boolean remote feature flag controlling the extra automatic safe reload
requested after an extension update on Chromium.

- Missing, `true`, or malformed values retain the existing reload behavior.
- Only boolean `false` disables that reload.
- Firefox never requests this reload, regardless of the flag.
- Update timestamps, previous-version bookkeeping, and clearing the pending
  extension version are unchanged. Manual restart/recovery and other safe-reload
  callers are unaffected.

## Other Considerations

I initially set out to solve a different problem: side panel behavior after
updates. if it were opened before the service worker did its post-update `reload`,
the side panel would immediately close.

I tried to fix this in this PR https://github.com/MetaMask/metamask-extension/pull/45737

Then I tried to actually test this and that is when I discovered that the post
update reload is probably not necessary.

The solution in the PR gets convoluted quickly, because there are so many
possible race conditions between the side panel and the post-update reload.

Another potential solution to the problem I initially set out to solve is to
just disable our side panel and toolbar button until the extension is ready. But
this turns out to be a terrible idea, as currently, when failure #2 occurs, the
user is able to self-rescue by click `Reload` from our error screen. If we got
rid of the toolbar button, this would no longer be possible.

## Rollout

Configure the flag in the production client-config service with a default of
`true`, then assign `false` to the intended rollout cohort.

The handler reads resolved, cached RemoteFeatureFlagController state after
background initialization. It does not wait for a network refresh. A client
without a cached value retains the reload, and a stale cached value can continue
to apply until refreshed. Publish the flag before the update under observation
and allow clients to fetch it; changing the remote value is not an instantaneous
switch for clients already updating or offline. The flag only affects releases
that include this check.

This flag does not address failures that occur before background initialization
or before the update handler runs. Disabling it is not proof those failures are
fixed.
