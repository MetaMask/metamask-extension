import React, { Ref } from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { ButtonProps } from '@metamask/design-system-react';
import { OnboardingStep } from '../../../../ducks/rewards/types';
import OnboardingIntroStep from './OnboardingIntroStep';

// Mock i18n to return the key for readability in assertions
jest.mock('../../../../hooks/useI18nContext', () => ({
  useI18nContext: jest.fn(() => (key: string) => key),
}));

// Partially mock the design-system Button to expose `isLoading` and `isDisabled` for assertions
jest.mock('@metamask/design-system-react', () => {
  const actual = jest.requireActual('@metamask/design-system-react');
  const ReactLib = jest.requireActual('react');

  const MockButton = ReactLib.forwardRef(
    (
      { children, isLoading, isDisabled, onClick, ...rest }: ButtonProps,
      ref: Ref<HTMLButtonElement>,
    ) => (
      <button
        {...rest}
        // Provide stable attributes to assert loading and disabled states
        data-loading={isLoading ? 'true' : 'false'}
        disabled={isDisabled}
        ref={ref}
        onClick={onClick}
        className={`${rest.className || ''} ${isLoading ? 'mm-button-base--loading' : ''} ${isDisabled ? 'mm-button-base--disabled' : ''}`}
      >
        {children}
      </button>
    ),
  );

  return {
    ...actual,
    Button: MockButton,
  };
});

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

// Mock selectors to avoid brittle sequencing of useSelector calls
jest.mock('../../../../ducks/rewards/selectors', () => ({
  selectOptinAllowedForGeo: jest.fn(),
  selectOptinAllowedForGeoLoading: jest.fn(),
  selectOptinAllowedForGeoError: jest.fn(),
  selectCandidateSubscriptionId: jest.fn(),
}));

// Mock hardware wallet selector
jest.mock('../../../../../shared/modules/selectors', () => ({
  isHardwareWallet: jest.fn(),
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

// Mock candidate subscription ID hook to supply a retry handler
jest.mock('../../../../hooks/rewards/useCandidateSubscriptionId', () => ({
  useCandidateSubscriptionId: jest.fn(),
}));

describe('OnboardingIntroStep', () => {
  const { useSelector, useDispatch } = jest.requireMock('react-redux');
  const { setErrorToast, setOnboardingActiveStep, setOnboardingModalOpen } =
    jest.requireMock('../../../../ducks/rewards');
  const {
    selectOptinAllowedForGeo,
    selectOptinAllowedForGeoLoading,
    selectOptinAllowedForGeoError,
    selectCandidateSubscriptionId,
  } = jest.requireMock('../../../../ducks/rewards/selectors');
  const { isHardwareWallet } = jest.requireMock(
    '../../../../../shared/modules/selectors',
  );
  const { useAppSelector } = jest.requireMock('../../../../store/store');
  const { useGeoRewardsMetadata } = jest.requireMock(
    '../../../../hooks/rewards/useGeoRewardsMetadata',
  );
  const { useCandidateSubscriptionId } = jest.requireMock(
    '../../../../hooks/rewards/useCandidateSubscriptionId',
  );

  const dispatchMock = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    (useDispatch as jest.Mock).mockReturnValue(dispatchMock);
    // Ensure useSelector calls the provided selector function without using any
    (useSelector as jest.Mock).mockImplementation(
      (selector: (state: unknown) => unknown) =>
        // Provide a minimal state shape with metamask.theme to satisfy getTheme
        selector({ metamask: { theme: 'light' } } as unknown),
    );
    // Ensure document has a data-theme attribute for useTheme resolution
    document.documentElement.setAttribute('data-theme', 'light');
    // Default: no active subscription id
    (useAppSelector as jest.Mock).mockReturnValue(undefined);
    // Default geo metadata hook with a retry function
    (useGeoRewardsMetadata as jest.Mock).mockReturnValue({
      fetchGeoRewardsMetadata: jest.fn(),
    });
    // Default candidate subscription ID hook with a retry function
    (useCandidateSubscriptionId as jest.Mock).mockReturnValue({
      fetchCandidateSubscriptionId: jest.fn(),
    });

    // Default selector returns
    (selectOptinAllowedForGeo as jest.Mock).mockReturnValue(true);
    (selectOptinAllowedForGeoLoading as jest.Mock).mockReturnValue(false);
    (selectOptinAllowedForGeoError as jest.Mock).mockReturnValue(false);
    (selectCandidateSubscriptionId as jest.Mock).mockReturnValue(undefined);
    (isHardwareWallet as jest.Mock).mockReturnValue(false);
  });

  it('renders title, description, image, and action buttons', () => {
    // Defaults from beforeEach are sufficient for rendering

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

  it('on confirm: shows error toast for candidate subscription ID fetch failure and includes retry handler', () => {
    const fetchCandidateSubscriptionId = jest.fn();
    (useCandidateSubscriptionId as jest.Mock).mockReturnValue({
      fetchCandidateSubscriptionId,
    });

    // Trigger the first error branch: candidate subscription ID fetch failed
    (selectCandidateSubscriptionId as jest.Mock).mockReturnValue('error');
    (selectOptinAllowedForGeo as jest.Mock).mockReturnValue(true);
    (selectOptinAllowedForGeoLoading as jest.Mock).mockReturnValue(false);
    (selectOptinAllowedForGeoError as jest.Mock).mockReturnValue(false);
    (isHardwareWallet as jest.Mock).mockReturnValue(false);

    render(<OnboardingIntroStep />);

    fireEvent.click(
      screen.getByRole('button', { name: 'rewardsOnboardingIntroStepConfirm' }),
    );

    expect(setErrorToast).toHaveBeenCalledWith(
      expect.objectContaining({
        isOpen: true,
        title: 'rewardsAuthFailTitle',
        description: 'rewardsAuthFailDescription',
        actionText: 'rewardsOnboardingIntroRewardsAuthFailRetry',
        onActionClick: fetchCandidateSubscriptionId,
      }),
    );
    expect(dispatchMock).toHaveBeenCalledWith(
      expect.objectContaining({ type: 'SET_ERROR_TOAST' }),
    );
  });

  it('on confirm: shows error toast for geo check failure and includes retry handler', () => {
    const fetchGeoRewardsMetadata = jest.fn();
    (useGeoRewardsMetadata as jest.Mock).mockReturnValue({
      fetchGeoRewardsMetadata,
    });

    // Trigger the geo check failed branch (only when no active subscription id)
    (selectOptinAllowedForGeo as jest.Mock).mockReturnValue(false);
    (selectOptinAllowedForGeoLoading as jest.Mock).mockReturnValue(false);
    (selectOptinAllowedForGeoError as jest.Mock).mockReturnValue(true);
    (selectCandidateSubscriptionId as jest.Mock).mockReturnValue(undefined);
    (useAppSelector as jest.Mock).mockReturnValue(undefined);
    (isHardwareWallet as jest.Mock).mockReturnValue(false);

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
    (selectOptinAllowedForGeo as jest.Mock).mockReturnValue(false);
    (selectOptinAllowedForGeoLoading as jest.Mock).mockReturnValue(false);
    (selectOptinAllowedForGeoError as jest.Mock).mockReturnValue(false);
    (selectCandidateSubscriptionId as jest.Mock).mockReturnValue(undefined);
    (isHardwareWallet as jest.Mock).mockReturnValue(false);

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
    (selectOptinAllowedForGeo as jest.Mock).mockReturnValue(true);
    (selectOptinAllowedForGeoLoading as jest.Mock).mockReturnValue(false);
    (selectOptinAllowedForGeoError as jest.Mock).mockReturnValue(false);
    (selectCandidateSubscriptionId as jest.Mock).mockReturnValue(undefined);
    (isHardwareWallet as jest.Mock).mockReturnValue(true);

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
    (selectOptinAllowedForGeo as jest.Mock).mockReturnValue(true);
    (selectOptinAllowedForGeoLoading as jest.Mock).mockReturnValue(false);
    (selectOptinAllowedForGeoError as jest.Mock).mockReturnValue(false);
    (selectCandidateSubscriptionId as jest.Mock).mockReturnValue(undefined);
    (isHardwareWallet as jest.Mock).mockReturnValue(false);

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
    (selectOptinAllowedForGeo as jest.Mock).mockReturnValue(true);
    (selectOptinAllowedForGeoLoading as jest.Mock).mockReturnValue(false);
    (selectOptinAllowedForGeoError as jest.Mock).mockReturnValue(false);
    (selectCandidateSubscriptionId as jest.Mock).mockReturnValue(undefined);
    (isHardwareWallet as jest.Mock).mockReturnValue(false);

    render(<OnboardingIntroStep />);

    fireEvent.click(
      screen.getByRole('button', { name: 'rewardsOnboardingIntroStepSkip' }),
    );

    expect(setOnboardingModalOpen).toHaveBeenCalledWith(false);
    expect(dispatchMock).toHaveBeenCalledWith(
      expect.objectContaining({ type: 'SET_MODAL_OPEN', open: false }),
    );
  });

  it('disables confirm button when rewardsActiveAccountSubscriptionId is set', () => {
    (selectOptinAllowedForGeo as jest.Mock).mockReturnValue(true);
    (selectOptinAllowedForGeoLoading as jest.Mock).mockReturnValue(false);
    (selectOptinAllowedForGeoError as jest.Mock).mockReturnValue(false);
    (selectCandidateSubscriptionId as jest.Mock).mockReturnValue(undefined);
    (isHardwareWallet as jest.Mock).mockReturnValue(false);
    (useAppSelector as jest.Mock).mockReturnValue('subscription-123');

    render(<OnboardingIntroStep />);

    const confirmButton = screen.getByRole('button', {
      name: 'rewardsOnboardingIntroStepConfirm',
    });
    expect(confirmButton).toBeDisabled();
  });

  it('disables confirm button when candidateSubscriptionId is pending', () => {
    (selectOptinAllowedForGeo as jest.Mock).mockReturnValue(true);
    (selectOptinAllowedForGeoLoading as jest.Mock).mockReturnValue(false);
    (selectOptinAllowedForGeoError as jest.Mock).mockReturnValue(false);
    (selectCandidateSubscriptionId as jest.Mock).mockReturnValue('pending');
    (isHardwareWallet as jest.Mock).mockReturnValue(false);
    (useAppSelector as jest.Mock).mockReturnValue(undefined);

    render(<OnboardingIntroStep />);

    const confirmButton = screen.getByRole('button', {
      name: 'rewardsOnboardingIntroStepConfirm',
    });
    expect(confirmButton).toBeDisabled();
  });

  it('disables confirm button when candidateSubscriptionId is retry', () => {
    (selectOptinAllowedForGeo as jest.Mock).mockReturnValue(true);
    (selectOptinAllowedForGeoLoading as jest.Mock).mockReturnValue(false);
    (selectOptinAllowedForGeoError as jest.Mock).mockReturnValue(false);
    (selectCandidateSubscriptionId as jest.Mock).mockReturnValue('retry');
    (isHardwareWallet as jest.Mock).mockReturnValue(false);
    (useAppSelector as jest.Mock).mockReturnValue(undefined);

    render(<OnboardingIntroStep />);

    const confirmButton = screen.getByRole('button', {
      name: 'rewardsOnboardingIntroStepConfirm',
    });
    expect(confirmButton).toBeDisabled();
  });

  it('disables confirm button when optinAllowedForGeoLoading is true', () => {
    (selectOptinAllowedForGeo as jest.Mock).mockReturnValue(true);
    (selectOptinAllowedForGeoLoading as jest.Mock).mockReturnValue(true);
    (selectOptinAllowedForGeoError as jest.Mock).mockReturnValue(false);
    (selectCandidateSubscriptionId as jest.Mock).mockReturnValue(undefined);
    (isHardwareWallet as jest.Mock).mockReturnValue(false);
    (useAppSelector as jest.Mock).mockReturnValue(undefined);

    render(<OnboardingIntroStep />);

    const confirmButton = screen.getByRole('button', {
      name: 'rewardsOnboardingIntroStepConfirm',
    });
    expect(confirmButton).toBeDisabled();
  });

  it('shows loading state when optinAllowedForGeoLoading is true', () => {
    (selectOptinAllowedForGeo as jest.Mock).mockReturnValue(true);
    (selectOptinAllowedForGeoLoading as jest.Mock).mockReturnValue(true);
    (selectOptinAllowedForGeoError as jest.Mock).mockReturnValue(false);
    (selectCandidateSubscriptionId as jest.Mock).mockReturnValue(undefined);
    (isHardwareWallet as jest.Mock).mockReturnValue(false);
    (useAppSelector as jest.Mock).mockReturnValue(undefined);

    render(<OnboardingIntroStep />);

    const confirmButton = screen.getByRole('button', {
      name: 'rewardsOnboardingIntroStepConfirm',
    });
    expect(confirmButton).toHaveClass('mm-button-base--loading');
  });

  it('shows loading state when candidateSubscriptionId is pending', () => {
    (selectOptinAllowedForGeo as jest.Mock).mockReturnValue(true);
    (selectOptinAllowedForGeoLoading as jest.Mock).mockReturnValue(false);
    (selectOptinAllowedForGeoError as jest.Mock).mockReturnValue(false);
    (selectCandidateSubscriptionId as jest.Mock).mockReturnValue('pending');
    (isHardwareWallet as jest.Mock).mockReturnValue(false);
    (useAppSelector as jest.Mock).mockReturnValue(undefined);

    render(<OnboardingIntroStep />);

    const confirmButton = screen.getByRole('button', {
      name: 'rewardsOnboardingIntroStepConfirm',
    });
    expect(confirmButton).toHaveClass('mm-button-base--loading');
  });

  it('shows loading state when candidateSubscriptionId is retry', () => {
    (selectOptinAllowedForGeo as jest.Mock).mockReturnValue(true);
    (selectOptinAllowedForGeoLoading as jest.Mock).mockReturnValue(false);
    (selectOptinAllowedForGeoError as jest.Mock).mockReturnValue(false);
    (selectCandidateSubscriptionId as jest.Mock).mockReturnValue('retry');
    (isHardwareWallet as jest.Mock).mockReturnValue(false);
    (useAppSelector as jest.Mock).mockReturnValue(undefined);

    render(<OnboardingIntroStep />);

    const confirmButton = screen.getByRole('button', {
      name: 'rewardsOnboardingIntroStepConfirm',
    });
    expect(confirmButton).toHaveClass('mm-button-base--loading');
  });

  it('does not proceed when rewardsActiveAccountSubscriptionId is set and button is clicked', () => {
    (selectOptinAllowedForGeo as jest.Mock).mockReturnValue(true);
    (selectOptinAllowedForGeoLoading as jest.Mock).mockReturnValue(false);
    (selectOptinAllowedForGeoError as jest.Mock).mockReturnValue(false);
    (selectCandidateSubscriptionId as jest.Mock).mockReturnValue(undefined);
    (isHardwareWallet as jest.Mock).mockReturnValue(false);
    (useAppSelector as jest.Mock).mockReturnValue('subscription-123');

    render(<OnboardingIntroStep />);

    const confirmButton = screen.getByRole('button', {
      name: 'rewardsOnboardingIntroStepConfirm',
    });
    expect(confirmButton).toBeDisabled();
    // Even if we try to click (which shouldn't work when disabled), verify no action
    fireEvent.click(confirmButton);
    expect(setOnboardingActiveStep).not.toHaveBeenCalled();
  });

  it('calls useGeoRewardsMetadata with enabled true when no active subscription and no candidate subscription', () => {
    (selectOptinAllowedForGeo as jest.Mock).mockReturnValue(true);
    (selectOptinAllowedForGeoLoading as jest.Mock).mockReturnValue(false);
    (selectOptinAllowedForGeoError as jest.Mock).mockReturnValue(false);
    (selectCandidateSubscriptionId as jest.Mock).mockReturnValue(undefined);
    (isHardwareWallet as jest.Mock).mockReturnValue(false);
    (useAppSelector as jest.Mock).mockReturnValue(undefined);

    render(<OnboardingIntroStep />);

    expect(useGeoRewardsMetadata).toHaveBeenCalledWith({
      enabled: true,
    });
  });

  it('calls useGeoRewardsMetadata with enabled true when no active subscription and candidate subscription is error', () => {
    (selectOptinAllowedForGeo as jest.Mock).mockReturnValue(true);
    (selectOptinAllowedForGeoLoading as jest.Mock).mockReturnValue(false);
    (selectOptinAllowedForGeoError as jest.Mock).mockReturnValue(false);
    (selectCandidateSubscriptionId as jest.Mock).mockReturnValue('error');
    (isHardwareWallet as jest.Mock).mockReturnValue(false);
    (useAppSelector as jest.Mock).mockReturnValue(undefined);

    render(<OnboardingIntroStep />);

    expect(useGeoRewardsMetadata).toHaveBeenCalledWith({
      enabled: true,
    });
  });

  it('calls useGeoRewardsMetadata with enabled false when active subscription exists', () => {
    (selectOptinAllowedForGeo as jest.Mock).mockReturnValue(true);
    (selectOptinAllowedForGeoLoading as jest.Mock).mockReturnValue(false);
    (selectOptinAllowedForGeoError as jest.Mock).mockReturnValue(false);
    (selectCandidateSubscriptionId as jest.Mock).mockReturnValue(undefined);
    (isHardwareWallet as jest.Mock).mockReturnValue(false);
    (useAppSelector as jest.Mock).mockReturnValue('subscription-123');

    render(<OnboardingIntroStep />);

    expect(useGeoRewardsMetadata).toHaveBeenCalledWith({
      enabled: false,
    });
  });

  it('calls useGeoRewardsMetadata with enabled false when candidate subscription exists and is not error', () => {
    (selectOptinAllowedForGeo as jest.Mock).mockReturnValue(true);
    (selectOptinAllowedForGeoLoading as jest.Mock).mockReturnValue(false);
    (selectOptinAllowedForGeoError as jest.Mock).mockReturnValue(false);
    (selectCandidateSubscriptionId as jest.Mock).mockReturnValue(
      'valid-subscription-id',
    );
    (isHardwareWallet as jest.Mock).mockReturnValue(false);
    (useAppSelector as jest.Mock).mockReturnValue(undefined);

    render(<OnboardingIntroStep />);

    expect(useGeoRewardsMetadata).toHaveBeenCalledWith({
      enabled: false,
    });
  });
});
