import React, {
  useState,
  useCallback,
  useEffect,
} from 'react';
import {
  Box,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
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
import { Asset, getPopularAssets, searchAssets } from '../utils/assets-service';
import { BridgeAssetList } from './bridge-asset-list';
import { useFilteredAssetsWithBalance } from '../hooks/useFilteredAssetsWithBalance';

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
  const [selectedNetwork, setSelectedNetwork] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [assets, setAssets] = useState<Asset[]>([]);
  const [hasMore, setHasMore] = useState(false);
  const [endCursor, setEndCursor] = useState<string | null>(null);

  const combinedAssets = useFilteredAssetsWithBalance(selectedNetwork, assets);

  const fetchAssets = useCallback(async (value: string, selectedNetwork: string | null, currentEndCursor: string | null) => {
    const isLoadingMore = currentEndCursor !== null;

    if (isLoadingMore) {
      setIsLoadingMore(true);
    } else {
      setIsLoading(true);
    }

    const networks = selectedNetwork !== null ? [selectedNetwork] : SUPPORTED_NETWORKS;

    try {
      if (value.length === 0) {
        const assets = await getPopularAssets(value, networks);
        setAssets(assets);
        setHasMore(false);
      } else {
        const response = await searchAssets(value, networks, currentEndCursor);
        if (isLoadingMore) {
          setAssets(prevAssets => [...prevAssets, ...response.data]);
        } else {
          setAssets(response.data);
        }
        setHasMore(response.pageInfo.hasNextPage);
        setEndCursor(response.pageInfo.endCursor);
      }
    } finally {
      setIsLoading(false);
      setIsLoadingMore(false);
    }
  }, []);

  const debouncedSearchCallback = useCallback(
    debounce(fetchAssets, 300), [],
  );

  const closeModal = () => {
    onClose(false);
    setSearchQuery('');
  }

  const selectAsset = (asset: Asset) => {
    onSelectAsset(asset);
    closeModal();
  }

  const handleLoadMore = useCallback(() => {
    if (!isLoadingMore && hasMore && endCursor) {
      debouncedSearchCallback(searchQuery, selectedNetwork, endCursor);
    }
  }, [searchQuery, selectedNetwork, hasMore, isLoadingMore, endCursor, debouncedSearchCallback]);

  useEffect(() => {
    fetchAssets(searchQuery, selectedNetwork, null);
  }, [selectedNetwork, fetchAssets]);

  useEffect(() => {
    debouncedSearchCallback(searchQuery, selectedNetwork, null);
  }, [searchQuery, debouncedSearchCallback]);

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
              <NetworkFilterPill
                selected={selectedNetwork === null}
                network={null}
                onSelect={() => setSelectedNetwork(null)}
              />
              {NETWORK_PILLS.map((network) => (
                <NetworkFilterPill
                  key={network.id}
                  selected={selectedNetwork === network.id}
                  network={network}
                  onSelect={(networkId) => setSelectedNetwork(networkId)}
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
        <Box padding={4} style={{ overflowY: 'auto' }}>
          <BridgeAssetList
            isLoading={isLoading}
            assets={combinedAssets}
            hasMore={hasMore}
            onLoadMore={handleLoadMore}
          />
        </Box>
      </ModalContent>
    </Modal>
  )
}
