const { Component } = require('react')
const connect = require('react-redux').connect
const h = require('react-hyperscript')
const PropTypes = require('prop-types')
const actions = require('../../actions')
const clone = require('clone')
const ethUtil = require('ethereumjs-util')
const BN = ethUtil.BN
const hexToBn = require('../../../../app/scripts/lib/hex-to-bn')
const { conversionUtil } = require('../../conversion-util')
const SenderToRecipient = require('../sender-to-recipient')
const NetworkDisplay = require('../network-display')

const { MIN_GAS_PRICE_HEX } = require('../send/send.constants')

class ConfirmDeployContract extends Component {
  constructor (props) {
    super(props)

    this.state = {
      valid: false,
      submitting: false,
    }
  }

  onSubmit (event) {
    event.preventDefault()
    const txMeta = this.gatherTxMeta()
    const valid = this.checkValidity()
    this.setState({ valid, submitting: true })

    if (valid && this.verifyGasParams()) {
      this.props.sendTransaction(txMeta, event)
    } else {
      this.props.displayWarning(this.context.t('invalidGasParams'))
      this.setState({ submitting: false })
    }
  }

  cancel (event, txMeta) {
    event.preventDefault()
    this.props.cancelTransaction(txMeta)
  }

  checkValidity () {
    const form = this.getFormEl()
    const valid = form.checkValidity()
    return valid
  }

  getFormEl () {
    const form = document.querySelector('form#pending-tx-form')
    // Stub out form for unit tests:
    if (!form) {
      return { checkValidity () { return true } }
    }
    return form
  }

  // After a customizable state value has been updated,
  gatherTxMeta () {
    const props = this.props
    const state = this.state
    const txData = clone(state.txData) || clone(props.txData)

    // log.debug(`UI has defaulted to tx meta ${JSON.stringify(txData)}`)
    return txData
  }

  verifyGasParams () {
    // We call this in case the gas has not been modified at all
    if (!this.state) { return true }
    return (
      this._notZeroOrEmptyString(this.state.gas) &&
      this._notZeroOrEmptyString(this.state.gasPrice)
    )
  }

  _notZeroOrEmptyString (obj) {
    return obj !== '' && obj !== '0x0'
  }

  bnMultiplyByFraction (targetBN, numerator, denominator) {
    const numBN = new BN(numerator)
    const denomBN = new BN(denominator)
    return targetBN.mul(numBN).div(denomBN)
  }

  getData () {
    const { identities } = this.props
    const txMeta = this.gatherTxMeta()
    const txParams = txMeta.txParams || {}

    return {
      from: {
        address: txParams.from,
        name: identities[txParams.from].name,
      },
      memo: txParams.memo || '',
    }
  }

  getAmount () {
    const { conversionRate, currentCurrency } = this.props
    const txMeta = this.gatherTxMeta()
    const txParams = txMeta.txParams || {}

    const FIAT = conversionUtil(txParams.value, {
      fromNumericBase: 'hex',
      toNumericBase: 'dec',
      fromCurrency: 'ETH',
      toCurrency: currentCurrency,
      numberOfDecimals: 2,
      fromDenomination: 'WEI',
      conversionRate,
    })
    const ETH = conversionUtil(txParams.value, {
      fromNumericBase: 'hex',
      toNumericBase: 'dec',
      fromCurrency: 'ETH',
      toCurrency: 'ETH',
      fromDenomination: 'WEI',
      conversionRate,
      numberOfDecimals: 6,
    })

    return {
      fiat: Number(FIAT),
      token: Number(ETH),
    }

  }

  getGasFee () {
    const { conversionRate, currentCurrency } = this.props
    const txMeta = this.gatherTxMeta()
    const txParams = txMeta.txParams || {}

    // Gas
    const gas = txParams.gas
    const gasBn = hexToBn(gas)

    // Gas Price
    const gasPrice = txParams.gasPrice || MIN_GAS_PRICE_HEX
    const gasPriceBn = hexToBn(gasPrice)

    const txFeeBn = gasBn.mul(gasPriceBn)

    const FIAT = conversionUtil(txFeeBn, {
      fromNumericBase: 'BN',
      toNumericBase: 'dec',
      fromDenomination: 'WEI',
      fromCurrency: 'ETH',
      toCurrency: currentCurrency,
      numberOfDecimals: 2,
      conversionRate,
    })
    const ETH = conversionUtil(txFeeBn, {
      fromNumericBase: 'BN',
      toNumericBase: 'dec',
      fromDenomination: 'WEI',
      fromCurrency: 'ETH',
      toCurrency: 'ETH',
      numberOfDecimals: 6,
      conversionRate,
    })

    return {
      fiat: Number(FIAT),
      eth: Number(ETH),
    }
  }

  renderGasFee () {
    const { currentCurrency } = this.props
    const { fiat: fiatGas, eth: ethGas } = this.getGasFee()

    return (
      h('section.flex-row.flex-center.confirm-screen-row', [
        h('span.confirm-screen-label.confirm-screen-section-column', [ this.context.t('gasFee') ]),
        h('div.confirm-screen-section-column', [
          h('div.confirm-screen-row-info', `${fiatGas} ${currentCurrency.toUpperCase()}`),

          h(
            'div.confirm-screen-row-detail',
            `${ethGas} ETH`
          ),
        ]),
      ])
    )
  }

  renderHeroAmount () {
    const { currentCurrency } = this.props
    const { fiat: fiatAmount } = this.getAmount()
    const txMeta = this.gatherTxMeta()
    const txParams = txMeta.txParams || {}
    const { memo = '' } = txParams

    return (
      h('div.confirm-send-token__hero-amount-wrapper', [
        h('h3.flex-center.confirm-screen-send-amount', `${fiatAmount}`),
        h('h3.flex-center.confirm-screen-send-amount-currency', currentCurrency.toUpperCase()),
        h('div.flex-center.confirm-memo-wrapper', [
          h('h3.confirm-screen-send-memo', memo),
        ]),
      ])
    )
  }

  renderTotalPlusGas () {
    const { currentCurrency } = this.props
    const { fiat: fiatAmount, token: tokenAmount } = this.getAmount()
    const { fiat: fiatGas, eth: ethGas } = this.getGasFee()

    return (
      h('section.flex-row.flex-center.confirm-screen-row.confirm-screen-total-box ', [
        h('div.confirm-screen-section-column', [
          h('span.confirm-screen-label', [ this.context.t('total') + ' ' ]),
          h('div.confirm-screen-total-box__subtitle', [ this.context.t('amountPlusGas') ]),
        ]),

        h('div.confirm-screen-section-column', [
          h('div.confirm-screen-row-info', `${fiatAmount + fiatGas} ${currentCurrency.toUpperCase()}`),
          h('div.confirm-screen-row-detail', `${tokenAmount + ethGas} ETH`),
        ]),
      ])
    )
  }

  render () {
    const { backToAccountDetail, selectedAddress } = this.props
    const txMeta = this.gatherTxMeta()

    const {
      from: {
        address: fromAddress,
        name: fromName,
      },
    } = this.getData()

    this.inputs = []

    return (
      h('.page-container', [
        h('.page-container__header', [
          h('.page-container__header-row', [
            h('span.page-container__back-button', {
              onClick: () => backToAccountDetail(selectedAddress),
            }, this.context.t('back')),
            window.METAMASK_UI_TYPE === 'notification' && h(NetworkDisplay),
          ]),
          h('.page-container__title', this.context.t('confirmContract')),
          h('.page-container__subtitle', this.context.t('pleaseReviewTransaction')),
        ]),
        // Main Send token Card
        h('.page-container__content', [

          h(SenderToRecipient, {
            senderName: fromName,
            senderAddress: fromAddress,
          }),

          // h('h3.flex-center.confirm-screen-sending-to-message', {
          //   style: {
          //     textAlign: 'center',
          //     fontSize: '16px',
          //   },
          // }, [
          //   `You're deploying a new contract.`,
          // ]),

          this.renderHeroAmount(),

          h('div.confirm-screen-rows', [
            h('section.flex-row.flex-center.confirm-screen-row', [
              h('span.confirm-screen-label.confirm-screen-section-column', [ this.context.t('from') ]),
              h('div.confirm-screen-section-column', [
                h('div.confirm-screen-row-info', fromName),
                h('div.confirm-screen-row-detail', `...${fromAddress.slice(fromAddress.length - 4)}`),
              ]),
            ]),

            h('section.flex-row.flex-center.confirm-screen-row', [
              h('span.confirm-screen-label.confirm-screen-section-column', [ this.context.t('to') ]),
              h('div.confirm-screen-section-column', [
                h('div.confirm-screen-row-info', this.context.t('newContract')),
              ]),
            ]),

            this.renderGasFee(),

            this.renderTotalPlusGas(),

          ]),
        ]),

        h('form#pending-tx-form', {
          onSubmit: event => this.onSubmit(event),
        }, [
          h('.page-container__footer', [
            // Cancel Button
            h('button.btn-cancel.page-container__footer-button.allcaps', {
              onClick: event => this.cancel(event, txMeta),
            }, this.context.t('cancel')),

            // Accept Button
            h('button.btn-confirm.page-container__footer-button.allcaps', {
              onClick: event => this.onSubmit(event),
            }, this.context.t('confirm')),
          ]),
        ]),
      ])
    )
  }
}

ConfirmDeployContract.propTypes = {
  sendTransaction: PropTypes.func,
  cancelTransaction: PropTypes.func,
  backToAccountDetail: PropTypes.func,
  displayWarning: PropTypes.func,
  identities: PropTypes.object,
  conversionRate: PropTypes.number,
  currentCurrency: PropTypes.string,
  selectedAddress: PropTypes.string,
  t: PropTypes.func,
}

const mapStateToProps = state => {
  const {
    conversionRate,
    identities,
    currentCurrency,
  } = state.metamask
  const accounts = state.metamask.accounts
  const selectedAddress = state.metamask.selectedAddress || Object.keys(accounts)[0]
  return {
    currentCurrency,
    conversionRate,
    identities,
    selectedAddress,
  }
}

const mapDispatchToProps = dispatch => {
  return {
    backToAccountDetail: address => dispatch(actions.backToAccountDetail(address)),
    cancelTransaction: ({ id }) => dispatch(actions.cancelTx({ id })),
    displayWarning: warning => actions.displayWarning(warning),
  }
}

ConfirmDeployContract.contextTypes = {
  t: PropTypes.func,
}

module.exports = connect(mapStateToProps, mapDispatchToProps)(ConfirmDeployContract)
