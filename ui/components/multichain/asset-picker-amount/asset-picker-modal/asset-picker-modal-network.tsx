import React from 'react';

import { useSelector } from 'react-redux';
import { NetworkConfiguration } from '@metamask/network-controller';
import {
  Display,
  FlexDirection,
  BlockSize,
} from '../../../../helpers/constants/design-system';
import {
  ModalOverlay,
  ModalContent,
  ModalHeader,
  Modal,
  Box,
} from '../../../component-library';
import {
  CHAIN_ID_TO_NETWORK_IMAGE_URL_MAP,
  NETWORK_TO_NAME_MAP,
} from '../../../../../shared/constants/network';
///: BEGIN:ONLY_INCLUDE_IF(build-main,build-beta,build-flask)
import { useI18nContext } from '../../../../hooks/useI18nContext';
///: END:ONLY_INCLUDE_IF
import { NetworkListItem } from '../../network-list-item';
import {
  getNetworkConfigurationsByChainId,
  getProviderConfig,
} from '../../../../../shared/modules/selectors/networks';

/**
 * AssetPickerModalNetwork component displays a modal for selecting a network in the asset picker.
 *
 * @param props
 * @param props.isOpen - Determines whether the modal is open or not.
 * @param props.network - The currently selected network, not necessarily the active wallet network.
 * @param props.networks - The list of selectable networks.
 * @param props.onNetworkChange - The callback function to handle network change.
 * @param props.onClose - The callback function to handle modal close.
 * @param props.onBack - The callback function to handle going back in the modal.
 * @returns A modal with a list of selectable networks.
 */
export const AssetPickerModalNetwork = ({
  isOpen,
  onClose,
  onBack,
  network,
  networks,
  onNetworkChange,
}: {
  isOpen: boolean;
  network?: NetworkConfiguration;
  networks?: NetworkConfiguration[];
  onNetworkChange: (network: NetworkConfiguration) => void;
  onClose: () => void;
  onBack: () => void;
}) => {
  ///: BEGIN:ONLY_INCLUDE_IF(build-main,build-beta,build-flask)
  const t = useI18nContext();
  ///: END:ONLY_INCLUDE_IF

  const currentNetwork = useSelector(getProviderConfig);
  const allNetworks = useSelector(getNetworkConfigurationsByChainId);

  const selectedNetwork =
    network ?? (currentNetwork?.chainId && allNetworks[currentNetwork.chainId]);

  const networksList: NetworkConfiguration[] =
    networks ?? Object.values(allNetworks) ?? [];

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      className="multichain-asset-picker__network-modal"
    >
      <ModalOverlay />
      <ModalContent modalDialogProps={{ padding: 0 }}>
        <ModalHeader onBack={onBack} onClose={onClose}>
          {t('bridgeSelectNetwork')}
        </ModalHeader>
        <Box className="multichain-asset-picker__network-list">
          <Box
            style={{
              gridColumnStart: 1,
              gridColumnEnd: 3,
            }}
            display={Display.Flex}
            flexDirection={FlexDirection.Column}
            height={BlockSize.Full}
          >
            {networksList.map((networkConfig) => {
              const { name, chainId } = networkConfig;
              return (
                <NetworkListItem
                  key={chainId}
                  name={
                    NETWORK_TO_NAME_MAP[
                      chainId as keyof typeof NETWORK_TO_NAME_MAP
                    ] ?? name
                  }
                  selected={selectedNetwork?.chainId === chainId}
                  onClick={() => {
                    onNetworkChange(networkConfig);
                    onBack();
                  }}
                  iconSrc={
                    CHAIN_ID_TO_NETWORK_IMAGE_URL_MAP[
                      chainId as keyof typeof CHAIN_ID_TO_NETWORK_IMAGE_URL_MAP
                    ]
                  }
                  focus={false}
                />
              );
            })}
          </Box>
        </Box>
      </ModalContent>
    </Modal>
  );
};
