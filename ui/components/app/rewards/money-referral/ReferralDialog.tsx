import React, { useLayoutEffect, useRef } from 'react';
import {
  Box,
  BoxAlignItems,
  BoxBackgroundColor,
  BoxBorderColor,
  BoxFlexDirection,
  BoxJustifyContent,
} from '@metamask/design-system-react';

type ReferralDialogProps = {
  children: React.ReactNode;
  onClose: () => void;
  initialFocusRef?: React.RefObject<HTMLButtonElement>;
  'aria-labelledby'?: string;
  'data-testid': string;
};

/**
 * Backdrop events target the dialog, as do clicks on its own padding.
 *
 * @param event - Mouse event received by the dialog.
 * @returns Whether the event occurred outside the visible sheet.
 */
function isBackdropEvent(event: React.MouseEvent<HTMLDialogElement>): boolean {
  const dialog = event.currentTarget;
  const bounds = dialog.getBoundingClientRect();
  return (
    event.target === dialog &&
    (event.clientX < bounds.left ||
      event.clientX > bounds.right ||
      event.clientY < bounds.top ||
      event.clientY > bounds.bottom)
  );
}

/**
 * MMDS does not support priority focus locks. Native modality keeps referrals
 * above other overlays and blocks background autofocus. The focus-lock opt-out also
 * stops background traps with autoFocus=false from blurring the active input.
 * Return to the MMDS modal shell once priority overlays are supported.
 *
 * @see https://github.com/MetaMask/metamask-design-system/issues/1685
 */
export function ReferralDialog({
  children,
  onClose,
  initialFocusRef,
  'aria-labelledby': labelledBy,
  'data-testid': testId,
}: ReferralDialogProps) {
  const ref = useRef<HTMLDialogElement>(null);
  const backdropPress = useRef(false);
  useLayoutEffect(() => {
    const dialog = ref.current;
    dialog?.showModal();
    initialFocusRef?.current?.focus();
    return () => dialog?.close();
  }, [initialFocusRef]);

  const handleCancel = (event: React.SyntheticEvent) => {
    event.preventDefault();
    event.stopPropagation();
    onClose();
  };

  return (
    <Box
      asChild
      backgroundColor={BoxBackgroundColor.BackgroundElevated1}
      borderColor={BoxBorderColor.BorderAlternative}
      borderWidth={1}
      flexDirection={BoxFlexDirection.Column}
      alignItems={BoxAlignItems.Stretch}
      justifyContent={BoxJustifyContent.Start}
      paddingTop={4}
      paddingBottom={4}
      className="fixed inset-0 m-auto hidden max-h-[calc(100%-2rem)] w-[calc(100%-2rem)] max-w-[480px] rounded-4xl px-0 text-default shadow-lg open:flex motion-safe:animate-slide-up sm:max-h-[calc(100%-4rem)] md:max-h-[calc(100%-6rem)] [@media(max-height:475px)]:max-h-[calc(100%-1rem)] [@media(max-height:475px)]:w-[calc(100%-1rem)] backdrop:bg-overlay-default"
    >
      <dialog
        ref={ref}
        aria-labelledby={labelledBy}
        data-testid={testId}
        data-no-focus-lock
        {...{ closedby: 'any' }}
        onCancel={handleCancel}
        onKeyDown={(event) => {
          if (event.key === 'Escape') {
            // Prevent native cancellation and keep Escape away from background modals.
            handleCancel(event);
          }
        }}
        // Other modals listen on document; keep our interactions local.
        onMouseDown={(event) => {
          event.stopPropagation();
          // Firefox 140 supports dialog, but not native light dismissal.
          backdropPress.current =
            !('closedBy' in event.currentTarget) && isBackdropEvent(event);
        }}
        onClick={(event) => {
          event.stopPropagation();
          const dismiss = backdropPress.current && isBackdropEvent(event);
          backdropPress.current = false;
          if (dismiss) {
            onClose();
          }
        }}
      >
        {children}
      </dialog>
    </Box>
  );
}
