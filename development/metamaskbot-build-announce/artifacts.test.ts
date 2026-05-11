import { getArtifactLinks, buildArtifactsBody } from './artifacts';

const HOST = 'https://ci.example.com';
const VERSION = '12.0.0';

describe('getArtifactLinks', () => {
  it('returns URLs using the provided host, owner, repo, and runId', () => {
    const links = getArtifactLinks(
      HOST,
      'MetaMask',
      'metamask-extension',
      '42',
    );

    expect(links.bundleSizeStats.url).toBe(
      `${HOST}/bundle-size/bundle_size.json`,
    );
    expect(links.interactionStats.url).toBe(
      `${HOST}/benchmarks/benchmark-chrome-webpack-interactionUserActions.json`,
    );
    expect(links.storybook.url).toBe(`${HOST}/storybook-build/index.html`);
    expect(links.allArtifacts.url).toBe(
      'https://github.com/MetaMask/metamask-extension/actions/runs/42#artifacts',
    );
  });

  it('link() helper renders an anchor tag for a given key', () => {
    const links = getArtifactLinks(HOST, 'MetaMask', 'metamask-extension', '1');

    expect(links.link('storybook')).toBe(
      `<a href="${HOST}/storybook-build/index.html">Storybook</a>`,
    );
  });
});

describe('buildArtifactsBody', () => {
  const makeArtifacts = () =>
    getArtifactLinks(HOST, 'MetaMask', 'metamask-extension', '99');

  it('includes build links when builds are fresh (buildsFromSha matches shortSha)', () => {
    const result = buildArtifactsBody({
      hostUrl: HOST,
      version: VERSION,
      shortSha: 'abc1234',
      artifacts: makeArtifacts(),
      buildsFromSha: 'abc1234',
    });

    expect(result.indexOf('Webpack builds')).toBeGreaterThan(-1);
    expect(
      result.indexOf('Deprecated Browserify fallback builds'),
    ).toBeGreaterThan(result.indexOf('Webpack builds'));
    expect(result).toContain(
      `${HOST}/build-dist-webpack/builds/metamask-chrome-${VERSION}.zip`,
    );
    expect(result).toContain(
      `${HOST}/build-dist-mv2-webpack/builds/metamask-firefox-${VERSION}.zip`,
    );
    expect(result).toContain(
      `${HOST}/build-beta-webpack/builds/metamask-chrome-${VERSION}-beta.0.zip`,
    );
    expect(result).toContain(
      `${HOST}/build-beta-mv2-webpack/builds/metamask-firefox-${VERSION}-beta.0.zip`,
    );
    expect(result).toContain(
      `${HOST}/build-flask-webpack/builds/metamask-chrome-${VERSION}-flask.0.zip`,
    );
    expect(result).toContain(
      `${HOST}/build-flask-mv2-webpack/builds/metamask-firefox-${VERSION}-flask.0.zip`,
    );
    expect(result).toContain(
      `${HOST}/build-test-webpack/builds/metamask-chrome-${VERSION}.zip`,
    );
    expect(result).toContain(
      `${HOST}/build-test-mv2-webpack/builds/metamask-firefox-${VERSION}.zip`,
    );
    expect(result).toContain(
      `${HOST}/build-test-flask-webpack/builds/metamask-chrome-${VERSION}-flask.0.zip`,
    );
    expect(result).toContain(
      `${HOST}/build-test-flask-mv2-webpack/builds/metamask-firefox-${VERSION}-flask.0.zip`,
    );
    expect(result).toContain(
      `${HOST}/build-dist-browserify/builds/metamask-chrome-${VERSION}.zip`,
    );
    expect(result).toContain(
      `${HOST}/build-dist-mv2-browserify/builds/metamask-firefox-${VERSION}.zip`,
    );
    expect(result).toContain(
      `${HOST}/build-beta-browserify/builds/metamask-beta-chrome-${VERSION}-beta.0.zip`,
    );
    expect(result).toContain(
      `${HOST}/build-beta-mv2-browserify/builds/metamask-beta-firefox-${VERSION}-beta.0.zip`,
    );
    expect(result).toContain(
      `${HOST}/build-flask-browserify/builds/metamask-flask-chrome-${VERSION}-flask.0.zip`,
    );
    expect(result).toContain(
      `${HOST}/build-flask-mv2-browserify/builds/metamask-flask-firefox-${VERSION}-flask.0.zip`,
    );
    expect(result).toContain(
      `${HOST}/build-test-browserify/builds/metamask-chrome-${VERSION}.zip`,
    );
    expect(result).toContain(
      `${HOST}/build-test-mv2-browserify/builds/metamask-firefox-${VERSION}.zip`,
    );
    expect(result).toContain(
      `${HOST}/build-test-flask-browserify/builds/metamask-flask-chrome-${VERSION}-flask.0.zip`,
    );
    expect(result).toContain(
      `${HOST}/build-test-flask-mv2-browserify/builds/metamask-flask-firefox-${VERSION}-flask.0.zip`,
    );
    expect(result).not.toContain('build-experimental-webpack');
    expect(result).not.toContain('build-experimental-browserify');
    expect(result).toContain('Builds ready [abc1234]');
    expect(result).not.toContain('reused from');
    expect(result).toContain(
      'Please do not use these builds with accounts that contain significant real money.',
    );
    expect(result).toContain('cache poisoning</a>');
    expect(result).not.toContain('reused, so they are even more suspect');
  });

  it('includes build links and reused tag when builds are reused', () => {
    const result = buildArtifactsBody({
      hostUrl: HOST,
      version: VERSION,
      shortSha: 'def5678',
      artifacts: makeArtifacts(),
      buildsFromSha: 'abc1234',
    });

    expect(result).toContain(`metamask-chrome-${VERSION}.zip`);
    expect(result).toContain('Builds ready [def5678] [reused from abc1234]');
    expect(result).toContain(
      'Please do not use these builds with accounts that contain significant real money.',
    );
  });

  it('wraps everything in a collapsible details element with the sha', () => {
    const result = buildArtifactsBody({
      hostUrl: HOST,
      version: VERSION,
      shortSha: 'abc1234',
      artifacts: makeArtifacts(),
      buildsFromSha: 'abc1234',
    });

    expect(result).toContain('<details>');
    expect(result).toContain('Builds ready [abc1234]');
    expect(result).toContain('bundle size:');
    expect(result).toContain('storybook:');
  });

  it('includes a bundle analyzer link', () => {
    const result = buildArtifactsBody({
      hostUrl: HOST,
      version: VERSION,
      shortSha: 'abc1234',
      artifacts: makeArtifacts(),
      buildsFromSha: 'abc1234',
    });

    expect(result).toContain(
      `<a href="${HOST}/build-dist-webpack/bundle-analyzer/report.html">Bundle Analyzer</a>`,
    );
    expect(result).toContain('bundle analyzer:');
  });

  it('uses allArtifacts link with the runId passed to getArtifactLinks', () => {
    const links = getArtifactLinks(
      HOST,
      'MetaMask',
      'metamask-extension',
      '55',
    );
    expect(links.allArtifacts.url).toBe(
      'https://github.com/MetaMask/metamask-extension/actions/runs/55#artifacts',
    );
  });
});
