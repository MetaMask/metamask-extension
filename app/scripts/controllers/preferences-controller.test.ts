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
import { PreferencesController } from './preferences-controller';

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
  state,
}: {
  state?: Partial<PreferencesControllerState>;
}) => {
  const controllerMessenger = new ControllerMessenger<
    AllowedActions,
    | AllowedEvents
    | KeyringControllerStateChangeEvent
    | SnapControllerStateChangeEvent
  >();
  const preferencesControllerMessenger: PreferencesControllerMessenger =
    controllerMessenger.getRestricted({
      name: 'PreferencesController',
      allowedActions: [
        'AccountsController:getAccountByAddress',
        'AccountsController:setAccountName',
        'AccountsController:getSelectedAccount',
        'AccountsController:setSelectedAccount',
        'NetworkController:getState',
      ],
      allowedEvents: ['AccountsController:stateChange'],
    });

  controllerMessenger.registerActionHandler(
    'NetworkController:getState',
    jest.fn().mockReturnValue({
      networkConfigurationsByChainId: NETWORK_CONFIGURATION_DATA,
    }),
  );
  const controller = new PreferencesController({
    messenger: preferencesControllerMessenger,
    state,
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
      expect(currentLocale).toStrictEqual('');
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

      expect(controller.getSelectedAddress()).toBe(secondAddress);
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

  describe('useNonceField', () => {
    it('defaults useNonceField to false', () => {
      const { controller } = setupController({});
      expect(controller.state.useNonceField).toStrictEqual(false);
    });

    it('setUseNonceField to true', () => {
      const { controller } = setupController({});
      controller.setUseNonceField(true);
      expect(controller.state.useNonceField).toStrictEqual(true);
    });
  });

  describe('globalThis.setPreference', () => {
    it('setFeatureFlags to true', () => {
      const { controller } = setupController({});
      globalThis.setPreference('showFiatInTestnets', true);
      expect(controller.state.featureFlags.showFiatInTestnets).toStrictEqual(
        true,
      );
    });
  });

  describe('useExternalServices', () => {
    it('defaults useExternalServices to true', () => {
      const { controller } = setupController({});
      expect(controller.state.useExternalServices).toStrictEqual(true);
      expect(controller.state.useExternalServices).toStrictEqual(true);
      expect(controller.state.useTokenDetection).toStrictEqual(true);
      expect(controller.state.useCurrencyRateCheck).toStrictEqual(true);
      expect(controller.state.usePhishDetect).toStrictEqual(true);
      expect(controller.state.useAddressBarEnsResolution).toStrictEqual(true);
      expect(controller.state.openSeaEnabled).toStrictEqual(true);
      expect(controller.state.useNftDetection).toStrictEqual(true);
    });

    it('useExternalServices to false', () => {
      const { controller } = setupController({});
      controller.toggleExternalServices(false);
      expect(controller.state.useExternalServices).toStrictEqual(false);
      expect(controller.state.useTokenDetection).toStrictEqual(false);
      expect(controller.state.useCurrencyRateCheck).toStrictEqual(false);
      expect(controller.state.usePhishDetect).toStrictEqual(false);
      expect(controller.state.useAddressBarEnsResolution).toStrictEqual(false);
      expect(controller.state.openSeaEnabled).toStrictEqual(false);
      expect(controller.state.useNftDetection).toStrictEqual(false);
    });
  });

  describe('addSnapAccountEnabled', () => {
    it('defaults addSnapAccountEnabled to false', () => {
      const { controller } = setupController({});
      expect(controller.state.addSnapAccountEnabled).toStrictEqual(false);
    });

    it('setAddSnapAccountEnabled to true', () => {
      const { controller } = setupController({});
      controller.setAddSnapAccountEnabled(true);
      expect(controller.state.addSnapAccountEnabled).toStrictEqual(true);
    });
  });

  describe('watchEthereumAccountEnabled', () => {
    it('defaults watchEthereumAccountEnabled to false', () => {
      const { controller } = setupController({});
      expect(controller.state.watchEthereumAccountEnabled).toStrictEqual(false);
    });

    it('setWatchEthereumAccountEnabled to true', () => {
      const { controller } = setupController({});
      controller.setWatchEthereumAccountEnabled(true);
      expect(controller.state.watchEthereumAccountEnabled).toStrictEqual(true);
    });
  });

  describe('bitcoinTestnetSupportEnabled', () => {
    it('defaults bitcoinTestnetSupportEnabled to false', () => {
      const { controller } = setupController({});
      expect(controller.state.bitcoinTestnetSupportEnabled).toStrictEqual(
        false,
      );
    });

    it('setBitcoinTestnetSupportEnabled to true', () => {
      const { controller } = setupController({});
      controller.setBitcoinTestnetSupportEnabled(true);
      expect(controller.state.bitcoinTestnetSupportEnabled).toStrictEqual(true);
    });
  });

  describe('knownMethodData', () => {
    it('defaults knownMethodData', () => {
      const { controller } = setupController({});
      expect(controller.state.knownMethodData).toStrictEqual({});
    });

    it('addKnownMethodData', () => {
      const { controller } = setupController({});
      controller.addKnownMethodData('0x60806040', 'testMethodName');
      expect(controller.state.knownMethodData).toStrictEqual({
        '0x60806040': 'testMethodName',
      });
    });
  });

  describe('featureFlags', () => {
    it('defaults featureFlags', () => {
      const { controller } = setupController({});
      expect(controller.state.featureFlags).toStrictEqual({});
    });

    it('setFeatureFlags', () => {
      const { controller } = setupController({});
      controller.setFeatureFlag('showConfirmationAdvancedDetails', true);
      expect(
        controller.state.featureFlags.showConfirmationAdvancedDetails,
      ).toStrictEqual(true);
    });
  });

  describe('preferences', () => {
    it('defaults preferences', () => {
      const { controller } = setupController({});
      expect(controller.state.preferences).toStrictEqual({
        autoLockTimeLimit: undefined,
        showExtensionInFullSizeView: false,
        privacyMode: false,
        showFiatInTestnets: false,
        showTestNetworks: false,
        smartTransactionsMigrationApplied: false,
        smartTransactionsOptInStatus: true,
        useNativeCurrencyAsPrimaryCurrency: true,
        hideZeroBalanceTokens: false,
        petnamesEnabled: true,
        redesignedConfirmationsEnabled: true,
        shouldShowAggregatedBalancePopover: true,
        featureNotificationsEnabled: false,
        isRedesignedConfirmationsDeveloperEnabled: false,
        showConfirmationAdvancedDetails: false,
        showMultiRpcModal: false,
        showNativeTokenAsMainBalance: false,
        tokenSortConfig: {
          key: 'tokenFiatAmount',
          order: 'dsc',
          sortCallback: 'stringNumeric',
        },
        tokenNetworkFilter: {},
      });
    });

    it('setPreference', () => {
      const { controller } = setupController({});
      controller.setPreference('showConfirmationAdvancedDetails', true);
      expect(controller.getPreferences()).toStrictEqual({
        autoLockTimeLimit: undefined,
        showExtensionInFullSizeView: false,
        showFiatInTestnets: false,
        showTestNetworks: false,
        smartTransactionsMigrationApplied: false,
        smartTransactionsOptInStatus: true,
        useNativeCurrencyAsPrimaryCurrency: true,
        hideZeroBalanceTokens: false,
        petnamesEnabled: true,
        privacyMode: false,
        redesignedConfirmationsEnabled: true,
        shouldShowAggregatedBalancePopover: true,
        featureNotificationsEnabled: false,
        isRedesignedConfirmationsDeveloperEnabled: false,
        showConfirmationAdvancedDetails: true,
        showMultiRpcModal: false,
        showNativeTokenAsMainBalance: false,
        tokenSortConfig: {
          key: 'tokenFiatAmount',
          order: 'dsc',
          sortCallback: 'stringNumeric',
        },
        tokenNetworkFilter: {},
      });
    });
  });

  describe('ipfsGateway', () => {
    it('defaults ipfsGate to dweb.link', () => {
      const { controller } = setupController({});
      expect(controller.state.ipfsGateway).toStrictEqual('dweb.link');
    });

    it('setIpfsGateway to test.link', () => {
      const { controller } = setupController({});
      controller.setIpfsGateway('test.link');
      expect(controller.getIpfsGateway()).toStrictEqual('test.link');
    });
  });

  describe('isIpfsGatewayEnabled', () => {
    it('defaults isIpfsGatewayEnabled to true', () => {
      const { controller } = setupController({});
      expect(controller.state.isIpfsGatewayEnabled).toStrictEqual(true);
    });

    it('set isIpfsGatewayEnabled to false', () => {
      const { controller } = setupController({});
      controller.setIsIpfsGatewayEnabled(false);
      expect(controller.state.isIpfsGatewayEnabled).toStrictEqual(false);
    });
  });

  describe('useAddressBarEnsResolution', () => {
    it('defaults useAddressBarEnsResolution to true', () => {
      const { controller } = setupController({});
      expect(controller.state.useAddressBarEnsResolution).toStrictEqual(true);
    });

    it('set useAddressBarEnsResolution to false', () => {
      const { controller } = setupController({});
      controller.setUseAddressBarEnsResolution(false);
      expect(controller.state.useAddressBarEnsResolution).toStrictEqual(false);
    });
  });

  describe('dismissSeedBackUpReminder', () => {
    it('defaults dismissSeedBackUpReminder to false', () => {
      const { controller } = setupController({});
      expect(controller.state.dismissSeedBackUpReminder).toStrictEqual(false);
    });

    it('set dismissSeedBackUpReminder to true', () => {
      const { controller } = setupController({});
      controller.setDismissSeedBackUpReminder(true);
      expect(controller.state.dismissSeedBackUpReminder).toStrictEqual(true);
    });
  });

  describe('overrideContentSecurityPolicyHeader', () => {
    it('defaults overrideContentSecurityPolicyHeader to true', () => {
      const { controller } = setupController({});
      expect(
        controller.state.overrideContentSecurityPolicyHeader,
      ).toStrictEqual(true);
    });

    it('set overrideContentSecurityPolicyHeader to false', () => {
      const { controller } = setupController({});
      controller.setOverrideContentSecurityPolicyHeader(false);
      expect(
        controller.state.overrideContentSecurityPolicyHeader,
      ).toStrictEqual(false);
    });
  });

  describe('snapsAddSnapAccountModalDismissed', () => {
    it('defaults snapsAddSnapAccountModalDismissed to false', () => {
      const { controller } = setupController({});
      expect(controller.state.snapsAddSnapAccountModalDismissed).toStrictEqual(
        false,
      );
    });

    it('set snapsAddSnapAccountModalDismissed to true', () => {
      const { controller } = setupController({});
      controller.setSnapsAddSnapAccountModalDismissed(true);
      expect(controller.state.snapsAddSnapAccountModalDismissed).toStrictEqual(
        true,
      );
    });
  });

  describe('setSolanaSupportEnabled', () => {
    const { controller } = setupController({});
    it('has the default value as false', () => {
      expect(controller.state.solanaSupportEnabled).toStrictEqual(false);
    });

    it('sets the solanaSupportEnabled property in state to true and then false', () => {
      controller.setSolanaSupportEnabled(true);
      expect(controller.state.solanaSupportEnabled).toStrictEqual(true);

      controller.setSolanaSupportEnabled(false);
      expect(controller.state.solanaSupportEnabled).toStrictEqual(false);
    });
  });
});
