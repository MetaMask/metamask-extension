import {
  AfterSimulateHook,
  BeforeSignHook,
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

const MOCK_DELEGATION_SIGNATURE =
  '0x2261a7810ed3e9cde160895909e138e2f68adb2da86fcf98ea0840701df107721fb369ab9b52550ea98832c09f8185284aca4c94bd345e867a4f4461868dd7751b';

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

  getAfterSimulateHook(): AfterSimulateHook {
    return this.#hook.bind(this, {});
  }

  getBeforeSignHook(): BeforeSignHook {
    return this.#hook.bind(this, { isFinal: true });
  }

  async #hook(
    options: { isFinal?: boolean },
    request: {
      transactionMeta: TransactionMeta;
    },
  ) {
    const { transactionMeta } = request;
    const { isFinal } = options;

    const {
      chainId,
      delegationAddress,
      networkClientId,
      simulationData,
      txParams,
      txParamsOriginal,
    } = transactionMeta;

    if (isFinal && !txParamsOriginal) {
      log('Cannot find original transaction parameters');
      throw new Error('Original transaction parameters not found');
    }

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

    const to = isFinal ? txParamsOriginal?.to : txParams.to;

    if (to?.toLowerCase() === delegationManagerAddress.toLowerCase()) {
      log('Skipping as already a delegation');
      return {};
    }

    log('Starting', delegationAddress);

    const delegation = generateDelegation({
      accountAddress: from,
    });

    log('Delegation', delegation);

    let delegationSignature = MOCK_DELEGATION_SIGNATURE as Hex;

    if (isFinal) {
      log('Signing delegation');

      delegationSignature = (await this.#messenger.call(
        'DelegationController:signDelegation',
        {
          chainId,
          delegation,
        },
      )) as Hex;
    }

    log('Delegation signature', delegationSignature);

    const data = generateCalldata({
      transaction: isFinal ? (txParamsOriginal as TransactionParams) : txParams,
      delegation: { ...delegation, signature: delegationSignature },
    });

    log('Data', data);

    let newGas: Hex | undefined;

    if (!isFinal) {
      const { gas } = await this.#messenger.call(
        'TransactionController:estimateGas',
        { ...txParams, data, to: delegationManagerAddress, value: '0x0' },
        networkClientId,
        {
          ignoreDelegationSignatures: true,
        },
      );

      log('Estimated gas', gas);

      newGas = gas;
    }

    return {
      skipSimulation: true,
      updateTransaction: (transaction: TransactionMeta) => {
        transaction.txParams.data = data;
        transaction.txParams.to = delegationManagerAddress;
        transaction.txParams.value = '0x0';

        if (newGas) {
          transaction.txParams.gas = newGas;
        }
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
