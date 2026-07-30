import React from 'react';
import { render } from '@testing-library/react';
import { useApiTransaction } from '../../hooks/activity/useApiTransaction';
import { useRampsOrders } from '../../hooks/ramps/useRampsOrders';
import {
  selectEvmAddress,
  selectLocalActivityItemsByIdentifier,
  selectNonEvmActivityItemsById,
} from '../../selectors/activity';
import { TransactionDetails } from './transaction-details';

jest.mock('./components/header', () => ({
  Header: () => <div data-testid="header" />,
}));
jest.mock('./templates/template-loader', () => ({
  TemplateLoader: () => <div data-testid="template-loader" />,
}));
jest.mock('../../hooks/activity/useApiTransaction');
jest.mock('../../hooks/ramps/useRampsOrders');
jest.mock('../../selectors/activity');
jest.mock('react-redux', () => ({
  useSelector: (selector: (state: unknown) => unknown) => selector(undefined),
}));

const mockUseApiTransaction = jest.mocked(useApiTransaction);
const mockUseRampsOrders = jest.mocked(useRampsOrders);
const mockSelectEvmAddress = jest.mocked(selectEvmAddress);
const mockSelectLocalActivityItemsByIdentifier = jest.mocked(
  selectLocalActivityItemsByIdentifier,
);
const mockSelectNonEvmActivityItemsById = jest.mocked(
  selectNonEvmActivityItemsById,
);

describe('TransactionDetails', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockSelectEvmAddress.mockReturnValue('0xabc');
    mockSelectLocalActivityItemsByIdentifier.mockReturnValue(new Map());
    mockSelectNonEvmActivityItemsById.mockReturnValue(new Map());
    mockUseApiTransaction.mockReturnValue(undefined as never);
  });

  it('does not query the accounts API using a ramps order id as a tx hash', () => {
    mockUseRampsOrders.mockReturnValue({
      orders: [],
      getOrderById: (id: string) =>
        id === 'c-28ac6e008a0311f1b2c79d79967cd671'
          ? ({ providerOrderId: id } as never)
          : undefined,
      addOrder: jest.fn(),
      addPrecreatedOrder: jest.fn(),
      removeOrder: jest.fn(),
      refreshOrder: jest.fn(),
      getOrderFromCallback: jest.fn(),
    });

    render(
      <TransactionDetails
        chainId="eip155:1"
        txIdentifier="c-28ac6e008a0311f1b2c79d79967cd671"
        onBack={jest.fn()}
      />,
    );

    expect(mockUseApiTransaction).toHaveBeenCalledWith({
      chainId: 'eip155:1',
      txHash: undefined,
    });
  });

  it('queries the accounts API when the identifier is a real tx hash', () => {
    mockUseRampsOrders.mockReturnValue({
      orders: [],
      getOrderById: () => undefined,
      addOrder: jest.fn(),
      addPrecreatedOrder: jest.fn(),
      removeOrder: jest.fn(),
      refreshOrder: jest.fn(),
      getOrderFromCallback: jest.fn(),
    });

    render(
      <TransactionDetails
        chainId="eip155:1"
        txIdentifier="0xdeadbeef"
        onBack={jest.fn()}
      />,
    );

    expect(mockUseApiTransaction).toHaveBeenCalledWith({
      chainId: 'eip155:1',
      txHash: '0xdeadbeef',
    });
  });
});
