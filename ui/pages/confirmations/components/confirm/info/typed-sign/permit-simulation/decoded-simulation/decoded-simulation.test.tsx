import React from 'react';
import configureMockStore from 'redux-mock-store';

import { getMockTypedSignConfirmStateForRequest } from '../../../../../../../../../test/data/confirmations/helper';
import { renderWithConfirmContextProvider } from '../../../../../../../../../test/lib/confirmations/render-helpers';
import { permitSignatureMsg } from '../../../../../../../../../test/data/confirmations/typed_sign';
import PermitSimulation from './decoded-simulation';

describe('DecodedSimulation', () => {
  it('renders component correctly', async () => {
    const state = getMockTypedSignConfirmStateForRequest(permitSignatureMsg);
    const mockStore = configureMockStore([])(state);

    const { container } = renderWithConfirmContextProvider(
      <PermitSimulation />,
      mockStore,
    );

    expect(container).toMatchSnapshot();
  });
});
