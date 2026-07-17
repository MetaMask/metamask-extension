import React from 'react';
import { act, fireEvent, screen } from '@testing-library/react';
import mockState from '../../../../../test/data/mock-state.json';
import { enLocale as messages } from '../../../../../test/lib/i18n-helpers';
import { renderWithProvider } from '../../../../../test/lib/render-helpers-navigate';
import configureStore from '../../../../store/store';
import { toast, Toaster } from '../../../ui/toast/toast';
import {
  PerpsToastProvider,
  PERPS_TOAST_KEYS,
  usePerpsToast,
} from './perps-toast-provider';

jest.mock('../../../../../shared/lib/environment-type', () => ({
  ...jest.requireActual('../../../../../shared/lib/environment-type'),
  isInteractiveUI: () => true,
}));

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
        Show Key Order Placed
      </button>
      <button
        type="button"
        onClick={() => {
          replacePerpsToastByKey({
            key: PERPS_TOAST_KEYS.ORDER_FILLED,
          });
        }}
      >
        Show Key Order Filled
      </button>
      <button
        type="button"
        onClick={() => {
          replacePerpsToastByKey({
            key: PERPS_TOAST_KEYS.ORDER_FAILED,
          });
        }}
      >
        Show Key Order Failed
      </button>
      <button
        type="button"
        onClick={() => {
          replacePerpsToastByKey({
            key: PERPS_TOAST_KEYS.CLOSE_FAILED,
          });
        }}
      >
        Show Key Close Failed
      </button>
      <button
        type="button"
        onClick={() => {
          replacePerpsToastByKey({
            key: PERPS_TOAST_KEYS.PARTIAL_CLOSE_IN_PROGRESS,
          });
        }}
      >
        Show Key Partial Close In Progress
      </button>
      <button
        type="button"
        onClick={() => {
          replacePerpsToastByKey({
            key: PERPS_TOAST_KEYS.PARTIAL_CLOSE_FAILED,
          });
        }}
      >
        Show Key Partial Close Failed
      </button>
      <button
        type="button"
        onClick={() => {
          replacePerpsToastByKey({
            key: PERPS_TOAST_KEYS.PARTIAL_CLOSE_SUCCESS,
          });
        }}
      >
        Show Key Partial Close Success
      </button>
      <button
        type="button"
        onClick={() => {
          replacePerpsToastByKey({
            key: PERPS_TOAST_KEYS.UPDATE_FAILED,
          });
        }}
      >
        Show Key Update Failed
      </button>
      <button
        type="button"
        onClick={() => {
          replacePerpsToastByKey({
            key: PERPS_TOAST_KEYS.MARGIN_ADD_SUCCESS,
            messageParams: ['$100', 'ETH'],
          });
        }}
      >
        Show Key Margin Add Success
      </button>
      <button
        type="button"
        onClick={() => {
          replacePerpsToastByKey({
            key: PERPS_TOAST_KEYS.MARGIN_ADJUSTMENT_FAILED,
            description: 'Unable to adjust margin',
          });
        }}
      >
        Show Key Margin Adjustment Failed
      </button>
      <button
        type="button"
        onClick={() => {
          replacePerpsToastByKey({
            key: PERPS_TOAST_KEYS.MARGIN_REMOVE_SUCCESS,
            messageParams: ['$50', 'ETH'],
          });
        }}
      >
        Show Key Margin Remove Success
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

const expectSuccessToastIcon = () => {
  const successIcon = screen.getByTestId('perps-toast-icon-check-bold');
  expect(successIcon).toHaveClass(
    'inline-flex',
    'h-8',
    'w-8',
    'bg-success-muted',
  );
  expect(successIcon).toHaveClass('perps-toast__success-icon');
  expect(successIcon.querySelector('svg')).toBeInTheDocument();
};

const expectPerpsToastLayout = () => {
  expect(screen.getByTestId('perps-toast')).toBeInTheDocument();
};

function renderPerpsToastProvider() {
  return renderWithProvider(
    <PerpsToastProvider>
      <ToastHarness />
      <Toaster />
    </PerpsToastProvider>,
    getStore(),
  );
}

const expectLoadingToastIcon = () => {
  const loadingIcon = screen.getByTestId('perps-toast-icon-loading');
  expect(loadingIcon).toHaveClass(
    'flex',
    'h-8',
    'w-8',
    'items-center',
    'justify-center',
  );
  const spinnerIcon = loadingIcon.querySelector('.mm-icon');
  expect(spinnerIcon).not.toBeInTheDocument();
  expect(loadingIcon.querySelector('svg')).toBeInTheDocument();
};

const expectErrorAvatarToastIcon = () => {
  const warningIcon = screen.getByTestId('perps-toast-icon-warning');
  expect(warningIcon).toHaveClass(
    'inline-flex',
    'h-8',
    'w-8',
    'bg-error-muted',
  );
  expect(warningIcon.querySelector('svg')).toBeInTheDocument();
};

describe('PerpsToastProvider', () => {
  afterEach(() => {
    jest.useRealTimers();
    toast.remove();
  });

  it('shows and hides a toast from context actions', () => {
    renderPerpsToastProvider();

    fireEvent.click(screen.getByRole('button', { name: 'Show Info' }));
    expect(screen.getByText('Submitting order...')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Hide Toast' }));
    expect(screen.queryByText('Submitting order...')).not.toBeInTheDocument();
  });

  it('replaces the currently visible toast', () => {
    renderPerpsToastProvider();

    fireEvent.click(screen.getByRole('button', { name: 'Show Info' }));
    expect(screen.getByText('Submitting order...')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Show Success' }));
    expect(screen.queryByText('Submitting order...')).not.toBeInTheDocument();
    expect(screen.getByText('Successful trade!')).toBeInTheDocument();
  });

  it('auto-hides success toasts', () => {
    jest.useFakeTimers();

    renderPerpsToastProvider();

    fireEvent.click(screen.getByRole('button', { name: 'Show Success' }));
    expect(screen.getByText('Successful trade!')).toBeInTheDocument();

    act(() => {
      jest.advanceTimersByTime(3000);
    });

    expect(screen.queryByText('Successful trade!')).not.toBeInTheDocument();
  });

  it('maps order submitted key to info variant without auto-hide', () => {
    jest.useFakeTimers();

    renderPerpsToastProvider();

    fireEvent.click(screen.getByRole('button', { name: 'Show Key Info' }));
    expect(
      screen.getByText(messages.perpsToastOrderSubmitted.message),
    ).toBeInTheDocument();
    expectLoadingToastIcon();
    expectPerpsToastLayout();

    act(() => {
      jest.advanceTimersByTime(10000);
    });

    expect(
      screen.getByText(messages.perpsToastOrderSubmitted.message),
    ).toBeInTheDocument();
  });

  it('maps trade success key to success variant with auto-hide', () => {
    jest.useFakeTimers();

    renderPerpsToastProvider();

    fireEvent.click(screen.getByRole('button', { name: 'Show Key Success' }));
    expect(
      screen.getByText(messages.perpsToastTradeSuccess.message),
    ).toBeInTheDocument();
    expectSuccessToastIcon();
    expectPerpsToastLayout();

    act(() => {
      jest.advanceTimersByTime(3000);
    });

    expect(
      screen.queryByText(messages.perpsToastTradeSuccess.message),
    ).not.toBeInTheDocument();
  });

  it('maps order placed key to success variant with auto-hide', () => {
    jest.useFakeTimers();

    renderPerpsToastProvider();

    fireEvent.click(
      screen.getByRole('button', { name: 'Show Key Order Placed' }),
    );
    expect(
      screen.getByText(messages.perpsToastOrderPlaced.message),
    ).toBeInTheDocument();
    expectSuccessToastIcon();

    act(() => {
      jest.advanceTimersByTime(3000);
    });

    expect(
      screen.queryByText(messages.perpsToastOrderPlaced.message),
    ).not.toBeInTheDocument();
  });

  it('maps order filled key to success variant with auto-hide', () => {
    jest.useFakeTimers();

    renderPerpsToastProvider();

    fireEvent.click(
      screen.getByRole('button', { name: 'Show Key Order Filled' }),
    );
    expect(
      screen.getByText(messages.perpsToastOrderFilled.message),
    ).toBeInTheDocument();
    expectSuccessToastIcon();

    act(() => {
      jest.advanceTimersByTime(3000);
    });

    expect(
      screen.queryByText(messages.perpsToastOrderFilled.message),
    ).not.toBeInTheDocument();
  });

  it('maps order failed key to error variant with auto-hide', () => {
    jest.useFakeTimers();

    renderPerpsToastProvider();

    fireEvent.click(
      screen.getByRole('button', { name: 'Show Key Order Failed' }),
    );
    expect(
      screen.getByText(messages.perpsToastOrderFailed.message),
    ).toBeInTheDocument();
    expectErrorAvatarToastIcon();

    act(() => {
      jest.advanceTimersByTime(5000);
    });

    expect(
      screen.queryByText(messages.perpsToastOrderFailed.message),
    ).not.toBeInTheDocument();
  });

  it('maps close failed key to avatar warning error variant with auto-hide', () => {
    jest.useFakeTimers();

    renderPerpsToastProvider();

    fireEvent.click(
      screen.getByRole('button', { name: 'Show Key Close Failed' }),
    );
    expect(
      screen.getByText(messages.perpsToastCloseFailed.message),
    ).toBeInTheDocument();
    expectErrorAvatarToastIcon();

    act(() => {
      jest.advanceTimersByTime(5000);
    });

    expect(
      screen.queryByText(messages.perpsToastCloseFailed.message),
    ).not.toBeInTheDocument();
  });

  it('maps partial close in-progress key to info variant without auto-hide', () => {
    jest.useFakeTimers();

    renderPerpsToastProvider();

    fireEvent.click(
      screen.getByRole('button', {
        name: 'Show Key Partial Close In Progress',
      }),
    );
    expect(
      screen.getByText(messages.perpsToastPartialCloseInProgress.message),
    ).toBeInTheDocument();
    expectLoadingToastIcon();

    act(() => {
      jest.advanceTimersByTime(10000);
    });

    expect(
      screen.getByText(messages.perpsToastPartialCloseInProgress.message),
    ).toBeInTheDocument();
  });

  it('maps partial close success key to success variant with auto-hide', () => {
    jest.useFakeTimers();

    renderPerpsToastProvider();

    fireEvent.click(
      screen.getByRole('button', { name: 'Show Key Partial Close Success' }),
    );
    expect(
      screen.getByText(messages.perpsToastPartialCloseSuccess.message),
    ).toBeInTheDocument();
    expectSuccessToastIcon();

    act(() => {
      jest.advanceTimersByTime(3000);
    });

    expect(
      screen.queryByText(messages.perpsToastPartialCloseSuccess.message),
    ).not.toBeInTheDocument();
  });

  it('maps partial close failed key to avatar warning error variant with auto-hide', () => {
    jest.useFakeTimers();

    renderPerpsToastProvider();

    fireEvent.click(
      screen.getByRole('button', { name: 'Show Key Partial Close Failed' }),
    );
    expect(
      screen.getByText(messages.perpsToastPartialCloseFailed.message),
    ).toBeInTheDocument();
    expectErrorAvatarToastIcon();

    act(() => {
      jest.advanceTimersByTime(5000);
    });

    expect(
      screen.queryByText(messages.perpsToastPartialCloseFailed.message),
    ).not.toBeInTheDocument();
  });

  it('maps update failed key to avatar warning error variant with auto-hide', () => {
    jest.useFakeTimers();

    renderPerpsToastProvider();

    fireEvent.click(
      screen.getByRole('button', { name: 'Show Key Update Failed' }),
    );
    expect(
      screen.getByText(messages.perpsToastUpdateFailed.message),
    ).toBeInTheDocument();
    expectErrorAvatarToastIcon();

    act(() => {
      jest.advanceTimersByTime(5000);
    });

    expect(
      screen.queryByText(messages.perpsToastUpdateFailed.message),
    ).not.toBeInTheDocument();
  });

  it('maps margin add success key to success variant with auto-hide', () => {
    jest.useFakeTimers();

    renderPerpsToastProvider();

    fireEvent.click(
      screen.getByRole('button', { name: 'Show Key Margin Add Success' }),
    );
    expect(
      screen.getByText('Added $100 margin to ETH position'),
    ).toBeInTheDocument();
    expectSuccessToastIcon();

    act(() => {
      jest.advanceTimersByTime(3000);
    });

    expect(
      screen.queryByText('Added $100 margin to ETH position'),
    ).not.toBeInTheDocument();
  });

  it('maps margin remove success key to success variant with auto-hide', () => {
    jest.useFakeTimers();

    renderPerpsToastProvider();

    fireEvent.click(
      screen.getByRole('button', { name: 'Show Key Margin Remove Success' }),
    );
    expect(
      screen.getByText('Removed $50 margin from ETH position'),
    ).toBeInTheDocument();
    expectSuccessToastIcon();

    act(() => {
      jest.advanceTimersByTime(3000);
    });

    expect(
      screen.queryByText('Removed $50 margin from ETH position'),
    ).not.toBeInTheDocument();
  });

  it('maps margin adjustment failed key to error variant with auto-hide', () => {
    jest.useFakeTimers();

    renderPerpsToastProvider();

    fireEvent.click(
      screen.getByRole('button', { name: 'Show Key Margin Adjustment Failed' }),
    );
    expect(
      screen.getByText(messages.perpsToastMarginAdjustmentFailed.message),
    ).toBeInTheDocument();
    expect(screen.getByText('Unable to adjust margin')).toBeInTheDocument();
    expectErrorAvatarToastIcon();

    act(() => {
      jest.advanceTimersByTime(5000);
    });

    expect(
      screen.queryByText(messages.perpsToastMarginAdjustmentFailed.message),
    ).not.toBeInTheDocument();
  });

  it('renders the toast via the shared Toaster component', () => {
    renderPerpsToastProvider();

    fireEvent.click(screen.getByRole('button', { name: 'Show Info' }));

    expect(screen.getByText('Submitting order...')).toBeInTheDocument();
    expect(screen.getByTestId('perps-toast')).toBeInTheDocument();
  });
});
