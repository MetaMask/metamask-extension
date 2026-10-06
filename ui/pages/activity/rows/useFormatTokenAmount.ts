import { useCallback } from 'react';
import type { TokenAmount } from '@metamask/client-utils';
import {
  applyDisplaySign,
  getDisplaySignPrefix,
  getHumanReadableTokenAmount,
} from '../../../../shared/lib/activity/fiat';
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
