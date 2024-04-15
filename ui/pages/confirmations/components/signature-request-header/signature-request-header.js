import React from 'react';
import PropTypes from 'prop-types';
import { useSelector } from 'react-redux';
import { useI18nContext } from '../../../../hooks/useI18nContext';

import {
  getNativeCurrency,
  getProviderConfig,
} from '../../../../ducks/metamask/metamask';
import {
  accountsWithSendEtherInfoSelector,
  conversionRateSelector,
  getCurrentChainId,
  getCurrentCurrency,
  getPreferences,
} from '../../../../selectors';
import { formatCurrency } from '../../../../helpers/utils/confirm-tx.util';
import {
  getAccountByAddress,
  getNetworkNameFromProviderType,
} from '../../../../helpers/utils/util';
import { EtherDenomination } from '../../../../../shared/constants/common';
import { getValueFromWeiHex } from '../../../../../shared/modules/conversion.utils';
import { Numeric } from '../../../../../shared/modules/Numeric';

import NetworkAccountBalanceHeader from '../../../../components/app/network-account-balance-header';

const SignatureRequestHeader = ({ txData }) => {
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
  const { useNativeCurrencyAsPrimaryCurrency } = useSelector(getPreferences);
  const conversionRateFromSelector = useSelector(conversionRateSelector);
  const conversionRate = useNativeCurrencyAsPrimaryCurrency
    ? null
    : conversionRateFromSelector;

  const currentNetwork =
    networkName === ''
      ? providerConfig.nickname || t('unknownNetwork')
      : t(networkName);

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
      accountName={fromAccount.metadata.name}
      accountBalance={balanceInBaseAsset}
      tokenName={
        conversionRate ? currentCurrency?.toUpperCase() : nativeCurrency
      }
      accountAddress={fromAccount.address}
      chainId={currentChainId}
    />
  );
};

SignatureRequestHeader.propTypes = {
  /**
   * The display content of transaction data
   */
  txData: PropTypes.object.isRequired,
};

export default SignatureRequestHeader;
