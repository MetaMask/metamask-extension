import React from 'react';
import { useSelector } from 'react-redux';
import NetworkAccountBalanceHeader from '../components/app/network-account-balance-header/network-account-balance-header';
import {
  getAccountByAddress,
  getNetworkNameFromProviderType,
} from '../helpers/utils/util';
import {
  getNativeCurrency,
  getProviderConfig,
} from '../ducks/metamask/metamask';
import {
  accountsWithSendEtherInfoSelector,
  conversionRateSelector,
  getCurrentChainId,
  getCurrentCurrency,
  getPreferences,
} from '../selectors';
import { EtherDenomination } from '../../shared/constants/common';
import { Numeric } from '../../shared/modules/Numeric';
import { formatCurrency } from '../helpers/utils/confirm-tx.util';
import { getValueFromWeiHex } from '../../shared/modules/conversion.utils';
import { useI18nContext } from './useI18nContext';

export const useSignatureReqHeaderData = (txData = {}) => {
  const t = useI18nContext();
  const {
    msgParams: { from },
  } = txData;
  const allAccounts = useSelector(accountsWithSendEtherInfoSelector);
  const fromAccount = getAccountByAddress(allAccounts, from);
  const nativeCurrency = useSelector(getNativeCurrency);
  const currentCurrency = useSelector(getCurrentCurrency);
  const currentChainId = useSelector(getCurrentChainId);

  const providerConfig = useSelector(getProviderConfig);
  const networkName = getNetworkNameFromProviderType(providerConfig.type);
  const currentNetwork =
    networkName === ''
      ? providerConfig.nickname || t('unknownNetwork')
      : t(networkName);

  const { useNativeCurrencyAsPrimaryCurrency } = useSelector(getPreferences);
  const conversionRateFromSelector = useSelector(conversionRateSelector);
  const conversionRate = useNativeCurrencyAsPrimaryCurrency
    ? null
    : conversionRateFromSelector;

  const balanceInBaseAsset = conversionRate
    ? formatCurrency(
        getValueFromWeiHex({
          value: fromAccount.balance,
          fromCurrency: nativeCurrency,
          toCurrency: currentCurrency,
          conversionRate,
          numberOfDecimals: 6,
          toDenomination: EtherDenomination.ETH,
        }),
        currentCurrency,
      )
    : new Numeric(fromAccount.balance, 16, EtherDenomination.WEI)
        .toDenomination(EtherDenomination.ETH)
        .round(6)
        .toBase(10)
        .toString();

  return (
    <NetworkAccountBalanceHeader
      networkName={currentNetwork}
      accountName={fromAccount.name}
      accountBalance={balanceInBaseAsset}
      tokenName={
        conversionRate ? currentCurrency?.toUpperCase() : nativeCurrency
      }
      accountAddress={fromAccount.address}
      chainId={currentChainId}
    />
  );
};
