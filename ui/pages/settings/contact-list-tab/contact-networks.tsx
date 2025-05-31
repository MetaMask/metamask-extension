import React, { useMemo } from 'react';
import { useSelector } from 'react-redux';
import { NetworkConfiguration } from '@metamask/network-controller';
import {
  Display,
  FlexDirection,
  BlockSize,
  TextVariant,
} from '../../../helpers/constants/design-system';

import {
  ModalOverlay,
  ModalContent,
  ModalHeader,
  Modal,
  Box,
  Text,
  AvatarNetworkSize,
} from '../../../components/component-library';

import { getNetworkConfigurationsByChainId } from '../../../../shared/modules/selectors/networks';
import { TEST_CHAINS } from '../../../../shared/constants/network';
import { useI18nContext } from '../../../hooks/useI18nContext';
import { NETWORK_TO_SHORT_NETWORK_NAME_MAP } from '../../../../shared/constants/bridge';
import { NetworkListItem } from '../../../components/multichain';
import { getImageForChainId } from '../../../selectors/multichain';

export const ContactNetworks = ({
  isOpen,
  onClose,
  selectedChainId,
  onSelect,
}: {
  isOpen: boolean;
  onClose: () => void;
  selectedChainId?: string;
  onSelect?: (chainId: string) => void;
}) => {
  const t = useI18nContext();

  const networkConfigurations = useSelector(getNetworkConfigurationsByChainId);
  const [nonTestNetworks, testNetworks] = useMemo(
    () =>
      Object.entries(networkConfigurations).reduce(
        ([nonTest, test], [chainId, config]) => {
          const isTest = (TEST_CHAINS as string[]).includes(chainId);
          (isTest ? test : nonTest).push(config);
          return [nonTest, test];
        },
        [[] as NetworkConfiguration[], [] as NetworkConfiguration[]],
      ),
    [networkConfigurations],
  );
  const renderNetworkListItems = (
    networks: { name: string; chainId: string }[],
  ) =>
    networks.map(({ name, chainId }) => (
      <NetworkListItem
        key={chainId}
        name={
          NETWORK_TO_SHORT_NETWORK_NAME_MAP[
            chainId as unknown as keyof typeof NETWORK_TO_SHORT_NETWORK_NAME_MAP
          ] ?? name
        }
        selected={selectedChainId === chainId}
        onClick={() => {
          onSelect?.(chainId);
          onClose();
        }}
        iconSrc={getImageForChainId(chainId)}
        iconSize={AvatarNetworkSize.Sm}
        focus={false}
        variant={TextVariant.bodyMdMedium}
      />
    ));

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      className="multichain-asset-picker__network-modal"
    >
      <ModalOverlay />
      <ModalContent modalDialogProps={{ padding: 0 }}>
        <ModalHeader onBack={onClose} onClose={onClose}>
          {t('bridgeSelectNetwork')}
        </ModalHeader>
        <Box
          className="multichain-asset-picker__network-list"
          display={Display.Flex}
        >
          <Box
            display={Display.Flex}
            flexDirection={FlexDirection.Column}
            width={BlockSize.Full}
          >
            {renderNetworkListItems(nonTestNetworks)}

            <Box padding={4}>
              <Text variant={TextVariant.bodyMdMedium}>{t('testnets')}</Text>
              {renderNetworkListItems(testNetworks)}
            </Box>
          </Box>
        </Box>
      </ModalContent>
    </Modal>
  );
};
