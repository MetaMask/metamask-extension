import React, { Component } from 'react';
import PropTypes from 'prop-types';
import classnames from 'classnames';
import {
  INSUFFICIENT_FUNDS_ERROR,
  INSUFFICIENT_TOKENS_ERROR,
  INVALID_HEX_STRING_ERROR,
  NEGATIVE_ETH_ERROR,
} from '../../../send.constants';

export default class SendRowErrorMessage extends Component {
  static propTypes = {
    errors: PropTypes.object,
    errorType: PropTypes.string,
  };

  static contextTypes = {
    t: PropTypes.func,
  };

  render() {
    const { errors, errorType } = this.props;
    const { t } = this.context;

    let errorMessage = null;

    switch (errors[errorType]) {
      case NEGATIVE_ETH_ERROR:
        errorMessage = t('negativeETH');
        break;
      case INSUFFICIENT_FUNDS_ERROR:
        errorMessage = t('insufficientFunds');
        break;
      case INSUFFICIENT_TOKENS_ERROR:
        errorMessage = t('insufficientTokens');
        break;
      case INVALID_HEX_STRING_ERROR:
        errorMessage = t('invalidHexString');
        break;
      default:
        errorMessage = null;
        break;
    }

    return errorMessage ? (
      <div
        className={classnames('send-v2__error', {
          'send-v2__error-amount': errorType === 'amount',
          'send-v2__error-hex-data': errorType === 'hexData',
        })}
      >
        {errorMessage}
      </div>
    ) : null;
  }
}
