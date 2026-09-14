import {
  PaymentOverride,
  TransactionPayController,
  TransactionPayControllerMessenger,
  TransactionPayStrategy,
  type GetSolanaPayQuoteRequest,
} from '@metamask/transaction-pay-controller';
import type { TransactionMeta } from '@metamask/transaction-controller';
import { BigNumber } from 'bignumber.js';
import {
  KnownCaipNamespace,
  parseCaipAssetType,
  toCaipChainId,
  type CaipAccountId,
  type CaipAssetType,
  type Hex,
} from '@metamask/utils';
import {
  getMoneyAccountFlow,
  MoneyAccountFlow,
} from '../../../shared/lib/money/money-account-flow';
import { toAssetId } from '../../../shared/lib/asset-utils';
import {
  type DelegationMessenger,
  getDelegationTransaction,
} from '../lib/transaction/delegation';
import { getBalance } from '../lib/money/pay/get-balance-callback';
import {
  clearMaxSourceBalance,
  setMaxSourceBalance,
} from '../lib/money/pay/max-source-balance';
import { createMoneyAccountDepositTransaction } from '../lib/money/pay/create-deposit-transaction';
import { createMoneyAccountWithdrawTransaction } from '../lib/money/pay/create-withdraw-transaction';
import { getPaymentOverrideData } from '../lib/money/pay/payment-override-callback';
import {
  getMoneyAccountAmountData,
  updateMoneyAccountDepositAmount,
} from '../lib/money/pay/update-deposit-amount';
import { updateMoneyAccountWithdrawAmount } from '../lib/money/pay/update-withdraw-amount';
import { createSolanaPayCallbacks } from '../lib/money/pay/solana-pay-callbacks';
import type {
  MoneyPayMessenger,
  PaymentOverrideMessenger,
} from '../lib/money/pay/pay-context';
import type {
  MessengerClientInitFunction,
  MessengerClientInitResult,
} from './types';
import type { TransactionPayControllerInitMessenger } from './messengers';

export const TransactionPayControllerInit: MessengerClientInitFunction<
  TransactionPayController,
  TransactionPayControllerMessenger,
  TransactionPayControllerInitMessenger
> = (request) => {
  const { controllerMessenger, initMessenger, persistedState } = request;

  const getDelegationTransactionCallback: (request: {
    transaction: TransactionMeta;
    isSubsidized?: boolean;
  }) => ReturnType<typeof getDelegationTransaction> = ({
    transaction,
    isSubsidized,
  }) =>
    getDelegationTransaction(
      {
        messenger: initMessenger as DelegationMessenger,
        isSubsidized,
      },
      transaction,
    );

  const messengerClient = new TransactionPayController({
    getAmountData: (amountDataRequest) =>
      getMoneyAccountAmountData(
        initMessenger as MoneyPayMessenger,
        amountDataRequest,
      ),
    getBalance,
    getDelegationTransaction: getDelegationTransactionCallback,
    getPaymentOverrideData: (paymentOverrideRequest) =>
      getPaymentOverrideData(
        paymentOverrideRequest,
        initMessenger as PaymentOverrideMessenger,
      ),
    getStrategy,
    messenger: controllerMessenger,
    solana: createSolanaPayCallbacks(initMessenger, request.infuraProjectId),
    state: persistedState.TransactionPayController,
  });

  messengerClient.recoverSolanaPay().catch((error) => {
    console.error('Failed to recover Solana Pay transactions', error);
  });

  const api = getApi(messengerClient, initMessenger as MoneyPayMessenger);

  return { messengerClient, api };
};

function getApi(
  messengerClient: TransactionPayController,
  moneyPayMessenger: MoneyPayMessenger,
): MessengerClientInitResult<TransactionPayController>['api'] {
  return {
    createMoneyAccountDepositTransaction: async (
      batchId: Hex,
      accountOverride: Hex,
    ) => {
      const result = await createMoneyAccountDepositTransaction(
        moneyPayMessenger,
        batchId,
      );
      seedDepositPayConfig(
        messengerClient,
        result.transactionId,
        accountOverride,
      );
      return result;
    },
    createMoneyAccountWithdrawTransaction: async (accountOverride: Hex) => {
      const result =
        await createMoneyAccountWithdrawTransaction(moneyPayMessenger);
      seedAccountOverride(
        messengerClient,
        result.transactionId,
        accountOverride,
      );
      return result;
    },
    setTransactionPayIsMaxAmount: (
      transactionId: string,
      isMaxAmount: boolean,
      options: {
        isMoneyAccountDeposit?: boolean;
        sourceAccountAddress?: string;
        sourceBalanceRaw?: string;
        sourceChainId?: string;
        sourceTokenAddress?: string;
      } = {},
    ) => {
      // Deposit Max quotes the funding-account balance, which the controller's
      // own pay-token snapshot does not hold reliably. Record what the UI
      // resolved so the getBalance callback can supply it (see
      // max-source-balance).
      if (options.isMoneyAccountDeposit) {
        if (isMaxAmount && options.sourceBalanceRaw) {
          setMaxSourceBalance(
            {
              transactionId,
              accountAddress: options.sourceAccountAddress,
              chainId: options.sourceChainId,
              tokenAddress: options.sourceTokenAddress,
            },
            options.sourceBalanceRaw,
          );
        } else {
          clearMaxSourceBalance(transactionId);
        }
      }

      messengerClient.setTransactionConfig(transactionId, (config) => {
        config.isMaxAmount = isMaxAmount;

        if (options.isMoneyAccountDeposit) {
          config.atomic = isMaxAmount ? false : undefined;
        }
      });
    },
    setTransactionPayPostQuote: (
      transactionId: string,
      options: { isHyperliquidSource?: boolean } = {},
    ) => {
      messengerClient.setTransactionConfig(transactionId, (config) => {
        config.isPostQuote = true;
        if (options.isHyperliquidSource) {
          config.isHyperliquidSource = true;
        }
      });
    },
    setTransactionPayAccountOverride: (
      transactionId: string,
      accountOverride: Hex,
    ) => {
      messengerClient.setTransactionConfig(transactionId, (config) => {
        config.accountOverride = accountOverride;
      });
    },
    updateMoneyAccountDepositAmount: async (
      transactionId: string,
      amountHuman: string,
    ) => {
      // Refresh the payment-token snapshot before committing so source amounts
      // can use a current balanceRaw. Prefill often runs while the snapshot is
      // still 0/stale (tx `from` is the vault).
      // `updatePaymentToken` is synchronous: it resolves the token and writes
      // state before returning, so the refresh cannot land after the amount
      // commit below and only throws synchronously.
      const paymentToken =
        messengerClient.state?.transactionData?.[transactionId]?.paymentToken;
      if (paymentToken) {
        try {
          messengerClient.updatePaymentToken({
            transactionId,
            tokenAddress: paymentToken.address,
            chainId: paymentToken.chainId,
          });
        } catch {
          // Balance/rates may still be settling; amount commit below still runs.
        }
      }

      // Re-assert non-atomic + quote-required on every amount update so
      // confirmations created before seedDepositPayConfig gained `atomic:
      // false` still quote without waiting on vault calldata. Leave
      // isMaxAmount alone — Max / uncapped 100% prefill set it separately.
      messengerClient.setTransactionConfig(transactionId, (config) => {
        config.atomic = false;
        config.isQuoteRequired = true;
      });
      return updateMoneyAccountDepositAmount(
        moneyPayMessenger,
        transactionId,
        amountHuman,
      );
    },
    updateMoneyAccountWithdrawAmount: (
      transactionId: string,
      amountHuman: string,
      recipientOverride?: Hex,
    ) => {
      const resolvedRecipient =
        recipientOverride ??
        messengerClient.state?.transactionData?.[transactionId]
          ?.accountOverride;
      return updateMoneyAccountWithdrawAmount(
        moneyPayMessenger,
        transactionId,
        amountHuman,
        resolvedRecipient,
      );
    },
    setTransactionPayPaymentOverride: (
      transactionId: string,
      {
        atomic,
        paymentOverride,
        refundTo,
      }: {
        atomic?: boolean;
        paymentOverride?: PaymentOverride;
        refundTo?: Hex;
      } = {},
    ) => {
      messengerClient.setTransactionConfig(transactionId, (config) => {
        config.paymentOverride = paymentOverride;
        if (paymentOverride === undefined) {
          const transaction = moneyPayMessenger
            .call('TransactionController:getState')
            .transactions.find(({ id }) => id === transactionId);
          const keepNonAtomic =
            config.isMaxAmount &&
            getMoneyAccountFlow(transaction) === MoneyAccountFlow.Deposit;
          config.atomic = keepNonAtomic ? false : undefined;
          config.refundTo = undefined;
          return;
        }
        if (atomic !== undefined) {
          config.atomic = atomic;
        }
        if (refundTo !== undefined) {
          config.refundTo = refundTo;
        }
      });
    },
    setSolanaPaySource: async (
      transactionId: string,
      sourceAccountId: CaipAccountId,
      sourceAssetId: CaipAssetType,
      quoteRequest: Omit<GetSolanaPayQuoteRequest, 'transactionId'>,
    ) => {
      messengerClient.setPayIntent({
        transactionId,
        intent: {
          version: 1,
          sourceAccountId,
          sourceAssetId,
          sourceChainId: parseCaipAssetType(sourceAssetId).chainId,
        },
      });
      const quote = await messengerClient.getSolanaPayQuote({
        ...quoteRequest,
        transactionId,
      });
      const targetAmount = messengerClient.state.transactionData[
        transactionId
      ]?.tokens.find(({ skipIfBalance }) => !skipIfBalance)?.amountRaw;
      const outputAmount = quote.providerQuote.details.currencyOut.amount;
      if (
        targetAmount &&
        new BigNumber(outputAmount).gt(0) &&
        new BigNumber(outputAmount).lt(targetAmount)
      ) {
        const adjustedAmount = new BigNumber(quoteRequest.amount)
          .times(targetAmount)
          .dividedBy(outputAmount)
          .times('1.005')
          .toFixed(0, BigNumber.ROUND_CEIL);
        return await messengerClient.getSolanaPayQuote({
          ...quoteRequest,
          amount: adjustedAmount,
          transactionId,
        });
      }
      return quote;
    },
    updateTransactionPaymentToken: (request: {
      transactionId: string;
      tokenAddress: Hex;
      chainId: Hex;
    }) => {
      messengerClient.updatePaymentToken(request);
      const intent = messengerClient.state.payIntents[request.transactionId];
      if (!intent?.sourceChainId.startsWith('solana:')) {
        return;
      }
      const transaction = moneyPayMessenger
        .call('TransactionController:getState')
        .transactions.find(({ id }) => id === request.transactionId);
      const accountAddress =
        messengerClient.state.transactionData[request.transactionId]
          ?.accountOverride ?? transaction?.txParams.from;
      const sourceAssetId = toAssetId(request.tokenAddress, request.chainId);
      if (!accountAddress || !sourceAssetId) {
        return;
      }
      const sourceChainId = toCaipChainId(
        KnownCaipNamespace.Eip155,
        Number.parseInt(request.chainId, 16).toString(),
      );
      messengerClient.setPayIntent({
        transactionId: request.transactionId,
        intent: {
          version: 1,
          sourceAccountId: `${sourceChainId}:${accountAddress}`,
          sourceAssetId,
          sourceChainId,
        },
      });
    },
  };
}

/**
 * Seeds Pay's funding/destination account. Money Account batches execute
 * `from` the money account, so without this override the confirmation From
 * row and Pay quotes fall back to that address instead of the user's
 * currently selected EVM account.
 *
 * @param messengerClient - TransactionPayController to write config on.
 * @param transactionId - Created transaction id.
 * @param accountOverride - Currently selected EVM account address.
 */
function seedAccountOverride(
  messengerClient: TransactionPayController,
  transactionId: string,
  accountOverride: Hex,
): void {
  messengerClient.setTransactionConfig(transactionId, (config) => {
    config.accountOverride = accountOverride;
  });
}

/**
 * Seeds deposit Pay config: funding account, `isQuoteRequired`, and
 * non-atomic Relay.
 *
 * Paying with same-chain mUSD is otherwise a Pay no-op (Strategy.None). The
 * publish hook then skips, so Add funds never moves mUSD from the selected
 * EOA onto the money account or embeds the vault calls. Forcing a quote
 * makes Relay own submit.
 *
 * Deposits always run non-atomic (`atomic: false`): Relay bridges funds to
 * the money account first, then the vault deposit runs after settlement.
 * Atomic embeds need parent EIP-7702 calldata at quote time, but amount
 * commits write `requiredAssets` before vault encode finishes — Relay then
 * skips embedding and often returns no quotes. Max deposits already used
 * this path; percentage / typed amounts need it too.
 *
 * @param messengerClient - TransactionPayController to write config on.
 * @param transactionId - Created transaction id.
 * @param accountOverride - Currently selected EVM account address.
 */
function seedDepositPayConfig(
  messengerClient: TransactionPayController,
  transactionId: string,
  accountOverride: Hex,
): void {
  messengerClient.setTransactionConfig(transactionId, (config) => {
    config.accountOverride = accountOverride;
    config.isQuoteRequired = true;
    config.atomic = false;
  });
}

function getStrategy(_transaction: TransactionMeta): TransactionPayStrategy {
  return TransactionPayStrategy.Relay;
}
