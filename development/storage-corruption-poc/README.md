# Storage-corruption investigation PoCs

Temporary experiments for reproducing the "storage corrupted / missing /
damaged" bug class (related: MetaMask/metamask-extension#43773). **Do not ship.**

## Why "kill the service worker mid-write" does not reproduce it

Blocking the service-worker (SW) JS thread during a `chrome.storage.local` write
and then killing the SW does not lose or corrupt the write — it survives. That
is expected, and it is a negative result, not a repro:

**The write isn't on the SW thread.** `storage.local.set()` posts the payload to
the browser process over IPC; the disk commit runs there, off the SW JS thread.
Chrome will not terminate a SW that has in-flight extension-API I/O at an unsafe
point. Blocking the JS thread and killing the SW cannot tear a single `set` in
half. (MetaMask's persisted state — vault + controllers — lives in
`chrome.storage.local`, see
[`shared/lib/stores/extension-store.ts`](../../shared/lib/stores/extension-store.ts),
orchestrated by
[`persistence-manager.ts`](../../shared/lib/stores/persistence-manager.ts).)

Real corruption comes from the **browser process / disk layer** (crash, power
loss during LevelDB compaction, aborted fsync, bad sectors, quota/disk-full) or
from MetaMask's own **multi-step, non-atomic** write logic.

## The three experiments

### 1. `debugFillStorageQuotaExperiment` — quota / disk-full (highest ROI, easiest)

Added to [`app/service-worker.ts`](../../app/service-worker.ts). In the SW
console:

```ts
await globalThis.debugFillStorageQuotaExperiment({ chunkSizeBytes: 1048576 });
```

Writes 1 MiB chunks to `chrome.storage.local` until a `set` fails and reports
`chrome.runtime.lastError` — `QUOTA_BYTES quota exceeded` or, on a genuinely
full disk, `FILE_ERROR_NO_SPACE`. This is the mechanism behind
`StorageWriteErrorType.FileErrorNoSpace` and the "state stops advancing / reverts
to older state" reports: once `set` fails, `PersistenceManager` keeps the
in-memory state moving forward while the disk copy is frozen, so a later reload
reads stale/partial data.

Cleanup:

```ts
const all = await chrome.storage.local.get(null);
await chrome.storage.local.remove(
  Object.keys(all).filter((k) => k.startsWith('debugFillStorageQuota:')),
);
```

The same file also contains `debugSlowStorageWriteExperiment` /
`debugReadSlowStorageWriteExperiment`, which write and read back keys on
`chrome.storage.local` (still expected to *not* fail on SW kill — kept for
completeness).

### 2. `corrupt-leveldb.sh` — on-disk LevelDB damage (best fidelity to reports)

Directly damages the LevelDB files that back `storage.local`, simulating a crash
/ power loss / bad sector. This is the experiment that actually reproduces
"corrupted/damaged" and exercises the vault-recovery path in
[`persistence-manager.ts`](../../shared/lib/stores/persistence-manager.ts)
(`needsVaultRecovery` → IndexedDB backup → `PersistenceError` /
`vaultCorruptionDetected`).

```bash
# Fully quit Chrome first, then:
./corrupt-leveldb.sh list                 # find MetaMask's extension id
./corrupt-leveldb.sh <ext-id> ldb         # flip bytes in a table file (default)
./corrupt-leveldb.sh <ext-id> manifest    # unreadable MANIFEST -> open fails
./corrupt-leveldb.sh <ext-id> truncate    # truncate WAL -> lost tail (power loss)
./corrupt-leveldb.sh <ext-id> wipe-current # empty CURRENT -> hard open failure
./corrupt-leveldb.sh restore <ext-id>      # restore from the auto-backup
```

Each run backs the DB up first. Reopen Chrome and watch the SW console and
Sentry breadcrumbs for the `persistence.error` tags.

### 3. `__DEBUG_STORAGE_FAULT_GAP_MS__` — the non-atomic `set`→`remove` gap

`ExtensionStore.setKeyValues` writes new keys + manifest in one `local.set`, then
deletes removed keys in a *separate* `local.remove`. Those two ops are not atomic
with respect to each other. The hook in
[`extension-store.ts`](../../shared/lib/stores/extension-store.ts) pauses between
them when a global is set:

```ts
// in the SW console, before triggering a write that deletes keys
// (e.g. a split-state migration or a controller that clears state):
globalThis.__DEBUG_STORAGE_FAULT_GAP_MS__ = 20000;
```

While it's paused (`[ExtensionStore][DEBUG_FAULT] pausing …` in the console),
kill the process / force-quit Chrome, then reopen and inspect whether the
manifest and the physical keys agree. Note the failure mode here is *cross-op
inconsistency* (leftover keys / manifest mismatch), not a torn single write.

## Suggested order

Start with **#2 (`corrupt-leveldb.sh`)** — it is the most faithful reproduction
of the reports. **#1** is the easiest realistic loss vector. **#3** audits a
MetaMask-owned correctness gap.
