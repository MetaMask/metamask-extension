import React from 'react';
import { render } from '@testing-library/react';
import { useDispatch } from 'react-redux';

import {
  getNetworkToAutomaticallySwitchTo,
  getNumberOfAllUnapprovedTransactionsAndMessages,
} from '../../selectors';
import { getIsUnlocked } from '../../ducks/metamask/base-selectors';
import { useAppSelector } from '../../store/store';
import { automaticallySwitchNetwork } from '../../store/actions';
import { NetworkHandler } from './network-handler';

jest.mock('react-redux', () => ({
  ...jest.requireActual('react-redux'),
  useDispatch: jest.fn(),
}));

jest.mock('../../store/store', () => ({
  ...jest.requireActual('../../store/store'),
  useAppSelector: jest.fn(),
}));

jest.mock('../../store/actions', () => ({
  ...jest.requireActual('../../store/actions'),
  automaticallySwitchNetwork: jest.fn((networkClientId: string) => ({
    type: 'AUTOMATICALLY_SWITCH_NETWORK',
    payload: networkClientId,
  })),
}));

describe('NetworkHandler', () => {
  const mockDispatch = jest.fn();

  let networkToAutomaticallySwitchTo: string | null;
  let totalUnapprovedConfirmationCount: number;
  let isUnlocked: boolean;

  beforeEach(() => {
    jest.clearAllMocks();
    networkToAutomaticallySwitchTo = null;
    totalUnapprovedConfirmationCount = 0;
    isUnlocked = true;
    mockDispatch.mockReset();
    jest.mocked(useDispatch).mockReturnValue(mockDispatch);

    jest.mocked(useAppSelector).mockImplementation((selector) => {
      if (selector === getNetworkToAutomaticallySwitchTo) {
        return networkToAutomaticallySwitchTo;
      }

      if (selector === getNumberOfAllUnapprovedTransactionsAndMessages) {
        return totalUnapprovedConfirmationCount;
      }

      if (selector === getIsUnlocked) {
        return isUnlocked;
      }

      return undefined;
    });
  });

  it('dispatches automatic switch when pending confirmations drop to zero', () => {
    networkToAutomaticallySwitchTo = 'network-client-id';
    totalUnapprovedConfirmationCount = 1;

    const { rerender } = render(<NetworkHandler />);

    totalUnapprovedConfirmationCount = 0;
    rerender(<NetworkHandler />);

    expect(automaticallySwitchNetwork).toHaveBeenCalledWith(
      'network-client-id',
    );
    expect(mockDispatch).toHaveBeenCalledWith(
      expect.objectContaining({
        payload: 'network-client-id',
      }),
    );
  });

  it('dispatches automatic switch when the wallet transitions from locked to unlocked', () => {
    networkToAutomaticallySwitchTo = 'network-client-id';
    totalUnapprovedConfirmationCount = 0;
    isUnlocked = false;

    const { rerender } = render(<NetworkHandler />);

    isUnlocked = true;
    rerender(<NetworkHandler />);

    expect(automaticallySwitchNetwork).toHaveBeenCalledWith(
      'network-client-id',
    );
    expect(mockDispatch).toHaveBeenCalledWith(
      expect.objectContaining({
        payload: 'network-client-id',
      }),
    );
  });

  it('does not dispatch when there is no network to switch to', () => {
    totalUnapprovedConfirmationCount = 1;

    const { rerender } = render(<NetworkHandler />);

    totalUnapprovedConfirmationCount = 0;
    rerender(<NetworkHandler />);

    expect(automaticallySwitchNetwork).not.toHaveBeenCalled();
    expect(mockDispatch).not.toHaveBeenCalled();
  });
});
