import React from 'react';
import { act, fireEvent, screen } from '@testing-library/react';
import mockState from '../../../../../test/data/mock-state.json';
import { renderWithProvider } from '../../../../../test/lib/render-helpers-navigate';
import configureStore from '../../../../store/store';
import { PerpsToastProvider, usePerpsToast } from './perps-toast-provider';

const ToastHarness = () => {
  const { showPerpsToast, replacePerpsToast, hidePerpsToast } = usePerpsToast();

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
