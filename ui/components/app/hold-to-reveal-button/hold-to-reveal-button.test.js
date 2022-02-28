import React from 'react';
import { render, fireEvent } from '@testing-library/react';
import HoldToRevealButton from './hold-to-reveal-button';

describe('HoldToRevealButton', () => {
  const onLongPressed = jest.fn();

  it('should render a button with label', () => {
    const { getByText } = render(
      <HoldToRevealButton
        buttonText="Hold to reveal SRP"
        onLongPressed={onLongPressed}
      />,
    );
    expect(getByText('Hold to reveal SRP')).toBeInTheDocument();
  });

  it('should render a button when mouse is down and up', () => {
    const { getByText } = render(
      <HoldToRevealButton
        buttonText="Hold to reveal SRP"
        onLongPressed={onLongPressed}
      />,
    );
    const button = getByText('Hold to reveal SRP');

    fireEvent.mouseDown(button);

    expect(button).toBeDefined();

    fireEvent.mouseUp(button);

    expect(button).toBeDefined();
  });
});
