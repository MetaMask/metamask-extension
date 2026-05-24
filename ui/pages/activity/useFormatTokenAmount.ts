import { useCallback } from 'react';
import { formatUnits } from '../../../shared/lib/unit';
import type { TokenAmount } from '../../../shared/lib/activity/types';
import { useFormatters } from '../../hooks/useFormatters';

export function useFormatTokenAmount() {
  const { formatTokenAmount } = useFormatters();

  return useCallback(
    (token: TokenAmount | undefined) => {
      if (!token?.amount) {
        return undefined;
      }

      let value: string;
      try {
        value = formatUnits(BigInt(token.amount), token.decimals ?? 0);
      } catch {
        value = token.amount;
      }

      const sign = token.direction === 'in' ? '' : '-';
      const unsigned = value.startsWith('-') ? value.slice(1) : value;

      return formatTokenAmount(
        `${sign}${unsigned}` as `${number}`,
        token.symbol ?? '',
      );
    },
    [formatTokenAmount],
  );
}
