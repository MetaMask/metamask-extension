import React, { useMemo } from 'react';

import {
  TextColor,
  TextVariant,
} from '../../../helpers/constants/design-system';
import { Box, Text } from '../../../components/component-library';
import { useI18nContext } from '../../../hooks/useI18nContext';
import TokenCell from '../../../components/app/assets/token-cell';
import { GroupedPositions } from '@metamask/assets-controllers';
import { TokenCellLocation } from '../../../components/app/assets/token-cell/token-cell';

const PositionTypeLabels = {
  supply: 'supplied',
  stake: 'staked',
  borrow: 'borrowed',
  reward: 'rewards',
} as const;
export type PositionTypeLabels = (typeof PositionTypeLabels)[keyof typeof PositionTypeLabels];
export type PositionTypeKeys = keyof typeof PositionTypeLabels;

type Protocols = GroupedPositions['protocols'];
type Protocol = Protocols[keyof GroupedPositions['protocols']];
type ProtocolPositionTypes = Protocol['positionTypes'];
type PositionGroup = NonNullable<ProtocolPositionTypes[keyof ProtocolPositionTypes]>;
export type ProtocolTokenWithMarketValue = NonNullable<PositionGroup['positions'][0][0]>
type UnderlyingWithMarketValue = NonNullable<ProtocolTokenWithMarketValue['tokens']>[0];

const DefiDetailsList = React.memo(
  ({
    tokens,
    positionType,
    chainId,
  }: {
    tokens: UnderlyingWithMarketValue[][];
    positionType: PositionTypeKeys ;
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
          <Box key={index}>
            {underlying.length > 0 && (
              <>
                <Text
                  variant={TextVariant.bodySm}
                  paddingLeft={4}
                  color={TextColor.textAlternativeSoft}
                  paddingBottom={4}
                >
                  {t(PositionTypeLabels[positionType as PositionTypeKeys] || positionType)}
                </Text>
                {underlying.map((token) => (
                  <TokenCell
                    key={`${chainId}-${token.address}`}
                    location={TokenCellLocation.DefiDetailsTab}
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
                    onClick={undefined}
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
                    location={TokenCellLocation.DefiDetailsTab}
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
                    onClick={undefined}
                  />
                ))}
              </>
            )}
          </Box>
        ))}
      </>
    );
  },
);

export default DefiDetailsList;
