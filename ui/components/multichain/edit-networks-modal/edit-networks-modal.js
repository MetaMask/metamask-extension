import PropTypes from 'prop-types';
import React, { useMemo } from 'react';
import { useSelector } from 'react-redux';
import { TextVariant } from '../../../helpers/constants/design-system';
import { useI18nContext } from '../../../hooks/useI18nContext';
import { getNetworkConfigurationsByChainId } from '../../../selectors';
import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  Checkbox,
  Text,
  Box,
} from '../../component-library';
import { NetworkListItem } from '..';
import {
  CHAIN_ID_TO_NETWORK_IMAGE_URL_MAP,
  TEST_CHAINS,
} from '../../../../shared/constants/network';

export const EditNetworksModal = ({ onClose }) => {
  const t = useI18nContext();

  const networkConfigurations = useSelector(getNetworkConfigurationsByChainId);
  const [nonTestNetworks, testNetworks] = useMemo(
    () =>
      Object.entries(networkConfigurations).reduce(
        ([nonTestNetworksList, testNetworksList], [chainId, network]) => {
          const isTest = TEST_CHAINS.includes(chainId);
          (isTest ? testNetworksList : nonTestNetworksList).push(network);
          return [nonTestNetworksList, testNetworksList];
        },
        [[], []],
      ),
    [networkConfigurations],
  );

  return (
    <Modal
      isOpen
      onClose={() => {
        onClose();
      }}
      className="edit-networks-modal"
    >
      <ModalOverlay />
      <ModalContent>
        <ModalHeader
          onClose={() => {
            onClose();
          }}
        >
          {t('editNetworksTitle')}
        </ModalHeader>
        <Box padding={4}>
          <Checkbox
            label={t('selectAll')}
            isChecked
            gap={4}
            // onClick={() => (allAreSelected() ? deselectAll() : selectAll())}
            // isIndeterminate={isIndeterminate}
          />
        </Box>
        {nonTestNetworks.map((network) => (
          <NetworkListItem
            name={network.name}
            iconSrc={CHAIN_ID_TO_NETWORK_IMAGE_URL_MAP[network.chainId]}
            key={network.chainId}
            onClick={() => {
              console.log(network.chainId);
            }}
            startAccessory={<Checkbox isChecked />}
          />
        ))}
        <Box padding={4}>
          <Text variant={TextVariant.bodyMdMedium}>{t('testnets')}</Text>
        </Box>
        {testNetworks.map((network) => (
          <NetworkListItem
            name={network.name}
            iconSrc={CHAIN_ID_TO_NETWORK_IMAGE_URL_MAP[network.chainId]}
            key={network.chainId}
            onClick={() => {
              console.log(network.chainId);
            }}
            startAccessory={<Checkbox isChecked />}
            showEndAccessory={false}
          />
        ))}
      </ModalContent>
    </Modal>
  );
};

EditNetworksModal.propTypes = {
  /**
   * Executes when the modal closes
   */
  onClose: PropTypes.func.isRequired,
};
