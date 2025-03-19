import React, { useMemo } from 'react';

import {
  TextColor,
  TextVariant,
} from '../../../helpers/constants/design-system';
import { Text } from '../../../components/component-library';
import { useI18nContext } from '../../../hooks/useI18nContext';
import TokenCell from '../../../components/app/assets/token-cell';

import { UnderlyingWithMarketValue } from '../../../DeFiPositionsController/group-positions';
import { PositionType } from '../../../DeFiPositionsController/fetch-positions';

const positionTypeLabels: Record<PositionType, string> = {
  supply: 'supplied',
  stake: 'staked',
  borrow: 'borrowed',
  reward: 'rewards',
};

const DefiDetailsList = React.memo(
  ({
    tokens,
    positionType,
    chainId,
  }: {
    tokens: UnderlyingWithMarketValue[][];
    positionType: PositionType;
    chainId: '0x' & string;
  }) => {
    const t = useI18nContext();

    const groupedTokens = useMemo(() => {
      return tokens.map((tokenGroup) => {
        return tokenGroup.reduce(
          (acc, token) => {
            if (token.type === 'underlying') {
              acc.underlying.push(token);
            } else if (token.type === 'underlying-claimable') {
              acc.underlyingRewards.push(token);
            }
            return acc;
          },
          {
            underlying: [] as UnderlyingWithMarketValue[],
            underlyingRewards: [] as UnderlyingWithMarketValue[],
          },
        );
      });
    }, [tokens]);

    return (
      <>
        {groupedTokens.map(({ underlying, underlyingRewards }, index) => (
          <React.Fragment key={index}>
            {underlying.length > 0 && (
              <>
                <Text
                  variant={TextVariant.bodySm}
                  paddingLeft={4}
                  color={TextColor.textAlternativeSoft}
                  paddingBottom={4}
                >
                  {t(positionTypeLabels[positionType] || positionType)}
                </Text>
                {underlying.map((token) => (
                  <TokenCell
                    key={`${chainId}-${token.address}`}
                    location="DefiDetailsTab"
                    token={{
                      address: token.address as '0x' & string,
                      title: token.symbol,
                      symbol: token.name,
                      tokenFiatAmount: token.marketValue,
                      image: token.iconUrl,
                      primary: token.marketValue?.toString() || '0',
                      secondary: token.balance,
                      string: token.balance.toString(),
                      decimals: 10,
                      chainId: chainId,
                    }}
                    privacyMode={false}
                  />
                ))}
              </>
            )}

            {underlyingRewards.length > 0 && (
              <>
                <Text
                  variant={TextVariant.bodySm}
                  paddingLeft={4}
                  paddingBottom={4}
                  color={TextColor.textAlternativeSoft}
                >
                  {t('reward')}
                </Text>
                {underlyingRewards.map((token) => (
                  <TokenCell
                    key={`${chainId}-${token.address}`}
                    location="DefiDetailsTab"
                    token={{
                      address: token.address as '0x' & string,
                      title: token.symbol,
                      symbol: token.name,
                      tokenFiatAmount: token.marketValue,
                      image: token.iconUrl,
                      primary: token.marketValue?.toString() || '0',
                      secondary: token.balance,
                      string: token.balance.toString(),
                      decimals: 10,
                      chainId: chainId,
                    }}
                    privacyMode={false}
                  />
                ))}
              </>
            )}
          </React.Fragment>
        ))}
      </>
    );
  },
);

export default DefiDetailsList;
