import { Hex } from '@metamask/utils';
import { getNativeAssetForChainId } from '@metamask/bridge-controller';
import { isAddress as isEvmAddress } from 'ethers/lib/utils';
import { useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom-v5-compat';
import { useLocation, useSearchParams } from 'react-router-dom-v5-compat';
import { useSelector } from 'react-redux';

import useMultiChainAssets from '../../../../components/app/assets/hooks/useMultichainAssets';
import { SEND_ROUTE } from '../../../../helpers/constants/routes';
import { getAllTokens } from '../../../../selectors';
import { Asset } from '../../types/send';
import { SendPages } from '../../constants/send';
import { useSendContext } from '../../context/send';

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
    to,
    updateValue,
    updateCurrentPage,
    updateAsset,
    updateTo,
    value,
  } = useSendContext();
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const [searchParams] = useSearchParams();
  const multiChainAssets = useMultiChainAssets();
  const evmTokens: Record<Hex, Record<Hex, Asset[]>> = useSelector(
    getAllTokens,
  );

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
    if (to !== undefined && paramRecipient !== to) {
      queryParams.set('recipient', to);
    }
    navigate({
      pathname: `${SEND_ROUTE}/${subPath}`,
      search: queryParams.toString(),
    }, { replace: true });
  }, [
    asset,
    navigate,
    paramAmount,
    paramAsset,
    paramChainId,
    paramRecipient,
    searchParams,
    subPath,
    to,
    value,
  ]);

  useEffect(() => {
    if (value === undefined && paramAmount) {
      updateValue(paramAmount);
    }
  }, [paramAmount, value, updateValue]);

  useEffect(() => {
    if (to === undefined && paramRecipient) {
      updateTo(paramRecipient);
    }
  }, [to, paramRecipient, updateTo]);

  useEffect(() => {
    if (asset) {
      return;
    }
    let newAsset;
    if (paramAsset) {
      if (isEvmAddress(paramAsset)) {
        newAsset = getAssetFromList(evmTokens, paramAsset as Hex);
      } else {
        newAsset = multiChainAssets.find(
          ({ address }) => address === paramAsset,
        );
      }
    } else if (paramChainId) {
      newAsset = {
        ...getNativeAssetForChainId(paramChainId),
        chainId: paramChainId,
      };
    }
    if (newAsset) {
      updateAsset(newAsset);
    }
  }, [
    asset,
    paramAsset,
    paramChainId,
    // using only multiChainAssets as dependency causes infinite loading
    multiChainAssets?.length,
    evmTokens,
    updateAsset,
  ]);
};
