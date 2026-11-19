import React from 'react';
import { act, fireEvent, screen } from '@testing-library/react';
import mockState from '../../../../test/data/mock-state.json';
import configureStore from '../../../store/store';
import { renderWithProvider } from '../../../../test/lib/render-helpers-navigate';
import { submitRequestToBackground } from '../../../store/background-connection';
import { enLocale as messages } from '../../../../test/lib/i18n-helpers';
import { PerpsTab } from './perps-tab';

let mockPerpsViewShouldThrow = false;

jest.mock('../../../store/background-connection', () => ({
  submitRequestToBackground: jest.fn().mockResolvedValue(undefined),
}));

jest.mock('./perps-view-stream-boundary', () => ({
  PerpsViewStreamBoundary: ({ children }: { children: React.ReactNode }) =>
    children,
}));

jest.mock('./perps-view', () => ({
  PerpsView: () => {
    if (mockPerpsViewShouldThrow) {
      throw new Error('perps home failed to load');
    }

    const { useAccessRestrictedModal } = jest.requireActual('../compliance');
    const { showAccessRestrictedModal } = useAccessRestrictedModal();

    return (
      <button data-testid="perps-view-mock" onClick={showAccessRestrictedModal}>
        Perps
      </button>
    );
  },
}));

jest.mock('./perps-toast', () => ({
  PerpsToastProvider: ({ children }: { children: React.ReactNode }) => children,
}));

const mockSubmitRequestToBackground =
  submitRequestToBackground as jest.MockedFunction<
    typeof submitRequestToBackground
  >;

describe('PerpsTab', () => {
  beforeEach(() => {
    mockSubmitRequestToBackground.mockClear();
    mockPerpsViewShouldThrow = false;
  });

  it('renders the "basic functionality off" empty state when useExternalServices is false', () => {
    const store = configureStore({
      metamask: {
        ...mockState.metamask,
        useExternalServices: false,
      },
    });

    const { queryByTestId } = renderWithProvider(<PerpsTab />, store);

    expect(queryByTestId('perps-basic-functionality-off')).not.toBeNull();
    expect(queryByTestId('perps-view-mock')).toBeNull();
  });

  it('keeps the outage banner visible when perps home content fails to load', () => {
    mockPerpsViewShouldThrow = true;
    jest.spyOn(console, 'error').mockImplementation(() => undefined);
    const store = configureStore({
      metamask: {
        ...mockState.metamask,
        useExternalServices: true,
        remoteFeatureFlags: {
          ...mockState.metamask.remoteFeatureFlags,
          perpsPerpTradingServiceInterruptionBannerEnabled: true,
        },
      },
    });

    try {
      renderWithProvider(<PerpsTab />, store);

      expect(
        screen.getByTestId('perps-service-interruption-banner'),
      ).toBeInTheDocument();
      expect(
        screen.getByText(messages.somethingWentWrong.message),
      ).toBeInTheDocument();
      expect(screen.queryByTestId('perps-view-mock')).not.toBeInTheDocument();
    } finally {
      jest.restoreAllMocks();
    }
  });

  it('renders the perps view when useExternalServices is true', () => {
    const store = configureStore({
      metamask: {
        ...mockState.metamask,
        useExternalServices: true,
      },
    });

    const { queryByTestId } = renderWithProvider(<PerpsTab />, store);

    expect(queryByTestId('perps-basic-functionality-off')).toBeNull();
    expect(queryByTestId('perps-view-mock')).not.toBeNull();
  });

  it('provides access restricted modal context to the perps view', () => {
    const store = configureStore({
      metamask: {
        ...mockState.metamask,
        useExternalServices: true,
      },
    });

    renderWithProvider(<PerpsTab />, store);

    fireEvent.click(screen.getByTestId('perps-view-mock'));

    expect(screen.getByTestId('access-restricted-modal')).toBeInTheDocument();
  });

  it('calls perpsDisconnect when useExternalServices toggles from true to false', () => {
    const store = configureStore({
      metamask: {
        ...mockState.metamask,
        useExternalServices: true,
      },
    });

    renderWithProvider(<PerpsTab />, store);

    act(() => {
      store.dispatch({
        type: 'UPDATE_METAMASK_STATE',
        value: {
          ...mockState.metamask,
          useExternalServices: false,
        },
      });
    });

    expect(mockSubmitRequestToBackground).toHaveBeenCalledWith(
      'perpsDisconnect',
    );
  });

  it('calls perpsDisconnect on initial render when useExternalServices is false', () => {
    const store = configureStore({
      metamask: {
        ...mockState.metamask,
        useExternalServices: false,
      },
    });

    renderWithProvider(<PerpsTab />, store);

    expect(mockSubmitRequestToBackground).toHaveBeenCalledWith(
      'perpsDisconnect',
    );
  });

  it('does not call perpsDisconnect when useExternalServices is true', () => {
    const store = configureStore({
      metamask: {
        ...mockState.metamask,
        useExternalServices: true,
      },
    });

    renderWithProvider(<PerpsTab />, store);

    expect(mockSubmitRequestToBackground).not.toHaveBeenCalledWith(
      'perpsDisconnect',
    );
  });
});
