const { Component } = require('react')
const PropTypes = require('prop-types')
const h = require('react-hyperscript')
const connect = require('react-redux').connect
const actions = require('../../../actions')
const ConnectScreen = require('./connect-screen')
const AccountList = require('./account-list')

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

  connectToTrezor = () => {
    if (this.state.accounts.length) {
      return null
    }
    this.setState({ btnText: this.context.t('connecting')})
    this.getPage(1)
  }

  onAccountChange = (account) => {
    this.setState({selectedAccount: account, error: null})
  }

  getPage = (page) => {
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


  renderError () {
    return this.state.error
      ? h('span.error', { style: { marginBottom: 40 } }, this.state.error)
      : null
  }

  renderContent () {
    if (!this.state.accounts.length) {
      return h(ConnectScreen, {
        connectToTrezor: this.connectToTrezor,
        btnText: this.state.btnText,
      })
    }

    return h(AccountList, {
      accounts: this.state.accounts,
      onAccountChange: this.onAccountChange,
      network: this.props.network,
      getPage: this.getPage,
      history: this.props.history,
    })
  }

  render () {
    return h('div.new-account-create-form', [
      this.renderError(),
      this.renderContent(),
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
