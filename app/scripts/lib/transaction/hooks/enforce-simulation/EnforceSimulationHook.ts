import {
  BeforeSignHook,
  SimulationData,
  TransactionMeta,
} from '@metamask/transaction-controller';
import { Hex, createProjectLogger } from '@metamask/utils';
import { getDeleGatorEnvironment } from '@metamask-private/delegation-utils';
import { sepolia } from 'viem/chains';
import { TransactionControllerInitMessenger } from '../../../../controller-init/messengers/transaction-controller-messenger';
import { generateCalldata, generateDelegation } from './utils/delegation';

const GATOR_ENV = getDeleGatorEnvironment(sepolia.id, '1.2.0');
const DELEGATION_MANAGER_ADDRESS = GATOR_ENV.DelegationManager;

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

  getHook(): BeforeSignHook {
    return this.#hook.bind(this);
  }

  async #hook(request: {
    transactionMeta: TransactionMeta;
  }): ReturnType<BeforeSignHook> {
    const { transactionMeta } = request;

    const {
      chainId,
      delegationAddress,
      networkClientId,
      simulationData,
      txParams,
    } = transactionMeta;

    const from = txParams.from as Hex;

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

    if (txParams.to === DELEGATION_MANAGER_ADDRESS) {
      log('Skipping as already a delegation');
      return {};
    }

    log('Starting', delegationAddress);

    const delegation = generateDelegation({
      accountAddress: from,
      gatorEnv: GATOR_ENV,
      simulationData: simulationData as SimulationData,
    });

    log('Delegation', delegation);

    const signDelegation = { ...delegation, salt: Number(delegation.salt) };

    log('Sign delegation', signDelegation);

    const delegationSignature = await this.#messenger.call(
      'SignatureController:signDelegation',
      {
        chainId,
        delegation: signDelegation,
        delegationManagerAddress: DELEGATION_MANAGER_ADDRESS,
        from,
        networkClientId,
        requireApproval: false,
      },
    );

    log('Delegation signature', delegationSignature);

    const data = generateCalldata({
      transaction: txParams,
      delegation: { ...delegation, signature: delegationSignature as Hex },
    });

    log('Data', data);

    return {
      updateTransaction: (transaction) => {
        log('Update callback called');

        transaction.txParams.data = data;
        transaction.txParams.to = DELEGATION_MANAGER_ADDRESS;
        transaction.txParams.value = '0x0';
      },
    };
  }
}
