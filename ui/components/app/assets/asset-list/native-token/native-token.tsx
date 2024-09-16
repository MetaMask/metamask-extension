import React from 'react';
import { useSelector } from 'react-redux';
import { PRIMARY, SECONDARY } from '../../../../../helpers/constants/common';
import { useUserPreferencedCurrency } from '../../../../../hooks/useUserPreferencedCurrency';
import { getPreferences } from '../../../../../selectors';
import {
  getMultichainCurrentNetwork,
  getMultichainNativeCurrency,
  getMultichainIsEvm,
  getMultichainShouldShowFiat,
  getMultichainCurrencyImage,
  getMultichainIsMainnet,
  getMultichainSelectedAccountCachedBalance,
} from '../../../../../selectors/multichain';
import { useCurrencyDisplay } from '../../../../../hooks/useCurrencyDisplay';
import { TokenListItem } from '../../../../multichain';
import { useIsOriginalNativeTokenSymbol } from '../../../../../hooks/useIsOriginalNativeTokenSymbol';
import {
  showPrimaryCurrency,
  showSecondaryCurrency,
} from '../../../../../../shared/modules/currency-display.utils';
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
