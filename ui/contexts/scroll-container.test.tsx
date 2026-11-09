import React from 'react';
import { render, screen } from '@testing-library/react';
import {
  ScrollContainer,
  useScrollContainerGutterWidth,
} from './scroll-container';

const GutterWidth = () => (
  <span data-testid="gutter-width">{useScrollContainerGutterWidth()}</span>
);

const renderInMountedScrollContainer = () => {
  const { rerender } = render(<ScrollContainer />);
  rerender(
    <ScrollContainer>
      <GutterWidth />
    </ScrollContainer>,
  );
};

const mockElementWidths = (offsetWidth: number, clientWidth: number) => {
  jest
    .spyOn(HTMLElement.prototype, 'offsetWidth', 'get')
    .mockReturnValue(offsetWidth);
  jest
    .spyOn(HTMLElement.prototype, 'clientWidth', 'get')
    .mockReturnValue(clientWidth);
};

describe('useScrollContainerGutterWidth', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('returns the width reserved for a classic scrollbar', () => {
    mockElementWidths(400, 392);

    renderInMountedScrollContainer();

    expect(screen.getByTestId('gutter-width')).toHaveTextContent('8');
  });

  it('returns 0 for overlay scrollbars', () => {
    mockElementWidths(400, 400);

    renderInMountedScrollContainer();

    expect(screen.getByTestId('gutter-width')).toHaveTextContent('0');
  });

  it('returns 0 outside of a scroll container', () => {
    mockElementWidths(400, 392);

    render(<GutterWidth />);

    expect(screen.getByTestId('gutter-width')).toHaveTextContent('0');
  });
});
