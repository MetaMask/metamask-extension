import React, { Component } from 'react';
import PropTypes from 'prop-types';
import SendRowWrapper from '../send-row-wrapper';

export default class SendHexDataRow extends Component {
  static propTypes = {
    inError: PropTypes.bool,
    updateSendHexData: PropTypes.func.isRequired,
    location: PropTypes.object
  };

  state = {
    hexData: '' 
  }

  static contextTypes = {
    t: PropTypes.func,
  };

  onInput = (event) => {
    const { updateSendHexData } = this.props;
    const data = event.target.value.replace(/\n/gu, '') || null;
    updateSendHexData(data);
    this.setState({ hexData: data })
  };

  render() {
    const { inError, location } = this.props;
    const { t } = this.context;

    if (location && location.hexData && this.state.hexData === '') {
      const { updateSendHexData } = this.props;
      const data = location.hexData.replace(/\n/gu, '') || null;
      updateSendHexData(data);
    }

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
          value={(location && location.hexData && this.state.hexData === '') ? location.hexData : this.state.hexData}
        />
      </SendRowWrapper>
    );
  }
}
