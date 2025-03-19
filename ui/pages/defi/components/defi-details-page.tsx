import React, { useMemo } from 'react';
import { useHistory, useParams, Redirect } from 'react-router-dom';
import {
  Display,
  FlexDirection,
  IconColor,
  TextVariant,
} from '../../../helpers/constants/design-system';
import {
  Box,
  ButtonIcon,
  ButtonIconSize,
  IconName,
  SensitiveText,
  Text,
} from '../../../components/component-library';
import { useI18nContext } from '../../../hooks/useI18nContext';

import { DEFAULT_ROUTE } from '../../../helpers/constants/routes';

import { useSelector } from 'react-redux';
import { getDefiPositions } from '../../../components/app/assets/defi/defi-asset-list';
import { getSelectedAccount } from '../../../selectors';
import { ProtocolTokenWithMarketValue } from '../../../DeFiPositionsController/group-positions';
import { PositionType } from '../../../DeFiPositionsController/fetch-positions';
import DefiDetailsList from './defi-details-list';

const useExtractUnderlyingTokens = (
  positions?: ProtocolTokenWithMarketValue[][],
) =>
  useMemo(() => {
    if (!positions) return [[]];

    return positions.map((group) =>
      group.flatMap((position) => position.tokens.map((token) => token)),
    );
  }, [positions]);

export const DeFiPage = () => {
  const { chainId, protocolId } = useParams<{
    chainId: '0x' & string;
    protocolId: string;
  }>();

  if (!chainId || !protocolId) {
    return <Redirect to={{ pathname: DEFAULT_ROUTE }} />;
  }
  const defiPositions = useSelector(getDefiPositions);
  const selectedAccount = useSelector(getSelectedAccount);
  const history = useHistory();
  const t = useI18nContext();

  const protocolPosition =
    defiPositions[selectedAccount.address]?.[chainId]?.protocols[protocolId];

  if (!protocolPosition) {
    return <Redirect to={{ pathname: DEFAULT_ROUTE }} />;
  }

  const extractedTokens = useMemo(() => {
    return Object.keys(protocolPosition.positionTypes || {}).reduce(
      (acc, positionType) => {
        acc[positionType as PositionType] =
          protocolPosition.positionTypes[positionType as PositionType]
            ?.positions || [];
        return acc;
      },
      {} as Record<PositionType, ProtocolTokenWithMarketValue[][]>,
    );
  }, [protocolPosition]);

  const underlyingDefiTokens = {
    supply: useExtractUnderlyingTokens(extractedTokens.supply),
    borrow: useExtractUnderlyingTokens(extractedTokens.borrow),
    stake: useExtractUnderlyingTokens(extractedTokens.stake),
    reward: useExtractUnderlyingTokens(extractedTokens.reward),
  };

  return (
    <Box className="main-container asset__container">
      <Box paddingLeft={2}>
        <Box display={Display.Flex} paddingBottom={4} paddingTop={4}>
          <ButtonIcon
            color={IconColor.iconAlternative}
            marginRight={1}
            size={ButtonIconSize.Sm}
            ariaLabel={t('back')}
            iconName={IconName.ArrowLeft}
            onClick={() => history.push(DEFAULT_ROUTE)}
          />
        </Box>
      </Box>

      <Text variant={TextVariant.headingLg} paddingLeft={4} paddingBottom={2}>
        {protocolPosition.protocolDetails.name}
      </Text>
      <Box paddingLeft={4} paddingBottom={4}>
        <SensitiveText
          className="mm-box--color-text-alternative-soft"
          ellipsis
          variant={TextVariant.inherit}
          isHidden={false}
        >
          {'$'}
          {protocolPosition.aggregatedMarketValue}
        </SensitiveText>
      </Box>
      <Box paddingLeft={4} paddingBottom={4} paddingRight={4}>
        <hr style={{ border: '1px solid var(--border-muted, #858B9A33)' }} />
      </Box>
      <Box display={Display.Flex} flexDirection={FlexDirection.Column}>
        {['supply', 'borrow', 'stake', 'reward'].map((positionType) =>
          protocolPosition.positionTypes[positionType as PositionType] ? (
            <DefiDetailsList
              key={positionType}
              tokens={underlyingDefiTokens[positionType as PositionType]}
              positionType={positionType as PositionType}
              chainId={chainId}
            />
          ) : null,
        )}
      </Box>
    </Box>
  );
};

export default DeFiPage;
