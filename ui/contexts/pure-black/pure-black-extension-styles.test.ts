import {
  getExtensionModalBorderColor,
  getModalContentDialogClassName,
  getPureBlackPageInnerContainerClassName,
} from './pure-black-extension-styles';

describe('pure-black-extension-styles', () => {
  describe('getExtensionModalBorderColor', () => {
    it('uses border-default when pure black is inactive', () => {
      expect(getExtensionModalBorderColor(false)).toBe(
        'var(--color-border-default)',
      );
    });

    it('uses border-muted when pure black is active', () => {
      expect(getExtensionModalBorderColor(true)).toBe(
        'var(--color-border-muted)',
      );
    });
  });

  describe('getPureBlackPageInnerContainerClassName', () => {
    it('returns false when pure black is inactive', () => {
      expect(getPureBlackPageInnerContainerClassName(false)).toBe(false);
    });

    it('returns border-0 utility when pure black is active', () => {
      expect(getPureBlackPageInnerContainerClassName(true)).toBe('!border-0');
    });
  });

  describe('getModalContentDialogClassName', () => {
    it('returns false when pure black is inactive', () => {
      expect(getModalContentDialogClassName(false)).toBe(false);
    });

    it('returns background-alternative utility when pure black is active', () => {
      expect(getModalContentDialogClassName(true)).toBe(
        'bg-background-alternative',
      );
    });
  });
});
