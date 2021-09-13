import * as reactRedux from 'react-redux';
import { renderHook } from '@testing-library/react-hooks';
import sinon from 'sinon';
import transactions from '../../test/data/transaction-data.json';
import { getConversionRate, getSelectedAccount } from '../selectors';
import { increaseLastGasPrice } from '../helpers/utils/confirm-tx.util';
import { useCancelTransaction } from './useCancelTransaction';

jest.mock('../store/actions', () => ({
  disconnectGasFeeEstimatePoller: jest.fn(),
  getGasFeeEstimatesAndStartPolling: jest
    .fn()
    .mockImplementation(() => Promise.resolve()),
  addPollingTokenToAppState: jest.fn(),
}));

describe('useCancelTransaction', function () {
  let useSelector;
  const dispatch = sinon.spy();

  beforeAll(function () {
    sinon.stub(reactRedux, 'useDispatch').returns(dispatch);
  });

  afterEach(function () {
    dispatch.resetHistory();
  });

  afterAll(function () {
    sinon.restore();
  });

  describe('when account has insufficient balance to cover gas', function () {
    beforeAll(function () {
      useSelector = sinon.stub(reactRedux, 'useSelector');
      useSelector.callsFake((selector) => {
        if (selector === getConversionRate) {
          return 280.46;
        } else if (selector === getSelectedAccount) {
          return {
            balance: '0x3',
          };
        }
        return undefined;
      });
    });
    afterAll(function () {
      useSelector.restore();
    });
    transactions.forEach((transactionGroup) => {
      const originalGasPrice =
        transactionGroup.primaryTransaction.txParams?.gasPrice;
      const gasPrice =
        originalGasPrice && increaseLastGasPrice(originalGasPrice);
      const transactionId = transactionGroup.initialTransaction.id;
      it(`should indicate account has insufficient funds to cover ${gasPrice} gas price`, function () {
        const { result } = renderHook(() =>
          useCancelTransaction(transactionGroup),
        );
        expect(result.current.hasEnoughCancelGas).toStrictEqual(false);
      });
      it(`should return a function that kicks off cancellation for id ${transactionId}`, function () {
        const { result } = renderHook(() =>
          useCancelTransaction(transactionGroup),
        );
        expect(typeof result.current.cancelTransaction).toStrictEqual(
          'function',
        );
      });
    });
  });

  describe('when account has sufficient balance to cover gas', function () {
    beforeAll(function () {
      useSelector = sinon.stub(reactRedux, 'useSelector');
      useSelector.callsFake((selector) => {
        if (selector === getConversionRate) {
          return 280.46;
        } else if (selector === getSelectedAccount) {
          return {
            balance: '0x9C2007651B2500000',
          };
        }
        return undefined;
      });
    });

    afterAll(function () {
      useSelector.restore();
    });

    transactions.forEach((transactionGroup) => {
      const originalGasPrice =
        transactionGroup.primaryTransaction.txParams?.gasPrice;
      const gasPrice =
        originalGasPrice && increaseLastGasPrice(originalGasPrice);
      const transactionId = transactionGroup.initialTransaction.id;
      it(`should indicate account has funds to cover ${gasPrice} gas price`, function () {
        const { result } = renderHook(() =>
          useCancelTransaction(transactionGroup),
        );
        expect(result.current.hasEnoughCancelGas).toStrictEqual(true);
      });
      it(`should return a function that opens the gas popover onsubmit kicks off cancellation for id ${transactionId}`, function () {
        const { result } = renderHook(() =>
          useCancelTransaction(transactionGroup),
        );
        expect(typeof result.current.cancelTransaction).toStrictEqual(
          'function',
        );
      });
    });
  });
});
