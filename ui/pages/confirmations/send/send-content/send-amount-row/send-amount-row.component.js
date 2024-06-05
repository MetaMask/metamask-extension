import React, { Component } from 'react';
import PropTypes from 'prop-types';
import SendRowWrapper from '../send-row-wrapper';
import UserPreferencedCurrencyInput from '../../../../../components/app/user-preferenced-currency-input';
import UserPreferencedTokenInput from '../../../../../components/app/user-preferenced-token-input';
import {
  AssetType,
  TokenStandard,
} from '../../../../../../shared/constants/transaction';
import { Box } from '../../../../../components/component-library';
import UnitInput from '../../../../../components/ui/unit-input';
import { decimalToHex } from '../../../../../../shared/modules/conversion.utils';
import AmountMaxButton from './amount-max-button';

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

    return asset.type === AssetType.token ? (
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

  render() {
    const { inError, asset } = this.props;

    if (
      asset.type === AssetType.NFT &&
      asset.details.standard === TokenStandard.ERC721
    ) {
      return null;
    }

    if (
      asset.type === AssetType.NFT &&
      asset.details.standard === TokenStandard.ERC1155
    ) {
      return (
        <Box>
          <SendRowWrapper
            label={`${this.context.t('amount')}:`}
            showError={inError}
            errorType="amount"
          >
            <UnitInput
              onChange={(amount) => this.handleChange(decimalToHex(amount))}
              type="number"
              min="0"
              dataTestId="token-input"
            >
              <Box className="currency-input__conversion-component">
                {`${this.context.t('balance')}:`} {`${asset.details.balance} `}
                {`${this.context.t('tokens').toLowerCase()}`}
                {asset.details.symbol ?? ''}
              </Box>
            </UnitInput>
          </SendRowWrapper>
        </Box>
      );
    }

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
