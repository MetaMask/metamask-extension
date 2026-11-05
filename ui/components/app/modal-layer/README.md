# Shared modal layer

`ModalProvider` lives in the app shell. Import `Modal`, `ModalContent`, and
`ModalFocus` from `#ui/components/app/modal-layer`; keep importing the other
visual parts (`ModalOverlay`, `ModalHeader`, `ModalBody`, `ModalFooter`) from
`@metamask/design-system-react`.
Lint enforces this entry point for modal primitives and floating popovers.

```tsx
<Modal isOpen={isOpen} onClose={onClose} priority={ModalPriority.Urgent}>
  <ModalOverlay />
  <ModalContent>{children}</ModalContent>
</Modal>
```

Ordinary dialogs omit `priority`. Higher priority dialogs suspend ordinary
dialogs, including ones opened later. Equal priorities follow opening order:
the latest dialog is active. A nested dialog inherits its parent's priority and
takes precedence over the parent.

Suspension hides the dialog and disables its focus trap and dismissal handlers.
It does not call `onClose` or unmount the contents. When the active dialog closes,
the next dialog resumes with its form state intact. Only the original owner of
an Escape or outside-click event can dismiss itself, even if closing it causes
a synchronous React update.

The old component-library modal, Redux modal host, and full-screen UI popover
participate through adapters. Floating popovers use the same scope to hide and
stop handling dismissal while their owning modal is suspended. A floating menu
outside any modal pauses whenever a modal is active.

Suspended components remain mounted, so asynchronous work continues. Mount-based
view tracking does not automatically wait for visibility.
Routes still control authentication and security interstitials; modal priority
does not change navigation or those gates.

MMDS 0.47 does not expose a way to disable `ModalContent`'s focus trap without
unmounting it. The local `ModalContent` preserves its public props and layout,
using MMDS `Box` and tokens, with coordinated events and `react-focus-lock`.
Once MMDS supports suspension, this adapter can delegate to it. No dependency
patch or new dependency is required.

The `Components/App/ModalLayer` Storybook story demonstrates preemption and
resuming a draft. Standalone component tests and stories keep ordinary MMDS
behavior without a provider; wrap them in `ModalProvider` to test coordination.
