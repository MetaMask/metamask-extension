import React, { useMemo } from 'react';
import { useSelector } from 'react-redux';

import {
  DeFiPositionsControllerState,
  GroupedDeFiPositions,
} from '@metamask/assets-controllers';
import { Hex } from '@metamask/utils';
import { getSelectedAccount, getTokenSortConfig } from '../../../../selectors';
import { useNetworkFilter } from '../hooks';
import { filterAssets } from '../util/filter';
import { sortAssets } from '../util/sort';
import {
  Display,
  FlexDirection,
  AlignItems,
  JustifyContent,
} from '../../../../helpers/constants/design-system';
import PulseLoader from '../../../ui/pulse-loader';
import { Box } from '../../../component-library';
import { useI18nContext } from '../../../../hooks/useI18nContext';

import { formatWithThreshold } from '../util/formatWithThreshold';
import { getIntlLocale } from '../../../../ducks/locale/locale';

import { DefiProtocolCell } from './cells/defi-protocol-cell';
import { DeFiErrorMessage } from './cells/defi-error-message';
import { DeFiEmptyState } from './cells/defi-empty-state';

export type DefiState = {
  metamask: DeFiPositionsControllerState;
};
export function getDefiPositions(
  state: DefiState,
): DeFiPositionsControllerState['allDeFiPositions'] {
  return state?.metamask?.allDeFiPositions;
}

type DefiListProps = {
  onClick: (chainId: string, protocolId: string) => void;
};

export type DeFiProtocolPosition = {
  chainId: Hex;
  tokenImage: string;
  symbolGroup: string;
  marketValue: string;
  title: string;
  protocolId: string;
  iconGroup: { avatarValue: string; symbol: string }[];
};

export default function DefiList({ onClick }: DefiListProps) {
  const t = useI18nContext();
  const { networkFilter } = useNetworkFilter();
  const locale = useSelector(getIntlLocale);

  const tokenSortConfig = useSelector(getTokenSortConfig);
  const selectedAccount = useSelector(getSelectedAccount);

  const allDefiPositions = useSelector(getDefiPositions);

  const sortedFilteredDefi = useMemo(() => {
    // error
    if (!selectedAccount) {
      return null;
    }

    // error
    if (!allDefiPositions) {
      return null;
    }

    const currentAddressDefiPositions =
      allDefiPositions?.[selectedAccount.address];

    // loading spinner
    if (currentAddressDefiPositions === undefined) {
      return undefined;
    }

    // error
    if (currentAddressDefiPositions === null) {
      return null;
    }

    const defiProtocolCells: DeFiProtocolPosition[] = Object.entries(
      currentAddressDefiPositions,
    ).flatMap(([chainId, chainData]) =>
      Object.entries(chainData.protocols).map(([protocolId, protocol]) => {
        const extractIconAndSymbols = (
          protocolPositions: GroupedDeFiPositions['protocols'][keyof GroupedDeFiPositions['protocols']],
        ) => {
          if (!protocolPositions?.positionTypes) {
            return [];
          }

          const iconsAndSymbols = Object.values(protocolPositions.positionTypes)
            .flatMap(
              (displayTokens) =>
                displayTokens?.positions?.flatMap(
                  (nestedToken) =>
                    nestedToken?.flatMap(
                      (token) =>
                        token?.tokens?.map((underlying) => ({
                          symbol: underlying?.symbol || '',
                          avatarValue: underlying?.iconUrl || '',
                        })) || [],
                    ) || [],
                ) || [],
            )
            .filter(Boolean);

          // Ensure 'ETH' or 'WETH' is at position 1
          const symbolPriority = ['ETH', 'WETH'];
          const firstTokenIndex = iconsAndSymbols.findIndex((item) =>
            symbolPriority.includes(item.symbol),
          );

          if (firstTokenIndex > -1) {
            const [firstItem] = iconsAndSymbols.splice(firstTokenIndex, 1);
            iconsAndSymbols.unshift(firstItem);
          }

          return iconsAndSymbols;
        };

        const buildSymbolGroup = (
          symbols: {
            symbol: string;
            avatarValue: string;
          }[],
        ): string => {
          if (symbols.length === 1) {
            return `${symbols[0].symbol} only`;
          } else if (symbols.length === 2) {
            return `${symbols[0].symbol} +${symbols.length - 1} other`;
          } else if (symbols.length > 2) {
            return `${symbols[0].symbol} +${symbols.length - 1} others`;
          }
          return '';
        };

        const { name: protocolName, iconUrl } = protocol.protocolDetails;
        const marketValue = protocol.aggregatedMarketValue;
        const iconGroup = extractIconAndSymbols(protocol);

        return {
          protocolId,
          title: protocolName,
          tokenImage: iconUrl,
          symbolGroup: buildSymbolGroup(iconGroup),
          marketValue: formatWithThreshold(marketValue, 0.01, locale, {
            style: 'currency',
            currency: 'USD',
          }),
          chainId: chainId as Hex,
          iconGroup,
        };
      }),
    );

    const filteredAssets = filterAssets(defiProtocolCells, [
      {
        key: 'chainId',
        opts: networkFilter,
        filterCallback: 'inclusive',
      },
    ]);

    // sort filtered tokens based on the tokenSortConfig in state
    return sortAssets(filteredAssets, tokenSortConfig);
  }, [
    allDefiPositions,
    locale,
    networkFilter,
    selectedAccount,
    tokenSortConfig,
  ]);

  if (sortedFilteredDefi === undefined) {
    return (
      <Box
        display={Display.Flex}
        flexDirection={FlexDirection.Column}
        alignItems={AlignItems.center}
        justifyContent={JustifyContent.center}
      >
        <PulseLoader />
      </Box>
    );
  }

  if (sortedFilteredDefi === null) {
    return (
      <DeFiErrorMessage
        title={t('defiTabErrorTitle')}
        text={t('defiTabErrorContent')}
      />
    );
  }

  return (
    <>
      {sortedFilteredDefi && sortedFilteredDefi.length > 0 ? (
        sortedFilteredDefi.map((position: DeFiProtocolPosition) => {
          return (
            <DefiProtocolCell
              key={`${position.protocolId}#${position.chainId}`}
              position={position}
              onClick={onClick}
            />
          );
        })
      ) : (
        <DeFiEmptyState
          primaryText={t('noDeFiPositions')}
          secondaryText={t('startEarning')}
        />
      )}
    </>
  );
}
