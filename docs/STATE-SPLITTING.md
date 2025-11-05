# ADR: Per-Key State Splitting for Persistent Storage

## Status

Proposed (Draft) — seeking feedback.

## Context

The MetaMask extension currently persists global state in the browser extension `storage.local` area under two top-level keys:

- `data` — a very large JSON object containing dozens of controller subtrees.
- `meta` — metadata (versioning, migrations).

The `data` object has grown so large (100MB+ serialized in extreme cases) that:

- Frequent writes (debounced to ~1s) can exceed the write duration, causing write pile-ups and lock contention (`navigator.locks` queue) in `PersistenceManager.set`.
- We re-write the entire blob even when only one controller subtree has changed (~99% of updates affect a single top-level key).
- Storage operation latency risks UI responsiveness and can increase error rates in private browsing contexts where storage performance characteristics differ.

This impedes scalability, makes incremental evolution risky, and wastes bandwidth and CPU (serialization + hashing + copying) on every state mutation.

## Problem Statement

We need a strategy to:

1. Persist changes for only the top-level controller states that have actually mutated.
2. Avoid reading and writing the giant monolithic `data` JSON when not required.
3. Maintain backwards compatibility during migration and allow safe rollback.
4. Preserve atomicity/consistency properties needed by features like recovery vault backups.
5. Provide a foundation for future optimizations (e.g., compression, per-key TTLs, streaming migrations).

## Goals

- Reduce average write size and duration dramatically (target: O(changed subtree) vs O(full state)).
- Preserve current public APIs to controllers initially (no immediate refactor of `this.update`).
- Enable phased migration with parallel (dual) write strategy and observability.
- Keep data integrity: no partial writes leading to mixed-version subtrees post-migration.
- Provide deterministic hashing for change detection to skip redundant serialization/writes.
- Support eventual concurrency improvements (e.g., parallel per-key writes) without breaking locks semantics.

## Non-Goals

- Changing controller internal update semantics right now.
- Introducing a new storage backend (e.g., IndexedDB/IDB KV) for primary state (backup DB remains separate).
- Field-level diffs or structural change tracking below top-level controller keys.
- Eliminating `meta` (it remains a single object for versioning + migration status).

## Proposed Decision

There are two primary strategies for detecting and persisting changed state: hash-based diffing and an event-driven approach. The event-driven approach is preferred for its efficiency and directness.

### 1. Event-Driven State Updates (Preferred)

MetaMask controllers are built upon `ObservableStore`, which emits a `stateChange` event whenever a controller's state is updated. We can leverage this event to trigger writes only for the controller that changed.

The `ComposableObservableStore` that aggregates all controllers can be configured to listen for state changes and determine if the change affects persisted state by inspecting the controller's metadata. When a change to a persisted property is detected, it emits a `stateChange` event that includes the controller key and the new state subtree.

In `background.js`, we can listen for this event:

```javascript
controller.store.on('stateChange', ({ controllerKey, newState }) => {
  // This is a simplified representation.
  // The actual implementation would write the `newState`
  // to `storage.local` under the `controllerKey`.
  persistChange(controllerKey, newState);
});
```

#### Pros

- **Efficient**: Avoids the need to serialize and hash every controller's state on every potential update. The check is performed against controller metadata, which is much faster.
- **Direct**: The event is fired by the source of the state change, providing a direct signal of what needs to be persisted.
- **Simplified Logic**: Removes the complexity of managing hash caches in the `PersistenceManager`.

#### Cons & Challenges

- **Event Granularity**: A current challenge is that the `stateChange` event can be emitted for changes to _any_ state within a controller, including in-memory state that is not meant to be persisted. However, the `newState` and `oldState` provided in the event payload are correctly filtered to only include persisted state. This can lead to unnecessary write operations if not handled correctly.
- **Potential Solutions**:
  1.  **Refine Controller Events**: Modify `ComposableObservableStore` or the base controller classes to emit a more specific `persistedStateChange` event. This would provide a clear signal that only persisted state has changed.
  2.  **Pre-Write Comparison**: Before writing, the `PersistenceManager` could perform a quick deep equality check between the incoming `newState` and the last known persisted state for that key. This would prevent writes if the persisted portion of the state hasn't actually changed.

### 2. Hash-Based Diffing

This strategy involves splitting `data` so each top-level controller subtree is stored independently at the root of `storage.local` using stable key names. An in-memory cache of content hashes is used to detect changes.

### New Storage Layout

```
storage.local/
├── meta                       -> { version, ... }
├── <controllerKeyA>           -> <JSON subtree>
├── <controllerKeyB>           -> <JSON subtree>
...
```

Where `<controllerKey>` are the existing top-level keys currently nested under `data` (e.g., `AppStateController`, `KeyringController`, etc.).

### Write Path (Hash-Based Diffing)

1. Receive full `state` (legacy shape) in `PersistenceManager.set(state)`.
2. For each top-level key K in `state`:
   - Serialize subtree: `json = JSON.stringify(state[K])`.
   - Compute hash: `hash = stableHash(json)`.
   - Compare with cached prior hash. If unchanged, skip storing K.
   - If changed, stage write: `{ K: state[K] }` and update the in-memory hash.
3. Atomically write all staged keys.
4. The legacy `data` blob will no longer be written to avoid excessive storage consumption. Rollback will be handled by disabling the feature flag.

### Read Path (Phase 1 - Virtual Data Mode)

- Attempt new layout read:
  - Reconstruct a synthetic `data` object via `await local.get(allControllerKeys)`.
- If the new layout is not present (e.g., first time after update), fall back to reading the legacy `data` key, perform a one-time migration to the per-key format, and then remove the `data` blob.

### Migration Trigger

Use a feature flag (remote config or build flag) `ENABLE_STATE_SPLITTING`. When enabled:

- Per-key writes are active, and reads are synthesized from individual keys.
- The legacy `data` blob is read once for migration and then deleted.
  When stable:
- The feature flag can be removed.

## Hashing Strategy

Requirements: deterministic, fast, stable across platforms, low collision probability.
Options:

- SHA-256 (Web Crypto): strong, async, slight overhead for large payloads.
- MurmurHash / xxHash: fast, but requires bundling an implementation.
  Decision: Start with SHA-256 via `crypto.subtle.digest('SHA-256', encoder.encode(json))`. Cache results per key; cost is dominated by serialization which is unavoidable for changed subtrees.

Represent hash as base64url or hex. Include size (byte length of UTF-8 encoded JSON) for diagnostics and capacity tracking.

Potential future optimization: basic compression of very large individual keys.

## Diff Algorithm (Hash-Based)

We treat each top-level key independently. The minimal diff is the set of keys whose `hash` changed. No field-level diffing.

Pseudo-code:

```ts
// In PersistenceManager
const changedSubstates = {};

for (const key of Object.keys(newState)) {
  const newSubstate = newState[key];
  const oldHash = this.hashCache[key];
  const newHash = await sha256(JSON.stringify(newSubstate));

  if (newHash !== oldHash) {
    changedSubstates[key] = newSubstate;
    this.hashCache[key] = newHash;
  }
}

if (Object.keys(changedSubstates).length > 0) {
  await browser.storage.local.set(changedSubstates);
  // Optionally also write legacy data for rollback
}
```

## Caching

In-memory cache held by `PersistenceManager` mapping key -> hash. Reset on `reset()`.
The cache is populated on startup by reading and hashing all controller substates.

## Consistency & Atomicity

- All split writes occur under a single `navigator.locks` exclusive lock; no observable intermediate state.
- Changed subtrees are written in a single multi-key `local.set` call (treated as atomic by the browser).
- The legacy `data` key remains the ultimate source of truth until it is decommissioned.

## Rollback Plan

1.  If a critical bug is discovered, the `ENABLE_STATE_SPLITTING` feature flag will be disabled.
2.  Disabling the flag will prevent any _new_ users from seeing the opt-in prompt and migrating to the per-key storage system.
3.  **Users who have already opted in will remain on the per-key system.** Their experience will not change. The system will not automatically migrate them back to the legacy `data` blob, as this would be complex and could risk data loss.
4.  A fix will be deployed, and once stable, the feature flag can be re-enabled to allow new users to opt in again.

## Performance Expectations

- **Event-Driven**: Negligible overhead. The primary cost is the write itself, which is already necessary.
- **Hash-Based Diffing**: Serialization is reduced from the entire 100MB+ JSON to typically a few KB–MB per changed subtree. Hashing cost is proportional to the changed subtree size. Net write latency is expected to drop drastically compared to the monolithic approach.
- Lock hold time narrows, reducing the backlog of pending writes.

## Observability

Add metrics/logging:

- `state_split.write.method` ('event' or 'hash')
- `state_split.write.bytes_changed`, `state_split.write.keys_changed_count`.
- Timing: serialize+hash per key (for hash-based), total write time.
- Error counters for any write failures.

## Edge Cases

- Extremely large single key remains a potential future chunking candidate in a separate ADR.
- Concurrent rapid updates to the same key: last write wins under the lock; this behavior is unchanged.
- Feature flag toggling mid-session: caches should be invalidated; rebuild from storage on the next write/read.

## Security & Integrity

- The atomicity of `storage.local.set` for multiple keys is relied upon to prevent partial state writes.
- The legacy `data` blob serves as a consistent backup during the migration period.

## Future Extensions (Simplified)

- Optional compression for very large single keys (e.g., gzip threshold-based).
- Background write prioritization for critical keys (e.g., `KeyringController`).

## Implementation Phases

1. **Instrumentation (Phase 0)**: Measure current write sizes & timings.
2. **Virtual Data Implementation (Phase 1)**: Implement the event-driven write path behind a feature flag. On first run, migrate the legacy `data` blob to per-key storage and then delete it.
3. **Stabilization (Phase 2)**: Monitor the event-driven system in production. Confirm stability and performance gains.
4. **Legacy Code Removal (Phase 3)**: Remove the feature flag and the legacy read/write path after a safe migration window (e.g., 2-3 release cycles).
5. **Optimization (Phase 4)**: If needed, implement solutions for the "Event Granularity" issue mentioned above. Add compression or other enhancements as required.

## Migration Steps

1. Extend `PersistenceManager` to handle per-key writes, gated by a feature flag.
2. Update `background.js` to listen to `controller.store.on('stateChange', ...)` and call the new `PersistenceManager` method.
3. Add read reconstruction logic to synthesize the full `data` object for parts of the app that still expect it.
4. Add metrics logging.
5. Ship behind a disabled flag; enable for internal builds -> beta -> production.
6. Monitor error/latency; proceed through the phases.
7. Remove the legacy path.

## Alternatives Considered

- **IndexedDB per-controller store**: More overhead & complexity; `storage.local` is sufficient and more reliable in private browsing contexts where IndexedDB can be restricted.
- **Chunking monolithic `data`**: Complexity in mapping keys to chunks; less semantic clarity.
- **Delta patches (JSON Patch)**: Patch generation cost and application complexity outweigh the benefits for the frequency of our large object mutations.

## Risks

- **Event Logic Bugs**: A bug in the event-handling logic could cause writes to be missed. This is the primary risk of not having a full `data` blob to fall back on. Robust testing is critical.
- **Increased number of keys** may slightly slow a full cold-start read if we need to reconstruct the full state object from many keys; this is an acceptable trade-off.
- **Feature flag misconfiguration**: Ensure the safe default is to use the legacy path.

## Open Questions

- Do we need per-key versioning beyond the global `meta.version`? (Probably not initially.)
- How to handle keys being removed from the state? (The `stateChange` event should provide the full new substate, which would implicitly handle removals of nested data. Top-level key removals would need to be detected by comparing the new state keys with the old.)

## Testing Strategy

- **Unit tests**: Logic for handling `stateChange` events, reconstruction of the full state object.
- **Integration tests**: Dual write path, feature flag toggle, and rollback safety.
- **Load tests**: Simulate rapid updates to a single key and measure performance and lock duration.
- **Fuzz tests**: Random controller subtree mutations to verify correctness.

## Summary

Splitting the monolithic `data` blob into per-controller keys, with updates triggered by `stateChange` events, will drastically reduce write amplification and latency. This approach is more efficient than hash-based diffing and retains safety through a phased rollout with a reliable rollback path. This ADR defines the architecture, migration plan, and rationale to proceed with the event-driven model.

## Implementation Note: Serialization Choice

Initial implementation will use native `JSON.stringify` on only the changed top-level controller subtree(s) passed in the `stateChange` event. Rationale:

- Native `JSON.stringify` is highly optimized; for typical changed subtrees its cost is negligible.
- The event-driven model avoids the serialization and hashing cost for unchanged controllers entirely.
- Deferring complexity keeps the migration scope contained.

## External Contract (Stable API)

All callers outside the persistence layer (e.g., `loadStateFromPersistence`, migrations, controller initialization, UI) continue to interact with storage via a single shape: `{ data, meta }`.

Reads: `PersistenceManager.get()` returns `{ data: AggregateState, meta }` even in split mode (the aggregate state is synthesized from per-key entries).

Writes: `PersistenceManager.set(fullState)` will still be used for the initial, full-state write. However, incremental updates will be handled by a new method, e.g., `PersistenceManager.setSubstate(key, substate)`, which is called from the `stateChange` event handler.

This guarantees minimal refactoring of existing code and reduces rollout risk.

## Storage Strategies Compared

| Strategy               | Description                                                                     | Pros                                                           | Cons                                                                            |
| ---------------------- | ------------------------------------------------------------------------------- | -------------------------------------------------------------- | ------------------------------------------------------------------------------- |
| **Event-Driven**       | Listen for `stateChange` events and write only the affected controller's state. | Most efficient, direct signal, simple logic.                   | Event may fire for non-persisted changes, requiring filtering.                  |
| **Hash-Based Diffing** | On every state update, hash all controller substates to find what changed.      | Reliable and doesn't depend on event emitters.                 | High overhead: serializes and hashes every controller state on every update.    |
| **Virtual Data**       | Store only per-key entries; synthesize `data` on read.                          | Eliminates large `data` rewrites, reduced write amplification. | Slightly more complex read path; need robust reconstruction & integrity checks. |

## Chosen Rollout Path

Phase 1: Implement the **Event-Driven** approach behind a feature flag `ENABLE_STATE_SPLITTING`. This will follow a "Virtual Data" model where the monolithic `data` blob is no longer written. The dual-write approach was rejected as it would consume too much storage for users with large states. On first activation, the existing `data` blob will be migrated to per-key storage and then deleted.

Phase 2: Once stability is confirmed, the feature flag and legacy code paths can be removed. The ability to roll back will be handled by re-enabling the legacy write path if the flag is disabled.

## Forced Full Write Conditions

We perform a forced full rewrite of all keys when:

- Transitioning from legacy to split mode for the first time.
- A data migration occurs (i.e., `meta.version` increases).
- A backup is restored.

## Key Deletion & Rename Handling

- **Deletion**: If a controller key is removed from the root of the state, this needs to be detected. After a migration, the `PersistenceManager` can compare the keys in the new state with a list of previously known keys and remove any that are no longer present.
- **Rename**: A migration should output only the new key. The old key should be treated as a deletion.

## Backup Restore Behavior

During a restore, only a subset of controllers are present. Migrations fill in missing defaults, then a forced full write persists all keys, so subsequent event-driven writes operate normally.

## Metrics & Observability Additions

Initialization:

- `state_split.init.full_write_bytes`
- `state_split.init.keys_count`
- `state_split.init.duration_ms`

Steady State Writes:

- `state_split.write.method` ('event' | 'hash')
- `state_split.write.keys_changed_count`
- `state_split.write.bytes_changed`
- `state_split.write.duration_ms`

Reads:

- `state_split.read.mode` (legacy | dual | virtual)
- `state_split.read.reconstruct_duration_ms`

## Corruption & Startup Failure Recovery

This section addresses how to recover if the migration to per-key storage leads to a state where MetaMask can no longer start or function correctly.

If, after a user has migrated, a per-key read fails or the application enters an unrecoverable startup loop:

1.  **No Automatic Fallback**: The system will not have a legacy `data` blob to fall back on. An automatic repair is not feasible in a startup failure scenario.
2.  **Manual Recovery via Backup**: The primary recovery mechanism is the **local backup file** the user was required to create immediately before the migration. The user will need to:
    - Reinstall the MetaMask extension.
    - On the first-time user screen, choose the "Import an existing wallet" option.
    - Instead of entering a Secret Recovery Phrase, they will need to use the option to restore from a backup file and select the file they saved.
3.  **Last Resort Recovery**: If the backup file is lost or also corrupted, the user's only remaining option is to restore their wallet from their Secret Recovery Phrase. This will recover their accounts and balances but will not restore transaction history or other settings.
4.  **Diagnostics**: It is critical that the application makes every effort to capture and send a Sentry event _before_ it fails completely, providing developers with diagnostics to understand the cause of the failure.

## Rollback Procedure (Virtual → Legacy)

1. Synthesize an aggregated `data` object from all per-key entries.
2. Perform an atomic write of the full `{ data, meta }`.
3. Disable the feature flag; the persistence layer will stop event-driven writes and resume legacy behavior. The per-key entries can be removed by a later cleanup task.

## Testing Additions

- Dual vs. virtual mode cold start performance.
- Forced full write after a version bump.
- Key deletion and rename migrations.
- Backup restore in split mode.
- Corruption injection (e.g., remove a key) and test the recovery/error-reporting path.
- Rollback path that correctly reintroduces the legacy `data` blob.

## Developer Migration Checklist

- If renaming a controller state key, ensure the migration code copies the value and the persistence layer handles the deletion of the old key.
- Avoid partial writes in migrations; let the forced full write handle persistence.
- Be mindful of large key sizes; consider a future compression ADR if any single controller state exceeds 5MB regularly.

## Summary (Addendum)

External consumers remain oblivious to the splitting; they still receive `{ data, meta }`. Internal per-key writes, triggered by events, reduce write amplification while retaining an easy rollback path and clear integrity mechanisms.
`

## Hashing Strategy

Requirements: deterministic, fast, stable across platforms, low collision probability.
Options:

- SHA-256 (Web Crypto): strong, async, slight overhead for large payloads.
- MurmurHash / xxHash: fast, but requires bundling an implementation.
  Decision: Start with SHA-256 via `crypto.subtle.digest('SHA-256', encoder.encode(json))`. Cache results per key; cost is dominated by serialization which is unavoidable for changed subtrees.

Represent hash as base64url or hex. Include size (byte length of UTF-8 encoded JSON) for diagnostics and capacity tracking.

Potential future optimization: basic compression of very large individual keys.

## Diff Algorithm

We treat each top-level key independently. The minimal diff is the set of keys whose `hash` changed. No field-level diffing.

Pseudo-code:

```ts
for (const key of Object.keys(state)) {
  const value = state[key];
  const json = JSON.stringify(value);
  const hash = await sha256(json);
  if (hash !== cache[key]?.hash) {
    pending[key] = value;
    newManifest.keys[key] = { hash, size: json.length };
  } else {
    newManifest.keys[key] = cache[key]; // unchanged metadata
  }
}
if (Object.keys(pending).length) {
  await browser.storage.local.set({ ...pending, manifest: newManifest, meta });
  // optionally also write legacy data: await browser.storage.local.set({ data: state, meta });
}
```

## Caching

In-memory cache held by `PersistenceManager` mapping key -> { hash, size }. Reset on `reset()`.
Persistent authoritative cache of hashes lives in `meta.stateHashes`. `manifest.keys` supplies sizes. Startup flow:

1. Read `meta.stateHashes` -> seed hash cache.
2. Read `manifest` -> hydrate sizes.
3. Only hash keys when integrity check fails or missing from storage.

## Consistency & Atomicity

- All splits are written under a single `navigator.locks` exclusive lock; no observable intermediate state.
- Changed subtrees, updated `meta.stateHashes`, and `manifest` are written in a single multi-key `local.set` call (treated as atomic).
- Readers prefer `meta.stateHashes`; `manifest` augments with size/fullHash. Legacy `data` remains a fallback until decommission.

## Rollback Plan

1. Keep writing `data` during dual-write phase.
2. If critical bug surfaces, disable flag: read legacy `data`, ignore `meta.stateHashes` / `manifest`, skip split writes.
3. Cleanup orphaned per-key entries only after a stabilization window (e.g., 2 release cycles) via a maintenance task comparing `meta.stateHashes` + `manifest.keys` to actual stored keys.

## Performance Expectations

- Serialization reduced from entire 100MB JSON to typical changed subtree (e.g., a few KB–MB).
- Hashing cost proportional to changed subtree size (SHA-256 ~> 1–2 GB/s in modern environments; 1MB payload hashes in ~1–2ms). Net write latency expected to drop drastically.
- Lock hold time narrows; reduces backlog of pending writes.

## Observability

Add metrics/logging:

- `state_split.write.bytes_before`, `state_split.write.bytes_changed`, `state_split.write.keys_changed_count`.
- Timing: serialize+hash per key, total write time.
- Error counters for manifest validation mismatches.

## Edge Cases

- Extremely large single key (very large size threshold) remains a potential future chunking candidate in a separate ADR.
- Concurrent rapid updates to the same key: last write wins under lock; unchanged behavior.
- Feature flag toggling mid-session: cache invalidation; rebuild from storage on next write/read.
- Legacy `data` mutated externally (unlikely): treat as divergent; prefer manifest path if valid.

## Security & Integrity

- Hash prevents accidental stale cache usage. Manifest signing for stronger tamper resistance could be evaluated separately if needed.

## Future Extensions (Simplified)

- Optional compression for very large single keys (e.g., gzip threshold-based).
- Controller-level subscription optimization (directly flag key as dirty without re-hash first) – minor enhancement.
- Background write prioritization for critical keys (e.g., `KeyringController`).

## Implementation Phases

1. Instrumentation (Phase 0): measure current write sizes & timings.
2. Dual Write (Phase 1): implement splitting behind flag; keep legacy writes.
3. Dual Read (Phase 2): prefer split layout; fallback to legacy.
4. Legacy Decommission (Phase 3): stop writing `data`; remove fallback after migration window.
5. Optimization (Phase 4): add compression/integrity enhancements.

## Migration Steps

1. Add manifest schema & helper functions.
2. Extend `PersistenceManager` with per-key hashing & diff; gated by flag.
3. Add read reconstruction logic.
4. Add metrics logging.
5. Ship behind disabled flag; enable for internal builds -> beta -> production.
6. Monitor error/latency; proceed to Phases.
7. Remove legacy path.

## Alternatives Considered

- IndexedDB per-controller store: more overhead & complexity; current API suffices.
- Staying on `storage.local` vs migrating fully to IndexedDB for primary state: we intentionally retain `storage.local` because Firefox does not reliably support IndexedDB mutations in certain private browsing contexts (indexedDB may throw `InvalidStateError` prohibiting writes). Relying exclusively on IndexedDB would degrade reliability for users in those modes, while `storage.local` remains broadly available. We limit IndexedDB usage to the existing backup vault where absence can be tolerated.
- Chunking monolithic `data` into fixed-size segments: complexity in mapping keys to chunks; less semantic clarity.
- Delta patches (JSON Patch): patch generation cost + complexity outweigh benefit for large object mutations frequency.
- CRDT or event sourcing: heavy architectural shift unnecessary for current bottleneck.

## Risks

- Manifest corruption could make state appear empty (mitigated by legacy fallback until removal stage).
- Increased number of keys may slightly slow full cold-start read (multiple key fetch); acceptable trade-off vs huge single decode.
- Hash cost for very large single-key changes; still far less than re-serializing entire state for every minor update.
- Feature flag misconfiguration; ensure safe default to legacy path.

## Open Questions

- Do we need per-key versioning beyond global `meta.version`? (Probably not initially.)
- Should we opportunistically skip serialization by shallow compare heuristics? (Potential; deferred.)
- How to handle keys removed from state? (On write: detect missing vs manifest; delete key + remove manifest entry.)

## Testing Strategy

- Unit tests: hashing diff logic, manifest build, reconstruction, deletion handling.
- Integration tests: dual write path, migration toggle, rollback safety.
- Load tests: simulate rapid updates to a single key & measure lock duration improvements.
- Fuzz: random controller subtree mutations verifying correctness & manifest integrity.

## Summary

Splitting the monolithic `data` blob into per-controller keys with a manifest and hash-based diffing drastically reduces write amplification and latency while preserving safety through a phased rollout. This ADR defines the architecture, migration plan, and rationale to proceed.

## Implementation Note: Serialization Choice

Initial implementation will use native `JSON.stringify` on only the changed top-level controller subtree(s) rather than any custom streaming or tree-based hashing algorithm. Rationale:

- Native `JSON.stringify` is highly optimized; for typical changed subtrees (orders of magnitude smaller than the former 100MB monolith) its cost is negligible compared to the previous full-blob rewrite.
- A custom walker introduces correctness risks (escaping, ordering, numeric edge cases) and maintenance overhead without demonstrated performance need.
- Hashing time (SHA-256) for these smaller payloads is dominated by serialization cost; reducing serialization further yields diminishing returns until a subtree regularly exceeds multi-megabyte thresholds.
- Deferring complexity keeps migration scope contained; we can revisit only if metrics show repeated large (> threshold) subtree rewrites.

Metrics to guide any future revisit:

1. Median / P95 serialize + hash time per key.
2. Distribution of changed subtree sizes (bytes).
3. Frequency of > 2MB single-key writes.

Trigger for reevaluation: sustained P95 per-key write latency > target threshold (e.g., 25ms) or frequent large (>5MB) single-key diffs.

Deferred possible optimization: compression of very large individual keys.

## External Contract (Stable API)

All callers outside the persistence layer (e.g., `loadStateFromPersistence`, migrations, controller initialization, UI) continue to interact with storage via a single shape: `{ data, meta }`.

Reads: `PersistenceManager.get()` returns `{ data: AggregateState, meta }` even in split mode (aggregate synthesized from per-key entries when not dual-writing).

Writes: `PersistenceManager.set(fullState)` still accepts the full aggregated state. Internally we diff and store per-key changes while optionally updating the legacy `data` blob during a dual-write phase.

This guarantees zero refactors to existing migration code and minimizes rollout risk.

## Storage Strategies Compared

| Strategy     | Description                                              | Pros                                                          | Cons                                                                           |
| ------------ | -------------------------------------------------------- | ------------------------------------------------------------- | ------------------------------------------------------------------------------ |
| Dual Storage | Store per-key entries + continue writing full `data` key | Simplest rollback, minimal read changes                       | Continued full serialization during any change (still big), higher total bytes |
| Virtual Data | Store only per-key entries; synthesize `data` on read    | Eliminates large `data` rewrites, reduced write amplification | Slightly more complex read path; need robust reconstruction & integrity checks |

## Chosen Rollout Path

Phase 1: Dual Storage behind feature flag `ENABLE_STATE_SPLITTING` (per-key diff writes + legacy `data` update only when any key changed). Collect metrics.

Phase 2: Switch to Virtual Data once stability confirmed (stop writing `data`, synthesize on read). Maintain ability to re-create `data` for rollback by one forced full write if the flag is disabled.

## Forced Full Write Conditions

We perform a forced full rewrite (ignore diff optimization; recompute hashes for all keys) when:

- Transitioning from legacy to split mode (first enable).
- Migration `meta.version` increases.
- Corruption repair pass triggers.
- Backup restore path executes.

## Key Deletion & Rename Handling

- After migrations produce a new aggregated `data`, compute the set of existing per-key entries (from `meta.stateHashes`).
- Deletion: If a previous key no longer exists in migrated state, remove its storage entry and hash entry.
- Rename: Migration should output only the new key; treat old key as deletion. (Optionally provide an explicit rename map in migrations for clarity.)
- Forced full write phase handles pruning; subsequent incremental writes only manage changed keys.

## Backup Restore Behavior

During a restore, only a subset of controllers (e.g., `KeyringController`, `AppMetadataController`) are present. Migrations fill missing defaults, then a forced full write persists all keys + hashes so subsequent diff writes operate normally.

## Hash Cache Lifecycle

States:

1. `UNINITIALIZED` – before any read/write.
2. `INIT_FORCED_FULL_WRITE` – performing first full write (or migration/restore write); diff optimization disabled.
3. `ACTIVE` – normal per-key diff mode.

Transitions:

- `UNINITIALIZED` → `INIT_FORCED_FULL_WRITE` on first enable or version bump.
- `INIT_FORCED_FULL_WRITE` → `ACTIVE` after successful atomic write.
- Any write error during init keeps state in `INIT_FORCED_FULL_WRITE` for retry.

## Metrics & Observability Additions

Initialization:

- `state_split.init.full_write_bytes`
- `state_split.init.keys_count`
- `state_split.init.duration_ms`
- `state_split.init.deletions_count`
- `state_split.init.forced_full_write` (boolean)

Steady State Writes:

- `state_split.write.keys_changed_count`
- `state_split.write.bytes_changed`
- `state_split.write.duration_ms`
- `state_split.write.skip_count` (unchanged keys skipped)

Reads:

- `state_split.read.mode` (legacy | dual | virtual)
- `state_split.read.reconstruct_duration_ms`
- `state_split.read.repair_triggered` (boolean)

Repairs:

- `state_split.repair.count`
- `state_split.repair.duration_ms`

## Corruption & Repair Handling

If any per-key read required for reconstruction fails or a spot hash validation mismatch occurs:

1. Attempt a repair pass: re-hash all per-key entries, rebuild `meta.stateHashes`, rewrite manifest.
2. If repair fails, fall back to legacy `data` (if present) or initiate backup restore / first-time state.
3. Record repair metrics and capture Sentry event with a masked vault structure snapshot.

## Rollback Procedure (Virtual → Legacy)

1. Synthesize aggregated `data` object from per-key entries.
2. Perform atomic write: `{ data, meta }` (optionally retain per-key entries for quick forward re-enable).
3. Disable feature flag; persistence layer stops diffing and resumes legacy behavior.
4. Later cleanup task may optionally remove per-key entries if disk usage is a concern.

## Testing Additions

- Dual vs virtual mode cold start.
- Forced full write after version bump.
- Key deletion & rename migrations.
- Backup restore in split mode.
- Corruption injection (remove a key, tamper hash) → repair pass.
- Rollback path reintroducing legacy `data`.

## Developer Migration Checklist

- If renaming controller state: update migration code to copy value and drop old key.
- Avoid partial writes in migration; let forced full write handle persistence.
- Validate large key sizes; consider future compression ADR if >5MB sustained.

## Summary (Addendum)

External consumers remain oblivious to splitting; they still receive `{ data, meta }`. Internal per-key diffing and hashing reduce write amplification while retaining an easy rollback path and clear integrity/repair mechanisms.
