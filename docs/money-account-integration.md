# Money Account: extension integration plan

Status: planning. No implementation has landed beyond the dev-only confirmation
harness described below.

This document maps what it takes to bring the Money Account (mUSD on Monad,
backed by a Veda BoringVault) from MetaMask Mobile into the extension. It is
written against mobile's `app/components/UI/Money/` and the `@metamask/money-*`
packages in the `core` monorepo.

## SESSION HANDOFF — read this first (2026-08-05, updated same day)

**Branch: `d10-money-keyring-controller`, 19 commits on top of `main`, unpushed,
plus uncommitted work from the e2e session (see "Uncommitted changes" below).**
Every commit is verified (typecheck, lint, format, scoped tests). The stack, oldest
first:

```
f3c6c37b60  D0a  transaction-controller -> ^69.4.0 (dedupe pin)
91623a5650  D0b  transaction-pay-controller -> 26.2.0
ba1cb59499  D1   shared mUSD constants
ba01e35c7c  D3   money account address derivation
4c4915dc22  D2   vault config + APY + quote-pipeline selectors
23af71777d  D5   moneyBalance redux slice
0b9c35f069  D4   balance service registration
e5f5c0feab  D14  availability gate
2677b69b78       oxfmt fixup for D4/D5
4834089196  D4b  API data service registration
0eee669da2  D6   query keys, cache invalidation, moneyFormatUsd
e8a186881c       DATA_SERVICES registration fix
b382cb7df6  D7   useMoneyAccountInfo
e46462f2b3  D8   useMoneyAccountBalance (19-field parity)
5abd2af95a  D9   balance UI, wired into account overview
d318b6b644       privacy-mode fix for D9
2486100c77  D15  vault-config parser -> shared/lib/money/
5cc34626c8  D10  Money keyring + MoneyAccountController
3f14e87988       manifest flag override fix (background vs UI)
```

**Tier 1 complete. D10 (first Tier 2 ticket) complete. Not started: D11, D12, D13.**

### Uncommitted changes (2026-08-05 e2e session)

- `test/e2e/tests/money/money-account-vault-restore.spec.ts` _(new)_ — the
  vault-restore e2e spec. **Passing** against a real `build:test` bundle.
- `shared/lib/manifestFlags.ts` — fix: the `webextension-polyfill` import is now
  lazy. `3f14e87988` made this module reachable from
  `remote-feature-flag-utils`, which the e2e harness
  (`test/e2e/feature-flags/feature-flag-registry.ts`) loads in plain Node — and
  the polyfill throws at import time outside an extension, killing **every**
  e2e run at bootstrap. The guard (`JEST_WORKER_ID`) folds away in real builds
  (verified in the compiled bundle), jest mocks the polyfill globally, so only
  plain Node ever hit it. Behaviour in extension and jest contexts unchanged.
- `lavamoat/webpack/mv3/main/policy.json` — regenerated. **The branch's five new
  runtime deps had no LavaMoat policy entries**, so the background died at
  module load in any production build (`build:test`, and the real release
  build) while dev builds (`yarn start`, `build:test:dev`) and unit tests
  worked. This is why all manual testing passed and e2e hung on a spinner.
  CI's `validate-lavamoat-policies` regenerates every policy and fails on any
  diff, so **all eight** runtime policies (mv2 + mv3 × main/beta/flask/
  experimental) were regenerated via `webpack:lavamoat:policy:mv3` and `:mv2` —
  each gains the identical 83-line money-package block. The build-process
  policy (`webpack:lavamoat:policy:build`) was regenerated last; confirm
  `git status` on `lavamoat/` shows what you expect before committing.
- This document.

### The entropy-id question — RESOLVED, no defect (2026-08-05)

The e2e spec performs exactly the single-snapshot discriminating test this
section called for: fresh profile → import the e2e SRP → one state read. The
money account's `options.entropy.id` **equals** the restored HD keyring's
`metadata.id`, the address matches the cross-client vector, and the account is
absent from `internalAccounts` and the account-list UI. The earlier mismatch was
what the ULID ordering suggested: stale readings taken across different
rebuild/re-import sessions. The spec pins this permanently.

### The original write-up, kept for context — superseded by the resolution above

Manual testing produced an **entropy-id mismatch**:

- the money account record carried `options.entropy.id = 01KZ6GZ0MW58RW5E6JYHA92CAQ`
- the HD keyring's `metadata.id` read `01KZ6NYPSW2TP2C1C0VQWBT1AZ`
- the Money keyring's own `metadata.id` was `01KZ8H70EMSX3GMBT76KZKTG62`

If that mismatch is real and current, `selectPrimaryMoneyAccount` returns
`undefined` and the UI cannot see a money account that exists in the vault.

**What was ruled out:** there is no UI/controller divergence about "primary".
`MoneyAccountController`'s private `#getPrimaryEntropySource()` is
`keyrings.find((k) => k.type === KeyringTypes.hd)?.metadata.id`, byte-for-byte the
same rule `selectPrimaryMoneyAccount` uses. And `getMoneyAccount(selector = {})`
defaults to that primary and matches `account.options.entropy.id === entropySource`,
so a stale record correctly fails to match and `init()` should create a fresh
account on the next trigger. **The guard logic is sound.**

**Most likely explanation:** the three readings were taken across several
rebuild/re-import cycles, so they are not a snapshot of one state. ULIDs are
time-ordered and `01KZ6GZ0 < 01KZ6NYP < 01KZ8H70`, which is consistent with
readings from different sessions rather than a single inconsistent state.

**Discriminating test for the next session** — one clean run, fresh profile,
import the SRP, unlock, then read both in a single console call:

```js
const s = await window.stateHooks.getCleanAppState();
({
  recorded: Object.values(s.metamask.moneyAccounts)[0]?.options.entropy.id,
  primary: s.metamask.keyrings.find((k) => k.type === 'HD Key Tree').metadata
    .id,
});
```

Equal ⇒ no defect, and the earlier mismatch was stale readings. Unequal in one
snapshot ⇒ real defect; investigate whether `syncMoneyAccount` is firing after a
vault restore (it is subscribed to unlock and remote-flag events), because the
guard itself is correct.

### Manual verification status

| Check                                                                           | Status                                                   |
| ------------------------------------------------------------------------------- | -------------------------------------------------------- |
| Cross-client address derivation (extension **and mobile** derive `0xd5fe…7183`) | **CONFIRMED**                                            |
| Account absent from the account list                                            | **CONFIRMED**                                            |
| Lock / unlock / browser restart; existing accounts unaffected                   | **CONFIRMED**                                            |
| Money keyring genuinely in the vault (`accounts: ['0xd5fe…7183']`)              | **CONFIRMED**                                            |
| Flag-off load leaves the keyring intact                                         | **CONFIRMED**                                            |
| Vault restore into a **fresh** profile creates an account                       | **CONFIRMED** — by the e2e spec, on a production build   |
| Balance row renders (D9)                                                        | **NOT DONE** — needs an SRP with a live Monad delegation |

### Immediate next actions, in order

1. ~~Resolve the entropy-id question~~ **DONE** — no defect; see above.
2. ~~Write an e2e spec~~ **DONE** —
   `test/e2e/tests/money/money-account-vault-restore.spec.ts`, passing.
3. ~~Commit the e2e session's work~~ **DONE** — committed as four commits
   (`ebe34cc871`…`54c64ff540`), all LavaMoat policies regenerated.
4. ~~D11~~ **DONE** — see the D11 status section.
5. **D12** — `useMoneyAccountDeposit` + real entry point. D11 built the intent
   map (`ui/helpers/money/deposit-intent.ts`, with the exported setter the
   initiator needs) and the commit path is callable from the UI via
   `updateMoneyAccountDepositAmount` in
   `ui/store/controller-actions/transaction-pay-controller.ts`.
6. Then D13.

### Debts recorded elsewhere in this doc

- D5's persisted balance has **no restart survival**; `MoneyAccountController` is
  provably not a viable home (its state metadata is fixed in the published
  package), so `AppStateController` needs its own ticket.
- `clearState()` on `resetWallet` was deliberately not added (D10).
- Mobile has a **latent bug** the extension fixed: its creation guard counts state
  entries instead of asking `getMoneyAccount()`, so a restored SRP can be left
  permanently without a money account. Noted for a mobile ticket.
- `ui/components/app/musd/constants.ts` still has a duplicate `MUSD_CURRENCY`,
  the obvious next candidate for the shared package.

### How to run anything in this repo

**Read the "Verification playbook" section below before touching a command.** Every
yarn call needs the `corepack` prefix or it silently no-ops; `lint:changed` does not
cover formatting; jest with `--silent` hides the summary you need; `it.each` does
not typecheck under `ui/`.

## Current state of the extension

Already present:

- Confirmation UI for `TransactionType.moneyAccountDeposit`:
  `ui/pages/confirmations/components/confirm/info/money-account-deposit-info/`,
  plus wiring in `info.tsx`, `title.tsx`, `header.tsx`,
  `wallet-initiated-header.tsx`, `footer.tsx`, `single-action-footer.tsx`,
  `advanced-details-button.tsx` and `shared/lib/confirmation.utils.ts`.
- A dev-only trigger:
  `ui/pages/confirmations/components/developer/money-account-deposit-button/`.
  It creates a plain ERC-20 **transfer** tagged `moneyAccountDeposit` — there is
  no approve, no teller `deposit`, and no lens preview. It exercises the
  confirmation layout, not the vault.
- `ui/pages/confirmations/constants/musd.ts` — a local `MAINNET_MUSD`. This is
  wrong for the real product: `symbol` and `name` are both `'MUSD'` (the branded
  values are `'mUSD'` and `'MetaMask USD'`), and `chainId` is Mainnet while the
  Money Account is Monad-only.
- `TransactionPayController` (`app/scripts/messenger-client-init/transaction-pay-controller-init.ts`).
  Its `getStrategy` unconditionally returns `TransactionPayStrategy.Relay`.
- `keyring-controller` **27.1.0**, whose `KeyringTypes` enum already includes
  `money = "Money Keyring"`, and which exposes the V2 builder API
  (`keyringBuilderFactory`, `KeyringV2Builder`).
- `CHAIN_IDS.MONAD = '0x8f'` as a real network (display name, currency, image,
  explorer entry).
- `@metamask/react-data-query` and `@tanstack/react-query`, so mobile's
  `useQuery`-based data layer is available here.
- Deep-link route `shared/lib/deep-links/routes/money.ts`.

Absent entirely: any `@metamask/money-*` dependency, the
`moneyAccountVaultConfig` remote flag and a selector for it, money-account
address derivation, balance fetching, real vault calldata, and any Pay strategy
or payment override for money.

## How the Money Account works (the parts that drive this plan)

- **Address**: a deterministic BIP-44 derivation of the user's existing primary
  HD seed at `m/44'/4392018'/0'/0` (`MONEY_DERIVATION_PATH`,
  `@metamask/eth-money-keyring`). It is not API-provisioned and not a separate
  seed. `MoneyKeyring` wraps `eth-hd-keyring` with that fixed path and a
  one-account limit, so it can be used purely as a deriver without being
  registered as a keyring.
- **Balance**: on-chain Multicall3 `aggregate3` on Monad reading the mUSD ERC-20
  `balanceOf` plus vmUSD via the vault Lens, at `blockTag: 'pending'`, with an
  API/RPC failover facade. Lives in
  `@metamask/money-account-balance-service`, which is React-Native-free and
  therefore portable as-is.
- **Vault config**: contract addresses and the chain come from the
  `moneyAccountVaultConfig` remote feature flag. The balance service rejects
  with `VaultConfigNotAvailableError` until that flag is served.
- **Deposits/withdrawals**: two-call batches built by
  `@metamask/money-account-utils` — approve + teller `deposit` for deposits,
  teller `withdraw` + ERC-20 `transfer` for withdrawals. MetaMask Pay re-encodes
  the calldata once the user picks an amount.

## Version decisions

> **Verification note.** Read dependency versions from `package.json` and a
> _fresh_ install, never from whatever happens to be in `node_modules`. An
> earlier draft of this document reported 68.2.0 and 23.16.1 for the two
> controllers below; both figures came from a stale `node_modules` and were
> several versions behind what `main` declared. Every substantive conclusion
> survived re-checking, but the framing of D0a and D0b did not.

**`transaction-controller`: pin to `^69.4.0`. DONE.** `main` already declared
`^69.1.0` with the lockfile at 69.3.0, so the 68→69 major and its only breaking
change (`getSavedGasFees` taking `TransactionMeta` instead of a chain ID) were
absorbed earlier, in `71f9467411`. This is therefore **not** a major bump and
required no source changes.

The reason to pin anyway is **deduplication, and it is load-bearing.** Both
`transaction-pay-controller@26.2.0` and `money-account-utils@1.1.0` list
`transaction-controller: ^69.4.0` as a _regular dependency_, not a peer. With the
root range at `^69.1.0` the lockfile stays at 69.3.0, so either package resolves
its **own nested 69.4.0 copy**. Pinning the root at `^69.4.0` is what lets D0b
and the money work share one copy.

**`transaction-pay-controller`: bump 26.0.1 → 26.2.0.** A **minor** bump — `main`
declares `^26.0.0` (since `540d2a65b1`), not 23.16.1. The justification still
holds: `TransactionData.atomic` is absent in 26.0.1 and present as
`atomic?: boolean` in 26.2.0 (verified by unpacking both tarballs), so D11's
atomic/non-atomic branch genuinely needs it. `PaymentOverride.MoneyAccount`
already exists in 26.0.1.

**Core packages are all published — no `core` changes are required.**
`@metamask/money-account-utils@1.1.0` (including the withdraw placeholder builder
and the zero-amount guards), `money-account-balance-service@^2.4.0` (exposing the
`getExchangeRate` and `getVaultApy` actions `useMoneyAccountBalance` needs),
`eth-money-keyring@^3.0.0` and `money-account-controller@^0.2.0` are all real
releases. No `@metamask-previews` override is needed anywhere. See "Optional core
change" below for the one thing still worth upstreaming.

**`bignumber.js`: do not bump; work around it.** The extension pins `^4.1.0`;
the current latest is 11.1.5, and `bignumber.js` is referenced in **111 files**
here. A 4→11 jump spans seven majors with behavioural changes to rounding,
exponential-notation thresholds and error handling — that is its own project
with its own risk profile, and bundling it into the money work would make both
harder to review. Work around it instead.

The precise gaps, verified at runtime against the installed copy:

| API mobile uses                                                   | Available in ext's 4.1.0? | Correct substitute    |
| ----------------------------------------------------------------- | ------------------------- | --------------------- |
| `shiftedBy(-n)`                                                   | **no** (`TypeError`)      | `dividedBy(10 ** n)`  |
| `multipliedBy(n)`                                                 | **no** (`TypeError`)      | `times(n)`            |
| `integerValue(mode)`                                              | **no** (`TypeError`)      | **`.round(0, mode)`** |
| `dp(n, mode)` / `decimalPlaces(n, mode)` — as a **rounding** call | **NO — SILENTLY WRONG**   | **`.round(n, mode)`** |
| `dividedBy` / `div` / `times`                                     | yes                       | —                     |
| `toNumber` / `toFixed` / `toString`                               | yes                       | —                     |
| `ROUND_UP` (0), `ROUND_HALF_UP` (4)                               | yes, same numeric values  | —                     |

> ### The `decimalPlaces` trap — read this before porting any amount maths
>
> In bignumber **4.x**, `decimalPlaces` / `dp` is a **getter**. It ignores its
> arguments and returns the _count_ of decimal places. It does not round and does
> not throw, so porting mobile's `.dp(n, mode)` or `.decimalPlaces(n, mode)`
> yields a silently wrong number rather than a loud failure.
>
> Verified at runtime against the installed 4.1.0:
>
> ```
> new BigNumber('0.0377356238130822').times(100).decimalPlaces(1, 4)  // 14   (want 3.8)
> new BigNumber('0.0377356238130822').times(100).round(1, 4)          // 3.8  ✓
> new BigNumber('1.0000005').decimalPlaces(0, BigNumber.ROUND_UP)     // 7    (want 2)
> new BigNumber('1.0000005').round(0, BigNumber.ROUND_UP).toFixed(0)  // 2    ✓
> ```
>
> **This matters most for D11 and D12.** Mobile's `toMusdBaseUnits` is
> `calcTokenValue(x, MUSD_DECIMALS).decimalPlaces(0, ROUND_UP).toFixed(0)`.
> Ported verbatim it returns a decimal-place count where a base-unit amount
> belongs — a garbage amount encoded into a real transaction. Use
> `.round(0, ROUND_UP)`.
>
> `shiftedBy` and `multipliedBy` are the safe kind of absent: they throw. This
> one does not, which is why it gets its own warning. An earlier draft of this
> document recommended `decimalPlaces(0, mode)` as the `integerValue()`
> substitute — that advice was wrong. Found by D8.

## Hook parity

Two mobile hooks have been specifically requested:
`app/components/UI/Money/hooks/useMoneyAccount.ts` and
`useMoneyAccountBalance`. Both are in scope, with full parity as the target.

### `useMoneyAccount` — the deposit and withdrawal hooks

Note there is no hook literally exported as `useMoneyAccount`; the file exports
**`useMoneyAccountDeposit`** and **`useMoneyAccountWithdrawal`** (plus the
`MoneyAccountDepositIntent` helpers `getMoneyAccountDepositIntent` /
`clearMoneyAccountDepositIntent`). Those two hooks are what is being asked for.
Mobile also has a separate `useMoneyAccountInfo`, whose own TODO says it will be
renamed `useMoneyAccount` once the deposit and withdrawal hooks are extracted —
so expect that name to move upstream at some point. Worth tracking so the
extension does not end up with a `useMoneyAccount` meaning the opposite of
mobile's.

Consequence for sequencing: these are **write** hooks. They build transaction
batches and navigate to a confirmation, so they need the keyring, the vault
builders, Pay integration and (for the deposit path) an upgraded money account.
They land in Tier 2 (deposit) and Tier 3 (withdrawal), not Tier 1. The requested
work therefore spans the whole plan rather than a single tier.

What each needs beyond the builders:

- `useMoneyAccountDeposit`: batch-id → deposit-intent map (`convert`/`addMusd`/
  `card`), an early-navigate-then-recover flow with failure toasts, a
  `waitForNextFrame` equivalent, `isUserRejectedError` handling, and
  `requiredAssets` set to mUSD. The intent map is module-level mutable state on
  mobile; the extension will need somewhere equivalent to keep it.
- `useMoneyAccountWithdrawal`: the withdraw placeholder batch plus recipient
  resolution from the selected EVM account.

### `useMoneyAccountBalance` — larger than "fetch a balance"

Mobile's hook returns **19** fields (an earlier draft said 18) and depends on more than the balance service.
Faithful parity requires all of:

| Mobile dependency                                                                          | Extension status                            |
| ------------------------------------------------------------------------------------------ | ------------------------------------------- |
| `@metamask/money-account-balance-service`                                                  | absent — add                                |
| `useQuery` from `@metamask/react-data-query`                                               | present                                     |
| `MoneyAccountBalanceServiceQueryKeys`                                                      | absent — port the query-key registry        |
| `useMoneyAccountInfo` → `selectPrimaryMoneyAccount`                                        | absent — see note below                     |
| `moneyBalance` Redux slice (persisted last-known balance, `isPersistedMoneyBalanceUsable`) | absent — port                               |
| `selectMoneyVaultApyRemoteConfig` (APY fallback + override flag)                           | absent — second remote flag                 |
| `moneyFormatUsd`                                                                           | absent — port                               |
| `invalidateMoneyAccountBalanceCaches`                                                      | absent — port                               |
| `selectCurrentCurrency`                                                                    | present                                     |
| `BigNumber.shiftedBy` / `multipliedBy`                                                     | **missing** — see the bignumber table above |

**Full parity is the target**, including the fields that are easy to
accidentally drop: balance provenance and degradation (`balanceSource:
'api' | 'rpc'`, `usedFallback`, `isBalanceDegraded`), the persisted
`lastKnownTotalFiatFormatted`, and the `apyDecimal` / `apyPercent` /
`apyPercentFormatted` triple with its override-beats-live-beats-fallback
precedence. All 18 returned fields should exist so consumers port unchanged.

Note on `primaryMoneyAccount`: mobile reads it from **MoneyAccountController**
state via `selectPrimaryMoneyAccount`. Tier 1 has no such controller, so keep the
hook's interface and supply the address by local derivation, swapping to the
controller at Tier 2. That preserves the contract for consumers either way.

The balance service itself (`@metamask/money-account-balance-service`) is in
scope for this work rather than assumed — it needs adding as a dependency and
wiring through `messenger-client-init` (Tier 1, step 3).

## Tier 0 — Adopt the shared constants

Replace `ui/pages/confirmations/constants/musd.ts` with
`@metamask/money-account-utils`, keeping only genuinely client-specific values
(icon assets) local — the same shape mobile's
`app/components/UI/Earn/constants/musd.ts` now has.

- Deps: `@metamask/money-account-utils`
- Fixes: branded `mUSD` casing (via `getTokenDisplaySymbol`), the correct token
  name, and the Mainnet-vs-Monad chain confusion
- Touches: the constants file, `money-account-deposit-info.tsx`,
  `money-account-deposit-button.tsx`
- Risk: low. Standalone value, and it settles the `transaction-controller`
  duplication question in isolation.

## Tier 1 — Read-only: address, balance, and the read hooks

1. **Vault config flag + parser.** The config is served by the same LaunchDarkly
   flag the mobile repo uses (`moneyAccountVaultConfig`), so it arrives through
   `RemoteFeatureFlagController` exactly as on mobile. Add a selector following
   `ui/selectors/ramps-feature-flags.ts` (`getRemoteFeatureFlags` +
   `createSelector`). Port the parser shape mobile now uses: validate the chain
   id and all four addresses into `Hex`, returning `undefined` when malformed,
   rather than asserting the raw flag with `as`. Mobile originally shipped the
   assertion and had to undo it; do not repeat that here. A second flag supplies
   the APY fallback/override that `useMoneyAccountBalance` reads.
2. **Address derivation.** `app/scripts/lib/money/get-money-account-address.ts`:
   read the primary HD mnemonic via
   `KeyringController:withKeyringUnsafe({ type: 'HD Key Tree' })`, then use
   `MoneyKeyring` purely as a deriver (not registered) to produce the single
   account. Mirrors mobile's `app/core/Engine/wallet-init/keyrings.ts`.
3. **Balance service.** New `money-account-balance-service-init.ts` plus a
   messenger under `app/scripts/messenger-client-init/messengers/`, delegating
   the `NetworkController` getters and
   `RemoteFeatureFlagController:getState`/`:stateChange`. Register in
   `controller-list.ts` and `messengers/index.ts`.
4. **Hooks.** `useMoneyAccountInfo` (feature flag + whether an account exists +
   the address) and `useMoneyAccountBalance` per the parity table above,
   including the `dividedBy` rewrite, the `moneyBalance` slice, the APY flag
   selector, and the query-key registry.
5. **A UI surface** consuming the balance hook.

- Deps: `@metamask/money-account-balance-service`,
  `@metamask/eth-money-keyring`
- Blocked on: the `moneyAccountVaultConfig` remote flag being served to the
  extension. Confirm ownership before starting — without it the service always
  rejects.
- Risk: moderate but self-contained. No signing surface.

## Tier 2 — Real vault deposit

1. **Register the Money keyring** in `app/scripts/wallet-init/keyrings.ts` using
   the V2 builder API, with the `getMnemonic` callback wiring mobile uses.
2. **Adopt `MoneyAccountController`** via `messenger-client-init`. Unblocked now
   that `keyring-controller` is 27.1.0 (the controller wants `^27.1.0`); the
   risky 25→27 bump previously identified as the main cost no longer applies.
3. **Pay integration — the bulk of the work.** Ext's `getStrategy` only returns
   `Relay`. Mobile drives money deposits through Pay callbacks with no extension
   equivalent: `getAmountData`, `getPaymentOverrideData`, and
   `updateMoneyAccountDepositAmount`. These need porting as extension-shaped
   callbacks calling `buildMoneyAccountDepositBatch`, **including zero-amount
   guards** — the builders now throw rather than encode a call that cannot
   succeed, and Pay pushes every amount change including a cleared field.
4. **Replace the developer button** with a real entry point that creates the
   placeholder batch via `buildMoneyAccountDepositPlaceholderBatch` and
   `addTransactionBatch`, with `requiredAssets` set to mUSD and `from` set to
   the money account.
5. **`useMoneyAccountDeposit`** as the hook-level equivalent.

Risk: high, concentrated in the Pay callback surface rather than the keyring.

### Account upgrade: explicitly out of scope, with a consequence

The extension will **not** implement money-account creation/upgrade for now.
That decision is workable, but it bounds what Tier 2 can deliver, so state it
plainly rather than discovering it during testing.

A deposit batch executes **from** the money account (approve mUSD, then teller
`deposit`), with Pay first moving funds from the user's own EVM account. Batch
execution from that address requires an EIP-7702 delegation, which is what
`@metamask/money-account-upgrade-controller` establishes on mobile. Without an
upgrade path, the extension can only deposit for money accounts that are
**already upgraded elsewhere**.

That is a realistic case rather than a dead end: the money account address is a
deterministic derivation of the same primary seed, so a user who has already
onboarded on mobile has a delegation live on Monad at the same address, and the
extension can transact against it with no upgrade flow of its own.

What this implies for Tier 2:

- Gate the deposit entry point on the delegation actually existing —
  `transaction-controller` already exposes `isAccountUpgradedToEIP7702`, which
  `addTransactionBatch` uses internally.
- Show a deliberate unsupported state when it does not, rather than letting the
  batch fail at submission. `addTransactionBatch` with `disableUpgrade: true`
  (what mobile passes) will not upgrade on our behalf.
- Treat "not upgraded" as the expected path for extension-first users, and
  decide separately whether they see nothing at all, or a read-only balance with
  deposits disabled.

The upgrade flow also has a known failure mode worth carrying into any future
scoping: it can sit in a stuck `PENDING` state that is silent in error
reporting, so a naive "assume upgraded" check is not safe.

## Tier 3 — Withdrawals and activity

- Withdrawals: the withdraw builders plus
  `buildMoneyAccountWithdrawPlaceholderBatch`, and
  `useMoneyAccountWithdrawal`.
- Activity: on mobile the Money transaction list is **local-only** — it shows
  only transactions made on that device, and incoming-transaction polling does
  not cover the money account. Any extension activity view inherits this, and
  will therefore show a different history than mobile for the same account.

## Recommended sequence

1. **`transaction-controller` 68 → 69.4.0** as a standalone change, verified on
   its own. Everything downstream depends on it and it is the one step whose
   blast radius is unrelated to money.
2. **Tier 0** — shared constants. Small, standalone bug fix.
3. **Tier 1** — vault config, address derivation, balance service,
   `useMoneyAccountBalance` at full parity. No signing surface.
4. **Tier 2** — `useMoneyAccountDeposit`, behind the delegation gate described
   above.
5. **Tier 3** — `useMoneyAccountWithdrawal`, then activity if wanted.

Both requested hooks are write hooks, so the request lands in steps 4 and 5.
Steps 1–3 are prerequisites rather than optional groundwork: there is no
shortcut to `useMoneyAccountDeposit` that skips the vault config, the address, or
the builders.

## Resolved decisions

- `transaction-controller` bumps to 69.4.0 (latest, and what
  `money-account-utils` requires) — no duplicated copy.
- `bignumber.js` stays at 4.1.0; work around the missing APIs per the table
  above.
- `useMoneyAccount` means `useMoneyAccountDeposit` + `useMoneyAccountWithdrawal`.
- `useMoneyAccountBalance` targets full parity, and the balance service is in
  scope for this work.
- The vault config is served via the same LaunchDarkly flag as mobile.
- Monad mainnet is user-visible: it is in `FEATURED_RPCS`
  (`shared/constants/network.ts`) with an Infura endpoint and a QuickNode
  failover. (`MONAD_TESTNET` appears separately in `TEST_NETWORK_IDS`, which is
  unrelated.)
- Money-account creation/upgrade is out of scope; see the Tier 2 note on the
  delegation gate.
- **A user whose money account has never been upgraded sees nothing** — not a
  disabled deposit button, and not a zero balance. The entire money surface is
  hidden. See D14 for the consequence: this pulls the delegation check forward
  out of Tier 2, because otherwise Tier 1 ships a balance row to users who have
  no money account.
- **Deposit intents are maintained** (`convert`, `addMusd`, `card`). These are
  not cosmetic — they select the Pay pipeline. See D12 for the six consumers.
  Note the extension has no Card product today, so `card` is plumbing-only until
  it ships.

## Open questions

None. Both remaining questions are now decided:

- **Extension-first users with no upgraded account see nothing** — confirmed as
  the intended launch state, not a placeholder. Consequence to hold in mind: the
  feature is invisible to everyone who has not onboarded on mobile, so Tier 2
  ships value only to users who already have a delegation. A pre-upgrade state
  would be a separate product decision.
- **The vault-config parser stays client-side** — see the section above.

Previously blocking, retained for context: Re-open if the "sees nothing" rule needs to differ between the
balance surface and the deposit entry point — D14 currently assumes one gate
covers both.

---

# Verification playbook

Read this before verifying anything. Written after two dependency-bump
deliverables where verification took far longer than the change.

## Use `corepack yarn` for everything, not just install

**Bare `yarn <script>` dies in this repo** with `Unrecognized or legacy
configuration settings found: approvedGitRepositories` and produces **no script
output at all**. That is a trap: a check like `yarn lint:tsc; echo $?` can look
like a clean pass when the script never ran. Prefix every yarn invocation with
`corepack`.

## Install

`corepack yarn install`. The postinstall step **dies on the same
`approvedGitRepositories` error**. This one is benign: resolve/fetch/link have
already completed. Confirm success by checking the installed version, not the
exit code.

Always verify the **installed** version, not just `package.json`:

```
node -e "console.log(require('./node_modules/<pkg>/package.json').version)"
```

Check `resolutions` too (there are ~145 of them) — an exact pin there silently
overrides a declared range, so a bump can appear to do nothing.

## Fast paths, in the order to reach for them

| Need                       | Command                                                     | Notes                                                                                                                                      |
| -------------------------- | ----------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------ |
| Lint the files you touched | **`yarn lint:changed`**                                     | The fast path. Use this, not `yarn lint:eslint` (whole repo, 6GB heap).                                                                    |
| Format                     | `yarn lint:format` (oxfmt) / `prettier --check` for JSON+MD | `yarn lint:fix` fixes broadly                                                                                                              |
| Typecheck                  | `yarn lint:tsc`                                             | Project-wide `tsc`, **~4 minutes**. There is no scoped variant — run it in the background and do something else. Do not poll it every 30s. |
| Targeted tests             | `yarn test:unit --testPathPattern='<regex>'`                | Scope by path. The full unit suite is thousands of suites — never run it for a scoped change.                                              |
| Lockfile dedupe            | `yarn dedupe --check`                                       | This is the CI gate (`lint:lockfile:dedupe`). Fix with `yarn dedupe '<pkg>' '<pkg>'` scoped to what it names.                              |
| Lockfile hosts/schemes     | `yarn lint:lockfile`                                        | Seconds.                                                                                                                                   |
| Messenger action types     | `yarn messenger-action-types:check`                         | Required if you touch messengers (D4, D10, D11). Regenerate with `messenger-action-types:generate`.                                        |

## Running e2e specs (learned 2026-08-05, the hard way)

1. **Build first:** `corepack yarn build:test` (production + LavaMoat — what CI
   uses). If it dies with `ENOENT ... development/.webpack/launch.js`, run
   `corepack yarn webpack:tsc` once: the postinstall that would generate the
   launcher is the same one the `approvedGitRepositories` error kills.
2. **Run one spec:** `corepack yarn test:e2e:single test/e2e/tests/<x>.spec.ts
--browser=chrome`.
3. **Remote flags in a spec** go through
   `withFixtures({ manifestFlags: { remoteFeatureFlags: {...} } })` — the
   harness rewrites `_flags` in the dist manifest per run (replace, not merge,
   so a stale `.manifest-overrides.json` build cannot leak into a test).
   Background code honours them via `applyManifestFlagOverrides`
   (`3f14e87988`).
4. **A hang on the fox spinner with `.controller-loaded` timeout means the
   background is dead.** Two causes found so far, both invisible in dev builds
   and unit tests: a module that cannot load in the production LavaMoat build
   (missing policy entries — regenerate with `webpack:lavamoat:policy:mv3`
   / `:mv2`), and Node-side harness crashes (a shared module importing
   `webextension-polyfill` at top level). Discriminate with
   `corepack yarn build:test:dev` — if e2e passes on the dev build and hangs on
   the production one, it is LavaMoat policy.
5. **Adding any runtime dependency requires regenerating the LavaMoat
   policies**, or every production build's background dies at module load while
   everything else stays green. CI validates all build types.

## Jest gotchas

- **`it.each` / `describe.each` do not typecheck under `ui/`.** Mocha's globals
  win over jest's in that tsconfig, so table-driven tests fail `lint:tsc` with
  `Property 'each' does not exist on type 'TestFunction' | 'SuiteFunction'` plus
  implicit-`any` on the callback params — **while passing at runtime**. Write
  `for...of` over a typed `[string, unknown][]` array instead.
- Corollary, and the reason the above matters: **a green jest run does not mean
  the test file typechecks.** `lint:changed` will not catch it either. Only
  `lint:tsc` will. Run it before claiming a test file is clean.
- **Positive-control your `lint:tsc` pass.** Because a bare-`yarn` no-run and a
  genuine clean run both look like silence, append a deliberate type error to one
  of your files (`export const __control: number = 'nope';`), confirm `lint:tsc`
  exits non-zero and names that line, then revert it. Cheap, and it converts
  "no output" from an assumption into evidence.
- **Do not pass `--silent`.** It suppresses the `Tests:` / `Test Suites:` summary
  lines, leaving you unable to state what passed. This wasted real time.
- A **lint-baseline analyser runs after jest** and prints its own
  `SUMMARY / Files analyzed / Violations` block. `tail` shows that, not jest's
  result. Grep for `Tests:` and `Test Suites:` instead of tailing.
- Report the actual counts. If you did not run a suite, say so — do not imply
  coverage you do not have.

## What "verified" means for a scoped change

Typecheck (positive-controlled) + `lint:changed` + **`lint:format`** + the test
suites whose paths your change touches + any gate specific to what you edited
(dedupe for lockfiles, messenger action types for messengers). That is enough. Full-suite and e2e runs are not expected
and are not a good use of time.

# Work breakdown

Each deliverable below is independently assignable. `Depends on` is a hard
ordering constraint; anything without a shared dependency can run in parallel.
Paths marked _(new)_ do not exist yet.

Two rules that apply to every deliverable:

- **Never use `BigNumber.shiftedBy` or `multipliedBy`** — see the bignumber table
  above. Use `dividedBy(10 ** n)` and `times(n)`.
- **Do not invent a shared amount-conversion helper that unifies rounding
  direction.** See D11 for why.

## D0a — Pin `transaction-controller` to `^69.4.0` — **DONE**

Landed on branch `bump-transaction-controller-69.4.0` as `f3c6c37b60`
(`package.json` + `yarn.lock` only, no source changes).

- **Scope:** dependency pin for deduplication. No source changes were needed —
  the 68→69 major had already been absorbed on `main`.
- **What actually needed doing:** declaring `^69.4.0` split the locked 69.x group
  in two, and 69.4.0's transitive bumps split three more (`core-backend`,
  `gas-fee-controller`, `polling-controller`). A scoped `yarn dedupe` collapsed
  each back to one copy.
- **Acceptance (met):** typecheck clean; 499 transaction/confirmation suites
  (4000 tests) and 227 controller-init/feature-flag/gas/swaps/bridge suites
  (2359 tests) pass; `yarn dedupe --check` reports nothing to dedupe; installed
  version verified at 69.4.0.
- **Known residual duplicates:** `transaction-controller` 64.4.0 / 65.4.0 /
  68.4.0 persist for seven unrelated controllers across major boundaries. These
  are byte-identical to `main` — the pin adds no new copy of
  `transaction-controller`. It does add one new copy of
  `remote-feature-flag-controller` (5.0.0 alongside the existing 4.x), which
  69.4.0 requires and which cannot be deduped across the major boundary.
  **Relevant later:** D2 and D4 both touch `RemoteFeatureFlagController`, so
  confirm the extension's own 4.x instance is the one they bind to.
- **Useful CI gate to know about:** `lint:lockfile:dedupe` runs
  `yarn dedupe --check`.

## D0b — Bump `transaction-pay-controller` to 26.2.0

- **Scope:** dependency bump only, 26.0.1 → 26.2.0. A **minor** bump, not three
  majors — expect this to be small.
- **Why:** `TransactionData.atomic` does not exist in 26.0.1, and D11's
  atomic/non-atomic branch cannot be written without it.
- **Acceptance:** existing Pay suites and typecheck pass; `transactionData.atomic`
  and `PaymentOverride.MoneyAccount` both resolve;
  `transaction-pay-controller-init.ts` still compiles against the new
  `getStrategy` / `getDelegationTransaction` signatures.
- **Depends on:** D0a — for deduplication, not correctness. **Independence
  confirmed:** 26.2.0 declares `peerDependencies: {}`, so it has no peer
  constraint on `transaction-controller` at all; it lists `^69.4.0` as a plain
  dependency. Nothing hard-fails at any root version. But with the root below
  69.4.0 Yarn installs a nested copy just for Pay, which is why D0a lands first.
  These are two clean separate landings.

## D1 — Adopt shared mUSD constants

- **Scope:** delete `ui/pages/confirmations/constants/musd.ts` and source the
  values from `@metamask/money-account-utils`, keeping only client-specific
  presentation (icon assets) local. Mirror mobile's
  `app/components/UI/Earn/constants/musd.ts`.
- **Files:** `ui/pages/confirmations/constants/musd.ts`,
  `money-account-deposit-info.tsx`, `money-account-deposit-button.tsx`,
  `package.json`.
- **Acceptance:** the branded symbol is `'mUSD'` and the name
  `'MetaMask USD'`; no local hardcoded mUSD address remains; existing
  confirmation tests pass. Note the deposit harness currently points at Mainnet
  while the real account is Monad-only — decide explicitly whether the dev
  harness keeps its Mainnet target or moves to Monad, and say which in the PR.
- **Depends on:** D0a (avoids a duplicate `transaction-controller`).

## D2 — Vault config + APY remote-flag selectors

- **Scope:** three selectors over `getRemoteFeatureFlags`, plus a **parser** for
  the vault config that validates the chain id and all four addresses into `Hex`
  and returns `undefined` if any is missing or malformed. Follow
  `ui/selectors/ramps-feature-flags.ts` for the selector shape and mobile's
  `parseMoneyAccountVaultConfig` for the parser. The three flags are the vault
  config, the APY fallback/override, and the deposit quote pipeline (which D12's
  intent handling needs).
- **Files:** `ui/selectors/money-account-feature-flags.ts` _(new)_ + test. The
  parser itself now lives in `shared/lib/money/vault-config.ts` (moved there by
  D15, so the background can read the money chain from it).
- **Interface:** `parseMoneyAccountVaultConfig(raw: unknown): MoneyAccountVaultConfig | undefined`
  where every field is `Hex`; `selectMoneyAccountVaultConfig`;
  `selectMoneyVaultApyRemoteConfig` returning `{ vaultApyFallback, vaultApyOverride }`;
  `selectMoneyAccountDepositQuotePipelineEnabled`.
- **Acceptance:** unit tests covering a well-formed config, a checksummed address
  passing through unchanged, and rejection for each of: non-hex chain id, missing
  address, truncated address, bad checksum, non-string field, and a non-object
  flag. **Do not** assert the raw flag with `as` — mobile shipped that and had to
  undo it.
- **Depends on:** nothing.

## D3 — Money account address derivation

- **Scope:** derive the money account address from the primary HD seed and expose
  it to the UI. `MoneyKeyring` is used purely as a deriver and is **not**
  registered as a keyring.
- **Files:** `app/scripts/lib/money/get-money-account-address.ts` _(new)_ +
  test; a `getMoneyAccountAddress` entry on the background API.
- **Interface:** `deriveMoneyAccountAddress(messenger): Promise<Hex>`.
- **Implementation note:** read the mnemonic via
  `KeyringController:withKeyringUnsafe({ type: 'HD Key Tree' })`, then
  `MoneyKeyring.addAccounts(1)`. Mirrors mobile's
  `app/core/Engine/wallet-init/keyrings.ts`.
- **Acceptance:** returns a stable address for a fixed test mnemonic; the same
  seed yields the same address mobile derives (assert against a known vector, not
  just self-consistency). Must not require the password — asserts-unlocked only.
- **Depends on:** nothing (`@metamask/eth-money-keyring` is a new dep).

## D4 — Balance service init + messenger

- **Scope:** register `@metamask/money-account-balance-service` in the background.
- **Files:** `app/scripts/messenger-client-init/money-account-balance-service-init.ts`
  _(new)_,
  `app/scripts/messenger-client-init/messengers/money-account-balance-service-messenger.ts`
  _(new)_, edits to `controller-list.ts` and `messengers/index.ts`.
- **Implementation note:** the messenger must delegate the `NetworkController`
  getters and `RemoteFeatureFlagController:getState` / `:stateChange`. The
  service is not persisted (`persistedStateKey: null`) and needs `.init()`.
- **Acceptance:** background boots with the service registered; its actions are
  callable over the messenger; a snapshot/unit test covers the delegated action
  list. Expect `VaultConfigNotAvailableError` until the flag is served — that is
  correct behaviour, not a failure.
- **Depends on:** D0a.

## D4b — Register `MoneyAccountApiDataService`

Not in the original plan. D4 delegated only the `NetworkController` getters and
the two `RemoteFeatureFlagController` entries, per its ticket — but the balance
service's `AllowedActions` also includes
`MoneyAccountApiDataServiceFetchPositionsAction` (verified in
`money-account-balance-service.d.cts:41`), and mobile delegates it.

**Why this matters:** the service's default policy is **RPC primary with Money
API fallback**. Without `MoneyAccountApiDataService` registered, the fallback
calls an unregistered action and **throws instead of falling back**.
`fetchBalanceWithFallback` works on the RPC primary path, so this is invisible
until the RPC path fails — i.e. exactly when the fallback is supposed to save
you.

- **Scope:** register `@metamask/money-account-api-data-service` (already
  installed as a transitive of the balance service at 0.4.0) the same way D4
  registered the balance service, and add `MoneyAccountApiDataService:fetchPositions`
  to the balance-service messenger's delegated actions.
- **Acceptance:** the delegated action list assertion in D4's messenger test is
  updated to include it; the API fallback path is reachable rather than throwing.
- **Depends on:** D4.
- **Blocks D8's full parity** — `balanceSource: 'api' | 'rpc'`, `usedFallback`
  and `isBalanceDegraded` are all meaningless if the API source can never be
  reached.

## D5 — `moneyBalance` Redux slice

- **Scope:** persist the last successfully fetched balance so it can be shown
  when the live balance is unavailable, including across restarts.
- **Files:** slice + selectors + test _(new)_.
- **Interface:** `setLastKnownMoneyBalance({ address, value, currency, updatedAt })`,
  `selectLastKnownMoneyBalance`,
  `isPersistedMoneyBalanceUsable(persisted, { address, currency })`.
- **Acceptance:** `isPersistedMoneyBalanceUsable` returns false when the address
  or currency differs from what is in view — showing another account's balance is
  the failure mode this exists to prevent.
- **Depends on:** nothing.
- **DONE** — `23af71777d` on `money-balance-slice`, at `ui/ducks/money-balance/`
  (layout copied from `ui/ducks/rewards`), registered in `ui/ducks/index.js`.
- **Cross-restart persistence is NOT achievable in the UI layer here.**
  `ui/store/store.ts:70` says so outright: the redux tree is not persisted for
  rehydration, and anything that must survive lives in background state. There is
  no `redux-persist` in this repo. Mobile gets restart-survival free by omitting
  `moneyBalance` from its persist blacklist; there is no equivalent.
  **Consequences:** the duck survives navigation within a UI instance and nothing
  more — so **D9 does not get restart-surviving fallback for free**, and **D10
  must mirror the value into controller state** (`MoneyAccountController`, or
  `AppStateController` if D10 slips) to get parity with mobile. Only
  `selectLastKnownMoneyBalance`'s body changes when that happens; the interface is
  unaffected.
- **No staleness window, matching mobile.** Mobile stores `updatedAt` and never
  reads it; the guard checks address + currency only. Matched deliberately, with a
  test asserting age is irrelevant — the alternative to an old labelled figure is
  showing nothing. Adding a window is one clause, but it would not be parity.

## D6 — Money utils: query keys, cache invalidation, fiat formatting

- **Scope:** the small support modules `useMoneyAccountBalance` imports.
- **Files:** query-key registry, `invalidateMoneyAccountBalanceCaches`,
  `moneyFormatUsd` _(all new)_ + tests.
- **Acceptance:** `moneyFormatUsd` output matches mobile's for a shared set of
  inputs including zero, sub-cent, and large values.
- **Depends on:** D4 (query keys name the service's actions).

## D7 — `useMoneyAccountInfo`

- **Scope:** read hook returning
  `{ isMoneyAccountFeatureEnabled, hasMoneyAccount, primaryMoneyAccount }`.
- **Acceptance:** feature-flag gating works; `hasMoneyAccount` is false when no
  address resolves.
- **Note:** in Tier 1 the address comes from D3, not from a controller. Keep the
  return shape identical to mobile's so D8 and later consumers port unchanged.
  Expect mobile to rename this hook `useMoneyAccount` eventually.
- **Depends on:** D2, D3.
- **DONE** — `b382cb7df6` on `money-account-info`. `ui/hooks/money/useMoneyAccountInfo.ts`.
  `hasMoneyAccount` comes from D14's gate via the `getMoneyAccountAvailability`
  background method (a `useQuery` on the app query client), **not** from D3
  directly — the gate already folds in the flag, the address and the delegation,
  so the hook re-derives nothing. `primaryMoneyAccount` is `{ address }` until
  D10 can widen it to the `InternalAccount`; mobile's consumers only read
  `?.address`, so that ports unchanged.
- **Pending state:** reported as absent (`hasMoneyAccount: false`, no address),
  with no `isLoading` field exposed. Under the "sees nothing" rule there is no
  third state to render, and a loading flag would only invite a consumer to
  invent one and flash the surface on.
- `isMoneyAccountFeatureEnabled` comes from a new
  `selectMoneyAccountFeatureEnabled` calling the same `isMoneyAccountEnabled`
  parser the gate calls, over the same controller state — one interpretation of
  the flag, so UI and gate cannot disagree. It is also required conjunctively in
  the hook, because a disabled `useQuery` keeps serving its last cached answer.
- **`MoneyAccountAvailability` moved** to `shared/lib/money/availability.ts`
  (re-exported from D14's module). `import-x/no-restricted-paths` forbids the UI
  importing from `app/scripts`, even `import type`.

## D8 — `useMoneyAccountBalance` (full parity)

- **Scope:** the full 19-field hook per the parity table above.
- **DONE** — `e46462f2b3` on `money-account-balance-hook`. Field set verified
  identical to mobile's `UseMoneyAccountBalanceResult`. Three intentional
  departures: `.round()` instead of the broken `decimalPlaces` (see the bignumber
  callout); `refetchBalance` typed `() => Promise<void>` because mobile's declared
  `() => void` is wrong (its implementation returns a promise and its own test
  awaits it — the wider type is assignable everywhere the narrower was); and the
  query key uses `address ?? ''` because `QueryKey` here is `[string, ...Json[]]`
  and the query is disabled in that state anyway.
- **Known parity gap:** a non-numeric `totalBalance` from the service would
  _throw_ here (bignumber 4 constructor) where mobile's 9.x yields NaN and
  degrades to an empty string. Deliberately not guarded — the response is
  `Struct`-validated by the service, so it is hypothetical, and adding a parse
  step mobile does not have would be its own divergence.
- **Both queries are gated on an address**, not just the balance query. Mobile
  runs the APY query unconditionally, which is safe there because the hook only
  mounts inside an already-gated surface; here it is a general-purpose
  `ui/hooks/` export. Consequence: with no account `shouldUseFallback` is true so
  `apyDecimal` reports the fallback — moot for a caller rendering nothing, but a
  pre-upgrade APY teaser would need a deliberate clause rather than relying on
  this.
- `getLiveVedaVaultExchangeRate` deferred to **D13**: it is not a returned field,
  its only consumer is the withdrawal flow, and it needs the extension's
  different `messengerCall` arg-nesting whose only real proof is a working
  withdrawal.
- **Acceptance:** all 18 fields present with mobile's semantics, specifically:
  - `tokenTotal` / `withdrawableMusd` are `undefined` while loading or on error,
    so callers can distinguish "unknown" from a genuine zero
  - provenance and degradation surfaced (`balanceSource`, `usedFallback`,
    `isBalanceDegraded`)
  - APY precedence is override → live → fallback, and fallback is **not** shown
    during first load with no cache (avoids a flicker)
  - `lastKnownTotalFiatFormatted` only when address and currency still match.
    Note per D5 that this survives navigation but **not** a restart until D10
    mirrors it into controller state — do not write an acceptance test implying
    otherwise.
  - conversions use `dividedBy` / `times`, never `shiftedBy` / `multipliedBy`
- **Depends on:** D2, D4, **D4b**, D5, D6, D7.

## D9 — Balance UI surface

- **Scope:** one component consuming D8. Deliberately thin; placement is a
  product decision.
- **Acceptance:** renders nothing when no address or no balance; shows the
  last-known value when the live balance is unavailable.
- **Depends on:** D8.
- **DONE** — `5abd2af95a` plus `d318b6b644`. Component at
  `ui/components/app/money/money-account-balance/`, **wired into**
  `ui/components/multichain/account-overview/account-overview-layout.tsx` between
  the hero balance and the carousel, mirroring mobile's position on wallet home.
  That layout is shared by the eth / non-evm / unknown overviews, which is right:
  the money account is a property of the wallet (a derivation of the primary
  seed), not of the selected account.
  The last-known figure is shown with an explicit "Last known balance" label
  rather than bare.
  `d318b6b644` adds privacy-mode support, which the original D9 acceptance
  criteria did not name — every other balance on that surface is wrapped in
  `SensitiveText` and gated on `privacyMode`, so without it turning balances off
  left the Money row as the one figure on screen. Note `SensitiveText` is a
  **legacy** component-library component taking that library's `TextVariant`, a
  different enum from the design-system-react one, and `getPreferences` lives in
  `shared/lib/selectors/preferences`, not the `ui/selectors` barrel.
- **Deliberately not included** (mobile's card has them; none are D9's scope):
  APY row, deposit/withdraw buttons, error/retry, and the empty-vs-unavailable
  distinction.

## D10 — Money keyring registration + `MoneyAccountController`

- **Scope:** register the Money keyring via the V2 builder API and adopt
  `MoneyAccountController`.
- **Files:** `app/scripts/wallet-init/keyrings.ts`, a controller init under
  `messenger-client-init/`.
- **Acceptance:** the money account appears as a real keyring account; D7 can
  switch from D3's derivation to `selectPrimaryMoneyAccount` with no change to
  its return shape.
- **Depends on:** D0a, D3. Unblocked by `keyring-controller` 27.1.0.

## D10 — status: **DONE**, with one decision outstanding

`5cc34626c8` on `d10-money-keyring-controller`. Dep pinned **exactly `0.3.3`**,
not mobile's declared `^0.2.0`: 0.2.0 wants `keyring-controller@^25.4.0`, which
root 27.1.0 does not satisfy, so it would nest a **second `KeyringController`** —
two `KeyringTypes` enums and two `isKeyringNotFoundError` implementations, which
the controller's create-on-miss path depends on. One residual nested
`eth-money-keyring@2.0.4` remains, inert (the controller imports only
`MONEY_DERIVATION_PATH`, byte-identical to root 3.0.0). Unreleased 0.4.0 would
collapse it.

**It writes to the vault.** `MoneyAccountController.init()` calls
`KeyringController:addNewKeyring`, appending a Money keyring when the flag is on
and the wallet is unlocked. No existing keyring's serialisation or registration
changed, and no migration was needed — `KeyringController#restoreKeyring` parks an
unrecognised entry in `#unsupportedKeyrings` and re-persists it untouched, so a
vault with a Money keyring is non-destructive on a build lacking the builder.

**The account is not selectable and not in the account list**, and that required
no work here: `accounts-controller` 39.0.5 excludes money keyrings in both
keyring-sync paths and from `isNormalKeyringType`. Mobile relies on the same
package-level exclusion and does no filtering of its own (checked, not assumed).

**DECIDED — creation is NOT gated on the delegation existing.** A flag-on
extension-first user therefore gets a vault write for an account they cannot yet
see or use. Accepted deliberately: gating would mean the same seed yields a money
account on mobile and none here, and a future upgrade flow would face a
chicken-and-egg. The account existing is the precondition for ever upgrading it.

- **D7's widening: done.** `ui/selectors/money-account.ts` adds
  `selectPrimaryMoneyAccount`, resolving "primary" as the first `HD Key Tree`
  keyring exactly as the controller's own `#getPrimaryEntropySource` does, so UI
  and controller cannot disagree about the entropy source. **No caller changed.**
  `MoneyAccount` is now `{ address: Hex } & Partial<Omit<PrimaryMoneyAccount,
'address'>>` — the `Partial` is load-bearing, because the gate answers before the
  controller has necessarily created the keyring. `hasMoneyAccount` still comes
  from the availability gate alone.
- **D5's mirroring: NOT done, and not possible in that home.**
  `MoneyAccountController`'s state is `{ moneyAccounts }` with its metadata fixed
  inside the published package — a client cannot add a field to another package's
  controller state, and forcing a balance into `moneyAccounts` would corrupt the
  account map. `AppStateController` is the only viable extension-side home. **So
  D9 still has no restart-surviving fallback.** Needs its own ticket.
- **Correctness fix beyond the brief:** the creation guard asks
  `controller.getMoneyAccount()` rather than counting state entries (what mobile
  does). After a vault restore the restored SRP gets a new keyring metadata id, so
  an entry recorded against the old id is not this wallet's money account —
  counting would find one, skip creation, and leave that user permanently without
  an account. **Mobile has the same latent flaw.**
- **Follow-up not done:** `clearState()` on `resetWallet`. The guard makes
  staleness self-correcting and the leftover record is inert, so it was left rather
  than touching the reset path.
- **Cross-client derivation CONFIRMED by manual run (2026-08-04).** With the
  standard e2e SRP (`spread raise short crane omit tent fringe mandate neglect
detail suspect cradle`), the extension and the **mobile client** both derive
  `0xd5fe9b0579443e7025cf3309ba420977710e7183`. The account object carries
  `derivationPath: m/44'/4392018'/0'/0` and `exportable: false`. This was
  previously supported only by our own code agreeing with itself (MoneyKeyring
  directly, a raw `ethereum-cryptography` HDKey derivation, and a shasum match on
  the keyring dist); mobile's runtime is the independent confirmation.
- **Note on the state shape:** `moneyAccounts` is keyed by the **account id**, not
  the entropy source (an earlier note here said otherwise).
  `selectPrimaryMoneyAccount` therefore scans values matching
  `options.entropy.id` against the primary HD keyring's `metadata.id` rather than
  looking up by key. `scopes` is `['eip155:0']` — the all-EVM wildcard, so the
  account object itself carries no chain restriction; that lives entirely in the
  vault config and the availability gate.
- **Verified by manual run (2026-08-04/05):**
  - The account is **absent from the account list**.
  - Lock / unlock / browser restart all fine; existing accounts unaffected.
  - The **Money keyring is genuinely in the vault**:
    `keyrings` contains `{ type: 'Money Keyring', accounts: ['0xd5fe…7183'] }`.
    This matters beyond D10 — the account needs a real keyring to sign, so
    without it D11/D12's deposit flow would have failed at signing time while
    looking healthy up to that point.
  - **Loading the same profile with the flag off leaves the keyring intact**, as
    intended by registering the builder unconditionally. (A first attempt at this
    used a profile with no money account and was uninformative — when re-testing,
    always use a profile that already has one.)
- **STILL NOT VERIFIED:** that a **vault restore into a fresh profile** creates a
  money account. A same-profile re-import returned the identical account id _and_
  `options.entropy.id`, so it was reading the pre-existing record rather than a
  newly created one — keyring `metadata.id` is a fresh `ulid()` per creation, so a
  genuinely recreated account would show a new entropy id. The guard that D10 added
  for this path (asking `getMoneyAccount()` rather than counting entries, which is
  what mobile gets wrong) is therefore covered only by unit tests.
- **Also unverified:** the balance row itself (D9), which needs an SRP with a live
  Monad delegation.

## D11 — Pay money-account strategy + callbacks

The largest and highest-risk deliverable. Ext's `getStrategy` currently returns
`TransactionPayStrategy.Relay` unconditionally.

- **Scope:** port mobile's three Pay integration points as extension-shaped
  callbacks: `getAmountData`, `getPaymentOverrideData`, and the
  deposit-amount commit path.
- **Files:** `app/scripts/messenger-client-init/transaction-pay-controller-init.ts`,
  plus new callback modules.
- **Requirements that are easy to get wrong:**
  - **Rounding direction differs per path and this is deliberate.** Deposit
    conversions use `ROUND_UP` (never short the user); the **withdraw** path in
    `paymentoverride-callback.ts` uses `ROUND_DOWN`, because `ROUND_UP` was
    requesting more atomic units than the withdrawable balance on Max. Do **not**
    unify these behind one helper. Mobile has four conversion sites and they have
    already diverged on purpose.
  - **Zero-amount guards are mandatory.** The builders now throw on a zero
    amount, and Pay pushes every amount change including a cleared field. Every
    call site must no-op first (`[]`, `{ updates: [] }`, `{ calls: [] }`, or
    `false`) — see mobile for the exact per-site return.
  - **Atomic vs non-atomic.** `transactionData.atomic !== false` selects between
    returning raw calls (non-atomic: submitted as a sponsored batch after Relay
    completion, no fresh delegation wrap) and wrapping them in a single
    delegation transaction via `getDelegationTransaction`. The extension already
    has `app/scripts/lib/transaction/delegation`.
  - **Deposit intent map.** Build the batch-id → intent map and its accessors
    here, not in D12. The Pay pipeline selection reads it (see D12's table), so
    it is a dependency of this deliverable even though D12 is what populates it.
- **Acceptance:** unit tests per callback covering the happy path, each early
  return, the zero-amount no-op, and **both** the atomic and non-atomic branches;
  assert the decoded calldata rather than that a mock was called.
- **Depends on:** D0a, **D0b**, D1, D2, D10.

## D11 — status: **DONE** (2026-08-05)

All in `app/scripts/lib/money/pay/` (callbacks + `pay-context.ts` +
`update-deposit-amount.ts`), wired in `transaction-pay-controller-init.ts`,
with the init messenger extended (six new delegated actions). 47 tests
across 7 suites; acceptance criteria met — calldata asserted by **decoding**
real builder output (the builders run for real against a stubbed EIP-1193
provider answering `previewDeposit`/`getRate`).

Port decisions and divergences from mobile, all deliberate:

- **Mobile passes no `getStrategy`; the extension keeps its Relay-only one.**
  Removing it would switch every Pay flow to flag-driven strategy routing —
  its own change with unrelated blast radius. Money flows work under Relay.
- **Sources:** mobile hand-rolls the batch builders in
  `app/components/UI/Money/utils/moneyAccountTransactions.ts`; the extension
  uses `@metamask/money-account-utils` (same encoding, but the package
  builders **throw on zero**, hence explicit zero-guards at every call site
  that mobile does not have).
- **The chain comes from the vault config** (mobile hardcodes Monad in the
  payment-override path); `getAmountData` and the commit path use the
  transaction's own chain, as mobile does.
- **Rounding:** deposits `ROUND_UP`, withdraw override `ROUND_DOWN`, via
  bignumber 4's `.round(0, mode)` — the `toMusdBaseUnits` helper in
  `payment-override-callback.ts` is deliberately not shared across flows.
- **The commit path takes a transaction id**, not a `TransactionMeta`
  (mobile's hook passes the meta in-process; over the background API an id is
  the honest input and the meta is read fresh from controller state). Exposed
  as `updateMoneyAccountDepositAmount` on the Pay init api.
- **Intent map is UI-side** (`ui/helpers/money/deposit-intent.ts`): all of
  mobile's consumers are hooks. Unlike mobile it exports a setter, because
  the initiator (D12) lives in a different module here. Not persisted across
  UI reloads; mobile's fallback derivation from the transaction's payment
  method covers that and should be ported with D12's toast/status work.
- `TransactionController:getState` narrowing fails in the messenger union —
  cast at the call site, mirroring `lib/transaction/hooks`.

## D12 — `useMoneyAccountDeposit` + real entry point

- **Scope:** replace the dev-only transfer harness with a real placeholder batch,
  and add the hook.
- **Requirements:** `buildMoneyAccountDepositPlaceholderBatch` +
  `addTransactionBatch` with `requiredAssets` set to mUSD and `from` set to the
  money account; early navigation with recovery on failure; user-rejection
  handling that does not show an error toast.
- **Availability:** the entry point must be hidden entirely when the money
  account is unavailable — use D14's gate. Do not render a disabled button.
- **Deposit intents are in scope.** The batch-id → intent map is not local to
  this hook: mobile has **six** consumers, and one of them selects the Pay
  pipeline, so the lookup must be reachable from the Pay layer and the
  confirmation UI, not just the initiating hook.

  | Consumer                         | What the intent decides                                                                                                                                                   |
  | -------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
  | `useUpdateTransactionPayAmount`  | **Which Pay pipeline runs** — the quote-pipeline optimisation applies only to generic/`convert` with no fiat payment method; `addMusd` and `card` keep the older pipeline |
  | `useMoneyAccount` (initiation)   | Which confirmation loader — prefill vs advanced custom amount                                                                                                             |
  | `useMoneyAccount` (failure path) | Failure toast copy                                                                                                                                                        |
  | `useMoneyTransactionStatus`      | Success/pending toast intent, with a fallback when unset                                                                                                                  |
  | `custom-amount-info`             | `addMusd` prefill auto-submit behaviour                                                                                                                                   |
  | `useTransactionCustomAmount`     | `addMusd` prefill percentage / max behaviour                                                                                                                              |

  Two implications: this pulls in the deposit-quote-pipeline flag (D2), and
  because intents gate the pipeline, **D11 needs the intent lookup to exist**, so
  build the map and its accessors as part of D11 rather than discovering the
  dependency here.

  Only generic, `convert` and `addMusd` have real entry points in the extension.
  `card` should be plumbed through so behaviour matches mobile and nothing needs
  rewriting later, but it is unreachable until the Card ships here — do not build
  the multi-stage fiat path for it now.

- **Depends on:** D11, D14.

## D13 — `useMoneyAccountWithdrawal`

- **Scope:** `buildMoneyAccountWithdrawPlaceholderBatch` + recipient resolution
  from the selected EVM account, plus the hook.
- **Availability:** same gate as D12 — hidden entirely when unavailable.
- **Depends on:** D11, D12, D14 (shares the confirmation and Pay plumbing).

## D14 — Money account availability gate

Required by the decision that an un-upgraded user **sees nothing**. Without it,
Tier 1 would ship a "Money $0.00" row to every user who has never onboarded on
mobile, which is precisely the outcome that decision rules out. That makes this a
Tier 1 deliverable, not a Tier 2 one — the original plan had the delegation check
buried in D12.

- **Scope:** a single answer to "does this user have a usable money account?",
  consumed by both the balance surface and the deposit/withdraw entry points.
- **Inputs:** the `moneyEnableMoneyAccount` feature flag, a derived address
  (D3), and whether that address has an EIP-7702 delegation on Monad.
  `transaction-controller` exposes `isAccountUpgradedToEIP7702`, which
  `addTransactionBatch` already uses internally.
- **Interface:** one boolean surfaced through `useMoneyAccountInfo` (D7) so
  callers do not each re-derive it. **Note:** the `MoneyAccountAvailability`
  union now lives in `shared/lib/money/availability.ts`, re-exported from the
  background module — D7 had to move it because `import-x/no-restricted-paths`
  forbids a UI file importing anything under `app/scripts`, even `import type`. Suggest extending that hook's return rather
  than adding a parallel one, since it already owns "does an account exist".
- **Caching:** the delegation state is an on-chain read, so it must be resolved
  in the background and cached — not fetched per render. It changes rarely
  (once, when the user upgrades elsewhere), so a long-lived cache with
  invalidation on unlock is appropriate.
- **Acceptance:** with a derived address that has no delegation, the balance
  surface and both entry points render nothing at all — assert absence, not a
  disabled state. With a delegation present, everything appears. Flag off hides
  everything regardless.
- **Depends on:** D0a, D3.
- **DONE** — `e5f5c0feab` on `money-availability-gate`.
  `MoneyAccountAvailabilityService` with one method returning a discriminated
  union `{ isAvailable: true; address } | { isAvailable: false }` — the address
  rides along only when available, so D7 needs no second round trip.
- **`isAccountUpgradedToEIP7702` is NOT reachable** — the package `exports` map
  permits only `.`, and the index does not re-export it (nor `getDelegationAddress`).
  The plan was wrong to name it.
  The gate instead performs the read those helpers perform:
  `findNetworkClientIdByChainId(MONAD)` → `getNetworkClientById` →
  `eth_getCode`, then `code.length === 48 && code.startsWith('0xef0100')`. That is
  the same logic as `transaction-controller`'s internal `getDelegationAddress` and
  as the pre-check mobile's upgrade controller runs before submitting an
  authorization.
  `TransactionController:isAtomicBatchSupported` was considered and rejected: it
  filters on `getEIP7702SupportedChains` first (Monad absent from that flag ⇒ the
  surface hides for **every** user), its `isSupported` reflects the signed-contract
  allowlist rather than whether this user upgraded, and it throws when
  `publicKeyEIP7702` is unset. All silent false-negatives for a visibility gate.
  Do not "fix" this back to the controller helper.
- **Caching:** flag read every call (synchronous, can flip on a remote-flag
  refresh, and checked first so flag-off costs no seed access or RPC); address and
  delegation cached as **promises** until `KeyringController:unlock`, so concurrent
  callers share one in-flight read; failures deliberately not cached.
- ~~**Known limitation:** the money chain is hardcoded to `CHAIN_IDS.MONAD`~~
  **Fixed by D15**: the parser moved to `shared/lib/money/vault-config.ts` and the
  gate now reads `moneyAccountVaultConfig.chainId`. An unserved or malformed
  config answers **unavailable** — there is no Monad fallback.
- **Note:** the delegation check is not a sufficient guarantee on its own — the
  upgrade can sit in a stuck `PENDING` state that is silent in error reporting.
  For a read-only gate that is acceptable (a stuck-pending account has no
  delegation, so it is hidden), but do not reuse this check as evidence that a
  deposit will succeed.

## Vault-config parser: keep it client-side — DECIDED

An earlier draft of this document recommended upstreaming
`parseMoneyAccountVaultConfig` into `@metamask/money-account-utils`. **That was
rejected, deliberately:** what each client is willing to accept from the flag may
legitimately diverge between mobile and the extension, and a shared parser would
force them to agree. Do not upstream it.

Instead it moves out of `ui/selectors/` into `shared/lib/money/`, which is the
layer both `ui/` and `app/scripts/` may import — UI is barred from importing
anything under `app/scripts` by `import-x/no-restricted-paths` (D7 hit this), so
`shared/lib/money/` is the only place a parser can serve both sides. It already
holds `feature-flags.ts` (D14), `query-keys.ts` (D6) and `availability.ts` (D7).

That unblocks the D14 limitation: the availability gate can read the money chain
from the parsed vault config instead of hardcoding `CHAIN_IDS.MONAD`, so the gate
and the balance service can no longer disagree about which chain they are talking
about. See **D15**.

## D15 — Move the vault-config parser to `shared/` — **DONE**

`2486100c77` on `money-vault-config-shared`.

- **Why:** upstreaming the parser to core was rejected (clients may legitimately
  diverge on what they accept), but it lived in `ui/selectors/` where the
  background could not reach it — which is why D14 hardcoded Monad.
  `shared/lib/money/` is the only layer both `ui/` and `app/scripts/` may import.
- **Moved:** `MoneyAccountVaultConfig`, `parseMoneyAccountVaultConfig` and the
  full rejection matrix of tests → `shared/lib/money/vault-config.ts`, which also
  gained `MONEY_ACCOUNT_VAULT_CONFIG_FLAG_NAME` and a thin
  `getMoneyAccountVaultConfig(remoteFeatureFlags)` wrapper mirroring
  `isMoneyAccountEnabled`, so the flag _name_ is written once rather than
  hardcoded in both the selector and the gate.
- The selectors stay in `ui/selectors/money-account-feature-flags.ts`. No
  re-export of the parser or type from there — nothing imported them by that
  path, so it would be dead surface.
- **Unserved or malformed config ⇒ unavailable**, checked before any seed access
  or RPC. No Monad fallback: the balance service reads the same flag and rejects
  with `VaultConfigNotAvailableError` until it is served, so a guessed chain would
  produce a visible surface that provably cannot load a balance — worse than
  hiding — and would recreate the disagreement this removes.
- **The config is read per call, not cached**, alongside the enablement flag: it
  is a synchronous state read, and it can arrive mid-session on a remote-flag
  refresh, which is exactly how the surface is expected to first appear for a user
  LaunchDarkly was not yet serving. Caching it would pin that user to
  "unavailable" until unlock.
- That created a hazard the old code did not have, now handled: the delegation
  cache is keyed by chain (`{ chainId, hasDelegation }`) and re-read when the
  chain differs, so a config that changes chain can never be answered from a
  cache built against the old one.

## Parallelisation

- **Wave 1:** D0a, then D0b. Both are dependency bumps landed separately from
  the money work.
- **Wave 2:** D1, D2, D3, D5 in parallel (D5 and D2 do not even need D0).
- **Wave 3:** D4 and D14 in parallel, then D4b, then D6.
- **Wave 4:** D7 (consumes D14), then D8, then D9.
- **Wave 5:** D10, then D11 — the critical path. D11 also builds the deposit
  intent map and accessors that D12 needs.
- **Wave 6:** D12, then D13.

The requested hooks land in waves 4 (`useMoneyAccountBalance`) and 6
(`useMoneyAccountDeposit`, `useMoneyAccountWithdrawal`).
