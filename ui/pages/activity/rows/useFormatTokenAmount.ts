import { useCallback } from 'react';
import {
  applyDisplaySign,
  getDisplaySignPrefix,
  getHumanReadableTokenAmount,
} from '../../../../shared/lib/activity/fiat';
import type { TokenAmount } from '../../../../shared/lib/activity/types';
import { useFormatters } from '../../../hooks/useFormatters';

export function useFormatTokenAmount() {
  const { formatTokenAmount } = useFormatters();

  return useCallback(
    (token: TokenAmount | undefined, options: { showPlus?: boolean } = {}) => {
      if (!token) {
        return undefined;
      }

      const humanAmount = getHumanReadableTokenAmount(token);

      if (humanAmount === undefined) {
        return undefined;
      }

      const signPrefix = getDisplaySignPrefix(token.direction, {
        showPlus: options.showPlus ?? true,
      });

      const formatted = formatTokenAmount(
        humanAmount as `${number}`,
        token.symbol ?? '',
      );

      return applyDisplaySign(formatted, signPrefix);
    },
    [formatTokenAmount],
  );
}
