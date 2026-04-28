import { applyDefaultStopLossSign, isSignedDecimalInput } from './tpslInput';

describe('tpslInput', () => {
  describe('isSignedDecimalInput', () => {
    it('accepts signed decimal input states', () => {
      expect(isSignedDecimalInput('')).toBe(true);
      expect(isSignedDecimalInput('-')).toBe(true);
      expect(isSignedDecimalInput('-.')).toBe(true);
      expect(isSignedDecimalInput('+')).toBe(true);
      expect(isSignedDecimalInput('+.')).toBe(true);
      expect(isSignedDecimalInput('-12.5')).toBe(true);
      expect(isSignedDecimalInput('+12.5')).toBe(true);
      expect(isSignedDecimalInput('12.5')).toBe(true);
    });

    it('rejects invalid signed decimal input states', () => {
      expect(isSignedDecimalInput('--1')).toBe(false);
      expect(isSignedDecimalInput('++1')).toBe(false);
      expect(isSignedDecimalInput('-1-2')).toBe(false);
      expect(isSignedDecimalInput('1.2.3')).toBe(false);
      expect(isSignedDecimalInput('1a')).toBe(false);
    });
  });

  describe('applyDefaultStopLossSign', () => {
    it('prefixes an unsigned non-zero value when the field was empty', () => {
      expect(applyDefaultStopLossSign('10', '')).toBe('-10');
      expect(applyDefaultStopLossSign('0.5', '')).toBe('-0.5');
    });

    it('preserves explicit signed values', () => {
      expect(applyDefaultStopLossSign('-10', '')).toBe('-10');
      expect(applyDefaultStopLossSign('+10', '')).toBe('+10');
    });

    it('does not prefix zero or intermediate decimal states', () => {
      expect(applyDefaultStopLossSign('0', '')).toBe('0');
      expect(applyDefaultStopLossSign('0.', '')).toBe('0.');
      expect(applyDefaultStopLossSign('.', '')).toBe('.');
      expect(applyDefaultStopLossSign('', '')).toBe('');
    });

    it('does not coerce edits after input has content', () => {
      expect(applyDefaultStopLossSign('10', '-')).toBe('10');
      expect(applyDefaultStopLossSign('10', '-10')).toBe('10');
    });
  });
});
