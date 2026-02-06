import React from 'react';
import { fireEvent } from '@testing-library/react';
import configureMockStore from 'redux-mock-store';
import thunk from 'redux-thunk';

import { setBackgroundConnection } from '../../../store/background-connection';
import { renderWithProvider } from '../../../../test/lib/render-helpers-navigate';
import { createSwapsMockStore } from '../../../../test/jest';
import {
  Slippage,
  QUOTES_EXPIRED_ERROR,
  SWAP_FAILED_ERROR,
  ERROR_FETCHING_QUOTES,
  QUOTES_NOT_AVAILABLE_ERROR,
  CONTRACT_DATA_DISABLED_ERROR,
  OFFLINE_FOR_MAINTENANCE,
} from '../../../../shared/constants/swaps';
import { enLocale as messages } from '../../../../test/lib/i18n-helpers';
import AwaitingSwap from '.';

const middleware = [thunk];

const createProps = (customProps = {}) => {
  return {
    swapComplete: false,
    txHash: 'txHash',
    tokensReceived: 'tokens received:',
    submittingSwap: true,
    inputValue: 5,
    maxSlippage: Slippage.default,
    txId: 6571648590592143,
    ...customProps,
  };
};

setBackgroundConnection({
  stopPollingForQuotes: jest.fn(),
});

describe('AwaitingSwap', () => {
  process.env.METAMASK_BUILD_TYPE = 'main';

  it('renders the component with initial props', () => {
    const store = configureMockStore()(createSwapsMockStore());
    const { getByText, getByTestId } = renderWithProvider(
      <AwaitingSwap {...createProps()} />,
      store,
    );
    expect(getByText(messages.swapProcessing.message)).toBeInTheDocument();
    expect(getByText('USDC')).toBeInTheDocument();
    expect(getByText(messages.swapsViewInActivity.message)).toBeInTheDocument();
    expect(
      document.querySelector('.awaiting-swap__main-description'),
    ).toMatchSnapshot();
    expect(getByText(messages.swapsViewInActivity.message)).toBeInTheDocument();
    expect(getByTestId('page-container-footer-next')).toBeInTheDocument();
  });

  it('renders the component with for completed swap', () => {
    const store = configureMockStore()(createSwapsMockStore());
    const { getByText } = renderWithProvider(
      <AwaitingSwap {...createProps({ swapComplete: true })} />,
      store,
    );
    expect(
      getByText(messages.swapTransactionComplete.message),
    ).toBeInTheDocument();
    expect(getByText('tokens received: USDC')).toBeInTheDocument();
    expect(
      getByText(
        messages.viewOnCustomBlockExplorer.message
          .replace('$1', 'Swap')
          .replace('$2', 'etherscan.io'),
      ),
    ).toBeInTheDocument();
    expect(getByText(messages.makeAnotherSwap.message)).toBeInTheDocument();
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
    expect(
      getByText(messages.offlineForMaintenance.message),
    ).toBeInTheDocument();
    expect(
      getByText(messages.metamaskSwapsOfflineDescription.message),
    ).toBeInTheDocument();
    expect(getByText(messages.close.message)).toBeInTheDocument();
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
    expect(
      getByText(messages.swapFailedErrorTitle.message),
    ).toBeInTheDocument();
    fireEvent.click(getByText('support.metamask.io'));
    expect(getByText(messages.tryAgain.message)).toBeInTheDocument();
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
    expect(
      getByText(messages.swapQuotesExpiredErrorTitle.message),
    ).toBeInTheDocument();
    expect(
      getByText(messages.swapQuotesExpiredErrorDescription.message),
    ).toBeInTheDocument();
    expect(getByText(messages.tryAgain.message)).toBeInTheDocument();
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
    expect(
      getByText(messages.swapFetchingQuotesErrorTitle.message),
    ).toBeInTheDocument();
    expect(
      getByText(messages.swapFetchingQuotesErrorDescription.message),
    ).toBeInTheDocument();
    expect(getByText(messages.back.message)).toBeInTheDocument();
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
    expect(
      getByText(messages.swapQuotesNotAvailableErrorTitle.message),
    ).toBeInTheDocument();
    expect(
      getByText(messages.swapQuotesNotAvailableErrorDescription.message),
    ).toBeInTheDocument();
    expect(getByText(messages.tryAgain.message)).toBeInTheDocument();
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
      getByText(messages.swapContractDataDisabledErrorTitle.message),
    ).toBeInTheDocument();
    expect(
      getByText(messages.swapContractDataDisabledErrorDescription.message),
    ).toBeInTheDocument();
    expect(getByText(messages.tryAgain.message)).toBeInTheDocument();
  });
});
