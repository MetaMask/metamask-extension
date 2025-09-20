import React from 'react';
import { act } from 'react-dom/test-utils';
import configureMockStore from 'redux-mock-store';

import mockState from '../../../../../../../../../test/data/mock-state.json';
import { renderWithProvider } from '../../../../../../../../../test/lib/render-helpers';
import { MetaMetricsContext } from '../../../../../../../../contexts/metametrics';
import PermitSimulationValueDisplay from './value-display';

jest.mock('../../../../../../../../store/actions', () => {
  return {
    getTokenStandardAndDetails: jest
      .fn()
      .mockResolvedValue({ decimals: 4, standard: 'ERC20' }),
  };
});

const UNLIMITED_THRESHOLD = '1'.padEnd(15 + 4 + 1, '0');

describe('PermitSimulationValueDisplay', () => {
  it('renders component correctly', async () => {
    const mockStore = configureMockStore([])(mockState);

    await act(async () => {
      const { container, findByText } = renderWithProvider(
        <PermitSimulationValueDisplay
          tokenContract="0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48"
          value="4321"
          chainId="0x1"
        />,
        mockStore,
      );

      expect(await findByText('0.432')).toBeInTheDocument();
      expect(container).toMatchSnapshot();
    });
  });

  it('should invoke method to track missing decimal information for ERC20 tokens', async () => {
    const mockStore = configureMockStore([])(mockState);
    const mockTrackEvent = jest.fn();

    await act(async () => {
      renderWithProvider(
        <MetaMetricsContext.Provider value={{ trackEvent: mockTrackEvent }}>
          <PermitSimulationValueDisplay
            tokenContract="0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48"
            value="4321"
            chainId="0x1"
          />
        </MetaMetricsContext.Provider>,
        mockStore,
      );
    });

    expect(mockTrackEvent).toHaveBeenCalledTimes(1);
  });

  it('renders unlimited if value at threshold', async () => {
    const mockStore = configureMockStore([])(mockState);

    const { getByText } = renderWithProvider(
      <MetaMetricsContext.Provider value={{ trackEvent: jest.fn() }}>
        <PermitSimulationValueDisplay
          tokenContract="0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48"
          value={UNLIMITED_THRESHOLD}
          chainId="0x1"
          canDisplayValueAsUnlimited
        />
      </MetaMetricsContext.Provider>,
      mockStore,
    );

    await act(async () => {
      // Intentionally empty
    });

    expect(getByText('Unlimited')).toBeInTheDocument();
  });

  it('renders unlimited if value over threshold', async () => {
    const mockStore = configureMockStore([])(mockState);

    const { getByText } = renderWithProvider(
      <MetaMetricsContext.Provider value={{ trackEvent: jest.fn() }}>
        <PermitSimulationValueDisplay
          tokenContract="0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48"
          value={`${UNLIMITED_THRESHOLD.slice(0, -1)}1`}
          chainId="0x1"
          canDisplayValueAsUnlimited
        />
      </MetaMetricsContext.Provider>,
      mockStore,
    );

    await act(async () => {
      // Intentionally empty
    });

    expect(getByText('Unlimited')).toBeInTheDocument();
  });

  it('renders unlimited if value under threshold', async () => {
    const mockStore = configureMockStore([])(mockState);

    const { queryByText } = renderWithProvider(
      <MetaMetricsContext.Provider value={{ trackEvent: jest.fn() }}>
        <PermitSimulationValueDisplay
          tokenContract="0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48"
          value={UNLIMITED_THRESHOLD.slice(0, -1)}
          chainId="0x1"
          canDisplayValueAsUnlimited
        />
      </MetaMetricsContext.Provider>,
      mockStore,
    );

    await act(async () => {
      // Intentionally empty
    });

    expect(queryByText('Unlimited')).toBeNull();
  });
});
