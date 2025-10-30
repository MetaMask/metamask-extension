import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
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
});
