import { useEffect, useMemo, useCallback, useState, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useHistory, useLocation } from 'react-router-dom';
import {
  CaipAssetType,
  CaipAssetTypeStruct,
  parseCaipAssetType,
} from '@metamask/utils';
import {
  formatChainIdToCaip,
  getNativeAssetForChainId,
  isNativeAddress,
} from '@metamask/bridge-controller';
import { type InternalAccount } from '@metamask/keyring-internal-api';
import { type NetworkConfiguration } from '@metamask/network-controller';
import {
  type AssetMetadata,
  fetchAssetMetadataForAssetIds,
} from '../../../shared/lib/asset-utils';
import { BridgeQueryParams } from '../../../shared/lib/deep-links/routes/swap';
import { calcTokenAmount } from '../../../shared/lib/transactions-controller-utils';
import {
  setFromChain,
  setFromToken,
  setFromTokenInputValue,
  setToChainId,
  setToToken,
} from '../../ducks/bridge/actions';
import {
  getFromChain,
  getFromChains,
  getFromToken,
  getToToken,
} from '../../ducks/bridge/selectors';

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

// Fetch all asset metadata at once
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

export const useBridgeQueryParams = (
  selectedSolanaAccount?: InternalAccount,
  selectedEvmAccount?: InternalAccount,
) => {
  const dispatch = useDispatch();
  const fromChains = useSelector(getFromChains);
  const fromChain = useSelector(getFromChain);
  const fromToken = useSelector(getFromToken);

  const abortController = useRef(new AbortController());
  const toToken = useSelector(getToToken);

  const { search } = useLocation();
  const history = useHistory();

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
      history.replace({ search: updatedSearchParams.toString() });
    },
    [],
  );

  const parsedAssetIds = useMemo(() => {
    return {
      parsedToAssetId: parseAsset(searchParams.get(BridgeQueryParams.TO)),
      parsedFromAssetId: parseAsset(searchParams.get(BridgeQueryParams.FROM)),
    };
  }, [searchParams]);

  const { parsedFromAssetId, parsedToAssetId } = parsedAssetIds;

  const parsedAmount = useMemo(() => {
    return searchParams.get(BridgeQueryParams.AMOUNT);
  }, [searchParams]);

  const [assetMetadataByAssetId, setAssetMetadataByAssetId] = useState<Awaited<
    ReturnType<typeof fetchAssetMetadataForAssetIds>
  > | null>(null);

  useEffect(() => {
    if (parsedFromAssetId?.assetId || parsedToAssetId?.assetId) {
      abortController.current.abort();
      abortController.current = new AbortController();
    }
    fetchAssetMetadata(
      abortController.current.signal,
      parsedFromAssetId?.assetId,
      parsedToAssetId?.assetId,
    ).then((result) => {
      setAssetMetadataByAssetId(result);
    });
  }, [parsedFromAssetId?.assetId, parsedToAssetId?.assetId]);

  // Set fromChain and fromToken
  const setFromChainAndToken = useCallback(
    async (
      fromTokenMetadata,
      fromAsset,
      network: NetworkConfiguration,
      networks: NetworkConfiguration[],
      solanaAccount?: InternalAccount,
      evmAccount?: InternalAccount,
    ) => {
      const { chainId: fromChainId } = fromAsset;

      if (fromTokenMetadata) {
        const { chainId, assetReference } = parseCaipAssetType(
          fromTokenMetadata.assetId,
        );
        // TODO detect native address here for EVM to fix native spot price and balance
        const isNativeReference =
          getNativeAssetForChainId(chainId)?.assetId.includes(assetReference);
        const token = {
          ...fromTokenMetadata,
          chainId,
          address:
            isNativeReference || isNativeAddress(assetReference)
              ? ''
              : assetReference,
        };
        // Only update if chain is different
        if (fromChainId === formatChainIdToCaip(network.chainId)) {
          dispatch(setFromToken(token));
        } else {
          const targetChain = networks.find(
            (chain) => formatChainIdToCaip(chain.chainId) === fromChainId,
          );

          if (targetChain) {
            if (fromTokenMetadata) {
              await dispatch(
                setFromChain({
                  networkConfig: targetChain,
                  selectedSolanaAccount: solanaAccount,
                  selectedEvmAccount: evmAccount,
                  token,
                }),
              );
            }
          }
        }
      }
    },
    [],
  );

  const setToChainAndToken = useCallback(
    async (toTokenMetadata: AssetMetadata | undefined) => {
      if (toTokenMetadata) {
        const { chainId, assetReference } = parseCaipAssetType(
          toTokenMetadata.assetId,
        );

        dispatch(setToChainId(chainId));
        dispatch(
          setToToken({
            ...toTokenMetadata,
            chainId,
            address: assetReference,
          }),
        );
      }
    },
    [],
  );

  // Main effect to orchestrate the parameter processing
  useEffect(() => {
    if (
      !parsedFromAssetId ||
      !assetMetadataByAssetId ||
      !fromChain ||
      !fromChains.length
    ) {
      return;
    }

    const fromTokenMetadata =
      assetMetadataByAssetId?.[parsedFromAssetId.assetId] ??
      assetMetadataByAssetId?.[
        parsedFromAssetId.assetId.toLowerCase() as unknown as CaipAssetType
      ];

    (async () => {
      // Process from chain/token first
      await setFromChainAndToken(
        fromTokenMetadata,
        parsedFromAssetId,
        fromChain,
        fromChains,
        selectedSolanaAccount,
        selectedEvmAccount,
      );
    })();
  }, [
    assetMetadataByAssetId,
    parsedFromAssetId,
    fromChains,
    fromChain,
    selectedSolanaAccount,
    selectedEvmAccount,
  ]);

  // Set toChainId and toToken
  useEffect(() => {
    if (!parsedToAssetId) {
      return;
    }
    const toTokenMetadata =
      assetMetadataByAssetId?.[parsedToAssetId.assetId] ??
      assetMetadataByAssetId?.[
        parsedToAssetId.assetId.toLowerCase() as unknown as CaipAssetType
      ];
    (async () => {
      await setToChainAndToken(toTokenMetadata);
    })();
  }, [parsedToAssetId, toToken, assetMetadataByAssetId]);

  // Process amount after fromToken is set
  useEffect(() => {
    if (
      parsedFromAssetId
        ? fromToken &&
          fromToken.assetId?.toLowerCase() ===
            parsedFromAssetId.assetId.toLowerCase()
        : true
    ) {
      if (parsedAmount && fromToken) {
        dispatch(
          setFromTokenInputValue(
            calcTokenAmount(parsedAmount, fromToken.decimals).toFixed(
              fromToken.decimals,
            ),
          ),
        );
      }
      cleanupUrlParams([
        BridgeQueryParams.AMOUNT,
        BridgeQueryParams.FROM,
        BridgeQueryParams.TO,
      ]);
    }
  }, [parsedAmount, parsedFromAssetId, fromToken]);
};
