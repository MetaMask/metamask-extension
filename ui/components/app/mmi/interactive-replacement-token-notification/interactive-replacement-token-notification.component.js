import React, { PureComponent } from 'react';
import PropTypes from 'prop-types';
import { sha256 } from '../../../../../shared/modules/hash.utils';

export default class InteractiveReplacementTokenNotification extends PureComponent {
  state = {
    showNotification: false,
  };

  static contextTypes = {
    t: PropTypes.func,
    trackEvent: PropTypes.func,
  };

  componentDidMount() {
    this.showNotification();
  }

  componentDidUpdate(prevProps) {
    if (this.props.address !== prevProps.address) {
      this.showNotification();
      return;
    }

    if (
      JSON.stringify(this.props.interactiveReplacementToken) !==
      JSON.stringify(prevProps.interactiveReplacementToken)
    ) {
      this.showNotification();
    }
  }

  async showNotification() {
    const {
      keyring,
      isUnlocked,
      interactiveReplacementToken,
      getCustodianToken,
      getCustodyAccountDetails,
      address,
    } = this.props;

    const hasInteractiveReplacementToken =
      interactiveReplacementToken &&
      Boolean(Object.keys(interactiveReplacementToken).length);

    if (!/^Custody/u.test(keyring.type)) {
      console.log('You are not a custodian');
      this.setState({ showNotification: false });
      return;
    } else if (!hasInteractiveReplacementToken) {
      console.log("You don't have an interactive replacement token");
      this.setState({ showNotification: false });
      return;
    }

    const token = await getCustodianToken();

    const custodyAccountDetails = await getCustodyAccountDetails(
      keyring,
      token,
    );

    const showNotification =
      isUnlocked &&
      interactiveReplacementToken.oldRefreshToken &&
      custodyAccountDetails &&
      Boolean(Object.keys(custodyAccountDetails).length);

    const tokenAccount = custodyAccountDetails
      .filter((item) => item.address.toLowerCase() === address.toLowerCase())
      .map((item) => ({
        token: item.authDetails?.refreshToken,
      }))[0];

    const refreshTokenAccount = await sha256(
      tokenAccount?.token + interactiveReplacementToken.url,
    );

    console.log('showNotification', showNotification);
    console.log(
      'has the same old token?',
      refreshTokenAccount === interactiveReplacementToken.oldRefreshToken,
    );

    this.setState({
      showNotification:
        showNotification &&
        refreshTokenAccount === interactiveReplacementToken.oldRefreshToken,
    });
  }

  render() {
    return this.state.showNotification ? (
      <div className="interactive-replacement-token-notification">
        <img src="images/icons/red-triangle-exclaim.svg" />{' '}
        {this.context.t('custodySessionExpired')}
        <a
          data-testid="show-modal"
          onClick={() => this.props.showInteractiveReplacementTokenModal()}
        >
          {this.context.t('learnMore')}
        </a>
      </div>
    ) : null;
  }
}

InteractiveReplacementTokenNotification.propTypes = {
  keyring: PropTypes.object,
  address: PropTypes.string,
  isUnlocked: PropTypes.bool,
  interactiveReplacementToken: PropTypes.object,
  showInteractiveReplacementTokenModal: PropTypes.func,
  getCustodianToken: PropTypes.func,
  getCustodyAccountDetails: PropTypes.func,
};
