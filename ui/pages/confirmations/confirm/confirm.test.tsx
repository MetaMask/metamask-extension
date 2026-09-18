import { screen, waitFor } from '@testing-library/react';
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

jest.mock('../hooks/useAssetDetails', () => ({
  ...jest.requireActual('../hooks/useAssetDetails'),
  useAssetDetails: jest.fn().mockResolvedValue({
    decimals: '4',
  }),
}));

jest.mock('../hooks/gas/useIsGaslessLoading', () => ({
  useIsGaslessLoading: () => {
    return { isGaslessLoading: false };
  },
}));

// Mock async hooks used by useSpenderAlerts to prevent React Act warnings
jest.mock('../components/confirm/info/approve/hooks/use-is-nft', () => ({
  ...jest.requireActual('../components/confirm/info/approve/hooks/use-is-nft'),
  useIsNFT: () => ({ isNFT: false, pending: false }),
}));

jest.mock('../../../hooks/useAsync', () => ({
  ...jest.requireActual('../../../hooks/useAsync'),
  useAsyncResult: () => ({ value: null, pending: false, error: undefined }),
}));

const mockUseNavigate = jest.fn();
jest.mock('react-router-dom', () => {
  const actual = jest.requireActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockUseNavigate,
    useSearchParams: () => [new URLSearchParams(''), jest.fn()],
    useLocation: () => ({
      pathname: '/',
      search: '',
      hash: '',
      state: null,
      key: 'test',
    }),
  };
});

const middleware = [thunk];
const mockedAssetDetails = jest.mocked(useAssetDetails);

async function renderConfirmAndWait(store: unknown) {
  const result = renderWithConfirmContextProvider(<Confirm />, store);
  await waitFor(() => {
    expect(result.container.firstChild).not.toBeNull();
  });
  return result;
}

describe('Confirm', () => {
  afterEach(() => {
    jest.resetAllMocks();

    /** Reset memoized function using getTokenStandardAndDetails for each test */
    memoizedGetTokenStandardAndDetails?.cache?.clear?.();
  });

  beforeEach(() => {
    mockedAssetDetails.mockImplementation(() => ({
      // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31973
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      decimals: '4' as any,
    }));
  });

  it('should render', async () => {
    const mockStore = configureMockStore(middleware)(mockState);

    const { container } = await renderConfirmAndWait(mockStore);
    expect(container).toBeDefined();
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
    jest.spyOn(actions, 'getTokenStandardAndDetailsByChain').mockResolvedValue({
      decimals: '2',
      standard: 'ERC20',
    });

    const mockStore = configureMockStore(middleware)(mockStateTypedSign);
    const { container } = await renderConfirmAndWait(mockStore);

    await screen.findByTestId('confirm-title-text');
    expect(container).toMatchSnapshot();
  });

  it('matches snapshot for signature - personal sign type', async () => {
    const mockStatePersonalSign = getMockPersonalSignConfirmState();
    const mockStore = configureMockStore(middleware)(mockStatePersonalSign);

    const { container } = await renderConfirmAndWait(mockStore);

    await screen.findByTestId('confirm-title-text');
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
    jest.spyOn(actions, 'getTokenStandardAndDetailsByChain').mockResolvedValue({
      decimals: '2',
      standard: 'ERC20',
    });

    const mockStore = configureMockStore(middleware)(mockStateTypedSign);
    const { container } = await renderConfirmAndWait(mockStore);

    await screen.findByTestId('confirm-title-text');
    expect(container).toMatchSnapshot();
  });

  it('should match snapshot for signature - typed sign - V4', async () => {
    const mockStateTypedSign = getMockTypedSignConfirmState();
    const mockStore = configureMockStore(middleware)(mockStateTypedSign);

    const { container } = await renderConfirmAndWait(mockStore);

    await screen.findByTestId('confirm-title-text');
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
    jest.spyOn(actions, 'getTokenStandardAndDetailsByChain').mockResolvedValue({
      decimals: '2',
      standard: 'ERC20',
    });

    const { container } = await renderConfirmAndWait(mockStore);

    await screen.findByTestId('confirm-title-text');
    expect(container).toMatchSnapshot();
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
    jest.spyOn(actions, 'getTokenStandardAndDetailsByChain').mockResolvedValue({
      decimals: '2',
      standard: 'ERC20',
    });

    const { container } = await renderConfirmAndWait(mockStore);

    await screen.findByTestId('confirm-title-text');
    expect(container).toMatchSnapshot();
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

    const { container: transactionContainer } =
      await renderConfirmAndWait(mockStoreTransaction);
    await waitFor(() => {
      expect(transactionContainer.firstChild).not.toBeNull();
    });
    expect(transactionContainer).toMatchSnapshot();

    // Test with a signature type (reuse existing mock)
    const mockStateTypedSign = getMockTypedSignConfirmState();
    const mockStoreSign = configureMockStore(middleware)(mockStateTypedSign);

    const { container: signatureContainer } =
      await renderConfirmAndWait(mockStoreSign);
    await screen.findByTestId('confirm-title-text');
    expect(signatureContainer).toMatchSnapshot();
  });
});
