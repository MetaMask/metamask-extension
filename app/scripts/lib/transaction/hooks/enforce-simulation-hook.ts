import {
  AfterSimulateHook,
  BeforeSignHook,
  TransactionContainerType,
  TransactionMeta,
} from '@metamask/transaction-controller';
import { createProjectLogger } from '@metamask/utils';
import { ORIGIN_METAMASK } from '@metamask/controller-utils';
import { TransactionControllerInitMessenger } from '../../../controller-init/messengers/transaction-controller-messenger';
import { applyTransactionContainers } from '../containers/util';

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
      containerTypes,
      delegationAddress,
      origin,
      simulationData,
      txParamsOriginal,
    } = transactionMeta;

    if (!process.env.ENABLE_ENFORCED_SIMULATIONS) {
      log('Skipping as enforced simulations are disabled');
      return {};
    }

    if (
      containerTypes?.includes(TransactionContainerType.EnforcedSimulations) &&
      !isFinal
    ) {
      log('Skipping as simulation already enforced');
      return {};
    }

    if (!origin || origin === ORIGIN_METAMASK) {
      log('Skipping as internal transaction');
      return {};
    }

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
