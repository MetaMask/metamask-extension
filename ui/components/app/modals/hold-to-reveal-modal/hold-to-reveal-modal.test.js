import { fireEvent, waitFor } from '@testing-library/react';
import React from 'react';
import configureMockState from 'redux-mock-store';
import thunk from 'redux-thunk';
import mockState from '../../../../../test/data/mock-state.json';
import { renderWithProvider } from '../../../../../test/lib/render-helpers-navigate';
import { enLocale as messages } from '../../../../../test/lib/i18n-helpers';
import { MetaMetricsContext } from '../../../../contexts/metametrics';
import HoldToRevealModal from '.';

describe('Hold to Reveal Modal', () => {
  const mockStore = configureMockState([thunk])(mockState);
  const onCloseStub = jest.fn();
  const onLongPressStub = jest.fn();
  const mockTrackEvent = jest.fn();
  const mockMetaMetricsContext = {
    trackEvent: mockTrackEvent,
    bufferedTrace: jest.fn(),
    bufferedEndTrace: jest.fn(),
    onboardingParentContext: { current: null },
  };

  afterEach(() => {
    jest.resetAllMocks();
  });

  function render(holdToRevealType = 'SRP') {
    return renderWithProvider(
      <MetaMetricsContext.Provider value={mockMetaMetricsContext}>
        <HoldToRevealModal
          isOpen
          onClose={onCloseStub}
          onLongPressed={onLongPressStub}
          holdToRevealType={holdToRevealType}
        />
      </MetaMetricsContext.Provider>,
      mockStore,
    );
  }

  it('should render the srp warning text and button', () => {
    const { getByText } = render();

    const holdButton = getByText(messages.holdToRevealSRP.message);
    expect(holdButton).toBeInTheDocument();

    const warningTitle = getByText(messages.holdToRevealSRPTitle.message);
    expect(warningTitle).toBeInTheDocument();
    const warningText1 = getByText(
      messages.holdToRevealContent1.message.replace(' $1', ''),
    );
    expect(warningText1).toBeInTheDocument();

    const warningText2 = getByText(messages.holdToRevealContent2.message);
    expect(warningText2).toBeInTheDocument();

    const warningText3 = getByText(
      messages.holdToRevealContent3.message.replace(' $1 $2', ''),
    );
    expect(warningText3).toBeInTheDocument();

    const warningText4 = getByText(messages.holdToRevealContent4.message);
    expect(warningText4).toBeInTheDocument();

    const warningText5 = getByText(messages.holdToRevealContent5.message);
    expect(warningText5).toBeInTheDocument();

    fireEvent.click(holdButton);

    expect(holdButton).toBeDefined();

    fireEvent.pointerUp(holdButton);

    expect(holdButton).toBeDefined();
  });

  it('should should execute onLongPressed after long press', async () => {
    const { getByText, queryByLabelText } = render();

    const holdButton = getByText(messages.holdToRevealSRP.message);
    const circleLocked = queryByLabelText(
      messages.holdToRevealLockedLabel.message,
    );

    fireEvent.pointerDown(holdButton);
    fireEvent.transitionEnd(circleLocked);

    const circleUnlocked = queryByLabelText(
      messages.holdToRevealUnlockedLabel.message,
    );
    fireEvent.animationEnd(circleUnlocked);

    await waitFor(() => {
      expect(holdButton.firstChild).toHaveClass(
        'hold-to-reveal-button__icon-container',
      );
      expect(onLongPressStub).toHaveBeenCalled();
    });
  });

  it('should remain open if long pressed was not complete', async () => {
    const { getByText, queryByLabelText } = render();

    const holdButton = getByText(messages.holdToRevealSRP.message);

    fireEvent.click(holdButton);

    const circleLocked = queryByLabelText(
      messages.holdToRevealLockedLabel.message,
    );
    const circleUnlocked = queryByLabelText(
      messages.holdToRevealUnlockedLabel.message,
    );

    await waitFor(() => {
      expect(circleLocked).toBeInTheDocument();
      expect(circleUnlocked).not.toBeInTheDocument();
      expect(onLongPressStub).not.toHaveBeenCalled();
      expect(onCloseStub).not.toHaveBeenCalled();
    });
  });

  it('should render in Private Key mode', async () => {
    const { getByText } = render('PrivateKey');

    const holdButton = getByText(messages.holdToRevealPrivateKey.message);
    expect(holdButton).toBeInTheDocument();
  });
});
