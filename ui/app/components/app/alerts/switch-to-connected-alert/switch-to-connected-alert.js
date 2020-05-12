import React, { useContext, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'

import {
  ALERT_STATE,
  switchToAccount,
  dismissAlert,
  dismissAndDisableAlert,
  getAlertState,
} from '../../../../ducks/alerts/switch-to-connected'
import { getPermittedIdentitiesForCurrentTab } from '../../../../selectors'
import { I18nContext } from '../../../../contexts/i18n'
import Popover from '../../../ui/popover'
import Button from '../../../ui/button'
import Dropdown from '../../../ui/dropdown'
import Checkbox from '../../../ui/check-box'
import Tooltip from '../../../ui/tooltip-v2'

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
  const [dontShowThisAgain, setDontShowThisAgain] = useState(false)

  const onClose = async () => {
    return dontShowThisAgain
      ? await dispatch(dismissAndDisableAlert())
      : dispatch(dismissAlert())
  }

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
              onClick={onClose}
              type="secondary"
            >
              { t('dismiss') }
            </Button>
            <Button
              disabled={alertState === LOADING || alertState === ERROR || dontShowThisAgain}
              onClick={() => dispatch(switchToAccount(accountToSwitchTo))}
              type="primary"
            >
              { t('switchAccounts') }
            </Button>
          </div>
        </>
      )}
      footerClassName="switch-to-connected-alert__footer"
      onClose={onClose}
      subtitle={
        connectedAccounts.length > 1
          ? t('switchToConnectedAlertMultipleAccountsDescription')
          : t('switchToConnectedAlertSingleAccountDescription', [connectedAccounts[0].name])
      }
      title={t('notConnected')}
    >
      {
        connectedAccounts.length > 1
          ? (
            <Dropdown
              className="switch-to-connected-alert__dropdown"
              title="Switch to account"
              onChange={(address) => setAccountToSwitchTo(address)}
              options={options}
              selectedOption={accountToSwitchTo}
            />
          )
          : null
      }
      <div className="switch-to-connected-alert__checkbox-wrapper">
        <Checkbox
          id="switchToConnected_dontShowThisAgain"
          checked={dontShowThisAgain}
          className="switch-to-connected-alert__checkbox"
          onClick={() => setDontShowThisAgain((checked) => !checked)}
        />
        <label
          className="switch-to-connected-alert__checkbox-label"
          htmlFor="switchToConnected_dontShowThisAgain"
        >
          { t('dontShowThisAgain') }
          <Tooltip
            position="top"
            title={t('unconnectedAccountAlertDisableTooltip')}
            wrapperClassName="switch-to-connected-alert__checkbox-label-tooltip"
          >
            <i className="fa fa-info-circle" />
          </Tooltip>
        </label>
      </div>
    </Popover>
  )
}

export default SwitchToUnconnectedAccountAlert
