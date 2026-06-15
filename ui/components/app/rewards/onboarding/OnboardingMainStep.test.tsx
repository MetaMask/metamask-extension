import React, { Ref } from 'react';
import { render, screen, fireEvent, within } from '@testing-library/react';
import '@testing-library/jest-dom';
import { ButtonProps } from '@metamask/design-system-react';
import { useDispatch, useSelector } from 'react-redux';

import { setErrorToast } from '../../../../ducks/rewards';
import {
  selectCandidateSubscriptionId,
  selectOnboardingReferralCode,
  selectOptinAllowedForGeo,
  selectOptinAllowedForGeoError,
  selectOptinAllowedForGeoLoading,
} from '../../../../ducks/rewards/selectors';
import OnboardingMainStep from './OnboardingMainStep';
import {
  REWARDS_ONBOARD_HERO_IMAGE_URL,
  REWARDS_ONBOARD_OPTIN_LEGAL_LEARN_MORE_URL,
  REWARDS_ONBOARD_TERMS_URL,
} from './constants';

jest.mock('../../../../hooks/useI18nContext', () => ({
  useI18nContext: jest.fn(
    () => (key: string, substitutions?: (string | React.ReactNode)[]) => {
      if (substitutions && Array.isArray(substitutions)) {
        return [key, ...substitutions];
      }
      return key;
    },
  ),
}));

jest.mock('@metamask/design-system-react', () => {
  const actual = jest.requireActual('@metamask/design-system-react');
  const ReactLib = jest.requireActual('react');

  const MockButton = ReactLib.forwardRef(
    (
      {
        children,
        isLoading,
        loadingText,
        isDisabled,
        variant,
        size,
        className,
        onClick,
        ...rest
      }: ButtonProps & { loadingText?: string },
      ref: Ref<HTMLButtonElement>,
    ) => (
      <button
        {...rest}
        data-testid="opt-in-button"
        data-variant={variant}
        data-size={size}
        data-loading={isLoading ? 'true' : 'false'}
        data-loading-text={loadingText}
        data-disabled={isDisabled ? 'true' : 'false'}
        disabled={isDisabled}
        ref={ref}
        onClick={onClick}
        className={className}
      >
        {isLoading && loadingText ? loadingText : children}
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
  REFERRAL_CODE_MIN_LENGTH: 3,
  useValidateReferralCode: jest.fn(),
}));

jest.mock('../../../../hooks/rewards/useGeoRewardsMetadata', () => ({
  useGeoRewardsMetadata: jest.fn(() => ({
    fetchGeoRewardsMetadata: jest.fn(),
  })),
}));

jest.mock('../../../../hooks/rewards/useCandidateSubscriptionId', () => ({
  useCandidateSubscriptionId: jest.fn(() => ({
    fetchCandidateSubscriptionId: jest.fn(),
  })),
}));

jest.mock('react-redux', () => ({
  useSelector: jest.fn(),
  useDispatch: jest.fn(),
}));

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
const mockedUseSelector = useSelector as jest.Mock;
const mockedUseDispatch = useDispatch as jest.Mock;

type SelectorState = {
  candidateSubscriptionId?: unknown;
  onboardingReferralCode?: string | null;
  optinAllowedForGeo?: boolean | null;
  optinAllowedForGeoError?: boolean;
  optinAllowedForGeoLoading?: boolean;
  rewardsActiveAccountSubscriptionId?: string | null;
};

function setup({
  referralCode = '',
  isValid = false,
  isValidating = false,
  isUnknownError = false,
  optinLoading = false,
  optinError = '',
  state = {} as SelectorState,
} = {}) {
  const setReferralCode = jest.fn();
  const optin = jest.fn();
  const dispatch = jest.fn();

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

  mockedUseDispatch.mockReturnValue(dispatch);

  const fullState = {
    candidateSubscriptionId: null,
    onboardingReferralCode: null,
    optinAllowedForGeo: true,
    optinAllowedForGeoError: false,
    optinAllowedForGeoLoading: false,
    rewardsActiveAccountSubscriptionId: null,
    ...state,
  };

  mockedUseSelector.mockImplementation((selector: unknown) => {
    if (selector === selectCandidateSubscriptionId) {
      return fullState.candidateSubscriptionId;
    }
    if (selector === selectOnboardingReferralCode) {
      return fullState.onboardingReferralCode;
    }
    if (selector === selectOptinAllowedForGeo) {
      return fullState.optinAllowedForGeo;
    }
    if (selector === selectOptinAllowedForGeoError) {
      return fullState.optinAllowedForGeoError;
    }
    if (selector === selectOptinAllowedForGeoLoading) {
      return fullState.optinAllowedForGeoLoading;
    }
    // useAppSelector path: select by callback against fake state
    if (typeof selector === 'function') {
      return (selector as (s: unknown) => unknown)({
        metamask: {
          rewardsActiveAccount: {
            subscriptionId: fullState.rewardsActiveAccountSubscriptionId,
          },
        },
      });
    }
    return undefined;
  });

  return { setReferralCode, optin, dispatch };
}

describe('OnboardingMainStep', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(window, 'open').mockImplementation(() => null);
  });

  it('renders hero, title, description, CTA, and legal disclaimer', () => {
    setup();
    render(<OnboardingMainStep />);

    expect(
      screen.getByTestId('rewards-onboarding-main-container'),
    ).toBeInTheDocument();
    expect(
      screen.getByTestId('rewards-onboarding-main-image'),
    ).toBeInTheDocument();
    expect(
      screen.getByTestId('rewards-onboarding-main-info'),
    ).toBeInTheDocument();
    expect(
      screen.getByTestId('rewards-onboarding-main-actions'),
    ).toBeInTheDocument();
    expect(
      screen.getByTestId('rewards-onboarding-main-legal-disclaimer'),
    ).toBeInTheDocument();

    expect(screen.getByText('rewardsOnboardingTitle')).toBeInTheDocument();
    expect(
      screen.getByText('rewardsOnboardingDescription'),
    ).toBeInTheDocument();
    expect(screen.getByText('rewardsOnboardingSignUp')).toBeInTheDocument();
  });

  it('uses the shared mobile hero image URL', () => {
    setup();
    render(<OnboardingMainStep />);

    const hero = screen.getByAltText(
      'rewardsOnboardingTitle',
    ) as HTMLImageElement;
    expect(hero.src).toBe(REWARDS_ONBOARD_HERO_IMAGE_URL);
  });

  it('hides referral input by default and reveals it via the toggle', () => {
    setup();
    render(<OnboardingMainStep />);

    expect(
      screen.queryByPlaceholderText('rewardsOnboardingReferralCodePlaceholder'),
    ).not.toBeInTheDocument();

    fireEvent.click(screen.getByText('rewardsOnboardingReferralPrompt'));

    expect(
      screen.getByPlaceholderText('rewardsOnboardingReferralCodePlaceholder'),
    ).toBeInTheDocument();
    expect(
      screen.getByText('rewardsOnboardingReferralHide'),
    ).toBeInTheDocument();
  });

  it('focuses the referral input when it becomes visible', () => {
    setup();
    render(<OnboardingMainStep />);

    fireEvent.click(screen.getByText('rewardsOnboardingReferralPrompt'));

    const input = screen.getByPlaceholderText(
      'rewardsOnboardingReferralCodePlaceholder',
    );
    expect(input).toHaveFocus();
  });

  it('renders the referral input above the CTA and the toggle below it', () => {
    setup();
    render(<OnboardingMainStep />);

    fireEvent.click(screen.getByText('rewardsOnboardingReferralPrompt'));

    const input = screen.getByPlaceholderText(
      'rewardsOnboardingReferralCodePlaceholder',
    );
    const cta = within(
      screen.getByTestId('rewards-onboarding-main-actions'),
    ).getByRole('button');
    const toggle = screen.getByText('rewardsOnboardingReferralHide');

    const all = Array.from(document.body.querySelectorAll('*'));
    expect(all.indexOf(input)).toBeLessThan(all.indexOf(cta));
    expect(all.indexOf(cta)).toBeLessThan(all.indexOf(toggle));
  });

  it('clears the referral code when toggling the input back to hidden', () => {
    const { setReferralCode } = setup({
      referralCode: 'ABCDEF',
      isValid: true,
    });
    render(<OnboardingMainStep />);

    fireEvent.click(screen.getByText('rewardsOnboardingReferralPrompt'));
    fireEvent.click(screen.getByText('rewardsOnboardingReferralHide'));

    expect(setReferralCode).toHaveBeenCalledWith('');
  });

  it('shows the referral input pre-revealed when a referral code is prefilled from the store', () => {
    setup({
      state: { onboardingReferralCode: 'abcdef' },
      referralCode: 'ABCDEF',
      isValid: true,
    });
    render(<OnboardingMainStep />);

    expect(
      screen.getByPlaceholderText('rewardsOnboardingReferralCodePlaceholder'),
    ).toBeInTheDocument();
  });

  it('seeds validation with the trimmed + uppercased referral from the store', () => {
    setup({ state: { onboardingReferralCode: ' abcd ' } });
    const impl = jest.fn((initialValue?: string) => ({
      referralCode: initialValue ?? '',
      setReferralCode: jest.fn(),
      isValidating: false,
      isValid: false,
      isUnknownError: false,
    }));
    mockedUseValidateReferralCode.mockImplementation(impl);

    render(<OnboardingMainStep />);

    expect(impl).toHaveBeenCalledWith('ABCD');
  });

  it('shows referral error message after validation completes and code is invalid', () => {
    setup({
      referralCode: 'ABCDEF',
      isValid: false,
      isValidating: false,
      state: { onboardingReferralCode: 'ABCDEF' },
    });
    render(<OnboardingMainStep />);

    expect(
      screen.getByText('rewardsOnboardingReferralCodeError'),
    ).toBeInTheDocument();
  });

  it('shows referral error message for vanity codes once validation reports invalid', () => {
    setup({
      referralCode: 'BANKLESS',
      isValid: false,
      isValidating: false,
      state: { onboardingReferralCode: 'BANKLESS' },
    });
    render(<OnboardingMainStep />);

    expect(
      screen.getByText('rewardsOnboardingReferralCodeError'),
    ).toBeInTheDocument();
  });

  it('does not show error while validation is still in flight', () => {
    setup({
      referralCode: 'ABC',
      isValid: false,
      isValidating: true,
      state: { onboardingReferralCode: 'ABC' },
    });
    render(<OnboardingMainStep />);

    expect(
      screen.queryByText('rewardsOnboardingReferralCodeError'),
    ).not.toBeInTheDocument();
  });

  it('renders the unknown referral error banner when validation throws', () => {
    setup({
      isUnknownError: true,
      state: { onboardingReferralCode: 'ABCDEF' },
    });
    render(<OnboardingMainStep />);

    expect(screen.getByTestId('banner-title')).toHaveTextContent(
      'rewardsOnboardingReferralCodeUnknownError',
    );
    expect(screen.getByTestId('banner-description')).toHaveTextContent(
      'rewardsOnboardingReferralCodeUnknownErrorDescription',
    );
  });

  it('disables CTA when opt-in is loading', () => {
    setup({ optinLoading: true });
    render(<OnboardingMainStep />);

    const button = within(
      screen.getByTestId('rewards-onboarding-main-actions'),
    ).getByRole('button');
    expect(button).toBeDisabled();
  });

  it('shows the joining loading text on CTA and hides the referral toggle while opting in', () => {
    setup({ optinLoading: true });
    render(<OnboardingMainStep />);

    const button = within(
      screen.getByTestId('rewards-onboarding-main-actions'),
    ).getByRole('button');
    expect(button).toHaveAttribute(
      'data-loading-text',
      'rewardsOnboardingSignUpLoading',
    );
    expect(
      screen.queryByTestId('rewards-onboarding-main-referral-toggle'),
    ).not.toBeInTheDocument();
  });

  it('shows the checking-region loading text on CTA when geo metadata is loading', () => {
    setup({ state: { optinAllowedForGeoLoading: true } });
    render(<OnboardingMainStep />);

    const button = within(
      screen.getByTestId('rewards-onboarding-main-actions'),
    ).getByRole('button');
    expect(button).toHaveAttribute(
      'data-loading-text',
      'rewardsOnboardingCheckingRegion',
    );
  });

  it('shows the verifying-referral loading text on CTA while validating a referral code', () => {
    setup({ isValidating: true });
    render(<OnboardingMainStep />);

    const button = within(
      screen.getByTestId('rewards-onboarding-main-actions'),
    ).getByRole('button');
    expect(button).toHaveAttribute(
      'data-loading-text',
      'rewardsOptInVerifyingReferralCode',
    );
  });

  it('disables CTA when referral code is non-empty but invalid', () => {
    setup({ referralCode: 'A', isValid: false });
    render(<OnboardingMainStep />);

    const button = within(
      screen.getByTestId('rewards-onboarding-main-actions'),
    ).getByRole('button');
    expect(button).toBeDisabled();
  });

  it('calls optin without referral code when CTA clicked with no code', () => {
    const { optin } = setup();
    render(<OnboardingMainStep />);

    const button = within(
      screen.getByTestId('rewards-onboarding-main-actions'),
    ).getByRole('button');
    fireEvent.click(button);

    expect(optin).toHaveBeenCalledWith(undefined);
  });

  it('calls optin with the referral code when CTA clicked with a valid code', () => {
    const { optin } = setup({ referralCode: 'REFCOD', isValid: true });
    render(<OnboardingMainStep />);

    const button = within(
      screen.getByTestId('rewards-onboarding-main-actions'),
    ).getByRole('button');
    fireEvent.click(button);

    expect(optin).toHaveBeenCalledWith('REFCOD');
  });

  it('dispatches an unsupported-region toast and does not opt-in when geo blocks', () => {
    const { optin, dispatch } = setup({
      state: { optinAllowedForGeo: false },
    });
    render(<OnboardingMainStep />);

    const button = within(
      screen.getByTestId('rewards-onboarding-main-actions'),
    ).getByRole('button');
    fireEvent.click(button);

    expect(optin).not.toHaveBeenCalled();
    expect(dispatch).toHaveBeenCalledWith(
      setErrorToast(
        expect.objectContaining({
          isOpen: true,
          title: 'rewardsOnboardingIntroUnsupportedRegionTitle',
          description: 'rewardsOnboardingIntroUnsupportedRegionDescription',
        }),
      ),
    );
  });

  it('dispatches a geo-check-failed toast and does not opt-in when geo metadata errors', () => {
    const { optin, dispatch } = setup({
      state: {
        optinAllowedForGeo: null,
        optinAllowedForGeoError: true,
        optinAllowedForGeoLoading: false,
      },
    });
    render(<OnboardingMainStep />);

    const button = within(
      screen.getByTestId('rewards-onboarding-main-actions'),
    ).getByRole('button');
    fireEvent.click(button);

    expect(optin).not.toHaveBeenCalled();
    expect(dispatch).toHaveBeenCalledWith(
      setErrorToast(
        expect.objectContaining({
          title: 'rewardsOnboardingIntroGeoCheckFailedTitle',
        }),
      ),
    );
  });

  it('dispatches an auth-fail toast when candidate subscription id is in error state', () => {
    const { optin, dispatch } = setup({
      state: { candidateSubscriptionId: 'error' },
    });
    render(<OnboardingMainStep />);

    const button = within(
      screen.getByTestId('rewards-onboarding-main-actions'),
    ).getByRole('button');
    fireEvent.click(button);

    expect(optin).not.toHaveBeenCalled();
    expect(dispatch).toHaveBeenCalledWith(
      setErrorToast(
        expect.objectContaining({
          title: 'rewardsAuthFailTitle',
        }),
      ),
    );
  });

  it('renders the opt-in error banner when optinError is present', () => {
    setup({ optinError: 'server down' });
    render(<OnboardingMainStep />);

    expect(screen.getByTestId('banner-title')).toHaveTextContent(
      'rewardsOnboardingOptInError',
    );
    expect(screen.getByTestId('banner-description')).toHaveTextContent(
      'server down',
    );
  });

  it('opens the legal links with the correct URLs', () => {
    setup();
    render(<OnboardingMainStep />);

    fireEvent.click(
      screen.getByText('rewardsOnboardingLegalDisclaimerTermsLink'),
    );
    expect(window.open).toHaveBeenCalledWith(
      REWARDS_ONBOARD_TERMS_URL,
      '_blank',
      'noopener,noreferrer',
    );

    fireEvent.click(
      screen.getByText('rewardsOnboardingLegalDisclaimerLearnMoreLink'),
    );
    expect(window.open).toHaveBeenCalledWith(
      REWARDS_ONBOARD_OPTIN_LEGAL_LEARN_MORE_URL,
      '_blank',
      'noopener,noreferrer',
    );
  });
});
