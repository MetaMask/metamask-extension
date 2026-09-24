import {
  BenchmarkNetworkSession,
  BenchmarkRelay,
  TurnBasedRelay,
  runCL24Benchmark,
  runCL24BenchmarkSample,
  summarizeCL24Benchmark,
  type CL24BenchmarkSample,
} from './cl24-benchmark';

function spin(milliseconds: number): void {
  const end = performance.now() + milliseconds;
  while (performance.now() < end) {
    // Busy-wait so the scheduler can attribute CPU to the active party.
  }
}

describe('CL24 benchmark', () => {
  jest.setTimeout(60000);

  it('delivers a message to an already waiting receiver', async () => {
    const relay = new BenchmarkRelay();
    const sender = new BenchmarkNetworkSession('session', 'sender', relay);
    const receiver = new BenchmarkNetworkSession('session', 'receiver', relay);
    const pendingMessage = receiver.receiveMessage('sender', 'round-1');
    const message = Uint8Array.from([1, 2, 3]);

    sender.sendMessage('receiver', 'round-1', message);

    await expect(pendingMessage).resolves.toEqual(message);
  });

  it('preserves the exported key through a 2-of-2 lifecycle', async () => {
    const sample = await runCL24BenchmarkSample(0);

    expect(sample.keyGeneration).toBeGreaterThanOrEqual(0);
    expect(sample.initialExport).toBeGreaterThanOrEqual(0);
    expect(sample.shareRefresh).toBeGreaterThanOrEqual(0);
    expect(sample.rosterUpdate).toBeGreaterThanOrEqual(0);
    expect(sample.finalExport).toBeGreaterThanOrEqual(0);
    expect(sample.total).toBeGreaterThanOrEqual(0);
  });

  it('calculates min, median, and max stage durations', () => {
    const createSample = (duration: number): CL24BenchmarkSample => ({
      keyGeneration: duration,
      initialExport: duration,
      shareRefresh: duration,
      rosterUpdate: duration,
      finalExport: duration,
      total: duration,
    });
    const samples = [createSample(30), createSample(10), createSample(20)];

    const summary = summarizeCL24Benchmark(samples);

    expect(summary.keyGeneration).toEqual({
      min: 10,
      median: 20,
      max: 30,
    });
  });

  it('records benchmark configuration and metadata', async () => {
    const metadata = {
      appVersion: '1.0.0',
      buildNumber: '1',
      device: 'Test device',
      operatingSystem: 'Test OS',
    };

    const result = await runCL24Benchmark(metadata, {
      sampleIterations: 1,
      warmupIterations: 0,
    });

    expect(result.configuration).toEqual({
      curve: 'secp256k1',
      initialPartyCount: 2,
      threshold: 2,
      updatedPartyCount: 3,
      measuredPartyId: 'party-1',
      transport: 'turn-based-local-party-in-memory',
      warmupIterations: 0,
      sampleIterations: 1,
    });
    expect(result.metadata).toEqual(metadata);
    expect(result.samples).toHaveLength(1);
  });

  it('excludes peer CPU from the measured party duration', async () => {
    const relay = new TurnBasedRelay('local');
    const local = new BenchmarkNetworkSession('session', 'local', relay);
    const peer = new BenchmarkNetworkSession('session', 'peer', relay);

    const { duration } = await relay.runParties([
      {
        id: 'local',
        run: async () => {
          spin(20);
          await local.receiveMessage('peer', 'round-1');
          spin(20);
        },
      },
      {
        id: 'peer',
        run: async () => {
          spin(80);
          peer.sendMessage('local', 'round-1', Uint8Array.from([1]));
        },
      },
    ]);

    expect(duration).toBeGreaterThanOrEqual(20);
    expect(duration).toBeLessThan(70);
  });

  it('completes when a party waits on Promise.all of receives', async () => {
    const relay = new TurnBasedRelay('a');
    const partyA = new BenchmarkNetworkSession('session', 'a', relay);
    const partyB = new BenchmarkNetworkSession('session', 'b', relay);

    await expect(
      relay.runParties([
        {
          id: 'a',
          run: async () => {
            partyA.sendMessage('a', 'round-1', Uint8Array.from([1]));
            partyA.sendMessage('b', 'round-1', Uint8Array.from([2]));
            await Promise.all([
              partyA.receiveMessage('a', 'round-1'),
              partyA.receiveMessage('b', 'round-1'),
            ]);
          },
        },
        {
          id: 'b',
          run: async () => {
            partyB.sendMessage('a', 'round-1', Uint8Array.from([3]));
            partyB.sendMessage('b', 'round-1', Uint8Array.from([4]));
            await Promise.all([
              partyB.receiveMessage('a', 'round-1'),
              partyB.receiveMessage('b', 'round-1'),
            ]);
          },
        },
      ]),
    ).resolves.toEqual(
      expect.objectContaining({
        duration: expect.any(Number),
      }),
    );
  });
});
