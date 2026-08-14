import {
  type CaipAssetType,
  type CaipChainId,
  type Hex,
  isCaipAssetType,
} from '@metamask/utils';

import { useAsyncResult } from '../../../hooks/useAsync';
import {
  Token,
  TokenWithFiatAmount,
} from '../../../components/app/assets/types';
import { buildTokenFromCaipAssetId } from '../build-token-from-caip-asset-id';

export type LocationStateToken = {
  address: string;
  symbol: string;
  name: string;
  chainId: string;
  image?: string;
  isNative?: boolean;
  decimals: number;
};

type UseRouteAssetTokenParams = {
  ownedToken?: TokenWithFiatAmount | Token | null;
  locationStateToken?: LocationStateToken;
  assetId?: CaipAssetType;
};

export const useRouteAssetToken = ({
  ownedToken,
  locationStateToken,
  assetId,
}: UseRouteAssetTokenParams) => {
  const shouldFetchMetadata =
    !ownedToken &&
    !locationStateToken &&
    Boolean(assetId && isCaipAssetType(assetId));

  const {
    value: fetchedToken,
    pending,
    error,
  } = useAsyncResult(async () => {
    if (!shouldFetchMetadata || !assetId) {
      return undefined;
    }

    return buildTokenFromCaipAssetId(assetId);
  }, [shouldFetchMetadata, assetId]);

  const token = ownedToken ?? locationStateToken ?? fetchedToken;

  return {
    token,
    isLoading: shouldFetchMetadata && pending,
    hasError: shouldFetchMetadata && Boolean(error),
  };
};

export type RouteAssetToken = Token | LocationStateToken | TokenWithFiatAmount;

export const getRouteAssetChainId = (
  token: RouteAssetToken | undefined,
  chainId?: Hex | CaipChainId,
): Hex | CaipChainId | undefined =>
  (token?.chainId ?? chainId) as Hex | CaipChainId | undefined;
