import React from 'react';
import {
  getSettingsRoutes,
  getNumberOfSettingsInSection,
  handleSettingsRefs,
} from './settings-search';

const t = (key) => {
  switch (key) {
    case 'general':
      return 'General';
    case 'currencyConversion':
      return 'Currency Conversion';
    case 'primaryCurrencySetting':
      return 'Primary Currency';
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
    /** TODO: Remove during TOKEN_DETECTION_V2 feature flag clean up */
    case 'useTokenDetection':
      return 'Use Token Detection';
    case 'useTokenDetectionDescription':
      return 'We use third-party APIs to detect and display new tokens sent to your wallet. Turn off if you don’t want MetaMask to pull data from those services.';
    case 'tokenDetection':
      return 'Token detection';
    case 'tokenDetectionToggleDescription':
      return 'ConsenSys’ token API aggregates a list of tokens from various third party token lists. Turning it off will stop detecting new tokens added to your wallet, but will keep the option to search for tokens to import.';
    case 'enableEIP1559V2':
      return 'Enable Enhanced Gas Fee UI';
    case 'enableEIP1559V2Description':
      return "We've updated how gas estimation and customization works. Turn on if you'd like to use the new gas experience. Learn more";
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
  describe('settingsRoutes', () => {
    it('should be an array of settings routes objects', () => {
      expect(getSettingsRoutes().length).toBeGreaterThan(0);
    });
  });

  describe('getNumberOfSettingsInSection', () => {
    it('should get good general section number', () => {
      expect(getNumberOfSettingsInSection(t, t('general'))).toStrictEqual(5);
    });

    it('should get good advanced section number', () => {
      expect(getNumberOfSettingsInSection(t, t('advanced'))).toStrictEqual(13);
    });

    it('should get good contact section number', () => {
      expect(getNumberOfSettingsInSection(t, t('contacts'))).toStrictEqual(1);
    });

    it('should get good security & privacy section number', () => {
      expect(
        getNumberOfSettingsInSection(t, t('securityAndPrivacy')),
      ).toStrictEqual(4);
    });

    it('should get good alerts section number', () => {
      expect(getNumberOfSettingsInSection(t, t('alerts'))).toStrictEqual(2);
    });

    it('should get good network section number', () => {
      expect(getNumberOfSettingsInSection(t, t('networks'))).toStrictEqual(6);
    });

    it('should get good experimental section number', () => {
      expect(getNumberOfSettingsInSection(t, t('experimental'))).toStrictEqual(
        4,
      );
    });

    it('should get good about section number', () => {
      expect(getNumberOfSettingsInSection(t, t('about'))).toStrictEqual(8);
    });
  });

  // Can't be tested without DOM element
  describe('handleSettingsRefs', () => {
    it('should handle general refs', () => {
      const settingsRefs = Array(getNumberOfSettingsInSection(t, t('general')))
        .fill(undefined)
        .map(() => {
          return React.createRef();
        });
      expect(handleSettingsRefs(t, t('general'), settingsRefs)).toBeUndefined();
    });
  });
});
