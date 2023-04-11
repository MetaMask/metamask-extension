import React from 'react';
import configureMockStore from 'redux-mock-store';
import { act, fireEvent } from '@testing-library/react';
import { renderWithProvider } from '../../../test/lib/render-helpers';
import { KeyringType } from '../../../shared/constants/keyring';
import TokenAllowance from './token-allowance';

const testTokenAddress = '0xC011a73ee8576Fb46F5E1c5751cA3B9Fe0af2a6F';
const state = {
  appState: {
    customTokenAmount: '1',
  },
  metamask: {
    accounts: {
      '0x0dcd5d886577d5081b0c52e242ef29e70be3e7bc': {
        address: '0x0dcd5d886577d5081b0c52e242ef29e70be3e7bc',
        balance: '0x0',
      },
    },
    gasEstimateType: 'none',
    selectedAddress: '0x0dcd5d886577d5081b0c52e242ef29e70be3e7bc',
    identities: {
      '0x0dcd5d886577d5081b0c52e242ef29e70be3e7bc': {
        address: '0x0dcd5d886577d5081b0c52e242ef29e70be3e7bc',
        name: 'Account 1',
      },
    },
    cachedBalances: {},
    addressBook: [
      {
        address: '0xc42edfcc21ed14dda456aa0756c153f7985d8813',
        chainId: '0x5',
        isEns: false,
        memo: '',
        name: 'Address Book Account 1',
      },
    ],
    provider: {
      type: 'mainnet',
      nickname: '',
    },
    networkDetails: {
      EIPS: {
        1559: true,
      },
    },
    preferences: {
      showFiatInTestnets: true,
    },
    knownMethodData: {},
    tokens: [
      {
        address: testTokenAddress,
        symbol: 'SNX',
        decimals: 18,
        image: 'testImage',
        isERC721: false,
      },
      {
        address: '0xaD6D458402F60fD3Bd25163575031ACDce07538U',
        symbol: 'DAU',
        decimals: 18,
        image: null,
        isERC721: false,
      },
    ],
    unapprovedTxs: {},
    keyringTypes: [KeyringType.ledger],
    keyrings: [
      {
        type: KeyringType.ledger,
        accounts: ['0x0dcd5d886577d5081b0c52e242ef29e70be3e7bc'],
      },
    ],
  },
  history: {
    mostRecentOverviewPage: '/',
  },
  confirmTransaction: {
    txData: {},
  },
};

jest.mock('../../store/actions', () => ({
  disconnectGasFeeEstimatePoller: jest.fn(),
  getGasFeeTimeEstimate: jest.fn().mockImplementation(() => Promise.resolve()),
  getGasFeeEstimatesAndStartPolling: jest
    .fn()
    .mockImplementation(() => Promise.resolve()),
  addPollingTokenToAppState: jest.fn(),
  removePollingTokenFromAppState: jest.fn(),
  updateTransactionGasFees: () => ({ type: 'UPDATE_TRANSACTION_PARAMS' }),
  updatePreviousGasParams: () => ({ type: 'UPDATE_TRANSACTION_PARAMS' }),
  createTransactionEventFragment: jest.fn(),
  updateCustomNonce: () => ({ type: 'UPDATE_TRANSACTION_PARAMS' }),
  estimateGas: jest.fn().mockImplementation(() => Promise.resolve()),
}));

jest.mock('../../contexts/gasFee', () => ({
  useGasFeeContext: () => ({
    maxPriorityFeePerGas: '0.1',
    maxFeePerGas: '0.1',
    updateTransaction: jest.fn(),
  }),
}));

jest.mock('react-router-dom', () => {
  const original = jest.requireActual('react-router-dom');
  return {
    ...original,
    useHistory: () => ({
      push: jest.fn(),
    }),
    useParams: () => ({
      address: testTokenAddress,
    }),
  };
});

describe('TokenAllowancePage', () => {
  const props = {
    origin: 'https://metamask.github.io',
    siteImage: 'https://metamask.github.io/test-dapp/metamask-fox.svg',
    useNonceField: false,
    currentCurrency: 'usd',
    nativeCurrency: 'GoerliETH',
    ethTransactionTotal: '0.0012',
    fiatTransactionTotal: '1.6',
    hexTransactionTotal: '0x44364c5bb0000',
    isMultiLayerFeeNetwork: false,
    supportsEIP1559: true,
    userAddress: '0xdd34b35ca1de17dfcdc07f79ff1f8f94868c40a1',
    tokenAddress: '0x55797717b9947b31306f4aac7ad1365c6e3923bd',
    data: '0x095ea7b30000000000000000000000009bc5baf874d2da8d216ae9f137804184ee5afef40000000000000000000000000000000000000000000000000000000000011170',
    isSetApproveForAll: false,
    setApproveForAllArg: false,
    decimals: '4',
    dappProposedTokenAmount: '7',
    currentTokenBalance: '10',
    toAddress: '0x9bc5baf874d2da8d216ae9f137804184ee5afef4',
    tokenSymbol: 'TST',
    txData: {
      id: 3049568294499567,
      time: 1664449552289,
      status: 'unapproved',
      metamaskNetworkId: '3',
      originalGasEstimate: '0xea60',
      userEditedGasLimit: false,
      chainId: '0x3',
      loadingDefaults: false,
      dappSuggestedGasFees: {
        gasPrice: '0x4a817c800',
        gas: '0xea60',
      },
      sendFlowHistory: [],
      txParams: {
        from: '0xdd34b35ca1de17dfcdc07f79ff1f8f94868c40a1',
        to: '0x55797717b9947b31306f4aac7ad1365c6e3923bd',
        value: '0x0',
        data: '0x095ea7b30000000000000000000000009bc5baf874d2da8d216ae9f137804184ee5afef40000000000000000000000000000000000000000000000000000000000011170',
        gas: '0xea60',
        gasPrice: '0x4a817c800',
        maxFeePerGas: '0x4a817c800',
      },
      origin: 'https://metamask.github.io',
      type: 'approve',
      userFeeLevel: 'custom',
      defaultGasEstimates: {
        estimateType: 'custom',
        gas: '0xea60',
        maxFeePerGas: '0x4a817c800',
        maxPriorityFeePerGas: '0x4a817c800',
        gasPrice: '0x4a817c800',
      },
    },
  };

  let store;
  beforeEach(() => {
    store = configureMockStore()(state);
  });

  it('should render title "Set a spending cap for your" in token allowance page', () => {
    const { getByText } = renderWithProvider(
      <TokenAllowance {...props} />,
      store,
    );
    expect(getByText('Set a spending cap for your')).toBeInTheDocument();
  });

  it('should render reject button', () => {
    const { getByTestId } = renderWithProvider(
      <TokenAllowance {...props} />,
      store,
    );
    const onCloseBtn = getByTestId('page-container-footer-cancel');
    expect(onCloseBtn).toBeInTheDocument();
  });

  it('should click View details and show function type', () => {
    const { getByText } = renderWithProvider(
      <TokenAllowance {...props} />,
      store,
    );

    const viewDetailsButton = getByText('View details');
    fireEvent.click(viewDetailsButton);
    expect(getByText('Function: Approve')).toBeInTheDocument();
  });

  it('should click Use default and set input value to default', () => {
    const { getByText, getByTestId } = renderWithProvider(
      <TokenAllowance {...props} />,
      store,
    );

    act(() => {
      const useDefault = getByText('Use default');
      fireEvent.click(useDefault);
    });

    const input = getByTestId('custom-spending-cap-input');
    expect(input.value).toBe('1');
  });

  it('should call back button when button is clicked and return to previous page', () => {
    const { getByText, getByTestId } = renderWithProvider(
      <TokenAllowance {...props} />,
      store,
    );

    const textField = getByTestId('custom-spending-cap-input');
    fireEvent.change(textField, { target: { value: '1' } });

    const nextButton = getByText('Next');
    fireEvent.click(nextButton);

    const backButton = getByText('< Back');
    fireEvent.click(backButton);

    expect(getByText('Set a spending cap for your')).toBeInTheDocument();
  });

  it('should click Verify third-party details and show popup Third-party details, then close popup', () => {
    const { getByText } = renderWithProvider(
      <TokenAllowance {...props} />,
      store,
    );

    const verifyThirdPartyDetails = getByText('Verify third-party details');
    fireEvent.click(verifyThirdPartyDetails);

    expect(getByText('Third-party details')).toBeInTheDocument();

    const gotIt = getByText('Got it');
    fireEvent.click(gotIt);
    expect(gotIt).not.toBeInTheDocument();
  });

  it('should show hardware wallet info text', () => {
    const { queryByText, getByText, getByTestId } = renderWithProvider(
      <TokenAllowance {...props} />,
      store,
    );

    const textField = getByTestId('custom-spending-cap-input');
    fireEvent.change(textField, { target: { value: '1' } });

    expect(queryByText('Prior to clicking confirm:')).toBeNull();

    const nextButton = getByText('Next');
    fireEvent.click(nextButton);

    expect(queryByText('Prior to clicking confirm:')).toBeInTheDocument();
  });

  it('should not show hardware wallet info text', () => {
    const { queryByText } = renderWithProvider(
      <TokenAllowance {...props} />,
      store,
    );

    expect(queryByText('Prior to clicking confirm:')).toBeNull();
  });
});
