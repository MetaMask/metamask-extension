import React from 'react';
import { render } from '@testing-library/react';
import { useApiTransaction } from '../../hooks/activity/useApiTransaction';
import {
  selectEvmAddress,
  selectLocalActivityItemsByIdentifier,
  selectNonEvmActivityItemsById,
} from '../../selectors/activity';
import { useRampsDetailsItem } from './templates/ramps/hooks';
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
    item?: {
      type?: string;
      chainId?: string;
      status?: string;
      data?: { id?: string };
    };
  }) => (
    <div
      data-testid="template-loader"
      data-item-type={item?.type}
      data-chain-id={item?.chainId}
      data-item-status={item?.status}
      data-order-id={item?.data?.id}
    />
  ),
}));
jest.mock('../../hooks/activity/useApiTransaction');
jest.mock('../../selectors/activity');
jest.mock('./templates/ramps/hooks');
jest.mock('react-redux', () => ({
  useSelector: (selector: (state: unknown) => unknown) => selector(undefined),
}));

const mockUseApiTransaction = jest.mocked(useApiTransaction);
const mockSelectEvmAddress = jest.mocked(selectEvmAddress);
const mockSelectLocalActivityItemsByIdentifier = jest.mocked(
  selectLocalActivityItemsByIdentifier,
);
const mockSelectNonEvmActivityItemsById = jest.mocked(
  selectNonEvmActivityItemsById,
);
const mockUseRampsDetailsItem = jest.mocked(useRampsDetailsItem);

const validTxHash =
  '0x8586e162e456a23c1969573a4b79e77912705b474bc5aa0c2a63d56556623ab2';

describe('TransactionDetails', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockSelectEvmAddress.mockReturnValue('0xabc');
    mockSelectLocalActivityItemsByIdentifier.mockReturnValue(new Map());
    mockSelectNonEvmActivityItemsById.mockReturnValue(new Map());
    mockUseApiTransaction.mockReturnValue(undefined as never);
    mockUseRampsDetailsItem.mockReturnValue(undefined);
  });

  it('does not query the accounts API using a non-hash identifier', () => {
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
    render(
      <TransactionDetails
        chainId="eip155:1"
        txIdentifier={validTxHash}
        onBack={jest.fn()}
      />,
    );

    expect(mockUseApiTransaction).toHaveBeenCalledWith({
      chainId: 'eip155:1',
      txHash: validTxHash,
    });
  });

  it('passes the generic activity item to the template loader', () => {
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
    expect(getByTestId('template-loader')).toHaveAttribute(
      'data-chain-id',
      'eip155:1',
    );
  });

  it('prefers a resolved ramp order over the generic transaction sharing its hash', () => {
    mockUseRampsDetailsItem.mockReturnValue({
      type: 'rampBuy',
      chainId: 'eip155:1',
      status: 'pending',
      timestamp: 1,
      data: { id: 'order-1', from: '0x1' },
    } as never);

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
      'rampBuy',
    );
    expect(getByTestId('header')).toHaveAttribute('data-item-type', 'rampBuy');
  });

  it('reflects ramp order updates without remounting', () => {
    mockUseRampsDetailsItem.mockReturnValue({
      type: 'rampBuy',
      chainId: 'eip155:1',
      status: 'pending',
      timestamp: 1,
      data: { id: 'order-1' },
    } as never);

    const { getByTestId, rerender } = render(
      <TransactionDetails
        chainId="eip155:1"
        txIdentifier="order-1"
        onBack={jest.fn()}
      />,
    );

    expect(getByTestId('template-loader')).toHaveAttribute(
      'data-item-status',
      'pending',
    );

    mockUseRampsDetailsItem.mockReturnValue({
      type: 'rampBuy',
      chainId: 'eip155:1',
      status: 'success',
      timestamp: 1,
      data: { id: 'order-1' },
    } as never);

    rerender(
      <TransactionDetails
        chainId="eip155:1"
        txIdentifier="order-1"
        onBack={jest.fn()}
      />,
    );

    expect(getByTestId('template-loader')).toHaveAttribute(
      'data-item-status',
      'success',
    );
  });
});
