import React from 'react';
import { AvatarTokenSize } from '@metamask/design-system-react';
import {
  applyDisplaySign,
  getDisplaySignPrefix,
  getHumanReadableTokenAmount,
} from '../../../../shared/lib/activity/fiat';
import type { TokenAmount } from '../../../../shared/lib/activity/types';
import { ActivityAvatar } from '../../../components/app/activity-list-item-avatar';
import { useFormatters } from '../../../hooks/useFormatters';

const maximumFractionDigits = 8;

export function TokenAmountRow({ token }: { token: TokenAmount }) {
  const { formatToken } = useFormatters();
  const humanAmount = getHumanReadableTokenAmount(token);
  const formattedAmount =
    humanAmount === undefined
      ? token.symbol
      : applyDisplaySign(
          token.symbol
            ? formatToken(humanAmount as `${number}`, token.symbol, {
                maximumFractionDigits,
              })
            : humanAmount,
          getDisplaySignPrefix(token.direction, { showPlus: true }),
        );

  if (!formattedAmount) {
    return null;
  }

  return (
    <div className="flex items-center gap-4 py-4">
      <ActivityAvatar tokens={[token.assetId]} size={AvatarTokenSize.Xl} />
      <p
        className={`text-l-heading-lg leading-l-heading-lg tracking-l-heading-lg font-semibold ${
          token.direction === 'in' ? 'text-success-default' : ''
        }`}
        data-testid="transaction-list-item-primary-currency"
      >
        {formattedAmount}
      </p>
    </div>
  );
}
