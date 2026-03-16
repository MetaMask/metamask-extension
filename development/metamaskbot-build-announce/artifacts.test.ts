import {
  getArtifactLinks,
  getBuildLinks,
  formatBuildLinks,
  artifactExists,
  discoverBundleArtifacts,
  buildArtifactsBody,
} from './artifacts';

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
      version: '12.0.0',
      shortSha: 'abc1234',
      artifacts: makeArtifacts(),
      postNewBuilds: true,
      lavamoatPolicyChanged: false,
    });

    expect(result).toContain('metamask-chrome-12.0.0.zip');
  });

  it('omits build links when postNewBuilds is false', async () => {
    const result = await buildArtifactsBody({
      hostUrl: HOST,
      version: '12.0.0',
      shortSha: 'abc1234',
      artifacts: makeArtifacts(),
      postNewBuilds: false,
      lavamoatPolicyChanged: false,
    });

    expect(result).not.toContain('metamask-chrome-12.0.0.zip');
  });

  it('includes lavamoat viz link when lavamoatPolicyChanged is true', async () => {
    const result = await buildArtifactsBody({
      hostUrl: HOST,
      version: '12.0.0',
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
      version: '12.0.0',
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
