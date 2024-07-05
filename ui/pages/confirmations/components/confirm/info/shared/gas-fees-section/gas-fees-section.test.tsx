import { act } from '@testing-library/react';
import React from 'react';
import configureMockStore from 'redux-mock-store';
import thunk from 'redux-thunk';
import { genUnapprovedContractInteractionConfirmation } from '../../../../../../../../test/data/confirmations/contract-interaction';
import mockState from '../../../../../../../../test/data/mock-state.json';
import { renderWithProvider } from '../../../../../../../../test/lib/render-helpers';
import { getGasFeeTimeEstimate } from '../../../../../../../store/actions';
import { AdvancedDetailsProvider } from '../../contexts/advanced-details-context';
import { GasFeesSection } from './gas-fees-section';

jest.mock('../../../../../../../store/actions', () => ({
  ...jest.requireActual('../../../../../../../store/actions'),
  getGasFeeTimeEstimate: jest.fn(),
}));

describe('<GasFeesSection />', () => {
  const middleware = [thunk];

  it('does not render component for gas fees section', () => {
    const state = { ...mockState, confirm: { currentConfirmation: null } };
    const mockStore = configureMockStore(middleware)(state);
    const { container } = renderWithProvider(
      <AdvancedDetailsProvider>
        <GasFeesSection />
      </AdvancedDetailsProvider>,
      mockStore,
    );
    expect(container).toMatchSnapshot();
  });

  it('renders component for gas fees section', async () => {
    (getGasFeeTimeEstimate as jest.Mock).mockImplementation(() =>
      Promise.resolve({ upperTimeBound: '1000' }),
    );

    const state = {
      ...mockState,
      confirm: {
        currentConfirmation: genUnapprovedContractInteractionConfirmation(),
      },
    };
    const mockStore = configureMockStore(middleware)(state);
    let container;
    await act(async () => {
      const renderResult = renderWithProvider(
        <AdvancedDetailsProvider>
          <GasFeesSection />
        </AdvancedDetailsProvider>,
        mockStore,
      );
      container = renderResult.container;

      // Wait for any asynchronous operations to complete
      await new Promise(setImmediate);
    });

    expect(container).toMatchSnapshot();
  });
});
