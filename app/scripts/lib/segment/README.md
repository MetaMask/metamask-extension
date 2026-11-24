# Segment → Braze Cloud Mode

Segment forwards extension events to Braze through the **Braze Cloud Mode
(Actions)** destination. This document describes the identity the extension
sends and the destination configuration that relies on it. Update it whenever
either side changes.

## Identity

The Segment `userId` is the MetaMetrics analytics ID. It is not Braze's
`external_id`. Braze identifies users by the primary SRP's Profile Sync
canonical profile ID, which is the same ID Mobile and the extension's Braze SDK
use (see [`app/braze/braze.md`](../../../braze/braze.md)).

The extension sends the canonical profile ID as follows:

| Call               | Field                             |
| ------------------ | --------------------------------- |
| `track` and `page` | `properties.canonical_profile_id` |
| `identify`         | `context.canonical_profile_id`    |

`identify` traits are deltas, so `traits.canonical_profile_id` is only present
when the ID changes. Map identify calls from `context`, never from `traits`.

The ID is absent whenever the user is signed out of Profile Sync. That includes
before sign-in and while the wallet is locked, because locking signs out. It is
also absent from anonymous events, which are sent with the shared anonymous ID.

## Destination mappings

- **Track Event**
  - Trigger: `type = "track"`, `properties.canonical_profile_id` exists, and
    `event` is not `Metrics Opt Out`.
  - External user ID: `$.properties.canonical_profile_id`.
  - Event name: `$.event`. Properties: `$.properties`. Batching enabled.
- **Update User Profile**
  - Trigger: `type = "identify"` and `context.canonical_profile_id` exists.
  - External user ID: `$.context.canonical_profile_id`.
  - Custom attributes: `$.traits`.

Leave every other mapping disabled, in particular the defaults that use
`$.userId` as the external ID. Identify User and Create Alias are for alias
merges, which this integration does not use, and page calls are not forwarded.

The existence filters keep events without a Braze identity out of Braze.
`Metrics Opt Out` still carries the canonical profile ID, because it is sent to
Segment to record the decision, so it needs its own exclusion.

## Braze SDK

The Braze SDK runs in the offscreen document (MV3) or background page (MV2). It
only calls `changeUser` with the same external ID, which starts Braze sessions.
It sends no custom events or attributes, so Cloud Mode is the only path for
both. If the SDK starts logging events, do not forward the
same events through Cloud Mode, or Braze will ingest them twice.

## Data deletion

Segment deletion requests identify the user by Segment `userId`, which Braze
does not know. Verify that a deletion reaches the Braze profile keyed by the
canonical profile ID before relying on Segment to delete Braze data.
