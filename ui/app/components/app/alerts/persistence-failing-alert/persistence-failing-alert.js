import React from 'react'
import { useDispatch, useSelector } from 'react-redux'

import { ALERT_STATE } from '../../../../ducks/alerts'
import {
  dismissAlert,
  getAlertState,
} from '../../../../ducks/alerts/persistence-failing'
import Popover from '../../../ui/popover'
import Button from '../../../ui/button'
import { useI18nContext } from '../../../../hooks/useI18nContext'

const { ERROR, LOADING } = ALERT_STATE

const PersistenceFailingAlert = () => {
  const t = useI18nContext()
  const dispatch = useDispatch()
  const alertState = useSelector(getAlertState)

  const onClose = () => dispatch(dismissAlert())

  const footer = (
    <>
      {alertState === ERROR ? (
        <div className="data-persistence-failing-alert__error">
          {t('failureMessage')}
        </div>
      ) : null}
      <div className="data-persistence-failing-alert__footer-row">
        <Button
          disabled={alertState === LOADING}
          onClick={onClose}
          type="secondary"
          className="data-persistence-failing-alert__footer-row-button"
        >
          {t('dismiss')}
        </Button>
      </div>
    </>
  )

  return (
    <Popover
      title={t('dataPersistenceFailingTitle')}
      onClose={onClose}
      contentClassName="data-persistence-failing-alert__content"
      footerClassName="data-persistence-failing-alert__footer"
      footer={footer}
    >
      <p>{t('dataPersistenceFailingDescription')}</p>
    </Popover>
  )
}

export default PersistenceFailingAlert
