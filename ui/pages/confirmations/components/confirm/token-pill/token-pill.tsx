import React from 'react';
import { Hex } from '@metamask/utils';
import {
  AvatarNetwork,
  AvatarNetworkSize,
  AvatarToken,
  AvatarTokenSize,
  BadgeWrapper,
  Box,
  Icon,
  IconName,
  IconSize,
  Text,
} from '../../../../../components/component-library';
import {
  AlignItems,
  BorderColor,
  BorderRadius,
  Display,
  FlexDirection,
} from '../../../../../helpers/constants/design-system';
import { NATIVE_TOKEN_ADDRESS } from '../../../../../helpers/constants/intents';
import { getImageForChainId } from '../../../../../selectors/multichain';
import { useSelector } from 'react-redux';
import { getTokensAcrossChainsByAccountAddressSelector } from '../../../../../selectors';

export function TokenPill({
  tokenAddress,
  chainId,
  onClick,
}: {
  chainId: Hex;
  onClick?: () => void;
  tokenAddress: Hex;
}) {
  const tokens = useSelector((state) =>
    getTokensAcrossChainsByAccountAddressSelector(
      state,
      '0xB0dA5965D43369968574D399dBe6374683773a65'.toLowerCase(),
    ),
  );

  let token = (tokens as any)[chainId]?.find(
    (t) =>
      (t.address || NATIVE_TOKEN_ADDRESS).toLowerCase() ===
      tokenAddress.toLowerCase(),
  );

  const networkImageSrc = getImageForChainId(chainId);

  if (!token && tokenAddress === NATIVE_TOKEN_ADDRESS) {
    token = {
      address: NATIVE_TOKEN_ADDRESS,
      chainId,
      symbol: 'ETH',
      image: networkImageSrc,
    };
  }

  return (
    <Box
      display={Display.Flex}
      flexDirection={FlexDirection.Row}
      borderRadius={BorderRadius.pill}
      borderColor={BorderColor.borderMuted}
      alignItems={AlignItems.center}
      gap={2}
      paddingInline={2}
      onClick={onClick}
      style={{
        cursor: onClick ? 'pointer' : undefined,
      }}
    >
      <BadgeWrapper
        className="intents-network-icon-wrapper"
        badge={
          networkImageSrc ? (
            <AvatarNetwork
              className="intents-network-icon"
              size={AvatarNetworkSize.Xs}
              src={networkImageSrc}
              name={''}
            />
          ) : undefined
        }
      >
        <AvatarToken
          borderRadius={BorderRadius.full}
          src={token?.image}
          size={AvatarTokenSize.Xs}
        />
      </BadgeWrapper>
      <Text>{token?.symbol}</Text>
      {onClick && <Icon name={IconName.ArrowDown} size={IconSize.Sm} />}
    </Box>
  );
}
