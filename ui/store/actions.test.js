import sinon from 'sinon';
import configureStore from 'redux-mock-store';
import thunk from 'redux-thunk';
import { EthAccountType } from '@metamask/keyring-api';
import { TransactionStatus } from '@metamask/transaction-controller';
import { NotificationServicesController } from '@metamask/notification-services-controller';
import enLocale from '../../app/_locales/en/messages.json';
import MetaMaskController from '../../app/scripts/metamask-controller';
import { HardwareDeviceNames } from '../../shared/constants/hardware-wallets';
import { GAS_LIMITS } from '../../shared/constants/gas';
import { ORIGIN_METAMASK } from '../../shared/constants/app';
import { MetaMetricsNetworkEventSource } from '../../shared/constants/metametrics';
import { ETH_EOA_METHODS } from '../../shared/constants/eth-methods';
import { mockNetworkState } from '../../test/stub/networks';
import { CHAIN_IDS } from '../../shared/constants/network';
import * as actions from './actions';
import * as actionConstants from './actionConstants';
import { setBackgroundConnection } from './background-connection';

const { TRIGGER_TYPES } = NotificationServicesController.Constants;

const middleware = [thunk];
const defaultState = {
  metamask: {
    currentLocale: 'test',
    accounts: {
      '0xFirstAddress': {
        balance: '0x0',
      },
    },
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

const baseMockState = defaultState.metamask;

describe('Actions', () => {
  let background;

  const currentChainId = '0x5';

  beforeEach(async () => {
    background = sinon.createStubInstance(MetaMaskController, {
      getState: sinon.stub().callsFake((cb) => cb(null, baseMockState)),
    });

    background.signMessage = sinon.stub();
    background.signPersonalMessage = sinon.stub();
    background.signTypedMessage = sinon.stub();
    background.abortTransactionSigning = sinon.stub();
    background.toggleExternalServices = sinon.stub();
  });

  describe('#tryUnlockMetamask', () => {
    afterEach(() => {
      sinon.restore();
    });

    it('calls submitPassword', async () => {
      const store = mockStore();

      const submitPassword = background.submitPassword.callsFake((_, cb) =>
        cb(),
      );

      setBackgroundConnection(background);

      const expectedActions = [
        { type: 'SHOW_LOADING_INDICATION', payload: undefined },
        { type: 'UNLOCK_IN_PROGRESS' },
        { type: 'UNLOCK_SUCCEEDED', value: undefined },
        {
          type: 'UPDATE_METAMASK_STATE',
          value: baseMockState,
        },
        { type: 'HIDE_LOADING_INDICATION' },
      ];

      await store.dispatch(actions.tryUnlockMetamask());

      expect(submitPassword.callCount).toStrictEqual(1);

      expect(store.getActions()).toStrictEqual(expectedActions);
    });

    it('errors on submitPassword will fail', async () => {
      const store = mockStore();

      background.submitPassword.callsFake((_, cb) => cb(new Error('error')));

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
        background.createNewVaultAndRestore.callsFake((_, __, cb) => cb());

      background.unMarkPasswordForgotten.callsFake((cb) => cb());

      setBackgroundConnection(background);

      await store.dispatch(
        actions.createNewVaultAndRestore('password', 'test'),
      );
      expect(createNewVaultAndRestore.callCount).toStrictEqual(1);
    });

    it('calls the expected actions', async () => {
      const store = mockStore();

      background.createNewVaultAndRestore.callsFake((_, __, cb) => cb());
      background.unMarkPasswordForgotten.callsFake((cb) => cb());

      setBackgroundConnection(background);

      const expectedActions = [
        { type: 'SHOW_LOADING_INDICATION', payload: undefined },
        {
          type: 'UPDATE_METAMASK_STATE',
          value: baseMockState,
        },
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

      background.createNewVaultAndRestore.callsFake((_, __, cb) =>
        cb(new Error('error')),
      );

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

      const verifyPassword = background.verifyPassword.callsFake((_, cb) =>
        cb(),
      );
      const getSeedPhrase = background.getSeedPhrase.callsFake((_, cb) =>
        cb(null, Array.from(Buffer.from('test').values())),
      );

      setBackgroundConnection(background);

      await store.dispatch(actions.requestRevealSeedWords());
      expect(verifyPassword.callCount).toStrictEqual(1);
      expect(getSeedPhrase.callCount).toStrictEqual(1);
    });

    it('displays warning error message then callback in background errors', async () => {
      const store = mockStore();

      background.verifyPassword.callsFake((_, cb) => cb());
      background.getSeedPhrase.callsFake((_, cb) => {
        cb(new Error('error'));
      });

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

      background.getState.callsFake((cb) =>
        cb(null, {
          ...mockNetworkState({ chainId: CHAIN_IDS.MAINNET }),
          currentLocale: 'test',
          accounts: {
            '0xAnotherAddress': {
              balance: '0x0',
            },
          },
          internalAccounts: {
            accounts: {
              '22497cc9-e791-42b8-adef-2f13ef216b86': {
                address: '0xAnotherAddress',
                id: '22497cc9-e791-42b8-adef-2f13ef216b86',
                metadata: {
                  name: 'Test Account 2',
                  keyring: {
                    type: 'HD Key Tree',
                  },
                },
                options: {},
                methods: ETH_EOA_METHODS,
                type: EthAccountType.Eoa,
              },
            },
            selectedAccount: '22497cc9-e791-42b8-adef-2f13ef216b86',
          },
        }),
      );

      const removeAccount = background.removeAccount.callsFake((_, cb) => cb());

      setBackgroundConnection(background);

      const expectedActions = [
        'SHOW_LOADING_INDICATION',
        'SELECTED_ADDRESS_CHANGED',
        'ACCOUNT_CHANGED',
        'SELECTED_ACCOUNT_CHANGED',
        'UPDATE_METAMASK_STATE',
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

      background.removeAccount.callsFake((_, cb) => {
        cb(new Error('error'));
      });

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

      const resetAccount = background.resetAccount.callsFake((cb) => cb());

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

      background.resetAccount.callsFake((cb) => {
        cb(new Error('error'));
      });

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
        background.importAccountWithStrategy.callsFake((_, __, cb) => {
          cb();
        });

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

      background.importAccountWithStrategy.callsFake((_, __, cb) =>
        cb(new Error('error')),
      );

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

      const addNewAccount = background.addNewAccount.callsFake((_, cb) =>
        cb(null, {
          addedAccountAddress: '0x123',
        }),
      );

      setBackgroundConnection(background);

      await store.dispatch(actions.addNewAccount(1));
      expect(addNewAccount.callCount).toStrictEqual(1);
    });

    it('displays warning error message when addNewAccount in background callback errors', async () => {
      const store = mockStore();

      background.addNewAccount.callsFake((_, cb) => {
        cb(new Error('error'));
      });

      setBackgroundConnection(background);

      const expectedActions = [
        { type: 'SHOW_LOADING_INDICATION', payload: undefined },
        { type: 'DISPLAY_WARNING', payload: 'error' },
        { type: 'HIDE_LOADING_INDICATION' },
      ];

      await expect(store.dispatch(actions.addNewAccount(1))).rejects.toThrow(
        'error',
      );

      expect(store.getActions()).toStrictEqual(expectedActions);
    });
  });

  describe('#checkHardwareStatus', () => {
    afterEach(() => {
      sinon.restore();
    });

    it('calls checkHardwareStatus in background', async () => {
      const store = mockStore();

      const checkHardwareStatus = background.checkHardwareStatus.callsFake(
        (_, __, cb) => {
          cb();
        },
      );

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

      background.checkHardwareStatus.callsFake((_, __, cb) =>
        cb(new Error('error')),
      );

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

      const forgetDevice = background.forgetDevice.callsFake((_, cb) => cb());

      setBackgroundConnection(background);

      await store.dispatch(actions.forgetDevice(HardwareDeviceNames.ledger));
      expect(forgetDevice.callCount).toStrictEqual(1);
    });

    it('shows loading indicator and displays error', async () => {
      const store = mockStore();

      background.forgetDevice.callsFake((_, cb) => cb(new Error('error')));

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

      const connectHardware = background.connectHardware.callsFake(
        (_, __, ___, cb) => cb(),
      );

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

      background.connectHardware.callsFake((_, __, ___, cb) =>
        cb(new Error('error')),
      );

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
  });

  describe('#unlockHardwareWalletAccount', () => {
    afterEach(() => {
      sinon.restore();
    });

    it('calls unlockHardwareWalletAccount in background', async () => {
      const store = mockStore();
      const unlockHardwareWalletAccount =
        background.unlockHardwareWalletAccount.callsFake(
          (_, __, ___, ____, cb) => cb(),
        );

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

      background.unlockHardwareWalletAccount.callsFake((_, __, ___, ____, cb) =>
        cb(new Error('error')),
      );

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
      background.setCurrentCurrency = sinon.stub().callsFake((_, cb) => cb());
      setBackgroundConnection(background);

      await store.dispatch(actions.setCurrentCurrency('jpy'));
      expect(background.setCurrentCurrency.callCount).toStrictEqual(1);
    });

    it('throws if setCurrentCurrency throws', async () => {
      const store = mockStore();
      background.setCurrentCurrency = sinon
        .stub()
        .callsFake((_, cb) => cb(new Error('error')));
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

      const updateTransactionStub = sinon.stub().callsFake((_, cb) => cb());

      background.getApi.returns({
        updateTransaction: updateTransactionStub,
        getState: sinon.stub().callsFake((cb) => cb(null, baseMockState)),
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
        updateTransaction: (_, callback) => {
          callback(new Error('error'));
        },
        getState: sinon.stub().callsFake((cb) =>
          cb(null, {
            currentLocale: 'test',
          }),
        ),
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

      const backgroundSetLocked = background.setLocked.callsFake((cb) => cb());

      setBackgroundConnection(background);

      await store.dispatch(actions.lockMetamask());
      expect(backgroundSetLocked.callCount).toStrictEqual(1);
    });

    it('returns display warning error with value when setLocked in background callback errors', async () => {
      const store = mockStore();

      background.setLocked.callsFake((cb) => {
        cb(new Error('error'));
      });

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
                type: 'eip155:eoa',
              },
            },
            selectedAccount: 'mock-id',
          },
        },
      });

      const setSelectedInternalAccountSpy = sinon
        .stub()
        .callsFake((_, cb) => cb());

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
                type: 'eip155:eoa',
              },
            },
            selectedAccount: 'mock-id',
          },
        },
      });

      const setSelectedInternalAccountSpy = sinon
        .stub()
        .callsFake((_, cb) => cb(new Error('error')));

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

  describe('#addToken', () => {
    afterEach(() => {
      sinon.restore();
    });

    it('calls addToken in background', async () => {
      const store = mockStore();

      const addTokenStub = sinon
        .stub()
        .callsFake((_, __, ___, ____, cb) => cb());

      background.getApi.returns({
        addToken: addTokenStub,
        getState: sinon.stub().callsFake((cb) => cb(null, baseMockState)),
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

      const addTokenStub = sinon
        .stub()
        .callsFake((_, cb) => cb(null, tokenDetails));

      background.getApi.returns({
        addToken: addTokenStub,
        getState: sinon.stub().callsFake((cb) => cb(null, baseMockState)),
      });

      setBackgroundConnection(background.getApi());

      const expectedActions = [
        { type: 'SHOW_LOADING_INDICATION', payload: undefined },
        {
          type: 'UPDATE_METAMASK_STATE',
          value: baseMockState,
        },
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

      const ignoreTokensStub = sinon.stub().callsFake((_, cb) => cb());

      background.getApi.returns({
        ignoreTokens: ignoreTokensStub,
        getState: sinon.stub().callsFake((cb) => cb(null, baseMockState)),
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
        ignoreTokens: sinon.stub().callsFake((_, cb) => cb(new Error('error'))),
        getState: sinon.stub().callsFake((cb) => cb(null, baseMockState)),
      });

      setBackgroundConnection(background.getApi());

      const expectedActions = [
        { type: 'SHOW_LOADING_INDICATION', payload: undefined },
        { type: 'DISPLAY_WARNING', payload: 'error' },
        {
          type: 'UPDATE_METAMASK_STATE',
          value: baseMockState,
        },
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

      const setCurrentNetworkStub = sinon.stub().callsFake((_, cb) => cb());

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

      const setCurrentNetworkStub = sinon
        .stub()
        .callsFake((_, cb) => cb(new Error('error')));

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

  describe('#upsertNetworkConfiguration', () => {
    afterEach(() => {
      sinon.restore();
    });

    it('calls upsertNetworkConfiguration in the background with the correct arguments', async () => {
      const store = mockStore();

      const upsertNetworkConfigurationStub = sinon
        .stub()
        .callsFake((_, cb) => cb());

      background.getApi.returns({
        upsertNetworkConfiguration: upsertNetworkConfigurationStub,
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
        actions.upsertNetworkConfiguration(networkConfiguration, {
          source: MetaMetricsNetworkEventSource.CustomNetworkForm,
        }),
      );

      expect(
        upsertNetworkConfigurationStub.calledOnceWith(networkConfiguration, {
          referrer: ORIGIN_METAMASK,
          source: MetaMetricsNetworkEventSource.CustomNetworkForm,
          setActive: undefined,
        }),
      ).toBe(true);
    });

    it('throws when no options object is passed as a second argument', async () => {
      const store = mockStore();
      await expect(() =>
        store.dispatch(
          actions.upsertNetworkConfiguration({
            id: 'networkConfigurationId',
            rpcUrl: 'newRpc',
            chainId: '0x',
            ticker: 'ETH',
            nickname: 'nickname',
            rpcPrefs: { blockExplorerUrl: 'etherscan.io' },
          }),
        ),
      ).toThrow(
        "Cannot destructure property 'setActive' of 'undefined' as it is undefined.",
      );
    });
  });

  describe('#requestUserApproval', () => {
    afterEach(() => {
      sinon.restore();
    });

    it('calls requestUserApproval in the background with the correct arguments', async () => {
      const store = mockStore();

      const requestUserApprovalStub = sinon.stub().callsFake((_, cb) => cb());

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

  describe('#removeNetworkConfiguration', () => {
    afterEach(() => {
      sinon.restore();
    });

    it('calls removeNetworkConfiguration in the background with the correct arguments', async () => {
      const store = mockStore();

      const removeNetworkConfigurationStub = sinon
        .stub()
        .callsFake((_, cb) => cb());

      background.getApi.returns({
        removeNetworkConfiguration: removeNetworkConfigurationStub,
      });
      setBackgroundConnection(background.getApi());

      await store.dispatch(
        actions.removeNetworkConfiguration('testNetworkConfigurationId'),
      );

      expect(
        removeNetworkConfigurationStub.calledOnceWith(
          'testNetworkConfigurationId',
        ),
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

      const setAddressBookStub = sinon
        .stub()
        .callsFake((_, __, ___, ____, cb) => cb());

      background.getApi.returns({
        setAddressBook: setAddressBookStub,
        getState: sinon.stub().callsFake((cb) => cb(null, baseMockState)),
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

      const verifyPasswordStub = sinon.stub().callsFake((_, cb) => cb());

      const exportAccountStub = sinon
        .stub()
        .callsFake((_, _2, cb) => cb(null, testPrivKey));

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

      const verifyPasswordStub = sinon
        .stub()
        .callsFake((_, cb) => cb(new Error('error')));

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

      const verifyPasswordStub = sinon.stub().callsFake((_, cb) => cb());

      const exportAccountStub = sinon
        .stub()
        .callsFake((_, _2, cb) => cb(new Error('error')));

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

      const setAccountLabelStub = sinon.stub().callsFake((_, __, cb) => cb());

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
        setAccountLabel: sinon
          .stub()
          .callsFake((_, __, cb) => cb(new Error('error'))),
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

      const setFeatureFlagStub = sinon.stub().callsFake((_, __, cb) => cb());

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
        setFeatureFlag: sinon
          .stub()
          .callsFake((_, __, cb) => cb(new Error('error'))),
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
      const completeOnboardingStub = sinon.stub().callsFake((cb) => cb());

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
        completeOnboarding: sinon
          .stub()
          .callsFake((cb) => cb(new Error('error'))),
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
      const setServiceWorkerKeepAlivePreferenceStub = sinon
        .stub()
        .callsFake((_, cb) => cb());

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
        .callsFake((_, cb) => {
          cb(new Error('error'));
        });

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
      const setParticipateInMetaMetricsStub = jest.fn((_, cb) => cb());

      background.getApi.returns({
        setParticipateInMetaMetrics: setParticipateInMetaMetricsStub,
      });

      setBackgroundConnection(background.getApi());

      await store.dispatch(actions.setParticipateInMetaMetrics(true));
      expect(setParticipateInMetaMetricsStub).toHaveBeenCalledWith(
        true,
        expect.anything(),
      );
    });
  });

  describe('#setUseBlockie', () => {
    afterEach(() => {
      sinon.restore();
    });

    it('calls setUseBlockie in background', async () => {
      const store = mockStore();
      const setUseBlockieStub = sinon.stub().callsFake((_, cb) => cb());
      setBackgroundConnection({ setUseBlockie: setUseBlockieStub });

      await store.dispatch(actions.setUseBlockie());
      expect(setUseBlockieStub.callCount).toStrictEqual(1);
    });

    it('errors when setUseBlockie in background throws', async () => {
      const store = mockStore();
      const setUseBlockieStub = sinon.stub().callsFake((_, cb) => {
        cb(new Error('error'));
      });

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
      const setUsePhishDetectStub = sinon.stub().callsFake((_, cb) => cb());
      setBackgroundConnection({
        setUsePhishDetect: setUsePhishDetectStub,
      });

      store.dispatch(actions.setUsePhishDetect());
      expect(setUsePhishDetectStub.callCount).toStrictEqual(1);
    });

    it('errors when setUsePhishDetect in background throws', () => {
      const store = mockStore();
      const setUsePhishDetectStub = sinon.stub().callsFake((_, cb) => {
        cb(new Error('error'));
      });

      setBackgroundConnection({
        setUsePhishDetect: setUsePhishDetectStub,
      });

      const expectedActions = [
        { type: 'SHOW_LOADING_INDICATION', payload: undefined },
        { type: 'HIDE_LOADING_INDICATION' },
        { type: 'DISPLAY_WARNING', payload: 'error' },
      ];

      store.dispatch(actions.setUsePhishDetect());
      expect(store.getActions()).toStrictEqual(expectedActions);
    });
  });

  describe('#setUseMultiAccountBalanceChecker', () => {
    afterEach(() => {
      sinon.restore();
    });

    it('calls setUseMultiAccountBalanceChecker in background', () => {
      const store = mockStore();
      const setUseMultiAccountBalanceCheckerStub = sinon
        .stub()
        .callsFake((_, cb) => cb());
      setBackgroundConnection({
        setUseMultiAccountBalanceChecker: setUseMultiAccountBalanceCheckerStub,
      });

      store.dispatch(actions.setUseMultiAccountBalanceChecker());
      expect(setUseMultiAccountBalanceCheckerStub.callCount).toStrictEqual(1);
    });

    it('errors when setUseMultiAccountBalanceChecker in background throws', () => {
      const store = mockStore();
      const setUseMultiAccountBalanceCheckerStub = sinon
        .stub()
        .callsFake((_, cb) => {
          cb(new Error('error'));
        });

      setBackgroundConnection({
        setUseMultiAccountBalanceChecker: setUseMultiAccountBalanceCheckerStub,
      });

      const expectedActions = [
        { type: 'SHOW_LOADING_INDICATION', payload: undefined },
        { type: 'HIDE_LOADING_INDICATION' },
        { type: 'DISPLAY_WARNING', payload: 'error' },
      ];

      store.dispatch(actions.setUseMultiAccountBalanceChecker());
      expect(store.getActions()).toStrictEqual(expectedActions);
    });
  });

  describe('#setUse4ByteResolution', () => {
    afterEach(() => {
      sinon.restore();
    });

    it('calls setUse4ByteResolution in background', async () => {
      const store = mockStore();
      const setUse4ByteResolutionStub = sinon.stub().callsFake((_, cb) => cb());
      setBackgroundConnection({
        setUse4ByteResolution: setUse4ByteResolutionStub,
      });

      await store.dispatch(actions.setUse4ByteResolution());
      expect(setUse4ByteResolutionStub.callCount).toStrictEqual(1);
    });

    it('errors when setUse4ByteResolution in background throws', async () => {
      const store = mockStore();
      const setUse4ByteResolutionStub = sinon.stub().callsFake((_, cb) => {
        cb(new Error('error'));
      });

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
      const setUseSafeChainsListValidationStub = sinon
        .stub()
        .callsFake((_, cb) => cb());
      setBackgroundConnection({
        setUseSafeChainsListValidation: setUseSafeChainsListValidationStub,
      });

      store.dispatch(actions.setUseSafeChainsListValidation());
      expect(setUseSafeChainsListValidationStub.callCount).toStrictEqual(1);
    });

    it('errors when setUseSafeChainsListValidation in background throws', () => {
      const store = mockStore();
      const setUseSafeChainsListValidationStub = sinon
        .stub()
        .callsFake((_, cb) => {
          cb(new Error('error'));
        });

      setBackgroundConnection({
        setUseSafeChainsListValidation: setUseSafeChainsListValidationStub,
      });

      const expectedActions = [
        { type: 'SHOW_LOADING_INDICATION', payload: undefined },
        { type: 'HIDE_LOADING_INDICATION' },
        { type: 'DISPLAY_WARNING', payload: 'error' },
      ];

      store.dispatch(actions.setUseSafeChainsListValidation());
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
      const setCurrentLocaleStub = sinon.stub().callsFake((_, cb) => cb());
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
      const setCurrentLocaleStub = sinon
        .stub()
        .callsFake((_, cb) => cb(new Error('error')));
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

      background.markPasswordForgotten.callsFake((cb) => cb());

      setBackgroundConnection(background);

      await store.dispatch(actions.markPasswordForgotten());

      expect(background.markPasswordForgotten.callCount).toStrictEqual(1);
    });

    it('errors when markPasswordForgotten throws', async () => {
      const store = mockStore();

      background.markPasswordForgotten.callsFake((cb) =>
        cb(new Error('error')),
      );

      setBackgroundConnection(background);

      const expectedActions = [
        { type: 'HIDE_LOADING_INDICATION' },
        {
          type: 'UPDATE_METAMASK_STATE',
          value: baseMockState,
        },
      ];

      await expect(
        store.dispatch(actions.markPasswordForgotten('test')),
      ).rejects.toThrow('error');

      expect(store.getActions()).toStrictEqual(expectedActions);
    });
  });

  describe('#unMarkPasswordForgotten', () => {
    it('calls unMarkPasswordForgotten', async () => {
      const store = mockStore();

      background.unMarkPasswordForgotten.callsFake((cb) => cb());

      setBackgroundConnection(background);

      store.dispatch(actions.unMarkPasswordForgotten());

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
        rejectPendingApproval: sinon.stub().callsFake((_1, _2, cb) => {
          cb();
        }),
        getState: sinon.stub().callsFake((cb) =>
          cb(null, {
            ...mockNetworkState({ chainId: CHAIN_IDS.MAINNET }),
            currentLocale: 'test',
            accounts: {
              '0xFirstAddress': {
                balance: '0x0',
              },
            },
            internalAccounts: {
              accounts: {
                '8e110453-2231-4e62-82de-29b913dfef4b': {
                  address: '0xFirstAddress',
                  id: '8e110453-2231-4e62-82de-29b913dfef4b',
                  metadata: {
                    name: 'Test Account 2',
                    keyring: {
                      type: 'HD Key Tree',
                    },
                  },
                  options: {},
                  methods: ETH_EOA_METHODS,
                  type: EthAccountType.Eoa,
                },
              },
              selectedAccount: '8e110453-2231-4e62-82de-29b913dfef4b',
            },
            cachedBalances: {
              '0x1': {
                '0xFirstAddress': '0x0',
              },
            },
          }),
        ),
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
        expect.any(Function),
      ]);
    });
  });

  describe('#createCancelTransaction', () => {
    it('shows TRANSACTION_ALREADY_CONFIRMED modal if createCancelTransaction throws with an error', async () => {
      const store = mockStore();

      const createCancelTransactionStub = sinon
        .stub()
        .callsFake((_1, _2, _3, cb) =>
          cb(new Error('Previous transaction is already confirmed')),
        );
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
        store.dispatch(actions.removeAndIgnoreNft(undefined, '55')),
      ).rejects.toThrow('MetaMask - Cannot ignore NFT without address');
    });

    it('should throw when no tokenId found', async () => {
      const store = mockStore();

      await expect(
        store.dispatch(actions.removeAndIgnoreNft('Oxtest', undefined)),
      ).rejects.toThrow('MetaMask - Cannot ignore NFT without tokenID');
    });

    it('should throw when removeAndIgnoreNft throws an error', async () => {
      const store = mockStore();
      const error = new Error('remove nft fake error');
      background.removeAndIgnoreNft = sinon.stub().throws(error);

      setBackgroundConnection(background);

      await expect(
        store.dispatch(actions.removeAndIgnoreNft('Oxtest', '6')),
      ).rejects.toThrow(error);
    });
  });

  describe('#performSignIn', () => {
    afterEach(() => {
      sinon.restore();
    });

    it('calls performSignIn in the background', async () => {
      const store = mockStore();

      const performSignInStub = sinon.stub().callsFake((cb) => cb());

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

      const performSignOutStub = sinon.stub().callsFake((cb) => cb());

      background.getApi.returns({
        performSignOut: performSignOutStub,
      });
      setBackgroundConnection(background.getApi());

      await store.dispatch(actions.performSignOut());
      expect(performSignOutStub.calledOnceWith()).toBe(true);
    });
  });

  describe('#enableProfileSyncing', () => {
    afterEach(() => {
      sinon.restore();
    });

    it('calls enableProfileSyncing in the background', async () => {
      const store = mockStore();

      const enableProfileSyncingStub = sinon.stub().callsFake((cb) => cb());

      background.getApi.returns({
        enableProfileSyncing: enableProfileSyncingStub,
      });
      setBackgroundConnection(background.getApi());

      await store.dispatch(actions.enableProfileSyncing());
      expect(enableProfileSyncingStub.calledOnceWith()).toBe(true);
    });
  });

  describe('#disableProfileSyncing', () => {
    afterEach(() => {
      sinon.restore();
    });

    it('calls disableProfileSyncing in the background', async () => {
      const store = mockStore();

      const disableProfileSyncingStub = sinon.stub().callsFake((cb) => cb());

      background.getApi.returns({
        disableProfileSyncing: disableProfileSyncingStub,
      });
      setBackgroundConnection(background.getApi());

      await store.dispatch(actions.disableProfileSyncing());
      expect(disableProfileSyncingStub.calledOnceWith()).toBe(true);
    });
  });

  describe('#createOnChainTriggers', () => {
    afterEach(() => {
      sinon.restore();
    });

    it('calls createOnChainTriggers in the background', async () => {
      const store = mockStore();

      const createOnChainTriggersStub = sinon.stub().callsFake((cb) => cb());

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

      const createOnChainTriggersStub = sinon
        .stub()
        .callsFake((cb) => cb(error));

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

  describe('#deleteOnChainTriggersByAccount', () => {
    afterEach(() => {
      sinon.restore();
    });

    it('calls deleteOnChainTriggersByAccount in the background', async () => {
      const store = mockStore();
      const accounts = ['0x123', '0x456'];

      const deleteOnChainTriggersByAccountStub = sinon
        .stub()
        .callsFake((_, cb) => cb());

      background.getApi.returns({
        deleteOnChainTriggersByAccount: deleteOnChainTriggersByAccountStub,
      });
      setBackgroundConnection(background.getApi());

      await store.dispatch(actions.deleteOnChainTriggersByAccount(accounts));
      expect(deleteOnChainTriggersByAccountStub.calledOnceWith(accounts)).toBe(
        true,
      );
    });

    it('handles errors when deleteOnChainTriggersByAccount fails', async () => {
      const store = mockStore();
      const accounts = ['0x123', '0x456'];
      const error = new Error('Failed to delete on-chain triggers');

      const deleteOnChainTriggersByAccountStub = sinon
        .stub()
        .callsFake((_, cb) => cb(error));

      background.getApi.returns({
        deleteOnChainTriggersByAccount: deleteOnChainTriggersByAccountStub,
      });
      setBackgroundConnection(background.getApi());

      await expect(
        store.dispatch(actions.deleteOnChainTriggersByAccount(accounts)),
      ).rejects.toThrow(error);
    });
  });

  describe('#updateOnChainTriggersByAccount', () => {
    afterEach(() => {
      sinon.restore();
    });

    it('calls updateOnChainTriggersByAccount in the background with correct parameters', async () => {
      const store = mockStore();
      const accountIds = ['0x789', '0xabc'];

      const updateOnChainTriggersByAccountStub = sinon
        .stub()
        .callsFake((_, cb) => cb());

      background.getApi.returns({
        updateOnChainTriggersByAccount: updateOnChainTriggersByAccountStub,
      });
      setBackgroundConnection(background.getApi());

      await store.dispatch(actions.updateOnChainTriggersByAccount(accountIds));
      expect(
        updateOnChainTriggersByAccountStub.calledOnceWith(accountIds),
      ).toBe(true);
    });

    it('handles errors when updateOnChainTriggersByAccount fails', async () => {
      const store = mockStore();
      const accountIds = ['0x789', '0xabc'];
      const error = new Error('Failed to update on-chain triggers');

      const updateOnChainTriggersByAccountStub = sinon
        .stub()
        .callsFake((_, cb) => cb(error));

      background.getApi.returns({
        updateOnChainTriggersByAccount: updateOnChainTriggersByAccountStub,
      });
      setBackgroundConnection(background.getApi());

      await expect(
        store.dispatch(actions.updateOnChainTriggersByAccount(accountIds)),
      ).rejects.toThrow(error);
    });
  });

  describe('#fetchAndUpdateMetamaskNotifications', () => {
    afterEach(() => {
      sinon.restore();
    });

    it('calls fetchAndUpdateMetamaskNotifications in the background with correct parameters', async () => {
      const store = mockStore();

      const fetchAndUpdateMetamaskNotificationsStub = sinon
        .stub()
        .callsFake((cb) => cb());
      const forceUpdateMetamaskStateStub = sinon.stub().callsFake((cb) => cb());

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
        .callsFake((cb) => cb(error));
      const forceUpdateMetamaskStateStub = sinon
        .stub()
        .callsFake((cb) => cb(error));

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

      const markMetamaskNotificationsAsReadStub = sinon
        .stub()
        .callsFake((_, cb) => cb());

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
        .callsFake((_, cb) => cb(error));

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

      const setFeatureAnnouncementsEnabledStub = sinon
        .stub()
        .callsFake((_, cb) => cb());

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
        .callsFake((_, cb) => cb(error));

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

      const checkAccountsPresenceStub = sinon.stub().callsFake((_, cb) => cb());

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

      const checkAccountsPresenceStub = sinon
        .stub()
        .callsFake((_, cb) => cb(error));

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

  describe('showConfirmTurnOffProfileSyncing', () => {
    it('should dispatch showModal with the correct payload', async () => {
      const store = mockStore();

      await store.dispatch(actions.showConfirmTurnOffProfileSyncing());

      const expectedActions = [
        {
          payload: {
            name: 'CONFIRM_TURN_OFF_PROFILE_SYNCING',
          },
          type: 'UI_MODAL_OPEN',
        },
      ];

      await expect(store.getActions()).toStrictEqual(expectedActions);
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
        expect.any(Function),
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
});
