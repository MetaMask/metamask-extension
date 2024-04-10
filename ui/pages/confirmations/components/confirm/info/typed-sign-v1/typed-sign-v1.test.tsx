import React from 'react';
import configureMockStore from 'redux-mock-store';

import mockState from '../../../../../../../test/data/mock-state.json';
import { renderWithProvider } from '../../../../../../../test/lib/render-helpers';
import { unapprovedTypedSignMsgV1 } from '../../../../../../../test/data/confirmations/typed_sign';
import TypedSignInfoV1 from './typed-sign-v1';

describe('TypedSignInfo', () => {
  it('correctly renders typed sign data request', () => {
    const newMockState = {
      ...mockState,
      confirm: {
        currentConfirmation: unapprovedTypedSignMsgV1,
      },
    };
    const mockStore = configureMockStore([])(newMockState);
    const { container } = renderWithProvider(<TypedSignInfoV1 />, mockStore);
    expect(container).toMatchSnapshot();
  });

  it('does not render if required data is not present in the transaction', () => {
    const newMockState = {
      confirm: {
        currentConfirmation: {
          id: '0050d5b0-c023-11ee-a0cb-3390a510a0ab',
          status: 'unapproved',
          time: new Date().getTime(),
          type: 'json_request',
        },
      },
    };
    const mockStore = configureMockStore([])(newMockState);
    const { container } = renderWithProvider(<TypedSignInfoV1 />, mockStore);
    expect(container).toMatchInlineSnapshot(`<div />`);
  });
});
