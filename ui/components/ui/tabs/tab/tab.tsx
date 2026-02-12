import React from 'react';
import {
  Text,
  TextAlign,
  TextColor,
  TextVariant,
  FontWeight,
  twMerge,
} from '@metamask/design-system-react';
import { TabProps } from '../tabs.types';

export const Tab = <TKey extends string = string>({
  className = '',
  'data-testid': dataTestId,
  isActive = false,
  name,
  onClick,
  tabIndex = 0,
  tabKey,
  // Declared, but we are not rendering it explicitly (it's mainly to make JSX
  // happy when being used in .tsx)
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  children,
  disabled = false,
  ...props
}: TabProps<TKey>) => {
  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    if (!disabled && onClick) {
      onClick(tabIndex);
    }
  };
  return (
    <Text
      key={tabKey}
      data-testid={dataTestId}
      textAlign={TextAlign.Center}
      color={TextColor.TextAlternative}
      fontWeight={FontWeight.Medium}
      variant={TextVariant.BodyMd}
      className={twMerge(
        'flex align-middle justify-center border-b-2 border-transparent px-0 py-1 transition-all duration-200 cubic-bezier(0.7, 0, 0.15, 1) hover:enabled:text-default',
        isActive && 'text-default border-b-text-default',
        disabled && 'text-muted',
        className,
      )}
      {...props}
      asChild
    >
      <button
        role="tab"
        tabIndex={isActive ? 0 : -1}
        aria-selected={isActive}
        aria-disabled={disabled}
        onClick={handleClick}
        disabled={disabled}
      >
        {name}
      </button>
    </Text>
  );
};
