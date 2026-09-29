import {
  type TransactionMeta,
  TransactionType,
} from '@metamask/transaction-controller';
import { getPreferences } from '../../../../shared/lib/selectors/preferences';
import { hasTransactionType } from '../../../../shared/lib/transactions.utils';
import { accountSupports7702ForRelay } from '../account-supports-7702';
import { getSmartTransactionCommonParams } from '../smart-transaction/smart-transactions';
import type { MessengerClientFlatState } from '../../messenger-client-init/controller-list';
import { isSendBundleSupported } from './sentinel-api';
import { isRelaySupported } from './transaction-relay';

type KeyringControllerLike = {
  getKeyringForAccount: (address: string) => Promise<unknown>;
};

export type GasFeeSponsorshipRequest = {
  getFlatState: () => MessengerClientFlatState;
  keyringController: KeyringControllerLike;
};

/**
 * Determines whether MetaMask sponsors the gas fee of a transaction.
 *
 * This is the single sponsorship definition used by the publish hook, the
 * `shouldSign` hook, and Transaction Pay. Sponsorship requires availability
 * (from simulation or required by the transaction creator), no user opt-out,
 * and a supported publisher (Smart Transactions with sendBundle, or the
 * EIP-7702 relay for software accounts).
 *
 * @param request - Sponsorship dependencies.
 * @param request.getFlatState - Returns the flat background state.
 * @param request.keyringController - Resolves the keyring for an account.
 * @param transaction - The transaction to evaluate.
 * @returns Whether the gas fee is sponsored.
 */
export async function isGasFeeSponsored(
  { getFlatState, keyringController }: GasFeeSponsorshipRequest,
  transaction: TransactionMeta,
): Promise<boolean> {
  const { chainId, txParams } = transaction;

  if (transaction.type === TransactionType.revokeDelegation) {
    return false;
  }

  const isSponsorshipRequired = hasTransactionType(transaction, [
    TransactionType.moneyAccountWithdraw,
  ]);

  if (
    !transaction.forceIsGasFeeSponsored &&
    !transaction.isGasFeeSponsoredAvailable
  ) {
    return failSponsorship(isSponsorshipRequired);
  }

  const flatState = getFlatState();
  const { gasSponsorshipOptOutByChainId } = getPreferences({
    metamask: flatState,
  });

  if (gasSponsorshipOptOutByChainId?.[chainId]) {
    return failSponsorship(isSponsorshipRequired);
  }

  // Money Account batches execute from the Money Account keyring, which is
  // relay-capable, so the selected account type does not apply.
  if (
    hasTransactionType(transaction, [
      TransactionType.moneyAccountDeposit,
      TransactionType.moneyAccountWithdraw,
    ])
  ) {
    return true;
  }

  const { isHardwareWalletAccount, isSmartTransaction } =
    getSmartTransactionCommonParams(flatState, chainId);

  if (isSmartTransaction && (await isSendBundleSupported(chainId))) {
    return true;
  }

  if (isHardwareWalletAccount || txParams?.to === undefined) {
    return failSponsorship(isSponsorshipRequired);
  }

  if (
    (await accountSupports7702ForRelay(txParams.from, keyringController)) &&
    (await isRelaySupported(chainId))
  ) {
    return true;
  }

  return failSponsorship(isSponsorshipRequired);
}

function failSponsorship(isSponsorshipRequired: boolean): false {
  if (isSponsorshipRequired) {
    throw new Error('Required transaction sponsorship is unavailable');
  }

  return false;
}
