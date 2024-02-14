import React, { useRef } from 'react';
import { fireEvent, render, waitFor } from '@testing-library/react';
import Disclosure from './disclosure';

jest.mock('react', () => {
  const originReact = jest.requireActual('react');
  const mockUseRef = jest.fn();
  return {
    ...originReact,
    useRef: mockUseRef,
  };
});

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
    it.skip('toggles open state', async () => {
      const { container } = render(
        <Disclosure title="Test Title">Test</Disclosure>,
      );
      const element = container.querySelector('.disclosure');
      const elementDetails = container.querySelector('.disclosure > details');

      expect(elementDetails).not.toHaveAttribute('open');
      fireEvent.click(element);

      await waitFor(() => {
        expect(container.querySelector('details')).toHaveAttribute('open');
      });
    });

    it('does not scroll down on open by default or when isScrollToBottomOnOpen is false', () => {
      const spyScrollIntoView = jest.fn();
      const mockRef = { current: { scrollIntoView: spyScrollIntoView } };
      useRef.mockReturnValueOnce(mockRef);

      const { container } = render(
        <Disclosure title="Test Title">Test</Disclosure>,
      );
      const element = container.querySelector('.disclosure');
      fireEvent.click(element);
      expect(spyScrollIntoView).not.toHaveBeenCalled();
    });

    it.skip('scrolls down on open when isScrollToBottomOnOpen is true', () => {
      const spyScrollIntoView = jest.fn();
      const mockRef = { current: { scrollIntoView: spyScrollIntoView } };
      useRef.mockReturnValueOnce(mockRef);

      const { container } = render(
        <Disclosure title="Test Title">Test</Disclosure>,
      );
      const element = container.querySelector('.disclosure');

      expect(spyScrollIntoView).not.toHaveBeenCalled();
      fireEvent.click(element);
      expect(spyScrollIntoView).toHaveBeenCalled();
    });
  });
});
