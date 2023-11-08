import { fireEvent, waitFor } from '@testing-library/react';
import React from 'react';
import configureMockState from 'redux-mock-store';
import thunk from 'redux-thunk';
import {
  holdToRevealContent1,
  holdToRevealContent2,
  holdToRevealContent3,
  holdToRevealContent4,
  holdToRevealContent5,
  holdToRevealSRPTitle,
} from '../../../../../app/_locales/en/messages.json';
import mockState from '../../../../../test/data/mock-state.json';
import { renderWithProvider } from '../../../../../test/lib/render-helpers';
import { MetaMetricsContext } from '../../../../contexts/metametrics';
import HoldToRevealModal from '.';

describe('Hold to Reveal Modal', () => {
  const mockStore = configureMockState([thunk])(mockState);
  const onCloseStub = jest.fn();
  const onLongPressStub = jest.fn();
  const mockTrackEvent = jest.fn();

  afterEach(() => {
    jest.resetAllMocks();
  });

  function render(holdToRevealType = 'SRP') {
    return renderWithProvider(
      <MetaMetricsContext.Provider value={mockTrackEvent}>
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

    const holdButton = getByText('Hold to reveal SRP');
    expect(holdButton).toBeInTheDocument();

    const warningTitle = getByText(holdToRevealSRPTitle.message);
    expect(warningTitle).toBeInTheDocument();
    const warningText1 = getByText(
      holdToRevealContent1.message.replace(' $1', ''),
    );
    expect(warningText1).toBeInTheDocument();

    const warningText2 = getByText(holdToRevealContent2.message);
    expect(warningText2).toBeInTheDocument();

    const warningText3 = getByText(
      holdToRevealContent3.message.replace(' $1 $2', ''),
    );
    expect(warningText3).toBeInTheDocument();

    const warningText4 = getByText(holdToRevealContent4.message);
    expect(warningText4).toBeInTheDocument();

    const warningText5 = getByText(holdToRevealContent5.message);
    expect(warningText5).toBeInTheDocument();

    fireEvent.click(holdButton);

    expect(holdButton).toBeDefined();

    fireEvent.pointerUp(holdButton);

    expect(holdButton).toBeDefined();
  });

  it('should should execute onLongPressed after long press', async () => {
    const { getByText, queryByLabelText } = render();

    const holdButton = getByText('Hold to reveal SRP');
    const circleLocked = queryByLabelText('hold to reveal circle locked');

    fireEvent.pointerDown(holdButton);
    fireEvent.transitionEnd(circleLocked);

    const circleUnlocked = queryByLabelText('hold to reveal circle unlocked');
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

    const holdButton = getByText('Hold to reveal SRP');

    fireEvent.click(holdButton);

    const circleLocked = queryByLabelText('hold to reveal circle locked');
    const circleUnlocked = queryByLabelText('hold to reveal circle unlocked');

    await waitFor(() => {
      expect(circleLocked).toBeInTheDocument();
      expect(circleUnlocked).not.toBeInTheDocument();
      expect(onLongPressStub).not.toHaveBeenCalled();
      expect(onCloseStub).not.toHaveBeenCalled();
    });
  });

  it('should render in Private Key mode', async () => {
    const { getByText } = render('PrivateKey');

    const holdButton = getByText('Hold to reveal Private Key');
    expect(holdButton).toBeInTheDocument();
  });
});
