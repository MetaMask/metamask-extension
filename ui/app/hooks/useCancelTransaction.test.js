import assert from 'assert';
import * as reactRedux from 'react-redux';
import { renderHook } from '@testing-library/react-hooks';
import sinon from 'sinon';
import transactions from '../../../test/data/transaction-data.json';
import { getConversionRate, getSelectedAccount } from '../selectors';
import { showModal } from '../store/actions';
import { increaseLastGasPrice } from '../helpers/utils/confirm-tx.util';
import * as actionConstants from '../store/actionConstants';
import { useCancelTransaction } from './useCancelTransaction';

describe('useCancelTransaction', function () {
  let useSelector;
  const dispatch = sinon.spy();

  before(function () {
    sinon.stub(reactRedux, 'useDispatch').returns(dispatch);
  });

  afterEach(function () {
    dispatch.resetHistory();
  });

  describe('when account has insufficient balance to cover gas', function () {
    before(function () {
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
        assert.strictEqual(result.current[0], false);
      });
      it(`should return a function that opens the gas sidebar onsubmit kicks off cancellation for id ${transactionId}`, function () {
        const { result } = renderHook(() =>
          useCancelTransaction(transactionGroup),
        );
        assert.strictEqual(typeof result.current[1], 'function');
        result.current[1]({
          preventDefault: () => undefined,
          stopPropagation: () => undefined,
        });
        const dispatchAction = dispatch.args;

        // calls customize-gas sidebar
        // also check type= customize-gas
        assert.strictEqual(
          dispatchAction[dispatchAction.length - 1][0].type,
          actionConstants.SIDEBAR_OPEN,
        );

        assert.strictEqual(
          dispatchAction[dispatchAction.length - 1][0].value.props.transaction
            .id,
          transactionId,
        );

        // call onSubmit myself
        dispatchAction[dispatchAction.length - 1][0].value.props.onSubmit(
          '0x5208',
          '0x1',
        );

        assert.strictEqual(
          dispatch.calledWith(
            showModal({
              name: 'CANCEL_TRANSACTION',
              transactionId,
              newGasFee: '0x5208',
              defaultNewGasPrice: '0x1',
              gasLimit: '0x5208',
            }),
          ),
          true,
        );
      });
    });
    after(function () {
      useSelector.restore();
    });
  });

  describe('when account has sufficient balance to cover gas', function () {
    before(function () {
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
        assert.strictEqual(result.current[0], true);
      });
      it(`should return a function that opens the gas sidebar onsubmit kicks off cancellation for id ${transactionId}`, function () {
        const { result } = renderHook(() =>
          useCancelTransaction(transactionGroup),
        );
        assert.strictEqual(typeof result.current[1], 'function');
        result.current[1]({
          preventDefault: () => undefined,
          stopPropagation: () => undefined,
        });
        const dispatchAction = dispatch.args;

        assert.strictEqual(
          dispatchAction[dispatchAction.length - 1][0].type,
          actionConstants.SIDEBAR_OPEN,
        );
        assert.strictEqual(
          dispatchAction[dispatchAction.length - 1][0].value.props.transaction
            .id,
          transactionId,
        );

        dispatchAction[dispatchAction.length - 1][0].value.props.onSubmit(
          '0x5208',
          '0x1',
        );

        assert.strictEqual(
          dispatch.calledWith(
            showModal({
              name: 'CANCEL_TRANSACTION',
              transactionId,
              newGasFee: '0x5208',
              defaultNewGasPrice: '0x1',
              gasLimit: '0x5208',
            }),
          ),
          true,
        );
      });
    });
    after(function () {
      useSelector.restore();
    });
  });

  after(function () {
    sinon.restore();
  });
});
