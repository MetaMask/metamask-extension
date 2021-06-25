import React, { PureComponent } from 'react';
import PropTypes from 'prop-types';
import classnames from 'classnames';
import CurrencyDisplay from '../../ui/currency-display';
import UserPreferencedCurrencyDisplay from '../user-preferenced-currency-display';
import HexToDecimal from '../../ui/hex-to-decimal';
import { GWEI, PRIMARY, SECONDARY } from '../../../helpers/constants/common';
import TransactionBreakdownRow from './transaction-breakdown-row';

export default class TransactionBreakdown extends PureComponent {
  static contextTypes = {
    t: PropTypes.func,
  };

  static propTypes = {
    className: PropTypes.string,
    nativeCurrency: PropTypes.string,
    showFiat: PropTypes.bool,
    nonce: PropTypes.string,
    primaryCurrency: PropTypes.string,
    isTokenApprove: PropTypes.bool,
    gas: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    gasPrice: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    gasUsed: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    totalInHex: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  };

  static defaultProps = {
    showFiat: true,
  };

  render() {
    const { t } = this.context;
    const {
      gas,
      gasPrice,
      primaryCurrency,
      className,
      nonce,
      nativeCurrency,
      showFiat,
      totalInHex,
      gasUsed,
      isTokenApprove,
    } = this.props;
    return (
      <div className={classnames('transaction-breakdown', className)}>
        <div className="transaction-breakdown__title">{t('transaction')}</div>
        <TransactionBreakdownRow title={t('nonce')}>
          {typeof nonce === 'undefined' ? null : (
            <HexToDecimal
              className="transaction-breakdown__value"
              value={nonce}
            />
          )}
        </TransactionBreakdownRow>
        <TransactionBreakdownRow
          title={isTokenApprove ? t('spendLimitAmount') : t('amount')}
        >
          <span className="transaction-breakdown__value">
            {primaryCurrency}
          </span>
        </TransactionBreakdownRow>
        <TransactionBreakdownRow
          title={`${t('gasLimit')} (${t('units')})`}
          className="transaction-breakdown__row-title"
        >
          {typeof gas === 'undefined' ? (
            '?'
          ) : (
            <HexToDecimal
              className="transaction-breakdown__value"
              value={gas}
            />
          )}
        </TransactionBreakdownRow>
        {typeof gasUsed === 'string' && (
          <TransactionBreakdownRow
            title={`${t('gasUsed')} (${t('units')})`}
            className="transaction-breakdown__row-title"
          >
            <HexToDecimal
              className="transaction-breakdown__value"
              value={gasUsed}
            />
          </TransactionBreakdownRow>
        )}
        <TransactionBreakdownRow title={t('gasPrice')}>
          {typeof gasPrice === 'undefined' ? (
            '?'
          ) : (
            <CurrencyDisplay
              className="transaction-breakdown__value"
              data-testid="transaction-breakdown__gas-price"
              currency={nativeCurrency}
              denomination={GWEI}
              value={gasPrice}
              hideLabel
            />
          )}
        </TransactionBreakdownRow>
        <TransactionBreakdownRow title={t('total')}>
          <div>
            <UserPreferencedCurrencyDisplay
              className="transaction-breakdown__value transaction-breakdown__value--eth-total"
              type={PRIMARY}
              value={totalInHex}
            />
            {showFiat && (
              <UserPreferencedCurrencyDisplay
                className="transaction-breakdown__value"
                type={SECONDARY}
                value={totalInHex}
              />
            )}
          </div>
        </TransactionBreakdownRow>
      </div>
    );
  }
}
