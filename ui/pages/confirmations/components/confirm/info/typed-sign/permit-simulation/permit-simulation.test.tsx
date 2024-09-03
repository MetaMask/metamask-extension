import React from 'react';
import configureMockStore from 'redux-mock-store';

import { getMockTypedSignConfirmStateForRequest } from '../../../../../../../../test/data/confirmations/helper';
import { renderWithConfirmContextProvider } from '../../../../../../../../test/lib/confirmations/render-helpers';
import { permitSignatureMsg } from '../../../../../../../../test/data/confirmations/typed_sign';
import PermitSimulation from './permit-simulation';

describe('PermitSimulation', () => {
  it('renders component correctly', () => {
    const state = getMockTypedSignConfirmStateForRequest(permitSignatureMsg);
    const mockStore = configureMockStore([])(state);
    const { container } = renderWithConfirmContextProvider(
      <PermitSimulation tokenDecimals={2} />,
      mockStore,
    );
    expect(container).toMatchSnapshot();
  });
});
