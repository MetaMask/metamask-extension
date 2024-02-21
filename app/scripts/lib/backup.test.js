/**
 * @jest-environment node
 */
import { EthAccountType, EthMethod } from '@metamask/keyring-api';
import Backup from './backup';

function getMockPreferencesController() {
  const mcState = {
    getSelectedAddress: jest.fn().mockReturnValue('0x01'),
    selectedAddress: '0x01',
    identities: {
      '0x295e26495CEF6F69dFA69911d9D8e4F3bBadB89B': {
        address: '0x295e26495CEF6F69dFA69911d9D8e4F3bBadB89B',
        lastSelected: 1655380342907,
        name: 'Account 3',
      },
    },
    lostIdentities: {
      '0xfd59bbe569376e3d3e4430297c3c69ea93f77435': {
        address: '0xfd59bbe569376e3d3e4430297c3c69ea93f77435',
        lastSelected: 1655379648197,
        name: 'Ledger 1',
      },
    },
    update: (store) => (mcState.store = store),
  };

  mcState.store = {
    getState: jest.fn().mockReturnValue(mcState),
    updateState: (store) => (mcState.store = store),
  };

  return mcState;
}

function getMockAddressBookController() {
  const mcState = {
    addressBook: {
      '0x61': {
        '0x42EB768f2244C8811C63729A21A3569731535f06': {
          address: '0x42EB768f2244C8811C63729A21A3569731535f06',
          chainId: '0x61',
          isEns: false,
          memo: '',
          name: '',
        },
      },
    },

    update: (store) => (mcState.store = store),
  };

  mcState.store = {
    getState: jest.fn().mockReturnValue(mcState),
    updateState: (store) => (mcState.store = store),
  };

  return mcState;
}

function getMockNetworkController() {
  const state = {
    networkConfigurations: {},
  };

  const loadBackup = ({ networkConfigurations }) => {
    Object.assign(state, { networkConfigurations });
  };

  return { state, loadBackup };
}

function getMockAccountsController() {
  const state = {
    internalAccounts: {
      accounts: {},
      selectedAccount: '',
    },
  };

  const loadBackup = (internalAccounts) => {
    Object.assign(state, { internalAccounts });
  };

  return {
    state,
    loadBackup,
    getSelectedAccount: () => 'mock-id',
  };
}

const jsonData = JSON.stringify({
  addressBook: {
    addressBook: {
      '0x61': {
        '0x42EB768f2244C8811C63729A21A3569731535f06': {
          address: '0x42EB768f2244C8811C63729A21A3569731535f06',
          chainId: '0x61',
          isEns: false,
          memo: '',
          name: '',
        },
      },
    },
  },
  network: {
    networkConfigurations: {
      'network-configuration-id-1': {
        chainId: '0x539',
        nickname: 'Localhost 8545',
        rpcPrefs: {},
        rpcUrl: 'http://localhost:8545',
        ticker: 'ETH',
      },
      'network-configuration-id-2': {
        chainId: '0x38',
        nickname: 'Binance Smart Chain Mainnet',
        rpcPrefs: {
          blockExplorerUrl: 'https://bscscan.com',
        },
        rpcUrl: 'https://bsc-dataseed1.binance.org',
        ticker: 'BNB',
      },
      'network-configuration-id-3': {
        chainId: '0x61',
        nickname: 'Binance Smart Chain Testnet',
        rpcPrefs: {
          blockExplorerUrl: 'https://testnet.bscscan.com',
        },
        rpcUrl: 'https://data-seed-prebsc-1-s1.binance.org:8545',
        ticker: 'tBNB',
      },
      'network-configuration-id-4': {
        chainId: '0x89',
        nickname: 'Polygon Mainnet',
        rpcPrefs: {
          blockExplorerUrl: 'https://polygonscan.com',
        },
        rpcUrl: 'https://polygon-rpc.com',
        ticker: 'MATIC',
      },
    },
  },
  preferences: {
    useBlockie: false,
    useNonceField: false,
    usePhishDetect: true,
    dismissSeedBackUpReminder: false,
    useTokenDetection: false,
    useCollectibleDetection: false,
    openSeaEnabled: false,
    advancedGasFee: null,
    featureFlags: {
      sendHexData: true,
    },
    knownMethodData: {},
    currentLocale: 'en',
    forgottenPassword: false,
    preferences: {
      hideZeroBalanceTokens: false,
      showExtensionInFullSizeView: false,
      showFiatInTestnets: false,
      showTestNetworks: true,
      useNativeCurrencyAsPrimaryCurrency: true,
    },
    ipfsGateway: 'dweb.link',
    ledgerTransportType: 'webhid',
    theme: 'light',
    customNetworkListEnabled: false,
    textDirection: 'auto',
    useRequestQueue: false,
  },
  internalAccounts: {
    accounts: {
      'fcbcdca4-cc47-4bc8-b455-b14421e9277e': {
        address: '0x129af01f4b770b30615f049790e1e206ebaa7b10',
        id: 'fcbcdca4-cc47-4bc8-b455-b14421e9277e',
        metadata: {
          name: 'Account 1',
          keyring: {
            type: 'HD Key Tree',
          },
          lastSelected: 1693289751176,
        },
        options: {},
        methods: [
          EthMethod.PersonalSign,
          EthMethod.Sign,
          EthMethod.SignTransaction,
          EthMethod.SignTypedDataV1,
          EthMethod.SignTypedDataV3,
          EthMethod.SignTypedDataV4,
        ],
        type: EthAccountType.Eoa,
      },
    },
    selectedAccount: 'fcbcdca4-cc47-4bc8-b455-b14421e9277e',
  },
});

describe('Backup', function () {
  const getBackup = () => {
    return new Backup({
      preferencesController: getMockPreferencesController(),
      addressBookController: getMockAddressBookController(),
      networkController: getMockNetworkController(),
      accountsController: getMockAccountsController(),
      trackMetaMetricsEvent: jest.fn(),
    });
  };

  describe('constructor', function () {
    it('should setup correctly', async function () {
      const backup = getBackup();
      const selectedAddress = backup.preferencesController.getSelectedAddress();
      expect(selectedAddress).toStrictEqual('0x01');
    });

    it('should restore backup', async function () {
      const backup = getBackup();
      await backup.restoreUserData(jsonData);
      // check networks backup
      expect(
        backup.networkController.state.networkConfigurations[
          'network-configuration-id-1'
        ].chainId,
      ).toStrictEqual('0x539');
      expect(
        backup.networkController.state.networkConfigurations[
          'network-configuration-id-2'
        ].chainId,
      ).toStrictEqual('0x38');
      expect(
        backup.networkController.state.networkConfigurations[
          'network-configuration-id-3'
        ].chainId,
      ).toStrictEqual('0x61');
      expect(
        backup.networkController.state.networkConfigurations[
          'network-configuration-id-4'
        ].chainId,
      ).toStrictEqual('0x89');
      // make sure identities are not lost after restore
      expect(
        backup.preferencesController.store.identities[
          '0x295e26495CEF6F69dFA69911d9D8e4F3bBadB89B'
        ].lastSelected,
      ).toStrictEqual(1655380342907);

      expect(
        backup.preferencesController.store.identities[
          '0x295e26495CEF6F69dFA69911d9D8e4F3bBadB89B'
        ].name,
      ).toStrictEqual('Account 3');

      expect(
        backup.preferencesController.store.lostIdentities[
          '0xfd59bbe569376e3d3e4430297c3c69ea93f77435'
        ].lastSelected,
      ).toStrictEqual(1655379648197);

      expect(
        backup.preferencesController.store.lostIdentities[
          '0xfd59bbe569376e3d3e4430297c3c69ea93f77435'
        ].name,
      ).toStrictEqual('Ledger 1');
      // make sure selected address is not lost after restore
      expect(backup.preferencesController.store.selectedAddress).toStrictEqual(
        '0x01',
      );

      // check address book backup
      expect(
        backup.addressBookController.store.addressBook['0x61'][
          '0x42EB768f2244C8811C63729A21A3569731535f06'
        ].chainId,
      ).toStrictEqual('0x61');

      expect(
        backup.addressBookController.store.addressBook['0x61'][
          '0x42EB768f2244C8811C63729A21A3569731535f06'
        ].address,
      ).toStrictEqual('0x42EB768f2244C8811C63729A21A3569731535f06');

      expect(
        backup.addressBookController.store.addressBook['0x61'][
          '0x42EB768f2244C8811C63729A21A3569731535f06'
        ].isEns,
      ).toBeFalsy();

      // make sure the internal accounts are restored
      expect(
        backup.accountsController.state.internalAccounts.accounts[
          'fcbcdca4-cc47-4bc8-b455-b14421e9277e'
        ],
      ).toStrictEqual({
        address: '0x129af01f4b770b30615f049790e1e206ebaa7b10',
        id: 'fcbcdca4-cc47-4bc8-b455-b14421e9277e',
        metadata: {
          keyring: { type: 'HD Key Tree' },
          lastSelected: 1693289751176,
          name: 'Account 1',
        },
        methods: [
          'personal_sign',
          'eth_sign',
          'eth_signTransaction',
          'eth_signTypedData_v1',
          'eth_signTypedData_v3',
          'eth_signTypedData_v4',
        ],
        options: {},
        type: 'eip155:eoa',
      });

      // make sure selected account is restored
      expect(
        backup.accountsController.state.internalAccounts.selectedAccount,
      ).toBe('fcbcdca4-cc47-4bc8-b455-b14421e9277e');
    });
  });
});
