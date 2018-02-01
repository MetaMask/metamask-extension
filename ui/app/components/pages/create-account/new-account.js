const { Component } = require('react')
const PropTypes = require('prop-types')
const h = require('react-hyperscript')
const { connect } = require('react-redux')
const actions = require('../../../actions')
const { DEFAULT_ROUTE } = require('../../../routes')

class NewAccountCreateForm extends Component {
  constructor (props) {
    super(props)
    const { numberOfExistingAccounts = 0 } = props
    const newAccountNumber = numberOfExistingAccounts + 1

    this.state = {
      newAccountName: `Account ${newAccountNumber}`,
    }
  }

  render () {
    const { newAccountName } = this.state
    const { history, createAccount } = this.props

    return h('div.new-account-create-form', [

      h('div.new-account-create-form__input-label', {}, [
        'Account Name',
      ]),

      h('div.new-account-create-form__input-wrapper', {}, [
        h('input.new-account-create-form__input', {
          value: this.state.newAccountName,
          placeholder: 'E.g. My new account',
          onChange: event => this.setState({ newAccountName: event.target.value }),
        }, []),
      ]),

      h('div.new-account-create-form__buttons', {}, [

        h('button.new-account-create-form__button-cancel', {
          onClick: () => history.push(DEFAULT_ROUTE),
        }, [
          'CANCEL',
        ]),

        h('button.new-account-create-form__button-create', {
          onClick: () => {
            createAccount(newAccountName)
              .then(() => history.push(DEFAULT_ROUTE))
          },
        }, [
          'CREATE',
        ]),

      ]),

    ])
  }
}

NewAccountCreateForm.propTypes = {
  hideModal: PropTypes.func,
  showImportPage: PropTypes.func,
  createAccount: PropTypes.func,
  numberOfExistingAccounts: PropTypes.number,
  history: PropTypes.object,
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
            dispatch(actions.saveAccountLabel(newAccountAddress, newAccountName))
          }
        })
    },
    showImportPage: () => dispatch(actions.showImportPage()),
  }
}

module.exports = connect(mapStateToProps, mapDispatchToProps)(NewAccountCreateForm)
