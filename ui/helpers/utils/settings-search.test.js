import React from 'react';
import {
  getSettingsRoutes,
  getSettingsSectionNumber,
  handleSettingsRefs,
} from './settings-search';

const t = (key) => {
  switch (key) {
    case 'general':
      return 'General';
    case 'currencyConversion':
      return 'Currency Conversion';
    case 'primaryCurrencySetting':
      return 'Primary Currenc';
    case 'primaryCurrencySettingDescription':
      return 'Select native to prioritize displaying values in the native currency of the chain (e.g. ETH). Select Fiat to prioritize displaying values in your selected fiat currency.';
    case 'currentLanguage':
      return 'Current Language';
    case 'accountIdenticon':
      return 'Current Language"';
    case 'hideZeroBalanceTokens':
      return 'Hide Tokens Without Balance';
    case 'advanced':
      return 'Advanced';
    case 'stateLogs':
      return 'State Logs';
    case 'stateLogsDescription':
      return 'State logs contain your public account addresses and sent transactions.';
    case 'syncWithMobile':
      return 'Sync with mobile';
    case 'resetAccount':
      return 'Reset Account';
    case 'resetAccountDescription':
      return 'Resetting your account will clear your transaction history. This will not change the balances in your accounts or require you to re-enter your Secret Recovery Phrase.';
    case 'showAdvancedGasInline':
      return 'Advanced gas controls';
    case 'showAdvancedGasInlineDescription':
      return 'Select this to show gas price and limit controls directly on the send and confirm screens.';
    case 'showHexData':
      return 'Show Hex Data';
    case 'showHexDataDescription':
      return 'Select this to show the hex data field on the send screen';
    case 'showFiatConversionInTestnets':
      return 'Show Conversion on test networks';
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
      return 'Auto-Lock Timer (minutes)';
    case 'autoLockTimeLimitDescription':
      return 'Set the idle time in minutes before MetaMask will become locked.';
    case 'syncWithThreeBox':
      return 'Sync data with 3Box (experimental)';
    case 'syncWithThreeBoxDescription':
      return 'Turn on to have your settings backed up with 3Box. This feature is currently experimental; use at your own risk.';
    case 'ipfsGateway':
      return 'IPFS Gateway';
    case 'ipfsGatewayDescription':
      return 'Enter the URL of the IPFS CID gateway to use for ENS content resolution.';
    case 'preferredLedgerConnectionType':
      return 'Preferred Ledger Connection Type';
    case 'dismissReminderField':
      return 'Dismiss Secret Recovery Phrase backup reminder';
    case 'dismissReminderDescriptionField':
      return 'Turn this on to dismiss the Secret Recovery Phrase backup reminder message. We highly recommend that you back up your Secret Recovery Phrase to avoid loss of funds';
    case 'Contacts':
      return 'Contacts';
    case 'securityAndPrivacy':
      return 'Security & Privacy';
    case 'revealSeedWords':
      return 'Reveal Secret Recovery Phrase';
    case 'showIncomingTransactions':
      return 'Show Incoming Transactions';
    case 'showIncomingTransactionsDescription':
      return 'Select this to use Etherscan to show incoming transactions in the transactions list';
    case 'usePhishingDetection':
      return 'Use Phishing Detection';
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
    case 'ropsten':
      return 'Ropsten Test Network';
    case 'rinkeby':
      return 'Rinkeby Test Network';
    case 'goerli':
      return 'Goerli Test Network';
    case 'kovan':
      return 'Kovan Test Network';
    case 'localhost':
      return 'Localhost 8545';
    case 'experimental':
      return 'Experimental';
    case 'useTokenDetection':
      return 'Use Token Detection';
    case 'useTokenDetectionDescription':
      return 'We use third-party APIs to detect and display new tokens sent to your wallet. Turn off if you don’t want MetaMask to pull data from those services.';
    case 'enableOpenSeaAPI':
      return 'Enable OpenSea API';
    case 'enableOpenSeaAPIDescription':
      return "Use OpenSea's API to fetch NFT data. NFT auto-detection relies on OpenSea's API, and will not be available when this is turned off.";
    case 'useCollectibleDetection':
      return 'Autodetect NFTs';
    case 'useCollectibleDetectionDescription':
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
      return 'Privacy Policy';
    case 'terms':
      return 'Terms of Use';
    case 'attributions':
      return 'Attributions';
    case 'supportCenter':
      return 'Visit our Support Center';
    case 'visitWebSite':
      return 'Visit our web site';
    case 'contactUs':
      return 'Contact us';
    case 'snaps':
      return 'Snaps';
    default:
      return '';
  }
};

describe('Settings Search Utils', () => {
  describe('getSettingsRoutes', () => {
    it('should get all settings', () => {
      const acceptedSettingsList = [
        {
          description: '',
          icon: 'fa fa-cog',
          route: '/settings/general#currency-conversion',
          section: 'Currency Conversion',
          tab: 'General',
        },
        {
          description:
            'Select native to prioritize displaying values in the native currency of the chain (e.g. ETH). Select Fiat to prioritize displaying values in your selected fiat currency.',
          icon: 'fa fa-cog',
          route: '/settings/general#primary-currency',
          section: 'Primary Currenc',
          tab: 'General',
        },
        {
          description: '',
          icon: 'fa fa-cog',
          route: '/settings/general#current-language',
          section: 'Current Language',
          tab: 'General',
        },
        {
          description: '',
          icon: 'fa fa-cog',
          route: '/settings/general#account-identicon',
          section: 'Current Language"',
          tab: 'General',
        },
        {
          description: '',
          icon: 'fa fa-cog',
          route: '/settings/general#zero-balancetokens',
          section: 'Hide Tokens Without Balance',
          tab: 'General',
        },
        {
          description:
            'State logs contain your public account addresses and sent transactions.',
          icon: 'fas fa-sliders-h',
          route: '/settings/advanced#state-logs',
          section: 'State Logs',
          tab: 'Advanced',
        },
        {
          description: '',
          icon: 'fas fa-sliders-h',
          route: '/settings/advanced#sync-withmobile',
          section: 'Sync with mobile',
          tab: 'Advanced',
        },
        {
          description:
            'Resetting your account will clear your transaction history. This will not change the balances in your accounts or require you to re-enter your Secret Recovery Phrase.',
          icon: 'fas fa-sliders-h',
          route: '/settings/advanced#reset-account',
          section: 'Reset Account',
          tab: 'Advanced',
        },
        {
          description:
            'Select this to show gas price and limit controls directly on the send and confirm screens.',
          icon: 'fas fa-sliders-h',
          route: '/settings/advanced#advanced-gascontrols',
          section: 'Advanced gas controls',
          tab: 'Advanced',
        },
        {
          description:
            'Select this to show the hex data field on the send screen',
          icon: 'fas fa-sliders-h',
          route: '/settings/advanced#show-hexdata',
          section: 'Show Hex Data',
          tab: 'Advanced',
        },
        {
          description: 'Select this to show fiat conversion on test network',
          icon: 'fas fa-sliders-h',
          route: '/settings/advanced#conversion-testnetworks',
          section: 'Show Conversion on test networks',
          tab: 'Advanced',
        },
        {
          description: 'Select this to show test networks in network list',
          icon: 'fas fa-sliders-h',
          route: '/settings/advanced#show-testnets',
          section: 'Show test networks',
          tab: 'Advanced',
        },
        {
          description:
            'Turn this on to change the nonce (transaction number) on confirmation screens. This is an advanced feature, use cautiously.',
          icon: 'fas fa-sliders-h',
          route: '/settings/advanced#customize-nonce',
          section: 'Customize transaction nonce',
          tab: 'Advanced',
        },
        {
          description:
            'Set the idle time in minutes before MetaMask will become locked.',
          icon: 'fas fa-sliders-h',
          route: '/settings/advanced#autolock-timer',
          section: 'Auto-Lock Timer (minutes)',
          tab: 'Advanced',
        },
        {
          description:
            'Turn on to have your settings backed up with 3Box. This feature is currently experimental; use at your own risk.',
          icon: 'fas fa-sliders-h',
          route: '/settings/advanced#sync-with3box',
          section: 'Sync data with 3Box (experimental)',
          tab: 'Advanced',
        },
        {
          description:
            'Enter the URL of the IPFS CID gateway to use for ENS content resolution.',
          icon: 'fas fa-sliders-h',
          route: '/settings/advanced#ipfs-gateway',
          section: 'IPFS Gateway',
          tab: 'Advanced',
        },
        {
          description: 'Preferred Ledger Connection Type',
          icon: 'fas fa-sliders-h',
          route: '/settings/advanced#ledger-connection',
          section: 'Preferred Ledger Connection Type',
          tab: 'Advanced',
        },
        {
          description:
            'Turn this on to dismiss the Secret Recovery Phrase backup reminder message. We highly recommend that you back up your Secret Recovery Phrase to avoid loss of funds',
          icon: 'fas fa-sliders-h',
          route: '/settings/advanced#dimiss-secretrecovery',
          section: 'Dismiss Secret Recovery Phrase backup reminder',
          tab: 'Advanced',
        },
        {
          description: '',
          icon: 'fa fa-address-book',
          route: '/settings/contact-list',
          section: '',
          tab: '',
        },
        ///: BEGIN:ONLY_INCLUDE_IN(flask)
        {
          description: 'Snaps',
          icon: 'fa fa-flask',
          route: '/settings/snaps-list',
          section: 'Snaps',
          tab: 'Snaps',
        },
        ///: END:ONLY_INCLUDE_IN
        {
          description: 'Reveal Secret Recovery Phrase',
          icon: 'fa fa-lock',
          route: '/settings/security#reveal-secretrecovery',
          section: 'Reveal Secret Recovery Phrase',
          tab: 'Security & Privacy',
        },
        {
          description:
            'Select this to use Etherscan to show incoming transactions in the transactions list',
          icon: 'fa fa-lock',
          route: '/settings/security#incoming-transaction',
          section: 'Show Incoming Transactions',
          tab: 'Security & Privacy',
        },
        {
          description:
            'Display a warning for phishing domains targeting Ethereum users',
          icon: 'fa fa-lock',
          route: '/settings/security#phishing-detection',
          section: 'Use Phishing Detection',
          tab: 'Security & Privacy',
        },
        {
          description:
            'Participate in MetaMetrics to help us make MetaMask better',
          icon: 'fa fa-lock',
          route: '/settings/security#metrametrics',
          section: 'Participate in MetaMetrics',
          tab: 'Security & Privacy',
        },
        {
          description:
            'Browsing a website with an unconnected account selected',
          icon: 'fa fa-bell',
          route: '/settings/alerts#unconnected-account',
          section: 'Browsing a website with an unconnected account selected',
          tab: 'Alerts',
        },
        {
          description:
            'When a website tries to use the removed window.web3 API',
          icon: 'fa fa-bell',
          route: '/settings/alerts#web3-shimusage',
          section: 'When a website tries to use the removed window.web3 API',
          tab: 'Alerts',
        },
        {
          description: 'Ethereum Mainnet',
          icon: 'fa fa-plug',
          route: '/settings/networks#networks-mainnet',
          section: 'Ethereum Mainnet',
          tab: 'Networks',
        },
        {
          description: 'Ropsten Test Network',
          icon: 'fa fa-plug',
          route: '/settings/networks#networks-ropsten',
          section: 'Ropsten Test Network',
          tab: 'Networks',
        },
        {
          description: 'Rinkeby Test Network',
          icon: 'fa fa-plug',
          route: '/settings/networks#networks-rinkeby',
          section: 'Rinkeby Test Network',
          tab: 'Networks',
        },
        {
          description: 'Goerli Test Network',
          icon: 'fa fa-plug',
          route: '/settings/networks#networks-goerli',
          section: 'Goerli Test Network',
          tab: 'Networks',
        },
        {
          description: 'Kovan Test Network',
          icon: 'fa fa-plug',
          route: '/settings/networks#networtks-kovan',
          section: 'Kovan Test Network',
          tab: 'Networks',
        },
        {
          description: 'Localhost 8545',
          icon: 'fa fa-plug',
          route: '/settings/networks#network-localhost',
          section: 'Localhost 8545',
          tab: 'Networks',
        },
        {
          description:
            'We use third-party APIs to detect and display new tokens sent to your wallet. Turn off if you don’t want MetaMask to pull data from those services.',
          icon: 'fa fa-flask',
          route: '/settings/experimental#token-description',
          section: 'Use Token Detection',
          tab: 'Experimental',
        },
        {
          description:
            "Use OpenSea's API to fetch NFT data. NFT auto-detection relies on OpenSea's API, and will not be available when this is turned off.",
          icon: 'fa fa-flask',
          route: '/settings/experimental#opensea-api',
          section: 'Enable OpenSea API',
          tab: 'Experimental',
        },
        {
          description:
            'Displaying NFTs media & data may expose your IP address to centralized servers. Third-party APIs (like OpenSea) are used to detect NFTs in your wallet. This exposes your account address with those services. Leave this disabled if you don’t want the app to pull data from those those services.',
          icon: 'fa fa-flask',
          route: '/settings/experimental#autodetect-nfts',
          section: 'Autodetect NFTs',
          tab: 'Experimental',
        },
        {
          description: 'MetaMask is designed and built around the world.',
          icon: 'fa fa-info-circle',
          route: '/settings/about-us#version',
          section: 'MetaMask Version',
          tab: 'About',
        },
        {
          description: '',
          icon: 'fa fa-info-circle',
          route: '/settings/about-us#links',
          section: 'Links',
          tab: 'About',
        },
        {
          description: 'Privacy Policy',
          icon: 'fa fa-info-circle',
          route: '/settings/about-us#privacy-policy',
          section: 'Privacy Policy',
          tab: 'About',
        },
        {
          description: 'Terms of Use',
          icon: 'fa fa-info-circle',
          route: '/settings/about-us#terms',
          section: 'Terms of Use',
          tab: 'About',
        },
        {
          description: 'Attributions',
          icon: 'fa fa-info-circle',
          route: '/settings/about-us#attributions',
          section: 'Attributions',
          tab: 'About',
        },
        {
          description: 'Visit our Support Center',
          icon: 'fa fa-info-circle',
          route: '/settings/about-us#supportcenter',
          section: 'Visit our Support Center',
          tab: 'About',
        },
        {
          description: 'Visit our web site',
          icon: 'fa fa-info-circle',
          route: '/settings/about-us#visitwebsite',
          section: 'Visit our web site',
          tab: 'About',
        },
        {
          description: 'Contact us',
          icon: 'fa fa-info-circle',
          route: '/settings/about-us#contactus',
          section: 'Contact us',
          tab: 'About',
        },
      ];
      for (let i = 0; i < acceptedSettingsList.length; i++) {
        acceptedSettingsList[i].id = i + 1;
      }
      expect(getSettingsRoutes(t)).toStrictEqual(acceptedSettingsList);
    });

    it('should not get all settings', () => {
      const acceptedSettingsList = [
        {
          description: '',
          image: 'general-icon.svg',
          route: '/settings/general#currency-conversion',
          section: 'Currency Conversion',
          tab: 'General',
        },
        {
          description: 'Contact us',
          image: 'info-icon.svg',
          route: '/settings/about-us#contactus',
          section: 'Contact us',
          tab: 'About',
        },
      ];
      expect(getSettingsRoutes(t)).not.toStrictEqual(acceptedSettingsList);
    });
  });

  describe('getSettingsSectionNumber', () => {
    it('should get good general section number', () => {
      expect(getSettingsSectionNumber(t, t('general'))).toStrictEqual(5);
    });

    it('should get good advanced section number', () => {
      expect(getSettingsSectionNumber(t, t('advanced'))).toStrictEqual(13);
    });

    it('should get good contact section number', () => {
      expect(getSettingsSectionNumber(t, t('contacts'))).toStrictEqual(1);
    });

    it('should get good security & privacy section number', () => {
      expect(
        getSettingsSectionNumber(t, t('securityAndPrivacy')),
      ).toStrictEqual(4);
    });

    it('should get good alerts section number', () => {
      expect(getSettingsSectionNumber(t, t('alerts'))).toStrictEqual(2);
    });

    it('should get good network section number', () => {
      expect(getSettingsSectionNumber(t, t('networks'))).toStrictEqual(6);
    });

    it('should get good experimental section number', () => {
      expect(getSettingsSectionNumber(t, t('experimental'))).toStrictEqual(1);
    });

    it('should get good about section number', () => {
      expect(getSettingsSectionNumber(t, t('about'))).toStrictEqual(8);
    });
  });

  // Can't be tested without DOM element
  describe('handleSettingsRefs', () => {
    it('should handle general refs', () => {
      const settingsRefs = Array(getSettingsSectionNumber(t, t('general')))
        .fill(undefined)
        .map(() => {
          return React.createRef();
        });
      expect(handleSettingsRefs(t, t('general'), settingsRefs)).toBeUndefined();
    });
  });
});
