import React, { useMemo } from 'react';
import { useSelector } from 'react-redux';
import { Hex } from '@metamask/utils';
import {
  getEnabledNetworksByNamespace,
  getSelectedAccount,
  getTokenSortConfig,
} from '../../../../selectors';
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

import { extractUniqueIconAndSymbols } from '../util/extractIconAndSymbol';
import { getDefiPositions } from '../../../../selectors/assets';
import { DeFiProtocolPosition } from '../types';
import { isGlobalNetworkSelectorRemoved } from '../../../../selectors/selectors';
import { DeFiErrorMessage } from './cells/defi-error-message';
import { DeFiEmptyStateMessage } from './cells/defi-empty-state';
import DefiProtocolCell from './cells/defi-protocol-cell';

type DefiListProps = {
  onClick: (chainId: string, protocolId: string) => void;
};

// TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
// eslint-disable-next-line @typescript-eslint/naming-convention
export default function DefiList({ onClick }: DefiListProps) {
  const t = useI18nContext();
  const { networkFilter } = useNetworkFilter();
  const enabledNetworksByNamespace = useSelector(getEnabledNetworksByNamespace);
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
        const { name: protocolName, iconUrl } = protocol.protocolDetails;
        const marketValue = protocol.aggregatedMarketValue;
        const iconGroup = extractUniqueIconAndSymbols(protocol);

        return {
          protocolId,
          title: protocolName,
          tokenImage: iconUrl,
          underlyingSymbols: iconGroup.map(({ symbol }) => symbol),
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
        opts: isGlobalNetworkSelectorRemoved
          ? enabledNetworksByNamespace
          : networkFilter,
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
    enabledNetworksByNamespace,
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
        <DeFiEmptyStateMessage
          primaryText={t('noDeFiPositions')}
          secondaryText={t('startEarning')}
        />
      )}
    </>
  );
}
