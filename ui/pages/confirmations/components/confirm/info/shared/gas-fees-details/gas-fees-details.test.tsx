import { act } from '@testing-library/react';
import React from 'react';
import configureMockStore from 'redux-mock-store';
import thunk from 'redux-thunk';

import { getMockContractInteractionConfirmState } from '../../../../../../../../test/data/confirmations/helper';
import { renderWithConfirmContextProvider } from '../../../../../../../../test/lib/confirmations/render-helpers';
import { getGasFeeTimeEstimate } from '../../../../../../../store/actions';
import { GasFeesDetails } from './gas-fees-details';

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

describe('<GasFeesDetails />', () => {
  const middleware = [thunk];

  it('renders component for gas fees section', async () => {
    (getGasFeeTimeEstimate as jest.Mock).mockImplementation(() =>
      Promise.resolve({ upperTimeBound: '1000' }),
    );

    const state = getMockContractInteractionConfirmState();
    const mockStore = configureMockStore(middleware)(state);
    let container;
    await act(async () => {
      const renderResult = renderWithConfirmContextProvider(
        <GasFeesDetails
          setShowCustomizeGasPopover={() => console.log('open popover')}
        />,
        mockStore,
      );
      container = renderResult.container;

      // Wait for any asynchronous operations to complete
      await new Promise(setImmediate);
    });

    expect(container).toMatchSnapshot();
  });
});
