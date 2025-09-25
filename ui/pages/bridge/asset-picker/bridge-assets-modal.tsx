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
import { Search } from '../../../components/multichain/asset-picker-amount/asset-picker-modal/asset-picker-modal-search';
import { debounce } from 'lodash';
import { Asset, getPopularAssets, searchAssets, SUPPORTED_NETWORKS } from '../utils/assets-service';
import { BridgeAssetList } from './bridge-asset-list';
import { useFilteredAssetsWithBalance } from '../hooks/useFilteredAssetsWithBalance';
import { NetworkCarousel } from './network-carousel';

interface BridgeAssetsModalProps {
  isOpen: boolean;
  onClose: (value: boolean) => void;
  onSelectAsset: (asset: Asset) => void;
}

export const BridgeAssetsModal = ({ isOpen, onClose, onSelectAsset }: BridgeAssetsModalProps) => {
  const [selectedNetwork, setSelectedNetwork] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [assets, setAssets] = useState<Asset[]>([]);
  const [hasMore, setHasMore] = useState(false);
  const [endCursor, setEndCursor] = useState<string | null>(null);

  const combinedAssets = useFilteredAssetsWithBalance(selectedNetwork, searchQuery, assets);

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

  const handleLoadMore = () => {
    if (!isLoadingMore && hasMore && endCursor) {
      fetchAssets(searchQuery, selectedNetwork, endCursor);
    }
  }

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

        <NetworkCarousel
          selectedNetwork={selectedNetwork}
          setSelectedNetwork={setSelectedNetwork}
        />
        <Box>
          <Search
            searchQuery={searchQuery}
            onChange={(value) => setSearchQuery(value)}
            autoFocus
          />
        </Box>
        <Box paddingTop={4} paddingBottom={4} style={{ overflowY: 'auto' }}>
          <BridgeAssetList
            isLoading={isLoading}
            isLoadingMore={isLoadingMore}
            assets={combinedAssets}
            hasMore={hasMore}
            onLoadMore={handleLoadMore}
            onAssetSelect={selectAsset}
          />
        </Box>
      </ModalContent>
    </Modal>
  )
}
