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
import {
  SimulationTokenStandard,
  type SimulationData,
  type TransactionParams,
} from '@metamask/transaction-controller';
import { createProjectLogger } from '@metamask/utils';
import { encodePacked, type Address, type Hex } from 'viem';

const log = createProjectLogger('enforce-simulation-hook');

// These are deployed on Sepolia at the addresses below
const NATIVE_TOKEN_MAX_LOSS_ENFORCER_ADDRESS =
  '0x8F0473C57495b99c9649baD5d1916BF83d43736a';
const ERC20_MAX_LOSS_ENFORCER_ADDRESS =
  '0x69049A17a68FaDB939173287D9bd814a4E81779C';
const ERC721_MAX_LOSS_ENFORCER_ADDRESS =
  '0xCfaCA6E4B2ab973A8ecd89D13CEe3666f81cbf6c';
const ERC1155_MAX_LOSS_ENFORCER_ADDRESS =
  '0xB5cC61a3D612fA20E5acBd4f5C27F6bC389c89A0';

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
  tokenAddress: Address,
  recipient: Address,
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

function erc721MaxLossBuilder(
  _: DeleGatorEnvironment,
  tokenAddress: Address,
  recipient: Address,
  amount: bigint,
): CaveatStruct {
  return {
    enforcer: ERC721_MAX_LOSS_ENFORCER_ADDRESS,
    terms: encodePacked(
      ['address', 'address', 'uint256'],
      [tokenAddress, recipient, amount],
    ),
    args: '0x',
  };
}

function erc1155MaxLossBuilder(
  _: DeleGatorEnvironment,
  tokenAddress: Address,
  recipient: Address,
  tokenId: bigint,
  amount: bigint,
): CaveatStruct {
  return {
    enforcer: ERC1155_MAX_LOSS_ENFORCER_ADDRESS,
    terms: encodePacked(
      ['address', 'address', 'uint256', 'uint256'],
      [tokenAddress, recipient, tokenId, amount],
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
    .extend('erc20MaxLoss', erc20MaxLossBuilder)
    .extend('erc721MaxLoss', erc721MaxLossBuilder)
    .extend('erc1155MaxLoss', erc1155MaxLossBuilder);

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
    const { standard } = tokenBalanceChange;
    const delta = BigInt(tokenBalanceChange.difference);
    const tokenId = tokenBalanceChange.id;
    switch (standard) {
      case SimulationTokenStandard.erc20:
        if (tokenBalanceChange.isDecrease) {
          caveats = caveats.addCaveat(
            'erc20MaxLoss',
            accountAddress,
            tokenAddress,
            delta,
          );
          log('Caveat - ERC-20 Max Loss', {
            accountAddress,
            tokenAddress,
            delta,
          });
        } else {
          caveats = caveats.addCaveat('erc20BalanceGte', tokenAddress, delta);
          log('Caveat - ERC-20 Balance GTE', { tokenAddress, delta });
        }
        break;
      case SimulationTokenStandard.erc721:
        if (tokenBalanceChange.isDecrease) {
          caveats = caveats.addCaveat(
            'erc721MaxLoss',
            tokenAddress,
            accountAddress,
            delta,
          );
          log('Caveat - ERC-721 Max Loss', {
            tokenAddress,
            accountAddress,
            delta,
          });
        } else {
          caveats = caveats.addCaveat(
            'erc721BalanceGte',
            tokenAddress,
            accountAddress,
            delta,
          );
          log('Caveat - ERC-721 Balance GTE', {
            tokenAddress,
            accountAddress,
            delta,
          });
        }
        break;
      case SimulationTokenStandard.erc1155:
        if (!tokenId) {
          throw new Error('Missing token ID');
        }
        if (tokenBalanceChange.isDecrease) {
          caveats = caveats.addCaveat(
            'erc1155MaxLoss',
            tokenAddress,
            accountAddress,
            BigInt(tokenId),
            delta,
          );
          log('Caveat - ERC-1155 Max Loss', {
            tokenAddress,
            accountAddress,
            tokenId,
            delta,
          });
        } else {
          caveats = caveats.addCaveat(
            'erc1155BalanceGte',
            tokenAddress,
            accountAddress,
            BigInt(tokenId),
            delta,
          );
          log('Caveat - ERC-1155 Balance GTE', {
            tokenAddress,
            accountAddress,
            tokenId,
            delta,
          });
        }
        break;
      default:
        log('Unknown token standard', standard);
        break;
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
