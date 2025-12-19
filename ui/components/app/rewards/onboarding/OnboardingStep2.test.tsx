import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { useDispatch } from 'react-redux';

import { setOnboardingActiveStep } from '../../../../ducks/rewards';
import { OnboardingStep } from '../../../../ducks/rewards/types';
import OnboardingStep2 from './OnboardingStep2';

jest.mock('react-redux', () => ({
  useDispatch: jest.fn(),
}));

jest.mock('../../../../hooks/useI18nContext', () => ({
  useI18nContext: jest.fn(() => (key: string) => key),
}));

// Mock ProgressIndicator to verify props passed
jest.mock(
  './ProgressIndicator',
  () => (props: { totalSteps: number; currentStep: number }) => (
    <div
      data-testid="rewards-onboarding-step2-progress"
      data-current-step={props.currentStep}
      data-total-steps={props.totalSteps}
    >
      Progress
    </div>
  ),
);

const mockedUseDispatch = useDispatch as jest.Mock;

describe('OnboardingStep2', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders layout sections and translation keys', () => {
    const dispatchMock = jest.fn();
    mockedUseDispatch.mockReturnValue(dispatchMock);

    render(<OnboardingStep2 />);

    expect(
      screen.getByTestId('rewards-onboarding-step2-container'),
    ).toBeInTheDocument();
    expect(
      screen.getByTestId('rewards-onboarding-step2-image'),
    ).toBeInTheDocument();
    expect(
      screen.getByTestId('rewards-onboarding-step2-info'),
    ).toBeInTheDocument();
    expect(
      screen.getByTestId('rewards-onboarding-step2-actions'),
    ).toBeInTheDocument();

    // Title and description use translation keys via t()
    expect(screen.getByText('rewardsOnboardingStep2Title')).toBeInTheDocument();
    expect(
      screen.getByText('rewardsOnboardingStep2Description'),
    ).toBeInTheDocument();

    // Confirm button text
    expect(
      screen.getByText('rewardsOnboardingStepConfirm'),
    ).toBeInTheDocument();
  });

  it('passes correct progress props to ProgressIndicator', () => {
    const dispatchMock = jest.fn();
    mockedUseDispatch.mockReturnValue(dispatchMock);

    render(<OnboardingStep2 />);

    const progress = screen.getByTestId('rewards-onboarding-step2-progress');
    expect(progress).toHaveAttribute('data-current-step', '2');
    expect(progress).toHaveAttribute('data-total-steps', '4');
  });

  it('advances to STEP3 when confirm is clicked', () => {
    const dispatchMock = jest.fn();
    mockedUseDispatch.mockReturnValue(dispatchMock);

    render(<OnboardingStep2 />);

    const confirmButton = screen.getByText('rewardsOnboardingStepConfirm');
    fireEvent.click(confirmButton);

    expect(dispatchMock).toHaveBeenCalledWith(
      setOnboardingActiveStep(OnboardingStep.STEP3),
    );
  });
});
