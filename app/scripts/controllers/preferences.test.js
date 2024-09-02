/**
 * @jest-environment node
 */
import { ControllerMessenger } from '@metamask/base-controller';
import { TokenListController } from '@metamask/assets-controllers';
import { AccountsController } from '@metamask/accounts-controller';
import { CHAIN_IDS } from '../../../shared/constants/network';
import { mockNetworkState } from '../../../test/stub/networks';
import PreferencesController from './preferences';

const NETWORK_CONFIGURATION_DATA = mockNetworkState(
  {
    id: 'test-networkConfigurationId-1',
    rpcUrl: 'https://testrpc.com',
    chainId: CHAIN_IDS.GOERLI,
    nickname: '0X5',
    rpcPrefs: { blockExplorerUrl: 'https://etherscan.io' },
  },
  {
    id: 'test-networkConfigurationId-2',
    rpcUrl: 'http://localhost:8545',
    chainId: '0x539',
    ticker: 'ETH',
    nickname: 'Localhost 8545',
    rpcPrefs: {},
  },
).networkConfigurations;

describe('preferences controller', () => {
  let controllerMessenger;
  let preferencesController;
  let accountsController;
  let tokenListController;

  beforeEach(() => {
    controllerMessenger = new ControllerMessenger();

    const accountsControllerMessenger = controllerMessenger.getRestricted({
      name: 'AccountsController',
      allowedEvents: [
        'SnapController:stateChange',
        'KeyringController:accountRemoved',
        'KeyringController:stateChange',
      ],
      allowedActions: [
        'KeyringController:getAccounts',
        'KeyringController:getKeyringsByType',
        'KeyringController:getKeyringForAccount',
      ],
    });

    accountsController = new AccountsController({
      messenger: accountsControllerMessenger,
    });

    const tokenListMessenger = controllerMessenger.getRestricted({
      name: 'TokenListController',
    });
    tokenListController = new TokenListController({
      chainId: '1',
      preventPollingOnNetworkRestart: false,
      onNetworkStateChange: jest.fn(),
      onPreferencesStateChange: jest.fn(),
      messenger: tokenListMessenger,
    });

    const preferencesMessenger = controllerMessenger.getRestricted({
      name: 'PreferencesController',
      allowedActions: [
        `AccountsController:setSelectedAccount`,
        `AccountsController:getAccountByAddress`,
        `AccountsController:setAccountName`,
      ],
      allowedEvents: [`AccountsController:stateChange`],
    });

    preferencesController = new PreferencesController({
      initLangCode: 'en_US',
      tokenListController,
      networkConfigurations: NETWORK_CONFIGURATION_DATA,
      messenger: preferencesMessenger,
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

  describe('setAccountLabel', () => {
    const mockName = 'mockName';
    const firstAddress = '0x1f9090aaE28b8a3dCeaDf281B0F12828e676c326';
    const secondAddress = '0x0affb0a96fbefaa97dce488dfd97512346cf3ab8';

    it('updating name from preference controller will update the name in accounts controller and preferences controller', () => {
      controllerMessenger.publish('KeyringController:stateChange', {
        isUnlocked: true,
        keyrings: [
          {
            type: 'HD Key Tree',
            accounts: [firstAddress, secondAddress],
          },
        ],
      });

      let [firstAccount, secondAccount] = accountsController.listAccounts();

      const { identities } = preferencesController.store.getState();

      const firstPreferenceAccount = identities[firstAccount.address];
      const secondPreferenceAccount = identities[secondAccount.address];

      expect(firstAccount.metadata.name).toBe(firstPreferenceAccount.name);
      expect(secondAccount.metadata.name).toBe(secondPreferenceAccount.name);

      preferencesController.setAccountLabel(firstAccount.address, mockName);

      // refresh state after state changed

      [firstAccount, secondAccount] = accountsController.listAccounts();

      const { identities: updatedIdentities } =
        preferencesController.store.getState();

      const updatedFirstPreferenceAccount =
        updatedIdentities[firstAccount.address];
      const updatedSecondPreferenceAccount =
        updatedIdentities[secondAccount.address];

      expect(firstAccount.metadata.name).toBe(
        updatedFirstPreferenceAccount.name,
      );
      expect(updatedFirstPreferenceAccount.name).toBe(mockName);
      expect(secondAccount.metadata.name).toBe(
        updatedSecondPreferenceAccount.name,
      );
    });

    it('updating name from accounts controller updates the name in preferences controller', () => {
      controllerMessenger.publish('KeyringController:stateChange', {
        isUnlocked: true,
        keyrings: [
          {
            type: 'HD Key Tree',
            accounts: [firstAddress, secondAddress],
          },
        ],
      });

      let [firstAccount, secondAccount] = accountsController.listAccounts();

      const { identities } = preferencesController.store.getState();

      const firstPreferenceAccount = identities[firstAccount.address];
      const secondPreferenceAccount = identities[secondAccount.address];

      expect(firstAccount.metadata.name).toBe(firstPreferenceAccount.name);
      expect(secondAccount.metadata.name).toBe(secondPreferenceAccount.name);

      accountsController.setAccountName(firstAccount.id, mockName);
      // refresh state after state changed

      [firstAccount, secondAccount] = accountsController.listAccounts();

      const { identities: updatedIdentities } =
        preferencesController.store.getState();

      const updatedFirstPreferenceAccount =
        updatedIdentities[firstAccount.address];
      const updatedSecondPreferenceAccount =
        updatedIdentities[secondAccount.address];

      expect(firstAccount.metadata.name).toBe(
        updatedFirstPreferenceAccount.name,
      );
      expect(updatedFirstPreferenceAccount.name).toBe(mockName);
      expect(secondAccount.metadata.name).toBe(
        updatedSecondPreferenceAccount.name,
      );
    });
  });

  describe('setSelectedAddress', () => {
    it('updating selectedAddress from preferences controller updates the selectedAccount in accounts controller and preferences controller', () => {
      const firstAddress = '0x1f9090aaE28b8a3dCeaDf281B0F12828e676c326';
      const secondAddress = '0x0affb0a96fbefaa97dce488dfd97512346cf3ab8';
      controllerMessenger.publish('KeyringController:stateChange', {
        isUnlocked: true,
        keyrings: [
          {
            type: 'HD Key Tree',
            accounts: [firstAddress, secondAddress],
          },
        ],
      });

      const selectedAccount = accountsController.getSelectedAccount();

      const { selectedAddress } = preferencesController.store.getState();

      expect(selectedAddress).toBe(selectedAccount.address);

      preferencesController.setSelectedAddress(secondAddress);
      // refresh state after state changed

      const { selectedAddress: updatedSelectedAddress } =
        preferencesController.store.getState();

      const updatedSelectedAccount = accountsController.getSelectedAccount();

      expect(updatedSelectedAddress).toBe(updatedSelectedAccount.address);
    });

    it('updating selectedAccount from accounts controller updates the selectedAddress in preferences controller', () => {
      const firstAddress = '0x1f9090aaE28b8a3dCeaDf281B0F12828e676c326';
      const secondAddress = '0x0affb0a96fbefaa97dce488dfd97512346cf3ab8';
      controllerMessenger.publish('KeyringController:stateChange', {
        isUnlocked: true,
        keyrings: [
          {
            type: 'HD Key Tree',
            accounts: [firstAddress, secondAddress],
          },
        ],
      });

      const selectedAccount = accountsController.getSelectedAccount();
      const accounts = accountsController.listAccounts();

      const { selectedAddress } = preferencesController.store.getState();

      expect(selectedAddress).toBe(selectedAccount.address);

      accountsController.setSelectedAccount(accounts[1].id);
      // refresh state after state changed

      const { selectedAddress: updatedSelectedAddress } =
        preferencesController.store.getState();

      const updatedSelectedAccount = accountsController.getSelectedAccount();

      expect(updatedSelectedAddress).toBe(updatedSelectedAccount.address);
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

  describe('isRedesignedConfirmationsFeatureEnabled', () => {
    it('isRedesignedConfirmationsFeatureEnabled should default to false', () => {
      expect(
        preferencesController.store.getState().preferences
          .isRedesignedConfirmationsDeveloperEnabled,
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
    it('should default to true for new users', function () {
      const state = preferencesController.store.getState();

      expect(state.useTokenDetection).toStrictEqual(true);
    });

    it('should set the useTokenDetection property in state', () => {
      preferencesController.setUseTokenDetection(true);
      expect(
        preferencesController.store.getState().useTokenDetection,
      ).toStrictEqual(true);
    });

    it('should keep initial value of useTokenDetection for existing users', function () {
      const preferencesControllerExistingUser = new PreferencesController({
        initLangCode: 'en_US',
        tokenListController,
        initState: {
          useTokenDetection: false,
        },
        networkConfigurations: NETWORK_CONFIGURATION_DATA,
      });
      const state = preferencesControllerExistingUser.store.getState();
      expect(state.useTokenDetection).toStrictEqual(false);
    });
  });

  describe('setUseNftDetection', () => {
    it('should default to true', () => {
      expect(
        preferencesController.store.getState().useNftDetection,
      ).toStrictEqual(true);
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
    it('should default to true', () => {
      expect(
        preferencesController.store.getState().openSeaEnabled,
      ).toStrictEqual(true);
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
        [CHAIN_IDS.LINEA_SEPOLIA]: true,
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
        [CHAIN_IDS.LINEA_SEPOLIA]: true,
      });
    });
  });

  describe('AccountsController:stateChange subscription', () => {
    it('sync the identities with the accounts in the accounts controller', () => {
      const firstAddress = '0x1f9090aaE28b8a3dCeaDf281B0F12828e676c326';
      const secondAddress = '0x0affb0a96fbefaa97dce488dfd97512346cf3ab8';
      controllerMessenger.publish('KeyringController:stateChange', {
        isUnlocked: true,
        keyrings: [
          {
            type: 'HD Key Tree',
            accounts: [firstAddress, secondAddress],
          },
        ],
      });

      const accounts = accountsController.listAccounts();

      const { identities } = preferencesController.store.getState();

      expect(accounts.map((account) => account.address)).toStrictEqual(
        Object.keys(identities),
      );
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

  describe('setUseTransactionSimulations', () => {
    it('should default to true', () => {
      expect(
        preferencesController.store.getState().useExternalNameSources,
      ).toStrictEqual(true);
    });

    it('should set the setUseTransactionSimulations property in state', () => {
      preferencesController.setUseTransactionSimulations(false);
      expect(
        preferencesController.store.getState().useTransactionSimulations,
      ).toStrictEqual(false);
    });
  });

  describe('setServiceWorkerKeepAlivePreference', () => {
    it('should default to true', () => {
      expect(
        preferencesController.store.getState().enableMV3TimestampSave,
      ).toStrictEqual(true);
    });

    it('should set the setServiceWorkerKeepAlivePreference property in state', () => {
      preferencesController.setServiceWorkerKeepAlivePreference(false);
      expect(
        preferencesController.store.getState().enableMV3TimestampSave,
      ).toStrictEqual(false);
    });
  });

  describe('setBitcoinSupportEnabled', () => {
    it('has the default value as false', () => {
      expect(
        preferencesController.store.getState().bitcoinSupportEnabled,
      ).toStrictEqual(false);
    });

    it('sets the bitcoinSupportEnabled property in state to true and then false', () => {
      preferencesController.setBitcoinSupportEnabled(true);
      expect(
        preferencesController.store.getState().bitcoinSupportEnabled,
      ).toStrictEqual(true);

      preferencesController.setBitcoinSupportEnabled(false);
      expect(
        preferencesController.store.getState().bitcoinSupportEnabled,
      ).toStrictEqual(false);
    });
  });
});
