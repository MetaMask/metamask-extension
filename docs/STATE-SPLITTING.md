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

Split `data` so each top-level controller subtree is stored independently at the root of `storage.local` using stable key names. Introduce a manifest index that enumerates participating keys and their content hashes. Persist per-key hashes inside `meta` to eliminate cold-start re-hashing.

### New Storage Layout

```
meta                       -> { version, stateHashes: { <controllerKey>: <hash>, __full?: <hash> }, ... }
manifest                   -> { version: <int>, keys: { <controllerKey>: { hash: <string>, size: <int> } }, fullHash: <string>, createdAt, updatedAt }
<controllerKeyA>           -> <JSON subtree>
<controllerKeyB>           -> <JSON subtree>
...
```

Where `<controllerKey>` are the existing top-level keys currently nested under `data` (e.g., `AppStateController`, `KeyringController`, etc.).

### Write Path (Phase 1+)

1. Receive full `state` (legacy shape) in `PersistenceManager.set(state)`.
2. Extract `meta` as before.
3. For each top-level key K in `state`:
   - Serialize subtree: `json = JSON.stringify(state[K])`.
   - Compute hash: `hash = stableHash(json)` (see Hashing section).
   - Compare with cached prior hash. If unchanged, skip storing K.
   - If changed, stage write: `{ K: state[K] }`.
4. Atomically write staged keys plus updated `manifest` (includes new hashes and sizes). For atomicity we retain the lock; browser.storage.local multi-key set is effectively atomic for our purposes.
5. Maintain legacy `data` during migration (dual write): update `data` only if at least one subtree changed (optional optimization). This allows rollback.
6. Update in-memory cache of hashes and write updated `meta.stateHashes` (only mutated hashes updated).

### Read Path (Phase 1 - Dual Mode)

- Attempt new layout read:
  - Fetch `meta`. If `meta.stateHashes` present, avoid hashing on cold start. Fetch `manifest` next for sizes / secondary validation. If `manifest` missing but `meta.stateHashes` exists, reconstruct using `Object.keys(meta.stateHashes)`; lazily create manifest later.
  - Reconstruct synthetic `data` via `await local.get(Object.keys(meta.stateHashes))`.
  - Spot-validate (sample N keys or probabilistic) by re-hashing; on mismatch run a full repair pass updating both `meta.stateHashes` and `manifest`.
- If neither `meta.stateHashes` nor `manifest` are present, fall back to legacy `data` key.

### Migration Trigger

Use a feature flag (remote config or build flag) `ENABLE_STATE_SPLITTING`. When enabled:

- Dual writes + new reads.
  When stable:
- Stop writing legacy `data`; keep `data` only for N versions (retention window), then cleanup.

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
