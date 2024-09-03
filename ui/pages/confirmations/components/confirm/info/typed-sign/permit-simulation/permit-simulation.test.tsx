import React from 'react';
import configureMockStore from 'redux-mock-store';

import mockState from '../../../../../../../../test/data/mock-state.json';
import { renderWithProvider } from '../../../../../../../../test/lib/render-helpers';
import { permitSignatureMsg } from '../../../../../../../../test/data/confirmations/typed_sign';
import PermitSimulation from './permit-simulation';

describe('PermitSimulation', () => {
  it('renders component correctly', () => {
    const state = {
      ...mockState,
      confirm: {
        currentConfirmation: permitSignatureMsg,
      },
    };
    const mockStore = configureMockStore([])(state);
    const { container } = renderWithProvider(
      <PermitSimulation tokenDecimals={2} />,
      mockStore,
    );
    expect(container).toMatchSnapshot();
  });
});
