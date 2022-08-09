import React, { PureComponent } from 'react';
import PropTypes from 'prop-types';
import Button from '../../../ui/button';

export default class SignatureRequestFooter extends PureComponent {
  static propTypes = {
    cancelAction: PropTypes.func.isRequired,
    signAction: PropTypes.func.isRequired,
    disabled: PropTypes.bool,
  };

  static contextTypes = {
    t: PropTypes.func,
  };

  render() {
    const { cancelAction, signAction, disabled = false } = this.props;
    return (
      <div className="signature-request-footer">
        <Button
          onClick={cancelAction}
          type="secondary"
          data-testid="signature-cancel-button"
        >
          {this.context.t('cancel')}
        </Button>
        <Button
          onClick={signAction}
          type="primary"
          data-testid="signature-sign-button"
          disabled={disabled}
        >
          {this.context.t('sign')}
        </Button>
      </div>
    );
  }
}
