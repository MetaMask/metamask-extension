import React from 'react';
import { useSelector } from 'react-redux';

import { setBackgroundConnection } from '../../../store/background-connection';
import { renderWithProvider, MOCKS, fireEvent } from '../../../../test/jest';
import { CHAIN_IDS } from '../../../../shared/constants/network';

import {
  checkNetworkAndAccountSupports1559,
  getUseCurrencyRateCheck,
} from '../../../selectors';
import {
  getGasEstimateType,
  getGasFeeEstimates,
  getIsGasEstimatesLoading,
} from '../../../ducks/metamask/metamask';
import { TRANSACTION_ENVELOPE_TYPE_NAMES } from '../../../helpers/constants/transactions';

import FeeCard from '.';

jest.mock('../../../hooks/useGasFeeEstimates', () => ({
  useGasFeeEstimates: jest.fn(),
}));

jest.mock('react-redux', () => {
  const actual = jest.requireActual('react-redux');

  return {
    ...actual,
    useSelector: jest.fn(),
  };
});

const generateUseSelectorRouter = () => (selector) => {
  if (selector === checkNetworkAndAccountSupports1559) {
    return true;
  }
  if (selector === getGasEstimateType) {
    return TRANSACTION_ENVELOPE_TYPE_NAMES.FEE_MARKET;
  }
  if (selector === getGasFeeEstimates) {
    return MOCKS.createGasFeeEstimatesForFeeMarket();
  }
  if (selector === getIsGasEstimatesLoading) {
    return false;
  }
  if (selector === getUseCurrencyRateCheck) {
    return true;
  }
  return undefined;
};

setBackgroundConnection({
  getGasFeeTimeEstimate: jest.fn(),
  getGasFeeEstimatesAndStartPolling: jest.fn(),
  createTransactionEventFragment: jest.fn(),
});

const createProps = (customProps = {}) => {
  return {
    primaryFee: {
      fee: '0.0441 ETH',
      maxFee: '0.04851 ETH',
    },
    secondaryFee: {
      fee: '$101.98',
      maxFee: '$112.17',
    },
    hideTokenApprovalRow: false,
    onFeeCardMaxRowClick: jest.fn(),
    tokenApprovalTextComponent: (
      <span key="fee-card-approve-symbol" className="fee-card__bold">
        ABC
      </span>
    ),
    tokenApprovalSourceTokenSymbol: 'ABC',
    onTokenApprovalClick: jest.fn(),
    metaMaskFee: '0.875',
    isBestQuote: true,
    numberOfQuotes: 6,
    onQuotesClick: jest.fn(),
    tokenConversionRate: 0.015,
    chainId: CHAIN_IDS.MAINNET,
    networkAndAccountSupports1559: false,
    ...customProps,
  };
};

describe('FeeCard', () => {
  it('renders the component with initial props', () => {
    useSelector.mockImplementation(generateUseSelectorRouter());
    const props = createProps();
    const { getByText } = renderWithProvider(<FeeCard {...props} />);
    expect(getByText('6 quotes.')).toBeInTheDocument();
    expect(getByText('Estimated gas fee')).toBeInTheDocument();
    expect(getByText('Max fee')).toBeInTheDocument();
    expect(getByText(props.primaryFee.fee)).toBeInTheDocument();
    expect(getByText(props.secondaryFee.fee)).toBeInTheDocument();
    expect(getByText(`: ${props.secondaryFee.maxFee}`)).toBeInTheDocument();
    expect(getByText('Includes a 0.875% MetaMask fee.')).toBeInTheDocument();
    expect(
      document.querySelector('.fee-card__top-bordered-row'),
    ).toMatchSnapshot();
    expect(document.querySelector('.info-tooltip')).toMatchSnapshot();
    expect(getByText('Edit limit')).toBeInTheDocument();
  });

  it('renders the component with EIP-1559 enabled', () => {
    const props = createProps({
      networkAndAccountSupports1559: true,
      maxPriorityFeePerGasDecGWEI: '3',
      maxFeePerGasDecGWEI: '4',
    });
    const { getByText } = renderWithProvider(<FeeCard {...props} />);
    expect(getByText('6 quotes.')).toBeInTheDocument();
    expect(getByText('Estimated gas fee')).toBeInTheDocument();
    expect(getByText('Max fee')).toBeInTheDocument();
    expect(getByText(props.primaryFee.fee)).toBeInTheDocument();
    expect(getByText(props.secondaryFee.fee)).toBeInTheDocument();
    expect(getByText(`: ${props.secondaryFee.maxFee}`)).toBeInTheDocument();
    expect(getByText('Includes a 0.875% MetaMask fee.')).toBeInTheDocument();
    expect(
      document.querySelector('.fee-card__top-bordered-row'),
    ).toMatchSnapshot();
  });

  it('renders the component with smart transactions enabled and user opted in', () => {
    const props = createProps({
      smartTransactionsOptInStatus: true,
      smartTransactionsEnabled: true,
      maxPriorityFeePerGasDecGWEI: '3',
      maxFeePerGasDecGWEI: '4',
    });
    const { getByText, queryByTestId } = renderWithProvider(
      <FeeCard {...props} />,
    );
    expect(getByText('6 quotes.')).toBeInTheDocument();
    expect(getByText('Estimated gas fee')).toBeInTheDocument();
    expect(getByText(props.primaryFee.fee)).toBeInTheDocument();
    expect(getByText(props.secondaryFee.fee)).toBeInTheDocument();
    expect(getByText(`: ${props.secondaryFee.maxFee}`)).toBeInTheDocument();
    expect(queryByTestId('fee-card__edit-link')).not.toBeInTheDocument();
  });

  it('renders the component with hidden token approval row', () => {
    const props = createProps({
      hideTokenApprovalRow: true,
    });
    const { queryByText } = renderWithProvider(<FeeCard {...props} />);
    expect(queryByText('Edit limit')).not.toBeInTheDocument();
  });

  it('approves a token', () => {
    const props = createProps({
      onTokenApprovalClick: jest.fn(),
    });
    const { queryByText } = renderWithProvider(<FeeCard {...props} />);
    fireEvent.click(queryByText('Edit limit'));
    expect(props.onTokenApprovalClick).toHaveBeenCalled();
  });
});
