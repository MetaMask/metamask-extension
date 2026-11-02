import React from 'react';
import configureMockStore from 'redux-mock-store';
import thunk from 'redux-thunk';
import { CHAIN_IDS, TransactionMeta } from '@metamask/transaction-controller';
import { Hex } from '@metamask/utils';
import { getMockConfirmStateForTransaction } from '../../../../../../../../test/data/confirmations/helper';
import { genUnapprovedContractInteractionConfirmation } from '../../../../../../../../test/data/confirmations/contract-interaction';
import { renderWithConfirmContextProvider } from '../../../../../../../../test/lib/confirmations/render-helpers';
import NativeSendHeading from './native-send-heading';

jest.mock('../../hooks/useSendingValueMetric', () => ({
  useSendingValueMetric: jest.fn(),
}));

function getMockStore(conversionRate: number, value?: Hex) {
  const transaction = genUnapprovedContractInteractionConfirmation({
    chainId: CHAIN_IDS.GOERLI,
  }) as TransactionMeta;

  if (value) {
    transaction.txParams.value = value;
  }

  const state = getMockConfirmStateForTransaction(transaction, {
    metamask: {
      preferences: {
        showFiatInTestnets: true,
      },
      currencyRates: {
        ETH: {
          conversionRate,
        },
      },
    },
  });

  const middleware = [thunk];
  return configureMockStore(middleware)(state);
}

describe('<NativeSendHeading />', () => {
  it('does not throw when the conversion rate has more than 15 significant digits', () => {
    const mockStore = getMockStore(0.07086574003221964);

    expect(() =>
      renderWithConfirmContextProvider(<NativeSendHeading />, mockStore),
    ).not.toThrow();
  });

  it('renders amounts with up to 8 decimals and no tooltip', () => {
    // 1.234567 ETH
    const mockStore = getMockStore(1, '0x112210253e6b7000');

    const { container, getByTestId } = renderWithConfirmContextProvider(
      <NativeSendHeading />,
      mockStore,
    );

    expect(getByTestId('confirm-send-amount')).toHaveTextContent(
      '1.234567 ETH',
    );
    expect(
      container.querySelector('[data-original-title]'),
    ).not.toBeInTheDocument();
  });

  it('renders 8 decimals and the full amount in the tooltip for longer amounts', () => {
    // 1.123456789 ETH
    const mockStore = getMockStore(1, '0xf9751ff4cd89200');

    const { container, getByTestId } = renderWithConfirmContextProvider(
      <NativeSendHeading />,
      mockStore,
    );

    expect(getByTestId('confirm-send-amount')).toHaveTextContent(
      '1.12345679 ETH',
    );
    expect(container.querySelector('[data-original-title]')).toHaveAttribute(
      'data-original-title',
      '1.123456789',
    );
  });
});
