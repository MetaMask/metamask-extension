import React, { useCallback } from 'react';
import {
  FontWeight,
  Text,
  TextColor,
  TextVariant,
} from '@metamask/design-system-react';
import type { TokenWithFiatAmount } from '../../assets/types';
import type { MoneyTokenListCta as MoneyTokenListCtaConfig } from '../../../../hooks/money/use-money-token-list-cta';

export type MoneyTokenListCtaProps = {
  cta: MoneyTokenListCtaConfig;
  token: TokenWithFiatAmount;
};

export const MONEY_TOKEN_LIST_CTA_TEST_ID = 'money-token-list-cta';

export const MoneyTokenListCta = ({ cta, token }: MoneyTokenListCtaProps) => {
  const handleClick = useCallback(
    (event: React.MouseEvent<HTMLButtonElement>) => {
      event.preventDefault();
      event.stopPropagation();
      cta.onClick(token);
    },
    [cta, token],
  );

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={cta.isLoading}
      className="m-0 cursor-pointer border-0 bg-transparent p-0"
      data-testid={`${MONEY_TOKEN_LIST_CTA_TEST_ID}-${token.chainId}-${token.address}`}
    >
      <Text
        className={cta.isLoading ? 'opacity-50' : undefined}
        variant={TextVariant.BodySm}
        fontWeight={FontWeight.Medium}
        color={TextColor.SuccessDefault}
      >
        {cta.label}
      </Text>
    </button>
  );
};
