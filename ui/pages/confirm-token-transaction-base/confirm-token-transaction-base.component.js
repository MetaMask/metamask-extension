import React, { useContext, useMemo } from 'react';
import PropTypes from 'prop-types';
import BigNumber from 'bignumber.js';
import { I18nContext } from '../../contexts/i18n';
import ConfirmTransactionBase from '../confirm-transaction-base';
import UserPreferencedCurrencyDisplay from '../../components/app/user-preferenced-currency-display';
import {
  formatCurrency,
  convertTokenToFiat,
  addFiat,
  roundExponential,
} from '../../helpers/utils/confirm-tx.util';
import { getWeiHexFromDecimalValue } from '../../helpers/utils/conversions.util';
import { ETH, PRIMARY } from '../../helpers/constants/common';

export default function ConfirmTokenTransactionBase({
  image,
  title,
  subtitle,
  toAddress,
  tokenAddress,
  tokenAmount = '0',
  fiatTransactionTotal,
  ethTransactionTotal,
  ethTransactionTotalMaxAmount,
  contractExchangeRate,
  conversionRate,
  currentCurrency,
  nativeCurrency,
  onEdit,
}) {
  const t = useContext(I18nContext);

  const hexWeiValue = useMemo(() => {
    if (tokenAmount === '0' || !contractExchangeRate) {
      return '0';
    }

    const decimalEthValue = new BigNumber(tokenAmount)
      .times(
        new BigNumber(contractExchangeRate ? String(contractExchangeRate) : 0),
      )
      .toFixed();

    return getWeiHexFromDecimalValue({
      value: decimalEthValue,
      fromCurrency: ETH,
      fromDenomination: ETH,
    });
  }, [tokenAmount, contractExchangeRate]);

  const secondaryTotalTextOverride = useMemo(() => {
    if (typeof contractExchangeRate === 'undefined') {
      return formatCurrency(fiatTransactionTotal, currentCurrency);
    }

    const fiatTransactionAmount = convertTokenToFiat({
      value: tokenAmount,
      toCurrency: currentCurrency,
      conversionRate,
      contractExchangeRate,
    });
    const fiatTotal = addFiat(fiatTransactionAmount, fiatTransactionTotal);
    const roundedFiatTotal = roundExponential(fiatTotal);
    return formatCurrency(roundedFiatTotal, currentCurrency);
  }, [
    currentCurrency,
    conversionRate,
    contractExchangeRate,
    fiatTransactionTotal,
    tokenAmount,
  ]);

  const subtitleComponent = () => {
    if (contractExchangeRate === undefined && subtitle === undefined) {
      return <span>{t('noConversionRateAvailable')}</span>;
    }
    if (subtitle) {
      return <span>{subtitle}</span>;
    }
    return (
      <UserPreferencedCurrencyDisplay
        value={hexWeiValue}
        type={PRIMARY}
        showEthLogo
        hideLabel
      />
    );
  };

  return (
    <ConfirmTransactionBase
      toAddress={toAddress}
      image={image}
      onEdit={onEdit}
      tokenAddress={tokenAddress}
      title={title}
      subtitleComponent={subtitleComponent()}
      primaryTotalTextOverride={`${title} + ${ethTransactionTotal} ${nativeCurrency}`}
      primaryTotalTextOverrideMaxAmount={`${title} + ${ethTransactionTotalMaxAmount} ${nativeCurrency}`}
      secondaryTotalTextOverride={secondaryTotalTextOverride}
    />
  );
}

ConfirmTokenTransactionBase.propTypes = {
  image: PropTypes.string,
  title: PropTypes.string,
  subtitle: PropTypes.string,
  tokenAddress: PropTypes.string,
  toAddress: PropTypes.string,
  tokenAmount: PropTypes.string,
  fiatTransactionTotal: PropTypes.string,
  ethTransactionTotal: PropTypes.string,
  contractExchangeRate: PropTypes.number,
  conversionRate: PropTypes.number,
  currentCurrency: PropTypes.string,
  onEdit: PropTypes.func,
  nativeCurrency: PropTypes.string,
  ethTransactionTotalMaxAmount: PropTypes.string,
};
