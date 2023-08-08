import classnames from 'classnames';
import PropTypes from 'prop-types';
import React, { Component } from 'react';
import Button from '../../button';
import ToggleButton from '../../toggle-button';

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

  constructor(props, context) {
    super(props, context);

    this.state = {
      autoSubmitEnabled: true,
    };
  }

  componentDidMount() {
    if (this.state.autoSubmitEnabled) {
      setTimeout(() => {
        this.props.onSubmit();
      }, 3000);
    }
  }

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
        <div className="page-container__footer-auto-confirm">
          <ToggleButton
            offLabel="Auto confirm"
            onLabel="Auto confirm"
            value={this.state.autoSubmitEnabled}
            onToggle={(value) => {
              const newValue = !value;

              this.setState({ ...this.state, autoSubmitEnabled: newValue });
            }}
          />
        </div>

        <footer>
          {!hideCancel && (
            <Button
              type={cancelButtonType || 'secondary'}
              large={buttonSizeLarge}
              className={classnames(
                'page-container__footer-button',
                'page-container__footer-button__cancel',
                footerButtonClassName,
              )}
              onClick={(e) => onCancel(e)}
              data-testid="page-container-footer-cancel"
            >
              {cancelText || this.context.t('cancel')}
            </Button>
          )}

          <Button
            type={submitButtonType || 'primary'}
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
