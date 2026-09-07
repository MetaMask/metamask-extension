import React from 'react';
import configureMockStore from 'redux-mock-store';

import {
  getMockContractInteractionConfirmState,
  getMockPersonalSignConfirmState,
} from '../../../../../../test/data/confirmations/helper';
import { renderWithProvider } from '../../../../../../test/lib/render-helpers-navigate';
import { ConfirmContextProvider } from '../../../context/confirm';
import { DappSwapContextProvider } from '../../../context/dapp-swap';
import { GasFeeModalContextProvider } from '../../../context/gas-fee-modal';
import { HardwareWalletErrorProvider } from '../../../../../contexts/hardware-wallets';
import { renderWithConfirmContextProvider } from '../../../../../../test/lib/confirmations/render-helpers';
import ScrollToBottom from './scroll-to-bottom';

const buttonSelector = '.confirm-scroll-to-bottom__button';

const mockState = getMockPersonalSignConfirmState();

const mockSetHasScrolledToBottom = jest.fn();
const mockScrollTo = jest.fn();

const mockUseScrollRequiredResult = {
  hasScrolledToBottom: false,
  isScrollable: false,
  isScrolledToBottom: false,
  onScroll: jest.fn(),
  scrollToBottom: jest.fn(),
  setHasScrolledToBottom: mockSetHasScrolledToBottom,
  scrollElement: { scrollTo: mockScrollTo },
  ref: jest.fn(),
};

const mockedUseScrollRequiredResult = jest.mocked(mockUseScrollRequiredResult);

jest.mock('../../../../../hooks/useScrollRequired', () => ({
  useScrollRequired: () => mockedUseScrollRequiredResult,
}));

const renderScrollToBottomWithProviders = (
  children: React.ReactNode = 'foobar',
) => {
  const store = configureMockStore([])(mockState);

  const ui = (
    <HardwareWalletErrorProvider>
      <ConfirmContextProvider>
        <DappSwapContextProvider>
          <GasFeeModalContextProvider>
            <ScrollToBottom>{children}</ScrollToBottom>
          </GasFeeModalContextProvider>
        </DappSwapContextProvider>
      </ConfirmContextProvider>
    </HardwareWalletErrorProvider>
  );

  return {
    store,
    ...renderWithProvider(ui, store),
  };
};

describe('ScrollToBottom', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('when content is not scrollable', () => {
    it('renders without button', () => {
      const { container, getByText } = renderWithConfirmContextProvider(
        <ScrollToBottom>
          <div>foo</div>
          <div>bar</div>
        </ScrollToBottom>,
        configureMockStore([])(mockState),
      );

      expect(getByText('foo')).toBeInTheDocument();
      expect(getByText('bar')).toBeInTheDocument();
      expect(container.querySelector(buttonSelector)).not.toBeInTheDocument();
    });
  });

  describe('when content is scrollable', () => {
    beforeEach(() => {
      mockedUseScrollRequiredResult.isScrollable = true;
    });

    it('renders with button', () => {
      const { container, getByText } = renderWithConfirmContextProvider(
        <div>
          <ScrollToBottom>
            <div>foo</div>
            <div>bar</div>
          </ScrollToBottom>
        </div>,
        configureMockStore([])(mockState),
      );

      expect(getByText('foo')).toBeInTheDocument();
      expect(getByText('bar')).toBeInTheDocument();
      expect(container.querySelector(buttonSelector)).toBeInTheDocument();
    });

    it('does not scroll to the top while the confirmation id does not change', () => {
      mockScrollTo.mockClear();

      const { rerender } = renderScrollToBottomWithProviders('foobar');

      mockScrollTo.mockClear();

      rerender(
        <HardwareWalletErrorProvider>
          <ConfirmContextProvider>
            <DappSwapContextProvider>
              <GasFeeModalContextProvider>
                <ScrollToBottom>foobar</ScrollToBottom>
              </GasFeeModalContextProvider>
            </DappSwapContextProvider>
          </ConfirmContextProvider>
        </HardwareWalletErrorProvider>,
      );

      expect(mockScrollTo).not.toHaveBeenCalled();
    });

    it('scrolls to the top when the confirmation changes', () => {
      mockScrollTo.mockClear();

      renderWithConfirmContextProvider(
        <ScrollToBottom>foobar</ScrollToBottom>,
        configureMockStore([])(mockState),
      );

      expect(mockScrollTo).toHaveBeenCalledWith(0, 0);
    });

    it('resets setHasScrolledToBottom to false when the confirmation changes', () => {
      renderWithConfirmContextProvider(
        <ScrollToBottom>foobar</ScrollToBottom>,
        configureMockStore([])(mockState),
      );

      expect(mockSetHasScrolledToBottom).toHaveBeenCalledWith(false);
    });

    it('does not render the scroll button when the confirmation is transaction redesigned', () => {
      const mockStateTransaction = getMockContractInteractionConfirmState();
      const { container } = renderWithConfirmContextProvider(
        <ScrollToBottom>foobar</ScrollToBottom>,
        configureMockStore([])(mockStateTransaction),
      );

      expect(container.querySelector(buttonSelector)).not.toBeInTheDocument();
    });

    describe('when user has scrolled to the bottom', () => {
      beforeEach(() => {
        mockedUseScrollRequiredResult.isScrolledToBottom = true;
        mockedUseScrollRequiredResult.hasScrolledToBottom = true;
      });

      it('hides the button', () => {
        const { container } = renderWithConfirmContextProvider(
          <ScrollToBottom>foobar</ScrollToBottom>,
          configureMockStore([])(mockState),
        );

        expect(container.querySelector(buttonSelector)).not.toBeInTheDocument();
      });
    });
  });
});
