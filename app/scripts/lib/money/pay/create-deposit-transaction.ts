import { ORIGIN_METAMASK } from '@metamask/controller-utils';
import {
  buildMoneyAccountDepositPlaceholderBatch,
  getMoneyAccountDepositAssetAddress,
} from '@metamask/money-account-utils';
import type { Hex } from '@metamask/utils';
import { CHAIN_IDS } from '../../../../../shared/constants/network';
import { getMoneyPayContext, type MoneyPayMessenger } from './pay-context';
import { submitPlaceholderBatch } from './submit-placeholder-batch';

const LOG_TAG = '[Money Account]';

/**
 * Creates the placeholder Money Account deposit batch: ERC-20 approve +
 * teller deposit with **no calldata**, which Pay re-encodes once the user
 * picks an amount (`getAmountData` / `updateMoneyAccountDepositAmount`).
 *
 * The batch executes **from the money account** — MetaMask Pay selects the
 * user's own account and moves funds to the money account first, so `from`
 * and the network client are the money account's, not the selected
 * account's. `requiredAssets` names mUSD with a zero amount so Pay knows
 * which asset the batch consumes before an amount exists.
 *
 * Throws when the money account is unavailable: unlike the Pay callbacks,
 * initiation is an explicit user action, so failing loudly is correct — and
 * the entry point is hidden behind the availability gate, so reaching this
 * unavailable is a bug, not a state.
 *
 * @param messenger - The messenger to build and submit through.
 * @param batchId - Caller-generated batch id, recorded against the deposit
 * intent before this call so the intent survives regardless of timing.
 * @returns The id of the created transaction, for confirmation navigation.
 */
export async function createMoneyAccountDepositTransaction(
  messenger: MoneyPayMessenger,
  batchId: Hex,
): Promise<{ transactionId: string; batchId: Hex }> {
  const context = getMoneyPayContext(messenger);
  if (!context) {
    throw new Error(`${LOG_TAG} Money account deposit is not available`);
  }

  const { moneyAccountAddress, vaultConfig, networkClientId } = context;
  const { chainId, tellerAddress } = vaultConfig;

  const { approveTx, depositTx } = buildMoneyAccountDepositPlaceholderBatch({
    chainId,
    tellerAddress,
  });

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
    requiredAssets: [
      {
        address: getMoneyAccountDepositAssetAddress(chainId),
        amount: '0x0' as Hex,
        standard: 'erc20',
      },
    ],
    skipInitialGasEstimate: true,
    transactions: [approveTx, depositTx],
  });

  return { transactionId, batchId };
}
