import {
  SimulationData,
  SimulationTokenStandard,
  TransactionMeta,
  TransactionParams,
} from '@metamask/transaction-controller';
import { Hex, createProjectLogger, hexToNumber } from '@metamask/utils';
import { TransactionControllerInitMessenger } from '../../../controller-init/messengers/transaction-controller-messenger';
import {
  DeleGatorEnvironment,
  Delegation,
  ExecutionMode,
  ExecutionStruct,
  SINGLE_DEFAULT_MODE,
  createCaveatBuilder,
  createDelegation,
  getDeleGatorEnvironment,
} from '../../../../../shared/lib/delegation';
import {
  UnsignedDelegation,
  encodeRedeemDelegations,
} from '../../../../../shared/lib/delegation/delegation';

const log = createProjectLogger('enforced-simulations');

const MOCK_DELEGATION_SIGNATURE =
  '0x2261a7810ed3e9cde160895909e138e2f68adb2da86fcf98ea0840701df107721fb369ab9b52550ea98832c09f8185284aca4c94bd345e867a4f4461868dd7751b';

export async function enforceSimulations({
  chainId,
  messenger,
  simulationData,
  txParams,
  useRealSignature = false,
}: {
  chainId: Hex;
  messenger: TransactionControllerInitMessenger;
  simulationData: SimulationData;
  txParams: TransactionParams;
  useRealSignature?: boolean;
}) {
  const from = txParams.from as Hex;
  const chainIdDecimal = hexToNumber(chainId);
  const delegationEnvironment = getDeleGatorEnvironment(chainIdDecimal);
  const delegationManagerAddress = delegationEnvironment.DelegationManager;

  const delegation = generateDelegation({
    accountAddress: from,
    environment: delegationEnvironment,
    simulationData,
  });

  log('Delegation', delegation);

  let delegationSignature = MOCK_DELEGATION_SIGNATURE as Hex;

  if (useRealSignature) {
    log('Signing delegation');

    delegationSignature = (await messenger.call(
      'DelegationController:signDelegation',
      {
        chainId,
        delegation,
      },
    )) as Hex;
  }

  log('Delegation signature', delegationSignature);

  const data = generateCalldata({
    transaction: txParams,
    delegation: { ...delegation, signature: delegationSignature },
  });

  log('Data', data);

  return {
    updateTransaction: (transaction: TransactionMeta) => {
      transaction.txParams.data = data;
      transaction.txParams.to = delegationManagerAddress;
      transaction.txParams.value = '0x0';
    },
  };
}

function generateDelegation({
  accountAddress,
  environment,
  simulationData,
}: {
  accountAddress: Hex;
  environment: DeleGatorEnvironment;
  simulationData: SimulationData;
}): UnsignedDelegation {
  const caveats = generateCaveats(accountAddress, environment, simulationData);

  log('Caveats', caveats);

  const delegation = createDelegation({
    from: accountAddress,
    to: accountAddress,
    caveats,
  });

  return delegation;
}

export function generateCalldata({
  transaction,
  delegation,
}: {
  transaction: TransactionParams;
  delegation: Delegation;
}): Hex {
  const delegations = [[delegation]];
  const modes: ExecutionMode[] = [SINGLE_DEFAULT_MODE];

  const executions: ExecutionStruct[][] = [
    [
      {
        target: transaction.to as Hex,
        callData: (transaction.data as Hex) ?? '0x',
        value: transaction.value ? BigInt(transaction.value) : 0n,
      },
    ],
  ];

  return encodeRedeemDelegations({
    delegations,
    modes,
    executions,
  });
}

function generateCaveats(
  recipient: Hex,
  environment: DeleGatorEnvironment,
  simulationData: SimulationData,
) {
  const caveatBuilder = createCaveatBuilder(environment);
  const { nativeBalanceChange, tokenBalanceChanges = [] } = simulationData;

  if (nativeBalanceChange) {
    const { difference, isDecrease: enforceDecrease } = nativeBalanceChange;
    const delta = BigInt(difference);

    log('Caveat - Native Balance Change', {
      enforceDecrease,
      recipient,
      delta,
    });

    caveatBuilder.addCaveat(
      'nativeBalanceChange',
      enforceDecrease,
      recipient,
      delta,
    );
  }

  for (const tokenChange of tokenBalanceChanges) {
    const {
      difference,
      isDecrease: enforceDecrease,
      address: token,
      standard,
      id: tokenIdHex,
    } = tokenChange;

    const delta = BigInt(difference);
    const tokenId = tokenIdHex ? BigInt(tokenIdHex) : 0n;

    log('Caveat - Token Balance Change', {
      enforceDecrease,
      token,
      recipient,
      delta,
    });

    switch (standard) {
      case SimulationTokenStandard.erc20:
        caveatBuilder.addCaveat(
          'erc20BalanceChange',
          enforceDecrease,
          token,
          recipient,
          delta,
        );
        break;

      case SimulationTokenStandard.erc721:
        caveatBuilder.addCaveat(
          'erc721BalanceChange',
          enforceDecrease,
          token,
          recipient,
          delta,
        );
        break;

      case SimulationTokenStandard.erc1155:
        caveatBuilder.addCaveat(
          'erc1155BalanceChange',
          enforceDecrease,
          token,
          recipient,
          tokenId,
          delta,
        );
        break;

      default:
        log('Unsupported token standard', standard);
        break;
    }
  }

  return caveatBuilder.build();
}
