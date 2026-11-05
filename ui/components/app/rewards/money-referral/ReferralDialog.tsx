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
 * MMDS does not support priority focus locks. Native modality keeps referrals
 * above other overlays and blocks background autofocus. The focus-lock opt-out also
 * stops background traps with autoFocus=false from blurring the active input.
 */
export function ReferralDialog({
  children,
  onClose,
  initialFocusRef,
  ...props
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
    <dialog
      {...props}
      ref={ref}
      data-no-focus-lock
      className="fixed inset-0 m-0 size-full max-h-none max-w-none items-center justify-center border-0 bg-overlay-default p-4 text-default open:flex sm:py-8 md:py-12 [@media(max-height:475px)]:p-2 backdrop:bg-transparent"
      onCancel={handleCancel}
      onKeyDown={(event) => {
        if (event.key === 'Escape') {
          handleCancel(event);
        }
      }}
      // Other modals listen on document; keep our interactions local.
      onMouseDown={(event) => {
        event.stopPropagation();
        backdropPress.current = event.target === event.currentTarget;
      }}
      onClick={(event) => {
        event.stopPropagation();
        if (backdropPress.current && event.target === event.currentTarget) {
          onClose();
        }
      }}
    >
      {children}
    </dialog>
  );
}

/** Keeps the existing MMDS sheet layout inside the native modal. */
export function ReferralDialogContent({ children }: React.PropsWithChildren) {
  return (
    <Box
      backgroundColor={BoxBackgroundColor.BackgroundElevated1}
      borderColor={BoxBorderColor.BorderAlternative}
      borderWidth={1}
      flexDirection={BoxFlexDirection.Column}
      alignItems={BoxAlignItems.Stretch}
      justifyContent={BoxJustifyContent.Start}
      paddingTop={4}
      paddingBottom={4}
      className="flex max-h-full w-full max-w-[480px] rounded-4xl shadow-lg motion-safe:animate-slide-up"
    >
      {children}
    </Box>
  );
}
