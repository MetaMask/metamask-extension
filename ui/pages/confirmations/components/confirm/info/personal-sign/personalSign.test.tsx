import React from 'react';
import configureMockStore from 'redux-mock-store';

import { renderWithProvider } from '../../../../../../../test/lib/render-helpers';
import { unapprovedPersonalMsg } from '../../../../../../../test/data/confirmations/personal_sign';
import PersonalSign from './personalSign';

describe('personalSign', () => {
  it('renders origin for personal sign request', () => {
    const mockState = {
      confirm: {
        currentConfirmation: unapprovedPersonalMsg,
      },
    };
    const mockStore = configureMockStore([])(mockState);
    const { getByText } = renderWithProvider(<PersonalSign />, mockStore);

    expect(getByText('Request from')).toBeInTheDocument();
    expect(getByText('https://metamask.github.io')).toBeInTheDocument();
  });

  it('does not render if required data is not present in the transaction', () => {
    const mockState = {
      confirm: {
        currentConfirmation: {
          id: '0050d5b0-c023-11ee-a0cb-3390a510a0ab',
          status: 'unapproved',
          time: new Date().getTime(),
          type: 'json_request',
        },
      },
    };
    const mockStore = configureMockStore([])(mockState);
    const { queryByText } = renderWithProvider(<PersonalSign />, mockStore);

    expect(queryByText('Request from')).not.toBeInTheDocument();
  });
});
