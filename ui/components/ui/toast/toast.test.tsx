import React from 'react';
import { render, screen } from '@testing-library/react';
import { ToastContent } from './toast';

jest.mock('../../../helpers/utils/transaction-display', () => ({
  useTransactionDisplayData: (variant: string) => ({
    title: `${variant} title`,
  }),
}));

jest.mock('./toast-status-icon', () => ({
  SPINNER_INPUT: { loading: 'Loading', success: 'Success', error: 'Fail' },
  ToastStatusIcon: () => null,
}));

describe('ToastContent', () => {
  it('renders the title for the pending variant', () => {
    render(<ToastContent variant="pending" />);
    expect(screen.getByText('pending title')).toBeInTheDocument();
  });

  it('renders the title for the success variant', () => {
    render(<ToastContent variant="success" />);
    expect(screen.getByText('success title')).toBeInTheDocument();
  });

  it('renders the title for the failed variant', () => {
    render(<ToastContent variant="failed" />);
    expect(screen.getByText('failed title')).toBeInTheDocument();
  });
});
