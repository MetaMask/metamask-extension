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
import { useNativeTokenBalance } from './use-native-balance';

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

  const { primaryBalance, secondaryBalance, tokenSymbol } =
    useNativeTokenBalance();

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
      // The primary and secondary currencies are subject to change based on the user's settings
      // TODO: rename this primary/secondary concept here to be more intuitive, regardless of setting
      primary={primaryBalance}
      tokenSymbol={tokenSymbol}
      secondary={secondaryBalance}
      tokenImage={balanceIsLoading ? null : primaryTokenImage}
      isOriginalTokenSymbol={isOriginalNativeSymbol}
      isNativeCurrency
      isStakeable={isStakeable}
      showPercentage
    />
  );
};

export default NativeToken;
