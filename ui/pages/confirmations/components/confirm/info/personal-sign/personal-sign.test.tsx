import React from 'react';
import configureMockStore from 'redux-mock-store';

import { renderWithProvider } from '../../../../../../../test/lib/render-helpers';
import { unapprovedPersonalSignMsg } from '../../../../../../../test/data/confirmations/personal_sign';
import PersonalSignInfo from './personal-sign';

describe('PersonalSignInfo', () => {
  it('renders correctly for personal sign request', () => {
    const mockState = {
      confirm: {
        currentConfirmation: unapprovedPersonalSignMsg,
      },
    };
    const mockStore = configureMockStore([])(mockState);
    const { container } = renderWithProvider(<PersonalSignInfo />, mockStore);
    expect(container).toMatchSnapshot();
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
    const { container } = renderWithProvider(<PersonalSignInfo />, mockStore);
    expect(container).toMatchInlineSnapshot(`<div />`);
  });

  it('handle reverse string properly', () => {
    const mockState = {
      confirm: {
        currentConfirmation: {
          id: '0050d5b0-c023-11ee-a0cb-3390a510a0ab',
          status: 'unapproved',
          time: new Date().getTime(),
          type: 'personal_sign',
          securityProviderResponse: null,
          msgParams: {
            from: '0x8eeee1781fd885ff5ddef7789486676961873d12',
            data: '0x5369676e20696e746f20e280ae204556494c',
            origin: 'https://metamask.github.io',
            siwe: { isSIWEMessage: false, parsedMessage: null },
          },
        },
      },
    };
    const mockStore = configureMockStore([])(mockState);
    const { container } = renderWithProvider(<PersonalSignInfo />, mockStore);
    expect(container).toMatchSnapshot();
  });
});
