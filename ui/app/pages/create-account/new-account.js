const { Component } = require('react')
const PropTypes = require('prop-types')
const h = require('react-hyperscript')
const connect = require('react-redux').connect
const actions = require('../../store/actions')
const { DEFAULT_ROUTE } = require('../../helpers/constants/routes')
import Button from '../../components/ui/button'

class NewAccountCreateForm extends Component {
  constructor (props, context) {
    super(props)

    const { numberOfExistingAccounts = 0 } = props
    const newAccountNumber = numberOfExistingAccounts + 1

    this.state = {
      newAccountName: '',
      defaultAccountName: context.t('newAccountNumberName', [newAccountNumber]),
    }
  }

  render () {
    const { newAccountName, defaultAccountName } = this.state
    const { history, createAccount } = this.props

    return h('div.new-account-create-form', [

      h('div.new-account-create-form__input-label', {}, [
        this.context.t('accountName'),
      ]),

      h('div.new-account-create-form__input-wrapper', {}, [
        h('input.new-account-create-form__input', {
          value: newAccountName,
          placeholder: defaultAccountName,
          onChange: event => this.setState({ newAccountName: event.target.value }),
        }, []),
      ]),

      h('div.new-account-create-form__buttons', {}, [

        h(Button, {
          type: 'default',
          large: true,
          className: 'new-account-create-form__button',
          onClick: () => history.push(DEFAULT_ROUTE),
        }, [this.context.t('cancel')]),

        h(Button, {
          type: 'secondary',
          large: true,
          className: 'new-account-create-form__button',
          onClick: () => {
            createAccount(newAccountName || defaultAccountName)
              .then(() => {
                this.context.metricsEvent({
                  eventOpts: {
                    category: 'Accounts',
                    action: 'Add New Account',
                    name: 'Added New Account',
                  },
                })
                history.push(DEFAULT_ROUTE)
              })
              .catch((e) => {
                this.context.metricsEvent({
                  eventOpts: {
                    category: 'Accounts',
                    action: 'Add New Account',
                    name: 'Error',
                  },
                  customVariables: {
                    errorMessage: e.message,
                  },
                })
              })
          },
        }, [this.context.t('create')]),

      ]),

    ])
  }
}

NewAccountCreateForm.propTypes = {
  hideModal: PropTypes.func,
  showImportPage: PropTypes.func,
  showConnectPage: PropTypes.func,
  createAccount: PropTypes.func,
  numberOfExistingAccounts: PropTypes.number,
  history: PropTypes.object,
  t: PropTypes.func,
}

const mapStateToProps = state => {
  const { metamask: { network, selectedAddress, identities = {} } } = state
  const numberOfExistingAccounts = Object.keys(identities).length

  return {
    network,
    address: selectedAddress,
    numberOfExistingAccounts,
  }
}

const mapDispatchToProps = dispatch => {
  return {
    toCoinbase: address => dispatch(actions.buyEth({ network: '1', address, amount: 0 })),
    hideModal: () => dispatch(actions.hideModal()),
    createAccount: newAccountName => {
      return dispatch(actions.addNewAccount())
        .then(newAccountAddress => {
          if (newAccountName) {
            dispatch(actions.setAccountLabel(newAccountAddress, newAccountName))
          }
        })
    },
    showImportPage: () => dispatch(actions.showImportPage()),
    showConnectPage: () => dispatch(actions.showConnectPage()),
  }
}

NewAccountCreateForm.contextTypes = {
  t: PropTypes.func,
  metricsEvent: PropTypes.func,
}

module.exports = connect(mapStateToProps, mapDispatchToProps)(NewAccountCreateForm)

