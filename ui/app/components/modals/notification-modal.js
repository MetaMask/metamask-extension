const { Component } = require('react')
const PropTypes = require('prop-types')
const h = require('react-hyperscript')
const connect = require('react-redux').connect
const actions = require('../../actions')

class NotificationModal extends Component {
  render () {
    const {
      headerKey,
      messageKey,
      showCancelButton = false,
      showConfirmButton = false,
      hideModal,
      onConfirm,
    } = this.props

    const showButtons = showCancelButton || showConfirmButton

    return h('div', [
      h('div.notification-modal__wrapper', {
      }, [

        h('div.notification-modal__header', {}, [
          this.context.t(headerKey),
        ]),

        h('div.notification-modal__message-wrapper', {}, [
          h('div.notification-modal__message', {}, [
            this.context.t(messageKey),
          ]),
        ]),

        h('div.modal-close-x', {
          onClick: hideModal,
        }),

        showButtons && h('div.notification-modal__buttons', [

          showCancelButton && h('div.btn-cancel.notification-modal__buttons__btn', {
            onClick: hideModal,
          }, 'Cancel'),

          showConfirmButton && h('div.btn-clear.notification-modal__buttons__btn', {
            onClick: () => {
              onConfirm()
              hideModal()
            },
          }, 'Confirm'),

        ]),

      ]),
    ])
  }
}

NotificationModal.propTypes = {
  hideModal: PropTypes.func,
  headerKey: PropTypes.string,
  messageKey: PropTypes.node,
  showCancelButton: PropTypes.bool,
  showConfirmButton: PropTypes.bool,
  onConfirm: PropTypes.func,
    t: PropTypes.func,
}

const mapDispatchToProps = dispatch => {
  return {
    hideModal: () => {
      dispatch(actions.hideModal())
    },
  }
}

NotificationModal.contextTypes = {
  t: PropTypes.func,
}

module.exports = connect(null, mapDispatchToProps)(NotificationModal)

