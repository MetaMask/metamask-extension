import React from 'react';
import configureMockStore from 'redux-mock-store';
import thunk from 'redux-thunk';

import {
  renderWithProvider,
  createSwapsMockStore,
  setBackgroundConnection,
  fireEvent,
} from '../../../../test/jest';
import {
  SLIPPAGE,
  QUOTES_EXPIRED_ERROR,
  SWAP_FAILED_ERROR,
  ERROR_FETCHING_QUOTES,
  QUOTES_NOT_AVAILABLE_ERROR,
  CONTRACT_DATA_DISABLED_ERROR,
  OFFLINE_FOR_MAINTENANCE,
} from '../../../../shared/constants/swaps';
import AwaitingSwap from '.';

const middleware = [thunk];

const createProps = (customProps = {}) => {
  return {
    swapComplete: false,
    txHash: 'txHash',
    tokensReceived: 'tokens received:',
    submittingSwap: true,
    inputValue: 5,
    maxSlippage: SLIPPAGE.DEFAULT,
    ...customProps,
  };
};

setBackgroundConnection({
  stopPollingForQuotes: jest.fn(),
});

describe('AwaitingSwap', () => {
  it('renders the component with initial props', () => {
    const store = configureMockStore()(createSwapsMockStore());
    const { getByText, getByTestId } = renderWithProvider(
      <AwaitingSwap {...createProps()} />,
      store,
    );
    expect(getByText('Processing')).toBeInTheDocument();
    expect(getByText('USDC')).toBeInTheDocument();
    expect(getByText('View in activity')).toBeInTheDocument();
    expect(
      document.querySelector('.awaiting-swap__main-description'),
    ).toMatchSnapshot();
    expect(getByText('View in activity')).toBeInTheDocument();
    expect(getByTestId('page-container-footer-next')).toBeInTheDocument();
  });

  it('renders the component with for completed swap', () => {
    const store = configureMockStore()(createSwapsMockStore());
    const { getByText } = renderWithProvider(
      <AwaitingSwap {...createProps({ swapComplete: true })} />,
      store,
    );
    expect(getByText('Transaction complete')).toBeInTheDocument();
    expect(getByText('tokens received: USDC')).toBeInTheDocument();
    expect(getByText('View Swap at etherscan.io')).toBeInTheDocument();
    expect(getByText('Create a new swap')).toBeInTheDocument();
  });

  it('renders the component with the "OFFLINE_FOR_MAINTENANCE" error', () => {
    const store = configureMockStore(middleware)(createSwapsMockStore());
    const props = createProps({
      errorKey: OFFLINE_FOR_MAINTENANCE,
    });
    const { getByText } = renderWithProvider(
      <AwaitingSwap {...props} />,
      store,
    );
    expect(getByText('Offline for maintenance')).toBeInTheDocument();
    expect(
      getByText(
        'MetaMask Swaps is undergoing maintenance. Please check back later.',
      ),
    ).toBeInTheDocument();
    expect(getByText('Close')).toBeInTheDocument();
  });

  it('renders the component with the "SWAP_FAILED_ERROR" error', () => {
    const store = configureMockStore(middleware)(createSwapsMockStore());
    const props = createProps({
      errorKey: SWAP_FAILED_ERROR,
    });
    const { getByText } = renderWithProvider(
      <AwaitingSwap {...props} />,
      store,
    );
    expect(getByText('Swap failed')).toBeInTheDocument();
    fireEvent.click(getByText('metamask-flask.zendesk.com'));
    expect(getByText('Try again')).toBeInTheDocument();
  });

  it('renders the component with the "QUOTES_EXPIRED_ERROR" error', () => {
    const store = configureMockStore(middleware)(createSwapsMockStore());
    const props = createProps({
      errorKey: QUOTES_EXPIRED_ERROR,
    });
    const { getByText } = renderWithProvider(
      <AwaitingSwap {...props} />,
      store,
    );
    expect(getByText('Quotes timeout')).toBeInTheDocument();
    expect(
      getByText('Please request new quotes to get the latest rates.'),
    ).toBeInTheDocument();
    expect(getByText('Try again')).toBeInTheDocument();
  });

  it('renders the component with the "ERROR_FETCHING_QUOTES" error', () => {
    const store = configureMockStore(middleware)(createSwapsMockStore());
    const props = createProps({
      errorKey: ERROR_FETCHING_QUOTES,
    });
    const { getByText } = renderWithProvider(
      <AwaitingSwap {...props} />,
      store,
    );
    expect(getByText('Error fetching quotes')).toBeInTheDocument();
    expect(
      getByText(
        'Hmmm... something went wrong. Try again, or if errors persist, contact customer support.',
      ),
    ).toBeInTheDocument();
    expect(getByText('Back')).toBeInTheDocument();
  });

  it('renders the component with the "QUOTES_NOT_AVAILABLE_ERROR" error', () => {
    const store = configureMockStore(middleware)(createSwapsMockStore());
    const props = createProps({
      errorKey: QUOTES_NOT_AVAILABLE_ERROR,
    });
    const { getByText } = renderWithProvider(
      <AwaitingSwap {...props} />,
      store,
    );
    expect(getByText('No quotes available')).toBeInTheDocument();
    expect(
      getByText('Try adjusting the amount or slippage settings and try again.'),
    ).toBeInTheDocument();
    expect(getByText('Try again')).toBeInTheDocument();
  });

  it('renders the component with the "CONTRACT_DATA_DISABLED_ERROR" error', () => {
    const store = configureMockStore(middleware)(createSwapsMockStore());
    const props = createProps({
      errorKey: CONTRACT_DATA_DISABLED_ERROR,
    });
    const { getByText } = renderWithProvider(
      <AwaitingSwap {...props} />,
      store,
    );
    expect(
      getByText('Contract data is not enabled on your Ledger'),
    ).toBeInTheDocument();
    expect(
      getByText(
        'In the Ethereum app on your Ledger, go to "Settings" and allow contract data. Then, try your swap again.',
      ),
    ).toBeInTheDocument();
    expect(getByText('Try again')).toBeInTheDocument();
  });
});
