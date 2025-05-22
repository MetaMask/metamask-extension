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
import { isHexEqual } from '../../../shared/lib/delegation/utils';

import { encodeRedeemDelegations } from '../../../shared/lib/delegation/delegation';
import {
  DailyAllowanceMetadata,
  REMOTE_MODES,
} from '../../../shared/lib/remote-mode';
import { ControllerFlatState } from '../controller-init/controller-list';

import { merge } from 'lodash';
import { getManifestFlags } from '../../../shared/lib/manifestFlags';

export const getRemoteModeEnabled = (state: ControllerFlatState) => {
  const manifestFlags = getManifestFlags().remoteFeatureFlags;
  const stateFlags = state.remoteFeatureFlags;
  const flags = merge({}, manifestFlags, stateFlags);
  return Boolean(flags.vaultRemoteMode);
};

export const isExistingAccount = ({
  state,
  address,
}: {
  state: ControllerFlatState;
  address: string;
}) => {
  const { accounts } = state.internalAccounts;
  return Object.values(accounts).some((account) => account.address === address);
};

export const getDailyAllowance = ({
  state,
  address,
  chainId,
}: {
  state: ControllerFlatState;
  address: Hex;
  chainId: Hex;
}) => {
  const entries = Object.values(state.delegations);
  const dailyAllowance = entries.find(
    (e) =>
      isHexEqual(address, e.delegation.delegator) &&
      isHexEqual(chainId, e.chainId) &&
      e.tags.includes(REMOTE_MODES.DAILY_ALLOWANCE),
  );

  return dailyAllowance;
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

  if (transactionAmount > allowanceAmount) {
    return undefined;
  }

  const execution: ExecutionStruct = {
    value: transactionAmount,
    target: transactionMeta.txParams.to as `0x${string}`,
    callData: (transactionMeta.txParams.data ?? '0x') as Hex,
  };

  // TODO: When using the multiTokenPeriod, you should add the index of the token that you want use in caveats[index].args
  const updatedData = encodeRedeemDelegations({
    delegations: [[delegation]],
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
      try {
        const result = prepareDailyAllowanceTransaction({
          transactionMeta,
          state,
        });
        if (!result) {
          return Promise.resolve({ updateTransaction: undefined });
        }
        const { updatedFrom, updatedTo, updatedData } = result;
        return Promise.resolve({
          updateTransaction: buildUpdateTransaction({
            updatedFrom,
            updatedTo,
            updatedData,
          }),
        });
      } catch (error) {
        console.error('Error preparing daily allowance transaction', error);
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
