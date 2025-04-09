import React, { useContext, useMemo } from 'react';
import { useSelector } from 'react-redux';

import {
  DeFiPositionsControllerState,
  GroupedPositions,
} from '@metamask/assets-controllers';
import { Box } from '@material-ui/core';
import TokenCell from '../token-cell';
import {
  getPreferences,
  getSelectedAccount,
  getTokenSortConfig,
} from '../../../../selectors';
import { useNetworkFilter } from '../hooks';
import { TokenWithFiatAmount } from '../types';
import { filterAssets } from '../util/filter';
import { sortAssets } from '../util/sort';
import {
  Display,
  FlexDirection,
  AlignItems,
  JustifyContent,
} from '../../../../helpers/constants/design-system';
import PulseLoader from '../../../ui/pulse-loader';
import { AvatarGroup } from '../../../multichain';
import { AvatarType } from '../../../multichain/avatar-group/avatar-group.types';
import { MetaMetricsContext } from '../../../../contexts/metametrics';
import {
  MetaMetricsEventCategory,
  MetaMetricsEventName,
} from '../../../../../shared/constants/metametrics';

export type DefiState = {
  metamask: DeFiPositionsControllerState;
};
export function getDefiPositions(
  state: DefiState,
): DeFiPositionsControllerState['allDeFiPositions'] {
  console.log('getDefiPositions', state);

  return state?.metamask?.allDeFiPositions;
}

type DefiListProps = {
  onClick: (chainId: string, protocolId: string) => void;
};

type DeFiProtocolPosition = TokenWithFiatAmount & {
  protocolId: string;
  iconGroup: { avatarValue: string; symbol: string }[];
};

function DefiList({ onClick }: DefiListProps) {
  const { networkFilter } = useNetworkFilter();
  const { privacyMode } = useSelector(getPreferences);
  const tokenSortConfig = useSelector(getTokenSortConfig);
  const selectedAccount = useSelector(getSelectedAccount);
  const trackEvent = useContext(MetaMetricsContext);

  const defiPositions = useSelector(getDefiPositions);
  const defiData = selectedAccount
    ? defiPositions?.[selectedAccount.address]
    : null;

  const extractIconGroup = (
    protocolPositions: GroupedPositions['protocols'][keyof GroupedPositions['protocols']],
  ) => {
    if (!protocolPositions?.positionTypes) {
      return [];
    }

    return Object.values(protocolPositions.positionTypes).flatMap(
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
    );
  };

  const sortedFilteredDefi = useMemo(() => {
    if (!defiData) {
      return [];
    }

    const defiProtocolCells: DeFiProtocolPosition[] = Object.entries(
      defiData,
    ).flatMap(([chainId, chainData]) =>
      Object.entries(chainData.protocols).map(([protocolId, protocol]) => {
        const iconGroup = extractIconGroup(protocol);
        return {
          protocolId,
          // Currently we don't have an address for a protocol
          // Protocols have many addresses - perhaps one day the Protocol's Govenance Contract address might make sense here
          // Note: this is also the case for native tokens - they also dont have an address
          address: '0x',
          title: protocol.protocolDetails.name,
          symbol: protocol.protocolDetails.name,
          tokenFiatAmount: protocol.aggregatedMarketValue,
          image: protocol.protocolDetails.iconUrl,
          primary: protocol.aggregatedMarketValue.toString(),
          secondary: protocol.aggregatedMarketValue,
          decimals: 10,
          chainId: chainId as '0x' & string,
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
  }, [defiData, networkFilter, tokenSortConfig]);

  const handleTokenClick = (token: DeFiProtocolPosition) => () => {
    onClick(token.chainId, token.protocolId);

    trackEvent({
      category: MetaMetricsEventCategory.DeFi,
      event: MetaMetricsEventName.DefiDetailsOpened,
      properties: {
        location: 'Home',
        chain_id: token.chainId,
        protocol_id: token.protocolId,
      },
    });
  };

  console.log('DefiList', defiData);

  console.log('sortedFilteredDefi', sortedFilteredDefi);

  if (!defiData) {
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

  return (
    <>
      {sortedFilteredDefi.length > 0 ? (
        sortedFilteredDefi.map((token: DeFiProtocolPosition) => {
          return (
            <TokenCell
              key={`${token.chainId}-${token.protocolId}`}
              token={token}
              privacyMode={privacyMode}
              onClick={handleTokenClick(token)}
              primaryDisplayOverride={() => (
                <AvatarGroup
                  avatarType={AvatarType.TOKEN}
                  limit={4}
                  members={token.iconGroup}
                />
              )}
              fixCurrencyToUSD={true}
            />
          );
        })
      ) : (
        <TokenCell
          key={`empty-defi-list`}
          token={{
            address: '0x',
            title: 'Start earning',
            symbol: 'Start earning',
            tokenFiatAmount: 0,
            image: `images/fox.png`,
            primary: '0',
            secondary: 0,
            decimals: 10,
            chainId: '0x1',
            isStakeable: true,
          }}
          primaryDisplayOverride={() => <></>}
          privacyMode={privacyMode}
          onClick={undefined}
          fixCurrencyToUSD={true}
        />
      )}
    </>
  );
}

export default React.memo(DefiList);
