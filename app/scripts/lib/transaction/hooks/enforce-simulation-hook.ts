import {
  AfterSimulateHook,
  BeforeSignHook,
  TransactionContainerType,
  TransactionMeta,
} from '@metamask/transaction-controller';
import { createProjectLogger } from '@metamask/utils';
import { TransactionControllerInitMessenger } from '../../../messenger-client-init/messengers/transaction-controller-messenger';
import { applyTransactionContainers } from '../containers/util';

const log = createProjectLogger('enforce-simulation-hook');

export class EnforceSimulationHook {
  #messenger: TransactionControllerInitMessenger;

  #isEligible: (transactionMeta: TransactionMeta) => boolean;

  constructor({
    messenger,
    isEligible,
  }: {
    messenger: TransactionControllerInitMessenger;
    isEligible: (transactionMeta: TransactionMeta) => boolean;
  }) {
    this.#messenger = messenger;
    this.#isEligible = isEligible;
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

    const { containerTypes, txParamsOriginal } = transactionMeta;

    if (!this.#isEligible(transactionMeta)) {
      log('Skipping as not eligible');
      return {
        skipSimulation: false,
      };
    }

    if (!containerTypes) {
      log('Skipping as no container types set');
      return {};
    }

    const hasEnforcedSimulations = containerTypes.includes(
      TransactionContainerType.EnforcedSimulations,
    );

    if (!hasEnforcedSimulations) {
      log('Skipping as user has not enabled enforced simulations');
      return {};
    }

    if (!isFinal) {
      log('Skipping as simulation already enforced');
      return {};
    }

    if (!txParamsOriginal) {
      log('Cannot find original transaction parameters');
      throw new Error('Original transaction parameters not found');
    }

    const { updateTransaction } = await applyTransactionContainers({
      isApproved: true,
      messenger: this.#messenger,
      transactionMeta,
      types: containerTypes,
    });

    return {
      skipSimulation: true,
      updateTransaction,
    };
  }
}
