import React, { useEffect, useRef } from 'react';
import {
  Button,
  ButtonIcon,
  ButtonIconSize,
  ButtonSize,
  ButtonVariant,
  IconAlert,
  IconAlertSeverity,
  IconName,
  IconSize,
} from '@metamask/design-system-react';

type Props = {
  open: boolean;
  onCancel: () => void;
  onConfirm: () => void;
};

const titleId = 'mm-cashtag-disable-title';
const descriptionId = 'mm-cashtag-disable-description';

export function DisableConfirmDialog({ open, onCancel, onConfirm }: Props) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const confirmedRef = useRef(false);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) {
      return;
    }

    if (open) {
      confirmedRef.current = false;
      if (!dialog.open) {
        dialog.showModal();
      }
      return;
    }

    if (dialog.open) {
      dialog.close();
    }
  }, [open]);

  return (
    <dialog
      ref={dialogRef}
      aria-labelledby={titleId}
      aria-describedby={descriptionId}
      className="mm-cashtag-disable-dialog w-[360px] max-w-[calc(100vw-32px)] rounded-xl border border-muted bg-default p-4 font-sans text-default shadow-lg"
      // @ts-expect-error closedby missing in React types
      closedby="any"
      onClose={() => {
        if (confirmedRef.current) {
          return;
        }
        onCancel();
      }}
    >
      <div className="relative flex flex-col items-center">
        <ButtonIcon
          iconName={IconName.Close}
          size={ButtonIconSize.Md}
          ariaLabel="Close"
          className="absolute right-0 top-0 text-icon-default hover:bg-muted-hover"
          onClick={onCancel}
        />
        <IconAlert severity={IconAlertSeverity.Warning} size={IconSize.Xl} />
        <h2
          id={titleId}
          className="mt-4 mb-0 text-center text-s-heading-sm font-medium text-default"
        >
          Disable MetaMask widget?
        </h2>
        <p
          id={descriptionId}
          className="mt-2 mb-0 text-center text-s-body-md text-alternative"
        >
          You won&apos;t see the MetaMask widget on X anymore. Turn it back on
          anytime in{' '}
          <span className="font-medium text-default whitespace-nowrap">
            Settings &gt; Preferences
          </span>
          .
        </p>
        <div className="mt-6 grid w-full grid-cols-2 gap-4">
          <Button
            variant={ButtonVariant.Secondary}
            size={ButtonSize.Lg}
            className="w-full"
            onClick={onCancel}
          >
            Cancel
          </Button>
          <Button
            variant={ButtonVariant.Primary}
            size={ButtonSize.Lg}
            className="w-full"
            onClick={() => {
              confirmedRef.current = true;
              onConfirm();
            }}
          >
            Disable
          </Button>
        </div>
      </div>
    </dialog>
  );
}
