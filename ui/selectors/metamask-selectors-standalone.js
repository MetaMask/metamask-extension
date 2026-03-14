/**
 * Metamask selectors that do not depend on metamask duck or the rest of selectors.
 * Used to break the metamask → actions → index → selectors → metamask cycle.
 *
 * Imports only from: shared, metamask-state-basic, send-ether-selectors.
 */

import { KeyringType } from '../../shared/constants/keyring';
import { addHexPrefix, stripHexPrefix } from '../../shared/lib/hexstring-utils';
import { isEqualCaseInsensitive } from '../../shared/lib/string-utils';
import { getProviderConfig } from '../../shared/lib/selectors/networks';
import { getCurrencyRateControllerCurrencyRates } from '../../shared/lib/selectors/assets-migration';
import { getCompletedOnboarding } from './metamask-state-basic';
import { isNotEIP1559Network } from './send-ether-selectors';

export { getCompletedOnboarding, isNotEIP1559Network };

export function getConversionRate(state) {
  return (
    getCurrencyRateControllerCurrencyRates(state)[
      getProviderConfig(state).ticker
    ]?.conversionRate ?? undefined
  );
}

export function getIsUnlocked(state) {
  return state.metamask.isUnlocked;
}

export function getLedgerTransportType(state) {
  return state.metamask.ledgerTransportType;
}

function findKeyringForAddress(state, address) {
  const keyring = state.metamask.keyrings.find((kr) => {
    return kr.accounts.some((account) => {
      return (
        isEqualCaseInsensitive(account, addHexPrefix(address)) ||
        isEqualCaseInsensitive(account, stripHexPrefix(address))
      );
    });
  });

  return keyring;
}

export function isAddressLedger(state, address) {
  const keyring = findKeyringForAddress(state, address);
  return keyring?.type === KeyringType.ledger;
}
