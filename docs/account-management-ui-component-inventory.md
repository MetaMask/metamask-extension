# Account management UI component inventory

This reference describes the components and integration work required to implement the [Account Management Figma frame](https://www.figma.com/design/ineR1lFhThWwyE8NrIKqnW/Account-management?node-id=442-36454&m=dev) in the MetaMask extension.

The frame shows a searchable, reorderable account list with pinned accounts, wallet groups, locked wallets, hardware wallets, imported accounts, visibility controls, removal actions, and an **Add wallet** footer CTA.

## Implementation rules

- Use `@metamask/design-system-react` for page layout, typography, form controls, buttons, icons, and design tokens.
- Reuse the existing multichain account components before introducing a new primitive.
- Do not reproduce Figma's generated markup or asset URLs. Its supplied Icon/Avatar references are not Code Connect mappings and do not describe the extension's production APIs.
- Compose the screen from the existing account-list route where possible. Create a focused management list around the existing account cell rather than duplicating the list, search, address, and wallet-creation behavior.

## Controller ownership

Extend the upstream `AccountTreeController`; do not extend `AccountOrderController` or add another extension-owned ordering controller.

`AccountOrderController` is a legacy address-list bridge. Its persisted state contains only `pinnedAccountList` and `hiddenAccountList`, and its `updateAccountsList` method replaces the pinned-address list rather than ordering accounts. `AccountTreeControllerInit` already reads those legacy lists to seed account-group metadata. The multichain UI reads and writes current pin/hidden state through the account tree, so placing the new layout state anywhere else would create two sources of truth.

Delivery is split into two phases:

1. **Phase 1:** Keep current tree order, make visibility transitions atomic, expose validated wallet removal, and complete the non-ordering UI. See the [phase-one task list](./superpowers/plans/2026-08-31-account-management-phase-1.md).
2. **Phase 2:** Add the persisted layout model and typed ordering methods to `@metamask/account-tree-controller`, upgrade the dependency, then expose the ordering APIs through the extension messenger and UI thunks.

## Phase 2: Account-list layout state

Add a versioned, persisted layout preference to the account-tree controller. It stores only stable IDs and order, never copied account data, balances, names, addresses, or visual expansion state.

```typescript
type AccountListLayoutV1 = {
  version: 1;
  revision: number;
  sectionOrder: AccountListSectionId[];
  accountGroupOrderBySection: Record<
    AccountListSectionId,
    AccountGroupId[]
  >;
};
```

`AccountListSectionId` is resolved by the controller from the live account tree. It represents a physical wallet section and, only if their headers remain draggable, the aggregate hardware and imported sections. **Pinned** is a virtual, always-first section and must never appear in `sectionOrder`. If hardware or imported headers are not product-approved as draggable sections, remove their Figma drag handles instead of treating them as physical wallets.

`AccountGroup.metadata.pinned` and `AccountGroup.metadata.hidden` remain the source of truth for pin and visibility state. The group remains in its canonical section order while pinned, so unpinning restores it to its prior section and rank without a separate restore-state field.

On initialization and any account-tree membership change, the controller must normalize each array: remove deleted/invalid IDs, deduplicate IDs, retain hidden and non-rendered groups, and append previously unordered valid entities using canonical account-tree order. Persist the normalized result automatically after every successful mutation.

## Recommended component hierarchy

```text
AccountManagementPage
├── Page
│   ├── Header
│   │   ├── ButtonIcon (back)
│   │   └── Text (Manage accounts)
│   ├── TextFieldSearch
│   ├── ScrollContainer
│   │   └── AccountManagementList
│   │       ├── PinnedAccountsSection
│   │       │   └── AccountManagementRow × n
│   │       ├── WalletSection × n
│   │       │   ├── WalletSectionHeader (with InlineEditableLabel & Remove action)
│   │       │   ├── AccountManagementRow × n (with InlineEditableLabel & 3-mode accessory)
│   │       │   └── AddMultichainAccount (eligible wallets only)
│   │       ├── HardwareWalletsSection
│   │       │   └── AccountManagementRow × n
│   │       └── ImportedAccountsSection
│   │           └── AccountManagementRow × n
│   └── Footer
│       └── Button (Add wallet)
├── WalletRemoveModal (Figma 346:1502)
└── AccountRemoveModal (Figma 346:2266)
```

## Screen component map

### Page shell

| Figma element | Use | Existing implementation |
| --- | --- | --- |
| Page, scroll area, and fixed bottom action | `Page`, `Header`, `Footer`, and `ScrollContainer` | [`AccountList`](../ui/pages/multichain-accounts/account-list/account-list.tsx) |
| Back control | `ButtonIcon` with the existing `IconName.ArrowLeft` pattern and localized `ariaLabel` | [`AccountList`](../ui/pages/multichain-accounts/account-list/account-list.tsx) |
| “Manage accounts” heading | `Header` with the design-system heading text variant | [`AccountList`](../ui/pages/multichain-accounts/account-list/account-list.tsx) |
| Search field | `TextFieldSearch` with controlled query, clear action, and localized placeholder | [`useAccountListSearch`](../ui/components/multichain-accounts/hooks/useAccountListSearch.ts) |
| Empty search result | `Box` and muted `Text` | [`AccountList`](../ui/pages/multichain-accounts/account-list/account-list.tsx) |
| Bottom “Add wallet” CTA | full-width secondary `Button` in `Footer`; retain its loading icon and disabled state | [`AccountList`](../ui/pages/multichain-accounts/account-list/account-list.tsx) |

The current `AccountList` is the appropriate page-level integration point. Its body list can be replaced or extended with the dedicated management list below without recreating the header, search, balance refresh, footer, or navigation behavior.

### Account-management list

| Required component | Responsibility | Reuse or implementation work |
| --- | --- | --- |
| `AccountManagementList` | Project the controller's normalized layout and account tree into one ordered, searchable list. | New composition layer. Use the `MultichainAccountList` grouping and virtualization behavior as the baseline, but do not derive order from `Object.entries`. |
| `PinnedAccountsSection` | Show the Figma **Pinned** group before wallet sections. | Reuse the pinned-account derivation in `MultichainAccountList`. Preserve its expand/collapse state only if retained in the final UX. |
| `WalletSection` | Render an entropy wallet's name, lock/removal state, accounts, and per-wallet add-account row. | New composition around the existing list's wallet data and `sectionOrder`. |
| `HardwareWalletsSection` | Render hardware accounts as a distinct group. | New classification and composition logic. Use hardware-account/keyring utilities rather than treating every keyring wallet as hardware; use its controller-derived section ID for ordering. |
| `ImportedAccountsSection` | Render imported private-key accounts as a distinct group. | New classification and composition logic. A generic `AccountWalletType.Keyring` check is not sufficient because it includes more than imported accounts; use its controller-derived section ID for ordering. |
| `WalletSectionHeader` | Shared group title header supporting collapsible chevron, inline renaming (`InlineEditableLabel`), locked badge, removal action (red "Remove" + `IconName.RemoveMinus`), and drag handle. Used in both `AccountManagementList` and `MultichainAccountList`. | Shared component in `ui/components/multichain-accounts/wallet-section-header/` composed from `Box`, `Text`, `Button`, `InlineEditableLabel`, `DragHandleIcon`, and design-system `Icon`. |
| `AccountManagementRow` | Wrap `MultichainAccountCell` with 3-mode accessory controls, inline renaming, and drag handle. | New wrapper around `MultichainAccountCell`; provides 3-mode states (Hide, Delete, Hidden) and drag handle. |
| `InlineEditableLabel` | Reusable inline text editing component for wallet titles and account names. | New reusable component with token-styled input, single-click to edit, `Enter` / `IconName.Check` to save, `Escape` / blur to cancel. |

Use the installed `@hello-pangea/dnd` implementation in [`NetworkListMenu`](../ui/components/multichain/network-list-menu/network-list-menu.tsx) as the drag-and-drop precedent. Dragging must be disabled while search filtering is active, because the filtered order cannot be persisted safely as the canonical account order.

### Account-row composition

`MultichainAccountCell` is the reusable row foundation. It already accepts `startAccessory`, `endAccessory`, `accountName`, `balance`, `walletName`, `privacyMode`, `showDefaultAddress`, and `pending` props. The management row should provide the Figma accessories without forking the cell.

| Figma row element | Component or pattern | Notes |
| --- | --- | --- |
| Drag handle | Right-aligned 6-dots drag indicator icon (`IconName.MoreVertical`) attached to DnD handle | Attach drag listeners to the handle. Rendered disabled/dimmed when row is hidden. Provide keyboard accessibility. |
| Account avatar | Existing `ConnectedStatus` inside `MultichainAccountCell` | Retains connection status. Use `PreferredAvatar` only when the product explicitly does not require that status treatment. |
| Account name | `InlineEditableLabel` wrapping `Text` | Single-click to edit on visible rows; `Enter` or checkmark (`IconName.Check`) to save; `Escape` or blur to cancel. |
| Default-address selector and copy chip | `MultichainAccountCellDefaultAddress` | Already provides a dropdown trigger, shortened address, clipboard state, and `Copy`/`CopySuccess` icon. Suppressed when row is hidden. |
| Fiat balance | `SensitiveText` rendered by `MultichainAccountCell` | Use the existing balance selector and currency formatter. Respect privacy mode and avoid rendering a zero-like placeholder while a balance is unknown. |
| Visible/hidden toggle | `ButtonIcon` using `IconName.Eye` (`hideAccount`) or `IconName.EyeSlash` (`showAccount`) | Direct-control presentation. Reuse the `setAccountGroupHidden` action and its pin/hidden invariant from `MultichainAccountMenu`. |
| Account removal control | `ButtonIcon` with red circle minus icon (`IconName.RemoveMinus`, `removeAccount`) | Triggers `AccountRemoveModal` for individual imported/hardware accounts. |
| Pending/disabled row | `MultichainAccountCell` with `pending` plus a purpose-specific disabled state | The existing `pending` prop reduces opacity and blocks switching. Add lock/management restrictions explicitly; do not overload pending state. |

### 3-Mode Account Row Classification & Accessory Positioning

In `AccountManagementRow`, each row renders through one of 3 mutually exclusive modes with action controls on the left (`startAccessory`) and the reorder handle on the right (`endAccessory`):

1. **Mode 1: Hide Mode (SRP / Entropy Accounts — Visible):**
   - **Eligibility:** Accounts derived from an SRP (Entropy wallet).
   - **Presentation:** Full opacity, normal interactive state. Row click navigates to Account Details (`MULTICHAIN_ACCOUNT_DETAILS_PAGE_ROUTE`).
   - **`startAccessory` (Left):** Visibility Action: `ButtonIcon` with `IconName.Eye` (`ariaLabel="Hide account"`).
   - **`endAccessory` (Right):** Fiat Balance display (e.g., `$10,728.46`) + Reorder Handle: 6-dots drag indicator (`IconName.MoreVertical`) with `cursor-grab`.

2. **Mode 2: Delete Mode (Imported & Hardware Accounts):**
   - **Eligibility:** Accounts classified as private key (`KeyringTypes.simple`) or Hardware wallets.
   - **Presentation:** Full opacity, normal interactive state. Row click navigates to Account Details.
   - **`startAccessory` (Left):** Removal Action: Red circle minus `ButtonIcon` (`IconName.RemoveMinus`, `ariaLabel="Remove account"`). Triggers `AccountRemoveModal`.
   - **`endAccessory` (Right):** Fiat Balance display + Reorder Handle: 6-dots drag indicator (`IconName.MoreVertical`) with `cursor-grab`.

3. **Mode 3: Hidden State (Hidden Accounts):**
   - **Eligibility:** Any account where `groupData.metadata.hidden === true`.
   - **Presentation:** Dimmed (50% opacity, `opacity-50`). All non-unhide interactions are disabled: row cannot navigate, copy addresses, inline rename, or drag.
   - **`startAccessory` (Left):** Unhide Action: `ButtonIcon` with `IconName.EyeSlash` (`ariaLabel="Show account"`). Interactive and enabled (`pointer-events-auto`).
   - **`endAccessory` (Right):** Fiat Balance display + Reorder Handle: 6-dots drag indicator rendered disabled/dimmed (`opacity-30 cursor-not-allowed`).

### Inline Renaming Contract

`InlineEditableLabel` provides a standardized inline editing UX for wallet headers and account rows:
- **Trigger:** Single-click on the label text activates editing mode.
- **Active State:** Compact input field styled with Design System tokens alongside a save `ButtonIcon` (`IconName.Check`).
- **Save Actions:** Pressing `Enter` or clicking the checkmark button trims whitespace and invokes `onSave`. If unchanged or empty, exits edit mode without dispatching.
- **Cancel Actions:** Pressing `Escape` or blurring (clicking outside) cancels editing and restores the original value.
- **Disabled State:** When disabled (e.g. hidden account rows), clicking does not enter edit mode.

### Wallet-level controls and removal modals

| Figma treatment | Required behavior | Implementation |
| --- | --- | --- |
| Locked wallet | Show a lock icon and **Locked** label; prevent reorder, add-account, visibility, and removal actions when product rules require it. | `WalletSectionHeader` with `IconName.Lock` and localized "Locked" badge. |
| Removable wallet | Show red text **Remove** + `IconName.RemoveMinus` action, then open `WalletRemoveModal`. | `WalletSectionHeader` with `ButtonLink` (danger variant) and `WalletRemoveModal`. |
| Hardware-wallet section | Group and identify connected hardware accounts, then expose removal only when supported. | Keyring classification and `AccountRemoveModal` on account rows. |
| Imported-account section | Group private-key imported accounts and expose direct account removal via `IconName.RemoveMinus`. | Keyring classification and `AccountRemoveModal`. |
| Add account | Show only for wallets that support derivation of another account. | Reuse `AddMultichainAccount`, which dispatches `createNextMultichainAccountGroup(walletId)`. |

#### Removal Modal Specifications

1. **`WalletRemoveModal` (Figma `346:1502`):**
   - **Header:** Centered danger icon (`IconName.Danger` in error circle badge) and title `"Remove this wallet"`.
   - **Description:** `"Back up your Secret Recovery Phrase before removing this wallet. Without it, you won't be able to recover your assets."`
   - **Conditional Backup Alert:** When `!isBackedUp`, renders `BannerAlert` (`severity={BannerAlertSeverity.Danger}`) with title `"This wallet is not backed up yet."` and an actionable `"Back up now"` link triggering the backup flow. When `isBackedUp === true`, the banner is omitted.
   - **Buttons:** Primary destructive `"Remove"` button (`danger={true}`) and secondary `"Cancel"` button.

2. **`AccountRemoveModal` (Figma `346:2266`):**
   - **Header:** Centered danger icon (`IconName.Danger` in error circle badge) and title `"Remove imported [Account Name]"`.
   - **Description:** `"You can restore this account anytime by importing it with the private key."`
   - **Buttons:** Primary destructive `"Remove"` button (`danger={true}`) and secondary `"Cancel"` button.

## Approved capability contracts (Phase 1 decisions)

1. **Locked Wallet Status & Rules:**
   - **Source of truth:** A wallet group is locked when its status is uninitialized or not ready (`wallet.status !== 'ready'`) or when its underlying keyring/device reports locked.
   - **Visual indicator:** Header renders `IconName.Lock` and a localized "Locked" badge.
   - **Allowed actions:** Direct individual account hide/unhide toggling within the wallet; row click for account details.
   - **Blocked actions:** Adding accounts (`AddMultichainAccount` hidden/disabled), wallet removal (destructive remove action omitted/disabled), and reordering (deferred to Phase 2).

2. **Wallet & Account Removal Policies & Icon Standards:**
   - **Removable wallet types:** Secondary Entropy wallets (`AccountWalletType.Entropy` with `entropySourceId !== primaryEntropySourceId` / secondary SRPs). Primary wallet (`hdEntropyIndex === 1` / primary SRP) is removal-protected and does not render a wallet removal button.
   - **Wallet removal confirmation (`WalletRemoveModal` — Figma `346:1502`):** Centered warning icon, title "Remove this wallet", description "Back up your Secret Recovery Phrase before removing this wallet. Without it, you won't be able to recover your assets.", and conditional danger `BannerAlert` ("This wallet is not backed up yet. Back up now") when `!isBackedUp`.
   - **RPC input:** `MultichainAccountService:removeMultichainAccountWallet` receives the `entropySourceId` (string extracted from `entropy:<entropySourceId>`).
   - **Account removal confirmation (`AccountRemoveModal` — Figma `346:2266`):** Single imported private-key accounts (`keyringType === KeyringTypes.simple`) render account-level removal with centered warning icon, title "Remove imported [Account Name]", and description "You can restore this account anytime by importing it with the private key.".
   - **Removal icon standard:** Red circle minus (`IconName.RemoveMinus`) for individual removable account rows; red text "Remove" + `IconName.RemoveMinus` (`ButtonLink` danger variant) on removable wallet and hardware section headers. Replaces legacy `Trash` icon references.

3. **Unsupported and Other Wallet Types:**
   - **Snap, Watch, and Institutional wallets:** Rendered under their respective classification ("Imported accounts" or dedicated wallet section). They are read-only for derivation/add-account operations, and account-level removal is exposed only where supported by the respective provider.

4. **Visible & Hidden Account Row Interaction (3 Modes):**
   - **Mode 1 (SRP Accounts — Visible):** Full opacity; click navigates to `MULTICHAIN_ACCOUNT_DETAILS_PAGE_ROUTE?accountGroupId=${accountGroupId}`; right accessory renders Fiat Balance $\rightarrow$ `IconName.Eye` hide button $\rightarrow$ 6-dots drag handle.
   - **Mode 2 (Imported/HW Accounts — Visible):** Full opacity; click navigates to details; right accessory renders Fiat Balance $\rightarrow$ `IconName.RemoveMinus` delete button $\rightarrow$ 6-dots drag handle.
   - **Mode 3 (Hidden Accounts):** Dimmed 50% (`opacity-50`); all non-unhide interactions disabled (clicks ignored, address copy suppressed, inline rename disabled, drag handle disabled/dimmed); right accessory renders Fiat Balance $\rightarrow$ `IconName.EyeSlash` unhide button $\rightarrow$ disabled 6-dots drag handle.

5. **Inline Renaming Contract:**
   - Wallet section headers and visible account rows support inline renaming via `InlineEditableLabel`. Single-click enters edit mode; `Enter` or checkmark (`IconName.Check`) saves; `Escape` or blur cancels.

6. **Atomic Visibility Transitions:**
   - Hiding an account sets `hidden: true` and clears `pinned: false` atomically.
   - Unhiding an account sets `hidden: false` in its canonical section without re-pinning.

## Controller commands and interaction rules

Phase 1 implements the atomic visibility commands below. The move commands and ordering rules are explicitly deferred to phase two.

The controller must expose intent-based commands rather than a client-supplied replacement array. A stale or filtered UI must never be able to drop account IDs it did not render.

| Command | Required controller behavior | UI trigger |
| --- | --- | --- |
| `moveAccountListSection({ sectionId, beforeSectionId, expectedRevision })` | Resolve and validate draggable section IDs, update `sectionOrder`, persist, and return the normalized layout/revision. Reject **Pinned**, unknown, locked, or otherwise non-orderable sections. | Drag a wallet/section header. |
| `moveAccountGroup({ accountGroupId, beforeAccountGroupId, expectedRevision })` | Resolve source and target section from the live tree. Persist only same-section moves; preserve all IDs not visible in the current UI. Reject a cross-section move, hidden/locked group, invalid target, or stale revision. | Drag an account row within its current section. |
| `setAccountGroupPinned({ accountGroupId, pinned })` | Atomically update group metadata. Pinning projects the group into **Pinned** while leaving its canonical section rank intact. | Existing pin action or a drag dropped on the **Pinned** section. |
| `setAccountGroupHidden({ accountGroupId, hidden })` | Atomically update group metadata. Hiding always clears `pinned`; unhide returns the group to its existing canonical section/rank. | The direct Eye/Unhide control. |

These methods are proposed additions to the account-tree controller's messenger API. The names are illustrative: use the upstream package's generated action/type conventions when the API is implemented.

### Ordering rules

- **Pinned is a virtual, non-draggable section.** Users cannot reorder the pinned section or sort within it.
- Physical wallet sections can be reordered. If the hardware/imported aggregate headers keep the drag handles shown in Figma, they must be included as controller-resolved section IDs; otherwise remove those handles.
- Starting a wallet/section drag immediately collapses that section's account rows. This is UI-only `collapsedSectionKeys` state, not persisted controller state.
- Accounts may move only within their current canonical section. The controller derives that section from the account tree; it must not trust a source/destination section submitted by the UI.
- An account may be dragged to the **Pinned** drop target. That operation is a pin mutation, not a cross-section reorder. Pinned accounts keep their canonical section membership and rank for future unpinning.
- The UI must not offer dragging during search, because the result is not the canonical unfiltered list.
- Hidden, locked, unknown, and removed groups must be rejected by the controller even if a malformed client submits a drag request.

### Visibility and disabled hidden rows

Phase 1 must make hiding a pinned account atomic. Today `MultichainAccountMenu` first unpins and then hides through two sequential UI dispatches, which can expose an intermediate state.

- `setAccountGroupHidden(groupId, true)` must set `hidden: true` and `pinned: false` in one controller update.
- `setAccountGroupHidden(groupId, false)` restores normal row interaction without automatically re-pinning the account.
- The UI renders a hidden group in its canonical section with reduced emphasis and disables the entire row except its state-specific Eye/Unhide `ButtonIcon`.
- This is an Account Management UI restriction, not a global account permission model. Other product flows retain their existing controller behavior unless Task 1's locked/removal contracts explicitly require a broader rule.

Phase 1 does not change standalone pin behavior. Phase 2 must make a pin command's behavior for a hidden group explicit and atomic before it enables Pinned drag-and-drop.

### Extension integration

After the upstream account-tree controller exposes the new state and methods:

1. Add the new account-tree actions to the restricted controller messenger in `app/scripts/messenger-client-init/messengers/accounts/account-tree-controller-messenger.ts`.
2. Bind each action to the background RPC surface in `app/scripts/metamask-controller.js`.
3. Add typed thunks in `ui/store/actions.ts`. Each thunk submits a controller command and refreshes account-tree state from the resulting state change.
4. Add selectors that apply the normalized layout before `AccountManagementList` derives the pinned and section projections. Do not use `Object.entries` insertion order as a user preference.
5. Stop using `updateAccountsList` and `updateHiddenAccountsList` for this screen. They write the legacy address lists in `AccountOrderController` and cannot represent group IDs, sections, validation, or drag intent.

The controller is the single writer for classification, reconciliation, visibility/pin invariants, validation, persistence, and state synchronization. The UI owns drag coordinates, optimistic rendering, accessibility, and local section-collapse state.

### Persistence, errors, and migration

Persist automatically after every valid command. Include `revision` in the layout so the controller can reject a stale drag rather than overwrite a newer layout. A rejected command must leave the stored layout unchanged and return a typed reason such as stale revision, unknown/deleted ID, hidden/locked group, non-orderable section, or invalid cross-section destination.

When the updated `AccountTreeController` version first stores layout state, add the next available extension migration and register it through the normal migration index. The migration must:

1. Preserve existing tree-owned group metadata and the legacy address-list bootstrap in `AccountTreeControllerInit`.
2. Seed a deterministic normalized baseline from the live account tree, or use an empty layout that explicitly falls back to canonical tree order until the first reorder.
3. Be idempotent and retain IDs for hidden/non-rendered groups.
4. Resolve legacy pin/hidden overlap safely, with hidden taking precedence.

Do not attempt to construct a historic custom ordering from `AccountOrderController`: it has never stored one. Treat that controller as compatibility input during migration, then remove its write RPCs only after the tree-owned model is fully adopted.

### Search, balances, and privacy

Use `useAccountListSearch` rather than filtering inside a new row component. It already maintains the query and filters by name/address. Apply controller-derived ordering before filtering, do not display an add-account row during search, and disable all DnD in that mode.

Use `selectBalanceForAllWallets`, `getAccountGroupDisplayBalance`, and the existing currency formatter. Pass the formatted value to the cell and use its `privacyMode` support. No balance should be rendered until it is known, because a placeholder can be mistaken for a zero balance.

## Design-system requirements

- Use `Box` for tokenized layout, spacing, alignment, surfaces, and borders.
- Use `Text` and design-system text variants for titles, section labels, account names, addresses, and balances.
- Use `TextFieldSearch` for the search control.
- Use `Button`, `ButtonIcon`, `Icon`, and their supported variants/sizes for all actions. Do not use image assets or hand-authored SVGs for the arrow, eye, eye-slash, lock, plus, copy, or remove controls.
- Use `SensitiveText` for balance privacy.
- Use design-system semantic colors for default, alternative, muted, info, success, and error states. Do not hard-code Figma hex values.
- Preserve existing extension component-library primitives where no design-system equivalent is present, including `Popover`, `ModalFocus`, and the established removal modal patterns.

## Accessibility and interaction checklist

- Use real buttons for back, visibility, removal, add-account, add-wallet, section collapse, and drag interactions.
- Give every icon-only control a localized `ariaLabel`.
- Keep section-collapse controls as buttons with `aria-expanded`, as in the existing account list.
- Keep the search input label/placeholder and clear action available to assistive technology.
- Support keyboard drag and announce an item's new position after reordering.
- Restore focus to the action that opened a confirmation modal.
- Prevent unavailable operations for locked, pending, and unsupported account types; do not make them silently no-op.
- Ensure the fixed footer remains reachable while the account list scrolls.

## Implementation sequence

1. Complete the [phase-one task list](./superpowers/plans/2026-08-31-account-management-phase-1.md): atomic visibility, validated wallet removal, non-persistent sections, page/row composition, and test coverage.
2. Start phase two only after phase-one sections, visibility, and removal behavior are stable.
3. Add `AccountListLayoutV1`, normalization, ordering commands, migration, ordered selectors, and DnD. This phase includes all wallet/account dragging, Pinned drops, conflict handling, and drag-to-collapse behavior.

## Validation checklist

- The UI imports visual primitives from `@metamask/design-system-react` and reuses the existing multichain account components.
- The page matches the supplied Figma's header, search, pinned, locked, wallet, hardware, imported, hidden, and fixed-footer states.
- Pinned is always first and cannot be reordered. Account moves remain in their current canonical section, except a valid drop on Pinned, which pins the account.
- Wallet/section and account ordering save automatically, survive reload, and preserve filtered, hidden, and non-rendered account IDs.
- Dragging a wallet/section collapses its accounts locally and never persists its expansion state.
- Search results do not permit dragging or persistent reordering.
- Visibility toggling is an atomic controller mutation that preserves the pinned/hidden invariants.
- A hidden row is disabled (50% dimmed) except for its Eye/Unhide button. It cannot emit selection, address/copy, inline rename, pin, remove, menu, or drag actions from the Account Management screen.
- Account rows correctly render across the 3 modes: Hide Mode (SRP visible accounts with `IconName.Eye`), Delete Mode (Imported/HW visible accounts with `IconName.RemoveMinus`), and Hidden State (dimmed rows with `IconName.EyeSlash` unhide button and disabled drag handle).
- Wallet headers and account rows support inline renaming with `InlineEditableLabel`.
- Hardware and imported sections are based on correct account classification.
- Locked and unsupported accounts cannot trigger prohibited operations.
- Account removal (`AccountRemoveModal`) and wallet removal (`WalletRemoveModal` with conditional backup alert banner) each require their respective confirmation flows.
- Removal actions consistently use the `IconName.RemoveMinus` icon standard.
- Controller, unit, and E2E tests cover keyboard and screen-reader-relevant interaction paths.
