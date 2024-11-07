import React from 'react';
import { NetworkConfiguration } from '@metamask/network-controller';
import {
  AvatarNetwork,
  AvatarNetworkSize,
  Box,
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
  Text,
} from '../../../../component-library';
import {
  BorderColor,
  Display,
  FlexDirection,
  FontWeight,
  TextAlign,
  TextColor,
  TextVariant,
} from '../../../../../helpers/constants/design-system';
import { getAvatarNetworkColor } from '../../../../../helpers/utils/accounts';
import { CHAIN_ID_TO_NETWORK_IMAGE_URL_MAP } from '../../../../../../shared/constants/network';
import { useI18nContext } from '../../../../../hooks/useI18nContext';

export type AssetListControlBarNetworksModalProps = {
  networks: NetworkConfiguration[]; // TODO: Make this better
  onClose: () => void;
};

// TODO: This should be a constant somewhere else
const MAX_NETWORKS_SUPPORTED = 24;

// TODO: This should come from a selector
const BALANCE = '$21,000';

const AssetListControlBarNetworksModal = ({
  networks,
  onClose,
}: AssetListControlBarNetworksModalProps) => {
  const t = useI18nContext();
  return (
    <Modal isOpen onClose={onClose}>
      <ModalOverlay />
      <ModalContent>
        <ModalHeader onClose={onClose} textAlign={TextAlign.Center}>
          <Text fontWeight={FontWeight.Bold}>
            {t('assetListControlBarNetworksModalTitle', [
              MAX_NETWORKS_SUPPORTED,
            ])}
          </Text>
          <Text variant={TextVariant.bodySm} color={TextColor.textAlternative}>
            {BALANCE}
          </Text>
        </ModalHeader>
        <ModalBody>
          {networks.map(({ name, chainId }) => (
            <Box
              key={chainId}
              display={Display.Flex}
              flexDirection={FlexDirection.Row}
              paddingTop={4}
              paddingBottom={4}
              gap={4}
            >
              <AvatarNetwork
                borderColor={BorderColor.backgroundDefault}
                backgroundColor={getAvatarNetworkColor(name)}
                name={name}
                src={
                  CHAIN_ID_TO_NETWORK_IMAGE_URL_MAP[
                    chainId as keyof typeof CHAIN_ID_TO_NETWORK_IMAGE_URL_MAP
                  ]
                }
                size={AvatarNetworkSize.Sm}
              />
              <Text>{name}</Text>
            </Box>
          ))}
        </ModalBody>
        <ModalFooter>
          <Text variant={TextVariant.bodyXs} color={TextColor.textAlternative}>
            {t('assetListControlBarNetworksModalNotice')}
          </Text>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};

export default AssetListControlBarNetworksModal;
