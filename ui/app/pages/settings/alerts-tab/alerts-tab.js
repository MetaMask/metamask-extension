import React, { useContext } from 'react'
import PropTypes from 'prop-types'
import { useDispatch, useSelector } from 'react-redux'

import { ALERT_TYPES } from '../../../../../app/scripts/controllers/alert'
import { I18nContext } from '../../../contexts/i18n'
import Tooltip from '../../../components/ui/tooltip-v2'
import ToggleButton from '../../../components/ui/toggle-button'
import { setAlertEnabledness } from '../../../store/actions'
import { getAlertEnabledness } from '../../../ducks/metamask/metamask'

const AlertSettingsEntry = ({ alertId, description, title }) => {
  const t = useContext(I18nContext)
  const dispatch = useDispatch()
  const isEnabled = useSelector((state) => getAlertEnabledness(state)[alertId])

  return (
    <>
      <span>
        { title }
      </span>
      <Tooltip
        position="top"
        title={description}
        wrapperClassName="alerts-tab__description"
      >
        <i className="fa fa-info-circle" />
      </Tooltip>
      <ToggleButton
        offLabel={t('off')}
        onLabel={t('on')}
        onToggle={() => dispatch(setAlertEnabledness(alertId, !isEnabled))}
        value={isEnabled}
      />
    </>
  )
}

AlertSettingsEntry.propTypes = {
  alertId: PropTypes.string.isRequired,
  description: PropTypes.string.isRequired,
  title: PropTypes.string.isRequired,
}

const AlertsTab = () => {
  const t = useContext(I18nContext)

  const alertConfig = {
    [ALERT_TYPES.switchToConnected]: {
      title: t('alertSettingsSwitchToConnected'),
      description: t('alertSettingsSwitchToConnectedDescription'),
    },
    [ALERT_TYPES.unconnectedAccount]: {
      title: t('alertSettingsUnconnectedAccount'),
      description: t('alertSettingsUnconnectedAccountDescription'),
    },
  }

  return (
    <div className="alerts-tab__body">
      {
        Object.entries(alertConfig).map(([alertId, { title, description }]) => (
          <AlertSettingsEntry
            alertId={alertId}
            description={description}
            key={alertId}
            title={title}
          />
        ))
      }
    </div>
  )
}

export default AlertsTab
