import React from 'react';
import { MetaMetricsEventName } from '../../../../shared/constants/metametrics';
import { SECURITY_ALERTS_LEARN_MORE_LINK } from '../../../../shared/lib/ui-utils';
import { setSecurityAlertsEnabled } from '../../../store/actions';
import { getIsSecurityAlertsEnabled } from '../../../selectors';
import { getIsActiveShieldSubscription } from '../../../selectors/subscription';
import type { MetaMaskReduxState } from '../../../store/store';
import {
  createToggleItem,
  type ToggleItemDescriptionRenderer,
} from '../shared/create-toggle-item';

const selectIsDisabledByShieldSubscription = (state: MetaMaskReduxState) =>
  getIsActiveShieldSubscription(
    state as unknown as Parameters<typeof getIsActiveShieldSubscription>[0],
  );

const description: ToggleItemDescriptionRenderer = (t) =>
  t('securityAlertsDescription', [
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

export const SecurityAlertsItem = createToggleItem({
  name: 'SecurityAlertsItem',
  titleKey: 'securityAlerts',
  description,
  selector: getIsSecurityAlertsEnabled,
  action: setSecurityAlertsEnabled,
  dataTestId: 'securityAlert-toggle',
  containerDataTestId: 'securityAlert',
  disabledSelector: selectIsDisabledByShieldSubscription,
  trackEvent: {
    event: MetaMetricsEventName.SettingsUpdated,
    properties: (newValue) => ({
      // Analytics property name required by backend
      // eslint-disable-next-line @typescript-eslint/naming-convention
      blockaid_alerts_enabled: newValue,
    }),
  },
});
