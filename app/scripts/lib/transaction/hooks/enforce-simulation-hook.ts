import {
  AfterSimulateHook,
  TransactionMeta,
  TransactionParams,
} from '@metamask/transaction-controller';
import { Hex, createProjectLogger, hexToNumber } from '@metamask/utils';
import { TransactionControllerInitMessenger } from '../../../controller-init/messengers/transaction-controller-messenger';
import {
  Delegation,
  ExecutionMode,
  ExecutionStruct,
  SINGLE_DEFAULT_MODE,
  createDelegation,
  getDeleGatorEnvironment,
} from '../../../../../shared/lib/delegation';
import {
  UnsignedDelegation,
  encodeRedeemDelegations,
} from '../../../../../shared/lib/delegation/delegation';

const log = createProjectLogger('enforce-simulation-hook');

export class EnforceSimulationHook {
  #messenger: TransactionControllerInitMessenger;

  constructor({
    messenger,
  }: {
    messenger: TransactionControllerInitMessenger;
  }) {
    this.#messenger = messenger;
  }

  getHook(): AfterSimulateHook {
    return this.#hook.bind(this);
  }

  async #hook(request: {
    transactionMeta: TransactionMeta;
  }): ReturnType<AfterSimulateHook> {
    const { transactionMeta } = request;

    const { chainId, delegationAddress, simulationData, txParams } =
      transactionMeta;

    const from = txParams.from as Hex;

    const chainIdDecimal = hexToNumber(chainId);
    const delegationEnvironment = getDeleGatorEnvironment(chainIdDecimal);
    const delegationManagerAddress = delegationEnvironment.DelegationManager;

    if (!delegationAddress) {
      log('Skipping as not upgraded account');
      return {};
    }

    if (
      !simulationData?.nativeBalanceChange &&
      !simulationData?.tokenBalanceChanges?.length
    ) {
      log('Skipping as no simulation changes');
      return {};
    }

    if (txParams.to?.toLowerCase() === delegationManagerAddress.toLowerCase()) {
      log('Skipping as already a delegation');
      return {};
    }

    log('Starting', delegationAddress);

    const delegation = generateDelegation({
      accountAddress: from,
    });

    log('Delegation', delegation);

    const delegationSignature = (await this.#messenger.call(
      'DelegationController:signDelegation',
      {
        chainId,
        delegation,
      },
    )) as Hex;

    log('Delegation signature', delegationSignature);

    const data = generateCalldata({
      transaction: txParams,
      delegation: { ...delegation, signature: delegationSignature },
    });

    log('Data', data);

    return {
      skipSimulation: true,
      updateTransaction: (transaction) => {
        transaction.txParams.data = data;
        transaction.txParams.to = delegationManagerAddress;
        transaction.txParams.value = '0x0';
      },
    };
  }
}

function generateDelegation({
  accountAddress,
}: {
  accountAddress: Hex;
}): UnsignedDelegation {
  const delegation = createDelegation({
    from: accountAddress,
    to: accountAddress,
    caveats: [],
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
