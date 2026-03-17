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

## Prerequisites

- A **relay** running on a publicly-reachable server (typically the same VPS
  that runs the away kernel). The relay is a lightweight libp2p process that
  allows both kernels to connect outbound for NAT traversal.
- You only need **one** relay instance. Both the home and away kernels connect
  to it — neither side needs to run its own relay.

### Starting the relay (on the VPS)

```bash
yarn ocap relay
```

This prints a deterministic multiaddr like:

```text
/ip4/<VPS_IP>/tcp/9001/ws/p2p/12D3KooWJBDqsyHQF2MWiCdU4kdqx4zTsSTLRdShg7Ui6CRWB4uc
```

Keep this running. Both kernels will connect outbound to this address.

> **Local development**: If both kernels run on the same machine, you can start
> the relay locally and use `/ip4/127.0.0.1/tcp/9001/ws/p2p/<peer_id>`.

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
OCAP_RELAY_MULTIADDR=/ip4/<VPS_IP>/tcp/9001/ws/p2p/<relay_peer_id>
```

The build system replaces `process.env.OCAP_RELAY_MULTIADDR` at compile time.
The offscreen script parses the value and sets relay query params on the kernel
worker URL. The kernel worker internally calls `getRelaysFromCurrentLocation()`
→ `initRemoteComms({ relays })`. The relays are embedded into any OCAP URLs
issued by the kernel.

**If `OCAP_RELAY_MULTIADDR` is not set, no relay hints are embedded and the
away kernel won't be able to connect.**

### Step 1: Configure the Relay Address

Set `OCAP_RELAY_MULTIADDR` in your `.metamaskrc` with the VPS relay's
multiaddr:

```ini
# .metamaskrc
OCAP_RELAY_MULTIADDR=/ip4/<VPS_IP>/tcp/9001/ws/p2p/<relay_peer_id>
```

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

> **If the OCAP URL has no relay hints** (no commas after the peer ID), you
> forgot to set `OCAP_RELAY_MULTIADDR` before building. Set it and rebuild.

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

### Step 2: Initialize Remote Comms

```bash
yarn ocap daemon exec initRemoteComms '{"relay": "<relay_multiaddr>"}'
```

Use the same relay multiaddr that the home kernel is using. Example:

```bash
yarn ocap daemon exec initRemoteComms '{"relay": "/ip4/<VPS_IP>/tcp/9001/ws/p2p/<relay_peer_id>"}'
```

### Step 3: Parse the OCAP URL

The OCAP URL from Step 3 of Part 1 has this format:

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

The `peerId` is just the `12D3KooW...` part extracted from the OCAP URL (after
`@`, before the first `,`). The hints are the relay multiaddrs after the peer
ID:

```bash
yarn ocap daemon exec registerLocationHints '{"peerId": "12D3KooW...", "hints": ["/ip4/<VPS_IP>/tcp/9001/ws/p2p/<relay_peer_id>"]}'
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

The vendor's public facet supports `requestCapability`. Call it to get a
capability (currently hardcoded to return an `AccountMessageSigner`):

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

| Component | Description                                                |
| --------- | ---------------------------------------------------------- |
| `oid`     | Base58-encoded AES-GCM encrypted kref                      |
| `peer_id` | libp2p peer ID of the issuing kernel (e.g., `12D3KooW...`) |
| Hints     | Multiaddr relay addresses for NAT traversal                |

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

1. **Relay**: Confirm the relay is running on the VPS and reachable.
2. **Home**: Set `OCAP_RELAY_MULTIADDR` in `.metamaskrc`, rebuild, load
   extension.
3. **Home**: Confirm the OCAP URL in the offscreen console contains relay hints
   (comma-separated multiaddrs after the peer ID).
4. **Copy** the OCAP URL to the VPS SSH session.
5. **Away**: `daemon start` + `initRemoteComms` with `{"relay": "..."}`.
6. **Away**: `registerLocationHints` with the peer ID and relay hints from the
   URL.
7. **Away**: `redeemOcapURL`. Confirm a kref is returned (e.g., `"ko42"`).
8. **Away**: `queueMessage` with `__getDescription__` (optional). Confirm
   method schema returned.
9. **Away**: `queueMessage` with `requestCapability`. Confirm new kref in
   slots.
10. **Away**: `queueMessage` with the desired method (e.g., `getAccounts`).
    Confirm data returned.

---

## Part 6: Troubleshooting

### OCAP URL has no relay hints

The URL looks like `ocap:<oid>@<peer_id>` with no commas. This means
`OCAP_RELAY_MULTIADDR` was not set when the extension was built. Set it in
`.metamaskrc` and rebuild with `yarn webpack`.

### `redeemOcapURL` hangs or fails

- Verify the relay is running: `curl http://<VPS_IP>:9001` should connect (or
  at least not time out).
- Verify the away daemon initialized remote comms: check daemon logs for
  connection to the relay.
- Verify `registerLocationHints` was called with the correct peer ID (just the
  `12D3KooW...` part, not the full OCAP URL).

### Smoke test errors in offscreen console

The home side runs a smoke test after vendor launch that calls
`requestCapability` and `getAccounts`. If you see errors like
`AccountsController:listAccounts` failing, the `hostApiProxy` bridge to the
background service worker may not be connected. This doesn't block OCAP URL
issuance but indicates the host API proxy needs debugging.

---

## Key Files Reference

| File                                                                 | Purpose                                                              |
| -------------------------------------------------------------------- | -------------------------------------------------------------------- |
| `app/offscreen/ocap-kernel/index.ts`                                 | Home kernel init, CapTP setup, vendor launch, OCAP URL logging       |
| `app/offscreen/ocap-kernel/vats/capability-vendor/index.ts`          | Vendor vat: bootstrap, requestCapability, publicFacet                |
| `app/offscreen/ocap-kernel/services/llm-service.ts`                  | Hardcoded LLM service (stock AccountMessageSigner response)          |
| `app/offscreen/ocap-kernel/services/host-api-proxy.ts`               | Proxy to background controller messenger                             |
| `app/scripts/lib/offscreen-bridge/host-api-proxy-bridge.ts`          | Background-side bridge for host API proxy                            |
| `packages/kernel-browser-runtime/src/kernel-worker/kernel-worker.ts` | Kernel init, CapTP setup, `initRemoteComms` call                     |
| `packages/kernel-browser-runtime/src/background-captp.ts`            | `makeBackgroundCapTP` — web app gets `KernelFacet` via `getKernel()` |
| `packages/ocap-kernel/src/kernel-facet.ts`                           | KernelFacet method list                                              |
| `packages/kernel-utils/src/discoverable.ts`                          | `makeDiscoverableExo`, `GET_DESCRIPTION` constant                    |
| `packages/kernel-utils/src/exo.ts`                                   | `makeDefaultExo`                                                     |
| `packages/kernel-utils/src/schema.ts`                                | `MethodSchema` type definition                                       |
| `packages/kernel-agents/src/capabilities/discover.ts`                | `discover()` — converts discoverable exo to capability record        |
| `packages/kernel-test/src/vats/remote-sender-vat.ts`                 | Example: OCAP URL issuance from vat bootstrap                        |
| `packages/kernel-test/src/vats/discoverable-capability-vat.ts`       | Example: `makeDiscoverableExo` usage                                 |
| `packages/ocap-kernel/src/remotes/kernel/OcapURLManager.ts`          | OCAP URL issue/redeem internals                                      |
| `packages/ocap-kernel/src/remotes/kernel/remote-comms.ts`            | `parseOcapURL`, remote identity generation                           |
| `packages/ocap-kernel/src/rpc/kernel-control/`                       | RPC handler specs (param formats for each `daemon exec` method)      |
| `packages/kernel-cli/README.md`                                      | CLI command reference                                                |
