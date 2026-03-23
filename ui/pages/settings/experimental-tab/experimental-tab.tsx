import React, { useMemo } from 'react';
import { MetaMetricsEventName } from '../../../../shared/constants/metametrics';
import { isExperimental, isFlask } from '../../../../shared/lib/build-types';
import {
  getFeatureNotificationsEnabled,
  getIsAddSnapAccountEnabled,
  getIsWatchEthereumAccountEnabled,
} from '../../../selectors';
import {
  setAddSnapAccountEnabled,
  setFeatureNotificationsEnabled,
  setWatchEthereumAccountEnabled,
} from '../../../store/actions';
import { SettingItemConfig } from '../../settings-v2/types';
import { SettingsTab, createToggleItem } from '../../settings-v2/shared';

const NotificationsItem = createToggleItem({
  name: 'NotificationsItem',
  titleKey: 'notificationsFeatureToggle',
  descriptionKey: 'notificationsFeatureToggleDescription',
  selector: getFeatureNotificationsEnabled,
  action: setFeatureNotificationsEnabled,
  dataTestId: 'toggle-notifications',
});

const KeyringSnapsItem = createToggleItem({
  name: 'KeyringSnapsItem',
  titleKey: 'addSnapAccountToggle',
  descriptionKey: 'addSnapAccountsDescription',
  selector: getIsAddSnapAccountEnabled,
  action: setAddSnapAccountEnabled,
  dataTestId: 'add-account-snap-toggle-button',
  containerDataTestId: 'add-account-snap-toggle-div',
  trackEvent: {
    event: MetaMetricsEventName.AddSnapAccountEnabled,
    properties: (newValue) => ({ enabled: newValue }),
  },
});

const WatchAccountItem = createToggleItem({
  name: 'WatchAccountItem',
  titleKey: 'watchEthereumAccountsToggle',
  formatDescription: (t) =>
    t('watchEthereumAccountsDescription', [
      <a
        key="watch-account-feedback-form__link-text"
        href="https://www.getfeedback.com/r/7Je8ckkq"
        target="_blank"
        rel="noopener noreferrer"
      >
        {t('form')}
      </a>,
    ]),
  selector: getIsWatchEthereumAccountEnabled,
  action: setWatchEthereumAccountEnabled,
  dataTestId: 'watch-account-toggle',
  containerDataTestId: 'watch-account-toggle-div',
  trackEvent: {
    event: MetaMetricsEventName.WatchEthereumAccountsToggled,
    properties: (newValue) => ({ enabled: newValue }),
  },
});

const ExperimentalTab = () => {
  const items = useMemo<SettingItemConfig[]>(() => {
    const result: SettingItemConfig[] = [];

    if (process.env.NOTIFICATIONS) {
      result.push({ id: 'notifications', component: NotificationsItem });
    }

    result.push({ id: 'keyring-snaps', component: KeyringSnapsItem });

    if (isFlask() || isExperimental()) {
      result.push({ id: 'watch-account', component: WatchAccountItem });
    }

    return result;
  }, []);

  return <SettingsTab items={items} tabMessageKey="experimental" />;
};

export default ExperimentalTab;
