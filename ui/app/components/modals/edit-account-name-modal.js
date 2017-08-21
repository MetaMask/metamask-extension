const Component = require('react').Component
const h = require('react-hyperscript')
const inherits = require('util').inherits
const connect = require('react-redux').connect
const actions = require('../../actions')
const { getSelectedAccount } = require('../../selectors')

function mapStateToProps (state) {
  return {
    selectedAccount: getSelectedAccount(state),
    identity: state.appState.modal.modalState.identity,
  }
}

function mapDispatchToProps (dispatch) {
  return {
    hideModal: () => {
      dispatch(actions.hideModal())
    },
    saveAccountLabel: (account, label) => {
      dispatch(actions.saveAccountLabel(account, label))
    },
  }
}

inherits(EditAccountNameModal, Component)
function EditAccountNameModal () {
  Component.call(this)
  this.state = {
    inputText: '',
  }
}

module.exports = connect(mapStateToProps, mapDispatchToProps)(EditAccountNameModal)

EditAccountNameModal.prototype.render = function () {
  const { hideModal, saveAccountLabel, identity } = this.props

  return h('div', {}, [
    h('div.flex-column.edit-account-name-modal-content', {
    }, [

      h('div.edit-account-name-modal-cancel', {
        onClick: () => {
          hideModal()
        },
      }, [
        h('i.fa.fa-times'),
      ]),

      h('div.edit-account-name-modal-title', {
      }, ['Edit Account Name']),

      h('input.edit-account-name-modal-input', {
        placeholder: identity.name,
        onChange: (event) => {
          this.setState({ inputText: event.target.value })
        },
        value: this.state.inputText,
      }, []),

      h('button.btn-clear.edit-account-name-modal-save-button', {
        onClick: () => {
          if (this.state.inputText.length !== 0) {
            saveAccountLabel(identity.address, this.state.inputText)
            hideModal()
          }
        },
        disabled: this.state.inputText.length === 0,
      }, [
        'SAVE',
      ]),

    ])
  ])
}
