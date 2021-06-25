import React, { Component } from 'react';
import PropTypes from 'prop-types';
import SendRowWrapper from '../send-row-wrapper';

export default class SendHexDataRow extends Component {
  static propTypes = {
    inError: PropTypes.bool,
    updateSendHexData: PropTypes.func.isRequired,
  };

  static contextTypes = {
    t: PropTypes.func,
  };

  onInput = (event) => {
    const { updateSendHexData } = this.props;
    const data = event.target.value.replace(/\n/gu, '') || null;
    updateSendHexData(data);
  };

  render() {
    const { inError } = this.props;
    const { t } = this.context;

    return (
      <SendRowWrapper
        label={`${t('hexData')}:`}
        showError={inError}
        errorType="amount"
      >
        <textarea
          onInput={this.onInput}
          placeholder={t('optional')}
          className="send-v2__hex-data__input"
        />
      </SendRowWrapper>
    );
  }
}
