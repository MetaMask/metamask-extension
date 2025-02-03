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

    expect(getByText('0.0123')).toBeInTheDocument();
  });

  it('renders the value with the correct formatted number for lengthy decimals', () => {
    const value = '300012312312123121';
    const decimals = 18;
    const { getByText } = render(
      <ConfirmInfoRowTextTokenUnits value={value} decimals={decimals} />,
    );

    expect(getByText('0.3')).toBeInTheDocument();
  });

  it('renders the value with the correct formatted non-fractional number', () => {
    const value = 123456789;
    const decimals = 4;
    const { getByText } = render(
      <ConfirmInfoRowTextTokenUnits value={value} decimals={decimals} />,
    );

    expect(getByText('12,346')).toBeInTheDocument();
  });

  it('renders the value with the correct formatted number', () => {
    const value = '30001231231212312138768';
    const decimals = 9;
    const { getByText } = render(
      <ConfirmInfoRowTextTokenUnits value={value} decimals={decimals} />,
    );

    expect(getByText('30,001,231,231,...')).toBeInTheDocument();
  });

  it('renders the value with the correct formatted number and ellipsis', () => {
    const value = '30001231231212312138768';
    const decimals = 7;
    const { getByText } = render(
      <ConfirmInfoRowTextTokenUnits value={value} decimals={decimals} />,
    );

    expect(getByText('3,000,123,123,1...')).toBeInTheDocument();
  });
});
