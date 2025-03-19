import {
  createCaveatBuilder,
  createRootDelegation,
  DelegationFramework,
  ExecutionMode,
  ExecutionStruct,
  SINGLE_DEFAULT_MODE,
  type CaveatStruct,
  type DelegationStruct,
  type DeleGatorEnvironment,
} from '@metamask-private/delegator-core-viem';
import type {
  SimulationData,
  TransactionParams,
} from '@metamask/transaction-controller';
import { createProjectLogger } from '@metamask/utils';
import { encodePacked, type Address, type Hex } from 'viem';

const log = createProjectLogger('enforce-simulation-hook');

// These are deployed on Sepolia at the addresses below
const NATIVE_TOKEN_MAX_LOSS_ENFORCER_ADDRESS =
  '0x8F0473C57495b99c9649baD5d1916BF83d43736a';
const ERC20_MAX_LOSS_ENFORCER_ADDRESS =
  '0x69049A17a68FaDB939173287D9bd814a4E81779C';

function generateSalt(): Hex {
  return `0x${BigInt(Math.floor(Math.random() * 1000000)).toString(16)}`;
}

function nativeTokenMaxLossBuilder(
  _: DeleGatorEnvironment,
  address: Address,
  amount: bigint,
): CaveatStruct {
  return {
    enforcer: NATIVE_TOKEN_MAX_LOSS_ENFORCER_ADDRESS,
    terms: encodePacked(['address', 'uint256'], [address, amount]),
    args: '0x',
  };
}

function erc20MaxLossBuilder(
  _: DeleGatorEnvironment,
  recipient: Address,
  tokenAddress: Address,
  amount: bigint,
): CaveatStruct {
  return {
    enforcer: ERC20_MAX_LOSS_ENFORCER_ADDRESS,
    terms: encodePacked(
      ['address', 'address', 'uint256'],
      [recipient, tokenAddress, amount],
    ),
    args: '0x',
  };
}

export function generateDelegation({
  accountAddress,
  gatorEnv,
  simulationData,
  txValue,
}: {
  accountAddress: Address;
  gatorEnv: DeleGatorEnvironment;
  simulationData: SimulationData;
  txValue: bigint;
}): DelegationStruct {
  const caveateBuilder = createCaveatBuilder(gatorEnv)
    .extend('nativeTokenMaxLoss', nativeTokenMaxLossBuilder)
    .extend('erc20MaxLoss', erc20MaxLossBuilder);

  let caveats = caveateBuilder;

  if (simulationData.nativeBalanceChange) {
    const delta = BigInt(simulationData.nativeBalanceChange.difference);
    if (simulationData.nativeBalanceChange.isDecrease) {
      caveats = caveats.addCaveat('nativeTokenMaxLoss', accountAddress, delta);
      log('Caveat - Native Token Max Loss', { accountAddress, delta });
    } else {
      caveats = caveats.addCaveat('nativeBalanceGte', accountAddress, delta);
      log('Caveat - Native Balance GTE', { accountAddress, delta });
    }
  } else if (txValue > 0n) {
    // If tx has value but no nativeBalanceChange, then we add a guardrail
    // to prevent native token loss
    caveats = caveats.addCaveat('nativeTokenMaxLoss', accountAddress, 0n);
  }

  for (const tokenBalanceChange of simulationData.tokenBalanceChanges) {
    const tokenAddress = tokenBalanceChange.address;
    const delta = BigInt(tokenBalanceChange.difference);
    if (tokenBalanceChange.isDecrease) {
      caveats = caveats.addCaveat(
        'erc20MaxLoss',
        accountAddress,
        tokenAddress,
        delta,
      );
      log('Caveat - ERC-20 Max Loss', { accountAddress, tokenAddress, delta });
    } else {
      caveats = caveats.addCaveat('erc20BalanceGte', tokenAddress, delta);
      log('Caveat - ERC-20 Balance GTE', { tokenAddress, delta });
    }
  }

  const rawCaveats = caveats.build();

  log('Caveats', rawCaveats);

  const delegation = createRootDelegation(
    accountAddress,
    accountAddress,
    rawCaveats,
    BigInt(generateSalt()),
  );

  return delegation;
}

export function generateCalldata({
  transaction,
  delegation,
}: {
  transaction: TransactionParams;
  delegation: DelegationStruct;
}): Hex {
  const delegations: DelegationStruct[][] = [[delegation]];
  const modes: ExecutionMode[] = [SINGLE_DEFAULT_MODE];
  const executions: ExecutionStruct[][] = [
    [
      {
        // FIXME: What is the correct target if the transaction.to is null?
        target: (transaction.to as Hex) ?? '0x',
        callData: (transaction.data as Hex) ?? '0x',
        value: transaction.value ? BigInt(transaction.value) : 0n,
      },
    ],
  ];

  return DelegationFramework.encode.redeemDelegations(
    delegations,
    modes,
    executions,
  );
}
