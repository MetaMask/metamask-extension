import React from 'react';
import configureMockStore from 'redux-mock-store';

import { act } from 'react-dom/test-utils';
import { permitSignatureMsg } from '../../../../../../../../test/data/confirmations/typed_sign';

import mockState from '../../../../../../../../test/data/mock-state.json';
import { renderWithProvider } from '../../../../../../../../test/lib/render-helpers';
import PermitSimulation from './permit-simulation';

jest.mock('../../../../../../../store/actions', () => {
  return {
    getTokenStandardAndDetails: jest.fn().mockResolvedValue({ decimals: 2 }),
  };
});

describe('PermitSimulation', () => {
  it('renders component correctly', async () => {
    const state = {
      ...mockState,
      confirm: {
        currentConfirmation: permitSignatureMsg,
      },
    };
    const mockStore = configureMockStore([])(state);

    await act(async () => {
      const { container, findByText } = renderWithProvider(
        <PermitSimulation />,
        mockStore,
      );

      expect(await findByText('30')).toBeInTheDocument();
      expect(container).toMatchSnapshot();
    });
  });
});
