/**
 * Tests for the patched packages audit script
 *
 * @jest-environment node
 */

// Mock functions to test without actually importing the full module
// These are extracted from the main file for testing

interface ParsedPackage {
  name: string;
  version: string;
}

/**
 * Extracts package name and version from Yarn patch protocol string
 */
function parsePatchProtocol(patchString: string): ParsedPackage | null {
  if (!patchString.startsWith('patch:')) {
    return null;
  }

  // Handle nested patches - extract the innermost package reference
  // URL decode the string to handle %3A -> : and %253A -> %3A -> :
  let decoded = patchString;
  // Keep decoding until no more encoded characters
  while (decoded.includes('%')) {
    const newDecoded = decodeURIComponent(decoded);
    if (newDecoded === decoded) break;
    decoded = newDecoded;
  }

  // Match patterns like:
  // patch:lodash@npm:4.17.21#...
  // patch:@scope/package@npm:1.2.3#...
  // For nested patches, find the first complete package@npm:version pattern
  const match = decoded.match(/patch:(@?[^@]+)@npm:([^#]+?)(?:#|$)/);

  if (!match) {
    return null;
  }

  const name = match[1];
  const version = match[2];

  // Clean up version (remove any trailing patch info)
  const cleanVersion = version.split('#')[0].split('@')[0];

  return { name, version: cleanVersion };
}

describe('parsePatchProtocol', () => {
  describe('simple packages', () => {
    it('parses simple package with URL-encoded colon', () => {
      const result = parsePatchProtocol(
        'patch:lodash@npm%3A4.17.21#~/.yarn/patches/lodash-npm-4.17.21-6382451519.patch',
      );
      expect(result).toEqual({ name: 'lodash', version: '4.17.21' });
    });

    it('parses simple package with non-encoded colon', () => {
      const result = parsePatchProtocol(
        'patch:lodash@npm:4.17.21#~/.yarn/patches/lodash.patch',
      );
      expect(result).toEqual({ name: 'lodash', version: '4.17.21' });
    });

    it('parses package with semver version', () => {
      const result = parsePatchProtocol(
        'patch:dompurify@npm%3A3.2.5#~/.yarn/patches/dompurify-npm-3.2.5-d9af707abe.patch',
      );
      expect(result).toEqual({ name: 'dompurify', version: '3.2.5' });
    });
  });

  describe('scoped packages', () => {
    it('parses scoped package', () => {
      const result = parsePatchProtocol(
        'patch:@babel/core@npm%3A7.25.9#~/.yarn/patches/@babel-core-npm-7.25.9-4ae3bff7f3.patch',
      );
      expect(result).toEqual({ name: '@babel/core', version: '7.25.9' });
    });

    it('parses scoped package with long name', () => {
      const result = parsePatchProtocol(
        'patch:@metamask/bridge-controller@npm%3A64.0.0#~/.yarn/patches/@metamask-bridge-controller-npm-64.0.0-956740f7c8.patch',
      );
      expect(result).toEqual({
        name: '@metamask/bridge-controller',
        version: '64.0.0',
      });
    });

    it('parses @endo scoped package', () => {
      const result = parsePatchProtocol(
        'patch:@endo/env-options@npm%3A1.1.11#~/.yarn/patches/@endo-env-options-npm-1.1.11-1b7fae374a.patch',
      );
      expect(result).toEqual({ name: '@endo/env-options', version: '1.1.11' });
    });
  });

  describe('nested patches', () => {
    it('parses double-nested patch', () => {
      // Real example from the codebase
      const result = parsePatchProtocol(
        'patch:@rive-app/canvas@patch%3A@rive-app/canvas@patch%253A@rive-app/canvas@npm%25253A2.31.5%2523~/.yarn/patches/@rive-app-canvas-npm-2.31.5-df519c6e0f.patch%253A%253Aversion=2.31.5&hash=1ed092%23~/.yarn/patches/@rive-app-canvas-patch-9b746e9393.patch%3A%3Aversion=2.31.5&hash=19c5d0#~/.yarn/patches/@rive-app-canvas-patch-03752f0c3b.patch',
      );
      expect(result).toEqual({ name: '@rive-app/canvas', version: '2.31.5' });
    });
  });

  describe('edge cases', () => {
    it('returns null for non-patch strings', () => {
      expect(parsePatchProtocol('^4.17.21')).toBeNull();
      expect(parsePatchProtocol('lodash@4.17.21')).toBeNull();
      expect(parsePatchProtocol('npm:lodash@4.17.21')).toBeNull();
    });

    it('returns null for empty string', () => {
      expect(parsePatchProtocol('')).toBeNull();
    });

    it('returns null for malformed patch string', () => {
      expect(parsePatchProtocol('patch:invalid')).toBeNull();
      expect(parsePatchProtocol('patch:lodash')).toBeNull();
    });
  });

  describe('real-world examples from package.json', () => {
    const realExamples = [
      {
        input:
          'patch:acorn@npm:7.4.1#.yarn/patches/acorn-npm-7.4.1-f450b4646c.patch',
        expected: { name: 'acorn', version: '7.4.1' },
      },
      {
        input:
          'patch:object.values@npm%3A1.1.5#./.yarn/patches/object.values-npm-1.1.5-f1de7f3742.patch',
        expected: { name: 'object.values', version: '1.1.5' },
      },
      {
        input:
          'patch:eslint-import-resolver-typescript@npm%3A2.5.0#./.yarn/patches/eslint-import-resolver-typescript-npm-2.5.0-3b8adf0d03.patch',
        expected: {
          name: 'eslint-import-resolver-typescript',
          version: '2.5.0',
        },
      },
      {
        input:
          'patch:@reduxjs/toolkit@npm%3A1.9.7#~/.yarn/patches/@reduxjs-toolkit-npm-1.9.7-b14925495c.patch',
        expected: { name: '@reduxjs/toolkit', version: '1.9.7' },
      },
      {
        input:
          'patch:@sentry/browser@npm%3A8.33.1#~/.yarn/patches/@sentry-browser-npm-8.33.1-4405cafca3.patch',
        expected: { name: '@sentry/browser', version: '8.33.1' },
      },
      {
        input:
          'patch:eth-lattice-keyring@npm%3A0.12.4#~/.yarn/patches/eth-lattice-keyring-npm-0.12.4-c5fb3fcf54.patch',
        expected: { name: 'eth-lattice-keyring', version: '0.12.4' },
      },
    ];

    it.each(realExamples)(
      'parses $expected.name@$expected.version correctly',
      ({ input, expected }) => {
        expect(parsePatchProtocol(input)).toEqual(expected);
      },
    );
  });
});

describe('getPatchedPackages integration', () => {
  interface PackageJson {
    resolutions?: Record<string, string>;
    dependencies?: Record<string, string>;
  }

  function getPatchedPackages(packageJson: PackageJson): Map<string, string> {
    const patchedPackages = new Map<string, string>();

    // Check resolutions
    const resolutions = packageJson.resolutions || {};
    for (const value of Object.values(resolutions)) {
      if (typeof value === 'string' && value.startsWith('patch:')) {
        const parsed = parsePatchProtocol(value);
        if (parsed && parsed.version) {
          if (!patchedPackages.has(parsed.name)) {
            patchedPackages.set(parsed.name, parsed.version);
          }
        }
      }
    }

    // Also check direct dependencies for patches
    const dependencies = packageJson.dependencies || {};
    for (const value of Object.values(dependencies)) {
      if (typeof value === 'string' && value.startsWith('patch:')) {
        const parsed = parsePatchProtocol(value);
        if (parsed && parsed.version) {
          if (!patchedPackages.has(parsed.name)) {
            patchedPackages.set(parsed.name, parsed.version);
          }
        }
      }
    }

    return patchedPackages;
  }

  it('extracts patched packages from resolutions', () => {
    const packageJson: PackageJson = {
      resolutions: {
        lodash:
          'patch:lodash@npm%3A4.17.21#~/.yarn/patches/lodash.patch',
        '@babel/core':
          'patch:@babel/core@npm%3A7.25.9#~/.yarn/patches/@babel-core.patch',
        'some-other-package': '^1.0.0', // Not a patch
      },
    };

    const result = getPatchedPackages(packageJson);

    expect(result.size).toBe(2);
    expect(result.get('lodash')).toBe('4.17.21');
    expect(result.get('@babel/core')).toBe('7.25.9');
  });

  it('extracts patched packages from dependencies', () => {
    const packageJson: PackageJson = {
      dependencies: {
        dompurify:
          'patch:dompurify@npm%3A3.2.5#~/.yarn/patches/dompurify.patch',
        react: '^18.0.0', // Not a patch
      },
    };

    const result = getPatchedPackages(packageJson);

    expect(result.size).toBe(1);
    expect(result.get('dompurify')).toBe('3.2.5');
  });

  it('deduplicates packages appearing in both resolutions and dependencies', () => {
    const packageJson: PackageJson = {
      resolutions: {
        lodash:
          'patch:lodash@npm%3A4.17.21#~/.yarn/patches/lodash.patch',
      },
      dependencies: {
        lodash:
          'patch:lodash@npm%3A4.17.21#~/.yarn/patches/lodash-other.patch',
      },
    };

    const result = getPatchedPackages(packageJson);

    // Should only have one entry for lodash
    expect(result.size).toBe(1);
    expect(result.get('lodash')).toBe('4.17.21');
  });

  it('handles empty package.json', () => {
    const packageJson: PackageJson = {};

    const result = getPatchedPackages(packageJson);

    expect(result.size).toBe(0);
  });

  it('handles package.json with no patches', () => {
    const packageJson: PackageJson = {
      resolutions: {
        lodash: '^4.17.21',
        react: '^18.0.0',
      },
      dependencies: {
        typescript: '^5.0.0',
      },
    };

    const result = getPatchedPackages(packageJson);

    expect(result.size).toBe(0);
  });
});
