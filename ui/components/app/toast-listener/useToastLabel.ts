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

// Per-activity-kind toast content. Mirrors the activity list's getContent switch
// (ui/pages/activity/rows/useActivityRowContent.tsx): keyed on the already-
// classified ActivityKind and reading from the centrally-enriched
// ActivityListItem. Add a new kind by adding a case here — never a new Redux
// selector.
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

    default:
      return { title: t(genericToastLabels[status]) };
  }
}

export function useToastLabel(
  status: ToastStatus,
  transactionId?: string,
): { title: string; description?: string } {
  // A single, memoized selector shared with the activity list. The per-kind
  // label logic is pure, so no extra selector runs as more kinds are added.
  const itemsByIdentifier = useSelector(selectLocalActivityItemsByIdentifier);
  const item = transactionId
    ? itemsByIdentifier.get(transactionId.toLowerCase())
    : undefined;

  const { title, description } = useGetToastContent(status, item);

  return { title, description };
}
