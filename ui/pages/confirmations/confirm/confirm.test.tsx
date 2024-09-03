import React from 'react';
import configureMockStore from 'redux-mock-store';
import thunk from 'redux-thunk';

import { act } from '@testing-library/react';
import {
  orderSignatureMsg,
  permitSignatureMsg,
  permitSingleSignatureMsg,
  permitBatchSignatureMsg,
} from '../../../../test/data/confirmations/typed_sign';
import mockState from '../../../../test/data/mock-state.json';
import {
  getMockPersonalSignConfirmState,
  getMockTypedSignConfirmState,
  getMockTypedSignConfirmStateForRequest,
} from '../../../../test/data/confirmations/helper';
import { renderWithConfirmContextProvider } from '../../../../test/lib/confirmations/render-helpers';
import * as actions from '../../../store/actions';
import { SignatureRequestType } from '../types/confirm';
import Confirm from './confirm';

jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useHistory: () => ({
    replace: jest.fn(),
  }),
}));

const middleware = [thunk];

describe('Confirm', () => {
  afterEach(() => {
    jest.resetAllMocks();
  });

  it('should render', () => {
    const mockStore = configureMockStore(middleware)(mockState);

    act(() => {
      const { container } = renderWithConfirmContextProvider(
        <Confirm />,
        mockStore,
      );
      expect(container).toBeDefined();
    });
  });

  it('should match snapshot for signature - typed sign - permit', async () => {
    const mockStateTypedSign = getMockTypedSignConfirmStateForRequest(
      permitSignatureMsg,
      {
        metamask: { useTransactionSimulations: true },
      },
    );

    jest.spyOn(actions, 'getTokenStandardAndDetails').mockResolvedValue({
      decimals: '2',
      standard: 'erc20',
    });

    const mockStore = configureMockStore(middleware)(mockStateTypedSign);
    let container;

    await act(async () => {
      const { container: renderContainer } = renderWithConfirmContextProvider(
        <Confirm />,
        mockStore,
      );
      container = renderContainer;
    });

    expect(container).toMatchSnapshot();
  });

  it('matches snapshot for signature - personal sign type', async () => {
    const mockStatePersonalSign = getMockPersonalSignConfirmState();
    const mockStore = configureMockStore(middleware)(mockStatePersonalSign);

    await act(async () => {
      const { container } = await renderWithConfirmContextProvider(
        <Confirm />,
        mockStore,
      );
      expect(container).toMatchSnapshot();
    });
  });

  it('should match snapshot signature - typed sign - order', async () => {
    const mockStateTypedSign = getMockTypedSignConfirmStateForRequest(
      orderSignatureMsg as SignatureRequestType,
      {
        metamask: {
          useTransactionSimulations: true,
        },
      },
    );

    jest.spyOn(actions, 'getTokenStandardAndDetails').mockResolvedValue({
      decimals: '2',
      standard: 'erc20',
    });

    const mockStore = configureMockStore(middleware)(mockStateTypedSign);
    let container;

    await act(async () => {
      const { container: renderContainer } = renderWithConfirmContextProvider(
        <Confirm />,
        mockStore,
      );
      container = renderContainer;
    });

    expect(container).toMatchSnapshot();
  });

  it('should match snapshot for signature - typed sign - V4', async () => {
    const mockStateTypedSign = getMockTypedSignConfirmState();
    const mockStore = configureMockStore(middleware)(mockStateTypedSign);

    await act(async () => {
      const { container } = await renderWithConfirmContextProvider(
        <Confirm />,
        mockStore,
      );
      expect(container).toMatchSnapshot();
    });
  });

  it('should match snapshot for signature - typed sign - V4 - PermitSingle', async () => {
    const mockStateTypedSign = getMockTypedSignConfirmStateForRequest(
      permitSingleSignatureMsg,
      {
        metamask: { useTransactionSimulations: true },
      },
    );
    const mockStore = configureMockStore(middleware)(mockStateTypedSign);

    jest.spyOn(actions, 'getTokenStandardAndDetails').mockResolvedValue({
      decimals: '2',
      standard: 'erc20',
    });

    await act(async () => {
      const { container, findByText } = await renderWithConfirmContextProvider(
        <Confirm />,
        mockStore,
      );

      expect(await findByText('1,461,501,637,3...')).toBeInTheDocument();
      expect(container).toMatchSnapshot();
    });
  });

  it('should match snapshot for signature - typed sign - V4 - PermitBatch', async () => {
    const mockStateTypedSign = getMockTypedSignConfirmStateForRequest(
      permitBatchSignatureMsg,
      {
        metamask: { useTransactionSimulations: true },
      },
    );
    const mockStore = configureMockStore(middleware)(mockStateTypedSign);

    jest.spyOn(actions, 'getTokenStandardAndDetails').mockResolvedValue({
      decimals: '2',
      standard: 'erc20',
    });

    await act(async () => {
      const { container, findByText } = await renderWithConfirmContextProvider(
        <Confirm />,
        mockStore,
      );

      expect(await findByText('1,461,501,637,3...')).toBeInTheDocument();
      expect(container).toMatchSnapshot();
    });
  });
});
