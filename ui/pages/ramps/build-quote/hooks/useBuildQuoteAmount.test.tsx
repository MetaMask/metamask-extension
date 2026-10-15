/**
 * @jest-environment jsdom
 */
import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { RampsBuildQuoteDraftProvider } from '../../context/ramps-flow-context';
import { useBuildQuoteAmount } from './useBuildQuoteAmount';

const AmountConsumer = ({
  regionDefaultAmount,
}: {
  regionDefaultAmount?: number;
}) => {
  const { amount, handleAmountChange } =
    useBuildQuoteAmount(regionDefaultAmount);

  return (
    <input data-testid="amount" value={amount} onChange={handleAmountChange} />
  );
};

const FlowHarness = ({
  show,
  regionDefaultAmount,
}: {
  show: boolean;
  regionDefaultAmount?: number;
}) => (
  <RampsBuildQuoteDraftProvider>
    {show ? <AmountConsumer regionDefaultAmount={regionDefaultAmount} /> : null}
  </RampsBuildQuoteDraftProvider>
);

describe('useBuildQuoteAmount', () => {
  it('defaults to 100 without a draft or regional default', () => {
    render(<FlowHarness show />);

    expect(screen.getByTestId('amount')).toHaveValue('100');
  });

  it('uses the regional default amount', () => {
    render(<FlowHarness show regionDefaultAmount={50} />);

    expect(screen.getByTestId('amount')).toHaveValue('50');
  });

  it('restores the entered amount when the consumer remounts within the flow', () => {
    const { rerender } = render(<FlowHarness show />);

    fireEvent.change(screen.getByTestId('amount'), {
      target: { value: '250' },
    });

    rerender(<FlowHarness show={false} />);
    rerender(<FlowHarness show />);

    expect(screen.getByTestId('amount')).toHaveValue('250');
  });

  it('does not override a restored amount with the regional default', () => {
    const { rerender } = render(<FlowHarness show />);

    fireEvent.change(screen.getByTestId('amount'), {
      target: { value: '250' },
    });

    rerender(<FlowHarness show={false} />);
    rerender(<FlowHarness show regionDefaultAmount={50} />);

    expect(screen.getByTestId('amount')).toHaveValue('250');
  });

  it('does not persist the built-in default so a late regional default can apply', () => {
    const { rerender } = render(<FlowHarness show />);

    expect(screen.getByTestId('amount')).toHaveValue('100');

    rerender(<FlowHarness show={false} />);
    rerender(<FlowHarness show regionDefaultAmount={50} />);

    expect(screen.getByTestId('amount')).toHaveValue('50');
  });
});
