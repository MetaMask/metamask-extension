import { IconName } from '@metamask/snaps-sdk/jsx';
///: BEGIN:ONLY_INCLUDE_IF(bitcoin)
import { KnownCaipNamespace, parseCaipChainId } from '@metamask/utils';
///: END:ONLY_INCLUDE_IF
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
import { t } from '../../../shared/lib/translate';
import { isSnapPreinstalled } from '../../../shared/lib/snaps/snaps';
///: BEGIN:ONLY_INCLUDE_IF(bitcoin)
import { MULTICHAIN_ACCOUNT_TYPE_TO_NAME } from '../../../shared/constants/multichain/accounts';
///: END:ONLY_INCLUDE_IF

export function getAccountNameErrorMessage(
  accounts,
  context,
  newAccountName,
  defaultAccountName,
) {
  const isDuplicateAccountName = accounts.some(
    (item) =>
      item.metadata?.name?.toLowerCase() === newAccountName?.toLowerCase(),
  );

  const isEmptyAccountName = !newAccountName || newAccountName === '';

  const localizedWordForAccount = context
    .t('newAccountNumberName')
    .replace(' $1', '');

  // Match strings starting with ${localizedWordForAccount} and then any numeral, case insensitive
  // Trim spaces before and after
  const reservedRegEx = new RegExp(
    `^\\s*${localizedWordForAccount} \\d+\\s*$`,
    'iu',
  );
  const isReservedAccountName = reservedRegEx.test(newAccountName || '');

  const isValidAccountName =
    newAccountName?.toLowerCase() === defaultAccountName?.toLowerCase() || // What is written in the text
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

const toSrpLabel = (index) =>
  // Index starts at 1, for SRPs.
  `SRP #${index + 1}`;

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
        labels.push({
          label: toSrpLabel(hdKeyringIndex),
          icon: null,
        });
      }
      break;
    }
    case KeyringType.imported:
      labels.push({
        label: t('imported'),
        icon: null,
      });
      break;
    case KeyringType.qr:
      labels.push({
        label: HardwareKeyringNames.qr,
        icon: null,
      });
      break;
    case KeyringType.trezor:
      labels.push({
        label: HardwareKeyringNames.trezor,
        icon: null,
      });
      break;
    case KeyringType.ledger:
      labels.push({
        label: HardwareKeyringNames.ledger,
        icon: null,
      });
      break;
    case KeyringType.oneKey:
      labels.push({
        label: HardwareKeyringNames.oneKey,
        icon: null,
      });
      break;
    case KeyringType.lattice:
      labels.push({
        label: HardwareKeyringNames.lattice,
        icon: null,
      });
      break;
    ///: BEGIN:ONLY_INCLUDE_IF(keyring-snaps)
    case KeyringType.snap: {
      const { entropySource } = account.options;
      if (entropySource && hdKeyrings.length > 1) {
        const hdKeyringIndex = hdKeyrings.findIndex(
          (kr) => kr.metadata.id === entropySource,
        );
        labels.push({
          label: toSrpLabel(hdKeyringIndex),
          icon: null,
        });
      }

      const isPreinstalled = isSnapPreinstalled(account.metadata.snap.id);

      if (isPreinstalled) {
        break;
      }

      if (snapName) {
        labels.push({
          label: `${snapName} (${t('beta')})`,
          icon: IconName.Snaps,
        });
        break;
      }
      labels.push({
        label: `${t('snaps')} (${t('beta')})`,
        icon: IconName.Snaps,
      });
      break;
    }
    ///: END:ONLY_INCLUDE_IF
    default: {
      break;
    }
  }

  ///: BEGIN:ONLY_INCLUDE_IF(bitcoin)
  const { namespace } = parseCaipChainId(account.type);
  if (namespace === KnownCaipNamespace.Bip122) {
    labels.push({
      label: `${MULTICHAIN_ACCOUNT_TYPE_TO_NAME[account.type]}`,
      icon: null,
    });
  }
  ///: END:ONLY_INCLUDE_IF

  return labels;
}
