import React, { useContext, useEffect, useMemo } from 'react';
import { useSelector } from 'react-redux';
import { type Hex } from '@metamask/utils';
import TokenCell from '../token-cell';
import {
  getChainIdsToPoll,
  getEnabledNetworksByNamespace,
  getNewTokensImported,
  getPreferences,
  getSelectedAccount,
  getTokenSortConfig,
} from '../../../../selectors';
import { endTrace, TraceName } from '../../../../../shared/lib/trace';
import { useTokenBalances as pollAndUpdateEvmBalances } from '../../../../hooks/useTokenBalances';
import { useNetworkFilter } from '../hooks';
import { type TokenWithFiatAmount } from '../types';
import { filterAssets } from '../util/filter';
import { sortAssets } from '../util/sort';
import useMultiChainAssets from '../hooks/useMultichainAssets';
import {
  getSelectedMultichainNetworkConfiguration,
  getIsEvmMultichainNetworkSelected,
} from '../../../../selectors/multichain/networks';
import { getTokenBalancesEvm } from '../../../../selectors/assets';
import {
  MetaMetricsEventCategory,
  MetaMetricsEventName,
} from '../../../../../shared/constants/metametrics';
import { MetaMetricsContext } from '../../../../contexts/metametrics';
import { SafeChain } from '../../../../pages/settings/networks-tab/networks-form/use-safe-chains';
import { isGlobalNetworkSelectorRemoved } from '../../../../selectors/selectors';

type TokenListProps = {
  onTokenClick: (chainId: string, address: string) => void;
  safeChains?: SafeChain[];
};

// TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
// eslint-disable-next-line @typescript-eslint/naming-convention
function TokenList({ onTokenClick, safeChains }: TokenListProps) {
  const isEvm = useSelector(getIsEvmMultichainNetworkSelected);
  const chainIdsToPoll = useSelector(getChainIdsToPoll);
  const newTokensImported = useSelector(getNewTokensImported);
  const currentNetwork = useSelector(getSelectedMultichainNetworkConfiguration);
  const { privacyMode } = useSelector(getPreferences);
  const tokenSortConfig = useSelector(getTokenSortConfig);
  const selectedAccount = useSelector(getSelectedAccount);
  const evmBalances = useSelector((state) =>
    getTokenBalancesEvm(state, selectedAccount.address),
  );
  const trackEvent = useContext(MetaMetricsContext);
  // EVM specific tokenBalance polling, updates state via polling loop per chainId
  pollAndUpdateEvmBalances({
    chainIds: chainIdsToPoll as Hex[],
  });

  const multichainAssets = useMultiChainAssets();

  // network filter to determine which tokens to show in list
  // on EVM we want to filter based on network filter controls, on non-evm we only want tokens from that chain identifier
  const { networkFilter } = useNetworkFilter();
  const enabledNetworksByNamespace = useSelector(getEnabledNetworksByNamespace);

  const networksToShow = useMemo(() => {
    return isGlobalNetworkSelectorRemoved
      ? enabledNetworksByNamespace
      : networkFilter;
  }, [enabledNetworksByNamespace, networkFilter]);

  const sortedFilteredTokens = useMemo(() => {
    const balances = isEvm ? evmBalances : multichainAssets;
    const filteredAssets = filterAssets(balances as TokenWithFiatAmount[], [
      {
        key: 'chainId',
        opts: isEvm ? networksToShow : { [currentNetwork.chainId]: true },
        filterCallback: 'inclusive',
      },
    ]);

    // sort filtered tokens based on the tokenSortConfig in state
    return sortAssets([...filteredAssets], tokenSortConfig);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    isEvm,
    evmBalances,
    multichainAssets,
    networksToShow,
    currentNetwork.chainId,
    tokenSortConfig,
    // newTokensImported included in deps, but not in hook's logic
    newTokensImported,
  ]);

  useEffect(() => {
    if (sortedFilteredTokens) {
      endTrace({ name: TraceName.AccountOverviewAssetListTab });
    }
  }, [sortedFilteredTokens]);

  const handleTokenClick = (token: TokenWithFiatAmount) => () => {
    // Ensure token has a valid chainId before proceeding
    if (!token.chainId) {
      return;
    }

    onTokenClick(token.chainId, token.address);

    // Track event: token details
    trackEvent({
      category: MetaMetricsEventCategory.Tokens,
      event: MetaMetricsEventName.TokenDetailsOpened,
      properties: {
        location: 'Home',
        // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
        // eslint-disable-next-line @typescript-eslint/naming-convention
        token_symbol: token.symbol ?? 'unknown',
        // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
        // eslint-disable-next-line @typescript-eslint/naming-convention
        chain_id: token.chainId,
      },
    });
  };

  return (
    <>
      {sortedFilteredTokens.map((token: TokenWithFiatAmount) => (
        <TokenCell
          key={`${token.chainId}-${token.symbol}-${token.address}`}
          token={token}
          privacyMode={privacyMode}
          onClick={handleTokenClick(token)}
          safeChains={safeChains}
        />
      ))}
    </>
  );
}

export default React.memo(TokenList);
