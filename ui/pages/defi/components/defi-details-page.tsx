import React, { useMemo } from 'react';
import { useHistory, useParams, Redirect } from 'react-router-dom';
import { useSelector } from 'react-redux';
import {
  Display,
  FlexDirection,
  IconColor,
  JustifyContent,
  TextVariant,
} from '../../../helpers/constants/design-system';
import {
  Box,
  ButtonIcon,
  ButtonIconSize,
  IconName,
  SensitiveText,
  SensitiveTextLength,
  Text,
} from '../../../components/component-library';
import { useI18nContext } from '../../../hooks/useI18nContext';

import { DEFAULT_ROUTE } from '../../../helpers/constants/routes';

import { getPreferences, getSelectedAccount } from '../../../selectors';
import { CHAIN_IDS } from '../../../../shared/constants/network';
import { formatWithThreshold } from '../../../components/app/assets/util/formatWithThreshold';
import { AssetCellBadge } from '../../../components/app/assets/asset-list/cells/asset-cell-badge';
import { getDefiPositions } from '../../../selectors/assets';
import DefiDetailsList, {
  PositionTypeKeys,
  PositionTypeLabels,
  ProtocolTokenWithMarketValue,
} from './defi-details-list';

const useExtractUnderlyingTokens = (
  positions?: ProtocolTokenWithMarketValue[][],
) =>
  useMemo(() => {
    if (!positions) {
      return [[]];
    }

    return positions.map((group) =>
      group.flatMap((position) => position.tokens.map((token) => token)),
    );
  }, [positions]);

const DeFiPage = () => {
  const { chainId, protocolId } = useParams<{
    chainId: '0x' & string;
    protocolId: string;
  }>() as { chainId: '0x' & string; protocolId: string };

  const defiPositions = useSelector(getDefiPositions);
  const selectedAccount = useSelector(getSelectedAccount);

  const history = useHistory();
  const t = useI18nContext();
  const { privacyMode } = useSelector(getPreferences);

  const protocolPosition =
    defiPositions[selectedAccount.address]?.[chainId]?.protocols[protocolId];

  const extractedTokens = useMemo(() => {
    return Object.keys(protocolPosition?.positionTypes || {}).reduce(
      (acc, positionType) => {
        acc[positionType as PositionTypeKeys] =
          protocolPosition?.positionTypes[positionType as PositionTypeKeys]
            ?.positions || [];
        return acc;
      },
      {} as Record<PositionTypeKeys, ProtocolTokenWithMarketValue[][]>,
    );
  }, [protocolPosition]);

  const underlyingDefiTokens = {
    supply: useExtractUnderlyingTokens(extractedTokens.supply),
    borrow: useExtractUnderlyingTokens(extractedTokens.borrow),
    stake: useExtractUnderlyingTokens(extractedTokens.stake),
    reward: useExtractUnderlyingTokens(extractedTokens.reward),
  };

  if (!protocolPosition) {
    return <Redirect to={{ pathname: DEFAULT_ROUTE }} />;
  }

  return (
    <Box className="main-container asset__container">
      <Box
        paddingLeft={2}
        display={Display.Flex}
        paddingBottom={4}
        paddingTop={4}
      >
        <ButtonIcon
          data-testid="defi-details-page-back-button"
          color={IconColor.iconAlternative}
          marginRight={1}
          size={ButtonIconSize.Sm}
          ariaLabel={t('back')}
          iconName={IconName.ArrowLeft}
          onClick={() => history.push(DEFAULT_ROUTE)}
        />
      </Box>

      <Box
        display={Display.Flex}
        flexDirection={FlexDirection.Row}
        justifyContent={JustifyContent.spaceBetween}
        paddingRight={4}
      >
        <Text
          variant={TextVariant.headingLg}
          paddingLeft={4}
          paddingBottom={2}
          data-testid="defi-details-page-title"
        >
          {protocolPosition.protocolDetails.name}
        </Text>
        <AssetCellBadge
          chainId={chainId}
          tokenImage={protocolPosition.protocolDetails.iconUrl}
          symbol={protocolPosition.protocolDetails.name}
          data-testid="defi-details-page-protocol-badge"
        />
      </Box>
      <Box paddingLeft={4} paddingBottom={4}>
        <SensitiveText
          data-testid="defi-details-page-market-value"
          className="mm-box--color-text-alternative-soft"
          ellipsis
          variant={TextVariant.inherit}
          isHidden={privacyMode}
          length={SensitiveTextLength.Medium}
        >
          {formatWithThreshold(
            protocolPosition.aggregatedMarketValue,
            0.0,
            'USD',
            {
              style: 'currency',
              currency: 'USD',
            },
          )}
        </SensitiveText>
      </Box>
      <Box paddingLeft={4} paddingBottom={4} paddingRight={4}>
        <hr style={{ border: '1px solid var(--border-muted, #858B9A33)' }} />
      </Box>
      <Box display={Display.Flex} flexDirection={FlexDirection.Column}>
        {Object.keys(PositionTypeLabels).map((positionType) =>
          protocolPosition.positionTypes[positionType as PositionTypeKeys] ? (
            <DefiDetailsList
              key={positionType}
              tokens={underlyingDefiTokens[positionType as PositionTypeKeys]}
              positionType={positionType as PositionTypeKeys}
              chainId={chainId as (typeof CHAIN_IDS)[keyof typeof CHAIN_IDS]}
            />
          ) : null,
        )}
      </Box>
    </Box>
  );
};

export default DeFiPage;
