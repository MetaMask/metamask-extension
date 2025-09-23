import React from 'react';
import { Hex } from '@metamask/utils';
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
import { NETWORK_TO_NAME_MAP } from '../../../../../../shared/constants/network';

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
   * The function to call when the connection is clicked
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
  const getNetworkNameForChainId = () => {
    const networkName =
      NETWORK_TO_NAME_MAP[chainId as keyof typeof NETWORK_TO_NAME_MAP];
    return networkName ? t(networkName) : t('privateNetwork');
  };

  return (
    <Box
      data-testid="permission-group-list-item"
      as="button"
      display={Display.Flex}
      flexDirection={FlexDirection.Row}
      alignItems={AlignItems.baseline}
      width={BlockSize.Full}
      backgroundColor={BackgroundColor.backgroundDefault}
      onClick={onClick}
      padding={4}
      gap={4}
      className="multichain-permission-group-list-item"
    >
      <Box
        display={Display.Flex}
        alignItems={AlignItems.center}
        style={{ alignSelf: 'center' }}
      >
        <AvatarNetwork
          data-testid="permission-group-list-item__avatar-network"
          src={networkImageUrl}
          name={chainId}
          size={AvatarNetworkSize.Md}
          style={{ borderRadius: '50%' }}
        />
      </Box>

      <Box
        display={Display.Flex}
        flexDirection={FlexDirection.Column}
        width={BlockSize.FiveTwelfths}
        style={{ alignSelf: 'center', flexGrow: '1' }}
      >
        <Text variant={TextVariant.bodyMd} textAlign={TextAlign.Left} ellipsis>
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
    </Box>
  );
};
