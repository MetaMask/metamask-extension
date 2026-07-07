import { enLocale as messages } from '../../../lib/i18n-helpers';
import {
  LEDGER_CONNECTION_STATUS,
  LEDGER_CONNECTION_STATUS_CONTENT,
  LEDGER_CONNECTION_STATUS_LIST,
  type LedgerConnectionStatusType,
} from '../../../../ui/components/multichain-accounts/hardware-wallets/ledger/ledger-connection-status.constants';

type LocaleMessageKey = keyof typeof messages;

export type { LocaleMessageKey };

export type StatusWithDescription = {
  status: LedgerConnectionStatusType;
  titleKey: LocaleMessageKey;
  descriptionKey: LocaleMessageKey;
};

export type StatusWithoutDescription = {
  status: LedgerConnectionStatusType;
  titleKey: LocaleMessageKey;
};

export const ALL_LEDGER_CONNECTION_STATUSES: LedgerConnectionStatusType[] =
  LEDGER_CONNECTION_STATUS_LIST;

export const DEVICE_NOT_FOUND_INSTRUCTION_MESSAGE_KEYS: LocaleMessageKey[] = (
  LEDGER_CONNECTION_STATUS_CONTENT[LEDGER_CONNECTION_STATUS.DeviceNotFound]
    .instructions ?? []
).map(({ messageKey }) => messageKey as LocaleMessageKey);

export const STATUSES_WITH_DESCRIPTION: StatusWithDescription[] =
  ALL_LEDGER_CONNECTION_STATUSES.flatMap((status) => {
    const { titleKey, descriptionKey } =
      LEDGER_CONNECTION_STATUS_CONTENT[status];

    if (!descriptionKey) {
      return [];
    }

    return [
      {
        status,
        titleKey: titleKey as LocaleMessageKey,
        descriptionKey: descriptionKey as LocaleMessageKey,
      },
    ];
  });

export const STATUSES_WITHOUT_DESCRIPTION: StatusWithoutDescription[] =
  ALL_LEDGER_CONNECTION_STATUSES.flatMap((status) => {
    const { titleKey, descriptionKey } =
      LEDGER_CONNECTION_STATUS_CONTENT[status];

    if (descriptionKey) {
      return [];
    }

    return [
      {
        status,
        titleKey: titleKey as LocaleMessageKey,
      },
    ];
  });

export const STATUSES_WITHOUT_INSTRUCTIONS: LedgerConnectionStatusType[] =
  ALL_LEDGER_CONNECTION_STATUSES.filter(
    (status) => status !== LEDGER_CONNECTION_STATUS.DeviceNotFound,
  );

export const getStatusRootTestId = (
  status: LedgerConnectionStatusType,
): string => `ledger-connection-status-${status}`;

export const getIllustrationImage = (
  container: HTMLElement,
): HTMLImageElement | null =>
  container.querySelector(
    '[data-testid="ledger-connection-status-illustration"] img',
  );

export const getLocalizedMessage = (messageKey: LocaleMessageKey): string =>
  messages[messageKey].message;

export const getConfiguredLocaleMessageKeys = (): LocaleMessageKey[] => {
  const messageKeys = new Set<LocaleMessageKey>();

  ALL_LEDGER_CONNECTION_STATUSES.forEach((status) => {
    const { titleKey, descriptionKey, instructions } =
      LEDGER_CONNECTION_STATUS_CONTENT[status];

    messageKeys.add(titleKey as LocaleMessageKey);

    if (descriptionKey) {
      messageKeys.add(descriptionKey as LocaleMessageKey);
    }

    instructions?.forEach(({ messageKey }) => {
      messageKeys.add(messageKey as LocaleMessageKey);
    });
  });

  return [...messageKeys];
};
