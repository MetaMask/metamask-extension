import React, { useMemo } from 'react';
import {
  Box,
  Button,
  ButtonSize,
  ButtonVariant,
} from '@metamask/design-system-react';
import { useI18nContext } from '../../../hooks/useI18nContext';
import type { MoneyDepositToken } from '../../../hooks/money/money-deposit-token-utils';
import { MoneyPotentialEarningsSummary } from './money-potential-earnings-summary';
import { MoneyPotentialEarningsTokenRow } from './money-potential-earnings-token-row';

export const MONEY_POTENTIAL_EARNINGS_VISIBLE_TOKEN_COUNT = 5;

type MoneyPotentialEarningsProps = {
  tokens: MoneyDepositToken[];
  apyDecimal: number | undefined;
  isNoFeeToken: (token: MoneyDepositToken) => boolean;
  privacyMode: boolean;
  onAddToken: (
    token: MoneyDepositToken,
    tokenIndex: number,
    tokenCount: number,
  ) => void;
  onViewAll: () => void;
  isAddDisabled?: boolean;
};

export function MoneyPotentialEarnings({
  tokens,
  apyDecimal,
  isNoFeeToken,
  privacyMode,
  onAddToken,
  onViewAll,
  isAddDisabled = false,
}: MoneyPotentialEarningsProps) {
  const t = useI18nContext();
  const visibleTokens = useMemo(
    () => tokens.slice(0, MONEY_POTENTIAL_EARNINGS_VISIBLE_TOKEN_COUNT),
    [tokens],
  );

  return (
    <section data-testid="money-potential-earnings">
      <MoneyPotentialEarningsSummary
        tokens={tokens}
        apyDecimal={apyDecimal}
        privacyMode={privacyMode}
      />

      {visibleTokens.map((token, index) => (
        <MoneyPotentialEarningsTokenRow
          key={`${token.chainId}:${token.address}`}
          token={token}
          apyDecimal={apyDecimal ?? 0}
          hasNoFee={isNoFeeToken(token)}
          privacyMode={privacyMode}
          onAddClick={() => onAddToken(token, index, tokens.length)}
          isAddDisabled={isAddDisabled}
        />
      ))}

      {tokens.length > MONEY_POTENTIAL_EARNINGS_VISIBLE_TOKEN_COUNT ? (
        <Box paddingLeft={4} paddingRight={4} paddingTop={3}>
          <Button
            variant={ButtonVariant.Secondary}
            size={ButtonSize.Lg}
            onClick={onViewAll}
            className="w-full"
            data-testid="money-potential-earnings-view-all"
          >
            {t('viewAll')}
          </Button>
        </Box>
      ) : null}
    </section>
  );
}
