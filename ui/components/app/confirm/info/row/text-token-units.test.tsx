import React from 'react';
import { render } from '@testing-library/react';
import { ConfirmInfoRowTextTokenUnits } from './text-token-units';

describe('ConfirmInfoRowTextTokenUnits', () => {
  it('renders the value with the correct formatted decimal', () => {
    const value = 123.456789;
    const decimals = 4;
    const { getByText } = render(
      <ConfirmInfoRowTextTokenUnits value={value} decimals={decimals} />,
    );

    // Note: using formatAmount loses precision
    expect(getByText('0.0123')).toBeInTheDocument();
  });

  it('renders the value with the correct formatted non-fractional number', () => {
    const value = 123456789;
    const decimals = 4;
    const { getByText } = render(
      <ConfirmInfoRowTextTokenUnits value={value} decimals={decimals} />,
    );

    // Note: using formatAmount loses precision
    expect(getByText('12,346')).toBeInTheDocument();
  });
});
