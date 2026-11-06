# Referral deep-link handoff

`MoneyReferralHandoff` resumes a context captured by the background link router
or install-attribution pipeline. It waits for wallet setup/unlock, shows Terms
when owed, and mounts the existing Money invite/activation flow before opening
the original destination.

The background context, not the handoff URL, authorizes continuation past the
existing security interstitial. If context is lost, the original link is parsed
again and returned to the warning page; a supplied URL is never trusted as an
arbitrary continuation. No security-policy exceptions are added.

Context lives only in background memory. Worker restarts can lose it; there is
intentionally no browser-session storage or recovery layer. Taking context is
atomic, and closing the activation modal completes the same flow.

Only `ref` on `link.metamask.io` participates. Codes are trimmed, uppercased,
and rejected unless they contain 3–24 letters/digits. Input sanitization inside
the editable invite field remains separate. Registration happens only on Accept.

Analytics requires the external Segment tracking plan to allow
`Deep Link Used.referral_code` and Money offer `entry_type` values `deeplink`
and `restored_context` (the latter comes from the existing deferred-link cookie).

## Manual testing

Local builds default to the DEV Rewards Money API, but the default OIDC
configuration issues production tokens. That combination returns `401 Invalid
token` for referral me and intentionally skips the invite. For testing with the
default production authentication, set this local `.metamaskrc` override, restart
the build, and reload the unpacked extension:

```ini
REWARDS_MONEY_API_URL=https://rewards-money.api.cx.metamask.io
```

This uses the real production referral service. Opening or dismissing an invite
does not register a referral; pressing Accept does. For DEV/UAT testing instead,
use matching authentication and Rewards Money service environments.

1. Use a wallet/profile that has not accepted an invite. Enable Basic
   Functionality and the version-gated `rewardsMoneyControllerEnabled` flag.
2. Open `https://link.metamask.io/home?ref=VALIDCODE`, substituting a valid
   test referral code. Continue past the existing security warning and unlock
   if needed. Confirm the invite is prefilled and editable.
3. Decline or close the invite. Confirm Home opens and no registration was
   created. Reopening the link starts a new offer.
4. Open a supported non-Home link with a different valid code and product
   parameters. Accept, close the activation modal, and confirm that the
   original product destination/prefills are retained.
5. Repeat with `ref=INVALID-CODE`; no invite appears and ordinary navigation
   remains available. Leaving the security warning without Continue must not
   show the invite on a later unrelated wallet view.
6. For a new installation, open a referral link through the existing website
   deferred-link flow, finish wallet setup, and agree to Terms if required.
   Confirm the invite follows Terms. Disable Basic Functionality during setup
   in a separate run and confirm there is no invite.
7. Check an already-referred profile and a confirmed excluded region: both
   skip the offer. Simulate a failed/slow referral-me read: the flow resumes
   without a prompt after the five-second budget.
