import React from 'react';
import {
  AvatarNetwork,
  AvatarNetworkSize,
  ButtonBase,
  IconColor,
  IconName,
  Text,
  TextVariant,
} from '@metamask/design-system-react';
import { getImageForChainId } from '../../../../selectors/multichain';

export const NetworkSelectorCustomImport = ({
  title,
  ariaLabel,
  buttonDataTestId,
  chainId,
  onSelectNetwork,
}: {
  title: string;
  ariaLabel: string;
  buttonDataTestId: string;
  chainId: string;
  onSelectNetwork: () => void;
}) => {
  const networkImageUrl = chainId ? getImageForChainId(chainId) : undefined;

  return (
    <ButtonBase
      type="button"
      aria-label={ariaLabel}
      className="h-12 w-full justify-between gap-x-2 rounded-xl border border-muted bg-muted px-4 font-normal text-left hover:bg-muted active:scale-100"
      onClick={onSelectNetwork}
      data-testid={buttonDataTestId}
      startAccessory={
        chainId ? (
          <AvatarNetwork
            key={networkImageUrl ?? chainId}
            name={title}
            src={networkImageUrl}
            size={AvatarNetworkSize.Xs}
            className="flex shrink-0 rounded-md"
          />
        ) : undefined
      }
      endIconName={IconName.ArrowDown}
      endIconProps={{ color: IconColor.IconDefault }}
    >
      <Text
        variant={TextVariant.BodyMd}
        ellipsis
        className="min-w-0 flex-1 text-left"
      >
        {title}
      </Text>
    </ButtonBase>
  );
};

export default NetworkSelectorCustomImport;
