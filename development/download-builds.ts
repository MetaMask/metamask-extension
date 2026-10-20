import {
  mkdtemp,
  mkdir,
  readFile,
  rename,
  rm,
  writeFile,
} from 'node:fs/promises';
import { join, resolve, sep } from 'node:path';
import { setTimeout as delay } from 'node:timers/promises';
import unzipper from 'unzipper';
import {
  resolveBuildRun,
  type BuildProvenance,
  type GitHubApi,
} from '../.github/scripts/shared/resolve-build-run.mts';
import {
  getBuildLinks,
  type BuildBrowser,
  type BuildType,
} from './metamaskbot-build-announce/build-links';

type Browser = 'chrome' | 'firefox';
export type DownloadBuildsOptions = {
  owner: string;
  repository: string;
  workflowId: string;
  branch: string;
  ref?: string;
  buildType: BuildType;
  browser: Browser | 'all';
  destination: string;
  metadata?: string;
  waitSeconds: number;
  pollSeconds: number;
  awsCloudfrontUrl: string;
};

type Dependencies = {
  api: GitHubApi;
  fetch?: typeof fetch;
  sleep?: (milliseconds: number) => Promise<void>;
  now?: () => number;
  log?: (message: string) => void;
};

type DownloadedBuilds = BuildProvenance & {
  version: string;
  destination: string;
  downloads: Partial<Record<Browser, string>>;
};

type BrowserDownloadPlan = {
  browsers: Browser[];
  links: BuildBrowser;
  destination: string;
  version: string;
};

type DownloadPolling = {
  fetchBuild: typeof fetch;
  sleep: (milliseconds: number) => Promise<void>;
  now: () => number;
  log: (message: string) => void;
  deadline: number;
  pollSeconds: number;
};

/**
 * Downloads canonical branch/commit builds, preserving donor provenance for release testing.
 * Branch-only calls use the latest run of the requested workflow, regardless of unrelated tests.
 *
 * @param options - Existing download-builds selections plus commit/wait/output controls.
 * @param dependencies - API, HTTP and clock implementations; defaults use real HTTP/timers.
 * @returns Build provenance and the installed browser paths and download URLs.
 */
export async function downloadBuilds(
  options: DownloadBuildsOptions,
  dependencies: Dependencies,
): Promise<DownloadedBuilds> {
  const {
    api,
    fetch: fetchBuild = fetch,
    sleep = delay,
    now = Date.now,
    log = console.log,
  } = dependencies;
  const { waitSeconds, pollSeconds } = options;
  const repository = `${options.owner}/${options.repository}`;
  const browsers: Browser[] =
    options.browser === 'all' ? ['chrome', 'firefox'] : [options.browser];
  const ref = await resolveRequestedRef(options, api);
  const deadline = now() + waitSeconds * 1000;
  const provenance = await resolveBuildRun(
    {
      repository,
      ref,
      artifactNames: browsers.map((browser) =>
        getBuildArtifactName(options.buildType, browser),
      ),
      waitSeconds,
      pollSeconds,
    },
    { api, sleep, now, log },
  );
  const version = await readBuildVersion(
    repository,
    provenance.buildCommit,
    api,
  );
  const hostUrl = `${options.awsCloudfrontUrl.replace(/\/$/u, '')}/${options.repository}/${provenance.runId}`;
  const links = getBuildLinks({ hostUrl, version }).webpack[options.buildType];
  const destination = resolve(options.destination);
  const downloads = await downloadSelectedBrowserBuilds(
    { browsers, links, destination, version },
    { fetchBuild, sleep, now, log, deadline, pollSeconds },
  );
  const metadata = { ...provenance, version, destination, downloads };
  if (options.metadata) {
    await writeFile(options.metadata, `${JSON.stringify(metadata, null, 2)}\n`);
  }
  return metadata;
}

function getBuildArtifactName(buildType: BuildType, browser: Browser): string {
  const variant = buildType === 'main' ? 'dist' : buildType;
  const manifestSuffix = browser === 'firefox' ? '-mv2' : '';
  return `build-${variant}${manifestSuffix}-webpack`;
}

async function resolveRequestedRef(
  options: DownloadBuildsOptions,
  api: GitHubApi,
): Promise<string> {
  if (options.ref) {
    return options.ref;
  }
  const repository = `${options.owner}/${options.repository}`;
  const query = new URLSearchParams({
    branch: options.branch,
    // eslint-disable-next-line @typescript-eslint/naming-convention -- GitHub API parameter.
    per_page: '1',
  });
  const runs = (await api(
    `repos/${repository}/actions/workflows/${encodeURIComponent(options.workflowId)}/runs?${query}`,
  )) as {
    // eslint-disable-next-line @typescript-eslint/naming-convention -- GitHub API response fields.
    workflow_runs: { head_sha: string }[];
  };
  const latestRunCommit = runs.workflow_runs[0]?.head_sha;
  if (!latestRunCommit) {
    throw new Error(
      `No ${options.workflowId} runs found on branch '${options.branch}'`,
    );
  }
  return latestRunCommit;
}

async function readBuildVersion(
  repository: string,
  buildCommit: string,
  api: GitHubApi,
): Promise<string> {
  const packageFile = (await api(
    `repos/${repository}/contents/package.json?ref=${buildCommit}`,
  )) as {
    content: string;
    encoding: string;
  };
  if (packageFile.encoding !== 'base64') {
    throw new Error('Unexpected package.json response encoding');
  }
  const { version } = JSON.parse(
    Buffer.from(packageFile.content, 'base64').toString('utf8'),
  ) as { version: string };
  if (!/^\d+\.\d+\.\d+$/u.test(version)) {
    throw new Error('Invalid build version in build commit');
  }
  return version;
}

async function downloadSelectedBrowserBuilds(
  plan: BrowserDownloadPlan,
  polling: DownloadPolling,
): Promise<DownloadedBuilds['downloads']> {
  const { browsers, links, destination, version } = plan;
  const downloads: Partial<Record<Browser, string>> = {};
  await mkdir(destination, { recursive: true });
  for (const browser of browsers) {
    const url = links[browser];
    polling.log(`Downloading ${browser} from ${url}`);
    const response = await waitForBuildZipPublication(url, polling);
    const buffer = Buffer.from(await response.arrayBuffer());
    await installBrowserBuild(buffer, destination, browser, version);
    downloads[browser] = url;
  }
  return downloads;
}

async function waitForBuildZipPublication(
  url: string,
  polling: DownloadPolling,
): Promise<Response> {
  const { fetchBuild, deadline, now, log, sleep, pollSeconds } = polling;
  for (;;) {
    const response = await fetchBuild(url);
    const remaining = deadline - now();
    if (response.status === 404 && remaining > 0) {
      await response.body?.cancel();
      log('Build artifact is ready; waiting for its CloudFront ZIP upload.');
      await sleep(Math.min(pollSeconds * 1000, remaining));
      continue;
    }
    if (!response.ok) {
      throw new Error(
        `Build download failed: HTTP ${response.status} from ${url}`,
      );
    }
    return response;
  }
}

/**
 * Stages a browser ZIP before replacing its existing output directory.
 *
 * @param buffer - Downloaded build ZIP.
 * @param destination - Parent output directory, normally dist.
 * @param browser - Browser output child to replace.
 * @param version - Expected base version from the selected build commit.
 */
async function installBrowserBuild(
  buffer: Buffer,
  destination: string,
  browser: Browser,
  version: string,
): Promise<void> {
  const stage = await mkdtemp(join(destination, '.download-build-'));
  try {
    const archive = await unzipper.Open.buffer(buffer);
    for (const entry of archive.files) {
      const path = resolve(stage, entry.path);
      if (!path.startsWith(`${stage}${sep}`) && path !== stage) {
        throw new Error('Build ZIP contains an unsafe path');
      }
    }
    await archive.extract({ path: stage });
    const manifest = JSON.parse(
      await readFile(join(stage, 'manifest.json'), 'utf8'),
    ) as { version: string };
    if (
      manifest.version !== version &&
      !manifest.version.startsWith(`${version}.`)
    ) {
      throw new Error(
        `Downloaded ${browser} manifest version ${manifest.version} does not match ${version}`,
      );
    }
    const target = join(destination, browser);
    await rm(target, { recursive: true, force: true });
    await rename(stage, target);
  } finally {
    await rm(stage, { recursive: true, force: true });
  }
}
