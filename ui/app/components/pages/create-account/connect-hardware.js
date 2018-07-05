const { Component } = require('react')
const PropTypes = require('prop-types')
const h = require('react-hyperscript')
const connect = require('react-redux').connect
const actions = require('../../../actions')
const genAccountLink = require('../../../../lib/account-link.js')
const { DEFAULT_ROUTE } = require('../../../routes')
const { formatBalance } = require('../../../util')

class ConnectHardwareForm extends Component {
  constructor (props, context) {
    super(props)
    this.state = {
      error: null,
      response: null,
      btnText: context.t('connectToTrezor'),
      selectedAccount: '',
      accounts: [],
    }
  }

  connectToTrezor () {
    if (this.state.accounts.length) {
      return null
    }
    this.setState({ btnText: this.context.t('connecting')})
    this.getPage(1)
  }

  getPage (page) {
    this.props
      .connectHardware('trezor', page)
      .then(accounts => {
        if (accounts.length) {
          this.setState({ accounts: accounts })
        }
      })
      .catch(e => {
        this.setState({ btnText: this.context.t('connectToTrezor') })
      })
  }

  unlockAccount () {
    if (this.state.selectedAccount === '') {
      return Promise.reject({ error: this.context.t('accountSelectionRequired') })
    }
    return this.props.unlockTrezorAccount(this.state.selectedAccount)
  }

  handleRadioChange = e => {
    this.setState({
      selectedAccount: e.target.value,
      error: null,
    })
  }

  getBalance (address) {
    // Get the balance
    const { accounts } = this.props
    const balanceValue = accounts && accounts[address] ? accounts[address].balance : ''
    const formattedBalance = balanceValue ? formatBalance(balanceValue, 6) : '...'
    return formattedBalance
  }

  renderAccounts () {
    if (!this.state.accounts.length) {
      return null
    }

    return h('div.hw-account-list', [
      h('div.hw-account-list__title_wrapper', [
        h('div.hw-account-list__title', {}, [this.context.t('selectAnAddress')]),
        h('div.hw-account-list__device', {}, ['Trezor - ETH']),
      ]),
      this.state.accounts.map((a, i) => {

        return h('div.hw-account-list__item', { key: a.address }, [
          h('span.hw-account-list__item__index', a.index + 1),
          h('div.hw-account-list__item__radio', [
            h('input', {
              type: 'radio',
              name: 'selectedAccount',
              id: `address-${i}`,
              value: a.index,
              onChange: this.handleRadioChange,
            }),
            h(
              'label.hw-account-list__item__label',
              {
                htmlFor: `address-${i}`,
              },
              `${a.address.slice(0, 4)}...${a.address.slice(-4)}`
            ),
          ]),
          h('span.hw-account-list__item__balance', `${this.getBalance(a.address)}`),
          h(
            'a.hw-account-list__item__link',
            {
              href: genAccountLink(a.address, this.props.network),
              target: '_blank',
              title: this.context.t('etherscanView'),
            },
            h('img', { src: 'images/popout.svg' })
          ),
        ])
      }),
    ])
  }

  renderPagination () {
    if (!this.state.accounts.length) {
      return null
    }
    return h('div.hw-list-pagination', [
      h(
        'button.btn-primary.hw-list-pagination__button',
        {
          onClick: () => this.getPage(-1),
        },
        `< ${this.context.t('prev')}`
      ),

      h(
        'button.btn-primary.hw-list-pagination__button',
        {
          onClick: () => this.getPage(1),
        },
        `${this.context.t('next')} >`
      ),
    ])
  }

  renderButtons () {
    if (!this.state.accounts.length) {
      return null
    }
    const { history } = this.props

    return h('div.new-account-create-form__buttons', {}, [
      h(
        'button.btn-default.btn--large.new-account-create-form__button',
        {
          onClick: () => history.push(DEFAULT_ROUTE),
        },
        [this.context.t('cancel')]
      ),

      h(
        'button.btn-primary.btn--large.new-account-create-form__button',
        {
          onClick: () => {
            this.unlockAccount(this.state.selectedAccount)
              .then(() => history.push(DEFAULT_ROUTE))
              .catch(e => {
                this.setState({ error: e.error })
              })
          },
        },
        [this.context.t('unlock')]
      ),
    ])
  }

  renderError () {
    return this.state.error
      ? h('span.error', { style: { marginBottom: 40 } }, this.state.error)
      : null
  }

  renderConnectButton () {
    return !this.state.accounts.length
      ? h(
          'button.btn-primary.btn--large',
          { onClick: () => this.connectToTrezor(), style: { margin: 12 } },
          this.state.btnText
        )
      : null
  }

  renderUnsupportedBrowser () {
    return (
      [h('div.hw-unsupported-browser', [
        h('h3.hw-unsupported-browser__title', {}, 'Bummer! Your Browser is not supported...'),
        h('p.hw-unsupported-browser__msg', {}, 'You need to use Metamask on Google Chrome in order to connect to your TREZOR device.'),
      ]),
      h(
        'button.btn-primary.btn--large',
        { onClick: () => global.platform.openWindow({
          url: 'https://google.com/chrome',
        }), style: { margin: 12 } },
        'Download Google Chrome'
      )]
    )
  }

  renderConnectScreen () {
    const isChrome = window.navigator.userAgent.search('Chrome') !== -1
    if (isChrome) {
      return this.renderConnectButton()
    } else {
      return this.renderUnsupportedBrowser()
    }
  }

  render () {
    return h('div.new-account-create-form', [
      this.renderError(),
      this.renderConnectScreen(),
      this.renderAccounts(),
      this.renderPagination(),
      this.renderButtons(),
    ])
  }
}

ConnectHardwareForm.propTypes = {
  hideModal: PropTypes.func,
  showImportPage: PropTypes.func,
  showConnectPage: PropTypes.func,
  connectHardware: PropTypes.func,
  unlockTrezorAccount: PropTypes.func,
  numberOfExistingAccounts: PropTypes.number,
  history: PropTypes.object,
  t: PropTypes.func,
  network: PropTypes.string,
  accounts: PropTypes.object,
}

const mapStateToProps = state => {
  const {
    metamask: { network, selectedAddress, identities = {}, accounts = [] },
  } = state
  const numberOfExistingAccounts = Object.keys(identities).length

  return {
    network,
    accounts,
    address: selectedAddress,
    numberOfExistingAccounts,
  }
}

const mapDispatchToProps = dispatch => {
  return {
    toCoinbase: address =>
      dispatch(actions.buyEth({ network: '1', address, amount: 0 })),
    hideModal: () => dispatch(actions.hideModal()),
    connectHardware: (deviceName, page) => {
      return dispatch(actions.connectHardware(deviceName, page))
    },
    unlockTrezorAccount: index => {
      return dispatch(actions.unlockTrezorAccount(index))
    },
    showImportPage: () => dispatch(actions.showImportPage()),
    showConnectPage: () => dispatch(actions.showConnectPage()),
  }
}

ConnectHardwareForm.contextTypes = {
  t: PropTypes.func,
}

module.exports = connect(mapStateToProps, mapDispatchToProps)(
  ConnectHardwareForm
)
