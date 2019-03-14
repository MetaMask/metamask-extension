import React, { PureComponent } from 'react'
import PropTypes from 'prop-types'
import classnames from 'classnames'
import TransactionBreakdownRow from './transaction-breakdown-row'
import CurrencyDisplay from '../../ui/currency-display'
import UserPreferencedCurrencyDisplay from '../user-preferenced-currency-display'
import HexToDecimal from '../../ui/hex-to-decimal'
import { GWEI, PRIMARY, SECONDARY } from '../../../helpers/constants/common'

export default class TransactionBreakdown extends PureComponent {
  static contextTypes = {
    t: PropTypes.func,
  }

  static propTypes = {
    transaction: PropTypes.object,
    className: PropTypes.string,
    nativeCurrency: PropTypes.string.isRequired,
    showFiat: PropTypes.bool,
    gas: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    gasPrice: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    gasUsed: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    totalInHex: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  }

  static defaultProps = {
    transaction: {},
    showFiat: true,
  }

  render () {
    const { t } = this.context
    const { gas, gasPrice, value, className, nativeCurrency, showFiat, totalInHex, gasUsed } = this.props

    return (
      <div className={classnames('transaction-breakdown', className)}>
        <div className="transaction-breakdown__title">
          { t('transaction') }
        </div>
        <TransactionBreakdownRow title={t('amount')}>
          <UserPreferencedCurrencyDisplay
            className="transaction-breakdown__value"
            type={PRIMARY}
            value={value}
          />
        </TransactionBreakdownRow>
        <TransactionBreakdownRow
          title={`${t('gasLimit')} (${t('units')})`}
          className="transaction-breakdown__row-title"
        >
          {typeof gas !== 'undefined'
            ? <HexToDecimal
              className="transaction-breakdown__value"
              value={gas}
            />
            : '?'
          }
        </TransactionBreakdownRow>
        {
          typeof gasUsed === 'string' && (
            <TransactionBreakdownRow
              title={`${t('gasUsed')} (${t('units')})`}
              className="transaction-breakdown__row-title"
            >
              <HexToDecimal
                className="transaction-breakdown__value"
                value={gasUsed}
              />
            </TransactionBreakdownRow>
          )
        }
        <TransactionBreakdownRow title={t('gasPrice')}>
          {typeof gasPrice !== 'undefined'
            ? <CurrencyDisplay
              className="transaction-breakdown__value"
              currency={nativeCurrency}
              denomination={GWEI}
              value={gasPrice}
              hideLabel
            />
            : '?'
          }
        </TransactionBreakdownRow>
        <TransactionBreakdownRow title={t('total')}>
          <div>
            <UserPreferencedCurrencyDisplay
              className="transaction-breakdown__value transaction-breakdown__value--eth-total"
              type={PRIMARY}
              value={totalInHex}
            />
            {
              showFiat && (
                <UserPreferencedCurrencyDisplay
                  className="transaction-breakdown__value"
                  type={SECONDARY}
                  value={totalInHex}
                />
              )
            }
          </div>
        </TransactionBreakdownRow>
      </div>
    )
  }
}
