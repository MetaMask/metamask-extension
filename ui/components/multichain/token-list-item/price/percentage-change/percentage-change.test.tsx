import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { PercentageChange } from './percentage-change';

describe('PercentageChange Component - Percentage Display', () => {
  describe('render', () => {
    it('renders correctly', () => {
      const { container } = render(
        <PercentageChange value={5.123} address="0xAddress" />,
      );
      expect(container).toMatchSnapshot();
    });
  });
  it('displays a positive value with a + sign and in green color', () => {
    render(<PercentageChange value={5.123} address="0xAddress" />);
    const valueElement = screen.getByText('+5.12%');
    expect(valueElement).toBeInTheDocument();
  });

  it('displays a negative value with a - sign and in red color', () => {
    render(<PercentageChange value={-2.345} address="0xAddress" />);
    const valueElement = screen.getByText('-2.35%');
    expect(valueElement).toBeInTheDocument();
  });

  it('displays a zero value with a + sign and in green color', () => {
    render(<PercentageChange value={0} address="0xAddress" />);
    const valueElement = screen.getByText('+0.00%');
    expect(valueElement).toBeInTheDocument();
  });

  it('renders an empty string when value is null', () => {
    render(<PercentageChange value={null} address="0xAddress" />);
    const textElement = screen.getByTestId(
      'token-increase-decrease-percentage-0xAddress',
    );
    expect(textElement).toHaveTextContent('');
  });

  it('renders an empty string when value is an invalid number', () => {
    render(<PercentageChange value={NaN} address="0xAddress" />);
    const textElement = screen.getByTestId(
      'token-increase-decrease-percentage-0xAddress',
    );
    expect(textElement).toHaveTextContent('');
  });
});
