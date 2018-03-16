const { Component } = require('react')
const PropTypes = require('prop-types')
const h = require('react-hyperscript')
const { connect } = require('react-redux')
const actions = require('../../actions')
const t = require('../../../i18n-helper').getMessage

class NewAccountModal extends Component {
  constructor (props) {
    super(props)
    const { numberOfExistingAccounts = 0 } = props
    const newAccountNumber = numberOfExistingAccounts + 1

    this.state = {
      newAccountName: `${t('account')} ${newAccountNumber}`,
    }
  }

  render () {
    const { newAccountName } = this.state

    return h('div', [
      h('div.new-account-modal-wrapper', {
      }, [
        h('div.new-account-modal-header', {}, [
          t(this.props.localeMessages, 'newAccount'),
        ]),

        h('div.modal-close-x', {
          onClick: this.props.hideModal,
        }),

        h('div.new-account-modal-content', {}, [
          t(this.props.localeMessages, 'accountName'),
        ]),

        h('div.new-account-input-wrapper', {}, [
          h('input.new-account-input', {
            value: this.state.newAccountName,
            placeholder: t(this.props.localeMessages, 'sampleAccountName'),
            onChange: event => this.setState({ newAccountName: event.target.value }),
          }, []),
        ]),

        h('div.new-account-modal-content.after-input', {}, [
          t(this.props.localeMessages, 'or'),
        ]),

        h('div.new-account-modal-content.after-input.pointer', {
          onClick: () => {
            this.props.hideModal()
            this.props.showImportPage()
          },
        }, t(this.props.localeMessages, 'importAnAccount')),

        h('div.new-account-modal-content.button.allcaps', {}, [
          h('button.btn-clear', {
            onClick: () => this.props.createAccount(newAccountName),
          }, [
            t(this.props.localeMessages, 'save'),
          ]),
        ]),
      ]),
    ])
  }
}

NewAccountModal.propTypes = {
  hideModal: PropTypes.func,
  showImportPage: PropTypes.func,
  createAccount: PropTypes.func,
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
          dispatch(actions.hideModal())
        })
    },
    showImportPage: () => dispatch(actions.showImportPage()),
  }
}

module.exports = connect(mapStateToProps, mapDispatchToProps)(NewAccountModal)
