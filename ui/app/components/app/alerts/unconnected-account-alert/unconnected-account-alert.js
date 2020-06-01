import React, { useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'

import {
  ALERT_STATE,
  connectAccount,
  dismissAlert,
  dismissAndDisableAlert,
  getAlertState,
} from '../../../../ducks/alerts/unconnected-account'
import Popover from '../../../ui/popover'
import Button from '../../../ui/button'
import Checkbox from '../../../ui/check-box'
import Tooltip from '../../../ui/tooltip-v2'
import { getSelectedIdentity, getOriginOfCurrentTab } from '../../../../selectors'
import { useI18nContext } from '../../../../hooks/useI18nContext'

const {
  ERROR,
  LOADING,
} = ALERT_STATE

const SwitchToUnconnectedAccountAlert = () => {
  const t = useI18nContext()
  const dispatch = useDispatch()
  const alertState = useSelector(getAlertState)
  const origin = useSelector(getOriginOfCurrentTab)
  const selectedIdentity = useSelector(getSelectedIdentity)
  const [dontShowThisAgain, setDontShowThisAgain] = useState(false)

  const onClose = async () => {
    return dontShowThisAgain
      ? await dispatch(dismissAndDisableAlert())
      : dispatch(dismissAlert())
  }

  const accountName = selectedIdentity?.name || t('thisAccount')
  const siteName = origin || t('thisSite')

  return (
    <Popover
      contentClassName="unconnected-account-alert__content"
      title={t('notConnected')}
      subtitle={t('unconnectedAccountAlertDescription', [ accountName, siteName ])}
      onClose={onClose}
      footer={(
        <>
          {
            alertState === ERROR
              ? (
                <div className="unconnected-account-alert__error">
                  { t('failureMessage') }
                </div>
              )
              : null
          }
          <div className="unconnected-account-alert__footer-buttons">
            <Button
              disabled={alertState === LOADING}
              onClick={onClose}
              type="secondary"
            >
              { t('dismiss') }
            </Button>
            <Button
              disabled={alertState === LOADING || alertState === ERROR || dontShowThisAgain }
              onClick={() => dispatch(connectAccount())}
              type="primary"
            >
              { t('connect') }
            </Button>
          </div>
        </>
      )}
      footerClassName="unconnected-account-alert__footer"
    >
      <Checkbox
        id="unconnectedAccount_dontShowThisAgain"
        checked={dontShowThisAgain}
        className="unconnected-account-alert__checkbox"
        onClick={() => setDontShowThisAgain((checked) => !checked)}
      />
      <label
        className="unconnected-account-alert__checkbox-label"
        htmlFor="unconnectedAccount_dontShowThisAgain"
      >
        { t('dontShowThisAgain') }
        <Tooltip
          position="top"
          title={t('unconnectedAccountAlertDisableTooltip')}
          wrapperClassName="unconnected-account-alert__checkbox-label-tooltip"
        >
          <i className="fa fa-info-circle" />
        </Tooltip>
      </label>
    </Popover>
  )
}

export default SwitchToUnconnectedAccountAlert
