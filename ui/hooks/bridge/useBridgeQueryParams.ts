import { useEffect, useMemo, useCallback, useState, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  type CaipAssetType,
  CaipAssetTypeStruct,
  parseCaipAssetType,
} from '@metamask/utils';
import {
  getNativeAssetForChainId,
  isNativeAddress,
} from '@metamask/bridge-controller';
import {
  type AssetMetadata,
  fetchAssetMetadataForAssetIds,
} from '../../../shared/lib/asset-utils';
import { BridgeQueryParams } from '../../../shared/lib/deep-links/routes/swap';
import { calcTokenAmount } from '../../../shared/lib/transactions-controller-utils';
import {
  setEvmBalances,
  setFromToken,
  setFromTokenInputValue,
  setToToken,
} from '../../ducks/bridge/actions';
import { getFromChain, getFromToken } from '../../ducks/bridge/selectors';

const parseAsset = (assetId: string | null) => {
  if (!assetId) {
    return null;
  }

  try {
    const caipAssetId = CaipAssetTypeStruct.create(assetId);
    const { chainId, assetReference } = parseCaipAssetType(caipAssetId);
    return { chainId, assetReference, assetId: caipAssetId };
  } catch {
    return null;
  }
};

const fetchAssetMetadata = async (
  signal: AbortSignal,
  fromAsset?: CaipAssetType,
  toAsset?: CaipAssetType,
) => {
  const assetIds: CaipAssetType[] = [];
  if (fromAsset) {
    assetIds.push(fromAsset);
  }
  if (toAsset) {
    assetIds.push(toAsset);
  }

  if (assetIds.length === 0) {
    return null;
  }

  try {
    return await fetchAssetMetadataForAssetIds(assetIds, signal);
  } catch {
    return null;
  }
};

/**
 * This hook is used to set the bridge fromChain, fromToken, fromTokenInputValue,
 * toChainId, and toToken from the URL search params.
 * It also clear the search params after setting the values.
 */
export const useBridgeQueryParams = () => {
  const dispatch = useDispatch();
  const fromChain = useSelector(getFromChain);
  const fromToken = useSelector(getFromToken);

  const abortController = useRef<AbortController>(new AbortController());

  const { search, pathname } = useLocation();
  const navigate = useNavigate();

  // Parse CAIP asset data
  const searchParams = useMemo(() => new URLSearchParams(search), [search]);

  // Clean up URL parameters
  const cleanupUrlParams = useCallback(
    (paramsToRemove: BridgeQueryParams[]) => {
      const updatedSearchParams = new URLSearchParams(search);
      paramsToRemove.forEach((param) => {
        if (updatedSearchParams.get(param)) {
          updatedSearchParams.delete(param);
        }
      });
      navigate(
        {
          pathname,
          search: updatedSearchParams.toString(),
        },
        { replace: true },
      );
    },
    [search, pathname, navigate],
  );

  const [parsedFromAssetId, setParsedFromAssetId] =
    useState<ReturnType<typeof parseAsset>>(null);
  const [parsedtoAssetId, setParsedtoAssetId] =
    useState<ReturnType<typeof parseAsset>>(null);

  const [parsedAmount, setParsedAmount] = useState<string | null>(null);

  // Cleanup abort controller on unmount
  useEffect(() => {
    return () => {
      abortController.current.abort();
    };
  }, []);

  const [assetMetadataByAssetId, setAssetMetadataByAssetId] = useState<Awaited<
    ReturnType<typeof fetchAssetMetadataForAssetIds>
  > | null>(null);

  // Only update parsed values and fetch metadata if the search params
  // are set (once) to prevent infinite re-renders
  useEffect(() => {
    const searchParamsFrom = parseAsset(
      searchParams.get(BridgeQueryParams.FROM),
    );
    const searchParamsTo = parseAsset(searchParams.get(BridgeQueryParams.TO));
    const searchParamsAmount = searchParams.get(BridgeQueryParams.AMOUNT);

    if (searchParamsFrom || searchParamsTo || searchParamsAmount) {
      setParsedtoAssetId(searchParamsTo);
      setParsedFromAssetId(searchParamsFrom);
      if (searchParamsAmount) {
        setParsedAmount(searchParamsAmount);
      }
      cleanupUrlParams([
        BridgeQueryParams.FROM,
        BridgeQueryParams.TO,
        BridgeQueryParams.AMOUNT,
      ]);

      // Fetch asset metadata for both tokens in 1 call
      if (searchParamsTo?.assetId || searchParamsFrom?.assetId) {
        abortController.current.abort();
        abortController.current = new AbortController();
        fetchAssetMetadata(
          abortController.current.signal,
          searchParamsFrom?.assetId,
          searchParamsTo?.assetId,
        ).then((result) => {
          setAssetMetadataByAssetId(result);
        });
      }
    }
  }, [searchParams]);

  // Set fromChain and fromToken
  const setFromChainAndToken = useCallback(
    (fromTokenMetadata: AssetMetadata) => {
      if (fromTokenMetadata) {
        const { chainId, assetReference } = parseCaipAssetType(
          fromTokenMetadata.assetId,
        );
        const nativeAsset = getNativeAssetForChainId(chainId);
        // TODO remove this after v36.0.0 bridge-controller bump
        const isNativeReference = nativeAsset?.assetId.includes(assetReference);
        const token = {
          ...fromTokenMetadata,
          chainId,
          address:
            isNativeReference || isNativeAddress(assetReference)
              ? (nativeAsset?.address ?? '')
              : assetReference,
        };
        dispatch(setFromToken(token));
      }
    },
    [],
  );

  const setToChainAndToken = useCallback(
    async (toTokenMetadata: AssetMetadata) => {
      const { chainId, assetReference } = parseCaipAssetType(
        toTokenMetadata.assetId,
      );
      dispatch(
        setToToken({
          ...toTokenMetadata,
          chainId,
          address: assetReference,
        }),
      );
      // Clear parsed to asset ID after successful processing
      setParsedtoAssetId(null);
    },
    [],
  );

  // Main effect to orchestrate the parameter processing
  useEffect(() => {
    if (!parsedFromAssetId || !assetMetadataByAssetId) {
      return;
    }

    const fromTokenMetadata =
      assetMetadataByAssetId?.[parsedFromAssetId.assetId] ??
      assetMetadataByAssetId?.[
        parsedFromAssetId.assetId.toLowerCase() as unknown as CaipAssetType
      ];

    // Process from chain/token first
    setFromChainAndToken(fromTokenMetadata);
  }, [assetMetadataByAssetId, parsedFromAssetId]);

  // Set toChainId and toToken
  useEffect(() => {
    if (!parsedtoAssetId) {
      return;
    }
    const toTokenMetadata =
      assetMetadataByAssetId?.[parsedtoAssetId.assetId] ??
      assetMetadataByAssetId?.[
        parsedtoAssetId.assetId.toLowerCase() as unknown as CaipAssetType
      ];
    if (toTokenMetadata) {
      setToChainAndToken(toTokenMetadata);
    }
  }, [parsedtoAssetId, assetMetadataByAssetId]);

  // Process amount after fromToken is set
  useEffect(() => {
    if (
      parsedFromAssetId &&
      fromToken &&
      fromToken.assetId?.toLowerCase() ===
        parsedFromAssetId.assetId.toLowerCase()
    ) {
      // Clear parsed from asset ID after successful processing
      setParsedFromAssetId(null);
      if (parsedAmount) {
        dispatch(
          setFromTokenInputValue(
            calcTokenAmount(parsedAmount, fromToken.decimals).toFixed(
              fromToken.decimals,
            ),
          ),
        );
        setParsedAmount(null);
      }
    }
  }, [parsedAmount, parsedFromAssetId, fromToken]);

  // Set src token balance after url params are applied
  // This effect runs on each load regardless of the url params
  useEffect(() => {
    if (
      // Wait for url params to be applied
      !parsedFromAssetId &&
      !searchParams.get(BridgeQueryParams.FROM) &&
      fromToken?.chainId &&
      // TODO remove this when GNS references are removed
      // Wait for network to be changed if needed
      fromToken.chainId === fromChain?.chainId
    ) {
      dispatch(setEvmBalances(fromToken.assetId));
    }
  }, [
    parsedFromAssetId,
    fromToken?.chainId,
    fromToken?.address,
    fromChain?.chainId,
    searchParams,
  ]);
};
