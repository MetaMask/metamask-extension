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

const mockShowModal = jest.fn();

jest.mock('../../../../store/actions.ts', () => {
  return {
    showModal: () => mockShowModal,
  };
});

describe('Hold to Reveal Modal', () => {
  const mockStore = configureMockState([thunk])(mockState);
  const onLongPressStub = jest.fn().mockResolvedValue();
  const hideModalStub = jest.fn().mockResolvedValue();

  global.platform = { openTab: jest.fn() };

  it('should render the srp warning text and button', () => {
    const { getByText } = renderWithProvider(
      <HoldToRevealModal
        onLongPressed={onLongPressStub}
        hideModal={hideModalStub}
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
    const { getByText } = renderWithProvider(
      <HoldToRevealModal
        onLongPressed={onLongPressStub}
        hideModal={hideModalStub}
      />,
      mockStore,
    );

    const holdButton = getByText('Hold to reveal SRP');
    waitFor(() => {
      expect(holdButton.firstChild).toHaveClass(
        'hold-to-reveal-button__unlock-icon-container',
      );
      expect(onLongPressStub.callCount).toBe(1);
      expect(hideModalStub.callCount).toBe(1);
    });
  });

  it('should remain open if long pressed was not complete', async () => {
    const { getByText } = renderWithProvider(
      <HoldToRevealModal
        onLongPressed={onLongPressStub}
        hideModal={hideModalStub}
      />,
      mockStore,
    );

    const holdButton = getByText('Hold to reveal SRP');
    waitFor(
      () => {
        expect(holdButton.firstChild).toHaveClass(
          'hold-to-reveal-button__unlock-icon-container',
        );
        expect(onLongPressStub.callCount).toBe(0);
        expect(hideModalStub.callCount).toBe(0);
      },
      { interval: 100 },
    );
  });
});
