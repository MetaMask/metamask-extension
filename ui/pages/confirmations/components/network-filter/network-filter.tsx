import React, { useCallback, useState, useMemo } from 'react';

import {
  Box,
  ButtonBase,
  ButtonBaseSize,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalContentSize,
  IconName,
  IconSize,
  Text,
  AvatarNetwork,
  AvatarNetworkSize,
  Icon,
  ButtonIconSize,
  ButtonIcon,
  BoxProps,
  ButtonBaseProps,
  TextProps,
  AvatarNetworkProps,
} from '../../../../components/component-library';
import {
  BackgroundColor,
  TextColor,
  Display,
  AlignItems,
  BorderColor,
} from '../../../../helpers/constants/design-system';
import { NetworkListItem } from '../../../../components/multichain';
import { useI18nContext } from '../../../../hooks/useI18nContext';
import { useChainNetworkNameAndImageMap } from '../../hooks/useChainNetworkNameAndImage';

type NetworkFilterProps = {
  boxProps?: BoxProps<typeof Box>;
  buttonBaseProps?: ButtonBaseProps<typeof ButtonBase>;
  textProps?: TextProps<typeof Text>;
  selectedAvatarProps?: Omit<AvatarNetworkProps<typeof AvatarNetwork>, 'name'>;
  chainIds: string[];
  selectedChainId?: string | null;
  onChainIdChange?: (chainId: string | null) => void;
};

export const NetworkFilter = ({
  boxProps = {},
  buttonBaseProps = {},
  textProps = {},
  selectedAvatarProps = {},
  chainIds,
  selectedChainId = null, // Default to "All networks"
  onChainIdChange,
}: NetworkFilterProps) => {
  const t = useI18nContext();
  const [isNetworkFilterPopoverOpen, setIsNetworkFilterPopoverOpen] =
    useState(false);
  const chainNetworkNAmeAndImageMap = useChainNetworkNameAndImageMap();

  const { displayName, displayIcon, isAllNetworks } = useMemo(() => {
    if (selectedChainId === null) {
      return {
        displayName: 'All networks',
        displayIcon: IconName.Global,
        isAllNetworks: true,
      };
    }

    const networkName = chainNetworkNAmeAndImageMap.get(
      selectedChainId as string,
    )?.networkName;
    const networkImage = chainNetworkNAmeAndImageMap.get(
      selectedChainId as string,
    )?.networkImage;

    return {
      displayName: networkName || `Chain ${selectedChainId}`,
      displayIcon: networkImage || '',
      isAllNetworks: false,
    };
  }, [selectedChainId, chainNetworkNAmeAndImageMap]);

  const handleNetworkFilterClick = useCallback(() => {
    setIsNetworkFilterPopoverOpen(!isNetworkFilterPopoverOpen);
  }, [isNetworkFilterPopoverOpen]);

  const closePopover = useCallback(() => {
    setIsNetworkFilterPopoverOpen(false);
  }, []);

  const handleNetworkSelection = useCallback(
    (chainId: string | null) => {
      onChainIdChange?.(chainId);
      closePopover();
    },
    [closePopover, onChainIdChange],
  );

  return (
    <>
      <Box {...boxProps}>
        <ButtonBase
          data-testid="network-filter-toggle"
          onClick={handleNetworkFilterClick}
          size={ButtonBaseSize.Md}
          endIconName={IconName.ArrowDown}
          backgroundColor={BackgroundColor.backgroundDefault}
          color={TextColor.textDefault}
          borderColor={BorderColor.borderDefault}
          ellipsis
          {...buttonBaseProps}
        >
          <Box display={Display.Flex} alignItems={AlignItems.center} gap={2}>
            {isAllNetworks ? (
              <Icon name={displayIcon as IconName} size={IconSize.Sm} />
            ) : (
              <AvatarNetwork
                name={displayName}
                src={displayIcon}
                size={AvatarNetworkSize.Sm}
                borderWidth={0}
                {...selectedAvatarProps}
              />
            )}
            <Text ellipsis {...textProps}>
              {displayName}
            </Text>
          </Box>
        </ButtonBase>
      </Box>
      <Modal
        isOpen={isNetworkFilterPopoverOpen}
        onClose={closePopover}
        isClosedOnOutsideClick={true}
        isClosedOnEscapeKey={true}
      >
        <ModalOverlay />
        <ModalContent size={ModalContentSize.Md}>
          <ModalHeader
            endAccessory={
              <ButtonIcon
                ariaLabel="Close recipient modal"
                data-testid="close-recipient-modal-btn"
                iconName={IconName.Close}
                onClick={closePopover}
                size={ButtonIconSize.Sm}
              />
            }
          >
            {t('selectNetworkToFilter')}
          </ModalHeader>
          <ModalBody paddingLeft={0} paddingRight={0}>
            <NetworkListItem
              name={t('allNetworks')}
              iconSrc={IconName.Global}
              iconSize={IconSize.Xl}
              selected={selectedChainId === null}
              onClick={() => handleNetworkSelection(null)}
            />
            {chainIds.map((chainId) => {
              const networkName = chainNetworkNAmeAndImageMap.get(
                chainId as string,
              )?.networkName;
              const networkImage = chainNetworkNAmeAndImageMap.get(
                chainId as string,
              )?.networkImage;

              return (
                <NetworkListItem
                  key={chainId}
                  name={networkName || `Chain ${chainId}`}
                  iconSrc={networkImage || ''}
                  selected={selectedChainId === chainId}
                  onClick={() => handleNetworkSelection(chainId)}
                />
              );
            })}
          </ModalBody>
        </ModalContent>
      </Modal>
    </>
  );
};
