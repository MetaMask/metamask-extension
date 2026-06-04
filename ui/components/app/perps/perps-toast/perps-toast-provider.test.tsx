import { act, fireEvent, screen, waitFor } from '@testing-library/react';
import React from 'react';
import { toast } from '@metamask/design-system-react';
import mockState from '../../../../../test/data/mock-state.json';
import { enLocale as messages } from '../../../../../test/lib/i18n-helpers';
import { renderWithProvider } from '../../../../../test/lib/render-helpers-navigate';
import configureStore from '../../../../store/store';
import {
  PerpsToastProvider,
  PERPS_TOAST_KEYS,
  usePerpsToast,
} from './perps-toast-provider';

jest.mock('@metamask/design-system-react', () => {
  const actual = jest.requireActual('@metamask/design-system-react');
  const mockToast = jest.fn();
  mockToast.dismiss = jest.fn();
  return {
    ...actual,
    toast: mockToast,
  };
});

const mockToast = toast as jest.MockedFunction<typeof toast> & {
  dismiss: jest.Mock;
};

const ToastHarness = () => {
  const { replacePerpsToast, replacePerpsToastByKey, hidePerpsToast } =
    usePerpsToast();

  return (
    <>
      <button
        type="button"
        onClick={() => {
          replacePerpsToast({
            message: 'Submitting order...',
            variant: 'info',
          });
        }}
      >
        Show Info
      </button>
      <button
        type="button"
        onClick={() => {
          replacePerpsToastByKey({
            key: PERPS_TOAST_KEYS.ORDER_SUBMITTED,
          });
        }}
      >
        Show Key Info
      </button>
      <button
        type="button"
        onClick={() => {
          replacePerpsToastByKey({
            key: PERPS_TOAST_KEYS.ORDER_PLACED,
          });
        }}
      >
        Show Key Success
      </button>
      <button
        type="button"
        onClick={() => {
          replacePerpsToastByKey({
            key: PERPS_TOAST_KEYS.ORDER_FAILED,
          });
        }}
      >
        Show Key Error
      </button>
      <button type="button" onClick={hidePerpsToast}>
        Hide Toast
      </button>
    </>
  );
};

const getStore = () =>
  configureStore({
    metamask: {
      ...mockState.metamask,
      remoteFeatureFlags: {
        ...mockState.metamask.remoteFeatureFlags,
        perpsEnabledVersion: {
          enabled: true,
          minimumVersion: '0.0.0',
        },
      },
    },
  });

describe('PerpsToastProvider', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('shows a toast from context actions', async () => {
    renderWithProvider(
      <PerpsToastProvider>
        <ToastHarness />
      </PerpsToastProvider>,
      getStore(),
    );

    fireEvent.click(screen.getByRole('button', { name: 'Show Info' }));

    await waitFor(() => expect(mockToast).toHaveBeenCalled());

    expect(mockToast).toHaveBeenCalledWith(
      expect.objectContaining({
        severity: 'default',
        title: 'Submitting order...',
        hasNoTimeout: true,
        'data-testid': 'perps-toast',
      }),
    );
  });

  it('maps order submitted key to a non-timeout toast', async () => {
    renderWithProvider(
      <PerpsToastProvider>
        <ToastHarness />
      </PerpsToastProvider>,
      getStore(),
    );

    fireEvent.click(screen.getByRole('button', { name: 'Show Key Info' }));

    await waitFor(() => expect(mockToast).toHaveBeenCalled());

    expect(mockToast).toHaveBeenCalledWith(
      expect.objectContaining({
        severity: 'default',
        title: messages.perpsToastOrderSubmitted.message,
        hasNoTimeout: true,
      }),
    );
  });

  it('maps order placed key to a timeout toast', async () => {
    jest.useFakeTimers();

    renderWithProvider(
      <PerpsToastProvider>
        <ToastHarness />
      </PerpsToastProvider>,
      getStore(),
    );

    fireEvent.click(screen.getByRole('button', { name: 'Show Key Success' }));

    await waitFor(() => expect(mockToast).toHaveBeenCalled());

    expect(mockToast).toHaveBeenCalledWith(
      expect.objectContaining({
        severity: 'success',
        title: messages.perpsToastOrderPlaced.message,
        hasNoTimeout: true,
      }),
    );

    act(() => {
      jest.advanceTimersByTime(3000);
    });

    expect(mockToast.dismiss).toHaveBeenCalled();
  });

  it('dismisses the active toast when hidePerpsToast is called', async () => {
    renderWithProvider(
      <PerpsToastProvider>
        <ToastHarness />
      </PerpsToastProvider>,
      getStore(),
    );

    fireEvent.click(screen.getByRole('button', { name: 'Show Key Error' }));
    await waitFor(() => expect(mockToast).toHaveBeenCalled());

    fireEvent.click(screen.getByRole('button', { name: 'Hide Toast' }));

    await waitFor(() => expect(mockToast.dismiss).toHaveBeenCalled());
  });
});
