import { useEffect, useMemo, useCallback, useState, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate, useLocation } from 'react-router-dom-v5-compat';
import {
  CaipAssetType,
  CaipAssetTypeStruct,
  parseCaipAssetType,
} from '@metamask/utils';
import {
  formatChainIdToCaip,
  getNativeAssetForChainId,
  isCrossChain,
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
  setEVMSrcTokenBalance,
  setEVMSrcNativeBalance,
  setFromChain,
  setFromToken,
  setFromTokenInputValue,
  setToToken,
} from '../../ducks/bridge/actions';
import {
  getFromAccount,
  getFromChain,
  getFromChains,
  getFromToken,
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
  const fromChains = useSelector(getFromChains);
  const fromChain = useSelector(getFromChain);
  const fromToken = useSelector(getFromToken);
  const selectedAccount = useSelector(getFromAccount);

  const abortController = useRef<AbortController>(new AbortController());

  const { search, pathname } = useLocation();
  const navigate = useNavigate();

  const searchParams = useMemo(() => new URLSearchParams(search), [search]);

  const cleanupUrlParams = useCallback(
    (paramsToRemove: BridgeQueryParams[]) => {
      const updatedSearchParams = new URLSearchParams(search);
      paramsToRemove.forEach((param) => {
        if (updatedSearchParams.get(param)) {
          updatedSearchParams.delete(param);
        }
      });
      navigate(`${pathname}?${updatedSearchParams.toString()}`, {
        replace: true,
      });
    },
    [search, navigate, pathname],
  );

  const [parsedFromAssetId, setParsedFromAssetId] =
    useState<ReturnType<typeof parseAsset>>(null);
  const [parsedToAssetId, setParsedToAssetId] =
    useState<ReturnType<typeof parseAsset>>(null);

  const [parsedAmount, setParsedAmount] = useState<string | null>(null);

  useEffect(() => {
    return () => {
      abortController.current.abort();
    };
  }, []);

  const [assetMetadataByAssetId, setAssetMetadataByAssetId] = useState<Awaited<
    ReturnType<typeof fetchAssetMetadataForAssetIds>
  > | null>(null);

  useEffect(() => {
    const searchParamsFrom = parseAsset(
      searchParams.get(BridgeQueryParams.FROM),
    );
    const searchParamsTo = parseAsset(searchParams.get(BridgeQueryParams.TO));
    const searchParamsAmount = searchParams.get(BridgeQueryParams.AMOUNT);

    if (searchParamsFrom || searchParamsTo || searchParamsAmount) {
      setParsedToAssetId(searchParamsTo);
      setParsedFromAssetId(searchParamsFrom);
      if (searchParamsAmount) {
        setParsedAmount(searchParamsAmount);
      }
      cleanupUrlParams([
        BridgeQueryParams.FROM,
        BridgeQueryParams.TO,
        BridgeQueryParams.AMOUNT,
      ]);

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
  }, [searchParams, cleanupUrlParams]);

  const setFromChainAndToken = useCallback(
    (
      fromTokenMetadata,
      fromAsset,
      network: NetworkConfiguration,
      networks: NetworkConfiguration[],
      account: InternalAccount | null,
    ) => {
      const { chainId: fromChainId } = fromAsset;

      if (fromTokenMetadata) {
        const { chainId, assetReference } = parseCaipAssetType(
          fromTokenMetadata.assetId,
        );
        const nativeAsset = getNativeAssetForChainId(chainId);
        const isNativeReference = nativeAsset?.assetId.includes(assetReference);
        const token = {
          ...fromTokenMetadata,
          chainId,
          address:
            isNativeReference || isNativeAddress(assetReference)
              ? (nativeAsset?.address ?? '')
              : assetReference,
        };
        if (fromChainId === formatChainIdToCaip(network.chainId)) {
          dispatch(setFromToken(token));
        } else {
          const targetChain = networks.find(
            (chain) => formatChainIdToCaip(chain.chainId) === fromChainId,
          );
          if (targetChain) {
            dispatch(
              setFromChain({
                networkConfig: targetChain,
                selectedAccount: account,
                token,
              }),
            );
          }
        }
      }
    },
    [dispatch],
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
      setParsedToAssetId(null);
    },
    [dispatch],
  );

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

    setFromChainAndToken(
      fromTokenMetadata,
      parsedFromAssetId,
      fromChain,
      fromChains,
      selectedAccount,
    );
  }, [
    assetMetadataByAssetId,
    parsedFromAssetId,
    fromChains,
    fromChain,
    selectedAccount,
    setFromChainAndToken,
  ]);

  useEffect(() => {
    if (!parsedToAssetId) {
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
  }, [parsedToAssetId, assetMetadataByAssetId, setToChainAndToken]);

  useEffect(() => {
    if (
      parsedFromAssetId &&
      fromToken &&
      fromToken.assetId?.toLowerCase() ===
        parsedFromAssetId.assetId.toLowerCase()
    ) {
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
  }, [parsedAmount, parsedFromAssetId, fromToken, dispatch]);

  useEffect(() => {
    if (
      !parsedFromAssetId &&
      !searchParams.get(BridgeQueryParams.FROM) &&
      fromToken &&
      !isCrossChain(fromToken.chainId, fromChain?.chainId) &&
      selectedAccount
    ) {
      dispatch(setEVMSrcTokenBalance(fromToken, selectedAccount.address));
      dispatch(
        setEVMSrcNativeBalance({
          selectedAddress: selectedAccount.address,
          chainId: fromToken.chainId,
        }),
      );
    }
  }, [
    parsedFromAssetId,
    selectedAccount,
    fromToken,
    fromChain,
    searchParams,
    dispatch,
  ]);
};
