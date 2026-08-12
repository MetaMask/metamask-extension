import { getBuildLinks } from './build-links.ts';

const HOST = 'https://ci.example.com';
const VERSION = '12.0.0';

describe('getBuildLinks', () => {
  it('returns main Webpack build links', () => {
    const links = getBuildLinks({ hostUrl: HOST, version: VERSION });

    expect(links.webpack.main).toStrictEqual({
      chrome: `${HOST}/build-dist-webpack/builds/metamask-chrome-${VERSION}.zip`,
      firefox: `${HOST}/build-dist-mv2-webpack/builds/metamask-firefox-${VERSION}.zip`,
    });
  });

  it('uses releaseVersion for prerelease build links', () => {
    const links = getBuildLinks({
      hostUrl: HOST,
      version: VERSION,
      releaseVersion: '7',
    });

    expect(links.webpack.flask.chrome).toBe(
      `${HOST}/build-flask-webpack/builds/metamask-chrome-${VERSION}-flask.7.zip`,
    );
    expect(links.webpack.beta.firefox).toBe(
      `${HOST}/build-beta-mv2-webpack/builds/metamask-firefox-${VERSION}-beta.7.zip`,
    );
    expect(links.webpack.experimental.chrome).toBe(
      `${HOST}/build-experimental-webpack/builds/metamask-chrome-${VERSION}-experimental.7.zip`,
    );
  });

  it('defaults releaseVersion to zero', () => {
    const links = getBuildLinks({ hostUrl: HOST, version: VERSION });

    expect(links.webpack['test-flask'].chrome).toBe(
      `${HOST}/build-test-flask-webpack/builds/metamask-chrome-${VERSION}-flask.0.zip`,
    );
  });
});
