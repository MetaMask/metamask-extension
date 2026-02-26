import React from 'react';
import { act, fireEvent, screen } from '@testing-library/react';
import mockState from '../../../../../test/data/mock-state.json';
import { renderWithProvider } from '../../../../../test/lib/render-helpers-navigate';
import configureStore from '../../../../store/store';
import {
  PerpsToastProvider,
  PERPS_TOAST_KEYS,
  usePerpsToast,
} from './perps-toast-provider';

const ToastHarness = () => {
  const {
    showPerpsToast,
    showPerpsToastByKey,
    replacePerpsToast,
    replacePerpsToastByKey,
    hidePerpsToast,
  } = usePerpsToast();

  return (
    <>
      <button
        type="button"
        onClick={() => {
          showPerpsToast({
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
          showPerpsToastByKey({
            key: PERPS_TOAST_KEYS.ORDER_SUBMITTED,
          });
        }}
      >
        Show Key Info
      </button>
      <button
        type="button"
        onClick={() => {
          showPerpsToastByKey({
            key: PERPS_TOAST_KEYS.ORDER_PLACED,
          });
        }}
      >
        Show Key Order Placed
      </button>
      <button
        type="button"
        onClick={() => {
          showPerpsToastByKey({
            key: PERPS_TOAST_KEYS.ORDER_FILLED,
          });
        }}
      >
        Show Key Order Filled
      </button>
      <button
        type="button"
        onClick={() => {
          showPerpsToastByKey({
            key: PERPS_TOAST_KEYS.ORDER_FAILED,
          });
        }}
      >
        Show Key Order Failed
      </button>
      <button
        type="button"
        onClick={() => {
          replacePerpsToast({
            message: 'Successful trade!',
            variant: 'success',
          });
        }}
      >
        Show Success
      </button>
      <button
        type="button"
        onClick={() => {
          replacePerpsToastByKey({
            key: PERPS_TOAST_KEYS.TRADE_SUCCESS,
          });
        }}
      >
        Show Key Success
      </button>
      <button
        type="button"
        onClick={() => {
          hidePerpsToast();
        }}
      >
        Hide Toast
      </button>
    </>
  );
};

const getStore = (perpsInAppToastsEnabled = true) =>
  configureStore({
    metamask: {
      ...mockState.metamask,
      remoteFeatureFlags: {
        ...mockState.metamask.remoteFeatureFlags,
        perpsEnabledVersion: {
          enabled: true,
          minimumVersion: '0.0.0',
        },
        perpsInAppToastsEnabled,
      },
    },
  });

describe('PerpsToastProvider', () => {
  afterEach(() => {
    jest.useRealTimers();
  });

  it('shows and hides a toast from context actions', () => {
    renderWithProvider(
      <PerpsToastProvider>
        <ToastHarness />
      </PerpsToastProvider>,
      getStore(),
    );

    fireEvent.click(screen.getByRole('button', { name: 'Show Info' }));
    expect(screen.getByText('Submitting order...')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Hide Toast' }));
    expect(screen.queryByText('Submitting order...')).not.toBeInTheDocument();
  });

  it('replaces the currently visible toast', () => {
    renderWithProvider(
      <PerpsToastProvider>
        <ToastHarness />
      </PerpsToastProvider>,
      getStore(),
    );

    fireEvent.click(screen.getByRole('button', { name: 'Show Info' }));
    expect(screen.getByText('Submitting order...')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Show Success' }));
    expect(screen.queryByText('Submitting order...')).not.toBeInTheDocument();
    expect(screen.getByText('Successful trade!')).toBeInTheDocument();
  });

  it('auto-hides success toasts', () => {
    jest.useFakeTimers();

    renderWithProvider(
      <PerpsToastProvider>
        <ToastHarness />
      </PerpsToastProvider>,
      getStore(),
    );

    fireEvent.click(screen.getByRole('button', { name: 'Show Success' }));
    expect(screen.getByText('Successful trade!')).toBeInTheDocument();

    act(() => {
      jest.advanceTimersByTime(3000);
    });

    expect(screen.queryByText('Successful trade!')).not.toBeInTheDocument();
  });

  it('maps order submitted key to info variant without auto-hide', () => {
    jest.useFakeTimers();

    renderWithProvider(
      <PerpsToastProvider>
        <ToastHarness />
      </PerpsToastProvider>,
      getStore(),
    );

    fireEvent.click(screen.getByRole('button', { name: 'Show Key Info' }));
    expect(screen.getByText('Order submitted')).toBeInTheDocument();
    expect(screen.getByTestId('perps-toast-icon-loading')).toBeInTheDocument();

    act(() => {
      jest.advanceTimersByTime(10000);
    });

    expect(screen.getByText('Order submitted')).toBeInTheDocument();
  });

  it('maps trade success key to success variant with auto-hide', () => {
    jest.useFakeTimers();

    renderWithProvider(
      <PerpsToastProvider>
        <ToastHarness />
      </PerpsToastProvider>,
      getStore(),
    );

    fireEvent.click(screen.getByRole('button', { name: 'Show Key Success' }));
    expect(screen.getByText('Position closed')).toBeInTheDocument();
    expect(
      screen.getByTestId('perps-toast-icon-check-bold'),
    ).toBeInTheDocument();

    act(() => {
      jest.advanceTimersByTime(3000);
    });

    expect(screen.queryByText('Position closed')).not.toBeInTheDocument();
  });

  it('maps order placed key to success variant with auto-hide', () => {
    jest.useFakeTimers();

    renderWithProvider(
      <PerpsToastProvider>
        <ToastHarness />
      </PerpsToastProvider>,
      getStore(),
    );

    fireEvent.click(
      screen.getByRole('button', { name: 'Show Key Order Placed' }),
    );
    expect(screen.getByText('Order placed')).toBeInTheDocument();
    expect(
      screen.getByTestId('perps-toast-icon-check-bold'),
    ).toBeInTheDocument();

    act(() => {
      jest.advanceTimersByTime(3000);
    });

    expect(screen.queryByText('Order placed')).not.toBeInTheDocument();
  });

  it('maps order filled key to success variant with auto-hide', () => {
    jest.useFakeTimers();

    renderWithProvider(
      <PerpsToastProvider>
        <ToastHarness />
      </PerpsToastProvider>,
      getStore(),
    );

    fireEvent.click(
      screen.getByRole('button', { name: 'Show Key Order Filled' }),
    );
    expect(screen.getByText('Order filled')).toBeInTheDocument();
    expect(
      screen.getByTestId('perps-toast-icon-check-bold'),
    ).toBeInTheDocument();

    act(() => {
      jest.advanceTimersByTime(3000);
    });

    expect(screen.queryByText('Order filled')).not.toBeInTheDocument();
  });

  it('maps order failed key to error variant with auto-hide', () => {
    jest.useFakeTimers();

    renderWithProvider(
      <PerpsToastProvider>
        <ToastHarness />
      </PerpsToastProvider>,
      getStore(),
    );

    fireEvent.click(
      screen.getByRole('button', { name: 'Show Key Order Failed' }),
    );
    expect(screen.getByText('Failed to place order')).toBeInTheDocument();
    expect(screen.getByTestId('perps-toast-icon-warning')).toBeInTheDocument();

    act(() => {
      jest.advanceTimersByTime(5000);
    });

    expect(screen.queryByText('Failed to place order')).not.toBeInTheDocument();
  });

  it('does not show toasts when perps toast flag is disabled', () => {
    renderWithProvider(
      <PerpsToastProvider>
        <ToastHarness />
      </PerpsToastProvider>,
      getStore(false),
    );

    fireEvent.click(screen.getByRole('button', { name: 'Show Info' }));
    expect(screen.queryByText('Submitting order...')).not.toBeInTheDocument();
  });
});
