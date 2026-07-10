import React, { useCallback } from 'react';
import { type RampsToken } from '@metamask/ramps-controller';
import {
  AvatarNetwork,
  AvatarNetworkSize,
  AvatarToken,
  BadgeWrapper,
  BadgeWrapperAnchorElementShape,
  Box,
  Text,
} from '../../../../../components/component-library';
import {
  AlignItems,
  BackgroundColor,
  BlockSize,
  Display,
  FlexDirection,
  TextColor,
  TextVariant,
} from '../../../../../helpers/constants/design-system';

export type RampsTokenListItemProps = {
  token: RampsToken;
  networkImage?: string;
  onSelect: (assetId: string) => void;
};

export function RampsTokenListItem({
  token,
  networkImage,
  onSelect,
}: RampsTokenListItemProps) {
  const handleClick = useCallback(() => {
    onSelect(token.assetId);
  }, [onSelect, token.assetId]);

  return (
    <Box
      as="button"
      type="button"
      display={Display.Flex}
      alignItems={AlignItems.center}
      width={BlockSize.Full}
      padding={4}
      gap={3}
      backgroundColor={BackgroundColor.transparent}
      className="ramps-token-list-item hover:bg-hover active:bg-pressed"
      onClick={handleClick}
      data-testid={`ramps-token-list-item-${token.assetId}`}
      disabled={!token.tokenSupported}
    >
      <BadgeWrapper
        anchorElementShape={BadgeWrapperAnchorElementShape.circular}
        badge={
          networkImage ? (
            <AvatarNetwork
              size={AvatarNetworkSize.Xs}
              name={token.symbol}
              src={networkImage}
              borderWidth={2}
            />
          ) : null
        }
      >
        <AvatarToken name={token.symbol} src={token.iconUrl} />
      </BadgeWrapper>

      <Box
        display={Display.Flex}
        flexDirection={FlexDirection.Column}
        style={{ flex: 1, minWidth: 0, textAlign: 'left' }}
      >
        <Text variant={TextVariant.bodyMdMedium} color={TextColor.textDefault}>
          {token.name}
        </Text>
        <Text variant={TextVariant.bodySm} color={TextColor.textAlternative}>
          {token.symbol}
        </Text>
      </Box>
    </Box>
  );
}

export default RampsTokenListItem;
