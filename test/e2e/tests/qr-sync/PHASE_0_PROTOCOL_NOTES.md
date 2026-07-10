# MWP Protocol Notes (reference)

Research on the **real** Mobile Wallet Protocol wire format. Kept for background
only — **v1 E2E does not use a real relay**. See
[E2E_SETUP_PLAN.md](./E2E_SETUP_PLAN.md) for the active plan (fake mock transport).

Sources: `@metamask/mobile-wallet-protocol-core@0.4.0`,
`@metamask/mobile-wallet-protocol-dapp-client@0.3.0`, and
[mobile-wallet-protocol](https://github.com/MetaMask/mobile-wallet-protocol).

**Research status:** ✅ Complete (2026-07-10)

---

## 1. Transport layer

### WebSocketTransport (Centrifuge)

- `WebSocketTransport.create({ url, kvstore, websocket? })` connects to the
  MetaMask relay at `wss://mm-sdk-relay.api.cx.metamask.io/connection/websocket`
- Uses **centrifuge-js** client (`Centrifuge` class) — not a raw WebSocket API
- Channel-based pub/sub: `subscribe(channel)`, `publish(channel, payload)`
- Incoming messages via Centrifuge `publication` events → `_handleIncomingMessage`
- Fetches channel **history** on first subscribe (missed messages while offline)
- Message deduplication via per-client nonces stored in `IKVStore`
- **Implication for E2E:** A plain `ws` `LocalWebSocketServer` (Solana/Perps
  pattern) is **insufficient**. We need either:
  - A **Centrifugo-compatible** local relay, or
  - Forward to a real/minimal Centrifuge server that supports publish/subscribe

### mock-e2e forwarding

Existing pattern forwards production WSS URLs to `ws://localhost:{PORT}` via
mockttp `forAnyWebSocket().thenForwardTo()`. Same approach applies to the MWP
relay URL once a Centrifugo-compatible server listens on the target port.

---

## 2. Channel naming

| Channel | Format | Used for |
|---------|--------|----------|
| Handshake (temporary) | `handshake:{sessionUuid}` | OTP handshake between dApp and wallet |
| Secure session | `session:{channelUuid}` | Encrypted app messages after handshake |

- DappClient creates `SessionRequest.channel = handshake:{id}` where `id` is a
  new UUID
- WalletClient creates `session:{uuid()}` for the secure channel and sends its
  `channelId` (uuid part) in the handshake offer
- After handshake, DappClient updates session channel to `session:{channelId}`
  from the offer

---

## 3. Protocol messages (MWP layer)

All messages on the wire are **ECIES-encrypted** strings (base64) wrapping a
`ProtocolMessage`:

```ts
type ProtocolMessage =
  | { type: 'handshake-offer'; payload: HandshakeOfferPayload }
  | { type: 'handshake-ack' }
  | { type: 'message'; payload: unknown };
```

### HandshakeOfferPayload

```ts
{
  publicKeyB64: string;   // wallet's public key
  channelId: string;      // uuid for session:{channelId}
  otp?: string;           // 6-digit OTP (untrusted mode only)
  deadline?: number;      // OTP expiry timestamp (ms)
}
```

### Encryption

- `BaseClient.sendMessage(channel, message)` encrypts with peer's public key
- `KeyManager` in extension uses `eciesjs` (same as MWP expects)
- Handshake messages on `handshake:*` channel are encrypted with dApp's public
  key from `SessionRequest.publicKeyB64`

---

## 4. Untrusted connection flow (QrSync uses this)

QrSync calls `DappClient.connect({ mode: 'untrusted', initialPayload })`.

### DappClient side (`UntrustedConnectionHandler`)

1. `transport.connect()`
2. `transport.subscribe(request.channel)` — subscribe to `handshake:{id}`
3. Emit `session_request` (QR payload built by QrSyncController)
4. Wait for `handshake-offer` on handshake channel (timeout: `request.expiresAt`)
5. Emit `otp_required` with `{ submit, cancel, deadline }` from offer OTP fields
6. User calls `submit(otp)` — validated with `timingSafeEqual` (max 3 attempts)
7. Create final session with `channel: session:{offer.channelId}`
8. `transport.subscribe(session.channel)`
9. Send `{ type: 'handshake-ack' }` on session channel
10. Persist session, `transport.clear(handshakeChannel)`, emit `connected`

### WalletClient side (`UntrustedConnectionHandler`)

1. `transport.connect()`
2. `transport.subscribe(request.channel)` — handshake channel
3. `transport.subscribe(session.channel)` — secure channel (pre-created)
4. Generate 6-digit OTP + deadline (`now + 60_000 ms`)
5. Emit `display_otp` event (mobile UI shows OTP)
6. Send `{ type: 'handshake-offer', payload: { publicKeyB64, channelId, otp, deadline } }`
   on handshake channel
7. Wait for `handshake-ack` before deadline
8. Persist session, `transport.clear(handshakeChannel)`, emit `connected`
9. Process `initialMessage` from SessionRequest if present (QrSync sends
   `init-sync-session` here)

### Timeouts (MWP SDK defaults)

| Constant | Value | Where |
|----------|-------|-------|
| `SESSION_REQUEST_TTL` | 60_000 ms | DappClient — QR scan window |
| `HANDSHAKE_TIMEOUT` | 60_000 ms | Trusted mode grace period |
| `DEFAULT_SESSION_TTL` | (core) | Session expiry after connect |
| Wallet OTP timeout | 60_000 ms | WalletClient untrusted handler |

Extension UI mirrors `MWP_SESSION_TIMEOUT` (60s) for QR/OTP countdown.

---

## 5. QrSync application messages (after connected)

Plain JSON payloads inside encrypted `{ type: 'message', payload }` frames:

| Type | Sender | When |
|------|--------|------|
| `init-sync-session` | Extension | `initialPayload` on connect |
| `sync-offer` | Mobile | After OTP validated |
| `sync-ready` | Extension | After user selects wallets + password |
| `sync-completed` | Mobile | After mobile imports wallets |
| `sync-cancel` | Either | User/peer cancellation |
| `sync-error` | Either | Error notification |

Defined in `app/scripts/controllers/qr-sync/constants.ts` (`QrSyncActionTypes`).

---

## 6. SessionRequest (QR payload)

Encoded in QR as `metamask://connect/mwp?p={base64(JSON)}`:

```ts
{
  id: string;              // session UUID
  mode: 'untrusted';
  channel: string;         // handshake:{id}
  publicKeyB64: string;    // dApp public key
  expiresAt: number;       // now + SESSION_REQUEST_TTL
  initialMessage?: { type: 'message', payload: { type: 'init-sync-session', version: '1.0.0' } };
}
```

Mobile simulator receives this by:
- Parsing QR in a real E2E (not needed for happy path if simulator auto-joins), or
- Subscribing to the handshake channel after observing extension publish, or
- Test harness passes `SessionRequest` directly to `WalletClient.connect({ sessionRequest })`

---

## 7. Simulator option evaluation

### Option A — `WalletClient` package (RECOMMENDED)

| | |
|---|---|
| Package | `@metamask/mobile-wallet-protocol-wallet-client` (~0.3.0) |
| Pros | Full handshake + encryption handled; mirrors real mobile; `sendResponse()` for app messages |
| Cons | New devDependency; needs Centrifugo-compatible relay; OTP is random unless we patch/mock `crypto.getRandomValues` or read `display_otp` event |
| Usage | Run in E2E Node process alongside test: `WalletClient` + `WebSocketTransport` + `SessionStore` + `KeyManager` pointing at same local relay |

**OTP strategy for E2E:** Listen to `display_otp` event → read OTP → extension UI
enters same OTP. No need for fixed OTP in relay mock.

### Option B — Custom MobileWalletSimulator

| | |
|---|---|
| Pros | Fixed OTP `123456`; no new dependency |
| Cons | Must reimplement wallet handshake, encryption, Centrifuge publish format |
| Risk | High maintenance as MWP SDK evolves |

### Option C — Local Centrifugo

| | |
|---|---|
| Pros | Real relay semantics |
| Cons | Extra binary/process in CI; config overhead |
| Use when | Options A/B cannot get Centrifuge wire format right |

### Recommendation

**Option A + local Centrifugo (or Centrifugo-compatible mock).**

Architecture:

```
┌─────────────────┐     Centrifuge WS      ┌──────────────────┐
│ Extension       │◄──────────────────────►│ Local Centrifugo │
│ DappClient      │                        │ (port 8091)      │
└─────────────────┘                        └────────┬─────────┘
                                                    │
┌─────────────────┐     Centrifuge WS               │
│ E2E harness     │◄────────────────────────────────┘
│ WalletClient    │
│ (simulator)     │
└─────────────────┘
```

mock-e2e.js forwards production relay URL → `ws://localhost:8091`.

---

## 8. Centrifuge relay (confirmed via MWP repo)

MetaMask's [mobile-wallet-protocol](https://github.com/MetaMask/mobile-wallet-protocol)
backend runs **Centrifugo** via Docker (`backend/docker-compose.yml`).

### Local dev relay

```bash
docker compose -f backend/docker-compose.yml up -d
# Centrifugo on localhost:8000
```

### Channel namespaces (`backend/config.json`)

| Namespace | Channel pattern | Permissions |
|-----------|-----------------|-------------|
| `handshake` | `handshake:{uuid}` | anonymous connect, publish, subscribe, history (size 5) |
| `session` | `session:{uuid}` | anonymous connect, publish, subscribe, history (size 20) |

Key settings:
- `allow_anonymous_connect_without_token: true`
- `force_positioning: true`, `force_recovery: true` (matches client history fetch)
- `allowed_origins: ["*"]`

Production relay (`mm-sdk-relay.api.cx.metamask.io`) uses the same Centrifugo
protocol with path `/connection/websocket`.

### E2E relay plan

- Vendor Centrifugo config into `test/e2e/tests/qr-sync/spike/`
- Run Centrifugo on port **8091** (avoid clash with dapp port 8080)
- mock-e2e.js forwards production relay WSS → `ws://localhost:8091`
- **Do not** use plain `LocalWebSocketServer` — use real Centrifugo

### Open items (spike)

- [ ] Verify mockttp WSS → WS forwarding works with Centrifuge handshake
- [ ] Confirm extension `WebSocketTransport` connects to local Centrifugo on 8091
- [ ] Run DappClient + WalletClient handshake end-to-end

---

## 9. OTP display grant

`OTP_DISPLAY_GRANT` is commented out in `QrSyncController.#handleOtpRequired`.
**Not required for happy path** — wallet generates and sends OTP in handshake
offer; extension only needs user to enter it.

---

## 10. Spike checklist (Step 3)

- [ ] Add `@metamask/mobile-wallet-protocol-wallet-client` as devDependency
- [ ] Run Centrifugo (or compatible server) on port `8091`
- [ ] Create `test/e2e/tests/qr-sync/spike/handshake-spike.ts`
- [ ] DappClient: `connect({ mode: 'untrusted', initialPayload })`
- [ ] WalletClient: `connect({ sessionRequest })` from parsed session_request
- [ ] Assert DappClient emits `otp_required`
- [ ] Submit OTP from `display_otp` event
- [ ] Assert both clients reach `connected`
- [ ] Document Centrifugo config in spike README

---

## References

- `app/scripts/controllers/qr-sync/qr-sync-controller.ts`
- `app/scripts/controllers/qr-sync/qr-sync-controller.test.ts` (mock event sequence)
- `node_modules/@metamask/mobile-wallet-protocol-core/dist/index.d.ts`
- `node_modules/@metamask/mobile-wallet-protocol-dapp-client/dist/index.d.ts`
- Upstream: `packages/dapp-client/src/handlers/untrusted-connection-handler.ts`
- Upstream: `packages/wallet-client/src/handlers/untrusted-connection-handler.ts`
