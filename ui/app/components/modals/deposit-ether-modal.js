const Component = require('react').Component
const h = require('react-hyperscript')
const inherits = require('util').inherits
const connect = require('react-redux').connect
const actions = require('../../actions')
const networkNames = require('../../../../app/scripts/config.js').networkNames

const MODAL_TITLE = 'Deposit Ether'
const MODAL_DESCRIPTION = `To interact with decentralized applications using Metamask, you’ll need
Ether in your wallet.`
const DIRECT_DEPOSIT_ROW_TITLE = 'Directly Deposit Ether'
const DIRECT_DEPOSIT_ROW_TEXT = `If you already have some Ether, the quickest way to get Ether in
your new wallet by direct depost.`
const COINBASE_ROW_TITLE = 'Buy on Coinbase'
const COINBASE_ROW_TEXT = `Coinbase is the world’s most popular way to buy and sell bitcoin,
ethereum, and litecoin.`
const SHAPESHIFT_ROW_TITLE = 'Deposit with ShapeShift'
const SHAPESHIFT_ROW_TEXT = `If you own other cryptocurrencies, you can trade and deposit ETH
direclty into your MetaMask wallet. No Account Needed.`
const FAUCET_ROW_TITLE = 'Test Faucet'
const facuetRowText = networkName => `Get Eth from a faucet for the ${networkName}`

function mapStateToProps (state) {
  return {
    network: state.metamask.network,
    address: state.metamask.selectedAddress,
  }
}

function mapDispatchToProps (dispatch) {
  return {
    toCoinbase: (address) => {
      dispatch(actions.buyEth({ network: '1', address, amount: 0 }))
    },
    hideModal: () => {
      dispatch(actions.hideModal())
    },
    showAccountDetailModal: () => {
      dispatch(actions.showModal({ name: 'ACCOUNT_DETAILS' }))
    },
    toFaucet: network => dispatch(actions.buyEth({ network })),
  }
}

inherits(DepositEtherModal, Component)
function DepositEtherModal () {
  Component.call(this)
}

module.exports = connect(mapStateToProps, mapDispatchToProps)(DepositEtherModal)

DepositEtherModal.prototype.renderRow = function (logo, title, text, buttonLabel, onButtonClick) {
  return h('div.deposit-ether-modal__buy-row', [

    h('div.deposit-ether-modal__buy-row__logo', [logo]),

      h('div.deposit-ether-modal__buy-row__description', [
        
        h('div.deposit-ether-modal__buy-row__description__title', [title]),

        h('div.deposit-ether-modal__buy-row__description__text', [text]),        

      ]),

      h('div.deposit-ether-modal__buy-row__button', [
        h('button.deposit-ether-modal__deposit-button', {
          onClick: onButtonClick,
        }, [buttonLabel]),
      ]),

  ])
}

DepositEtherModal.prototype.render = function () {
  const { network, toCoinbase, address, toFaucet } = this.props
  const isTestNetwork = ['3', '4', '42'].find(n => n === network)
  const networkName = networkNames[network]

  return h('div.deposit-ether-modal', {}, [

    h('div.deposit-ether-modal__header', [

      h('div.deposit-ether-modal__header__title', ['Deposit Ether']),

      h('div.deposit-ether-modal__header__description', [
        'To interact with decentralized applications using Metamask, you’ll need Ether in your wallet.'
      ]),

      h('div.deposit-ether-modal__header__close', {
        onClick: () => { this.props.hideModal() },
      }),

    ]),

    // h('div.deposit-ether-modal__buy-rows-container', [

      h('div.deposit-ether-modal__buy-rows', [

        this.renderRow(
          h('img.deposit-ether-modal__buy-row__eth-logo', { src: '../../../images/eth_logo.svg' }),
          DIRECT_DEPOSIT_ROW_TITLE,
          DIRECT_DEPOSIT_ROW_TEXT,
          'View Account',
          () => this.goToAccountDetailsModal()
        ),

        isTestNetwork
          ? this.renderRow(
            h('i.fa.fa-arrow-left.fa-2x'),
            FAUCET_ROW_TITLE,
            facuetRowText(networkName),
            'Get Ether',
            () => toFaucet(network)
          )
          : this.renderRow(
            h('img.deposit-ether-modal__buy-row__coinbase-logo', {
              src: '../../../images/coinbase logo.png',
            }),
            COINBASE_ROW_TITLE,
            COINBASE_ROW_TEXT,
            'Continue to Coinbase',
            () => toCoinbase(address)
          ),

        !isTestNetwork && this.renderRow(
          h('img.deposit-ether-modal__buy-row__shapeshift-logo', {
            src: '../../../images/shapeshift logo.png',
          }),
          SHAPESHIFT_ROW_TITLE,
          SHAPESHIFT_ROW_TEXT,
          'Continue to Shapeshift',
          () => {}
        ),

      ]),
    // ]),
  ])
}

DepositEtherModal.prototype.goToAccountDetailsModal = function () {
  this.props.hideModal()
  this.props.showAccountDetailModal()
}
