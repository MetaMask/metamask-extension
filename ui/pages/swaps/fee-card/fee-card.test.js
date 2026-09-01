import React from 'react';
import { fireEvent } from '@testing-library/react';
import { useSelector } from 'react-redux';

import { setBackgroundConnection } from '../../../store/background-connection';
import { renderWithProvider } from '../../../../test/lib/render-helpers-navigate';
import { MOCKS } from '../../../../test/jest';

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
import { enLocale as messages } from '../../../../test/lib/i18n-helpers';

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
    networkAndAccountSupports1559: false,
    ...customProps,
  };
};

describe('FeeCard', () => {
  it('renders the component with initial props', () => {
    useSelector.mockImplementation(generateUseSelectorRouter());
    const props = createProps();
    const { getByText } = renderWithProvider(<FeeCard {...props} />);
    expect(
      getByText(messages.swapNQuotesWithDot.message.replace('$1', '6')),
    ).toBeInTheDocument();
    expect(
      getByText(messages.transactionDetailGasHeading.message),
    ).toBeInTheDocument();
    expect(getByText(messages.maxFee.message)).toBeInTheDocument();
    expect(getByText(props.primaryFee.fee)).toBeInTheDocument();
    expect(getByText(props.secondaryFee.fee)).toBeInTheDocument();
    expect(getByText(`: ${props.secondaryFee.maxFee}`)).toBeInTheDocument();
    expect(
      getByText(messages.swapIncludesMMFee.message.replace('$1', '0.875')),
    ).toBeInTheDocument();
    expect(
      document.querySelector('.fee-card__top-bordered-row'),
    ).toMatchSnapshot();
    expect(document.querySelector('.info-tooltip')).toMatchSnapshot();
    expect(getByText(messages.swapEditLimit.message)).toBeInTheDocument();
  });

  it('renders the component with EIP-1559 enabled', () => {
    const props = createProps({
      networkAndAccountSupports1559: true,
      maxPriorityFeePerGasDecGWEI: '3',
      maxFeePerGasDecGWEI: '4',
    });
    const { getByText } = renderWithProvider(<FeeCard {...props} />);
    expect(
      getByText(messages.swapNQuotesWithDot.message.replace('$1', '6')),
    ).toBeInTheDocument();
    expect(
      getByText(messages.transactionDetailGasHeading.message),
    ).toBeInTheDocument();
    expect(getByText(messages.maxFee.message)).toBeInTheDocument();
    expect(getByText(props.primaryFee.fee)).toBeInTheDocument();
    expect(getByText(props.secondaryFee.fee)).toBeInTheDocument();
    expect(getByText(`: ${props.secondaryFee.maxFee}`)).toBeInTheDocument();
    expect(
      getByText(messages.swapIncludesMMFee.message.replace('$1', '0.875')),
    ).toBeInTheDocument();
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
    expect(
      getByText(messages.swapNQuotesWithDot.message.replace('$1', '6')),
    ).toBeInTheDocument();
    expect(
      getByText(messages.transactionDetailGasHeading.message),
    ).toBeInTheDocument();
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
    expect(queryByText(messages.swapEditLimit.message)).not.toBeInTheDocument();
  });

  it('approves a token', () => {
    const props = createProps({
      onTokenApprovalClick: jest.fn(),
    });
    const { queryByText } = renderWithProvider(<FeeCard {...props} />);
    fireEvent.click(queryByText(messages.swapEditLimit.message));
    expect(props.onTokenApprovalClick).toHaveBeenCalled();
  });
});
