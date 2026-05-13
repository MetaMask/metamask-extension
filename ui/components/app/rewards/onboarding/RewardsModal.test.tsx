import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { useSelector, useDispatch } from 'react-redux';

import {
  selectRewardsModalOpen,
  selectCandidateSubscriptionId,
} from '../../../../ducks/rewards/selectors';
import {
  setRewardsModalOpen,
  setOnboardingReferralCode,
  setRewardsDeeplinkUrl,
} from '../../../../ducks/rewards';
import { ThemeType } from '../../../../../shared/constants/preferences';
import type { MetaMaskReduxState } from '../../../../store/store';
import RewardsModal from './RewardsModal';

jest.mock('react-redux', () => ({
  useSelector: jest.fn(),
  useDispatch: jest.fn(),
}));

jest.mock('../../../../hooks/useTheme', () => ({
  useTheme: jest.fn(() => 'light'),
}));

jest.mock('./OnboardingMainStep', () => () => (
  <div data-testid="onboarding-main-step">Main Step</div>
));

jest.mock('../RewardsErrorToast', () => () => (
  <div data-testid="rewards-error-toast">Toast</div>
));

jest.mock('../RewardsQRCode', () => () => (
  <div data-testid="rewards-qr">QR Code</div>
));

const mockedUseSelector = useSelector as jest.Mock;
const mockedUseDispatch = useDispatch as jest.Mock;

function setupSelectors({
  isOpen = true,
  candidateSubscriptionId = null as string | null,
} = {}) {
  mockedUseSelector.mockImplementation(
    (selector: (state: MetaMaskReduxState) => unknown): unknown => {
      if (selector === selectRewardsModalOpen) {
        return isOpen;
      }
      if (selector === selectCandidateSubscriptionId) {
        return candidateSubscriptionId;
      }
      return undefined;
    },
  );
}

describe('RewardsModal', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders the single onboarding page when not yet opted in', () => {
    setupSelectors({ isOpen: true, candidateSubscriptionId: null });
    mockedUseDispatch.mockReturnValue(jest.fn());

    render(<RewardsModal />);

    expect(screen.getByTestId('rewards-modal')).toBeInTheDocument();
    expect(screen.getByTestId('rewards-modal-header')).toBeInTheDocument();
    expect(screen.getByTestId('onboarding-main-step')).toBeInTheDocument();
    expect(screen.getByTestId('rewards-error-toast')).toBeInTheDocument();
    expect(screen.queryByTestId('rewards-qr')).not.toBeInTheDocument();
  });

  it('renders the QR code once a valid candidate subscription id resolves', () => {
    setupSelectors({
      isOpen: true,
      candidateSubscriptionId: 'valid-subscription-id',
    });
    mockedUseDispatch.mockReturnValue(jest.fn());

    render(<RewardsModal />);

    expect(screen.getByTestId('rewards-qr')).toBeInTheDocument();
    expect(
      screen.queryByTestId('onboarding-main-step'),
    ).not.toBeInTheDocument();
  });

  (['error', 'pending', 'retry'] as const).forEach((id) => {
    it(`still renders the main step when candidateSubscriptionId is "${id}"`, () => {
      setupSelectors({ isOpen: true, candidateSubscriptionId: id });
      mockedUseDispatch.mockReturnValue(jest.fn());

      render(<RewardsModal />);

      expect(screen.getByTestId('onboarding-main-step')).toBeInTheDocument();
      expect(screen.queryByTestId('rewards-qr')).not.toBeInTheDocument();
    });
  });

  it('dispatches close + clears referral code + clears deeplink url when close button is clicked', () => {
    setupSelectors({ isOpen: true, candidateSubscriptionId: null });
    const dispatchMock = jest.fn();
    mockedUseDispatch.mockReturnValue(dispatchMock);

    render(<RewardsModal />);

    const header = screen.getByTestId('rewards-modal-header');
    const closeButton = header.querySelector('[aria-label]');
    expect(closeButton).toBeInTheDocument();
    fireEvent.click(closeButton as Element);

    expect(dispatchMock).toHaveBeenCalledWith(setRewardsModalOpen(false));
    expect(dispatchMock).toHaveBeenCalledWith(setOnboardingReferralCode(null));
    expect(dispatchMock).toHaveBeenCalledWith(setRewardsDeeplinkUrl(null));
  });

  it('sets header theme attribute based on useTheme: light', () => {
    setupSelectors({ isOpen: true });
    mockedUseDispatch.mockReturnValue(jest.fn());

    render(<RewardsModal />);

    expect(screen.getByTestId('rewards-modal-header')).toHaveAttribute(
      'data-theme',
      ThemeType.light,
    );
  });

  it('sets header theme attribute based on useTheme: dark', () => {
    const { useTheme } = jest.requireMock('../../../../hooks/useTheme');
    useTheme.mockReturnValue('dark');

    setupSelectors({ isOpen: true });
    mockedUseDispatch.mockReturnValue(jest.fn());

    render(<RewardsModal />);

    expect(screen.getByTestId('rewards-modal-header')).toHaveAttribute(
      'data-theme',
      ThemeType.dark,
    );
  });
});
