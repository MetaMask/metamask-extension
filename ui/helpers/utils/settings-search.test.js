import React from 'react';
import SETTINGS_CONSTANTS from '../constants/settings';
import {
  getSettingsRoutes,
  getNumberOfSettingRoutesInTab,
  handleSettingsRefs,
  getSpecificSettingsRoute,
  escapeRegExp,
  colorText,
  highlightSearchedText,
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
    case 'smartTransactions':
      return 'Smart transactions';
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
    case 'nonceFieldDesc':
      return 'Turn this on to change the nonce (transaction number) when sending assets. This is an advanced feature, use cautiously.';
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
    case 'overrideContentSecurityPolicyHeader':
      return 'Override Content-Security-Policy header';
    case 'overrideContentSecurityPolicyHeaderDescription':
      return "This option is a workaround for a known issue in Firefox, where a dapp's Content-Security-Policy header may prevent the extension from loading properly. Disabling this option is not recommended unless required for specific web page compatibility.";
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
    case 'developerOptions':
      return 'Developer Options';
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
      const NUM_OF_ENV_FEATURE_FLAG_SETTINGS = 4;
      const NUM_OF_HIDDEN_SETTINGS = 1;

      expect(getSettingsRoutes()).toHaveLength(
        SETTINGS_CONSTANTS.length -
          NUM_OF_ENV_FEATURE_FLAG_SETTINGS -
          NUM_OF_HIDDEN_SETTINGS,
      );
    });
  });

  describe('getNumberOfSettingRoutesInTab', () => {
    it('returns "General" section count', () => {
      expect(getNumberOfSettingRoutesInTab(t, t('general'))).toStrictEqual(6);
    });

    it('returns "Advanced" section count', () => {
      expect(getNumberOfSettingRoutesInTab(t, t('advanced'))).toStrictEqual(11);
    });

    it('returns "Contact" section count', () => {
      expect(getNumberOfSettingRoutesInTab(t, t('contacts'))).toStrictEqual(1);
    });

    it('returns "Security & privacy" section count', () => {
      expect(
        getNumberOfSettingRoutesInTab(t, t('securityAndPrivacy')),
      ).toStrictEqual(21);
    });

    it('returns "Network" section count', () => {
      expect(getNumberOfSettingRoutesInTab(t, t('networks'))).toStrictEqual(7);
    });

    it('returns "Experimental" section count', () => {
      expect(getNumberOfSettingRoutesInTab(t, t('experimental'))).toStrictEqual(
        4,
      );
    });

    it('returns 0 "Developer Options" section count when env flag is disabled', () => {
      expect(
        getNumberOfSettingRoutesInTab(t, t('developerOptions')),
      ).toStrictEqual(0);
    });

    it('returns "About" section count', () => {
      expect(getNumberOfSettingRoutesInTab(t, t('about'))).toStrictEqual(9);
    });
  });

  describe('escapeRegExp', () => {
    it('should escape special characters for use in regular expressions', () => {
      const input = '.*+?^${}()|[]\\';
      const expectedOutput = '\\.\\*\\+\\?\\^\\$\\{\\}\\(\\)\\|\\[\\]\\\\';
      expect(escapeRegExp(input)).toBe(expectedOutput);
    });

    it('should return the same string if no special characters are present', () => {
      const input = 'hello';
      expect(escapeRegExp(input)).toBe(input);
    });

    it('should escape only the special characters in a mixed string', () => {
      const input = 'hello.*world';
      const expectedOutput = 'hello\\.\\*world';
      expect(escapeRegExp(input)).toBe(expectedOutput);
    });

    it('should handle an empty string correctly', () => {
      const input = '';
      expect(escapeRegExp(input)).toBe('');
    });

    it('should escape backslashes properly', () => {
      const input = '\\';
      const expectedOutput = '\\\\';
      expect(escapeRegExp(input)).toBe(expectedOutput);
    });

    it('should escape backslashes with content properly', () => {
      const input = 'foobar\\';
      const expectedOutput = 'foobar\\\\';
      expect(escapeRegExp(input)).toBe(expectedOutput);
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

  describe('getSpecificSettingsRoute', () => {
    it('should return show native token as main balance route', () => {
      const result = getSpecificSettingsRoute(
        t,
        t('general'),
        t('showNativeTokenAsMainBalance'),
      );
      expect(result.route).toBe(
        '/settings/general#show-native-token-as-main-balance',
      );
    });
  });

  describe('colorText', () => {
    let mockElement;

    beforeEach(() => {
      mockElement = {
        innerHTML: 'Test &amp; string with multiple words',
      };
    });

    afterEach(() => {
      jest.clearAllMocks();
    });

    it('should highlight text that matches the regex', () => {
      const regex = /string/giu;
      colorText(mockElement, regex);
      expect(mockElement.innerHTML).toBe(
        'Test & <span class="settings-page__header__search__list__item__highlight">string</span> with multiple words',
      );
    });

    it('should correctly decode &amp; to &', () => {
      const regex = /&/giu;
      colorText(mockElement, regex);
      expect(mockElement.innerHTML).toBe(
        'Test <span class="settings-page__header__search__list__item__highlight">&</span> string with multiple words',
      );
    });

    it('should remove any existing highlight spans before applying new highlights', () => {
      mockElement.innerHTML =
        'Test &amp; <span class="settings-page__header__search__list__item__highlight">string</span> with multiple words';
      const regex = /multiple/giu;
      colorText(mockElement, regex);
      expect(mockElement.innerHTML).toBe(
        'Test & string with <span class="settings-page__header__search__list__item__highlight">multiple</span> words',
      );
    });

    it('should not modify innerHTML if menuElement is null', () => {
      const regex = /string/giu;
      const nullElement = null;
      colorText(nullElement, regex);
      expect(nullElement).toBeNull();
    });

    it('should not highlight anything if regex doesn’t match', () => {
      const regex = /nomatch/giu;
      colorText(mockElement, regex);
      expect(mockElement.innerHTML).toBe('Test & string with multiple words');
    });
  });

  describe('highlightSearchedText', () => {
    let searchElem;
    let mockResultItems;
    let mockMenuTabElement;
    let mockMenuSectionElement;

    beforeEach(() => {
      searchElem = document.createElement('input');
      searchElem.id = 'search-settings';
      searchElem.value = 'test';
      document.body.appendChild(searchElem);

      // Mock result list items
      mockResultItems = [...Array(2)].map(() => {
        const item = document.createElement('div');
        item.classList.add('settings-page__header__search__list__item');

        mockMenuTabElement = document.createElement('div');
        mockMenuTabElement.classList.add(
          'settings-page__header__search__list__item__tab',
        );
        mockMenuTabElement.innerHTML = 'Test tab';

        mockMenuSectionElement = document.createElement('div');
        mockMenuSectionElement.classList.add(
          'settings-page__header__search__list__item__section',
        );
        mockMenuSectionElement.innerHTML = 'Test section';

        item.appendChild(mockMenuTabElement);
        item.appendChild(mockMenuSectionElement);

        return item;
      });

      mockResultItems.forEach((item) => document.body.appendChild(item));
    });

    afterEach(() => {
      document.body.innerHTML = '';
    });

    it('should highlight the matching text in both menuTabElement and menuSectionElement', () => {
      highlightSearchedText();
      mockResultItems.forEach((item) => {
        const tabElement = item.querySelector(
          '.settings-page__header__search__list__item__tab',
        );
        const sectionElement = item.querySelector(
          '.settings-page__header__search__list__item__section',
        );
        expect(tabElement.innerHTML).toBe(
          '<span class="settings-page__header__search__list__item__highlight">Test</span> tab',
        );
        expect(sectionElement.innerHTML).toBe(
          '<span class="settings-page__header__search__list__item__highlight">Test</span> section',
        );
      });
    });

    it('should not alter the innerHTML if no match is found', () => {
      searchElem.value = 'nomatch';
      highlightSearchedText();
      mockResultItems.forEach((item) => {
        const tabElement = item.querySelector(
          '.settings-page__header__search__list__item__tab',
        );
        const sectionElement = item.querySelector(
          '.settings-page__header__search__list__item__section',
        );

        expect(tabElement.innerHTML).toBe('Test tab');
        expect(sectionElement.innerHTML).toBe('Test section');
      });
    });

    it('should do nothing if the search input is empty', () => {
      searchElem.value = '';
      highlightSearchedText();
      mockResultItems.forEach((item) => {
        const tabElement = item.querySelector(
          '.settings-page__header__search__list__item__tab',
        );
        const sectionElement = item.querySelector(
          '.settings-page__header__search__list__item__section',
        );

        expect(tabElement.innerHTML).toBe(
          '<span class="settings-page__header__search__list__item__highlight"></span>T<span class="settings-page__header__search__list__item__highlight"></span>e<span class="settings-page__header__search__list__item__highlight"></span>s<span class="settings-page__header__search__list__item__highlight"></span>t<span class="settings-page__header__search__list__item__highlight"></span> <span class="settings-page__header__search__list__item__highlight"></span>t<span class="settings-page__header__search__list__item__highlight"></span>a<span class="settings-page__header__search__list__item__highlight"></span>b<span class="settings-page__header__search__list__item__highlight"></span>',
        );
        expect(sectionElement.innerHTML).toBe(
          '<span class="settings-page__header__search__list__item__highlight"></span>T<span class="settings-page__header__search__list__item__highlight"></span>e<span class="settings-page__header__search__list__item__highlight"></span>s<span class="settings-page__header__search__list__item__highlight"></span>t<span class="settings-page__header__search__list__item__highlight"></span> <span class="settings-page__header__search__list__item__highlight"></span>s<span class="settings-page__header__search__list__item__highlight"></span>e<span class="settings-page__header__search__list__item__highlight"></span>c<span class="settings-page__header__search__list__item__highlight"></span>t<span class="settings-page__header__search__list__item__highlight"></span>i<span class="settings-page__header__search__list__item__highlight"></span>o<span class="settings-page__header__search__list__item__highlight"></span>n<span class="settings-page__header__search__list__item__highlight"></span>',
        );
      });
    });
  });
});
