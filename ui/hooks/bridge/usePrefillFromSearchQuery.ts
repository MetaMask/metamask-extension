import { useEffect, useMemo, useCallback, useState, useRef } from 'react';
import { useDispatch, useSelector, shallowEqual } from 'react-redux';
import {
  type CaipAssetType,
  CaipAssetTypeStruct,
  parseCaipAssetType,
} from '@metamask/utils';
import {
  type AssetMetadata,
  fetchAssetMetadataForAssetIds,
} from '../../../shared/lib/asset-utils';
import { BridgeQueryParams } from '../../../shared/lib/deep-links/routes/swap';
import { calcTokenAmount } from '../../../shared/lib/transactions-controller-utils';
import {
  setFromToken,
  setFromTokenInputValue,
  setToToken,
} from '../../ducks/bridge/actions';
import { getFromToken } from '../../ducks/bridge/selectors';
import { isSupportedBridgeChain } from '../../ducks/bridge/utils';
import { getMultichainNetworkConfigurationsByChainId } from '../../selectors/multichain';
import { useBridgeNavigation } from './useBridgeNavigation';

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
 * This sets the bridge fromChain, fromToken, fromTokenInputValue,
 * toChainId, and toToken from the URL search params.
 * It also clears the search params after setting the values.
 */
export const usePrefillFromSearchQuery = () => {
  const dispatch = useDispatch();
  const fromToken = useSelector(getFromToken);
  const networkConfigsByChainId = useSelector(
    getMultichainNetworkConfigurationsByChainId,
    shallowEqual,
  );

  const abortController = useRef<AbortController>(new AbortController());

  const { resetSearchParams, search } = useBridgeNavigation();

  // Parse CAIP asset data
  const searchParams = useMemo(() => new URLSearchParams(search), [search]);

  const [parsedFromAssetId, setParsedFromAssetId] =
    useState<ReturnType<typeof parseAsset>>(null);
  const [parsedToAssetId, setParsedToAssetId] =
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
      searchParams.get(BridgeQueryParams.From),
    );
    const searchParamsTo = parseAsset(searchParams.get(BridgeQueryParams.To));
    const searchParamsAmount = searchParams.get(BridgeQueryParams.Amount);

    if (searchParamsFrom || searchParamsTo || searchParamsAmount) {
      setParsedToAssetId(searchParamsTo);
      setParsedFromAssetId(searchParamsFrom);
      if (searchParamsAmount) {
        setParsedAmount(searchParamsAmount);
      }
      resetSearchParams([
        BridgeQueryParams.From,
        BridgeQueryParams.To,
        BridgeQueryParams.Amount,
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

  const setToChainAndToken = useCallback(
    async (toTokenMetadata: AssetMetadata) => {
      dispatch(setToToken(toTokenMetadata));
      // Clear parsed to asset ID after successful processing
      setParsedToAssetId(null);
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

    if (!fromTokenMetadata) {
      // Exit effect if from-token metadata is not available due to unknown or malformed asset id.
      return;
    }

    // setFromToken validates the chain and auto-enables the network when needed.
    // If the EVM network is not yet in the user's configs, setFromToken dispatches
    // addNetwork and returns early. networkConfigsByChainId is kept as a dep so
    // this effect re-runs once the resulting state update arrives, at which point
    // setFromToken finds the network and dispatches the token action.
    dispatch(setFromToken(fromTokenMetadata));
  }, [assetMetadataByAssetId, parsedFromAssetId, networkConfigsByChainId]);

  // Set toChainId and toToken
  useEffect(() => {
    if (!parsedToAssetId) {
      return;
    }

    if (!isSupportedBridgeChain(parsedToAssetId.chainId)) {
      // Reject unsupported or unknown to-chains (similar to for from-chains check).
      return;
    }

    const toTokenMetadata =
      assetMetadataByAssetId?.[parsedToAssetId.assetId] ??
      assetMetadataByAssetId?.[
        parsedToAssetId.assetId.toLowerCase() as unknown as CaipAssetType
      ];
    if (toTokenMetadata) {
      setToChainAndToken(toTokenMetadata);
    }
  }, [parsedToAssetId, assetMetadataByAssetId]);

  // Process amount after fromToken is set
  useEffect(() => {
    if (
      parsedFromAssetId &&
      fromToken &&
      assetMetadataByAssetId &&
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
  }, [parsedAmount, parsedFromAssetId, assetMetadataByAssetId, fromToken]);
};
