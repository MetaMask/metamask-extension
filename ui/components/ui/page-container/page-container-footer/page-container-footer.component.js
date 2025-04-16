import React, { Component } from 'react';
import PropTypes from 'prop-types';
import classnames from 'classnames';
import {
  Button,
  ButtonSize,
  ButtonVariant,
} from '../../../component-library/button';

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
    footerClassName: PropTypes.string,
    footerButtonClassName: PropTypes.string,
    submitButtonIcon: PropTypes.string,
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
      footerClassName,
      footerButtonClassName,
      submitButtonIcon,
    } = this.props;

    const submitVariant =
      submitButtonType === 'confirm' ? ButtonVariant.Primary : submitButtonType;

    const cancelVariant =
      cancelButtonType === 'default'
        ? ButtonVariant.Secondary
        : cancelButtonType;

    return (
      <div className={classnames('page-container__footer', footerClassName)}>
        <footer>
          {!hideCancel && (
            <Button
              size={ButtonSize.Lg}
              variant={cancelVariant ?? ButtonVariant.Secondary}
              className={classnames(
                'page-container__footer-button',
                'page-container__footer-button__cancel',
                footerButtonClassName,
              )}
              onClick={(e) => onCancel(e)}
              data-testid="page-container-footer-cancel"
              block
            >
              {cancelText || this.context.t('cancel')}
            </Button>
          )}

          <Button
            size={ButtonSize.Lg}
            variant={submitVariant ?? ButtonVariant.Primary}
            className={classnames(
              'page-container__footer-button',
              footerButtonClassName,
            )}
            disabled={disabled}
            onClick={(e) => onSubmit(e)}
            data-testid="page-container-footer-next"
            startIconName={submitButtonIcon}
            block
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
