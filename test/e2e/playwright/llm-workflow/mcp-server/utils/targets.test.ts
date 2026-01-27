import { validateTargetSelection } from './targets';

describe('utils/targets', () => {
  describe('validateTargetSelection', () => {
    it('validates testId target', () => {
      const result = validateTargetSelection({ testId: 'submit-button' });

      expect(result.valid).toBe(true);
      if (result.valid) {
        expect(result.type).toBe('testId');
        expect(result.value).toBe('submit-button');
      }
    });

    it('validates a11yRef target', () => {
      const result = validateTargetSelection({ a11yRef: 'e5' });

      expect(result.valid).toBe(true);
      if (result.valid) {
        expect(result.type).toBe('a11yRef');
        expect(result.value).toBe('e5');
      }
    });

    it('validates selector target', () => {
      const result = validateTargetSelection({ selector: '.btn-primary' });

      expect(result.valid).toBe(true);
      if (result.valid) {
        expect(result.type).toBe('selector');
        expect(result.value).toBe('.btn-primary');
      }
    });

    it('rejects when no target provided', () => {
      const result = validateTargetSelection({});

      expect(result.valid).toBe(false);
      if (!result.valid) {
        expect(result.error).toContain('one of');
      }
    });

    it('rejects when multiple targets provided', () => {
      const result = validateTargetSelection({
        testId: 'btn',
        selector: '.btn',
      });

      expect(result.valid).toBe(false);
      if (!result.valid) {
        expect(result.error).toContain('Exactly one');
      }
    });

    it('rejects when all three targets provided', () => {
      const result = validateTargetSelection({
        testId: 'btn',
        selector: '.btn',
        a11yRef: 'e1',
      });

      expect(result.valid).toBe(false);
    });

    it('handles undefined values correctly', () => {
      const result = validateTargetSelection({
        testId: 'btn',
        selector: undefined,
        a11yRef: undefined,
      });

      expect(result.valid).toBe(true);
    });
  });
});
