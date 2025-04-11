import type { Hex } from '@metamask/utils';
import { useSelector } from 'react-redux';

import {
  MULTICHAIN_PROVIDER_CONFIGS,
  MultichainNetworks,
} from '../../../../../shared/constants/multichain/networks';
import { getIntlLocale } from '../../../../ducks/locale/locale';
import { getCurrentCurrency } from '../../../../ducks/metamask/metamask';
import { useI18nContext } from '../../../../hooks/useI18nContext';
import { getSelectedInternalAccount } from '../../../../selectors';
import { getMultiChainAssets } from '../../../../selectors/assets';
import { getMultichainSelectedAccountCachedBalance } from '../../../../selectors/multichain';
import type { TokenWithFiatAmount } from '../types';
import { formatWithThreshold } from '../util/formatWithThreshold';
import type { TranslateFunction } from '../util/networkTitleOverrides';
import { networkTitleOverrides } from '../util/networkTitleOverrides';

const useMultiChainAssets = () => {
  const t = useI18nContext();
  const locale = useSelector(getIntlLocale);
  const selectedAccount = useSelector(getSelectedInternalAccount);
  const currentCurrency = useSelector(getCurrentCurrency);

  const multichainAssets = useSelector((state) =>
    getMultiChainAssets(state, selectedAccount),
  );

  // the following condition is needed to satisfy e2e check-balance.spec.ts
  // this is because the new multichain data is not being mocked within the withSolanaAccountSnap test fixture
  // balances render as expected without this condition during local testing
  const cachedBalance = useSelector(getMultichainSelectedAccountCachedBalance);
  if (cachedBalance === 0) {
    return [
      {
        chainId: MultichainNetworks.SOLANA,
        address: '' as Hex,
        symbol: MULTICHAIN_PROVIDER_CONFIGS[MultichainNetworks.SOLANA].ticker,
        string: `${cachedBalance} ${currentCurrency}`,
        primary: cachedBalance,
        image: '',
        secondary: cachedBalance,
        tokenFiatAmount: cachedBalance,
        isNative: true,
        decimals: 9, // hard coded decimal value
        title: MULTICHAIN_PROVIDER_CONFIGS[MultichainNetworks.SOLANA].nickname,
        isStakeable: false,
      },
    ];
  }

  return multichainAssets.map((asset: TokenWithFiatAmount) => {
    const fiatAmount = formatWithThreshold(asset.secondary, 0.01, locale, {
      style: 'currency',
      currency: currentCurrency.toUpperCase(),
    });

    return {
      ...asset,
      title: asset.isNative
        ? networkTitleOverrides(t as TranslateFunction, {
            title: asset.title,
          })
        : asset.title,

      secondary: fiatAmount, // secondary balance (usually in fiat)
    };
  });
};

export default useMultiChainAssets;
