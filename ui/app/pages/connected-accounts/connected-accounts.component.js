import PropTypes from 'prop-types'
import React, { PureComponent } from 'react'
import { DEFAULT_ROUTE, CONNECTED_ROUTE } from '../../helpers/constants/routes'
import Popover from '../../components/ui/popover'
import ConnectedAccountsList from '../../components/app/connected-accounts-list'

export default class ConnectedAccounts extends PureComponent {
  static contextTypes = {
    t: PropTypes.func.isRequired,
  }

  static defaultProps = {
    accountToConnect: null,
    permissions: undefined,
  }

  static propTypes = {
    accountToConnect: PropTypes.object,
    activeTabOrigin: PropTypes.string.isRequired,
    addPermittedAccount: PropTypes.func.isRequired,
    connectedAccounts: PropTypes.array.isRequired,
    permissions: PropTypes.array,
    selectedAddress: PropTypes.string.isRequired,
    removePermittedAccount: PropTypes.func.isRequired,
    setSelectedAddress: PropTypes.func.isRequired,
    history: PropTypes.object.isRequired,
  }

  viewConnectedSites = () => {
    this.props.history.push(CONNECTED_ROUTE)
  }

  render () {
    const {
      accountToConnect,
      activeTabOrigin,
      addPermittedAccount,
      connectedAccounts,
      history,
      permissions,
      selectedAddress,
      removePermittedAccount,
      setSelectedAddress,
    } = this.props
    const { t } = this.context

    const connectedAccountsDescription = connectedAccounts.length > 1
      ? t('connectedAccountsDescriptionPlural', [connectedAccounts.length])
      : t('connectedAccountsDescriptionSingular')

    return (
      <Popover
        title={activeTabOrigin}
        subtitle={connectedAccounts.length ? connectedAccountsDescription : t('connectedAccountsEmptyDescription')}
        onClose={() => history.push(DEFAULT_ROUTE)}
        footerClassName="connected-accounts__footer"
      >
        <ConnectedAccountsList
          accountToConnect={accountToConnect}
          addPermittedAccount={addPermittedAccount}
          connectedAccounts={connectedAccounts}
          permissions={permissions}
          selectedAddress={selectedAddress}
          removePermittedAccount={removePermittedAccount}
          setSelectedAddress={setSelectedAddress}
        />
      </Popover>
    )
  }
}
