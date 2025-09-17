import React from 'react';
import {
  Box,
  Text,
  TextAlign,
  TextColor,
  TextVariant,
  twMerge,
} from '@metamask/design-system-react';
import { TabProps } from '../tabs.types';

export const Tab = <TKey extends string = string>({
  buttonClassName = '',
  activeClassName = '',
  className = '',
  'data-testid': dataTestId,
  isActive = false,
  isSingleTab = false,
  name,
  onClick,
  tabIndex = 0,
  tabKey,
  // Declared, but we are not rendering it explicitly (it's mainly to make JSX
  // happy when being used in .tsx)
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  children,
  textProps,
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
    <Box
      data-testid={dataTestId}
      key={tabKey}
      role="tab"
      tabIndex={isActive ? 0 : -1}
      aria-selected={isActive}
      aria-disabled={disabled}
      {...props}
      className={twMerge(
        // Original class names for compatibility (e2e tests, etc.)
        'tab',
        isActive && 'tab--active',
        disabled && 'tab--disabled',
        isSingleTab && 'tab--single',
        // Tailwind classes for actual styling
        'border-b-2 border-muted text-alternative font-medium transition-colors duration-200 ease-out',
        // Single tab variant (no border)
        isSingleTab && 'text-default border-b-0',
        // Active state
        isActive &&
          'text-default border-b-text-default transition-all duration-200 cubic-bezier(0.7, 0, 0.15, 1)',
        // Disabled state
        disabled && 'text-text-muted',
        // Custom active class if provided and active
        isActive && activeClassName,
        className,
      )}
    >
      <Text
        textAlign={TextAlign.Center}
        className={twMerge(
          'block w-full min-w-[50px] bg-transparent font-medium transition-colors duration-[50ms] ease-out',
          'disabled:text-inherit hover:enabled:text-default p-2',
          buttonClassName,
          textProps?.className,
        )}
        variant={TextVariant.BodyMd}
        color={TextColor.Inherit}
        {...textProps}
        asChild
      >
        <button onClick={handleClick} disabled={disabled}>
          {name}
        </button>
      </Text>
    </Box>
  );
};
