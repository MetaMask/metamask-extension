import { AssetType } from '@metamask/bridge-controller';
import {
  TransactionType,
  type AfterAddHook,
  type TransactionMeta,
} from '@metamask/transaction-controller';
import { Hex, hexToBigInt, hexToNumber } from '@metamask/utils';
import { Interface, parseEther } from 'ethers/lib/utils';
import { merge } from 'lodash';
import {
  ExecutionStruct,
  SINGLE_DEFAULT_MODE,
} from '../../../shared/lib/delegation';
import { getDeleGatorEnvironment } from '../../../shared/lib/delegation/environment';
import { isHexEqual, toHex } from '../../../shared/lib/delegation/utils';

import { encodeRedeemDelegations } from '../../../shared/lib/delegation/delegation';
import {
  ABI_SWAP_BY_DELEGATION,
  DailyAllowanceMetadata,
  NATIVE_ADDRESS,
  REMOTE_MODES,
  SwapAllowanceMetadata,
} from '../../../shared/lib/remote-mode';
import { ControllerFlatState } from '../controller-init/controller-list';

import { getManifestFlags } from '../../../shared/lib/manifestFlags';

export const getRemoteModeEnabled = (state: ControllerFlatState) => {
  const manifestFlags = getManifestFlags().remoteFeatureFlags;
  const stateFlags = state.remoteFeatureFlags;
  const flags = merge({}, stateFlags, manifestFlags);
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

export const getSwapAllowance = ({
  state,
  address,
  chainId,
  tokenFrom,
  tokenTo,
}: {
  state: ControllerFlatState;
  address: Hex;
  chainId: Hex;
  tokenFrom: string;
  tokenTo: string;
}) => {
  const entries = Object.values(state.delegations);
  const swapAllowance = entries.find((e) => {
    /* if (!e.meta) {
      return false;
    }
    const meta = JSON.parse(e.meta) as SwapAllowanceMetadata;
    const allowance = meta.allowances.find((a) => {
      return a.from === tokenFrom && a.to === tokenTo;
    });

    if (!allowance) {
      return false;
    } */

    return (
      isHexEqual(address, e.delegation.delegator) &&
      isHexEqual(chainId, e.chainId) &&
      e.tags.includes(REMOTE_MODES.SWAP)
    );
  });

  return swapAllowance;
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

export const updateRemoteModeTransaction = async ({
  transactionMeta,
  state,
}: {
  transactionMeta: TransactionMeta;
  state: ControllerFlatState;
}): Promise<ReturnType<AfterAddHook>> => {
  const isRemoteModeEnabled = getRemoteModeEnabled(state);
  if (!isRemoteModeEnabled) {
    return { updateTransaction: undefined };
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
          return { updateTransaction: undefined };
        }
        const { updatedFrom, updatedTo, updatedData } = result;
        return {
          updateTransaction: buildUpdateTransaction({
            updatedFrom,
            updatedTo,
            updatedData,
          }),
        };
      } catch (error) {
        console.error('Error preparing daily allowance transaction', error);
        return { updateTransaction: undefined };
      }
    }

    case TransactionType.swap: {
      // DelegationMetaSwapAdapter
      // Ethereum Mainnet: 0xe41eB5A3F6e35f1A8C77113F372892D09820C3fD
      // Optimism, Base, Arbitrum, Linea: 0x5e4b49156D23D890e7DC264c378a443C2d22A80E
      // BSC, Polygon: 0x9c06653D3f1A331eAf4C3833F7235156e47305F1

      console.log('executing swap', transactionMeta);

      const { signature, sigExpiration, apiData } = transactionMeta;
      const delegationMetaSwapAdapter =
        '0xe41eB5A3F6e35f1A8C77113F372892D09820C3fD';

      const allowance = getSwapAllowance({
        state,
        address: transactionMeta.txParams.from as Hex,
        chainId: transactionMeta.chainId,
        tokenFrom: transactionMeta.swapMetaData?.token_from,
        tokenTo: transactionMeta.swapMetaData?.token_to,
      });

      if (!allowance) {
        return { updateTransaction: undefined };
      }

      const { delegation } = allowance;

      const swapByDelegationInterface = new Interface(ABI_SWAP_BY_DELEGATION);
      const encodedSwapData = swapByDelegationInterface.encodeFunctionData(
        'swapByDelegation',
        [
          {
            apiData,
            expiration: sigExpiration,
            signature,
          },
          [delegation],
          true,
        ],
      ) as Hex;

      const updatedFrom = delegation.delegate;
      const updatedTo = delegationMetaSwapAdapter;
      const updatedData = encodedSwapData;

      try {
        return Promise.resolve({
          updateTransaction: buildUpdateTransaction({
            updatedFrom: updatedFrom as `0x${string}`,
            updatedTo: updatedTo as `0x${string}`,
            updatedData,
          }),
        });
      } catch (error) {
        console.error('Error encoding redeemDelegations', error);
        return Promise.resolve({ updateTransaction: undefined });
      }

      return Promise.resolve({ updateTransaction: undefined });
    }

    default:
      return { updateTransaction: undefined };
  }
};
