import { readdir } from 'node:fs/promises';

import { getArtifactLinks, buildArtifactsBody } from './artifacts';

jest.mock('node:fs/promises');

const HOST = 'https://ci.example.com';
const VERSION = '12.0.0';

const mockReaddir = jest.mocked(readdir);

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
  beforeEach(() => {
    jest.spyOn(console, 'log').mockImplementation();
    // discoverBundleArtifacts reads local directory; default to empty
    mockReaddir.mockResolvedValue(
      [] as unknown as ReturnType<typeof readdir> extends Promise<infer T>
        ? T
        : never,
    );
  });

  afterEach(() => {
    jest.restoreAllMocks();
    mockReaddir.mockReset();
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
    });

    expect(result).not.toContain(`metamask-chrome-${VERSION}.zip`);
  });

  it('wraps everything in a collapsible details element with the sha', async () => {
    const result = await buildArtifactsBody({
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

  it('discovers source-map-explorer artifacts from local directory', async () => {
    mockReaddir.mockResolvedValue([
      'runtime.1d783a34e3a0b7e1c76d.html',
      'ui.d8e8d0d0259de4b80f7a.html',
      'bootstrap.8019f1c1ea55df5686cd.html',
    ] as unknown as ReturnType<typeof readdir> extends Promise<infer T>
      ? T
      : never);

    const result = await buildArtifactsBody({
      hostUrl: HOST,
      version: VERSION,
      shortSha: 'abc1234',
      artifacts: makeArtifacts(),
      postNewBuilds: false,
    });

    expect(result).toContain(
      `<a href="${HOST}/source-map-explorer/bootstrap.8019f1c1ea55df5686cd.html">bootstrap</a>`,
    );
    expect(result).toContain(
      `<a href="${HOST}/source-map-explorer/runtime.1d783a34e3a0b7e1c76d.html">runtime</a>`,
    );
    expect(result).toContain(
      `<a href="${HOST}/source-map-explorer/ui.d8e8d0d0259de4b80f7a.html">ui</a>`,
    );
  });
});
