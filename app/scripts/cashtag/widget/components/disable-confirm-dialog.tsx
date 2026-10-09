import React from 'react';
import {
  Button,
  ButtonIcon,
  ButtonSize,
  ButtonVariant,
  IconAlert,
  IconAlertSeverity,
  IconName,
  IconSize,
} from '@metamask/design-system-react';

type Props = Readonly<{
  id: string;
  onConfirm: () => void;
}>;

const titleId = 'mm-cashtag-disable-title';
const descriptionId = 'mm-cashtag-disable-description';

export function DisableConfirmDialog({ id, onConfirm }: Props) {
  return (
    <dialog
      id={id}
      aria-labelledby={titleId}
      aria-describedby={descriptionId}
      className="w-[360px] max-w-[calc(100vw-32px)] rounded-xl border border-muted bg-default p-4 font-sans text-default shadow-lg"
      // @ts-expect-error need to update react types
      closedby="any"
    >
      <div className="relative flex flex-col items-center">
        <ButtonIcon
          ariaLabel="Close"
          iconName={IconName.Close}
          className="absolute right-0 top-0 text-icon-default hover:bg-muted-hover"
          // @ts-expect-error need to update react types
          command="close"
          commandfor={id}
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
            Settings &gt; Preferences.
          </span>
        </p>
        <div className="mt-6 grid w-full grid-cols-2 gap-4">
          <Button
            variant={ButtonVariant.Secondary}
            size={ButtonSize.Lg}
            className="w-full"
            // @ts-expect-error need to update react types
            command="close"
            commandfor={id}
          >
            Cancel
          </Button>
          <Button
            variant={ButtonVariant.Primary}
            size={ButtonSize.Lg}
            className="w-full"
            // @ts-expect-error need to update react types
            command="close"
            commandfor={id}
            onClick={onConfirm}
          >
            Disable
          </Button>
        </div>
      </div>
    </dialog>
  );
}
