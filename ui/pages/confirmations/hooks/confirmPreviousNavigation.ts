import { TransactionType } from '@metamask/transaction-controller';

export const CONFIRM_RETURN_TO_KEY = 'confirm-return-to';

export const RETURN_TO_PREVIOUS_TYPES: TransactionType[] = [
  TransactionType.musdConversion,
  TransactionType.musdClaim,
];

/**
 * Saves the current path so the confirmation back button can return to it.
 * Call this before navigating to a confirmation route.
 *
 * @param pathname - The current pathname to save
 * @param search - Optional search/query string to append
 */
export function setConfirmReturnTo(pathname: string, search: string = '') {
  sessionStorage.setItem(CONFIRM_RETURN_TO_KEY, pathname + search);
}
