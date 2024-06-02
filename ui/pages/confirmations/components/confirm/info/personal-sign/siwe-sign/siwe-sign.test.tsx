import React from 'react';
import configureMockStore from 'redux-mock-store';

import mockState from '../../../../../../../../test/data/mock-state.json';
import { renderWithProvider } from '../../../../../../../../test/lib/render-helpers';
import { signatureRequestSIWE } from '../../../../../../../../test/data/confirmations/personal_sign';
import SIWESignInfo from './siwe-sign';

describe('SIWESignInfo', () => {
  it('renders correctly for personal sign request', () => {
    const state = {
      ...mockState,
      confirm: {
        currentConfirmation: signatureRequestSIWE,
      },
    };
    const mockStore = configureMockStore([])(state);
    const { container } = renderWithProvider(<SIWESignInfo />, mockStore);
    expect(container).toMatchSnapshot();
  });
});
