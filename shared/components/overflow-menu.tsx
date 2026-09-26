import React, { useState } from 'react';
import {
  ButtonIcon,
  ButtonIconSize,
  Icon,
  IconName,
  IconSize,
  Popover,
  PopoverPosition,
} from '@metamask/design-system-react';

export type OverflowMenuItem = Readonly<{
  key: string;
  label: string;
  onClick: () => void;
  iconName?: IconName;
}>;

type Props = Readonly<{
  items: readonly OverflowMenuItem[];
  ariaLabel?: string;
  testId?: string;
}>;

export function OverflowMenu({
  items,
  ariaLabel = 'More options',
  testId = 'overflow-menu',
}: Props) {
  const [referenceElement, setReferenceElement] =
    useState<HTMLDivElement | null>(null);
  const [isOpen, setIsOpen] = useState(false);

  const closeMenu = () => setIsOpen(false);

  return (
    <div ref={setReferenceElement}>
      <ButtonIcon
        iconName={IconName.MoreVertical}
        size={ButtonIconSize.Md}
        ariaLabel={ariaLabel}
        onClick={() => setIsOpen((open) => !open)}
        data-testid={`${testId}-button`}
      />
      <Popover
        referenceElement={referenceElement}
        isOpen={isOpen}
        position={PopoverPosition.BottomEnd}
        className="p-0 min-w-[180px] rounded-lg z-[1050]"
        onClickOutside={closeMenu}
        onPressEscKey={closeMenu}
        data-testid={testId}
      >
        {items.map(({ key, label, onClick, iconName }) => (
          <button
            type="button"
            key={key}
            data-testid={`${testId}-${key}__button`}
            onClick={() => {
              closeMenu();
              onClick();
            }}
            className="flex min-h-12 w-full items-center px-4 py-2 text-left text-s-body-sm font-medium hover:bg-hover"
          >
            {iconName ? (
              <Icon name={iconName} size={IconSize.Sm} className="mr-2" />
            ) : null}
            {label}
          </button>
        ))}
      </Popover>
    </div>
  );
}
