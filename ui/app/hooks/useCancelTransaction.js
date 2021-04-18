import { useDispatch, useSelector } from 'react-redux';
import { useCallback } from 'react';
import { addHexPrefix } from 'ethereumjs-util';
import { showModal, showSidebar } from '../store/actions';
import { isBalanceSufficient } from '../pages/send/send.utils';
import {
  getHexGasTotal,
  increaseLastGasPrice,
} from '../helpers/utils/confirm-tx.util';
import { getConversionRate, getSelectedAccount } from '../selectors';
import {
  setCustomGasLimit,
  setCustomGasPriceForRetry,
} from '../ducks/gas/gas.duck';
import { multiplyCurrencies } from '../helpers/utils/conversion-util';

/**
 * Determine whether a transaction can be cancelled and provide a method to
 * kick off the process of cancellation.
 *
 * Provides a reusable hook that, given a transactionGroup, will return
 * whether or not the account has enough funds to cover the gas cancellation
 * fee, and a method for beginning the cancellation process
 * @param {Object} transactionGroup
 * @return {[boolean, Function]}
 */
export function useCancelTransaction(transactionGroup) {
  const { primaryTransaction } = transactionGroup;
  const gasPrice = primaryTransaction.txParams?.gasPrice?.startsWith('-')
    ? '0x0'
    : primaryTransaction.txParams?.gasPrice;
  const transaction = primaryTransaction;
  const dispatch = useDispatch();
  const selectedAccount = useSelector(getSelectedAccount);
  const conversionRate = useSelector(getConversionRate);
  const defaultNewGasPrice = addHexPrefix(
    multiplyCurrencies(gasPrice, 1.1, {
      toNumericBase: 'hex',
      multiplicandBase: 16,
      multiplierBase: 10,
    }),
  );

  const cancelTransaction = useCallback(
    (event) => {
      event.stopPropagation();
      dispatch(setCustomGasLimit('0x5208'));
      dispatch(setCustomGasPriceForRetry(defaultNewGasPrice));
      const tx = {
        ...transaction,
        txParams: {
          ...transaction.txParams,
          gas: '0x5208',
          value: '0x0',
        },
      };
      return dispatch(
        showSidebar({
          transitionName: 'sidebar-left',
          type: 'customize-gas',
          props: {
            transaction: tx,
            onSubmit: (newGasLimit, newGasPrice) => {
              const userCustomizedGasTotal = getHexGasTotal({
                gasPrice: newGasPrice,
                gasLimit: newGasLimit,
              });
              dispatch(
                showModal({
                  name: 'CANCEL_TRANSACTION',
                  newGasFee: userCustomizedGasTotal,
                  transactionId: transaction.id,
                  defaultNewGasPrice: newGasPrice,
                  gasLimit: newGasLimit,
                }),
              );
            },
          },
        }),
      );
    },
    [dispatch, transaction, defaultNewGasPrice],
  );

  const hasEnoughCancelGas =
    primaryTransaction.txParams &&
    isBalanceSufficient({
      amount: '0x0',
      gasTotal: getHexGasTotal({
        gasPrice: increaseLastGasPrice(gasPrice),
        gasLimit: primaryTransaction.txParams.gas,
      }),
      balance: selectedAccount.balance,
      conversionRate,
    });

  return [hasEnoughCancelGas, cancelTransaction];
}
