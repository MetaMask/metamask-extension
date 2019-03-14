const Component = require('react').Component
const PropTypes = require('prop-types')
const h = require('react-hyperscript')
const inherits = require('util').inherits
const connect = require('react-redux').connect
const actions = require('../../store/actions')
const { getSelectedAccount } = require('../../selectors/selectors')

function mapStateToProps (state) {
  return {
    selectedAccount: getSelectedAccount(state),
    identity: state.appState.modal.modalState.props.identity,
  }
}

function mapDispatchToProps (dispatch) {
  return {
    hideModal: () => {
      dispatch(actions.hideModal())
    },
    setAccountLabel: (account, label) => {
      dispatch(actions.setAccountLabel(account, label))
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

EditAccountNameModal.contextTypes = {
  t: PropTypes.func,
}

module.exports = connect(mapStateToProps, mapDispatchToProps)(EditAccountNameModal)


EditAccountNameModal.prototype.render = function () {
  const { hideModal, setAccountLabel, identity } = this.props

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
      }, [this.context.t('editAccountName')]),

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
            setAccountLabel(identity.address, this.state.inputText)
            hideModal()
          }
        },
        disabled: this.state.inputText.length === 0,
      }, [
        this.context.t('save'),
      ]),

    ]),
  ])
}
