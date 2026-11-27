import { BUILD_HOST, buildZipUrl } from './build-source.mts';

describe('buildZipUrl', () => {
  it('points at the Chrome and Firefox zips of a run', () => {
    expect(buildZipUrl('chrome', '123', '13.59.0')).toBe(
      `${BUILD_HOST}/123/build-test-webpack/builds/metamask-chrome-13.59.0.zip`,
    );
    expect(buildZipUrl('firefox', '123', '13.59.0')).toBe(
      `${BUILD_HOST}/123/build-test-mv2-webpack/builds/metamask-firefox-13.59.0.zip`,
    );
  });

  it('accepts a prerelease version', () => {
    expect(buildZipUrl('chrome', '123', '13.59.0-flask.0')).toContain(
      'metamask-chrome-13.59.0-flask.0.zip',
    );
  });

  it('rejects a run that is not a number', () => {
    for (const run of ['', 'abc', '12/../3', '123?x=1', '1 2']) {
      expect(() => buildZipUrl('chrome', run, '13.59.0')).toThrow(
        'Invalid build run or version',
      );
    }
  });

  it('rejects a version that could change the path', () => {
    for (const version of ['', '../1.0.0', '1.0.0/x', '1.0.0?x', '1.0.0#x']) {
      expect(() => buildZipUrl('chrome', '123', version)).toThrow(
        'Invalid build run or version',
      );
    }
  });
});
