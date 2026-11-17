import React from 'react';
import classnames from 'clsx';
import { Text, type TextProps } from '@metamask/design-system-react';

export type DottedTriggerProps = Omit<TextProps, 'children' | 'asChild'> & {
  text: string;
  onClick: () => void;
  'data-testid'?: string;
};

/**
 * Dotted-underline tappable text trigger that opens an info dialog on click.
 */
export function DottedTrigger({
  text,
  onClick,
  className,
  'data-testid': dataTestId,
  ...textProps
}: Readonly<DottedTriggerProps>) {
  return (
    <Text
      {...textProps}
      asChild
      className={classnames(
        'inline cursor-pointer border-0 bg-transparent p-0 underline decoration-dotted decoration-[8%] underline-offset-[32%]',
        className,
      )}
    >
      <button type="button" onClick={onClick} data-testid={dataTestId}>
        {text}
      </button>
    </Text>
  );
}
