import React, { PureComponent } from 'react';
import PropTypes from 'prop-types';

import { PageContainerFooter } from '../../../../../components/ui/page-container';

export default class SignatureRequestFooter extends PureComponent {
  static propTypes = {
    cancelAction: PropTypes.func.isRequired,
    signAction: PropTypes.func.isRequired,
    disabled: PropTypes.bool,
    submitButtonType: PropTypes.string,
  };

  static contextTypes = {
    t: PropTypes.func,
  };

  render() {
    const {
      submitButtonType,
      cancelAction,
      signAction,
      disabled = false,
    } = this.props;
    return (
      <PageContainerFooter
        cancelText={this.context.t('reject')}
        submitText={this.context.t('sign')}
        onCancel={cancelAction}
        onSubmit={signAction}
        disabled={disabled}
        submitButtonType={submitButtonType}
      />
    );
  }
}
