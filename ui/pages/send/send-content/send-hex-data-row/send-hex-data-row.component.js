import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { isHexString } from 'ethereumjs-util';
import SendRowWrapper from '../send-row-wrapper';
import Dialog from '../../../../components/ui/dialog';

export default class SendHexDataRow extends Component {
  state = {
    shouldShowError: false,
  };

  static propTypes = {
    inError: PropTypes.bool,
    data: PropTypes.string,
    updateSendHexData: PropTypes.func.isRequired,
  };

  static contextTypes = {
    t: PropTypes.func,
  };

  renderError(error) {
    const { t } = this.context;
    return (
      <Dialog type="error" className="send__error-dialog">
        {t(error)}
      </Dialog>
    );
  }

  onInput = (event) => {
    const isValidHex = isHexString(event.target.value) || !event.target.value;
    this.setState({ shouldShowError: !isValidHex });
    const { updateSendHexData } = this.props;
    const data = event.target.value.replace(/\n/gu, '') || null;
    updateSendHexData(data);
  };

  render() {
    const { inError, data } = this.props;
    const { t } = this.context;
    const { shouldShowError } = this.state;

    return (
      <>
        <SendRowWrapper
          label={`${t('hexData')}:`}
          showError={inError}
          errorType="amount"
        >
          <textarea
            onInput={this.onInput}
            placeholder={t('optional')}
            className="send-v2__hex-data__input"
            defaultValue={data || ''}
          />
        </SendRowWrapper>
        {shouldShowError && this.renderError('invalidHexString')}
      </>
    );
  }
}
