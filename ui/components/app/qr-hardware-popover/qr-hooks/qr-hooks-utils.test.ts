import { isFirefoxBrowser } from '../../../../../shared/lib/browser-runtime.utils';
import { CameraPermissionState } from '../../../../contexts/hardware-wallets/constants';
import { DOMExceptionName } from '../base-reader.types';
import {
  shouldShowBlockedUi,
  isNotAllowedError,
  extractCurrentRoute,
} from './qr-hooks-utils';

jest.mock('../../../../../shared/lib/browser-runtime.utils', () => ({
  ...jest.requireActual('../../../../../shared/lib/browser-runtime.utils'),
  isFirefoxBrowser: jest.fn(() => false),
}));

const mockIsFirefoxBrowser = jest.mocked(isFirefoxBrowser);

describe('qr-hooks-utils', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockIsFirefoxBrowser.mockReturnValue(false);
  });

  describe('shouldShowBlockedUi', () => {
    it('returns true when permission state is denied on Chromium', () => {
      mockIsFirefoxBrowser.mockReturnValue(false);
      expect(shouldShowBlockedUi(CameraPermissionState.Denied)).toBe(true);
    });

    it('returns true when permission state is denied on Firefox', () => {
      mockIsFirefoxBrowser.mockReturnValue(true);
      expect(shouldShowBlockedUi(CameraPermissionState.Denied)).toBe(true);
    });

    it('returns false when permission state is prompt on Chromium', () => {
      mockIsFirefoxBrowser.mockReturnValue(false);
      expect(shouldShowBlockedUi(CameraPermissionState.Prompt)).toBe(false);
    });

    it('returns true when permission state is prompt on Firefox', () => {
      mockIsFirefoxBrowser.mockReturnValue(true);
      expect(shouldShowBlockedUi(CameraPermissionState.Prompt)).toBe(true);
    });

    it('returns false when permission state is granted on Chromium', () => {
      mockIsFirefoxBrowser.mockReturnValue(false);
      expect(shouldShowBlockedUi(CameraPermissionState.Granted)).toBe(false);
    });

    it('returns false when permission state is granted on Firefox', () => {
      mockIsFirefoxBrowser.mockReturnValue(true);
      expect(shouldShowBlockedUi(CameraPermissionState.Granted)).toBe(false);
    });
  });

  describe('isNotAllowedError', () => {
    it('returns true for an error with name NotAllowedError', () => {
      const error = new Error('denied');
      error.name = DOMExceptionName.NotAllowed;
      expect(isNotAllowedError(error)).toBe(true);
    });

    it('returns false for an error with a different name', () => {
      const error = new Error('not readable');
      error.name = 'NotReadableError';
      expect(isNotAllowedError(error)).toBe(false);
    });

    it('returns false for a plain Error without a custom name', () => {
      expect(isNotAllowedError(new Error('generic'))).toBe(false);
    });

    it('returns false for null', () => {
      expect(isNotAllowedError(null)).toBe(false);
    });

    it('returns false for undefined', () => {
      expect(isNotAllowedError(undefined)).toBe(false);
    });

    it('returns false for a non-object value', () => {
      expect(isNotAllowedError(DOMExceptionName.NotAllowed)).toBe(false);
    });
  });

  describe('extractCurrentRoute', () => {
    const originalLocation = globalThis.location;

    afterEach(() => {
      Object.defineProperty(globalThis, 'location', {
        value: originalLocation,
        writable: true,
      });
    });

    it('returns the hash without the leading # character', () => {
      Object.defineProperty(globalThis, 'location', {
        value: new URL('chrome-extension://abc/home.html#/settings/general'),
        writable: true,
      });
      expect(extractCurrentRoute()).toBe('/settings/general');
    });

    it('returns null when there is no hash', () => {
      Object.defineProperty(globalThis, 'location', {
        value: new URL('chrome-extension://abc/home.html'),
        writable: true,
      });
      expect(extractCurrentRoute()).toBeNull();
    });

    it('returns null for an empty hash', () => {
      Object.defineProperty(globalThis, 'location', {
        value: new URL('chrome-extension://abc/home.html#'),
        writable: true,
      });
      expect(extractCurrentRoute()).toBeNull();
    });
  });
});
