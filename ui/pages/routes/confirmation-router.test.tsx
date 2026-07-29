import React from 'react';
import { useLocation } from 'react-router-dom';
import configureStore from '../../store/store';
import { renderWithProvider } from '../../../test/lib/render-helpers-navigate';
import mockState from '../../../test/data/mock-state.json';
import { getEnvironmentType } from '../../../shared/lib/environment-type';
import {
  ENVIRONMENT_TYPE_FULLSCREEN,
  ENVIRONMENT_TYPE_POPUP,
  ENVIRONMENT_TYPE_SIDEPANEL,
} from '../../../shared/constants/app';
import {
  BATCH_SELL_REVIEW_ROUTE,
  BATCH_SELL_SELECT_ROUTE,
  CONFIRM_TRANSACTION_ROUTE,
  CROSS_CHAIN_SWAP_ROUTE,
  DEFAULT_ROUTE,
  PREPARE_SWAP_ROUTE,
} from '../../helpers/constants/routes';
import { ConfirmationRouter } from './confirmation-router';

jest.mock('../../../shared/lib/environment-type', () => ({
  ...jest.requireActual('../../../shared/lib/environment-type'),
  getEnvironmentType: jest.fn(),
}));

const SWAP_ROUTE = `${CROSS_CHAIN_SWAP_ROUTE}${PREPARE_SWAP_ROUTE}`;
const PENDING_APPROVAL_ID = 'testApprovalId';

const PathnameDisplay = () => {
  const { pathname } = useLocation();
  return <div data-testid="pathname">{pathname}</div>;
};

const renderConfirmationRouter = ({
  pathname,
  hasQuotes = false,
  hasPendingApproval = false,
  environmentType = ENVIRONMENT_TYPE_POPUP,
}: {
  pathname: string;
  hasQuotes?: boolean;
  hasPendingApproval?: boolean;
  environmentType?: string;
}) => {
  (getEnvironmentType as jest.Mock).mockReturnValue(environmentType);

  const store = configureStore({
    ...mockState,
    metamask: {
      ...mockState.metamask,
      ...(hasPendingApproval
        ? {}
        : { pendingApprovals: {}, pendingApprovalCount: 0, approvalFlows: [] }),
      // Batch sell fetches quotes through the bridge controller, so they land in
      // the same state that drives the swap redirect. A single entry is enough.
      quotes: hasQuotes ? [{}] : [],
    },
  });

  return renderWithProvider(
    <>
      <ConfirmationRouter />
      <PathnameDisplay />
    </>,
    store,
    pathname,
  );
};

describe('ConfirmationRouter', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('with bridge quotes in state', () => {
    it('redirects to the swap page from a non-exempted route in the popup', () => {
      const { getByTestId } = renderConfirmationRouter({
        pathname: DEFAULT_ROUTE,
        hasQuotes: true,
      });

      // `toHaveTextContent` does a substring match, and every route here
      // contains a `/`, so we compare `textContent` directly for an exact match.
      expect(getByTestId('pathname').textContent).toBe(SWAP_ROUTE);
    });

    it('stays on the batch sell review page', () => {
      const { getByTestId } = renderConfirmationRouter({
        pathname: BATCH_SELL_REVIEW_ROUTE,
        hasQuotes: true,
      });

      expect(getByTestId('pathname').textContent).toBe(BATCH_SELL_REVIEW_ROUTE);
    });

    it('stays on the batch sell select page', () => {
      const { getByTestId } = renderConfirmationRouter({
        pathname: BATCH_SELL_SELECT_ROUTE,
        hasQuotes: true,
      });

      expect(getByTestId('pathname').textContent).toBe(BATCH_SELL_SELECT_ROUTE);
    });

    it('does not redirect from a non-exempted route in fullscreen', () => {
      const { getByTestId } = renderConfirmationRouter({
        pathname: DEFAULT_ROUTE,
        hasQuotes: true,
        environmentType: ENVIRONMENT_TYPE_FULLSCREEN,
      });

      expect(getByTestId('pathname').textContent).toBe(DEFAULT_ROUTE);
    });

    it('does not redirect from a non-exempted route in the side panel', () => {
      const { getByTestId } = renderConfirmationRouter({
        pathname: DEFAULT_ROUTE,
        hasQuotes: true,
        environmentType: ENVIRONMENT_TYPE_SIDEPANEL,
      });

      expect(getByTestId('pathname').textContent).toBe(DEFAULT_ROUTE);
    });
  });

  describe('with a pending approval', () => {
    it('navigates to the confirmation from a non-exempted route', () => {
      const { getByTestId } = renderConfirmationRouter({
        pathname: DEFAULT_ROUTE,
        hasPendingApproval: true,
      });

      expect(getByTestId('pathname').textContent).toBe(
        `${CONFIRM_TRANSACTION_ROUTE}/${PENDING_APPROVAL_ID}`,
      );
    });

    it('leaves batch sell in place, so the confirmation is shown once the user exits', () => {
      const { getByTestId } = renderConfirmationRouter({
        pathname: BATCH_SELL_REVIEW_ROUTE,
        hasPendingApproval: true,
      });

      expect(getByTestId('pathname').textContent).toBe(BATCH_SELL_REVIEW_ROUTE);
    });
  });
});
