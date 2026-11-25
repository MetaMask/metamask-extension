import React from 'react';
import classnames from 'clsx';
import { Text, type TextProps } from '@metamask/design-system-react';

export type DottedTriggerProps = Omit<TextProps, 'children' | 'asChild'> &
  Pick<
    React.ButtonHTMLAttributes<HTMLButtonElement>,
    'aria-describedby' | 'onBlur' | 'onFocus' | 'onMouseEnter' | 'onMouseLeave'
  > & {
    'data-testid'?: string;
    onClick: () => void;
    text: string;
  };

/**
 * Dotted-underline tappable text trigger that opens an info dialog or tooltip.
 */
export const DottedTrigger = React.forwardRef<
  HTMLButtonElement,
  DottedTriggerProps
>(
  (
    {
      'aria-describedby': ariaDescribedBy,
      className,
      'data-testid': dataTestId,
      onBlur,
      onClick,
      onFocus,
      onMouseEnter,
      onMouseLeave,
      text,
      ...textProps
    },
    ref,
  ) => {
    return (
      <Text
        {...textProps}
        asChild
        className={classnames(
          'inline cursor-pointer border-0 bg-transparent p-0 underline decoration-dotted decoration-[8%] underline-offset-[32%]',
          className,
        )}
      >
        <button
          ref={ref}
          aria-describedby={ariaDescribedBy}
          data-testid={dataTestId}
          onBlur={onBlur}
          onClick={onClick}
          onFocus={onFocus}
          onMouseEnter={onMouseEnter}
          onMouseLeave={onMouseLeave}
          type="button"
        >
          {text}
        </button>
      </Text>
    );
  },
);
