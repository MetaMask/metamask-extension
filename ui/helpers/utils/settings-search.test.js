import React from 'react';
import { SETTINGS_CONSTANTS } from '../constants/settings';
import {
  getSettingsRoutes,
  getNumberOfSettingRoutesInTab,
  handleSettingsRefs,
} from './settings-search';

const t = (key) => {
  switch (key) {
    case 'general':
      return 'General';
    case 'currencyConversion':
      return 'Currency conversion';
    case 'primaryCurrencySetting':
      return 'Primary currency';
    case 'primaryCurrencySettingDescription':
      return 'Select native to prioritize displaying values in the native currency of the chain (e.g. ETH). Select Fiat to prioritize displaying values in your selected fiat currency.';
    case 'currentLanguage':
      return 'Current language';
    case 'accountIdenticon':
      return 'Current language"';
    case 'hideZeroBalanceTokens':
      return 'Hide tokens without balance';
    case 'advanced':
      return 'Advanced';
    case 'stateLogs':
      return 'State logs';
    case 'stateLogsDescription':
      return 'State logs contain your public account addresses and sent transactions.';
    case 'clearActivity':
      return 'Clear activity and nonce data';
    case 'clearActivityDescription':
      return "This resets the account's nonce and erases data from the activity tab in your wallet. Only the current account and network will be affected. Your balances and incoming transactions won't change.";
    case 'showAdvancedGasInlineDescription':
      return 'Select this to show gas price and limit controls directly on the send and confirm screens.';
    case 'showHexData':
      return 'Show hex data';
    case 'showHexDataDescription':
      return 'Select this to show the hex data field on the send screen';
    case 'showFiatConversionInTestnets':
      return 'Show conversion on test networks';
    case 'showFiatConversionInTestnetsDescription':
      return 'Select this to show fiat conversion on test network';
    case 'showTestnetNetworks':
      return 'Show test networks';
    case 'showTestnetNetworksDescription':
      return 'Select this to show test networks in network list';
    case 'nonceField':
      return 'Customize transaction nonce';
    case 'nonceFieldDescription':
      return 'Turn this on to change the nonce (transaction number) on confirmation screens. This is an advanced feature, use cautiously.';
    case 'autoLockTimeLimit':
      return 'Auto-lock timer (minutes)';
    case 'autoLockTimeLimitDescription':
      return 'Set the idle time in minutes before MetaMask will become locked.';
    case 'ipfsGateway':
      return 'IPFS Gateway';
    case 'ipfsGatewayDescription':
      return 'Enter the URL of the IPFS CID gateway to use for ENS content resolution.';
    case 'dismissReminderField':
      return 'Dismiss Secret Recovery Phrase backup reminder';
    case 'dismissReminderDescriptionField':
      return 'Turn this on to dismiss the Secret Recovery Phrase backup reminder message. We highly recommend that you back up your Secret Recovery Phrase to avoid loss of funds';
    case 'Contacts':
      return 'Contacts';
    case 'securityAndPrivacy':
      return 'Security & privacy';
    case 'revealSeedWords':
      return 'Reveal Secret Recovery Phrase';
    case 'showIncomingTransactions':
      return 'Show incoming transactions';
    case 'usePhishingDetection':
      return 'Use phishing detection';
    case 'usePhishingDetectionDescription':
      return 'Display a warning for phishing domains targeting Ethereum users';
    case 'participateInMetaMetrics':
      return 'Participate in MetaMetrics';
    case 'participateInMetaMetricsDescription':
      return 'Participate in MetaMetrics to help us make MetaMask better';
    case 'alerts':
      return 'Alerts';
    case 'alertSettingsUnconnectedAccount':
      return 'Browsing a website with an unconnected account selected';
    case 'alertSettingsWeb3ShimUsage':
      return 'When a website tries to use the removed window.web3 API';
    case 'networks':
      return 'Networks';
    case 'mainnet':
      return 'Ethereum Mainnet';
    case 'goerli':
      return 'Goerli test network';
    case 'sepolia':
      return 'Sepolia test network';
    case 'localhost':
      return 'Localhost 8545';
    case 'experimental':
      return 'Experimental';
    case 'autoDetectTokens':
      return 'Autodetect tokens';
    case 'autoDetectTokensDescription':
      return 'We use third-party APIs to detect and display new tokens sent to your wallet. Turn off if you don’t want the app to pull data from those services.';
    case 'displayNftMedia':
      return 'Display NFT media';
    case 'displayNftMediaDescription':
      return "Displaying NFT media and data exposes your IP address to OpenSea or other third parties. This can allow attackers to associate your IP address with your Ethereum address. NFT autodetection relies on this setting, and won't be available when this is turned off.";
    case 'useNftDetection':
      return 'Autodetect NFTs';
    case 'useNftDetectionDescriptionText':
      return 'Displaying NFTs media & data may expose your IP address to centralized servers. Third-party APIs (like OpenSea) are used to detect NFTs in your wallet. This exposes your account address with those services. Leave this disabled if you don’t want the app to pull data from those those services.';
    case 'about':
      return 'About';
    case 'metamaskVersion':
      return 'MetaMask Version';
    case 'builtAroundTheWorld':
      return 'MetaMask is designed and built around the world.';
    case 'links':
      return 'Links';
    case 'privacyMsg':
      return 'Privacy policy';
    case 'terms':
      return 'Terms of use';
    case 'attributions':
      return 'Attributions';
    case 'supportCenter':
      return 'Visit our support center';
    case 'visitWebSite':
      return 'Visit our web site';
    case 'contactUs':
      return 'Contact us';
    case 'snaps':
      return 'Snaps';
    case 'currencyRateCheckToggle':
      return 'Show balance and token price checker';
    case 'currencyRateCheckToggleDescription':
      return 'We use Coingecko and CryptoCompare APIs to display your balance and token price. Privacy Policy';
    default:
      return '';
  }
};

describe('Settings Search Utils', () => {
  describe('getSettingsRoutes', () => {
    it('should be an array of settings routes objects', () => {
      expect(getSettingsRoutes()).toHaveLength(SETTINGS_CONSTANTS.length);
    });
  });

  describe('getNumberOfSettingRoutesInTab', () => {
    it('returns "General" section count', () => {
      expect(getNumberOfSettingRoutesInTab(t, t('general'))).toStrictEqual(6);
    });

    it('returns "Advanced" section count', () => {
      expect(getNumberOfSettingRoutesInTab(t, t('advanced'))).toStrictEqual(12);
    });

    it('returns "Contact" section count', () => {
      expect(getNumberOfSettingRoutesInTab(t, t('contacts'))).toStrictEqual(1);
    });

    it('returns "Security & privacy" section count', () => {
      expect(
        getNumberOfSettingRoutesInTab(t, t('securityAndPrivacy')),
      ).toStrictEqual(18);
    });

    it('returns "Alerts" section count', () => {
      expect(getNumberOfSettingRoutesInTab(t, t('alerts'))).toStrictEqual(2);
    });

    it('returns "Network" section count', () => {
      expect(getNumberOfSettingRoutesInTab(t, t('networks'))).toStrictEqual(6);
    });

    it('returns "Experimental" section count', () => {
      expect(getNumberOfSettingRoutesInTab(t, t('experimental'))).toStrictEqual(
        2,
      );
    });

    it('returns "About" section count', () => {
      expect(getNumberOfSettingRoutesInTab(t, t('about'))).toStrictEqual(9);
    });
  });

  // Can't be tested without DOM element
  describe('handleSettingsRefs', () => {
    it('should handle general refs', () => {
      const settingsRefs = Array(getNumberOfSettingRoutesInTab(t, t('general')))
        .fill(undefined)
        .map(() => {
          return React.createRef();
        });
      expect(handleSettingsRefs(t, t('general'), settingsRefs)).toBeUndefined();
    });
  });
});
