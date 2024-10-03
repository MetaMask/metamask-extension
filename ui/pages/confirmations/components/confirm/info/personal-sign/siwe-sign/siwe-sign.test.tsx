import React from 'react';
import configureMockStore from 'redux-mock-store';

import { getMockPersonalSignConfirmStateForRequest } from '../../../../../../../../test/data/confirmations/helper';
import { renderWithConfirmContextProvider } from '../../../../../../../../test/lib/confirmations/render-helpers';
import {
  SignatureRequestSIWEWithResources,
  signatureRequestSIWE,
} from '../../../../../../../../test/data/confirmations/personal_sign';
import SIWESignInfo from './siwe-sign';

describe('SIWESignInfo', () => {
  it('renders correctly for SIWE signature request', () => {
    const state =
      getMockPersonalSignConfirmStateForRequest(signatureRequestSIWE);
    const mockStore = configureMockStore([])(state);
    const { container } = renderWithConfirmContextProvider(
      <SIWESignInfo />,
      mockStore,
    );
    expect(container).toMatchSnapshot();
  });

  it('renders correctly for SIWE signature request with resources', () => {
    const state = getMockPersonalSignConfirmStateForRequest(
      SignatureRequestSIWEWithResources,
    );
    const mockStore = configureMockStore([])(state);
    const { container } = renderWithConfirmContextProvider(
      <SIWESignInfo />,
      mockStore,
    );
    expect(container).toMatchSnapshot();
  });
});
