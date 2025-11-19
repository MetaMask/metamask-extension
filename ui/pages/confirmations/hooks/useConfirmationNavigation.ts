import { useCallback } from 'react';
import { useSelector } from 'react-redux';
import { useNavigate, useLocation } from 'react-router-dom-v5-compat';
import { ApprovalType } from '@metamask/controller-utils';
import { isEqual } from 'lodash';
import { ApprovalRequest } from '@metamask/approval-controller';
import { Json } from '@metamask/utils';

import { CONFIRMATION_V_NEXT_ROUTE } from '../../../helpers/constants/routes';
import {
  getApprovalFlows,
  selectPendingApprovalsForNavigation,
} from '../../../selectors';
import { getConfirmationRoute } from '../utils/getConfirmationRoute';

export function useConfirmationNavigation() {
  const confirmations = useSelector(selectPendingApprovalsForNavigation);
  const approvalFlows = useSelector(getApprovalFlows, isEqual);
  const navigate = useNavigate();
  const { search: queryString } = useLocation();
  const count = confirmations.length;

  const getIndex = useCallback(
    (confirmationId?: string) => {
      if (!confirmationId) {
        return 0;
      }

      return confirmations.findIndex(({ id }) => id === confirmationId);
    },
    [confirmations],
  );

  const navigateToId = useCallback(
    (confirmationId?: string) => {
      navigateToConfirmation(
        confirmationId,
        confirmations,
        Boolean(approvalFlows?.length),
        navigate,
        queryString,
        undefined, // currentPathname not needed here as navigate already handles it
      );
    },
    [approvalFlows?.length, confirmations, navigate, queryString],
  );

  const navigateToIndex = useCallback(
    (index: number) => {
      const nextConfirmation = confirmations[index];
      navigateToId(nextConfirmation?.id);
    },
    [confirmations, navigateToId],
  );

  const navigateNext = useCallback(
    (confirmationId: string) => {
      const pendingConfirmations = confirmations.filter(
        (confirmation) => confirmation.id !== confirmationId,
      );
      if (pendingConfirmations.length >= 1) {
        const index = getIndex(pendingConfirmations[0].id);
        navigateToIndex(index);
      }
    },
    [confirmations, getIndex, navigateToIndex],
  );

  return {
    confirmations,
    count,
    getIndex,
    navigateToId,
    navigateToIndex,
    navigateNext,
  };
}

export function navigateToConfirmation(
  confirmationId: string | undefined,
  confirmations: ApprovalRequest<Record<string, Json>>[],
  hasApprovalFlows: boolean,
  navigateOrHistory:
    | ReturnType<typeof useNavigate>
    | { push: (path: string) => void; replace: (path: string) => void },
  queryString: string = '',
  currentPathname?: string,
) {
  // Helper function to handle both navigate (v5-compat) and history (v5) APIs
  const navigateTo = (path: string, replace = true) => {
    // Skip navigation if we're already on the target path (compare pathnames only)
    if (currentPathname) {
      // Extract pathname from path (strip query params and hash)
      const targetPathname = path.split(/[?#]/u)[0];
      if (currentPathname === targetPathname) {
        return;
      }
    }

    if (
      'replace' in navigateOrHistory &&
      typeof navigateOrHistory.replace === 'function'
    ) {
      // v5 history API
      if (replace) {
        navigateOrHistory.replace(path);
      } else {
        navigateOrHistory.push(path);
      }
    } else {
      // v5-compat navigate API
      (navigateOrHistory as ReturnType<typeof useNavigate>)(path, { replace });
    }
  };

  const hasNoConfirmations = confirmations?.length <= 0 || !confirmationId;

  if (hasApprovalFlows && hasNoConfirmations) {
    navigateTo(`${CONFIRMATION_V_NEXT_ROUTE}`);
    return;
  }

  if (hasNoConfirmations) {
    return;
  }

  const nextConfirmation = confirmations.find(
    (confirmation) => confirmation.id === confirmationId,
  );

  if (!nextConfirmation) {
    return;
  }

  const routeInfo = getConfirmationRoute(nextConfirmation, confirmationId);

  if (!routeInfo) {
    return;
  }

  // Handle query string for transactions
  const { route: baseRoute } = routeInfo;
  let route = baseRoute;
  if (
    nextConfirmation.type === ApprovalType.Transaction &&
    queryString.length
  ) {
    route = `${route}${queryString}`;
  }

  navigateTo(route);
}
