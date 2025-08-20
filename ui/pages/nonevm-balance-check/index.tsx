import React, { useCallback, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { useLocation } from 'react-router-dom';
import { CaipChainId } from '@metamask/utils';
import { InternalAccount } from '@metamask/keyring-internal-api';
import { useMultichainBalances } from '../../hooks/useMultichainBalances';
import { NonEvmQueryParams } from '../../../shared/lib/deep-links/routes/nonevm';
import { SWAP_ROUTE } from '../../../shared/lib/deep-links/routes/route';
import { BridgeQueryParams } from '../../../shared/lib/deep-links/routes/swap';
import { RampsMetaMaskEntry } from '../../hooks/ramps/useRamps/useRamps';
import {
  getDataCollectionForMarketing,
  getMetaMaskAccountsOrdered,
  getMetaMetricsId,
  getParticipateInMetaMetrics,
  getMetaMaskHdKeyrings,
} from '../../selectors';
import { BaseUrl } from '../../../shared/constants/urls';
import { AccountMenu } from '../../components/multichain/account-menu/account-menu';
import {
  useMultichainWalletSnapClient,
  WalletClientType,
} from '../../hooks/accounts/useMultichainWalletSnapClient';
import { MultichainNetworks } from '../../../shared/constants/multichain/networks';

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
  const metaMetricsId = useSelector(getMetaMetricsId);
  const isMetaMetricsEnabled = useSelector(getParticipateInMetaMetrics);
  const isMarketingEnabled = useSelector(getDataCollectionForMarketing);
  const accounts = useSelector(getMetaMaskAccountsOrdered);
  const [primaryKeyring] = useSelector(getMetaMaskHdKeyrings);

  const params = new URLSearchParams(location.search);
  const chainId = params.get(NonEvmQueryParams.ChainId) as CaipChainId;

  const { assetsWithBalance } = useMultichainBalances();

  const clientType =
    chainId === MultichainNetworks.SOLANA
      ? WalletClientType.Solana
      : WalletClientType.Bitcoin;

  const walletClient = useMultichainWalletSnapClient(clientType);

  const hasAccountForChain = accounts.some((account: InternalAccount) => {
    console.log({
      chainId,
      accountScopes: account.scopes,
      hasScope: account.scopes.includes(chainId),
    });
    return account.scopes.includes(chainId);
  });

  const handleCreateAccount = useCallback(async () => {
    try {
      await walletClient.createAccount(
        {
          scope: chainId,
          entropySource: primaryKeyring.metadata.id,
        },
        {
          displayConfirmation: false,
          displayAccountNameSuggestion: false,
          setSelectedAccount: false,
        },
      );
    } catch (error) {
      console.error(`Error creating ${clientType} account:`, error);
    }
  }, [chainId, clientType, primaryKeyring.metadata.id, walletClient]);

  useEffect(() => {
    if (!chainId) {
      return;
    }

    if (hasAccountForChain) {
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
      <AccountMenu
        onClose={() => {
          // Just close the modal, account creation will be handled by AccountMenu
        }}
        showAccountCreation={true}
      />
    );
  }

  return null;
};
