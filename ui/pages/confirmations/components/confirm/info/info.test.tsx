import React from 'react';
import configureMockStore from 'redux-mock-store';

import { unapprovedPersonalMsg } from '../../../../../../test/data/confirmations/personal_sign';
import { renderWithProvider } from '../../../../../../test/lib/render-helpers';
import ConfirmTitle from './info';

describe('Info', () => {
  it('renders info section for personal sign request', () => {
    const mockState = {
      confirm: {
        currentConfirmation: unapprovedPersonalMsg,
      },
    };
    const mockStore = configureMockStore([])(mockState);
    const { getByText } = renderWithProvider(<ConfirmTitle />, mockStore);

    expect(getByText('Request from')).toBeInTheDocument();
    expect(getByText('https://metamask.github.io')).toBeInTheDocument();
  });
});
