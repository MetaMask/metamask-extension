import React, { useState } from 'react'
import SelectedAccount from '../selected-account'
import ConnectedStatusIndicator from '../connected-status-indicator'
import AccountDetailsDropdown from '../dropdowns/account-details-dropdown'
import { getEnvironmentType } from '../../../../../app/scripts/lib/util'
import { ENVIRONMENT_TYPE_POPUP } from '../../../../../app/scripts/lib/enums'
import { CONNECTED_ACCOUNTS_ROUTE } from '../../../helpers/constants/routes'
import { useI18nContext } from '../../../hooks/useI18nContext'
import { useMetricEvent } from '../../../hooks/useMetricEvent'
import { useHistory } from 'react-router-dom'

export default function MenuBar () {
  const t = useI18nContext()
  const openAccountOptionsEvent = useMetricEvent({
    eventOpts: {
      category: 'Navigation',
      action: 'Home',
      name: 'Opened Account Options',
    },
  })
  const history = useHistory()
  const [accountDetailsMenuOpen, setAccountDetailsMenuOpen] = useState(false)

  return (
    <div className="menu-bar">
      {
        getEnvironmentType() === ENVIRONMENT_TYPE_POPUP
          ? <ConnectedStatusIndicator onClick={() => history.push(CONNECTED_ACCOUNTS_ROUTE)} />
          : null
      }

      <SelectedAccount />

      <button
        className="fas fa-ellipsis-v menu-bar__account-options"
        title={t('accountOptions')}
        onClick={() => {
          openAccountOptionsEvent()
          setAccountDetailsMenuOpen(true)
        }}
      />

      {
        accountDetailsMenuOpen && (
          <AccountDetailsDropdown
            onClose={() => setAccountDetailsMenuOpen(false)}
          />
        )
      }
    </div>
  )
}
