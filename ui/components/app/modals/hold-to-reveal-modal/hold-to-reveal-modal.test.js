import React from 'react';
import configureMockState from 'redux-mock-store';
import { fireEvent, waitFor } from '@testing-library/react';
import thunk from 'redux-thunk';
import { renderWithProvider } from '../../../../../test/lib/render-helpers';
import mockState from '../../../../../test/data/mock-state.json';
import {
  holdToRevealContent1,
  holdToRevealContent2,
  holdToRevealContent3,
  holdToRevealContent4,
  holdToRevealContent5,
  holdToRevealTitle,
} from '../../../../../app/_locales/en/messages.json';
import HoldToRevealModal from '.';

const mockHideModalStub = jest.fn();

jest.mock('../../../../store/actions.ts', () => ({
  hideModal: () => mockHideModalStub,
}));

describe('Hold to Reveal Modal', () => {
  const mockStore = configureMockState([thunk])(mockState);
  const onLongPressStub = jest.fn();

  afterEach(() => {
    jest.resetAllMocks();
  });

  it('should render the srp warning text and button', () => {
    const { getByText } = renderWithProvider(
      <HoldToRevealModal
        onLongPressed={onLongPressStub}
        hideModal={mockHideModalStub}
      />,
      mockStore,
    );

    const holdButton = getByText('Hold to reveal SRP');
    expect(holdButton).toBeInTheDocument();

    const warningTitle = getByText(holdToRevealTitle.message);
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

    fireEvent.mouseUp(holdButton);

    expect(holdButton).toBeDefined();
  });

  it('should should execute onLongPressed after long press', async () => {
    const { getByText, queryByLabelText } = renderWithProvider(
      <HoldToRevealModal
        onLongPressed={onLongPressStub}
        hideModal={mockHideModalStub}
      />,
      mockStore,
    );

    const holdButton = getByText('Hold to reveal SRP');
    const circleLocked = queryByLabelText('hold to reveal circle locked');

    fireEvent.mouseDown(holdButton);
    fireEvent.transitionEnd(circleLocked);

    const circleUnlocked = queryByLabelText('hold to reveal circle unlocked');
    fireEvent.animationEnd(circleUnlocked);

    await waitFor(() => {
      expect(holdButton.firstChild).toHaveClass(
        'box hold-to-reveal-button__icon-container box--flex-direction-row',
      );
      expect(onLongPressStub).toHaveBeenCalled();
    });
  });

  it('should remain open if long pressed was not complete', async () => {
    const { getByText, queryByLabelText } = renderWithProvider(
      <HoldToRevealModal
        onLongPressed={onLongPressStub}
        hideModal={mockHideModalStub}
      />,
      mockStore,
    );

    const holdButton = getByText('Hold to reveal SRP');

    fireEvent.click(holdButton);

    const circleLocked = queryByLabelText('hold to reveal circle locked');
    const circleUnlocked = queryByLabelText('hold to reveal circle unlocked');

    await waitFor(() => {
      expect(circleLocked).toBeInTheDocument();
      expect(circleUnlocked).not.toBeInTheDocument();
      expect(onLongPressStub).not.toHaveBeenCalled();
      expect(mockHideModalStub).not.toHaveBeenCalled();
    });
  });

  it('should not hide modal after completing long press if set to false', async () => {
    const { getByText, queryByLabelText } = renderWithProvider(
      <HoldToRevealModal
        onLongPressed={onLongPressStub}
        hideModal={mockHideModalStub}
        willHide={false}
      />,
      mockStore,
    );

    const holdButton = getByText('Hold to reveal SRP');
    const circleLocked = queryByLabelText('hold to reveal circle locked');

    fireEvent.mouseDown(holdButton);
    fireEvent.transitionEnd(circleLocked);

    const circleUnlocked = queryByLabelText('hold to reveal circle unlocked');
    fireEvent.animationEnd(circleUnlocked);

    await waitFor(() => {
      expect(holdButton.firstChild).toHaveClass(
        'box hold-to-reveal-button__icon-container box--flex-direction-row',
      );
      expect(onLongPressStub).toHaveBeenCalled();
      expect(mockHideModalStub).not.toHaveBeenCalled();
    });
  });

  it('should hide modal after completing long press if set to true', async () => {
    const { getByText, queryByLabelText } = renderWithProvider(
      <HoldToRevealModal
        onLongPressed={onLongPressStub}
        hideModal={mockHideModalStub}
        willHide
      />,
      mockStore,
    );

    const holdButton = getByText('Hold to reveal SRP');
    const circleLocked = queryByLabelText('hold to reveal circle locked');

    fireEvent.mouseDown(holdButton);
    fireEvent.transitionEnd(circleLocked);

    const circleUnlocked = queryByLabelText('hold to reveal circle unlocked');
    fireEvent.animationEnd(circleUnlocked);

    await waitFor(() => {
      expect(holdButton.firstChild).toHaveClass(
        'box hold-to-reveal-button__icon-container box--flex-direction-row',
      );
      expect(onLongPressStub).toHaveBeenCalled();
      expect(mockHideModalStub).toHaveBeenCalled();
    });
  });
});
