import { useLayoutEffect, useRef, useState } from 'react';

// Space between the typed amount and the symbol that follows it.
const SYMBOL_GAP_PX = 8;
// Same inset the field uses for its text, so a long amount stops before the symbol.
const SYMBOL_RIGHT_INSET_PX = 16;

type SymbolLayout = {
  left: number;
  paddingRight: number;
};

type SymbolLayoutInput = {
  fieldLeft: number;
  fieldWidth: number;
  inputRight: number;
  symbolWidth: number;
  textStart: number;
  textWidth: number;
};

/**
 * Places the symbol just after the typed amount, and pads the input once the
 * symbol is pinned to the field edge.
 */
export function getSymbolLayout({
  fieldLeft,
  fieldWidth,
  inputRight,
  symbolWidth,
  textStart,
  textWidth,
}: SymbolLayoutInput): SymbolLayout {
  const naturalLeft = textStart + textWidth + SYMBOL_GAP_PX;
  const maxLeft = fieldWidth - symbolWidth - SYMBOL_RIGHT_INSET_PX;
  const left = Math.round(Math.max(0, Math.min(naturalLeft, maxLeft)));
  // The input is content-box, so this padding is applied as border-box and
  // stays inside the field instead of pushing the digits under the symbol.
  const paddingRight =
    naturalLeft > maxLeft
      ? Math.ceil(inputRight - fieldLeft - (left - SYMBOL_GAP_PX))
      : 0;

  return { left, paddingRight };
}

/**
 * Measures the send amount field and returns where the symbol should sit.
 *
 * @param amount - The amount currently shown in the field.
 * @param symbol - The token or fiat symbol drawn after the amount.
 */
export function useAmountSymbolLayout(
  amount: string,
  symbol: string | undefined,
) {
  const fieldRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const measureRef = useRef<HTMLElement | null>(null);
  const symbolRef = useRef<HTMLElement | null>(null);
  const [symbolLayout, setSymbolLayout] = useState<SymbolLayout>({
    left: SYMBOL_RIGHT_INSET_PX,
    paddingRight: 0,
  });

  useLayoutEffect(() => {
    const field = fieldRef.current;
    const input = inputRef.current;
    const measure = measureRef.current;
    const symbolElement = symbolRef.current;
    if (!field || !input || !measure || !symbolElement) {
      return undefined;
    }

    const update = () => {
      const inputStyle = window.getComputedStyle(input);
      measure.style.font = inputStyle.font;
      measure.style.letterSpacing = inputStyle.letterSpacing;
      measure.style.fontVariantNumeric = inputStyle.fontVariantNumeric;
      measure.style.fontFeatureSettings = inputStyle.fontFeatureSettings;

      const fieldRect = field.getBoundingClientRect();
      const inputRect = input.getBoundingClientRect();
      const paddingLeft = Number.parseFloat(inputStyle.paddingLeft) || 0;
      const nextLayout = getSymbolLayout({
        fieldLeft: fieldRect.left,
        fieldWidth: fieldRect.width,
        inputRight: inputRect.right,
        symbolWidth: symbolElement.getBoundingClientRect().width,
        textStart: inputRect.left - fieldRect.left + paddingLeft,
        textWidth: measure.getBoundingClientRect().width,
      });

      setSymbolLayout((current) =>
        current.left === nextLayout.left &&
        current.paddingRight === nextLayout.paddingRight
          ? current
          : nextLayout,
      );
    };

    update();
    const observer = new ResizeObserver(update);
    observer.observe(field);

    let cancelled = false;
    document.fonts?.ready
      .then(() => {
        if (!cancelled) {
          update();
        }
      })
      .catch(() => undefined);

    return () => {
      cancelled = true;
      observer.disconnect();
    };
  }, [amount, symbol]);

  return { fieldRef, inputRef, measureRef, symbolLayout, symbolRef };
}
