import { DelegationController } from '@metamask/delegation-controller';
import {
  TransactionType,
  type AfterAddHook,
  type TransactionMeta,
} from '@metamask/transaction-controller';
import { hexToBigInt, hexToNumber } from '@metamask/utils';
import { parseEther } from 'ethers/lib/utils';
import { getDeleGatorEnvironment } from '../../../shared/lib/delegation/environment';
import { SINGLE_DEFAULT_MODE } from '../../../shared/lib/delegation';
import { isHexEqual } from '../../../shared/lib/delegation/utils';
import {
  DailyAllowance,
  REMOTE_MODES,
} from '../../../ui/pages/remote-mode/remote.types';
import { encodeRedeemDelegations } from '../../../shared/lib/delegation/delegation';

type DailyAllowanceMetadata = {
  allowances: DailyAllowance[];
};

export const updateRemoteModeTransaction = ({
  delegationController,
  transactionMeta,
}: {
  delegationController: DelegationController;
  transactionMeta: TransactionMeta;
}): ReturnType<AfterAddHook> => {
  console.log(transactionMeta);
  console.log(
    'delegationController.state.delegations',
    delegationController.state.delegations,
  );
  console.log('transactionMeta.type', transactionMeta.type);
  switch (transactionMeta.type) {
    // Send
    case TransactionType.simpleSend:
    case TransactionType.tokenMethodTransfer: {
      console.log(
        'delegationController.state.delegations',
        delegationController.state.delegations,
      );
      const entries = Object.values(delegationController.state.delegations);
      const entry = entries.filter(
        (e) =>
          isHexEqual(
            transactionMeta.txParams.from as `0x${string}`,
            e.delegation.delegator,
          ) && isHexEqual(transactionMeta.chainId, e.chainId),
      )[0];
      console.log('entry', entry);
      if (!entry) {
        return Promise.resolve({ updateTransaction: undefined });
      }
      console.log('entry', entry);
      const hasDailyAllowanceMode = entry.tags.includes(
        REMOTE_MODES.DAILY_ALLOWANCE,
      );
      console.log('hasDailyAllowanceMode', hasDailyAllowanceMode);
      if (!hasDailyAllowanceMode) {
        return Promise.resolve({ updateTransaction: undefined });
      }

      console.log('entry.meta', entry.meta);
      if (!entry.meta) {
        return Promise.resolve({ updateTransaction: undefined });
      }

      const dailyAllowanceMetadata = JSON.parse(
        entry.meta,
      ) as DailyAllowanceMetadata;
      console.log('metadata', dailyAllowanceMetadata);

      const transactionAmount = transactionMeta.txParams.value;

      // Native ETH send
      if (
        transactionMeta.type === TransactionType.simpleSend &&
        transactionMeta.txParams.data === '0x'
      ) {
        const ethAllowance = dailyAllowanceMetadata.allowances.find(
          (a) => a.tokenType === 'ETH',
        );
        if (!ethAllowance || !transactionAmount) {
          return Promise.resolve({ updateTransaction: undefined });
        }

        if (
          parseEther(ethAllowance.amount.toString()).toBigInt() <
          hexToBigInt(transactionAmount)
        ) {
          console.log('not enough allowance');
          return Promise.resolve({ updateTransaction: undefined });
        }

        const { delegation } = entry;

        // TODO: Check if delegate is a valid account
        const updatedFrom = entry.delegation.delegate;
        const updatedTo = getDeleGatorEnvironment(
          hexToNumber(transactionMeta.chainId),
        ).DelegationManager;
        try {
          const updatedData = encodeRedeemDelegations({
            delegations: [[delegation]],
            modes: [SINGLE_DEFAULT_MODE],
            executions: [
              [
                {
                  target: transactionMeta.txParams.to as `0x${string}`,
                  value: hexToBigInt(transactionAmount),
                  callData: '0x',
                },
              ],
            ],
          });
          console.log('has enough allowance');
          // Change the transaction to be sent from the delegate and update data to be redeemDelegations
          return Promise.resolve({
            updateTransaction: (txMeta) => {
              txMeta.txParams.maxFeePerGas = undefined;
              txMeta.txParams.maxPriorityFeePerGas = undefined;
              txMeta.txParams.gas = undefined;
              txMeta.txParams.data = updatedData;
              txMeta.txParams.from = updatedFrom;
              txMeta.txParams.to = updatedTo;
              txMeta.txParams.value = undefined;
              // txMeta.type = updatedTransactionType;
              // txMeta.delegationAddress = undefined;
            },
          });
        } catch (error) {
          console.error('Error encoding redeemDelegations', error);
          return Promise.resolve({ updateTransaction: undefined });
        }
      }
      break;
    }

    // TODO: Swap
    default:
      return Promise.resolve({ updateTransaction: undefined });
  }
  // TODO:
  // - Check if transaction is from HW wallet
  // - Check if HW wallet has remote mode delegations
  // - Check that delegate account is present in wallet
  // - Check if transaction is Send or Swap
  // - Then check allowances to make sure it's allowed
  // - If everything matches, then return a function to update the transaction to
  //   a new txMeta with a `redeemDelegations` operation
  // - If any of the checks fails, don't return an update function (i.e., tx should not be modified)
  return Promise.resolve({ updateTransaction: undefined });
};
