import React, { Ref } from 'react';
import { render, screen, fireEvent, within } from '@testing-library/react';
import '@testing-library/jest-dom';
import { ButtonProps } from '@metamask/design-system-react';

import OnboardingStep4 from './OnboardingStep4';
import {
  REWARDS_ONBOARD_OPTIN_LEGAL_LEARN_MORE_URL,
  REWARDS_ONBOARD_TERMS_URL,
} from './constants';

jest.mock('../../../../hooks/useI18nContext', () => ({
  useI18nContext: jest.fn(() => (key: string) => key),
}));

// Partially mock the design-system Button to expose props for assertions
jest.mock('@metamask/design-system-react', () => {
  const actual = jest.requireActual('@metamask/design-system-react');
  const ReactLib = jest.requireActual('react');

  const MockButton = ReactLib.forwardRef(
    (
      {
        children,
        isLoading,
        isDisabled,
        variant,
        size,
        className,
        onClick,
        ...rest
      }: ButtonProps,
      ref: Ref<HTMLButtonElement>,
    ) => (
      <button
        {...rest}
        data-testid="opt-in-button"
        data-variant={variant}
        data-size={size}
        data-loading={isLoading ? 'true' : 'false'}
        data-disabled={isDisabled ? 'true' : 'false'}
        disabled={isDisabled}
        ref={ref}
        onClick={onClick}
        className={className}
      >
        {children}
      </button>
    ),
  );

  return {
    ...actual,
    Button: MockButton,
    ButtonVariant: actual.ButtonVariant,
    ButtonSize: actual.ButtonSize,
  };
});

jest.mock('../../../../hooks/rewards/useOptIn', () => ({
  useOptIn: jest.fn(),
}));

jest.mock('../../../../hooks/rewards/useValidateReferralCode', () => ({
  useValidateReferralCode: jest.fn(),
}));

// Mock ProgressIndicator to verify props passed
jest.mock(
  './ProgressIndicator',
  () => (props: { totalSteps: number; currentStep: number }) => (
    <div
      data-testid="rewards-onboarding-step4-progress"
      data-current-step={props.currentStep}
      data-total-steps={props.totalSteps}
    >
      Progress
    </div>
  ),
);

// Stub RewardsErrorBanner to deterministic testing
jest.mock(
  '../RewardsErrorBanner',
  () =>
    ({ title, description }: { title: string; description: string }) => (
      <div data-testid="rewards-error-banner">
        <span data-testid="banner-title">{title}</span>
        <span data-testid="banner-description">{description}</span>
      </div>
    ),
);

const mockedUseOptIn = jest.requireMock('../../../../hooks/rewards/useOptIn')
  .useOptIn as jest.Mock;
const mockedUseValidateReferralCode = jest.requireMock(
  '../../../../hooks/rewards/useValidateReferralCode',
).useValidateReferralCode as jest.Mock;

function setup({
  referralCode = '',
  isValid = false,
  isValidating = false,
  isUnknownError = false,
  optinLoading = false,
  optinError = '',
} = {}) {
  const setReferralCode = jest.fn();
  const optin = jest.fn();

  mockedUseValidateReferralCode.mockReturnValue({
    referralCode,
    setReferralCode,
    isValidating,
    isValid,
    isUnknownError,
  });

  mockedUseOptIn.mockReturnValue({
    optinLoading,
    optinError,
    optin,
  });

  return { setReferralCode, optin };
}

describe('OnboardingStep4', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Prevent actual window.open
    jest.spyOn(window, 'open').mockImplementation(() => null);
  });

  it('renders layout sections and translation keys', () => {
    setup();
    render(<OnboardingStep4 />);

    expect(
      screen.getByTestId('rewards-onboarding-step4-container'),
    ).toBeInTheDocument();
    expect(
      screen.getByTestId('rewards-onboarding-step4-info'),
    ).toBeInTheDocument();
    expect(
      screen.getByTestId('rewards-onboarding-step4-actions'),
    ).toBeInTheDocument();
    expect(
      screen.getByTestId('rewards-onboarding-step4-legal-disclaimer'),
    ).toBeInTheDocument();

    // Image alt uses title translation key
    expect(
      screen.getByAltText('rewardsOnboardingStep4Title'),
    ).toBeInTheDocument();
    // Heading and referral input label
    expect(screen.getByText('rewardsOnboardingStep4Title')).toBeInTheDocument();
    expect(
      screen.getByText('rewardsOnboardingStep4ReferralCodeInput'),
    ).toBeInTheDocument();
    // Placeholder and button text
    expect(
      screen.getByPlaceholderText(
        'rewardsOnboardingStep4ReferralCodePlaceholder',
      ),
    ).toBeInTheDocument();
    expect(screen.getByText('rewardsOnboardingStepOptIn')).toBeInTheDocument();
  });

  it('passes correct progress props to ProgressIndicator', () => {
    setup();
    render(<OnboardingStep4 />);

    const progress = screen.getByTestId('rewards-onboarding-step4-progress');
    expect(progress).toHaveAttribute('data-current-step', '4');
    expect(progress).toHaveAttribute('data-total-steps', '4');
  });

  it('updates referral code on input change', () => {
    const { setReferralCode } = setup();
    render(<OnboardingStep4 />);

    const input = screen.getByPlaceholderText(
      'rewardsOnboardingStep4ReferralCodePlaceholder',
    );
    fireEvent.change(input, { target: { value: 'ABCDEF' } });
    expect(setReferralCode).toHaveBeenCalledWith('ABCDEF');
  });

  it('shows referral error message when invalid with length >= 6', () => {
    setup({
      referralCode: 'ABCDEF',
      isValid: false,
      isValidating: false,
      isUnknownError: false,
    });
    render(<OnboardingStep4 />);

    expect(
      screen.getByText('rewardsOnboardingStep4ReferralCodeError'),
    ).toBeInTheDocument();
  });

  it('disables opt-in button when loading', () => {
    setup({ optinLoading: true });
    render(<OnboardingStep4 />);
    const button = screen.getByRole('button', {
      name: 'rewardsOnboardingStepOptIn',
    });
    expect(button).toBeDisabled();
  });

  it('disables opt-in button when referral code is invalid and non-empty', () => {
    setup({ referralCode: 'A', isValid: false });
    render(<OnboardingStep4 />);
    const button = within(
      screen.getByTestId('rewards-onboarding-step4-actions'),
    ).getByRole('button', { name: 'rewardsOnboardingStepOptIn' });
    expect(button).toBeDisabled();
  });

  it('disables opt-in button when unknown referral error is present', () => {
    setup({ isUnknownError: true });
    render(<OnboardingStep4 />);
    const button = screen.getByRole('button', {
      name: 'rewardsOnboardingStepOptIn',
    });
    expect(button).toBeDisabled();
  });

  it('enables opt-in button and calls optin with referral code when valid', () => {
    const { optin } = setup({ referralCode: 'REFCODE', isValid: true });
    render(<OnboardingStep4 />);

    const button = within(
      screen.getByTestId('rewards-onboarding-step4-actions'),
    ).getByRole('button', { name: 'rewardsOnboardingStepOptIn' });
    expect(button).not.toBeDisabled();
    fireEvent.click(button);
    expect(optin).toHaveBeenCalledWith('REFCODE');
  });

  it('renders unknown referral error banner when isUnknownErrorReferralCode is true', () => {
    setup({ isUnknownError: true });
    render(<OnboardingStep4 />);

    const banner = screen.getByTestId('rewards-error-banner');
    expect(screen.getByTestId('banner-title')).toHaveTextContent(
      'rewardsOnboardingStep4ReferralCodeUnknownError',
    );
    expect(screen.getByTestId('banner-description')).toHaveTextContent(
      'rewardsOnboardingStep4ReferralCodeUnknownErrorDescription',
    );
    expect(banner).toBeInTheDocument();
  });

  it('renders opt-in error banner with description when optinError is present', () => {
    setup({ optinError: 'server down' });
    render(<OnboardingStep4 />);

    expect(screen.getByTestId('rewards-error-banner')).toBeInTheDocument();
    expect(screen.getByTestId('banner-title')).toHaveTextContent(
      'rewardsOnboardingStep4OptInError',
    );
    expect(screen.getByTestId('banner-description')).toHaveTextContent(
      'server down',
    );
  });

  it('opens legal links with the correct URLs', () => {
    setup();
    render(<OnboardingStep4 />);

    const termsLink = screen.getByText(
      'rewardsOnboardingStep4LegalDisclaimer2',
    );
    fireEvent.click(termsLink);
    expect(window.open).toHaveBeenCalledWith(
      REWARDS_ONBOARD_TERMS_URL,
      '_blank',
      'noopener,noreferrer',
    );

    const learnMoreLink = screen.getByText(
      'rewardsOnboardingStep4LegalDisclaimer4',
    );
    fireEvent.click(learnMoreLink);
    expect(window.open).toHaveBeenCalledWith(
      REWARDS_ONBOARD_OPTIN_LEGAL_LEARN_MORE_URL,
      '_blank',
      'noopener,noreferrer',
    );
  });
});
