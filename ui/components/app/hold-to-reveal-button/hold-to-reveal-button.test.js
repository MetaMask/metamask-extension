import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react';
import HoldToRevealButton from './hold-to-reveal-button';

describe('HoldToRevealButton', () => {
  let props = {};

  beforeEach(() => {
    const mockOnLongPressed = jest.fn();

    props = {
      onLongPressed: mockOnLongPressed,
      buttonText: 'Hold to reveal SRP',
    };
  });

  it('should render a button with label', () => {
    const { getByText } = render(<HoldToRevealButton {...props} />);

    expect(getByText('Hold to reveal SRP')).toBeInTheDocument();
  });

  it('should render a button when mouse is down and up', () => {
    const { getByText } = render(<HoldToRevealButton {...props} />);

    const button = getByText('Hold to reveal SRP');

    fireEvent.mouseDown(button);

    expect(button).toBeDefined();

    fireEvent.mouseUp(button);

    expect(button).toBeDefined();
  });

  it('should not show the locked padlock when a button is long pressed and then should show it after it was lifted off before the animation concludes', () => {
    const { getByText } = render(<HoldToRevealButton {...props} />);

    const button = getByText('Hold to reveal SRP');

    fireEvent.mouseDown(button);

    waitFor(() => {
      expect(button.firstChild).toHaveClass(
        'hold-to-reveal-button__lock-icon-container',
      );
    });

    fireEvent.mouseUp(button);

    waitFor(() => {
      expect(button.firstChild).not.toHaveClass(
        'hold-to-reveal-button__lock-icon-container',
      );
    });
  });

  it('should show the unlocked padlock when a button is long pressed for the duration of the animation', () => {
    const { getByText } = render(<HoldToRevealButton {...props} />);

    const button = getByText('Hold to reveal SRP');

    fireEvent.mouseDown(button);

    waitFor(() => {
      expect(button.firstChild).toHaveClass(
        'hold-to-reveal-button__unlock-icon-container',
      );
    });
  });
});
