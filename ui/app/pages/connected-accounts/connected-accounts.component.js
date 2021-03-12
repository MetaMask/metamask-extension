import PropTypes from 'prop-types';
import React, { PureComponent } from 'react';
import Popover from '../../components/ui/popover';
import ConnectedAccountsList from '../../components/app/connected-accounts-list';
import ConnectedAccountsPermissions from '../../components/app/connected-accounts-permissions';

export default class ConnectedAccounts extends PureComponent {
  static contextTypes = {
    t: PropTypes.func.isRequired,
  };

  static defaultProps = {
    accountToConnect: null,
    permissions: undefined,
  };

  static propTypes = {
    accountToConnect: PropTypes.object,
    activeTabOrigin: PropTypes.string.isRequired,
    connectAccount: PropTypes.func.isRequired,
    connectedAccounts: PropTypes.array.isRequired,
    mostRecentOverviewPage: PropTypes.string.isRequired,
    permissions: PropTypes.array,
    isActiveTabExtension: PropTypes.bool.isRequired,
    selectedAddress: PropTypes.string.isRequired,
    removePermittedAccount: PropTypes.func.isRequired,
    setSelectedAddress: PropTypes.func.isRequired,
    history: PropTypes.object.isRequired,
  };

  render() {
    const {
      accountToConnect,
      activeTabOrigin,
      isActiveTabExtension,
      connectAccount,
      connectedAccounts,
      history,
      mostRecentOverviewPage,
      permissions,
      selectedAddress,
      removePermittedAccount,
      setSelectedAddress,
    } = this.props;
    const { t } = this.context;

    const connectedAccountsDescription =
      connectedAccounts.length > 1
        ? t('connectedAccountsDescriptionPlural', [connectedAccounts.length])
        : t('connectedAccountsDescriptionSingular');

    return (
      <Popover
        title={
          isActiveTabExtension
            ? t('currentExtension')
            : new URL(activeTabOrigin).host
        }
        subtitle={
          connectedAccounts.length
            ? connectedAccountsDescription
            : t('connectedAccountsEmptyDescription')
        }
        onClose={() => history.push(mostRecentOverviewPage)}
        footerClassName="connected-accounts__footer"
        footer={<ConnectedAccountsPermissions permissions={permissions} />}
      >
        <ConnectedAccountsList
          accountToConnect={accountToConnect}
          connectAccount={connectAccount}
          connectedAccounts={connectedAccounts}
          selectedAddress={selectedAddress}
          removePermittedAccount={removePermittedAccount}
          setSelectedAddress={setSelectedAddress}
          shouldRenderListOptions
        />
      </Popover>
    );
  }
}
