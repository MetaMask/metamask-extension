import React, { useContext } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  MetaMetricsEventCategory,
  MetaMetricsEventName,
} from '../../../../shared/constants/metametrics';
import { SECURITY_ALERTS_LEARN_MORE_LINK } from '../../../../shared/lib/ui-utils';
import { useI18nContext } from '../../../hooks/useI18nContext';
import { MetaMetricsContext } from '../../../contexts/metametrics';
import { setSecurityAlertsEnabled } from '../../../store/actions';
import { getIsSecurityAlertsEnabled } from '../../../selectors';
import { getIsActiveShieldSubscription } from '../../../selectors/subscription';
import { SettingsToggleItem } from '../../settings/settings-toggle-item';

export const SecurityAlertsItem = () => {
  const t = useI18nContext();
  const dispatch = useDispatch();
  const { trackEvent } = useContext(MetaMetricsContext);
  const value = useSelector(getIsSecurityAlertsEnabled);
  const hasActiveShieldSubscription = useSelector(
    getIsActiveShieldSubscription,
  );

  const description = t('securityAlertsDescription', [
    <a
      key="learn_more_link"
      href={SECURITY_ALERTS_LEARN_MORE_LINK}
      rel="noopener noreferrer"
      target="_blank"
      className="font-medium text-primary-default"
    >
      {t('learnMoreUpperCase')}
    </a>,
  ]);

  return (
    <SettingsToggleItem
      title={t('securityAlerts')}
      description={description}
      value={value}
      onToggle={(oldValue: boolean) => {
        const newValue = !oldValue;
        trackEvent({
          category: MetaMetricsEventCategory.Settings,
          event: MetaMetricsEventName.SettingsUpdated,
          properties: {
            // Analytics property name required by backend
            // eslint-disable-next-line @typescript-eslint/naming-convention
            blockaid_alerts_enabled: newValue,
          },
        });
        dispatch(setSecurityAlertsEnabled(newValue));
      }}
      containerDataTestId="securityAlert"
      dataTestId="securityAlert-toggle"
      disabled={hasActiveShieldSubscription}
    />
  );
};
