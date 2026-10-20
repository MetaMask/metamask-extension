import React from 'react';
import { fireEvent } from '@testing-library/react';
import configureStore from '../../../store/store';
import mockState from '../../../../test/data/mock-state.json';
import { renderWithProvider } from '../../../../test/lib/render-helpers-navigate';
import {
  ACTIVITY_ROUTE,
  DEFAULT_ROUTE,
  MONEY_HOME_ROUTE,
  PERPS_HOME_PAGE_ROUTE,
} from '../../../helpers/constants/routes';
import { ScreenViewedEntryPoint } from '../../../../shared/constants/metametrics';
import type { MoneyAccountAvailability } from '../../../hooks/money/use-money-account-availability';
import { useMoneyAnalytics } from '../../../hooks/money/useMoneyAnalytics';
import { createMoneyAnalyticsMock } from '../../../hooks/money/useMoneyAnalytics.mock';
import { setBackgroundConnection } from '../../../store/background-connection';
import { SideNav } from './side-nav';

const mockNavigate = jest.fn();
const moneyAccountAvailable: { availability: MoneyAccountAvailability } = {
  availability: {
    isAvailable: true,
    address: '0x0000000000000000000000000000000000000001',
  },
};
const mockUseMoneyAccountAvailability: jest.MockedFunction<
  () => { availability: MoneyAccountAvailability }
> = jest.fn();

const backgroundConnectionMock = new Proxy(
  {},
  {
    get: () => jest.fn().mockResolvedValue(undefined),
  },
);

jest.mock('../../../hooks/money/use-money-account-availability', () => ({
  useMoneyAccountAvailability: () => mockUseMoneyAccountAvailability(),
}));

jest.mock('../../../hooks/money/useMoneyAnalytics', () => ({
  useMoneyAnalytics: jest.fn(),
}));

jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
}));

jest.mock('../../../../shared/lib/environment', () => ({
  ...jest.requireActual('../../../../shared/lib/environment'),
  getIsPerpsIncludedInBuild: jest.fn(() => true),
}));

const baseState = {
  activeTab: { origin: 'https://example.com' },
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
  ...baseState,
  metamask: {
    ...baseState.metamask,
    remoteFeatureFlags: {
      ...baseState.metamask.remoteFeatureFlags,
      perpsEnabledVersion: { enabled: false, minimumVersion: '0.0.1' },
    },
  },
};

function renderSideNav(state = baseState, pathname = DEFAULT_ROUTE) {
  const store = configureStore(state);
  return renderWithProvider(<SideNav />, store, pathname);
}

describe('SideNav', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    setBackgroundConnection(backgroundConnectionMock as never);
    mockUseMoneyAccountAvailability.mockReturnValue(moneyAccountAvailable);
    jest.mocked(useMoneyAnalytics).mockReturnValue(createMoneyAnalyticsMock());
  });

  it('renders the logo, the nav items and the accounts section', () => {
    const { getByTestId } = renderSideNav();

    expect(getByTestId('side-nav')).toBeInTheDocument();
    expect(getByTestId('side-nav-home')).toBeInTheDocument();
    expect(getByTestId('side-nav-perps')).toBeInTheDocument();
    expect(getByTestId('side-nav-money')).toBeInTheDocument();
    expect(getByTestId('side-nav-activity')).toBeInTheDocument();
    expect(getByTestId('side-nav-accounts')).toBeInTheDocument();
  });

  it('renders the nav items in order', () => {
    const { getByRole } = renderSideNav();

    const navButtons = getByRole('navigation').querySelectorAll('button');

    expect(
      Array.from(navButtons).map((button) =>
        button.getAttribute('data-testid'),
      ),
    ).toStrictEqual([
      'side-nav-home',
      'side-nav-perps',
      'side-nav-money',
      'side-nav-activity',
    ]);
  });

  it('hides Perps when it is unavailable', () => {
    const { queryByTestId } = renderSideNav(stateWithPerpsDisabled);

    expect(queryByTestId('side-nav-perps')).not.toBeInTheDocument();
    expect(queryByTestId('side-nav-home')).toBeInTheDocument();
  });

  it('hides Money when the Money Account is unavailable', () => {
    mockUseMoneyAccountAvailability.mockReturnValue({
      availability: { isAvailable: false },
    });

    const { queryByTestId } = renderSideNav();

    expect(queryByTestId('side-nav-money')).not.toBeInTheDocument();
  });

  it('marks only the item for the current route as active', () => {
    const { getByTestId } = renderSideNav(baseState, ACTIVITY_ROUTE);

    expect(getByTestId('side-nav-activity')).toHaveAttribute(
      'aria-current',
      'page',
    );
    expect(getByTestId('side-nav-home')).not.toHaveAttribute('aria-current');
    expect(getByTestId('side-nav-perps')).not.toHaveAttribute('aria-current');
    expect(getByTestId('side-nav-money')).not.toHaveAttribute('aria-current');
  });

  describe('navigation', () => {
    it('navigates to the root route when Home is clicked', () => {
      const { getByTestId } = renderSideNav(baseState, ACTIVITY_ROUTE);

      fireEvent.click(getByTestId('side-nav-home'));

      expect(mockNavigate).toHaveBeenCalledWith(DEFAULT_ROUTE, {
        state: {
          entryPoint: ScreenViewedEntryPoint.BottomNavClick,
          stayOnHomePage: true,
        },
      });
    });

    it('navigates to the perps page when Perps is clicked', () => {
      const { getByTestId } = renderSideNav();

      fireEvent.click(getByTestId('side-nav-perps'));

      expect(mockNavigate).toHaveBeenCalledWith(PERPS_HOME_PAGE_ROUTE, {
        state: { stayOnHomePage: true },
      });
    });

    it('navigates to Money Home when Money is clicked', () => {
      const { getByTestId } = renderSideNav();

      fireEvent.click(getByTestId('side-nav-money'));

      expect(mockNavigate).toHaveBeenCalledWith(MONEY_HOME_ROUTE, {
        state: { stayOnHomePage: true },
      });
    });

    it('navigates to the activity route when Activity is clicked', () => {
      const { getByTestId } = renderSideNav();

      fireEvent.click(getByTestId('side-nav-activity'));

      expect(mockNavigate).toHaveBeenCalledWith(ACTIVITY_ROUTE, {
        state: {
          entryPoint: ScreenViewedEntryPoint.BottomNavClick,
          stayOnHomePage: true,
        },
      });
    });
  });
});
