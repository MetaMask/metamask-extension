import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react';
import { EVENT, EVENT_NAMES } from '../../../../shared/constants/metametrics';
import HoldToRevealButton from './hold-to-reveal-button';

const mockTrackEvent = jest.fn();

jest.mock('react', () => ({
  ...jest.requireActual('react'),
  useContext: () => mockTrackEvent,
}));

describe('HoldToRevealButton', () => {
  let props = {};

  beforeEach(() => {
    const mockOnLongPressed = jest.fn();

    props = {
      onLongPressed: mockOnLongPressed,
      buttonText: 'Hold to reveal SRP',
    };
  });

  afterEach(() => {
    jest.resetAllMocks();
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

  it('should show the locked padlock when a button is long pressed and then should show it after it was lifted off before the animation concludes', async () => {
    const { getByText, queryByLabelText } = render(
      <HoldToRevealButton {...props} />,
    );

    const button = getByText('Hold to reveal SRP');

    fireEvent.mouseDown(button);
    const circleLocked = queryByLabelText('circle-locked');

    await waitFor(() => {
      expect(circleLocked).toBeInTheDocument();
    });

    fireEvent.mouseUp(button);
    const circleUnlocked = queryByLabelText('circle-unlocked');

    await waitFor(() => {
      expect(circleUnlocked).not.toBeInTheDocument();
    });
  });

  it('should show the unlocked padlock when a button is long pressed for the duration of the animation', async () => {
    const { getByText, queryByLabelText } = render(
      <HoldToRevealButton {...props} />,
    );

    const button = getByText('Hold to reveal SRP');

    fireEvent.mouseDown(button);

    const circleLocked = queryByLabelText('circle-locked');
    fireEvent.transitionEnd(circleLocked);

    const circleUnlocked = queryByLabelText('circle-unlocked');
    fireEvent.animationEnd(circleUnlocked);

    await waitFor(() => {
      expect(circleUnlocked).toBeInTheDocument();
      expect(mockTrackEvent).toHaveBeenNthCalledWith(2, {
        category: EVENT.CATEGORIES.KEYS,
        event: EVENT_NAMES.SRP_HOLD_TO_REVEAL_CLICK_STARTED,
        properties: {
          key_type: EVENT.KEY_TYPES.SRP,
        },
      });
      expect(mockTrackEvent).toHaveBeenNthCalledWith(5, {
        category: EVENT.CATEGORIES.KEYS,
        event: EVENT_NAMES.SRP_HOLD_TO_REVEAL_COMPLETED,
        properties: {
          key_type: EVENT.KEY_TYPES.SRP,
        },
      });
      expect(mockTrackEvent).toHaveBeenNthCalledWith(6, {
        category: EVENT.CATEGORIES.KEYS,
        event: EVENT_NAMES.SRP_REVEAL_VIEWED,
        properties: {
          key_type: EVENT.KEY_TYPES.SRP,
        },
      });
    });
  });
});
