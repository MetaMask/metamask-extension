import React, { useId } from 'react';
import { Link } from 'react-router-dom';
import classnames from 'clsx';
import {
  ButtonIcon,
  ButtonIconSize,
  Icon,
  IconName,
  IconSize,
} from '@metamask/design-system-react';

export type MenuItem = Readonly<{
  key: string;
  label: string;
  iconName?: IconName;
  to?: string;
  onClick?: () => void;
  'data-testid'?: string;
  command?: string;
  commandfor?: string;
}>;

const triggerClassName =
  'flex items-center justify-center border-0 bg-transparent hover:bg-hover active:bg-pressed';

const itemClassName = classnames(
  'selectable-list-item',
  'min-h-12',
  'flex items-center w-full',
  'text-base font-medium text-default',
  'no-underline',
  'hover:no-underline hover:text-default',
  'hover:bg-background-default-hover',
  'active:bg-background-pressed',
);

const popoverPanelStyle = {
  inset: 'auto',
  positionAnchor: '--menu-trigger',
  positionArea: 'block-end span-inline-end',
  positionTryFallbacks: 'flip-block, flip-inline',
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
  size = ButtonIconSize.Sm,
  disabled,
}: Props) {
  const menuId = useId();

  return (
    <>
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
        className="overflow-menu-popover m-0 overflow-hidden p-0"
        style={popoverPanelStyle}
      >
        {items.map((item) => {
          const {
            key,
            label,
            iconName,
            to,
            onClick,
            'data-testid': dataTestId,
            command,
            commandfor,
          } = item;

          const invokerProps = {
            command: command ?? 'hide-popover',
            commandfor: commandfor ?? menuId,
          } as Record<string, unknown>;

          const content = (
            <>
              {iconName ? (
                <Icon
                  name={iconName}
                  size={IconSize.Sm}
                  className="mr-2 shrink-0"
                  aria-hidden
                />
              ) : null}
              {label}
            </>
          );

          return (
            <div className="selectable-list-item-wrapper" key={key}>
              {to ? (
                <Link
                  to={to}
                  className={itemClassName}
                  data-testid={dataTestId}
                  {...invokerProps}
                >
                  {content}
                </Link>
              ) : (
                <button
                  type="button"
                  className={itemClassName}
                  onClick={onClick}
                  data-testid={dataTestId}
                  {...invokerProps}
                >
                  {content}
                </button>
              )}
            </div>
          );
        })}
      </div>
    </>
  );
}
