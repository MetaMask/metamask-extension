import React, { Component } from 'react'
import PropTypes from 'prop-types'
import Button from '../../button'

export default class PageContainerFooter extends Component {

  static propTypes = {
    children: PropTypes.node,
    onCancel: PropTypes.func,
    cancelText: PropTypes.string,
    cancelButtonType: PropTypes.string,
    onSubmit: PropTypes.func,
    submitText: PropTypes.string,
    disabled: PropTypes.bool,
    submitButtonType: PropTypes.string,
    hideCancel: PropTypes.bool,
  }

  static contextTypes = {
    t: PropTypes.func,
  }

  render () {
    const {
      children,
      onCancel,
      cancelText,
      onSubmit,
      submitText,
      disabled,
      submitButtonType,
      hideCancel,
      cancelButtonType,
    } = this.props

    return (
      <div className="page-container__footer">

        <header>
<<<<<<< HEAD
          {!hideCancel && <Button
            type={cancelButtonType || 'default'}
            large
            className="page-container__footer-button"
            onClick={e => onCancel(e)}
          >
            { cancelText || this.context.t('cancel') }
          </Button>}
=======
          {!hideCancel && (
            <Button
              type={cancelButtonType || 'default'}
              large={buttonSizeLarge}
              className="page-container__footer-button"
              onClick={(e) => onCancel(e)}
              data-testid="page-container-footer-cancel"
            >
              { cancelText || this.context.t('cancel') }
            </Button>
          )}
>>>>>>> eebc504b0f23d7c7b725e111a89665a2ac7d50dc

          <Button
            type={submitButtonType || 'secondary'}
            large
            className="page-container__footer-button"
            disabled={disabled}
            onClick={(e) => onSubmit(e)}
            data-testid="page-container-footer-next"
          >
            { submitText || this.context.t('next') }
          </Button>
        </header>

        {children && (
          <footer>
            {children}
          </footer>
        )}

      </div>
    )
  }

}
