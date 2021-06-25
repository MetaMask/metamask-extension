import sinon from 'sinon';
import configureStore from 'redux-mock-store';
import thunk from 'redux-thunk';
import enLocale from '../../app/_locales/en/messages.json';
import MetaMaskController from '../../app/scripts/metamask-controller';
import { TRANSACTION_STATUSES } from '../../shared/constants/transaction';
import { GAS_LIMITS } from '../../shared/constants/gas';
import * as actions from './actions';

const middleware = [thunk];
const defaultState = {
  appState: {
    transactionsToDisplayOnFailure: {},
  },
  metamask: {
    currentNetworkTxList: [],
    currentLocale: 'test',
    selectedAddress: '0xFirstAddress',
    provider: { chainId: '0x1' },
    accounts: {
      '0xFirstAddress': {
        balance: '0x0',
      },
    },
    cachedBalances: {
      '0x1': {
        '0xFirstAddress': '0x0',
      },
    },
  },
};
const mockStore = (state = defaultState) => configureStore(middleware)(state);

const baseMockState = defaultState.metamask;

describe('Actions', () => {
  let background;

  const currentNetworkId = '42';

  beforeEach(async () => {
    background = sinon.createStubInstance(MetaMaskController, {
      getState: sinon.stub().callsFake((cb) => cb(null, baseMockState)),
    });
  });

  describe('#tryUnlockMetamask', () => {
    afterEach(() => {
      sinon.restore();
    });

    it('calls submitPassword and verifySeedPhrase', async () => {
      const store = mockStore();

      const submitPassword = background.submitPassword.callsFake((_, cb) =>
        cb(),
      );

      const verifySeedPhrase = background.verifySeedPhrase.callsFake((cb) =>
        cb(),
      );

      actions._setBackgroundConnection(background);

      const expectedActions = [
        { type: 'SHOW_LOADING_INDICATION', value: undefined },
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
      expect(verifySeedPhrase.callCount).toStrictEqual(1);

      expect(store.getActions()).toStrictEqual(expectedActions);
    });

    it('errors on submitPassword will fail', async () => {
      const store = mockStore();

      background.submitPassword.callsFake((_, cb) => cb(new Error('error')));

      actions._setBackgroundConnection(background);

      const expectedActions = [
        { type: 'SHOW_LOADING_INDICATION', value: undefined },
        { type: 'UNLOCK_IN_PROGRESS' },
        { type: 'UNLOCK_FAILED', value: 'error' },
        { type: 'HIDE_LOADING_INDICATION' },
      ];

      await expect(
        store.dispatch(actions.tryUnlockMetamask('test')),
      ).rejects.toThrow('error');

      expect(store.getActions()).toStrictEqual(expectedActions);
    });

    it('displays warning error and unlock failed when verifySeed fails', async () => {
      const store = mockStore();

      background.submitPassword.callsFake((_, cb) => cb());
      background.verifySeedPhrase.callsFake((cb) => {
        cb(new Error('error'));
      });

      actions._setBackgroundConnection(background);

      const expectedActions = [
        { type: 'SHOW_LOADING_INDICATION', value: undefined },
        { type: 'UNLOCK_IN_PROGRESS' },
        { type: 'UNLOCK_SUCCEEDED', value: undefined },
        {
          type: 'UPDATE_METAMASK_STATE',
          value: baseMockState,
        },
        { type: 'DISPLAY_WARNING', value: 'error' },
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

      const createNewVaultAndRestore = background.createNewVaultAndRestore.callsFake(
        (_, __, cb) => cb(),
      );

      background.unMarkPasswordForgotten.callsFake((cb) => cb());

      actions._setBackgroundConnection(background);

      await store.dispatch(actions.createNewVaultAndRestore());
      expect(createNewVaultAndRestore.callCount).toStrictEqual(1);
    });

    it('calls the expected actions', async () => {
      const store = mockStore();

      background.createNewVaultAndRestore.callsFake((_, __, cb) => cb());
      background.unMarkPasswordForgotten.callsFake((cb) => cb());

      actions._setBackgroundConnection(background);

      const expectedActions = [
        { type: 'SHOW_LOADING_INDICATION', value: undefined },
        { type: 'FORGOT_PASSWORD', value: false },
        {
          type: 'UPDATE_METAMASK_STATE',
          value: baseMockState,
        },
        { type: 'SHOW_ACCOUNTS_PAGE' },
        { type: 'HIDE_LOADING_INDICATION' },
      ];

      await store.dispatch(actions.createNewVaultAndRestore());

      expect(store.getActions()).toStrictEqual(expectedActions);
    });

    it('errors when callback in createNewVaultAndRestore throws', async () => {
      const store = mockStore();

      background.createNewVaultAndRestore.callsFake((_, __, cb) =>
        cb(new Error('error')),
      );

      actions._setBackgroundConnection(background);

      const expectedActions = [
        { type: 'SHOW_LOADING_INDICATION', value: undefined },
        { type: 'DISPLAY_WARNING', value: 'error' },
        { type: 'HIDE_LOADING_INDICATION' },
      ];

      await expect(
        store.dispatch(actions.createNewVaultAndRestore()),
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
      const verifySeedPhrase = background.verifySeedPhrase.callsFake((cb) =>
        cb(),
      );

      actions._setBackgroundConnection(background);

      await store.dispatch(actions.requestRevealSeedWords());
      expect(verifyPassword.callCount).toStrictEqual(1);
      expect(verifySeedPhrase.callCount).toStrictEqual(1);
    });

    it('displays warning error message then callback in background errors', async () => {
      const store = mockStore();

      background.verifyPassword.callsFake((_, cb) => cb());
      background.verifySeedPhrase.callsFake((cb) => {
        cb(new Error('error'));
      });

      actions._setBackgroundConnection(background);

      const expectedActions = [
        { type: 'SHOW_LOADING_INDICATION', value: undefined },
        { type: 'DISPLAY_WARNING', value: 'error' },
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
          currentLocale: 'test',
          selectedAddress: '0xAnotherAddress',
          provider: {
            chainId: '0x1',
          },
          accounts: {
            '0xAnotherAddress': {
              balance: '0x0',
            },
          },
          cachedBalances: {
            '0x1': {
              '0xAnotherAddress': '0x0',
            },
          },
        }),
      );

      const removeAccount = background.removeAccount.callsFake((_, cb) => cb());

      actions._setBackgroundConnection(background);

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

      actions._setBackgroundConnection(background);

      const expectedActions = [
        { type: 'SHOW_LOADING_INDICATION', value: undefined },
        { type: 'DISPLAY_WARNING', value: 'error' },
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

      actions._setBackgroundConnection(background);

      const expectedActions = [
        { type: 'SHOW_LOADING_INDICATION', value: undefined },
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

      actions._setBackgroundConnection(background);

      const expectedActions = [
        { type: 'SHOW_LOADING_INDICATION', value: undefined },
        { type: 'HIDE_LOADING_INDICATION' },
        { type: 'DISPLAY_WARNING', value: 'error' },
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

      const importAccountWithStrategy = background.importAccountWithStrategy.callsFake(
        (_, __, cb) => {
          cb();
        },
      );

      actions._setBackgroundConnection(background);

      await store.dispatch(
        actions.importNewAccount('Private Key', [
          'c87509a1c067bbde78beb793e6fa76530b6382a4c0241e5e4a9ec0a0f44dc0d3',
        ]),
      );
      expect(importAccountWithStrategy.callCount).toStrictEqual(1);
    });

    it('displays warning error message when importAccount in background callback errors', async () => {
      const store = mockStore();

      background.importAccountWithStrategy.callsFake((_, __, cb) =>
        cb(new Error('error')),
      );

      actions._setBackgroundConnection(background);

      const expectedActions = [
        {
          type: 'SHOW_LOADING_INDICATION',
          value: 'This may take a while, please be patient.',
        },
        { type: 'DISPLAY_WARNING', value: 'error' },
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
        appState: defaultState.appState,
        metamask: { identities: {}, ...defaultState.metamask },
      });

      const addNewAccount = background.addNewAccount.callsFake((cb) =>
        cb(null, {
          identities: {},
        }),
      );

      actions._setBackgroundConnection(background);

      await store.dispatch(actions.addNewAccount());
      expect(addNewAccount.callCount).toStrictEqual(1);
    });

    it('displays warning error message when addNewAccount in background callback errors', async () => {
      const store = mockStore();

      background.addNewAccount.callsFake((cb) => {
        cb(new Error('error'));
      });

      actions._setBackgroundConnection(background);

      const expectedActions = [
        { type: 'SHOW_LOADING_INDICATION', value: undefined },
        { type: 'DISPLAY_WARNING', value: 'error' },
        { type: 'HIDE_LOADING_INDICATION' },
      ];

      await expect(store.dispatch(actions.addNewAccount())).rejects.toThrow(
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

      actions._setBackgroundConnection(background);

      await store.dispatch(
        actions.checkHardwareStatus('ledger', `m/44'/60'/0'/0`),
      );
      expect(checkHardwareStatus.callCount).toStrictEqual(1);
    });

    it('shows loading indicator and displays error', async () => {
      const store = mockStore();

      background.checkHardwareStatus.callsFake((_, __, cb) =>
        cb(new Error('error')),
      );

      actions._setBackgroundConnection(background);

      const expectedActions = [
        { type: 'SHOW_LOADING_INDICATION', value: undefined },
        { type: 'DISPLAY_WARNING', value: 'error' },
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

      actions._setBackgroundConnection(background);

      await store.dispatch(actions.forgetDevice('ledger'));
      expect(forgetDevice.callCount).toStrictEqual(1);
    });

    it('shows loading indicator and displays error', async () => {
      const store = mockStore();

      background.forgetDevice.callsFake((_, cb) => cb(new Error('error')));

      actions._setBackgroundConnection(background);

      const expectedActions = [
        { type: 'SHOW_LOADING_INDICATION', value: undefined },
        { type: 'DISPLAY_WARNING', value: 'error' },
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

      background.establishLedgerTransportPreference.callsFake((cb) => cb());

      actions._setBackgroundConnection(background);

      await store.dispatch(
        actions.connectHardware('ledger', 0, `m/44'/60'/0'/0`),
      );
      expect(connectHardware.callCount).toStrictEqual(1);
    });

    it('shows loading indicator and displays error', async () => {
      const store = mockStore();

      background.connectHardware.callsFake((_, __, ___, cb) =>
        cb(new Error('error')),
      );

      background.establishLedgerTransportPreference.callsFake((cb) => cb());

      actions._setBackgroundConnection(background);

      const expectedActions = [
        {
          type: 'SHOW_LOADING_INDICATION',
          value: 'Looking for your Ledger...',
        },
        { type: 'DISPLAY_WARNING', value: 'error' },
        { type: 'HIDE_LOADING_INDICATION' },
      ];

      await expect(
        store.dispatch(actions.connectHardware('ledger')),
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
      const unlockHardwareWalletAccount = background.unlockHardwareWalletAccount.callsFake(
        (_, __, ___, ____, cb) => cb(),
      );

      actions._setBackgroundConnection(background);

      await store.dispatch(
        actions.unlockHardwareWalletAccounts(
          [0],
          'ledger',
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

      actions._setBackgroundConnection(background);

      const expectedActions = [
        { type: 'SHOW_LOADING_INDICATION', value: undefined },
        { type: 'DISPLAY_WARNING', value: 'error' },
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
      actions._setBackgroundConnection(background);

      await store.dispatch(actions.setCurrentCurrency('jpy'));
      expect(background.setCurrentCurrency.callCount).toStrictEqual(1);
    });

    it('throws if setCurrentCurrency throws', async () => {
      const store = mockStore();
      background.setCurrentCurrency = sinon
        .stub()
        .callsFake((_, cb) => cb(new Error('error')));
      actions._setBackgroundConnection(background);

      const expectedActions = [
        { type: 'SHOW_LOADING_INDICATION', value: undefined },
        { type: 'DISPLAY_WARNING', value: 'error' },
        { type: 'HIDE_LOADING_INDICATION' },
      ];

      await store.dispatch(actions.setCurrentCurrency());
      expect(store.getActions()).toStrictEqual(expectedActions);
    });
  });

  describe('#signMsg', () => {
    const msgParams = {
      metamaskId: 123,
      from: '0x0dcd5d886577d5081b0c52e242ef29e70be3e7bc',
      data:
        '0x879a053d4800c6354e76c7985a865d2922c82fb5b3f4577b2fe08b998954f2e0',
    };

    afterEach(() => {
      sinon.restore();
    });

    it('calls signMsg in background', async () => {
      const store = mockStore();

      const signMessage = background.signMessage.callsFake((_, cb) =>
        cb(null, defaultState.metamask),
      );

      actions._setBackgroundConnection(background);

      await store.dispatch(actions.signMsg(msgParams));
      expect(signMessage.callCount).toStrictEqual(1);
    });

    it('errors when signMessage in background throws', async () => {
      const store = mockStore();

      background.signMessage.callsFake((_, cb) => cb(new Error('error')));

      actions._setBackgroundConnection(background);

      const expectedActions = [
        { type: 'SHOW_LOADING_INDICATION', value: undefined },
        { type: 'DISPLAY_WARNING', value: 'error' },
        { type: 'HIDE_LOADING_INDICATION' },
      ];

      await expect(store.dispatch(actions.signMsg(msgParams))).rejects.toThrow(
        'error',
      );

      expect(store.getActions()).toStrictEqual(expectedActions);
    });
  });

  describe('#signPersonalMsg', () => {
    const msgParams = {
      from: '0x0dcd5d886577d5081b0c52e242ef29e70be3e7bc',
      data:
        '0x879a053d4800c6354e76c7985a865d2922c82fb5b3f4577b2fe08b998954f2e0',
    };

    afterEach(() => {
      sinon.restore();
    });

    it('calls signPersonalMessage', async () => {
      const store = mockStore();

      const signPersonalMessage = background.signPersonalMessage.callsFake(
        (_, cb) => cb(null, defaultState.metamask),
      );

      actions._setBackgroundConnection(background);

      await store.dispatch(actions.signPersonalMsg(msgParams));
      expect(signPersonalMessage.callCount).toStrictEqual(1);
    });

    it('throws if signPersonalMessage throws', async () => {
      const store = mockStore();

      background.signPersonalMessage.callsFake((_, cb) => {
        cb(new Error('error'));
      });

      actions._setBackgroundConnection(background);

      const expectedActions = [
        { type: 'SHOW_LOADING_INDICATION', value: undefined },
        { type: 'DISPLAY_WARNING', value: 'error' },
        { type: 'HIDE_LOADING_INDICATION' },
      ];

      await expect(
        store.dispatch(actions.signPersonalMsg(msgParams)),
      ).rejects.toThrow('error');

      expect(store.getActions()).toStrictEqual(expectedActions);
    });
  });

  describe('#signTypedMsg', () => {
    const msgParamsV3 = {
      from: '0x0DCD5D886577d5081B0c52e242Ef29E70Be3E7bc',
      data: JSON.stringify({
        types: {
          EIP712Domain: [
            { name: 'name', type: 'string' },
            { name: 'version', type: 'string' },
            { name: 'chainId', type: 'uint256' },
            { name: 'verifyingContract', type: 'address' },
          ],
          Person: [
            { name: 'name', type: 'string' },
            { name: 'wallet', type: 'address' },
          ],
          Mail: [
            { name: 'from', type: 'Person' },
            { name: 'to', type: 'Person' },
            { name: 'contents', type: 'string' },
          ],
        },
        primaryType: 'Mail',
        domain: {
          name: 'Ether Mainl',
          version: '1',
          verifyingContract: '0xCcCCccccCCCCcCCCCCCcCcCccCcCCCcCcccccccC',
        },
        message: {
          from: {
            name: 'Cow',
            wallet: '0xCD2a3d9F938E13CD947Ec05AbC7FE734Df8DD826',
          },
          to: {
            name: 'Bob',
            wallet: '0xbBbBBBBbbBBBbbbBbbBbbbbBBbBbbbbBbBbbBBbB',
          },
          contents: 'Hello, Bob!',
        },
      }),
    };

    afterEach(() => {
      sinon.restore();
    });

    it('calls signTypedMsg in background with no error', async () => {
      const store = mockStore();

      const signTypedMsg = background.signTypedMessage.callsFake((_, cb) =>
        cb(null, defaultState.metamask),
      );

      actions._setBackgroundConnection(background);

      await store.dispatch(actions.signTypedMsg(msgParamsV3));
      expect(signTypedMsg.callCount).toStrictEqual(1);
    });

    it('returns expected actions with error', async () => {
      const store = mockStore();

      background.signTypedMessage.callsFake((_, cb) => cb(new Error('error')));

      actions._setBackgroundConnection(background);

      const expectedActions = [
        { type: 'SHOW_LOADING_INDICATION', value: undefined },
        { type: 'DISPLAY_WARNING', value: 'error' },
        { type: 'HIDE_LOADING_INDICATION' },
      ];

      await expect(store.dispatch(actions.signTypedMsg())).rejects.toThrow(
        'error',
      );

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
      status: TRANSACTION_STATUSES.UNAPPROVED,
      metamaskNetworkId: currentNetworkId,
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

      actions._setBackgroundConnection(background.getApi());

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
            selectedAddress: '0xFirstAddress',
          }),
        ),
      });

      actions._setBackgroundConnection(background.getApi());

      const expectedActions = [
        { type: 'SHOW_LOADING_INDICATION', value: undefined },
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
        { type: 'TRANSACTION_ERROR', message: 'error' },
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

      actions._setBackgroundConnection(background);

      await store.dispatch(actions.lockMetamask());
      expect(backgroundSetLocked.callCount).toStrictEqual(1);
    });

    it('returns display warning error with value when setLocked in background callback errors', async () => {
      const store = mockStore();

      background.setLocked.callsFake((cb) => {
        cb(new Error('error'));
      });

      actions._setBackgroundConnection(background);

      const expectedActions = [
        { type: 'SHOW_LOADING_INDICATION', value: undefined },
        { type: 'DISPLAY_WARNING', value: 'error' },
        { type: 'HIDE_LOADING_INDICATION' },
        { type: 'LOCK_METAMASK' },
      ];

      await store.dispatch(actions.lockMetamask());

      expect(store.getActions()).toStrictEqual(expectedActions);
    });
  });

  describe('#setSelectedAddress', () => {
    afterEach(() => {
      sinon.restore();
    });

    it('calls setSelectedAddress in background', async () => {
      const store = mockStore();

      const setSelectedAddressSpy = sinon.stub().callsFake((_, cb) => cb());

      background.getApi.returns({
        setSelectedAddress: setSelectedAddressSpy,
      });

      actions._setBackgroundConnection(background.getApi());

      await store.dispatch(
        actions.setSelectedAddress(
          '0x0dcd5d886577d5081b0c52e242ef29e70be3e7bc',
        ),
      );
      expect(setSelectedAddressSpy.callCount).toStrictEqual(1);
    });

    it('errors when setSelectedAddress throws', async () => {
      const store = mockStore();

      const setSelectedAddressSpy = sinon
        .stub()
        .callsFake((_, cb) => cb(new Error('error')));

      background.getApi.returns({
        setSelectedAddress: setSelectedAddressSpy,
      });

      actions._setBackgroundConnection(background.getApi());

      const expectedActions = [
        { type: 'SHOW_LOADING_INDICATION', value: undefined },
        { type: 'DISPLAY_WARNING', value: 'error' },
        { type: 'HIDE_LOADING_INDICATION' },
      ];

      await store.dispatch(actions.setSelectedAddress());
      expect(store.getActions()).toStrictEqual(expectedActions);
    });
  });

  describe('#showAccountDetail', () => {
    afterEach(() => {
      sinon.restore();
    });

    it('#showAccountDetail', async () => {
      const store = mockStore({
        activeTab: {},
        metamask: { alertEnabledness: {}, selectedAddress: '0x123' },
      });

      const setSelectedAddressSpy = sinon.stub().callsFake((_, cb) => cb());

      background.getApi.returns({
        setSelectedAddress: setSelectedAddressSpy,
      });

      actions._setBackgroundConnection(background.getApi());

      await store.dispatch(actions.showAccountDetail());
      expect(setSelectedAddressSpy.callCount).toStrictEqual(1);
    });

    it('displays warning if setSelectedAddress throws', async () => {
      const store = mockStore({
        activeTab: {},
        metamask: { alertEnabledness: {}, selectedAddress: '0x123' },
      });

      const setSelectedAddressSpy = sinon
        .stub()
        .callsFake((_, cb) => cb(new Error('error')));

      background.getApi.returns({
        setSelectedAddress: setSelectedAddressSpy,
      });

      actions._setBackgroundConnection(background.getApi());

      const expectedActions = [
        { type: 'SHOW_LOADING_INDICATION', value: undefined },
        { type: 'DISPLAY_WARNING', value: 'error' },
        { type: 'HIDE_LOADING_INDICATION' },
      ];

      await store.dispatch(actions.showAccountDetail());
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

      actions._setBackgroundConnection(background.getApi());

      await store.dispatch(
        actions.addToken({
          address: '0x514910771af9ca656af840dff83e8264ecf986ca',
          symbol: 'LINK',
          decimals: 18,
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
        .callsFake((_, __, ___, ____, cb) => cb(null, tokenDetails));

      background.getApi.returns({
        addToken: addTokenStub,
        getState: sinon.stub().callsFake((cb) => cb(null, baseMockState)),
      });

      actions._setBackgroundConnection(background.getApi());

      const expectedActions = [
        { type: 'SHOW_LOADING_INDICATION', value: undefined },
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
        }),
      );

      expect(store.getActions()).toStrictEqual(expectedActions);
    });
  });

  describe('#removeToken', () => {
    afterEach(() => {
      sinon.restore();
    });

    it('calls removeToken in background', async () => {
      const store = mockStore();

      const removeTokenStub = sinon.stub().callsFake((_, cb) => cb());

      background.getApi.returns({
        removeToken: removeTokenStub,
        getState: sinon.stub().callsFake((cb) => cb(null, baseMockState)),
      });

      actions._setBackgroundConnection(background.getApi());

      await store.dispatch(actions.removeToken());
      expect(removeTokenStub.callCount).toStrictEqual(1);
    });

    it('should display warning when removeToken in background fails', async () => {
      const store = mockStore();

      background.getApi.returns({
        removeToken: sinon.stub().callsFake((_, cb) => cb(new Error('error'))),
        getState: sinon.stub().callsFake((cb) => cb(null, baseMockState)),
      });

      actions._setBackgroundConnection(background.getApi());

      const expectedActions = [
        { type: 'SHOW_LOADING_INDICATION', value: undefined },
        { type: 'DISPLAY_WARNING', value: 'error' },
        {
          type: 'UPDATE_METAMASK_STATE',
          value: baseMockState,
        },
        { type: 'HIDE_LOADING_INDICATION' },
      ];

      await store.dispatch(actions.removeToken());

      expect(store.getActions()).toStrictEqual(expectedActions);
    });
  });

  describe('#setProviderType', () => {
    afterEach(() => {
      sinon.restore();
    });

    it('calls setProviderType', async () => {
      const store = mockStore();

      const setProviderTypeStub = sinon.stub().callsFake((_, cb) => cb());

      background.getApi.returns({
        setProviderType: setProviderTypeStub,
      });

      actions._setBackgroundConnection(background.getApi());

      await store.dispatch(actions.setProviderType());
      expect(setProviderTypeStub.callCount).toStrictEqual(1);
    });

    it('displays warning when setProviderType throws', async () => {
      const store = mockStore();

      background.getApi.returns({
        setProviderType: sinon
          .stub()
          .callsFake((_, cb) => cb(new Error('error'))),
      });

      actions._setBackgroundConnection(background.getApi());

      const expectedActions = [
        { type: 'DISPLAY_WARNING', value: 'Had a problem changing networks!' },
      ];

      await store.dispatch(actions.setProviderType());
      expect(store.getActions()).toStrictEqual(expectedActions);
    });
  });

  describe('#setRpcTarget', () => {
    afterEach(() => {
      sinon.restore();
    });

    it('calls setRpcTarget', async () => {
      const store = mockStore();

      background.setCustomRpc.callsFake((_, __, ___, ____, cb) => cb());

      actions._setBackgroundConnection(background);

      await store.dispatch(actions.setRpcTarget('http://localhost:8545'));
      expect(background.setCustomRpc.callCount).toStrictEqual(1);
    });

    it('displays warning when setRpcTarget throws', async () => {
      const store = mockStore();

      background.setCustomRpc.callsFake((_, __, ___, ____, cb) =>
        cb(new Error('error')),
      );

      actions._setBackgroundConnection(background);

      const expectedActions = [
        { type: 'DISPLAY_WARNING', value: 'Had a problem changing networks!' },
      ];

      await store.dispatch(actions.setRpcTarget());
      expect(store.getActions()).toStrictEqual(expectedActions);
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
      });

      actions._setBackgroundConnection(background.getApi());

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
        .callsFake((_, cb) => cb(null, testPrivKey));

      background.getApi.returns({
        verifyPassword: verifyPasswordStub,
        exportAccount: exportAccountStub,
      });

      actions._setBackgroundConnection(background.getApi());

      const expectedActions = [
        { type: 'SHOW_LOADING_INDICATION', value: undefined },
        { type: 'HIDE_LOADING_INDICATION' },
        {
          type: 'SHOW_PRIVATE_KEY',
          value: testPrivKey,
        },
      ];

      await store.dispatch(
        actions.exportAccount('a-test-password', '0xAddress'),
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

      actions._setBackgroundConnection(background.getApi());

      const expectedActions = [
        { type: 'SHOW_LOADING_INDICATION', value: undefined },
        { type: 'HIDE_LOADING_INDICATION' },
        { type: 'DISPLAY_WARNING', value: 'Incorrect Password.' },
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
        .callsFake((_, cb) => cb(new Error('error')));

      background.getApi.returns({
        verifyPassword: verifyPasswordStub,
        exportAccount: exportAccountStub,
      });

      actions._setBackgroundConnection(background.getApi());

      const expectedActions = [
        { type: 'SHOW_LOADING_INDICATION', value: undefined },
        { type: 'HIDE_LOADING_INDICATION' },
        {
          type: 'DISPLAY_WARNING',
          value: 'Had a problem exporting the account.',
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

      actions._setBackgroundConnection(background.getApi());

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

      actions._setBackgroundConnection(background.getApi());

      const expectedActions = [
        { type: 'SHOW_LOADING_INDICATION', value: undefined },
        { type: 'HIDE_LOADING_INDICATION' },
        { type: 'DISPLAY_WARNING', value: 'error' },
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

      actions._setBackgroundConnection(background.getApi());

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

      actions._setBackgroundConnection(background.getApi());

      const expectedActions = [
        { type: 'SHOW_LOADING_INDICATION', value: undefined },
        { type: 'HIDE_LOADING_INDICATION' },
        { type: 'DISPLAY_WARNING', value: 'error' },
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

      actions._setBackgroundConnection(background.getApi());

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

      actions._setBackgroundConnection(background.getApi());

      const expectedActions = [
        { type: 'SHOW_LOADING_INDICATION', value: undefined },
        { type: 'DISPLAY_WARNING', value: 'error' },
        { type: 'HIDE_LOADING_INDICATION' },
      ];

      await expect(
        store.dispatch(actions.setCompletedOnboarding()),
      ).rejects.toThrow('error');

      expect(store.getActions()).toStrictEqual(expectedActions);
    });
  });

  describe('#setUseBlockie', () => {
    afterEach(() => {
      sinon.restore();
    });

    it('calls setUseBlockie in background', async () => {
      const store = mockStore();

      const setUseBlockStub = background.setUseBlockie.callsFake((_, cb) =>
        cb(),
      );

      actions._setBackgroundConnection(background);

      await store.dispatch(actions.setUseBlockie());
      expect(setUseBlockStub.callCount).toStrictEqual(1);
    });

    it('errors when setUseBlockie in background throws', async () => {
      const store = mockStore();

      background.setUseBlockie.callsFake((_, cb) => cb(new Error('error')));

      actions._setBackgroundConnection(background);

      const expectedActions = [
        { type: 'SHOW_LOADING_INDICATION', value: undefined },
        { type: 'HIDE_LOADING_INDICATION' },
        { type: 'DISPLAY_WARNING', value: 'error' },
        { type: 'SET_USE_BLOCKIE', value: undefined },
      ];

      await store.dispatch(actions.setUseBlockie());
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

      background.setCurrentLocale.callsFake((_, cb) => cb());

      actions._setBackgroundConnection(background);

      const expectedActions = [
        { type: 'SHOW_LOADING_INDICATION', value: undefined },
        {
          type: 'SET_CURRENT_LOCALE',
          value: { locale: 'test', messages: enLocale },
        },
        { type: 'HIDE_LOADING_INDICATION' },
      ];

      await store.dispatch(actions.updateCurrentLocale('test'));
      expect(background.setCurrentLocale.callCount).toStrictEqual(1);
      expect(store.getActions()).toStrictEqual(expectedActions);
    });

    it('errors when setCurrentLocale throws', async () => {
      const store = mockStore();

      background.setCurrentLocale.callsFake((_, cb) => cb(new Error('error')));

      actions._setBackgroundConnection(background);

      const expectedActions = [
        { type: 'SHOW_LOADING_INDICATION', value: undefined },
        { type: 'DISPLAY_WARNING', value: 'error' },
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

      actions._setBackgroundConnection(background);

      await store.dispatch(actions.markPasswordForgotten());

      const resultantActions = store.getActions();
      expect(resultantActions[1]).toStrictEqual({
        type: 'FORGOT_PASSWORD',
        value: true,
      });
      expect(background.markPasswordForgotten.callCount).toStrictEqual(1);
    });

    it('errors when markPasswordForgotten throws', async () => {
      const store = mockStore();

      background.markPasswordForgotten.callsFake((cb) =>
        cb(new Error('error')),
      );

      actions._setBackgroundConnection(background);

      const expectedActions = [
        { type: 'HIDE_LOADING_INDICATION' },
        { type: 'FORGOT_PASSWORD', value: true },
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

      actions._setBackgroundConnection(background);

      store.dispatch(actions.unMarkPasswordForgotten());

      const resultantActions = store.getActions();
      expect(resultantActions[0]).toStrictEqual({
        type: 'FORGOT_PASSWORD',
        value: false,
      });
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
        value: warningText,
      });
    });
  });

  describe('#cancelTx', () => {
    it('creates COMPLETED_TX with the cancelled transaction ID', async () => {
      const store = mockStore();

      background.getApi.returns({
        cancelTransaction: sinon.stub().callsFake((_, cb) => {
          cb();
        }),
        getState: sinon.stub().callsFake((cb) =>
          cb(null, {
            currentLocale: 'test',
            selectedAddress: '0xFirstAddress',
            provider: {
              chainId: '0x1',
            },
            accounts: {
              '0xFirstAddress': {
                balance: '0x0',
              },
            },
            cachedBalances: {
              '0x1': {
                '0xFirstAddress': '0x0',
              },
            },
          }),
        ),
      });

      actions._setBackgroundConnection(background.getApi());

      const txId = 1457634084250832;

      await store.dispatch(actions.cancelTx({ id: txId }));
      const resultantActions = store.getActions();
      const expectedAction = resultantActions.find(
        (action) => action.type === 'COMPLETED_TX',
      );

      expect(expectedAction.value.id).toStrictEqual(txId);
    });
  });
});
