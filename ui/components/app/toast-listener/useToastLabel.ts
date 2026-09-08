import { useSelector } from 'react-redux';
import { useI18nContext } from '../../../hooks/useI18nContext';
import { selectLocalActivityItemsByIdentifier } from '../../../selectors/activity';
import type { ActivityListItem } from '../../../../shared/lib/activity/types';
import type { ToastStatus } from './shared';
import { useMoneyAccountToastLabel } from './useMoneyAccountToastLabel';

const genericToastLabels: Record<ToastStatus, string> = {
  pending: 'transactionSubmitted',
  success: 'transactionConfirmed',
  failed: 'transactionFailed',
};

type ToastLabel = { title: string; description?: string };
type TranslateFn = ReturnType<typeof useI18nContext>;

function getPerpsWithdrawToastContent(
  status: ToastStatus,
  item: Extract<ActivityListItem, { type: 'perpsAddFunds' | 'perpsWithdraw' }>,
  t: TranslateFn,
): ToastLabel {
  if (status === 'pending') {
    return {
      title: t('perpsWithdrawPostQuoteToastPendingTitle'),
      description: t('perpsWithdrawPostQuoteToastPendingDescription'),
    };
  }

  if (status === 'success') {
    const fiatAmount = Number(item.data.fiat?.amount);
    const symbol = item.data.token?.symbol;
    const description =
      Number.isFinite(fiatAmount) && symbol
        ? t('perpsWithdrawPostQuoteToastSuccessDescription', [
            `$${fiatAmount.toFixed(2)}`,
            symbol,
          ])
        : t('perpsWithdrawPostQuoteToastSuccessGenericDescription');

    return {
      title: t('perpsWithdrawPostQuoteToastSuccessTitle'),
      description,
    };
  }

  return {
    title: t('perpsWithdrawPostQuoteToastErrorTitle'),
    description: t('perpsWithdrawPostQuoteToastErrorDescription'),
  };
}

// Add per-type toast content here
function useGetToastContent(
  status: ToastStatus,
  item: ActivityListItem | undefined,
  transactionId: string | undefined,
): ToastLabel {
  const t = useI18nContext();
  const moneyAccountLabel = useMoneyAccountToastLabel(
    status,
    item,
    transactionId,
  );

  switch (item?.type) {
    case 'convert': {
      const sourceSymbol = item.data.sourceToken?.symbol;

      if (status === 'pending') {
        return {
          title: t('musdConversionToastInProgress', [sourceSymbol ?? 'Token']),
        };
      }

      if (status === 'success') {
        return {
          title: t('musdConversionToastSuccess'),
          description: t('musdConversionToastSuccessDescription'),
        };
      }

      return { title: t('musdConversionToastFailed') };
    }

    case 'claimMusdBonus': {
      if (status === 'pending') {
        return { title: t('merklRewardsToastInProgress') };
      }

      if (status === 'success') {
        return { title: t('merklRewardsToastSuccess') };
      }

      return { title: t('merklRewardsToastFailed') };
    }

    case 'perpsWithdraw':
      return getPerpsWithdrawToastContent(status, item, t);

    case 'moneyAccountDeposit':
    case 'moneyAccountWithdraw':
      return moneyAccountLabel ?? { title: t(genericToastLabels[status]) };

    default:
      return { title: t(genericToastLabels[status]) };
  }
}

export function useToastLabel(
  status: ToastStatus,
  transactionId?: string,
): { title: string; description?: string } {
  const itemsByIdentifier = useSelector(selectLocalActivityItemsByIdentifier);
  const item = transactionId
    ? itemsByIdentifier.get(transactionId.toLowerCase())
    : undefined;

  const { title, description } = useGetToastContent(
    status,
    item,
    transactionId,
  );

  return { title, description };
}
