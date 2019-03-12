const inherits = require('util').inherits
const Component = require('react').Component
const h = require('react-hyperscript')
const { withRouter } = require('react-router-dom')
const { compose } = require('recompose')
const PropTypes = require('prop-types')
const connect = require('react-redux').connect
const actions = require('../../../../actions')
const { DEFAULT_ROUTE } = require('../../../../routes')

ContractImportView.contextTypes = {
  t: PropTypes.func,
}

module.exports = compose(
  withRouter,
  connect(mapStateToProps, mapDispatchToProps)
)(ContractImportView)


function mapStateToProps (state) {
  return {
    error: state.appState.warning,
    firstAddress: Object.keys(state.metamask.accounts)[0],
  }
}

function mapDispatchToProps (dispatch) {
  return {
    importNewContract: (strategy, [ contractAddress ]) => {
      return dispatch(actions.importNewContract(strategy, [ contractAddress ]))
    },
    displayWarning: (message) => dispatch(actions.displayWarning(message || null)),
    setSelectedAddress: (address) => dispatch(actions.setSelectedAddress(address)),
    setSelectedContractAddress: (address) => dispatch(actions.setSelectedContractAddress(address)),
    // lookupOwners: (address) => dispatch(actions.lookupOwners(address)),
  }
}

inherits(ContractImportView, Component)
function ContractImportView () {
  this.importContractOnEnter = this.importContractOnEnter.bind(this)
  Component.call(this)
}

ContractImportView.prototype.render = function () {
  const { error, displayWarning } = this.props

  return (
    //input-label instead of private key?
    h('div.new-account-import-form__private-key', [

      h('span.new-account-create-form__instruction', this.context.t('addContract')),

      h('div.new-account-import-form__private-key-password-container', [

        h('input.new-account-import-form__input-password', {
          type: 'text',
          id: 'contract-address-box',
          //onInput: e => this.lookupOwners(e),
          onKeyPress: e => this.importContractOnEnter(e),
        }),

      ]),

      h('div', [ this.context.t('contractDetected', ["test"]),

      ]),

      h('div.new-account-import-form__buttons', {}, [

        h('button.btn-default.btn--large.new-account-create-form__button', {
          onClick: () => {
            displayWarning(null)
            this.props.history.push(DEFAULT_ROUTE)
          },
        }, [
          this.context.t('cancel'),
        ]),

        h('button.btn-primary.btn--large.new-account-create-form__button', {
          onClick: () => this.addNewContractAccount(),
        }, [
          this.context.t('import'),
        ]),

      ]),

      error ? h('span.error', error) : null,
    ])
  )
}

ContractImportView.prototype.importContractOnEnter = function (event) {
  if (event.key === 'Enter') {
    event.preventDefault()
    this.addNewContractAccount()
  }
}

ContractImportView.prototype.addNewContractAccount = function () {
  const input = document.getElementById('contract-address-box')
  const contractAddress = input.value
  const { importNewContract, history, displayWarning, setSelectedAddress, firstAddress } = this.props

  importNewContract('gnosis-safe', [ contractAddress ])
    .then((contractAddress ) => {
      if (contractAddress) {
        console.log('[contract-address.js] here', contractAddress)
        history.push(DEFAULT_ROUTE)
        displayWarning(null)
      } else {
        // to do: test inputting:
        // - [ ] garbage 
        // - [ ] an address that isn't a gnosis safe
        displayWarning('Error importing account.')
        setSelectedAddress(firstAddress)
      }
    })
    .catch(err => err && displayWarning(err.message || err))
}
