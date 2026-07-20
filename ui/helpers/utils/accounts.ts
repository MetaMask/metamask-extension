import {
  type CaipChainId,
  KnownCaipNamespace,
  parseCaipChainId,
} from '@metamask/utils';
import { isSnapId } from '@metamask/snaps-utils';
import {
  IconName,
  InvisibleCharacter,
} from '../../components/component-library';
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
import { MULTICHAIN_ACCOUNT_TYPE_TO_NAME } from '../../../shared/constants/multichain/accounts';
import type { I18nFunction } from '../../contexts/i18n';

type LabelAccount = {
  address: string;
  type: CaipChainId;
  options?: { entropySource?: string };
  metadata: { snap: { id: string } };
};

type LabelKeyring = {
  type: string;
  accounts?: string[];
  metadata?: { id?: string };
};

type AccountLabel = {
  label: string | null;
  icon: IconName | null;
};

function hasMultichainAccountTypeName(
  type: CaipChainId,
): type is keyof typeof MULTICHAIN_ACCOUNT_TYPE_TO_NAME {
  return type in MULTICHAIN_ACCOUNT_TYPE_TO_NAME;
}

function getMultichainAccountTypeName(type: CaipChainId): string | undefined {
  return hasMultichainAccountTypeName(type)
    ? MULTICHAIN_ACCOUNT_TYPE_TO_NAME[type]
    : undefined;
}

function translateToString(translate: I18nFunction, key: string): string {
  const translation = translate(key);

  if (typeof translation !== 'string') {
    throw new Error(`Expected translation for "${key}" to be a string`);
  }

  return translation;
}

export function getAccountNameErrorMessage(
  accounts: { metadata?: { name?: string } }[] | undefined,
  context: { t: I18nFunction },
  newAccountName?: string,
  defaultAccountName?: string,
): { isValidAccountName: boolean; errorMessage: string | undefined } {
  const isDuplicateAccountName =
    accounts?.some(
      (item) =>
        item.metadata?.name?.toLowerCase() === newAccountName?.toLowerCase(),
    ) ?? false;

  const isEmptyAccountName = !newAccountName || newAccountName === '';

  const localizedWordForAccount = translateToString(
    context.t,
    'newAccountNumberName',
  ).replace(' $1', '');

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

  let errorMessage: string | undefined;
  if (isValidAccountName) {
    errorMessage = InvisibleCharacter; // Using an invisible character, so the spacing stays
    // constant
  } else if (isDuplicateAccountName) {
    errorMessage = translateToString(context.t, 'accountNameDuplicate');
  } else if (isReservedAccountName) {
    errorMessage = translateToString(context.t, 'accountNameReserved');
  } else if (isEmptyAccountName) {
    errorMessage = translateToString(context.t, 'required');
  }

  return { isValidAccountName, errorMessage };
}

export function getAvatarNetworkColor(
  name?: string,
): BackgroundColor | undefined {
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

const toSrpLabel = (index: number) =>
  // Index starts at 1, for SRPs.
  `SRP #${index + 1}`;

export function getAccountLabels(
  type: string,
  account: LabelAccount | null,
  keyrings: LabelKeyring[],
  snapName?: string,
): AccountLabel[] {
  if (!account) {
    return [];
  }

  const labels: AccountLabel[] = [];

  const hdKeyrings = keyrings.filter(
    (keyring) => keyring.type === KeyringType.hdKeyTree,
  );

  switch (type) {
    case KeyringType.hdKeyTree: {
      if (hdKeyrings.length > 1) {
        const hdKeyringIndex = hdKeyrings.findIndex((kr) =>
          kr.accounts?.includes(account.address),
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
    case KeyringType.snap: {
      const { entropySource } = account.options ?? {};
      if (entropySource && hdKeyrings.length > 1) {
        const hdKeyringIndex = hdKeyrings.findIndex(
          (kr) => kr.metadata?.id === entropySource,
        );
        labels.push({
          label: toSrpLabel(hdKeyringIndex),
          icon: null,
        });
      }

      const snapId = account.metadata.snap.id;
      const isPreinstalled = isSnapId(snapId) && isSnapPreinstalled(snapId);

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
    default: {
      break;
    }
  }

  const { namespace } = parseCaipChainId(account.type);
  if (namespace === KnownCaipNamespace.Bip122) {
    labels.push({
      label: `${getMultichainAccountTypeName(account.type)}`,
      icon: null,
    });
  }

  return labels;
}
