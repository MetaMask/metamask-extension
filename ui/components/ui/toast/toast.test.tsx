import React from 'react';
import { render, screen } from '@testing-library/react';
import { ToastContent } from './toast';

jest.mock('../../../helpers/utils/transaction-display', () => ({
  useTransactionDisplay: (variant: string) => ({
    title: `${variant} title`,
  }),
}));

jest.mock('../icon/status-icon', () => ({
  StatusIcon: () => null,
}));

describe('ToastContent', () => {
  it('renders the title for the pending variant', () => {
    render(<ToastContent status="pending" />);
    expect(screen.getByText('pending title')).toBeInTheDocument();
  });

  it('renders the title for the success variant', () => {
    render(<ToastContent status="success" />);
    expect(screen.getByText('success title')).toBeInTheDocument();
  });

  it('renders the title for the failed variant', () => {
    render(<ToastContent status="failed" />);
    expect(screen.getByText('failed title')).toBeInTheDocument();
  });
});
