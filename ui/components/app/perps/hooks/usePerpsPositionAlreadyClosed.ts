import { useCallback } from 'react';
import { captureException } from '../../../../../shared/lib/sentry';
import { getPerpsStreamManager } from '../../../../providers/perps';
import { PERPS_TOAST_KEYS, usePerpsToast } from '../perps-toast';

/**
 * Recovery for an action on a position that closed after the view rendered:
 * tell the user it is already closed and refetch positions so the view drops
 * it. Callers still close or leave their own surface.
 *
 * @returns Callback that shows the already-closed toast and refreshes positions.
 */
export function usePerpsPositionAlreadyClosed(): () => void {
  const { replacePerpsToastByKey } = usePerpsToast();

  return useCallback(() => {
    replacePerpsToastByKey({ key: PERPS_TOAST_KEYS.POSITION_ALREADY_CLOSED });
    // A failed refetch is reported, not shown: the toast has already told the
    // user the outcome, the live positions stream drops the closed position on
    // its next update, and acting on it again lands here and refetches again.
    getPerpsStreamManager().refreshPositions().catch(captureException);
  }, [replacePerpsToastByKey]);
}
