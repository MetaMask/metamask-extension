import React, {
  useState,
  useCallback,
  useMemo,
  useEffect,
  useRef,
} from 'react';
import {
  Box,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
} from '../../../components/component-library';
import { Column, Row } from '../layout';
import { JustifyContent } from '../../../helpers/constants/design-system';
import { Search } from '../../../components/multichain/asset-picker-amount/asset-picker-modal/asset-picker-modal-search';
import { CHAIN_IDS } from '../../../../shared/constants/network';
import { MultichainNetworks } from '../../../../shared/constants/multichain/networks';
import { getImageForChainId } from '../../confirmations/utils/network';
import { NETWORK_TO_SHORT_NETWORK_NAME_MAP } from '../../../../shared/constants/bridge';
import { NetworkFilterPill } from './network-filter-pill';
import { debounce } from 'lodash';
import { getPopularAssets } from '../utils/assets-service';
import { Hex } from '@metamask/utils';

interface BridgeAssetsModalProps {
  isOpen: boolean;
  onClose: (value: boolean) => void;
  onSelectAsset: (asset: Asset) => void;
}

const SUPPORTED_NETWORKS = [CHAIN_IDS.MAINNET, CHAIN_IDS.BSC, CHAIN_IDS.POLYGON, CHAIN_IDS.OPTIMISM, CHAIN_IDS.BASE, CHAIN_IDS.LINEA_MAINNET, CHAIN_IDS.ARBITRUM, CHAIN_IDS.AVALANCHE, CHAIN_IDS.ZKSYNC_ERA, CHAIN_IDS.SEI, MultichainNetworks.SOLANA];

const NETWORK_PILLS = SUPPORTED_NETWORKS.map((network) => ({
  id: network,
  name: NETWORK_TO_SHORT_NETWORK_NAME_MAP[network],
  image: getImageForChainId(network),
}));

export const BridgeAssetsModal = ({ isOpen, onClose, onSelectAsset }: BridgeAssetsModalProps) => {
  const [selectedNetwork, setSelectedNetwork] = useState<string | null>(CHAIN_IDS.MAINNET);
  const [searchQuery, setSearchQuery] = useState<string>('');

  const debouncedSearchCallback = useCallback(
    debounce(async (value, selectedNetwork) => {
      const assets = await getPopularAssets(value, selectedNetwork !== null ? [selectedNetwork] : SUPPORTED_NETWORKS);
      console.log('Debounced search query:', value);
    }, 300),
    [],
  );

  const closeModal = () => {
    onClose(false);
    setSearchQuery('');
  }

  const selectNetwork = (networkId: string) => {
    setSelectedNetwork(networkId !== selectedNetwork ? networkId : null);
  }

  const selectAsset = (asset: Asset) => {
    onSelectAsset(asset);
    closeModal();
  }

  useEffect(() => {
    debouncedSearchCallback(searchQuery, selectedNetwork);
  }, [selectedNetwork, searchQuery, debouncedSearchCallback]);

  useEffect(() => {
    return () => {
      debouncedSearchCallback.cancel();
    };
  }, [debouncedSearchCallback]);

  return (
    <Modal
      isOpen={isOpen}
      onClose={closeModal}
    >
      <ModalOverlay />
      <ModalContent modalDialogProps={{ padding: 0 }}>
        <ModalHeader onClose={closeModal}>
          Select Token
        </ModalHeader>

        <Column gap={2} paddingLeft={4} paddingRight={4}>
          <Row justifyContent={JustifyContent.spaceBetween}>
            <Row gap={2} style={{overflow: 'auto'}}>
              {NETWORK_PILLS.map((network) => (
                <NetworkFilterPill
                  key={network.id}
                  selected={selectedNetwork === network.id}
                  network={network}
                  onSelect={selectNetwork}
                />
              ))}
            </Row>
          </Row>
        </Column>
        <Box>
        <Search
          searchQuery={searchQuery}
          onChange={(value) => setSearchQuery(value)}
          autoFocus
        />
        </Box>
      </ModalContent>
    </Modal>
  )
}
