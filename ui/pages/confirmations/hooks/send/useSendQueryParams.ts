import { isHexString } from '@metamask/utils';
import { isSolanaChainId } from '@metamask/bridge-controller';
import { useEffect, useMemo } from 'react';
import { useHistory } from 'react-router-dom';
import { useLocation, useSearchParams } from 'react-router-dom-v5-compat';
import { useSelector } from 'react-redux';

import { toHex } from '../../../../../shared/lib/delegation/utils';
import { SEND_ROUTE } from '../../../../helpers/constants/routes';
import { getAssetsBySelectedAccountGroup } from '../../../../selectors/assets';
import { SendPages } from '../../constants/send';
import { useSendContext } from '../../context/send';
import { useSendNfts } from './useSendNfts';

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
  const history = useHistory();
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
    history.replace(`${SEND_ROUTE}/${subPath}?${queryParams.toString()}`);
  }, [
    asset,
    history,
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
    if (to === undefined && paramRecipient) {
      updateTo(paramRecipient);
    }
  }, [to, paramRecipient, updateTo]);

  useEffect(() => {
    if (value === undefined && paramAmount) {
      updateValue(paramAmount, paramMaxValueMode === 'true');
    }
  }, [paramAmount, paramMaxValueMode, updateValue, value]);

  useEffect(() => {
    if (asset || !paramChainId) {
      return;
    }
    const chainId =
      !isSolanaChainId(paramChainId) && !isHexString(paramChainId)
        ? toHex(paramChainId)
        : paramChainId;

    const newAsset = [...flatAssets, ...nfts]?.find(
      ({ assetId, chainId: tokenChainId, isNative }) =>
        chainId === tokenChainId &&
        ((paramAsset && assetId?.toLowerCase() === paramAsset.toLowerCase()) ||
          (!paramAsset && isNative)),
    );

    if (newAsset) {
      updateAsset(newAsset);
    }
  }, [asset, flatAssets, paramAsset, paramChainId, nfts, updateAsset]);
};
