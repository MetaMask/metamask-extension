import React from 'react';
import configureMockStore from 'redux-mock-store';

import { unapprovedPersonalSignMsg } from '../../../../../../test/data/confirmations/personal_sign';
import { renderWithProvider } from '../../../../../../test/lib/render-helpers';
import Info from './info';

describe('Info', () => {
  it('renders info section for personal sign request', () => {
    const mockState = {
      confirm: {
        currentConfirmation: unapprovedPersonalSignMsg,
      },
    };
    const mockStore = configureMockStore([])(mockState);
    const { getByText } = renderWithProvider(<Info />, mockStore);

    expect(getByText('Request from')).toBeInTheDocument();
    expect(getByText('https://metamask.github.io')).toBeInTheDocument();
  });
});
