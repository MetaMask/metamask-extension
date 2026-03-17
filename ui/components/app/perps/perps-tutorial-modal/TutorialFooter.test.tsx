import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import TutorialFooter from './TutorialFooter';

jest.mock('../../../../hooks/useI18nContext', () => ({
  useI18nContext: () => (key: string) => key,
}));

describe('TutorialFooter', () => {
  const defaultProps = {
    onContinue: jest.fn(),
    onSkip: jest.fn(),
    isLastStep: false,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('rendering', () => {
    it('renders the continue button with "Continue" text when not last step', () => {
      render(<TutorialFooter {...defaultProps} />);

      const continueButton = screen.getByTestId(
        'perps-tutorial-continue-button',
      );
      expect(continueButton).toBeInTheDocument();
      expect(continueButton).toHaveTextContent('perpsTutorialContinue');
    });

    it('renders the continue button with "Let\'s Go" text when last step', () => {
      render(<TutorialFooter {...defaultProps} isLastStep />);

      const continueButton = screen.getByTestId(
        'perps-tutorial-lets-go-button',
      );
      expect(continueButton).toBeInTheDocument();
      expect(continueButton).toHaveTextContent('perpsTutorialLetsGo');
    });

    it('renders the skip button when not last step', () => {
      render(<TutorialFooter {...defaultProps} />);

      expect(
        screen.getByTestId('perps-tutorial-skip-button'),
      ).toBeInTheDocument();
      expect(screen.getByText('perpsTutorialSkip')).toBeInTheDocument();
    });

    it('does not render the skip button when last step', () => {
      render(<TutorialFooter {...defaultProps} isLastStep />);

      expect(
        screen.queryByTestId('perps-tutorial-skip-button'),
      ).not.toBeInTheDocument();
    });
  });

  describe('interactions', () => {
    it('calls onContinue when continue button is clicked', () => {
      const onContinue = jest.fn();
      render(<TutorialFooter {...defaultProps} onContinue={onContinue} />);

      fireEvent.click(screen.getByTestId('perps-tutorial-continue-button'));

      expect(onContinue).toHaveBeenCalledTimes(1);
    });

    it('calls onContinue when "Let\'s Go" button is clicked on last step', () => {
      const onContinue = jest.fn();
      render(
        <TutorialFooter {...defaultProps} onContinue={onContinue} isLastStep />,
      );

      fireEvent.click(screen.getByTestId('perps-tutorial-lets-go-button'));

      expect(onContinue).toHaveBeenCalledTimes(1);
    });

    it('calls onSkip when skip button is clicked', () => {
      const onSkip = jest.fn();
      render(<TutorialFooter {...defaultProps} onSkip={onSkip} />);

      fireEvent.click(screen.getByTestId('perps-tutorial-skip-button'));

      expect(onSkip).toHaveBeenCalledTimes(1);
    });
  });

  describe('styling', () => {
    it('skip button has text-default class for white text', () => {
      render(<TutorialFooter {...defaultProps} />);

      const skipButton = screen.getByTestId('perps-tutorial-skip-button');
      expect(skipButton).toHaveClass('text-default');
    });
  });
});
