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

  it('renders multiple toggle options', () => {
    const { getAllByRole } = render();
    const toggle = getAllByRole('checkbox');

    expect(toggle).toHaveLength(7);
  });

  it('enables add account snap', async () => {
    const setAddSnapAccountEnabled = jest.fn();
    const setPetnamesEnabled = jest.fn();
    const { getByTestId } = render(
      {},
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

  it('disables petnames', async () => {
    const setAddSnapAccountEnabled = jest.fn();
    const setPetnamesEnabled = jest.fn();
    const { getByTestId } = render(
      {},
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

  it('enables redesigned confirmations', async () => {
    const setRedesignedConfirmationsEnabled = jest.fn();
    const { getByTestId } = render(
      {},
      {
        setRedesignedConfirmationsEnabled,
        redesignedConfirmationsEnabled: false,
      },
    );

    const toggle = getByTestId('toggle-redesigned-confirmations');
    fireEvent.click(toggle);

    await waitFor(() => {
      expect(setRedesignedConfirmationsEnabled).toHaveBeenCalledWith(true);
    });
  });

  it('enables the experimental bitcoin account feature', async () => {
    const setBitcoinSupportEnabled = jest.fn();
    const { getByTestId } = render(
      {},
      {
        setBitcoinSupportEnabled,
        bitcoinSupportEnabled: false,
      },
    );
    const toggle = getByTestId('bitcoin-support-toggle');

    // Should turn the BTC experimental toggle ON
    fireEvent.click(toggle);
    await waitFor(() => {
      expect(setBitcoinSupportEnabled).toHaveBeenNthCalledWith(1, true);
    });
  });

  it('enables the experimental solana account feature', async () => {
    const setSolanaSupportEnabled = jest.fn();
    const { getByTestId } = render(
      {},
      {
        setSolanaSupportEnabled,
        solanaSupportEnabled: false,
      },
    );
    const toggle = getByTestId('solana-support-toggle');

    fireEvent.click(toggle);
    await waitFor(() => {
      expect(setSolanaSupportEnabled).toHaveBeenNthCalledWith(1, true);
    });
  });
});
