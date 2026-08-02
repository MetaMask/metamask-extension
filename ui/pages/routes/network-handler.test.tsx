import React from 'react';
import { waitFor } from '@testing-library/react';

import {
  getNetworkToAutomaticallySwitchTo,
  getNumberOfAllUnapprovedTransactionsAndMessages,
} from '../../selectors';
import { getIsUnlocked } from '../../ducks/metamask/base-selectors';
import { useAppSelector, useDispatch } from '../../store/hooks';
import { automaticallySwitchNetwork } from '../../store/actions';
import { NetworkHandler } from './network-handler';

const { render } = jest.requireActual<typeof import('@testing-library/react')>(
  '@testing-library/react',
);

jest.mock('react-redux', () => ({
  ...jest.requireActual('react-redux'),
}));

jest.mock('../../store/hooks', () => ({
  useDispatch: jest.fn(),
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

  it('dispatches automatic switch when pending confirmations drop to zero', async () => {
    networkToAutomaticallySwitchTo = 'network-client-id';
    totalUnapprovedConfirmationCount = 1;

    const { rerender } = render(<NetworkHandler />);

    totalUnapprovedConfirmationCount = 0;
    rerender(<NetworkHandler />);

    await waitFor(() => {
      expect(automaticallySwitchNetwork).toHaveBeenCalledWith(
        'network-client-id',
      );
      expect(mockDispatch).toHaveBeenCalledWith(
        expect.objectContaining({
          payload: 'network-client-id',
        }),
      );
    });
  });

  it('dispatches automatic switch when the wallet transitions from locked to unlocked', async () => {
    networkToAutomaticallySwitchTo = 'network-client-id';
    totalUnapprovedConfirmationCount = 0;
    isUnlocked = false;

    const { rerender } = render(<NetworkHandler />);

    isUnlocked = true;
    rerender(<NetworkHandler />);

    await waitFor(() => {
      expect(automaticallySwitchNetwork).toHaveBeenCalledWith(
        'network-client-id',
      );
      expect(mockDispatch).toHaveBeenCalledWith(
        expect.objectContaining({
          payload: 'network-client-id',
        }),
      );
    });
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
