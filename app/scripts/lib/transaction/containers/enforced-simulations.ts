import {
  SimulationData,
  SimulationTokenStandard,
  TransactionMeta,
  TransactionParams,
} from '@metamask/transaction-controller';
import { Hex, createProjectLogger, hexToNumber } from '@metamask/utils';
import { BigNumber } from 'bignumber.js';
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
  messenger,
  transactionMeta,
  useRealSignature = false,
}: {
  messenger: TransactionControllerInitMessenger;
  transactionMeta: TransactionMeta;
  useRealSignature?: boolean;
}) {
  log('Enforcing simulations', {
    transactionMeta,
    useRealSignature,
  });

  const {
    chainId,
    simulationData = { tokenBalanceChanges: [] },
    txParams,
  } = transactionMeta;

  const from = txParams.from as Hex;
  const chainIdDecimal = hexToNumber(chainId);
  const delegationEnvironment = getDeleGatorEnvironment(chainIdDecimal);
  const delegationManagerAddress = delegationEnvironment.DelegationManager;
  const slippage = getSlippage(messenger, transactionMeta.id);

  const delegation = generateDelegation({
    accountAddress: from,
    environment: delegationEnvironment,
    simulationData,
    slippage,
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
  slippage,
}: {
  accountAddress: Hex;
  environment: DeleGatorEnvironment;
  simulationData: SimulationData;
  slippage: number;
}): UnsignedDelegation {
  const caveats = generateCaveats(
    accountAddress,
    environment,
    simulationData,
    slippage,
  );

  log('Caveats', caveats);

  const delegation = createDelegation({
    from: accountAddress,
    to: accountAddress,
    caveats,
  });

  return delegation;
}

function generateCalldata({
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
  slippage: number,
) {
  const caveatBuilder = createCaveatBuilder(environment);
  const { nativeBalanceChange, tokenBalanceChanges = [] } = simulationData;

  if (nativeBalanceChange) {
    const { difference, isDecrease: enforceDecrease } = nativeBalanceChange;
    const delta = applySlippage(difference, slippage, enforceDecrease);

    log('Caveat - Native Balance Change', {
      enforceDecrease,
      recipient,
      delta: BigInt(difference),
      slippage,
      deltaWithSlippage: delta,
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

    const deltaWithSlippage = applySlippage(
      difference,
      slippage,
      enforceDecrease,
    );

    const tokenId = tokenIdHex ? BigInt(tokenIdHex) : 0n;

    log('Caveat - Token Balance Change', {
      enforceDecrease,
      token,
      recipient,
      delta,
      slippage,
      deltaWithSlippage,
    });

    switch (standard) {
      case SimulationTokenStandard.erc20:
        caveatBuilder.addCaveat(
          'erc20BalanceChange',
          enforceDecrease,
          token,
          recipient,
          deltaWithSlippage,
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

function getSlippage(
  messenger: TransactionControllerInitMessenger,
  transactionId: string,
): number {
  const appControllerState = messenger.call('AppStateController:getState');
  const defaultValue = appControllerState.enforcedSimulationsSlippage;

  const transactionOverride =
    appControllerState.enforcedSimulationsSlippageForTransactions[
      transactionId
    ];

  return transactionOverride ?? defaultValue;
}

function applySlippage(
  value: Hex,
  slippage: number,
  isDecrease: boolean,
): bigint {
  const valueBN = new BigNumber(value);
  const slippageMultiplier = (100 + (isDecrease ? slippage : -slippage)) / 100;
  return BigInt(valueBN.mul(slippageMultiplier).toFixed(0));
}
