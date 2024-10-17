import React from 'react';
import { useSelector } from 'react-redux';
import {
  MultichainNetwork,
  getMultichainCurrentNetwork,
  getMultichainNativeCurrency,
  getMultichainIsEvm,
  getMultichainCurrencyImage,
  getMultichainIsMainnet,
  getMultichainSelectedAccountCachedBalance,
  getMultichainSelectedAccountCachedBalanceAllChains,
} from '../../../../../selectors/multichain';
import { TokenListItem } from '../../../../multichain';
import { useIsOriginalNativeTokenSymbol } from '../../../../../hooks/useIsOriginalNativeTokenSymbol';
import { useNativeTokenBalance } from './use-native-token-balance';

export type NativeTokenProps = {
  onClickAsset: (arg: string) => void;
  showTokensLinks?: boolean;
  chain: MultichainNetwork;
};

const NativeToken = ({ onClickAsset, chain }: NativeTokenProps) => {
  const { ticker } = chain.network;
  const isMainnet = useSelector(getMultichainIsMainnet);
  const { type, rpcUrl } = useSelector(getMultichainCurrentNetwork);
  const isOriginalNativeSymbol = useIsOriginalNativeTokenSymbol(
    chain.chainId,
    ticker,
    type,
    rpcUrl,
  );
  const balance = useSelector(getMultichainSelectedAccountCachedBalance);
  const balanceAll = useSelector(
    getMultichainSelectedAccountCachedBalanceAllChains,
  );
  const balanceIsLoading = !balance;

  const balb = useNativeTokenBalance(chain.network.chainId);
  console.log({ balance, balb });

  const primaryTokenImage = useSelector(getMultichainCurrencyImage);

  const isEvm = useSelector(getMultichainIsEvm);

  console.log({ balanceAll, chain, balance });

  if (!balb) {
    return null;
  }

  let isStakeable = isMainnet && isEvm;
  ///: BEGIN:ONLY_INCLUDE_IF(build-mmi)
  isStakeable = false;
  ///: END:ONLY_INCLUDE_IF

  return (
    <TokenListItem
      chain={chain}
      onClick={() => onClickAsset(ticker)}
      title={ticker}
      primary={balb.string}
      tokenSymbol={balb.symbol}
      secondary={balb.secondary}
      tokenImage={balanceIsLoading ? null : primaryTokenImage}
      isOriginalTokenSymbol={isOriginalNativeSymbol}
      isNativeCurrency
      isStakeable={isStakeable}
      showPercentage
    />
  );
};

export default NativeToken;
