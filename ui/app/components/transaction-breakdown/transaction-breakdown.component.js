import React, { PureComponent } from 'react'
import PropTypes from 'prop-types'
import classnames from 'classnames'
import TransactionBreakdownRow from './transaction-breakdown-row'
import Card from '../card'
import CurrencyDisplay from '../currency-display'
import HexToDecimal from '../hex-to-decimal'
import { ETH, GWEI } from '../../constants/common'
import { getHexGasTotal } from '../../helpers/confirm-transaction/util'
import { sumHexes } from '../../helpers/transactions.util'

export default class TransactionBreakdown extends PureComponent {
  static contextTypes = {
    t: PropTypes.func,
  }

  static propTypes = {
    transaction: PropTypes.object,
    className: PropTypes.string,
  }

  static defaultProps = {
    transaction: {},
  }

  render () {
    const { t } = this.context
    const { transaction, className } = this.props
    const { txParams: { gas, gasPrice, value } = {}, txReceipt: { gasUsed } = {} } = transaction

    const gasLimit = typeof gasUsed === 'string' ? gasUsed : gas

    const hexGasTotal = getHexGasTotal({ gasLimit, gasPrice })
    const totalInHex = sumHexes(hexGasTotal, value)

    return (
      <div className={classnames('transaction-breakdown', className)}>
        <Card
          title={t('transaction')}
          className="transaction-breakdown__card"
        >
          <TransactionBreakdownRow title={t('amount')}>
            <CurrencyDisplay
              className="transaction-breakdown__value"
              currency={ETH}
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
              currency={ETH}
              denomination={GWEI}
              value={gasPrice}
              hideLabel
            />
          </TransactionBreakdownRow>
          <TransactionBreakdownRow title={t('total')}>
            <div>
              <CurrencyDisplay
                className="transaction-breakdown__value transaction-breakdown__value--eth-total"
                currency={ETH}
                value={totalInHex}
                numberOfDecimals={6}
              />
              <CurrencyDisplay
                className="transaction-breakdown__value"
                value={totalInHex}
              />
            </div>
          </TransactionBreakdownRow>
        </Card>
      </div>
    )
  }
}
