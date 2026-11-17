import React from 'react';
import { Hex } from '@metamask/utils';
import { useSelector } from 'react-redux';
import {
  AvatarNetwork,
  AvatarNetworkSize,
  BoxBackgroundColor,
  ContentVariant,
  Icon,
  IconColor,
  IconName,
  IconSize,
  ListItem,
  TextVariant,
} from '@metamask/design-system-react';
import { useI18nContext } from '../../../../../hooks/useI18nContext';
import { useImageForChainId } from '../../../../../hooks/useImageForChainId';
import { getMultichainNetworkConfigurationsByChainId } from '../../../../../selectors';
import { extractNetworkName } from '../helper';

type PermissionGroupListItemProps = {
  /**
   * The chain id to display
   */
  chainId: Hex;

  /**
   * The text to display
   */
  text: string;

  /**
   * The function to call when the permission group item is clicked
   */
  onClick: () => void;
};
export const PermissionGroupListItem = ({
  chainId,
  text,
  onClick,
}: PermissionGroupListItemProps) => {
  const t = useI18nContext();
  const networkImageUrl = useImageForChainId(chainId);
  const [, evmNetworks] = useSelector(
    getMultichainNetworkConfigurationsByChainId,
  );

  const getNetworkNameForChainId = () => {
    const networkNameKey = extractNetworkName(evmNetworks, chainId);
    const networkName = t(networkNameKey);

    // If the translation key doesn't exist (returns the same key), fall back to the full network name
    if (!networkName || networkName === networkNameKey) {
      return extractNetworkName(evmNetworks, chainId, true);
    }

    return networkName;
  };

  return (
    <ListItem
      variant={ContentVariant.TwoLines}
      isInteractive
      onClick={onClick}
      backgroundColor={BoxBackgroundColor.BackgroundDefault}
      data-testid="permission-group-list-item"
      avatar={
        <AvatarNetwork
          data-testid="permission-group-list-item__avatar-network"
          src={networkImageUrl}
          name={chainId}
          size={AvatarNetworkSize.Lg}
          style={{ borderRadius: '50%' }}
        />
      }
      title={getNetworkNameForChainId()}
      description={text}
      descriptionProps={{ variant: TextVariant.BodyMd }}
      endAccessory={
        <Icon
          name={IconName.ArrowRight}
          color={IconColor.IconDefault}
          size={IconSize.Sm}
        />
      }
    />
  );
};
