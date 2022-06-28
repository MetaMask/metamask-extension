import React from 'react';

import { renderWithProvider } from '../../../../test/jest';
import GasCustomizationModalComponent from './swaps-gas-customization-modal.component';

const createProps = (customProps = {}) => {
  return {
    insufficientBalance: false,
    onSubmit: jest.fn(),
    cancelAndClose: jest.fn(),
    minimumGasLimit: 100,
    gasPriceButtonGroupProps: {
      buttonDataLoading: false,
      className: 'gas-price-button-group',
      gasButtonInfo: [
        {
          feeInPrimaryCurrency: '$0.52',
          feeInSecondaryCurrency: '0.0048 ETH',
          timeEstimate: '~ 1 min 0 sec',
          priceInHexWei: '0xa1b2c3f',
          gasEstimateType: 'FAST',
        },
        {
          feeInPrimaryCurrency: '$0.39',
          feeInSecondaryCurrency: '0.004 ETH',
          timeEstimate: '~ 1 min 30 sec',
          priceInHexWei: '0xa1b2c39',
          gasEstimateType: 'FAST',
        },
        {
          feeInPrimaryCurrency: '$0.30',
          feeInSecondaryCurrency: '0.00354 ETH',
          timeEstimate: '~ 2 min 1 sec',
          priceInHexWei: '0xa1b2c30',
          gasEstimateType: 'FAST',
        },
      ],
      handleGasPriceSelection: 'mockSelectionFunction',
      noButtonActiveByDefault: true,
      showCheck: true,
      newTotalFiat: 'mockNewTotalFiat',
      newTotalEth: 'mockNewTotalEth',
    },
    infoRowProps: {
      originalTotalFiat: 'mockOriginalTotalFiat',
      originalTotalEth: 'mockOriginalTotalEth',
      newTotalFiat: 'mockNewTotalFiat',
      newTotalEth: 'mockNewTotalEth',
      sendAmount: 'mockSendAmount',
      transactionFee: 'mockTransactionFee',
      extraInfoRow: { label: 'mockLabel', value: 'mockValue' },
    },
    ...customProps,
  };
};

describe('GasCustomizationModalComponent', () => {
  it('renders the component with initial props', () => {
    const props = createProps();
    const { getByText, getByTestId } = renderWithProvider(
      <GasCustomizationModalComponent {...props} />,
    );
    expect(getByTestId('page-container__header')).toMatchSnapshot();
    expect(getByText('$0.52')).toBeInTheDocument();
    expect(getByText('0.0048 ETH')).toBeInTheDocument();
    expect(getByTestId('button-group__button0')).toMatchSnapshot();
    expect(getByText('~ 1 min 30 sec')).toBeInTheDocument();
    expect(getByText('$0.39')).toBeInTheDocument();
    expect(getByText('0.004 ETH')).toBeInTheDocument();
    expect(
      getByTestId('gas-modal-content__info-row__send-info'),
    ).toMatchSnapshot();
    expect(
      getByTestId('gas-modal-content__info-row__transaction-info'),
    ).toMatchSnapshot();
    expect(
      getByTestId('gas-modal-content__info-row__total-info'),
    ).toMatchSnapshot();
    expect(getByText('Save')).toBeInTheDocument();
  });
});
