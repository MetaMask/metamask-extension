import {
  BeforeSignHook,
  TransactionContainerType,
  TransactionMeta,
} from '@metamask/transaction-controller';
import { createProjectLogger } from '@metamask/utils';
import { accountSupports7702 } from '../../account-supports-7702';
import { TransactionControllerInitMessenger } from '../../../wallet-init/messengers/transaction-controller-messenger';
import { applyTransactionContainers } from '../containers/util';

const log = createProjectLogger('enforce-simulation-hook');

export class EnforceSimulationHook {
  readonly #messenger: TransactionControllerInitMessenger;

  readonly #isEligible: (transactionMeta: TransactionMeta) => boolean;

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

  getBeforeSignHook(): BeforeSignHook {
    return this.#hook.bind(this);
  }

  async #hook(request: {
    transactionMeta: TransactionMeta;
  }): Promise<Awaited<ReturnType<BeforeSignHook>>> {
    const { transactionMeta } = request;
    const { containerTypes, txParamsOriginal } = transactionMeta;

    if (!this.#isEligible(transactionMeta)) {
      log('Skipping as not eligible');
      return {};
    }

    // The confirmation UI normally initializes containerTypes before the user
    // confirms. If confirmation wins that race, fail closed rather than
    // silently signing an eligible transaction without enforcement. Preserve
    // the UI's hardware-wallet exclusion when no explicit selection exists.
    const canApplyDefault =
      containerTypes !== undefined ||
      (await accountSupports7702(
        transactionMeta.txParams.from,
        this.#messenger,
      ));
    if (!canApplyDefault) {
      log('Skipping as account does not support EIP-7702');
      return {};
    }

    const effectiveContainerTypes = containerTypes ?? [
      TransactionContainerType.EnforcedSimulations,
    ];

    const hasEnforcedSimulations = effectiveContainerTypes.includes(
      TransactionContainerType.EnforcedSimulations,
    );

    if (!hasEnforcedSimulations) {
      log('Skipping as user has not enabled enforced simulations');
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
      types: effectiveContainerTypes,
    });

    return {
      updateTransaction,
    };
  }
}
