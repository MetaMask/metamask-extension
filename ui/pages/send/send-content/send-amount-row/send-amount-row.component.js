import React, { Component } from 'react';
import PropTypes from 'prop-types';
import SendRowWrapper from '../send-row-wrapper';
import UserPreferencedCurrencyInput from '../../../../components/app/user-preferenced-currency-input';
import UserPreferencedTokenInput from '../../../../components/app/user-preferenced-token-input';
import { ASSET_TYPES } from '../../../../ducks/send';
import AmountMaxButton from './amount-max-button';

export default class SendAmountRow extends Component {
  static propTypes = {
    amount: PropTypes.string,
    inError: PropTypes.bool,
    asset: PropTypes.object,
    updateSendAmount: PropTypes.func,
    passDataToSendContent: PropTypes.func,
    location: PropTypes.object,
  };

  static contextTypes = {
    t: PropTypes.func,
  };

  state = {
    dataFromCurrency: {},
  };

  handleChange = (newAmount) => {
    this.props.updateSendAmount(newAmount);
  };

  getDataFromCurrency = (value) => {
    this.setState({ dataFromCurrency: value });
  };

  renderInput() {
    const { amount, inError, asset, location } = this.props;

    return asset.type === ASSET_TYPES.TOKEN ? (
      <UserPreferencedTokenInput
        error={inError}
        onChange={this.handleChange}
        token={asset.details}
        value={amount}
      />
    ) : (
      <UserPreferencedCurrencyInput
        error={inError}
        onChange={this.handleChange}
        value={amount}
        passDataToSendAmount={this.getDataFromCurrency}
        location={location}
      />
    );
  }

  render() {
    const { inError } = this.props;

    this.props.passDataToSendContent(this.state);

    return (
      <SendRowWrapper
        label={`${this.context.t('amount')}:`}
        showError={inError}
        errorType="amount"
      >
        <AmountMaxButton inError={inError} />
        {this.renderInput()}
      </SendRowWrapper>
    );
  }
}
