import { useDispatch, useSelector } from 'react-redux';
import { useCallback } from 'react';
import { showModal, showSidebar } from '../store/actions';
import { isBalanceSufficient } from '../pages/send/send.utils';
import { getSelectedAccount, getIsMainnet } from '../selectors';
import { getConversionRate } from '../ducks/metamask/metamask';

import {
  setCustomGasLimit,
  setCustomGasPriceForRetry,
} from '../ducks/gas/gas.duck';
import { GAS_LIMITS } from '../../shared/constants/gas';
import { isLegacyTransaction } from '../../shared/modules/transaction.utils';
import { getMaximumGasTotalInHexWei } from '../../shared/modules/gas.utils';
import { useIncrementedGasFees } from './useIncrementedGasFees';

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

  const customGasSettings = useIncrementedGasFees(transactionGroup);

  const dispatch = useDispatch();
  const selectedAccount = useSelector(getSelectedAccount);
  const conversionRate = useSelector(getConversionRate);
  const isMainnet = useSelector(getIsMainnet);
  const hideBasic = !(isMainnet || process.env.IN_TEST);
  const cancelTransaction = useCallback(
    (event) => {
      event.stopPropagation();
      if (isLegacyTransaction(primaryTransaction)) {
        // To support the current process of cancelling or speeding up
        // a transaction, we have to inform the custom gas state of the new
        // gasPrice/gasLimit to start at.
        dispatch(setCustomGasPriceForRetry(customGasSettings.gasPrice));
        dispatch(setCustomGasLimit(GAS_LIMITS.SIMPLE));
      }
      const tx = {
        ...primaryTransaction,
        txParams: {
          ...primaryTransaction.txParams,
          gas: GAS_LIMITS.SIMPLE,
          value: '0x0',
        },
      };
      return dispatch(
        showSidebar({
          transitionName: 'sidebar-left',
          type: 'customize-gas',
          props: {
            hideBasic,
            transaction: tx,
            onSubmit: (newGasSettings) => {
              const userCustomizedGasTotal = getMaximumGasTotalInHexWei(
                newGasSettings,
              );
              dispatch(
                showModal({
                  name: 'CANCEL_TRANSACTION',
                  newGasFee: userCustomizedGasTotal,
                  transactionId: primaryTransaction.id,
                  customGasSettings: newGasSettings,
                }),
              );
            },
          },
        }),
      );
    },
    [dispatch, primaryTransaction, customGasSettings, hideBasic],
  );

  const hasEnoughCancelGas =
    primaryTransaction.txParams &&
    isBalanceSufficient({
      amount: '0x0',
      gasTotal: getMaximumGasTotalInHexWei(customGasSettings),
      balance: selectedAccount.balance,
      conversionRate,
    });

  return [hasEnoughCancelGas, cancelTransaction];
}
