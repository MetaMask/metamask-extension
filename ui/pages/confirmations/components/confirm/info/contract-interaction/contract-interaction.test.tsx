import React from 'react';
import configureMockStore from 'redux-mock-store';
import thunk from 'redux-thunk';
import { genUnapprovedContractInteractionConfirmation } from '../../../../../../../test/data/confirmations/contract-interaction';
import mockState from '../../../../../../../test/data/mock-state.json';
import { renderWithProvider } from '../../../../../../../test/lib/render-helpers';
import ContractInteractionInfo from './contract-interaction';
import { waitFor } from '@testing-library/react';

jest.mock('../../../../../../store/actions', () => ({
  ...jest.requireActual('../../../../../../store/actions'),
  getGasFeeTimeEstimate: jest.fn().mockResolvedValue({
    lowerTimeBound: 0,
    upperTimeBound: 60000,
  }),
}));

describe('<ContractInteractionInfo />', () => {
  const middleware = [thunk];

  it('renders component for contract interaction request', async () => {
    const state = {
      ...mockState,
      confirm: {
        currentConfirmation: genUnapprovedContractInteractionConfirmation(),
      },
    };
    const mockStore = configureMockStore(middleware)(state);

    const { container } = renderWithProvider(
      <ContractInteractionInfo showAdvancedDetails={false} />,
      mockStore,
    );

    await waitFor(() => {
      expect(container).toMatchSnapshot();
    });
  });

  it('does not render if required data is not present in the transaction (with advanced details)', () => {
    const state = {
      ...mockState,
      confirm: {
        currentConfirmation: {
          id: '0050d5b0-c023-11ee-a0cb-3390a510a0ab',
          status: 'unapproved',
          time: new Date().getTime(),
          type: 'json_request',
        },
      },
    };
    const mockStore = configureMockStore(middleware)(state);
    const { container } = renderWithProvider(
      <ContractInteractionInfo showAdvancedDetails />,
      mockStore,
    );
    expect(container).toMatchSnapshot();
  });

  it('does not render if required data is not present in the transaction (no advanced details)', () => {
    const state = {
      ...mockState,
      confirm: {
        currentConfirmation: {
          id: '0050d5b0-c023-11ee-a0cb-3390a510a0ab',
          status: 'unapproved',
          time: new Date().getTime(),
          type: 'json_request',
        },
      },
    };
    const mockStore = configureMockStore(middleware)(state);
    const { container } = renderWithProvider(
      <ContractInteractionInfo showAdvancedDetails={false} />,
      mockStore,
    );
    expect(container).toMatchSnapshot();
  });
});
