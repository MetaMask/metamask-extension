import React from 'react';
import { type BridgeToken } from '../../../ducks/bridge/types';
import { SecurityBadge } from '../../../components/app/security-trust/security-trust-inline-badge';
import { useAssetSecurityData } from '../hooks/useAssetSecurityData';

type AssetSecurityBadgeProps = {
  asset: BridgeToken;
};

export const AssetSecurityBadge = ({ asset }: AssetSecurityBadgeProps) => {
  const { assetSecurityTrustBadgeResult } = useAssetSecurityData(asset);

  return <SecurityBadge value={assetSecurityTrustBadgeResult} />;
};
