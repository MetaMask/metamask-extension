import React from 'react';
import { Hex } from '@metamask/utils';
import { useSelector } from 'react-redux';
import {
  Button,
  BoxAlignItems,
  BoxBackgroundColor,
  IconColor,
  BoxJustifyContent,
  TextColor,
  Box,
  BoxFlexDirection,
  AvatarNetwork,
  AvatarNetworkSize,
  Icon,
  IconName,
  IconSize,
  Text,
  TextVariant,
} from '@metamask/design-system-react';
import { useI18nContext } from '../../../../../hooks/useI18nContext';
import { getImageForChainId } from '../../../../../selectors/multichain';
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
  const networkImageUrl = getImageForChainId(chainId);
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
    <Box
      data-testid="permission-group-list-item"
      backgroundColor={BoxBackgroundColor.BackgroundDefault}
      alignItems={BoxAlignItems.Baseline}
      padding={4}
      gap={4}
    >
      <Button
        onClick={onClick}
        style={{
          width: '100%',
          backgroundColor: 'transparent',
          border: 'none',
          padding: 0,
        }}
      >
        <Box alignItems={BoxAlignItems.Start} marginRight={2}>
          <AvatarNetwork
            data-testid="permission-group-list-item__avatar-network"
            src={networkImageUrl}
            name={chainId}
            size={AvatarNetworkSize.Lg}
            style={{ borderRadius: '50%' }}
          />
        </Box>

        <Box
          flexDirection={BoxFlexDirection.Column}
          alignItems={BoxAlignItems.Start}
          justifyContent={BoxJustifyContent.Start}
          style={{ flexGrow: '1' }}
        >
          <Text variant={TextVariant.BodyMd}>{getNetworkNameForChainId()}</Text>

          <Text color={TextColor.TextAlternative} variant={TextVariant.BodyMd}>
            {text}
          </Text>
        </Box>

        <Box
          justifyContent={BoxJustifyContent.End}
          alignItems={BoxAlignItems.End}
          gap={2}
        >
          <Icon
            name={IconName.ArrowRight}
            color={IconColor.IconDefault}
            size={IconSize.Sm}
          />
        </Box>
      </Button>
    </Box>
  );
};
