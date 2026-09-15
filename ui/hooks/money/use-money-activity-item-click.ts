import { useCallback } from 'react';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { getMoneyTransactionDetailsRoute } from '../../helpers/constants/routes';
import { selectMoneyActivityDetailsEnabled } from '../../selectors/money/money-account-feature-flags';
import type { MoneyActivityItem } from '../../pages/money/types/money-activity';

/**
 * Returns a row-click handler that navigates to Money transaction details
 * when the details flag is on; otherwise undefined so rows stay inert.
 *
 * @returns The click handler, or undefined when details are disabled.
 */
export function useMoneyActivityItemClick():
  | ((item: MoneyActivityItem) => void)
  | undefined {
  const enabled = useSelector(selectMoneyActivityDetailsEnabled);
  const navigate = useNavigate();

  const onClick = useCallback(
    (item: MoneyActivityItem) => {
      navigate(getMoneyTransactionDetailsRoute(item.id));
    },
    [navigate],
  );

  return enabled ? onClick : undefined;
}
