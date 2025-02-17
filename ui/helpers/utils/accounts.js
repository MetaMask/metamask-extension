import { InvisibleCharacter } from '../../components/component-library';
import {
  GOERLI_DISPLAY_NAME,
  LINEA_GOERLI_DISPLAY_NAME,
  LINEA_SEPOLIA_DISPLAY_NAME,
  SEPOLIA_DISPLAY_NAME,
} from '../../../shared/constants/network';
import { BackgroundColor } from '../constants/design-system';
import { KeyringType } from '../../../shared/constants/keyring';
import { HardwareKeyringNames } from '../../../shared/constants/hardware-wallets';
// TODO: Remove restricted import
// eslint-disable-next-line import/no-restricted-paths
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
    case LINEA_SEPOLIA_DISPLAY_NAME:
      return BackgroundColor.lineaSepolia;
    case SEPOLIA_DISPLAY_NAME:
      return BackgroundColor.sepolia;
    default:
      return undefined;
  }
}

export function getAccountLabels(
  type,
  account,
  keyrings,
  ///: BEGIN:ONLY_INCLUDE_IF(keyring-snaps)
  snapName,
  ///: END:ONLY_INCLUDE_IF
) {
  if (!account) {
    return [];
  }

  const labels = [];

  const hdKeyrings = keyrings.filter(
    (keyring) => keyring.type === KeyringType.hdKeyTree,
  );

  switch (type) {
    case KeyringType.hdKeyTree: {
      if (hdKeyrings.length > 1) {
        const hdKeyringIndex = hdKeyrings.findIndex((kr) =>
          kr.accounts.includes(account.address),
        );
        const hdKeyringLabel = `SRP #${hdKeyringIndex + 1}`;
        labels.push(hdKeyringLabel);
      }
      break;
    }
    case KeyringType.imported:
      labels.push(t('imported'));
      break;
    case KeyringType.qr:
      labels.push(HardwareKeyringNames.qr);
      break;
    case KeyringType.trezor:
      labels.push(HardwareKeyringNames.trezor);
      break;
    case KeyringType.ledger:
      labels.push(HardwareKeyringNames.ledger);
      break;
    case KeyringType.lattice:
      labels.push(HardwareKeyringNames.lattice);
      break;
    ///: BEGIN:ONLY_INCLUDE_IF(keyring-snaps)
    case KeyringType.snap: {
      const snapEntroypyId = account.options.entropyId;
      if (snapEntroypyId) {
        const hdKeyringIndex = hdKeyrings.findIndex(
          (kr) => kr.metadata.id === snapEntroypyId,
        );
        const hdKeyringLabel = `SRP #${hdKeyringIndex + 1}`;
        labels.push(hdKeyringLabel);
      }
      if (snapName) {
        labels.push(`${snapName} (${t('beta')})`);
        break;
      }
      labels.push(`${t('snaps')} (${t('beta')})`);
      break;
    }
    ///: END:ONLY_INCLUDE_IF
    default: {
      break;
    }
  }
  return labels;
}
