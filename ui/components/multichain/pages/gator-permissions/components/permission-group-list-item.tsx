import React from 'react';
import { Hex } from '@metamask/utils';
import { Button } from '@metamask/design-system-react';
import { useSelector } from 'react-redux';
import {
  AlignItems,
  BackgroundColor,
  BlockSize,
  Display,
  FlexDirection,
  IconColor,
  JustifyContent,
  TextAlign,
  TextColor,
  TextVariant,
} from '../../../../../helpers/constants/design-system';
import { useI18nContext } from '../../../../../hooks/useI18nContext';
import {
  AvatarNetwork,
  AvatarNetworkSize,
  Box,
  Icon,
  IconName,
  IconSize,
  Text,
} from '../../../../component-library';
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
      width={BlockSize.Full}
      backgroundColor={BackgroundColor.backgroundDefault}
      display={Display.Flex}
      flexDirection={FlexDirection.Row}
      alignItems={AlignItems.baseline}
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
        <Box
          display={Display.Flex}
          alignItems={AlignItems.center}
          style={{ alignSelf: 'center' }}
          marginRight={2}
        >
          <AvatarNetwork
            data-testid="permission-group-list-item__avatar-network"
            src={networkImageUrl}
            name={chainId}
            size={AvatarNetworkSize.Lg}
            style={{ borderRadius: '50%' }}
          />
        </Box>

        <Box
          display={Display.Flex}
          flexDirection={FlexDirection.Column}
          width={BlockSize.FiveTwelfths}
          style={{ alignSelf: 'center', flexGrow: '1' }}
        >
          <Text
            variant={TextVariant.bodyMd}
            textAlign={TextAlign.Left}
            ellipsis
          >
            {getNetworkNameForChainId()}
          </Text>

          <Box
            display={Display.Flex}
            flexDirection={FlexDirection.Row}
            alignItems={AlignItems.center}
            gap={1}
          >
            <Text
              as="span"
              width={BlockSize.Max}
              color={TextColor.textAlternative}
              variant={TextVariant.bodyMd}
            >
              {text}
            </Text>
          </Box>
        </Box>

        <Box
          display={Display.Flex}
          justifyContent={JustifyContent.flexEnd}
          alignItems={AlignItems.center}
          style={{ flex: '1', alignSelf: 'center' }}
          gap={2}
        >
          <Icon
            display={Display.Flex}
            name={IconName.ArrowRight}
            color={IconColor.iconDefault}
            size={IconSize.Sm}
            backgroundColor={BackgroundColor.backgroundDefault}
          />
        </Box>
      </Button>
    </Box>
  );
};
