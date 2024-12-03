import React from 'react';
import configureMockStore from 'redux-mock-store';
import { act } from 'react-dom/test-utils';
import { waitFor } from '@testing-library/dom';

import { getMockTypedSignConfirmStateForRequest } from '../../../../../../../../test/data/confirmations/helper';
import { renderWithConfirmContextProvider } from '../../../../../../../../test/lib/confirmations/render-helpers';
import { permitSignatureMsg } from '../../../../../../../../test/data/confirmations/typed_sign';
import { memoizedGetTokenStandardAndDetails } from '../../../../../utils/token';
import PermitSimulation from './permit-simulation';

jest.mock('../../../../../../../store/actions', () => {
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

  it('should render default simulation if decoding api does not return result', async () => {
    const state = getMockTypedSignConfirmStateForRequest({
      ...permitSignatureMsg,
      decodingLoading: false,
      decodingData: undefined,
    });
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

  it('should render default simulation if decoding api returns error', async () => {
    const state = getMockTypedSignConfirmStateForRequest({
      ...permitSignatureMsg,
      decodingLoading: false,
      decodingData: {
        stateChanges: null,
        error: {
          message: 'some error',
          type: 'SOME_ERROR',
        },
      },
    });
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

  it('should not render default simulation if decodingLoading is true', async () => {
    const state = getMockTypedSignConfirmStateForRequest({
      ...permitSignatureMsg,
      decodingLoading: true,
    });
    const mockStore = configureMockStore([])(state);

    await act(async () => {
      const { container, queryByTestId } = renderWithConfirmContextProvider(
        <PermitSimulation />,
        mockStore,
      );

      await waitFor(() => {
        expect(queryByTestId('30')).not.toBeInTheDocument();
        expect(container).toMatchSnapshot();
      });
    });
  });
});
