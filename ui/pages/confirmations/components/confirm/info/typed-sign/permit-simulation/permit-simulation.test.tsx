import React from 'react';
import configureMockStore from 'redux-mock-store';
import { act } from 'react-dom/test-utils';

import { getMockTypedSignConfirmStateForRequest } from '../../../../../../../../test/data/confirmations/helper';
import { renderWithConfirmContextProvider } from '../../../../../../../../test/lib/confirmations/render-helpers';
import { permitSignatureMsg } from '../../../../../../../../test/data/confirmations/typed_sign';
import PermitSimulation from './permit-simulation';

jest.mock('../../../../../../../store/actions', () => {
  return {
    getTokenStandardAndDetails: jest.fn().mockResolvedValue({ decimals: 2 }),
  };
});

describe('PermitSimulation', () => {
  it('renders component correctly', async () => {
    const state = getMockTypedSignConfirmStateForRequest(permitSignatureMsg);
    const mockStore = configureMockStore([])(state);

    await act(async () => {
      const { container, findByText } = renderWithConfirmContextProvider(
        <PermitSimulation />,
        mockStore,
      );

      expect(await findByText('30')).toBeInTheDocument();
      expect(container).toMatchSnapshot();
    });
  });
});
