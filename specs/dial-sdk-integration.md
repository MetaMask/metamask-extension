# Dial SDK Integration Spec

> Feature: Integrate Dial SDK into MetaMask Extension Address Book
> Branch: `implement-dial-sdk`
> Date: 2026-03-26

---

## User Stories

1. **As a MetaMask user**, I want my address book to sync with my Dial contacts, so that my contacts are consistent across Dial-powered apps.
2. **As a MetaMask user**, I want to see my contacts' primary ENS domain in the address book, so I can identify them easily.
3. **As a MetaMask user**, I want to add a nickname to a wallet in my address book, so I can personalize how contacts appear.
4. **As a MetaMask user**, I want to call a contact from the address book, so I can communicate wallet-to-wallet.
5. **As a MetaMask user**, I want to see my contacts' Dial profile info, so I have richer context about who they are.

---

## Acceptance Criteria

### AC1: Dial SDK Vendored & Loadable
- [ ] SDK vendored at `app/vendor/dial-sdk/`
- [ ] Package dependency added to `package.json`
- [ ] SDK imports resolve correctly in the UI layer

### AC2: Dial Authentication
- [ ] User can authenticate with Dial using their MetaMask wallet (SIWE)
- [ ] Session persists across popup open/close
- [ ] Session auto-restores on extension restart
- [ ] Unauthenticated state gracefully handled (features disabled, not broken)

### AC3: Contact Sync
- [ ] Dial contacts are fetched and merged into the address book view
- [ ] Local address book entries are synced up to Dial when authenticated
- [ ] Nickname edits propagate to Dial
- [ ] Contact additions/removals sync bidirectionally

### AC4: ENS Domain Display
- [ ] If a contact has a linked ENS domain in their Dial profile, it's displayed
- [ ] ENS name appears below the contact name in the list view
- [ ] ENS name appears in the contact details view
- [ ] Falls back gracefully when no ENS is linked

### AC5: Call from Address Book
- [ ] Contact details page shows a "Call" button when Dial is authenticated
- [ ] Clicking "Call" initiates a wallet-to-wallet audio call via Dial SDK
- [ ] Call state (ringing, active, ended) is shown to the user
- [ ] Call can be ended from the UI

### AC6: Nickname Editing
- [ ] Edit contact page allows setting/changing nickname
- [ ] Nickname is saved to both MetaMask address book and Dial contacts
- [ ] Nickname appears in contact list and details views

---

## Architecture

### Layer Map

```
UI Components (contacts/)
  └─ useDialContacts hook
      └─ Dial service (lib/dial/)
          ├─ DialClient (from SDK)
          ├─ Session management
          └─ MetaMaskContactsBookProvider (custom IContactsBookProvider)
              └─ Redux store (existing AddressBookController)
```

### New Files

| File | Layer | Purpose |
|------|-------|---------|
| `ui/hooks/useDialClient.ts` | Hooks | Initialize & manage DialClient singleton |
| `ui/hooks/useDialContacts.ts` | Hooks | Contacts sync & merge logic |
| `ui/hooks/useDialProfile.ts` | Hooks | Fetch Dial profile for a wallet |
| `ui/hooks/useDialCall.ts` | Hooks | Call initiation & state management |
| `ui/store/actions/dial.ts` | Store | Redux actions for Dial state |
| `ui/ducks/dial.ts` | Store | Redux slice for Dial state |
| `ui/selectors/dial.ts` | Store | Selectors for Dial state |

### Modified Files

| File | Changes |
|------|---------|
| `package.json` | Add `@dial-wtf/sdk` file dependency |
| `ui/pages/contacts/components/contact-list-item.tsx` | Add ENS badge, Dial indicator |
| `ui/pages/contacts/components/view-contact-content.tsx` | Add ENS, Dial profile, Call button |
| `ui/pages/contacts/contact-details-page.tsx` | Integrate Dial profile data |
| `ui/pages/contacts/contacts.types.ts` | Extend types with Dial fields |
| `ui/pages/contacts/contacts-list-page.tsx` | Merge Dial contacts into list |
| `ui/pages/contacts/components/edit-contact-form.tsx` | Sync nickname to Dial |

---

## Implementation Plan

### Phase 1: Foundation (SDK + Auth)
1. Add SDK dependency to package.json
2. Create `ui/ducks/dial.ts` - Redux slice for Dial state
3. Create `ui/hooks/useDialClient.ts` - DialClient singleton + auth
4. Create `ui/selectors/dial.ts` - Dial state selectors

### Phase 2: Contacts Integration
5. Create `ui/hooks/useDialContacts.ts` - Fetch & merge contacts
6. Create `ui/hooks/useDialProfile.ts` - Profile lookup for contacts
7. Modify contacts list to show Dial-enriched data
8. Modify contact details to show Dial profile + ENS

### Phase 3: Actions
9. Create `ui/hooks/useDialCall.ts` - Call initiation
10. Add Call button to contact details
11. Sync nickname edits to Dial
12. Add Dial contact sync on address book changes

---

## Technical Decisions

1. **UI-only integration** - All Dial SDK code runs in the extension popup (UI layer), not in the background service worker. This avoids C2/C3/M5 audit issues.
2. **No new controller** - We don't create a new MetaMask controller for Dial. The SDK runs client-side and state is managed via React hooks + Redux.
3. **Graceful degradation** - All Dial features are additive. If Dial auth fails or SDK is unavailable, the address book works exactly as before.
4. **Session in localStorage** - Since we run in the popup (has `window`/`localStorage`), we store the Dial session in `localStorage` via the SDK's built-in `exportSession()`/`restoreSession()`.
