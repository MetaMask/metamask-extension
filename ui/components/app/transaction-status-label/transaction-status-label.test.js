import React from 'react';
import { renderWithProvider } from '../../../../test/lib/render-helpers';
import TransactionStatusLabel from '.';

describe('TransactionStatusLabel Component', () => {
  it('should render CONFIRMED properly', () => {
    const confirmedProps = {
      status: 'confirmed',
      date: 'June 1',
    };

    const { container } = renderWithProvider(
      <TransactionStatusLabel {...confirmedProps} />,
    );

    expect(container).toMatchSnapshot();
  });

  it('should render PENDING properly when status is APPROVED', () => {
    const props = {
      status: 'approved',
      isEarliestNonce: true,
      error: { message: 'test-title' },
    };

    const { container } = renderWithProvider(
      <TransactionStatusLabel {...props} />,
    );

    expect(container).toMatchSnapshot();
  });

  it('should render PENDING properly', () => {
    const props = {
      date: 'June 1',
      status: 'submitted',
      isEarliestNonce: true,
    };

    const { container } = renderWithProvider(
      <TransactionStatusLabel {...props} />,
    );

    expect(container).toMatchSnapshot();
  });

  it('should render QUEUED properly', () => {
    const props = {
      status: 'queued',
    };

    const { container } = renderWithProvider(
      <TransactionStatusLabel {...props} />,
    );

    expect(container).toMatchSnapshot();
  });

  it('should render UNAPPROVED properly', () => {
    const props = {
      status: 'unapproved',
    };

    const { container } = renderWithProvider(
      <TransactionStatusLabel {...props} />,
    );

    expect(container).toMatchSnapshot();
  });
});
