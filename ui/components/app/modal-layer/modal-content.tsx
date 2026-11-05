import React, { forwardRef, useRef } from 'react';
import {
  Box,
  BoxAlignItems,
  BoxBackgroundColor,
  BoxBorderColor,
  BoxFlexDirection,
  BoxJustifyContent,
  type ModalContentProps,
  ModalContentSize,
  twMerge,
  useModalContext,
} from '@metamask/design-system-react';
import { ModalFocus } from './modal-focus';
import { useModalEvents } from './use-modal-events';

const maxWidth = {
  [ModalContentSize.Sm]: 'max-w-[360px]',
  [ModalContentSize.Md]: 'max-w-[480px]',
  [ModalContentSize.Lg]: 'max-w-[720px]',
};

// MMDS 0.47 ModalContent cannot suspend its focus lock. Keep its layout and public
// props here until MMDS supports coordination; all visual primitives remain MMDS.
export const ModalContent = forwardRef<HTMLDivElement, ModalContentProps>(
  (
    {
      className,
      children,
      size = ModalContentSize.Sm,
      modalDialogProps,
      ...props
    },
    ref,
  ) => {
    const context = useModalContext();
    const dialogRef = useRef<HTMLDivElement>(null);
    useModalEvents({ ...context, dialogRef });
    return (
      <ModalFocus {...context}>
        <div
          ref={ref}
          className={twMerge(
            'fixed inset-0 z-[1050] flex items-start justify-center p-4 sm:py-8 md:py-12',
            '[@media(max-height:475px)]:p-2',
            className,
          )}
          {...props}
        >
          <Box
            asChild
            backgroundColor={BoxBackgroundColor.BackgroundElevated1}
            borderColor={BoxBorderColor.BorderAlternative}
            borderWidth={1}
            justifyContent={BoxJustifyContent.Start}
            alignItems={BoxAlignItems.Stretch}
            flexDirection={BoxFlexDirection.Column}
            paddingTop={4}
            paddingBottom={4}
            {...modalDialogProps}
            ref={dialogRef}
            className={twMerge(
              'flex max-h-full w-full rounded-4xl shadow-lg motion-safe:animate-slide-up',
              maxWidth[size],
              modalDialogProps?.className,
            )}
          >
            <section
              ref={modalDialogProps?.ref}
              role="dialog"
              aria-modal="true"
            >
              {children}
            </section>
          </Box>
        </div>
      </ModalFocus>
    );
  },
);
ModalContent.displayName = 'ModalContent';
