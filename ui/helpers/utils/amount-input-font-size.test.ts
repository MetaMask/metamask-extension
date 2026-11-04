import {
  AMOUNT_INPUT_FONT_SIZES,
  AMOUNT_INPUT_MAX_FONT_SIZE,
  AMOUNT_INPUT_MIN_FONT_SIZE,
  AMOUNT_INPUT_TRANSITION_CLASS_NAME,
  estimateAmountTextWidthEm,
  getAmountInputFontSize,
  getAmountInputTextStyle,
} from './amount-input-font-size';

describe('amount-input-font-size', () => {
  describe('AMOUNT_INPUT_FONT_SIZES', () => {
    it('steps down from 88px to a 20px floor', () => {
      expect(AMOUNT_INPUT_FONT_SIZES).toStrictEqual([
        88, 72, 60, 48, 40, 32, 24, 20,
      ]);
      expect(AMOUNT_INPUT_MAX_FONT_SIZE).toBe(88);
      expect(AMOUNT_INPUT_MIN_FONT_SIZE).toBe(20);
    });
  });

  describe('estimateAmountTextWidthEm', () => {
    it('counts separators as narrower than digits', () => {
      expect(estimateAmountTextWidthEm('1.5')).toBeLessThan(
        estimateAmountTextWidthEm('105'),
      );
    });

    it('counts fallback glyphs such as ₩ wider than Grotzec symbols', () => {
      expect(estimateAmountTextWidthEm('₩1')).toBeGreaterThan(
        estimateAmountTextWidthEm('$1'),
      );
    });
  });

  describe('getAmountInputFontSize', () => {
    const popupCases: [string, number][] = [
      ['$0', 88],
      ['$25', 88],
      ['$1234567', 88],
      ['$1234567.89', 72],
      ['$123456789.12', 60],
      ['$12345678901234.56', 40],
      ['$1234567890123456789012.12', 24],
      [`$${'1'.repeat(32)}`, 20],
    ];

    for (const [text, expected] of popupCases) {
      it(`returns ${expected}px for ${text} in the popup width`, () => {
        expect(getAmountInputFontSize(text)).toBe(expected);
      });
    }

    it('shrinks a 10-digit amount with the KRW code prefix until it fits the popup width', () => {
      const text = 'KRW1234567890';
      const fontSize = getAmountInputFontSize(text);

      expect(fontSize).toBe(48);
      expect(estimateAmountTextWidthEm(text) * fontSize).toBeLessThanOrEqual(
        328,
      );
    });

    it('never starts above maxFontSize', () => {
      expect(getAmountInputFontSize('1', { maxFontSize: 40 })).toBe(40);
    });

    it('uses the steps below maxFontSize for a narrow field', () => {
      expect(
        getAmountInputFontSize('1234567.123456', {
          availableWidth: 219,
          maxFontSize: 40,
        }),
      ).toBe(32);
    });

    it('returns the floor when nothing fits', () => {
      expect(
        getAmountInputFontSize('1'.repeat(80), { availableWidth: 100 }),
      ).toBe(20);
    });
  });

  describe('AMOUNT_INPUT_TRANSITION_CLASS_NAME', () => {
    it('animates the font size and turns off for reduced motion', () => {
      expect(AMOUNT_INPUT_TRANSITION_CLASS_NAME).toContain(
        'transition-[color,font-size,line-height]',
      );
      expect(AMOUNT_INPUT_TRANSITION_CLASS_NAME).toContain(
        'motion-reduce:transition-none',
      );
    });
  });

  describe('getAmountInputTextStyle', () => {
    it('sets line height equal to the font size', () => {
      expect(getAmountInputTextStyle(48)).toStrictEqual({
        fontSize: 48,
        lineHeight: '48px',
      });
    });
  });
});
