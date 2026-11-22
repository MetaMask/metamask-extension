import React, { Ref } from 'react';
import { render, screen, fireEvent, within } from '@testing-library/react';
import '@testing-library/jest-dom';
import { ButtonProps } from '@metamask/design-system-react';
import { useSelector } from 'react-redux';

import { setErrorToast } from '../../../../ducks/rewards';
import {
  selectCandidateSubscriptionId,
  selectOptinAllowedForGeo,
  selectOptinAllowedForGeoError,
  selectOptinAllowedForGeoLoading,
} from '../../../../ducks/rewards/selectors';
import { useDispatch, useAppSelector } from '../../../../store/hooks';
import OnboardingMainStep from './OnboardingMainStep';

import {
  REWARDS_ONBOARD_HERO_IMAGE_URL,
  REWARDS_ONBOARD_OPTIN_LEGAL_LEARN_MORE_URL,
  REWARDS_ONBOARD_TERMS_URL,
} from './constants';

jest.mock('../../../../store/hooks', () => ({
  useDispatch: jest.fn(),
  useAppSelector: jest.fn(),
}));

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
const mockedUseSelector = useSelector as jest.Mock;
const mockedUseAppDispatch = useDispatch as jest.Mock;
const mockedUseAppSelector = useAppSelector as jest.Mock;

type SelectorState = {
  candidateSubscriptionId?: unknown;
  optinAllowedForGeo?: boolean | null;
  optinAllowedForGeoError?: boolean;
  optinAllowedForGeoLoading?: boolean;
  rewardsActiveAccountSubscriptionId?: string | null;
};

function setup({
  optinLoading = false,
  optinError = '',
  state = {} as SelectorState,
} = {}) {
  const optin = jest.fn();
  const dispatch = jest.fn();

  mockedUseOptIn.mockReturnValue({
    optinLoading,
    optinError,
    optin,
  });

  mockedUseAppDispatch.mockReturnValue(dispatch);

  const fullState = {
    candidateSubscriptionId: null,
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
    if (selector === selectOptinAllowedForGeo) {
      return fullState.optinAllowedForGeo;
    }
    if (selector === selectOptinAllowedForGeoError) {
      return fullState.optinAllowedForGeoError;
    }
    if (selector === selectOptinAllowedForGeoLoading) {
      return fullState.optinAllowedForGeoLoading;
    }
    return undefined;
  });

  mockedUseAppSelector.mockImplementation((selector: unknown) => {
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

  return { optin, dispatch };
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

  it('disables CTA when opt-in is loading', () => {
    setup({ optinLoading: true });
    render(<OnboardingMainStep />);

    const button = within(
      screen.getByTestId('rewards-onboarding-main-actions'),
    ).getByRole('button');
    expect(button).toBeDisabled();
  });

  it('shows the joining loading text on CTA while opting in', () => {
    setup({ optinLoading: true });
    render(<OnboardingMainStep />);

    const button = within(
      screen.getByTestId('rewards-onboarding-main-actions'),
    ).getByRole('button');
    expect(button).toHaveAttribute(
      'data-loading-text',
      'rewardsOnboardingSignUpLoading',
    );
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

  it('calls optin without referral code when CTA clicked with no code', () => {
    const { optin } = setup();
    render(<OnboardingMainStep />);

    const button = within(
      screen.getByTestId('rewards-onboarding-main-actions'),
    ).getByRole('button');
    fireEvent.click(button);

    expect(optin).toHaveBeenCalled();
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
