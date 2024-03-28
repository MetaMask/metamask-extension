import React from 'react';
import { fireEvent, renderWithProvider, waitFor } from '../../../../test/jest';
import configureStore from '../../../store/store';
import mockState from '../../../../test/data/mock-state.json';
import { LegacyMetaMetricsProvider } from '../../../contexts/metametrics';
import ExperimentalTab from './experimental-tab.component';

const render = (overrideMetaMaskState, props = {}) => {
  const store = configureStore({
    metamask: {
      ...mockState.metamask,
      ...overrideMetaMaskState,
    },
  });
  const comp = <ExperimentalTab {...props} />;
  return renderWithProvider(
    <LegacyMetaMetricsProvider>{comp}</LegacyMetaMetricsProvider>,
    store,
  );
};

describe('ExperimentalTab', () => {
  it('renders ExperimentalTab component without error', () => {
    expect(() => {
      render();
    }).not.toThrow();
  });

  describe('with desktop enabled', () => {
    it('renders ExperimentalTab component without error', () => {
      const { container } = render({ desktopEnabled: true });
      expect(container).toMatchSnapshot();
    });
  });

  it('should render multiple toggle options', () => {
    const { getAllByRole } = render({ desktopEnabled: true });
    const toggle = getAllByRole('checkbox');

    expect(toggle).toHaveLength(3);
  });

  it('should enable add account snap', async () => {
    const setAddSnapAccountEnabled = jest.fn();
    const setPetnamesEnabled = jest.fn();
    const { getByTestId } = render(
      { desktopEnabled: true },
      {
        setAddSnapAccountEnabled,
        petnamesEnabled: true,
        setPetnamesEnabled,
      },
    );

    const toggle = getByTestId('add-account-snap-toggle-button');
    fireEvent.click(toggle);

    await waitFor(() => {
      expect(setAddSnapAccountEnabled).toHaveBeenCalledWith(true);
    });
  });

  it('should disable petnames', async () => {
    const setAddSnapAccountEnabled = jest.fn();
    const setPetnamesEnabled = jest.fn();
    const { getByTestId } = render(
      { desktopEnabled: true },
      {
        setAddSnapAccountEnabled,
        petnamesEnabled: true,
        setPetnamesEnabled,
      },
    );

    const toggle = getByTestId('toggle-petnames');
    fireEvent.click(toggle);

    await waitFor(() => {
      expect(setPetnamesEnabled).toHaveBeenCalledWith(false);
    });
  });
});
