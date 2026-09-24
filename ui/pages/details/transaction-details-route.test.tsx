import React from 'react';
import { describe, expect, it, jest, beforeEach } from '@jest/globals';
import { fireEvent, render, screen } from '@testing-library/react';
import { ACTIVITY_ROUTE, PREVIOUS_ROUTE } from '../../helpers/constants/routes';
import TransactionDetailsRoute from './transaction-details-route';

const mockNavigate = jest.fn();
const mockUseLocation = jest.fn();

jest.mock('react-router-dom', () => ({
  Navigate: ({ to }: { to: string }) => <div>{to}</div>,
  useLocation: () => mockUseLocation(),
  useNavigate: () => mockNavigate,
  useParams: () => ({
    caipChainId: 'eip155:1',
    txIdentifier: 'transaction-1',
  }),
}));

jest.mock('./transaction-details', () => ({
  TransactionDetails: ({ onBack }: { onBack: () => void }) => (
    <button onClick={onBack}>Back</button>
  ),
}));

describe('TransactionDetailsRoute', () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });

  it('navigates through history when opened from another in-app route', () => {
    mockUseLocation.mockReturnValue({ key: 'in-app-entry' });
    render(<TransactionDetailsRoute />);

    fireEvent.click(screen.getByRole('button', { name: 'Back' }));

    expect(mockNavigate).toHaveBeenCalledWith(PREVIOUS_ROUTE);
  });

  it('navigates to activity when opened directly', () => {
    mockUseLocation.mockReturnValue({ key: 'default' });
    render(<TransactionDetailsRoute />);

    fireEvent.click(screen.getByRole('button', { name: 'Back' }));

    expect(mockNavigate).toHaveBeenCalledWith(ACTIVITY_ROUTE, {
      replace: true,
    });
  });
});
