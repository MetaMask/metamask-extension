import React from 'react';
import { render, screen, act } from '@testing-library/react';
import { SmartTransactionStatuses } from '@metamask/smart-transactions-controller/dist/types';
import { SmartTransactionsStatusAnimation } from './smart-transaction-status-animation';

// Declare a variable to store the onComplete callback
let mockOnComplete: () => void;

// Modify the existing jest.mock to capture the onComplete callback
jest.mock('../../../components/component-library/lottie-animation', () => ({
  LottieAnimation: ({
    path,
    loop,
    autoplay,
    onComplete,
  }: {
    path: string;
    loop: boolean;
    autoplay: boolean;
    onComplete: () => void;
  }) => {
    // Store the onComplete callback for later use in tests
    mockOnComplete = onComplete;
    return (
      <div
        data-testid="mock-lottie-animation"
        data-path={path}
        data-loop={loop}
        data-autoplay={autoplay}
      />
    );
  },
}));

describe('SmartTransactionsStatusAnimation', () => {
  it('renders correctly for PENDING status', () => {
    const { getByTestId } = render(
      <SmartTransactionsStatusAnimation
        status={SmartTransactionStatuses.PENDING}
      />,
    );
    const lottieAnimation = getByTestId('mock-lottie-animation');
    expect(lottieAnimation).toHaveAttribute(
      'data-path',
      expect.stringContaining('submitting-intro'),
    );
    expect(lottieAnimation).toHaveAttribute('data-loop', 'false');
  });

  it('renders correctly for SUCCESS status', () => {
    const { getByTestId } = render(
      <SmartTransactionsStatusAnimation
        status={SmartTransactionStatuses.SUCCESS}
      />,
    );
    const lottieAnimation = getByTestId('mock-lottie-animation');
    expect(lottieAnimation).toHaveAttribute(
      'data-path',
      expect.stringContaining('confirmed'),
    );
    expect(lottieAnimation).toHaveAttribute('data-loop', 'false');
  });

  it('renders correctly for REVERTED status', () => {
    const { getByTestId } = render(
      <SmartTransactionsStatusAnimation
        status={SmartTransactionStatuses.REVERTED}
      />,
    );
    const lottieAnimation = getByTestId('mock-lottie-animation');
    expect(lottieAnimation).toHaveAttribute(
      'data-path',
      expect.stringContaining('failed'),
    );
    expect(lottieAnimation).toHaveAttribute('data-loop', 'false');
  });

  it('renders correctly for UNKNOWN status', () => {
    const { getByTestId } = render(
      <SmartTransactionsStatusAnimation
        status={SmartTransactionStatuses.UNKNOWN}
      />,
    );
    const lottieAnimation = getByTestId('mock-lottie-animation');
    expect(lottieAnimation).toHaveAttribute(
      'data-path',
      expect.stringContaining('failed'),
    );
    expect(lottieAnimation).toHaveAttribute('data-loop', 'false');
  });

  it('renders correctly for other statuses', () => {
    const { getByTestId } = render(
      <SmartTransactionsStatusAnimation
        status={'SOME_OTHER_STATUS' as SmartTransactionStatuses}
      />,
    );
    const lottieAnimation = getByTestId('mock-lottie-animation');
    expect(lottieAnimation).toHaveAttribute(
      'data-path',
      expect.stringContaining('processing'),
    );
    expect(lottieAnimation).toHaveAttribute('data-loop', 'true');
  });

  it('transitions from submittingIntro to submittingLoop when onComplete is called', () => {
    render(
      <SmartTransactionsStatusAnimation
        status={SmartTransactionStatuses.PENDING}
      />,
    );
    const lottieAnimation = screen.getByTestId('mock-lottie-animation');

    // Initially, should render 'submitting-intro'
    expect(lottieAnimation).toHaveAttribute(
      'data-path',
      expect.stringContaining('submitting-intro'),
    );
    expect(lottieAnimation).toHaveAttribute('data-loop', 'false');

    // Trigger the onComplete callback to simulate animation completion
    expect(lottieAnimation.getAttribute('data-on-complete')).toBeDefined();
    act(() => {
      mockOnComplete();
    });

    // After onComplete is called, it should transition to 'submitting-loop'
    expect(lottieAnimation).toHaveAttribute(
      'data-path',
      expect.stringContaining('submitting-loop'),
    );
    expect(lottieAnimation).toHaveAttribute('data-loop', 'true');
  });
});
