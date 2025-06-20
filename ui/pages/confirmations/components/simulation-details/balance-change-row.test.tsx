import React from 'react';
import { render } from '@testing-library/react';
import { BalanceChangeRow } from './balance-change-row';
import { AmountPill } from './amount-pill';
import { AssetPill } from './asset-pill';
import { IndividualFiatDisplay } from './fiat-display';
import { BalanceChange } from './types';

jest.mock('./amount-pill', () => ({
  AmountPill: jest.fn(() => null),
}));

jest.mock('./asset-pill', () => ({
  AssetPill: jest.fn(() => null),
}));

jest.mock('./fiat-display', () => ({
  IndividualFiatDisplay: jest.fn(() => null),
}));

describe('BalanceChangeRow', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const balanceChange = {
    asset: { address: '0x123' },
    amount: { isNegative: true, numeric: { abs: jest.fn() } },
    fiatAmount: 100,
  } as unknown as BalanceChange;

  it('renders the label when provided', () => {
    const label = 'Test Label';
    const { getByText } = render(
      <BalanceChangeRow
        label={label}
        showFiat={false}
        balanceChange={balanceChange}
      />,
    );
    expect(getByText(label)).toBeInTheDocument();
  });

  it('does not render the label when not provided', () => {
    const { queryByText } = render(
      <BalanceChangeRow showFiat={false} balanceChange={balanceChange} />,
    );
    expect(queryByText('Test Label')).not.toBeInTheDocument();
  });

  it('renders AmountPill with the balance change', () => {
    render(<BalanceChangeRow showFiat={false} balanceChange={balanceChange} />);
    const { asset, amount } = balanceChange;
    expect(AmountPill).toHaveBeenCalledWith({ asset, amount }, {});
  });

  it('renders AssetPill with the balance change asset', () => {
    render(<BalanceChangeRow showFiat={false} balanceChange={balanceChange} />);
    expect(AssetPill).toHaveBeenCalledWith(
      expect.objectContaining({ asset: balanceChange.asset }),
      {},
    );
  });

  it('renders IndividualFiatDisplay when showFiat is true', () => {
    render(<BalanceChangeRow showFiat balanceChange={balanceChange} />);
    expect(IndividualFiatDisplay).toHaveBeenCalledWith(
      expect.objectContaining({ fiatAmount: balanceChange.fiatAmount }),
      {},
    );
  });

  it('does not render IndividualFiatDisplay when showFiat is false', () => {
    render(<BalanceChangeRow showFiat={false} balanceChange={balanceChange} />);
    expect(IndividualFiatDisplay).not.toHaveBeenCalled();
  });

  it('renders edit icon if onEdit is provided', () => {
    const onEdit = jest.fn();

    const { getByTestId } = render(
      <BalanceChangeRow
        showFiat={false}
        balanceChange={{ ...balanceChange, onEdit }}
      />,
    );

    expect(getByTestId('balance-change-edit')).toBeInTheDocument();
  });
});
