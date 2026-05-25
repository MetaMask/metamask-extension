import React from 'react';
import { render } from '@testing-library/react';
import { GenericActivityCell } from './generic-activity-cell';

const mockFormatTokenAmount = jest.fn();

jest.mock('../../../hooks/useI18nContext', () => ({
  useI18nContext: () => (key: string) => key,
}));

jest.mock('../useFormatTokenAmount', () => ({
  useFormatTokenAmount: () => mockFormatTokenAmount,
}));

describe('GenericActivityCell', () => {
  beforeEach(() => {
    mockFormatTokenAmount.mockReturnValue(undefined);
  });

  it('renders successful activity with the confirmed transaction status hook', () => {
    const { getByTestId } = render(
      <GenericActivityCell
        data={{
          type: 'send',
          chainId: 'eip155:1',
          status: 'success',
          timestamp: 0,
          data: {
            from: '0x0000000000000000000000000000000000000001',
            to: '0x0000000000000000000000000000000000000002',
            token: {
              amount: '1000000000000000000',
              decimals: 18,
              direction: 'out',
              symbol: 'ETH',
            },
          },
        }}
        onClick={jest.fn()}
      />,
    );

    expect(getByTestId('activity-list-item')).toHaveAttribute(
      'data-tx-status',
      'confirmed',
    );
  });

  it('renders contract interaction token amounts', () => {
    mockFormatTokenAmount.mockReturnValue('-4 ETH');

    const { getByTestId } = render(
      <GenericActivityCell
        data={{
          type: 'contractInteraction',
          chainId: 'eip155:1',
          status: 'success',
          timestamp: 0,
          data: {
            from: '0x0000000000000000000000000000000000000001',
            to: '0x0000000000000000000000000000000000000002',
            token: {
              amount: '4000000000000000000',
              decimals: 18,
              direction: 'out',
              symbol: 'ETH',
            },
          },
        }}
        onClick={jest.fn()}
      />,
    );

    expect(
      getByTestId('transaction-list-item-primary-currency'),
    ).toHaveTextContent('-4 ETH');
  });
});
