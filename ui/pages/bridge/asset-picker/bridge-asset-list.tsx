import React, {
  useCallback,
  useEffect,
  useRef,
} from 'react';
import { AlignItems, BlockSize, Display, FlexDirection, JustifyContent } from '../../../helpers/constants/design-system';
import { Column, Row } from '../layout';
import { Box } from '../../../components/component-library';
import { BridgeSkeletonLoader } from './bridge-skeleton-loader';
import { Asset } from '../utils/assets-service';
import { AssetItem } from './bridge-asset-item';
import Preloader from '../../../components/ui/icon/preloader';

interface AssetListProps {
  assets: Asset[];
  isLoading: boolean;
  isLoadingMore: boolean;
  hasMore: boolean;
  onLoadMore: () => void;
}

const DefaultSkeletonLoader = () => {
  return (
    <Column gap={2}>
      {new Array(10).fill(0).map((_, index) => (
        <BridgeSkeletonLoader key={index} />
      ))}
    </Column>
  );
}

const LoadingIndicator = () => {
  return (
    <Box
      height={BlockSize.Full}
      width={BlockSize.Full}
      display={Display.Flex}
      justifyContent={JustifyContent.center}
      alignItems={AlignItems.center}
      flexDirection={FlexDirection.Column}
      data-testid="notifications-list-loading"
    >
      <Preloader size={24} />
    </Box>
  );
}

export const BridgeAssetList = ({ isLoading, isLoadingMore, assets, hasMore, onLoadMore }: AssetListProps) => {
  const loadMoreRef = useRef<HTMLDivElement>(null);

  const handleObserver = useCallback((entries: IntersectionObserverEntry[]) => {
    const target = entries[0];
    if (target.isIntersecting && hasMore && !isLoading) {
      onLoadMore();
    }
  }, [hasMore, isLoading, onLoadMore]);

  useEffect(() => {
    const observer = new IntersectionObserver(handleObserver, {
      threshold: 0.1,
      rootMargin: '20px'
    });

    if (loadMoreRef.current) {
      observer.observe(loadMoreRef.current);
    }

    return () => {
      if (loadMoreRef.current) {
        observer.unobserve(loadMoreRef.current);
      }
    };
  }, [handleObserver]);

  if (isLoading) {
    return <DefaultSkeletonLoader />;
  }

  if (assets.length === 0) {
    return (
      <Column gap={2}>
        <div>No assets found</div>
      </Column>
    );
  }

  return (
    <Column>
      {assets.map((asset) => (
        <AssetItem key={asset.assetId} asset={asset} />
      ))}
      {isLoadingMore && <LoadingIndicator/>}
      {hasMore && <div ref={loadMoreRef} style={{ height: '20px' }} />}
    </Column>
  )
}
