<<<<<<< HEAD
const { Component } = require('react')
const PropTypes = require('prop-types')
const h = require('react-hyperscript')
const connect = require('react-redux').connect
const actions = require('../../../store/actions')
=======
import PropTypes from 'prop-types'
import React, { Component } from 'react'
import { connect } from 'react-redux'
import { hideModal } from '../../../store/actions'
>>>>>>> eebc504b0f23d7c7b725e111a89665a2ac7d50dc

class NotificationModal extends Component {
  static contextProps = {
    t: PropTypes.func.isRequired,
  }

  render () {
    const {
      header,
      message,
      showCancelButton = false,
      showConfirmButton = false,
      hideModal,
      onConfirm,
    } = this.props

    const { t } = this.context

    const showButtons = showCancelButton || showConfirmButton

    return h('div', [
      h('div.notification-modal__wrapper', {
      }, [

        h('div.notification-modal__header', {}, [
          this.context.t(header),
        ]),

        h('div.notification-modal__message-wrapper', {}, [
          h('div.notification-modal__message', {}, [
            this.context.t(message),
          ]),
        ]),

        h('div.modal-close-x', {
          onClick: hideModal,
        }),

        showButtons && h('div.notification-modal__buttons', [

          showCancelButton && h('div.btn-default.notification-modal__buttons__btn', {
            onClick: hideModal,
          }, t('cancel')),

          showConfirmButton && h('div.button.btn-secondary.notification-modal__buttons__btn', {
            onClick: () => {
              onConfirm()
              hideModal()
            },
          }, t('confirm')),

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

const mapDispatchToProps = (dispatch) => {
  return {
    hideModal: () => {
      dispatch(actions.hideModal())
    },
  }
}

NotificationModal.contextTypes = {
  t: PropTypes.func,
}

export default connect(null, mapDispatchToProps)(NotificationModal)

