import React, { useContext, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'

import {
  ALERT_STATE,
  switchToAccount,
  dismissAlert,
  getAlertState,
} from '../../../../ducks/alerts/switch-to-connected'
import { getPermittedIdentitiesForCurrentTab } from '../../../../selectors'
import { I18nContext } from '../../../../contexts/i18n'
import Popover from '../../../ui/popover'
import Button from '../../../ui/button'
import Dropdown from '../../../ui/dropdown'

const {
  ERROR,
  LOADING,
} = ALERT_STATE

const SwitchToUnconnectedAccountAlert = () => {
  const t = useContext(I18nContext)
  const dispatch = useDispatch()
  const alertState = useSelector(getAlertState)
  const connectedAccounts = useSelector(getPermittedIdentitiesForCurrentTab)
  const [accountToSwitchTo, setAccountToSwitchTo] = useState(connectedAccounts[0].address)

  const options = connectedAccounts.map((account) => {
    return { name: account.name, value: account.address }
  })

  return (
    <Popover
      contentClassName="switch-to-connected-alert__content"
      footer={(
        <>
          {
            alertState === ERROR
              ? (
                <div className="switch-to-connected-alert__error">
                  { t('failureMessage') }
                </div>
              )
              : null
          }
          <div className="switch-to-connected-alert__footer-buttons">
            <Button
              disabled={alertState === LOADING}
              onClick={() => dispatch(dismissAlert())}
              type="secondary"
            >
              { t('dismiss') }
            </Button>
            <Button
              disabled={alertState === LOADING || alertState === ERROR}
              onClick={() => dispatch(switchToAccount(accountToSwitchTo))}
              type="primary"
            >
              { t('switchAccounts') }
            </Button>
          </div>
        </>
      )}
      footerClassName="switch-to-connected-alert__footer"
      onClose={() => dispatch(dismissAlert())}
      subtitle={
        t(
          'switchToConnectedAlertDescription',
          [
            connectedAccounts.length > 1
              ? t('switchToMultipleNumberOfAccounts', [connectedAccounts.length])
              : t('switchToOneAccount'),
          ]
        )
      }
      title={t('notConnected')}
    >
      <Dropdown
        className="switch-to-connected-alert__dropdown"
        title="Switch to account"
        onChange={(address) => setAccountToSwitchTo(address)}
        options={options}
        selectedOption={accountToSwitchTo}
      />
    </Popover>
  )
}

export default SwitchToUnconnectedAccountAlert
