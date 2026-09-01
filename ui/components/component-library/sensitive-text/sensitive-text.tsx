import React, { useMemo } from 'react';
import { Text } from '../text';
import {
  SensitiveTextProps,
  SensitiveTextLength,
} from './sensitive-text.types';

/**
 * @deprecated This component is deprecated and will be removed in a future release.
 * Please use the SensitiveText component from @metamask/design-system-react instead.
 * @see {@link https://github.com/MetaMask/metamask-design-system/blob/main/packages/design-system-react/MIGRATION.md#sensitivetext-component | Migration Guide}
 * @see {@link https://metamask.github.io/metamask-design-system/?path=/docs/react-components-sensitivetext--docs | Storybook Documentation}
 * @see {@link https://github.com/MetaMask/metamask-design-system/tree/main/packages/design-system-react/src/components/SensitiveText | Component Source}
 */
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
    [adjustedLength, getFallbackLength],
  );

  return (
    <Text ref={ref} {...restProps}>
      {isHidden ? fallback : children}
    </Text>
  );
});
