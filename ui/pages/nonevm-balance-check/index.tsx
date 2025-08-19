import React, { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useMultichainBalances } from '../../hooks/useMultichainBalances';
import { NonEvmQueryParams } from '../../../shared/lib/deep-links/routes/nonevm';
import { BaseUrl } from '../../../shared/constants/urls';
import { SWAP_ROUTE } from '../../../shared/lib/deep-links/routes/route';

const { getExtensionURL } = globalThis.platform;

export const NonEvmBalanceCheck = () => {
  const location = useLocation();
  const params = new URLSearchParams(location.search);
  const chainId = params.get(NonEvmQueryParams.CHAIN_ID)?.toLowerCase();

  const { assetsWithBalance } = useMultichainBalances();

  useEffect(() => {
    if (!chainId) {
      return;
    }

    // Find balance for the chainId
    const chainBalance = assetsWithBalance.find(
      (asset) => asset.chainId === chainId && asset.isNative
    );

    if (chainBalance && chainBalance.balance !== '0') {
      const query = new URLSearchParams();
      query.set('sourceToken', chainId);
      window.location.href = getExtensionURL(SWAP_ROUTE, query.toString());
    } else {
      const buyUrl = new URL('/buy', BaseUrl.Portfolio);
      window.location.href = buyUrl.toString();
    }
  }, [chainId, assetsWithBalance, params]);

  return null;
};
