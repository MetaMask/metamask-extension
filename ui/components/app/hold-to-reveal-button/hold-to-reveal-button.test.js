import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react';
import configureMockState from 'redux-mock-store';
import thunk from 'redux-thunk';
import { renderWithProvider } from '../../../../test/lib/render-helpers-navigate';
import mockState from '../../../../test/data/mock-state.json';
import {
  MetaMetricsEventCategory,
  MetaMetricsEventKeyType,
  MetaMetricsEventName,
} from '../../../../shared/constants/metametrics';
import { MetaMetricsContext } from '../../../contexts/metametrics';
import { enLocale as messages } from '../../../../test/lib/i18n-helpers';
import HoldToRevealButton from './hold-to-reveal-button';

const mockTrackEvent = jest.fn();
const mockMetaMetricsContext = {
  trackEvent: mockTrackEvent,
  bufferedTrace: jest.fn(),
  bufferedEndTrace: jest.fn(),
  onboardingParentContext: { current: null },
};

describe('HoldToRevealButton', () => {
  const mockStore = configureMockState([thunk])(mockState);
  let props = {};

  beforeEach(() => {
    const mockOnLongPressed = jest.fn();

    props = {
      onLongPressed: mockOnLongPressed,
      buttonText: messages.holdToRevealSRP.message,
    };
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  it('should render a button with label', () => {
    const { getByText } = render(<HoldToRevealButton {...props} />);

    expect(getByText(messages.holdToRevealSRP.message)).toBeInTheDocument();
  });

  it('should render a button when mouse is down and up', () => {
    const { getByText } = render(<HoldToRevealButton {...props} />);

    const button = getByText(messages.holdToRevealSRP.message);

    fireEvent.mouseDown(button);

    expect(button).toBeDefined();

    fireEvent.mouseUp(button);

    expect(button).toBeDefined();
  });

  it('should show the locked padlock when a button is long pressed and then should show it after it was lifted off before the animation concludes', async () => {
    const { getByText, queryByLabelText } = renderWithProvider(
      <MetaMetricsContext.Provider value={mockMetaMetricsContext}>
        <HoldToRevealButton {...props} />
      </MetaMetricsContext.Provider>,
      mockStore,
    );

    const button = getByText(messages.holdToRevealSRP.message);

    fireEvent.mouseDown(button);
    const circleLocked = queryByLabelText(
      messages.holdToRevealLockedLabel.message,
    );

    await waitFor(() => {
      expect(circleLocked).toBeInTheDocument();
    });

    fireEvent.mouseUp(button);
    const circleUnlocked = queryByLabelText(
      messages.holdToRevealUnlockedLabel.message,
    );

    await waitFor(() => {
      expect(circleUnlocked).not.toBeInTheDocument();
    });
  });

  it('should show the unlocked padlock when a button is long pressed for the duration of the animation', async () => {
    const { getByText, queryByLabelText, getByLabelText } = renderWithProvider(
      <MetaMetricsContext.Provider value={mockMetaMetricsContext}>
        <HoldToRevealButton {...props} />
      </MetaMetricsContext.Provider>,
      mockStore,
    );

    const button = getByText(messages.holdToRevealSRP.message);

    fireEvent.pointerDown(button);

    const circleLocked = getByLabelText(
      messages.holdToRevealLockedLabel.message,
    );
    fireEvent.transitionEnd(circleLocked);

    const circleUnlocked = queryByLabelText(
      messages.holdToRevealUnlockedLabel.message,
    );
    fireEvent.animationEnd(circleUnlocked);

    await waitFor(() => {
      expect(circleUnlocked).toBeInTheDocument();
      expect(mockTrackEvent).toHaveBeenNthCalledWith(1, {
        category: MetaMetricsEventCategory.Keys,
        event: MetaMetricsEventName.SrpHoldToRevealClickStarted,
        properties: {
          key_type: MetaMetricsEventKeyType.Srp,
        },
      });
      expect(mockTrackEvent).toHaveBeenNthCalledWith(2, {
        category: MetaMetricsEventCategory.Keys,
        event: MetaMetricsEventName.SrpHoldToRevealCompleted,
        properties: {
          key_type: MetaMetricsEventKeyType.Srp,
        },
      });
      expect(mockTrackEvent).toHaveBeenNthCalledWith(3, {
        category: MetaMetricsEventCategory.Keys,
        event: MetaMetricsEventName.SrpRevealViewed,
        properties: {
          key_type: MetaMetricsEventKeyType.Srp,
        },
      });
    });
  });
});
