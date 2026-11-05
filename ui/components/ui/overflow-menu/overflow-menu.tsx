import React, { useId } from 'react';
import classnames from 'clsx';
import {
  ButtonIcon,
  ButtonIconSize,
  Icon,
  IconName,
  IconSize,
} from '@metamask/design-system-react';
import { Text } from '../../component-library';
import {
  AlignItems,
  BlockSize,
  Display,
  TextVariant,
} from '../../../helpers/constants/design-system';

type MenuItemButtonProps = Omit<
  React.ButtonHTMLAttributes<HTMLButtonElement>,
  'children' | 'className' | 'type'
>;

export type MenuItem = Readonly<
  {
    key: string;
    label: string;
    iconName?: IconName;
    command?: string;
    commandfor?: string;
  } & MenuItemButtonProps
>;

const triggerClassName =
  'flex items-center justify-center border-0 bg-transparent hover:bg-hover active:bg-pressed';

const popoverPanelStyle = {
  inset: 'auto',
  positionAnchor: '--menu-trigger',
  top: 'anchor(bottom)',
  right: 'anchor(right)',
  minWidth: 180,
  width: 'max-content',
  backgroundColor: 'var(--color-background-elevated2)',
  border: '1px solid var(--color-border-muted)',
  borderRadius: 8,
} as React.CSSProperties;

type Props = Readonly<{
  items: readonly MenuItem[];
  ariaLabel?: string;
  testId?: string;
  size?: ButtonIconSize;
  disabled?: boolean;
}>;

export function OverflowMenu({
  items,
  ariaLabel = 'More options',
  testId,
  size,
  disabled,
}: Props) {
  const menuId = useId();

  return (
    <div className="overflow-menu relative">
      <ButtonIcon
        ariaLabel={ariaLabel}
        className={triggerClassName}
        data-testid={testId}
        iconName={IconName.MoreVertical}
        isDisabled={disabled}
        size={size}
        style={{ anchorName: '--menu-trigger' } as React.CSSProperties}
        // @ts-expect-error need to update react types
        command="toggle-popover"
        commandfor={menuId}
      />
      <div
        id={menuId}
        // @ts-expect-error need to update react types
        popover="auto"
        className="mm-popover absolute m-0 overflow-hidden p-0 z-[1050]"
        style={popoverPanelStyle}
      >
        {items.map((item) => {
          const {
            key,
            label,
            iconName,
            onClick,
            command,
            commandfor,
            ...buttonProps
          } = item;
          const invokerCommand =
            command ?? (onClick ? 'hide-popover' : undefined);
          const invokerTarget =
            commandfor ?? (onClick && !command ? menuId : undefined);

          const invokerProps = {
            command: invokerCommand,
            commandfor: invokerTarget,
          } as Record<string, unknown>;

          return (
            <div className="selectable-list-item-wrapper" key={key}>
              {/* @ts-expect-error need to update react types for invoker commands API */}
              <Text
                as="button"
                type="button"
                variant={TextVariant.bodySmMedium}
                display={Display.Flex}
                alignItems={AlignItems.center}
                width={BlockSize.Full}
                className={classnames('selectable-list-item', 'min-h-12')}
                onClick={onClick}
                {...buttonProps}
                {...invokerProps}
              >
                {iconName ? (
                  <Icon
                    name={iconName}
                    size={IconSize.Sm}
                    className="mr-2 shrink-0"
                    aria-hidden
                  />
                ) : null}
                {label}
              </Text>
            </div>
          );
        })}
      </div>
    </div>
  );
}
