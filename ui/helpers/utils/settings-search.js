import {
  ALERTS_ROUTE,
  ADVANCED_ROUTE,
  SECURITY_ROUTE,
  GENERAL_ROUTE,
  ABOUT_US_ROUTE,
  NETWORKS_ROUTE,
  CONTACT_LIST_ROUTE,
  EXPERIMENTAL_ROUTE,
} from '../constants/routes';

const MENU_TAB = 'menu-tab';
const MENU_SECTION = 'menu-section';

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
      image: 'settings.svg',
    },
    {
      tab: t('general'),
      section: t('primaryCurrencySetting'),
      description: t('primaryCurrencySettingDescription'),
      route: `${GENERAL_ROUTE}#primary-currency`,
      image: 'settings.svg',
    },
    {
      tab: t('general'),
      section: t('currentLanguage'),
      description: '',
      route: `${GENERAL_ROUTE}#current-language`,
      image: 'settings.svg',
    },
    {
      tab: t('general'),
      section: t('blockiesIdenticon'),
      description: '',
      route: `${GENERAL_ROUTE}#blockies-identicon`,
      image: 'settings.svg',
    },
    {
      tab: t('general'),
      section: t('hideZeroBalanceTokens'),
      description: '',
      route: `${GENERAL_ROUTE}#zero-balancetokens`,
      image: 'settings.svg',
    },
    {
      tab: t('advanced'),
      section: t('stateLogs'),
      description: t('stateLogsDescription'),
      route: `${ADVANCED_ROUTE}#state-logs`,
      image: 'settings.svg',
    },
    {
      tab: t('advanced'),
      section: t('syncWithMobile'),
      description: '',
      route: `${ADVANCED_ROUTE}#sync-withmobile`,
      image: 'settings.svg',
    },
    {
      tab: t('advanced'),
      section: t('resetAccount'),
      description: t('resetAccountDescription'),
      route: `${ADVANCED_ROUTE}#reset-account`,
      image: 'settings.svg',
    },
    {
      tab: t('advanced'),
      section: t('showAdvancedGasInline'),
      description: t('showAdvancedGasInlineDescription'),
      route: `${ADVANCED_ROUTE}#advanced-gascontrols`,
      image: 'settings.svg',
    },
    {
      tab: t('advanced'),
      section: t('showHexData'),
      description: t('showHexDataDescription'),
      route: `${ADVANCED_ROUTE}#show-hexdata`,
      image: 'settings.svg',
    },
    {
      tab: t('advanced'),
      section: t('showFiatConversionInTestnets'),
      description: t('showFiatConversionInTestnetsDescription'),
      route: `${ADVANCED_ROUTE}#conversion-testnetworks`,
      image: 'settings.svg',
    },
    {
      tab: t('advanced'),
      section: t('showTestnetNetworks'),
      description: t('showTestnetNetworksDescription'),
      route: `${ADVANCED_ROUTE}#show-testnets`,
      image: 'settings.svg',
    },
    {
      tab: t('advanced'),
      section: t('nonceField'),
      description: t('nonceFieldDescription'),
      route: `${ADVANCED_ROUTE}#customize-nonce`,
      image: 'settings.svg',
    },
    {
      tab: t('advanced'),
      section: t('autoLockTimeLimit'),
      description: t('autoLockTimeLimitDescription'),
      route: `${ADVANCED_ROUTE}#autolock-timer`,
      image: 'settings.svg',
    },
    {
      tab: t('advanced'),
      section: t('syncWithThreeBox'),
      description: t('syncWithThreeBoxDescription'),
      route: `${ADVANCED_ROUTE}#sync-with3box`,
      image: 'settings.svg',
    },
    {
      tab: t('advanced'),
      section: t('ipfsGateway'),
      description: t('ipfsGatewayDescription'),
      route: `${ADVANCED_ROUTE}#ipfs-gateway`,
      image: 'settings.svg',
    },
    {
      tab: t('advanced'),
      section: t('preferredLedgerConnectionType'),
      description: t('preferredLedgerConnectionType'),
      route: `${ADVANCED_ROUTE}#ledger-connection`,
      image: 'settings.svg',
    },
    {
      tab: t('advanced'),
      section: t('dismissReminderField'),
      description: t('dismissReminderDescriptionField'),
      route: `${ADVANCED_ROUTE}#dimiss-secretrecovery`,
      image: 'settings.svg',
    },
    {
      tab: t('contacts'),
      section: t('contacts'),
      description: t('contacts'),
      route: CONTACT_LIST_ROUTE,
      image: 'settings.svg',
    },
    {
      tab: t('securityAndPrivacy'),
      section: t('revealSeedWords'),
      description: t('revealSeedWords'),
      route: `${SECURITY_ROUTE}#reveal-secretrecovery`,
      image: 'settings.svg',
    },
    {
      tab: t('securityAndPrivacy'),
      section: t('showIncomingTransactions'),
      description: t('showIncomingTransactionsDescription'),
      route: `${SECURITY_ROUTE}#incoming-transaction`,
      image: 'settings.svg',
    },
    {
      tab: t('securityAndPrivacy'),
      section: t('usePhishingDetection'),
      description: t('usePhishingDetectionDescription'),
      route: `${SECURITY_ROUTE}#phishing-detection`,
      image: 'settings.svg',
    },
    {
      tab: t('securityAndPrivacy'),
      section: t('participateInMetaMetrics'),
      description: t('participateInMetaMetricsDescription'),
      route: `${SECURITY_ROUTE}#metrametrics`,
      image: 'settings.svg',
    },
    {
      tab: t('alerts'),
      section: t('alertSettingsUnconnectedAccount'),
      description: t('alertSettingsUnconnectedAccount'),
      route: `${ALERTS_ROUTE}#unconnected-account`,
      image: 'settings.svg',
    },
    {
      tab: t('alerts'),
      section: t('alertSettingsWeb3ShimUsage'),
      description: t('alertSettingsWeb3ShimUsage'),
      route: `${ALERTS_ROUTE}#web3-shimusage`,
      image: 'settings.svg',
    },
    {
      tab: t('networks'),
      section: t('mainnet'),
      description: t('mainnet'),
      route: `${NETWORKS_ROUTE}#networks-mainnet`,
      image: 'settings.svg',
    },
    {
      tab: t('networks'),
      section: t('ropsten'),
      description: t('ropsten'),
      route: `${NETWORKS_ROUTE}#networks-ropsten`,
      image: 'settings.svg',
    },
    {
      tab: t('networks'),
      section: t('rinkeby'),
      description: t('rinkeby'),
      route: `${NETWORKS_ROUTE}#networks-rinkeby`,
      image: 'settings.svg',
    },
    {
      tab: t('networks'),
      section: t('goerli'),
      description: t('goerli'),
      route: `${NETWORKS_ROUTE}#networks-goerli`,
      image: 'settings.svg',
    },
    {
      tab: t('networks'),
      section: t('kovan'),
      description: t('kovan'),
      route: `${NETWORKS_ROUTE}#networtks-kovan`,
      image: 'settings.svg',
    },
    {
      tab: t('networks'),
      section: t('localhost'),
      description: t('localhost'),
      route: `${NETWORKS_ROUTE}#network-localhost`,
      image: 'settings.svg',
    },
    {
      tab: t('experimental'),
      section: t('useTokenDetection'),
      description: t('useTokenDetectionDescription'),
      route: `${EXPERIMENTAL_ROUTE}#token-description`,
      image: 'settings.svg',
    },
    {
      tab: t('experimental'),
      section: t('enableOpenSeaAPI'),
      description: t('enableOpenSeaAPIDescription'),
      route: `${EXPERIMENTAL_ROUTE}#opensea-api`,
      image: 'settings.svg',
    },
    {
      tab: t('experimental'),
      section: t('useCollectibleDetection'),
      description: t('useCollectibleDetectionDescription'),
      route: `${EXPERIMENTAL_ROUTE}#autodetect-nfts`,
      image: 'settings.svg',
    },

    {
      tab: t('about'),
      section: t('metamaskVersion'),
      description: t('builtAroundTheWorld'),
      route: `${ABOUT_US_ROUTE}#version`,
      image: 'settings.svg',
    },
    {
      tab: t('about'),
      section: t('links'),
      description: '',
      route: `${ABOUT_US_ROUTE}#links`,
      image: 'settings.svg',
    },
    {
      tab: t('about'),
      section: t('privacyMsg'),
      description: t('privacyMsg'),
      route: `${ABOUT_US_ROUTE}#privacy-policy`,
      image: 'settings.svg',
    },
    {
      tab: t('about'),
      section: t('terms'),
      description: t('terms'),
      route: `${ABOUT_US_ROUTE}#terms`,
      image: 'settings.svg',
    },

    {
      tab: t('about'),
      section: t('attributions'),
      description: t('attributions'),
      route: `${ABOUT_US_ROUTE}#attributions`,
      image: 'settings.svg',
    },

    {
      tab: t('about'),
      section: t('supportCenter'),
      description: t('supportCenter'),
      route: `${ABOUT_US_ROUTE}#supportcenter`,
      image: 'settings.svg',
    },

    {
      tab: t('about'),
      section: t('visitWebSite'),
      description: t('visitWebSite'),
      route: `${ABOUT_US_ROUTE}#visitwebsite`,
      image: 'settings.svg',
    },

    {
      tab: t('about'),
      section: t('contactUs'),
      description: t('contactUs'),
      route: `${ABOUT_US_ROUTE}#contactus`,
      image: 'settings.svg',
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

function colorText(text, menuElement) {
  if (menuElement !== null) {
    let { elementText } = menuElement;
    const index = menuElement.innerText.toLowerCase().indexOf(text);
    if (index >= 0) {
      elementText = `${menuElement.innerText.substring(
        0,
        index,
      )}<span style="background:#ffd33d">${menuElement.innerText.substring(
        index,
        index + text.length,
      )}</span>${menuElement.innerText.substring(index + text.length)}`;
      menuElement.innerHTML = elementText;
    }
  }
}
export function highlightSearchedText(text, menuIndex) {
  const menuTabElement = document.getElementById(`${MENU_TAB}_${menuIndex}`);
  const menuSectionElement = document.getElementById(
    `${MENU_SECTION}_${menuIndex}`,
  );
  colorText(text, menuTabElement);
  colorText(text, menuSectionElement);
}
