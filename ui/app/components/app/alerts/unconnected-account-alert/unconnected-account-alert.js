import React, { useContext } from 'react'
import { useDispatch, useSelector } from 'react-redux'

import {
  ALERT_STATE,
  connectAccount,
  dismissAlert,
  getAlertState,
} from '../../../../ducks/alerts/unconnected-account'
import { I18nContext } from '../../../../contexts/i18n'
import Popover from '../../../ui/popover'
import Button from '../../../ui/button'

const {
  ERROR,
  LOADING,
} = ALERT_STATE

const SwitchToUnconnectedAccountAlert = () => {
  const t = useContext(I18nContext)
  const dispatch = useDispatch()
  const alertState = useSelector(getAlertState)

  return (
    <Popover
      title={t('unconnectedAccountAlertTitle')}
      subtitle={t('unconnectedAccountAlertDescription')}
      onClose={() => dispatch(dismissAlert())}
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
              onClick={() => dispatch(dismissAlert())}
              type="secondary"
            >
              { t('dismiss') }
            </Button>
            <Button
              disabled={alertState === LOADING || alertState === ERROR}
              onClick={() => dispatch(connectAccount())}
              type="primary"
            >
              { t('connect') }
            </Button>
          </div>
        </>
      )}
      footerClassName="unconnected-account-alert__footer"
    />
  )
}

export default SwitchToUnconnectedAccountAlert
