import { useCallback, useMemo } from 'react';
import type {
  TPSLTrackingData,
  TrackingData,
} from '@metamask/perps-controller';
import { usePerpsAttributionContext } from '../../providers/perps/PerpsAttributionContext';
import type { PerpsTradeAction } from '../../components/app/perps/utils/deriveTradeAction';

type BuildTrackingDataInput = {
  totalFee: number;
  marketPrice: number;
  vipTier: number | null;
  vipDiscount: number | undefined;
  hlFeeRate?: number;
  tradeAction?: PerpsTradeAction;
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
      tradeAction,
    }: BuildTrackingDataInput): TrackingData => ({
      totalFee,
      marketPrice,
      ...(vipTier === null ? {} : { vipTier }),
      ...(vipDiscount === undefined ? {} : { vipDiscount }),
      ...(hlFeeRate === undefined ? {} : { hlFeeRate }),
      // The controller only emits the transaction `action` property when
      // `trackingData.tradeAction` is set, and forwards the value verbatim. Its
      // `TradeAction` type currently lists only create/increase, but flips are
      // valid at runtime — hence the cast.
      ...(tradeAction === undefined
        ? {}
        : { tradeAction: tradeAction as TrackingData['tradeAction'] }),
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
