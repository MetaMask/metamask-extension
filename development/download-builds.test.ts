/** @jest-environment node */
import {
  mkdtemp,
  mkdir,
  readFile,
  readdir,
  rm,
  writeFile,
} from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { buffer } from 'node:stream/consumers';
import { ZipFile } from 'yazl';
import { downloadBuilds, type DownloadBuildsOptions } from './download-builds';

const source = 'a'.repeat(40);
const donor = 'b'.repeat(40);
const merge = 'c'.repeat(40);

function buildZip(version = '13.53.0'): Promise<Buffer> {
  const zip = new ZipFile();
  zip.addBuffer(
    Buffer.from(JSON.stringify({ version: `${version}.0` })),
    'manifest.json',
  );
  zip.addBuffer(Buffer.from('new build'), 'home.html');
  zip.end();
  return buffer(zip.outputStream);
}

/* eslint-disable @typescript-eslint/naming-convention -- GitHub API response fields use snake_case. */
async function githubApi(endpoint: string): Promise<unknown> {
  if (endpoint.includes('/workflows/')) {
    return { workflow_runs: [{ head_sha: source }] };
  }
  if (endpoint.includes('/status?')) {
    return { statuses: [{ context: 'builds-from-run', description: '123' }] };
  }
  if (endpoint.includes('/artifacts?')) {
    return {
      artifacts: [
        { name: 'build-dist-webpack', expired: false },
        { name: 'build-dist-mv2-webpack', expired: false },
        { name: 'build-test-webpack', expired: false },
      ],
    };
  }
  if (endpoint.includes('/actions/runs/')) {
    return {
      head_sha: donor,
      html_url: 'https://fixture.invalid/run/123',
      status: 'in_progress',
      event: 'push',
    };
  }
  if (endpoint.includes('/contents/package.json')) {
    return {
      encoding: 'base64',
      content: Buffer.from('{"version":"13.53.0"}').toString('base64'),
    };
  }
  return { sha: source };
}
/* eslint-enable @typescript-eslint/naming-convention */

describe('downloadBuilds', () => {
  let directory: string;
  let options: DownloadBuildsOptions;
  beforeEach(async () => {
    directory = await mkdtemp(join(tmpdir(), 'download-builds-'));
    options = {
      owner: 'MetaMask',
      repository: 'metamask-extension',
      workflowId: 'main.yml',
      branch: 'release/13.53.0',
      buildType: 'main',
      browser: 'chrome',
      ref: source,
      destination: join(directory, 'dist'),
      metadata: join(directory, 'build.json'),
      waitSeconds: 60,
      pollSeconds: 20,
      awsCloudfrontUrl: 'https://fixture.invalid',
    };
  });
  afterEach(async () => {
    await rm(directory, { recursive: true, force: true });
  });

  it('pins the requested commit, downloads only Chrome, and records donor provenance', async () => {
    const api = jest.fn(githubApi);
    const zip = await buildZip();
    const fetchBuild = jest.fn(async () => new Response(new Uint8Array(zip)));
    const result = await downloadBuilds(options, {
      api,
      fetch: fetchBuild,
      log: jest.fn(),
    });
    expect(fetchBuild).toHaveBeenCalledWith(
      'https://fixture.invalid/metamask-extension/123/build-dist-webpack/builds/metamask-chrome-13.53.0.zip',
    );
    expect(fetchBuild).toHaveBeenCalledTimes(1);
    expect(
      api.mock.calls.some(([endpoint]) => endpoint.includes('/workflows/')),
    ).toBe(false);
    expect(
      await readFile(join(options.destination, 'chrome/home.html'), 'utf8'),
    ).toBe('new build');
    expect(await readdir(options.destination)).toStrictEqual(['chrome']);
    expect(
      JSON.parse(await readFile(join(directory, 'build.json'), 'utf8')),
    ).toStrictEqual(result);
    expect(result).toMatchObject({
      requestedCommit: source,
      runHeadCommit: donor,
      buildCommit: donor,
      runId: 123,
      reusedBuild: true,
      version: '13.53.0',
    });
    expect(api).toHaveBeenCalledWith(
      `repos/MetaMask/metamask-extension/contents/package.json?ref=${donor}`,
    );
  });

  [source, donor].forEach((headSha) => {
    it(`downloads the merge version for PR run head ${headSha}`, async () => {
      /* eslint-disable @typescript-eslint/naming-convention -- GitHub API response fields use snake_case. */
      const api = jest.fn(async (endpoint: string): Promise<unknown> => {
        if (endpoint === 'repos/MetaMask/metamask-extension/actions/runs/123') {
          return {
            head_sha: headSha,
            html_url: 'https://fixture.invalid/run/123',
            status: 'completed',
            event: 'pull_request',
            referenced_workflows: [
              {
                path: `MetaMask/metamask-extension/.github/workflows/run-build.yml@${merge}`,
                ref: 'refs/pull/47118/merge',
                sha: merge,
              },
            ],
          };
        }
        if (endpoint.includes('/contents/package.json')) {
          return {
            encoding: 'base64',
            content: Buffer.from(
              JSON.stringify({
                version: endpoint.endsWith(`ref=${merge}`)
                  ? '13.55.0'
                  : '13.54.0',
              }),
            ).toString('base64'),
          };
        }
        return githubApi(endpoint);
      });
      /* eslint-enable @typescript-eslint/naming-convention */
      const zip = await buildZip('13.55.0');
      const fetchBuild = jest.fn(async () => new Response(new Uint8Array(zip)));
      const result = await downloadBuilds(options, {
        api,
        fetch: fetchBuild,
        log: jest.fn(),
      });

      expect(fetchBuild).toHaveBeenCalledWith(
        'https://fixture.invalid/metamask-extension/123/build-dist-webpack/builds/metamask-chrome-13.55.0.zip',
      );
      expect(api).toHaveBeenCalledWith(
        `repos/MetaMask/metamask-extension/contents/package.json?ref=${merge}`,
      );
      expect(result).toMatchObject({
        requestedCommit: source,
        runHeadCommit: headSha,
        buildCommit: merge,
        reusedBuild: headSha !== source,
        version: '13.55.0',
      });
      expect(
        JSON.parse(
          await readFile(
            join(options.destination, 'chrome/manifest.json'),
            'utf8',
          ),
        ),
      ).toStrictEqual({ version: '13.55.0.0' });
    });
  });

  it('uses the latest branch workflow run without requiring all its tests to pass', async () => {
    const api = jest.fn(githubApi);
    const zip = await buildZip();
    await downloadBuilds(
      { ...options, ref: undefined, browser: 'all' },
      {
        api,
        fetch: jest.fn(async () => new Response(new Uint8Array(zip))),
        log: jest.fn(),
      },
    );
    expect(api).toHaveBeenCalledWith(
      expect.stringContaining(
        '/workflows/main.yml/runs?branch=release%2F13.53.0',
      ),
    );
    expect(
      api.mock.calls.some(([endpoint]) => endpoint.includes('status=success')),
    ).toBe(false);
    expect((await readdir(options.destination)).sort()).toStrictEqual([
      'chrome',
      'firefox',
    ]);
  });

  it('waits for CloudFront publication after the Actions artifact is ready', async () => {
    const zip = await buildZip();
    let clock = 0;
    const sleep = jest.fn(async (ms: number) => {
      clock += ms;
    });
    const fetchBuild = jest
      .fn()
      .mockResolvedValueOnce(new Response('', { status: 404 }))
      .mockResolvedValueOnce(new Response(new Uint8Array(zip)));
    await downloadBuilds(options, {
      api: githubApi,
      fetch: fetchBuild,
      now: () => clock,
      sleep,
      log: jest.fn(),
    });
    expect(sleep).toHaveBeenCalledWith(20000);
    expect(fetchBuild).toHaveBeenCalledTimes(2);
  });

  it('keeps the installed build on HTTP or manifest errors', async () => {
    await mkdir(join(options.destination, 'chrome'), { recursive: true });
    const previous = join(options.destination, 'chrome/home.html');
    await writeFile(previous, 'previous build');
    await expect(
      downloadBuilds(
        { ...options, waitSeconds: 0 },
        {
          api: githubApi,
          fetch: jest.fn(async () => new Response('', { status: 404 })),
          log: jest.fn(),
        },
      ),
    ).rejects.toThrow('HTTP 404');
    const zip = await buildZip('1.0.0');
    await expect(
      downloadBuilds(options, {
        api: githubApi,
        fetch: jest.fn(async () => new Response(new Uint8Array(zip))),
        log: jest.fn(),
      }),
    ).rejects.toThrow('does not match');
    expect(await readFile(previous, 'utf8')).toBe('previous build');
    expect(await readdir(options.destination)).toStrictEqual(['chrome']);
  });

  it('shares the wait deadline between artifact readiness and CloudFront publication', async () => {
    const api = jest.fn(githubApi);
    let artifactChecks = 0;
    api.mockImplementation(async (endpoint) => {
      if (endpoint.includes('/artifacts?')) {
        artifactChecks += 1;
        if (artifactChecks === 1) {
          return { artifacts: [] };
        }
      }
      if (endpoint.includes('/jobs?')) {
        return { jobs: [] };
      }
      return githubApi(endpoint);
    });
    let clock = 0;
    const sleep = jest.fn(async (milliseconds: number) => {
      clock += milliseconds;
    });
    await expect(
      downloadBuilds(
        { ...options, waitSeconds: 30 },
        {
          api,
          fetch: jest.fn(async () => new Response('', { status: 404 })),
          now: () => clock,
          sleep,
          log: jest.fn(),
        },
      ),
    ).rejects.toThrow('HTTP 404');
    expect(clock).toBe(30000);
    expect(sleep.mock.calls).toStrictEqual([[20000], [10000]]);
  });

  it('keeps the selected build type when resolving artifact and CloudFront names', async () => {
    const zip = await buildZip();
    const fetchBuild = jest.fn(async () => new Response(new Uint8Array(zip)));
    await downloadBuilds(
      { ...options, buildType: 'test' },
      { api: githubApi, fetch: fetchBuild, log: jest.fn() },
    );
    expect(fetchBuild).toHaveBeenCalledWith(
      expect.stringContaining('/build-test-webpack/builds/'),
    );
  });
});
