import { useEffect, useMemo, useCallback } from 'react';
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
import { fetchMultipleAssetMetadata } from '../../../shared/lib/asset-utils';
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
import { NetworkConfiguration } from '@metamask/network-controller';
import { getFromTokenInputValue } from '../../ducks/swaps/swaps';

const parseAsset = (assetId: string | null) => {
  if (!assetId) return null;

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
  fromAsset: CaipAssetType | null,
  toAsset: CaipAssetType | null,
) => {
  const assetIds: CaipAssetType[] = [];
  if (fromAsset) assetIds.push(fromAsset);
  if (toAsset) assetIds.push(toAsset);

  if (assetIds.length === 0) return null;

  try {
    return await fetchMultipleAssetMetadata(assetIds);
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

  const { search } = useLocation();
  const history = useHistory();

  // Parse CAIP asset data
  const searchParams = useMemo(() => new URLSearchParams(search), [search]);

  // Clean up URL parameters
  const cleanupUrlParams = useCallback(
    (paramsToRemove: BridgeQueryParams[]) => {
      const searchParams = new URLSearchParams(search);
      paramsToRemove.forEach((param) => {
        if (searchParams.get(param)) searchParams.delete(param);
      });
      history.replace({ search: searchParams.toString() });
    },
    [],
  );

  const fromAmount = useSelector(getFromTokenInputValue);
  const parsedFromAssetId = useMemo(() => {
    const fromAssetId = searchParams.get(BridgeQueryParams.FROM);

    return parseAsset(fromAssetId);
  }, [searchParams]);

  const toToken = useSelector(getToToken);
  const parsedToAssetId = useMemo(() => {
    const toAssetId = searchParams.get(BridgeQueryParams.TO);
    return parseAsset(toAssetId);
  }, [searchParams]);

  const parsedAmount = useMemo(() => {
    return searchParams.get(BridgeQueryParams.AMOUNT);
  }, [searchParams]);

  // Set fromChain and fromToken
  const setFromChainAndToken = useCallback(
    async (
      fromAsset: NonNullable<typeof parsedFromAssetId>,
      fromChain: NetworkConfiguration,
      fromChains: NetworkConfiguration[],
      solanaAccount?: InternalAccount,
      evmAccount?: InternalAccount,
    ) => {
      const { chainId: fromChainId } = fromAsset;

      const assetMetadataByAssetId = await fetchAssetMetadata(
        fromAsset.assetId,
        null,
      );
      const fromTokenMetadata =
        assetMetadataByAssetId?.[fromAsset.assetId] ??
        assetMetadataByAssetId?.[
          fromAsset.assetId.toLowerCase() as unknown as CaipAssetType
        ];
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
        if (fromChainId !== formatChainIdToCaip(fromChain.chainId)) {
          const targetChain = fromChains.find(
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
        } else {
          dispatch(setFromToken(token));
        }
      }
    },
    [],
  );

  // Set toChain and toToken
  const setToChainAndToken = useCallback(
    async (toAsset: NonNullable<typeof parsedToAssetId>) => {
      const assetMetadataByAssetId = await fetchAssetMetadata(
        null,
        toAsset.assetId,
      );
      const toTokenMetadata =
        assetMetadataByAssetId?.[toAsset.assetId] ??
        assetMetadataByAssetId?.[
          toAsset.assetId.toLowerCase() as unknown as CaipAssetType
        ];

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
    if (!parsedFromAssetId) {
      return;
    }
    if (!fromChain || !fromChains.length) return;

    (async () => {
      // Process from chain/token first
      await setFromChainAndToken(
        parsedFromAssetId,
        fromChain,
        fromChains,
        selectedSolanaAccount,
        selectedEvmAccount,
      );
    })();
  }, [
    parsedFromAssetId,
    fromChains,
    fromChain,
    selectedSolanaAccount,
    selectedEvmAccount,
  ]);

  // Set toChainId and toToken
  useEffect(() => {
    (async () => {
      if (parsedToAssetId) {
        await setToChainAndToken(parsedToAssetId);
      }
    })();
  }, [parsedToAssetId, toToken]);

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
