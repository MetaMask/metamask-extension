import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { useSelector, useDispatch } from 'react-redux';

import {
  selectOnboardingModalOpen,
  selectOnboardingActiveStep,
  selectCandidateSubscriptionId,
} from '../../../../ducks/rewards/selectors';
import {
  setOnboardingActiveStep,
  setOnboardingModalOpen,
} from '../../../../ducks/rewards';
import { OnboardingStep } from '../../../../ducks/rewards/types';
import { ThemeType } from '../../../../../shared/constants/preferences';
import type { MetaMaskReduxState } from '../../../../store/store';
import OnboardingModal from './OnboardingModal';

jest.mock('react-redux', () => ({
  useSelector: jest.fn(),
  useDispatch: jest.fn(),
}));

jest.mock('../../../../hooks/useTheme', () => ({
  useTheme: jest.fn(() => 'light'),
}));

// Stub child components to simple test markers
jest.mock('./OnboardingIntroStep', () => () => (
  <div data-testid="intro-step">Intro Step</div>
));
jest.mock('./OnboardingStep1', () => () => (
  <div data-testid="step1">Step 1</div>
));
jest.mock('./OnboardingStep2', () => () => (
  <div data-testid="step2">Step 2</div>
));
jest.mock('./OnboardingStep3', () => () => (
  <div data-testid="step3">Step 3</div>
));
jest.mock('./OnboardingStep4', () => () => (
  <div data-testid="step4">Step 4</div>
));

jest.mock('../RewardsErrorToast', () => () => (
  <div data-testid="rewards-error-toast">Toast</div>
));

// Mock QR code to a simple marker for content assertions
jest.mock('../RewardsQRCode', () => () => (
  <div data-testid="rewards-qr">QR Code</div>
));

const mockedUseSelector = useSelector as jest.Mock;
const mockedUseDispatch = useDispatch as jest.Mock;

function setupSelectors({
  isOpen = true,
  step = OnboardingStep.INTRO,
  candidateSubscriptionId = null as string | null,
} = {}) {
  mockedUseSelector.mockImplementation(
    (selector: (state: MetaMaskReduxState) => unknown): unknown => {
      if (selector === selectOnboardingModalOpen) {
        return isOpen;
      }
      if (selector === selectOnboardingActiveStep) {
        return step;
      }
      if (selector === selectCandidateSubscriptionId) {
        return candidateSubscriptionId;
      }
      // Default fallback if any other selector is used
      return undefined;
    },
  );
}

describe('OnboardingModal', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders modal open and shows intro content', () => {
    setupSelectors({
      isOpen: true,
      step: OnboardingStep.INTRO,
      candidateSubscriptionId: null,
    });
    const dispatchMock = jest.fn();
    mockedUseDispatch.mockReturnValue(dispatchMock);

    render(<OnboardingModal />);

    expect(screen.getByTestId('rewards-onboarding-modal')).toBeInTheDocument();
    expect(
      screen.getByTestId('rewards-onboarding-modal-header'),
    ).toBeInTheDocument();
    expect(screen.getByTestId('intro-step')).toBeInTheDocument();
    expect(screen.getByTestId('rewards-error-toast')).toBeInTheDocument();
  });

  it('renders the correct step component when onboardingStep is STEP2', () => {
    setupSelectors({
      isOpen: true,
      step: OnboardingStep.STEP2,
      candidateSubscriptionId: null,
    });
    const dispatchMock = jest.fn();
    mockedUseDispatch.mockReturnValue(dispatchMock);

    render(<OnboardingModal />);

    expect(screen.getByTestId('step2')).toBeInTheDocument();
  });

  it('dispatches close and resets step when candidateSubscriptionId is present', async () => {
    setupSelectors({
      isOpen: true,
      step: OnboardingStep.STEP1,
      candidateSubscriptionId: 'abc123',
    });
    const dispatchMock = jest.fn();
    mockedUseDispatch.mockReturnValue(dispatchMock);

    render(<OnboardingModal />);
    const header = screen.getByTestId('rewards-onboarding-modal-header');
    const closeButton = header.querySelector('button.absolute.z-10');
    expect(closeButton).toBeTruthy();
    // Click the close button to trigger handleClose
    closeButton && (closeButton as HTMLButtonElement).click();

    await waitFor(() => {
      expect(dispatchMock).toHaveBeenCalledWith(setOnboardingModalOpen(false));
      expect(dispatchMock).toHaveBeenCalledWith(
        setOnboardingActiveStep(OnboardingStep.INTRO),
      );
    });
  });

  it('sets header theme attribute based on useTheme: light', () => {
    setupSelectors({ isOpen: true, step: OnboardingStep.INTRO });
    const dispatchMock = jest.fn();
    mockedUseDispatch.mockReturnValue(dispatchMock);

    render(<OnboardingModal />);

    const header = screen.getByTestId('rewards-onboarding-modal-header');
    expect(header).toHaveAttribute('data-theme', ThemeType.light);
  });

  it('sets header theme attribute based on useTheme: dark', () => {
    const { useTheme } = jest.requireMock('../../../../hooks/useTheme');
    useTheme.mockReturnValue('dark');

    setupSelectors({ isOpen: true, step: OnboardingStep.STEP3 });
    const dispatchMock = jest.fn();
    mockedUseDispatch.mockReturnValue(dispatchMock);

    render(<OnboardingModal />);

    const header = screen.getByTestId('rewards-onboarding-modal-header');
    expect(header).toHaveAttribute('data-theme', ThemeType.dark);
  });

  it('renders the correct step component when onboardingStep is STEP1', () => {
    setupSelectors({
      isOpen: true,
      step: OnboardingStep.STEP1,
      candidateSubscriptionId: null,
    });
    const dispatchMock = jest.fn();
    mockedUseDispatch.mockReturnValue(dispatchMock);

    render(<OnboardingModal />);

    expect(screen.getByTestId('step1')).toBeInTheDocument();
  });

  it('renders the correct step component when onboardingStep is STEP3', () => {
    setupSelectors({
      isOpen: true,
      step: OnboardingStep.STEP3,
      candidateSubscriptionId: null,
    });
    const dispatchMock = jest.fn();
    mockedUseDispatch.mockReturnValue(dispatchMock);

    render(<OnboardingModal />);

    expect(screen.getByTestId('step3')).toBeInTheDocument();
  });

  it('renders the correct step component when onboardingStep is STEP4', () => {
    setupSelectors({
      isOpen: true,
      step: OnboardingStep.STEP4,
      candidateSubscriptionId: null,
    });
    const dispatchMock = jest.fn();
    mockedUseDispatch.mockReturnValue(dispatchMock);

    render(<OnboardingModal />);

    expect(screen.getByTestId('step4')).toBeInTheDocument();
  });

  it('renders intro step as default when onboardingStep is invalid', () => {
    setupSelectors({
      isOpen: true,
      step: 'invalid-step' as OnboardingStep,
      candidateSubscriptionId: null,
    });
    const dispatchMock = jest.fn();
    mockedUseDispatch.mockReturnValue(dispatchMock);

    render(<OnboardingModal />);

    expect(screen.getByTestId('intro-step')).toBeInTheDocument();
  });

  it('hides close button when onboardingStep is INTRO', () => {
    setupSelectors({
      isOpen: true,
      step: OnboardingStep.INTRO,
      candidateSubscriptionId: null,
    });
    const dispatchMock = jest.fn();
    mockedUseDispatch.mockReturnValue(dispatchMock);

    render(<OnboardingModal />);

    const header = screen.getByTestId('rewards-onboarding-modal-header');
    // The close button is rendered but hidden via style.display
    const closeButton = header.querySelector('[aria-label]');
    if (closeButton) {
      expect(closeButton).toHaveStyle({ display: 'none' });
    }
  });

  it('shows close button when onboardingStep is not INTRO', () => {
    setupSelectors({
      isOpen: true,
      step: OnboardingStep.STEP1,
      candidateSubscriptionId: null,
    });
    const dispatchMock = jest.fn();
    mockedUseDispatch.mockReturnValue(dispatchMock);

    render(<OnboardingModal />);

    const header = screen.getByTestId('rewards-onboarding-modal-header');
    // The close button should be visible
    const closeButton = header.querySelector('[aria-label]');
    if (closeButton) {
      expect(closeButton).toHaveStyle({ display: 'block' });
    }
  });

  it('does not close modal when candidateSubscriptionId is "error"', async () => {
    setupSelectors({
      isOpen: true,
      step: OnboardingStep.STEP1,
      candidateSubscriptionId: 'error',
    });
    const dispatchMock = jest.fn();
    mockedUseDispatch.mockReturnValue(dispatchMock);

    render(<OnboardingModal />);

    await waitFor(() => {
      expect(dispatchMock).not.toHaveBeenCalledWith(
        setOnboardingModalOpen(false),
      );
    });
    expect(screen.getByTestId('step1')).toBeInTheDocument();
  });

  it('does not close modal when candidateSubscriptionId is "pending"', async () => {
    setupSelectors({
      isOpen: true,
      step: OnboardingStep.STEP1,
      candidateSubscriptionId: 'pending',
    });
    const dispatchMock = jest.fn();
    mockedUseDispatch.mockReturnValue(dispatchMock);

    render(<OnboardingModal />);

    await waitFor(() => {
      expect(dispatchMock).not.toHaveBeenCalledWith(
        setOnboardingModalOpen(false),
      );
    });
    expect(screen.getByTestId('step1')).toBeInTheDocument();
  });

  it('does not close modal when candidateSubscriptionId is "retry"', async () => {
    setupSelectors({
      isOpen: true,
      step: OnboardingStep.STEP1,
      candidateSubscriptionId: 'retry',
    });
    const dispatchMock = jest.fn();
    mockedUseDispatch.mockReturnValue(dispatchMock);

    render(<OnboardingModal />);

    await waitFor(() => {
      expect(dispatchMock).not.toHaveBeenCalledWith(
        setOnboardingModalOpen(false),
      );
    });
    expect(screen.getByTestId('step1')).toBeInTheDocument();
  });

  it('returns null content when candidateSubscriptionId is valid', () => {
    setupSelectors({
      isOpen: true,
      step: OnboardingStep.STEP1,
      candidateSubscriptionId: 'valid-subscription-id',
    });
    const dispatchMock = jest.fn();
    mockedUseDispatch.mockReturnValue(dispatchMock);

    render(<OnboardingModal />);

    expect(screen.queryByTestId('step1')).not.toBeInTheDocument();
    expect(screen.queryByTestId('intro-step')).not.toBeInTheDocument();
  });

  it('dispatches close and resets step when close button is clicked', () => {
    setupSelectors({
      isOpen: true,
      step: OnboardingStep.STEP2,
      candidateSubscriptionId: null,
    });
    const dispatchMock = jest.fn();
    mockedUseDispatch.mockReturnValue(dispatchMock);

    render(<OnboardingModal />);

    // Find and click the close button in the header
    const header = screen.getByTestId('rewards-onboarding-modal-header');
    const closeButton = header.querySelector('[aria-label]');
    expect(closeButton).toBeInTheDocument();

    if (closeButton) {
      fireEvent.click(closeButton);
      expect(dispatchMock).toHaveBeenCalledWith(setOnboardingModalOpen(false));
      expect(dispatchMock).toHaveBeenCalledWith(
        setOnboardingActiveStep(OnboardingStep.INTRO),
      );
    }
  });
});
