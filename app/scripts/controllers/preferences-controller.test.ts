/**
 * @jest-environment node
 */
import { ControllerMessenger } from '@metamask/base-controller';
import { AccountsController } from '@metamask/accounts-controller';
import { KeyringControllerStateChangeEvent } from '@metamask/keyring-controller';
import { SnapControllerStateChangeEvent } from '@metamask/snaps-controllers';
import { Hex } from '@metamask/utils';
import { CHAIN_IDS } from '../../../shared/constants/network';
import { mockNetworkState } from '../../../test/stub/networks';
import { ThemeType } from '../../../shared/constants/preferences';
import type {
  AllowedActions,
  AllowedEvents,
  PreferencesControllerMessenger,
  PreferencesControllerState,
} from './preferences-controller';
import PreferencesController, {
  getDefaultPreferencesControllerState,
} from './preferences-controller';

const NETWORK_CONFIGURATION_DATA = mockNetworkState(
  {
    id: 'test-networkConfigurationId-1',
    rpcUrl: 'https://testrpc.com',
    chainId: CHAIN_IDS.GOERLI,
    blockExplorerUrl: 'https://etherscan.io',
    nickname: '0X5',
  },
  {
    id: 'test-networkConfigurationId-2',
    rpcUrl: 'http://localhost:8545',
    chainId: '0x539',
    ticker: 'ETH',
    nickname: 'Localhost 8545',
  },
).networkConfigurationsByChainId;

const setupController = ({
  state = getDefaultPreferencesControllerState(),
}: {
  state?: Partial<PreferencesControllerState>;
} = {}) => {
  const controllerMessenger = new ControllerMessenger<
    AllowedActions,
    | AllowedEvents
    | KeyringControllerStateChangeEvent
    | SnapControllerStateChangeEvent
  >();

  const preferencesControllerMessenger: PreferencesControllerMessenger =
    controllerMessenger.getRestricted({
      name: 'ExtensionPreferencesController',
      allowedActions: [
        'AccountsController:getAccountByAddress',
        'AccountsController:setAccountName',
        'AccountsController:getSelectedAccount',
        'AccountsController:setSelectedAccount',
      ],
      allowedEvents: ['AccountsController:stateChange'],
    });

  const controller = new PreferencesController({
    messenger: preferencesControllerMessenger,
    state,
    networkConfigurationsByChainId: NETWORK_CONFIGURATION_DATA,
    initLangCode: 'en_US',
  });

  const accountsControllerMessenger = controllerMessenger.getRestricted({
    name: 'AccountsController',
    allowedEvents: [
      'KeyringController:stateChange',
      'SnapController:stateChange',
    ],
    allowedActions: [],
  });
  const mockAccountsControllerState = {
    internalAccounts: {
      accounts: {},
      selectedAccount: '',
    },
  };
  const accountsController = new AccountsController({
    messenger: accountsControllerMessenger,
    state: mockAccountsControllerState,
  });

  return {
    controller,
    messenger: controllerMessenger,
    accountsController,
  };
};

describe('preferences controller', () => {
  describe('useBlockie', () => {
    it('defaults useBlockie to false', () => {
      const { controller } = setupController({});
      expect(controller.state.useBlockie).toStrictEqual(false);
    });

    it('setUseBlockie to true', () => {
      const { controller } = setupController({});
      controller.setUseBlockie(true);
      expect(controller.state.useBlockie).toStrictEqual(true);
    });
  });

  describe('setCurrentLocale', () => {
    it('checks the default currentLocale', () => {
      const { controller } = setupController({});
      const { currentLocale } = controller.state;
      expect(currentLocale).toStrictEqual('en_US');
    });

    it('sets current locale in preferences controller', () => {
      const { controller } = setupController({});
      controller.setCurrentLocale('ja');
      const { currentLocale } = controller.state;
      expect(currentLocale).toStrictEqual('ja');
    });
  });

  describe('setAccountLabel', () => {
    const { controller, messenger, accountsController } = setupController({});
    const mockName = 'mockName';
    const firstAddress = '0x1f9090aaE28b8a3dCeaDf281B0F12828e676c326';
    const secondAddress = '0x0affb0a96fbefaa97dce488dfd97512346cf3ab8';

    it('updating name from preference controller will update the name in accounts controller and preferences controller', () => {
      messenger.publish(
        'KeyringController:stateChange',
        {
          isUnlocked: true,
          keyrings: [
            {
              type: 'HD Key Tree',
              accounts: [firstAddress, secondAddress],
            },
          ],
        },
        [],
      );

      let [firstAccount, secondAccount] = accountsController.listAccounts();
      const { identities } = controller.state;
      const firstPreferenceAccount = identities[firstAccount.address];
      const secondPreferenceAccount = identities[secondAccount.address];

      expect(firstAccount.metadata.name).toBe(firstPreferenceAccount.name);
      expect(secondAccount.metadata.name).toBe(secondPreferenceAccount.name);

      controller.setAccountLabel(firstAccount.address, mockName);

      // refresh state after state changed

      [firstAccount, secondAccount] = accountsController.listAccounts();

      const { identities: updatedIdentities } = controller.state;

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
      messenger.publish(
        'KeyringController:stateChange',
        {
          isUnlocked: true,
          keyrings: [
            {
              type: 'HD Key Tree',
              accounts: [firstAddress, secondAddress],
            },
          ],
        },
        [],
      );

      let [firstAccount, secondAccount] = accountsController.listAccounts();

      const { identities } = controller.state;

      const firstPreferenceAccount = identities[firstAccount.address];
      const secondPreferenceAccount = identities[secondAccount.address];

      expect(firstAccount.metadata.name).toBe(firstPreferenceAccount.name);
      expect(secondAccount.metadata.name).toBe(secondPreferenceAccount.name);

      accountsController.setAccountName(firstAccount.id, mockName);
      // refresh state after state changed

      [firstAccount, secondAccount] = accountsController.listAccounts();

      const { identities: updatedIdentities } = controller.state;

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
    const { controller, messenger, accountsController } = setupController({});
    it('updating selectedAddress from preferences controller updates the selectedAccount in accounts controller and preferences controller', () => {
      const firstAddress = '0x1f9090aaE28b8a3dCeaDf281B0F12828e676c326';
      const secondAddress = '0x0affb0a96fbefaa97dce488dfd97512346cf3ab8';
      messenger.publish(
        'KeyringController:stateChange',
        {
          isUnlocked: true,
          keyrings: [
            {
              type: 'HD Key Tree',
              accounts: [firstAddress, secondAddress],
            },
          ],
        },
        [],
      );

      const selectedAccount = accountsController.getSelectedAccount();

      const { selectedAddress } = controller.state;

      expect(selectedAddress).toBe(selectedAccount.address);

      controller.setSelectedAddress(secondAddress);
      // refresh state after state changed

      const { selectedAddress: updatedSelectedAddress } = controller.state;

      const updatedSelectedAccount = accountsController.getSelectedAccount();

      expect(updatedSelectedAddress).toBe(updatedSelectedAccount.address);
    });

    it('updating selectedAccount from accounts controller updates the selectedAddress in preferences controller', () => {
      const firstAddress = '0x1f9090aaE28b8a3dCeaDf281B0F12828e676c326';
      const secondAddress = '0x0affb0a96fbefaa97dce488dfd97512346cf3ab8';
      messenger.publish(
        'KeyringController:stateChange',
        {
          isUnlocked: true,
          keyrings: [
            {
              type: 'HD Key Tree',
              accounts: [firstAddress, secondAddress],
            },
          ],
        },
        [],
      );

      const selectedAccount = accountsController.getSelectedAccount();
      const accounts = accountsController.listAccounts();

      const { selectedAddress } = controller.state;

      expect(selectedAddress).toBe(selectedAccount.address);

      accountsController.setSelectedAccount(accounts[1].id);
      // refresh state after state changed

      const { selectedAddress: updatedSelectedAddress } = controller.state;

      const updatedSelectedAccount = accountsController.getSelectedAccount();

      expect(updatedSelectedAddress).toBe(updatedSelectedAccount.address);
    });
  });

  describe('setPasswordForgotten', () => {
    const { controller } = setupController({});
    it('should default to false', () => {
      expect(controller.state.forgottenPassword).toStrictEqual(false);
    });

    it('should set the forgottenPassword property in state', () => {
      controller.setPasswordForgotten(true);
      expect(controller.state.forgottenPassword).toStrictEqual(true);
    });
  });

  describe('setUsePhishDetect', () => {
    const { controller } = setupController({});
    it('should default to true', () => {
      expect(controller.state.usePhishDetect).toStrictEqual(true);
    });

    it('should set the usePhishDetect property in state', () => {
      controller.setUsePhishDetect(false);
      expect(controller.state.usePhishDetect).toStrictEqual(false);
    });
  });

  describe('setUseMultiAccountBalanceChecker', () => {
    const { controller } = setupController({});
    it('should default to true', () => {
      expect(controller.state.useMultiAccountBalanceChecker).toStrictEqual(
        true,
      );
    });

    it('should set the setUseMultiAccountBalanceChecker property in state', () => {
      controller.setUseMultiAccountBalanceChecker(false);
      expect(controller.state.useMultiAccountBalanceChecker).toStrictEqual(
        false,
      );
    });
  });

  describe('isRedesignedConfirmationsFeatureEnabled', () => {
    const { controller } = setupController({});
    it('isRedesignedConfirmationsFeatureEnabled should default to false', () => {
      expect(
        controller.state.preferences.isRedesignedConfirmationsDeveloperEnabled,
      ).toStrictEqual(false);
    });
  });

  describe('setUseSafeChainsListValidation', function () {
    const { controller } = setupController({});
    it('should default to true', function () {
      const { state } = controller;

      expect(state.useSafeChainsListValidation).toStrictEqual(true);
    });

    it('should set the `setUseSafeChainsListValidation` property in state', function () {
      expect(controller.state.useSafeChainsListValidation).toStrictEqual(true);

      controller.setUseSafeChainsListValidation(false);

      expect(controller.state.useSafeChainsListValidation).toStrictEqual(false);
    });
  });

  describe('setUseTokenDetection', function () {
    const { controller } = setupController({});
    it('should default to true for new users', function () {
      const { state } = controller;

      expect(state.useTokenDetection).toStrictEqual(true);
    });

    it('should set the useTokenDetection property in state', () => {
      controller.setUseTokenDetection(true);
      expect(controller.state.useTokenDetection).toStrictEqual(true);
    });

    it('should keep initial value of useTokenDetection for existing users', function () {
      const { controller: preferencesControllerExistingUser } = setupController(
        {
          state: {
            useTokenDetection: false,
          },
        },
      );
      const { state } = preferencesControllerExistingUser;
      expect(state.useTokenDetection).toStrictEqual(false);
    });
  });

  describe('setUseNftDetection', () => {
    const { controller } = setupController({});
    it('should default to true', () => {
      expect(controller.state.useNftDetection).toStrictEqual(true);
    });

    it('should set the useNftDetection property in state', () => {
      controller.setOpenSeaEnabled(true);
      controller.setUseNftDetection(true);
      expect(controller.state.useNftDetection).toStrictEqual(true);
    });
  });

  describe('setUse4ByteResolution', () => {
    const { controller } = setupController({});
    it('should default to true', () => {
      expect(controller.state.use4ByteResolution).toStrictEqual(true);
    });

    it('should set the use4ByteResolution property in state', () => {
      controller.setUse4ByteResolution(false);
      expect(controller.state.use4ByteResolution).toStrictEqual(false);
    });
  });

  describe('setOpenSeaEnabled', () => {
    const { controller } = setupController({});
    it('should default to true', () => {
      expect(controller.state.openSeaEnabled).toStrictEqual(true);
    });

    it('should set the openSeaEnabled property in state', () => {
      controller.setOpenSeaEnabled(true);
      expect(controller.state.openSeaEnabled).toStrictEqual(true);
    });
  });

  describe('setAdvancedGasFee', () => {
    const { controller } = setupController({});
    it('should default to an empty object', () => {
      expect(controller.state.advancedGasFee).toStrictEqual({});
    });

    it('should set the setAdvancedGasFee property in state', () => {
      controller.setAdvancedGasFee({
        chainId: CHAIN_IDS.GOERLI,
        gasFeePreferences: {
          maxBaseFee: '1.5',
          priorityFee: '2',
        },
      });
      expect(
        controller.state.advancedGasFee[CHAIN_IDS.GOERLI].maxBaseFee,
      ).toStrictEqual('1.5');
      expect(
        controller.state.advancedGasFee[CHAIN_IDS.GOERLI].priorityFee,
      ).toStrictEqual('2');
    });
  });

  describe('setTheme', () => {
    const { controller } = setupController({});
    it('should default to value "OS"', () => {
      expect(controller.state.theme).toStrictEqual('os');
    });

    it('should set the setTheme property in state', () => {
      controller.setTheme(ThemeType.dark);
      expect(controller.state.theme).toStrictEqual('dark');
    });
  });

  describe('setUseCurrencyRateCheck', () => {
    const { controller } = setupController({});
    it('should default to false', () => {
      expect(controller.state.useCurrencyRateCheck).toStrictEqual(true);
    });

    it('should set the useCurrencyRateCheck property in state', () => {
      controller.setUseCurrencyRateCheck(false);
      expect(controller.state.useCurrencyRateCheck).toStrictEqual(false);
    });
  });

  describe('setIncomingTransactionsPreferences', () => {
    const { controller } = setupController({});
    const addedNonTestNetworks = Object.keys(NETWORK_CONFIGURATION_DATA);

    it('should have default value combined', () => {
      const { state } = controller;
      expect(state.incomingTransactionsPreferences).toStrictEqual({
        [CHAIN_IDS.MAINNET]: true,
        [CHAIN_IDS.LINEA_MAINNET]: true,
        [NETWORK_CONFIGURATION_DATA[addedNonTestNetworks[0] as Hex].chainId]:
          true,
        [NETWORK_CONFIGURATION_DATA[addedNonTestNetworks[1] as Hex].chainId]:
          true,
        [CHAIN_IDS.GOERLI]: true,
        [CHAIN_IDS.SEPOLIA]: true,
        [CHAIN_IDS.LINEA_SEPOLIA]: true,
      });
    });

    it('should update incomingTransactionsPreferences with given value set', () => {
      controller.setIncomingTransactionsPreferences(
        CHAIN_IDS.LINEA_MAINNET,
        false,
      );
      const { state } = controller;
      expect(state.incomingTransactionsPreferences).toStrictEqual({
        [CHAIN_IDS.MAINNET]: true,
        [CHAIN_IDS.LINEA_MAINNET]: false,
        [NETWORK_CONFIGURATION_DATA[addedNonTestNetworks[0] as Hex].chainId]:
          true,
        [NETWORK_CONFIGURATION_DATA[addedNonTestNetworks[1] as Hex].chainId]:
          true,
        [CHAIN_IDS.GOERLI]: true,
        [CHAIN_IDS.SEPOLIA]: true,
        [CHAIN_IDS.LINEA_SEPOLIA]: true,
      });
    });
  });

  describe('AccountsController:stateChange subscription', () => {
    const { controller, messenger, accountsController } = setupController({});
    it('sync the identities with the accounts in the accounts controller', () => {
      const firstAddress = '0x1f9090aaE28b8a3dCeaDf281B0F12828e676c326';
      const secondAddress = '0x0affb0a96fbefaa97dce488dfd97512346cf3ab8';
      messenger.publish(
        'KeyringController:stateChange',
        {
          isUnlocked: true,
          keyrings: [
            {
              type: 'HD Key Tree',
              accounts: [firstAddress, secondAddress],
            },
          ],
        },
        [],
      );

      const accounts = accountsController.listAccounts();

      const { identities } = controller.state;

      expect(accounts.map((account) => account.address)).toStrictEqual(
        Object.keys(identities),
      );
    });
  });

  ///: BEGIN:ONLY_INCLUDE_IF(petnames)
  describe('setUseExternalNameSources', () => {
    const { controller } = setupController({});
    it('should default to true', () => {
      expect(controller.state.useExternalNameSources).toStrictEqual(true);
    });

    it('should set the useExternalNameSources property in state', () => {
      controller.setUseExternalNameSources(false);
      expect(controller.state.useExternalNameSources).toStrictEqual(false);
    });
  });
  ///: END:ONLY_INCLUDE_IF

  describe('setUseTransactionSimulations', () => {
    const { controller } = setupController({});
    it('should default to true', () => {
      expect(controller.state.useExternalNameSources).toStrictEqual(true);
    });

    it('should set the setUseTransactionSimulations property in state', () => {
      controller.setUseTransactionSimulations(false);
      expect(controller.state.useTransactionSimulations).toStrictEqual(false);
    });
  });

  describe('setServiceWorkerKeepAlivePreference', () => {
    const { controller } = setupController({});
    it('should default to true', () => {
      expect(controller.state.enableMV3TimestampSave).toStrictEqual(true);
    });

    it('should set the setServiceWorkerKeepAlivePreference property in state', () => {
      controller.setServiceWorkerKeepAlivePreference(false);
      expect(controller.state.enableMV3TimestampSave).toStrictEqual(false);
    });
  });

  describe('setBitcoinSupportEnabled', () => {
    const { controller } = setupController({});
    it('has the default value as false', () => {
      expect(controller.state.bitcoinSupportEnabled).toStrictEqual(false);
    });

    it('sets the bitcoinSupportEnabled property in state to true and then false', () => {
      controller.setBitcoinSupportEnabled(true);
      expect(controller.state.bitcoinSupportEnabled).toStrictEqual(true);

      controller.setBitcoinSupportEnabled(false);
      expect(controller.state.bitcoinSupportEnabled).toStrictEqual(false);
    });
  });
});
