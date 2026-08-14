import { ORIGIN_METAMASK } from '@metamask/controller-utils';
import { buildMoneyAccountWithdrawPlaceholderBatch } from '@metamask/money-account-utils';
import { bytesToHex, type Hex } from '@metamask/utils';
import { parse as uuidParse, v4 as uuidv4 } from 'uuid';
import { CHAIN_IDS } from '../../../../../shared/constants/network';
import { getMoneyPayContext, type MoneyPayMessenger } from './pay-context';
import { submitPlaceholderBatch } from './submit-placeholder-batch';

const LOG_TAG = '[Money Account]';

/**
 * Creates the placeholder Money Account withdrawal batch: teller withdraw +
 * ERC-20 transfer with **no calldata**, re-encoded by
 * `updateMoneyAccountWithdrawAmount` once the user picks an amount. The
 * recipient is resolved there too — the placeholder carries no recipient, so
 * initiation needs neither the selected account nor a vault read.
 *
 * Mirrors `create-deposit-transaction.ts`, with two differences that follow
 * mobile: no `requiredAssets` (the withdrawal consumes the vault balance, not
 * a payment asset) and a locally generated batch id (withdrawals have no
 * deposit-intent map for the caller to key, but the id must still be known
 * before submission so `submitPlaceholderBatch` can recognise the
 * transaction).
 *
 * @param messenger - The messenger to build and submit through.
 * @returns The id of the created transaction, for confirmation navigation.
 */
export async function createMoneyAccountWithdrawTransaction(
  messenger: MoneyPayMessenger,
): Promise<{ transactionId: string; batchId: Hex }> {
  const context = getMoneyPayContext(messenger);
  if (!context) {
    throw new Error(`${LOG_TAG} Money account withdrawal is not available`);
  }

  const { moneyAccountAddress, vaultConfig, networkClientId } = context;
  const { chainId, tellerAddress } = vaultConfig;

  const { withdrawTx, transferTx } = buildMoneyAccountWithdrawPlaceholderBatch({
    chainId,
    tellerAddress,
  });

  const batchId = bytesToHex(new Uint8Array(uuidParse(uuidv4())));

  const transactionId = await submitPlaceholderBatch(messenger, batchId, {
    disableHook: true,
    disableSequential: true,
    disableUpgrade: true,
    from: moneyAccountAddress,
    // The gas-station sponsorship exists on Monad mainnet only.
    isGasFeeSponsored: chainId === CHAIN_IDS.MONAD,
    isInternal: true,
    networkClientId,
    origin: ORIGIN_METAMASK,
    skipInitialGasEstimate: true,
    transactions: [withdrawTx, transferTx],
  });

  return { transactionId, batchId };
}
