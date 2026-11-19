import React from 'react';
import classnames from 'clsx';
import { Text, type TextProps } from '@metamask/design-system-react';

export type DottedTriggerProps = Omit<TextProps, 'children' | 'asChild'> &
  Pick<
    React.ButtonHTMLAttributes<HTMLButtonElement>,
    'aria-describedby' | 'onBlur' | 'onFocus' | 'onMouseEnter' | 'onMouseLeave'
  > & {
    text: string;
    onClick: () => void;
    'data-testid'?: string;
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
      text,
      onClick,
      className,
      'data-testid': dataTestId,
      'aria-describedby': ariaDescribedBy,
      onBlur,
      onFocus,
      onMouseEnter,
      onMouseLeave,
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
          type="button"
          onClick={onClick}
          onBlur={onBlur}
          onFocus={onFocus}
          onMouseEnter={onMouseEnter}
          onMouseLeave={onMouseLeave}
          aria-describedby={ariaDescribedBy}
          data-testid={dataTestId}
        >
          {text}
        </button>
      </Text>
    );
  },
);
