import { brandColor } from '@metamask/design-tokens';

import {
  AMBIENT_NEGATIVE_COLOR,
  LIGHT_MODE_SUCCESS_GREEN,
  DARK_MODE_SUCCESS_GREEN,
  getAmbientColor,
  getAmbientSuccessColor,
} from './chart-theme-config';

describe('chart-theme-config', () => {
  describe('constants', () => {
    it('exports AMBIENT_NEGATIVE_COLOR from design-system orange400', () => {
      expect(AMBIENT_NEGATIVE_COLOR).toBe(brandColor.orange400);
    });

    it('exports LIGHT_MODE_SUCCESS_GREEN matching mobile', () => {
      expect(LIGHT_MODE_SUCCESS_GREEN).toBe('#00881A');
    });

    it('exports DARK_MODE_SUCCESS_GREEN from design-system lime100', () => {
      expect(DARK_MODE_SUCCESS_GREEN).toBe(brandColor.lime100);
    });
  });

  describe('getAmbientColor', () => {
    it('returns light-mode green for positive price in light mode', () => {
      expect(getAmbientColor(true, false)).toBe(LIGHT_MODE_SUCCESS_GREEN);
    });

    it('returns dark-mode green for positive price in dark mode', () => {
      expect(getAmbientColor(true, true)).toBe(DARK_MODE_SUCCESS_GREEN);
    });

    it('returns amber/orange for negative price in light mode', () => {
      expect(getAmbientColor(false, false)).toBe(AMBIENT_NEGATIVE_COLOR);
    });

    it('returns amber/orange for negative price in dark mode', () => {
      expect(getAmbientColor(false, true)).toBe(AMBIENT_NEGATIVE_COLOR);
    });
  });

  describe('getAmbientSuccessColor', () => {
    it('returns light-mode green in light mode', () => {
      expect(getAmbientSuccessColor(false)).toBe(LIGHT_MODE_SUCCESS_GREEN);
    });

    it('returns dark-mode green in dark mode', () => {
      expect(getAmbientSuccessColor(true)).toBe(DARK_MODE_SUCCESS_GREEN);
    });
  });
});
