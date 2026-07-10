import { useCallback, useMemo } from 'react';
import type {
  TPSLTrackingData,
  TrackingData,
} from '@metamask/perps-controller';
import { usePerpsAttributionContext } from '../../providers/perps/PerpsAttributionContext';

type BuildTrackingDataInput = {
  totalFee: number;
  marketPrice: number;
  vipTier: number | null;
  vipDiscount: number | undefined;
  hlFeeRate?: number;
};

/**
 * Builds controller `trackingData` with VIP fee context and current flow
 * attribution (entry point / discovery source).
 */
export function usePerpsAttribution() {
  const { flowAttribution, setFlowAttribution, syncUtmAttributionFromSearch } =
    usePerpsAttributionContext();

  const buildTrackingData = useCallback(
    ({
      totalFee,
      marketPrice,
      vipTier,
      vipDiscount,
      hlFeeRate,
    }: BuildTrackingDataInput): TrackingData => ({
      totalFee,
      marketPrice,
      ...(vipTier === null ? {} : { vipTier }),
      ...(vipDiscount === undefined ? {} : { vipDiscount }),
      ...(hlFeeRate === undefined ? {} : { hlFeeRate }),
      ...(flowAttribution.entryPoint
        ? { entryPoint: flowAttribution.entryPoint }
        : {}),
      ...(flowAttribution.discoverySource
        ? { discoverySource: flowAttribution.discoverySource }
        : {}),
      ...(flowAttribution.perpDiscoverySource
        ? { perpDiscoverySource: flowAttribution.perpDiscoverySource }
        : {}),
    }),
    [flowAttribution],
  );

  const buildTpslTrackingData = useCallback(
    (
      base: Omit<
        TPSLTrackingData,
        'entryPoint' | 'discoverySource' | 'perpDiscoverySource'
      >,
    ): TPSLTrackingData => ({
      ...base,
      ...(flowAttribution.entryPoint
        ? { entryPoint: flowAttribution.entryPoint }
        : {}),
      ...(flowAttribution.discoverySource
        ? { discoverySource: flowAttribution.discoverySource }
        : {}),
      ...(flowAttribution.perpDiscoverySource
        ? { perpDiscoverySource: flowAttribution.perpDiscoverySource }
        : {}),
    }),
    [flowAttribution],
  );

  return useMemo(
    () => ({
      flowAttribution,
      setFlowAttribution,
      syncUtmAttributionFromSearch,
      buildTrackingData,
      buildTpslTrackingData,
    }),
    [
      flowAttribution,
      setFlowAttribution,
      syncUtmAttributionFromSearch,
      buildTrackingData,
      buildTpslTrackingData,
    ],
  );
}
