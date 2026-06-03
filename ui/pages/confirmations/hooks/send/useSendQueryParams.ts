import { Hex } from '@metamask/utils';
import { useEffect, useMemo } from 'react';
import { useNavigate, useLocation, useSearchParams } from 'react-router-dom';

import { SEND_ROUTE } from '../../../../helpers/constants/routes';
import { SendPages } from '../../constants/send';
import { useSendContext } from '../../context/send';
import { useSendAssets } from './useSendAssets';

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
  const { tokens, nfts } = useSendAssets();
  const allAssets = useMemo(() => [...tokens, ...nfts], [tokens, nfts]);

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

    // Search through filtered tokens and NFTs from useSendAssets
    const newAsset = allAssets.find(
      ({ assetId, address, chainId: tokenChainId, isNative, tokenId }) => {
        const chainIdMatches = paramChainId === String(tokenChainId);
        if (!chainIdMatches) {
          return false;
        }

        // For tokens (no tokenId), match by assetId or check if native
        if (!paramTokenId) {
          return (
            (paramAsset &&
              assetId?.toLowerCase() === paramAsset.toLowerCase()) ||
            (!paramAsset && isNative)
          );
        }

        // For NFTs (has tokenId), match by address and tokenId
        return (
          paramTokenId === tokenId &&
          ((paramAsset &&
            address?.toLowerCase() === paramAsset.toLowerCase()) ||
            (!paramAsset && isNative))
        );
      },
    );

    if (newAsset) {
      updateAsset(newAsset);
    }
  }, [asset, allAssets, paramAsset, paramChainId, paramTokenId, updateAsset]);
};
