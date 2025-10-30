import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { OnboardingStep } from '../../../../ducks/rewards/types';
import OnboardingIntroStep from './OnboardingIntroStep';

// Mock i18n to return the key for readability in assertions
jest.mock('../../../../hooks/useI18nContext', () => ({
  useI18nContext: jest.fn(() => (key: string) => key),
}));

// Mock react-redux hooks
jest.mock('react-redux', () => ({
  useSelector: jest.fn(),
  useDispatch: jest.fn(),
}));

// Mock rewards actions to capture payloads dispatched
jest.mock('../../../../ducks/rewards', () => ({
  setErrorToast: jest.fn((payload) => ({ type: 'SET_ERROR_TOAST', payload })),
  setOnboardingActiveStep: jest.fn((step) => ({
    type: 'SET_ONBOARDING_STEP',
    step,
  })),
  setOnboardingModalOpen: jest.fn((open) => ({ type: 'SET_MODAL_OPEN', open })),
}));

// Mock shared storage helper to avoid side effects from useEffect
jest.mock('../../../../../shared/lib/storage-helpers', () => ({
  setStorageItem: jest.fn(() => Promise.resolve()),
}));

// Mock useAppSelector to control rewardsActiveAccount subscription id
jest.mock('../../../../store/store', () => ({
  useAppSelector: jest.fn(),
}));

// Mock geo rewards metadata hook to supply a retry handler
jest.mock('../../../../hooks/rewards/useGeoRewardsMetadata', () => ({
  useGeoRewardsMetadata: jest.fn(),
}));

describe('OnboardingIntroStep', () => {
  const { useSelector, useDispatch } = jest.requireMock('react-redux');
  const { setErrorToast, setOnboardingActiveStep, setOnboardingModalOpen } =
    jest.requireMock('../../../../ducks/rewards');
  const { useAppSelector } = jest.requireMock('../../../../store/store');
  const { useGeoRewardsMetadata } = jest.requireMock(
    '../../../../hooks/rewards/useGeoRewardsMetadata',
  );

  const dispatchMock = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    (useDispatch as jest.Mock).mockReturnValue(dispatchMock);
    // Default: no active subscription id
    (useAppSelector as jest.Mock).mockReturnValue(undefined);
    // Default geo metadata hook with a retry function
    (useGeoRewardsMetadata as jest.Mock).mockReturnValue({
      fetchGeoRewardsMetadata: jest.fn(),
    });
  });

  it('renders title, description, image, and action buttons', () => {
    // Sequence for useSelector calls in component:
    // 1) selectOptinAllowedForGeo
    // 2) selectOptinAllowedForGeoLoading
    // 3) selectOptinAllowedForGeoError
    // 4) selectCandidateSubscriptionId
    // 5) selectCandidateSubscriptionIdError
    // 6) isHardwareWallet
    (useSelector as jest.Mock)
      .mockReturnValueOnce(true)
      .mockReturnValueOnce(false)
      .mockReturnValueOnce(false)
      .mockReturnValueOnce(undefined)
      .mockReturnValueOnce(false)
      .mockReturnValueOnce(false);

    render(<OnboardingIntroStep />);

    expect(
      screen.getByTestId('onboarding-intro-container'),
    ).toBeInTheDocument();
    expect(
      screen.getByTestId('rewards-onboarding-intro-title'),
    ).toBeInTheDocument();
    expect(screen.getByText('rewardsOnboardingIntroTitle')).toBeInTheDocument();
    expect(
      screen.getByText('rewardsOnboardingIntroDescription'),
    ).toBeInTheDocument();
    expect(
      screen.getByTestId('rewards-onboarding-intro-image'),
    ).toBeInTheDocument();
    expect(screen.getByTestId('intro-image')).toBeInTheDocument();
    expect(
      screen.getByTestId('rewards-onboarding-intro-actions'),
    ).toBeInTheDocument();
    // Buttons available with translated labels
    expect(
      screen.getByRole('button', { name: 'rewardsOnboardingIntroStepConfirm' }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'rewardsOnboardingIntroStepSkip' }),
    ).toBeInTheDocument();
  });

  it('on confirm: shows error toast for geo check failure and includes retry handler', () => {
    const fetchGeoRewardsMetadata = jest.fn();
    (useGeoRewardsMetadata as jest.Mock).mockReturnValue({
      fetchGeoRewardsMetadata,
    });

    // Trigger the first error branch: geo check failed
    (useSelector as jest.Mock)
      .mockReturnValueOnce(false) // optinAllowedForGeo
      .mockReturnValueOnce(false) // optinAllowedForGeoLoading
      .mockReturnValueOnce(true) // optinAllowedForGeoError
      .mockReturnValueOnce(undefined) // candidateSubscriptionId
      .mockReturnValueOnce(false) // candidateSubscriptionIdError
      .mockReturnValueOnce(false); // hardwareWalletUsed

    render(<OnboardingIntroStep />);

    fireEvent.click(
      screen.getByRole('button', { name: 'rewardsOnboardingIntroStepConfirm' }),
    );

    expect(setErrorToast).toHaveBeenCalledWith(
      expect.objectContaining({
        isOpen: true,
        title: 'rewardsOnboardingIntroGeoCheckFailedTitle',
        description: 'rewardsOnboardingIntroGeoCheckFailedDescription',
        actionText: 'rewardsOnboardingIntroGeoCheckRetry',
        onActionClick: fetchGeoRewardsMetadata,
      }),
    );
    expect(dispatchMock).toHaveBeenCalledWith(
      expect.objectContaining({ type: 'SET_ERROR_TOAST' }),
    );
  });

  it('on confirm: shows error toast for unsupported region', () => {
    // Trigger the unsupported region branch: opt-in is not allowed
    (useSelector as jest.Mock)
      .mockReturnValueOnce(false) // optinAllowedForGeo
      .mockReturnValueOnce(false) // optinAllowedForGeoLoading
      .mockReturnValueOnce(false) // optinAllowedForGeoError
      .mockReturnValueOnce(undefined) // candidateSubscriptionId
      .mockReturnValueOnce(false) // candidateSubscriptionIdError
      .mockReturnValueOnce(false); // hardwareWalletUsed

    render(<OnboardingIntroStep />);

    fireEvent.click(
      screen.getByRole('button', { name: 'rewardsOnboardingIntroStepConfirm' }),
    );

    expect(setErrorToast).toHaveBeenCalledWith(
      expect.objectContaining({
        isOpen: true,
        title: 'rewardsOnboardingIntroUnsupportedRegionTitle',
        description: 'rewardsOnboardingIntroUnsupportedRegionDescription',
      }),
    );
    expect(dispatchMock).toHaveBeenCalledWith(
      expect.objectContaining({ type: 'SET_ERROR_TOAST' }),
    );
  });

  it('on confirm: shows error toast for hardware wallet usage', () => {
    // Trigger the hardware wallet branch
    (useSelector as jest.Mock)
      .mockReturnValueOnce(true) // optinAllowedForGeo
      .mockReturnValueOnce(false) // optinAllowedForGeoLoading
      .mockReturnValueOnce(false) // optinAllowedForGeoError
      .mockReturnValueOnce(undefined) // candidateSubscriptionId
      .mockReturnValueOnce(false) // candidateSubscriptionIdError
      .mockReturnValueOnce(true); // hardwareWalletUsed

    render(<OnboardingIntroStep />);

    fireEvent.click(
      screen.getByRole('button', { name: 'rewardsOnboardingIntroStepConfirm' }),
    );

    expect(setErrorToast).toHaveBeenCalledWith(
      expect.objectContaining({
        isOpen: true,
        title: 'rewardsOnboardingIntroHardwareWalletTitle',
        description: 'rewardsOnboardingIntroHardwareWalletDescription',
      }),
    );
    expect(dispatchMock).toHaveBeenCalledWith(
      expect.objectContaining({ type: 'SET_ERROR_TOAST' }),
    );
  });

  it('on confirm: proceeds to STEP1 when allowed and not hardware wallet', () => {
    (useSelector as jest.Mock)
      .mockReturnValueOnce(true) // optinAllowedForGeo
      .mockReturnValueOnce(false) // optinAllowedForGeoLoading
      .mockReturnValueOnce(false) // optinAllowedForGeoError
      .mockReturnValueOnce(undefined) // candidateSubscriptionId
      .mockReturnValueOnce(false) // candidateSubscriptionIdError
      .mockReturnValueOnce(false); // hardwareWalletUsed

    render(<OnboardingIntroStep />);

    fireEvent.click(
      screen.getByRole('button', { name: 'rewardsOnboardingIntroStepConfirm' }),
    );

    expect(setOnboardingActiveStep).toHaveBeenCalledWith(OnboardingStep.STEP1);
    expect(dispatchMock).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'SET_ONBOARDING_STEP',
        step: OnboardingStep.STEP1,
      }),
    );
  });

  it('on skip: closes the onboarding modal', () => {
    (useSelector as jest.Mock)
      .mockReturnValueOnce(true) // optinAllowedForGeo
      .mockReturnValueOnce(false) // optinAllowedForGeoLoading
      .mockReturnValueOnce(false) // optinAllowedForGeoError
      .mockReturnValueOnce(undefined) // candidateSubscriptionId
      .mockReturnValueOnce(false) // candidateSubscriptionIdError
      .mockReturnValueOnce(false); // hardwareWalletUsed

    render(<OnboardingIntroStep />);

    fireEvent.click(
      screen.getByRole('button', { name: 'rewardsOnboardingIntroStepSkip' }),
    );

    expect(setOnboardingModalOpen).toHaveBeenCalledWith(false);
    expect(dispatchMock).toHaveBeenCalledWith(
      expect.objectContaining({ type: 'SET_MODAL_OPEN', open: false }),
    );
  });
});
