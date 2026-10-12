# Segment → Braze Cloud Mode configuration contract

The extension keeps its Segment `userId` as the MetaMetrics analytics ID. In
the Segment dashboard, configure **Braze Cloud Mode (Actions)** to map Braze's
`external_id` to the extension's canonical Profile Sync ID instead of
`$.userId`.

## Required mappings

- **Track Event:** trigger on `type = track`; map `external_id` from
  `$.properties.canonical_profile_id`, event name from `$.event`, properties
  from `$.properties`, and enable batching.
- **Update User Profile:** trigger on `type = identify`; map `external_id` from
  `$.context.canonical_profile_id` and custom attributes from `$.traits`.
- Require `canonical_profile_id` to exist for Track Event and Update User
  Profile mappings. This excludes anonymous and pre-sign-in events that have no
  Braze external ID.
- Explicitly exclude the Metrics Opt Out event. It is sent to Segment to record
  the consent decision, but must not be forwarded to Braze after opt-out.
- Do not enable default mappings that use `$.userId` as Braze's external ID.
  Use Update User Profile for Identify calls; Create Alias / Identify User are
  for alias-merge flows and are not part of this integration.

## Separate UI-SDK responsibility

Cloud Mode events populate Braze profiles and audiences, but cannot trigger
in-app messages. The UI Braze SDK remains responsible for `changeUser`, sessions,
and the Braze-only custom event used to trigger the home feature announcement
after unlock. Do not forward that trigger event through Cloud Mode as well, or it
will be ingested twice.

Keep this document aligned with the destination mappings and filters configured
in Segment. Verify Segment user deletion resolves Braze profiles using the
canonical `external_id` mapping.
