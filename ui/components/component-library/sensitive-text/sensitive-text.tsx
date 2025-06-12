import React, { useMemo } from 'react';
import { Text } from '../text';
import {
  SensitiveTextProps,
  SensitiveTextLength,
} from './sensitive-text.types';

export const SensitiveText = React.forwardRef<
  HTMLParagraphElement,
  SensitiveTextProps
>((props, ref) => {
  const {
    isHidden = false,
    length = SensitiveTextLength.Short,
    children = '',
    ...restProps
  } = props;

  const getFallbackLength = useMemo(
    () => (len: string) => {
      const numLength = Number(len);
      return Number.isNaN(numLength) ? 0 : numLength;
    },
    [],
  );

  const isValidCustomLength = (value: string): boolean => {
    const num = Number(value);
    return !Number.isNaN(num) && num > 0;
  };

  let adjustedLength = length;
  if (!(length in SensitiveTextLength) && !isValidCustomLength(length)) {
    console.warn(`Invalid length provided: ${length}. Falling back to Short.`);
    adjustedLength = SensitiveTextLength.Short;
  }

  const fallback = useMemo(
    () => '•'.repeat(getFallbackLength(adjustedLength)),
    [length, getFallbackLength],
  );

  return (
    <Text ref={ref} {...restProps}>
      {isHidden ? fallback : children}
    </Text>
  );
});
