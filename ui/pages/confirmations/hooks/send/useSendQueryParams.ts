import { Hex } from '@metamask/utils';
import { useEffect, useMemo } from 'react';
import {
  useNavigate,
  useLocation,
  useSearchParams,
} from 'react-router-dom-v5-compat';
import { useSelector } from 'react-redux';

import { SEND_ROUTE } from '../../../../helpers/constants/routes';
import { getAssetsBySelectedAccountGroup } from '../../../../selectors/assets';
import { Asset } from '../../types/send';
import { SendPages } from '../../constants/send';
import { useSendContext } from '../../context/send';
import { useSendNfts } from './useSendNfts';

export const useSendQueryParams = () => {
  const {
    asset,
    currentPage,
    hexData,
    maxValueMode,
    to,
    updateValue,
    updateCurrentPage,
    updateAsset,
    updateHexData,
    updateTo,
    value,
  } = useSendContext();
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const [searchParams] = useSearchParams();
  const nfts = useSendNfts();
  const assets = useSelector(getAssetsBySelectedAccountGroup);
  const flatAssets = useMemo(() => Object.values(assets).flat(), [assets]);

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
  const paramTokenId = searchParams.get('tokenId');
  const paramHexData = searchParams.get('hexData');
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
      queryParams.set('asset', asset.assetId ?? asset.address);
    }
    if (asset?.chainId !== undefined && paramChainId !== asset.chainId) {
      queryParams.set('chainId', asset.chainId.toString());
    }
    if (asset?.tokenId !== undefined && paramTokenId !== asset.tokenId) {
      queryParams.set('tokenId', asset.tokenId);
    }
    if (maxValueMode !== undefined && paramMaxValueMode !== `${maxValueMode}`) {
      queryParams.set('maxValueMode', maxValueMode.toString());
    }
    if (hexData !== undefined && paramHexData !== hexData) {
      queryParams.set('hexData', hexData.toString());
    }
    if (to !== undefined && paramRecipient !== to) {
      queryParams.set('recipient', to);
    }
    navigate(`${SEND_ROUTE}/${subPath}?${queryParams.toString()}`, {
      replace: true,
    });
  }, [
    asset,
    navigate,
    hexData,
    maxValueMode,
    paramAmount,
    paramAsset,
    paramChainId,
    paramTokenId,
    paramMaxValueMode,
    paramRecipient,
    searchParams,
    subPath,
    to,
    value,
  ]);

  useEffect(() => {
    if (to === undefined && paramRecipient) {
      updateTo(paramRecipient);
    }
  }, [to, paramRecipient, updateTo]);

  useEffect(() => {
    if (hexData === undefined && paramHexData) {
      updateHexData(paramHexData as Hex);
    }
  }, [hexData, paramHexData, updateHexData]);

  useEffect(() => {
    if (value === undefined && paramAmount) {
      updateValue(paramAmount, paramMaxValueMode === 'true');
    }
  }, [paramAmount, paramMaxValueMode, updateValue, value]);

  useEffect(() => {
    if (asset || !paramChainId) {
      return;
    }

    let newAsset: Asset | undefined = flatAssets?.find(
      ({ assetId, chainId: tokenChainId, isNative }) =>
        paramChainId === tokenChainId &&
        ((paramAsset && assetId?.toLowerCase() === paramAsset.toLowerCase()) ||
          (!paramAsset && isNative)),
    );

    if (!newAsset) {
      newAsset = nfts?.find(
        ({ address, chainId: tokenChainId, isNative, tokenId }) =>
          paramChainId === tokenChainId &&
          paramTokenId === tokenId &&
          ((paramAsset &&
            address?.toLowerCase() === paramAsset.toLowerCase()) ||
            (!paramAsset && isNative)),
      );
    }

    if (newAsset) {
      updateAsset(newAsset);
    }
  }, [
    asset,
    flatAssets,
    paramAsset,
    paramChainId,
    paramTokenId,
    nfts,
    updateAsset,
  ]);
};
