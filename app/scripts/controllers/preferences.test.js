/**
 * @jest-environment node
 */
import { ControllerMessenger } from '@metamask/base-controller';
import { TokenListController } from '@metamask/assets-controllers';
import { CHAIN_IDS } from '../../../shared/constants/network';
import PreferencesController from './preferences';

const NETWORK_CONFIGURATION_DATA = {
  'test-networkConfigurationId-1': {
    rpcUrl: 'https://testrpc.com',
    chainId: CHAIN_IDS.GOERLI,
    nickname: '0X5',
    rpcPrefs: { blockExplorerUrl: 'https://etherscan.io' },
  },
  'test-networkConfigurationId-2': {
    rpcUrl: 'http://localhost:8545',
    chainId: '0x539',
    ticker: 'ETH',
    nickname: 'Localhost 8545',
    rpcPrefs: {},
  },
};
describe('preferences controller', () => {
  let preferencesController;
  let tokenListController;

  beforeEach(() => {
    const tokenListMessenger = new ControllerMessenger().getRestricted({
      name: 'TokenListController',
    });
    tokenListController = new TokenListController({
      chainId: '1',
      preventPollingOnNetworkRestart: false,
      onNetworkStateChange: jest.fn(),
      onPreferencesStateChange: jest.fn(),
      messenger: tokenListMessenger,
    });

    preferencesController = new PreferencesController({
      initLangCode: 'en_US',
      tokenListController,
      networkConfigurations: NETWORK_CONFIGURATION_DATA,
    });
  });

  describe('useBlockie', () => {
    it('defaults useBlockie to false', () => {
      expect(preferencesController.store.getState().useBlockie).toStrictEqual(
        false,
      );
    });

    it('setUseBlockie to true', () => {
      preferencesController.setUseBlockie(true);
      expect(preferencesController.store.getState().useBlockie).toStrictEqual(
        true,
      );
    });
  });

  describe('setCurrentLocale', () => {
    it('checks the default currentLocale', () => {
      const { currentLocale } = preferencesController.store.getState();
      expect(currentLocale).toStrictEqual('en_US');
    });

    it('sets current locale in preferences controller', () => {
      preferencesController.setCurrentLocale('ja');
      const { currentLocale } = preferencesController.store.getState();
      expect(currentLocale).toStrictEqual('ja');
    });
  });

  describe('setAddresses', () => {
    it('should keep a map of addresses to names and addresses in the store', () => {
      preferencesController.setAddresses(['0xda22le', '0x7e57e2']);

      const { identities } = preferencesController.store.getState();
      expect(identities).toStrictEqual({
        '0xda22le': {
          name: 'Account 1',
          address: '0xda22le',
        },
        '0x7e57e2': {
          name: 'Account 2',
          address: '0x7e57e2',
        },
      });
    });

    it('should replace its list of addresses', () => {
      preferencesController.setAddresses(['0xda22le', '0x7e57e2']);
      preferencesController.setAddresses(['0xda22le77', '0x7e57e277']);

      const { identities } = preferencesController.store.getState();
      expect(identities).toStrictEqual({
        '0xda22le77': {
          name: 'Account 1',
          address: '0xda22le77',
        },
        '0x7e57e277': {
          name: 'Account 2',
          address: '0x7e57e277',
        },
      });
    });
  });

  describe('removeAddress', () => {
    it('should remove an address from state', () => {
      preferencesController.setAddresses(['0xda22le', '0x7e57e2']);

      preferencesController.removeAddress('0xda22le');

      expect(
        preferencesController.store.getState().identities['0xda22le'],
      ).toStrictEqual(undefined);
    });

    it('should switch accounts if the selected address is removed', () => {
      preferencesController.setAddresses(['0xda22le', '0x7e57e2']);

      preferencesController.setSelectedAddress('0x7e57e2');
      preferencesController.removeAddress('0x7e57e2');
      expect(preferencesController.getSelectedAddress()).toStrictEqual(
        '0xda22le',
      );
    });
  });

  describe('setAccountLabel', () => {
    it('should update a label for the given account', () => {
      preferencesController.setAddresses(['0xda22le', '0x7e57e2']);

      expect(
        preferencesController.store.getState().identities['0xda22le'],
      ).toStrictEqual({
        name: 'Account 1',
        address: '0xda22le',
      });

      preferencesController.setAccountLabel('0xda22le', 'Dazzle');
      expect(
        preferencesController.store.getState().identities['0xda22le'],
      ).toStrictEqual({
        name: 'Dazzle',
        address: '0xda22le',
      });
    });
  });

  describe('setPasswordForgotten', () => {
    it('should default to false', () => {
      expect(
        preferencesController.store.getState().forgottenPassword,
      ).toStrictEqual(false);
    });

    it('should set the forgottenPassword property in state', () => {
      preferencesController.setPasswordForgotten(true);
      expect(
        preferencesController.store.getState().forgottenPassword,
      ).toStrictEqual(true);
    });
  });

  describe('setUsePhishDetect', () => {
    it('should default to true', () => {
      expect(
        preferencesController.store.getState().usePhishDetect,
      ).toStrictEqual(true);
    });

    it('should set the usePhishDetect property in state', () => {
      preferencesController.setUsePhishDetect(false);
      expect(
        preferencesController.store.getState().usePhishDetect,
      ).toStrictEqual(false);
    });
  });

  describe('setUseMultiAccountBalanceChecker', () => {
    it('should default to true', () => {
      expect(
        preferencesController.store.getState().useMultiAccountBalanceChecker,
      ).toStrictEqual(true);
    });

    it('should set the setUseMultiAccountBalanceChecker property in state', () => {
      preferencesController.setUseMultiAccountBalanceChecker(false);
      expect(
        preferencesController.store.getState().useMultiAccountBalanceChecker,
      ).toStrictEqual(false);
    });
  });

  describe('setUseSafeChainsListValidation', function () {
    it('should default to true', function () {
      const state = preferencesController.store.getState();

      expect(state.useSafeChainsListValidation).toStrictEqual(true);
    });

    it('should set the `setUseSafeChainsListValidation` property in state', function () {
      expect(
        preferencesController.store.getState().useSafeChainsListValidation,
      ).toStrictEqual(true);

      preferencesController.setUseSafeChainsListValidation(false);

      expect(
        preferencesController.store.getState().useSafeChainsListValidation,
      ).toStrictEqual(false);
    });
  });

  describe('setUseTokenDetection', function () {
    it('should default to false', function () {
      const state = preferencesController.store.getState();

      expect(state.useTokenDetection).toStrictEqual(false);
    });

    it('should set the useTokenDetection property in state', () => {
      preferencesController.setUseTokenDetection(true);
      expect(
        preferencesController.store.getState().useTokenDetection,
      ).toStrictEqual(true);
    });
  });

  describe('setUseNftDetection', () => {
    it('should default to false', () => {
      expect(
        preferencesController.store.getState().useNftDetection,
      ).toStrictEqual(false);
    });

    it('should set the useNftDetection property in state', () => {
      preferencesController.setOpenSeaEnabled(true);
      preferencesController.setUseNftDetection(true);
      expect(
        preferencesController.store.getState().useNftDetection,
      ).toStrictEqual(true);
    });
  });

  describe('setUse4ByteResolution', () => {
    it('should default to true', () => {
      expect(
        preferencesController.store.getState().use4ByteResolution,
      ).toStrictEqual(true);
    });

    it('should set the use4ByteResolution property in state', () => {
      preferencesController.setUse4ByteResolution(false);
      expect(
        preferencesController.store.getState().use4ByteResolution,
      ).toStrictEqual(false);
    });
  });

  describe('setOpenSeaEnabled', () => {
    it('should default to false', () => {
      expect(
        preferencesController.store.getState().openSeaEnabled,
      ).toStrictEqual(false);
    });

    it('should set the openSeaEnabled property in state', () => {
      preferencesController.setOpenSeaEnabled(true);
      expect(
        preferencesController.store.getState().openSeaEnabled,
      ).toStrictEqual(true);
    });
  });

  describe('setAdvancedGasFee', () => {
    it('should default to an empty object', () => {
      expect(
        preferencesController.store.getState().advancedGasFee,
      ).toStrictEqual({});
    });

    it('should set the setAdvancedGasFee property in state', () => {
      preferencesController.setAdvancedGasFee({
        chainId: CHAIN_IDS.GOERLI,
        gasFeePreferences: {
          maxBaseFee: '1.5',
          priorityFee: '2',
        },
      });
      expect(
        preferencesController.store.getState().advancedGasFee[CHAIN_IDS.GOERLI]
          .maxBaseFee,
      ).toStrictEqual('1.5');
      expect(
        preferencesController.store.getState().advancedGasFee[CHAIN_IDS.GOERLI]
          .priorityFee,
      ).toStrictEqual('2');
    });
  });

  describe('setTheme', () => {
    it('should default to value "OS"', () => {
      expect(preferencesController.store.getState().theme).toStrictEqual('os');
    });

    it('should set the setTheme property in state', () => {
      preferencesController.setTheme('dark');
      expect(preferencesController.store.getState().theme).toStrictEqual(
        'dark',
      );
    });
  });

  describe('setUseCurrencyRateCheck', () => {
    it('should default to false', () => {
      expect(
        preferencesController.store.getState().useCurrencyRateCheck,
      ).toStrictEqual(true);
    });

    it('should set the useCurrencyRateCheck property in state', () => {
      preferencesController.setUseCurrencyRateCheck(false);
      expect(
        preferencesController.store.getState().useCurrencyRateCheck,
      ).toStrictEqual(false);
    });
  });

  describe('setIncomingTransactionsPreferences', () => {
    const addedNonTestNetworks = Object.keys(NETWORK_CONFIGURATION_DATA);

    it('should have default value combined', () => {
      const state = preferencesController.store.getState();
      expect(state.incomingTransactionsPreferences).toStrictEqual({
        [CHAIN_IDS.MAINNET]: true,
        [CHAIN_IDS.LINEA_MAINNET]: true,
        [NETWORK_CONFIGURATION_DATA[addedNonTestNetworks[0]].chainId]: true,
        [NETWORK_CONFIGURATION_DATA[addedNonTestNetworks[1]].chainId]: true,
        [CHAIN_IDS.GOERLI]: true,
        [CHAIN_IDS.SEPOLIA]: true,
        [CHAIN_IDS.LINEA_GOERLI]: true,
      });
    });

    it('should update incomingTransactionsPreferences with given value set', () => {
      preferencesController.setIncomingTransactionsPreferences(
        [CHAIN_IDS.LINEA_MAINNET],
        false,
      );
      const state = preferencesController.store.getState();
      expect(state.incomingTransactionsPreferences).toStrictEqual({
        [CHAIN_IDS.MAINNET]: true,
        [CHAIN_IDS.LINEA_MAINNET]: false,
        [NETWORK_CONFIGURATION_DATA[addedNonTestNetworks[0]].chainId]: true,
        [NETWORK_CONFIGURATION_DATA[addedNonTestNetworks[1]].chainId]: true,
        [CHAIN_IDS.GOERLI]: true,
        [CHAIN_IDS.SEPOLIA]: true,
        [CHAIN_IDS.LINEA_GOERLI]: true,
      });
    });
  });

  ///: BEGIN:ONLY_INCLUDE_IF(petnames)
  describe('setUseExternalNameSources', () => {
    it('should default to true', () => {
      expect(
        preferencesController.store.getState().useExternalNameSources,
      ).toStrictEqual(true);
    });

    it('should set the useExternalNameSources property in state', () => {
      preferencesController.setUseExternalNameSources(false);
      expect(
        preferencesController.store.getState().useExternalNameSources,
      ).toStrictEqual(false);
    });
  });
  ///: END:ONLY_INCLUDE_IF
});
