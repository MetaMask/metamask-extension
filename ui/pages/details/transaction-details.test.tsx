import React from 'react';
import { render } from '@testing-library/react';
import type { RampsOrder } from '@metamask/ramps-controller';
import { useApiTransaction } from '../../hooks/activity/useApiTransaction';
import { mapRampsOrderSafely } from '../../hooks/ramps/utils/mapRampsOrderSafely';
import { useRampsOrders } from '../../hooks/ramps/useRampsOrders';
import {
  selectEvmAddress,
  selectLocalActivityItemsByIdentifier,
  selectNonEvmActivityItemsById,
} from '../../selectors/activity';
import { TransactionDetails } from './transaction-details';

jest.mock('./components/header', () => ({
  Header: ({ item }: { item?: { type?: string; chainId?: string } }) => (
    <div
      data-testid="header"
      data-item-type={item?.type}
      data-chain-id={item?.chainId}
    />
  ),
}));
jest.mock('./templates/template-loader', () => ({
  TemplateLoader: ({
    item,
  }: {
    item?: { type?: string; chainId?: string; data?: { id?: string } };
  }) => (
    <div
      data-testid="template-loader"
      data-item-type={item?.type}
      data-chain-id={item?.chainId}
      data-order-id={item?.data?.id}
    />
  ),
}));
jest.mock('../../hooks/activity/useApiTransaction');
jest.mock('../../hooks/ramps/useRampsOrders');
jest.mock('../../hooks/ramps/utils/mapRampsOrderSafely', () => ({
  mapRampsOrderSafely: jest.fn(),
}));
jest.mock('../../selectors/activity');
jest.mock('react-redux', () => ({
  useSelector: (selector: (state: unknown) => unknown) => selector(undefined),
}));

const mockUseApiTransaction = jest.mocked(useApiTransaction);
const mockUseRampsOrders = jest.mocked(useRampsOrders);
const mockMapRampsOrderSafely = jest.mocked(mapRampsOrderSafely);
const mockSelectEvmAddress = jest.mocked(selectEvmAddress);
const mockSelectLocalActivityItemsByIdentifier = jest.mocked(
  selectLocalActivityItemsByIdentifier,
);
const mockSelectNonEvmActivityItemsById = jest.mocked(
  selectNonEvmActivityItemsById,
);

const pendingOrder = {
  providerOrderId: 'order-1',
  status: 'PENDING',
  txHash: '0xsettled',
} as unknown as RampsOrder;

function mockRampsOrders({
  orders = [],
  getOrderById = () => undefined,
}: {
  orders?: RampsOrder[];
  getOrderById?: (id: string) => RampsOrder | undefined;
} = {}) {
  mockUseRampsOrders.mockReturnValue({
    orders,
    getOrderById,
    addOrder: jest.fn(),
    addPrecreatedOrder: jest.fn(),
    removeOrder: jest.fn(),
    refreshOrder: jest.fn(),
    getOrderFromCallback: jest.fn(),
  });
}

describe('TransactionDetails', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockSelectEvmAddress.mockReturnValue('0xabc');
    mockSelectLocalActivityItemsByIdentifier.mockReturnValue(new Map());
    mockSelectNonEvmActivityItemsById.mockReturnValue(new Map());
    mockUseApiTransaction.mockReturnValue(undefined as never);
    mockMapRampsOrderSafely.mockReturnValue(undefined);
  });

  it('does not query the accounts API using a ramps order id as a tx hash', () => {
    mockRampsOrders({
      getOrderById: (id: string) =>
        id === 'c-28ac6e008a0311f1b2c79d79967cd671'
          ? ({ providerOrderId: id } as never)
          : undefined,
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
    mockRampsOrders();

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

  it('renders a mapped ramps order looked up by id', () => {
    mockRampsOrders({
      getOrderById: (id) => (id === 'order-1' ? pendingOrder : undefined),
    });
    mockMapRampsOrderSafely.mockReturnValue({
      type: 'rampBuy',
      chainId: 'eip155:1',
      status: 'pending',
      timestamp: 1,
      data: { id: 'order-1' },
    } as never);

    const { getByTestId } = render(
      <TransactionDetails
        chainId="eip155:1"
        txIdentifier="order-1"
        onBack={jest.fn()}
      />,
    );

    expect(mockMapRampsOrderSafely).toHaveBeenCalledWith(
      pendingOrder,
      'eip155:1',
    );
    expect(getByTestId('template-loader')).toMatchSnapshot();
  });

  it('looks up a ramps order by settlement hash when id lookup misses', () => {
    mockRampsOrders({
      orders: [pendingOrder],
      getOrderById: () => undefined,
    });
    mockMapRampsOrderSafely.mockReturnValue({
      type: 'rampBuy',
      chainId: 'eip155:1',
      status: 'success',
      timestamp: 1,
      hash: '0xsettled',
      data: { id: 'order-1' },
    } as never);

    render(
      <TransactionDetails
        chainId="eip155:1"
        txIdentifier="0xsettled"
        onBack={jest.fn()}
      />,
    );

    expect(mockMapRampsOrderSafely).toHaveBeenCalledWith(
      pendingOrder,
      'eip155:1',
    );
    expect(mockUseApiTransaction).toHaveBeenCalledWith({
      chainId: 'eip155:1',
      txHash: '0xsettled',
    });
  });

  it('does not pass a non-CAIP chainId as the mapper fallback', () => {
    mockRampsOrders({
      getOrderById: () => pendingOrder,
    });
    mockMapRampsOrderSafely.mockReturnValue({
      type: 'rampBuy',
      status: 'pending',
      timestamp: 1,
      data: { id: 'order-1' },
    } as never);

    render(
      <TransactionDetails
        chainId="1"
        txIdentifier="order-1"
        onBack={jest.fn()}
      />,
    );

    expect(mockMapRampsOrderSafely).toHaveBeenCalledWith(
      pendingOrder,
      undefined,
    );
  });

  it('falls through when the ramps order cannot be mapped', () => {
    mockRampsOrders({
      getOrderById: () => pendingOrder,
    });
    mockMapRampsOrderSafely.mockReturnValue(undefined);
    mockSelectLocalActivityItemsByIdentifier.mockReturnValue(
      new Map([
        [
          'order-1',
          {
            type: 'send',
            chainId: 'eip155:1',
            status: 'success',
            timestamp: 1,
            hash: 'order-1',
            data: { from: '0x1', to: '0x2' },
          } as never,
        ],
      ]),
    );

    const { getByTestId } = render(
      <TransactionDetails
        chainId="eip155:1"
        txIdentifier="order-1"
        onBack={jest.fn()}
      />,
    );

    expect(getByTestId('template-loader')).toHaveAttribute(
      'data-item-type',
      'send',
    );
  });
});
