import { useSelector } from 'react-redux';
import { useI18nContext } from '../../../hooks/useI18nContext';
import { selectLocalActivityItemsByIdentifier } from '../../../selectors/activity';
import type { ActivityListItem } from '../../../../shared/lib/activity/types';
import type { ToastStatus } from './shared';

const genericToastLabels: Record<ToastStatus, string> = {
  pending: 'transactionSubmitted',
  success: 'transactionConfirmed',
  failed: 'transactionFailed',
};

// Add per-type toast content here
function useGetToastContent(
  status: ToastStatus,
  item?: ActivityListItem,
): { title: string; description?: string } {
  const t = useI18nContext();

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

  const { title, description } = useGetToastContent(status, item);

  return { title, description };
}
