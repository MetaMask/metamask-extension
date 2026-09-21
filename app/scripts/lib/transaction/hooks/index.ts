import type { SmartTransactionsController } from '@metamask/smart-transactions-controller';
import {
  type PublishBatchHookRequest,
  type PublishBatchHookTransaction,
  PublishHook,
  TransactionController,
  TransactionControllerOptions,
  TransactionMeta,
  TransactionType,
} from '@metamask/transaction-controller';
import {
  TransactionPayControllerMessenger,
  TransactionPayPublishHook,
  TransactionPayStrategy,
} from '@metamask/transaction-pay-controller';
import { Hex } from '@metamask/utils';

import { AccountOverviewTabKey } from '../../../../../shared/constants/app-state';
import { getPreferences } from '../../../../../shared/lib/selectors/preferences';
import { getEip7702SupportedChains } from '../../../../../shared/lib/eip7702-support-utils';
import { hasTransactionType } from '../../../../../shared/lib/transactions.utils';
import {
  getInternalEvmAddresses,
  isEnforcedSimulationsEligible,
} from '../../../../../shared/lib/transaction/enforced-simulations';
import { TransactionMetricsRequest } from '../../../../../shared/types/metametrics';
import { accountSupports7702ForRelay } from '../../account-supports-7702';
import {
  getSmartTransactionCommonParams,
  SmartTransactionHookMessenger,
  submitBatchSmartTransactionHook,
  submitSmartTransactionHook,
} from '../../smart-transaction/smart-transactions';
import { MessengerClientFlatState } from '../../../messenger-client-init/controller-list';
import { TransactionControllerInitMessenger } from '../../../wallet-init/messengers/transaction-controller-messenger';
import { getTransactionById } from '../util';
import { isRelaySupported } from '../transaction-relay';
import { isSendBundleSupported } from '../sentinel-api';
import { Delegation7702PublishHook } from './delegation-7702-publish';
import { EnforceSimulationHook } from './enforce-simulation-hook';

export type TransactionControllerHookRequest = {
  getFlatState: () => MessengerClientFlatState;
  getTransactionMetricsRequest: () => TransactionMetricsRequest;
  messenger: TransactionControllerInitMessenger;
};

type TransactionApprovalMeta = TransactionMeta & {
  isGasFeeSponsoredAvailable?: boolean;
};

type IsGasSponsoredHook = (request: {
  transactionMeta: TransactionApprovalMeta;
}) => Promise<{ isSponsored: boolean }>;

type ShouldSignHook = (request: {
  transactionMeta: TransactionApprovalMeta;
}) => Promise<{ shouldSign: boolean }>;

type TransactionControllerHooks = NonNullable<
  TransactionControllerOptions['hooks']
> & {
  isSponsored: IsGasSponsoredHook;
  shouldSign: ShouldSignHook;
};

const TRANSACTION_SUBMISSION_METHOD_METRIC_NAME =
  'transaction_submission_method';

const TRANSACTION_SUBMISSION_METHOD = {
  SENTINEL_STX: 'sentinel_stx',
  SENTINEL_RELAY: 'sentinel_relay',
};

/**
 * @param request - The hook request dependencies.
 * @returns The hooks to pass to TransactionController. Note:
 * `beforeCheckPendingTransaction` is intentionally omitted — it was previously
 * silently inactive due to a misspelled key and requires further assessment
 * before enabling.
 */
export function getTransactionControllerHooks(
  request: TransactionControllerHookRequest,
): TransactionControllerHooks {
  return {
    afterAdd: afterAddHook(request),
    isSponsored: isSponsoredHook(request),
    shouldSign: shouldSignHook(request),
    beforePublish: beforePublishHook(request),
    beforeSign: beforeSignHook(request),
    // @ts-expect-error - Controller type is missing signedTx parameter
    publish: publishHook(request),
    publishBatch: publishBatchHook(request),
  };
}

function afterAddHook({ messenger }: TransactionControllerHookRequest) {
  return async ({ transactionMeta }: { transactionMeta: TransactionMeta }) => {
    await messenger.call(
      'ShieldSubscriptionService:submitSubscriptionSponsorshipIntent',
      transactionMeta,
    );
    return {};
  };
}

type TransactionApprovalDecision = {
  signingMode: 'local' | 'external';
  sponsorshipEnabled: boolean;
};

async function getTransactionApprovalDecision(
  { getFlatState }: TransactionControllerHookRequest,
  transactionMeta: TransactionApprovalMeta,
): Promise<TransactionApprovalDecision> {
  const flatState = getFlatState();
  const { gasSponsorshipOptOutByChainId } = getPreferences({
    metamask: flatState,
  });
  const { isHardwareWalletAccount, isSmartTransaction } =
    getSmartTransactionCommonParams(flatState, transactionMeta.chainId);

  const isSmartTransactionAndBundleSupported =
    isSmartTransaction &&
    (await isSendBundleSupported(transactionMeta.chainId));

  const shouldCheck7702Eligibility =
    !isHardwareWalletAccount && !isSmartTransactionAndBundleSupported;

  const is7702Supported = Boolean(
    shouldCheck7702Eligibility &&
    (await isRelaySupported(transactionMeta.chainId)) &&
    transactionMeta.txParams?.to !== undefined,
  );

  const isMoneyAccountWithdraw = hasTransactionType(transactionMeta, [
    TransactionType.moneyAccountWithdraw,
  ]);
  const hasTransactionPayQuotes = Boolean(
    flatState.transactionData?.[transactionMeta.id]?.quotes?.some(
      (quote) => quote.strategy !== TransactionPayStrategy.None,
    ),
  );
  const requiresExternalSigning =
    hasTransactionPayQuotes ||
    isMoneyAccountWithdraw ||
    (Boolean(transactionMeta.selectedGasFeeToken) &&
      !transactionMeta.isGasFeeTokenIgnoredIfBalance &&
      !isHardwareWalletAccount &&
      !isSmartTransactionAndBundleSupported);

  const isSponsorshipAvailable = isMoneyAccountWithdraw
    ? Boolean(transactionMeta.isGasFeeSponsored)
    : Boolean(transactionMeta.isGasFeeSponsoredAvailable);
  const sponsorshipEnabled =
    isSponsorshipAvailable &&
    !gasSponsorshipOptOutByChainId?.[transactionMeta.chainId] &&
    (isSmartTransactionAndBundleSupported ||
      is7702Supported ||
      (isMoneyAccountWithdraw && requiresExternalSigning));

  if (isMoneyAccountWithdraw && !sponsorshipEnabled) {
    throw new Error('Required transaction sponsorship is unavailable');
  }

  const signingMode: 'local' | 'external' = requiresExternalSigning
    ? 'external'
    : 'local';

  return {
    signingMode,
    sponsorshipEnabled,
  };
}

function isSponsoredHook(
  request: TransactionControllerHookRequest,
): IsGasSponsoredHook {
  return async ({ transactionMeta }) => {
    const { sponsorshipEnabled } = await getTransactionApprovalDecision(
      request,
      transactionMeta,
    );

    return { isSponsored: sponsorshipEnabled };
  };
}

function shouldSignHook(
  request: TransactionControllerHookRequest,
): ShouldSignHook {
  return async ({ transactionMeta }) => {
    const { signingMode } = await getTransactionApprovalDecision(
      request,
      transactionMeta,
    );

    return { shouldSign: signingMode === 'local' };
  };
}

function beforePublishHook({ messenger }: TransactionControllerHookRequest) {
  return (transactionMeta: TransactionMeta) =>
    messenger.call('InstitutionalSnapController:publishHook', transactionMeta);
}

function beforeSignHook({ messenger }: TransactionControllerHookRequest) {
  return new EnforceSimulationHook({
    messenger,
    isEligible: (transactionMeta) => {
      const { addressSecurityAlertResponses } = messenger.call(
        'AppStateController:getState',
      );

      const featureFlagState = messenger.call(
        'RemoteFeatureFlagController:getState',
      );

      const {
        internalAccounts: { accounts },
      } = messenger.call('AccountsController:getState');

      const internalAddresses = getInternalEvmAddresses(
        Object.values(accounts),
      );

      return isEnforcedSimulationsEligible(transactionMeta, {
        addressSecurityAlertResponses,
        eip7702SupportedChains: getEip7702SupportedChains(featureFlagState),
        internalAddresses,
      });
    },
  }).getBeforeSignHook();
}

function beforeCheckPendingTransactionsHook({
  messenger,
}: TransactionControllerHookRequest) {
  return (transactionMeta: TransactionMeta) =>
    messenger.call(
      'InstitutionalSnapController:beforeCheckPendingTransactionHook',
      transactionMeta,
    );
}

function publishHook({
  getFlatState,
  getTransactionMetricsRequest,
  messenger,
}: TransactionControllerHookRequest): PublishHook {
  return async (transactionMeta: TransactionMeta, signedTx: string) => {
    const flatState = getFlatState();
    const transactionController = {
      state: messenger.call('TransactionController:getState'),
    } as unknown as TransactionController;
    const { signingMode, sponsorshipEnabled } =
      await getTransactionApprovalDecision(
        { getFlatState, getTransactionMetricsRequest, messenger },
        transactionMeta,
      );
    const transactionMetaForPublish = {
      ...transactionMeta,
      isGasFeeSponsored: sponsorshipEnabled,
    };

    const { isSmartTransaction, featureFlags } =
      getSmartTransactionCommonParams(flatState, transactionMeta.chainId);

    const sendBundleSupport = await isSendBundleSupported(
      transactionMeta.chainId,
    );

    const payResult = await new TransactionPayPublishHook({
      isSmartTransaction: () => isSmartTransaction,
      messenger: messenger as unknown as TransactionPayControllerMessenger,
    }).getHook()(transactionMetaForPublish, signedTx as Hex);

    if (payResult?.transactionHash) {
      return payResult;
    }

    const keyringSupports7702 = await accountSupports7702ForRelay(
      transactionMeta.txParams?.from,
      getKeyringController(messenger),
    );

    const isRevokeDelegation =
      transactionMeta.type === TransactionType.revokeDelegation;

    const isSwapGasIncluded7702 = transactionMeta.isGasFeeIncluded;

    let attemptedHook = false;

    if (
      keyringSupports7702 &&
      !isRevokeDelegation &&
      (isSwapGasIncluded7702 ||
        !isSmartTransaction ||
        !sendBundleSupport ||
        signingMode === 'external')
    ) {
      attemptedHook = true;
      const hook = new Delegation7702PublishHook({
        messenger,
      }).getHook();

      const result = await hook(transactionMetaForPublish, signedTx);
      if (result?.transactionHash) {
        try {
          getTransactionMetricsRequest().upsertTransactionUIMetricsFragment(
            transactionMeta.id,
            {
              properties: {
                [TRANSACTION_SUBMISSION_METHOD_METRIC_NAME]:
                  TRANSACTION_SUBMISSION_METHOD.SENTINEL_RELAY,
              },
            },
          );
        } catch (e) {
          console.error('Failed to record sentinel_relay metrics fragment', e);
        }
        return result;
      }
    }

    if (
      isSmartTransaction &&
      (sendBundleSupport || transactionMeta.selectedGasFeeToken === undefined)
    ) {
      attemptedHook = true;

      const result = await submitSmartTransactionHook({
        transactionMeta: transactionMetaForPublish,
        signedTransactionInHex: signedTx as Hex,
        transactionController,
        smartTransactionsController: getSmartTransactionsController(messenger),
        controllerMessenger: messenger,
        isSmartTransaction,
        featureFlags,
      });

      if (result?.transactionHash) {
        try {
          getTransactionMetricsRequest().upsertTransactionUIMetricsFragment(
            transactionMeta.id,
            {
              properties: {
                [TRANSACTION_SUBMISSION_METHOD_METRIC_NAME]:
                  TRANSACTION_SUBMISSION_METHOD.SENTINEL_STX,
              },
            },
          );
        } catch (e) {
          console.error('Failed to record sentinel_stx metrics fragment', e);
        }
        return result;
      }
    }

    if (attemptedHook) {
      try {
        await messenger.call(
          'AppStateController:setDefaultHomeActiveTabName',
          AccountOverviewTabKey.Activity,
        );
      } catch (error) {
        console.error(
          'Failed to set default home active tab for fallback transaction',
          error,
        );
      }
    }

    return { transactionHash: undefined };
  };
}

function publishBatchHook({
  getFlatState,
  getTransactionMetricsRequest,
  messenger,
}: TransactionControllerHookRequest) {
  return async (request: PublishBatchHookRequest) => {
    const flatState = getFlatState();
    const transactionController = {
      state: messenger.call('TransactionController:getState'),
    } as unknown as TransactionController;

    const transactions = request.transactions as PublishBatchHookTransaction[];

    const lastTransaction = transactions[transactions.length - 1];
    const transactionMeta = getTransactionById(
      lastTransaction.id ?? '',
      transactionController,
    );

    if (!transactionMeta) {
      throw new Error(
        `publishBatchSmartTransactionHook: Could not find transaction with id ${lastTransaction.id}`,
      );
    }

    const { isSmartTransaction, featureFlags } =
      getSmartTransactionCommonParams(flatState, transactionMeta.chainId);

    if (!isSmartTransaction) {
      return undefined;
    }

    const result = await submitBatchSmartTransactionHook({
      transactions,
      transactionController,
      smartTransactionsController: getSmartTransactionsController(messenger),
      controllerMessenger:
        messenger as unknown as SmartTransactionHookMessenger,
      isSmartTransaction,
      featureFlags,
      transactionMeta,
    });

    if (result) {
      for (const batchTx of request.transactions) {
        if (batchTx.id) {
          try {
            getTransactionMetricsRequest().upsertTransactionUIMetricsFragment(
              batchTx.id,
              {
                properties: {
                  [TRANSACTION_SUBMISSION_METHOD_METRIC_NAME]:
                    TRANSACTION_SUBMISSION_METHOD.SENTINEL_STX,
                },
              },
            );
          } catch (e) {
            console.error(
              'Failed to record sentinel_stx batch metrics fragment',
              e,
            );
          }
        }
      }
    }

    return result;
  };
}

function getKeyringController(messenger: TransactionControllerInitMessenger) {
  return {
    getKeyringForAccount: (address: string) =>
      messenger.call('KeyringController:getKeyringForAccount', address),
  };
}

function getSmartTransactionsController(
  messenger: TransactionControllerInitMessenger,
): SmartTransactionsController {
  return {
    getFees: messenger.call.bind(
      messenger,
      'SmartTransactionsController:getFees',
    ),
    submitSignedTransactions: messenger.call.bind(
      messenger,
      'SmartTransactionsController:submitSignedTransactions',
    ),
  } as unknown as SmartTransactionsController;
}
