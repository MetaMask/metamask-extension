import React, { useContext, useMemo } from 'react';
import { useSelector } from 'react-redux';

import {
  DeFiPositionsControllerState,
  GroupedDeFiPositions,
} from '@metamask/assets-controllers';

import { Hex } from '@metamask/utils';
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
  BlockSize,
  TextVariant,
  TextAlign,
} from '../../../../helpers/constants/design-system';
import PulseLoader from '../../../ui/pulse-loader';
import { AvatarGroup } from '../../../multichain/avatar-group/avatar-group';
import { AvatarType } from '../../../multichain/avatar-group/avatar-group.types';
import { MetaMetricsContext } from '../../../../contexts/metametrics';
import {
  MetaMetricsEventCategory,
  MetaMetricsEventName,
} from '../../../../../shared/constants/metametrics';
import {
  Box,
  Icon,
  IconName,
  IconSize,
  Text,
} from '../../../component-library';
import { useI18nContext } from '../../../../hooks/useI18nContext';

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

type DeFiProtocolPosition = TokenWithFiatAmount & {
  protocolId: string;
  iconGroup: { avatarValue: string; symbol: string }[];
};

export function ErrorMessage({ title, text }: { title: string; text: string }) {
  return (
    <Box
      height={BlockSize.Full}
      width={BlockSize.Full}
      display={Display.Flex}
      justifyContent={JustifyContent.center}
      alignItems={AlignItems.center}
      flexDirection={FlexDirection.Column}
      gap={2}
      data-testid="defi-tab-error-message"
    >
      <Icon name={IconName.Warning} size={IconSize.Xl} />
      <Text variant={TextVariant.headingSm}>{title}</Text>
      <Text variant={TextVariant.bodyMd} textAlign={TextAlign.Center}>
        {text}
      </Text>
    </Box>
  );
}

const DEFI_EMPTY_STATE_TOKEN = {
  address: '0x' as Hex,
  title: 'Start earning',
  symbol: 'Start earning',
  tokenFiatAmount: 0,
  image: `images/logo/metamask-fox.svg`,
  primary: '0',
  secondary: 0,
  decimals: 10,
  chainId: '0x1' as Hex,
  isStakeable: true,
};

function DefiList({ onClick }: DefiListProps) {
  const t = useI18nContext();
  const { networkFilter } = useNetworkFilter();
  const { privacyMode } = useSelector(getPreferences);
  const tokenSortConfig = useSelector(getTokenSortConfig);
  const selectedAccount = useSelector(getSelectedAccount);
  const trackEvent = useContext(MetaMetricsContext);

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
        const extractIconGroup = (
          protocolPositions: GroupedDeFiPositions['protocols'][keyof GroupedDeFiPositions['protocols']],
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
  }, [allDefiPositions, networkFilter, selectedAccount, tokenSortConfig]);

  const handleTokenClick = (token: DeFiProtocolPosition) => () => {
    onClick(token.chainId, token.protocolId);

    trackEvent({
      category: MetaMetricsEventCategory.DeFi,
      event: MetaMetricsEventName.DeFiDetailsOpened,
      properties: {
        location: 'Home',
        chain_id: token.chainId,
        protocol_id: token.protocolId,
      },
    });
  };

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
      <ErrorMessage
        title={t('defiTabErrorTitle')}
        text={t('defiTabErrorContent')}
      />
    );
  }

  return (
    <>
      {sortedFilteredDefi && sortedFilteredDefi?.length > 0 ? (
        sortedFilteredDefi.map((token: DeFiProtocolPosition) => {
          return (
            <TokenCell
              key={`${token.chainId}-${token.protocolId}`}
              token={token}
              privacyMode={privacyMode}
              onClick={handleTokenClick(token)}
              TokenCellPrimaryDisplayOverride={() => (
                <AvatarGroup
                  avatarType={AvatarType.TOKEN}
                  limit={4}
                  members={token.iconGroup}
                  data-testid="defi-list-avatar-group"
                />
              )}
              fixCurrencyToUSD={true}
            />
          );
        })
      ) : (
        <TokenCell
          key={`empty-defi-list`}
          token={DEFI_EMPTY_STATE_TOKEN}
          privacyMode={privacyMode}
          onClick={undefined}
          fixCurrencyToUSD={true}
        />
      )}
    </>
  );
}

export default React.memo(DefiList);
