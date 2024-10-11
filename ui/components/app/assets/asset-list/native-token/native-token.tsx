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
  const nativeCurrency = useSelector(getMultichainNativeCurrency);
  const isMainnet = useSelector(getMultichainIsMainnet);
  const { ticker, type, rpcUrl } = useSelector(getMultichainCurrentNetwork);
  const isOriginalNativeSymbol = useIsOriginalNativeTokenSymbol(
    chain.network.chainId,
    ticker,
    type,
    rpcUrl,
  );
  const balance = useSelector(getMultichainSelectedAccountCachedBalance);
  console.log('balancin', { balance });
  const balanceIsLoading = !balance;

  const { string, symbol, secondary } = useNativeTokenBalance(
    chain.network.chainId,
  );

  const primaryTokenImage = useSelector(getMultichainCurrencyImage);

  const isEvm = useSelector(getMultichainIsEvm);

  let isStakeable = isMainnet && isEvm;
  ///: BEGIN:ONLY_INCLUDE_IF(build-mmi)
  isStakeable = false;
  ///: END:ONLY_INCLUDE_IF

  return (
    <TokenListItem
      chain={chain}
      onClick={() => onClickAsset(nativeCurrency)}
      title={nativeCurrency}
      primary={string}
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

export default NativeToken;
