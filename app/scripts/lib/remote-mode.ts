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

import { encodeRedeemDelegations, encodeDelegation } from '../../../shared/lib/delegation/delegation';
import { DailyAllowanceMetadata } from '../../../shared/lib/remote-mode';
import { ControllerFlatState } from '../controller-init/controller-list';
import {
  getDailyAllowance,
  getRemoteModeEnabled,
  isExistingAccount,
} from '../../../shared/modules/selectors/remote-mode';
import { Interface, ParamType, defaultAbiCoder } from '@ethersproject/abi';

const ABI_SWAP_BY_DELEGATION = [
  {
    "type": "function",
    "name": "swapByDelegation",
    "inputs": [
      {
        "name": "_signatureData",
        "type": "tuple",
        "internalType": "struct DelegationMetaSwapAdapter.SignatureData",
        "components": [
          {
            "name": "apiData",
            "type": "bytes",
            "internalType": "bytes"
          },
          {
            "name": "expiration",
            "type": "uint256",
            "internalType": "uint256"
          },
          {
            "name": "signature",
            "type": "bytes",
            "internalType": "bytes"
          }
        ]
      },
      {
        "name": "_delegations",
        "type": "tuple[]",
        "internalType": "struct Delegation[]",
        "components": [
          {
            "name": "delegate",
            "type": "address",
            "internalType": "address"
          },
          {
            "name": "delegator",
            "type": "address",
            "internalType": "address"
          },
          {
            "name": "authority",
            "type": "bytes32",
            "internalType": "bytes32"
          },
          {
            "name": "caveats",
            "type": "tuple[]",
            "internalType": "struct Caveat[]",
            "components": [
              {
                "name": "enforcer",
                "type": "address",
                "internalType": "address"
              },
              {
                "name": "terms",
                "type": "bytes",
                "internalType": "bytes"
              },
              {
                "name": "args",
                "type": "bytes",
                "internalType": "bytes"
              }
            ]
          },
          {
            "name": "salt",
            "type": "uint256",
            "internalType": "uint256"
          },
          {
            "name": "signature",
            "type": "bytes",
            "internalType": "bytes"
          }
        ]
      },
      {
        "name": "_useTokenWhitelist",
        "type": "bool",
        "internalType": "bool"
      }
    ],
    "outputs": [],
    "stateMutability": "nonpayable"
  },
];

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

    // TODO: confirm if / when approval is needed
    // case TransactionType.swapApproval: {
    //   return Promise.resolve({ updateTransaction: undefined });
    // }

    case TransactionType.swap: {

      // DelegationMetaSwapAdapter
      // Ethereum Mainnet: 0xe41eB5A3F6e35f1A8C77113F372892D09820C3fD
      // Optimism, Base, Arbitrum, Linea: 0x5e4b49156D23D890e7DC264c378a443C2d22A80E
      // BSC, Polygon: 0x9c06653D3f1A331eAf4C3833F7235156e47305F1

      debugger;

      console.log('executing swap', transactionMeta);

      const { signature, sigExpiration, apiData } = transactionMeta;
      const delegationMetaSwapAdapter = "0xe41eB5A3F6e35f1A8C77113F372892D09820C3fD";

      // TODO: replace with actual delegation
      const delegation = {
        "authority": "0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff",
        "caveats": [],
        "delegate": "0x8b869762be0a63ce02ddeec2ea1d83d2a82cbf79",
        "delegator": "0x8b869762be0a63ce02ddeec2ea1d83d2a82cbf79",
        "salt": "0x83fb4522",
        "signature": "0x1e763b2f03a2b7282a8980c66bd9852b0aa7d256b539b0868d8c6e7fa7ef9b904ba731544b9c8e08e1d03535a3c1af631a17014fc73c1a3c919c7c20fa7df52f1c"
      };

      const swapByDelegationInterface = new Interface(ABI_SWAP_BY_DELEGATION);
      const encodedSwapData = swapByDelegationInterface.encodeFunctionData('swapByDelegation', [
        {
          apiData: apiData,
          expiration: sigExpiration,
          signature: signature
        },
        [
          delegation
        ],
        true
      ]) as Hex;

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
