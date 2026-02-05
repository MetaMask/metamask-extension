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
  },
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
  debug: jest.fn(),
  trace: jest.fn(),
}));

const mockTriggerPerpsDeposit = jest.fn().mockResolvedValue(true);

jest.mock('../confirmations/hooks/perps/usePerpsDepositTrigger', () => ({
  usePerpsDepositTrigger: jest.fn(() => ({
    trigger: mockTriggerPerpsDeposit,
    isLoading: false,
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
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('calls perps deposit trigger when Add funds is clicked', () => {
    const store = mockStore(createMockState(true));

    const { getByTestId } = renderWithProvider(<PerpsHomePage />, store);

    fireEvent.click(getByTestId('perps-balance-actions-add-funds'));

    expect(mockTriggerPerpsDeposit).toHaveBeenCalledTimes(1);
  });
});
