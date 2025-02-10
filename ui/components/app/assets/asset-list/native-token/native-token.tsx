import React from 'react';
import { useSelector } from 'react-redux';
import { Hex } from '@metamask/utils';
import {
  getMultichainCurrentNetwork,
  getMultichainNativeCurrency,
  getMultichainIsEvm,
  getMultichainCurrencyImage,
  getMultichainIsMainnet,
  getMultichainSelectedAccountCachedBalance,
} from '../../../../../selectors/multichain';
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

  const isStakeable = isMainnet && isEvm;

  return (
    <TokenListItem
      token={{
        address: '' as Hex,
        chainId: chainId as Hex,
        isNative: true,
        decimals: 18,
        symbol,
        image: balanceIsLoading ? null : primaryTokenImage,
        // token display info
        title: nativeCurrency,
        primary: string,
        secondary,
        isStakeable,
      }}
      onClick={() => onClickAsset(chainId, nativeCurrency)}
      showPercentage
      privacyMode={privacyMode}
    />
  );
};

export default NativeToken;
