import { render } from '@testing-library/react';
import React from 'react';
import {
  CONFIRM_APPROVE_PATH,
  CONFIRM_SEND_ETHER_PATH,
  CONFIRM_TRANSACTION_ROUTE,
} from '../../helpers/constants/routes';
import ConfirmTransactionSwitch from './confirm-transaction-switch.component';

jest.mock('react-router-dom', () => {
  return {
    Redirect: jest.fn(({ to }) => `Redirected to ${to.pathname}`),
  };
});

const txData = {
  id: 5177046356058729,
  time: 1653457101080,
  status: 'submitted',
  metamaskNetworkId: '5',
  originalGasEstimate: '0xb427',
  userEditedGasLimit: false,
  chainId: '0x5',
  loadingDefaults: false,
  dappSuggestedGasFees: {
    gasPrice: '0x4a817c800',
    gas: '0xb427',
  },
  sendFlowHistory: [],
  txParams: {
    from: '0xabc539a7d5c43940af498008a7c8f3abb35c3725',
    to: '0xefg60bbf4ba1de43f3b4983a539feebfbd5fd976',
    nonce: '0x5',
    value: '0x5',
    data: '0x095ea7b30000000000000000000000002f318c334780961fb129d2a6c30d0763d9a5c9700000000000000000000000000000000000000000000000000000000000011170',
    gas: '0xb427',
    maxFeePerGas: '0x4a817c800',
    maxPriorityFeePerGas: '0x4a817c800',
  },
  origin: 'https://metamask.github.io',
  type: 'approve',
};

describe('Confirm Transaction Switch', () => {
  it('should redirect to /confirm-approve for approve', () => {
    const { getByText } = render(
      <ConfirmTransactionSwitch
        txData={{ ...txData, txParams: { ...txData.txParams, value: '0x0' } }}
      />,
    );
    expect(
      getByText(
        `Redirected to ${CONFIRM_TRANSACTION_ROUTE}/${txData.id}${CONFIRM_APPROVE_PATH}`,
      ),
    ).toBeInTheDocument();
  });

  it('should redirect to /send-ether for approve with value', () => {
    const { getByText } = render(<ConfirmTransactionSwitch txData={txData} />);
    expect(
      getByText(
        `Redirected to ${CONFIRM_TRANSACTION_ROUTE}/${txData.id}${CONFIRM_SEND_ETHER_PATH}`,
      ),
    ).toBeInTheDocument();
  });
});
