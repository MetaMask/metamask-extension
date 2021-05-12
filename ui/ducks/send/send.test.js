import sinon from 'sinon';
import configureMockStore from 'redux-mock-store';
// import sendReducer from './send';
import thunk from 'redux-thunk';

import { addHexPrefix } from 'ethereumjs-util';
import { describe, it } from 'globalthis/implementation';
import configureStore from '../../store/store';
import { addGasBuffer } from '../../pages/send/send.utils';
import { multiplyCurrencies } from '../../helpers/utils/conversion-util';
import {
  gasFeeIsInError,
  getGasButtonGroupShown,
  getGasLimit,
  getGasLoadingError,
  getGasPrice,
  getGasTotal,
  getPrimaryCurrency,
  getSendAmount,
  getSendEditingTransactionId,
  getSendEnsResolution,
  getSendEnsResolutionError,
  getSendErrors,
  getSendFrom,
  getSendFromBalance,
  getSendFromObject,
  getSendHexData,
  getSendMaxModeState,
  getSendTo,
  getSendToken,
  getSendTokenAddress,
  getSendTokenContract,
  getSendToNickname,
  getTitleKey,
  getTokenBalance,
  isSendFormInError,
  sendAmountIsInError,
  setEditingTransactionId,
  setSendFrom,
  updateGasData,
  updateSendToken,
} from './send';
import {
  hideGasButtonGroup,
  setGasLimit,
  setGasPrice,
  setMaxModeTo,
  setSendTokenBalance,
  showGasButtonGroup,
  updateSendAmount,
  updateSendErrors,
  updateSendHexData,
  updateSendTo,
  initialState,
  resetSendState,
  updateSendEnsResolution,
  updateSendEnsResolutionError,
} from '.';

jest.mock('../../selectors', () => ({
  getSelectedAccount: jest.fn(() => ({
    address: '0xab',
    balance: '0x0',
  })),
}));

jest.mock('../../store/actions', () => ({
  estimateGas: jest.fn(({ value }) => {
    if (value === '0xbadvalue') {
      return Promise.reject(new Error('BAD VALUE'));
    } else if (value === '0xgassimfail') {
      return Promise.reject(new Error('Transaction execution error.'));
    }
    return Promise.resolve('0x52ac');
  }),
}));

describe('send slice', () => {
  let store;
  let mockStore;
  beforeEach(() => {
    store = configureStore();
    mockStore = configureMockStore([thunk])({});
    jest.resetModules();
  });
  describe('simple actions', () => {
    it('updateSendErrors adds to the error object', () => {
      store.dispatch(updateSendErrors({ gasLoadingError: 'gasLoadingError' }));
      let state = store.getState();
      expect(state.send.errors).toHaveProperty('gasLoadingError');
      store.dispatch(updateSendErrors({ gasPrice: 'gasPriceError' }));
      state = store.getState();
      expect(state.send.errors).toHaveProperty('gasLoadingError');
      expect(state.send.errors).toHaveProperty('gasPrice');
    });

    it('showGasButtonGroup should set gasButtonGroupShown to true', () => {
      store.dispatch(showGasButtonGroup());
      const state = store.getState();
      expect(state.send.gasButtonGroupShown).toBe(true);
    });

    it('hideGasButtonGroup should set gasButtonGroupShown to false', () => {
      store.dispatch(showGasButtonGroup());
      store.dispatch(hideGasButtonGroup());
      const state = store.getState();
      expect(state.send.gasButtonGroupShown).toBe(false);
    });

    it('setGasLimit should set the gasLimit in state', () => {
      store.dispatch(setGasLimit('0x5208'));
      const state = store.getState();
      expect(state.send.gasLimit).toBe('0x5208');
    });

    it('setGasPrice should set the gasPrice in state', () => {
      store.dispatch(setGasPrice('0x6E'));
      const state = store.getState();
      expect(state.send.gasPrice).toBe('0x6E');
    });

    it('setSendTokenBalance should set the tokenBalance in state', () => {
      store.dispatch(setSendTokenBalance('0x0'));
      const state = store.getState();
      expect(state.send.tokenBalance).toBe('0x0');
    });

    it('updateSendHexData should set the data key in state', () => {
      store.dispatch(updateSendHexData('0x0'));
      const state = store.getState();
      expect(state.send.data).toBe('0x0');
    });

    it('updateSendTo should set the to and toNickname in state', () => {
      store.dispatch(updateSendTo({ to: '0x0', nickname: 'account 2' }));
      const state = store.getState();
      expect(state.send.to).toBe('0x0');
      expect(state.send.toNickname).toBe('account 2');
    });

    it('updateSendAmount should set the amount in state', () => {
      store.dispatch(updateSendAmount('0x0'));
      const state = store.getState();
      expect(state.send.amount).toBe('0x0');
    });

    it('setMaxModeTo should set the maxModeOn key in state', () => {
      store.dispatch(setMaxModeTo(true));
      const state = store.getState();
      expect(state.send.maxModeOn).toBe(true);
    });

    it('setSendFrom should set the from key in state', () => {
      store.dispatch(setSendFrom('0x00'));
      const state = store.getState();
      expect(state.send.from).toBe('0x00');
    });

    it('setEditingTransactionId should set the editingTransactionId key in state', () => {
      store.dispatch(setEditingTransactionId('0'));
      const state = store.getState();
      expect(state.send.editingTransactionId).toBe('0');
    });

    it('updateSendEnsResolution clears ensResolutionError and sets ensResolution', () => {
      store.dispatch(updateSendEnsResolutionError('notFound'));
      store.dispatch(updateSendEnsResolution('0x00'));
      const state = store.getState();
      expect(state.send.ensResolutionError).toBe('');
      expect(state.send.ensResolution).toBe('0x00');
    });

    it('updateSendEnsResolutionError clears ensResolution and sets ensResolutionError', () => {
      store.dispatch(updateSendEnsResolution('0x00'));
      store.dispatch(updateSendEnsResolutionError('notFound'));
      const state = store.getState();
      expect(state.send.ensResolutionError).toBe('notFound');
      expect(state.send.ensResolution).toBeNull();
    });

    it('resetSendState sets state back to the initial value', () => {
      store.dispatch(setGasLimit('0xEE'));
      store.dispatch(setGasPrice('0xFF'));
      let state = store.getState();
      expect(state.send.gasLimit).toBe('0xEE');
      expect(state.send.gasPrice).toBe('0xFF');
      store.dispatch(resetSendState());
      state = store.getState();
      expect(state.send).toMatchObject(initialState);
    });
  });
  describe('action creators', () => {
    describe('updatedGasData', () => {
      it('starts and stops gas loading when there is an error', async () => {
        global.eth = {
          getCode: sinon.stub().rejects(),
        };

        const mockData = {
          gasPrice: '0x3b9aca00', //
          blockGasLimit: '0x6ad79a', // 7002010
          selectedAddress: '0x0DCD5D886577d5081B0c52e242Ef29E70Be3E7bc',
          to: '0xEC1Adf982415D2Ef5ec55899b9Bfb8BC0f29251B',
          value: '0xde0b6b3a7640000', // 1000000000000000000
        };

        await mockStore.dispatch(updateGasData(mockData));

        const actions = mockStore.getActions();

        expect(actions[0].type).toBe('send/gasLoadingStarted');
        expect(actions[actions.length - 1].type).toBe(
          'send/gasLoadingFinished',
        );
      });

      it('starts and stops gas loading when there is not an error', async () => {
        const mockData = {
          gasPrice: '0x3b9aca00',
          blockGasLimit: '0x6ad79a', // 7002010
          selectedAddress: '0x0DCD5D886577d5081B0c52e242Ef29E70Be3E7bc',
          to: '0xEC1Adf982415D2Ef5ec55899b9Bfb8BC0f29251B',
          value: '0xde0b6b3a7640000', // 1000000000000000000
        };

        global.eth = {
          getCode: sinon.stub().returns('0x'),
        };

        await mockStore.dispatch(updateGasData(mockData));

        const actions = mockStore.getActions();

        expect(actions[0].type).toBe('send/gasLoadingStarted');
        expect(actions[actions.length - 1].type).toBe(
          'send/gasLoadingFinished',
        );
      });

      it('errors when get code does not return', async () => {
        global.eth = {
          getCode: sinon.stub().rejects(),
        };

        const mockData = {
          gasPrice: '0x3b9aca00', //
          blockGasLimit: '0x6ad79a', // 7002010
          selectedAddress: '0x0DCD5D886577d5081B0c52e242Ef29E70Be3E7bc',
          to: '0xEC1Adf982415D2Ef5ec55899b9Bfb8BC0f29251B',
          value: '0xde0b6b3a7640000', // 1000000000000000000
        };

        await store.dispatch(updateGasData(mockData));

        expect(store.getState().send.errors.gasLoadingError).toBe(
          'gasLoadingError',
        );
      });

      it('returns default gas limit for basic eth transaction', async () => {
        const mockData = {
          gasPrice: '0x3b9aca00',
          blockGasLimit: '0x6ad79a', // 7002010
          selectedAddress: '0x0DCD5D886577d5081B0c52e242Ef29E70Be3E7bc',
          to: '0xEC1Adf982415D2Ef5ec55899b9Bfb8BC0f29251B',
          value: '0xde0b6b3a7640000', // 1000000000000000000
        };

        global.eth = {
          getCode: sinon.stub().returns('0x'),
        };

        await store.dispatch(updateGasData(mockData));
        expect(store.getState().send.gasLimit).toBe('0x5208');
      });

      it('returns the gasLimit provided by the background when sending to a contract', async () => {
        const mockData = {
          gasPrice: '0x3b9aca00',
          blockGasLimit: '0x6ad79a', // 7002010
          selectedAddress: '0x0DCD5D886577d5081B0c52e242Ef29E70Be3E7bc',
          to: '0xEC1Adf982415D2Ef5ec55899b9Bfb8BC0f29251B',
          value: '0xde0b6b3a7640000', // 1000000000000000000
        };

        global.eth = {
          getCode: sinon.stub().returns('0xff'),
        };

        await store.dispatch(updateGasData(mockData));
        const expectedGasLimit = addHexPrefix(
          addGasBuffer('0x52ac'.toString(16), mockData.blockGasLimit, 1.5),
        );
        expect(store.getState().send.gasLimit).toBe(expectedGasLimit);
      });

      it('sets the error when gas simulation encounters an unknown error in background', async () => {
        const mockData = {
          gasPrice: '0x3b9aca00',
          blockGasLimit: '0x6ad79a', // 7002010
          selectedAddress: '0x0DCD5D886577d5081B0c52e242Ef29E70Be3E7bc',
          to: '0xEC1Adf982415D2Ef5ec55899b9Bfb8BC0f29251B',
          value: '0xbadvalue', // 1000000000000000000
        };

        global.eth = {
          getCode: sinon.stub().returns('0xff'),
        };

        await store.dispatch(updateGasData(mockData));
        expect(store.getState().send.errors.gasLoadingError).toBe(
          'gasLoadingError',
        );
      });

      it('sets the gasLimit when gas simulation encounters a known error in background', async () => {
        const mockData = {
          gasPrice: '0x3b9aca00',
          blockGasLimit: '0x6ad79a', // 7002010
          selectedAddress: '0x0DCD5D886577d5081B0c52e242Ef29E70Be3E7bc',
          to: '0xEC1Adf982415D2Ef5ec55899b9Bfb8BC0f29251B',
          value: '0xgassimfail', // 1000000000000000000
        };

        global.eth = {
          getCode: sinon.stub().returns('0xff'),
        };

        await store.dispatch(updateGasData(mockData));
        const gasEst = multiplyCurrencies(mockData.blockGasLimit, 0.95, {
          multiplicandBase: 16,
          multiplierBase: 10,
          roundDown: '0',
          toNumericBase: 'hex',
        });
        const expectedGasLimit = addHexPrefix(
          addGasBuffer(gasEst.toString(16), mockData.blockGasLimit, 1.5),
        );
        expect(store.getState().send.gasLimit).toBe(expectedGasLimit);
      });
    });
  });
  describe('selectors', () => {
    it('getGasPrice should return gasPrice from state', async () => {
      await store.dispatch(setGasPrice('0x0'));
      expect(getGasPrice(store.getState())).toBe('0x0');
    });

    it('getGasLimit should return gasLimit from state', async () => {
      await store.dispatch(setGasLimit('0x0'));
      expect(getGasLimit(store.getState())).toBe('0x0');
    });

    it('getGasTotal should return gasPrice * gasLimit from state', async () => {
      await store.dispatch(setGasPrice('0x1'));
      await store.dispatch(setGasLimit('0x5208'));
      expect(getGasTotal(store.getState())).toBe('5208');
    });

    it('getSendToken should return token from state', async () => {
      await store.dispatch(
        updateSendToken({ address: '0x000', symbol: 'DAI' }),
      );
      expect(getSendToken(store.getState())).toMatchObject({
        address: '0x000',
        symbol: 'DAI',
      });
    });

    it('getSendTokenAddress should return token.address from state', async () => {
      await store.dispatch(
        updateSendToken({ address: '0x000', symbol: 'DAI' }),
      );
      expect(getSendTokenAddress(store.getState())).toBe('0x000');
    });

    it('getPrimaryCurrency should return token.symbol from state', async () => {
      await store.dispatch(
        updateSendToken({ address: '0x000', symbol: 'DAI' }),
      );
      expect(getPrimaryCurrency(store.getState())).toBe('DAI');
    });

    it('getSendTokenContract should return contract code from EVM', async () => {
      global.eth = {
        contract: () => ({
          at: jest.fn((address) => {
            if (address === '0x000') {
              return '0x000';
            }
            return '0xf';
          }),
        }),
      };
      await store.dispatch(
        updateSendToken({ address: '0x000', symbol: 'DAI' }),
      );
      expect(getSendTokenContract(store.getState())).toBe('0x000');
    });

    it('getSendAmount should return amount from state', async () => {
      await store.dispatch(updateSendAmount('0x0'));
      expect(getSendAmount(store.getState())).toBe('0x0');
    });

    it('getSendHexData should return amount from state', async () => {
      await store.dispatch(updateSendHexData('0x0'));
      expect(getSendHexData(store.getState())).toBe('0x0');
    });

    it('getSendEditingTransactionId should return editingTransactionId from state', async () => {
      store.dispatch(setEditingTransactionId('0'));
      expect(getSendEditingTransactionId(store.getState())).toBe('0');
    });

    it('getSendFrom should return "from" from state', async () => {
      store.dispatch(setSendFrom('0xFF'));
      expect(getSendFrom(store.getState())).toBe('0xFF');
    });

    it('getSendFromObject should return the selected account from state', async () => {
      expect(getSendFromObject(store.getState())).toMatchObject({
        address: '0xab',
        balance: '0x0',
      });
    });

    it('getSendFromBalance should return the selected account from state', async () => {
      expect(getSendFromBalance(store.getState())).toBe('0x0');
    });

    it('getSendMaxModeState should return maxModeOn from state', async () => {
      await store.dispatch(setMaxModeTo(true));
      expect(getSendMaxModeState(store.getState())).toBe(true);
    });

    it('getSendTo should return to from state', async () => {
      await store.dispatch(
        updateSendTo({
          to: '0x0',
        }),
      );
      expect(getSendTo(store.getState())).toBe('0x0');
    });

    it('getSendToNickname should return toNickname from state', async () => {
      await store.dispatch(
        updateSendTo({
          nickname: 'account 1',
        }),
      );
      expect(getSendToNickname(store.getState())).toBe('account 1');
    });

    it('getTokenBalance should return tokenBalance from state', async () => {
      await store.dispatch(setSendTokenBalance('0x10'));
      expect(getTokenBalance(store.getState())).toBe('0x10');
    });

    it('getSendEnsResolution should return ensResolution from state', async () => {
      await store.dispatch(updateSendEnsResolution('0x00ab'));
      expect(getSendEnsResolution(store.getState())).toBe('0x00ab');
    });

    it('getSendEnsResolutionError should return ensResolutionError from state', async () => {
      await store.dispatch(updateSendEnsResolutionError('invalidAddress'));
      expect(getSendEnsResolutionError(store.getState())).toBe(
        'invalidAddress',
      );
    });

    it('getSendErrors should return errors from state', async () => {
      await store.dispatch(updateSendErrors({ gasLoading: 'gasLoadingError' }));
      expect(getSendErrors(store.getState())).toMatchObject({
        gasLoading: 'gasLoadingError',
      });
    });

    it('sendAmountIsInError should return true if amount has an error in state', async () => {
      await store.dispatch(updateSendErrors({ amount: 'insufficientFunds' }));
      expect(sendAmountIsInError(store.getState())).toBe(true);
    });

    it('getGasLoadingErrors should return gasLoading error from state', async () => {
      await store.dispatch(updateSendErrors({ gasLoading: 'gasLoadingError' }));
      expect(getGasLoadingError(store.getState())).toBe('gasLoadingError');
    });

    it('getFeeIsInError should return true if amount has an error in state', async () => {
      await store.dispatch(updateSendErrors({ gasFee: 'minimumLimitError' }));
      expect(gasFeeIsInError(store.getState())).toBe(true);
    });

    it('isSendFormInError should return true if any errors exist in state', async () => {
      await store.dispatch(updateSendErrors({ gasFee: 'minimumLimitError' }));
      expect(isSendFormInError(store.getState())).toBe(true);
    });

    it('getGasButtonGroupShown should return gasButtonGroupShown from state', async () => {
      await store.dispatch(showGasButtonGroup());
      expect(getGasButtonGroupShown(store.getState())).toBe(true);
    });

    describe('getTitleKey', () => {
      it('should return "addRecipient" when no to address specified', () => {
        expect(getTitleKey(store.getState())).toBe('addRecipient');
      });

      it('should return "send" if not sending token and not currently editing id', async () => {
        await store.dispatch(
          updateSendTo({ to: '0x00', nickname: 'account 1' }),
        );
        expect(getTitleKey(store.getState())).toBe('send');
      });

      it('should return "sendTokens" if sending token and not currently editing id', async () => {
        await store.dispatch(
          updateSendTo({ to: '0x00', nickname: 'account 1' }),
        );
        await store.dispatch(
          updateSendToken({ address: '0xff', symbol: 'TST' }),
        );
        expect(getTitleKey(store.getState())).toBe('sendTokens');
      });

      it('should return "edit" if currently editing id', async () => {
        await store.dispatch(setEditingTransactionId('0'));
        await store.dispatch(
          updateSendTo({ to: '0x00', nickname: 'account 1' }),
        );
        expect(getTitleKey(store.getState())).toBe('edit');
      });
    });
  });
});
