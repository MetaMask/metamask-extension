import React, { useContext, useMemo } from 'react';
import PropTypes from 'prop-types';
import BigNumber from 'bignumber.js';
import { useSelector } from 'react-redux';
import { I18nContext } from '../../contexts/i18n';
import ConfirmTransactionBase from '../confirm-transaction-base';
import UserPreferencedCurrencyDisplay from '../../components/app/user-preferenced-currency-display';
import {
  formatCurrency,
  convertTokenToFiat,
  addFiat,
  roundExponential,
} from '../../helpers/utils/confirm-tx.util';
import { ETH, PRIMARY } from '../../helpers/constants/common';
import {
  contractExchangeRateSelector,
  getCurrentCurrency,
} from '../../selectors';
import {
  getConversionRate,
  getNativeCurrency,
} from '../../ducks/metamask/metamask';
import { TokenStandard } from '../../../shared/constants/transaction';
import {
  getWeiHexFromDecimalValue,
  hexWEIToDecETH,
} from '../../../shared/modules/conversion.utils';

export default function ConfirmTokenTransactionBase({
  image = '',
  assetName,
  toAddress,
  tokenAddress,
  tokenAmount = '0',
  tokenSymbol,
  tokenId,
  assetStandard,
  onEdit,
  ethTransactionTotal,
  fiatTransactionTotal,
  hexMaximumTransactionFee,
}) {
  const t = useContext(I18nContext);
  const contractExchangeRate = useSelector(contractExchangeRateSelector);
  const nativeCurrency = useSelector(getNativeCurrency);
  const currentCurrency = useSelector(getCurrentCurrency);
  const conversionRate = useSelector(getConversionRate);

  const ethTransactionTotalMaxAmount = Number(
    hexWEIToDecETH(hexMaximumTransactionFee),
  );

  let title, subtitle;
  if (
    assetStandard === TokenStandard.ERC721 ||
    assetStandard === TokenStandard.ERC1155
  ) {
    title = assetName;
    subtitle = `#${tokenId}`;
  } else if (assetStandard === TokenStandard.ERC20) {
    title = `${tokenAmount} ${tokenSymbol}`;
  }

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
  assetName: PropTypes.string,
  toAddress: PropTypes.string,
  tokenAddress: PropTypes.string,
  tokenAmount: PropTypes.string,
  tokenSymbol: PropTypes.string,
  tokenId: PropTypes.string,
  assetStandard: PropTypes.string,
  onEdit: PropTypes.func,
  ethTransactionTotal: PropTypes.string,
  fiatTransactionTotal: PropTypes.string,
  hexMaximumTransactionFee: PropTypes.string,
};
