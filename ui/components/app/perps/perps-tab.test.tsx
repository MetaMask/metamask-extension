import React from 'react';
import mockState from '../../../../test/data/mock-state.json';
import configureStore from '../../../store/store';
import { renderWithProvider } from '../../../../test/lib/render-helpers-navigate';
import { PerpsTab } from './perps-tab';

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

describe('PerpsTab', () => {
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
});
