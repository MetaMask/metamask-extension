/**
 * @jest-environment jsdom
 */
import { act, render, waitFor } from '@testing-library/react';
import { toast } from '@metamask/design-system-react';
import { MerklClaimToast } from './merkl-claim-toast';
import React from 'react';

const mockDismissToast = jest.fn();
const mockUseMerklClaimStatus = jest.fn();

jest.mock('@metamask/design-system-react', () => {
  const actual = jest.requireActual('@metamask/design-system-react');
  const mockToast = jest.fn();
  mockToast.dismiss = jest.fn();
  return {
    ...actual,
    toast: mockToast,
  };
});

jest.mock('../../../hooks/useI18nContext', () => ({
  useI18nContext: () => (key: string) => {
    const translations: Record<string, string> = {
      merklRewardsToastInProgress: 'Claiming rewards...',
      merklRewardsToastSuccess: 'Rewards claimed!',
      merklRewardsToastFailed: 'Claim failed.',
    };
    return translations[key] ?? key;
  },
}));

jest.mock('../../../hooks/musd/useMerklClaimStatus', () => ({
  useMerklClaimStatus: () => mockUseMerklClaimStatus(),
}));

const mockToast = toast as jest.MockedFunction<typeof toast> & {
  dismiss: jest.Mock;
};

describe('MerklClaimToast', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('dismisses when toastState is null', async () => {
    mockUseMerklClaimStatus.mockReturnValue({
      toastState: null,
      dismissToast: mockDismissToast,
    });

    render(<MerklClaimToast />);

    await waitFor(() => expect(mockToast).not.toHaveBeenCalled());
  });

  it('renders in-progress toast without timeout', async () => {
    mockUseMerklClaimStatus.mockReturnValue({
      toastState: 'in-progress',
      dismissToast: mockDismissToast,
    });

    render(<MerklClaimToast />);

    await waitFor(() => expect(mockToast).toHaveBeenCalled());

    expect(mockToast).toHaveBeenCalledWith(
      expect.objectContaining({
        severity: 'default',
        title: 'Claiming rewards...',
        hasNoTimeout: true,
        'data-testid': 'merkl-claim-toast',
      }),
    );
  });

  it('renders success toast with timeout', async () => {
    jest.useFakeTimers();

    mockUseMerklClaimStatus.mockReturnValue({
      toastState: 'success',
      dismissToast: mockDismissToast,
    });

    render(<MerklClaimToast />);

    await waitFor(() => expect(mockToast).toHaveBeenCalled());

    expect(mockToast).toHaveBeenCalledWith(
      expect.objectContaining({
        severity: 'success',
        title: 'Rewards claimed!',
        hasNoTimeout: false,
      }),
    );

    act(() => {
      jest.advanceTimersByTime(5000);
    });

    expect(mockDismissToast).toHaveBeenCalled();
  });

  it('renders failed toast with timeout', async () => {
    mockUseMerklClaimStatus.mockReturnValue({
      toastState: 'failed',
      dismissToast: mockDismissToast,
    });

    render(<MerklClaimToast />);

    await waitFor(() => expect(mockToast).toHaveBeenCalled());

    expect(mockToast).toHaveBeenCalledWith(
      expect.objectContaining({
        severity: 'danger',
        title: 'Claim failed.',
        hasNoTimeout: false,
      }),
    );
  });
});
