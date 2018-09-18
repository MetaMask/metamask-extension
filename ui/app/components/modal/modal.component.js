import React, { PureComponent } from 'react'
import PropTypes from 'prop-types'
import Button from '../button'

export default class Modal extends PureComponent {
  static propTypes = {
    children: PropTypes.node,
    // Header text
    headerText: PropTypes.string,
    // Submit button (right button)
    onSubmit: PropTypes.func,
    submitType: PropTypes.string,
    submitText: PropTypes.string,
    // Cancel button (left button)
    onCancel: PropTypes.func,
    cancelType: PropTypes.string,
    cancelText: PropTypes.string,
  }

  static defaultProps = {
    submitType: 'primary',
    cancelType: 'default',
  }

  handleClose = () => {
    const { onCancel, onSubmit } = this.props

    /**
     * The close button should be used to dismiss the modal, without performing any actions, which
     * is typically what props.onCancel does. However, if props.onCancel is undefined, that should
     * mean that the modal is a simple notification modal and props.onSubmit can be used to dismiss
     * it.
     */
    if (onCancel && typeof onCancel === 'function') {
      onCancel()
    } else {
      onSubmit()
    }
  }

  render () {
    const {
      children,
      headerText,
      onSubmit,
      submitType,
      submitText,
      onCancel,
      cancelType,
      cancelText,
    } = this.props

    return (
      <div className="modal-container">
        {
          headerText && (
            <div className="modal-container__header">
              <div className="modal-container__header-text">
                { headerText }
              </div>
              <div
                className="modal-container__header-close"
                onClick={this.handleClose}
              />
            </div>
          )
        }
        <div className="modal-container__content">
          { children }
        </div>
        <div className="modal-container__footer">
          {
            onCancel && (
              <Button
                type={cancelType}
                onClick={onCancel}
                className="modal-container__footer-button"
              >
                { cancelText }
              </Button>
            )
          }
          <Button
            type={submitType}
            onClick={onSubmit}
            className="modal-container__footer-button"
          >
            { submitText }
          </Button>
        </div>
      </div>
    )
  }
}
