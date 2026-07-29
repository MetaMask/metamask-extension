import React from 'react';
import { waitFor } from '@testing-library/react';
import configureMockStore from 'redux-mock-store';

import mockState from '../../../../../../../../../test/data/mock-state.json';
import { renderWithProvider } from '../../../../../../../../../test/lib/render-helpers-navigate';
import { enLocale as messages } from '../../../../../../../../../test/lib/i18n-helpers';
import { MetaMetricsEventName } from '../../../../../../../../../shared/constants/metametrics';
import * as actions from '../../../../../../../../store/actions';
import { memoizedGetTokenStandardAndDetailsByChain } from '../../../../../../utils/token';
import PermitSimulationValueDisplay from './value-display';

const mockTrackEvent = jest.fn();

jest.mock('../../../../../../../../hooks/useAnalytics', () => {
  const { createEventBuilder } = jest.requireActual(
    '../../../../../../../../../shared/lib/analytics/create-event-builder',
  );

  return {
    useAnalytics: () => ({
      trackEvent: mockTrackEvent,
      createEventBuilder,
    }),
  };
});

jest.mock('../../../../../../../../store/actions', () => {
  return {
    getTokenStandardAndDetails: jest
      .fn()
      .mockResolvedValue({ decimals: 4, standard: 'ERC20' }),
    getTokenStandardAndDetailsByChain: jest
      .fn()
      .mockResolvedValue({ decimals: 4, standard: 'ERC20' }),
  };
});

const UNLIMITED_THRESHOLD = '1'.padEnd(15 + 4 + 1, '0');

describe('PermitSimulationValueDisplay', () => {
  beforeEach(() => {
    mockTrackEvent.mockClear();
    memoizedGetTokenStandardAndDetailsByChain.cache.clear?.();
  });

  it('renders component correctly', async () => {
    const mockStore = configureMockStore([])(mockState);

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

  it('should invoke method to track missing decimal information for ERC20 tokens', async () => {
    const mockStore = configureMockStore([])(mockState);
    const tokenDetailsWithoutDecimals = { standard: 'ERC20' };
    jest
      .mocked(actions.getTokenStandardAndDetailsByChain)
      .mockResolvedValueOnce(tokenDetailsWithoutDecimals);
    jest
      .mocked(actions.getTokenStandardAndDetails)
      .mockResolvedValueOnce(tokenDetailsWithoutDecimals);

    renderWithProvider(
      <PermitSimulationValueDisplay
        tokenContract="0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48"
        value="4321"
        chainId="0x1"
      />,
      mockStore,
    );

    await waitFor(() => {
      expect(mockTrackEvent).toHaveBeenCalledWith(
        expect.objectContaining({
          name: MetaMetricsEventName.SimulationIncompleteAssetDisplayed,
        }),
      );
    });
  });

  it('renders unlimited if value at threshold', async () => {
    const mockStore = configureMockStore([])(mockState);

    const { findByText } = renderWithProvider(
      <PermitSimulationValueDisplay
        tokenContract="0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48"
        value={UNLIMITED_THRESHOLD}
        chainId="0x1"
        canDisplayValueAsUnlimited
      />,
      mockStore,
    );

    expect(await findByText(messages.unlimited.message)).toBeInTheDocument();
  });

  it('renders unlimited if value over threshold', async () => {
    const mockStore = configureMockStore([])(mockState);

    const { findByText } = renderWithProvider(
      <PermitSimulationValueDisplay
        tokenContract="0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48"
        value={`${UNLIMITED_THRESHOLD.slice(0, -1)}1`}
        chainId="0x1"
        canDisplayValueAsUnlimited
      />,
      mockStore,
    );

    expect(await findByText(messages.unlimited.message)).toBeInTheDocument();
  });

  it('renders unlimited if value under threshold', async () => {
    const mockStore = configureMockStore([])(mockState);

    const { queryByText } = renderWithProvider(
      <PermitSimulationValueDisplay
        tokenContract="0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48"
        value={UNLIMITED_THRESHOLD.slice(0, -1)}
        chainId="0x1"
        canDisplayValueAsUnlimited
      />,
      mockStore,
    );

    await waitFor(() => {
      expect(queryByText(messages.unlimited.message)).toBeNull();
    });
  });
});
