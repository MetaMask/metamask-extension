import {
  AfterSimulateHook,
  BeforeSignHook,
  TransactionContainerType,
  TransactionMeta,
} from '@metamask/transaction-controller';
import { createProjectLogger } from '@metamask/utils';
import { TransactionControllerInitMessenger } from '../../../controller-init/messengers/transaction-controller-messenger';
import { applyTransactionContainers } from '../containers/util';
import { isEnforcedSimulationsEligible } from '../../../../../shared/lib/transaction/enforced-simulations';

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

    const { containerTypes, txParamsOriginal } = transactionMeta;

    const isEligible = isEnforcedSimulationsEligible(transactionMeta);

    if (!isEligible) {
      log('Skipping as not eligible for enforced simulations');
      return {
        skipSimulation: false,
      };
    }

    if (containerTypes && !isFinal) {
      const hasEnforcedSimulations = containerTypes.includes(
        TransactionContainerType.EnforcedSimulations,
      );

      if (hasEnforcedSimulations) {
        log('Skipping as simulation already enforced');
      } else {
        log('Skipping as user opted out of enforced simulations');
      }

      return {};
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
