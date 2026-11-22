import React from 'react';
import { render, screen } from '@testing-library/react';
import LoadingStep from './loading-step';

describe('LoadingStep', () => {
  afterEach(() => {
    jest.useRealTimers();
  });

  it('renders the title and message', () => {
    render(<LoadingStep title="Validating device" message="Please wait" />);

    expect(screen.getByText('Validating device')).toBeInTheDocument();
    expect(screen.getByText('Please wait')).toBeInTheDocument();
  });

  it('calls onComplete after the default delay', () => {
    jest.useFakeTimers();
    const onComplete = jest.fn();

    render(
      <LoadingStep title="title" message="message" onComplete={onComplete} />,
    );

    expect(onComplete).not.toHaveBeenCalled();

    jest.advanceTimersByTime(2000);

    expect(onComplete).toHaveBeenCalledTimes(1);
  });

  it('calls onComplete after a custom delay', () => {
    jest.useFakeTimers();
    const onComplete = jest.fn();

    render(
      <LoadingStep
        title="title"
        message="message"
        onComplete={onComplete}
        delayMs={500}
      />,
    );

    jest.advanceTimersByTime(499);
    expect(onComplete).not.toHaveBeenCalled();

    jest.advanceTimersByTime(1);
    expect(onComplete).toHaveBeenCalledTimes(1);
  });

  it('does not throw when onComplete is omitted', () => {
    jest.useFakeTimers();

    expect(() => {
      render(<LoadingStep title="title" message="message" />);
      jest.advanceTimersByTime(2000);
    }).not.toThrow();
  });
});
