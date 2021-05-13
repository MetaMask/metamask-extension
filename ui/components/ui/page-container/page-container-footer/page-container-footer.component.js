import React, { Component } from 'react';
import PropTypes from 'prop-types';
import classnames from 'classnames';
import Button from '../../button';

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
    buttonSizeLarge: PropTypes.bool,
    footerClassName: PropTypes.string,
    footerButtonClassName: PropTypes.string,
  };

  static contextTypes = {
    t: PropTypes.func,
  };

  render() {
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
      buttonSizeLarge = false,
      footerClassName,
      footerButtonClassName,
    } = this.props;

    return (
      <div className={classnames('page-container__footer', footerClassName)}>
        <footer>
          {!hideCancel && (
            <Button
              type={cancelButtonType || 'default'}
              large={buttonSizeLarge}
              className={classnames(
                'page-container__footer-button',
                footerButtonClassName,
              )}
              onClick={(e) => onCancel(e)}
              data-testid="page-container-footer-cancel"
            >
              {cancelText || this.context.t('cancel')}
            </Button>
          )}

          <Button
            type={submitButtonType || 'secondary'}
            large={buttonSizeLarge}
            className={classnames(
              'page-container__footer-button',
              footerButtonClassName,
            )}
            disabled={disabled}
            onClick={(e) => onSubmit(e)}
            data-testid="page-container-footer-next"
          >
            {submitText || this.context.t('next')}
          </Button>
        </footer>

        {children && (
          <div className="page-container__footer-secondary">{children}</div>
        )}
      </div>
    );
  }
}
