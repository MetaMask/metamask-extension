/* eslint-disable require-unicode-regexp */
import {
  ALERTS_ROUTE,
  ADVANCED_ROUTE,
  SECURITY_ROUTE,
  GENERAL_ROUTE,
  ABOUT_US_ROUTE,
  NETWORKS_ROUTE,
  CONTACT_LIST_ROUTE,
  EXPERIMENTAL_ROUTE,
  ///: BEGIN:ONLY_INCLUDE_IN(flask)
  SNAPS_LIST_ROUTE,
  SNAPS_VIEW_ROUTE,
  ///: END:ONLY_INCLUDE_IN
} from '../constants/routes';

function showHideSettings(t, settings) {
  if (!process.env.COLLECTIBLES_V1) {
    return settings.filter(
      (e) =>
        e.section !== t('enableOpenSeaAPI') &&
        e.section !== t('useCollectibleDetection'),
    );
  }
  return settings;
}

export function getSettingsRoutes(t) {
  const settingsRoutesList = [
    {
      tab: t('general'),
      section: t('currencyConversion'),
      description: '',
      route: `${GENERAL_ROUTE}#currency-conversion`,
      icon: 'fa fa-cog',
      id: 1,
    },
    {
      tab: t('general'),
      section: t('primaryCurrencySetting'),
      description: t('primaryCurrencySettingDescription'),
      route: `${GENERAL_ROUTE}#primary-currency`,
      icon: 'fa fa-cog',
      id: 2,
    },
    {
      tab: t('general'),
      section: t('currentLanguage'),
      description: '',
      route: `${GENERAL_ROUTE}#current-language`,
      icon: 'fa fa-cog',
      id: 3,
    },
    {
      tab: t('general'),
      section: t('accountIdenticon'),
      description: '',
      route: `${GENERAL_ROUTE}#account-identicon`,
      icon: 'fa fa-cog',
      id: 4,
    },
    {
      tab: t('general'),
      section: t('hideZeroBalanceTokens'),
      description: '',
      route: `${GENERAL_ROUTE}#zero-balancetokens`,
      icon: 'fa fa-cog',
      id: 5,
    },
    {
      tab: t('advanced'),
      section: t('stateLogs'),
      description: t('stateLogsDescription'),
      route: `${ADVANCED_ROUTE}#state-logs`,
      icon: 'fas fa-sliders-h',
      id: 6,
    },
    {
      tab: t('advanced'),
      section: t('syncWithMobile'),
      description: '',
      route: `${ADVANCED_ROUTE}#sync-withmobile`,
      icon: 'fas fa-sliders-h',
      id: 7,
    },
    {
      tab: t('advanced'),
      section: t('resetAccount'),
      description: t('resetAccountDescription'),
      route: `${ADVANCED_ROUTE}#reset-account`,
      icon: 'fas fa-sliders-h',
      id: 8,
    },
    {
      tab: t('advanced'),
      section: t('showAdvancedGasInline'),
      description: t('showAdvancedGasInlineDescription'),
      route: `${ADVANCED_ROUTE}#advanced-gascontrols`,
      icon: 'fas fa-sliders-h',
      id: 9,
    },
    {
      tab: t('advanced'),
      section: t('showHexData'),
      description: t('showHexDataDescription'),
      route: `${ADVANCED_ROUTE}#show-hexdata`,
      icon: 'fas fa-sliders-h',
      id: 10,
    },
    {
      tab: t('advanced'),
      section: t('showFiatConversionInTestnets'),
      description: t('showFiatConversionInTestnetsDescription'),
      route: `${ADVANCED_ROUTE}#conversion-testnetworks`,
      icon: 'fas fa-sliders-h',
      id: 11,
    },
    {
      tab: t('advanced'),
      section: t('showTestnetNetworks'),
      description: t('showTestnetNetworksDescription'),
      route: `${ADVANCED_ROUTE}#show-testnets`,
      icon: 'fas fa-sliders-h',
      id: 12,
    },
    {
      tab: t('advanced'),
      section: t('nonceField'),
      description: t('nonceFieldDescription'),
      route: `${ADVANCED_ROUTE}#customize-nonce`,
      icon: 'fas fa-sliders-h',
      id: 13,
    },
    {
      tab: t('advanced'),
      section: t('autoLockTimeLimit'),
      description: t('autoLockTimeLimitDescription'),
      route: `${ADVANCED_ROUTE}#autolock-timer`,
      icon: 'fas fa-sliders-h',
      id: 14,
    },
    {
      tab: t('advanced'),
      section: t('syncWithThreeBox'),
      description: t('syncWithThreeBoxDescription'),
      route: `${ADVANCED_ROUTE}#sync-with3box`,
      icon: 'fas fa-sliders-h',
      id: 15,
    },
    {
      tab: t('advanced'),
      section: t('ipfsGateway'),
      description: t('ipfsGatewayDescription'),
      route: `${ADVANCED_ROUTE}#ipfs-gateway`,
      icon: 'fas fa-sliders-h',
      id: 16,
    },
    {
      tab: t('advanced'),
      section: t('preferredLedgerConnectionType'),
      description: t('preferredLedgerConnectionType'),
      route: `${ADVANCED_ROUTE}#ledger-connection`,
      icon: 'fas fa-sliders-h',
      id: 17,
    },
    {
      tab: t('advanced'),
      section: t('dismissReminderField'),
      description: t('dismissReminderDescriptionField'),
      route: `${ADVANCED_ROUTE}#dimiss-secretrecovery`,
      icon: 'fas fa-sliders-h',
      id: 18,
    },
    {
      tab: t('contacts'),
      section: t('contacts'),
      description: t('contacts'),
      route: CONTACT_LIST_ROUTE,
      icon: 'fa fa-address-book',
      id: 19,
    },
    ///: BEGIN:ONLY_INCLUDE_IN(flask)
    {
      tab: t('snaps'),
      section: t('snaps'),
      description: t('snaps'),
      route: SNAPS_LIST_ROUTE,
      icon: 'fa fa-flask',
    },
    ///: END:ONLY_INCLUDE_IN
    {
      tab: t('securityAndPrivacy'),
      section: t('revealSeedWords'),
      description: t('revealSeedWords'),
      route: `${SECURITY_ROUTE}#reveal-secretrecovery`,
      icon: 'fa fa-lock',
      id: 20,
    },
    {
      tab: t('securityAndPrivacy'),
      section: t('showIncomingTransactions'),
      description: t('showIncomingTransactionsDescription'),
      route: `${SECURITY_ROUTE}#incoming-transaction`,
      icon: 'fa fa-lock',
      id: 21,
    },
    {
      tab: t('securityAndPrivacy'),
      section: t('usePhishingDetection'),
      description: t('usePhishingDetectionDescription'),
      route: `${SECURITY_ROUTE}#phishing-detection`,
      icon: 'fa fa-lock',
      id: 22,
    },
    {
      tab: t('securityAndPrivacy'),
      section: t('participateInMetaMetrics'),
      description: t('participateInMetaMetricsDescription'),
      route: `${SECURITY_ROUTE}#metrametrics`,
      icon: 'fa fa-lock',
      id: 23,
    },
    {
      tab: t('alerts'),
      section: t('alertSettingsUnconnectedAccount'),
      description: t('alertSettingsUnconnectedAccount'),
      route: `${ALERTS_ROUTE}#unconnected-account`,
      icon: 'fa fa-bell',
      id: 24,
    },
    {
      tab: t('alerts'),
      section: t('alertSettingsWeb3ShimUsage'),
      description: t('alertSettingsWeb3ShimUsage'),
      route: `${ALERTS_ROUTE}#web3-shimusage`,
      icon: 'fa fa-bell',
      id: 25,
    },
    {
      tab: t('networks'),
      section: t('mainnet'),
      description: t('mainnet'),
      route: `${NETWORKS_ROUTE}#networks-mainnet`,
      icon: 'fa fa-plug',
      id: 26,
    },
    {
      tab: t('networks'),
      section: t('ropsten'),
      description: t('ropsten'),
      route: `${NETWORKS_ROUTE}#networks-ropsten`,
      icon: 'fa fa-plug',
      id: 27,
    },
    {
      tab: t('networks'),
      section: t('rinkeby'),
      description: t('rinkeby'),
      route: `${NETWORKS_ROUTE}#networks-rinkeby`,
      icon: 'fa fa-plug',
      id: 28,
    },
    {
      tab: t('networks'),
      section: t('goerli'),
      description: t('goerli'),
      route: `${NETWORKS_ROUTE}#networks-goerli`,
      icon: 'fa fa-plug',
      id: 29,
    },
    {
      tab: t('networks'),
      section: t('kovan'),
      description: t('kovan'),
      route: `${NETWORKS_ROUTE}#networtks-kovan`,
      icon: 'fa fa-plug',
      id: 30,
    },
    {
      tab: t('networks'),
      section: t('localhost'),
      description: t('localhost'),
      route: `${NETWORKS_ROUTE}#network-localhost`,
      icon: 'fa fa-plug',
      id: 31,
    },
    {
      tab: t('experimental'),
      section: t('useTokenDetection'),
      description: t('useTokenDetectionDescription'),
      route: `${EXPERIMENTAL_ROUTE}#token-description`,
      icon: 'fa fa-flask',
      id: 32,
    },
    {
      tab: t('experimental'),
      section: t('enableOpenSeaAPI'),
      description: t('enableOpenSeaAPIDescription'),
      route: `${EXPERIMENTAL_ROUTE}#opensea-api`,
      icon: 'fa fa-flask',
      id: 33,
    },
    {
      tab: t('experimental'),
      section: t('useCollectibleDetection'),
      description: t('useCollectibleDetectionDescription'),
      route: `${EXPERIMENTAL_ROUTE}#autodetect-nfts`,
      icon: 'fa fa-flask',
      id: 34,
    },

    {
      tab: t('about'),
      section: t('metamaskVersion'),
      description: t('builtAroundTheWorld'),
      route: `${ABOUT_US_ROUTE}#version`,
      icon: 'fa fa-info-circle',
      id: 35,
    },
    {
      tab: t('about'),
      section: t('links'),
      description: '',
      route: `${ABOUT_US_ROUTE}#links`,
      icon: 'fa fa-info-circle',
      id: 36,
    },
    {
      tab: t('about'),
      section: t('privacyMsg'),
      description: t('privacyMsg'),
      route: `${ABOUT_US_ROUTE}#privacy-policy`,
      icon: 'fa fa-info-circle',
      id: 37,
    },
    {
      tab: t('about'),
      section: t('terms'),
      description: t('terms'),
      route: `${ABOUT_US_ROUTE}#terms`,
      icon: 'fa fa-info-circle',
      id: 38,
    },

    {
      tab: t('about'),
      section: t('attributions'),
      description: t('attributions'),
      route: `${ABOUT_US_ROUTE}#attributions`,
      icon: 'fa fa-info-circle',
      id: 39,
    },

    {
      tab: t('about'),
      section: t('supportCenter'),
      description: t('supportCenter'),
      route: `${ABOUT_US_ROUTE}#supportcenter`,
      icon: 'fa fa-info-circle',
      id: 40,
    },

    {
      tab: t('about'),
      section: t('visitWebSite'),
      description: t('visitWebSite'),
      route: `${ABOUT_US_ROUTE}#visitwebsite`,
      icon: 'fa fa-info-circle',
      id: 41,
    },

    {
      tab: t('about'),
      section: t('contactUs'),
      description: t('contactUs'),
      route: `${ABOUT_US_ROUTE}#contactus`,
      icon: 'fa fa-info-circle',
      id: 42,
    },
  ];

  // TODO: write to json file?
  return showHideSettings(t, settingsRoutesList);
}

function getFilteredSettingsRoutes(t, tabName) {
  return getSettingsRoutes(t).filter((s) => s.tab === tabName);
}

export function getSettingsSectionNumber(t, tabName) {
  return getSettingsRoutes(t).filter((s) => s.tab === tabName).length;
}

export function handleSettingsRefs(t, tabName, settingsRefs) {
  const settingsSearchJsonFiltered = getFilteredSettingsRoutes(t, tabName);
  const settingsRefsIndex = settingsSearchJsonFiltered.findIndex(
    (s) => s.route.substring(1) === window.location.hash.substring(1),
  );

  if (
    settingsRefsIndex !== -1 &&
    settingsRefs[settingsRefsIndex].current !== null
  ) {
    settingsRefs[settingsRefsIndex].current.scrollIntoView({
      behavior: 'smooth',
    });
    settingsRefs[settingsRefsIndex].current.focus();
    const historySettingsUrl = window.location.hash.split('#')[1];
    window.location.hash = historySettingsUrl;
  }
}

export function handleHooksSettingsRefs(t, tabName, settingsRefs, itemIndex) {
  const settingsSearchJsonFiltered = getFilteredSettingsRoutes(t, tabName);
  const settingsRefsIndex = settingsSearchJsonFiltered.findIndex(
    (s) => s.route.substring(1) === window.location.hash.substring(1),
  );

  if (
    settingsRefsIndex !== -1 &&
    settingsRefs !== null &&
    itemIndex === settingsRefsIndex
  ) {
    settingsRefs.current.scrollIntoView({
      behavior: 'smooth',
    });
    settingsRefs.current.focus();
    const historySettingsUrl = window.location.hash.split('#')[1];
    window.location.hash = historySettingsUrl;
  }
}

function colorText(menuElement, regex) {
  if (menuElement !== null) {
    let elemText = menuElement?.innerHTML;
    elemText = elemText.replace('&amp;', '&');
    elemText = elemText.replace(
      /(<span style="background:#ffd33d">|<\/span>)/gim,
      '',
    );
    menuElement.innerHTML = elemText.replace(
      regex,
      '<span style="background:#ffd33d">$&</span>',
    );
  }
}
export function highlightSearchedText() {
  const searchElem = document.getElementById('search-settings');
  const searchRegex = new RegExp(searchElem.value, 'gi');
  const results = document.querySelectorAll(
    '.settings-page__header__search__list__item',
  );

  [...results].forEach((element) => {
    const menuTabElement = element.querySelector(
      '.settings-page__header__search__list__item__tab',
    );
    const menuSectionElement = element.querySelector(
      '.settings-page__header__search__list__item__section',
    );

    colorText(menuTabElement, searchRegex);
    colorText(menuSectionElement, searchRegex);
  });
}
