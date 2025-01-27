import React, { useState } from 'react';
import { useSelector } from 'react-redux';
import { getImageForChainId } from '../../../../selectors/multichain';
import {
  AvatarNetwork,
  AvatarNetworkSize,
  AvatarToken,
  BadgeWrapper,
  Box,
  Icon,
  IconSize,
  Text,
} from '../../../component-library';
import {
  Display,
  FlexDirection,
  BackgroundColor,
  BorderRadius,
  JustifyContent,
  AlignItems,
  FontWeight,
} from '../../../../helpers/constants/design-system';
import { Hex } from '@metamask/utils';
import { formatWithThreshold } from '../token-cell/token-cell';
import { IconName } from '@metamask/snaps-sdk/jsx';
import { getNetworkConfigurationsByChainId } from '../../../../../shared/modules/selectors/networks';
import { GroupedPositionsResponse } from '../../../../../shared/types/defi';
import { DefiPositions } from './defi-position';

export const DefiProtocolListItem = ({
  key,
  chain,
  protocolName,
  iconUrl,
  aggrigatedValues,
  positions,
}: {
  key: string;
  chain: Hex;
  protocolName: string;
  iconUrl: string;
  aggrigatedValues: Partial<Record<'borrow' | 'supply' | 'stake', number>>;
  positions: GroupedPositionsResponse;
}) => {
  const [isOpen, setIsOpen] = useState(false);

  const allNetworks = useSelector(getNetworkConfigurationsByChainId);

  const tokenChainImage = getImageForChainId(chain);

  const suppliedTokens: any[] = [];
  const borrowTokens: any[] = [];
  const rewardTokens: any[] = [];

  const tvl =
    (aggrigatedValues.supply || 0) +
    (aggrigatedValues.stake || 0) -
    (aggrigatedValues.borrow || 0);

  positions.positions.forEach((position) => {
    position.tokens.forEach((tokenGroup: any) => {
      tokenGroup.tokens.forEach((underlyingToken: { type: string }) => {
        switch (underlyingToken.type) {
          case 'underlying':
            if (
              position.positionType === 'supply' ||
              position.positionType === 'stake'
            ) {
              suppliedTokens.push(underlyingToken);
            } else if (position.positionType === 'borrow') {
              borrowTokens.push(underlyingToken);
            }
            break;
          case 'underlying-claimable':
            rewardTokens.push(underlyingToken);
            break;
        }
      });
    });
  });

  return (
    <Box
      display={Display.Flex}
      flexDirection={FlexDirection.Column}
      backgroundColor={BackgroundColor.backgroundHover}
      borderRadius={BorderRadius.LG}
      padding={4}
      style={{ boxShadow: '0 2px 6px rgba(0, 0, 0, 0.1)', maxWidth: '1000px' }}
      gap={4}
      margin={[5, 'auto']}
    >
      {/* Header */}
      <Box
        display={Display.Flex}
        justifyContent={JustifyContent.spaceBetween}
        alignItems={AlignItems.center}
        onClick={() => setIsOpen(!isOpen)}
        style={{ cursor: 'pointer' }}
      >
        <Box display={Display.Flex} gap={2} alignItems={AlignItems.center}>
          <BadgeWrapper
            badge={
              <AvatarNetwork
                size={AvatarNetworkSize.Xs}
                name={allNetworks?.[chain]?.name}
                src={tokenChainImage || undefined}
                className="multichain-token-list-item__badge__avatar-network"
              />
            }
            marginRight={4}
            className="multichain-token-list-item__badge"
          >
            <AvatarToken name={protocolName} src={iconUrl} />
          </BadgeWrapper>
          <Text
            as="span"
            paddingInlineStart={1}
            paddingInlineEnd={1}
            fontWeight={FontWeight.Medium}
          >
            {protocolName}
          </Text>
        </Box>
        <Box display={Display.Flex} gap={2} alignItems={AlignItems.center}>
          <Box as="span" style={{ fontWeight: '500' }}>
            {formatWithThreshold(tvl, 0.01, 'en-US', {
              style: 'currency',
              currency: 'USD',
            })}
          </Box>
          {isOpen ? (
            <Icon
              name={IconName.ArrowUp}
              size={IconSize.Sm}
              marginInlineStart={1}
            />
          ) : (
            <Icon
              name={IconName.ArrowDown}
              size={IconSize.Sm}
              marginInlineStart={1}
            />
          )}
        </Box>
      </Box>

      {/* Collapsible Content */}
      {isOpen && (
        <>
          <DefiPositions
            suppliedTokens={suppliedTokens}
            positionType="Supplied"
          />
          {borrowTokens.length > 0 && (
            <DefiPositions
              suppliedTokens={borrowTokens}
              positionType="Borrows"
            />
          )}
          {rewardTokens.length > 0 && (
            <DefiPositions
              suppliedTokens={rewardTokens}
              positionType="Rewards"
            />
          )}
        </>
      )}
    </Box>
  );
};
