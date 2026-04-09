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

  it('includes build links when postNewBuilds is true', () => {
    const result = buildArtifactsBody({
      hostUrl: HOST,
      version: VERSION,
      shortSha: 'abc1234',
      artifacts: makeArtifacts(),
      postNewBuilds: true,
    });

    expect(result).toContain(`metamask-chrome-${VERSION}.zip`);
    expect(result).toContain('build-dist-webpack');
  });

  it('omits build links when postNewBuilds is false', () => {
    const result = buildArtifactsBody({
      hostUrl: HOST,
      version: VERSION,
      shortSha: 'abc1234',
      artifacts: makeArtifacts(),
      postNewBuilds: false,
    });

    expect(result).not.toContain(`metamask-chrome-${VERSION}.zip`);
  });

  it('wraps everything in a collapsible details element with the sha', () => {
    const result = buildArtifactsBody({
      hostUrl: HOST,
      version: VERSION,
      shortSha: 'abc1234',
      artifacts: makeArtifacts(),
      postNewBuilds: false,
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
      postNewBuilds: false,
    });

    expect(result).toContain(
      `<a href="${HOST}/build-dist-webpack/bundle-analyzer/report.html">Bundle Analyzer</a>`,
    );
    expect(result).toContain('bundle analyzer:');
  });
});
