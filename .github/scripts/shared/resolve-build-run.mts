import { execFileSync } from 'node:child_process';
import { appendFileSync, writeFileSync } from 'node:fs';
import { setTimeout as delay } from 'node:timers/promises';
import { fileURLToPath } from 'node:url';
import { parseArgs } from 'node:util';

type BuildRun = {
  head_sha: string;
  html_url: string;
  status: string;
  event: string;
  referenced_workflows?: { path: string; sha: string }[];
};
type Artifact = { name: string; expired: boolean };
type BuildJob = { name: string; status: string; conclusion: string | null };
type BuildStatus = { context: string; description: string | null };

export type GitHubApi = (endpoint: string) => Promise<unknown>;
export type BuildProvenance = {
  requestedCommit: string;
  runHeadCommit: string;
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

type BuildAvailability =
  | { status: 'ready'; provenance: BuildProvenance }
  | { status: 'pending'; message: string };

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
  validateResolveOptions(options);
  const { repository, ref, artifactNames, waitSeconds } = options;
  const { api, now } = dependencies;
  const deadline = now() + waitSeconds * 1000;
  const repositoryPath = `repos/${repository}`;
  const { sha: requestedCommit } = (await api(
    `${repositoryPath}/commits/${encodeURIComponent(ref)}`,
  )) as { sha: string };

  for (;;) {
    const availability = await checkCanonicalBuildAvailability(
      repositoryPath,
      requestedCommit,
      artifactNames,
      api,
    );
    if (availability.status === 'ready') {
      return availability.provenance;
    }
    await waitForNextBuildCheck(
      availability.message,
      deadline,
      options,
      dependencies,
    );
  }
}

function validateResolveOptions(options: ResolveOptions): void {
  const { repository, ref, artifactNames, waitSeconds, pollSeconds } = options;
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
}

async function checkCanonicalBuildAvailability(
  repositoryPath: string,
  requestedCommit: string,
  artifactNames: string[],
  api: GitHubApi,
): Promise<BuildAvailability> {
  const runId = await findCanonicalBuildRunId(
    repositoryPath,
    requestedCommit,
    api,
  );
  if (runId === undefined) {
    return {
      status: 'pending',
      message: `No 'builds-from-run' status on ${requestedCommit} yet. The Main workflow must publish it.`,
    };
  }

  const runPath = `${repositoryPath}/actions/runs/${runId}`;
  const run = (await api(runPath)) as BuildRun;
  const artifacts = await listGitHubPages<Artifact>(
    api,
    `${runPath}/artifacts`,
    'artifacts',
  );
  const missingArtifactNames = findMissingArtifactNames(
    artifactNames,
    artifacts,
  );
  if (!missingArtifactNames.length) {
    return {
      status: 'ready',
      provenance: {
        requestedCommit,
        runHeadCommit: run.head_sha,
        buildCommit: resolveBuildCommit(repositoryPath, run),
        runId,
        runUrl: run.html_url,
        reusedBuild: run.head_sha !== requestedCommit,
      },
    };
  }

  assertArtifactsHaveNotExpired(missingArtifactNames, artifacts, run.html_url);
  await assertBuildCanStillProduceArtifacts(
    runPath,
    run,
    missingArtifactNames,
    api,
  );
  return {
    status: 'pending',
    message: `${missingArtifactNames.join(', ')} not uploaded yet: ${run.html_url}`,
  };
}

function resolveBuildCommit(repositoryPath: string, run: BuildRun): string {
  const workflowPath = `${repositoryPath.slice('repos/'.length)}/.github/workflows/run-build.yml@`;
  const workflows = (run.referenced_workflows ?? []).filter((workflow) =>
    workflow.path.toLowerCase().startsWith(workflowPath.toLowerCase()),
  );
  // The same-repository reusable build workflow uses the default checkout.
  // Its recorded SHA identifies the historical PR merge tree, unlike head_sha.
  if (workflows.length === 1 && /^[a-f\d]{40}$/iu.test(workflows[0].sha)) {
    return workflows[0].sha;
  }
  // These events check out head_sha directly; PR runs must have merge metadata.
  if (
    !workflows.length &&
    ['push', 'schedule', 'merge_group'].includes(run.event)
  ) {
    return run.head_sha;
  }
  throw new Error(
    `Cannot determine build commit from run-build.yml metadata on ${run.html_url}. Re-run the build.`,
  );
}

async function findCanonicalBuildRunId(
  repositoryPath: string,
  requestedCommit: string,
  api: GitHubApi,
): Promise<number | undefined> {
  const statuses = await listGitHubPages<BuildStatus>(
    api,
    `${repositoryPath}/commits/${requestedCommit}/status`,
    'statuses',
  );
  const pointer = statuses.find(
    (status) => status.context === 'builds-from-run',
  );
  if (!pointer) {
    return undefined;
  }
  const runId = Number(pointer.description);
  if (
    !/^\d+$/u.test(pointer.description ?? '') ||
    !Number.isSafeInteger(runId) ||
    runId <= 0
  ) {
    throw new Error(`Invalid 'builds-from-run' status on ${requestedCommit}`);
  }
  return runId;
}

function findMissingArtifactNames(
  requiredNames: string[],
  artifacts: Artifact[],
): string[] {
  return requiredNames.filter(
    (name) =>
      !artifacts.some(
        (artifact) => artifact.name === name && !artifact.expired,
      ),
  );
}

function assertArtifactsHaveNotExpired(
  missingNames: string[],
  artifacts: Artifact[],
  runUrl: string,
): void {
  if (
    artifacts.some(
      (artifact) => missingNames.includes(artifact.name) && artifact.expired,
    )
  ) {
    throw new Error(`Build artifact expired on ${runUrl}. Re-run the build.`);
  }
}

async function assertBuildCanStillProduceArtifacts(
  runPath: string,
  run: BuildRun,
  missingArtifactNames: string[],
  api: GitHubApi,
): Promise<void> {
  const jobs = await listGitHubPages<BuildJob>(api, `${runPath}/jobs`, 'jobs');
  const failedJob = jobs.find((job) =>
    isFailedArtifactJob(job, missingArtifactNames),
  );
  if (failedJob) {
    throw new Error(
      `${failedJob.name} ${failedJob.conclusion} on ${run.html_url}`,
    );
  }
  if (run.status === 'completed') {
    throw new Error(
      `${missingArtifactNames.join(', ')} missing from completed run ${run.html_url}. Re-run the build.`,
    );
  }
}

function isFailedArtifactJob(job: BuildJob, artifactNames: string[]): boolean {
  const producesMissingArtifact = artifactNames.some(
    (name) => job.name === name || job.name.endsWith(`/ ${name}`),
  );
  return (
    producesMissingArtifact &&
    job.status === 'completed' &&
    job.conclusion !== 'success'
  );
}

async function listGitHubPages<Value>(
  api: GitHubApi,
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

async function waitForNextBuildCheck(
  pendingMessage: string,
  deadline: number,
  options: ResolveOptions,
  dependencies: Dependencies,
): Promise<void> {
  const { waitSeconds, pollSeconds } = options;
  const { now, log, sleep } = dependencies;
  const remaining = deadline - now();
  if (remaining <= 0) {
    throw new Error(
      `${pendingMessage} Wait limit reached (${waitSeconds}s). Retry when available.`,
    );
  }
  log(`${pendingMessage} Waiting up to ${Math.ceil(remaining / 1000)}s more.`);
  await sleep(Math.min(pollSeconds * 1000, remaining));
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
