import sinon from 'sinon';
import configureStore from 'redux-mock-store';
import thunk from 'redux-thunk';
import { EthAccountType } from '@metamask/keyring-api';
import { TransactionStatus } from '@metamask/transaction-controller';
import { NotificationServicesController } from '@metamask/notification-services-controller';
import { USER_STORAGE_FEATURE_NAMES } from '@metamask/profile-sync-controller/sdk';
import { BACKUPANDSYNC_FEATURES } from '@metamask/profile-sync-controller/user-storage';
// TODO: Remove restricted import
// eslint-disable-next-line import/no-restricted-paths
import enLocale from '../../app/_locales/en/messages.json';
// TODO: Remove restricted import
// eslint-disable-next-line import/no-restricted-paths
import MetaMaskController from '../../app/scripts/metamask-controller';
import { HardwareDeviceNames } from '../../shared/constants/hardware-wallets';
import { GAS_LIMITS } from '../../shared/constants/gas';
import { ORIGIN_METAMASK } from '../../shared/constants/app';
import { MetaMetricsNetworkEventSource } from '../../shared/constants/metametrics';
import { ETH_EOA_METHODS } from '../../shared/constants/eth-methods';
import { mockNetworkState } from '../../test/stub/networks';
import { CHAIN_IDS } from '../../shared/constants/network';
import { FirstTimeFlowType } from '../../shared/constants/onboarding';
import * as actions from './actions';
import * as actionConstants from './actionConstants';
import { setBackgroundConnection } from './background-connection';

const { TRIGGER_TYPES } = NotificationServicesController.Constants;

const mockUlid = '01JMPHQSH1A4DQAAS6ES7NDJ38';

const middleware = [thunk];
const defaultState = {
  metamask: {
    currentLocale: 'test',
    networkConfigurationsByChainId: {
      [CHAIN_IDS.MAINNET]: {
        chainId: CHAIN_IDS.MAINNET,
        rpcEndpoints: [{}],
      },
    },
    accounts: {
      '0xFirstAddress': {
        balance: '0x0',
      },
    },
    keyrings: [
      {
        type: 'HD Key Tree',
        accounts: [
          {
            address: '0xFirstAddress',
          },
        ],
        metadata: {
          id: mockUlid,
          name: '',
        },
      },
    ],
    ...mockNetworkState({ chainId: CHAIN_IDS.MAINNET }),
    internalAccounts: {
      accounts: {
        'cf8dace4-9439-4bd4-b3a8-88c821c8fcb3': {
          address: '0xFirstAddress',
          id: 'cf8dace4-9439-4bd4-b3a8-88c821c8fcb3',
          metadata: {
            name: 'Test Account',
            keyring: {
              type: 'HD Key Tree',
            },
          },
          options: {},
          methods: ETH_EOA_METHODS,
          type: EthAccountType.Eoa,
        },
      },
      selectedAccount: 'cf8dace4-9439-4bd4-b3a8-88c821c8fcb3',
    },
  },
};
const mockStore = (state = defaultState) => configureStore(middleware)(state);

describe('Actions', () => {
  let background;

  const currentChainId = '0x5';

  let originalNavigator;

  beforeEach(async () => {
    // Save original navigator for restoring after tests
    originalNavigator = global.navigator;

    background = sinon.createStubInstance(MetaMaskController, {
      getState: sinon.stub().resolves([]),
    });

    background.signMessage = sinon.stub();
    background.signPersonalMessage = sinon.stub();
    background.signTypedMessage = sinon.stub();
    background.abortTransactionSigning = sinon.stub();
    background.toggleExternalServices = sinon.stub();
    background.getStatePatches = sinon.stub().resolves([]);
    background.removePermittedChain = sinon.stub();
    background.requestAccountsAndChainPermissionsWithId = sinon.stub();
    background.grantPermissions = sinon.stub();
    background.grantPermissionsIncremental = sinon.stub();
    background.changePassword = sinon.stub();

    // Make sure navigator.hid is defined for WebHID tests
    if (!global.navigator) {
      global.navigator = {};
    }

    if (!global.navigator.hid) {
      global.navigator.hid = {
        requestDevice: sinon.stub(),
      };
    }
  });

  afterEach(() => {
    // Restore original window.navigator after each test
    Object.defineProperty(window, 'navigator', {
      value: originalNavigator,
      writable: true,
    });

    sinon.restore();
  });

  describe('createAndBackupSeedPhrase', () => {
    afterEach(() => {
      sinon.restore();
    });

    it('should create KeyChain, vault and Backup in the background', async () => {
      const store = mockStore();
      const mockKeyrings = [{ metadata: { id: 'mock-keyring-id' } }];
      const mockSeedPhrase = 'mock seed phrase';
      const mockEncodedSeedPhrase = Array.from(
        Buffer.from(mockSeedPhrase).values(),
      );

      const createSeedPhraseBackupStub =
        background.createSeedPhraseBackup.resolves();
      const createNewVaultAndKeychainStub =
        background.createNewVaultAndKeychain.resolves(mockKeyrings[0]);
      const getSeedPhraseStub = background.getSeedPhrase.resolves(
        mockEncodedSeedPhrase,
      );

      setBackgroundConnection(background);

      await store.dispatch(actions.createNewVaultAndSyncWithSocial('password'));

      expect(getSeedPhraseStub.callCount).toStrictEqual(1);
      expect(createNewVaultAndKeychainStub.callCount).toStrictEqual(1);
      expect(
        createSeedPhraseBackupStub.calledOnceWith(
          'password',
          mockEncodedSeedPhrase,
          mockKeyrings[0].metadata.id,
        ),
      ).toStrictEqual(true);
    });
  });

  describe('#restoreAndGetSeedPhrase', () => {
    afterEach(() => {
      sinon.restore();
    });

    it('fetches all seed phrases from the metadata store, restores the vault and updates the SocialbackupMetadata state', async () => {
      const store = mockStore();

      const restoreSocialBackupAndGetSeedPhraseStub =
        background.restoreSocialBackupAndGetSeedPhrase.resolves();

      setBackgroundConnection(background);

      await store.dispatch(
        actions.restoreSocialBackupAndGetSeedPhrase('password'),
      );

      expect(restoreSocialBackupAndGetSeedPhraseStub.callCount).toStrictEqual(
        1,
      );
    });

    it('errors when fetchAndRestoreSeedPhrase throws', async () => {
      const store = mockStore();

      background.restoreSocialBackupAndGetSeedPhrase.rejects(
        new Error('error'),
      );

      setBackgroundConnection(background);

      const expectedActions = [{ type: 'DISPLAY_WARNING', payload: 'error' }];

      await expect(
        store.dispatch(actions.restoreSocialBackupAndGetSeedPhrase('password')),
      ).rejects.toThrow('error');
      expect(store.getActions()).toStrictEqual(expectedActions);
    });
  });

  describe('#changePassword', () => {
    afterEach(() => {
      sinon.restore();
    });

    it('should change the password for both seedless onboarding and keyring controller', async () => {
      const store = mockStore({
        metamask: {
          ...defaultState.metamask,
          firstTimeFlowType: FirstTimeFlowType.socialCreate,
        },
      });
      const oldPassword = 'old-password';
      const newPassword = 'new-password';

      background.changePassword.resolves();
      setBackgroundConnection(background);

      await store.dispatch(actions.changePassword(newPassword, oldPassword));

      expect(
        background.changePassword.calledOnceWith(newPassword, oldPassword),
      ).toStrictEqual(true);
    });
  });

  describe('#checkIsSeedlessPasswordOutdated', () => {
    afterEach(() => {
      sinon.restore();
    });

    it('should return true if the password is outdated', async () => {
      const store = mockStore();

      const checkIsSeedlessPasswordOutdated =
        background.checkIsSeedlessPasswordOutdated.resolves(true);

      setBackgroundConnection(background);

      const result = await store.dispatch(
        actions.checkIsSeedlessPasswordOutdated(),
      );
      expect(result).toStrictEqual(true);
      expect(checkIsSeedlessPasswordOutdated.callCount).toStrictEqual(1);
    });

    it('should return false if the password is not outdated', async () => {
      const store = mockStore();

      const checkIsSeedlessPasswordOutdated =
        background.checkIsSeedlessPasswordOutdated.resolves(false);

      setBackgroundConnection(background);

      const result = await store.dispatch(
        actions.checkIsSeedlessPasswordOutdated(),
      );
      expect(result).toStrictEqual(false);
      expect(checkIsSeedlessPasswordOutdated.callCount).toStrictEqual(1);
    });

    it('should not throw an error if the checkIsSeedlessPasswordOutdated fails', async () => {
      const store = mockStore();

      const checkIsSeedlessPasswordOutdated =
        background.checkIsSeedlessPasswordOutdated.rejects(new Error('error'));

      setBackgroundConnection(background);

      const result = await store.dispatch(
        actions.checkIsSeedlessPasswordOutdated(),
      );
      expect(result).toStrictEqual(false);
      expect(checkIsSeedlessPasswordOutdated.callCount).toStrictEqual(1);
    });
  });

  describe('#tryUnlockMetamask', () => {
    afterEach(() => {
      sinon.restore();
    });

    it('calls syncPasswordAndUnlockWallet', async () => {
      const store = mockStore();

      const syncPasswordAndUnlockWallet =
        background.syncPasswordAndUnlockWallet.resolves(true);

      setBackgroundConnection(background);

      const expectedActions = [
        { type: 'SHOW_LOADING_INDICATION', payload: undefined },
        { type: 'UNLOCK_IN_PROGRESS' },
        { type: 'UNLOCK_SUCCEEDED', value: undefined },
        { type: 'HIDE_LOADING_INDICATION' },
        { type: 'HIDE_WARNING' },
      ];

      await store.dispatch(actions.tryUnlockMetamask());

      expect(syncPasswordAndUnlockWallet.callCount).toStrictEqual(1);

      expect(store.getActions()).toStrictEqual(expectedActions);
    });

    it('errors on syncPasswordAndUnlockWallet will fail', async () => {
      const store = mockStore();

      background.syncPasswordAndUnlockWallet.rejects(new Error('error'));

      setBackgroundConnection(background);

      const expectedActions = [
        { type: 'SHOW_LOADING_INDICATION', payload: undefined },
        { type: 'UNLOCK_IN_PROGRESS' },
        { type: 'UNLOCK_FAILED', value: 'error' },
        { type: 'HIDE_LOADING_INDICATION' },
      ];

      await expect(
        store.dispatch(actions.tryUnlockMetamask('test')),
      ).rejects.toThrow('error');

      expect(store.getActions()).toStrictEqual(expectedActions);
    });
  });

  describe('#createNewVaultAndRestore', () => {
    afterEach(() => {
      sinon.restore();
    });

    it('calls createNewVaultAndRestore', async () => {
      const store = mockStore();

      const createNewVaultAndRestore =
        background.createNewVaultAndRestore.resolves();

      background.unMarkPasswordForgotten.resolves();

      setBackgroundConnection(background);

      await store.dispatch(
        actions.createNewVaultAndRestore('password', 'test'),
      );
      expect(createNewVaultAndRestore.callCount).toStrictEqual(1);
    });

    it('calls the expected actions', async () => {
      const store = mockStore();

      background.createNewVaultAndRestore.resolves();
      background.unMarkPasswordForgotten.resolves();

      setBackgroundConnection(background);

      const expectedActions = [
        { type: 'SHOW_LOADING_INDICATION', payload: undefined },
        { type: 'SHOW_ACCOUNTS_PAGE' },
        { type: 'HIDE_LOADING_INDICATION' },
      ];

      await store.dispatch(
        actions.createNewVaultAndRestore('password', 'test'),
      );

      expect(store.getActions()).toStrictEqual(expectedActions);
    });

    it('errors when callback in createNewVaultAndRestore throws', async () => {
      const store = mockStore();

      background.createNewVaultAndRestore.rejects(new Error('error'));

      setBackgroundConnection(background);

      const expectedActions = [
        { type: 'SHOW_LOADING_INDICATION', payload: undefined },
        { type: 'DISPLAY_WARNING', payload: 'error' },
        { type: 'HIDE_LOADING_INDICATION' },
      ];

      await expect(
        store.dispatch(actions.createNewVaultAndRestore('password', 'test')),
      ).rejects.toThrow('error');

      expect(store.getActions()).toStrictEqual(expectedActions);
    });
  });

  describe('#requestRevealSeedWords', () => {
    afterEach(() => {
      sinon.restore();
    });

    it('calls verifyPassword in background', async () => {
      const store = mockStore();

      const verifyPassword = background.verifyPassword.resolves();
      const getSeedPhrase = background.getSeedPhrase.resolves(
        Array.from(Buffer.from('test').values()),
      );

      setBackgroundConnection(background);

      await store.dispatch(actions.requestRevealSeedWords());
      expect(verifyPassword.callCount).toStrictEqual(1);
      expect(getSeedPhrase.callCount).toStrictEqual(1);
    });

    it('displays warning error message then callback in background errors', async () => {
      const store = mockStore();

      background.verifyPassword.resolves();
      background.getSeedPhrase.rejects(new Error('error'));

      setBackgroundConnection(background);

      const expectedActions = [
        { type: 'SHOW_LOADING_INDICATION', payload: undefined },
        { type: 'HIDE_LOADING_INDICATION' },
      ];

      await expect(
        store.dispatch(actions.requestRevealSeedWords()),
      ).rejects.toThrow('error');

      expect(store.getActions()).toStrictEqual(expectedActions);
    });
  });

  describe('#removeAccount', () => {
    afterEach(() => {
      sinon.restore();
    });

    it('calls removeAccount in background and expect actions to show account', async () => {
      const store = mockStore();

      const removeAccount = background.removeAccount.resolves();

      setBackgroundConnection(background);

      const expectedActions = [
        'SHOW_LOADING_INDICATION',
        'HIDE_LOADING_INDICATION',
        'SHOW_ACCOUNTS_PAGE',
      ];

      await store.dispatch(
        actions.removeAccount('0xe18035bf8712672935fdb4e5e431b1a0183d2dfc'),
      );
      expect(removeAccount.callCount).toStrictEqual(1);
      const actionTypes = store.getActions().map((action) => action.type);
      expect(actionTypes).toStrictEqual(expectedActions);
    });

    it('displays warning error message when removeAccount callback errors', async () => {
      const store = mockStore();

      background.removeAccount.rejects(new Error('error'));

      setBackgroundConnection(background);

      const expectedActions = [
        { type: 'SHOW_LOADING_INDICATION', payload: undefined },
        { type: 'DISPLAY_WARNING', payload: 'error' },
        { type: 'HIDE_LOADING_INDICATION' },
      ];

      await expect(
        store.dispatch(
          actions.removeAccount('0xe18035bf8712672935fdb4e5e431b1a0183d2dfc'),
        ),
      ).rejects.toThrow('error');

      expect(store.getActions()).toStrictEqual(expectedActions);
    });
  });

  describe('#resetAccount', () => {
    afterEach(() => {
      sinon.restore();
    });

    it('resets account', async () => {
      const store = mockStore();

      const resetAccount = background.resetAccount.resolves();

      setBackgroundConnection(background);

      const expectedActions = [
        { type: 'SHOW_LOADING_INDICATION', payload: undefined },
        { type: 'HIDE_LOADING_INDICATION' },
        { type: 'SHOW_ACCOUNTS_PAGE' },
      ];

      await store.dispatch(actions.resetAccount());
      expect(resetAccount.callCount).toStrictEqual(1);
      expect(store.getActions()).toStrictEqual(expectedActions);
    });

    it('throws if resetAccount throws', async () => {
      const store = mockStore();

      background.resetAccount.rejects(new Error('error'));

      setBackgroundConnection(background);

      const expectedActions = [
        { type: 'SHOW_LOADING_INDICATION', payload: undefined },
        { type: 'HIDE_LOADING_INDICATION' },
        { type: 'DISPLAY_WARNING', payload: 'error' },
      ];

      await expect(store.dispatch(actions.resetAccount())).rejects.toThrow(
        'error',
      );

      expect(store.getActions()).toStrictEqual(expectedActions);
    });
  });

  describe('#importNewAccount', () => {
    afterEach(() => {
      sinon.restore();
    });

    it('calls importAccountWithStrategies in background', async () => {
      const store = mockStore();

      const importAccountWithStrategy =
        background.importAccountWithStrategy.resolves();

      setBackgroundConnection(background);

      await store.dispatch(
        actions.importNewAccount(
          'Private Key',
          ['c87509a1c067bbde78beb793e6fa76530b6382a4c0241e5e4a9ec0a0f44dc0d3'],
          '',
        ),
      );
      expect(importAccountWithStrategy.callCount).toStrictEqual(1);
    });

    it('displays warning error message when importAccount in background callback errors', async () => {
      const store = mockStore();

      background.importAccountWithStrategy.rejects(new Error('error'));

      setBackgroundConnection(background);

      const expectedActions = [
        {
          type: 'SHOW_LOADING_INDICATION',
          payload: undefined,
        },
        { type: 'HIDE_LOADING_INDICATION' },
      ];

      await expect(store.dispatch(actions.importNewAccount())).rejects.toThrow(
        'error',
      );

      expect(store.getActions()).toStrictEqual(expectedActions);
    });
  });

  describe('#addNewAccount', () => {
    it('adds a new account', async () => {
      const store = mockStore({
        metamask: { ...defaultState.metamask },
      });

      const addNewAccount = background.addNewAccount.resolves({
        addedAccountAddress: '0x123',
      });

      setBackgroundConnection(background);

      await store.dispatch(actions.addNewAccount());
      expect(addNewAccount.callCount).toStrictEqual(1);
    });

    it('displays warning error message when addNewAccount in background callback errors', async () => {
      const store = mockStore();

      background.addNewAccount.rejects(new Error('error'));

      setBackgroundConnection(background);

      const expectedActions = [
        { type: 'SHOW_LOADING_INDICATION', payload: undefined },
        { type: 'DISPLAY_WARNING', payload: 'error' },
        { type: 'HIDE_LOADING_INDICATION' },
      ];

      await expect(store.dispatch(actions.addNewAccount())).rejects.toThrow(
        'error',
      );

      expect(store.getActions()).toStrictEqual(expectedActions);
    });

    it('adds an account to a specific keyring by id', async () => {
      const store = mockStore({
        metamask: { ...defaultState.metamask },
      });

      const addNewAccount = background.addNewAccount.resolves({
        addedAccountAddress: '0x123',
      });

      setBackgroundConnection(background);

      await store.dispatch(actions.addNewAccount(mockUlid));
      expect(addNewAccount.callCount).toStrictEqual(1);
    });

    it('throws if an invalid keyring id is provided', async () => {
      const store = mockStore({
        metamask: { ...defaultState.metamask },
      });

      const addNewAccount = background.addNewAccount.resolves({
        addedAccountAddress: '0x123',
      });

      setBackgroundConnection(background);

      await expect(
        store.dispatch(actions.addNewAccount('invalidKeyringId')),
      ).rejects.toThrow('Keyring not found');
      expect(addNewAccount.callCount).toStrictEqual(0);
    });
  });

  describe('#checkHardwareStatus', () => {
    afterEach(() => {
      sinon.restore();
    });

    it('calls checkHardwareStatus in background', async () => {
      const store = mockStore();

      const checkHardwareStatus = background.checkHardwareStatus.resolves();

      setBackgroundConnection(background);

      await store.dispatch(
        actions.checkHardwareStatus(
          HardwareDeviceNames.ledger,
          `m/44'/60'/0'/0`,
        ),
      );
      expect(checkHardwareStatus.callCount).toStrictEqual(1);
    });

    it('shows loading indicator and displays error', async () => {
      const store = mockStore();

      background.checkHardwareStatus.rejects(new Error('error'));

      setBackgroundConnection(background);

      const expectedActions = [
        { type: 'SHOW_LOADING_INDICATION', payload: undefined },
        { type: 'DISPLAY_WARNING', payload: 'error' },
        { type: 'HIDE_LOADING_INDICATION' },
      ];

      await expect(
        store.dispatch(actions.checkHardwareStatus()),
      ).rejects.toThrow('error');

      expect(store.getActions()).toStrictEqual(expectedActions);
    });
  });

  describe('#forgetDevice', () => {
    afterEach(() => {
      sinon.restore();
    });

    it('calls forgetDevice in background', async () => {
      const store = mockStore();

      const forgetDevice = background.forgetDevice.resolves();

      setBackgroundConnection(background);

      await store.dispatch(actions.forgetDevice(HardwareDeviceNames.ledger));
      expect(forgetDevice.callCount).toStrictEqual(1);
    });

    it('shows loading indicator and displays error', async () => {
      const store = mockStore();

      background.forgetDevice.rejects(new Error('error'));

      setBackgroundConnection(background);

      const expectedActions = [
        { type: 'SHOW_LOADING_INDICATION', payload: undefined },
        { type: 'DISPLAY_WARNING', payload: 'error' },
        { type: 'HIDE_LOADING_INDICATION' },
      ];

      await expect(store.dispatch(actions.forgetDevice())).rejects.toThrow(
        'error',
      );

      expect(store.getActions()).toStrictEqual(expectedActions);
    });
  });

  describe('#connectHardware', () => {
    afterEach(() => {
      sinon.restore();
    });

    it('calls connectHardware in background', async () => {
      const store = mockStore();

      const connectHardware = background.connectHardware.resolves();

      setBackgroundConnection(background);

      await store.dispatch(
        actions.connectHardware(
          HardwareDeviceNames.ledger,
          0,
          `m/44'/60'/0'/0`,
        ),
      );
      expect(connectHardware.callCount).toStrictEqual(1);
    });

    it('shows loading indicator and displays error', async () => {
      const store = mockStore();

      background.connectHardware.rejects(new Error('error'));

      setBackgroundConnection(background);

      const expectedActions = [
        {
          type: 'SHOW_LOADING_INDICATION',
          payload: 'Looking for your Ledger...',
        },
        { type: 'DISPLAY_WARNING', payload: 'error' },
        { type: 'HIDE_LOADING_INDICATION' },
      ];

      await expect(
        store.dispatch(actions.connectHardware(HardwareDeviceNames.ledger)),
      ).rejects.toThrow('error');

      expect(store.getActions()).toStrictEqual(expectedActions);
    });

    it('handles WebHID connection when loadHid=true for Ledger devices', async () => {
      const store = mockStore({
        ...defaultState,
        metamask: {
          ...defaultState.metamask,
          ledgerTransportType: 'webhid',
        },
      });

      const mockHidDevice = { vendorId: 11415 };
      const mockRequestDevice = sinon.stub().resolves([mockHidDevice]);

      Object.defineProperty(window, 'navigator', {
        value: {
          ...window.navigator,
          hid: {
            requestDevice: mockRequestDevice,
          },
        },
        writable: true,
      });

      const connectHardware = background.connectHardware.resolves([
        { address: '0xLedgerAddress' },
      ]);

      setBackgroundConnection(background);

      const expectedActions = [
        {
          type: 'SHOW_LOADING_INDICATION',
          payload: 'Looking for your Ledger...',
        },
        { type: 'HIDE_LOADING_INDICATION' },
      ];

      const accounts = await store.dispatch(
        actions.connectHardware(
          HardwareDeviceNames.ledger,
          0,
          `m/44'/60'/0'/0`,
          true,
          (key) => `translated_${key}`,
        ),
      );

      expect(connectHardware.callCount).toStrictEqual(1);
      expect(mockRequestDevice.callCount).toStrictEqual(1);
      expect(accounts).toStrictEqual([{ address: '0xLedgerAddress' }]);
      expect(store.getActions()).toStrictEqual(expectedActions);
    });

    it('throws a specific error when user denies WebHID permissions with loadHid=true', async () => {
      const store = mockStore({
        ...defaultState,
        metamask: {
          ...defaultState.metamask,
          ledgerTransportType: 'webhid',
        },
      });

      const mockRequestDevice = sinon.stub();
      mockRequestDevice.resolves([]);
      Object.defineProperty(window, 'navigator', {
        value: {
          ...window.navigator,
          hid: {
            requestDevice: mockRequestDevice,
          },
        },
        writable: true,
      });

      setBackgroundConnection(background);

      const expectedActions = [
        {
          type: 'SHOW_LOADING_INDICATION',
          payload: 'Looking for your Ledger...',
        },
        {
          type: 'DISPLAY_WARNING',
          payload: 'translated_ledgerWebHIDNotConnectedErrorMessage',
        },
        { type: 'HIDE_LOADING_INDICATION' },
      ];

      const mockTranslation = (key) => `translated_${key}`;

      await expect(
        store.dispatch(
          actions.connectHardware(
            HardwareDeviceNames.ledger,
            0,
            `m/44'/60'/0'/0`,
            true,
            mockTranslation,
          ),
        ),
      ).rejects.toThrow('translated_ledgerWebHIDNotConnectedErrorMessage');

      expect(mockRequestDevice.callCount).toStrictEqual(1);
      expect(store.getActions()).toStrictEqual(expectedActions);
    });

    it('handles loadHid=false and skips WebHID request process', async () => {
      const store = mockStore({
        ...defaultState,
        metamask: {
          ...defaultState.metamask,
          ledgerTransportType: 'webhid',
        },
      });

      const mockRequestDevice = sinon.spy();
      Object.defineProperty(window, 'navigator', {
        value: {
          ...window.navigator,
          hid: {
            requestDevice: mockRequestDevice,
          },
        },
        writable: true,
      });

      const connectHardware = background.connectHardware.resolves([
        { address: '0xLedgerAddress' },
      ]);

      setBackgroundConnection(background);

      const expectedActions = [
        {
          type: 'SHOW_LOADING_INDICATION',
          payload: 'Looking for your Ledger...',
        },
        { type: 'HIDE_LOADING_INDICATION' },
      ];

      const accounts = await store.dispatch(
        actions.connectHardware(
          HardwareDeviceNames.ledger,
          0,
          `m/44'/60'/0'/0`,
          false,
          (key) => `translated_${key}`,
        ),
      );

      expect(connectHardware.callCount).toStrictEqual(1);
      expect(mockRequestDevice.callCount).toStrictEqual(0);
      expect(accounts).toStrictEqual([{ address: '0xLedgerAddress' }]);
      expect(store.getActions()).toStrictEqual(expectedActions);
    });

    it('handles specific Ledger WebHID device open failure error', async () => {
      const store = mockStore({
        ...defaultState,
        metamask: {
          ...defaultState.metamask,
          ledgerTransportType: 'webhid',
        },
      });

      const mockHidDevice = { vendorId: 11415 };
      const mockRequestDevice = sinon.stub();
      mockRequestDevice.resolves([mockHidDevice]);
      Object.defineProperty(window, 'navigator', {
        value: {
          ...window.navigator,
          hid: {
            requestDevice: mockRequestDevice,
          },
        },
        writable: true,
      });

      const deviceOpenError = new Error('Failed to open the device');
      background.connectHardware.rejects(deviceOpenError);

      setBackgroundConnection(background);

      const expectedActions = [
        {
          type: 'SHOW_LOADING_INDICATION',
          payload: 'Looking for your Ledger...',
        },
        {
          type: 'DISPLAY_WARNING',
          payload: 'translated_ledgerDeviceOpenFailureMessage',
        },
        { type: 'HIDE_LOADING_INDICATION' },
      ];

      const mockTranslation = (key) => `translated_${key}`;

      await expect(
        store.dispatch(
          actions.connectHardware(
            HardwareDeviceNames.ledger,
            0,
            `m/44'/60'/0'/0`,
            true,
            mockTranslation,
          ),
        ),
      ).rejects.toThrow('translated_ledgerDeviceOpenFailureMessage');

      expect(mockRequestDevice.callCount).toStrictEqual(1);
      expect(store.getActions()).toStrictEqual(expectedActions);
    });

    it('handles non-Ledger hardware devices', async () => {
      const store = mockStore();

      const mockRequestDevice = sinon.spy();
      Object.defineProperty(window, 'navigator', {
        value: {
          ...window.navigator,
          hid: {
            requestDevice: mockRequestDevice,
          },
        },
        writable: true,
      });

      const connectHardware = background.connectHardware.resolves([
        { address: '0xTrezorAddress' },
      ]);

      setBackgroundConnection(background);

      const expectedActions = [
        {
          type: 'SHOW_LOADING_INDICATION',
          payload: 'Looking for your Trezor...',
        },
        { type: 'HIDE_LOADING_INDICATION' },
      ];

      const accounts = await store.dispatch(
        actions.connectHardware(
          HardwareDeviceNames.trezor,
          0,
          `m/44'/60'/0'/0`,
          true,
          (key) => `translated_${key}`,
        ),
      );

      expect(connectHardware.callCount).toStrictEqual(1);
      expect(mockRequestDevice.callCount).toStrictEqual(0);
      expect(accounts).toStrictEqual([{ address: '0xTrezorAddress' }]);
      expect(store.getActions()).toStrictEqual(expectedActions);
    });
  });

  describe('#unlockHardwareWalletAccount', () => {
    afterEach(() => {
      sinon.restore();
    });

    it('calls unlockHardwareWalletAccount in background', async () => {
      const store = mockStore();
      const unlockHardwareWalletAccount =
        background.unlockHardwareWalletAccount.resolves();

      setBackgroundConnection(background);

      await store.dispatch(
        actions.unlockHardwareWalletAccounts(
          [0],
          HardwareDeviceNames.ledger,
          `m/44'/60'/0'/0`,
          '',
        ),
      );
      expect(unlockHardwareWalletAccount.callCount).toStrictEqual(1);
    });

    it('shows loading indicator and displays error', async () => {
      const store = mockStore();

      background.unlockHardwareWalletAccount.rejects(new Error('error'));

      setBackgroundConnection(background);

      const expectedActions = [
        { type: 'SHOW_LOADING_INDICATION', payload: undefined },
        { type: 'DISPLAY_WARNING', payload: 'error' },
        { type: 'HIDE_LOADING_INDICATION' },
      ];

      await expect(
        store.dispatch(actions.unlockHardwareWalletAccounts([null])),
      ).rejects.toThrow('error');

      expect(store.getActions()).toStrictEqual(expectedActions);
    });
  });

  describe('#setCurrentCurrency', () => {
    afterEach(() => {
      sinon.restore();
    });

    it('calls setCurrentCurrency', async () => {
      const store = mockStore();
      background.setCurrentCurrency = sinon.stub().resolves();
      setBackgroundConnection(background);

      await store.dispatch(actions.setCurrentCurrency('jpy'));
      expect(background.setCurrentCurrency.callCount).toStrictEqual(1);
    });

    it('throws if setCurrentCurrency throws', async () => {
      const store = mockStore();
      background.setCurrentCurrency = sinon.stub().rejects(new Error('error'));
      setBackgroundConnection(background);

      const expectedActions = [
        { type: 'SHOW_LOADING_INDICATION', payload: undefined },
        { type: 'DISPLAY_WARNING', payload: 'error' },
        { type: 'HIDE_LOADING_INDICATION' },
      ];

      await store.dispatch(actions.setCurrentCurrency());
      expect(store.getActions()).toStrictEqual(expectedActions);
    });
  });

  describe('#updateTransaction', () => {
    const txParams = {
      from: '0x1',
      gas: GAS_LIMITS.SIMPLE,
      gasPrice: '0x3b9aca00',
      to: '0x2',
      value: '0x0',
    };

    const txData = {
      id: '1',
      status: TransactionStatus.unapproved,
      chainId: currentChainId,
      txParams,
    };

    afterEach(() => {
      sinon.restore();
    });

    it('updates transaction', async () => {
      const store = mockStore();

      const updateTransactionStub = sinon.stub().resolves();

      background.getApi.returns({
        updateTransaction: updateTransactionStub,
        getStatePatches: sinon.stub().resolves([]),
      });

      setBackgroundConnection(background.getApi());

      await store.dispatch(actions.updateTransaction(txData));

      const resultantActions = store.getActions();
      expect(updateTransactionStub.callCount).toStrictEqual(1);
      expect(resultantActions[1]).toStrictEqual({
        type: 'UPDATE_TRANSACTION_PARAMS',
        id: txData.id,
        value: txParams,
      });
    });

    it('rejects with error message', async () => {
      const store = mockStore();

      background.getApi.returns({
        updateTransaction: () => {
          throw new Error('error');
        },
        getStatePatches: sinon.stub().resolves([]),
      });

      setBackgroundConnection(background.getApi());

      const expectedActions = [
        { type: 'SHOW_LOADING_INDICATION', payload: undefined },
        {
          type: 'UPDATE_TRANSACTION_PARAMS',
          id: '1',
          value: {
            from: '0x1',
            gas: GAS_LIMITS.SIMPLE,
            gasPrice: '0x3b9aca00',
            to: '0x2',
            value: '0x0',
          },
        },
        { type: 'HIDE_LOADING_INDICATION' },
        { type: 'GO_HOME' },
      ];

      await expect(
        store.dispatch(actions.updateTransaction(txData)),
      ).rejects.toThrow('error');

      expect(store.getActions()).toStrictEqual(expectedActions);
    });
  });

  describe('#lockMetamask', () => {
    afterEach(() => {
      sinon.restore();
    });

    it('calls setLocked', async () => {
      const store = mockStore();

      const backgroundSetLocked = background.setLocked.resolves();

      setBackgroundConnection(background);

      await store.dispatch(actions.lockMetamask());
      expect(backgroundSetLocked.callCount).toStrictEqual(1);
    });

    it('returns display warning error with value when setLocked in background callback errors', async () => {
      const store = mockStore();

      background.setLocked.rejects(new Error('error'));

      setBackgroundConnection(background);

      const expectedActions = [
        { type: 'SHOW_LOADING_INDICATION', payload: undefined },
        { type: 'DISPLAY_WARNING', payload: 'error' },
        { type: 'HIDE_LOADING_INDICATION' },
        { type: 'LOCK_METAMASK' },
      ];

      await store.dispatch(actions.lockMetamask());

      expect(store.getActions()).toStrictEqual(expectedActions);
    });
  });

  describe('#setSelectedAccount', () => {
    afterEach(() => {
      sinon.restore();
    });

    it('#setSelectedAccount', async () => {
      const store = mockStore({
        activeTab: {},
        metamask: {
          alertEnabledness: {},
          internalAccounts: {
            accounts: {
              'mock-id': {
                address: '0x123',
                id: 'mock-id',
                metadata: {
                  name: 'Test Account',
                  keyring: {
                    type: 'HD Key Tree',
                  },
                },
                options: {},
                methods: [
                  'personal_sign',
                  'eth_signTransaction',
                  'eth_signTypedData_v1',
                  'eth_signTypedData_v3',
                  'eth_signTypedData_v4',
                ],
                scopes: ['eip155:0'],
                type: 'eip155:eoa',
              },
            },
            selectedAccount: 'mock-id',
          },
        },
      });

      const setSelectedInternalAccountSpy = sinon.stub().resolves();

      background.getApi.returns({
        setSelectedInternalAccount: setSelectedInternalAccountSpy,
      });

      setBackgroundConnection(background.getApi());

      await store.dispatch(actions.setSelectedAccount('0x123'));
      expect(setSelectedInternalAccountSpy.callCount).toStrictEqual(1);
      expect(setSelectedInternalAccountSpy.calledWith('mock-id')).toBe(true);
    });

    it('displays warning if setSelectedAccount throws', async () => {
      const store = mockStore({
        activeTab: {},
        metamask: {
          alertEnabledness: {},
          internalAccounts: {
            accounts: {
              'mock-id': {
                address: '0x123',
                id: 'mock-id',
                metadata: {
                  name: 'Test Account',
                  keyring: {
                    type: 'HD Key Tree',
                  },
                },
                options: {},
                methods: [
                  'personal_sign',
                  'eth_signTransaction',
                  'eth_signTypedData_v1',
                  'eth_signTypedData_v3',
                  'eth_signTypedData_v4',
                ],
                scopes: ['eip155:0'],
                type: 'eip155:eoa',
              },
            },
            selectedAccount: 'mock-id',
          },
        },
      });

      const setSelectedInternalAccountSpy = sinon
        .stub()
        .rejects(new Error('error'));

      background.getApi.returns({
        setSelectedInternalAccount: setSelectedInternalAccountSpy,
      });

      setBackgroundConnection(background.getApi());

      const expectedActions = [
        { type: 'SHOW_LOADING_INDICATION', payload: undefined },
        { type: 'DISPLAY_WARNING', payload: 'error' },
        { type: 'HIDE_LOADING_INDICATION' },
      ];

      await store.dispatch(actions.setSelectedAccount('0x123'));
      expect(store.getActions()).toStrictEqual(expectedActions);
    });
  });

  describe('#setSelectedMultichainAccount', () => {
    afterEach(() => {
      sinon.restore();
    });

    it('#setSelectedMultichainAccount', async () => {
      const store = mockStore({
        activeTab: {},
        metamask: {
          accountTree: {},
        },
      });

      const setSelectedMultichainAccountSpy = sinon.stub().resolves();

      background.getApi.returns({
        setSelectedMultichainAccount: setSelectedMultichainAccountSpy,
      });

      setBackgroundConnection(background.getApi());

      await store.dispatch(
        actions.setSelectedMultichainAccount(
          'entropy:01JKAF3DSGM3AB87EM9N0K41AJ/default',
        ),
      );
      expect(setSelectedMultichainAccountSpy.callCount).toStrictEqual(1);
      expect(
        setSelectedMultichainAccountSpy.calledWith(
          'entropy:01JKAF3DSGM3AB87EM9N0K41AJ/default',
        ),
      ).toBe(true);
    });
  });

  describe('#addToken', () => {
    afterEach(() => {
      sinon.restore();
    });

    it('calls addToken in background', async () => {
      const store = mockStore();

      const addTokenStub = sinon.stub().resolves();

      background.getApi.returns({
        addToken: addTokenStub,
        getStatePatches: sinon.stub().resolves([]),
      });

      setBackgroundConnection(background.getApi());

      await store.dispatch(
        actions.addToken({
          address: '0x514910771af9ca656af840dff83e8264ecf986ca',
          symbol: 'LINK',
          decimals: 18,
          networkClientId: 'networkClientId1',
        }),
      );
      expect(addTokenStub.callCount).toStrictEqual(1);
    });

    it('expected actions', async () => {
      const store = mockStore();

      const tokenDetails = {
        address: 'tokenAddress',
        symbol: 'token',
        decimal: 18,
      };

      const addTokenStub = sinon.stub().resolves(tokenDetails);

      background.getApi.returns({
        addToken: addTokenStub,
        getStatePatches: sinon.stub().resolves([]),
      });

      setBackgroundConnection(background.getApi());

      const expectedActions = [
        { type: 'SHOW_LOADING_INDICATION', payload: undefined },
        { type: 'HIDE_LOADING_INDICATION' },
      ];

      await store.dispatch(
        actions.addToken({
          address: '0x514910771af9ca656af840dff83e8264ecf986ca',
          symbol: 'LINK',
          decimals: 18,
          networkClientId: 'networkClientId1',
        }),
      );

      expect(store.getActions()).toStrictEqual(expectedActions);
    });
  });

  describe('#ignoreTokens', () => {
    afterEach(() => {
      sinon.restore();
    });

    it('calls ignoreTokens in background', async () => {
      const store = mockStore();

      const ignoreTokensStub = sinon.stub().resolves();

      background.getApi.returns({
        ignoreTokens: ignoreTokensStub,
        getStatePatches: sinon.stub().resolves([]),
      });

      setBackgroundConnection(background.getApi());

      await store.dispatch(
        actions.ignoreTokens({ tokensToIgnore: '0x0000001' }),
      );
      expect(ignoreTokensStub.callCount).toStrictEqual(1);
    });

    it('should display warning when ignoreTokens in background fails', async () => {
      const store = mockStore();

      background.getApi.returns({
        ignoreTokens: sinon.stub().rejects(new Error('error')),
        getStatePatches: sinon.stub().resolves([]),
      });

      setBackgroundConnection(background.getApi());

      const expectedActions = [
        { type: 'SHOW_LOADING_INDICATION', payload: undefined },
        { type: 'DISPLAY_WARNING', payload: 'error' },
        { type: 'HIDE_LOADING_INDICATION' },
      ];

      await store.dispatch(
        actions.ignoreTokens({ tokensToIgnore: '0x0000001' }),
      );

      expect(store.getActions()).toStrictEqual(expectedActions);
    });
  });

  describe('#setActiveNetwork', () => {
    afterEach(() => {
      sinon.restore();
    });

    it('calls setActiveNetwork in the background with the correct arguments', async () => {
      const store = mockStore();

      const setCurrentNetworkStub = sinon.stub().resolves();

      background.getApi.returns({
        setActiveNetwork: setCurrentNetworkStub,
      });
      setBackgroundConnection(background.getApi());

      await store.dispatch(actions.setActiveNetwork('networkConfigurationId'));
      expect(
        setCurrentNetworkStub.calledOnceWith('networkConfigurationId'),
      ).toBe(true);
    });

    it('displays warning when setActiveNetwork throws', async () => {
      const store = mockStore();

      const setCurrentNetworkStub = sinon.stub().rejects(new Error('error'));

      background.getApi.returns({
        setActiveNetwork: setCurrentNetworkStub,
      });
      setBackgroundConnection(background.getApi());

      const expectedActions = [
        {
          type: 'DISPLAY_WARNING',
          payload: 'Had a problem changing networks!',
        },
      ];

      await store.dispatch(actions.setActiveNetwork());
      expect(store.getActions()).toStrictEqual(expectedActions);
    });
  });

  describe('updateNetwork', () => {
    afterEach(() => {
      sinon.restore();
    });

    it('calls updateNetwork in the background with the correct arguments', async () => {
      const store = mockStore();

      const updateNetworkStub = sinon.stub().resolves();

      background.getApi.returns({
        updateNetwork: updateNetworkStub,
      });
      setBackgroundConnection(background.getApi());

      const networkConfiguration = {
        rpcUrl: 'newRpc',
        chainId: '0x',
        nativeCurrency: 'ETH',
        name: 'nickname',
        rpcEndpoints: [{ blockExplorerUrl: 'etherscan.io' }],
      };

      await store.dispatch(
        actions.updateNetwork(networkConfiguration, {
          source: MetaMetricsNetworkEventSource.CustomNetworkForm,
        }),
      );

      expect(
        updateNetworkStub.calledOnceWith(
          '0x',
          {
            rpcUrl: 'newRpc',
            chainId: '0x',
            nativeCurrency: 'ETH',
            name: 'nickname',
            rpcEndpoints: [{ blockExplorerUrl: 'etherscan.io' }],
          },
          { source: MetaMetricsNetworkEventSource.CustomNetworkForm },
        ),
      ).toBe(true);
    });

    it('updateNetwork has empty object for default options', async () => {
      const store = mockStore();

      const updateNetworkStub = sinon.stub().resolves();

      background.getApi.returns({
        updateNetwork: updateNetworkStub,
      });
      setBackgroundConnection(background.getApi());

      const networkConfiguration = {
        id: 'networkConfigurationId',
        rpcUrl: 'newRpc',
        chainId: '0x',
        ticker: 'ETH',
        nickname: 'nickname',
        rpcPrefs: { blockExplorerUrl: 'etherscan.io' },
      };

      await store.dispatch(
        actions.updateNetwork(networkConfiguration, undefined),
      );

      expect(
        updateNetworkStub.calledOnceWith(
          '0x',
          {
            id: 'networkConfigurationId',
            rpcUrl: 'newRpc',
            chainId: '0x',
            ticker: 'ETH',
            nickname: 'nickname',
            rpcPrefs: { blockExplorerUrl: 'etherscan.io' },
          },
          {},
        ),
      ).toBe(true);
    });
  });

  describe('#requestUserApproval', () => {
    afterEach(() => {
      sinon.restore();
    });

    it('calls requestUserApproval in the background with the correct arguments', async () => {
      const store = mockStore();

      const requestUserApprovalStub = sinon.stub().resolves();

      background.getApi.returns({
        requestUserApproval: requestUserApprovalStub,
      });
      setBackgroundConnection(background.getApi());

      const networkConfiguration = {
        rpcUrl: 'newRpc',
        chainId: '0x',
        ticker: 'ETH',
        nickname: 'nickname',
        rpcPrefs: { blockExplorerUrl: 'etherscan.io' },
      };

      await store.dispatch(
        actions.requestUserApproval({
          origin: ORIGIN_METAMASK,
          type: 'test',
          requestData: networkConfiguration,
        }),
      );

      expect(
        requestUserApprovalStub.calledOnceWith({
          origin: ORIGIN_METAMASK,
          type: 'test',
          requestData: networkConfiguration,
        }),
      ).toBe(true);
    });
  });

  describe('removeNetwork', () => {
    afterEach(() => {
      sinon.restore();
    });

    it('calls removeNetwork in the background with the correct arguments', async () => {
      const store = mockStore();

      const removeNetworkStub = sinon.stub().resolves();

      background.getApi.returns({
        removeNetwork: removeNetworkStub,
      });
      setBackgroundConnection(background.getApi());

      await store.dispatch(actions.removeNetwork('testNetworkConfigurationId'));

      expect(
        removeNetworkStub.calledOnceWith('testNetworkConfigurationId'),
      ).toBe(true);
    });
  });

  describe('#setSelectedNetworkConfigurationId', () => {
    it('sets appState.networkConfigurationId to provided value', async () => {
      const store = mockStore();

      const networkConfigurationId = 'testNetworkConfigurationId';

      store.dispatch(
        actions.setSelectedNetworkConfigurationId(networkConfigurationId),
      );

      const resultantActions = store.getActions();

      expect(resultantActions[0]).toStrictEqual({
        type: 'SET_SELECTED_NETWORK_CONFIGURATION_ID',
        payload: networkConfigurationId,
      });
    });
  });

  describe('#setNewNetworkAdded', () => {
    it('sets appState.setNewNetworkAdded to provided value', async () => {
      const store = mockStore();

      const newNetworkAddedDetails = {
        networkConfigurationId: 'testNetworkConfigurationId',
        nickname: 'test-chain',
      };

      store.dispatch(actions.setNewNetworkAdded(newNetworkAddedDetails));

      const resultantActions = store.getActions();

      expect(resultantActions[0]).toStrictEqual({
        type: 'SET_NEW_NETWORK_ADDED',
        payload: newNetworkAddedDetails,
      });
    });
  });

  describe('#setEditedNetwork', () => {
    it('sets appState.setEditedNetwork to provided value', async () => {
      const store = mockStore();

      const newNetworkAddedDetails = {
        nickname: 'test-chain',
        networkConfigurationId: 'testNetworkConfigurationId',
        editCompleted: true,
      };

      store.dispatch(actions.setEditedNetwork(newNetworkAddedDetails));

      const resultantActions = store.getActions();

      expect(resultantActions[0]).toStrictEqual({
        type: 'SET_EDIT_NETWORK',
        payload: newNetworkAddedDetails,
      });
    });
  });

  describe('#addToAddressBook', () => {
    it('calls setAddressBook', async () => {
      const store = mockStore();

      const setAddressBookStub = sinon.stub().resolves();

      background.getApi.returns({
        setAddressBook: setAddressBookStub,
        getStatePatches: sinon.stub().resolves([]),
      });

      setBackgroundConnection(background.getApi());

      await store.dispatch(actions.addToAddressBook('0x0000'));
      expect(setAddressBookStub.callCount).toStrictEqual(1);
      sinon.restore();
    });
  });

  describe('#exportAccount', () => {
    afterEach(() => {
      sinon.restore();
    });

    it('returns expected actions for successful action', async () => {
      const store = mockStore();

      const testPrivKey = 'a-test-priv-key';

      const verifyPasswordStub = sinon.stub().resolves();

      const exportAccountStub = sinon.stub().resolves(testPrivKey);

      background.getApi.returns({
        verifyPassword: verifyPasswordStub,
        exportAccount: exportAccountStub,
      });

      setBackgroundConnection(background.getApi());

      const expectedActions = [
        { type: 'SHOW_LOADING_INDICATION', payload: undefined },
        { type: 'HIDE_LOADING_INDICATION' },
      ];

      await store.dispatch(
        actions.exportAccount(
          'a-test-password',
          '0xAddress',
          jest.fn(),
          jest.fn(),
        ),
      );

      expect(verifyPasswordStub.callCount).toStrictEqual(1);
      expect(exportAccountStub.callCount).toStrictEqual(1);
      expect(store.getActions()).toStrictEqual(expectedActions);
    });

    it('returns action errors when first func callback errors', async () => {
      const store = mockStore();

      const verifyPasswordStub = sinon.stub().rejects(new Error('error'));

      background.getApi.returns({
        verifyPassword: verifyPasswordStub,
      });

      setBackgroundConnection(background.getApi());

      const expectedActions = [
        { type: 'SHOW_LOADING_INDICATION', payload: undefined },
        { type: 'HIDE_LOADING_INDICATION' },
        { type: 'DISPLAY_WARNING', payload: 'Incorrect Password.' },
      ];

      await expect(
        store.dispatch(actions.exportAccount('a-test-password', '0xAddress')),
      ).rejects.toThrow('error');

      expect(store.getActions()).toStrictEqual(expectedActions);
    });

    it('returns action errors when second func callback errors', async () => {
      const store = mockStore();

      const verifyPasswordStub = sinon.stub().resolves();

      const exportAccountStub = sinon.stub().rejects(new Error('error'));

      background.getApi.returns({
        verifyPassword: verifyPasswordStub,
        exportAccount: exportAccountStub,
      });

      setBackgroundConnection(background.getApi());

      const expectedActions = [
        { type: 'SHOW_LOADING_INDICATION', payload: undefined },
        { type: 'HIDE_LOADING_INDICATION' },
        {
          type: 'DISPLAY_WARNING',
          payload: 'Had a problem exporting the account.',
        },
      ];

      await expect(
        store.dispatch(actions.exportAccount('a-test-password', '0xAddress')),
      ).rejects.toThrow('error');

      expect(store.getActions()).toStrictEqual(expectedActions);
    });
  });

  describe('#setAccountLabel', () => {
    afterEach(() => {
      sinon.restore();
    });

    it('calls setAccountLabel', async () => {
      const store = mockStore();

      const setAccountLabelStub = sinon.stub().resolves();

      background.getApi.returns({
        setAccountLabel: setAccountLabelStub,
      });

      setBackgroundConnection(background.getApi());

      await store.dispatch(
        actions.setAccountLabel(
          '0x0dcd5d886577d5081b0c52e242ef29e70be3e7bc',
          'test',
        ),
      );
      expect(setAccountLabelStub.callCount).toStrictEqual(1);
    });

    it('returns action errors when func callback errors', async () => {
      const store = mockStore();

      background.getApi.returns({
        setAccountLabel: sinon.stub().rejects(new Error('error')),
      });

      setBackgroundConnection(background.getApi());

      const expectedActions = [
        { type: 'SHOW_LOADING_INDICATION', payload: undefined },
        { type: 'HIDE_LOADING_INDICATION' },
        { type: 'DISPLAY_WARNING', payload: 'error' },
      ];

      await expect(
        store.dispatch(
          actions.setAccountLabel(
            '0x0dcd5d886577d5081b0c52e242ef29e70be3e7bc',
            'test',
          ),
        ),
      ).rejects.toThrow('error');

      expect(store.getActions()).toStrictEqual(expectedActions);
    });
  });

  describe('#setFeatureFlag', () => {
    afterEach(() => {
      sinon.restore();
    });

    it('calls setFeatureFlag in the background', async () => {
      const store = mockStore();

      const setFeatureFlagStub = sinon.stub().resolves();

      background.getApi.returns({
        setFeatureFlag: setFeatureFlagStub,
      });

      setBackgroundConnection(background.getApi());

      await store.dispatch(actions.setFeatureFlag());
      expect(setFeatureFlagStub.callCount).toStrictEqual(1);
    });

    it('errors when setFeatureFlag in background throws', async () => {
      const store = mockStore();

      background.getApi.returns({
        setFeatureFlag: sinon.stub().rejects(new Error('error')),
      });

      setBackgroundConnection(background.getApi());

      const expectedActions = [
        { type: 'SHOW_LOADING_INDICATION', payload: undefined },
        { type: 'HIDE_LOADING_INDICATION' },
        { type: 'DISPLAY_WARNING', payload: 'error' },
      ];

      await expect(store.dispatch(actions.setFeatureFlag())).rejects.toThrow(
        'error',
      );

      expect(store.getActions()).toStrictEqual(expectedActions);
    });
  });

  describe('#setCompletedOnboarding', () => {
    afterEach(() => {
      sinon.restore();
    });

    it('completes onboarding', async () => {
      const store = mockStore();
      const completeOnboardingStub = sinon.stub().resolves();

      background.getApi.returns({
        completeOnboarding: completeOnboardingStub,
      });

      setBackgroundConnection(background.getApi());

      await store.dispatch(actions.setCompletedOnboarding());
      expect(completeOnboardingStub.callCount).toStrictEqual(1);
    });

    it('errors when setCompletedOnboarding in background throws', async () => {
      const store = mockStore();

      background.getApi.returns({
        completeOnboarding: sinon.stub().rejects(new Error('error')),
      });

      setBackgroundConnection(background.getApi());

      const expectedActions = [
        { type: 'SHOW_LOADING_INDICATION', payload: undefined },
        { type: 'DISPLAY_WARNING', payload: 'error' },
        { type: 'HIDE_LOADING_INDICATION' },
      ];

      await expect(
        store.dispatch(actions.setCompletedOnboarding()),
      ).rejects.toThrow('error');

      expect(store.getActions()).toStrictEqual(expectedActions);
    });
  });

  describe('#setServiceWorkerKeepAlivePreference', () => {
    afterEach(() => {
      sinon.restore();
    });

    it('sends a value to background', async () => {
      const store = mockStore();
      const setServiceWorkerKeepAlivePreferenceStub = sinon.stub().resolves();

      setBackgroundConnection({
        setServiceWorkerKeepAlivePreference:
          setServiceWorkerKeepAlivePreferenceStub,
      });

      await store.dispatch(actions.setServiceWorkerKeepAlivePreference(true));
      expect(setServiceWorkerKeepAlivePreferenceStub.callCount).toStrictEqual(
        1,
      );
      expect(setServiceWorkerKeepAlivePreferenceStub.calledWith(true)).toBe(
        true,
      );
    });

    it('errors when setServiceWorkerKeepAlivePreference in background throws', async () => {
      const store = mockStore();
      const setServiceWorkerKeepAlivePreferenceStub = sinon
        .stub()
        .rejects(new Error('error'));

      setBackgroundConnection({
        setServiceWorkerKeepAlivePreference:
          setServiceWorkerKeepAlivePreferenceStub,
      });

      const expectedActions = [
        { type: 'SHOW_LOADING_INDICATION', payload: undefined },
        { type: 'DISPLAY_WARNING', payload: 'error' },
        { type: 'HIDE_LOADING_INDICATION' },
      ];

      await store.dispatch(actions.setServiceWorkerKeepAlivePreference(false));
      expect(store.getActions()).toStrictEqual(expectedActions);
    });
  });

  describe('#setParticipateInMetaMetrics', () => {
    it('sets participateInMetaMetrics to true', async () => {
      const store = mockStore();
      const setParticipateInMetaMetricsStub = jest.fn().mockResolvedValue();

      background.getApi.returns({
        setParticipateInMetaMetrics: setParticipateInMetaMetricsStub,
      });

      setBackgroundConnection(background.getApi());

      await store.dispatch(actions.setParticipateInMetaMetrics(true));
      expect(setParticipateInMetaMetricsStub).toHaveBeenCalledWith(true);
    });
  });

  describe('#setUseBlockie', () => {
    afterEach(() => {
      sinon.restore();
    });

    it('calls setUseBlockie in background', async () => {
      const store = mockStore();
      const setUseBlockieStub = sinon.stub().resolves();
      setBackgroundConnection({ setUseBlockie: setUseBlockieStub });

      await store.dispatch(actions.setUseBlockie());
      expect(setUseBlockieStub.callCount).toStrictEqual(1);
    });

    it('errors when setUseBlockie in background throws', async () => {
      const store = mockStore();
      const setUseBlockieStub = sinon.stub().rejects(new Error('error'));

      setBackgroundConnection({ setUseBlockie: setUseBlockieStub });

      const expectedActions = [
        { type: 'SHOW_LOADING_INDICATION', payload: undefined },
        { type: 'HIDE_LOADING_INDICATION' },
        { type: 'DISPLAY_WARNING', payload: 'error' },
      ];

      await store.dispatch(actions.setUseBlockie());
      expect(store.getActions()).toStrictEqual(expectedActions);
    });
  });

  describe('#setUsePhishDetect', () => {
    afterEach(() => {
      sinon.restore();
    });

    it('calls setUsePhishDetect in background', () => {
      const store = mockStore();
      const setUsePhishDetectStub = sinon.stub().resolves();
      setBackgroundConnection({
        setUsePhishDetect: setUsePhishDetectStub,
      });

      store.dispatch(actions.setUsePhishDetect());
      expect(setUsePhishDetectStub.callCount).toStrictEqual(1);
    });

    it('errors when setUsePhishDetect in background throws', async () => {
      const store = mockStore();
      const setUsePhishDetectStub = sinon.stub().rejects(new Error('error'));

      setBackgroundConnection({
        setUsePhishDetect: setUsePhishDetectStub,
      });

      const expectedActions = [
        { type: 'SHOW_LOADING_INDICATION', payload: undefined },
        { type: 'HIDE_LOADING_INDICATION' },
        { type: 'DISPLAY_WARNING', payload: 'error' },
      ];

      await store.dispatch(actions.setUsePhishDetect());
      expect(store.getActions()).toStrictEqual(expectedActions);
    });
  });

  describe('#setUseMultiAccountBalanceChecker', () => {
    afterEach(() => {
      sinon.restore();
    });

    it('calls setUseMultiAccountBalanceChecker in background', () => {
      const store = mockStore();
      const setUseMultiAccountBalanceCheckerStub = sinon.stub().resolves();
      setBackgroundConnection({
        setUseMultiAccountBalanceChecker: setUseMultiAccountBalanceCheckerStub,
      });

      store.dispatch(actions.setUseMultiAccountBalanceChecker());
      expect(setUseMultiAccountBalanceCheckerStub.callCount).toStrictEqual(1);
    });

    it('errors when setUseMultiAccountBalanceChecker in background throws', async () => {
      const store = mockStore();
      const setUseMultiAccountBalanceCheckerStub = sinon
        .stub()
        .rejects(new Error('error'));

      setBackgroundConnection({
        setUseMultiAccountBalanceChecker: setUseMultiAccountBalanceCheckerStub,
      });

      const expectedActions = [
        { type: 'SHOW_LOADING_INDICATION', payload: undefined },
        { type: 'HIDE_LOADING_INDICATION' },
        { type: 'DISPLAY_WARNING', payload: 'error' },
      ];

      await store.dispatch(actions.setUseMultiAccountBalanceChecker());
      expect(store.getActions()).toStrictEqual(expectedActions);
    });
  });

  describe('#setUse4ByteResolution', () => {
    afterEach(() => {
      sinon.restore();
    });

    it('calls setUse4ByteResolution in background', async () => {
      const store = mockStore();
      const setUse4ByteResolutionStub = sinon.stub().resolves();
      setBackgroundConnection({
        setUse4ByteResolution: setUse4ByteResolutionStub,
      });

      await store.dispatch(actions.setUse4ByteResolution());
      expect(setUse4ByteResolutionStub.callCount).toStrictEqual(1);
    });

    it('errors when setUse4ByteResolution in background throws', async () => {
      const store = mockStore();
      const setUse4ByteResolutionStub = sinon
        .stub()
        .rejects(new Error('error'));

      setBackgroundConnection({
        setUse4ByteResolution: setUse4ByteResolutionStub,
      });

      const expectedActions = [
        { type: 'SHOW_LOADING_INDICATION', payload: undefined },
        { type: 'DISPLAY_WARNING', payload: 'error' },
        { type: 'HIDE_LOADING_INDICATION' },
      ];

      await store.dispatch(actions.setUse4ByteResolution());
      expect(store.getActions()).toStrictEqual(expectedActions);
    });
  });

  describe('#setUseSafeChainsListValidation', () => {
    afterEach(() => {
      sinon.restore();
    });

    it('calls setUseSafeChainsListValidation in background', () => {
      const store = mockStore();
      const setUseSafeChainsListValidationStub = sinon.stub().resolves();
      setBackgroundConnection({
        setUseSafeChainsListValidation: setUseSafeChainsListValidationStub,
      });

      store.dispatch(actions.setUseSafeChainsListValidation());
      expect(setUseSafeChainsListValidationStub.callCount).toStrictEqual(1);
    });

    it('errors when setUseSafeChainsListValidation in background throws', async () => {
      const store = mockStore();
      const setUseSafeChainsListValidationStub = sinon
        .stub()
        .rejects(new Error('error'));

      setBackgroundConnection({
        setUseSafeChainsListValidation: setUseSafeChainsListValidationStub,
      });

      const expectedActions = [
        { type: 'SHOW_LOADING_INDICATION', payload: undefined },
        { type: 'HIDE_LOADING_INDICATION' },
        { type: 'DISPLAY_WARNING', payload: 'error' },
      ];

      await store.dispatch(actions.setUseSafeChainsListValidation());
      expect(store.getActions()).toStrictEqual(expectedActions);
    });
  });

  describe('#updateCurrentLocale', () => {
    beforeEach(() => {
      sinon.stub(window, 'fetch').resolves({
        json: async () => enLocale,
      });
    });

    afterEach(() => {
      sinon.restore();
    });

    it('calls expected actions', async () => {
      const store = mockStore();
      const setCurrentLocaleStub = sinon.stub().resolves();
      setBackgroundConnection({
        setCurrentLocale: setCurrentLocaleStub,
      });

      const expectedActions = [
        { type: 'SHOW_LOADING_INDICATION', payload: undefined },
        {
          type: 'SET_CURRENT_LOCALE',
          payload: { locale: 'test', messages: enLocale },
        },
        { type: 'HIDE_LOADING_INDICATION' },
      ];

      await store.dispatch(actions.updateCurrentLocale('test'));
      expect(setCurrentLocaleStub.callCount).toStrictEqual(1);
      expect(store.getActions()).toStrictEqual(expectedActions);
    });

    it('errors when setCurrentLocale throws', async () => {
      const store = mockStore();
      const setCurrentLocaleStub = sinon.stub().rejects(new Error('error'));
      setBackgroundConnection({
        setCurrentLocale: setCurrentLocaleStub,
      });

      const expectedActions = [
        { type: 'SHOW_LOADING_INDICATION', payload: undefined },
        { type: 'DISPLAY_WARNING', payload: 'error' },
        { type: 'HIDE_LOADING_INDICATION' },
      ];

      await store.dispatch(actions.updateCurrentLocale('test'));

      expect(store.getActions()).toStrictEqual(expectedActions);
    });
  });

  describe('#markPasswordForgotten', () => {
    afterEach(() => {
      sinon.restore();
    });

    it('calls markPasswordForgotten', async () => {
      const store = mockStore();

      background.markPasswordForgotten.resolves();

      setBackgroundConnection(background);

      await store.dispatch(actions.markPasswordForgotten());

      expect(background.markPasswordForgotten.callCount).toStrictEqual(1);
    });

    it('errors when markPasswordForgotten throws', async () => {
      const store = mockStore();

      background.markPasswordForgotten.rejects(new Error('error'));

      setBackgroundConnection(background);

      const expectedActions = [{ type: 'HIDE_LOADING_INDICATION' }];

      await expect(
        store.dispatch(actions.markPasswordForgotten('test')),
      ).rejects.toThrow('error');

      expect(store.getActions()).toStrictEqual(expectedActions);
    });
  });

  describe('#unMarkPasswordForgotten', () => {
    it('calls unMarkPasswordForgotten', async () => {
      const store = mockStore();

      background.unMarkPasswordForgotten.resolves();

      setBackgroundConnection(background);

      await store.dispatch(actions.unMarkPasswordForgotten());

      expect(background.unMarkPasswordForgotten.callCount).toStrictEqual(1);
    });
  });

  describe('#displayWarning', () => {
    it('sets appState.warning to provided value', async () => {
      const store = mockStore();

      const warningText = 'This is a sample warning message';

      store.dispatch(actions.displayWarning(warningText));

      const resultantActions = store.getActions();

      expect(resultantActions[0]).toStrictEqual({
        type: 'DISPLAY_WARNING',
        payload: warningText,
      });
    });
  });

  describe('#cancelTx', () => {
    it('creates COMPLETED_TX with the cancelled transaction ID', async () => {
      const store = mockStore();

      background.getApi.returns({
        rejectPendingApproval: sinon.stub().resolves(),
        getStatePatches: sinon.stub().resolves([]),
      });

      setBackgroundConnection(background.getApi());

      const txId = 1457634084250832;

      await store.dispatch(actions.cancelTx({ id: txId }));
      const resultantActions = store.getActions();
      const expectedAction = resultantActions.find(
        (action) => action.type === 'COMPLETED_TX',
      );

      expect(expectedAction.value.id).toStrictEqual(txId);
    });
  });

  describe('abortTransactionSigning', () => {
    it('submits request to background', async () => {
      const transactionIdMock = '123-456';
      const store = mockStore();

      setBackgroundConnection(background);

      store.dispatch(actions.abortTransactionSigning(transactionIdMock));

      expect(background.abortTransactionSigning.callCount).toStrictEqual(1);
      expect(background.abortTransactionSigning.getCall(0).args).toStrictEqual([
        transactionIdMock,
      ]);
    });
  });

  describe('#createCancelTransaction', () => {
    it('shows TRANSACTION_ALREADY_CONFIRMED modal if createCancelTransaction throws with an error', async () => {
      const store = mockStore();

      const createCancelTransactionStub = sinon
        .stub()
        .rejects(new Error('Previous transaction is already confirmed'));
      setBackgroundConnection({
        createCancelTransaction: createCancelTransactionStub,
      });

      const txId = '123-456';

      try {
        await store.dispatch(actions.createCancelTransaction(txId));
      } catch (error) {
        /* eslint-disable-next-line jest/no-conditional-expect */
        expect(error.message).toBe('Previous transaction is already confirmed');
      }

      const resultantActions = store.getActions();
      const expectedAction = resultantActions.find(
        (action) => action.type === actionConstants.MODAL_OPEN,
      );

      expect(expectedAction.payload.name).toBe('TRANSACTION_ALREADY_CONFIRMED');
      expect(expectedAction.payload.originalTransactionId).toBe(txId);
    });
  });

  describe('#removeAndIgnoreNft', () => {
    afterEach(() => {
      sinon.restore();
    });

    it('should throw when no address found', async () => {
      const store = mockStore();

      await expect(
        store.dispatch(actions.removeAndIgnoreNft(undefined, '55', 'mainnet')),
      ).rejects.toThrow('MetaMask - Cannot ignore NFT without address');
    });

    it('should throw when no tokenId found', async () => {
      const store = mockStore();

      await expect(
        store.dispatch(
          actions.removeAndIgnoreNft('Oxtest', undefined, 'mainnet'),
        ),
      ).rejects.toThrow('MetaMask - Cannot ignore NFT without tokenID');
    });

    it('should throw when removeAndIgnoreNft throws an error', async () => {
      const store = mockStore();
      const error = new Error('remove nft fake error');
      background.removeAndIgnoreNft = sinon.stub().throws(error);

      setBackgroundConnection(background);

      await expect(
        store.dispatch(actions.removeAndIgnoreNft('Oxtest', '6', 'mainnet')),
      ).rejects.toThrow(error);
    });
  });

  describe('#performSignIn', () => {
    afterEach(() => {
      sinon.restore();
    });

    it('calls performSignIn in the background', async () => {
      const store = mockStore();

      const performSignInStub = sinon.stub().resolves();

      background.getApi.returns({
        performSignIn: performSignInStub,
      });
      setBackgroundConnection(background.getApi());

      await store.dispatch(actions.performSignIn());
      expect(performSignInStub.calledOnceWith()).toBe(true);
    });
  });

  describe('#performSignOut', () => {
    afterEach(() => {
      sinon.restore();
    });

    it('calls performSignOut in the background', async () => {
      const store = mockStore();

      const performSignOutStub = sinon.stub().resolves();

      background.getApi.returns({
        performSignOut: performSignOutStub,
      });
      setBackgroundConnection(background.getApi());

      await store.dispatch(actions.performSignOut());
      expect(performSignOutStub.calledOnceWith()).toBe(true);
    });
  });

  describe('#setIsBackupAndSyncFeatureEnabled', () => {
    afterEach(() => {
      sinon.restore();
    });

    it('calls setIsBackupAndSyncFeatureEnabled in the background', async () => {
      const store = mockStore();

      const setIsBackupAndSyncFeatureEnabledStub = sinon.stub().resolves();

      background.getApi.returns({
        setIsBackupAndSyncFeatureEnabled: setIsBackupAndSyncFeatureEnabledStub,
      });
      setBackgroundConnection(background.getApi());

      await store.dispatch(
        actions.setIsBackupAndSyncFeatureEnabled(
          BACKUPANDSYNC_FEATURES.main,
          true,
        ),
      );
      expect(
        setIsBackupAndSyncFeatureEnabledStub.calledOnceWith(
          BACKUPANDSYNC_FEATURES.main,
          true,
        ),
      ).toBe(true);
    });
  });

  describe('#getUserProfileLineage', () => {
    it('calls getUserProfileLineage in the background', async () => {
      const getUserProfileLineageStub = sinon.stub().resolves();

      background.getApi.returns({
        getUserProfileLineage: getUserProfileLineageStub,
      });
      setBackgroundConnection(background.getApi());

      await actions.getUserProfileLineage();
      expect(getUserProfileLineageStub.calledOnceWith()).toBe(true);
    });
  });

  describe('#createOnChainTriggers', () => {
    afterEach(() => {
      sinon.restore();
    });

    it('calls createOnChainTriggers in the background', async () => {
      const store = mockStore();

      const createOnChainTriggersStub = sinon.stub().resolves();

      background.getApi.returns({
        createOnChainTriggers: createOnChainTriggersStub,
      });
      setBackgroundConnection(background.getApi());

      await store.dispatch(actions.createOnChainTriggers());
      expect(createOnChainTriggersStub.calledOnceWith()).toBe(true);
    });

    it('handles errors when createOnChainTriggers fails', async () => {
      const store = mockStore();
      const error = new Error('Failed to create on-chain triggers');

      const createOnChainTriggersStub = sinon.stub().rejects(error);

      background.getApi.returns({
        createOnChainTriggers: createOnChainTriggersStub,
      });
      setBackgroundConnection(background.getApi());

      await expect(
        store.dispatch(actions.createOnChainTriggers()),
      ).rejects.toThrow(error);

      const expectedAnswer = [];

      expect(store.getActions()).toStrictEqual(
        expect.arrayContaining(expectedAnswer),
      );
    });
  });

  describe('#disableAccounts', () => {
    afterEach(() => {
      sinon.restore();
    });

    it('calls disableAccounts in the background', async () => {
      const store = mockStore();
      const accounts = ['0x123', '0x456'];

      const disableAccountsStub = sinon.stub().resolves();

      background.getApi.returns({
        disableAccounts: disableAccountsStub,
      });
      setBackgroundConnection(background.getApi());

      await store.dispatch(actions.disableAccounts(accounts));
      expect(disableAccountsStub.calledOnceWith(accounts)).toBe(true);
    });

    it('handles errors when disableAccounts fails', async () => {
      const store = mockStore();
      const accounts = ['0x123', '0x456'];
      const error = new Error('Failed to delete on-chain triggers');

      const disableAccountsStub = sinon.stub().rejects(error);

      background.getApi.returns({
        disableAccounts: disableAccountsStub,
      });
      setBackgroundConnection(background.getApi());

      await expect(
        store.dispatch(actions.disableAccounts(accounts)),
      ).rejects.toThrow(error);
    });
  });

  describe('#enableAccounts', () => {
    afterEach(() => {
      sinon.restore();
    });

    it('calls enableAccounts in the background with correct parameters', async () => {
      const store = mockStore();
      const accountIds = ['0x789', '0xabc'];

      const enableAccountsStub = sinon.stub().resolves();

      background.getApi.returns({
        enableAccounts: enableAccountsStub,
      });
      setBackgroundConnection(background.getApi());

      await store.dispatch(actions.enableAccounts(accountIds));
      expect(enableAccountsStub.calledOnceWith(accountIds)).toBe(true);
    });

    it('handles errors when enableAccounts fails', async () => {
      const store = mockStore();
      const accountIds = ['0x789', '0xabc'];
      const error = new Error('Failed to update on-chain triggers');

      const enableAccountsStub = sinon.stub().rejects(error);

      background.getApi.returns({
        enableAccounts: enableAccountsStub,
      });
      setBackgroundConnection(background.getApi());

      await expect(
        store.dispatch(actions.enableAccounts(accountIds)),
      ).rejects.toThrow(error);
    });
  });

  describe('#fetchAndUpdateMetamaskNotifications', () => {
    afterEach(() => {
      sinon.restore();
    });

    it('calls fetchAndUpdateMetamaskNotifications in the background with correct parameters', async () => {
      const store = mockStore();

      const fetchAndUpdateMetamaskNotificationsStub = sinon.stub().resolves();
      const forceUpdateMetamaskStateStub = sinon
        .stub()
        .rejects(new Error('Failed to update on-chain triggers'));

      background.getApi.returns({
        fetchAndUpdateMetamaskNotifications:
          fetchAndUpdateMetamaskNotificationsStub,
        forceUpdateMetamaskState: forceUpdateMetamaskStateStub,
      });
      setBackgroundConnection(background.getApi());

      await store.dispatch(actions.fetchAndUpdateMetamaskNotifications());
      expect(fetchAndUpdateMetamaskNotificationsStub.calledOnceWith()).toBe(
        true,
      );
    });

    it('handles errors when fetchAndUpdateMetamaskNotifications fails', async () => {
      const store = mockStore();
      const error = new Error('Failed to update on-chain triggers');

      const fetchAndUpdateMetamaskNotificationsStub = sinon
        .stub()
        .rejects(error);
      const forceUpdateMetamaskStateStub = sinon.stub().rejects(error);

      background.getApi.returns({
        fetchAndUpdateMetamaskNotifications:
          fetchAndUpdateMetamaskNotificationsStub,
        forceUpdateMetamaskState: forceUpdateMetamaskStateStub,
      });
      setBackgroundConnection(background.getApi());

      await expect(
        store.dispatch(actions.fetchAndUpdateMetamaskNotifications()),
      ).rejects.toThrow(error);
    });
  });

  describe('#markMetamaskNotificationsAsRead', () => {
    afterEach(() => {
      sinon.restore();
    });

    it('calls markMetamaskNotificationsAsRead in the background with correct parameters', async () => {
      const store = mockStore();
      const notifications = [
        {
          id: 'notif1',
          type: TRIGGER_TYPES.ERC20_SENT,
          isRead: true,
        },
        {
          id: 'notif2',
          type: TRIGGER_TYPES.ERC20_SENT,
          isRead: false,
        },
        {
          id: 'notif3',
          type: TRIGGER_TYPES.ERC20_SENT,
          isRead: false,
        },
      ];

      const markMetamaskNotificationsAsReadStub = sinon.stub().resolves();

      background.getApi.returns({
        markMetamaskNotificationsAsRead: markMetamaskNotificationsAsReadStub,
      });
      setBackgroundConnection(background.getApi());

      await store.dispatch(
        actions.markMetamaskNotificationsAsRead(notifications.map((n) => n.id)),
      );
      expect(
        markMetamaskNotificationsAsReadStub.calledOnceWith(
          notifications.map((n) => n.id),
        ),
      ).toBe(true);
    });

    it('handles errors when markMetamaskNotificationsAsRead fails', async () => {
      const store = mockStore();
      const notifications = [
        {
          id: 'notif1',
          type: 'FeatureAnnouncement',
          isRead: true,
        },
        {
          id: 'notif2',
          type: 'OnChain',
          isRead: true,
        },
      ];
      const error = new Error('Failed to mark notifications as read');

      const markMetamaskNotificationsAsReadStub = sinon
        .stub()
        .rejects(new Error('Failed to mark notifications as read'));

      background.getApi.returns({
        markMetamaskNotificationsAsRead: markMetamaskNotificationsAsReadStub,
      });
      setBackgroundConnection(background.getApi());

      await expect(
        store.dispatch(
          actions.markMetamaskNotificationsAsRead(
            notifications.map((n) => n.id),
          ),
        ),
      ).rejects.toThrow(error);
    });
  });

  describe('#setFeatureAnnouncementsEnabled', () => {
    afterEach(() => {
      sinon.restore();
    });

    it('calls setFeatureAnnouncementsEnabled in the background with correct parameters', async () => {
      const store = mockStore();
      const state = true;

      const setFeatureAnnouncementsEnabledStub = sinon.stub().resolves();

      background.getApi.returns({
        setFeatureAnnouncementsEnabled: setFeatureAnnouncementsEnabledStub,
      });
      setBackgroundConnection(background.getApi());

      await store.dispatch(actions.setFeatureAnnouncementsEnabled(state));
      expect(setFeatureAnnouncementsEnabledStub.calledOnceWith(state)).toBe(
        true,
      );
    });

    it('handles errors when setFeatureAnnouncementsEnabled fails', async () => {
      const store = mockStore();
      const state = false;
      const error = new Error(
        'Failed to set feature announcements enabled state',
      );

      const setFeatureAnnouncementsEnabledStub = sinon
        .stub()
        .rejects(
          new Error('Failed to set feature announcements enabled state'),
        );

      background.getApi.returns({
        setFeatureAnnouncementsEnabled: setFeatureAnnouncementsEnabledStub,
      });
      setBackgroundConnection(background.getApi());

      await expect(
        store.dispatch(actions.setFeatureAnnouncementsEnabled(state)),
      ).rejects.toThrow(error);
    });
  });

  describe('#checkAccountsPresence', () => {
    afterEach(() => {
      sinon.restore();
    });

    it('dispatches CHECK_ACCOUNTS_PRESENCE with correct payload when successful', async () => {
      const store = mockStore();
      const accounts = ['0x123', '0x456'];

      const checkAccountsPresenceStub = sinon.stub().resolves();

      setBackgroundConnection({
        checkAccountsPresence: checkAccountsPresenceStub,
      });
      await store.dispatch(actions.checkAccountsPresence(accounts));
      expect(checkAccountsPresenceStub.calledOnceWith(accounts)).toBe(true);
    });

    it('throws and logs error when checkAccountsPresence encounters an error', async () => {
      const store = mockStore();
      const accounts = ['0x123', '0x456'];
      const error = new Error('Failed to check accounts presence');

      const checkAccountsPresenceStub = sinon.stub().rejects(error);

      setBackgroundConnection({
        checkAccountsPresence: checkAccountsPresenceStub,
      });

      const expectedActions = [];

      await expect(
        store.dispatch(actions.checkAccountsPresence(accounts)),
      ).rejects.toThrow('Failed to check accounts presence');
      expect(store.getActions()).toStrictEqual(expectedActions);
    });
  });

  describe('#toggleExternalServices', () => {
    it('calls toggleExternalServices', async () => {
      const store = mockStore();

      setBackgroundConnection(background);

      store.dispatch(actions.toggleExternalServices(true));

      // expect it to have been called once, with true as the value
      expect(background.toggleExternalServices.callCount).toStrictEqual(1);
      expect(background.toggleExternalServices.getCall(0).args).toStrictEqual([
        true,
      ]);
    });
  });

  describe('#showConfirmTurnOnMetamaskNotifications', () => {
    it('should dispatch showModal with the correct payload', async () => {
      const store = mockStore();

      await store.dispatch(actions.showConfirmTurnOnMetamaskNotifications());

      const expectedActions = [
        {
          payload: {
            name: 'TURN_ON_METAMASK_NOTIFICATIONS',
          },
          type: 'UI_MODAL_OPEN',
        },
      ];

      expect(store.getActions()).toStrictEqual(expectedActions);
    });
  });

  describe('#createMetaMetricsDataDeletionTask', () => {
    afterEach(() => {
      sinon.restore();
    });

    it('calls createMetaMetricsDataDeletionTask in background', async () => {
      const createMetaMetricsDataDeletionTaskStub = sinon.stub().resolves();
      background.getApi.returns({
        createMetaMetricsDataDeletionTask:
          createMetaMetricsDataDeletionTaskStub,
      });

      setBackgroundConnection(background.getApi());

      await actions.createMetaMetricsDataDeletionTask();
      expect(createMetaMetricsDataDeletionTaskStub.callCount).toStrictEqual(1);
    });
  });
  describe('#updateDataDeletionTaskStatus', () => {
    afterEach(() => {
      sinon.restore();
    });

    it('calls updateDataDeletionTaskStatus in background', async () => {
      const updateDataDeletionTaskStatusStub = sinon.stub().resolves();
      background.getApi.returns({
        updateDataDeletionTaskStatus: updateDataDeletionTaskStatusStub,
      });

      setBackgroundConnection(background.getApi());

      await actions.updateDataDeletionTaskStatus();
      expect(updateDataDeletionTaskStatusStub.callCount).toStrictEqual(1);
    });
  });

  describe('syncInternalAccountsWithUserStorage', () => {
    afterEach(() => {
      sinon.restore();
    });

    it('calls syncInternalAccountsWithUserStorage in the background', async () => {
      const store = mockStore();

      const syncInternalAccountsWithUserStorageStub = sinon.stub().resolves();

      background.getApi.returns({
        syncInternalAccountsWithUserStorage:
          syncInternalAccountsWithUserStorageStub,
      });
      setBackgroundConnection(background.getApi());

      await store.dispatch(actions.syncInternalAccountsWithUserStorage());
      expect(syncInternalAccountsWithUserStorageStub.calledOnceWith()).toBe(
        true,
      );
    });
  });

  describe('syncContactsWithUserStorage', () => {
    afterEach(() => {
      sinon.restore();
    });

    it('calls syncContactsWithUserStorage in the background', async () => {
      const store = mockStore();

      const syncContactsWithUserStorageStub = sinon.stub().resolves();

      background.getApi.returns({
        syncContactsWithUserStorage: syncContactsWithUserStorageStub,
      });
      setBackgroundConnection(background.getApi());

      await store.dispatch(actions.syncContactsWithUserStorage());
      expect(syncContactsWithUserStorageStub.calledOnceWith()).toBe(true);
    });
  });

  describe('deleteAccountSyncingDataFromUserStorage', () => {
    afterEach(() => {
      sinon.restore();
    });

    it('calls deleteAccountSyncingDataFromUserStorage in the background', async () => {
      const store = mockStore();

      const deleteAccountSyncingDataFromUserStorageStub = sinon
        .stub()
        .resolves();
      background.getApi.returns({
        deleteAccountSyncingDataFromUserStorage:
          deleteAccountSyncingDataFromUserStorageStub,
      });
      setBackgroundConnection(background.getApi());

      await store.dispatch(actions.deleteAccountSyncingDataFromUserStorage());
      expect(
        deleteAccountSyncingDataFromUserStorageStub.calledOnceWith(
          USER_STORAGE_FEATURE_NAMES.accounts,
        ),
      ).toBe(true);
    });
  });

  describe('removePermittedChain', () => {
    afterEach(() => {
      sinon.restore();
    });

    it('calls removePermittedChain in the background', async () => {
      const store = mockStore();

      background.removePermittedChain.resolves();
      setBackgroundConnection(background);

      await store.dispatch(actions.removePermittedChain('test.com', '0x1'));

      expect(
        background.removePermittedChain.calledWith('test.com', '0x1'),
      ).toBe(true);
      expect(store.getActions()).toStrictEqual([]);
    });
  });

  describe('requestAccountsAndChainPermissionsWithId', () => {
    afterEach(() => {
      sinon.restore();
    });

    it('calls requestAccountsAndChainPermissionsWithId in the background', async () => {
      const store = mockStore();

      background.requestAccountsAndChainPermissionsWithId.resolves();
      setBackgroundConnection(background);

      await store.dispatch(
        actions.requestAccountsAndChainPermissionsWithId('test.com'),
      );

      expect(
        background.requestAccountsAndChainPermissionsWithId.calledWith(
          'test.com',
        ),
      ).toBe(true);
      expect(store.getActions()).toStrictEqual([]);
    });
  });

  describe('setSmartTransactionsRefreshInterval', () => {
    afterEach(() => {
      sinon.restore();
    });

    it('calls setStatusRefreshInterval in the background with provided interval', async () => {
      const store = mockStore();
      const refreshInterval = 1000;

      background = {
        setStatusRefreshInterval: sinon.stub().resolves(),
      };
      setBackgroundConnection(background);

      await store.dispatch(
        actions.setSmartTransactionsRefreshInterval(refreshInterval),
      );

      expect(
        background.setStatusRefreshInterval.calledWith(refreshInterval),
      ).toBe(true);
    });

    it('does not call background if refresh interval is undefined', async () => {
      const store = mockStore();

      background = {
        setStatusRefreshInterval: sinon.stub().resolves(),
      };
      setBackgroundConnection(background);

      await store.dispatch(
        actions.setSmartTransactionsRefreshInterval(undefined),
      );

      expect(background.setStatusRefreshInterval.called).toBe(false);
    });

    it('does not call background if refresh interval is null', async () => {
      const store = mockStore();

      background = {
        setStatusRefreshInterval: sinon.stub().resolves(),
      };
      setBackgroundConnection(background);

      await store.dispatch(actions.setSmartTransactionsRefreshInterval(null));

      expect(background.setStatusRefreshInterval.called).toBe(false);
    });
  });

  describe('generateNewMnemonicAndAddToVault', () => {
    it('calls generateNewMnemonicAndAddToVault in the background', async () => {
      const store = mockStore();
      const generateNewMnemonicAndAddToVaultStub = sinon.stub().resolves({});
      background.getApi.returns({
        generateNewMnemonicAndAddToVault: generateNewMnemonicAndAddToVaultStub,
      });

      setBackgroundConnection(background.getApi());

      const expectedActions = [
        { type: 'SHOW_LOADING_INDICATION', payload: undefined },
        { type: 'HIDE_LOADING_INDICATION' },
      ];

      await store.dispatch(actions.generateNewMnemonicAndAddToVault());

      expect(store.getActions()).toStrictEqual(expectedActions);
      expect(generateNewMnemonicAndAddToVaultStub.calledOnceWith()).toBe(true);
    });
  });
  describe('importMnemonicToVault', () => {
    it('calls importMnemonicToVault in the background', async () => {
      const store = mockStore();
      const importMnemonicToVaultStub = sinon.stub().resolves({});
      background.getApi.returns({
        importMnemonicToVault: importMnemonicToVaultStub,
      });
      setBackgroundConnection(background.getApi());

      const mnemonic = 'mock seed';

      const expectedActions = [
        { type: 'SHOW_LOADING_INDICATION', payload: undefined },
        { type: 'HIDE_LOADING_INDICATION' },
        { type: 'HIDE_WARNING' },
        { type: 'SET_SHOW_NEW_SRP_ADDED_TOAST', payload: true },
      ];

      await store.dispatch(actions.importMnemonicToVault(mnemonic));

      expect(store.getActions()).toStrictEqual(expectedActions);
      expect(importMnemonicToVaultStub.calledOnceWith(mnemonic)).toStrictEqual(
        true,
      );
    });

    it('returns discovered accounts from background', async () => {
      const store = mockStore();
      const mockResult = {
        newAccountAddress: '9fE6zKgca6K2EEa3yjbcq7zGMusUNqSQeWQNL2YDZ2Yi',
        discoveredAccounts: { bitcoin: 2, solana: 1 },
      };

      const importMnemonicToVaultStub = sinon.stub().resolves(mockResult);

      background.getApi.returns({
        importMnemonicToVault: importMnemonicToVaultStub,
      });
      setBackgroundConnection(background.getApi());

      const result = await store.dispatch(
        actions.importMnemonicToVault('mnemonic'),
      );

      expect(result).toStrictEqual(mockResult);
    });
  });

  describe('getTokenStandardAndDetailsByChain', () => {
    afterEach(() => {
      sinon.restore();
    });

    it('calls getTokenStandardAndDetailsByChain in background', async () => {
      const getTokenStandardAndDetailsByChain =
        background.getTokenStandardAndDetailsByChain.resolves({});

      setBackgroundConnection(background);

      await actions.getTokenStandardAndDetailsByChain();
      expect(getTokenStandardAndDetailsByChain.callCount).toStrictEqual(1);
    });

    it('throw error when getTokenStandardAndDetailsByChain in background with error', async () => {
      background.getTokenStandardAndDetailsByChain.rejects(new Error('error'));

      setBackgroundConnection(background);

      await expect(actions.getTokenStandardAndDetailsByChain()).rejects.toThrow(
        'error',
      );
    });
  });

  describe('setManageInstitutionalWallets', () => {
    it('calls setManageInstitutionalWallets in the background', async () => {
      const store = mockStore();
      const setManageInstitutionalWalletsStub = sinon.stub().resolves();
      background.getApi.returns({
        setManageInstitutionalWallets: setManageInstitutionalWalletsStub,
      });
      setBackgroundConnection(background.getApi());

      await store.dispatch(actions.setManageInstitutionalWallets(true));
      expect(setManageInstitutionalWalletsStub.calledOnceWith(true)).toBe(true);
    });
  });

  describe('syncSeedPhrases', () => {
    afterEach(() => {
      sinon.restore();
    });

    it('should call syncSeedPhrases in the background and show/hide loading indication', async () => {
      const store = mockStore();

      background.syncSeedPhrases.resolves();
      setBackgroundConnection(background);

      const expectedActions = [{ type: 'HIDE_WARNING' }];

      await store.dispatch(actions.syncSeedPhrases());

      expect(store.getActions()).toStrictEqual(expectedActions);
      expect(background.syncSeedPhrases.calledOnceWith()).toBe(true);
    });

    it('should handle error and display warning', async () => {
      const store = mockStore();
      const errorMessage = 'Failed to sync seed phrases';

      background.syncSeedPhrases.rejects(new Error(errorMessage));
      setBackgroundConnection(background);

      const expectedActions = [
        { type: 'DISPLAY_WARNING', payload: errorMessage },
      ];

      await expect(store.dispatch(actions.syncSeedPhrases())).rejects.toThrow(
        errorMessage,
      );

      expect(store.getActions()).toStrictEqual(expectedActions);
      expect(background.syncSeedPhrases.calledOnceWith()).toBe(true);
    });

    it('should always hide loading indication even when error occurs', async () => {
      const store = mockStore();
      const errorMessage = 'Network error';

      background.syncSeedPhrases.rejects(new Error(errorMessage));
      setBackgroundConnection(background);

      try {
        await store.dispatch(actions.syncSeedPhrases());
      } catch (error) {
        // Expected to throw
      }

      expect(background.syncSeedPhrases.calledOnceWith()).toBe(true);
    });
  });
});
