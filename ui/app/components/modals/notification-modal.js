const { Component } = require('react')
const PropTypes = require('prop-types')
const h = require('react-hyperscript')
const connect = require('../../metamask-connect')
const actions = require('../../actions')
const t = require('../../../i18n-helper').getMessage

class NotificationModal extends Component {
  render () {
    const {
      header,
      message,
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
          t(this.props.localeMessages, header),
        ]),

        h('div.notification-modal__message-wrapper', {}, [
          h('div.notification-modal__message', {}, [
            t(this.props.localeMessages, message),
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
  header: PropTypes.string,
  message: PropTypes.node,
  showCancelButton: PropTypes.bool,
  showConfirmButton: PropTypes.bool,
  onConfirm: PropTypes.func,
}

const mapDispatchToProps = dispatch => {
  return {
    hideModal: () => {
      dispatch(actions.hideModal())
    },
  }
}

module.exports = connect(null, mapDispatchToProps)(NotificationModal)
