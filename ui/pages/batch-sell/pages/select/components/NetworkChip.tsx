import {
  AvatarNetwork,
  AvatarNetworkSize,
  ButtonBase,
  FontWeight,
  Text,
  TextColor,
  TextVariant,
  twMerge,
} from '@metamask/design-system-react';
import { CaipChainId } from '@metamask/utils';
import React from 'react';

type NetworkChipProps = {
  network: {
    chainId: CaipChainId;
    name: string;
    imageUrl: string
  };
  isSelected?: boolean;
  onClick: (chainId: CaipChainId) => void;
}

export const NetworkChip = ({
  network,
  isSelected,
  onClick,
}: NetworkChipProps) => {
  return (
    <ButtonBase
      className={twMerge(
        'flex flex-row gap-2 p-2 items-center h-8 rounded-2 shrink-0',
        isSelected ? 'bg-icon-default' : 'bg-muted hover:bg-muted-hover',
      )}
      onClick={() => onClick(network.chainId)}
    >
      <AvatarNetwork
        name={network.name}
        src={network.imageUrl}
        size={AvatarNetworkSize.Xs}
      />
      <Text
        variant={TextVariant.BodySm}
        fontWeight={FontWeight.Medium}
        color={isSelected ? TextColor.PrimaryInverse : TextColor.TextDefault}
      >
        {network.name}
      </Text>
    </ButtonBase>
  );
};
