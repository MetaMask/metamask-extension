import { act } from '@testing-library/react';
import React from 'react';
import configureMockStore from 'redux-mock-store';
import thunk from 'redux-thunk';

import {
  getMockConfirmState,
  getMockContractInteractionConfirmState,
} from '../../../../../../../../test/data/confirmations/helper';
import { renderWithConfirmContextProvider } from '../../../../../../../../test/lib/confirmations/render-helpers';
import { getGasFeeTimeEstimate } from '../../../../../../../store/actions';
import { GasFeesSection } from './gas-fees-section';

jest.mock('../../../../../../../store/actions', () => ({
  ...jest.requireActual('../../../../../../../store/actions'),
  getGasFeeTimeEstimate: jest.fn(),
}));

jest.mock(
  '../../../../../../../components/app/alert-system/contexts/alertMetricsContext',
  () => ({
    useAlertMetrics: jest.fn(() => ({
      trackAlertMetrics: jest.fn(),
    })),
  }),
);

describe('<GasFeesSection />', () => {
  const middleware = [thunk];

  it('does not render component for gas fees section', () => {
    const state = getMockConfirmState();
    const mockStore = configureMockStore(middleware)(state);
    const { container } = renderWithConfirmContextProvider(
      <GasFeesSection />,
      mockStore,
    );
    expect(container).toMatchSnapshot();
  });

  it('renders component for gas fees section', async () => {
    (getGasFeeTimeEstimate as jest.Mock).mockImplementation(() =>
      Promise.resolve({ upperTimeBound: '1000' }),
    );

    const state = getMockContractInteractionConfirmState();
    const mockStore = configureMockStore(middleware)(state);
    let container;
    await act(async () => {
      const renderResult = renderWithConfirmContextProvider(
        <GasFeesSection />,
        mockStore,
      );
      container = renderResult.container;

      // Wait for any asynchronous operations to complete
      await new Promise(setImmediate);
    });

    expect(container).toMatchSnapshot();
  });
});
