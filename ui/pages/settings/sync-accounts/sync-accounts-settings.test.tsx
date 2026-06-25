import React from 'react';
import { fireEvent, screen } from '@testing-library/react';
import { renderWithLocalization } from '../../../../test/lib/render-helpers-navigate';
import { DEFAULT_ROUTE } from '../../../helpers/constants/routes';
import SyncAccountsSettings from './sync-accounts-settings';

const mockNavigate = jest.fn();

jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
}));

jest.mock('./components', () => {
  const { SyncAccountsStep } = jest.requireActual('./constant');
  return {
    QrCodeScan: ({
      onScanSuccess,
    }: {
      onScanSuccess: (step: string) => void;
    }) => (
      <button
        data-testid="qr-code-scan"
        onClick={() =>
          onScanSuccess(SyncAccountsStep.EnterVerificationCode)
        }
      >
        qr
      </button>
    ),
    EnterVerificationCode: ({
      onContinue,
    }: {
      onContinue: (step: string) => void;
    }) => (
      <button
        data-testid="enter-verification-code"
        onClick={() => onContinue(SyncAccountsStep.ValidatingDevice)}
      >
        verify
      </button>
    ),
    EnterPassword: ({ onContinue }: { onContinue: (step: string) => void }) => (
      <button
        data-testid="enter-password"
        onClick={() => onContinue(SyncAccountsStep.AddWallets)}
      >
        password
      </button>
    ),
    AddWallets: ({
      onAddWallets,
    }: {
      onAddWallets: (step: string) => void;
    }) => (
      <button
        data-testid="add-wallets"
        onClick={() => onAddWallets(SyncAccountsStep.SyncingWallets)}
      >
        wallets
      </button>
    ),
    LoadingStep: ({
      title,
      onComplete,
    }: {
      title: string;
      onComplete?: () => void;
    }) => (
      <button data-testid="loading-step" onClick={onComplete}>
        {title}
      </button>
    ),
    Success: ({ onDone }: { onDone: () => void }) => (
      <button data-testid="success" onClick={onDone}>
        done
      </button>
    ),
  };
});

describe('SyncAccountsSettings', () => {
  beforeEach(() => {
    mockNavigate.mockClear();
  });

  it('starts on the QR code scan step', () => {
    renderWithLocalization(<SyncAccountsSettings />);

    expect(screen.getByTestId('qr-code-scan')).toBeInTheDocument();
  });

  it('advances through the full add device flow', () => {
    renderWithLocalization(<SyncAccountsSettings />);

    fireEvent.click(screen.getByTestId('qr-code-scan'));
    expect(screen.getByTestId('enter-verification-code')).toBeInTheDocument();

    fireEvent.click(screen.getByTestId('enter-verification-code'));
    expect(screen.getByTestId('loading-step')).toBeInTheDocument();

    fireEvent.click(screen.getByTestId('loading-step'));
    expect(screen.getByTestId('enter-password')).toBeInTheDocument();

    fireEvent.click(screen.getByTestId('enter-password'));
    expect(screen.getByTestId('add-wallets')).toBeInTheDocument();

    fireEvent.click(screen.getByTestId('add-wallets'));
    expect(screen.getByTestId('loading-step')).toBeInTheDocument();

    fireEvent.click(screen.getByTestId('loading-step'));
    expect(screen.getByTestId('success')).toBeInTheDocument();
  });

  it('navigates to the default route when the success step is done', () => {
    renderWithLocalization(<SyncAccountsSettings />);

    fireEvent.click(screen.getByTestId('qr-code-scan'));
    fireEvent.click(screen.getByTestId('enter-verification-code'));
    fireEvent.click(screen.getByTestId('loading-step'));
    fireEvent.click(screen.getByTestId('enter-password'));
    fireEvent.click(screen.getByTestId('add-wallets'));
    fireEvent.click(screen.getByTestId('loading-step'));
    fireEvent.click(screen.getByTestId('success'));

    expect(mockNavigate).toHaveBeenCalledWith(DEFAULT_ROUTE);
  });
});
