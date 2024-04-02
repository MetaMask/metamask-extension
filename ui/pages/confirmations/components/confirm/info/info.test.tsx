import React from 'react';
import configureMockStore from 'redux-mock-store';

import mockState from '../../../../../../test/data/mock-state.json';
import { unapprovedPersonalSignMsg } from '../../../../../../test/data/confirmations/personal_sign';
import { unapprovedTypedSignMsgV3 } from '../../../../../../test/data/confirmations/typed_sign';
import { renderWithProvider } from '../../../../../../test/lib/render-helpers';
import Info from './info';

describe('Info', () => {
  it('renders info section for personal sign request', () => {
    const state = {
      ...mockState,
      confirm: {
        currentConfirmation: unapprovedPersonalSignMsg,
      },
    };
    const mockStore = configureMockStore([])(state);
    const { container } = renderWithProvider(<Info />, mockStore);
    expect(container).toMatchSnapshot();
  });

  it('renders info section for typed sign request', () => {
    const state = {
      ...mockState,
      confirm: {
        currentConfirmation: unapprovedTypedSignMsgV3,
      },
    };
    const mockStore = configureMockStore([])(state);
    const { container } = renderWithProvider(<Info />, mockStore);
    expect(container).toMatchSnapshot();
  });
});
