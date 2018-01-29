const { Component } = require('react')
const PropTypes = require('prop-types')
const h = require('react-hyperscript')
const { connect } = require('react-redux')
const actions = require('../../actions')
const t = require('../../../i18n')

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

    return h('div.new-account-create-form', [

      h('div.new-account-create-form__input-label', {}, [
        t('accountName'),
      ]),

      h('div.new-account-create-form__input-wrapper', {}, [
        h('input.new-account-create-form__input', {
          value: this.state.newAccountName,
          placeholder: t('sampleAccountName'),
          onChange: event => this.setState({ newAccountName: event.target.value }),
        }, []),
      ]),

      h('div.new-account-create-form__buttons', {}, [

        h('button.new-account-create-form__button-cancel.allcaps', {
          onClick: () => this.props.goHome(),
        }, [
          t('cancel'),
        ]),

        h('button.new-account-create-form__button-create.allcaps', {
          onClick: () => this.props.createAccount(newAccountName),
        }, [
          t('create'),
        ]),

      ]),

    ])
  }
}

NewAccountCreateForm.propTypes = {
  hideModal: PropTypes.func,
  showImportPage: PropTypes.func,
  createAccount: PropTypes.func,
  goHome: PropTypes.func,
  numberOfExistingAccounts: PropTypes.number,
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
    toCoinbase: (address) => {
      dispatch(actions.buyEth({ network: '1', address, amount: 0 }))
    },
    hideModal: () => {
      dispatch(actions.hideModal())
    },
    createAccount: (newAccountName) => {
      dispatch(actions.addNewAccount())
        .then((newAccountAddress) => {
          if (newAccountName) {
            dispatch(actions.saveAccountLabel(newAccountAddress, newAccountName))
          }
          dispatch(actions.goHome())
        })
    },
    showImportPage: () => dispatch(actions.showImportPage()),
    goHome: () => dispatch(actions.goHome()),
  }
}

module.exports = connect(mapStateToProps, mapDispatchToProps)(NewAccountCreateForm)
