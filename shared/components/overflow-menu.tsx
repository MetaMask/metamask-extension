import React, { useId } from 'react';
import { ButtonIcon, IconName } from '@metamask/design-system-react';

export type MenuItem = Readonly<{
  key: string;
  label: string;
  command?: string;
  commandfor?: string;
}>;

type Props = Readonly<{
  items: readonly MenuItem[];
  ariaLabel?: string;
  testId?: string;
}>;

export function OverflowMenu({ items }: Props) {
  const menuId = useId();

  return (
    <div className="relative">
      <ButtonIcon
        ariaLabel="More options"
        style={{ anchorName: '--menu-trigger' } as React.CSSProperties}
        // @ts-expect-error need to update react types
        command="toggle-popover"
        commandfor={menuId}
        iconName={IconName.MoreVertical}
      />
      <div
        id={menuId}
        // @ts-expect-error need to update react types
        popover="auto"
        className="absolute m-0 p-0 min-w-[180px] rounded-lg z-[1050]"
        style={
          {
            inset: 'auto',
            positionAnchor: '--menu-trigger',
            top: 'anchor(bottom)',
            right: 'anchor(right)',
          } as React.CSSProperties
        }
      >
        {items.map(({ key, label, command, commandfor }) => (
          <button
            type="button"
            key={key}
            className="flex min-h-12 w-full items-center px-4 py-2 text-left text-s-body-sm font-medium hover:bg-hover"
            // @ts-expect-error need to update react types
            command={command}
            commandfor={commandfor}
          >
            {label}
          </button>
        ))}
      </div>
    </div>
  );
}
