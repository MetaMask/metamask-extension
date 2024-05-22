import {
  parseVersion,
  compareVersions,
  SemVersion,
  getMetamaskVersion,
} from './semversion';
import ExtensionPlatform from '../../app/scripts/platforms/extension';
import { Platform } from '../../types/global';

describe('versionUtils', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });
  describe('parseVersion', () => {
    it('parses valid version strings', () => {
      expect(parseVersion('1.2.3')).toEqual({ major: 1, minor: 2, patch: 3 });
    });

    it('returns null for empty strings', () => {
      expect(parseVersion('')).toBeNull();
    });

    it('returns null for invalid formats', () => {
      expect(parseVersion('1.2')).toBeNull();
      expect(parseVersion('1.2.x')).toBeNull();
      expect(parseVersion('a.b.c')).toBeNull();
    });

    it('returns null for negative numbers', () => {
      expect(parseVersion('-1.2.3')).toBeNull();
    });

    it('returns null for semver strings with extra characters', () => {
      expect(parseVersion('1.2.3-beta')).toBeNull();
    });
  });

  describe('compareVersions', () => {
    it('compares versions based on major, minor, and patch numbers', () => {
      const v1: SemVersion = { major: 1, minor: 0, patch: 0 };
      const v2: SemVersion = { major: 2, minor: 0, patch: 0 };
      const v3: SemVersion = { major: 1, minor: 1, patch: 0 };
      const v4: SemVersion = { major: 1, minor: 1, patch: 1 };
      expect(compareVersions(v1, v2)).toBeLessThan(0);
      expect(compareVersions(v2, v1)).toBeGreaterThan(0);
      expect(compareVersions(v3, v4)).toBeLessThan(0);
      expect(compareVersions(v4, v3)).toBeGreaterThan(0);
      expect(compareVersions(v1, v1)).toBe(0);
    });
  });

  describe('getMetamaskVersion', () => {
    const getVersionMock = jest.fn();
    const mockExtensionPlatform = {
      getVersion: getVersionMock,
    } as unknown as ExtensionPlatform;

    let originalPlatform: Platform;

    beforeAll(() => {
      originalPlatform = global.platform;
      global.platform = mockExtensionPlatform;
    });

    beforeEach(() => {
      getVersionMock.mockClear();
    });

    afterAll(() => {
      global.platform = originalPlatform;
    });

    it('should return the parsed Metamask version', () => {
      getVersionMock.mockReturnValue('1.2.3');
      expect(getMetamaskVersion()).toEqual({ major: 1, minor: 2, patch: 3 });
    });

    it('should return null if parsing the Metamask version fails', () => {
      getVersionMock.mockReturnValue('invalid');
      expect(getMetamaskVersion()).toBeNull();
    });
  });
});
