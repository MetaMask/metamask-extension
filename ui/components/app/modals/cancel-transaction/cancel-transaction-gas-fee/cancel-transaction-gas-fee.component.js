import PropTypes from 'prop-types';
import React, { PureComponent } from 'react';

import { PRIMARY, SECONDARY } from '../../../../../helpers/constants/common';
import UserPreferencedCurrencyDisplay from '../../../user-preferenced-currency-display';

export default class CancelTransaction extends PureComponent {
  static propTypes = {
    value: PropTypes.string,
  };

  render() {
    const { value } = this.props;

    return (
      <div className="cancel-transaction-gas-fee">
        <UserPreferencedCurrencyDisplay
          className="cancel-transaction-gas-fee__eth"
          value={value}
          type={PRIMARY}
        />
        <UserPreferencedCurrencyDisplay
          className="cancel-transaction-gas-fee__fiat"
          value={value}
          type={SECONDARY}
        />
      </div>
    );
  }
}
