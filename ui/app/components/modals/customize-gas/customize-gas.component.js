import React, { Component } from 'react'
import PropTypes from 'prop-types'
import GasModalCard from '../../customize-gas-modal/gas-modal-card'
import { MIN_GAS_PRICE_GWEI } from '../../send/send.constants'

import {
  getDecimalGasLimit,
  getDecimalGasPrice,
  getPrefixedHexGasLimit,
  getPrefixedHexGasPrice,
} from './customize-gas.util'

export default class CustomizeGas extends Component {
  static contextTypes = {
    t: PropTypes.func,
  }

  static propTypes = {
    txData: PropTypes.object.isRequired,
    hideModal: PropTypes.func,
    validate: PropTypes.func,
    onSubmit: PropTypes.func,
  }

  state = {
    gasPrice: 0,
    gasLimit: 0,
    originalGasPrice: 0,
    originalGasLimit: 0,
  }

  componentDidMount () {
    const { txData = {} } = this.props
    const { txParams: { gas: hexGasLimit, gasPrice: hexGasPrice } = {} } = txData

    const gasLimit = getDecimalGasLimit(hexGasLimit)
    const gasPrice = getDecimalGasPrice(hexGasPrice)

    this.setState({
      gasPrice,
      gasLimit,
      originalGasPrice: gasPrice,
      originalGasLimit: gasLimit,
    })
  }

  handleRevert () {
    const { originalGasPrice, originalGasLimit } = this.state

    this.setState({
      gasPrice: originalGasPrice,
      gasLimit: originalGasLimit,
    })
  }

  handleSave () {
    const { onSubmit, hideModal } = this.props
    const { gasLimit, gasPrice } = this.state
    const prefixedHexGasPrice = getPrefixedHexGasPrice(gasPrice)
    const prefixedHexGasLimit = getPrefixedHexGasLimit(gasLimit)

    Promise.resolve(onSubmit({ gasPrice: prefixedHexGasPrice, gasLimit: prefixedHexGasLimit }))
      .then(() => hideModal())
  }

  validate () {
    const { gasLimit, gasPrice } = this.state
    return this.props.validate({
      gasPrice: getPrefixedHexGasPrice(gasPrice),
      gasLimit: getPrefixedHexGasLimit(gasLimit),
    })
  }

  render () {
    const { t } = this.context
    const { hideModal } = this.props
    const { gasPrice, gasLimit } = this.state
    const { valid, errorKey } = this.validate()

    return (
      <div className="customize-gas">
        <div className="customize-gas__content">
          <div className="customize-gas__header">
            <div className="customize-gas__title">
              { this.context.t('customGas') }
            </div>
            <div
              className="customize-gas__close"
              onClick={() => hideModal()}
            />
          </div>
          <div className="customize-gas__body">
            <GasModalCard
              value={gasPrice}
              min={MIN_GAS_PRICE_GWEI}
              step={1}
              onChange={value => this.setState({ gasPrice: value })}
              title={t('gasPrice')}
              copy={t('gasPriceCalculation')}
            />
            <GasModalCard
              value={gasLimit}
              min={1}
              step={1}
              onChange={value => this.setState({ gasLimit: value })}
              title={t('gasLimit')}
              copy={t('gasLimitCalculation')}
            />
          </div>
          <div className="customize-gas__footer">
            { !valid && <div className="customize-gas__error-message">{ t(errorKey) }</div> }
            <div
              className="customize-gas__revert"
              onClick={() => this.handleRevert()}
            >
              { t('revert') }
            </div>
            <div className="customize-gas__buttons">
              <button
                className="btn-default customize-gas__cancel"
                onClick={() => hideModal()}
                style={{ marginRight: '10px' }}
              >
                { t('cancel') }
              </button>
              <button
                className="btn-primary customize-gas__save"
                onClick={() => this.handleSave()}
                style={{ marginRight: '10px' }}
                disabled={!valid}
              >
                { t('save') }
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }
}
