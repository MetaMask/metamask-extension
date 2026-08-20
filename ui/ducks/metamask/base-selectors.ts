import { addHexPrefix } from 'ethereumjs-util';
import { KeyringType } from '../../../shared/constants/keyring';
import { getCurrencyRateControllerCurrencyRates } from '../../../shared/lib/selectors/assets-migration';
import { stripHexPrefix } from '../../../shared/lib/hexstring-utils';
import {
  getProviderConfig,
  getSelectedNetworkClientId,
} from '../../../shared/lib/selectors/networks';
import { isEqualCaseInsensitive } from '../../../shared/lib/string-utils';
import type { MetaMaskSlice } from './types';

export function getConversionRate(state: MetaMaskSlice) {
  return (
    getCurrencyRateControllerCurrencyRates(state)[
      getProviderConfig(state).ticker
    ]?.conversionRate ?? undefined
  );
}

/**
 * Function returns true if network details are fetched and it is found to not support EIP-1559
 *
 * @param state
 */
export function isNotEIP1559Network(state: MetaMaskSlice) {
  const selectedNetworkClientId = getSelectedNetworkClientId(state);
  return (
    state.metamask.networksMetadata[selectedNetworkClientId].EIPS[1559] ===
    false
  );
}

/**
 * Function returns true if network details are fetched and it is found to support EIP-1559
 *
 * @param state
 * @param networkClientId - The optional network client ID to check for EIP-1559 support. Defaults to the currently selected network.
 */
export function isEIP1559Network(
  state: MetaMaskSlice,
  networkClientId?: string,
) {
  const selectedNetworkClientId = getSelectedNetworkClientId(state);

  return (
    state.metamask.networksMetadata?.[
      networkClientId ?? selectedNetworkClientId
    ]?.EIPS[1559] === true
  );
}

/**
 * Given the redux state object and an address, finds a keyring that contains that address, if one exists
 *
 * @param state - the redux state object
 * @param address - the address to search for among the keyring addresses
 * @returns The keyring which contains the passed address, or undefined
 */
export function findKeyringForAddress(state: MetaMaskSlice, address: string) {
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

/**
 * Given the redux state object, returns the users preferred ledger transport type
 *
 * @param state - the redux state object
 * @returns The users preferred ledger transport type. One of 'webhid' on chrome or 'u2f' on firefox
 */
export function getLedgerTransportType(state: MetaMaskSlice) {
  return state.metamask.ledgerTransportType;
}

/**
 * Given the redux state object and an address, returns a boolean indicating whether the passed address is part of a Ledger keyring
 *
 * @param state - the redux state object
 * @param address - the address to search for among all keyring addresses
 * @returns true if the passed address is part of a ledger keyring, and false otherwise
 */
export function isAddressLedger(state: MetaMaskSlice, address: string) {
  const keyring = findKeyringForAddress(state, address);

  return keyring?.type === KeyringType.ledger;
}

export function getIsUnlocked(state: MetaMaskSlice) {
  return state.metamask.isUnlocked;
}
