import React, { useMemo } from 'react';

import { GroupedDeFiPositions } from '@metamask/assets-controllers';
import { useSelector } from 'react-redux';
import { CHAIN_IDS } from '../../../../shared/constants/network';
import {
  TextColor,
  TextVariant,
} from '../../../helpers/constants/design-system';
import { Box, Text } from '../../../components/component-library';
import { useI18nContext } from '../../../hooks/useI18nContext';
import TokenCell from '../../../components/app/assets/token-cell';
import { getPreferences } from '../../../selectors';
import { TokenWithFiatAmount } from '../../../components/app/assets/types';
import { useSafeChains } from '../../settings/networks-tab/networks-form/use-safe-chains';
import { getTokenAvatarUrl } from '../../../components/app/assets/util/getTokenAvatarUrl';

export const PositionTypeLabels = {
  supply: 'supplied',
  stake: 'staked',
  borrow: 'borrowed',
  reward: 'rewards',
} as const;
export type PositionTypeLabels =
  (typeof PositionTypeLabels)[keyof typeof PositionTypeLabels];
export type PositionTypeKeys = keyof typeof PositionTypeLabels;

type Protocols = GroupedDeFiPositions['protocols'];
type Protocol = Protocols[keyof GroupedDeFiPositions['protocols']];
type ProtocolPositionTypes = Protocol['positionTypes'];
type PositionGroup = NonNullable<
  ProtocolPositionTypes[keyof ProtocolPositionTypes]
>;
export type ProtocolTokenWithMarketValue = NonNullable<
  PositionGroup['positions'][0][0]
>;
type UnderlyingWithMarketValue = NonNullable<
  ProtocolTokenWithMarketValue['tokens']
>[0];

const DefiDetailsList = React.memo(
  ({
    tokens,
    positionType,
    chainId,
  }: {
    tokens: UnderlyingWithMarketValue[][];
    positionType: PositionTypeKeys;
    chainId: (typeof CHAIN_IDS)[keyof typeof CHAIN_IDS];
  }) => {
    const t = useI18nContext();

    const { privacyMode } = useSelector(getPreferences);

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

    const mapTokenToCell = (
      token: UnderlyingWithMarketValue,
    ): TokenWithFiatAmount => {
      return {
        address: token.address as '0x' & string,
        title: token.symbol,
        symbol: token.name,
        tokenFiatAmount: token.marketValue,
        image: getTokenAvatarUrl(token),
        primary: token.marketValue?.toString() || '0',
        secondary: token.balance,
        string: token.balance.toString(),
        decimals: 10,
        chainId,
      };
    };

    const { safeChains } = useSafeChains();

    return (
      <>
        {groupedTokens.map(({ underlying, underlyingRewards }, index) => {
          const tokenGroups = [
            { type: 'underlying', tokenGroup: underlying },
            { type: 'underlyingRewards', tokenGroup: underlyingRewards },
          ];

          return (
            <Box key={index}>
              {tokenGroups.map(({ type, tokenGroup }) => {
                if (!tokenGroup || tokenGroup.length === 0) {
                  return null;
                }

                const label =
                  type === 'underlying'
                    ? t(
                        PositionTypeLabels[positionType as PositionTypeKeys] ||
                          positionType,
                      )
                    : t('reward');

                return (
                  <Box key={type}>
                    <Text
                      variant={TextVariant.bodyMdMedium}
                      paddingLeft={4}
                      color={TextColor.textAlternativeSoft}
                      data-testid={`defi-details-list-${positionType}-position`}
                    >
                      {label}
                    </Text>
                    {tokenGroup.map((token) => (
                      <TokenCell
                        key={`${chainId}-${token.address}`}
                        token={mapTokenToCell(token)}
                        privacyMode={privacyMode}
                        onClick={undefined}
                        fixCurrencyToUSD
                        safeChains={safeChains}
                      />
                    ))}
                  </Box>
                );
              })}

              {index !== groupedTokens.length - 1 && (
                <Box paddingLeft={4} paddingBottom={4} paddingRight={4}>
                  <hr
                    style={{
                      border: '1px solid var(--border-muted, #858B9A33)',
                    }}
                  />
                </Box>
              )}
            </Box>
          );
        })}
      </>
    );
  },
);

export default DefiDetailsList;
