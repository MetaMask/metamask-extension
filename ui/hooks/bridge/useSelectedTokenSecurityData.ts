import { useEffect, useMemo, useState } from 'react';
import { useSelector } from 'react-redux';
import type { TokenAsset } from '@metamask/assets-controllers';
import type { CaipAssetType } from '@metamask/utils';
import type { BridgeToken } from '../../ducks/bridge/types';
import { getUseExternalServices } from '../../selectors';
import { BridgeAssetSecurityDataType } from '../../pages/bridge/utils/tokens';
import {
  fetchCachedTokenAssets,
  getTokenSecurityAssetKey,
} from '../../pages/bridge/utils/token-security';

export type SelectedTokenSecurityData = Pick<
  BridgeToken,
  'isVerified' | 'securityData'
>;

type SelectedTokenSecurityDataByAssetId = Partial<
  Record<CaipAssetType, SelectedTokenSecurityData>
>;

const EMPTY_SECURITY_DATA: SelectedTokenSecurityDataByAssetId = {};
const SECURITY_DATA_TYPES = new Set<string>(
  Object.values(BridgeAssetSecurityDataType),
);

function isBridgeAssetSecurityDataType(
  value: string,
): value is BridgeAssetSecurityDataType {
  return SECURITY_DATA_TYPES.has(value);
}

export function toBridgeTokenSecurityData(
  token: TokenAsset,
): SelectedTokenSecurityData | undefined {
  const resultType = token.securityData?.resultType;
  if (!resultType || !isBridgeAssetSecurityDataType(resultType)) {
    return undefined;
  }

  const features = Array.isArray(token.securityData?.features)
    ? token.securityData.features.flatMap(({ featureId, type, description }) =>
        isBridgeAssetSecurityDataType(type)
          ? [{ featureId, type, description }]
          : [],
      )
    : [];

  return {
    isVerified: resultType === BridgeAssetSecurityDataType.VERIFIED,
    securityData: {
      type: resultType,
      metadata: { features },
    },
  };
}

export function useSelectedTokenSecurityData(
  fromToken: BridgeToken,
  toToken: BridgeToken,
): SelectedTokenSecurityDataByAssetId {
  const useExternalServices = useSelector(getUseExternalServices);

  const assetIds = useMemo(() => {
    const tokens = [fromToken, toToken];
    const assetIdsByKey = new Map<CaipAssetType, CaipAssetType>();

    tokens.forEach((token) => {
      if (!token.securityData?.type) {
        assetIdsByKey.set(
          getTokenSecurityAssetKey(token.assetId),
          token.assetId,
        );
      }
    });

    return [...assetIdsByKey.values()];
  }, [fromToken, toToken]);

  // Results accumulate by asset ID, so a pending or failed follow-up request
  // never hides data already fetched for a token.
  const [securityDataByAssetId, setSecurityDataByAssetId] =
    useState<SelectedTokenSecurityDataByAssetId>(EMPTY_SECURITY_DATA);

  useEffect(() => {
    if (!useExternalServices || assetIds.length === 0) {
      return undefined;
    }

    let isCurrentRequest = true;
    fetchCachedTokenAssets(assetIds)
      .then((tokens) => {
        if (!isCurrentRequest) {
          return;
        }

        const requestedAssetKeys = new Set(
          assetIds.map(getTokenSecurityAssetKey),
        );
        const nextSecurityData =
          tokens.reduce<SelectedTokenSecurityDataByAssetId>((result, token) => {
            const assetKey = getTokenSecurityAssetKey(token.assetId);
            const securityData = toBridgeTokenSecurityData(token);
            if (requestedAssetKeys.has(assetKey) && securityData) {
              result[assetKey] = securityData;
            }
            return result;
          }, {});

        setSecurityDataByAssetId((previous) => ({
          ...previous,
          ...nextSecurityData,
        }));
      })
      .catch(() => undefined);

    return () => {
      isCurrentRequest = false;
    };
  }, [assetIds, useExternalServices]);

  return useExternalServices ? securityDataByAssetId : EMPTY_SECURITY_DATA;
}
