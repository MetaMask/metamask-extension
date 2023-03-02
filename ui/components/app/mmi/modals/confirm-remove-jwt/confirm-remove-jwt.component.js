import React, { Component } from 'react';
import PropTypes from 'prop-types';
import Modal from '../../../modal';
import CustodyAccountList from '../../../../../pages/create-account/mmi/connect-custody/account-list';

export default class ConfirmRemoveJWT extends Component {
  static propTypes = {
    hideModal: PropTypes.func.isRequired,
    removeAccount: PropTypes.func.isRequired,
    token: PropTypes.string.isRequired,
    custodyAccountDetails: PropTypes.array.isRequired,
    accounts: PropTypes.array.isRequired,
  };

  static contextTypes = {
    t: PropTypes.func,
  };

  state = {
    showMore: false,
    tokenAccounts: [],
  };

  componentDidMount() {
    const { custodyAccountDetails, accounts, token } = this.props;

    const tokenAccounts = custodyAccountDetails
      .filter((item) =>
        accounts.find((acc) => acc.address === item.address.toLowerCase()),
      )
      .map((item) => ({
        address: item.address,
        name: item.name,
        labels: item.labels,
        balance: accounts.find(
          (acc) => acc.address === item.address.toLowerCase(),
        )?.balance,
        token:
          item.authDetails?.token ||
          item.authDetails?.jwt ||
          item.authDetails?.refreshToken,
      }))
      .filter((acc) => acc.token === token);
    this.setState({ tokenAccounts });
  }

  handleRemove = () => {
    const { tokenAccounts } = this.state;
    const { removeAccount } = this.props;
    tokenAccounts.forEach(async (account) => {
      await removeAccount(account.address.toLowerCase());
    });
    this.props.hideModal();
  };

  handleCancel = () => {
    this.props.hideModal();
  };

  renderSelectedJWT() {
    const { showMore } = this.state;
    const { token } = this.props;
    return (
      <div>
        <div className="confirm-action-jwt__jwt">
          <span>{showMore && token ? token : `...${token.slice(-9)}`}</span>
        </div>
        {!showMore && (
          <div className="confirm-action-jwt__show-more">
            <a
              rel="noopener noreferrer"
              onClick={() => {
                this.setState({ showMore: true });
              }}
            >
              Show more
            </a>
          </div>
        )}
      </div>
    );
  }

  render() {
    const { t } = this.context;
    const { tokenAccounts } = this.state;

    return (
      <Modal
        headerText={`${t('removeJWT')}?`}
        onClose={this.handleCancel}
        onSubmit={this.handleRemove}
        onCancel={this.handleCancel}
        submitText={t('remove')}
        cancelText={t('nevermind')}
        submitType="primary"
      >
        <div>
          {this.renderSelectedJWT()}
          <div className="confirm-action-jwt__description">
            {t('removeJWTDescription')}
          </div>
          <div className="confirm-action-jwt__accounts-list">
            <CustodyAccountList accounts={tokenAccounts} rawList />
          </div>
        </div>
      </Modal>
    );
  }
}
