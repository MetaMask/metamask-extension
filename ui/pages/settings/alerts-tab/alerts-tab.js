import React from 'react';
import PropTypes from 'prop-types';
import { useSelector } from 'react-redux';

import { ALERT_TYPES } from '../../../../shared/constants/alerts';
import Tooltip from '../../../components/ui/tooltip';
import ToggleButton from '../../../components/ui/toggle-button';
import { setAlertEnabledness } from '../../../store/actions';
import { getAlertEnabledness } from '../../../ducks/metamask/metamask';
import { useI18nContext } from '../../../hooks/useI18nContext';

const AlertSettingsEntry = ({ alertId, description, title }) => {
  const t = useI18nContext();
  const isEnabled = useSelector((state) => getAlertEnabledness(state)[alertId]);

  return (
    <>
      <span>{title}</span>
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
        onToggle={() => setAlertEnabledness(alertId, !isEnabled)}
        value={isEnabled}
      />
    </>
  );
};

AlertSettingsEntry.propTypes = {
  alertId: PropTypes.string.isRequired,
  description: PropTypes.string.isRequired,
  title: PropTypes.string.isRequired,
};

const AlertsTab = () => {
  const t = useI18nContext();

  const alertConfig = {
    [ALERT_TYPES.unconnectedAccount]: {
      title: t('alertSettingsUnconnectedAccount'),
      description: t('alertSettingsUnconnectedAccountDescription'),
    },
    [ALERT_TYPES.web3ShimUsage]: {
      title: t('alertSettingsWeb3ShimUsage'),
      description: t('alertSettingsWeb3ShimUsageDescription'),
    },
  };

  return (
    <div className="alerts-tab__body">
      {Object.entries(alertConfig).map(([alertId, { title, description }]) => (
        <AlertSettingsEntry
          alertId={alertId}
          description={description}
          key={alertId}
          title={title}
        />
      ))}
    </div>
  );
};

export default AlertsTab;
