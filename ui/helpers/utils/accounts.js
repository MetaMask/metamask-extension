import { InvisibleCharacter } from '../../components/component-library';
import {
  GOERLI_DISPLAY_NAME,
  LINEA_GOERLI_DISPLAY_NAME,
  SEPOLIA_DISPLAY_NAME,
} from '../../../shared/constants/network';
import { BackgroundColor } from '../constants/design-system';
import { KeyringType } from '../../../shared/constants/keyring';
import { HardwareKeyringNames } from '../../../shared/constants/hardware-wallets';
import { t } from '../../../app/scripts/translate';

export function getAccountNameErrorMessage(
  accounts,
  context,
  newAccountName,
  defaultAccountName,
) {
  const isDuplicateAccountName = accounts.some(
    (item) => item.metadata.name.toLowerCase() === newAccountName.toLowerCase(),
  );

  const isEmptyAccountName = newAccountName === '';

  const localizedWordForAccount = context
    .t('newAccountNumberName')
    .replace(' $1', '');

  // Match strings starting with ${localizedWordForAccount} and then any numeral, case insensitive
  // Trim spaces before and after
  const reservedRegEx = new RegExp(
    `^\\s*${localizedWordForAccount} \\d+\\s*$`,
    'iu',
  );
  const isReservedAccountName = reservedRegEx.test(newAccountName);

  const isValidAccountName =
    newAccountName.toLowerCase() === defaultAccountName.toLowerCase() || // What is written in the text
    // field is the same as the
    // placeholder
    (!isDuplicateAccountName && !isReservedAccountName && !isEmptyAccountName);

  let errorMessage;
  if (isValidAccountName) {
    errorMessage = InvisibleCharacter; // Using an invisible character, so the spacing stays
    // constant
  } else if (isDuplicateAccountName) {
    errorMessage = context.t('accountNameDuplicate');
  } else if (isReservedAccountName) {
    errorMessage = context.t('accountNameReserved');
  } else if (isEmptyAccountName) {
    errorMessage = context.t('required');
  }

  return { isValidAccountName, errorMessage };
}

export function getAvatarNetworkColor(name) {
  switch (name) {
    case GOERLI_DISPLAY_NAME:
      return BackgroundColor.goerli;
    case LINEA_GOERLI_DISPLAY_NAME:
      return BackgroundColor.lineaGoerli;
    case SEPOLIA_DISPLAY_NAME:
      return BackgroundColor.sepolia;
    default:
      return undefined;
  }
}

export function getAccountLabel(type, account) {
  if (!account) {
    return null;
  }
  switch (type) {
    case KeyringType.hdKeyTree:
      return null;
    case KeyringType.imported:
      return t('imported');
    case KeyringType.qr:
      return HardwareKeyringNames.qr;
    case KeyringType.trezor:
      return HardwareKeyringNames.trezor;
    case KeyringType.ledger:
      return HardwareKeyringNames.ledger;
    case KeyringType.lattice:
      return HardwareKeyringNames.lattice;
    ///: BEGIN:ONLY_INCLUDE_IF(keyring-snaps)
    case KeyringType.snap:
      if (account.metadata.snap?.name) {
        return `${account.metadata.snap?.name} (${t('beta')})`;
      }
      return `${t('snaps')} (${t('beta')})`;
    ///: END:ONLY_INCLUDE_IF
    default:
      return null;
  }
}
