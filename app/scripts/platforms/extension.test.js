import extension from 'extensionizer';
import ExtensionPlatform from './extension';

jest.mock('extensionizer', () => {
  return {
    runtime: {
      getManifest: jest.fn(),
    },
  };
});

describe('extension platform', () => {
  beforeEach(() => {
    // TODO: Delete this an enable 'resetMocks' in `jest.config.js` instead
    jest.resetAllMocks();
  });

  describe('getVersion', () => {
    it('should return non-prerelease version', () => {
      extension.runtime.getManifest.mockReturnValue({ version: '1.2.3' });
      const extensionPlatform = new ExtensionPlatform();

      const version = extensionPlatform.getVersion();

      expect(version).toBe('1.2.3');
    });

    it('should return SemVer-formatted version for Chrome style manifest of prerelease', () => {
      extension.runtime.getManifest.mockReturnValue({
        version: '1.2.3.0',
        version_name: 'beta',
      });
      const extensionPlatform = new ExtensionPlatform();

      const version = extensionPlatform.getVersion();

      expect(version).toBe('1.2.3-beta.0');
    });

    it('should return SemVer-formatted version for Firefox style manifest of prerelease', () => {
      extension.runtime.getManifest.mockReturnValue({
        version: '1.2.3.beta0',
      });
      const extensionPlatform = new ExtensionPlatform();

      const version = extensionPlatform.getVersion();

      expect(version).toBe('1.2.3-beta.0');
    });

    it('should throw error if build version is missing from Chrome style prerelease manifest', () => {
      extension.runtime.getManifest.mockReturnValue({
        version: '1.2.3',
        version_name: 'beta',
      });
      const extensionPlatform = new ExtensionPlatform();

      expect(() => extensionPlatform.getVersion()).toThrow(
        'Version missing build number:',
      );
    });

    it('should throw error if build type is missing from Chrome style prerelease manifest', () => {
      extension.runtime.getManifest.mockReturnValue({
        version: '1.2.3.0',
      });
      const extensionPlatform = new ExtensionPlatform();

      expect(() => extensionPlatform.getVersion()).toThrow(
        'Version contains invalid prerelease:',
      );
    });

    it('should throw error if build version is missing from Firefox style prerelease manifest', () => {
      extension.runtime.getManifest.mockReturnValue({
        version: '1.2.3.beta',
      });
      const extensionPlatform = new ExtensionPlatform();

      expect(() => extensionPlatform.getVersion()).toThrow(
        'Version contains invalid prerelease:',
      );
    });

    it('should throw error if build type is missing from Firefox style prerelease manifest', () => {
      extension.runtime.getManifest.mockReturnValue({
        version: '1.2.3.0',
      });
      const extensionPlatform = new ExtensionPlatform();

      expect(() => extensionPlatform.getVersion()).toThrow(
        'Version contains invalid prerelease:',
      );
    });
  });
});
