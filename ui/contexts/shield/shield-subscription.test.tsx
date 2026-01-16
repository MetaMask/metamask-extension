import React, { useEffect, useRef } from 'react';
import { render, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import * as redux from 'react-redux';
import * as useSubscription from '../../hooks/subscription/useSubscription';
import * as useSubscriptionMetrics from '../../hooks/shield/metrics/useSubscriptionMetrics';
import * as selectors from '../../selectors';
import * as authSelectors from '../../selectors/identity/authentication';
import * as subscriptionSelectors from '../../selectors/subscription';
import * as metamaskDucks from '../../ducks/metamask/metamask';
import * as environment from '../../../shared/modules/environment';
import {
  ShieldSubscriptionProvider,
  useShieldSubscriptionContext,
} from './shield-subscription';

jest.mock('../../hooks/subscription/useSubscription');
jest.mock('../../hooks/shield/metrics/useSubscriptionMetrics');
jest.mock('../../store/actions', () => ({
  assignUserToCohort: jest.fn(),
  setShowShieldEntryModalOnce: jest.fn(),
  subscriptionsStartPolling: jest.fn(),
}));

describe('ShieldSubscriptionProvider', () => {
  const mockDispatch = jest.fn();
  const mockGetSubscriptionEligibility = jest.fn();
  const mockCaptureShieldEligibilityCohortEvent = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();

    // Mock Redux hooks
    jest.spyOn(redux, 'useDispatch').mockReturnValue(mockDispatch);
    jest.spyOn(redux, 'useSelector').mockImplementation((selector) => {
      if (selector === selectors.getUseExternalServices) {
        return true;
      }
      if (selector === metamaskDucks.getIsUnlocked) {
        return true;
      }
      if (selector === authSelectors.selectIsSignedIn) {
        return true;
      }
      if (selector === subscriptionSelectors.getIsActiveShieldSubscription) {
        return false;
      }
      if (selector === subscriptionSelectors.getHasShieldEntryModalShownOnce) {
        return false;
      }
      return false;
    });

    // Mock environment
    jest
      .spyOn(environment, 'getIsMetaMaskShieldFeatureEnabled')
      .mockReturnValue(true);

    // Mock hooks
    jest.spyOn(useSubscription, 'useSubscriptionEligibility').mockReturnValue({
      getSubscriptionEligibility: mockGetSubscriptionEligibility,
      isLoading: false,
      error: null,
      data: null,
    });

    jest
      .spyOn(useSubscriptionMetrics, 'useSubscriptionMetrics')
      .mockReturnValue({
        captureShieldEligibilityCohortEvent:
          mockCaptureShieldEligibilityCohortEvent,
      });
  });

  it('renders children correctly', () => {
    const { getByTestId } = render(
      <ShieldSubscriptionProvider>
        <div data-testid="child">Child Component</div>
      </ShieldSubscriptionProvider>,
    );

    expect(getByTestId('child')).toBeInTheDocument();
  });

  it('provides context with evaluateCohortEligibility function', () => {
    const TestConsumer = () => {
      const { evaluateCohortEligibility } = useShieldSubscriptionContext();
      return (
        <div data-testid="consumer">
          {typeof evaluateCohortEligibility === 'function' ? 'function' : 'not'}
        </div>
      );
    };

    const { getByTestId } = render(
      <ShieldSubscriptionProvider>
        <TestConsumer />
      </ShieldSubscriptionProvider>,
    );

    expect(getByTestId('consumer')).toHaveTextContent('function');
  });

  describe('Memoization', () => {
    it('provides stable evaluateCohortEligibility callback across re-renders', () => {
      const callbacks: ((cohort: string) => Promise<void>)[] = [];

      const TestConsumer = () => {
        const { evaluateCohortEligibility } = useShieldSubscriptionContext();
        const renderCount = useRef(0);

        useEffect(() => {
          callbacks.push(evaluateCohortEligibility);
          renderCount.current += 1;
        });

        return <div data-testid="consumer">Consumer</div>;
      };

      const { rerender } = render(
        <ShieldSubscriptionProvider>
          <TestConsumer />
        </ShieldSubscriptionProvider>,
      );

      // Force re-render
      rerender(
        <ShieldSubscriptionProvider>
          <TestConsumer />
        </ShieldSubscriptionProvider>,
      );

      // The callback should be the same reference across renders
      expect(callbacks.length).toBeGreaterThanOrEqual(2);
      expect(callbacks[0]).toBe(callbacks[1]);
    });

    it('provides stable context value object across re-renders', () => {
      const contexts: {
        evaluateCohortEligibility: (cohort: string) => Promise<void>;
      }[] = [];

      const TestConsumer = () => {
        const context = useShieldSubscriptionContext();

        useEffect(() => {
          contexts.push(context);
        });

        return <div data-testid="consumer">Consumer</div>;
      };

      const { rerender } = render(
        <ShieldSubscriptionProvider>
          <TestConsumer />
        </ShieldSubscriptionProvider>,
      );

      // Force re-render
      rerender(
        <ShieldSubscriptionProvider>
          <TestConsumer />
        </ShieldSubscriptionProvider>,
      );

      // The context object should be the same reference across renders
      expect(contexts.length).toBeGreaterThanOrEqual(2);
      expect(contexts[0]).toBe(contexts[1]);
    });
  });

  describe('evaluateCohortEligibility', () => {
    it('can be called successfully', async () => {
      mockGetSubscriptionEligibility.mockResolvedValue({
        canSubscribe: true,
        canViewEntryModal: true,
        cohorts: [],
        assignedCohort: null,
        hasAssignedCohortExpired: false,
        modalType: 'entry',
      });

      let evaluateFn: ((cohort: string) => Promise<void>) | null = null;

      const TestConsumer = () => {
        const { evaluateCohortEligibility } = useShieldSubscriptionContext();
        evaluateFn = evaluateCohortEligibility;
        return <div data-testid="consumer">Consumer</div>;
      };

      render(
        <ShieldSubscriptionProvider>
          <TestConsumer />
        </ShieldSubscriptionProvider>,
      );

      // Call the function after render
      await evaluateFn?.('wallet_home');

      await waitFor(() => {
        expect(mockGetSubscriptionEligibility).toHaveBeenCalled();
      });
    });

    it('accesses current values even with stable callback', async () => {
      // Initially return false for basic functionality
      let isBasicFunctionalityEnabled = false;

      jest.spyOn(redux, 'useSelector').mockImplementation((selector) => {
        if (selector === selectors.getUseExternalServices) {
          return isBasicFunctionalityEnabled;
        }
        if (selector === metamaskDucks.getIsUnlocked) {
          return true;
        }
        if (selector === authSelectors.selectIsSignedIn) {
          return true;
        }
        if (selector === subscriptionSelectors.getIsActiveShieldSubscription) {
          return false;
        }
        if (
          selector === subscriptionSelectors.getHasShieldEntryModalShownOnce
        ) {
          return false;
        }
        return false;
      });

      mockGetSubscriptionEligibility.mockResolvedValue({
        canSubscribe: true,
        canViewEntryModal: true,
        cohorts: [],
        assignedCohort: null,
        hasAssignedCohortExpired: false,
        modalType: 'entry',
      });

      let evaluateFn: ((cohort: string) => Promise<void>) | null = null;

      const TestConsumer = () => {
        const { evaluateCohortEligibility } = useShieldSubscriptionContext();
        evaluateFn = evaluateCohortEligibility;
        return <div data-testid="consumer">Consumer</div>;
      };

      const { rerender } = render(
        <ShieldSubscriptionProvider>
          <TestConsumer />
        </ShieldSubscriptionProvider>,
      );

      // Call with basic functionality disabled
      await evaluateFn?.('wallet_home');

      // Should not call getSubscriptionEligibility when basic functionality is disabled
      await waitFor(() => {
        expect(mockGetSubscriptionEligibility).not.toHaveBeenCalled();
      });

      // Enable basic functionality
      isBasicFunctionalityEnabled = true;

      // Force re-render with updated state
      rerender(
        <ShieldSubscriptionProvider>
          <TestConsumer />
        </ShieldSubscriptionProvider>,
      );

      // Call again with basic functionality enabled
      await evaluateFn?.('wallet_home');

      // Now it should call getSubscriptionEligibility
      await waitFor(
        () => {
          expect(mockGetSubscriptionEligibility).toHaveBeenCalled();
        },
        { timeout: 3000 },
      );
    });
  });
});
