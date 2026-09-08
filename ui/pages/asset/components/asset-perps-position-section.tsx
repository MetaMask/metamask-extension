import {
  Box,
  BoxFlexDirection,
  FontWeight,
  Text,
} from '@metamask/design-system-react';
import React from 'react';
import { useI18nContext } from '../../../hooks/useI18nContext';
import { PositionCard } from '../../../components/app/perps/position-card';
import { PerpsCardSkeleton } from '../../../components/app/perps/perps-skeletons';
import { usePerpsPositionForAsset } from '../../../hooks/perps/usePerpsPositionForAsset';

export type AssetPerpsPositionSectionProps = {
  /** Perps market name matched to this asset (e.g. 'ETH') */
  marketSymbol: string;
  /** Full asset name for the card title; falls back to the market ticker */
  assetName?: string;
};

/**
 * Shows the account's open Perps position for this asset (mobile Token Details
 * parity), so Long / Short on the action row cannot be mistaken for the user's
 * only Perps state. The card opens the market detail page, which reports
 * `asset_detail_screen` as its entry point.
 *
 * Render only when the asset has a matching Perps market, and only inside the
 * surface's `PerpsViewStreamBoundary`: the position lookup subscribes to the
 * live positions stream, which the background only pushes while a Perps view is
 * active. This component must not open its own boundary — background
 * `perpsViewActive` is a single boolean rather than a reference count, so a
 * nested boundary would stop emission for the whole connection as soon as it
 * unmounts, and the surrounding surface would keep a subscription to a stream
 * that no longer delivers positions.
 *
 * @param props - Component props
 * @param props.marketSymbol - Perps market name matched to this asset
 * @param props.assetName - Full asset name for the card title
 */
export const AssetPerpsPositionSection = ({
  marketSymbol,
  assetName,
}: AssetPerpsPositionSectionProps) => {
  const t = useI18nContext();
  const { position, isLoading } = usePerpsPositionForAsset(marketSymbol);

  if (!position && !isLoading) {
    return null;
  }

  return (
    <Box
      flexDirection={BoxFlexDirection.Column}
      gap={2}
      paddingTop={4}
      data-testid="asset-perps-position-section"
    >
      <Box paddingLeft={4} paddingRight={4}>
        <Text fontWeight={FontWeight.Medium}>{t('perpsPosition')}</Text>
      </Box>
      {position ? (
        <PositionCard position={position} assetName={assetName} />
      ) : (
        <PerpsCardSkeleton />
      )}
    </Box>
  );
};
