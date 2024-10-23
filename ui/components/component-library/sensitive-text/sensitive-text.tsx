import React, { useMemo } from 'react';
import { Text } from '../text';
import { SensitiveTextProps, SensitiveLengths } from './sensitive-text.types';

export const SensitiveText = React.forwardRef<
  HTMLParagraphElement,
  SensitiveTextProps
>((props, ref) => {
  const {
    isHidden,
    length = SensitiveLengths.Short,
    children = '',
    ...restProps
  } = props;
  const fallback = useMemo(() => '*'.repeat(Number(length)), [length]);

  return (
    <Text ref={ref} {...restProps}>
      {isHidden ? fallback : children}
    </Text>
  );
});
