// NativeTokens.tsx
import React from 'react';
import { useSelector } from 'react-redux';
import {
  MultichainNetwork,
  getChains,
  getMultichainSelectedAccountCachedBalanceAllChains,
  getMultichainCurrencyImageByChainId,
} from '../../../../../selectors/multichain';
import { TokenListItem } from '../../../../multichain';
import { useIsOriginalNativeTokenSymbol } from '../../../../../hooks/useIsOriginalNativeTokenSymbol';
import { useNativeTokenBalanceForChain } from './use-native-token-balance';

export type NativeTokenProps = {
  onClickAsset: (arg: string) => void;
  showTokensLinks?: boolean;
  chain: MultichainNetwork;
};

const NativeToken = ({ onClickAsset, chain }: NativeTokenProps) => {
  const {
    chainId,
    network: { ticker, type, rpcUrl },
  } = chain;

  const isOriginalNativeSymbol = useIsOriginalNativeTokenSymbol(
    chainId,
    ticker,
    type,
    rpcUrl,
  );

  const {
    string: primaryBalance,
    symbol,
    secondary,
  } = useNativeTokenBalanceForChain(chain);

  const primaryTokenImage = useSelector((state) =>
    getMultichainCurrencyImageByChainId(state, chainId),
  );

  console.log('balance?', { primaryBalance, symbol, secondary });

  const balanceIsLoading = primaryBalance === undefined;

  let isStakeable = false; //isMainnet && isEvm;
  ///: BEGIN:ONLY_INCLUDE_IF(build-mmi)
  // isStakeable = false;
  ///: END:ONLY_INCLUDE_IF

  return (
    <TokenListItem
      chain={chain}
      onClick={() => onClickAsset(ticker)}
      title={ticker}
      primary={primaryBalance}
      tokenSymbol={symbol}
      secondary={secondary}
      tokenImage={balanceIsLoading ? null : primaryTokenImage}
      isOriginalTokenSymbol={isOriginalNativeSymbol}
      isNativeCurrency
      isStakeable={isStakeable}
      showPercentage
    />
  );
};

export type NativeTokensProps = {
  onClickAsset: (arg: string) => void;
  showTokensLinks?: boolean;
};

const NativeTokens = ({ onClickAsset, showTokensLinks }: NativeTokensProps) => {
  const allChainBalances = useSelector(
    getMultichainSelectedAccountCachedBalanceAllChains,
  );

  const chains = useSelector(getChains);

  if (!allChainBalances || !chains) {
    // Handle loading state
    return null;
  }

  const chainIds = Object.keys(allChainBalances);

  return (
    <>
      {chainIds.map((chainId) => {
        const chain = chains.find(
          (_chain) => _chain.network.chainId === chainId,
        );

        console.log({ chain });

        if (!chain) {
          return null;
        }

        return (
          <NativeToken
            key={chainId}
            onClickAsset={onClickAsset}
            showTokensLinks={showTokensLinks}
            chain={chain}
          />
        );
      })}
    </>
  );
};

export default NativeTokens;
