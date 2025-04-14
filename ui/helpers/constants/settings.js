/* eslint-disable @metamask/design-tokens/color-no-hex*/
// TODO: Remove restricted import
// eslint-disable-next-line import/no-restricted-paths
import { getPlatform } from '../../../app/scripts/lib/util';
import { PLATFORM_FIREFOX } from '../../../shared/constants/app';
import { IconName } from '../../components/component-library';
import {
  ADVANCED_ROUTE,
  SECURITY_ROUTE,
  GENERAL_ROUTE,
  ABOUT_US_ROUTE,
  NETWORKS_ROUTE,
  CONTACT_LIST_ROUTE,
  EXPERIMENTAL_ROUTE,
  DEVELOPER_OPTIONS_ROUTE,
} from './routes';

/**
 * @typedef SettingRouteConfig
 * # @param {Function} tabMessage
 * # @param {Function} sectionMessage
 * # @param {Function} descriptionMessage
 * # @param {string} route tab route with appended arbitrary, unique anchor tag / hash route
 * # @param {string} iconName
 * # @param {string} featureFlag ENV variable name. If the ENV value exists, the route will be searchable; else, route will not be searchable.
 * # @param {boolean} hidden If true, the route will not be searchable.
 */

/** @type {SettingRouteConfig[]} */
// When editing this array, double-check the order of the settingsRefs in the setting's respective component.
const SETTINGS_CONSTANTS = [
  {
    // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31887
    // eslint-disable-next-line id-length
    tabMessage: (t) => t('general'),
    // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31887
    // eslint-disable-next-line id-length
    sectionMessage: (t) => t('currencyConversion'),
    // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31887
    // eslint-disable-next-line id-length
    descriptionMessage: (t) => t('currencyConversion'),
    route: `${GENERAL_ROUTE}#currency-conversion`,
    iconName: IconName.Setting,
  },
  {
    // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31887
    // eslint-disable-next-line id-length
    tabMessage: (t) => t('general'),
    // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31887
    // eslint-disable-next-line id-length
    sectionMessage: (t) => t('showNativeTokenAsMainBalance'),
    // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31887
    // eslint-disable-next-line id-length
    descriptionMessage: (t) => t('showNativeTokenAsMainBalance'),
    route: `${GENERAL_ROUTE}#show-native-token-as-main-balance`,
    iconName: IconName.Setting,
  },
  {
    // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31887
    // eslint-disable-next-line id-length
    tabMessage: (t) => t('general'),
    // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31887
    // eslint-disable-next-line id-length
    sectionMessage: (t) => t('currentLanguage'),
    // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31887
    // eslint-disable-next-line id-length
    descriptionMessage: (t) => t('currentLanguage'),
    route: `${GENERAL_ROUTE}#current-language`,
    iconName: IconName.Setting,
  },
  {
    // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31887
    // eslint-disable-next-line id-length
    tabMessage: (t) => t('general'),
    // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31887
    // eslint-disable-next-line id-length
    sectionMessage: (t) => t('theme'),
    // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31887
    // eslint-disable-next-line id-length
    descriptionMessage: (t) => t('themeDescription'),
    route: `${GENERAL_ROUTE}#theme`,
    icon: 'fa fa-flask',
  },
  {
    // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31887
    // eslint-disable-next-line id-length
    tabMessage: (t) => t('general'),
    // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31887
    // eslint-disable-next-line id-length
    sectionMessage: (t) => t('accountIdenticon'),
    // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31887
    // eslint-disable-next-line id-length
    descriptionMessage: (t) => t('accountIdenticon'),
    route: `${GENERAL_ROUTE}#account-identicon`,
    iconName: IconName.Setting,
  },
  {
    // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31887
    // eslint-disable-next-line id-length
    tabMessage: (t) => t('general'),
    // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31887
    // eslint-disable-next-line id-length
    sectionMessage: (t) => t('hideZeroBalanceTokens'),
    // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31887
    // eslint-disable-next-line id-length
    descriptionMessage: (t) => t('hideZeroBalanceTokens'),
    route: `${GENERAL_ROUTE}#zero-balancetokens`,
    iconName: IconName.Setting,
  },
  // advanced settingsRefs[0]
  {
    // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31887
    // eslint-disable-next-line id-length
    tabMessage: (t) => t('advanced'),
    // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31887
    // eslint-disable-next-line id-length
    sectionMessage: (t) => t('stateLogs'),
    // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31887
    // eslint-disable-next-line id-length
    descriptionMessage: (t) => t('stateLogsDescription'),
    route: `${ADVANCED_ROUTE}#state-logs`,
    icon: 'fas fa-sliders-h',
  },
  // advanced settingsRefs[1]
  {
    // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31887
    // eslint-disable-next-line id-length
    tabMessage: (t) => t('advanced'),
    // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31887
    // eslint-disable-next-line id-length
    sectionMessage: (t) => t('clearActivity'),
    // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31887
    // eslint-disable-next-line id-length
    descriptionMessage: (t) => t('clearActivityDescription'),
    route: `${ADVANCED_ROUTE}#clear-activity`,
    icon: 'fas fa-sliders-h',
  },
  // advanced settingsRefs[2]
  {
    // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31887
    // eslint-disable-next-line id-length
    tabMessage: (t) => t('advanced'),
    // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31887
    // eslint-disable-next-line id-length
    sectionMessage: (t) => t('smartTransactions'),
    // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31887
    // eslint-disable-next-line id-length
    descriptionMessage: (t) => t('stxOptInSupportedNetworksDescription'),
    route: `${ADVANCED_ROUTE}#smart-transactions`,
    icon: 'fas fa-upload',
  },
  // advanced settingsRefs[3]
  {
    // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31887
    // eslint-disable-next-line id-length
    tabMessage: (t) => t('advanced'),
    // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31887
    // eslint-disable-next-line id-length
    sectionMessage: (t) => t('showHexData'),
    // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31887
    // eslint-disable-next-line id-length
    descriptionMessage: (t) => t('showHexDataDescription'),
    route: `${ADVANCED_ROUTE}#show-hexdata`,
    icon: 'fas fa-sliders-h',
  },
  // advanced settingsRefs[4]
  {
    // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31887
    // eslint-disable-next-line id-length
    tabMessage: (t) => t('advanced'),
    // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31887
    // eslint-disable-next-line id-length
    sectionMessage: (t) => t('showFiatConversionInTestnets'),
    // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31887
    // eslint-disable-next-line id-length
    descriptionMessage: (t) => t('showFiatConversionInTestnetsDescription'),
    route: `${ADVANCED_ROUTE}#conversion-testnetworks`,
    icon: 'fas fa-sliders-h',
  },
  // advanced settingsRefs[5]
  {
    // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31887
    // eslint-disable-next-line id-length
    tabMessage: (t) => t('advanced'),
    // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31887
    // eslint-disable-next-line id-length
    sectionMessage: (t) => t('showTestnetNetworks'),
    // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31887
    // eslint-disable-next-line id-length
    descriptionMessage: (t) => t('showTestnetNetworksDescription'),
    route: `${ADVANCED_ROUTE}#show-testnets`,
    icon: 'fas fa-sliders-h',
  },
  // advanced settingsRefs[6]
  {
    // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31887
    // eslint-disable-next-line id-length
    tabMessage: (t) => t('advanced'),
    // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31887
    // eslint-disable-next-line id-length
    sectionMessage: (t) => t('autoLockTimeLimit'),
    // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31887
    // eslint-disable-next-line id-length
    descriptionMessage: (t) => t('autoLockTimeLimitDescription'),
    route: `${ADVANCED_ROUTE}#autolock-timer`,
    icon: 'fas fa-sliders-h',
  },
  // advanced settingsRefs[7]
  {
    // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31887
    // eslint-disable-next-line id-length
    tabMessage: (t) => t('advanced'),
    // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31887
    // eslint-disable-next-line id-length
    sectionMessage: (t) => t('showExtensionInFullSizeView'),
    // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31887
    // eslint-disable-next-line id-length
    descriptionMessage: (t) => t('showExtensionInFullSizeViewDescription'),
    route: `${ADVANCED_ROUTE}#extension-full-size-view`,
    icon: 'fas fa-sliders-h',
  },
  // advanced settingsRefs[8]
  {
    // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31887
    // eslint-disable-next-line id-length
    tabMessage: (t) => t('advanced'),
    // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31887
    // eslint-disable-next-line id-length
    sectionMessage: (t) => t('dismissReminderField'),
    // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31887
    // eslint-disable-next-line id-length
    descriptionMessage: (t) => t('dismissReminderDescriptionField'),
    route: `${ADVANCED_ROUTE}#dismiss-secretrecovery`,
    icon: 'fas fa-sliders-h',
  },
  // advanced settingsRefs[9]
  {
    // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31887
    // eslint-disable-next-line id-length
    tabMessage: (t) => t('advanced'),
    // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31887
    // eslint-disable-next-line id-length
    sectionMessage: (t) => t('exportYourData'),
    // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31887
    // eslint-disable-next-line id-length
    descriptionMessage: (t) => t('exportYourDataDescription'),
    route: `${ADVANCED_ROUTE}#export-data`,
    icon: 'fas fa-download',
  },
  // advanced settingsRefs[10]
  {
    // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31887
    // eslint-disable-next-line id-length
    tabMessage: (t) => t('advanced'),
    // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31887
    // eslint-disable-next-line id-length
    sectionMessage: (t) => t('overrideContentSecurityPolicyHeader'),
    // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31887
    // eslint-disable-next-line id-length
    descriptionMessage: (t) =>
      t('overrideContentSecurityPolicyHeaderDescription'),
    route: `${ADVANCED_ROUTE}#override-content-security-policy-header`,
    icon: 'fas fa-sliders-h',
    hidden: getPlatform() !== PLATFORM_FIREFOX,
  },
  {
    // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31887
    // eslint-disable-next-line id-length
    tabMessage: (t) => t('contacts'),
    // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31887
    // eslint-disable-next-line id-length
    sectionMessage: (t) => t('contacts'),
    // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31887
    // eslint-disable-next-line id-length
    descriptionMessage: (t) => t('contacts'),
    route: CONTACT_LIST_ROUTE,
    iconName: IconName.Book,
  },
  // securityAndPrivacy settingsRefs[0]
  {
    // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31887
    // eslint-disable-next-line id-length
    tabMessage: (t) => t('securityAndPrivacy'),
    // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31887
    // eslint-disable-next-line id-length
    sectionMessage: (t) => t('basicConfigurationLabel'),
    // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31887
    // eslint-disable-next-line id-length
    descriptionMessage: (t) => t('basicConfigurationDescription'),
    route: `${SECURITY_ROUTE}#basic-functionality-toggle`,
    icon: 'fa fa-lock',
  },
  // securityAndPrivacy settingsRefs[1]
  {
    // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31887
    // eslint-disable-next-line id-length
    tabMessage: (t) => t('securityAndPrivacy'),
    // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31887
    // eslint-disable-next-line id-length
    sectionMessage: (t) => t('revealSeedWords'),
    // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31887
    // eslint-disable-next-line id-length
    descriptionMessage: (t) => t('revealSeedWords'),
    route: `${SECURITY_ROUTE}#reveal-secretrecovery`,
    icon: 'fa fa-lock',
  },
  // securityAndPrivacy settingsRefs[3]
  {
    // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31887
    // eslint-disable-next-line id-length
    tabMessage: (t) => t('securityAndPrivacy'),
    // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31887
    // eslint-disable-next-line id-length
    sectionMessage: (t) => t('usePhishingDetection'),
    // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31887
    // eslint-disable-next-line id-length
    descriptionMessage: (t) => t('usePhishingDetectionDescription'),
    route: `${SECURITY_ROUTE}#phishing-detection`,
    icon: 'fa fa-lock',
  },
  // securityAndPrivacy settingsRefs[4]
  {
    // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31887
    // eslint-disable-next-line id-length
    tabMessage: (t) => t('securityAndPrivacy'),
    // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31887
    // eslint-disable-next-line id-length
    sectionMessage: (t) => t('use4ByteResolution'),
    // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31887
    // eslint-disable-next-line id-length
    descriptionMessage: (t) => t('toggleDecodeDescription'),
    route: `${SECURITY_ROUTE}#decode-smart-contracts`,
    icon: 'fa fa-lock',
  },
  // securityAndPrivacy settingsRefs[5]
  {
    // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31887
    // eslint-disable-next-line id-length
    tabMessage: (t) => t('securityAndPrivacy'),
    // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31887
    // eslint-disable-next-line id-length
    sectionMessage: (t) => t('participateInMetaMetrics'),
    // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31887
    // eslint-disable-next-line id-length
    descriptionMessage: (t) => t('participateInMetaMetricsDescription'),
    route: `${SECURITY_ROUTE}#metametrics`,
    icon: 'fa fa-lock',
  },
  // securityAndPrivacy settingsRefs[6]
  {
    // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31887
    // eslint-disable-next-line id-length
    tabMessage: (t) => t('securityAndPrivacy'),
    // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31887
    // eslint-disable-next-line id-length
    sectionMessage: (t) => t('networkProvider'),
    // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31887
    // eslint-disable-next-line id-length
    descriptionMessage: (t) =>
      `${t('chooseYourNetwork')} ${t('chooseYourNetworkDescription')}`,
    route: `${SECURITY_ROUTE}#network-provider`,
    icon: 'fa fa-lock',
  },
  // securityAndPrivacy settingsRefs[7]
  {
    // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31887
    // eslint-disable-next-line id-length
    tabMessage: (t) => t('securityAndPrivacy'),
    // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31887
    // eslint-disable-next-line id-length
    sectionMessage: (t) => t('ipfsGateway'),
    // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31887
    // eslint-disable-next-line id-length
    descriptionMessage: (t) => t('ipfsGatewayDescription'),
    route: `${SECURITY_ROUTE}#add-custom-ipfs-gateway`,
    icon: 'fa fa-lock',
  },
  // securityAndPrivacy settingsRefs[8]
  {
    // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31887
    // eslint-disable-next-line id-length
    tabMessage: (t) => t('securityAndPrivacy'),
    // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31887
    // eslint-disable-next-line id-length
    sectionMessage: (t) => t('autoDetectTokens'),
    // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31887
    // eslint-disable-next-line id-length
    descriptionMessage: (t) => t('autoDetectTokensDescription'),
    route: `${SECURITY_ROUTE}#auto-detect-tokens`,
    icon: 'fa fa-lock',
  },
  // securityAndPrivacy settingsRefs[9]
  {
    // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31887
    // eslint-disable-next-line id-length
    tabMessage: (t) => t('securityAndPrivacy'),
    // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31887
    // eslint-disable-next-line id-length
    sectionMessage: (t) => t('useMultiAccountBalanceChecker'),
    // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31887
    // eslint-disable-next-line id-length
    descriptionMessage: (t) =>
      t('useMultiAccountBalanceCheckerSettingDescription'),
    route: `${SECURITY_ROUTE}#batch-account-balance-requests`,
    icon: 'fa fa-lock',
  },
  // securityAndPrivacy settingsRefs[10]
  {
    // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31887
    // eslint-disable-next-line id-length
    tabMessage: (t) => t('securityAndPrivacy'),
    // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31887
    // eslint-disable-next-line id-length
    sectionMessage: (t) => t('currencyRateCheckToggle'),
    // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31887
    // eslint-disable-next-line id-length
    descriptionMessage: (t) => t('currencyRateCheckToggleDescription'),
    route: `${SECURITY_ROUTE}#price-checker`,
    icon: 'fa fa-lock',
  },
  // securityAndPrivacy settingsRefs[11]
  {
    // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31887
    // eslint-disable-next-line id-length
    tabMessage: (t) => t('securityAndPrivacy'),
    // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31887
    // eslint-disable-next-line id-length
    sectionMessage: (t) => t('ensDomainsSettingTitle'),
    // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31887
    // eslint-disable-next-line id-length
    descriptionMessage: (t) => t('ensDomainsSettingDescriptionIntroduction'),
    route: `${SECURITY_ROUTE}#ens-domains`,
    icon: 'fa fa-lock',
  },
  // securityAndPrivacy settingsRefs[12]
  {
    // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31887
    // eslint-disable-next-line id-length
    tabMessage: (t) => t('securityAndPrivacy'),
    // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31887
    // eslint-disable-next-line id-length
    sectionMessage: (t) => t('displayNftMedia'),
    // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31887
    // eslint-disable-next-line id-length
    descriptionMessage: (t) => t('displayNftMediaDescription'),
    route: `${SECURITY_ROUTE}#display-nft-media`,
    icon: 'fa fa-lock',
  },
  // securityAndPrivacy settingsRefs[13]
  {
    // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31887
    // eslint-disable-next-line id-length
    tabMessage: (t) => t('securityAndPrivacy'),
    // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31887
    // eslint-disable-next-line id-length
    sectionMessage: (t) => t('useNftDetection'),
    // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31887
    // eslint-disable-next-line id-length
    descriptionMessage: (t) => t('useNftDetectionDescriptionText'),
    route: `${SECURITY_ROUTE}#autodetect-nfts`,
    icon: 'fa fa-lock',
  },
  // securityAndPrivacy settingsRefs[14]
  {
    // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31887
    // eslint-disable-next-line id-length
    tabMessage: (t) => t('securityAndPrivacy'),
    // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31887
    // eslint-disable-next-line id-length
    sectionMessage: (t) => t('useSafeChainsListValidation'),
    // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31887
    // eslint-disable-next-line id-length
    descriptionMessage: (t) => t('useSafeChainsListValidationDescription'),
    route: `${SECURITY_ROUTE}#network-details-check`,
    icon: 'fa fa-lock',
  },
  // securityAndPrivacy settingsRefs[15]
  {
    // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31887
    // eslint-disable-next-line id-length
    tabMessage: (t) => t('securityAndPrivacy'),
    // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31887
    // eslint-disable-next-line id-length
    sectionMessage: (t) => t('externalNameSourcesSetting'),
    // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31887
    // eslint-disable-next-line id-length
    descriptionMessage: (t) => t('externalNameSourcesSettingDescription'),
    route: `${SECURITY_ROUTE}#proposed-nicknames`,
    icon: 'fa fa-lock',
  },
  // securityAndPrivacy settingsRefs[16]
  {
    // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31887
    // eslint-disable-next-line id-length
    tabMessage: (t) => t('securityAndPrivacy'),
    // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31887
    // eslint-disable-next-line id-length
    sectionMessage: (t) => t('securityAlerts'),
    // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31887
    // eslint-disable-next-line id-length
    descriptionMessage: (t) => t('securityAlertsDescription'),
    route: `${SECURITY_ROUTE}#security-alerts`,
    icon: 'fa fa-lock',
  },
  // securityAndPrivacy settingsRefs[17]
  {
    // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31887
    // eslint-disable-next-line id-length
    tabMessage: (t) => t('securityAndPrivacy'),
    // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31887
    // eslint-disable-next-line id-length
    sectionMessage: (t) => t('blockaid'),
    // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31887
    // eslint-disable-next-line id-length
    descriptionMessage: (t) => t('blockaidMessage'),
    route: `${SECURITY_ROUTE}#security-alerts-blockaid`,
    icon: 'fa fa-lock',
  },
  // securityAndPrivacy settingsRefs[18]
  {
    // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31887
    // eslint-disable-next-line id-length
    tabMessage: (t) => t('securityAndPrivacy'),
    // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31887
    // eslint-disable-next-line id-length
    sectionMessage: (t) => t('simulationsSettingSubHeader'),
    // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31887
    // eslint-disable-next-line id-length
    descriptionMessage: (t) => t('simulationsSettingDescription'),
    route: `${SECURITY_ROUTE}#transaction-simulations`,
    icon: 'fa fa-lock',
  },
  // securityAndPrivacy settingsRefs[19]
  {
    // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31887
    // eslint-disable-next-line id-length
    tabMessage: (t) => t('securityAndPrivacy'),
    // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31887
    // eslint-disable-next-line id-length
    sectionMessage: (t) => t('dataCollectionForMarketing'),
    // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31887
    // eslint-disable-next-line id-length
    descriptionMessage: (t) => t('dataCollectionForMarketingDescription'),
    route: `${SECURITY_ROUTE}#dataCollectionForMarketing`,
    icon: 'fa fa-lock',
  },
  // securityAndPrivacy settingsRefs[20]
  {
    // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31887
    // eslint-disable-next-line id-length
    tabMessage: (t) => t('securityAndPrivacy'),
    // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31887
    // eslint-disable-next-line id-length
    sectionMessage: (t) => t('deleteMetaMetricsData'),
    // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31887
    // eslint-disable-next-line id-length
    descriptionMessage: (t) => t('deleteMetaMetricsDataDescription'),
    route: `${SECURITY_ROUTE}#delete-metametrics-data`,
    icon: 'fa fa-lock',
  },
  // securityAndPrivacy settingsRefs[21]
  {
    // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31887
    // eslint-disable-next-line id-length
    tabMessage: (t) => t('securityAndPrivacy'),
    // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31887
    // eslint-disable-next-line id-length
    sectionMessage: (t) => t('profileSync'),
    // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31887
    // eslint-disable-next-line id-length
    descriptionMessage: (t) => t('profileSyncDescription'),
    route: `${SECURITY_ROUTE}#profile-sync`,
    icon: 'fa fa-lock',
  },
  {
    // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31887
    // eslint-disable-next-line id-length
    tabMessage: (t) => t('networks'),
    // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31887
    // eslint-disable-next-line id-length
    sectionMessage: (t) => t('mainnet'),
    // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31887
    // eslint-disable-next-line id-length
    descriptionMessage: (t) => t('mainnet'),
    route: `${NETWORKS_ROUTE}#networks-mainnet`,
    icon: 'fa fa-plug',
  },
  {
    // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31887
    // eslint-disable-next-line id-length
    tabMessage: (t) => t('networks'),
    // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31887
    // eslint-disable-next-line id-length
    sectionMessage: (t) => t('lineaMainnet'),
    // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31887
    // eslint-disable-next-line id-length
    descriptionMessage: (t) => t('lineaMainnet'),
    route: `${NETWORKS_ROUTE}#networks-linea-mainnet`,
    icon: 'fa fa-plug',
  },
  {
    // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31887
    // eslint-disable-next-line id-length
    tabMessage: (t) => t('networks'),
    // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31887
    // eslint-disable-next-line id-length
    sectionMessage: (t) => t('goerli'),
    // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31887
    // eslint-disable-next-line id-length
    descriptionMessage: (t) => t('goerli'),
    route: `${NETWORKS_ROUTE}#networks-goerli`,
    icon: 'fa fa-plug',
  },
  {
    // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31887
    // eslint-disable-next-line id-length
    tabMessage: (t) => t('networks'),
    // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31887
    // eslint-disable-next-line id-length
    sectionMessage: (t) => t('sepolia'),
    // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31887
    // eslint-disable-next-line id-length
    descriptionMessage: (t) => t('sepolia'),
    route: `${NETWORKS_ROUTE}#networks-sepolia`,
    icon: 'fa fa-plug',
  },
  {
    // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31887
    // eslint-disable-next-line id-length
    tabMessage: (t) => t('networks'),
    // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31887
    // eslint-disable-next-line id-length
    sectionMessage: (t) => t('lineaGoerli'),
    // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31887
    // eslint-disable-next-line id-length
    descriptionMessage: (t) => t('lineaGoerli'),
    route: `${NETWORKS_ROUTE}#networks-linea-goerli`,
    icon: 'fa fa-plug',
  },
  {
    // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31887
    // eslint-disable-next-line id-length
    tabMessage: (t) => t('networks'),
    // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31887
    // eslint-disable-next-line id-length
    sectionMessage: (t) => t('lineaSepolia'),
    // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31887
    // eslint-disable-next-line id-length
    descriptionMessage: (t) => t('lineaSepolia'),
    route: `${NETWORKS_ROUTE}#networks-linea-sepolia`,
    icon: 'fa fa-plug',
  },
  {
    // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31887
    // eslint-disable-next-line id-length
    tabMessage: (t) => t('networks'),
    // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31887
    // eslint-disable-next-line id-length
    sectionMessage: (t) => t('localhost'),
    // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31887
    // eslint-disable-next-line id-length
    descriptionMessage: (t) => t('localhost'),
    route: `${NETWORKS_ROUTE}#networks-localhost`,
    icon: 'fa fa-plug',
  },
  {
    // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31887
    // eslint-disable-next-line id-length
    tabMessage: (t) => t('about'),
    // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31887
    // eslint-disable-next-line id-length
    sectionMessage: (t) => t('metamaskVersion'),
    // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31887
    // eslint-disable-next-line id-length
    descriptionMessage: (t) => t('builtAroundTheWorld'),
    route: `${ABOUT_US_ROUTE}#version`,
    iconName: IconName.Info,
  },
  {
    // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31887
    // eslint-disable-next-line id-length
    tabMessage: (t) => t('about'),
    // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31887
    // eslint-disable-next-line id-length
    sectionMessage: (t) => t('links'),
    // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31887
    // eslint-disable-next-line id-length
    descriptionMessage: (t) => t('links'),
    route: `${ABOUT_US_ROUTE}#links`,
    iconName: IconName.Info,
  },
  {
    // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31887
    // eslint-disable-next-line id-length
    tabMessage: (t) => t('about'),
    // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31887
    // eslint-disable-next-line id-length
    sectionMessage: (t) => t('privacyMsg'),
    // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31887
    // eslint-disable-next-line id-length
    descriptionMessage: (t) => t('privacyMsg'),
    route: `${ABOUT_US_ROUTE}#privacy-policy`,
    iconName: IconName.Info,
  },
  {
    // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31887
    // eslint-disable-next-line id-length
    tabMessage: (t) => t('about'),
    // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31887
    // eslint-disable-next-line id-length
    sectionMessage: (t) => t('terms'),
    // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31887
    // eslint-disable-next-line id-length
    descriptionMessage: (t) => t('terms'),
    route: `${ABOUT_US_ROUTE}#terms`,
    iconName: IconName.Info,
  },

  {
    // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31887
    // eslint-disable-next-line id-length
    tabMessage: (t) => t('about'),
    // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31887
    // eslint-disable-next-line id-length
    sectionMessage: (t) => t('attributions'),
    // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31887
    // eslint-disable-next-line id-length
    descriptionMessage: (t) => t('attributions'),
    route: `${ABOUT_US_ROUTE}#attributions`,
    iconName: IconName.Info,
  },

  {
    // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31887
    // eslint-disable-next-line id-length
    tabMessage: (t) => t('about'),
    // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31887
    // eslint-disable-next-line id-length
    sectionMessage: (t) => t('supportCenter'),
    // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31887
    // eslint-disable-next-line id-length
    descriptionMessage: (t) => t('supportCenter'),
    route: `${ABOUT_US_ROUTE}#supportcenter`,
    iconName: IconName.Info,
  },

  {
    // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31887
    // eslint-disable-next-line id-length
    tabMessage: (t) => t('about'),
    // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31887
    // eslint-disable-next-line id-length
    sectionMessage: (t) => t('visitWebSite'),
    // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31887
    // eslint-disable-next-line id-length
    descriptionMessage: (t) => t('visitWebSite'),
    route: `${ABOUT_US_ROUTE}#visitwebsite`,
    iconName: IconName.Info,
  },

  {
    // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31887
    // eslint-disable-next-line id-length
    tabMessage: (t) => t('about'),
    // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31887
    // eslint-disable-next-line id-length
    sectionMessage: (t) => t('contactUs'),
    // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31887
    // eslint-disable-next-line id-length
    descriptionMessage: (t) => t('contactUs'),
    route: `${ABOUT_US_ROUTE}#contactus`,
    iconName: IconName.Info,
  },
  {
    // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31887
    // eslint-disable-next-line id-length
    tabMessage: (t) => t('about'),
    // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31887
    // eslint-disable-next-line id-length
    sectionMessage: (t) => t('betaTerms'),
    // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31887
    // eslint-disable-next-line id-length
    descriptionMessage: (t) => t('betaTerms'),
    route: `${ABOUT_US_ROUTE}#beta-terms`,
    iconName: IconName.Info,
  },
  // experimental settingsRefs[0]
  {
    // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31887
    // eslint-disable-next-line id-length
    tabMessage: (t) => t('experimental'),
    // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31887
    // eslint-disable-next-line id-length
    sectionMessage: (t) => t('notificationsFeatureToggle'),
    // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31887
    // eslint-disable-next-line id-length
    descriptionMessage: (t) => t('notificationsFeatureToggleDescription'),
    route: `${EXPERIMENTAL_ROUTE}#notifications`,
    icon: 'fas fa-flask',
  },
  ///: BEGIN:ONLY_INCLUDE_IF(keyring-snaps)
  // since this route is only included with keyring-snaps feature flag, this needs to be the last settingsRef for the experimental tab
  // experimental settingsRefs[4]
  {
    // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31887
    // eslint-disable-next-line id-length
    tabMessage: (t) => t('experimental'),
    // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31887
    // eslint-disable-next-line id-length
    sectionMessage: (t) => t('snaps'),
    // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31887
    // eslint-disable-next-line id-length
    descriptionMessage: (t) => t('addSnapAccountToggle'),
    route: `${EXPERIMENTAL_ROUTE}#snaps`,
    icon: 'fas fa-flask',
  },
  ///: END:ONLY_INCLUDE_IF
  // developerOptions settingsRefs[0]
  {
    featureFlag: 'ENABLE_SETTINGS_PAGE_DEV_OPTIONS',
    // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31887
    // eslint-disable-next-line id-length
    tabMessage: (t) => t('developerOptions'),
    sectionMessage: 'Reset States',
    descriptionMessage: 'Reset States',
    route: `${DEVELOPER_OPTIONS_ROUTE}#reset-states`,
    icon: IconName.CodeCircle,
  },
  // developerOptions settingsRefs[1]
  {
    featureFlag: 'ENABLE_SETTINGS_PAGE_DEV_OPTIONS',
    // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31887
    // eslint-disable-next-line id-length
    tabMessage: (t) => t('developerOptions'),
    sectionMessage: 'Announcements',
    descriptionMessage:
      "Resets isShown boolean to false for all announcements. Announcements are the notifications shown in the What's New popup modal.",
    route: `${DEVELOPER_OPTIONS_ROUTE}#reset-states-announcements`,
    icon: IconName.CodeCircle,
  },
  // developerOptions settingsRefs[2]
  {
    featureFlag: 'ENABLE_SETTINGS_PAGE_DEV_OPTIONS',
    // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31887
    // eslint-disable-next-line id-length
    tabMessage: (t) => t('developerOptions'),
    sectionMessage: 'Service Worker Keep Alive',
    descriptionMessage:
      'Resets various states related to onboarding and redirects to the "Secure Your Wallet" onboarding page.',
    route: `${DEVELOPER_OPTIONS_ROUTE}#reset-states-onboarding`,
    icon: IconName.CodeCircle,
  },
  // developerOptions settingsRefs[3]
  {
    featureFlag: 'ENABLE_SETTINGS_PAGE_DEV_OPTIONS',
    // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31887
    // eslint-disable-next-line id-length
    tabMessage: (t) => t('developerOptions'),
    sectionMessage: 'Service Worker Keep Alive',
    descriptionMessage:
      'Results in a timestamp being continuously saved to session.storage',
    route: `${DEVELOPER_OPTIONS_ROUTE}#service-worker-keep-alive`,
    icon: IconName.CodeCircle,
  },
  ///: BEGIN:ONLY_INCLUDE_IF(bitcoin)
  {
    // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31887
    // eslint-disable-next-line id-length
    tabMessage: (t) => t('experimental'),
    // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31887
    // eslint-disable-next-line id-length
    sectionMessage: (t) => t('bitcoinSupportToggleTitle'),
    // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31887
    // eslint-disable-next-line id-length
    descriptionMessage: (t) => t('bitcoinSupportToggleDescription'),
    route: `${EXPERIMENTAL_ROUTE}#bitcoin-support`,
    icon: 'fas fa-flask',
  },
  ///: END:ONLY_INCLUDE_IF
  ///: BEGIN:ONLY_INCLUDE_IF(build-flask)
  {
    // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31887
    // eslint-disable-next-line id-length
    tabMessage: (t) => t('experimental'),
    // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31887
    // eslint-disable-next-line id-length
    sectionMessage: (t) => t('watchEthereumAccountsToggle'),
    // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31887
    // eslint-disable-next-line id-length
    descriptionMessage: (t) => t('watchEthereumAccountsDescription'),
    route: `${EXPERIMENTAL_ROUTE}#watch-only`,
    icon: 'fas fa-flask',
  },
  ///: END:ONLY_INCLUDE_IF
];

export default SETTINGS_CONSTANTS;
