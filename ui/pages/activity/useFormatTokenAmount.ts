import { useCallback } from 'react';
import {
  applyDisplaySign,
  getHumanReadableTokenAmount,
  getDisplaySignPrefix,
} from '../../../shared/lib/activity/fiat';
import type {
  ActivityListItem,
  TokenAmount,
} from '../../../shared/lib/activity/types';
import { useFormatters } from '../../hooks/useFormatters';
import { getActivityTypeSignOptions } from './helpers';

export function useFormatTokenAmount() {
  const { formatTokenAmount } = useFormatters();

  return useCallback(
    (
      token: TokenAmount | undefined,
      activityType?: ActivityListItem['type'],
    ) => {
      if (!token) {
        return undefined;
      }

      const humanAmount = getHumanReadableTokenAmount(token);

      if (humanAmount === undefined) {
        return undefined;
      }

      const signOptions = activityType
        ? getActivityTypeSignOptions(activityType)
        : undefined;
      const signPrefix = getDisplaySignPrefix(token.direction, {
        showPlus: signOptions?.showPlus ?? true,
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
