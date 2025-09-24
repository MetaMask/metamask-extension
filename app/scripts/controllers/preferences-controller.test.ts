/**
 * @jest-environment node
 */
import { Messenger, deriveStateFromMetadata } from '@metamask/base-controller';
import { AccountsController } from '@metamask/accounts-controller';
import { KeyringControllerStateChangeEvent } from '@metamask/keyring-controller';
import type { MultichainNetworkControllerNetworkDidChangeEvent } from '@metamask/multichain-network-controller';
import { SnapControllerStateChangeEvent } from '@metamask/snaps-controllers';
import {
  SnapKeyringAccountAssetListUpdatedEvent,
  SnapKeyringAccountBalancesUpdatedEvent,
  SnapKeyringAccountTransactionsUpdatedEvent,
} from '@metamask/eth-snap-keyring';
import type { Hex } from '@metamask/utils';
import { CHAIN_IDS } from '../../../shared/constants/network';
import { mockNetworkState } from '../../../test/stub/networks';
import { ThemeType } from '../../../shared/constants/preferences';
import type {
  AllowedActions,
  AllowedEvents,
  PreferencesControllerMessenger,
  PreferencesControllerState,
} from './preferences-controller';
import {
  PreferencesController,
  ReferralStatus,
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
  state,
}: {
  state?: Partial<PreferencesControllerState>;
} = {}) => {
  const messenger = new Messenger<
    AllowedActions,
    | AllowedEvents
    | KeyringControllerStateChangeEvent
    | SnapControllerStateChangeEvent
    | SnapKeyringAccountAssetListUpdatedEvent
    | SnapKeyringAccountBalancesUpdatedEvent
    | SnapKeyringAccountTransactionsUpdatedEvent
    | MultichainNetworkControllerNetworkDidChangeEvent
  >();
  const preferencesControllerMessenger: PreferencesControllerMessenger =
    messenger.getRestricted({
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

  messenger.registerActionHandler(
    'NetworkController:getState',
    jest.fn().mockReturnValue({
      networkConfigurationsByChainId: NETWORK_CONFIGURATION_DATA,
    }),
  );
  const controller = new PreferencesController({
    messenger: preferencesControllerMessenger,
    state,
  });

  const accountsControllerMessenger = messenger.getRestricted({
    name: 'AccountsController',
    allowedEvents: [
      'KeyringController:stateChange',
      'SnapController:stateChange',
      'SnapKeyring:accountAssetListUpdated',
      'SnapKeyring:accountBalancesUpdated',
      'SnapKeyring:accountTransactionsUpdated',
      'MultichainNetworkController:networkDidChange',
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
    messenger,
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
              metadata: {
                id: '01JKDGGBRE3DGZA7N1PZJSQK4W',
                name: '',
              },
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
              metadata: {
                id: '01JKDGGBRE3DGZA7N1PZJSQK4W',
                name: '',
              },
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
              metadata: {
                id: '01JKDGGBRE3DGZA7N1PZJSQK4W',
                name: '',
              },
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
              metadata: {
                id: '01JKDGGBRE3DGZA7N1PZJSQK4W',
                name: '',
              },
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
              metadata: {
                id: '01JKDGGBRE3DGZA7N1PZJSQK4W',
                name: '',
              },
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
      expect(controller.state.useSafeChainsListValidation).toStrictEqual(true);
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
      expect(controller.state.useSafeChainsListValidation).toStrictEqual(false);
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
        avatarType: 'maskicon',
        showExtensionInFullSizeView: false,
        privacyMode: false,
        showFiatInTestnets: false,
        showTestNetworks: false,
        smartTransactionsMigrationApplied: false,
        smartTransactionsOptInStatus: true,
        useNativeCurrencyAsPrimaryCurrency: true,
        hideZeroBalanceTokens: false,
        petnamesEnabled: true,
        skipDeepLinkInterstitial: false,
        dismissSmartAccountSuggestionEnabled: false,
        featureNotificationsEnabled: false,
        showConfirmationAdvancedDetails: false,
        showMultiRpcModal: false,
        showNativeTokenAsMainBalance: false,
        smartAccountOptIn: true,
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
        avatarType: 'maskicon',
        showExtensionInFullSizeView: false,
        showFiatInTestnets: false,
        showTestNetworks: false,
        smartTransactionsMigrationApplied: false,
        smartTransactionsOptInStatus: true,
        useNativeCurrencyAsPrimaryCurrency: true,
        hideZeroBalanceTokens: false,
        petnamesEnabled: true,
        skipDeepLinkInterstitial: false,
        privacyMode: false,
        dismissSmartAccountSuggestionEnabled: false,
        featureNotificationsEnabled: false,
        showConfirmationAdvancedDetails: true,
        showMultiRpcModal: false,
        showNativeTokenAsMainBalance: false,
        smartAccountOptIn: true,
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

  describe('manageInstitutionalWallets', () => {
    it('defaults manageInstitutionalWallets to false', () => {
      const { controller } = setupController({});
      expect(controller.state.manageInstitutionalWallets).toStrictEqual(false);
    });
  });

  describe('setManageInstitutionalWallets', () => {
    it('sets manageInstitutionalWallets to true', () => {
      const { controller } = setupController({});
      controller.setManageInstitutionalWallets(true);
      expect(controller.state.manageInstitutionalWallets).toStrictEqual(true);
    });
  });

  describe('metadata', () => {
    it('includes expected state in debug snapshots', () => {
      const { controller } = setupController({
        // Set optional props that have no default value, so they show up in snapshot
        state: { textDirection: 'auto' },
      });

      expect(
        deriveStateFromMetadata(
          controller.state,
          controller.metadata,
          'anonymous',
        ),
      ).toMatchInlineSnapshot(`
        {
          "advancedGasFee": {},
          "currentLocale": "",
          "dismissSeedBackUpReminder": false,
          "enableMV3TimestampSave": true,
          "featureFlags": {},
          "forgottenPassword": false,
          "isMultiAccountBalancesEnabled": true,
          "ledgerTransportType": "u2f",
          "openSeaEnabled": true,
          "overrideContentSecurityPolicyHeader": true,
          "preferences": {
            "autoLockTimeLimit": undefined,
            "avatarType": "maskicon",
            "dismissSmartAccountSuggestionEnabled": false,
            "featureNotificationsEnabled": false,
            "hideZeroBalanceTokens": false,
            "petnamesEnabled": true,
            "privacyMode": false,
            "showConfirmationAdvancedDetails": false,
            "showExtensionInFullSizeView": false,
            "showFiatInTestnets": false,
            "showMultiRpcModal": false,
            "showNativeTokenAsMainBalance": false,
            "showTestNetworks": false,
            "skipDeepLinkInterstitial": false,
            "smartAccountOptIn": true,
            "smartTransactionsMigrationApplied": false,
            "smartTransactionsOptInStatus": true,
            "tokenNetworkFilter": {},
            "tokenSortConfig": {
              "key": "tokenFiatAmount",
              "order": "dsc",
              "sortCallback": "stringNumeric",
            },
            "useNativeCurrencyAsPrimaryCurrency": true,
          },
          "showIncomingTransactions": {
            "0x1": true,
            "0x13881": true,
            "0x38": true,
            "0x5": true,
            "0x504": true,
            "0x505": true,
            "0x507": true,
            "0x531": true,
            "0x61": true,
            "0x64": true,
            "0x89": true,
            "0xa": true,
            "0xa869": true,
            "0xa86a": true,
            "0xaa36a7": true,
            "0xaa37dc": true,
            "0xe704": true,
            "0xe705": true,
            "0xe708": true,
            "0xfa": true,
            "0xfa2": true,
          },
          "theme": "os",
          "use4ByteResolution": true,
          "useAddressBarEnsResolution": true,
          "useBlockie": false,
          "useCurrencyRateCheck": true,
          "useMultiAccountBalanceChecker": true,
          "useNftDetection": true,
          "usePhishDetect": true,
          "useTokenDetection": true,
          "useTransactionSimulations": true,
        }
      `);
    });

    it('includes expected state in state logs', () => {
      const { controller } = setupController({
        // Set optional props that have no default value, so they show up in snapshot
        state: { textDirection: 'auto' },
      });

      expect(
        deriveStateFromMetadata(
          controller.state,
          controller.metadata,
          'includeInStateLogs',
        ),
      ).toMatchInlineSnapshot(`
        {
          "addSnapAccountEnabled": false,
          "advancedGasFee": {},
          "currentLocale": "",
          "dismissSeedBackUpReminder": false,
          "enableMV3TimestampSave": true,
          "featureFlags": {},
          "forgottenPassword": false,
          "identities": {},
          "ipfsGateway": "dweb.link",
          "isIpfsGatewayEnabled": true,
          "isMultiAccountBalancesEnabled": true,
          "knownMethodData": {},
          "ledgerTransportType": "u2f",
          "lostIdentities": {},
          "manageInstitutionalWallets": false,
          "openSeaEnabled": true,
          "overrideContentSecurityPolicyHeader": true,
          "preferences": {
            "autoLockTimeLimit": undefined,
            "avatarType": "maskicon",
            "dismissSmartAccountSuggestionEnabled": false,
            "featureNotificationsEnabled": false,
            "hideZeroBalanceTokens": false,
            "petnamesEnabled": true,
            "privacyMode": false,
            "showConfirmationAdvancedDetails": false,
            "showExtensionInFullSizeView": false,
            "showFiatInTestnets": false,
            "showMultiRpcModal": false,
            "showNativeTokenAsMainBalance": false,
            "showTestNetworks": false,
            "skipDeepLinkInterstitial": false,
            "smartAccountOptIn": true,
            "smartTransactionsMigrationApplied": false,
            "smartTransactionsOptInStatus": true,
            "tokenNetworkFilter": {},
            "tokenSortConfig": {
              "key": "tokenFiatAmount",
              "order": "dsc",
              "sortCallback": "stringNumeric",
            },
            "useNativeCurrencyAsPrimaryCurrency": true,
          },
          "referrals": {
            "hyperliquid": {},
          },
          "securityAlertsEnabled": true,
          "selectedAddress": "",
          "showIncomingTransactions": {
            "0x1": true,
            "0x13881": true,
            "0x38": true,
            "0x5": true,
            "0x504": true,
            "0x505": true,
            "0x507": true,
            "0x531": true,
            "0x61": true,
            "0x64": true,
            "0x89": true,
            "0xa": true,
            "0xa869": true,
            "0xa86a": true,
            "0xaa36a7": true,
            "0xaa37dc": true,
            "0xe704": true,
            "0xe705": true,
            "0xe708": true,
            "0xfa": true,
            "0xfa2": true,
          },
          "snapRegistryList": {},
          "snapsAddSnapAccountModalDismissed": false,
          "textDirection": "auto",
          "theme": "os",
          "use4ByteResolution": true,
          "useAddressBarEnsResolution": true,
          "useBlockie": false,
          "useCurrencyRateCheck": true,
          "useExternalNameSources": true,
          "useExternalServices": true,
          "useMultiAccountBalanceChecker": true,
          "useNftDetection": true,
          "usePhishDetect": true,
          "useSafeChainsListValidation": true,
          "useTokenDetection": true,
          "useTransactionSimulations": true,
          "watchEthereumAccountEnabled": false,
        }
      `);
    });

    it('persists expected state', () => {
      const { controller } = setupController({
        // Set optional props that have no default value, so they show up in snapshot
        state: { textDirection: 'auto' },
      });

      expect(
        deriveStateFromMetadata(
          controller.state,
          controller.metadata,
          'persist',
        ),
      ).toMatchInlineSnapshot(`
        {
          "addSnapAccountEnabled": false,
          "advancedGasFee": {},
          "currentLocale": "",
          "dismissSeedBackUpReminder": false,
          "enableMV3TimestampSave": true,
          "featureFlags": {},
          "forgottenPassword": false,
          "identities": {},
          "ipfsGateway": "dweb.link",
          "isIpfsGatewayEnabled": true,
          "isMultiAccountBalancesEnabled": true,
          "knownMethodData": {},
          "ledgerTransportType": "u2f",
          "lostIdentities": {},
          "manageInstitutionalWallets": false,
          "openSeaEnabled": true,
          "overrideContentSecurityPolicyHeader": true,
          "preferences": {
            "autoLockTimeLimit": undefined,
            "avatarType": "maskicon",
            "dismissSmartAccountSuggestionEnabled": false,
            "featureNotificationsEnabled": false,
            "hideZeroBalanceTokens": false,
            "petnamesEnabled": true,
            "privacyMode": false,
            "showConfirmationAdvancedDetails": false,
            "showExtensionInFullSizeView": false,
            "showFiatInTestnets": false,
            "showMultiRpcModal": false,
            "showNativeTokenAsMainBalance": false,
            "showTestNetworks": false,
            "skipDeepLinkInterstitial": false,
            "smartAccountOptIn": true,
            "smartTransactionsMigrationApplied": false,
            "smartTransactionsOptInStatus": true,
            "tokenNetworkFilter": {},
            "tokenSortConfig": {
              "key": "tokenFiatAmount",
              "order": "dsc",
              "sortCallback": "stringNumeric",
            },
            "useNativeCurrencyAsPrimaryCurrency": true,
          },
          "referrals": {
            "hyperliquid": {},
          },
          "securityAlertsEnabled": true,
          "selectedAddress": "",
          "showIncomingTransactions": {
            "0x1": true,
            "0x13881": true,
            "0x38": true,
            "0x5": true,
            "0x504": true,
            "0x505": true,
            "0x507": true,
            "0x531": true,
            "0x61": true,
            "0x64": true,
            "0x89": true,
            "0xa": true,
            "0xa869": true,
            "0xa86a": true,
            "0xaa36a7": true,
            "0xaa37dc": true,
            "0xe704": true,
            "0xe705": true,
            "0xe708": true,
            "0xfa": true,
            "0xfa2": true,
          },
          "snapRegistryList": {},
          "snapsAddSnapAccountModalDismissed": false,
          "textDirection": "auto",
          "theme": "os",
          "use4ByteResolution": true,
          "useAddressBarEnsResolution": true,
          "useBlockie": false,
          "useCurrencyRateCheck": true,
          "useExternalNameSources": true,
          "useExternalServices": true,
          "useMultiAccountBalanceChecker": true,
          "useNftDetection": true,
          "usePhishDetect": true,
          "useSafeChainsListValidation": true,
          "useTokenDetection": true,
          "useTransactionSimulations": true,
          "watchEthereumAccountEnabled": false,
        }
      `);
    });

    it('exposes expected state to UI', () => {
      const { controller } = setupController({
        // Set optional props that have no default value, so they show up in snapshot
        state: { textDirection: 'auto' },
      });

      expect(
        deriveStateFromMetadata(
          controller.state,
          controller.metadata,
          'usedInUi',
        ),
      ).toMatchInlineSnapshot(`
        {
          "addSnapAccountEnabled": false,
          "advancedGasFee": {},
          "currentLocale": "",
          "dismissSeedBackUpReminder": false,
          "enableMV3TimestampSave": true,
          "featureFlags": {},
          "forgottenPassword": false,
          "identities": {},
          "ipfsGateway": "dweb.link",
          "isIpfsGatewayEnabled": true,
          "isMultiAccountBalancesEnabled": true,
          "knownMethodData": {},
          "ledgerTransportType": "u2f",
          "lostIdentities": {},
          "manageInstitutionalWallets": false,
          "openSeaEnabled": true,
          "overrideContentSecurityPolicyHeader": true,
          "preferences": {
            "autoLockTimeLimit": undefined,
            "avatarType": "maskicon",
            "dismissSmartAccountSuggestionEnabled": false,
            "featureNotificationsEnabled": false,
            "hideZeroBalanceTokens": false,
            "petnamesEnabled": true,
            "privacyMode": false,
            "showConfirmationAdvancedDetails": false,
            "showExtensionInFullSizeView": false,
            "showFiatInTestnets": false,
            "showMultiRpcModal": false,
            "showNativeTokenAsMainBalance": false,
            "showTestNetworks": false,
            "skipDeepLinkInterstitial": false,
            "smartAccountOptIn": true,
            "smartTransactionsMigrationApplied": false,
            "smartTransactionsOptInStatus": true,
            "tokenNetworkFilter": {},
            "tokenSortConfig": {
              "key": "tokenFiatAmount",
              "order": "dsc",
              "sortCallback": "stringNumeric",
            },
            "useNativeCurrencyAsPrimaryCurrency": true,
          },
          "referrals": {
            "hyperliquid": {},
          },
          "securityAlertsEnabled": true,
          "selectedAddress": "",
          "showIncomingTransactions": {
            "0x1": true,
            "0x13881": true,
            "0x38": true,
            "0x5": true,
            "0x504": true,
            "0x505": true,
            "0x507": true,
            "0x531": true,
            "0x61": true,
            "0x64": true,
            "0x89": true,
            "0xa": true,
            "0xa869": true,
            "0xa86a": true,
            "0xaa36a7": true,
            "0xaa37dc": true,
            "0xe704": true,
            "0xe705": true,
            "0xe708": true,
            "0xfa": true,
            "0xfa2": true,
          },
          "snapRegistryList": {},
          "snapsAddSnapAccountModalDismissed": false,
          "textDirection": "auto",
          "theme": "os",
          "use4ByteResolution": true,
          "useAddressBarEnsResolution": true,
          "useBlockie": false,
          "useCurrencyRateCheck": true,
          "useExternalNameSources": true,
          "useExternalServices": true,
          "useMultiAccountBalanceChecker": true,
          "useNftDetection": true,
          "usePhishDetect": true,
          "useSafeChainsListValidation": true,
          "useTokenDetection": true,
          "useTransactionSimulations": true,
          "watchEthereumAccountEnabled": false,
        }
      `);
    });
  });

  describe('Hyperliquid referral methods', () => {
    describe('addReferralApprovedAccount', () => {
      const { controller } = setupController({});

      it('adds an account with approved status', () => {
        const testAccount = '0x123';

        controller.addReferralApprovedAccount(testAccount);
        expect(
          controller.state.referrals.hyperliquid[testAccount],
        ).toStrictEqual(ReferralStatus.Approved);
      });

      it('overwrites existing account status', () => {
        const testAccount = '0x123';

        controller.addReferralDeclinedAccount(testAccount);
        expect(
          controller.state.referrals.hyperliquid[testAccount],
        ).toStrictEqual(ReferralStatus.Declined);

        controller.addReferralApprovedAccount(testAccount);
        expect(
          controller.state.referrals.hyperliquid[testAccount],
        ).toStrictEqual(ReferralStatus.Approved);
      });

      it('adds multiple unique accounts', () => {
        const testAccount1 = '0x123';
        const testAccount2 = '0x456';

        controller.addReferralApprovedAccount(testAccount1);
        controller.addReferralApprovedAccount(testAccount2);
        expect(
          controller.state.referrals.hyperliquid[testAccount1],
        ).toStrictEqual(ReferralStatus.Approved);
        expect(
          controller.state.referrals.hyperliquid[testAccount2],
        ).toStrictEqual(ReferralStatus.Approved);
      });
    });

    describe('addReferralPassedAccount', () => {
      const { controller } = setupController({});

      it('adds account with passed status', () => {
        const testAccount = '0x123';

        controller.addReferralPassedAccount(testAccount);
        expect(
          controller.state.referrals.hyperliquid[testAccount],
        ).toStrictEqual(ReferralStatus.Passed);
      });

      it('overwrites existing account status', () => {
        const testAccount = '0x123';

        controller.addReferralApprovedAccount(testAccount);
        expect(
          controller.state.referrals.hyperliquid[testAccount],
        ).toStrictEqual(ReferralStatus.Approved);

        controller.addReferralPassedAccount(testAccount);
        expect(
          controller.state.referrals.hyperliquid[testAccount],
        ).toStrictEqual(ReferralStatus.Passed);
      });
    });

    describe('addReferralDeclinedAccount', () => {
      const { controller } = setupController({});

      it('adds account with declined status', () => {
        const testAccount = '0x123';

        controller.addReferralDeclinedAccount(testAccount);
        expect(
          controller.state.referrals.hyperliquid[testAccount],
        ).toStrictEqual(ReferralStatus.Declined);
      });

      it('overwrites existing account status', () => {
        const testAccount = '0x123';

        controller.addReferralPassedAccount(testAccount);
        expect(
          controller.state.referrals.hyperliquid[testAccount],
        ).toStrictEqual(ReferralStatus.Passed);

        controller.addReferralDeclinedAccount(testAccount);
        expect(
          controller.state.referrals.hyperliquid[testAccount],
        ).toStrictEqual(ReferralStatus.Declined);
      });
    });

    describe('removeReferralDeclinedAccount', () => {
      it('removes the specified account from referrals completely', () => {
        const testAccount1 = '0x123';
        const testAccount2 = '0x456';
        const { controller } = setupController({
          state: {
            referrals: {
              hyperliquid: {
                [testAccount1]: ReferralStatus.Declined,
                [testAccount2]: ReferralStatus.Declined,
              },
            },
          },
        });

        controller.removeReferralDeclinedAccount(testAccount1);
        expect(
          controller.state.referrals.hyperliquid[testAccount1],
        ).toBeUndefined();
        expect(
          controller.state.referrals.hyperliquid[testAccount2],
        ).toStrictEqual(ReferralStatus.Declined);
      });

      it('handles removing non-existent account gracefully', () => {
        const testAccount1 = '0x123';
        const testAccount2 = '0x456';
        const { controller } = setupController({
          state: {
            referrals: {
              hyperliquid: {
                [testAccount1]: ReferralStatus.Declined,
              },
            },
          },
        });

        controller.removeReferralDeclinedAccount(testAccount2);
        expect(
          controller.state.referrals.hyperliquid[testAccount1],
        ).toStrictEqual(ReferralStatus.Declined);
        expect(
          controller.state.referrals.hyperliquid[testAccount2],
        ).toBeUndefined();
      });
    });

    describe('setAccountsReferralApproved', () => {
      it('sets all accounts to approved status', () => {
        const { controller } = setupController({});
        const testAccounts = ['0x123', '0x456'] as Hex[];

        controller.setAccountsReferralApproved(testAccounts);
        expect(controller.state.referrals.hyperliquid['0x123']).toStrictEqual(
          ReferralStatus.Approved,
        );
        expect(controller.state.referrals.hyperliquid['0x456']).toStrictEqual(
          ReferralStatus.Approved,
        );
      });

      it('overwrites existing account statuses', () => {
        const existingAccount = '0x123';
        const newAccount = '0x456';
        const accountsToApprove = [existingAccount, newAccount] as Hex[];

        const { controller } = setupController({
          state: {
            referrals: {
              hyperliquid: {
                [existingAccount]: ReferralStatus.Declined,
              },
            },
          },
        });

        controller.setAccountsReferralApproved(accountsToApprove);
        expect(
          controller.state.referrals.hyperliquid[existingAccount],
        ).toStrictEqual(ReferralStatus.Approved);
        expect(
          controller.state.referrals.hyperliquid[newAccount],
        ).toStrictEqual(ReferralStatus.Approved);
      });

      it('handles empty array input gracefully', () => {
        const existingAccount = '0x123';
        const { controller } = setupController({
          state: {
            referrals: {
              hyperliquid: {
                [existingAccount]: ReferralStatus.Approved,
              },
            },
          },
        });

        controller.setAccountsReferralApproved([]);
        expect(
          controller.state.referrals.hyperliquid[existingAccount],
        ).toStrictEqual(ReferralStatus.Approved);
      });
    });

    describe('referral state defaults', () => {
      it('initializes with empty referral record', () => {
        const { controller } = setupController({});

        expect(controller.state.referrals.hyperliquid).toStrictEqual({});
      });
    });
  });
});
