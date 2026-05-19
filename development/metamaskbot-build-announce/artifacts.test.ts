import {
  getArtifactLinks,
  getBuildLinks,
  formatBuildLinks,
  artifactExists,
  discoverBundleArtifacts,
  buildArtifactsBody,
} from './artifacts';

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

describe('getBuildLinks', () => {
  it('returns browserify and webpack build URLs', () => {
    const builds = getBuildLinks({ hostUrl: HOST, version: VERSION });

    expect(builds.browserify.main.chrome).toContain(
      `metamask-chrome-${VERSION}.zip`,
    );
    expect(builds.browserify.main.firefox).toContain(
      `metamask-firefox-${VERSION}.zip`,
    );
    expect(builds.browserify.flask.chrome).toContain('flask');
  });

  it('includes all six build variants for each bundler', () => {
    const builds = getBuildLinks({ hostUrl: HOST, version: VERSION });
    const expected = [
      'main',
      'beta',
      'experimental',
      'flask',
      'test',
      'test-flask',
    ];

    expect(Object.keys(builds.browserify)).toStrictEqual(expected);
    expect(Object.keys(builds.webpack)).toStrictEqual(expected);
  });

  it('uses correct artifact names for webpack builds', () => {
    const builds = getBuildLinks({ hostUrl: HOST, version: VERSION });

    expect(builds.webpack.main.chrome).toContain('build-dist-webpack');
    expect(builds.webpack.main.chrome).toContain(
      `metamask-chrome-${VERSION}.zip`,
    );
    expect(builds.webpack.main.firefox).toContain('build-dist-mv2-webpack');
    expect(builds.webpack.flask.chrome).toContain('flask');
  });
});

describe('formatBuildLinks', () => {
  it('renders rows for both browserify and webpack builds', () => {
    const buildLinks = getBuildLinks({ hostUrl: HOST, version: VERSION });
    const rows = formatBuildLinks(buildLinks);

    // 5 build types (excluding experimental) × 2 bundlers = 10 rows
    expect(rows).toHaveLength(10);
    expect(rows[0]).toMatch(
      /^builds: <a href=".*">chrome<\/a>, <a href=".*">firefox<\/a>$/u,
    );
  });

  it('uses "builds" prefix for browserify and "webpack builds" for webpack', () => {
    const buildLinks = getBuildLinks({ hostUrl: HOST, version: VERSION });
    const rows = formatBuildLinks(buildLinks);

    expect(rows[0]).toContain('builds:');
    expect(rows[1]).toContain('builds (beta):');
    expect(rows[5]).toContain('webpack builds:');
    expect(rows[6]).toContain('webpack builds (beta):');
  });
});

describe('artifactExists', () => {
  const mockFetch = jest.fn();

  beforeEach(() => {
    global.fetch = mockFetch;
  });

  afterEach(() => {
    mockFetch.mockReset();
  });

  it('returns true when the HEAD request succeeds', async () => {
    mockFetch.mockResolvedValue({ ok: true } as Response);

    expect(await artifactExists('https://example.com/file.html')).toBe(true);
    expect(mockFetch).toHaveBeenCalledWith('https://example.com/file.html', {
      method: 'HEAD',
    });
  });

  it('returns false when the HEAD request fails', async () => {
    mockFetch.mockResolvedValue({ ok: false } as Response);

    expect(await artifactExists('https://example.com/missing.html')).toBe(
      false,
    );
  });
});

describe('discoverBundleArtifacts', () => {
  const mockFetch = jest.fn();

  beforeEach(() => {
    global.fetch = mockFetch;
    jest.spyOn(console, 'log').mockImplementation();
  });

  afterEach(() => {
    jest.restoreAllMocks();
    mockFetch.mockReset();
  });

  it('returns a list with links for each found artifact', async () => {
    // FILE_ROOTS = [background, common, ui, content-script, offscreen]
    // background-0 found, background-1 not found, then all others not found
    mockFetch
      .mockResolvedValueOnce({ ok: true } as Response) // background-0 found
      .mockResolvedValueOnce({ ok: false } as Response) // background-1 not found → stop
      .mockResolvedValueOnce({ ok: false } as Response) // common-0 not found
      .mockResolvedValueOnce({ ok: false } as Response) // ui-0 not found
      .mockResolvedValueOnce({ ok: false } as Response) // content-script-0 not found
      .mockResolvedValueOnce({ ok: false } as Response); // offscreen-0 not found

    const result = await discoverBundleArtifacts(HOST);

    expect(result).toContain('<a href=');
    expect(result).toContain('background');
  });

  it('returns empty list items when no artifacts are found', async () => {
    mockFetch.mockResolvedValue({ ok: false } as Response);

    const result = await discoverBundleArtifacts(HOST);

    expect(result).toContain('<ul>');
    expect(result).not.toContain('<a href=');
  });
});

describe('buildArtifactsBody', () => {
  const mockFetch = jest.fn();

  beforeEach(() => {
    global.fetch = mockFetch;
    jest.spyOn(console, 'log').mockImplementation();
    // discoverBundleArtifacts HEAD requests all return not-found by default
    mockFetch.mockResolvedValue({ ok: false } as Response);
  });

  afterEach(() => {
    jest.restoreAllMocks();
    mockFetch.mockReset();
  });

  const makeArtifacts = () =>
    getArtifactLinks(HOST, 'MetaMask', 'metamask-extension', '99');

  it('includes build links when postNewBuilds is true', async () => {
    const result = await buildArtifactsBody({
      hostUrl: HOST,
      version: VERSION,
      shortSha: 'abc1234',
      artifacts: makeArtifacts(),
      postNewBuilds: true,
      lavamoatPolicyChanged: false,
    });

    expect(result).toContain(`metamask-chrome-${VERSION}.zip`);
    expect(result).toContain('build-dist-webpack');
  });

  it('omits build links when postNewBuilds is false', async () => {
    const result = await buildArtifactsBody({
      hostUrl: HOST,
      version: VERSION,
      shortSha: 'abc1234',
      artifacts: makeArtifacts(),
      postNewBuilds: false,
      lavamoatPolicyChanged: false,
    });

    expect(result).not.toContain(`metamask-chrome-${VERSION}.zip`);
  });

  it('includes lavamoat viz link when lavamoatPolicyChanged is true', async () => {
    const result = await buildArtifactsBody({
      hostUrl: HOST,
      version: VERSION,
      shortSha: 'abc1234',
      artifacts: makeArtifacts(),
      postNewBuilds: false,
      lavamoatPolicyChanged: true,
    });

    expect(result).toContain('lavamoat build viz');
  });

  it('wraps everything in a collapsible details element with the sha', async () => {
    const result = await buildArtifactsBody({
      hostUrl: HOST,
      version: VERSION,
      shortSha: 'abc1234',
      artifacts: makeArtifacts(),
      postNewBuilds: false,
      lavamoatPolicyChanged: false,
    });

    expect(result).toContain('<details>');
    expect(result).toContain('Builds ready [abc1234]');
    expect(result).toContain('bundle size:');
    expect(result).toContain('storybook:');
  });
});
