import React, { PureComponent } from 'react'
import PropTypes from 'prop-types'
import classnames from 'classnames'
import Button from '../../ui/button'

export default class Modal extends PureComponent {
  static propTypes = {
    children: PropTypes.node,
    contentClass: PropTypes.string,
    containerClass: PropTypes.string,
    // Header text
    headerText: PropTypes.string,
    onClose: PropTypes.func,
    // Submit button (right button)
    onSubmit: PropTypes.func,
    submitType: PropTypes.string,
    submitText: PropTypes.string,
    submitDisabled: PropTypes.bool,
    hideFooter: PropTypes.bool,
    // Cancel button (left button)
    onCancel: PropTypes.func,
    cancelType: PropTypes.string,
    cancelText: PropTypes.string,
  }

  static defaultProps = {
    submitType: 'secondary',
    cancelType: 'default',
  }

  render() {
    const {
      children,
      headerText,
      onClose,
      onSubmit,
      submitType,
      submitText,
      submitDisabled,
      onCancel,
      cancelType,
      cancelText,
      contentClass,
      containerClass,
      hideFooter,
    } = this.props

    return (
      <div className={classnames('modal-container', containerClass)}>
        {headerText && (
          <div className="modal-container__header">
            <div className="modal-container__header-text">{headerText}</div>
            <div className="modal-container__header-close" onClick={onClose} />
          </div>
        )}
        <div className={classnames('modal-container__content', contentClass)}>
          {children}
        </div>
        {hideFooter ? null : (
          <div className="modal-container__footer">
            {onCancel && (
              <Button
                type={cancelType}
                onClick={onCancel}
                className="modal-container__footer-button"
              >
                {cancelText}
              </Button>
            )}
            <Button
              type={submitType}
              onClick={onSubmit}
              disabled={submitDisabled}
              className="modal-container__footer-button"
            >
              {submitText}
            </Button>
          </div>
        )}
      </div>
    )
  }
}
