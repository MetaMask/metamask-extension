import React from 'react';
import configureMockStore from 'redux-mock-store';

import {
  getMockContractInteractionConfirmState,
  getMockPersonalSignConfirmState,
} from '../../../../../../test/data/confirmations/helper';
import { renderWithConfirmContextProvider } from '../../../../../../test/lib/confirmations/render-helpers';
import {
  ConfirmContext,
  type ConfirmContextType,
} from '../../../context/confirm';
import ScrollToBottom from './scroll-to-bottom';

const buttonSelector = '.confirm-scroll-to-bottom__button';

const mockState = getMockPersonalSignConfirmState();
const mockStore = configureMockStore([])(mockState);

const mockSetHasScrolledToBottom = jest.fn();
const mockScrollTo = jest.fn();

type MockScrollRequiredResult = {
  hasScrolledToBottom: boolean;
  isScrollable: boolean;
  isScrolledToBottom: boolean;
  onScroll: jest.Mock;
  scrollToBottom: jest.Mock;
  setHasScrolledToBottom: jest.Mock;
  scrollElement: { scrollTo: jest.Mock } | null;
  ref: jest.Mock;
};

const mockUseScrollRequiredResult: MockScrollRequiredResult = {
  hasScrolledToBottom: false,
  isScrollable: false,
  isScrolledToBottom: false,
  onScroll: jest.fn(),
  scrollToBottom: jest.fn(),
  setHasScrolledToBottom: mockSetHasScrolledToBottom,
  scrollElement: { scrollTo: mockScrollTo },
  ref: jest.fn(),
};

function confirmContextWithId(id: string): ConfirmContextType {
  return {
    currentConfirmation: {
      id,
    } as ConfirmContextType['currentConfirmation'],
    isScrollToBottomCompleted: true,
    setIsScrollToBottomCompleted: jest.fn(),
    goBackTo: undefined,
    suppressAutoExit: () => undefined,
  };
}

function renderScrollToBottom(confirmationId: string) {
  return renderWithConfirmContextProvider(
    <ConfirmContext.Provider value={confirmContextWithId(confirmationId)}>
      <ScrollToBottom>foobar</ScrollToBottom>
    </ConfirmContext.Provider>,
    mockStore,
  );
}

jest.mock('../../../../../hooks/useScrollRequired', () => ({
  useScrollRequired: () => mockUseScrollRequiredResult,
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
      mockUseScrollRequiredResult.isScrollable = true;
      mockUseScrollRequiredResult.scrollElement = { scrollTo: mockScrollTo };
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

      const { rerender } = renderScrollToBottom('confirmation-1');

      expect(mockScrollTo).toHaveBeenCalledWith(0, 0);
      mockScrollTo.mockClear();

      rerender(
        <ConfirmContext.Provider value={confirmContextWithId('confirmation-2')}>
          <ScrollToBottom>foobar</ScrollToBottom>
        </ConfirmContext.Provider>,
      );

      expect(mockScrollTo).toHaveBeenCalledWith(0, 0);
    });

    it('scrolls to the top when scrollElement attaches after the first render', () => {
      mockScrollTo.mockClear();
      mockUseScrollRequiredResult.scrollElement = null;

      const { rerender } = renderWithConfirmContextProvider(
        <ScrollToBottom>foobar</ScrollToBottom>,
        mockStore,
      );

      expect(mockScrollTo).not.toHaveBeenCalled();

      mockUseScrollRequiredResult.scrollElement = { scrollTo: mockScrollTo };

      rerender(<ScrollToBottom>foobar</ScrollToBottom>);

      expect(mockScrollTo).toHaveBeenCalledWith(0, 0);
    });

    it('resets setHasScrolledToBottom to false when the confirmation changes', () => {
      const { rerender } = renderScrollToBottom('confirmation-1');

      mockSetHasScrolledToBottom.mockClear();

      rerender(
        <ConfirmContext.Provider value={confirmContextWithId('confirmation-2')}>
          <ScrollToBottom>foobar</ScrollToBottom>
        </ConfirmContext.Provider>,
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
        mockUseScrollRequiredResult.isScrolledToBottom = true;
        mockUseScrollRequiredResult.hasScrolledToBottom = true;
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
