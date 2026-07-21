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
  const [securityDataByAssetId, setSecurityDataByAssetId] =
    useState<SelectedTokenSecurityDataByAssetId>(EMPTY_SECURITY_DATA);

  const assetIds = useMemo(() => {
    const tokens = [fromToken, toToken];
    const assetIdsByKey = new Map<CaipAssetType, CaipAssetType>();

    tokens.forEach((token) => {
      const hasSecurityData =
        token.isVerified !== undefined || token.securityData !== undefined;
      if (!hasSecurityData) {
        assetIdsByKey.set(
          getTokenSecurityAssetKey(token.assetId),
          token.assetId,
        );
      }
    });

    return [...assetIdsByKey.values()];
  }, [fromToken, toToken]);

  useEffect(() => {
    setSecurityDataByAssetId(EMPTY_SECURITY_DATA);
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

        setSecurityDataByAssetId(nextSecurityData);
      })
      .catch(() => {
        if (isCurrentRequest) {
          setSecurityDataByAssetId(EMPTY_SECURITY_DATA);
        }
      });

    return () => {
      isCurrentRequest = false;
    };
  }, [assetIds, useExternalServices]);

  return useExternalServices ? securityDataByAssetId : EMPTY_SECURITY_DATA;
}
