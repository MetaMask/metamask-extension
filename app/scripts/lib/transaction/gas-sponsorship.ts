import type { TransactionMeta } from '@metamask/transaction-controller';
import {
  getIsGasFeeSponsored,
  isGasFeeSponsorshipPossible,
  isGasFeeSponsorshipRequired,
  isMoneyAccountSponsorship,
} from '../../../../shared/lib/gas-sponsorship';
import { getPreferences } from '../../../../shared/lib/selectors/preferences';
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
 * Resolves account and chain capabilities in the background and applies the
 * shared {@link getIsGasFeeSponsored} rules, which the confirmation UI also
 * uses. Used by the publish hook, the `shouldSign` hook, and Transaction Pay.
 * Throws when a transaction that requires sponsorship cannot be sponsored.
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
  const isSponsorshipRequired = isGasFeeSponsorshipRequired(transaction);

  if (!isGasFeeSponsorshipPossible(transaction)) {
    return failSponsorship(isSponsorshipRequired);
  }

  const flatState = getFlatState();
  const { gasSponsorshipOptOutByChainId } = getPreferences({
    metamask: flatState,
  });
  const isOptedOut = Boolean(gasSponsorshipOptOutByChainId?.[chainId]);

  if (isOptedOut) {
    return failSponsorship(isSponsorshipRequired);
  }

  if (isMoneyAccountSponsorship(transaction)) {
    return true;
  }

  const { isHardwareWalletAccount, isSmartTransaction } =
    getSmartTransactionCommonParams(flatState, chainId);

  const isSmartTransactionBundleSupported =
    isSmartTransaction && (await isSendBundleSupported(chainId));

  const isGaslessSupported =
    isSmartTransactionBundleSupported ||
    (!isHardwareWalletAccount &&
      txParams?.to !== undefined &&
      (await accountSupports7702ForRelay(txParams.from, keyringController)) &&
      (await isRelaySupported(chainId)));

  const sponsored = getIsGasFeeSponsored(transaction, {
    isGaslessSupported,
    isOptedOut,
  });

  return sponsored || failSponsorship(isSponsorshipRequired);
}

function failSponsorship(isSponsorshipRequired: boolean): false {
  if (isSponsorshipRequired) {
    throw new Error('Required transaction sponsorship is unavailable');
  }

  return false;
}
