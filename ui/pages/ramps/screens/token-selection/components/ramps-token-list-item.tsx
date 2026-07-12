import React, { useCallback } from 'react';
import { type RampsToken } from '@metamask/ramps-controller';
import {
  AvatarNetwork,
  AvatarNetworkSize,
  AvatarToken,
  AvatarTokenSize,
  BadgeWrapper,
  Box,
  BoxAlignItems,
  BoxFlexDirection,
  ButtonBase,
  FontWeight,
  Text,
  TextColor,
  TextVariant,
} from '@metamask/design-system-react';

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
    <ButtonBase
      onClick={handleClick}
      disabled={!token.tokenSupported}
      className="ramps-token-list-item hover:bg-hover active:bg-pressed flex w-full min-w-0 items-center gap-3 bg-transparent p-4 h-auto"
      data-testid={`ramps-token-list-item-${token.assetId}`}
    >
      <BadgeWrapper
        badge={
          networkImage ? (
            <AvatarNetwork
              size={AvatarNetworkSize.Xs}
              name={token.symbol}
              src={networkImage}
              hasBorder
              style={{ borderWidth: 2 }}
            />
          ) : null
        }
      >
        <AvatarToken
          name={token.symbol}
          src={token.iconUrl}
          size={AvatarTokenSize.Md}
        />
      </BadgeWrapper>

      <Box
        flexDirection={BoxFlexDirection.Column}
        alignItems={BoxAlignItems.Start}
        className="min-w-0 flex-1 text-left"
      >
        <Text
          variant={TextVariant.BodyMd}
          fontWeight={FontWeight.Medium}
          color={TextColor.TextDefault}
        >
          {token.name}
        </Text>
        <Text variant={TextVariant.BodySm} color={TextColor.TextAlternative}>
          {token.symbol}
        </Text>
      </Box>
    </ButtonBase>
  );
}

export default RampsTokenListItem;
