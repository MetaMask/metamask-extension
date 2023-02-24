import React, { PureComponent } from 'react';
import PropTypes from 'prop-types';

export default class WrongNetworkNotification extends PureComponent {
  static contextTypes = {
    t: PropTypes.func,
    trackEvent: PropTypes.func,
  };

  render() {
    const { provider, balance, isCustodianSupportedChain } = this.props;
    const network = provider.nickname || provider.type;

    return !isCustodianSupportedChain && balance ? (
      <div className="wrong-network-notification">
        <img src="images/icons/red-triangle-exclaim.svg" />{' '}
        <p>
          {this.context.t('custodyWrongChain', [
            network ? network.charAt(0).toUpperCase() + network.slice(1) : '',
          ])}
        </p>
      </div>
    ) : null;
  }
}

WrongNetworkNotification.propTypes = {
  provider: PropTypes.obj,
  balance: PropTypes.string,
  isCustodianSupportedChain: PropTypes.bool,
};
