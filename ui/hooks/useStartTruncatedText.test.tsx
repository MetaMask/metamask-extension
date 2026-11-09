import React from 'react';
import { act, render } from '@testing-library/react';
import { mockResizeObserver } from '../../test/lib/mock-resize-observer';
import { useStartTruncatedText } from './useStartTruncatedText';

const ADDRESS = '0x5CfE73b6021E818B776b421B1c4Db2474086a7e1';

const Fitted = ({ text, endChars }: { text: string; endChars?: number }) => {
  const [ref, value] = useStartTruncatedText(text, endChars);
  return <p ref={ref}>{value}</p>;
};

describe('useStartTruncatedText', () => {
  let rowWidth: number;

  beforeEach(() => {
    // jsdom has no layout: text is 10px per character, the element is rowWidth.
    jest
      .spyOn(HTMLElement.prototype, 'getBoundingClientRect')
      .mockImplementation(function (this: HTMLElement) {
        return {
          width:
            this.style.position === 'absolute'
              ? (this.textContent?.length ?? 0) * 10
              : rowWidth,
        } as DOMRect;
      });
  });

  it('shows the full text when it fits', () => {
    rowWidth = 500;
    const { container } = render(<Fitted text={ADDRESS} endChars={10} />);
    expect(container.textContent).toBe(ADDRESS);
  });

  it('keeps the last characters and shortens the start to fit', () => {
    rowWidth = 250;
    const { container } = render(<Fitted text={ADDRESS} endChars={10} />);
    expect(container.textContent).toBe('0x5CfE73b6021E…474086a7e1');
  });

  it('keeps the end of the text by default', () => {
    rowWidth = 100;
    const { container } = render(<Fitted text="Malicious address" />);
    expect(container.textContent).toBe('…s address');
  });

  it('shows more of the start when the element gets wider', () => {
    const resizeObserver = mockResizeObserver();
    rowWidth = 250;
    const { container } = render(<Fitted text={ADDRESS} endChars={10} />);

    rowWidth = 350;
    act(() => resizeObserver.resize(rowWidth));

    expect(container.textContent).toBe('0x5CfE73b6021E818B776b42…474086a7e1');
    resizeObserver.restore();
  });
});
