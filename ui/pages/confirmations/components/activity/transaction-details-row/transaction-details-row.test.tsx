import React from 'react';
import { render } from '@testing-library/react';
import { TransactionDetailsRow } from './transaction-details-row';

describe('TransactionDetailsRow', () => {
  it('renders label and children', () => {
    const { getByText } = render(
      <TransactionDetailsRow label="Test Label">
        <span>Test Content</span>
      </TransactionDetailsRow>,
    );

    expect(getByText('Test Label')).toBeInTheDocument();
    expect(getByText('Test Content')).toBeInTheDocument();
  });

  it('renders with data-testid when provided', () => {
    const { getByTestId } = render(
      <TransactionDetailsRow label="Label" data-testid="test-row">
        <span>Content</span>
      </TransactionDetailsRow>,
    );

    expect(getByTestId('test-row')).toBeInTheDocument();
  });
});
