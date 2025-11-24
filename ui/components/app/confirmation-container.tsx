import React, { useMemo } from 'react';
import { createPortal } from 'react-dom';
import { MemoryRouter, Routes, Route } from 'react-router-dom-v5-compat';
import { useSelector, shallowEqual } from 'react-redux';
import { ApprovalType } from '@metamask/controller-utils';
import { ORIGIN_METAMASK } from '@metamask/approval-controller';
import cn from 'classnames';
// eslint-disable-next-line import/no-restricted-paths
import { getEnvironmentType } from '../../../app/scripts/lib/util';
import { ENVIRONMENT_TYPE_SIDEPANEL } from '../../../shared/constants/app';
import {
  getPendingApprovals,
  getApprovalFlows,
  oldestPendingConfirmationSelector,
} from '../../selectors';
import {
  CONFIRM_TRANSACTION_ROUTE,
  CONFIRMATION_V_NEXT_ROUTE,
  CONNECT_ROUTE,
} from '../../helpers/constants/routes';
import ConfirmTransaction from '../../pages/confirmations/confirm-transaction';
import ConfirmationPage from '../../pages/confirmations/confirmation/confirmation';
import PermissionsConnect from '../../pages/permissions-connect';
import ConfirmAddSuggestedTokenPage from '../../pages/confirm-add-suggested-token';
import ConfirmAddSuggestedNftPage from '../../pages/confirm-add-suggested-nft';
import {
  getConfirmationRoute,
  getConfirmationRoutePatterns,
} from '../../pages/confirmations/utils/getConfirmationRoute';
import { ConfirmationMetaMetricsProvider } from '../../contexts/metametrics-confirmation';

const width = 'max-w-[clamp(var(--width-sm),85vw,var(--width-max))]';

const COMPONENT_MAP = {
  ConfirmationPage,
  ConfirmTransaction,
  PermissionsConnect,
  ConfirmAddSuggestedTokenPage,
  ConfirmAddSuggestedNftPage,
} as const;

const ConfirmationRouter = () => {
  const routePatterns = getConfirmationRoutePatterns();

  return (
    <Routes>
      {/* Base routes without ID */}
      <Route
        path={CONFIRM_TRANSACTION_ROUTE}
        element={<ConfirmTransaction />}
      />
      <Route path={CONFIRMATION_V_NEXT_ROUTE} element={<ConfirmationPage />} />
      {/* Dynamically generated routes from route mapping */}
      {routePatterns.map(({ pattern, component }) => {
        const Component = component ? COMPONENT_MAP[component] : null;
        if (!Component) {
          return null;
        }
        return <Route key={pattern} path={pattern} element={<Component />} />;
      })}
      {/* Additional route for connect with wildcard */}
      <Route path={`${CONNECT_ROUTE}/:id/*`} element={<PermissionsConnect />} />
    </Routes>
  );
};

export const ConfirmationContainer: React.FC = () => {
  const pendingApprovals = useSelector(getPendingApprovals, shallowEqual);
  const approvalFlows = useSelector(getApprovalFlows, shallowEqual);
  const oldestPendingApproval = useSelector(oldestPendingConfirmationSelector);

  const navigableApprovals = useMemo(
    () =>
      pendingApprovals.filter(
        (approval) =>
          !(
            approval.type === ApprovalType.AddEthereumChain &&
            approval.origin === ORIGIN_METAMASK
          ),
      ),
    [pendingApprovals],
  );

  const hasPendingConfirmations = useMemo(
    () => navigableApprovals.length > 0 || (approvalFlows?.length ?? 0) > 0,
    [navigableApprovals.length, approvalFlows?.length],
  );

  const currentConfirmationId = useMemo(
    () => oldestPendingApproval?.id ?? navigableApprovals[0]?.id ?? '',
    [
      oldestPendingApproval?.id,
      navigableApprovals.length,
      navigableApprovals[0]?.id,
    ],
  );

  // Determine which component and route to render
  const { component, initialRoute } = useMemo(() => {
    if (!hasPendingConfirmations) {
      return { component: null, initialRoute: '' };
    }

    // For connect requests, oldestPendingApproval will be undefined because
    // oldestPendingConfirmationSelector filters them out, so use navigableApprovals[0]
    const confirmationId =
      oldestPendingApproval?.id ?? navigableApprovals[0]?.id;
    const confirmation = navigableApprovals.find(
      (approval) => approval.id === confirmationId,
    );

    if (!confirmation) {
      // Handle approval flows
      if (approvalFlows?.length) {
        return {
          component: ConfirmationPage,
          initialRoute: CONFIRMATION_V_NEXT_ROUTE,
        };
      }
      return { component: null, initialRoute: '' };
    }

    const routeInfo = getConfirmationRoute(confirmation, confirmationId);

    if (!routeInfo) {
      return { component: null, initialRoute: '' };
    }

    return {
      component: routeInfo.component
        ? COMPONENT_MAP[routeInfo.component]
        : null,
      initialRoute: routeInfo.route,
    };
  }, [
    navigableApprovals,
    approvalFlows,
    oldestPendingApproval,
    hasPendingConfirmations,
  ]);

  // Control container visibility based on pending confirmations
  const shouldShowContainer =
    hasPendingConfirmations && component && initialRoute;

  // TODO: Get from somewhere else
  const isSidepanel = useMemo(
    () => getEnvironmentType() === ENVIRONMENT_TYPE_SIDEPANEL,
    [],
  );

  if (!shouldShowContainer) {
    return null;
  }

  const containerContent = (
    <div className="fixed inset-0 w-full h-full bg-background-default z-[9999] flex flex-col overflow-hidden">
      <ConfirmationMetaMetricsProvider>
        <MemoryRouter
          initialEntries={[initialRoute]}
          key={currentConfirmationId}
        >
          <div
            className={cn(
              'w-full h-full overflow-y-auto mx-auto',
              width,
              isSidepanel ? 'max-w-[var(--width-max-sidepanel)]' : '',
            )}
          >
            <ConfirmationRouter />
          </div>
        </MemoryRouter>
      </ConfirmationMetaMetricsProvider>
    </div>
  );

  return createPortal(containerContent, document.body);
};
