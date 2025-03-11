import { act } from '@testing-library/react';
import React from 'react';
import configureMockStore from 'redux-mock-store';
import thunk from 'redux-thunk';
import {
  getMockPersonalSignConfirmState,
  getMockTypedSignConfirmState,
  getMockTypedSignConfirmStateForRequest,
} from '../../../../test/data/confirmations/helper';
import {
  orderSignatureMsg,
  permitBatchSignatureMsg,
  permitSignatureMsg,
  permitSingleSignatureMsg,
} from '../../../../test/data/confirmations/typed_sign';
import mockState from '../../../../test/data/mock-state.json';
import { renderWithConfirmContextProvider } from '../../../../test/lib/confirmations/render-helpers';
import * as actions from '../../../store/actions';
import { useAssetDetails } from '../hooks/useAssetDetails';
import { SignatureRequestType } from '../types/confirm';
import { memoizedGetTokenStandardAndDetails } from '../utils/token';
import Confirm from './confirm';

jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useHistory: () => ({
    replace: jest.fn(),
  }),
}));

jest.mock('../hooks/useAssetDetails', () => ({
  ...jest.requireActual('../hooks/useAssetDetails'),
  useAssetDetails: jest.fn().mockResolvedValue({
    decimals: '4',
  }),
}));

const middleware = [thunk];
const mockedAssetDetails = jest.mocked(useAssetDetails);

describe('Confirm', () => {
  afterEach(() => {
    jest.resetAllMocks();

    /** Reset memoized function using getTokenStandardAndDetails for each test */
    memoizedGetTokenStandardAndDetails?.cache?.clear?.();
  });

  beforeEach(() => {
    mockedAssetDetails.mockImplementation(() => ({
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      decimals: '4' as any,
    }));
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
      standard: 'ERC20',
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

    let container;
    await act(async () => {
      const { container: renderContainer } =
        await renderWithConfirmContextProvider(<Confirm />, mockStore);

      container = renderContainer;
    });

    expect(container).toMatchSnapshot();
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
      standard: 'ERC20',
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

    let container;
    await act(async () => {
      const { container: renderContainer } =
        await renderWithConfirmContextProvider(<Confirm />, mockStore);

      container = renderContainer;
    });

    expect(container).toMatchSnapshot();
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
      standard: 'ERC20',
    });

    await act(async () => {
      const { container } = await renderWithConfirmContextProvider(
        <Confirm />,
        mockStore,
      );

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
      standard: 'ERC20',
    });

    await act(async () => {
      const { container } = await renderWithConfirmContextProvider(
        <Confirm />,
        mockStore,
      );

      expect(container).toMatchSnapshot();
    });
  });

  it('should render SmartTransactionsBannerAlert for transaction types but not signature types', async () => {
    // Test with a transaction type
    const mockStateTransaction = {
      ...mockState,
      metamask: {
        ...mockState.metamask,
        alertEnabledness: {
          smartTransactionsMigration: true,
        },
        preferences: {
          smartTransactionsOptInStatus: true,
          smartTransactionsMigrationApplied: true,
        },
      },
    };

    const mockStoreTransaction =
      configureMockStore(middleware)(mockStateTransaction);

    await act(async () => {
      const { container } = renderWithConfirmContextProvider(
        <Confirm />,
        mockStoreTransaction,
      );
      expect(container).toMatchSnapshot();
    });

    // Test with a signature type (reuse existing mock)
    const mockStateTypedSign = getMockTypedSignConfirmState();
    const mockStoreSign = configureMockStore(middleware)(mockStateTypedSign);

    await act(async () => {
      const { container } = renderWithConfirmContextProvider(
        <Confirm />,
        mockStoreSign,
      );
      expect(container).toMatchSnapshot();
    });
  });
});
