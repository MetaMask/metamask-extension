import React, {
  useState,
  useCallback,
  useMemo,
  useEffect,
  useRef,
} from 'react';
import { Skeleton } from '../../../components/component-library/skeleton';
import { AlignItems, BackgroundColor, BorderRadius, Display, FlexDirection } from '../../../helpers/constants/design-system';
import { Column, Row } from '../layout';
import { Box } from '../../../components/component-library';
import { BridgeSkeletonLoader } from './bridge-skeleton-loader';
import { Asset } from '../utils/assets-service';
import { AssetItem } from './bridge-asset-item';

interface AssetListProps {
  assets: Asset[];
  isLoading: boolean;
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

export const BridgeAssetList = ({ isLoading, assets, hasMore, onLoadMore }: AssetListProps) => {
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
    </Column>
  )
}
