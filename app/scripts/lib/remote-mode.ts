import { AssetType } from '@metamask/bridge-controller';
import {
  TransactionType,
  type AfterAddHook,
  type TransactionMeta,
} from '@metamask/transaction-controller';
import { Hex, hexToBigInt, hexToNumber } from '@metamask/utils';
import { parseEther } from 'ethers/lib/utils';
import {
  ExecutionStruct,
  SINGLE_DEFAULT_MODE,
} from '../../../shared/lib/delegation';
import { getDeleGatorEnvironment } from '../../../shared/lib/delegation/environment';
import { isHexEqual, toHex } from '../../../shared/lib/delegation/utils';

import { encodeRedeemDelegations } from '../../../shared/lib/delegation/delegation';
import {
  DailyAllowanceMetadata,
  NATIVE_ADDRESS,
} from '../../../shared/lib/remote-mode';
import { ControllerFlatState } from '../controller-init/controller-list';
import {
  getDailyAllowance,
  getRemoteModeEnabled,
  isExistingAccount,
} from '../../../shared/modules/selectors/remote-mode';

const hasEnoughAllowance = (
  allowanceAmount: bigint,
  transactionAmount: bigint,
): boolean => {
  return allowanceAmount >= transactionAmount;
};

const buildUpdateTransaction = ({
  updatedFrom,
  updatedTo,
  updatedData,
}: {
  updatedFrom: Hex;
  updatedTo: Hex;
  updatedData: string;
}) => {
  return (txMeta: TransactionMeta) => {
    txMeta.txParams.maxFeePerGas = undefined;
    txMeta.txParams.maxPriorityFeePerGas = undefined;
    txMeta.txParams.gas = undefined;
    txMeta.txParams.data = updatedData;
    txMeta.txParams.from = updatedFrom;
    txMeta.txParams.to = updatedTo;
    txMeta.txParams.value = undefined;
  };
};

const prepareDailyAllowanceTransaction = ({
  transactionMeta,
  state,
}: {
  transactionMeta: TransactionMeta;
  state: ControllerFlatState;
}) => {
  const dailyAllowance = getDailyAllowance({
    address: transactionMeta.txParams.from as Hex,
    chainId: transactionMeta.chainId,
    state,
  });
  if (!dailyAllowance) {
    return undefined;
  }

  const { delegation, meta } = dailyAllowance;

  if (!isExistingAccount({ state, address: delegation.delegate })) {
    return undefined;
  }

  if (!meta) {
    return undefined;
  }

  const dailyAllowanceMetadata = JSON.parse(meta) as DailyAllowanceMetadata;

  let allowance;
  if (transactionMeta.type === TransactionType.tokenMethodTransfer) {
    allowance = dailyAllowanceMetadata.allowances.find((a) =>
      isHexEqual(a.address as Hex, transactionMeta.txParams.to as Hex),
    );
  } else {
    allowance = dailyAllowanceMetadata.allowances.find(
      (a) => a.type === AssetType.native,
    );
  }

  if (!allowance) {
    return undefined;
  }

  const allowanceAmount = parseEther(allowance.amount.toString()).toBigInt();
  const transactionAmount = transactionMeta.txParams.value
    ? hexToBigInt(transactionMeta.txParams.value)
    : BigInt(0);

  if (!hasEnoughAllowance(allowanceAmount, transactionAmount)) {
    return undefined;
  }

  const execution: ExecutionStruct = {
    value: transactionAmount,
    target: transactionMeta.txParams.to as `0x${string}`,
    callData: (transactionMeta.txParams.data ?? '0x') as Hex,
  };

  const tokenIndex = dailyAllowanceMetadata.allowances.findIndex((a) =>
    transactionMeta.type === TransactionType.simpleSend
      ? isHexEqual(a.address as Hex, NATIVE_ADDRESS)
      : isHexEqual(a.address as Hex, transactionMeta.txParams.to as Hex),
  );

  if (tokenIndex === -1) {
    return undefined;
  }

  const updatedCaveat = {
    ...delegation.caveats[0],
    args: toHex(tokenIndex, { size: 32 }),
  };

  const updatedDelegation = {
    ...delegation,
    caveats: [updatedCaveat],
  };

  // TODO: When using the multiTokenPeriod, you should add the index of the token that you want use in caveats[index].args
  const updatedData = encodeRedeemDelegations({
    delegations: [[updatedDelegation]],
    modes: [SINGLE_DEFAULT_MODE],
    executions: [[execution]],
  });
  const updatedFrom = delegation.delegate;
  const updatedTo = getDeleGatorEnvironment(
    hexToNumber(transactionMeta.chainId),
  ).DelegationManager;

  return {
    updatedFrom,
    updatedTo,
    updatedData,
  };
};

export const updateRemoteModeTransaction = ({
  transactionMeta,
  state,
}: {
  transactionMeta: TransactionMeta;
  state: ControllerFlatState;
}): ReturnType<AfterAddHook> => {
  const isRemoteModeEnabled = getRemoteModeEnabled(state);
  if (!isRemoteModeEnabled) {
    return Promise.resolve({ updateTransaction: undefined });
  }

  switch (transactionMeta.type) {
    // Send
    case TransactionType.simpleSend:
    case TransactionType.tokenMethodTransfer: {
      const result = prepareDailyAllowanceTransaction({
        transactionMeta,
        state,
      });
      if (!result) {
        return Promise.resolve({ updateTransaction: undefined });
      }
      const { updatedFrom, updatedTo, updatedData } = result;
      try {
        return Promise.resolve({
          updateTransaction: buildUpdateTransaction({
            updatedFrom,
            updatedTo,
            updatedData,
          }),
        });
      } catch (error) {
        console.error('Error encoding redeemDelegations', error);
        return Promise.resolve({ updateTransaction: undefined });
      }
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
