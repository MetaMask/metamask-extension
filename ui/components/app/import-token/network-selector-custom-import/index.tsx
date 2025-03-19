import React, { useRef, useState } from 'react';
import { useSelector } from 'react-redux';
import {
  TextVariant,
  BlockSize,
  TextColor,
  BorderRadius,
  AlignItems,
  Display,
  JustifyContent,
  BorderColor,
} from '../../../../helpers/constants/design-system';
import {
  ButtonIcon,
  Box,
  Popover,
  PopoverPosition,
  ButtonIconSize,
  IconName,
  Label,
  Text,
  AvatarNetwork,
  AvatarNetworkSize,
} from '../../../component-library';
import { useI18nContext } from '../../../../hooks/useI18nContext';
import NetworkFilter from '../../assets/asset-list/network-filter';
import { getIsTokenNetworkFilterEqualCurrentNetwork } from '../../../../selectors';
import {
  CHAIN_ID_TO_NETWORK_IMAGE_URL_MAP,
  FEATURED_NETWORK_CHAIN_IDS,
} from '../../../../../shared/constants/network';
import { getNetworkConfigurationsByChainId } from '../../../../../shared/modules/selectors/networks';

export const NetworkSelectorCustomImport = ({
  title,
  buttonDataTestId,
  chainId,
}: {
  title: string;
  buttonDataTestId: string;
  chainId: string;
}) => {
  const allNetworks = useSelector(getNetworkConfigurationsByChainId);
  const networkImageUrl =
    CHAIN_ID_TO_NETWORK_IMAGE_URL_MAP[
      chainId as keyof typeof CHAIN_ID_TO_NETWORK_IMAGE_URL_MAP
    ];

  const allOpts: Record<string, boolean> = {};
  Object.keys(allNetworks || {}).forEach((chain) => {
    allOpts[chain] = true;
  });

  {
    /* // TODO : NETWORK SELECTOR HERE .... */
  }

  return (
    <Box padding={4}>
      <Box
        className="dropdown-editor__item-dropdown"
        display={Display.Flex}
        alignItems={AlignItems.center}
        justifyContent={JustifyContent.spaceBetween}
        borderRadius={BorderRadius.LG}
        borderColor={BorderColor.borderDefault}
        borderWidth={1}
        paddingLeft={4}
        paddingRight={4}
        data-testid={buttonDataTestId}
      >
        <Text
          variant={TextVariant.bodyMdMedium}
          color={TextColor.textAlternative}
          padding={2}
        >
          Select Network
        </Text>
        <Box
          display={Display.Flex}
          alignItems={AlignItems.center}
          marginLeft="auto"
        >
          <AvatarNetwork
            key={networkImageUrl}
            name={networkImageUrl}
            src={networkImageUrl ?? undefined}
            size={AvatarNetworkSize.Sm}
          />
          <ButtonIcon
            marginLeft="auto"
            iconName={IconName.ArrowRight}
            size={ButtonIconSize.Md}
            ariaLabel={title}
          />
        </Box>
      </Box>
    </Box>
  );
};

export default NetworkSelectorCustomImport;
