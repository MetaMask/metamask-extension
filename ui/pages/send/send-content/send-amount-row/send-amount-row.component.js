import React, { Component } from 'react';
import PropTypes from 'prop-types';
import SendRowWrapper from '../send-row-wrapper';
import UserPreferencedCurrencyInput from '../../../../components/app/user-preferenced-currency-input';
import UserPreferencedTokenInput from '../../../../components/app/user-preferenced-token-input';
import UserPreferencedCurrencyDisplay from '../../../../components/app/user-preferenced-currency-display';
import { ASSET_TYPES } from '../../../../ducks/send';
import AmountMaxButton from './amount-max-button';
import ArrowIcon from '../../../../components/ui/icon/arrow-icon.component';

export default class SendAmountRow extends Component {
  static propTypes = {
    amount: PropTypes.string,
    inError: PropTypes.bool,
    asset: PropTypes.object,
    updateSendAmount: PropTypes.func,
  };

  static contextTypes = {
    t: PropTypes.func,
  };

  handleChange = (newAmount) => {
    this.props.updateSendAmount(newAmount);
  };

  renderInput() {
    const { amount, inError, asset } = this.props;

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
        hexValue={amount}
      />
    );
  }

  renderAmount() {
    const {
      accounts,
      selectedAddress,
      inError,
      metamask,
      nativeCurrency,
    } = this.props;
    const { t } = this.context;
    const balanceValue = accounts[selectedAddress]
      ? accounts[selectedAddress].balance
      : '';
    console.log(metamask, 'metamask');
    return (
      <div className='send-v2__amount__wrapper'>
        <button className='send-v2__amount__switch'>
          <p>{nativeCurrency}</p>
          <ArrowIcon color='#FFFFFF' />
        </button>
        {this.renderInput()}
        <p className='send-v2__amount__balance'>
          <span>{t('balance')} : </span>
          <UserPreferencedCurrencyDisplay
            ethNumberOfDecimals={4}
            value={balanceValue}
          />

        </p>
        <AmountMaxButton inError={inError} />
      </div>
    )
  }

  render() {
    const { inError, asset } = this.props;

    if (asset.type === ASSET_TYPES.COLLECTIBLE) {
      return null;
    }

    return (
      this.renderAmount()
      /* <SendRowWrapper
        label={`${this.context.t('amount')}:`}
        showError={inError}
        errorType="amount"
      >
        <AmountMaxButton inError={inError} />
        {this.renderInput()}
      </SendRowWrapper> */
    );
  }
}
