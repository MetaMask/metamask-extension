# Two-Way Kernel Communication Demo

This guide walks through establishing two-way communication between two ocap
kernels:

- **Home kernel**: runs in the MetaMask extension's offscreen document
- **Away kernel**: runs on a VPS as a CLI daemon (`@metamask/kernel-cli`),
  driven by an LLM agent with SSH access

The vendor vat (which creates capability objects on the home side) bootstraps
automatically when the kernel starts. The vendor's public facet is issued as an
OCAP URL, which the away kernel redeems to call `requestCapability`.

---

## Part 1: Home Side (MetaMask Extension)

The home kernel runs in the extension's offscreen document
(`app/offscreen/ocap-kernel/index.ts`). It communicates with the kernel worker
via CapTP. Subcluster launch, OCAP URL issuance, and logging are all automatic
on kernel boot — no manual interaction is needed.

When debugging / getting logs for the home kernel, inspect the extension's
offscreen and add the following filter in the console tab:
```text
-snap -intrinsics -Split -ExtensionStore -Bitcoin -Solana -Sentry -RPC -polyfill
```

### Remote Comms & Relay Configuration

Relay addresses are configured at build time via the `OCAP_RELAY_MULTIADDR`
environment variable in `.metamaskrc` (git-ignored). Multiple relays can be
comma-separated:

```ini
OCAP_RELAY_MULTIADDR=/ip4/127.0.0.1/tcp/9001/ws/p2p/<peer_id>
```

Or for a remote relay:

```ini
OCAP_RELAY_MULTIADDR=/dns4/relay.example.com/tcp/443/wss/p2p/<peer_id>
```

The build system replaces `process.env.OCAP_RELAY_MULTIADDR` at compile time.
The offscreen script parses the value and sets relay query params on the kernel
worker URL. The kernel worker internally calls `getRelaysFromCurrentLocation()`
→ `initRemoteComms({ relays })`. The relays are embedded into any OCAP URLs
issued by the kernel.

**If `OCAP_RELAY_MULTIADDR` is not set, no relay hints are embedded and the
away kernel won't be able to connect.**

The relay must be running and reachable by both the home and away kernels.

### Step 1: Configure the Relay

Set `OCAP_RELAY_MULTIADDR` in your `.metamaskrc` with the relay's multiaddr.
For local development, start a relay first:

```bash
yarn ocap relay
```

Copy the multiaddr from the output into `.metamaskrc`.

### Step 2: Build and Load the Extension

```bash
yarn bundle-vats    # Re-bundle after vat source changes
yarn webpack        # Rebuild (picks up OCAP_RELAY_MULTIADDR from .metamaskrc)
```

Load the extension in Chrome (`chrome://extensions` → Load unpacked →
`dist/chrome`).

### Step 3: Find the OCAP URL

Open the offscreen document's console to see the OCAP URL:

1. Go to `chrome://extensions`
2. Find MetaMask → click "Details"
3. Under "Inspect views", click the **offscreen.html** link
4. In the DevTools console, look for:

```text
============================================================
OCAP URL for remote kernel connection:
ocap:<encrypted_oid>@<peer_id>,<relay_hints>
============================================================
```

Copy this URL for use on the away side.

### Step 4: Wait

The away kernel redeems the OCAP URL, which establishes the CapTP connection.
All subsequent calls from the away side flow through automatically.

---

## Part 2: Away Side (VPS CLI)

The away kernel runs as a daemon. All commands use:

```bash
yarn ocap daemon exec <method> '<params-json>'
```

Parameters are JSON. The format depends on the RPC method:
- **Object params**: `{"key": "value"}` (most methods)
- **Tuple params**: `["arg1", "arg2", [...]]` (e.g., `queueMessage`)

### Step 1: Ensure the Daemon Is Running

```bash
yarn ocap daemon start
```

### Step 2: Initialize Remote Comms (if not already done)

```bash
yarn ocap daemon exec initRemoteComms '{"relays":["<relay_multiaddr>"]}'
```

The relay multiaddr should match what the home kernel is using (typically
passed via query string to the web app). Example format:

```text
/dns4/relay.example.com/tcp/443/wss/p2p/<relay_peer_id>
```

### Step 3: Parse the OCAP URL

The OCAP URL from Step 2 of Part 1 has this format:

```text
ocap:<encrypted_oid>@<peer_id>,<relay_hint1>,<relay_hint2>,...
```

Extract:
- **`peer_id`**: the segment after `@`, before the first `,`
- **Relay hints**: comma-separated multiaddrs after the peer_id

### Step 4: Register Location Hints

Tell the away kernel how to reach the home kernel's peer:

```bash
yarn ocap daemon exec registerLocationHints '{"peerId": "<peer_id>", "hints": ["<relay_multiaddr>"]}'
```

The hints are the relay multiaddrs extracted from the OCAP URL. If the URL
contains multiple hints, include them all:

```bash
yarn ocap daemon exec registerLocationHints '{"peerId": "12D3KooW...", "hints": ["/dns4/relay.example.com/tcp/443/wss/p2p/..."]}'
```

### Step 5: Redeem the OCAP URL

```bash
yarn ocap daemon exec redeemOcapURL '{"url": "ocap:<full_url>"}'
```

This establishes the cross-kernel CapTP connection and returns a kernel
reference (kref) for the remote object:

```json
"ko42"
```

### Step 6: Discover the Capability's Interface

If the remote object is a discoverable exo (created with
`makeDiscoverableExo`), you can introspect its methods:

```bash
yarn ocap daemon exec queueMessage '["<kref>", "__getDescription__",[]]'
```

Returns CapData containing a `MethodSchema` record describing each method, its
arguments, and return types.

### Step 7: Call `requestCapability()` on the Vendor

If the vendor object supports `requestCapability`, call it to get a more
specific capability:

```bash
yarn ocap daemon exec queueMessage '["<vendor_kref>", "requestCapability", ["view user accounts"]]'
```

Returns CapData. If the result includes a new object reference, it appears in
`slots`:

```json
{
  "body": "#\"$0.Alleged: AccountsCapability\"",
  "slots": ["ko57"]
}
```

The kref `ko57` is the new capability object.

### Step 8: Use the Capability

Call methods on the returned capability:

```bash
yarn ocap daemon exec queueMessage '["ko57", "getAccounts", []]'
```

Returns CapData with the result:

```json
{
  "body": "#[\"0x1234...\", \"0xabcd...\"]",
  "slots": []
}
```

---

## Part 3: OCAP URL Format Reference

```
ocap:<oid>@<peer_id>,<hint1>,<hint2>
```

| Component | Description |
|-----------|-------------|
| `oid` | Base58-encoded AES-GCM encrypted kref |
| `peer_id` | libp2p peer ID of the issuing kernel (e.g., `12D3KooW...`) |
| Hints | Multiaddr relay addresses for NAT traversal |

Parsing implementation: `parseOcapURL()` in
`packages/ocap-kernel/src/remotes/kernel/remote-comms.ts`:

```ts
// pathname is "<oid>@<host>,<hint1>,<hint2>"
const [oid, where] = pathname.split('@');
const [host, ...rawHints] = where.split(',');
const hints = rawHints.filter(Boolean);
return { oid, host, hints };
```

---

## Part 4: CapData Encoding

`queueMessage` returns CapData-encoded results:

```json
{ "body": "<json-string>", "slots": ["ko1", "ko2", ...] }
```

- **`body`**: JSON string prefixed with `#`. Contains the serialized value.
  Slot references appear as `"$0.Alleged: Name"`, `"$1.Alleged: Name"`, etc.
- **`slots`**: Array of krefs. `$0` maps to `slots[0]`, `$1` to `slots[1]`,
  etc.

**Simple values** (strings, numbers, arrays of strings) have an empty `slots`
array and the body is straightforward JSON:

```json
{ "body": "#\"hello\"", "slots": [] }
```

```json
{ "body": "#[\"0x1234\",\"0xabcd\"]", "slots": [] }
```

**Object references** (capability objects returned by method calls) appear as
slot references:

```json
{ "body": "#\"$0.Alleged: Calculator\"", "slots": ["ko42"] }
```

Here `ko42` is the kref you use in subsequent `queueMessage` calls.

---

## Part 5: Verification Checklist

1. **Home**: Launch vendor subcluster. Confirm OCAP URL is in the bootstrap
   result.
2. **Copy** the OCAP URL to the VPS SSH session.
3. **Away**: `daemon start` + `initRemoteComms` (if needed).
4. **Away**: `registerLocationHints` with the peer ID and relay hints from the
   URL.
5. **Away**: `redeemOcapURL`. Confirm a kref is returned (e.g., `"ko42"`).
6. **Away**: `queueMessage` with `__getDescription__` (optional). Confirm
   method schema returned.
7. **Away**: `queueMessage` with `requestCapability` (or whatever the vendor
   exposes). Confirm new kref in slots.
8. **Away**: `queueMessage` with the desired method (e.g., `getAccounts`).
   Confirm data returned.

---

## Key Files Reference

| File | Purpose |
|------|---------|
| `packages/kernel-browser-runtime/src/kernel-worker/kernel-worker.ts` | Kernel init, CapTP setup, `initRemoteComms` call |
| `packages/kernel-browser-runtime/src/background-captp.ts` | `makeBackgroundCapTP` — web app gets `KernelFacet` via `getKernel()` (wraps `getBootstrap()`) |
| `packages/ocap-kernel/src/kernel-facet.ts` | KernelFacet method list |
| `packages/kernel-utils/src/discoverable.ts` | `makeDiscoverableExo`, `GET_DESCRIPTION` constant |
| `packages/kernel-utils/src/exo.ts` | `makeDefaultExo` |
| `packages/kernel-utils/src/schema.ts` | `MethodSchema` type definition |
| `packages/kernel-agents/src/capabilities/discover.ts` | `discover()` — converts discoverable exo to capability record |
| `packages/kernel-test/src/vats/remote-sender-vat.ts` | Example: OCAP URL issuance from vat bootstrap |
| `packages/kernel-test/src/vats/discoverable-capability-vat.ts` | Example: `makeDiscoverableExo` usage |
| `packages/ocap-kernel/src/remotes/kernel/OcapURLManager.ts` | OCAP URL issue/redeem internals |
| `packages/ocap-kernel/src/remotes/kernel/remote-comms.ts` | `parseOcapURL`, remote identity generation |
| `packages/ocap-kernel/src/rpc/kernel-control/` | RPC handler specs (param formats for each `daemon exec` method) |
| `packages/kernel-cli/README.md` | CLI command reference |
