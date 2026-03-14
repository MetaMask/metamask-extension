/**
 * Metamask selectors that do not depend on metamask duck or the rest of selectors.
 * Used to break the metamask → actions → index → selectors → metamask cycle.
 *
 * Imports only from: shared, metamask-state-basic, send-ether-selectors.
 */

import { addHexPrefix, stripHexPrefix } from 'ethereumjs-util';
import { KeyringType } from '../../shared/constants/keyring';
import { isEqualCaseInsensitive } from '../../shared/lib/string-utils';
import { getProviderConfig } from '../../shared/lib/selectors/networks';
import { getCurrencyRateControllerCurrencyRates } from '../../shared/lib/selectors/assets-migration';
import type { MetaMaskReduxState } from '../store/store';
import { getCompletedOnboarding } from './metamask-state-basic';
import { isNotEIP1559Network } from './send-ether-selectors';

export { getCompletedOnboarding, isNotEIP1559Network };

export function getConversionRate(
  state: MetaMaskReduxState,
): number | undefined {
  return (
    getCurrencyRateControllerCurrencyRates(state)[
      getProviderConfig(state).ticker
    ]?.conversionRate ?? undefined
  );
}

export function getIsUnlocked(state: MetaMaskReduxState): boolean {
  return state.metamask.isUnlocked;
}

export function getLedgerTransportType(
  state: MetaMaskReduxState,
): string | undefined {
  return state.metamask.ledgerTransportType;
}

function findKeyringForAddress(
  state: MetaMaskReduxState,
  address: string,
): { type?: string; accounts: string[] } | undefined {
  const keyring = state.metamask.keyrings.find((kr: { accounts: string[] }) => {
    return kr.accounts.some((account: string) => {
      return (
        isEqualCaseInsensitive(account, addHexPrefix(address)) ||
        isEqualCaseInsensitive(account, stripHexPrefix(address))
      );
    });
  });

  return keyring;
}

export function isAddressLedger(
  state: MetaMaskReduxState,
  address: string,
): boolean {
  const keyring = findKeyringForAddress(state, address);
  return keyring?.type === KeyringType.ledger;
}
