import { describe, it, before } from 'node:test';
import assert from 'node:assert';
import { getExtensionVersion } from '../utils/version';

describe('getMetaMaskVersion', () => {
  const MIN_ID = 10;
  const MAX_ID = 64;
  const MIN_RELEASE = 0;
  const MAX_RELEASE = 999;

  describe('exceptions', () => {
    it(`should throw for build with negative id (-1)`, () => {
      const test = () => getExtensionVersion('main', { id: -1 }, 0);
      assert.throws(test);
    });

    it('should throw for build with an invalid id (0)', () => {
      const test = () => getExtensionVersion('main', { id: 0 }, 0);
      assert.throws(test);
    });

    it(`should throw for build with an invalid id (${MIN_ID - 1})`, () => {
      const test = () => getExtensionVersion('main', { id: MIN_ID - 1 }, 0);
      assert.throws(test);
    });

    it(`should throw for build with invalid id (${MAX_ID + 1})`, () => {
      const test = () => getExtensionVersion('main', { id: MAX_ID + 1 }, 0);
      assert.throws(test);
    });

    it('should throw when computing the version for build with prerelease implicitly disallowed, release version: 1', () => {
      const test = () => getExtensionVersion('main', { id: 10 }, 1);
      assert.throws(test);
    });

    it('should throw when computing the version for build with prerelease explicitly disallowed, release version: 1', () => {
      const test = () =>
        getExtensionVersion('main', { id: 10, isPrerelease: false }, 1);
      assert.throws(test);
    });

    it(`should throw when computing the version for build with prerelease disallowed, release version: ${
      MAX_RELEASE + 1
    }`, () => {
      const test = () =>
        getExtensionVersion('main', { id: 10 }, MAX_RELEASE + 1);
      assert.throws(test);
    });

    it(`should throw for allowed prerelease, bad release version: ${
      MIN_RELEASE - 1
    }`, () => {
      const test = () =>
        getExtensionVersion(
          'beta',
          { id: 11, isPrerelease: true },
          MIN_RELEASE - 1,
        );
      assert.throws(test);
    });

    it(`should throw when computing the version for allowed prerelease, bad release version: ${
      MAX_RELEASE + 1
    }`, () => {
      const test = () =>
        getExtensionVersion(
          'beta',
          { id: 11, isPrerelease: true },
          MAX_RELEASE + 1,
        );
      assert.throws(test);
    });
  });

  describe('success', () => {
    let pVersion: string;
    before(() => {
      pVersion = require('../../../package.json').version;
    });

    it(`for build with prerelease disallowed, id: ${MIN_ID}, release version: ${MIN_RELEASE}`, () => {
      const mmVersion = getExtensionVersion(
        'main',
        { id: MIN_ID },
        MIN_RELEASE,
      );
      assert.deepStrictEqual(mmVersion, {
        version: `${pVersion}.0`,
        versionName: pVersion,
      });
    });

    it(`should return the computed version for allowed prerelease, id: ${MIN_ID}, release version: ${MIN_RELEASE}`, () => {
      const mmVersion = getExtensionVersion(
        'beta',
        { id: MIN_ID, isPrerelease: true },
        MIN_RELEASE,
      );
      assert.deepStrictEqual(mmVersion, {
        version: `${pVersion}.${MIN_ID}${MIN_RELEASE}`,
        versionName: `${pVersion}-beta.${MIN_RELEASE}`,
      });
    });

    it(`should return the computed version for allowed prerelease, id: ${MAX_ID}, release version: ${MAX_RELEASE}`, () => {
      const mmVersion = getExtensionVersion(
        'beta',
        { id: MAX_ID, isPrerelease: true },
        MAX_RELEASE,
      );
      assert.deepStrictEqual(mmVersion, {
        version: `${pVersion}.${MAX_ID}${MAX_RELEASE}`,
        versionName: `${pVersion}-beta.${MAX_RELEASE}`,
      });
    });
  });
});
