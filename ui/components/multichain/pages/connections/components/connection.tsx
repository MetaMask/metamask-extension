import React from 'react'
import { useSelector } from 'react-redux'
import { useI18nContext } from '../../../../../hooks/useI18nContext'
import {
  getConnectedSubjectsForAllAddresses,
  getOrderedConnectedAccountsForActiveTab,
} from '../../../../../selectors/permissions'
import {
  getInternalAccounts,
  getOriginOfCurrentTab,
  getSelectedAccount,
} from '../../../../../selectors/selectors'
import { Tab } from '../../../../ui/tabs/index'
import Tabs from '../../../../ui/tabs/tabs.component'
import { mergeAccounts } from '../../../account-list-menu/account-list-menu'
import { AccountListItem } from '../../../index'
import { AccountType, ConnectedSites } from './connections.types'

export const ConnectionContent = () => {
  const CONNECTED_ACCOUNTS_TAB_KEY = 'connected-accounts'
  const connectedAccounts = useSelector(getOrderedConnectedAccountsForActiveTab)
  const selectedAccount = useSelector(getSelectedAccount)
  const connectedSites = useSelector(getConnectedSubjectsForAllAddresses);
    const internalAccounts = useSelector(getInternalAccounts);
  const currentTabOrigin = useSelector(getOriginOfCurrentTab)
  const mergedAccount = mergeAccounts(connectedAccounts, internalAccounts);

  const t = useI18nContext()
  return (
    <Tabs defaultActiveTabKey='connections'>
      {
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        <Tab
          tabKey={CONNECTED_ACCOUNTS_TAB_KEY}
          name={t('connectedaccountsTabKey')}
        >
          {mergedAccount.map((account: AccountType, index: number) => {
            const connectedSites: ConnectedSites = {};

            const connectedSite = connectedSites[account.address]?.find(
              ({ origin }) => origin === currentTabOrigin,
            )
            return (
              <AccountListItem
                identity={account}
                key={account.address}
                selected={selectedAccount.address === account.address}
                connectedAvatar={connectedSite?.iconUrl}
                connectedAvatarName={connectedSite?.name}
                showOptions
                currentTabOrigin={currentTabOrigin}
                // isActive={index === 0 ? t('active') : null} // BLOCKED: This prop will be added via PR-23006
              />
            )
          })}{' '}
        </Tab>
      }
    </Tabs>
  )
}
