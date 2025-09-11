import { Hex, isHexString } from '@metamask/utils';
import { getNativeAssetForChainId } from '@metamask/bridge-controller';
import { isAddress as isEvmAddress } from 'ethers/lib/utils';
import { useEffect, useMemo } from 'react';
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom-v5-compat';
import { useSelector } from 'react-redux';

import { toHex } from '../../../../../shared/lib/delegation/utils';
import useMultiChainAssets from '../../../../components/app/assets/hooks/useMultichainAssets';
import { SEND_ROUTE } from '../../../../helpers/constants/routes';
import { getAllTokens } from '../../../../selectors';
import { Asset } from '../../types/send';
import { SendPages } from '../../constants/send';
import { useSendContext } from '../../context/send';
import { useSendAssets } from './useSendAssets';

export const getAssetFromList = (
  evmTokens: Record<Hex, Record<Hex, Asset[]>>,
  address: Hex,
) => {
  let asset;
  Object.entries(evmTokens).forEach(
    ([chainId, assetsObj]: [string, Record<Hex, Asset[]>]) => {
      return Object.values(assetsObj).forEach((assets) => {
        const filteredAsset = assets.find((ast) => ast.address === address);
        if (filteredAsset) {
          asset = { ...filteredAsset, chainId };
        }
      });
    },
  );
  return asset;
};

export const useSendQueryParams = () => {
  const {
    asset,
    currentPage,
    maxValueMode,
    to,
    updateValue,
    updateCurrentPage,
    updateAsset,
    updateTo,
    value,
  } = useSendContext();
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const multiChainAssets = useMultiChainAssets();
  const evmTokens: Record<Hex, Record<Hex, Asset[]>> = useSelector(
    getAllTokens,
  );
  const { tokens, nfts } = useSendAssets();

  const subPath = useMemo(() => {
    const path = pathname.split('/').filter(Boolean)[1];
    if (Object.values(SendPages).includes(path as SendPages)) {
      return path;
    }
    return undefined;
  }, [pathname]);

  const paramAsset = searchParams.get('asset');
  const paramAmount = searchParams.get('amount');
  const paramChainId = searchParams.get('chainId');
  const paramRecipient = searchParams.get('recipient');
  const paramMaxValueMode = searchParams.get('maxValueMode');

  useEffect(() => {
    if (currentPage === subPath) {
      return;
    }
    updateCurrentPage((subPath as SendPages) ?? SendPages.ASSET);
  }, [currentPage, subPath, updateCurrentPage]);

  // syncing with url params is done to be able to navigate back to send from
  // other pages remembering state
  useEffect(() => {
    if (!subPath) {
      return;
    }
    const queryParams = new URLSearchParams(searchParams);
    if (value !== undefined && paramAmount !== value) {
      queryParams.set('amount', value);
    }
    if (asset?.address !== undefined && paramAsset !== asset.address) {
      queryParams.set('asset', asset.address);
    }
    if (asset?.chainId !== undefined && paramChainId !== asset.chainId) {
      queryParams.set('chainId', asset.chainId.toString());
    }
    if (maxValueMode !== undefined && paramMaxValueMode !== `${maxValueMode}`) {
      queryParams.set('maxValueMode', maxValueMode.toString());
    }
    if (to !== undefined && paramRecipient !== to) {
      queryParams.set('recipient', to);
    }
    navigate(`${SEND_ROUTE}/${subPath}?${queryParams.toString()}`, { replace: true });
  }, [
    asset,
    navigate,
    maxValueMode,
    paramAmount,
    paramAsset,
    paramChainId,
    paramMaxValueMode,
    paramRecipient,
    searchParams,
    subPath,
    to,
    value,
  ]);

  useEffect(() => {
    if (value === undefined && paramAmount) {
      updateValue(paramAmount, paramMaxValueMode === 'true');
    }
  }, [paramAmount, paramMaxValueMode, updateValue, value]);

  useEffect(() => {
    if (to === undefined && paramRecipient) {
      updateTo(paramRecipient);
    }
  }, [to, paramRecipient, updateTo]);

  useEffect(() => {
    if (asset) {
      return;
    }
    let nativeAsset;
    if (paramChainId && !paramAsset) {
      nativeAsset = {
        ...getNativeAssetForChainId(paramChainId),
        chainId: paramChainId,
      };
    }
    let newAsset;
    const asAddress =
      paramAsset ?? nativeAsset?.address ?? nativeAsset?.assetId;
    if (asAddress) {
      const cid = paramChainId ?? nativeAsset?.chainId;
      const chainId =
        isEvmAddress(asAddress) && cid && !isHexString(cid) ? toHex(cid) : cid;

      if (chainId) {
        newAsset = tokens?.find(
          ({ assetId, chainId: tokenChainId }) =>
            chainId === tokenChainId &&
            assetId?.toLowerCase() === asAddress.toLowerCase(),
        );
      }

      if (!newAsset) {
        newAsset = nfts?.find(
          ({ address: tokenAddrress, chainId: tokenChainId }) =>
            chainId === tokenChainId &&
            tokenAddrress?.toLowerCase() === asAddress.toLowerCase(),
        );
      }
    }

    if (!newAsset && paramAsset) {
      if (isEvmAddress(paramAsset)) {
        newAsset = getAssetFromList(evmTokens, paramAsset as Hex);
      } else {
        newAsset = multiChainAssets.find(
          ({ address }) => address === paramAsset,
        );
      }
    }

    if (newAsset) {
      updateAsset(newAsset);
    }
  }, [
    asset,
    evmTokens,
    paramAsset,
    paramChainId,
    // using only multiChainAssets as dependency causes infinite loading
    multiChainAssets?.length,
    nfts,
    tokens,
    updateAsset,
  ]);
};
