import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useLocation } from 'react-router-dom';
import { CaipChainId } from '@metamask/utils';
import { InternalAccount } from '@metamask/keyring-internal-api';
import { Box } from '../../components/component-library';
import {
  BlockSize,
  Display,
  FlexDirection,
  JustifyContent,
} from '../../helpers/constants/design-system';
import { setSelectedAccount } from '../../store/actions';
import { useMultichainBalances } from '../../hooks/useMultichainBalances';
import { NonEvmQueryParams } from '../../../shared/lib/deep-links/routes/nonevm';
import { SWAP_ROUTE } from '../../../shared/lib/deep-links/routes/route';
import { BridgeQueryParams } from '../../../shared/lib/deep-links/routes/swap';
import { RampsMetaMaskEntry } from '../../hooks/ramps/useRamps/useRamps';
import { getLastSelectedNonEvmAccount } from '../../selectors/multichain';
import {
  getDataCollectionForMarketing,
  getMetaMaskAccountsOrdered,
  getMetaMetricsId,
  getParticipateInMetaMetrics,
} from '../../selectors';
import { BaseUrl } from '../../../shared/constants/urls';
import AddNonEvmAccountModal from '../../components/multichain/network-list-menu/add-non-evm-account/add-non-evm-account';

const { getExtensionURL } = globalThis.platform;

const getSwapUrl = (chainId: CaipChainId): string => {
  const query = new URLSearchParams();
  query.set('sourceToken', chainId);
  query.set(BridgeQueryParams.SWAPS, 'true');
  return getExtensionURL(SWAP_ROUTE, query.toString());
};

const getBuyUrl = (
  chainId: CaipChainId,
  metaMetricsId: string | null,
  isMetaMetricsEnabled: boolean,
  isMarketingEnabled: boolean,
): string => {
  const buyParams = new URLSearchParams();
  buyParams.set('metamaskEntry', RampsMetaMaskEntry.BuySellButton);
  buyParams.set('chainId', chainId);

  if (metaMetricsId) {
    buyParams.set('metametricsId', metaMetricsId);
  }

  buyParams.set('metricsEnabled', String(isMetaMetricsEnabled));

  if (isMarketingEnabled) {
    buyParams.set('marketingEnabled', String(isMarketingEnabled));
  }

  const buyUrl = new URL('/buy', BaseUrl.Portfolio);
  buyUrl.search = buyParams.toString();
  return buyUrl.toString();
};

export const NonEvmBalanceCheck = () => {
  const location = useLocation();
  const dispatch = useDispatch();
  const metaMetricsId = useSelector(getMetaMetricsId);
  const isMetaMetricsEnabled = useSelector(getParticipateInMetaMetrics);
  const isMarketingEnabled = useSelector(getDataCollectionForMarketing);
  const accounts = useSelector(getMetaMaskAccountsOrdered);
  const lastSelectedNonEvmAccount = useSelector(getLastSelectedNonEvmAccount);

  const params = new URLSearchParams(location.search);
  const chainId = params.get(NonEvmQueryParams.ChainId) as CaipChainId;

  const { assetsWithBalance } = useMultichainBalances();

  const hasAccountForChain = accounts.some((account: InternalAccount) =>
    account.scopes.includes(chainId),
  );

  useEffect(() => {
    if (!chainId) {
      return;
    }

    if (hasAccountForChain) {
      // If we have a "last selected" non-EVM account that matches the chain -> switch to it
      if (lastSelectedNonEvmAccount?.scopes?.includes(chainId)) {
        dispatch(setSelectedAccount(lastSelectedNonEvmAccount.address));
      }

      const hasPositiveBalance = assetsWithBalance.some(
        (asset) =>
          asset.chainId === chainId && asset.balance && asset.balance !== '0',
      );

      window.location.href = hasPositiveBalance
        ? getSwapUrl(chainId)
        : getBuyUrl(
            chainId,
            metaMetricsId,
            isMetaMetricsEnabled,
            isMarketingEnabled,
          );
    }
  }, [
    chainId,
    assetsWithBalance,
    metaMetricsId,
    isMetaMetricsEnabled,
    isMarketingEnabled,
    hasAccountForChain,
    accounts,
  ]);

  if (!hasAccountForChain) {
    return (
      <Box
        display={Display.Flex}
        flexDirection={FlexDirection.Column}
        justifyContent={JustifyContent.spaceBetween}
        width={BlockSize.OneFifth}
        padding={4}
      >
        <AddNonEvmAccountModal chainId={chainId} />
      </Box>
    );
  }

  return null;
};
