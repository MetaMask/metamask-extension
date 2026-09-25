/**
 * @jest-environment jsdom
 */
import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { ScrollContainer } from '../../../../contexts/scroll-container';
import { ScrollNearBottom } from './scroll-near-bottom';

function setScrollMetrics(
  element: HTMLElement,
  metrics: {
    scrollTop?: number;
    clientHeight?: number;
    scrollHeight?: number;
  },
) {
  Object.entries(metrics).forEach(([key, value]) => {
    Object.defineProperty(element, key, { value, configurable: true });
  });
}

describe('ScrollNearBottom', () => {
  it('calls onNearBottom when a scroll event lands within the threshold of the bottom', () => {
    const onNearBottom = jest.fn();
    render(
      <ScrollContainer data-testid="scroll-container">
        <ScrollNearBottom onNearBottom={onNearBottom} observedLength={10} />
      </ScrollContainer>,
    );

    const container = screen.getByTestId('scroll-container');
    setScrollMetrics(container, {
      scrollTop: 4300,
      clientHeight: 700,
      scrollHeight: 5000,
    });

    fireEvent.scroll(container);

    expect(onNearBottom).toHaveBeenCalledTimes(1);
  });

  it('does not call onNearBottom when the scroll position is far from the bottom', () => {
    const onNearBottom = jest.fn();
    render(
      <ScrollContainer data-testid="scroll-container">
        <ScrollNearBottom onNearBottom={onNearBottom} observedLength={10} />
      </ScrollContainer>,
    );

    const container = screen.getByTestId('scroll-container');
    setScrollMetrics(container, {
      scrollTop: 0,
      clientHeight: 700,
      scrollHeight: 5000,
    });

    fireEvent.scroll(container);

    expect(onNearBottom).not.toHaveBeenCalled();
  });

  it('does not attach scroll handling when disabled', () => {
    const onNearBottom = jest.fn();
    render(
      <ScrollContainer data-testid="scroll-container">
        <ScrollNearBottom
          onNearBottom={onNearBottom}
          enabled={false}
          observedLength={10}
        />
      </ScrollContainer>,
    );

    const container = screen.getByTestId('scroll-container');
    setScrollMetrics(container, {
      scrollTop: 4300,
      clientHeight: 700,
      scrollHeight: 5000,
    });

    fireEvent.scroll(container);

    expect(onNearBottom).not.toHaveBeenCalled();
  });

  it('checks immediately for short, unscrollable content when it becomes enabled', () => {
    const onNearBottom = jest.fn();
    const { rerender } = render(
      <ScrollContainer data-testid="scroll-container">
        <ScrollNearBottom
          onNearBottom={onNearBottom}
          enabled={false}
          observedLength={10}
        />
      </ScrollContainer>,
    );

    const container = screen.getByTestId('scroll-container');
    setScrollMetrics(container, {
      clientHeight: 500,
      scrollHeight: 500,
    });

    rerender(
      <ScrollContainer data-testid="scroll-container">
        <ScrollNearBottom onNearBottom={onNearBottom} observedLength={10} />
      </ScrollContainer>,
    );

    expect(onNearBottom).toHaveBeenCalledTimes(1);
  });

  it('re-evaluates short, unscrollable content when the observed length grows', () => {
    const onNearBottom = jest.fn();
    const { rerender } = render(
      <ScrollContainer data-testid="scroll-container">
        <ScrollNearBottom onNearBottom={onNearBottom} observedLength={1} />
      </ScrollContainer>,
    );

    const container = screen.getByTestId('scroll-container');
    setScrollMetrics(container, {
      clientHeight: 500,
      scrollHeight: 500,
    });

    rerender(
      <ScrollContainer data-testid="scroll-container">
        <ScrollNearBottom onNearBottom={onNearBottom} observedLength={2} />
      </ScrollContainer>,
    );

    expect(onNearBottom).toHaveBeenCalledTimes(1);
  });

  it('does not fire the immediate check for scrollable content, even when near the bottom', () => {
    const onNearBottom = jest.fn();
    const { rerender } = render(
      <ScrollContainer data-testid="scroll-container">
        <ScrollNearBottom onNearBottom={onNearBottom} observedLength={1} />
      </ScrollContainer>,
    );

    const container = screen.getByTestId('scroll-container');
    setScrollMetrics(container, {
      scrollTop: 4300,
      clientHeight: 700,
      scrollHeight: 5000,
    });

    rerender(
      <ScrollContainer data-testid="scroll-container">
        <ScrollNearBottom onNearBottom={onNearBottom} observedLength={2} />
      </ScrollContainer>,
    );

    expect(onNearBottom).not.toHaveBeenCalled();
  });
});
