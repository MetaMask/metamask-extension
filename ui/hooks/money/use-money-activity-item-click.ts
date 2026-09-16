import { useCallback } from 'react';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { getMoneyTransactionDetailsRoute } from '../../helpers/constants/routes';
import { selectMoneyActivityDetailsEnabled } from '../../selectors/money/money-account-feature-flags';
import type { MoneyActivityItem } from '../../pages/money/types/money-activity';
import {
  MoneyComponentName,
  MoneyScreenName,
} from '../../pages/money/constants/money-events';
import { useMoneyAnalytics } from './useMoneyAnalytics';

/**
 * Returns a row-click handler that navigates to Money transaction details
 * when the details flag is on; otherwise undefined so rows stay inert.
 *
 * @param options - Analytics location.
 * @param options.screenName - Screen the activity list is rendered on.
 * @returns The click handler, or undefined when details are disabled.
 */
export function useMoneyActivityItemClick({
  screenName,
}: {
  screenName: MoneyScreenName;
}): ((item: MoneyActivityItem) => void) | undefined {
  const enabled = useSelector(selectMoneyActivityDetailsEnabled);
  const navigate = useNavigate();
  const { trackActivitySurfaceClicked } = useMoneyAnalytics({ screenName });

  const onClick = useCallback(
    (item: MoneyActivityItem) => {
      if (item.kind !== 'onchain') {
        return;
      }
      trackActivitySurfaceClicked({
        transaction: item.tx,
        componentName: MoneyComponentName.ActivityListItem,
        redirectTarget: MoneyScreenName.MoneyActivityDetails,
      });
      navigate(getMoneyTransactionDetailsRoute(item.id));
    },
    [navigate, trackActivitySurfaceClicked],
  );

  return enabled ? onClick : undefined;
}
