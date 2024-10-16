import React, { useMemo } from 'react';
import { shallowEqual, useSelector } from 'react-redux';
import TokenCell from '../token-cell';
import { useI18nContext } from '../../../../hooks/useI18nContext';
import { Box } from '../../../component-library';
import {
  AlignItems,
  Display,
  JustifyContent,
} from '../../../../helpers/constants/design-system';
import { TokenWithBalance } from '../asset-list/asset-list';
import { sortAssets } from '../util/sort';
import {
  getPreferences,
  getSelectedAccount,
  getShouldHideZeroBalanceTokens,
  getTokenExchangeRates,
} from '../../../../selectors';
import {
  MultichainNetwork,
  caipChainIdToHex,
  getChains,
} from '../../../../selectors/multichain';
import { useAccountTotalFiatBalanceByChainId } from '../../../../hooks/useAccountTotalFiatBalance';
import { getConversionRate } from '../../../../ducks/metamask/metamask';
import { useNativeTokenBalanceForChain } from '../asset-list/native-token/use-native-token-balance';

type TokenListProps = {
  onTokenClick: (arg: string) => void;
};

export default function TokenList({ onTokenClick }: TokenListProps) {
  const t = useI18nContext();
  const { tokenSortConfig } = useSelector(getPreferences);
  const selectedAccount = useSelector(getSelectedAccount);
  const conversionRate = useSelector(getConversionRate);
  const shouldHideZeroBalanceTokens = useSelector(
    getShouldHideZeroBalanceTokens,
  );
  const contractExchangeRates = useSelector(
    getTokenExchangeRates,
    shallowEqual,
  );
  const chains = useSelector(getChains);

  if (!chains || chains.length === 0) {
    // Handle loading state or no chains available
    return (
      <Box
        display={Display.Flex}
        alignItems={AlignItems.center}
        justifyContent={JustifyContent.center}
        padding={7}
        data-testid="token-list-loading-message"
      >
        {t('loadingTokens')}
      </Box>
    );
  }

  return (
    <div>
      {chains.map((chain) => (
        <>
          <div>{chain.chainId}</div>
          <TokenListForChain
            key={chain.network.chainId}
            chain={chain}
            onTokenClick={onTokenClick}
            tokenSortConfig={tokenSortConfig}
            selectedAccount={selectedAccount}
            conversionRate={conversionRate}
            contractExchangeRates={contractExchangeRates}
            shouldHideZeroBalanceTokens={shouldHideZeroBalanceTokens}
          />
        </>
      ))}
    </div>
  );
}

type TokenListForChainProps = {
  chain: MultichainNetwork;
  onTokenClick: (arg: string) => void;
  tokenSortConfig: any;
  selectedAccount: any;
  conversionRate: number;
  contractExchangeRates: any;
  shouldHideZeroBalanceTokens: boolean;
};

function TokenListForChain({
  chain,
  onTokenClick,
  tokenSortConfig,
  selectedAccount,
  conversionRate,
  contractExchangeRates,
  shouldHideZeroBalanceTokens,
}: TokenListForChainProps) {
  const { chainId } = chain;
  const t = useI18nContext();
  const nativeTokenWithBalance = useNativeTokenBalanceForChain(chain);
  const { tokensWithBalances, loading } = useAccountTotalFiatBalanceByChainId(
    selectedAccount,
    shouldHideZeroBalanceTokens,
    caipChainIdToHex(chainId),
  ) as {
    tokensWithBalances: TokenWithBalance[];
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    mergedRates: any;
    loading: boolean;
  };

  const sortedTokens = useMemo(() => {
    return sortAssets(
      [nativeTokenWithBalance, ...tokensWithBalances],
      tokenSortConfig,
    );
  }, [
    tokensWithBalances,
    tokenSortConfig,
    conversionRate,
    contractExchangeRates,
    nativeTokenWithBalance,
  ]);

  return loading ? (
    <Box
      display={Display.Flex}
      alignItems={AlignItems.center}
      justifyContent={JustifyContent.center}
      padding={7}
      data-testid="token-list-loading-message"
    >
      {t('loadingTokens')}
    </Box>
  ) : (
    <div>
      {sortedTokens.map((tokenData) => {
        return (
          <TokenCell
            key={`${chainId}-${tokenData.symbol}-${tokenData.address}`}
            {...tokenData}
            onClick={onTokenClick}
            chain={chain}
          />
        );
      })}
    </div>
  );
}
