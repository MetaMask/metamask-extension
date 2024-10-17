import React from 'react';
import { useSelector } from 'react-redux';
import {
  getMultichainCurrentNetwork,
  getMultichainNativeCurrency,
  getMultichainIsEvm,
  getMultichainCurrencyImage,
  getMultichainIsMainnet,
  getMultichainSelectedAccountCachedBalance,
} from '../../../../../selectors/multichain';
import { TokenListItem } from '../../../../multichain';
import { useIsOriginalNativeTokenSymbol } from '../../../../../hooks/useIsOriginalNativeTokenSymbol';
import { AssetListProps } from '../asset-list';
import { useNativeTokenBalance } from './use-native-token-balance';
// import { getPreferences } from '../../../../../selectors';

const NativeToken = ({ onClickAsset }: AssetListProps) => {
  const nativeCurrency = useSelector(getMultichainNativeCurrency);
  const isMainnet = useSelector(getMultichainIsMainnet);
  const { chainId, ticker, type, rpcUrl } = useSelector(
    getMultichainCurrentNetwork,
  );
  const isOriginalNativeSymbol = useIsOriginalNativeTokenSymbol(
    chainId,
    ticker,
    type,
    rpcUrl,
  );
  const balance = useSelector(getMultichainSelectedAccountCachedBalance);
  const balanceIsLoading = !balance;

  const { string, symbol, secondary } = useNativeTokenBalance();

  const primaryTokenImage = useSelector(getMultichainCurrencyImage);

  const isEvm = useSelector(getMultichainIsEvm);

  let isStakeable = isMainnet && isEvm;
  ///: BEGIN:ONLY_INCLUDE_IF(build-mmi)
  isStakeable = false;
  ///: END:ONLY_INCLUDE_IF

  return (
    <TokenListItem
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
      chainId={chainId}
    />
  );
};

export default NativeToken;
