import React from 'react';
import { render } from '@testing-library/react';
import ScrollToBottom from './scroll-to-bottom';

const buttonSelector = '.confirm-scroll-to-bottom__button';

describe('ScrollToBottom', () => {
  describe('when content is not scrollable', () => {
    it('renders without button', () => {
      const { container, getByText } = render(
        <ScrollToBottom>
          <div>foo</div>
          <div>bar</div>
        </ScrollToBottom>,
      );

      expect(getByText('foo')).toBeInTheDocument();
      expect(getByText('bar')).toBeInTheDocument();
      expect(container.querySelector(buttonSelector)).not.toBeInTheDocument();
    });

    it('sets hasViewedContent to true when passed as a param', () => {
      const mockSetHasScrolledToBottom = jest.fn();

      render(
        <ScrollToBottom setHasScrolledToBottom={mockSetHasScrolledToBottom}>
          foobar
        </ScrollToBottom>,
      );

      expect(mockSetHasScrolledToBottom).toHaveBeenCalledWith(true);
    });
  });

  /**
   * skipping these tests
   *
   * although these are important tests, we're unable to test the button because our test suite doesn't
   * support rendering on a screen. Thus, isScrollable logic doesn't work in the test. Thus, the button
   * is never rendered in the unit tests. We'll test these in e2e tests.
   */
  // describe('when content is scrollable', () => {
  // it('renders with button if content is scrollable', async () => {
  //   const { container, getByText } = await render(
  //     <div style={{ height: '100px', width: '280px' }}>
  //       <ScrollToBottom>
  //         <div style={{ height: '100px' }}>foo</div>
  //         <div style={{ height: '100px' }}>bar</div>
  //       </ScrollToBottom>
  //     </div>,
  //   );

  //   expect(getByText('foo')).toBeInTheDocument();
  //   expect(getByText('bar')).toBeInTheDocument();
  //   expect(container.querySelector(buttonSelector)).toBeInTheDocument();
  // });

  //   it('scrolls to bottom and hides button when button is clicked', () => {
  //     const { container } = render(
  //       <ScrollToBottom>
  //         <div>Child 1</div>
  //         <div>Child 2</div>
  //       </ScrollToBottom>,
  //     );

  //     const button = container.querySelector(buttonSelector);
  //     button ? fireEvent.click(button) : expect(false);

  //     expect(container.querySelector(buttonSelector)).not.toBeInTheDocument();
  //   });
  // });
});
