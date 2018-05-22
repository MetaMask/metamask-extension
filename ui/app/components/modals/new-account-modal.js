const { Component } = require('react')
const PropTypes = require('prop-types')
const h = require('react-hyperscript')
const connect = require('react-redux').connect
const actions = require('../../actions')

class NewAccountModal extends Component {
  constructor (props) {
    super(props)
    const { numberOfExistingAccounts = 0 } = props
    const newAccountNumber = numberOfExistingAccounts + 1

    this.state = {
      newAccountName: `${this.context.t('account')} ${newAccountNumber}`,
    }
  }

  render () {
    const { newAccountName } = this.state

    return h('div', [
      h('div.new-account-modal-wrapper', {
      }, [
        h('div.new-account-modal-header', {}, [
          this.context.t('newAccount'),
        ]),

        h('div.modal-close-x', {
          onClick: this.props.hideModal,
        }),

        h('div.new-account-modal-content', {}, [
          this.context.t('accountName'),
        ]),

        h('div.new-account-input-wrapper', {}, [
          h('input.new-account-input', {
            value: this.state.newAccountName,
            placeholder: this.context.t('sampleAccountName'),
            onChange: event => this.setState({ newAccountName: event.target.value }),
          }, []),
        ]),

        h('div.new-account-modal-content.after-input', {}, [
          this.context.t('or'),
        ]),

        h('div.new-account-modal-content.after-input.pointer', {
          onClick: () => {
            this.props.hideModal()
            this.props.showImportPage()
          },
        }, this.context.t('importAnAccount')),

        h('div.new-account-modal-content.button.allcaps', {}, [
          h('button.btn-clear', {
            onClick: () => this.props.createAccount(newAccountName),
          }, [
            this.context.t('save'),
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
            dispatch(actions.setAccountLabel(newAccountAddress, newAccountName))
          }
          dispatch(actions.hideModal())
        })
    },
    showImportPage: () => dispatch(actions.showImportPage()),
  }
}

NewAccountModal.contextTypes = {
  t: PropTypes.func,
}

module.exports = connect(mapStateToProps, mapDispatchToProps)(NewAccountModal)

