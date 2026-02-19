import React from 'react';
import configureMockStore from 'redux-mock-store';
import thunk from 'redux-thunk';
import { fireEvent } from '@testing-library/react';
import { renderWithProvider } from '../../../test/lib/render-helpers-navigate';
import mockState from '../../../test/data/mock-state.json';

// Mock semver to control version comparison in tests
jest.mock('semver', () => ({
  gte: jest.fn(() => true),
}));

// Mock loglevel to prevent console noise
jest.mock('loglevel', () => ({
  default: {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    debug: jest.fn(),
    trace: jest.fn(),
    setLevel: jest.fn(),
    setDefaultLevel: jest.fn(),
  },
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
  debug: jest.fn(),
  trace: jest.fn(),
  setLevel: jest.fn(),
  setDefaultLevel: jest.fn(),
}));

const mockTriggerPerpsDeposit = jest.fn().mockResolvedValue(true);
let mockIsPerpsDepositLoading = false;

jest.mock('../confirmations/hooks/perps/usePerpsDepositTrigger', () => ({
  usePerpsDepositTrigger: jest.fn(() => ({
    trigger: mockTriggerPerpsDeposit,
    isLoading: mockIsPerpsDepositLoading,
  })),
}));

jest.mock('../../hooks/perps', () => ({
  usePerpsEligibility: jest.fn(() => ({ isEligible: true })),
}));

jest.mock('../../hooks/perps/stream', () => ({
  usePerpsLiveAccount: jest.fn(() => ({
    account: undefined,
    isInitialLoading: false,
  })),
  usePerpsLivePositions: jest.fn(() => ({
    positions: [],
    isInitialLoading: false,
  })),
  usePerpsLiveOrders: jest.fn(() => ({
    orders: [],
    isInitialLoading: false,
  })),
  usePerpsLiveMarketData: jest.fn(() => ({
    cryptoMarkets: [],
    hip3Markets: [],
    isInitialLoading: false,
  })),
}));

// eslint-disable-next-line import/first
import PerpsHomePage from './perps-home-page';

describe('PerpsHomePage', () => {
  const middlewares = [thunk];
  const mockStore = configureMockStore(middlewares);

  const createMockState = (perpsEnabled = true) => ({
    ...mockState,
    metamask: {
      ...mockState.metamask,
      remoteFeatureFlags: {
        perpsEnabledVersion: perpsEnabled
          ? { enabled: true, minimumVersion: '0.0.0' }
          : { enabled: false, minimumVersion: '99.99.99' },
      },
    },
    perpsTutorial: {
      tutorialModalOpen: false,
      activeStep: 'WhatArePerps',
      tutorialCompleted: false,
    },
  });

  beforeEach(() => {
    jest.clearAllMocks();
    mockIsPerpsDepositLoading = false;
  });

  it('calls perps deposit trigger when Add funds is clicked', () => {
    const store = mockStore(createMockState(true));

    const { getByTestId, queryByTestId } = renderWithProvider(
      <PerpsHomePage />,
      store,
    );

    const addFundsButton =
      queryByTestId('perps-balance-actions-add-funds') ??
      getByTestId('perps-balance-actions-add-funds-empty');

    fireEvent.click(addFundsButton);

    expect(mockTriggerPerpsDeposit).toHaveBeenCalledTimes(1);
  });

  it('disables Add funds while perps deposit creation is loading', () => {
    mockIsPerpsDepositLoading = true;
    const store = mockStore(createMockState(true));

    const { getByTestId, queryByTestId } = renderWithProvider(
      <PerpsHomePage />,
      store,
    );

    const addFundsButton =
      queryByTestId('perps-balance-actions-add-funds') ??
      getByTestId('perps-balance-actions-add-funds-empty');

    expect(addFundsButton).toBeDisabled();
  });
});
