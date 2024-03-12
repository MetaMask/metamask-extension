import React from 'react';
import configureMockStore from 'redux-mock-store';

import { renderWithProvider } from '../../../../../../../test/lib/render-helpers';
import {
  unapprovedTypedSignMsgV3,
  unapprovedTypedSignMsgV4,
} from '../../../../../../../test/data/confirmations/typed_sign';
import TypedSignInfo from './typed-sign';

describe('TypedSignInfo', () => {
  it('renders origin for typed sign data request', () => {
    const mockState = {
      confirm: {
        currentConfirmation: unapprovedTypedSignMsgV3,
      },
    };
    const mockStore = configureMockStore([])(mockState);
    const { container } = renderWithProvider(<TypedSignInfo />, mockStore);
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
    const { container } = renderWithProvider(<TypedSignInfo />, mockStore);
    expect(container).toMatchSnapshot();
  });

  it('should render message for typed sign v3 request', () => {
    const mockState = {
      confirm: {
        currentConfirmation: unapprovedTypedSignMsgV3,
      },
    };
    const mockStore = configureMockStore([])(mockState);
    const { container } = renderWithProvider(<TypedSignInfo />, mockStore);
    expect(container).toMatchSnapshot();
  });

  it('should render message for typed sign v4 request', () => {
    const mockState = {
      confirm: {
        currentConfirmation: unapprovedTypedSignMsgV4,
      },
    };
    const mockStore = configureMockStore([])(mockState);
    const { container } = renderWithProvider(<TypedSignInfo />, mockStore);
    expect(container).toMatchSnapshot();
  });
});
