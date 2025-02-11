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
// import { TokenListItem } from '../../../../multichain';
import { AssetListProps } from '../asset-list';
import useTokenDisplayInfo from '../../hooks/useTokenDisplayInfo';
import { TokenCellListItem } from '../../token-cell/token-cell-list-item';
import { useNativeTokenBalance } from './use-native-token-balance';

const NativeToken = ({ onClickAsset }: AssetListProps) => {
  const nativeCurrency = useSelector(getMultichainNativeCurrency);
  const isMainnet = useSelector(getMultichainIsMainnet);
  const { chainId } = useSelector(getMultichainCurrentNetwork);
  const { privacyMode } = useSelector(getPreferences);
  const balance = useSelector(getMultichainSelectedAccountCachedBalance);
  const balanceIsLoading = !balance;

  const token = useNativeTokenBalance();
  const tokenDisplayInfo = useTokenDisplayInfo({ token });

  // const primaryTokenImage = useSelector(getMultichainCurrencyImage);

  const isEvm = useSelector(getMultichainIsEvm);

  const isStakeable = isMainnet && isEvm;

  return (
    <TokenCellListItem token={{ ...token, ...tokenDisplayInfo, isStakeable }} />
  );
};

export default NativeToken;
