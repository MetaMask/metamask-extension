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

interface AssetListProps {
  assets: Asset[];
  isLoading: boolean;
}

export const BridgeAssetList = ({ isLoading, assets }: AssetListProps) => {
  if (isLoading) {
    return (
      <Column gap={2}>
        {new Array(10).fill(0).map((_, index) => (
          <BridgeSkeletonLoader key={index} />
        ))}
      </Column>
    );
  }

  return (
    <div>AssetList</div>
  )
}
