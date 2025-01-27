import React from 'react';
import { useSelector } from 'react-redux';
import {
  getMultichainNativeCurrency,
  getMultichainCurrencyImage,
  getMultichainIsMainnet,
} from '../../../../../selectors/multichain';
import { getMultichainCurrentNetwork } from '../../../../../selectors/multichain-currentnetwork';
import { getMultichainIsEvm } from '../../../../../selectors/multichain-isevm';
import { getMultichainSelectedAccountCachedBalance } from '../../../../../selectors/multichain-selected-account-cached-balance';
import { getPreferences } from '../../../../../selectors';
import { TokenListItem } from '../../../../multichain';
import { AssetListProps } from '../asset-list';
import { useNativeTokenBalance } from './use-native-token-balance';

const NativeToken = ({ onClickAsset }: AssetListProps) => {
  const nativeCurrency = useSelector(getMultichainNativeCurrency);
  const isMainnet = useSelector(getMultichainIsMainnet);
  const { chainId } = useSelector(getMultichainCurrentNetwork);
  const { privacyMode } = useSelector(getPreferences);
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
      chainId={chainId}
      onClick={() => onClickAsset(chainId, nativeCurrency)}
      title={nativeCurrency}
      primary={string}
      tokenSymbol={symbol}
      secondary={secondary}
      tokenImage={balanceIsLoading ? null : primaryTokenImage}
      isNativeCurrency
      isStakeable={isStakeable}
      showPercentage
      privacyMode={privacyMode}
    />
  );
};

export default NativeToken;
