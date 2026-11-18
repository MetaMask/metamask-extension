# Braze profile matching via Segment

Extension uses existing MetaMetrics calls for profile matching. Segment `userId`
remains the MetaMetrics ID. Braze uses the primary HD keyring's canonical Profile
Sync ID as `external_id`, matching Mobile. No new events are emitted when the ID
becomes available; it is attached to subsequent eligible calls.

Before enabling the Braze Cloud Mode (Actions) destination, configure its mappings:

| Segment call | Braze action | `external_id` source |
| --- | --- | --- |
| Identify | Update User Profile | `$.context.canonical_profile_id` |
| Track (if needed) | Track Event | `$.properties.canonical_profile_id` |

Require a nonempty canonical ID. Do not fall back to Segment `userId`, map
`profile_id`, or configure alias merges. Allowlist only the events and attributes
needed for the approved use case, exclude `Metrics Opt Out`, and apply any
required marketing consent rules separately from analytics opt-in. Keep Braze
credentials in the destination, not in the extension.

Validate with a shared Extension/Mobile test profile in a test workspace before
rollout. Confirm both clients resolve to one Braze profile, calls without a
canonical ID are skipped, and data deletion resolves the intended profile.
This routing does not provide SDK sessions or native Banners.