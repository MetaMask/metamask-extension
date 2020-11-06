import React from 'react'
import { useDispatch, useSelector } from 'react-redux'
import PropTypes from 'prop-types'

import { ALERT_STATE } from '../../../../ducks/alerts'
import {
  dismissAlert,
  getAlertState,
  getNetworkName,
} from '../../../../ducks/alerts/invalid-custom-network'
import Popover from '../../../ui/popover'
import Button from '../../../ui/button'
import { useI18nContext } from '../../../../hooks/useI18nContext'
import { NETWORKS_ROUTE } from '../../../../helpers/constants/routes'

const { ERROR, LOADING } = ALERT_STATE

const InvalidCustomNetworkAlert = ({ history }) => {
  const t = useI18nContext()
  const dispatch = useDispatch()
  const alertState = useSelector(getAlertState)
  const networkName = useSelector(getNetworkName)

  const onClose = () => dispatch(dismissAlert())

  const footer = (
    <>
      {alertState === ERROR ? (
        <div className="invalid-custom-network-alert__error">
          {t('failureMessage')}
        </div>
      ) : null}
      <div className="invalid-custom-network-alert__footer-row">
        <Button
          disabled={alertState === LOADING}
          onClick={onClose}
          type="secondary"
          className="invalid-custom-network-alert__footer-row-button"
        >
          {t('dismiss')}
        </Button>
        <Button
          disabled={alertState === LOADING}
          onClick={async () => {
            await onClose()
            history.push(NETWORKS_ROUTE)
          }}
          type="primary"
          className="invalid-custom-network-alert__footer-row-button"
        >
          {t('settings')}
        </Button>
      </div>
    </>
  )

  return (
    <Popover
      title={t('invalidCustomNetworkAlertTitle')}
      onClose={onClose}
      contentClassName="invalid-custom-network-alert__content"
      footerClassName="invalid-custom-network-alert__footer"
      footer={footer}
    >
      <p>{t('invalidCustomNetworkAlertContent1', [networkName])}</p>
      <p>{t('invalidCustomNetworkAlertContent2')}</p>
      <p>
        {t('invalidCustomNetworkAlertContent3', [
          <span
            key="invalidCustomNetworkAlertContentLink"
            className="invalid-custom-network-alert__content-link"
            onClick={() =>
              global.platform.openTab({ url: 'https://chainid.network' })
            }
          >
            chainId.network
          </span>,
        ])}
      </p>
    </Popover>
  )
}

InvalidCustomNetworkAlert.propTypes = {
  history: PropTypes.object.isRequired,
}

export default InvalidCustomNetworkAlert
