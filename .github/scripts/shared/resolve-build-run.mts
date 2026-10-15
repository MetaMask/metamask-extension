import { execFileSync } from 'node:child_process';
import { appendFileSync, writeFileSync } from 'node:fs';
import { setTimeout as delay } from 'node:timers/promises';
import { fileURLToPath } from 'node:url';
import { parseArgs } from 'node:util';

type BuildRun = { head_sha: string; html_url: string; status: string };
type Artifact = { name: string; expired: boolean };
type BuildJob = { name: string; status: string; conclusion: string | null };
type BuildStatus = { context: string; description: string | null };

export type GitHubApi = (endpoint: string) => Promise<unknown>;
export type BuildProvenance = {
  requestedCommit: string;
  buildCommit: string;
  runId: number;
  runUrl: string;
  reusedBuild: boolean;
};

type ResolveOptions = {
  repository: string;
  ref: string;
  artifactNames: string[];
  waitSeconds: number;
  pollSeconds: number;
};

type Dependencies = {
  api: GitHubApi;
  sleep: (milliseconds: number) => Promise<void>;
  now: () => number;
  log: (message: string) => void;
};

/**
 * Resolves an immutable source commit to CI's canonical donor run and waits for its artifacts.
 * Used by yarn download-builds and the fixture workflow, independent of download transport.
 *
 * @param options - Repository, ref, required artifacts, and bounded wait policy.
 * @param dependencies - GitHub API and clock implementations.
 * @returns Requested commit and canonical build provenance.
 */
export async function resolveBuildRun(
  options: ResolveOptions,
  dependencies: Dependencies,
): Promise<BuildProvenance> {
  const { repository, ref, artifactNames, waitSeconds, pollSeconds } = options;
  const { api, sleep, now, log } = dependencies;
  if (
    !/^[\w.-]+\/[\w.-]+$/u.test(repository) ||
    !ref ||
    !artifactNames.length ||
    !Number.isFinite(waitSeconds) ||
    waitSeconds < 0 ||
    !Number.isFinite(pollSeconds) ||
    pollSeconds <= 0
  ) {
    throw new Error(
      'Invalid repository, ref, artifacts, or wait/poll interval',
    );
  }
  const deadline = now() + waitSeconds * 1000;
  const repositoryPath = `repos/${repository}`;
  const { sha: requestedCommit } = (await api(
    `${repositoryPath}/commits/${encodeURIComponent(ref)}`,
  )) as { sha: string };

  async function listPages<Value>(
    endpoint: string,
    key: string,
  ): Promise<Value[]> {
    const items: Value[] = [];
    for (let page = 1; ; page += 1) {
      const response = (await api(
        `${endpoint}${endpoint.includes('?') ? '&' : '?'}per_page=100&page=${page}`,
      )) as Record<string, Value[]>;
      const batch = response[key];
      items.push(...batch);
      if (batch.length < 100) {
        return items;
      }
    }
  }

  for (;;) {
    const statuses = await listPages<BuildStatus>(
      `${repositoryPath}/commits/${requestedCommit}/status`,
      'statuses',
    );
    const pointer = statuses.find(
      (status) => status.context === 'builds-from-run',
    );
    let pending = `No 'builds-from-run' status on ${requestedCommit} yet. The Main workflow must publish it.`;
    if (pointer) {
      const runId = Number(pointer.description);
      if (
        !/^\d+$/u.test(pointer.description ?? '') ||
        !Number.isSafeInteger(runId) ||
        runId <= 0
      ) {
        throw new Error(
          `Invalid 'builds-from-run' status on ${requestedCommit}`,
        );
      }
      const runPath = `${repositoryPath}/actions/runs/${runId}`;
      const run = (await api(runPath)) as BuildRun;
      const artifacts = await listPages<Artifact>(
        `${runPath}/artifacts`,
        'artifacts',
      );
      const missing = artifactNames.filter(
        (name) =>
          !artifacts.some((item) => item.name === name && !item.expired),
      );
      if (!missing.length) {
        return {
          requestedCommit,
          buildCommit: run.head_sha,
          runId,
          runUrl: run.html_url,
          reusedBuild: run.head_sha !== requestedCommit,
        };
      }
      if (
        artifacts.some((item) => missing.includes(item.name) && item.expired)
      ) {
        throw new Error(
          `Build artifact expired on ${run.html_url}. Re-run the build.`,
        );
      }
      const jobs = await listPages<BuildJob>(`${runPath}/jobs`, 'jobs');
      const failed = jobs.find(
        (job) =>
          missing.some(
            (name) => job.name === name || job.name.endsWith(`/ ${name}`),
          ) &&
          job.status === 'completed' &&
          job.conclusion !== 'success',
      );
      if (failed) {
        throw new Error(
          `${failed.name} ${failed.conclusion} on ${run.html_url}`,
        );
      }
      if (run.status === 'completed') {
        throw new Error(
          `${missing.join(', ')} missing from completed run ${run.html_url}. Re-run the build.`,
        );
      }
      pending = `${missing.join(', ')} not uploaded yet: ${run.html_url}`;
    }
    const remaining = deadline - now();
    if (remaining <= 0) {
      throw new Error(
        `${pending} Wait limit reached (${waitSeconds}s). Retry when available.`,
      );
    }
    log(`${pending} Waiting up to ${Math.ceil(remaining / 1000)}s more.`);
    await sleep(Math.min(pollSeconds * 1000, remaining));
  }
}

/** Resolves the fixture workflow's artifact owner; downloading stays with its gh step. */
async function main(): Promise<void> {
  const { values } = parseArgs({
    options: {
      repo: { type: 'string', default: 'MetaMask/metamask-extension' },
      ref: { type: 'string' },
      artifact: { type: 'string', default: 'build-dist-webpack' },
      metadata: { type: 'string' },
      'wait-seconds': { type: 'string', default: '1200' },
      'poll-seconds': { type: 'string', default: '20' },
      help: { type: 'boolean' },
    },
  });
  if (values.help) {
    console.log(
      'Usage: node resolve-build-run.mts [--ref SHA] [--repo OWNER/REPO] [--artifact NAME] [--metadata FILE] [--wait-seconds 1200]',
    );
    return;
  }
  const metadata = await resolveBuildRun(
    {
      repository: values.repo,
      ref:
        values.ref ??
        execFileSync('git', ['rev-parse', 'HEAD'], { encoding: 'utf8' }).trim(),
      artifactNames: [values.artifact],
      waitSeconds: Number(values['wait-seconds']),
      pollSeconds: Number(values['poll-seconds']),
    },
    {
      api: async (endpoint) =>
        JSON.parse(
          execFileSync('gh', ['api', endpoint], {
            encoding: 'utf8',
            maxBuffer: 10 * 1024 * 1024,
          }),
        ),
      sleep: delay,
      now: Date.now,
      log: (message) => console.error(message),
    },
  );
  const metadataJson = JSON.stringify(metadata, null, 2);
  if (values.metadata) {
    writeFileSync(values.metadata, `${metadataJson}\n`);
  }
  if (process.env.GITHUB_OUTPUT) {
    appendFileSync(
      process.env.GITHUB_OUTPUT,
      `run-id=${metadata.runId}\nbuild-sha=${metadata.buildCommit}\n`,
    );
  }
  console.log(metadataJson);
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  main().catch((error: unknown) => {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  });
}
