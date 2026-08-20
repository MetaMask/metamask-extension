import { it } from '@jest/globals';
import React from 'react';
import { fireEvent, Matcher } from '@testing-library/react';
import configureStore from '../../../store/store';
import mockState from '../../../../test/data/mock-state.json';
import { renderWithProvider } from '../../../../test/lib/render-helpers-navigate';
import {
  ACTIVITY_ROUTE,
  DEFAULT_ROUTE,
  MONEY_HOME_ROUTE,
  PERPS_HOME_PAGE_ROUTE,
  SWAP_PATH,
} from '../../../helpers/constants/routes';
import {
  MetaMetricsSwapsEventSource,
  ScreenViewedEntryPoint,
} from '../../../../shared/constants/metametrics';
import type { MoneyAccountAvailability } from '../../../hooks/money/use-money-account-availability';
import { BottomNavBar } from './bottom-nav-bar';

const mockNavigate = jest.fn();
const mockUseMoneyAccountAvailability: jest.MockedFunction<
  () => { availability: MoneyAccountAvailability }
> = jest.fn(() => ({
  availability: {
    isAvailable: true,
    address: '0x0000000000000000000000000000000000000001',
  },
}));

jest.mock('../../../hooks/money/use-money-account-availability', () => ({
  useMoneyAccountAvailability: () => mockUseMoneyAccountAvailability(),
}));

jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
}));

jest.mock('../../../hooks/bridge/useBridgeNavigation', () => ({
  useBridgeNavigation: () => ({
    navigateToDefaultRoute: jest.fn(),
  }),
}));

const mockOpenBridgeExperience = jest.fn();
jest.mock('../../../hooks/bridge/useBridging', () => ({
  // eslint-disable-next-line @typescript-eslint/naming-convention
  __esModule: true,
  default: () => ({
    openBridgeExperience: mockOpenBridgeExperience,
  }),
}));

const mockResetBridgeController = jest.fn(() => ({ type: 'RESET_BRIDGE' }));
jest.mock('../../../ducks/bridge/actions', () => ({
  ...jest.requireActual('../../../ducks/bridge/actions'),
  resetBridgeController: () => mockResetBridgeController(),
}));

jest.mock('../../../../shared/lib/environment', () => ({
  ...jest.requireActual('../../../../shared/lib/environment'),
  getIsPerpsIncludedInBuild: jest.fn(() => true),
}));

const baseState = {
  metamask: {
    ...mockState.metamask,
    completedOnboarding: true,
    remoteFeatureFlags: {
      ...mockState.metamask.remoteFeatureFlags,
      perpsEnabledVersion: { enabled: true, minimumVersion: '0.0.1' },
    },
  },
};

const stateWithPerpsDisabled = {
  metamask: {
    ...mockState.metamask,
    completedOnboarding: true,
    remoteFeatureFlags: {
      ...mockState.metamask.remoteFeatureFlags,
      perpsEnabledVersion: { enabled: false, minimumVersion: '0.0.1' },
    },
  },
};

const stateWithLastTab = {
  metamask: {
    ...baseState.metamask,
    defaultHomeActiveTabName: 'nfts',
  },
};

function renderBottomNavBar(state = baseState, pathname = DEFAULT_ROUTE) {
  const store = configureStore(state);
  return renderWithProvider(<BottomNavBar />, store, pathname);
}

describe('BottomNavBar', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('renders all tabs', () => {
    it('renders Home, Perps, Money, Swaps, and Activity when available', () => {
      const { getByTestId, getAllByRole } = renderBottomNavBar();

      expect(getByTestId('bottom-nav-home')).toBeInTheDocument();
      expect(getByTestId('bottom-nav-swaps')).toBeInTheDocument();
      expect(getByTestId('bottom-nav-perps')).toBeInTheDocument();
      expect(getByTestId('bottom-nav-money')).toBeInTheDocument();
      expect(getByTestId('bottom-nav-activity')).toBeInTheDocument();
      expect(
        getAllByRole('button').map((button) =>
          button.getAttribute('data-testid'),
        ),
      ).toStrictEqual([
        'bottom-nav-home',
        'bottom-nav-perps',
        'bottom-nav-money',
        'bottom-nav-swaps',
        'bottom-nav-activity',
      ]);
    });

    it('renders Home, Swaps, and Activity tabs when Perps is unavailable', () => {
      const { getByTestId, queryByTestId } = renderBottomNavBar(
        stateWithPerpsDisabled,
      );

      expect(getByTestId('bottom-nav-home')).toBeInTheDocument();
      expect(getByTestId('bottom-nav-swaps')).toBeInTheDocument();
      expect(queryByTestId('bottom-nav-perps')).not.toBeInTheDocument();
      expect(getByTestId('bottom-nav-activity')).toBeInTheDocument();
    });

    it('hides Money when the Money Account is unavailable', () => {
      mockUseMoneyAccountAvailability.mockReturnValueOnce({
        availability: { isAvailable: false },
      });

      const { queryByTestId } = renderBottomNavBar();

      expect(queryByTestId('bottom-nav-money')).not.toBeInTheDocument();
    });
  });

  describe('active state', () => {
    it('marks Home as active on the root route', () => {
      const { getByTestId } = renderBottomNavBar(baseState, DEFAULT_ROUTE);

      expect(getByTestId('bottom-nav-home')).toHaveAttribute(
        'aria-current',
        'page',
      );
      expect(getByTestId('bottom-nav-perps')).not.toHaveAttribute(
        'aria-current',
      );
      expect(getByTestId('bottom-nav-activity')).not.toHaveAttribute(
        'aria-current',
      );
    });

    it('marks Activity as active on the /activity route', () => {
      const { getByTestId } = renderBottomNavBar(baseState, ACTIVITY_ROUTE);

      expect(getByTestId('bottom-nav-activity')).toHaveAttribute(
        'aria-current',
        'page',
      );
      expect(getByTestId('bottom-nav-home')).not.toHaveAttribute(
        'aria-current',
      );
    });

    it('marks Perps as active on the /perps-home route', () => {
      const { getByTestId } = renderBottomNavBar(
        baseState,
        PERPS_HOME_PAGE_ROUTE,
      );

      expect(getByTestId('bottom-nav-perps')).toHaveAttribute(
        'aria-current',
        'page',
      );
      expect(getByTestId('bottom-nav-home')).not.toHaveAttribute(
        'aria-current',
      );
    });

    it('marks Money as active on the Money home route', () => {
      const { getByTestId } = renderBottomNavBar(baseState, MONEY_HOME_ROUTE);

      expect(getByTestId('bottom-nav-money')).toHaveAttribute(
        'aria-current',
        'page',
      );
      expect(getByTestId('bottom-nav-home')).not.toHaveAttribute(
        'aria-current',
      );
    });

    it('marks Swaps as active on the swaps route', () => {
      const { getByTestId } = renderBottomNavBar(baseState, SWAP_PATH);

      expect(getByTestId('bottom-nav-swaps')).toHaveAttribute(
        'aria-current',
        'page',
      );
      expect(getByTestId('bottom-nav-home')).not.toHaveAttribute(
        'aria-current',
      );
    });
  });

  describe('navigation', () => {
    it('navigates to the root route when Home is clicked and no last tab is stored', () => {
      const { getByTestId } = renderBottomNavBar(baseState, ACTIVITY_ROUTE);

      fireEvent.click(getByTestId('bottom-nav-home'));
      expect(mockNavigate).toHaveBeenCalledWith(DEFAULT_ROUTE, {
        state: {
          entryPoint: ScreenViewedEntryPoint.BottomNavClick,
          stayOnHomePage: true,
        },
      });
    });

    it('navigates to the last active tab when Home is clicked and a tab is stored', () => {
      const { getByTestId } = renderBottomNavBar(
        stateWithLastTab,
        ACTIVITY_ROUTE,
      );

      fireEvent.click(getByTestId('bottom-nav-home'));
      expect(mockNavigate).toHaveBeenCalledWith(`${DEFAULT_ROUTE}?tab=nfts`, {
        state: {
          entryPoint: ScreenViewedEntryPoint.BottomNavClick,
          stayOnHomePage: true,
        },
      });
    });

    it('navigates to the perps page when Perps is clicked', () => {
      const { getByTestId } = renderBottomNavBar();

      fireEvent.click(getByTestId('bottom-nav-perps'));
      expect(mockNavigate).toHaveBeenCalledWith(PERPS_HOME_PAGE_ROUTE, {
        state: { stayOnHomePage: true },
      });
    });

    it('navigates to Money Home when Money is clicked', () => {
      const { getByTestId } = renderBottomNavBar();

      fireEvent.click(getByTestId('bottom-nav-money'));
      expect(mockNavigate).toHaveBeenCalledWith(MONEY_HOME_ROUTE, {
        state: { stayOnHomePage: true },
      });
    });

    it('navigates to the swaps route when Swaps is clicked', () => {
      const { getByTestId } = renderBottomNavBar();

      fireEvent.click(getByTestId('bottom-nav-swaps'));
      expect(mockOpenBridgeExperience).toHaveBeenCalledWith(
        MetaMetricsSwapsEventSource.BottomNavBar,
      );
    });

    it('navigates to the activity route when Activity is clicked', () => {
      const { getByTestId } = renderBottomNavBar();

      fireEvent.click(getByTestId('bottom-nav-activity'));
      expect(mockNavigate).toHaveBeenCalledWith(ACTIVITY_ROUTE, {
        state: {
          entryPoint: ScreenViewedEntryPoint.BottomNavClick,
          stayOnHomePage: true,
        },
      });
    });

    it('does not call Swaps when the Swaps tab is already active', () => {
      const { getByTestId } = renderBottomNavBar(baseState, SWAP_PATH);

      fireEvent.click(getByTestId('bottom-nav-swaps'));
      expect(mockOpenBridgeExperience).not.toHaveBeenCalled();
    });
  });

  describe('bridge reset on navigate away from Swaps', () => {
    it.each([
      ['Home', 'bottom-nav-home'],
      ['Activity', 'bottom-nav-activity'],
      ['Perps', 'bottom-nav-perps'],
      ['Money', 'bottom-nav-money'],
    ])(
      'resets the bridge controller when navigating to %s from swaps',
      (_label, testId) => {
        const { getByTestId } = renderBottomNavBar(baseState, SWAP_PATH);

        fireEvent.click(getByTestId(testId));
        expect(mockResetBridgeController).toHaveBeenCalledTimes(1);
      },
    );

    it('does not reset the bridge controller when not on the swaps route', () => {
      const { getByTestId } = renderBottomNavBar(baseState, ACTIVITY_ROUTE);

      fireEvent.click(getByTestId('bottom-nav-home'));
      expect(mockResetBridgeController).not.toHaveBeenCalled();
    });
  });
});
