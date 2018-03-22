const Component = require('react').Component
const h = require('react-hyperscript')
const inherits = require('util').inherits
const connect = require('../../metamask-connect')
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
function EditAccountNameModal (props) {
  Component.call(this)

  this.state = {
    inputText: props.identity.name,
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
      }, [this.props.t('editAccountName')]),

      h('input.edit-account-name-modal-input', {
        placeholder: identity.name,
        onChange: (event) => {
          this.setState({ inputText: event.target.value })
        },
        value: this.state.inputText,
      }, []),

      h('button.btn-clear.edit-account-name-modal-save-button.allcaps', {
        onClick: () => {
          if (this.state.inputText.length !== 0) {
            saveAccountLabel(identity.address, this.state.inputText)
            hideModal()
          }
        },
        disabled: this.state.inputText.length === 0,
      }, [
        this.props.t('save'),
      ]),

    ]),
  ])
}
