import sinon from 'sinon';
import configureStore from 'redux-mock-store';
import thunk from 'redux-thunk';
import enLocale from '../../app/_locales/en/messages.json';
import MetaMaskController from '../../app/scripts/metamask-controller';
import { TransactionStatus } from '../../shared/constants/transaction';
import { HardwareDeviceNames } from '../../shared/constants/hardware-wallets';
import { GAS_LIMITS } from '../../shared/constants/gas';
import * as actions from './actions';
import { _setBackgroundConnection } from './action-queue';

const middleware = [thunk];
const defaultState = {
  metamask: {
    currentLocale: 'test',
    selectedAddress: '0xFirstAddress',
    provider: { chainId: '0x1' },
    accounts: {
      '0xFirstAddress': {
        balance: '0x0',
      },
    },
    identities: {
      '0xFirstAddress': {},
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

  const currentNetworkId = '5';

  beforeEach(async () => {
    background = sinon.createStubInstance(MetaMaskController, {
      getState: sinon.stub().callsFake((cb) => cb(null, baseMockState)),
    });
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

      _setBackgroundConnection(background);

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

      _setBackgroundConnection(background);

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

      _setBackgroundConnection(background);

      await store.dispatch(
        actions.createNewVaultAndRestore('password', 'test'),
      );
      expect(createNewVaultAndRestore.callCount).toStrictEqual(1);
    });

    it('calls the expected actions', async () => {
      const store = mockStore();

      background.createNewVaultAndRestore.callsFake((_, __, cb) => cb());
      background.unMarkPasswordForgotten.callsFake((cb) => cb());

      _setBackgroundConnection(background);

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

      _setBackgroundConnection(background);

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
      const verifySeedPhrase = background.verifySeedPhrase.callsFake((cb) =>
        cb(null, Array.from(Buffer.from('test').values())),
      );

      _setBackgroundConnection(background);

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

      _setBackgroundConnection(background);

      const expectedActions = [
        { type: 'SHOW_LOADING_INDICATION', payload: undefined },
        { type: 'DISPLAY_WARNING', payload: 'error' },
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

      _setBackgroundConnection(background);

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

      _setBackgroundConnection(background);

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

      _setBackgroundConnection(background);

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

      _setBackgroundConnection(background);

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

      _setBackgroundConnection(background);

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

      _setBackgroundConnection(background);

      const expectedActions = [
        {
          type: 'SHOW_LOADING_INDICATION',
          payload: 'This may take a while, please be patient.',
        },
        { type: 'DISPLAY_WARNING', payload: 'error' },
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
        metamask: { identities: {}, ...defaultState.metamask },
      });

      const addNewAccount = background.addNewAccount.callsFake((_, cb) =>
        cb(null, {
          identities: {},
        }),
      );

      _setBackgroundConnection(background);

      await store.dispatch(actions.addNewAccount(1));
      expect(addNewAccount.callCount).toStrictEqual(1);
    });

    it('displays warning error message when addNewAccount in background callback errors', async () => {
      const store = mockStore();

      background.addNewAccount.callsFake((_, cb) => {
        cb(new Error('error'));
      });

      _setBackgroundConnection(background);

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

      _setBackgroundConnection(background);

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

      _setBackgroundConnection(background);

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

      _setBackgroundConnection(background);

      await store.dispatch(actions.forgetDevice(HardwareDeviceNames.ledger));
      expect(forgetDevice.callCount).toStrictEqual(1);
    });

    it('shows loading indicator and displays error', async () => {
      const store = mockStore();

      background.forgetDevice.callsFake((_, cb) => cb(new Error('error')));

      _setBackgroundConnection(background);

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

      background.establishLedgerTransportPreference.callsFake((cb) => cb());

      _setBackgroundConnection(background);

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

      background.establishLedgerTransportPreference.callsFake((cb) => cb());

      _setBackgroundConnection(background);

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

      _setBackgroundConnection(background);

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

      _setBackgroundConnection(background);

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
      _setBackgroundConnection(background);

      await store.dispatch(actions.setCurrentCurrency('jpy'));
      expect(background.setCurrentCurrency.callCount).toStrictEqual(1);
    });

    it('throws if setCurrentCurrency throws', async () => {
      const store = mockStore();
      background.setCurrentCurrency = sinon
        .stub()
        .callsFake((_, cb) => cb(new Error('error')));
      _setBackgroundConnection(background);

      const expectedActions = [
        { type: 'SHOW_LOADING_INDICATION', payload: undefined },
        { type: 'DISPLAY_WARNING', payload: 'error' },
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
      data: '0x879a053d4800c6354e76c7985a865d2922c82fb5b3f4577b2fe08b998954f2e0',
    };

    afterEach(() => {
      sinon.restore();
    });

    it('calls signMsg in background', async () => {
      const store = mockStore();

      const signMessage = background.signMessage.callsFake((_, cb) =>
        cb(null, defaultState.metamask),
      );

      _setBackgroundConnection(background);

      await store.dispatch(actions.signMsg(msgParams));
      expect(signMessage.callCount).toStrictEqual(1);
    });

    it('errors when signMessage in background throws', async () => {
      const store = mockStore();

      background.signMessage.callsFake((_, cb) => cb(new Error('error')));

      _setBackgroundConnection(background);

      const expectedActions = [
        { type: 'SHOW_LOADING_INDICATION', payload: undefined },
        { type: 'DISPLAY_WARNING', payload: 'error' },
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
      data: '0x879a053d4800c6354e76c7985a865d2922c82fb5b3f4577b2fe08b998954f2e0',
    };

    afterEach(() => {
      sinon.restore();
    });

    it('calls signPersonalMessage', async () => {
      const store = mockStore();

      const signPersonalMessage = background.signPersonalMessage.callsFake(
        (_, cb) => cb(null, defaultState.metamask),
      );

      _setBackgroundConnection(background);

      await store.dispatch(actions.signPersonalMsg(msgParams));
      expect(signPersonalMessage.callCount).toStrictEqual(1);
    });

    it('throws if signPersonalMessage throws', async () => {
      const store = mockStore();

      background.signPersonalMessage.callsFake((_, cb) => {
        cb(new Error('error'));
      });

      _setBackgroundConnection(background);

      const expectedActions = [
        { type: 'SHOW_LOADING_INDICATION', payload: undefined },
        { type: 'DISPLAY_WARNING', payload: 'error' },
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

      _setBackgroundConnection(background);

      await store.dispatch(actions.signTypedMsg(msgParamsV3));
      expect(signTypedMsg.callCount).toStrictEqual(1);
    });

    it('returns expected actions with error', async () => {
      const store = mockStore();

      background.signTypedMessage.callsFake((_, cb) => cb(new Error('error')));

      _setBackgroundConnection(background);

      const expectedActions = [
        { type: 'SHOW_LOADING_INDICATION', payload: undefined },
        { type: 'DISPLAY_WARNING', payload: 'error' },
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
      status: TransactionStatus.unapproved,
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

      _setBackgroundConnection(background.getApi());

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

      _setBackgroundConnection(background.getApi());

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

      _setBackgroundConnection(background);

      await store.dispatch(actions.lockMetamask());
      expect(backgroundSetLocked.callCount).toStrictEqual(1);
    });

    it('returns display warning error with value when setLocked in background callback errors', async () => {
      const store = mockStore();

      background.setLocked.callsFake((cb) => {
        cb(new Error('error'));
      });

      _setBackgroundConnection(background);

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

      _setBackgroundConnection(background.getApi());

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

      _setBackgroundConnection(background.getApi());

      const expectedActions = [
        { type: 'SHOW_LOADING_INDICATION', payload: undefined },
        { type: 'DISPLAY_WARNING', payload: 'error' },
        { type: 'HIDE_LOADING_INDICATION' },
      ];

      await store.dispatch(actions.setSelectedAddress());
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
        metamask: { alertEnabledness: {}, selectedAddress: '0x123' },
      });

      const setSelectedAddressSpy = sinon.stub().callsFake((_, cb) => cb());

      background.getApi.returns({
        setSelectedAddress: setSelectedAddressSpy,
      });

      _setBackgroundConnection(background.getApi());

      await store.dispatch(actions.setSelectedAccount());
      expect(setSelectedAddressSpy.callCount).toStrictEqual(1);
    });

    it('displays warning if setSelectedAccount throws', async () => {
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

      _setBackgroundConnection(background.getApi());

      const expectedActions = [
        { type: 'SHOW_LOADING_INDICATION', payload: undefined },
        { type: 'DISPLAY_WARNING', payload: 'error' },
        { type: 'HIDE_LOADING_INDICATION' },
      ];

      await store.dispatch(actions.setSelectedAccount());
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

      _setBackgroundConnection(background.getApi());

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

      _setBackgroundConnection(background.getApi());

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

      _setBackgroundConnection(background.getApi());

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

      _setBackgroundConnection(background.getApi());

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

      _setBackgroundConnection(background.getApi());

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

      _setBackgroundConnection(background.getApi());

      const expectedActions = [
        {
          type: 'DISPLAY_WARNING',
          payload: 'Had a problem changing networks!',
        },
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

      _setBackgroundConnection(background);

      await store.dispatch(actions.setRpcTarget('http://localhost:8545'));
      expect(background.setCustomRpc.callCount).toStrictEqual(1);
    });

    it('displays warning when setRpcTarget throws', async () => {
      const store = mockStore();

      background.setCustomRpc.callsFake((_, __, ___, ____, cb) =>
        cb(new Error('error')),
      );

      _setBackgroundConnection(background);

      const expectedActions = [
        {
          type: 'DISPLAY_WARNING',
          payload: 'Had a problem changing networks!',
        },
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

      _setBackgroundConnection(background.getApi());

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

      _setBackgroundConnection(background.getApi());

      const expectedActions = [
        { type: 'SHOW_LOADING_INDICATION', payload: undefined },
        { type: 'HIDE_LOADING_INDICATION' },
        {
          type: 'SHOW_PRIVATE_KEY',
          payload: testPrivKey,
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

      _setBackgroundConnection(background.getApi());

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

      _setBackgroundConnection(background.getApi());

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

      _setBackgroundConnection(background.getApi());

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

      _setBackgroundConnection(background.getApi());

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

      _setBackgroundConnection(background.getApi());

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

      _setBackgroundConnection(background.getApi());

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

      _setBackgroundConnection(background.getApi());

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

      _setBackgroundConnection(background.getApi());

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

  describe('#setUseBlockie', () => {
    afterEach(() => {
      sinon.restore();
    });

    it('calls setUseBlockie in background', async () => {
      const store = mockStore();
      const setUseBlockieStub = sinon.stub().callsFake((_, cb) => cb());
      _setBackgroundConnection({ setUseBlockie: setUseBlockieStub });

      await store.dispatch(actions.setUseBlockie());
      expect(setUseBlockieStub.callCount).toStrictEqual(1);
    });

    it('errors when setUseBlockie in background throws', async () => {
      const store = mockStore();
      const setUseBlockieStub = sinon.stub().callsFake((_, cb) => {
        cb(new Error('error'));
      });

      _setBackgroundConnection({ setUseBlockie: setUseBlockieStub });

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
      _setBackgroundConnection({
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

      _setBackgroundConnection({
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
      _setBackgroundConnection({
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

      _setBackgroundConnection({
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
      _setBackgroundConnection({
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
      _setBackgroundConnection({
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

      _setBackgroundConnection(background);

      await store.dispatch(actions.markPasswordForgotten());

      expect(background.markPasswordForgotten.callCount).toStrictEqual(1);
    });

    it('errors when markPasswordForgotten throws', async () => {
      const store = mockStore();

      background.markPasswordForgotten.callsFake((cb) =>
        cb(new Error('error')),
      );

      _setBackgroundConnection(background);

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

      _setBackgroundConnection(background);

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
        cancelTransaction: sinon.stub().callsFake((_1, _2, cb) => {
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

      _setBackgroundConnection(background.getApi());

      const txId = 1457634084250832;

      await store.dispatch(actions.cancelTx({ id: txId }));
      const resultantActions = store.getActions();
      const expectedAction = resultantActions.find(
        (action) => action.type === 'COMPLETED_TX',
      );

      expect(expectedAction.value.id).toStrictEqual(txId);
    });
  });

  describe('#cancelMsgs', () => {
    it('creates COMPLETED_TX with the cancelled messages IDs', async () => {
      const store = mockStore();

      const cancelTypedMessageStub = sinon.stub().callsFake((_, cb) => cb());

      const cancelPersonalMessageStub = sinon.stub().callsFake((_, cb) => cb());

      background.getApi.returns({
        cancelTypedMessage: cancelTypedMessageStub,
        cancelPersonalMessage: cancelPersonalMessageStub,
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

      const msgsList = [
        { id: 7648683973086304, status: 'unapproved', type: 'personal_sign' },
        {
          id: 7648683973086303,
          status: 'unapproved',
          type: 'eth_signTypedData',
        },
      ];

      _setBackgroundConnection(background.getApi());

      await store.dispatch(actions.cancelMsgs(msgsList));
      const resultantActions = store.getActions();
      console.log(resultantActions);
      const expectedActions = resultantActions.filter(
        (action) => action.type === 'COMPLETED_TX',
      );

      expect(expectedActions[0].value.id).toStrictEqual(msgsList[0].id);
      expect(expectedActions[1].value.id).toStrictEqual(msgsList[1].id);
    });
  });
});
