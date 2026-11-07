import React, { CSSProperties, useId } from 'react';
import { Link } from 'react-router-dom';
import classnames from 'clsx';
import {
  ButtonIcon,
  ButtonIconSize,
  Icon,
  IconName,
  IconSize,
} from '@metamask/design-system-react';
import { useI18nContext } from '../../../hooks/useI18nContext';

const popoverClassName = classnames(
  'menu-popover inset-auto p-0 border-none bg-transparent',
  'transition-[opacity,display,overlay]',
  'transition-discrete',
  'duration-150 ease-[cubic-bezier(0.16,1,0.3,1)]',
  'opacity-0',
  'starting:[&:popover-open]:opacity-0',
  '[&:popover-open]:opacity-100',
  '[container-type:anchored]',
  '[position-anchor:--menu-trigger]',
  '[position-area:block-end_span-inline-end]',
  '[position-try-fallbacks:flip-block,flip-inline]',
);

const popoverContentClassName = classnames(
  'body min-w-44 border-muted bg-elevated2 rounded-lg',
);

const itemClassName = classnames(
  'selectable-list-item',
  'flex items-center w-full',
  'no-underline',
  'hover:no-underline hover:text-default',
);

type MenuItem = {
  key: string;
  label: string;
  iconName?: IconName;
  command?: string;
  commandfor?: string;
  'data-testid'?: string;
  to?: string;
  onClick?: () => void;
};
type Props = {
  items: readonly MenuItem[];
  ariaLabel?: string;
  testId?: string;
  size?: ButtonIconSize;
};

export function OverflowMenu({
  ariaLabel,
  items,
  size = ButtonIconSize.Sm,
  testId,
}: Props) {
  const menuId = useId();
  const t = useI18nContext();

  return (
    <>
      <ButtonIcon
        iconName={IconName.MoreVertical}
        size={size}
        style={{ anchorName: '--menu-trigger' } as CSSProperties}
        ariaLabel={ariaLabel || t('moneyMoreOptions')}
        // @ts-expect-error need to update react types
        command="toggle-popover"
        commandfor={menuId}
        data-testid={testId}
      />
      <div
        id={menuId}
        className={popoverClassName}
        // @ts-expect-error need to update react types
        popover="auto"
      >
        <div className={popoverContentClassName}>
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
      </div>
    </>
  );
}
