import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { loadBatch, readJob, readJobFlows } from './load.mts';
import { throttledConfig } from './score.mts';

const sessions = Array.from({ length: 10 }, (_, index) => ({
  index,
  build: index % 2 === 0 ? 'A' : 'B',
  success: true,
  pageLoads: 1,
}));
const samples = { uiStartup: Array(10).fill(1000), load: Array(10).fill(1000) };

describe('detector artifacts', () => {
  let root: string;

  const writeJob = (
    folder: string,
    content: string,
    name = 'benchmark-x.json',
  ) => {
    fs.mkdirSync(path.join(root, folder), { recursive: true });
    fs.writeFileSync(path.join(root, folder, name), content);
  };
  const goodJob = JSON.stringify({
    startupStandardHome: { abPilot: { sessions }, samples },
  });

  beforeEach(() => {
    root = fs.mkdtempSync(path.join(os.tmpdir(), 'detector-load-'));
  });

  afterEach(() => {
    fs.rmSync(root, { recursive: true, force: true });
  });

  it('reads the sessions and samples of a job', () => {
    writeJob('job', goodJob);
    expect(readJob(path.join(root, 'job'))).toStrictEqual({
      sessions,
      samples,
    });
  });

  const unusable = { sessions: [], samples: {} };

  it('treats a missing folder or file as an unusable job', () => {
    expect(readJob(path.join(root, 'job'))).toStrictEqual(unusable);
    writeJob('job', goodJob, 'other.json');
    expect(readJob(path.join(root, 'job'))).toStrictEqual(unusable);
  });

  it('treats a truncated, empty or null file as an unusable job', () => {
    for (const content of [
      '{"startupStandardHome": {',
      '{"startupStandardHome": {}}',
      'null',
    ]) {
      writeJob('job', content);
      expect(readJob(path.join(root, 'job'))).toStrictEqual(unusable);
    }
  });

  // origin: ai-synthesis
  it('reads every flow of a job that ran several, skipping a flow with no A/B data', () => {
    const flowSamples = { step: [100, 101] };
    writeJob(
      'job',
      JSON.stringify({
        loadNewAccount: { abPilot: { sessions }, samples: flowSamples },
        confirmTx: { error: 'flake' },
        bridgeUserActions: { abPilot: { sessions }, samples },
      }),
    );
    expect(readJobFlows(path.join(root, 'job'))).toStrictEqual({
      loadNewAccount: { sessions, samples: flowSamples },
      bridgeUserActions: { sessions, samples },
    });
    expect(readJobFlows(path.join(root, 'missing'))).toStrictEqual({});
  });

  it('counts a shard whose artifact is missing as an unusable job', () => {
    for (const browser of ['chrome', 'firefox']) {
      writeJob(`detector-b1-${browser}-s1`, goodJob);
    }
    const scores = loadBatch(root, 1, 2);
    expect(scores?.chrome).toMatchObject({ jobsTotal: 2, jobsUsable: 1 });
    expect(scores?.firefox).toMatchObject({ jobsTotal: 2, jobsUsable: 1 });
  });

  it('returns nothing for an optional batch that was not run', () => {
    writeJob('detector-b1-chrome-s1', goodJob);
    expect(loadBatch(root, 2, 2, true)).toBeUndefined();
    expect(loadBatch(root, 1, 2, true)).toBeDefined();
  });

  // origin: ai-synthesis
  it('reads the folders of a prefix and scores the browsers of its config', () => {
    writeJob('throttled-b1-chrome-s1', goodJob);
    writeJob('detector-b1-firefox-s1', goodJob);
    const options = { config: throttledConfig(), prefix: 'throttled' };
    const scores = loadBatch(root, 1, 2, false, options);
    expect(scores?.chrome).toMatchObject({ jobsTotal: 2, jobsUsable: 1 });
    expect(scores?.firefox).toBeUndefined();
    expect(loadBatch(root, 2, 2, true, options)).toBeUndefined();
    expect(loadBatch(root, 1, 2, true, { prefix: 'other' })).toBeUndefined();
  });
});
