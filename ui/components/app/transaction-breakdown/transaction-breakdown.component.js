import React, { PureComponent } from 'react';
import PropTypes from 'prop-types';
import classnames from 'classnames';
import CurrencyDisplay from '../../ui/currency-display';
import UserPreferencedCurrencyDisplay from '../user-preferenced-currency-display';
import HexToDecimal from '../../ui/hex-to-decimal';
import { PRIMARY, SECONDARY } from '../../../helpers/constants/common';
import { EtherDenomination } from '../../../../shared/constants/common';
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
    maxFeePerGas: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    gasUsed: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    totalInHex: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    baseFee: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    priorityFee: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    hexGasTotal: PropTypes.string,
    isEIP1559Transaction: PropTypes.bool,
    isMultiLayerFeeNetwork: PropTypes.bool,
    l1HexGasTotal: PropTypes.string,
  };

  static defaultProps = {
    showFiat: true,
  };

  render() {
    const { t } = this.context;
    const {
      gas,
      gasPrice,
      maxFeePerGas,
      primaryCurrency,
      className,
      nonce,
      nativeCurrency,
      showFiat,
      totalInHex,
      gasUsed,
      isTokenApprove,
      baseFee,
      priorityFee,
      hexGasTotal,
      isEIP1559Transaction,
      isMultiLayerFeeNetwork,
      l1HexGasTotal,
    } = this.props;
    return (
      <div className={classnames('transaction-breakdown', className)}>
        <div className="transaction-breakdown__title">{t('transaction')}</div>
        <TransactionBreakdownRow divider title={t('nonce')}>
          {typeof nonce === 'undefined' ? null : (
            <HexToDecimal
              className="transaction-breakdown__value"
              value={nonce}
            />
          )}
        </TransactionBreakdownRow>
        <TransactionBreakdownRow
          title={isTokenApprove ? t('spendingCap') : t('amount')}
        >
          <span
            className="transaction-breakdown__value transaction-breakdown__value--amount"
            data-testid="transaction-breakdown-value-amount"
          >
            {primaryCurrency}
          </span>
        </TransactionBreakdownRow>
        <TransactionBreakdownRow
          title={
            isMultiLayerFeeNetwork
              ? t('transactionHistoryL2GasLimitLabel')
              : `${t('gasLimit')} (${t('units')})`
          }
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
        {isEIP1559Transaction && typeof baseFee !== 'undefined' ? (
          <TransactionBreakdownRow title={t('transactionHistoryBaseFee')}>
            <CurrencyDisplay
              className="transaction-breakdown__value"
              data-testid="transaction-breakdown__base-fee"
              currency={nativeCurrency}
              denomination={EtherDenomination.GWEI}
              value={baseFee}
              numberOfDecimals={10}
              hideLabel
            />
          </TransactionBreakdownRow>
        ) : null}
        {isEIP1559Transaction && typeof priorityFee !== 'undefined' ? (
          <TransactionBreakdownRow title={t('transactionHistoryPriorityFee')}>
            <CurrencyDisplay
              className="transaction-breakdown__value"
              data-testid="transaction-breakdown__priority-fee"
              currency={nativeCurrency}
              denomination={EtherDenomination.GWEI}
              value={priorityFee}
              numberOfDecimals={10}
              hideLabel
            />
          </TransactionBreakdownRow>
        ) : null}
        {!isEIP1559Transaction && (
          <TransactionBreakdownRow
            title={
              isMultiLayerFeeNetwork
                ? t('transactionHistoryL2GasPriceLabel')
                : t('advancedGasPriceTitle')
            }
          >
            {typeof gasPrice === 'undefined' ? (
              '?'
            ) : (
              <CurrencyDisplay
                className="transaction-breakdown__value"
                data-testid="transaction-breakdown__gas-price"
                currency={nativeCurrency}
                denomination={EtherDenomination.GWEI}
                value={gasPrice}
                numberOfDecimals={9}
                hideLabel
              />
            )}
          </TransactionBreakdownRow>
        )}
        {isEIP1559Transaction && (
          <TransactionBreakdownRow title={t('transactionHistoryTotalGasFee')}>
            <UserPreferencedCurrencyDisplay
              className="transaction-breakdown__value"
              data-testid="transaction-breakdown__effective-gas-price"
              currency={nativeCurrency}
              denomination={EtherDenomination.ETH}
              numberOfDecimals={6}
              value={hexGasTotal}
              type={PRIMARY}
            />
            {showFiat && (
              <UserPreferencedCurrencyDisplay
                className="transaction-breakdown__value"
                type={SECONDARY}
                value={hexGasTotal}
              />
            )}
          </TransactionBreakdownRow>
        )}
        {isEIP1559Transaction && (
          <TransactionBreakdownRow
            divider
            title={t('transactionHistoryMaxFeePerGas')}
          >
            <UserPreferencedCurrencyDisplay
              className="transaction-breakdown__value"
              currency={nativeCurrency}
              denomination={EtherDenomination.ETH}
              numberOfDecimals={9}
              value={maxFeePerGas}
              type={PRIMARY}
            />
            {showFiat && (
              <UserPreferencedCurrencyDisplay
                className="transaction-breakdown__value"
                type={SECONDARY}
                value={maxFeePerGas}
              />
            )}
          </TransactionBreakdownRow>
        )}
        {isMultiLayerFeeNetwork && (
          <TransactionBreakdownRow title={t('transactionHistoryL1GasLabel')}>
            <UserPreferencedCurrencyDisplay
              className="transaction-breakdown__value"
              data-testid="transaction-breakdown__l1-gas-total"
              numberOfDecimals={18}
              value={l1HexGasTotal}
              type={PRIMARY}
            />
            {showFiat && (
              <UserPreferencedCurrencyDisplay
                className="transaction-breakdown__value"
                type={SECONDARY}
                value={l1HexGasTotal}
              />
            )}
          </TransactionBreakdownRow>
        )}
        <TransactionBreakdownRow title={t('total')}>
          <UserPreferencedCurrencyDisplay
            className="transaction-breakdown__value transaction-breakdown__value--eth-total"
            type={PRIMARY}
            value={totalInHex}
            numberOfDecimals={isMultiLayerFeeNetwork ? 18 : null}
          />
          {showFiat && (
            <UserPreferencedCurrencyDisplay
              className="transaction-breakdown__value"
              type={SECONDARY}
              value={totalInHex}
            />
          )}
        </TransactionBreakdownRow>
      </div>
    );
  }
}
