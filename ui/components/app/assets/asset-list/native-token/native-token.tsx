import React from 'react';
import { useSelector } from 'react-redux';
import {
  getMultichainNativeCurrency,
  getMultichainIsEvm,
  getMultichainIsMainnet,
} from '../../../../../selectors/multichain';
import { AssetListProps } from '../asset-list';
import useTokenDisplayInfo from '../../hooks/useTokenDisplayInfo';
import { TokenCellListItem } from '../../token-cell/token-cell-list-item';
import { useNativeTokenBalance } from './use-native-token-balance';

const NativeToken = ({ onClickAsset }: AssetListProps) => {
  const isMainnet = useSelector(getMultichainIsMainnet);
  const nativeCurrency = useSelector(getMultichainNativeCurrency);

  const token = useNativeTokenBalance();
  const tokenDisplayInfo = useTokenDisplayInfo({ token });

  const isEvm = useSelector(getMultichainIsEvm);

  const isStakeable = isMainnet && isEvm;

  return (
    <TokenCellListItem
      token={{
        ...token,
        ...tokenDisplayInfo,
        secondary: token.secondary,
        isStakeable,
      }}
      onClick={() => onClickAsset(token.chainId, nativeCurrency)}
    />
  );
};

export default NativeToken;
