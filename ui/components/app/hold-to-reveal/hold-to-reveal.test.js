import React from 'react';
import { render, fireEvent } from '@testing-library/react';
import HoldToReveal from './hold-to-reveal';

describe('HoldToReveal', () => {
  const revealFinished = jest.fn();

  it('should render a button with label', () => {
    const { getByText } = render(
      <HoldToReveal
        buttonText="Hold to reveal SRP"
        timeToHold={5}
        revealFinished={revealFinished}
      />,
    );
    expect(getByText('Hold to reveal SRP')).toBeInTheDocument();
  });

  it('should render a button when mouse is down and up', () => {
    const { getByText } = render(
      <HoldToReveal
        buttonText="Hold to reveal SRP"
        timeToHold={5}
        revealFinished={revealFinished}
      />,
    );
    const button = getByText('Hold to reveal SRP');

    fireEvent.mouseDown(button);

    expect(button).toBeDefined();

    fireEvent.mouseUp(button);

    expect(button).toBeDefined();
  });
});
