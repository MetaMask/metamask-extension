import React from 'react';
import { fireEvent, render } from '@testing-library/react';
import Disclosure from './disclosure';

describe('Disclosure', () => {
  it('matches snapshot without title prop', () => {
    const { container } = render(<Disclosure variant="">Test</Disclosure>);
    expect(container).toMatchSnapshot();
  });

  it('matches snapshot with title prop', () => {
    const { container } = render(
      <Disclosure title="Test Title" size="small">
        Test
      </Disclosure>,
    );
    expect(container).toMatchSnapshot();
  });

  it('renders content', () => {
    const { container, getByText, rerender } = render(
      <Disclosure title="Test Title">Test</Disclosure>,
    );
    expect(getByText('Test Title')).toBeInTheDocument();
    expect(container.querySelector('.disclosure__content').textContent).toBe(
      'Test',
    );

    expect(
      container.querySelector('.disclosure__content.normal'),
    ).toBeInTheDocument();

    rerender(
      <Disclosure title="Test Title" size="small">
        Test
      </Disclosure>,
    );

    expect(
      container.querySelector('.disclosure__content.small'),
    ).toBeInTheDocument();
  });

  describe('when clicking on disclosure', () => {
    it('does not scroll down on open by default or when isScrollToBottomOnOpen is false', () => {
      const mockScrollIntoView = jest.fn();
      const originalScrollIntoView =
        window.HTMLElement.prototype.scrollIntoView;
      window.HTMLElement.prototype.scrollIntoView = mockScrollIntoView;

      const { getByTestId } = render(
        <Disclosure title="Test Title">Test</Disclosure>,
      );
      const element = getByTestId('disclosure');
      fireEvent.click(element);
      expect(mockScrollIntoView).not.toHaveBeenCalled();
      window.HTMLElement.prototype.scrollIntoView = originalScrollIntoView;
    });

    it('scrolls down on open when isScrollToBottomOnOpen is true', () => {
      const mockScrollIntoView = jest.fn();
      const originalScrollIntoView =
        window.HTMLElement.prototype.scrollIntoView;
      window.HTMLElement.prototype.scrollIntoView = mockScrollIntoView;

      const { getByTestId } = render(
        <Disclosure title="Test Title" isScrollToBottomOnOpen>
          Test
        </Disclosure>,
      );
      const element = getByTestId('disclosure');

      fireEvent.click(element);
      expect(mockScrollIntoView).toHaveBeenCalledWith({
        behavior: 'smooth',
      });
      window.HTMLElement.prototype.scrollIntoView = originalScrollIntoView;
    });
  });
});
