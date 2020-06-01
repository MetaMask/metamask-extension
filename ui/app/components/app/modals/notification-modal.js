import PropTypes from 'prop-types'
import React, { Component } from 'react'
import { connect } from 'react-redux'
import { hideModal } from '../../../store/actions'

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

    return (
      <div>
        <div className="notification-modal__wrapper">
          <div className="notification-modal__header">
            {this.context.t(header)}
          </div>
          <div className="notification-modal__message-wrapper">
            <div className="notification-modal__message">
              {this.context.t(message)}
            </div>
          </div>
          <div className="modal-close-x" onClick={hideModal} />
          {showButtons && (
            <div className="notification-modal__buttons">
              {showCancelButton && (
                <div
                  className="btn-default notification-modal__buttons__btn"
                  onClick={hideModal}
                >
                  {t('cancel')}
                </div>
              )}
              {showConfirmButton && (
                <div
                  className="button btn-secondary notification-modal__buttons__btn"
                  onClick={() => {
                    onConfirm()
                    hideModal()
                  }}
                >
                  {t('confirm')}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    )
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
      dispatch(hideModal())
    },
  }
}

NotificationModal.contextTypes = {
  t: PropTypes.func,
}

export default connect(null, mapDispatchToProps)(NotificationModal)

