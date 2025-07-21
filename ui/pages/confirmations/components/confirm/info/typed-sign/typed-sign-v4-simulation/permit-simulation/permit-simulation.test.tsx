import React from 'react';
import configureMockStore from 'redux-mock-store';
import { act } from 'react-dom/test-utils';

import { getMockTypedSignConfirmStateForRequest } from '../../../../../../../../../test/data/confirmations/helper';
import { renderWithConfirmContextProvider } from '../../../../../../../../../test/lib/confirmations/render-helpers';
import {
  permitNFTSignatureMsg,
  permitSignatureMsg,
} from '../../../../../../../../../test/data/confirmations/typed_sign';
import { memoizedGetTokenStandardAndDetails } from '../../../../../../utils/token';
import PermitSimulation from './permit-simulation';

jest.mock('../../../../../../../../store/actions', () => {
  return {
    getTokenStandardAndDetails: jest
      .fn()
      .mockResolvedValue({ decimals: 2, standard: 'ERC20' }),
  };
});

describe('PermitSimulation', () => {
  afterEach(() => {
    jest.clearAllMocks();

    /** Reset memoized function using getTokenStandardAndDetails for each test */
    memoizedGetTokenStandardAndDetails?.cache?.clear?.();
  });

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

  it('renders correctly for NFT permit', async () => {
    const state = getMockTypedSignConfirmStateForRequest(permitNFTSignatureMsg);
    const mockStore = configureMockStore([])(state);

    await act(async () => {
      const { container, findByText } = renderWithConfirmContextProvider(
        <PermitSimulation />,
        mockStore,
      );

      expect(await findByText('Withdraw')).toBeInTheDocument();
      expect(await findByText('#3606393')).toBeInTheDocument();
      expect(container).toMatchSnapshot();
    });
  });
});
