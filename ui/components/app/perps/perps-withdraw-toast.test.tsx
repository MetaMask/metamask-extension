/**
 * @jest-environment jsdom
 */
import { waitFor } from '@testing-library/react';
import React from 'react';
import { toast } from '@metamask/design-system-react';
import configureStore from '../../../store/store';
import mockState from '../../../../test/data/mock-state.json';
import { renderWithProvider } from '../../../../test/lib/render-helpers-navigate';
import { submitRequestToBackground } from '../../../store/background-connection';
import { PerpsWithdrawToast } from './perps-withdraw-toast';

jest.mock('@metamask/design-system-react', () => {
  const actual = jest.requireActual('@metamask/design-system-react');
  const mockToast = jest.fn();
  mockToast.dismiss = jest.fn();
  return {
    ...actual,
    toast: mockToast,
  };
});

jest.mock('../../../store/background-connection', () => ({
  submitRequestToBackground: jest.fn().mockResolvedValue(undefined),
}));

const mockToast = toast as jest.MockedFunction<typeof toast>;
const mockSubmit = submitRequestToBackground as jest.MockedFunction<
  typeof submitRequestToBackground
>;

describe('PerpsWithdrawToast', () => {
  const baseResult = {
    amount: '50',
    asset: 'USDC',
    txHash: '',
    timestamp: 1_700_000_000_000,
    success: true,
    error: '',
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('emits a success toast when lastWithdrawResult is set', async () => {
    const store = configureStore({
      metamask: {
        ...mockState.metamask,
        lastWithdrawResult: baseResult,
      },
    });

    renderWithProvider(<PerpsWithdrawToast />, store);

    await waitFor(() => expect(mockToast).toHaveBeenCalled());

    expect(mockToast).toHaveBeenCalledWith(
      expect.objectContaining({
        severity: 'success',
        title: expect.any(String),
        description: expect.any(String),
        hasNoTimeout: true,
        'data-testid': 'perps-withdraw-toast',
      }),
    );
  });

  it('passes dismissToast as onClose', async () => {
    const store = configureStore({
      metamask: {
        ...mockState.metamask,
        lastWithdrawResult: baseResult,
      },
    });

    renderWithProvider(<PerpsWithdrawToast />, store);

    await waitFor(() => expect(mockToast).toHaveBeenCalled());

    const options = mockToast.mock.calls.at(-1)?.[0] as {
      onClose?: () => void;
    };

    options.onClose?.();

    expect(mockSubmit).toHaveBeenCalledWith('perpsClearWithdrawResult', []);
  });

  it('renders nothing when there is no lastWithdrawResult', async () => {
    const store = configureStore({
      metamask: {
        ...mockState.metamask,
        lastWithdrawResult: null,
      },
    });

    renderWithProvider(<PerpsWithdrawToast />, store);

    await waitFor(() => expect(mockToast).not.toHaveBeenCalled());
  });
});
