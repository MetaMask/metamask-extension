import React from 'react';
import 'chartjs-adapter-moment';
import { useSelector } from 'react-redux';
import {
  getNativeCurrencyImage,
  getSelectedAccountCachedBalance,
} from '../../../selectors';
import { useCurrencyDisplay } from '../../../hooks/useCurrencyDisplay';
import { getNativeCurrency } from '../../../ducks/metamask/metamask';
import { AssetType } from '../../../../shared/constants/transaction';
import AssetV2 from './asset-v2';

const NativeAssetV2 = () => {
  const nativeCurrency = useSelector(getNativeCurrency);
  const image = useSelector(getNativeCurrencyImage);
  const balance = useSelector(getSelectedAccountCachedBalance);
  const displayBalance = useCurrencyDisplay(balance, {
    currency: nativeCurrency,
  });

  return (
    <AssetV2
      asset={{
        type: AssetType.native,
        symbol: nativeCurrency,
        image,
        balance: displayBalance[1].value,
        fiatValue: 'todo'
      }}
    />
  );
};

export default NativeAssetV2;
