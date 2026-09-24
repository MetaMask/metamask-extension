import {
  CL24DKM,
  type CL24ThresholdKey,
  dealersFromCL24Key,
  secp256k1,
} from '@metamask/mfa-wallet-cl24';
import type {
  AccessStructure,
  NetworkSession,
  RandomNumberGenerator,
  RootNetworkSession,
  ShareBinding,
} from '@metamask/mfa-wallet-interface';

export const CL24_BENCHMARK_WARMUP_ITERATIONS = 1;
export const CL24_BENCHMARK_SAMPLE_ITERATIONS = 5;
export const CL24_BENCHMARK_MEASURED_PARTY_ID = 'party-1';
export const CL24_BENCHMARK_TRANSPORT =
  'turn-based-local-party-in-memory' as const;

const INITIAL_CUSTODIANS = ['party-1', 'party-2'];
const UPDATED_CUSTODIANS = [...INITIAL_CUSTODIANS, 'party-3'];
const THRESHOLD = 2;

export type CL24BenchmarkStage =
  | 'keyGeneration'
  | 'initialExport'
  | 'shareRefresh'
  | 'rosterUpdate'
  | 'finalExport'
  | 'total';

export type CL24BenchmarkSample = Record<CL24BenchmarkStage, number>;

export type CL24BenchmarkStatistics = {
  min: number;
  median: number;
  max: number;
};

export type CL24BenchmarkSummary = Record<
  CL24BenchmarkStage,
  CL24BenchmarkStatistics
>;

export type CL24BenchmarkMetadata = {
  appVersion: string;
  buildNumber: string;
  device: string;
  operatingSystem: string;
};

export type CL24BenchmarkResult = {
  configuration: {
    curve: 'secp256k1';
    initialPartyCount: 2;
    threshold: 2;
    updatedPartyCount: 3;
    measuredPartyId: typeof CL24_BENCHMARK_MEASURED_PARTY_ID;
    transport: typeof CL24_BENCHMARK_TRANSPORT;
    warmupIterations: number;
    sampleIterations: number;
  };
  metadata: CL24BenchmarkMetadata;
  samples: CL24BenchmarkSample[];
  summary: CL24BenchmarkSummary;
  timestamp: string;
};

type CustodianKey = {
  id: string;
  key: CL24ThresholdKey;
};

type WaitingReceiver = (message: Uint8Array) => void;

type TurnBasedWaiter = {
  partyId: string;
  resolve: (message: Uint8Array) => void;
};

export type PartyOperation<Value> = {
  id: string;
  run: () => Promise<Value>;
};

/**
 * Deterministic RNG used to make benchmark runs comparable across devices.
 *
 * This is intentionally not suitable for production key material.
 */
export class BenchmarkRandomNumberGenerator implements RandomNumberGenerator {
  #state: number;

  constructor(seed: number) {
    // eslint-disable-next-line no-bitwise
    this.#state = seed >>> 0;
  }

  generateRandomBytes(size: number): Uint8Array {
    const bytes = new Uint8Array(size);
    for (let index = 0; index < size; index++) {
      // Numerical Recipes LCG. Math.imul keeps multiplication in 32 bits.
      // eslint-disable-next-line no-bitwise
      this.#state = (Math.imul(1664525, this.#state) + 1013904223) >>> 0;
      // eslint-disable-next-line no-bitwise
      bytes[index] = (this.#state >>> 24) & 0xff;
    }
    return bytes;
  }
}

export type BenchmarkMessageRelay = {
  push(
    sessionId: string,
    sender: string,
    receiver: string,
    messageType: string,
    message: Uint8Array,
  ): void;
  pop(
    sessionId: string,
    sender: string,
    receiver: string,
    messageType: string,
  ): Promise<Uint8Array>;
};

/**
 * In-process protocol relay with immediate waiter delivery.
 *
 * Unlike the SDK test relay, this has no polling interval, timeout, socket, or
 * simulated latency in the measured path.
 */
export class BenchmarkRelay implements BenchmarkMessageRelay {
  readonly #messages = new Map<string, Uint8Array[]>();

  readonly #receivers = new Map<string, WaitingReceiver[]>();

  static messageKey(
    sessionId: string,
    sender: string,
    receiver: string,
    messageType: string,
  ): string {
    return `${sessionId}:${sender}:${receiver}:${messageType}`;
  }

  push(
    sessionId: string,
    sender: string,
    receiver: string,
    messageType: string,
    message: Uint8Array,
  ): void {
    const key = BenchmarkRelay.messageKey(
      sessionId,
      sender,
      receiver,
      messageType,
    );
    const waitingReceivers = this.#receivers.get(key);
    const waitingReceiver = waitingReceivers?.shift();

    if (waitingReceiver) {
      if (waitingReceivers?.length === 0) {
        this.#receivers.delete(key);
      }
      waitingReceiver(message);
      return;
    }

    const messages = this.#messages.get(key) ?? [];
    messages.push(message);
    this.#messages.set(key, messages);
  }

  pop(
    sessionId: string,
    sender: string,
    receiver: string,
    messageType: string,
  ): Promise<Uint8Array> {
    const key = BenchmarkRelay.messageKey(
      sessionId,
      sender,
      receiver,
      messageType,
    );
    const messages = this.#messages.get(key);
    const message = messages?.shift();

    if (message) {
      if (messages?.length === 0) {
        this.#messages.delete(key);
      }
      return Promise.resolve(message);
    }

    return new Promise((resolve) => {
      const waitingReceivers = this.#receivers.get(key) ?? [];
      waitingReceivers.push(resolve);
      this.#receivers.set(key, waitingReceivers);
    });
  }
}

/**
 * Cooperative scheduler that runs one party's JS stack at a time.
 *
 * `sendMessage` only queues bytes. Waiters are resumed one party per turn, so
 * peer crypto is not interleaved into the measured party's `performance.now()`
 * slices. Duration is the sum of time while `measuredPartyId` is the active
 * stack — the cost a real client would pay for that party.
 */
export class TurnBasedRelay implements BenchmarkMessageRelay {
  readonly #measuredPartyId: string;

  #measuredMs = 0;

  #sliceStart = 0;

  #activeParty: string | undefined;

  #pumpScheduled = false;

  #pendingParties = 0;

  #rejected = false;

  #notStarted: { id: string; start: () => void }[] = [];

  readonly #messages = new Map<string, Uint8Array[]>();

  readonly #waiters = new Map<string, TurnBasedWaiter[]>();

  #settle:
    | {
        resolve: (duration: number) => void;
        reject: (error: unknown) => void;
      }
    | undefined;

  constructor(measuredPartyId: string = CL24_BENCHMARK_MEASURED_PARTY_ID) {
    this.#measuredPartyId = measuredPartyId;
  }

  async runParties<Value>(
    parties: PartyOperation<Value>[],
  ): Promise<{ duration: number; values: Value[] }> {
    if (parties.length === 0) {
      throw new Error('Turn-based CL24 stage requires at least one party');
    }

    this.#pendingParties = parties.length;
    const values = new Array<Value>(parties.length);
    const indexById = new Map(parties.map((party, index) => [party.id, index]));

    const duration = await new Promise<number>((resolve, reject) => {
      this.#settle = { resolve, reject };

      for (const party of parties) {
        const start = () => {
          this.#beginSlice(party.id);
          party
            .run()
            .then((value) => {
              const index = indexById.get(party.id);
              if (index === undefined) {
                this.#fail(new Error(`Unknown CL24 party ${party.id}`));
                return;
              }
              values[index] = value;
              this.#onPartySettled(party.id);
            })
            .catch((error: unknown) => {
              this.#fail(error);
            });
        };

        if (party.id === this.#measuredPartyId) {
          start();
          this.#onTurnYield(party.id);
        } else {
          this.#notStarted.push({ id: party.id, start });
        }
      }

      if (this.#activeParty === undefined) {
        this.#schedulePump();
      }
    });

    return { duration, values };
  }

  push(
    sessionId: string,
    sender: string,
    receiver: string,
    messageType: string,
    message: Uint8Array,
  ): void {
    if (this.#rejected) {
      return;
    }

    const key = BenchmarkRelay.messageKey(
      sessionId,
      sender,
      receiver,
      messageType,
    );
    const messages = this.#messages.get(key) ?? [];
    messages.push(message);
    this.#messages.set(key, messages);
  }

  pop(
    sessionId: string,
    sender: string,
    receiver: string,
    messageType: string,
  ): Promise<Uint8Array> {
    const key = BenchmarkRelay.messageKey(
      sessionId,
      sender,
      receiver,
      messageType,
    );
    const messages = this.#messages.get(key);
    const message = messages?.shift();

    if (message) {
      if (messages?.length === 0) {
        this.#messages.delete(key);
      }
      this.#onTurnYield(receiver);
      return Promise.resolve(message);
    }

    if (this.#activeParty === receiver) {
      this.#endSlice();
    }

    return new Promise((resolve) => {
      const waitingReceivers = this.#waiters.get(key) ?? [];
      waitingReceivers.push({ partyId: receiver, resolve });
      this.#waiters.set(key, waitingReceivers);
      this.#schedulePump();
    });
  }

  #beginSlice(partyId: string): void {
    if (this.#activeParty !== undefined) {
      this.#endSlice();
    }
    this.#activeParty = partyId;
    if (partyId === this.#measuredPartyId) {
      this.#sliceStart = performance.now();
    }
  }

  #endSlice(): void {
    if (this.#activeParty === this.#measuredPartyId) {
      this.#measuredMs += performance.now() - this.#sliceStart;
    }
    this.#activeParty = undefined;
  }

  #onPartySettled(partyId: string): void {
    if (this.#rejected) {
      return;
    }
    if (this.#activeParty === partyId) {
      this.#endSlice();
    }
    this.#pendingParties -= 1;
    if (this.#pendingParties === 0) {
      this.#settle?.resolve(this.#measuredMs);
      return;
    }
    this.#schedulePump();
  }

  #fail(error: unknown): void {
    if (this.#rejected) {
      return;
    }
    this.#rejected = true;
    if (this.#activeParty !== undefined) {
      this.#endSlice();
    }
    this.#settle?.reject(error);
  }

  #schedulePump(): void {
    if (this.#pumpScheduled || this.#rejected) {
      return;
    }
    this.#pumpScheduled = true;
    queueMicrotask(() => {
      this.#pumpScheduled = false;
      this.#pump();
    });
  }

  #pump(): void {
    if (this.#rejected || this.#activeParty !== undefined) {
      return;
    }

    if (this.#resumeIfReady(this.#measuredPartyId)) {
      return;
    }

    const nextStart = this.#notStarted.shift();
    if (nextStart) {
      nextStart.start();
      this.#onTurnYield(nextStart.id);
      return;
    }

    for (const waiters of this.#waiters.values()) {
      const waiter = waiters[0];
      if (waiter && this.#resumeIfReady(waiter.partyId)) {
        return;
      }
    }

    if (this.#pendingParties > 0 && !this.#hasDeliverableMessage()) {
      this.#fail(new Error('CL24 turn-based scheduler deadlock'));
    }
  }

  #resumeIfReady(partyId: string): boolean {
    for (const [key, waiters] of this.#waiters) {
      const waiterIndex = waiters.findIndex(
        (waiter) => waiter.partyId === partyId,
      );
      if (waiterIndex === -1) {
        continue;
      }

      const messages = this.#messages.get(key);
      const message = messages?.shift();
      if (!message) {
        continue;
      }

      if (messages?.length === 0) {
        this.#messages.delete(key);
      }

      const [waiter] = waiters.splice(waiterIndex, 1);
      if (waiters.length === 0) {
        this.#waiters.delete(key);
      }
      if (!waiter) {
        continue;
      }

      this.#beginSlice(partyId);
      waiter.resolve(message);
      this.#onTurnYield(partyId);
      return true;
    }

    return false;
  }

  #onTurnYield(partyId: string): void {
    queueMicrotask(() => {
      if (this.#rejected || this.#activeParty !== partyId) {
        return;
      }

      if (this.#resumeIfReady(partyId)) {
        return;
      }

      if (this.#partyHasWaiters(partyId)) {
        this.#endSlice();
        this.#schedulePump();
      }
    });
  }

  #partyHasWaiters(partyId: string): boolean {
    for (const waiters of this.#waiters.values()) {
      if (waiters.some((waiter) => waiter.partyId === partyId)) {
        return true;
      }
    }
    return false;
  }

  #hasDeliverableMessage(): boolean {
    for (const key of this.#waiters.keys()) {
      const queued = this.#messages.get(key);
      if (queued && queued.length > 0) {
        return true;
      }
    }
    return false;
  }
}

export class BenchmarkNetworkSession implements RootNetworkSession {
  readonly sessionId: string;

  readonly selfId: string;

  private readonly relay: BenchmarkMessageRelay;

  constructor(sessionId: string, selfId: string, relay: BenchmarkMessageRelay) {
    this.sessionId = sessionId;
    this.selfId = selfId;
    this.relay = relay;
  }

  sendMessage(
    receiver: string,
    messageType: string,
    message: Uint8Array,
  ): void {
    this.relay.push(
      this.sessionId,
      this.selfId,
      receiver,
      messageType,
      message,
    );
  }

  receiveMessage(sender: string, messageType: string): Promise<Uint8Array> {
    return this.relay.pop(this.sessionId, sender, this.selfId, messageType);
  }

  createSubsession(sessionId: string): NetworkSession {
    return new BenchmarkNetworkSession(
      `${this.sessionId}:${sessionId}`,
      this.selfId,
      this.relay,
    );
  }

  async disconnect(): Promise<void> {
    // The in-memory transport owns no external resources.
  }
}

async function runTurnBasedStage<Value>(
  iteration: number,
  stage: string,
  partyIds: string[],
  runParty: (partyId: string, session: RootNetworkSession) => Promise<Value>,
): Promise<{ duration: number; values: Value[] }> {
  const relay = new TurnBasedRelay(CL24_BENCHMARK_MEASURED_PARTY_ID);
  const sessionId = `cl24-benchmark-${iteration}-${stage}`;

  return relay.runParties(
    partyIds.map((id) => ({
      id,
      run: () =>
        runParty(id, new BenchmarkNetworkSession(sessionId, id, relay)),
    })),
  );
}

function bytesEqual(left: Uint8Array, right: Uint8Array): boolean {
  return (
    left.length === right.length &&
    left.every((value, index) => value === right[index])
  );
}

function assertEqualExports(exportedKeys: Uint8Array[]): Uint8Array {
  const firstExport = exportedKeys[0];
  if (
    !firstExport ||
    !exportedKeys.every((exportedKey) => bytesEqual(exportedKey, firstExport))
  ) {
    throw new Error('CL24 custodians exported different keys');
  }
  return firstExport;
}

async function exportKeys(
  dkm: CL24DKM,
  iteration: number,
  custodiansWithKeys: CustodianKey[],
  onlineCustodians: ShareBinding[],
  stage: string,
): Promise<{ duration: number; value: Uint8Array[] }> {
  const { duration, values } = await runTurnBasedStage(
    iteration,
    stage,
    custodiansWithKeys.map((custodian) => custodian.id),
    async (id, networkSession) => {
      const custodian = custodiansWithKeys.find(
        (candidate) => candidate.id === id,
      );
      if (!custodian) {
        throw new Error(`Missing CL24 custodian ${id}`);
      }
      return dkm.exportKey({
        key: custodian.key,
        onlineCustodians,
        networkSession,
      });
    },
  );
  return { duration, value: values };
}

/**
 * Executes one complete CL24 DKM lifecycle.
 *
 * Stage durations are local-party CPU only (`party-1`). Peers still run so the
 * protocol can complete, but their stacks are excluded from the timer. A third
 * custodian is added during rotation because replacing one member of the
 * initial 2-of-2 set would leave only one dealer, below the threshold.
 * @param iteration
 */
export async function runCL24BenchmarkSample(
  iteration: number,
): Promise<CL24BenchmarkSample> {
  const dkm = new CL24DKM(
    secp256k1,
    new BenchmarkRandomNumberGenerator(iteration + 1),
  );

  const keyGeneration = await runTurnBasedStage(
    iteration,
    'key-generation',
    INITIAL_CUSTODIANS,
    async (id, networkSession): Promise<CustodianKey> => ({
      id,
      key: await dkm.createKey({
        custodians: INITIAL_CUSTODIANS,
        threshold: THRESHOLD,
        networkSession,
      }),
    }),
  );

  const initialBindings = dealersFromCL24Key(
    keyGeneration.values[0].key,
    INITIAL_CUSTODIANS,
  );
  const initialExport = await exportKeys(
    dkm,
    iteration,
    keyGeneration.values,
    initialBindings,
    'initial-export',
  );
  const originalSecret = assertEqualExports(initialExport.value);

  const shareRefresh = await runTurnBasedStage(
    iteration,
    'share-refresh',
    keyGeneration.values.map((custodian) => custodian.id),
    async (id, networkSession): Promise<CustodianKey> => {
      const custodian = keyGeneration.values.find(
        (candidate) => candidate.id === id,
      );
      if (!custodian) {
        throw new Error(`Missing CL24 custodian ${id}`);
      }
      return {
        id,
        key: await dkm.rotateKeyShares({
          key: custodian.key,
          dealers: initialBindings,
          custodians: INITIAL_CUSTODIANS,
          networkSession,
        }),
      };
    },
  );

  const refreshedPublicKey = shareRefresh.values[0].key.publicKey;
  if (
    !shareRefresh.values.every(({ key }) =>
      bytesEqual(key.publicKey, refreshedPublicKey),
    ) ||
    !bytesEqual(refreshedPublicKey, keyGeneration.values[0].key.publicKey)
  ) {
    throw new Error('CL24 share refresh changed the public key');
  }

  const accessStructure: AccessStructure = dkm.accessStructureFromKey(
    shareRefresh.values[0].key,
  );
  const updatePartyIds = [
    ...shareRefresh.values.map(({ id }) => id),
    'party-3',
  ];
  const updateKeys = new Map<string, CL24ThresholdKey | AccessStructure>([
    ...shareRefresh.values.map(({ id, key }) => [id, key] as const),
    ['party-3', accessStructure],
  ]);

  const rosterUpdate = await runTurnBasedStage(
    iteration,
    'roster-update',
    updatePartyIds,
    async (id, networkSession): Promise<CustodianKey> => {
      const key = updateKeys.get(id);
      if (!key) {
        throw new Error(`Missing CL24 rotation input for ${id}`);
      }
      return {
        id,
        key: await dkm.rotateKeyShares({
          key,
          dealers: initialBindings,
          custodians: UPDATED_CUSTODIANS,
          networkSession,
        }),
      };
    },
  );

  const updatedBindings = dealersFromCL24Key(
    rosterUpdate.values[0].key,
    UPDATED_CUSTODIANS,
  ).slice(0, THRESHOLD);
  const finalExporters = rosterUpdate.values.slice(0, THRESHOLD);
  const finalExport = await exportKeys(
    dkm,
    iteration,
    finalExporters,
    updatedBindings,
    'final-export',
  );
  const finalSecret = assertEqualExports(finalExport.value);
  if (!bytesEqual(originalSecret, finalSecret)) {
    throw new Error('CL24 lifecycle changed the exported key');
  }

  const total =
    keyGeneration.duration +
    initialExport.duration +
    shareRefresh.duration +
    rosterUpdate.duration +
    finalExport.duration;

  return {
    keyGeneration: keyGeneration.duration,
    initialExport: initialExport.duration,
    shareRefresh: shareRefresh.duration,
    rosterUpdate: rosterUpdate.duration,
    finalExport: finalExport.duration,
    total,
  };
}

function calculateStatistics(values: number[]): CL24BenchmarkStatistics {
  const sortedValues = [...values].sort((left, right) => left - right);
  const middleIndex = Math.floor(sortedValues.length / 2);
  const median =
    sortedValues.length % 2 === 0
      ? (sortedValues[middleIndex - 1] + sortedValues[middleIndex]) / 2
      : sortedValues[middleIndex];

  return {
    min: sortedValues[0],
    median,
    max: sortedValues[sortedValues.length - 1],
  };
}

export function summarizeCL24Benchmark(
  samples: CL24BenchmarkSample[],
): CL24BenchmarkSummary {
  if (samples.length === 0) {
    throw new Error('At least one CL24 benchmark sample is required');
  }

  const stages: CL24BenchmarkStage[] = [
    'keyGeneration',
    'initialExport',
    'shareRefresh',
    'rosterUpdate',
    'finalExport',
    'total',
  ];

  return Object.fromEntries(
    stages.map((stage) => [
      stage,
      calculateStatistics(samples.map((sample) => sample[stage])),
    ]),
  ) as CL24BenchmarkSummary;
}

function yieldToEventLoop(): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, 0));
}

export async function runCL24Benchmark(
  metadata: CL24BenchmarkMetadata,
  options: {
    sampleIterations?: number;
    warmupIterations?: number;
  } = {},
): Promise<CL24BenchmarkResult> {
  const warmupIterations =
    options.warmupIterations ?? CL24_BENCHMARK_WARMUP_ITERATIONS;
  const sampleIterations =
    options.sampleIterations ?? CL24_BENCHMARK_SAMPLE_ITERATIONS;

  if (warmupIterations < 0 || sampleIterations < 1) {
    throw new Error('CL24 benchmark iteration counts are invalid');
  }

  for (let index = 0; index < warmupIterations; index++) {
    await runCL24BenchmarkSample(index);
    await yieldToEventLoop();
  }

  const samples: CL24BenchmarkSample[] = [];
  for (let index = 0; index < sampleIterations; index++) {
    samples.push(await runCL24BenchmarkSample(warmupIterations + index));
    await yieldToEventLoop();
  }

  return {
    configuration: {
      curve: 'secp256k1',
      initialPartyCount: 2,
      threshold: THRESHOLD,
      updatedPartyCount: 3,
      measuredPartyId: CL24_BENCHMARK_MEASURED_PARTY_ID,
      transport: CL24_BENCHMARK_TRANSPORT,
      warmupIterations,
      sampleIterations,
    },
    metadata,
    samples,
    summary: summarizeCL24Benchmark(samples),
    timestamp: new Date().toISOString(),
  };
}
