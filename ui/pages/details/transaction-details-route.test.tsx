import React from 'react';
import { describe, expect, it, jest, beforeEach } from '@jest/globals';
import { fireEvent, render, screen } from '@testing-library/react';
import { enLocale as messages } from '../../../test/lib/i18n-helpers';
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
  TransactionDetails: ({ onBack }: { onBack: () => void }) => {
    const { enLocale } = jest.requireActual(
      '../../../test/lib/i18n-helpers',
    ) as typeof import('../../../test/lib/i18n-helpers');
    return <button onClick={onBack}>{enLocale.back.message}</button>;
  },
}));

describe('TransactionDetailsRoute', () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });

  it('navigates through history when opened from another in-app route', () => {
    mockUseLocation.mockReturnValue({ key: 'in-app-entry' });
    render(<TransactionDetailsRoute />);

    fireEvent.click(
      screen.getByRole('button', { name: messages.back.message }),
    );

    expect(mockNavigate).toHaveBeenCalledWith(PREVIOUS_ROUTE);
  });

  it('navigates to activity when opened directly', () => {
    mockUseLocation.mockReturnValue({ key: 'default' });
    render(<TransactionDetailsRoute />);

    fireEvent.click(
      screen.getByRole('button', { name: messages.back.message }),
    );

    expect(mockNavigate).toHaveBeenCalledWith(ACTIVITY_ROUTE, {
      replace: true,
      state: { fromFreshTab: true },
    });
  });
});
