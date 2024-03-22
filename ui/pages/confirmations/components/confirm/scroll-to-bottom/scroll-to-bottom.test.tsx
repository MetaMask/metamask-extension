import React from 'react';
import configureMockStore from 'redux-mock-store';
import { renderWithProvider } from '../../../../../../test/lib/render-helpers';
import * as ConfirmDucks from '../../../../../ducks/confirm/confirm';
import ScrollToBottom from './scroll-to-bottom';

const buttonSelector = '.confirm-scroll-to-bottom__button';

const mockUseScrollRequiredResult = {
  hasScrolledToBottom: false,
  isScrollable: false,
  isScrolledToBottom: false,
  onScroll: jest.fn(),
  scrollToBottom: jest.fn(),
  ref: { current: null },
};

const mockedUseScrollRequiredResult = jest.mocked(mockUseScrollRequiredResult);

jest.mock('../../../../../hooks/useScrollRequired', () => ({
  useScrollRequired: () => mockedUseScrollRequiredResult,
}));

describe('ScrollToBottom', () => {
  describe('when content is not scrollable', () => {
    it('renders without button', () => {
      const { container, getByText } = renderWithProvider(
        <ScrollToBottom>
          <div>foo</div>
          <div>bar</div>
        </ScrollToBottom>,
        configureMockStore([])(),
      );

      expect(getByText('foo')).toBeInTheDocument();
      expect(getByText('bar')).toBeInTheDocument();
      expect(container.querySelector(buttonSelector)).not.toBeInTheDocument();
    });

    it('sets isScrollToBottomNeeded to false', () => {
      const updateSpy = jest.spyOn(ConfirmDucks, 'updateConfirm');
      renderWithProvider(
        <ScrollToBottom>foobar</ScrollToBottom>,
        configureMockStore([])(),
      );

      expect(updateSpy).toHaveBeenCalledWith({
        isScrollToBottomNeeded: false,
      });
    });
  });

  describe('when content is scrollable', () => {
    beforeEach(() => {
      mockedUseScrollRequiredResult.isScrollable = true;
    });

    it('renders with button', () => {
      const { container, getByText } = renderWithProvider(
        <div>
          <ScrollToBottom>
            <div>foo</div>
            <div>bar</div>
          </ScrollToBottom>
        </div>,
        configureMockStore([])(),
      );

      expect(getByText('foo')).toBeInTheDocument();
      expect(getByText('bar')).toBeInTheDocument();
      expect(container.querySelector(buttonSelector)).toBeInTheDocument();
    });

    it('sets isScrollToBottomNeeded to true', () => {
      const updateSpy = jest.spyOn(ConfirmDucks, 'updateConfirm');
      renderWithProvider(
        <ScrollToBottom>foobar</ScrollToBottom>,
        configureMockStore([])(),
      );

      expect(updateSpy).toHaveBeenCalledWith({
        isScrollToBottomNeeded: true,
      });
    });

    describe('when user has scrolled to the bottom', () => {
      beforeEach(() => {
        mockedUseScrollRequiredResult.isScrolledToBottom = true;
      });

      it('hides the button', () => {
        const { container } = renderWithProvider(
          <ScrollToBottom>foobar</ScrollToBottom>,
          configureMockStore([])(),
        );

        expect(container.querySelector(buttonSelector)).not.toBeInTheDocument();
      });

      it('sets isScrollToBottomNeeded to false', () => {
        const updateSpy = jest.spyOn(ConfirmDucks, 'updateConfirm');
        const { container } = renderWithProvider(
          <ScrollToBottom>foobar</ScrollToBottom>,
          configureMockStore([])(),
        );

        expect(container.querySelector(buttonSelector)).not.toBeInTheDocument();
        expect(updateSpy).toHaveBeenCalledWith({
          isScrollToBottomNeeded: true,
        });
      });
    });
  });
});
