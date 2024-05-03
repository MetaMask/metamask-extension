import React from 'react';
import configureMockStore from 'redux-mock-store';
import { genUnapprovedContractInteractionConfirmation } from '../../../../../../../test/data/confirmations/contract-interaction';
import mockState from '../../../../../../../test/data/mock-state.json';
import { renderWithProvider } from '../../../../../../../test/lib/render-helpers';
import ContractInteractionInfo from './contract-interaction';

describe('<ContractInteractionInfo />', () => {
  it('renders component for contract interaction request', () => {
    const state = {
      ...mockState,
      confirm: {
        currentConfirmation: genUnapprovedContractInteractionConfirmation(),
      },
    };
    const mockStore = configureMockStore([])(state);
    const { container } = renderWithProvider(
      <ContractInteractionInfo />,
      mockStore,
    );
    expect(container).toMatchSnapshot();
  });

  it('does not render if required data is not present in the transaction', () => {
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
    const mockStore = configureMockStore([])(state);
    const { container } = renderWithProvider(
      <ContractInteractionInfo />,
      mockStore,
    );
    expect(container).toMatchSnapshot();
  });
});
