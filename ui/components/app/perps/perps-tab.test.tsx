import React from 'react';
import { act } from '@testing-library/react';
import mockState from '../../../../test/data/mock-state.json';
import configureStore from '../../../store/store';
import { renderWithProvider } from '../../../../test/lib/render-helpers-navigate';
import { submitRequestToBackground } from '../../../store/background-connection';
import { PerpsTab } from './perps-tab';

jest.mock('../../../store/background-connection', () => ({
  submitRequestToBackground: jest.fn().mockResolvedValue(undefined),
}));

jest.mock('./perps-view-stream-boundary', () => ({
  PerpsViewStreamBoundary: ({ children }: { children: React.ReactNode }) =>
    children,
}));

jest.mock('./perps-view', () => ({
  PerpsView: () => <div data-testid="perps-view-mock">Perps</div>,
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
