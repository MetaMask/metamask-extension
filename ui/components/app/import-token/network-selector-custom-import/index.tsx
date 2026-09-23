import React from 'react';
import {
  BackgroundColor,
  BorderColor,
  BorderRadius,
} from '../../../../helpers/constants/design-system';
import {
  SelectButton,
  SelectButtonSize,
  AvatarNetwork,
  AvatarNetworkSize,
} from '../../../component-library';
import { getImageForChainId } from '../../../../selectors/multichain';

export const NetworkSelectorCustomImport = ({
  title,
  buttonDataTestId,
  chainId,
  onSelectNetwork,
}: {
  title: string;
  buttonDataTestId: string;
  chainId: string;
  onSelectNetwork: () => void;
}) => {
  const networkImageUrl = getImageForChainId(chainId);

  return (
    <SelectButton
      size={SelectButtonSize.Lg}
      isBlock
      backgroundColor={BackgroundColor.backgroundMuted}
      borderColor={BorderColor.borderDefault}
      borderRadius={BorderRadius.XL}
      startAccessory={
        networkImageUrl ? (
          <AvatarNetwork
            key={networkImageUrl}
            name={networkImageUrl ?? ''}
            src={networkImageUrl ?? undefined}
            size={AvatarNetworkSize.Xs}
            className="rounded-md"
          />
        ) : undefined
      }
      onClick={onSelectNetwork}
      data-testid={buttonDataTestId}
    >
      {title}
    </SelectButton>
  );
};

export default NetworkSelectorCustomImport;
