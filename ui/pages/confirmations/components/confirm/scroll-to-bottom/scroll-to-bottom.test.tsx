import React from 'react';
import configureMockStore from 'redux-mock-store';

import {
  getMockContractInteractionConfirmState,
  getMockPersonalSignConfirmState,
} from '../../../../../../test/data/confirmations/helper';
import { renderWithConfirmContextProvider } from '../../../../../../test/lib/confirmations/render-helpers';
import ScrollToBottom from './scroll-to-bottom';

const buttonSelector = '.confirm-scroll-to-bottom__button';

const mockState = getMockPersonalSignConfirmState();
const mockStore = configureMockStore([])(mockState);

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
        mockStore,
      );

      expect(getByText('foo')).toBeInTheDocument();
      expect(getByText('bar')).toBeInTheDocument();
      expect(container.querySelector(buttonSelector)).not.toBeInTheDocument();
    });
  });

  describe('when content is scrollable', () => {
    beforeEach(() => {
      mockedUseScrollRequiredResult.isScrollable = true;
      mockedUseScrollRequiredResult.scrollElement = { scrollTo: mockScrollTo };
    });

    it('renders with button', () => {
      const { container, getByText } = renderWithConfirmContextProvider(
        <div>
          <ScrollToBottom>
            <div>foo</div>
            <div>bar</div>
          </ScrollToBottom>
        </div>,
        mockStore,
      );

      expect(getByText('foo')).toBeInTheDocument();
      expect(getByText('bar')).toBeInTheDocument();
      expect(container.querySelector(buttonSelector)).toBeInTheDocument();
    });

    it('does not scroll to the top while the confirmation id does not change', () => {
      mockScrollTo.mockClear();

      const { rerender } = renderWithConfirmContextProvider(
        <ScrollToBottom>foobar</ScrollToBottom>,
        mockStore,
      );

      mockScrollTo.mockClear();

      rerender(<ScrollToBottom>foobar</ScrollToBottom>);

      expect(mockScrollTo).not.toHaveBeenCalled();
    });

    it('scrolls to the top when the confirmation changes', () => {
      mockScrollTo.mockClear();

      renderWithConfirmContextProvider(
        <ScrollToBottom>foobar</ScrollToBottom>,
        mockStore,
      );

      expect(mockScrollTo).toHaveBeenCalledWith(0, 0);
    });

    it('scrolls to the top when scrollElement attaches after the first render', () => {
      mockScrollTo.mockClear();
      mockedUseScrollRequiredResult.scrollElement = null;

      const { rerender } = renderWithConfirmContextProvider(
        <ScrollToBottom>foobar</ScrollToBottom>,
        mockStore,
      );

      expect(mockScrollTo).not.toHaveBeenCalled();

      mockedUseScrollRequiredResult.scrollElement = { scrollTo: mockScrollTo };

      rerender(<ScrollToBottom>foobar</ScrollToBottom>);

      expect(mockScrollTo).toHaveBeenCalledWith(0, 0);
    });

    it('resets setHasScrolledToBottom to false when the confirmation changes', () => {
      renderWithConfirmContextProvider(
        <ScrollToBottom>foobar</ScrollToBottom>,
        mockStore,
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
          mockStore,
        );

        expect(container.querySelector(buttonSelector)).not.toBeInTheDocument();
      });
    });
  });
});
