import React from 'react';
import { act, render, screen } from '@testing-library/react';
import {
  mockResizeObserver,
  type ResizeObserverMock,
} from '../../../../test/lib/mock-resize-observer';
import {
  mockTextWidth,
  type TextWidthMock,
} from '../../../../test/lib/mock-text-width';
import {
  ADDRESS_END_CHARS,
  StartTruncatedText,
  fitTextStart,
  truncateStart,
} from './start-truncated-text';

const ADDRESS = '0x36dB199F0a1cD131ad0b5Cf4Fe7FE522839a1B2C';
const CHAR_WIDTH = 10;
const measureByLength = (value: string) => value.length * CHAR_WIDTH;

describe('truncateStart', () => {
  it('returns the text when it is short enough', () => {
    expect(truncateStart('USDC', 4, ADDRESS_END_CHARS)).toBe('USDC');
  });

  it('keeps the end characters and fills the rest from the start', () => {
    expect(truncateStart(ADDRESS, 24, ADDRESS_END_CHARS)).toBe(
      '0x36dB199F0a1c…22839a1B2C',
    );
  });

  it('shows only the end when fewer characters fit than the end needs', () => {
    expect(truncateStart(ADDRESS, 6, ADDRESS_END_CHARS)).toBe('…9a1B2C');
  });

  it('shortens only the start when no end count is given', () => {
    expect(truncateStart('Malicious address', 9, Infinity)).toBe('…s address');
  });
});

describe('fitTextStart', () => {
  it('returns the full text when it fits', () => {
    expect(fitTextStart(ADDRESS, ADDRESS_END_CHARS, 420, measureByLength)).toBe(
      ADDRESS,
    );
  });

  it('fits as many characters as the width allows', () => {
    expect(fitTextStart(ADDRESS, ADDRESS_END_CHARS, 255, measureByLength)).toBe(
      '0x36dB199F0a1c…22839a1B2C',
    );
  });

  it('shows more of the start in a wider row', () => {
    expect(fitTextStart(ADDRESS, ADDRESS_END_CHARS, 350, measureByLength)).toBe(
      '0x36dB199F0a1cD131ad0b5C…22839a1B2C',
    );
  });

  it('keeps the end of a name', () => {
    expect(
      fitTextStart('Malicious address', Infinity, 100, measureByLength),
    ).toBe('…s address');
  });

  it('shows only the ellipsis when nothing else fits', () => {
    expect(fitTextStart(ADDRESS, ADDRESS_END_CHARS, 5, measureByLength)).toBe(
      '…',
    );
  });
});

describe('StartTruncatedText', () => {
  let resizeObserver: ResizeObserverMock;
  let textWidth: TextWidthMock;

  beforeEach(() => {
    resizeObserver = mockResizeObserver();
    textWidth = mockTextWidth();
  });

  afterEach(() => {
    textWidth.restore();
    resizeObserver.restore();
  });

  it('shows the full text before the row is measured', () => {
    render(<StartTruncatedText text={ADDRESS} endChars={ADDRESS_END_CHARS} />);

    expect(screen.getByText(ADDRESS)).toBeInTheDocument();
  });

  it('fits the text to the row width', () => {
    textWidth.setRowWidth(250);
    render(<StartTruncatedText text={ADDRESS} endChars={ADDRESS_END_CHARS} />);

    expect(screen.getByText('0x36dB199F0a1c…22839a1B2C')).toBeInTheDocument();
  });

  it('shows the full text when the row is wide enough', () => {
    textWidth.setRowWidth(500);
    render(<StartTruncatedText text={ADDRESS} endChars={ADDRESS_END_CHARS} />);

    expect(screen.getByText(ADDRESS)).toBeInTheDocument();
  });

  it('fits again when the row resizes', () => {
    textWidth.setRowWidth(250);
    render(<StartTruncatedText text={ADDRESS} endChars={ADDRESS_END_CHARS} />);

    textWidth.setRowWidth(350);
    act(() => resizeObserver.resize(350));

    expect(
      screen.getByText('0x36dB199F0a1cD131ad0b5C…22839a1B2C'),
    ).toBeInTheDocument();
  });

  it('removes the measuring element after fitting', () => {
    textWidth.setRowWidth(250);
    const { container } = render(
      <StartTruncatedText text={ADDRESS} endChars={ADDRESS_END_CHARS} />,
    );

    expect(container.querySelectorAll('span')).toHaveLength(1);
  });
});
