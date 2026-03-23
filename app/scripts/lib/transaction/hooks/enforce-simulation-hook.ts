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

  #isDefaultEnabled: (transactionMeta: TransactionMeta) => boolean;

  constructor({
    messenger,
    isDefaultEnabled,
  }: {
    messenger: TransactionControllerInitMessenger;
    isDefaultEnabled: (transactionMeta: TransactionMeta) => boolean;
  }) {
    this.#messenger = messenger;
    this.#isDefaultEnabled = isDefaultEnabled;
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

    const isDefaultEnabled = this.#isDefaultEnabled(transactionMeta);

    if (!isDefaultEnabled && !containerTypes) {
      log('Skipping as not eligible or to address is trusted');
      return {
        skipSimulation: false,
      };
    }

    if (containerTypes) {
      const hasEnforcedSimulations = containerTypes.includes(
        TransactionContainerType.EnforcedSimulations,
      );

      if (!isFinal && hasEnforcedSimulations) {
        log('Skipping as simulation already enforced');
        return {};
      }

      if (!hasEnforcedSimulations) {
        log('Skipping as user opted out of enforced simulations');
        return {};
      }
    }

    if (isFinal && !txParamsOriginal) {
      log('Cannot find original transaction parameters');
      throw new Error('Original transaction parameters not found');
    }

    const newContainerTypes = [
      ...(containerTypes ?? []),
      TransactionContainerType.EnforcedSimulations,
    ];

    const { updateTransaction } = await applyTransactionContainers({
      isApproved: isFinal ?? false,
      messenger: this.#messenger,
      transactionMeta,
      types: newContainerTypes,
    });

    return {
      skipSimulation: true,
      updateTransaction,
    };
  }
}
