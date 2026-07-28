import React, { useMemo } from 'react';
import { useSelector } from 'react-redux';
import { SettingItemConfig } from '../types';
import { SettingsTab, createToggleItem, createSelectItem } from '../shared';
import {
  getIsWebWidgetOnXFeatureEnabled,
  getManageInstitutionalWallets,
  getShowExtensionInFullSizeView,
  getShowWebWidgetOnX,
  getTheme,
} from '../../../selectors';
import {
  setManageInstitutionalWallets,
  setShowExtensionInFullSizeView,
  setShowWebWidgetOnX,
} from '../../../store/actions';
import { MetaMetricsEventName } from '../../../../shared/constants/metametrics';
import { ThemeType } from '../../../../shared/constants/preferences';
import { THEME_ROUTE, LANGUAGE_ROUTE } from '../../../helpers/constants/routes';
import type { MetaMaskReduxState } from '../../../store/store';
// TODO: Remove restricted import
// eslint-disable-next-line import-x/no-restricted-paths
import locales from '../../../../app/_locales/index.json';
import { PREFERENCES_ITEMS } from '../search-config';
import { AccountIdenticonItem } from './account-identicon-item';
import { LocalCurrencyItem } from './local-currency-item';
import { ShowDefaultAddressItem } from './show-default-address-item';
import { THEME_LABEL_MAP } from './theme-utils';

const localeMap = new Map(locales.map(({ code, name }) => [code, name]));

const ThemeItem = createSelectItem({
  name: 'ThemeItem',
  titleKey: PREFERENCES_ITEMS.theme,
  valueSelector: getTheme,
  formatValue: (theme, t) =>
    t(THEME_LABEL_MAP[theme as ThemeType] ?? THEME_LABEL_MAP[ThemeType.os]),
  route: THEME_ROUTE,
});

const LanguageItem = createSelectItem({
  name: 'LanguageItem',
  titleKey: PREFERENCES_ITEMS.language,
  valueSelector: (state: MetaMaskReduxState) => state.metamask.currentLocale,
  formatValue: (locale) => localeMap.get(locale) ?? locale,
  route: LANGUAGE_ROUTE,
});

const ShowExtensionItem = createToggleItem({
  name: 'ShowExtensionItem',
  titleKey: PREFERENCES_ITEMS['show-extension'],
  descriptionKey: 'showExtensionInFullSizeViewDescription',
  selector: getShowExtensionInFullSizeView,
  action: setShowExtensionInFullSizeView,
  dataTestId: 'show-extension-in-full-size-view',
  trackEvent: {
    event: MetaMetricsEventName.SettingsUpdated,
    properties: (newValue) => ({
      /* eslint-disable @typescript-eslint/naming-convention */
      settings_group: 'preferences_and_display',
      settings_type: 'open_full_screen',
      old_value: !newValue,
      new_value: newValue,
      open_full_screen: newValue,
      /* eslint-enable @typescript-eslint/naming-convention */
      location: 'Preferences and Display Settings',
    }),
  },
});

const ShowWebWidgetOnXItem = createToggleItem({
  name: 'ShowWebWidgetOnXItem',
  titleKey: PREFERENCES_ITEMS['show-x-widget'],
  descriptionKey: 'showWebWidgetOnXDescription',
  selector: getShowWebWidgetOnX,
  action: setShowWebWidgetOnX,
  dataTestId: 'show-metamask-widget-on-x',
  trackEventProperty: 'show_metamask_widget_on_x',
});

const ManageInstitutionalWalletItem = createToggleItem({
  name: 'ManageInstitutionalWalletItem',
  titleKey: PREFERENCES_ITEMS['manage-institutional-wallet'],
  descriptionKey: 'manageInstitutionalWalletsDescription',
  selector: getManageInstitutionalWallets,
  action: setManageInstitutionalWallets,
  dataTestId: 'manage-institutional-wallets',
  trackEventProperty: 'manage_institutional_wallets',
});

const PreferencesAndDisplayTab = () => {
  const isWebWidgetOnXFeatureEnabled = useSelector(
    getIsWebWidgetOnXFeatureEnabled,
  );

  /** Registry of setting items for the page. Add new items here. */
  const items = useMemo<SettingItemConfig[]>(
    () => [
      { id: 'theme', component: ThemeItem },
      { id: 'language', component: LanguageItem },
      { id: 'local-currency', component: LocalCurrencyItem },
      { id: 'account-identicon', component: AccountIdenticonItem },
      { id: 'show-default-address', component: ShowDefaultAddressItem },
      ...(isWebWidgetOnXFeatureEnabled
        ? [{ id: 'show-x-widget', component: ShowWebWidgetOnXItem }]
        : []),
      { id: 'show-extension', component: ShowExtensionItem },
      {
        id: 'manage-institutional-wallet',
        component: ManageInstitutionalWalletItem,
      },
    ],
    [isWebWidgetOnXFeatureEnabled],
  );

  return <SettingsTab items={items} />;
};

export default PreferencesAndDisplayTab;
