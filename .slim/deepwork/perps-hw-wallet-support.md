# Deep Dive: Perps on Hardware Wallets (deposit flow → agent wallet)

**Type:** Investigation / gap analysis (no product code changes; deliverable is a doc in `docs/`)
**Started:** 2026-09-01

## Goal

Determine what must change for the MetaMask Extension perps experience (built on
the `@metamask/perps-controller` / HyperLiquid provider) to work with hardware
wallets (Ledger, Trezor, QR-scanner accounts). Ordered focus:

1. **Deposit flow** — funding path from extension wallet into perps trading.
2. **Agent wallet usage** — how the perps flow uses an agent/exchange wallet,
   what signatures it needs, and why/whether HW keys can produce them.

## Known context (accepted, pre-research)

- Perps = HyperLiquid via `@metamask/perps-controller` (`HyperLiquidProvider`).
  Exchange writes are signed actions ("single-signer exchange writes");
  multi-sig conversion probe exists (`userToMultiSigSigners`).
- Prior session (`.slim/deepwork/monad-hw-gasless-fix.md`): HW keyrings are
  excluded from `KEYRING_TYPES_SUPPORTING_7702 = [hd, simple]`; HW accounts
  cannot hold EIP-7702 delegations; `isExternalSign` mis-handling for HW was a
  real shipped bug pattern. Relevant precedent for HW exclusion lists.
- Perps deposit tx types exist: `TransactionType.perpsDeposit`,
  `TransactionType.perpsDepositAndOrder` (see `ui/selectors/perps-controller.ts`).
- A separate MetaMask "Agent wallet" (CLI/notifications) concept exists in
  locales — must NOT be conflated with the perps/HyperLiquid agent wallet; the
  investigation must pin down which "agent wallet" the perps flow uses (likely
  HL agent/approver wallet) and map both if ambiguous.
- Perps feature flags: `perpsEnabledVersion` etc. (`ui/selectors/perps/feature-flags.ts`).

## Open questions to answer

Q1. Exact deposit flow: UI entry → controller calls → on-chain txs (chain,
    contract, approve?, bridge?) → which controller signs/submits.
Q2. Where does account type / keyring type gate the perps flow today? Is HW
    blocked explicitly (UX) or implicitly (broken signing)?
Q3. What is the agent/exchange wallet in the perps flow? How is it created,
    keyed, stored, and used? What message formats must be signed
    (personal_sign / eth_sign / EIP-712 / HL "action" payloads)?
Q4. Which of those signing operations are impossible or degraded on Ledger /
    Trezor / QR keyrings (e.g., arbitrary 32-byte hashes, blind signing,
    EIP-712 domain constraints, `eth_sign` blocking)?
Q5. What UX/infra changes are implied (HW connect gates, signing UI, errors,
    feature flags, tests)?

## Phases

### Phase 1 — Discovery & mapping (parallel, background)
| Lane | Specialist | Scope |
|---|---|---|
| 1a | @explorer | Perps deposit flow end-to-end in repo: UI components/hooks → actions → PerpsController methods → TransactionController usage → chain/contract details. Include `perpsDepositAndOrder`. List every signature/tx the user's key must produce. |
| 1b | @explorer | Agent/exchange wallet in perps: creation, derivation, storage, signing (HL exchange actions), multi-sig conversion, withdrawal/transfer paths. Also check whether MetaMask "Agent wallet" (CLI) feature intersects. |
| 1c | @explorer | HW wallet signing architecture: keyring types, personal_sign/typed-data paths for Ledger/Trezor/QR, existing HW exclusion lists (7702, gasless, snaps), how confirmations UI routes HW signing, any perps-specific HW gates. |
| 1d | @librarian | HyperLiquid requirements: exchange wallet/agent derivation & signing spec (action hashing, EIP-712 vs personal_sign), hardware-wallet constraints with HL, public docs on MetaMask perps if any. |

**Gate 1 (@oracle, attempt budget 1+2):** review assembled map for correctness &
completeness against Q1–Q5 before gap analysis. Rationale: gap analysis quality
is bounded by map quality; catch wrong turns before synthesis.

### Phase 2 — Gap analysis + deliverable doc
- Owner: orchestrator synthesis → deliverable `docs/perps-hardware-wallet-support.md`
  (deep dive: current architecture, HW constraints per signing point, change list
  by area: controller, keyring/signing, UI/UX, flags/rollout, tests).
**Gate 2 (@oracle, attempt budget 1+2):** review doc for material omissions,
wrong assumptions, risk mis-rank. Rationale: final deliverable gate; one bounded
remediation pass after review.

## Accepted research

### Lane 1c — HW signing architecture (@explorer, ses_fa57d179fffePpQrx0LuA9zb1j) ✅

**Headline: no keyring-level blocker for perps signing on HW; the blockers are
product-layer.**

- Keyring ops matrix: all HW families (Ledger, Trezor/OneKey, QR, Lattice) sign
  EVM txs ✅, personal messages ✅, and **signTypedData V4 ✅** (Ledger
  `ledger-keyring.cjs:327-374`; Trezor `trezor-keyring.cjs:265-315` with
  `metamask_v4_compat:true` — "Trezor 1 only supports blindly signing hashes";
  QR `qr-keyring.cjs:271-275`). Ledger is **V4-only** (throws otherwise
  `:327-331`) — fine for perps (V4 only). `eth_sign` not wired for ANY account
  (`eth-json-rpc-middleware/dist/wallet.cjs:66-79`).
- Ledger constraints: **blind signing (`arbitraryDataEnabled`) required** for
  anything beyond simpleSend (`LedgerAdapter.ts:190-217`,
  `useHardwareFooter.ts:109-115`); ETH app open; Gen5 EIP-712 mismatch fixed in
  current keyring (`docs/ledger-gen5-eip712-signature-mismatch-solution.md`);
  keyring is a preview **DMK build** (`docs/ledger-dmk-offscreen-architecture.md`).
- **Perps ↔ HW existing logic (only product-layer logic):**
  - `.yarn/patches/@metamask-perps-controller-npm-6.0.0-5657adf635.patch` —
    `HARDWARE_KEYRING_TYPES` (all 5) + `isSelectedHardwareWallet()` →
    `allowUserSigning:false` defers unified-account/builder-fee/referral
    signing to action time; caches prevent prompt spam. (The lane-1b citations
    are of the PATCHED dist.)
  - **Blocking HW alert on perps money movement:**
    `ui/pages/confirmations/hooks/alerts/transactions/usePayHardwareAccountAlert.ts:17-24`
    — `perpsDeposit`, `perpsWithdraw` (+ money/predict variants) with
    pay-with/MUSD funding → **`isBlocking:true` Danger alert** for HW;
    `useAutomaticTransactionPayToken.ts:327-329` forces `targetTokenFallback`.
  - No perps-UI HW gate at all (zero HW refs in `ui/pages/perps`,
    `ui/components/app/perps`) — HW perps is anticipated/partially supported,
    not forbidden.
- Exclusion-list precedent: `KEYRING_TYPES_SUPPORTING_7702=[hd,simple]`
  (`shared/constants/keyring.ts:36-39`); HW excluded from 7702 relay/gasless
  (`useIsGaslessSupported.ts:33-77`), `isExternalSign` clearing
  (`useTransactionConfirm.ts:117-145`); STX sendBundle OPEN to HW; batch-sell
  excludes HW; swaps has dedicated HW signing page + state machine
  (`ui/pages/hardware-wallets/swap/hooks/useHardwareWalletSignatures.ts`) —
  strong precedent for a dedicated HW perps signing UX.
- HW confirm UX: footer preflight `ensureDeviceReady` gates CTA
  (`footer.tsx:369-395`); QR skips preflight (camera at sign time); HW error
  taxonomy + user-rejection silent handling. E2E exists:
  `test/e2e/tests/hardware-wallets/ledger/` (personal-sign, sign/typedDataV4,
  erc20/erc721).
- Unverified in code (flag for doc): Trezor/QR V1/V3 typed-data behavior
  (irrelevant — perps is V4); device data-size limits; Lattice EIP-712 display
  limits; locale file for `alertPayHardwareAccount*` strings.

### Lane 1a' — Deposit flow (@explorer exp-4, ses_fa5572f73ffe4cSuWbju54wU4f) ✅

**Deposit (perpsDeposit):**
- UI entry: `usePerpsDepositConfirmation` (`ui/components/app/perps/hooks/usePerpsDepositConfirmation.ts:34-112`)
  → `ensureArbitrumNetworkExists()` (`usePerpsNetworkManagement.ts:14-42`, always Arbitrum
  One even in perps-testnet mode) → `createPerpsDepositTransaction({})`
  (`createPerpsDepositTransaction.ts:18-33`) → background
  `perpsDepositWithConfirmation` (`perps-controller-init.ts:426-435`) →
  `PerpsController.depositWithConfirmation` (`PerpsController.cjs:1232-1453`) →
  `DepositService.prepareTransaction` (`DepositService.cjs:55-95`) →
  `TransactionController:addTransaction`, `isInternal:true`, type `perpsDeposit`.
- Tx shape: single ERC-20 **USDC `transfer(bridge, amount)`** — token
  `0xaf88d065e77c8cC2239327C5EDb3A432268e5831` (native USDC, NOT USDC.e,
  `hyperLiquidConfig.cjs:39`), recipient HL bridge
  `0x2df1c51e09aecf9cacb7bc98cb1742757f163df7` (mainnet) /
  `0x08cfc1b6b2dCF36A1480b99353A354AA8AC56f89` (testnet) (`hyperLiquidConfig.cjs:66-75`).
  Chain always 42161 (`DepositService.cjs:73-74`). **No approve tx anywhere.**
- Amount placeholder `'0x0'` at creation; user enters amount on the
  `ConfirmationLoader.CustomAmount` screen; calldata rewritten with 500ms debounce
  (`useTransactionCustomAmount.ts:224`). Fixed gas 100k
  (`hyperLiquidConfig.cjs:167-168`), `skipInitialGasEstimate:true`.
- Completion: `depositRequests` entries `{id,timestamp,amount,accountAddress,status,txHash,transactionId}`
  (`PerpsController.cjs:1245-1256`); UI via `PerpsDepositToast` driven by
  `selectPerpsDepositPending` (`ui/selectors/perps-controller.ts:31-40, 88-132`) +
  HL WebSocket balance stream (`usePerpsLiveAccount.ts`). No polling.
- `perpsDepositAndOrder`: same single transfer tx (no order placed in this
  path); **extension never calls it** (mobile/reserved path).
- Funding: confirmation-screen Pay flow (`PAY_TRANSACTION_TYPES` includes
  perpsDeposit, `ui/pages/confirmations/constants/pay.ts:5-13`);
  `TransactionPayController` can fund from other chains/tokens via
  relay/across/server/fiat strategies (server strategy requires target 0xa4b1 +
  Arbitrum USDC, `strategy/server/perps.cjs:14-38`).

**Withdraw — NOT an EVM tx:** `perps-withdraw-page.tsx:417-420` →
`PerpsController.withdraw` → `HyperLiquidProvider.withdraw` (`HyperLiquidProvider.cjs:3607+`)
→ `ensureUnifiedAccountEnabled({allowUserSigning:true})` (`:3678`) → HL exchange
L1 action (**signTypedMessage V4**). `TransactionType.perpsWithdraw` EVM type
exists only in pay/MUSD display logic.

**HW gates (deposit):** ONLY `usePayHardwareAccountAlert` (`:30-82`) — fires iff
HW account AND type ∈ {moneyAccountDeposit/Withdraw, **perpsDeposit,
perpsWithdraw**, predictDeposit/Withdraw} — **unconditional, NOT gated on
pay-with selection** (only `musdConversion` is flag-gated). Severity Danger,
`isBlocking:true`. Zero other HW references in perps UI.

**CORRECTION to lane 1c:** `.yarn/patches/@metamask-perps-controller-npm-6.0.0…patch`
is **STALE/UNUSED** — targets v6.0.0 but installed package is 12.0.0 with no
`patchedDependencies` entry. The HW deferral logic (`HARDWARE_KEYRING_TYPES`,
`isSelectedHardwareWallet`, action-time deferral, prompt caches) lives natively
in v12 dist (`HyperLiquidProvider.cjs:407, 6097, 8235`).

### External research (orchestrator fetches, HL official docs) ✅

- HL API docs (exchange-endpoint page): confirms L1 actions + user-signed
  actions (`sendAsset`, `withdraw3`, `usdSend` "human readable signature
  format", `userSetAbstraction` with `signatureChainId` e.g. `0xa4b1` =
  Arbitrum), `approveAgent` = "Approves an API Wallet (also sometimes referred
  to as an Agent Wallet)", agent-scoped actions (`agentSendAsset`), TWAP, etc.
- Nonces & API wallets page: **API/agent wallets are signer-only** — a master
  account approves them to sign on its behalf; they cannot query account data;
  nonce state is per-signer; agents can be pruned/deregistered (approveAgent
  with same name/unnamed replacement) — important for replay-safety if the
  extension ever adopts a real agent-wallet architecture.
- Signing page: recommends SDK-based signing; msgpack action payloads with
  field-order sensitivity; no EIP-712 constants published on that page (spec
  taken from SDK code in lane 1b — authoritative as the actual implementation).
- Not researched (repeated librarian lane failures, non-load-bearing): MetaMask
  perps public announcements; HL community HW-wallet threads. Doc will note this.

**Headline: there is NO separate agent wallet/key in the extension.** All HL
signing uses the currently selected account key:

- `HyperLiquidWalletService.createWalletAdapter()` (dist `services/HyperLiquidWalletService.cjs:72-110`)
  → `{ address, signTypedData, getChainId }`; address = fresh selected account
  per sign; `signTypedData` → `KeyringController:signTypedMessage` (V4)
  (`:174-185`), gated on `isUnlocked` (throws `KEYRING_LOCKED`).
- Messenger grants perps only `KeyringController:getState` +
  `signTypedMessage` (`perps-controller-messenger.ts:38-39, 86-87`). No key
  export/derivation/personal_sign/eth_sign anywhere in the package.
- SDK (`@nktkas/hyperliquid`) signs:
  - **L1 actions** (order, cancel ×4, modify, twap±, updateLeverage,
    updateIsolatedMargin, setReferrer, agentSetAbstraction): keccak(msgpack(action)‖nonce‖vault‖expires)
    → EIP-712 domain `{name:"Exchange",version:"1",chainId:1337,verifyingContract:0x0}`,
    primaryType `Agent`, message `{source:"a"|"b", connectionId:<32-byte actionHash>}`
    (`esm/signing/_l1.js:21-52, 118-149`).
  - **User-signed actions** (`userSetAbstraction` unified-account migration,
    `approveBuilderFee`, `sendAsset`, `withdraw3`): EIP-712 domain
    `{name:"HyperliquidSignTransaction", version:"1", chainId:<signatureChainId>, verifyingContract:0x0}`
    (`_userSigned.js:70-88`).
  - **Deposits bypass HL signing** — normal `TransactionController:addTransaction`
    EVM txs (`PerpsController.cjs:3694-3701`).
- Multi-sig HL accounts: probe `userToMultiSigSigners`; non-null ⇒ skip unified
  migration, fallback to programmatic collateral transfer
  (`HyperLiquidProvider.cjs:4841-4872, 5011-5033, 5111-5130`).
- **HW-awareness ALREADY in perps package:** `HARDWARE_KEYRING_TYPES` =
  Ledger/Trezor/OneKey/Lattice/QR (`HyperLiquidWalletService.cjs:22-28`);
  `isSelectedHardwareWallet()` (`:57-65`); init-time `allowUserSigning:
  !isSelectedHardwareWallet()` — HW defers signing prompts to action time
  (`HyperLiquidProvider.cjs:5209-5216`); `TradingReadinessCache` exists
  specifically to avoid repeated HW signing prompts across provider recreation
  (`TradingReadinessCache.cjs:1-40`).
- HW friction candidates (code-grounded): (1) per-action device approval with
  **undecodable opaque bytes32 connectionId** (EIP-712 V4) — frequency 5× order
  call sites + cancels/modifies; (2) one-time setup writes (migration,
  builder-fee, referral) still prompt once; (3) KEYRING_LOCKED retry re-arms
  device prompts; (4) Lattice EIP-712 display limits unhandled (absence).
- MetaMask "Agent wallet" (CLI) = unrelated notifications-settings feature
  (`messages.json:6376-6381`, `routes.ts:145-146, 694-695`). Zero code overlap
  with perps.

**Implication for HW support:** the whole question reduces to (a) normal EVM
tx signing for deposits (likely works), and (b) whether HW keyrings can sign
EIP-712 V4 with fake chainId 1337 / opaque bytes32 payloads — awaiting lanes
1a/1c/1d.

### Gate 1 — @oracle verdict (ora-3, ses_fa53586b3ffe…, attempt 1 of 3): GO-WITH-CONDITIONS ✅

- Spot-checks PASSED (deposit single-transfer/no-approve; direct signTypedMessage
  grant; HW-awareness native in v12).
- **Central finding (new, load-bearing for the doc):** PerpsController calls
  `KeyringController:signTypedMessage` (low-level) directly from background —
  NOT via SignatureController approval — so NO user-facing MetaMask signature
  confirmation exists for ANY HL action (orders/cancels/modifies/withdrawals),
  for any account type. Consequently the HW footer preflight
  (`ensureDeviceReady`) never runs for perps: Ledger users get a raw device
  prompt on an opaque EIP-712 bytes32 connectionId with no context or
  blind-signing guidance.
- Oracle top-5 HW frictions: (1) unconditional blocking deposit alert;
  (2) confirmation bypass for all trading/withdraw signing; (3) Ledger blind
  signing with no preflight/guidance; (4) per-action device approvals, caching
  only; (5) KEYRING_LOCKED/account-switch re-armed prompts + retry caches.
- **CONDITION for doc:** foreground the confirmation-bypass as the central HW
  UX/security gap, not merely a friction item.

## Status log

- 2026-09-01 setup: `.gitignore` += `.slim/deepwork/`, `.ignore` created with
  negations. Plan drafted. Phase 1 lanes being dispatched.
- 2026-09-01 lane 1b complete + reconciled above. Lanes 1a/1c/1d still running.
- 2026-09-01 lane 1c complete + reconciled above.
- 2026-09-01 lane 1d (librarian) died with session error → relaunched as
  lib-1' `ses_fa56bcfdaffeoLiq1YGVf8R4Wq` (same prompt, cites 1b findings).
- 2026-09-01 lane 1a (explorer deposit flow) hung ~27 min, cancel attempt left
  it in error state ("Session error") → relaunched as exp-1'
  `ses_fa5572f73ffe4cSuWbju54wU4f` with NARROWED scope (deposit tx mechanics,
  UI entry, depositAndOrder, completion state, deposit-specific HW gates) since
  lanes 1b/1c already covered the signer/HW-funding facts.
- 2026-09-01 Gate 1 (ora-3): GO-WITH-CONDITIONS — condition honored in doc.
- 2026-09-01 Phase 2 deliverable written:
  `docs/perps-hardware-wallet-support.md` (exec summary, perps architecture
  incl. §2.4 confirmation bypass, capability matrix, gaps D1-D4/T1-T8,
  workstreams WS-A..WS-F, open questions). Gate 2 review dispatched.
- 2026-09-01 Gate 2 (ora-4): **ACCEPT-WITH-CHANGES**. Material findings (2):
  (1) `perpsWithdraw` alert semantics — clarified in doc §1/§4 D1 (alert
  guards pay/MUSD display paths only; real HL withdrawal gate is T1);
  (2) WS-E "agent can trade but not withdraw" unverified — softened to
  "signer-only delegates per HL docs". Nitpicks: citations added
  (routes.ts:145-146, messages.json), Lattice wording aligned; 1 style
  nitpick skipped (non-material). Remediation validated via rg line evidence
  (doc lines 27/32/142/159/221). No re-review needed (fixes implement
  Oracle's prescribed changes verbatim; decision/risk unchanged).
- 2026-09-01 INVESTIGATION COMPLETE. Deliverable:
  `docs/perps-hardware-wallet-support.md`.

## Amendment (post-investigation): chosen architecture + implementation plan

- **User decision:** adopt the **single-path agent-wallet design** (agent key
  when present, else master; no HW/SW branches; one-time `approveAgent`
  setup; per-account encrypted agent-key storage; client re-init support;
  remove HW-only deposit block). Spec doc reconciled: §1 decision bullet,
  §5.1 chosen architecture (+5 research constraints: approveAgent needs
  surfaced confirmation; agentSendAsset custody wording; never-reuse/
  rotation; residual master signing; multi-sig fallback), §5.2 WS-1..WS-7,
  §6 open questions updated. Old WS-A..F removed (verified no dangling refs).
- **New phase: detailed implementation plan** (writing-plans skill). exp-5
  (`ses_fa522ab7dffeIzb0eiry7PzaPN`) verifying plan mechanics: perps DI/patch
  seam, agent-key storage options, @nktkas/hyperliquid approveAgent + local
  wallet, client re-init, background-confirmation precedent, perps state
  persistence, alert-removal isolation. Plan → `docs/superpowers/plans/`;
  self-review + Gate 3 Oracle review to follow.
- 2026-09-01 exp-5 hung ~89 min → cancelled; orchestrator verified plan
  mechanics directly: SDK `approveAgent` + ethers-signer wallet interface
  (`@nktkas/hyperliquid/esm`), no DI seam in provider (`HyperLiquidProvider.cjs:438`
  hard-wires `HyperLiquidWalletService`) → yarn-patch approach (dist-patch
  precedent exists), `HyperLiquidClientService` lazy-cached exchange client
  (`:40,105,205-210`) → patch adds wallet swap, `KeyringTypes.simple =
  "Simple Key Pair"` + `@ethersproject/wallet` present → vault-keyring storage
  (hidden, no AccountsController registration; regression-tested in plan
  Task 1).
- 2026-09-01 Implementation plan written:
  `docs/superpowers/plans/2026-09-01-perps-agent-wallet-hw-support.md`
  (8 tasks: keyring module, registry controller, approveAgent builder with
  SDK-golden test, setup flow, perps-controller yarn patch, setup UI behind
  flag, HW deposit unblock, metrics/docs). Self-review done (fixed messenger
  import path bug). Gate 3 dispatched.
- 2026-09-01 Gate 3 (ora-5): ACCEPT-WITH-CHANGES — 4 material findings:
  (1) hidden vault-keyring assumption WRONG (AccountsController auto-syncs
  non-money keyrings, `AccountsController.cjs:549-653`); (2) approveAgent
  EIP-712 schema wrong (SDK: primary type `HyperliquidTransaction:ApproveAgent`,
  no signatureChainId in typed message, nonce uint64, oracle needs `types` arg);
  (3) `HyperLiquidWalletService` not exported from package root; (4) HL API
  expects `{r,s,v}` signature object.
- 2026-09-01 **USER OVERRIDE:** keyring-based agent storage rejected ("wrong
  path" — agent key is a signing secret, not an account). Reverted to
  product-spec storage: passworder ciphertext in PerpsAgentWalletController
  state; unlock-hook decryption verified at
  `LegacyBackgroundApiService:submitPasswordOrEncryptionKey`
  (metamask-controller.js:2860-2863, 3909-3918); setup-time password via
  `KeyringController:verifyPassword` (metamask-controller.js:2864-2867). Task 5
  seam simplified to injected local `AgentSigner` (SDK-native signer shape,
  `esm/signing/_abstractWallet.d.ts`); re-init via existing
  `initialize(wallet)` (HyperLiquidClientService.cjs:76,154). All Gate-3
  findings remediated in plan + spec (§5.1, §6.1). Single yarn patch remains
  (perps-controller). Gate 3 re-review attempt 2 dispatched.

## Execution complete (2026-09-01, later)

- Subagent-driven execution of
  `docs/superpowers/plans/2026-09-01-perps-agent-wallet-hw-support.md`
  FINISHED: 8/8 tasks implemented + reviewed; fix rounds folded in; final
  whole-branch review (With fixes) → one consolidated fix wave → clean
  re-review. Extension branch `feat/perps-agent-wallet` tip `cfbb06d20ad`
  (12 commits, post-user-rebase SHAs); core branch `feat/perps-agent-wallet`
  @ `44a7bcbdd0`. NOTHING PUSHED (user constraint).
- SDD ledger with all rulings + deferred minors was at
  `.superpowers/sdd/2026-09-01-perps-agent-wallet-hw-support/progress.md`
  (workspace deleted on completion per skill; this file + git history are the
  record). Key rulings preserved above (R1-R11) + final-review rulings
  (passkey-change → clear keys; flag gates UI only; messenger surface trim).
- User-facing reminders: attribution/lavamoat edits stashed at `stash@{0}`
  (pop after); lavamoat + attribution regeneration REQUIRED before any
  production/dist build (R8/R9 dev-builds-only decision); `file:` dep breaks
  fresh clones until repointed; WS-5/WS-6 (master-fallback confirmations,
  rotation UI) are declared follow-ups.
- Disposition (user choice, finishing-a-development-branch): KEEP branches
  as-is, local-only — extension `feat/perps-agent-wallet` @ cfbb06d20ad and
  core `feat/perps-agent-wallet` @ 44a7bcbdd0, nothing pushed. Integration
  deferred to the user.

## Post-completion live-bug fix (2026-09-01, evening)

- User hit `order 0: Builder fee has not been approved` with agent active.
  Root cause: Task-5 seam routed ALL adapter signing to the agent — but
  `approveBuilderFee` (and other user-signed, account-level actions:
  userSetAbstraction, sendAsset, withdraw3) must be MASTER-signed; HL
  rejected the agent-signed approval, provider swallowed it
  (HyperLiquidProvider.ts:3196 retry-later path), order failed.
- Fix (fix-13, reviewed APPROVED by ora-19): agent adapter routes by
  typed-data shape — primaryType `Agent`/domain `Exchange` → agent signer;
  `HyperliquidSignTransaction`/other → master keyring path. SDK invariant
  verified: no user-signed action uses the Exchange domain (incl.
  agentSendAsset = L1). Commits: core `a66a752f84`, ext `ccc34a32bda`
  (lockfile checksum). Core 2804 + ext 797 tests green. Address semantics
  documented: adapter address stays agent (SDK uses it only for local
  nonce-lock keying; HL recovers the signer from the signature).
- Device-prompt budget unchanged in spirit: L1 trading = agent (silent);
  account-level actions = master (device), one-time each per approval.
- 2026-09-01 Gate 3 re-review (ora-6, attempt 2 of 3): ACCEPT-WITH-CHANGES —
  original 4 findings RESOLVED; 6 new material findings all remediated:
  Task-2 impl rewritten onto AgentSecretStore (ciphertext state + onUnlock/
  onPasswordChange/onLock); onUnlock allowlisted in
  LegacyBackgroundApiServiceMessenger AllowedActions (:560-719), not
  method-action-types; Encryptor generic corrected (default from
  keyring-controller); encryptionKey/passkey unlock → documented limitation
  (no password ⇒ agent inactive, master fallback; CTA gated via
  perpsCanSetupAgentWallet); password-change re-encryption hook added; Task 5
  patch now includes .d.cts/.d.mts type updates. Attempt 3 NOT spent: fixes
  implement Oracle's prescribed options verbatim and the storage design itself
  was reviewed sound — remaining budget preserved for execution-phase gates.
  Plan ready for execution handoff.

## WS-6 execution (2026-09-02): rotate/revoke + account-removal cleanup

- **User-approved scope:** rotate/revoke + account-removal cleanup ONLY.
  Expiry handling, T5 (`expiresAfter` sizing), and T6 (`KEYRING_LOCKED`
  retry) deferred to WS-5/follow-up. Revocation is LOCAL-ONLY (no HL-side
  removal exists — verdict below). SDD ledger for this plan:
  `.superpowers/sdd/2026-09-02-perps-agent-wallet-rotate-revoke/progress.md`.
- **Research verdicts:** (1) **no HL removal API** — verified against the HL
  exchange-endpoint docs and `@nktkas/hyperliquid` v0.33.2; revoke = local
  key destruction (server-side delegation permanently inert). (2)
  **Same-name `approveAgent` auto-replaces/deregisters the old agent**
  (name-collision pruning) → rotation = one device signature.
  Defense-in-depth option noted (`valid_until` on `approveAgent`); SDK docs
  observe agents may expire (~90 days default when unset) — follow-up with
  WS-5 error handling.
- Shipped on extension branch `feat/perps-agent-wallet` (base
  `0478a15eee8`), 5 commits, all local:
  - `e3e443961ff` Task 1 — `removeAgent` + `agentDeactivated` +
    `KeyringController:accountRemoved` cleanup
  - `fe35fb662ff` Task 2 — revoke wiring: override reset,
    `perpsRemoveAgentWallet` background API, `PerpsAgentRevoked` metric
  - `d14c48c2407` Task 3 — `is_rotation` metric flag through setup flow
  - `d7faa01814a` Task 4 — rotate/remove UI + locales
  - `fa2c454026a` Task 1 fix — typed harness publish for lint:tsc
- Deferred minors recorded in
  `.superpowers/sdd/2026-09-02-perps-agent-wallet-rotate-revoke/progress.md`.
- Spec doc `docs/perps-hardware-wallet-support.md` updated in the WORKING
  TREE ONLY (file carries the user's uncommitted A.5 diagram — NOT staged
  or committed by this session): WS-6 implementation-status entry,
  §5.2 WS-6 shipped note + remaining-follow-ups update, §6.4 RESOLVED.
