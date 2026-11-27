import React from 'react';
import { render } from '@testing-library/react';
import {
  getRampsTokens,
  syncRampsOrdersWithUserStorage,
} from '../../store/controller-actions/ramps-controller';
import RampsBootstrap from './RampsBootstrap';
import { createRampsMockStore, createRampsTestWrapper } from './test-utils';

jest.mock('../../store/controller-actions/ramps-controller', () => ({
  getRampsTokens: jest.fn().mockResolvedValue(undefined),
  setRampsSelectedProvider: jest.fn().mockResolvedValue(undefined),
  setRampsSelectedPaymentMethod: jest.fn().mockResolvedValue(undefined),
  getRampsProviders: jest.fn().mockResolvedValue({ providers: [] }),
  getRampsPaymentMethods: jest.fn().mockResolvedValue({ payments: [] }),
  syncRampsOrdersWithUserStorage: jest.fn().mockResolvedValue(undefined),
}));

jest.mock('@tanstack/react-query', () => {
  const actual = jest.requireActual('@tanstack/react-query');
  return {
    ...actual,
    useQuery: jest.fn(() => ({
      data: undefined,
      isLoading: false,
      isFetching: false,
      isError: false,
      error: null,
    })),
  };
});

describe('RampsBootstrap', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('loads tokens for the current region', () => {
    render(<RampsBootstrap />, {
      wrapper: createRampsTestWrapper(),
    });

    expect(getRampsTokens).toHaveBeenCalledWith('us-ca', 'buy');
  });

  it('syncs ramps orders when the sync gates pass', () => {
    render(<RampsBootstrap />, {
      wrapper: createRampsTestWrapper(
        createRampsMockStore({
          isSignedIn: true,
          isBackupAndSyncEnabled: true,
          isRampsSyncingEnabled: true,
          isUnlocked: true,
          useExternalServices: true,
          completedOnboarding: true,
        }),
      ),
    });

    expect(syncRampsOrdersWithUserStorage).toHaveBeenCalled();
  });
});
