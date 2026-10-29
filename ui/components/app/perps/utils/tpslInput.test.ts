import { applyDefaultStopLossSign, isSignedDecimalInput } from './tpslInput';

describe('tpslInput', () => {
  describe('isSignedDecimalInput', () => {
    it('accepts signed decimal input states', () => {
      expect(isSignedDecimalInput('')).toBe(true);
      expect(isSignedDecimalInput('-')).toBe(true);
      expect(isSignedDecimalInput('-.')).toBe(true);
      expect(isSignedDecimalInput('+')).toBe(true);
      expect(isSignedDecimalInput('+.')).toBe(true);
      expect(isSignedDecimalInput('.')).toBe(true);
      expect(isSignedDecimalInput('-12.5')).toBe(true);
      expect(isSignedDecimalInput('+12.5')).toBe(true);
      expect(isSignedDecimalInput('+15')).toBe(true);
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
    it('prefixes an initial unsigned positive value', () => {
      expect(applyDefaultStopLossSign('10', '')).toBe('-10');
      expect(applyDefaultStopLossSign('0.5', '')).toBe('-0.5');
    });

    it('preserves explicit signed values', () => {
      expect(applyDefaultStopLossSign('-10', '')).toBe('-10');
      expect(applyDefaultStopLossSign('+10', '')).toBe('+10');
      expect(applyDefaultStopLossSign('-.', '')).toBe('-.');
      expect(applyDefaultStopLossSign('+.', '')).toBe('+.');
    });

    it('does not prefix zero or intermediate decimal states', () => {
      expect(applyDefaultStopLossSign('0', '')).toBe('0');
      expect(applyDefaultStopLossSign('0.', '')).toBe('0.');
      expect(applyDefaultStopLossSign('.', '')).toBe('.');
      expect(applyDefaultStopLossSign('', '')).toBe('');
    });

    it('normalizes leading zeros before applying the default sign', () => {
      expect(applyDefaultStopLossSign('00', '')).toBe('0');
      expect(applyDefaultStopLossSign('01', '')).toBe('-1');
      expect(applyDefaultStopLossSign('011', '')).toBe('-11');
      expect(applyDefaultStopLossSign('.1', '')).toBe('-0.1');
      expect(applyDefaultStopLossSign('+011', '')).toBe('+11');
      expect(applyDefaultStopLossSign('-011', '')).toBe('-11');
    });

    it('defaults to negative when appending to a zero-like value', () => {
      expect(applyDefaultStopLossSign('01', '0')).toBe('-1');
      expect(applyDefaultStopLossSign('0.1', '0.')).toBe('-0.1');
    });

    it('does not re-prefix when a user deletes the leading minus', () => {
      expect(applyDefaultStopLossSign('1', '-1')).toBe('1');
      expect(applyDefaultStopLossSign('10', '-10')).toBe('10');
    });
  });
});
