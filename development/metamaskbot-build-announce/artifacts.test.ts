import { getArtifactLinks, getBuildLinks, formatBuildLinks } from './artifacts';

const HOST = 'https://ci.example.com';

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

describe('getBuildLinks', () => {
  it('returns chrome and firefox URLs for each build variant', () => {
    const builds = getBuildLinks(HOST, '12.0.0');

    expect(builds.builds.chrome).toContain('metamask-chrome-12.0.0.zip');
    expect(builds.builds.firefox).toContain('metamask-firefox-12.0.0.zip');
    expect(builds['builds (flask)'].chrome).toContain('flask');
  });

  it('includes all five build variants', () => {
    const builds = getBuildLinks(HOST, '1.0.0');
    const keys = Object.keys(builds);

    expect(keys).toHaveLength(5);
    expect(keys).toContain('builds');
    expect(keys).toContain('builds (beta)');
    expect(keys).toContain('builds (flask)');
    expect(keys).toContain('builds (test)');
    expect(keys).toContain('builds (test-flask)');
  });
});

describe('formatBuildLinks', () => {
  it('renders label: platform links for each variant', () => {
    const builds = getBuildLinks(HOST, '1.0.0');
    const rows = formatBuildLinks(builds);

    expect(rows).toHaveLength(5);
    expect(rows[0]).toMatch(
      /^builds: <a href=".*">chrome<\/a>, <a href=".*">firefox<\/a>$/u,
    );
  });
});
