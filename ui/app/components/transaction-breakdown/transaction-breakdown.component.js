import React, { PureComponent } from 'react'
import PropTypes from 'prop-types'
import classnames from 'classnames'
import TransactionBreakdownRow from './transaction-breakdown-row'
import CurrencyDisplay from '../currency-display'
import UserPreferencedCurrencyDisplay from '../user-preferenced-currency-display'
import HexToDecimal from '../hex-to-decimal'
import { GWEI, PRIMARY, SECONDARY } from '../../constants/common'
import { getHexGasTotal } from '../../helpers/confirm-transaction/util'
import { sumHexes } from '../../helpers/transactions.util'

export default class TransactionBreakdown extends PureComponent {
  static contextTypes = {
    t: PropTypes.func,
  }

  static propTypes = {
    transaction: PropTypes.object,
    className: PropTypes.string,
    nativeCurrency: PropTypes.string.isRequired,
    showFiat: PropTypes.bool,
  }

  static defaultProps = {
    transaction: {},
    showFiat: true,
  }

  render () {
    const { t } = this.context
    const { transaction, className, nativeCurrency, showFiat } = this.props
    const { txParams: { gas, gasPrice, value } = {}, txReceipt: { gasUsed } = {} } = transaction

    const gasLimit = typeof gasUsed === 'string' ? gasUsed : gas

    const hexGasTotal = getHexGasTotal({ gasLimit, gasPrice })
    const totalInHex = sumHexes(hexGasTotal, value)

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
          <HexToDecimal
            className="transaction-breakdown__value"
            value={gas}
          />
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
          <CurrencyDisplay
            className="transaction-breakdown__value"
            currency={nativeCurrency}
            denomination={GWEI}
            value={gasPrice}
            hideLabel
          />
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
