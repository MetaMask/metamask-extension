/**
 * @jest-environment node
 *
 * QrSyncController syncs selected wallets from the extension to MetaMask Mobile
 * over the Mobile Wallet Protocol (MWP) relay.
 */
import {
  ErrorCode as MwpCoreErrorCode,
  SessionError as MwpCoreSessionError,
} from '@metamask/mobile-wallet-protocol-core';
import { KeyringType } from '@metamask/keyring-api/v2';
import {
  AccountGroupType,
  AccountWalletType,
  toAccountWalletId,
  type AccountGroupId,
  type AccountWalletId,
} from '@metamask/account-api';
import type {
  AccountGroupObject,
  AccountWalletObject,
} from '@metamask/account-tree-controller';
import {
  MOCK_ANY_NAMESPACE,
  Messenger,
  MessengerActions,
  MessengerEvents,
  MockAnyNamespace,
} from '@metamask/messenger';

import {
  QR_SYNC_PHASES,
  QR_SYNC_TIMEOUT_MS,
  QrSyncErrorCodes,
} from '../../../../shared/constants/qr-sync';
import { MOCK_ACCOUNT_EOA } from '../../../../test/data/mock-accounts';
import {
  QrSyncActionTypes,
  QrSyncConnectionStatus,
  QrSyncErrorMessages,
} from './constants';
import { getDefaultQrSyncControllerState } from './metadata';
import { QrSyncController } from './qr-sync-controller';
import { QrSyncDataService } from './qr-sync-data-service';
import type { KeyManager } from './key-manager';
import type {
  QrSyncControllerMessenger,
  QrSyncDataServiceMessenger,
} from './types';

type RootMessenger = Messenger<
  MockAnyNamespace,
  MessengerActions<QrSyncControllerMessenger | QrSyncDataServiceMessenger>,
  MessengerEvents<QrSyncControllerMessenger | QrSyncDataServiceMessenger>
>;

const TEST_RELAY_URL = 'wss://test-relay.example/connection/websocket';
const TEST_SESSION_ID = 'session-abc';
const TEST_ENTROPY_ID = 'entropy-primary';
const TEST_SECONDARY_ENTROPY_ID = 'entropy-secondary';
const TEST_PASSWORD = 'test-password';
const TEST_SEED_PHRASE = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11];
const TEST_ACCOUNT_ID = 'test-account-id';

function createEntropyWalletFixture(
  entropyId: string,
  walletName: string,
  groupIndex = 0,
) {
  const walletId = toAccountWalletId(AccountWalletType.Entropy, entropyId);
  const groupId = `${walletId}/${groupIndex}` as AccountGroupId;
  const group = {
    type: AccountGroupType.MultichainAccount,
    id: groupId,
    accounts: [TEST_ACCOUNT_ID],
    metadata: {
      name: `Account ${groupIndex + 1}`,
      pinned: false,
      hidden: false,
      lastSelected: 0,
      entropy: { groupIndex },
    },
  } as AccountGroupObject;
  const wallet = {
    type: AccountWalletType.Entropy,
    id: walletId,
    status: 'ready',
    groups: { [groupId]: group },
    metadata: {
      name: walletName,
      entropy: { id: entropyId },
    },
  } as AccountWalletObject;

  return { walletId, groupId, group, wallet };
}

const primaryEntropyFixture = createEntropyWalletFixture(
  TEST_ENTROPY_ID,
  'Wallet 1',
);
const secondaryEntropyFixture = createEntropyWalletFixture(
  TEST_SECONDARY_ENTROPY_ID,
  'Wallet 2',
);

const mockMwp = {
  dappClient: null as {
    disconnect: jest.Mock;
    connect: jest.Mock;
    sendRequest: jest.Mock;
    emit: (event: string, ...args: unknown[]) => void;
  } | null,
  connect: jest.fn().mockResolvedValue(undefined),
};

jest.mock('@metamask/mobile-wallet-protocol-core', () => {
  const actual = jest.requireActual('@metamask/mobile-wallet-protocol-core');

  return {
    ...actual,
    WebSocketTransport: {
      create: jest.fn().mockResolvedValue({}),
    },
    SessionStore: {
      create: jest.fn().mockResolvedValue({}),
    },
  };
});

jest.mock('@metamask/mobile-wallet-protocol-dapp-client', () => {
  class DappClient {
    readonly #handlers = new Map<string, Set<(...args: unknown[]) => void>>();

    connect = mockMwp.connect;

    disconnect = jest.fn().mockResolvedValue(undefined);

    sendRequest = jest.fn().mockResolvedValue(undefined);

    constructor() {
      mockMwp.dappClient = this;
    }

    on(event: string, handler: (...args: unknown[]) => void): void {
      const handlers = this.#handlers.get(event) ?? new Set();
      handlers.add(handler);
      this.#handlers.set(event, handlers);
    }

    off(event: string, handler: (...args: unknown[]) => void): void {
      this.#handlers.get(event)?.delete(handler);
    }

    emit(event: string, ...args: unknown[]): void {
      for (const handler of this.#handlers.get(event) ?? []) {
        handler(...args);
      }
    }
  }

  return { DappClient };
});

const mockKeyManager: KeyManager = {
  generateKeyPair: jest.fn(),
  validatePeerKey: jest.fn(),
  encrypt: jest.fn(),
  decrypt: jest.fn(),
};

function setupController(
  options: {
    keyringHandlers?: {
      entropyIds?: string[];
      primaryEntropyId?: string;
      seedPhrase?: number[];
    };
    entropyFixtures?: ReturnType<typeof createEntropyWalletFixture>[];
  } = {},
) {
  const entropyIds = options.keyringHandlers?.entropyIds ?? [TEST_ENTROPY_ID];
  const primaryEntropyId =
    options.keyringHandlers?.primaryEntropyId ?? TEST_ENTROPY_ID;
  const seedPhrase = options.keyringHandlers?.seedPhrase ?? TEST_SEED_PHRASE;
  const entropyFixtures =
    options.entropyFixtures ??
    entropyIds.map((entropyId) =>
      entropyId === TEST_SECONDARY_ENTROPY_ID
        ? secondaryEntropyFixture
        : primaryEntropyFixture,
    );

  const exportSeedPhrase = jest.fn().mockResolvedValue(seedPhrase);
  const groupsById = new Map<AccountGroupId, AccountGroupObject>(
    entropyFixtures.map((fixture) => [fixture.groupId, fixture.group]),
  );
  const walletsById = new Map<AccountWalletId, AccountWalletObject>(
    entropyFixtures.map((fixture) => [fixture.walletId, fixture.wallet]),
  );

  const rootMessenger: RootMessenger = new Messenger({
    namespace: MOCK_ANY_NAMESPACE,
  });

  const qrSyncMessenger: QrSyncControllerMessenger = new Messenger({
    namespace: 'QrSyncController',
    parent: rootMessenger,
  });

  const dataServiceMessenger: QrSyncDataServiceMessenger = new Messenger({
    namespace: 'QrSyncDataService',
    parent: rootMessenger,
  });

  rootMessenger.delegate({
    messenger: dataServiceMessenger,
    actions: [
      'KeyringController:withKeyringV2',
      'KeyringController:exportSeedPhrase',
      'KeyringController:exportAccount',
      'AccountTreeController:getAccountGroupObject',
      'AccountTreeController:getAccountWalletObject',
      'AccountsController:getAccount',
    ],
    events: [],
  });

  rootMessenger.delegate({
    messenger: qrSyncMessenger,
    actions: ['QrSyncDataService:buildWalletExportEntries'],
    events: [],
  });

  const qrSyncDataService = new QrSyncDataService({
    messenger: dataServiceMessenger,
  });

  rootMessenger.registerActionHandler(
    'KeyringController:withKeyringV2',
    jest.fn().mockImplementation((selector, callback) => {
      if ('id' in selector) {
        if (!entropyIds.includes(selector.id)) {
          throw new Error('Keyring not found');
        }

        return callback({
          keyring: { type: KeyringType.Hd },
          metadata: { id: selector.id },
        });
      }

      if ('type' in selector && selector.type === KeyringType.Hd) {
        return callback({
          keyring: { type: KeyringType.Hd },
          metadata: { id: primaryEntropyId },
        });
      }

      throw new Error('Unexpected keyring selector');
    }),
  );

  rootMessenger.registerActionHandler(
    'KeyringController:exportSeedPhrase',
    exportSeedPhrase,
  );

  rootMessenger.registerActionHandler(
    'KeyringController:exportAccount',
    jest.fn().mockResolvedValue('0xprivate'),
  );

  rootMessenger.registerActionHandler(
    'AccountTreeController:getAccountGroupObject',
    jest.fn((groupId: AccountGroupId) => groupsById.get(groupId)),
  );

  rootMessenger.registerActionHandler(
    'AccountTreeController:getAccountWalletObject',
    jest.fn((walletId: AccountWalletId) => walletsById.get(walletId)),
  );

  rootMessenger.registerActionHandler(
    'AccountsController:getAccount',
    jest.fn(() => ({
      ...MOCK_ACCOUNT_EOA,
      id: TEST_ACCOUNT_ID,
      address: '0x123',
    })),
  );

  const controller = new QrSyncController({
    keyManager: mockKeyManager,
    messenger: qrSyncMessenger,
    relayUrl: TEST_RELAY_URL,
  });

  return {
    controller,
    rootMessenger,
    qrSyncMessenger,
    qrSyncDataService,
    exportSeedPhrase,
    primaryGroupId:
      entropyFixtures[0]?.groupId ?? primaryEntropyFixture.groupId,
    entropyFixtures,
  };
}

async function mockStartSession(controller: QrSyncController): Promise<void> {
  const createSessionPromise = controller.createSession();
  await new Promise((resolve) => {
    setImmediate(resolve);
  });
  mockEmitSessionRequest();
  await createSessionPromise;
}

function mockEmitSessionRequest(
  overrides: Partial<{
    id: string;
    expiresAt: number;
  }> = {},
): void {
  mockMwp.dappClient?.emit('session_request', {
    id: overrides.id ?? TEST_SESSION_ID,
    expiresAt: overrides.expiresAt ?? Date.now() + 60_000,
  });
}

function mockEmitOtpRequired(
  submit: (otp: string) => Promise<void> = jest
    .fn()
    .mockResolvedValue(undefined),
  cancel: () => void = jest.fn(),
  deadline = Date.now() + 60_000,
): void {
  mockMwp.dappClient?.emit('otp_required', {
    submit,
    cancel,
    deadline,
  });
}

function mockEmitConnected(): void {
  mockMwp.dappClient?.emit('connected');
}

async function flushAsyncWork(): Promise<void> {
  await Promise.resolve();
  await new Promise<void>((resolve) => {
    setImmediate(resolve);
  });
}

function mockEmitInvalidSyncOffer(): void {
  mockEmitConnected();
  mockMwp.dappClient?.emit('message', {
    type: QrSyncActionTypes.SYNC_OFFER,
    version: '1.0.0',
    data: {},
  });
}

function mockEmitSyncOffer(isOnboardingCompleted = true): void {
  mockEmitConnected();
  mockMwp.dappClient?.emit('message', {
    type: QrSyncActionTypes.SYNC_OFFER,
    version: '1.0.0',
    data: { sessionId: TEST_SESSION_ID, isOnboardingCompleted },
  });
}

async function mockSetReviewingSyncOffer(
  controller: QrSyncController,
  isOnboardingCompleted = true,
): Promise<void> {
  mockEmitOtpRequired();
  await controller.submitOtp('123456');
  mockEmitSyncOffer(isOnboardingCompleted);
  if (controller.state.qrSyncPhase !== QR_SYNC_PHASES.REVIEWING_SYNC_OFFER) {
    throw new Error('Expected reviewing sync offer phase');
  }
}

function mockEmitSyncCompleted(): void {
  mockMwp.dappClient?.emit('message', {
    type: QrSyncActionTypes.SYNC_COMPLETED,
    version: '1.0.0',
  });
}

function mockEmitSyncCancel(): void {
  mockMwp.dappClient?.emit('message', {
    type: QrSyncActionTypes.SYNC_CANCEL,
    version: '1.0.0',
  });
}

function mockEmitSyncError(
  data: {
    reason?: string;
    message?: string;
  } = {},
): void {
  mockMwp.dappClient?.emit('message', {
    type: QrSyncActionTypes.SYNC_ERROR,
    version: '1.0.0',
    data,
  });
}

describe('QrSyncController', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockMwp.dappClient = null;
    mockMwp.connect.mockResolvedValue(undefined);
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe('initial state', () => {
    it('starts idle with no active session', () => {
      const { controller } = setupController();

      expect(controller.state).toStrictEqual(getDefaultQrSyncControllerState());
    });
  });

  describe('createSession', () => {
    it('connects to the relay and exposes a QR payload for mobile to scan', async () => {
      const { controller } = setupController();

      await mockStartSession(controller);

      expect(mockMwp.connect).toHaveBeenCalledWith({
        initialPayload: {
          type: QrSyncActionTypes.INIT_SYNC_SESSION,
          version: '1.0.0',
        },
        mode: 'untrusted',
      });
      expect(controller.state.qrSyncPhase).toBe(QR_SYNC_PHASES.DISPLAYING_QR);
      expect(controller.state.qrSyncSessionId).toBe(TEST_SESSION_ID);
      expect(controller.state.qrSyncQrPayload).toMatch(
        /^metamask:\/\/connect\/mwp\?p=[A-Za-z0-9%+/=_-]*$/u,
      );
      const decodedSessionRequest = JSON.parse(
        Buffer.from(
          new URL(controller.state.qrSyncQrPayload ?? '').searchParams.get(
            'p',
          ) ?? '',
          'base64',
        ).toString('utf8'),
      );
      expect(decodedSessionRequest.id).toBe(TEST_SESSION_ID);
      expect(controller.state.qrSyncConnectionStatus).toBe('connecting');
    });

    it('marks the session as failed when the relay connection fails', async () => {
      const { controller } = setupController();
      mockMwp.connect.mockRejectedValueOnce(new Error('Relay unavailable'));

      await controller.createSession();

      expect(controller.state.qrSyncPhase).toBe(QR_SYNC_PHASES.FAILED);
      expect(controller.state.qrSyncConnectionStatus).toBe('errored');
      expect(controller.state.qrSyncQrPayload).toBeNull();
      expect(controller.state.qrSyncError).toStrictEqual({
        code: QrSyncErrorCodes.UNKNOWN,
        message: QrSyncErrorMessages.UNKNOWN,
      });
    });

    it('cancels OTP and cleans up when connect fails during handshake', async () => {
      const cancelOtp = jest.fn();
      const { controller } = setupController();

      mockMwp.connect.mockImplementationOnce(async () => {
        mockEmitSessionRequest();
        mockEmitOtpRequired(jest.fn().mockResolvedValue(undefined), cancelOtp);
        throw new Error('Relay unavailable');
      });

      await controller.createSession();

      expect(cancelOtp).toHaveBeenCalledTimes(1);
      expect(controller.state.qrSyncPhase).toBe(QR_SYNC_PHASES.FAILED);
      expect(controller.state.qrSyncConnectionStatus).toBe('errored');
      expect(controller.state.qrSyncQrPayload).toBeNull();
    });

    it('marks the session as QR expired when the handshake request expires', async () => {
      const { controller } = setupController();
      const expiredError = new MwpCoreSessionError(
        MwpCoreErrorCode.REQUEST_EXPIRED,
        'Did not receive handshake offer from wallet in time.',
      );
      mockMwp.connect.mockRejectedValueOnce(expiredError);

      await controller.createSession();

      expect(controller.state.qrSyncPhase).toBe(QR_SYNC_PHASES.FAILED);
      expect(controller.state.qrSyncConnectionStatus).toBe('errored');
      expect(controller.state.qrSyncQrPayload).toBeNull();
      expect(controller.state.qrSyncError).toStrictEqual({
        code: QrSyncErrorCodes.QR_EXPIRED,
        message: 'Did not receive handshake offer from wallet in time.',
      });
    });

    it('waits for in-flight cleanup before reconnecting after a client error', async () => {
      const { controller } = setupController();

      await mockStartSession(controller);

      let resolveDisconnect!: () => void;
      const disconnectDeferred = new Promise<void>((resolve) => {
        resolveDisconnect = resolve;
      });
      mockMwp.dappClient?.disconnect.mockImplementationOnce(
        () => disconnectDeferred,
      );

      mockMwp.dappClient?.emit('error', new Error('channel failed'));

      const { WebSocketTransport } = jest.requireMock(
        '@metamask/mobile-wallet-protocol-core',
      ) as {
        // eslint-disable-next-line @typescript-eslint/naming-convention
        WebSocketTransport: {
          create: jest.Mock;
        };
      };

      let transportCreateCalled = false;
      WebSocketTransport.create.mockImplementationOnce(async () => {
        transportCreateCalled = true;
        return {};
      });

      const retrySessionPromise = controller.createSession();
      await flushAsyncWork();

      expect(transportCreateCalled).toBe(false);

      resolveDisconnect();
      mockMwp.connect.mockImplementationOnce(async () => {
        mockEmitSessionRequest();
      });
      await retrySessionPromise;

      expect(transportCreateCalled).toBe(true);
      expect(controller.state.qrSyncPhase).toBe(QR_SYNC_PHASES.DISPLAYING_QR);
      expect(controller.state.qrSyncConnectionStatus).toBe(
        QrSyncConnectionStatus.CONNECTING,
      );
      expect(controller.state.qrSyncError).toBeNull();
    });

    it('resets previous failed session state before reconnecting after OTP expires', async () => {
      const cancelOtp = jest.fn();
      const { controller } = setupController();

      await mockStartSession(controller);

      jest.useFakeTimers();
      try {
        mockEmitOtpRequired(jest.fn(), cancelOtp);

        await jest.advanceTimersByTimeAsync(
          QR_SYNC_TIMEOUT_MS.MWP_SESSION_TIMEOUT,
        );

        expect(controller.state.qrSyncPhase).toBe(QR_SYNC_PHASES.FAILED);
        expect(controller.state.qrSyncError).toStrictEqual({
          code: QrSyncErrorCodes.OTP_EXPIRED,
          message: QrSyncErrorMessages.OTP_EXPIRED,
        });
      } finally {
        jest.useRealTimers();
      }

      const { WebSocketTransport } = jest.requireMock(
        '@metamask/mobile-wallet-protocol-core',
      ) as {
        // eslint-disable-next-line @typescript-eslint/naming-convention
        WebSocketTransport: {
          create: jest.Mock;
        };
      };

      let stateDuringInitialize: QrSyncController['state'] | undefined;
      let resolveTransport!: (value: object) => void;
      const transportDeferred = new Promise<object>((resolve) => {
        resolveTransport = resolve;
      });

      WebSocketTransport.create.mockImplementationOnce(() => {
        stateDuringInitialize = controller.state;
        return transportDeferred;
      });

      const retrySessionPromise = controller.createSession();
      await flushAsyncWork();

      expect(stateDuringInitialize).toBeDefined();
      expect(stateDuringInitialize).toMatchObject({
        qrSyncPhase: QR_SYNC_PHASES.IDLE,
        qrSyncConnectionStatus: QrSyncConnectionStatus.CONNECTING,
        qrSyncError: null,
        qrSyncQrPayload: null,
      });

      resolveTransport({});
      mockMwp.connect.mockImplementationOnce(async () => {
        mockEmitSessionRequest();
      });
      await retrySessionPromise;

      expect(controller.state.qrSyncPhase).toBe(QR_SYNC_PHASES.DISPLAYING_QR);
    });
  });

  describe('submitOtp', () => {
    it('forwards the OTP to mobile and waits for the sync offer', async () => {
      const { controller } = setupController();
      const submitOtp = jest.fn().mockResolvedValue(undefined);

      await mockStartSession(controller);
      mockEmitOtpRequired(submitOtp);

      await controller.submitOtp(' 123456 ');

      expect(submitOtp).toHaveBeenCalledWith('123456');
      expect(controller.state.qrSyncPhase).toBe(
        QR_SYNC_PHASES.AWAITING_SYNC_OFFER,
      );

      mockEmitSyncOffer();
    });

    it('fails the session when sync offer times out', async () => {
      const submitOtp = jest.fn().mockResolvedValue(undefined);
      const { controller } = setupController();

      await mockStartSession(controller);
      mockEmitOtpRequired(submitOtp);

      jest.useFakeTimers();
      try {
        await controller.submitOtp('123456');

        expect(controller.state.qrSyncPhase).toBe(
          QR_SYNC_PHASES.AWAITING_SYNC_OFFER,
        );

        await jest.advanceTimersByTimeAsync(
          QR_SYNC_TIMEOUT_MS.SYNC_OFFER_TIMEOUT,
        );

        expect(mockMwp.dappClient?.sendRequest).toHaveBeenCalledWith(
          expect.objectContaining({
            type: QrSyncActionTypes.SYNC_ERROR,
            version: '1.0.0',
            data: { message: QrSyncErrorMessages.SYNC_OFFER_TIMED_OUT },
          }),
        );
        expect(mockMwp.dappClient?.sendRequest).toHaveBeenCalledWith(
          expect.objectContaining({
            type: QrSyncActionTypes.SYNC_CANCEL,
            version: '1.0.0',
          }),
        );
        expect(controller.state.qrSyncPhase).toBe(QR_SYNC_PHASES.FAILED);
        expect(controller.state.qrSyncConnectionStatus).toBe('errored');
        expect(controller.state.qrSyncError).toStrictEqual({
          code: QrSyncErrorCodes.SESSION_EXPIRED,
          message: QrSyncErrorMessages.SYNC_OFFER_TIMED_OUT,
        });
      } finally {
        jest.useRealTimers();
      }
    });

    it('fails the session and cancels OTP when OTP submission times out', async () => {
      const cancelOtp = jest.fn();
      const { controller } = setupController();

      await mockStartSession(controller);

      jest.useFakeTimers();
      try {
        mockEmitOtpRequired(jest.fn(), cancelOtp);

        await jest.advanceTimersByTimeAsync(
          QR_SYNC_TIMEOUT_MS.MWP_SESSION_TIMEOUT,
        );

        expect(controller.state.qrSyncPhase).toBe(QR_SYNC_PHASES.FAILED);
        expect(controller.state.qrSyncConnectionStatus).toBe('errored');
        expect(controller.state.qrSyncQrPayload).toBeNull();
        expect(controller.state.qrSyncError).toStrictEqual({
          code: QrSyncErrorCodes.OTP_EXPIRED,
          message: QrSyncErrorMessages.OTP_EXPIRED,
        });
      } finally {
        jest.useRealTimers();
      }
    });

    it('fails the session when the client emits OTP_MAX_ATTEMPTS_REACHED during OTP entry', async () => {
      const { controller } = setupController();

      await mockStartSession(controller);
      mockEmitOtpRequired(jest.fn().mockResolvedValue(undefined));

      const maxAttemptsReachedError = new MwpCoreSessionError(
        MwpCoreErrorCode.OTP_MAX_ATTEMPTS_REACHED,
        'OTP max attempts reached.',
      );
      mockMwp.dappClient?.emit('error', maxAttemptsReachedError);
      await flushAsyncWork();

      expect(controller.state.qrSyncPhase).toBe(QR_SYNC_PHASES.FAILED);
      expect(controller.state.qrSyncConnectionStatus).toBe('errored');
      expect(controller.state.qrSyncQrPayload).toBeNull();
      expect(controller.state.qrSyncError).toStrictEqual({
        code: QrSyncErrorCodes.OTP_ATTEMPTS_EXCEEDED,
        message: 'OTP max attempts reached.',
      });
    });

    it('rejects OTP submission when the flow is not awaiting OTP input', async () => {
      const { controller } = setupController();

      await expect(controller.submitOtp('123456')).rejects.toThrow(
        'QrSyncController action invalid in phase "idle"',
      );
    });
  });

  describe('cancelOtp', () => {
    it('notifies mobile and cancels the session when the user backs out of OTP entry', async () => {
      const { controller } = setupController();
      const cancelOtp = jest.fn();

      await mockStartSession(controller);
      mockEmitOtpRequired(undefined, cancelOtp);

      await controller.cancelOtp();

      expect(cancelOtp).toHaveBeenCalledTimes(1);
      expect(mockMwp.dappClient?.sendRequest).toHaveBeenCalledWith({
        type: QrSyncActionTypes.SYNC_CANCEL,
        version: '1.0.0',
      });
      expect(controller.state.qrSyncPhase).toBe(QR_SYNC_PHASES.CANCELLED);
      expect(controller.state.qrSyncSessionId).toBe(TEST_SESSION_ID);
    });

    it('records a cancellation reason when provided', async () => {
      const { controller } = setupController();

      await mockStartSession(controller);
      mockEmitOtpRequired();

      await controller.cancelOtp('User closed verification screen');

      expect(mockMwp.dappClient?.sendRequest).toHaveBeenCalledWith({
        type: QrSyncActionTypes.SYNC_CANCEL,
        version: '1.0.0',
      });
      expect(controller.state.qrSyncPhase).toBe(QR_SYNC_PHASES.CANCELLED);
      expect(controller.state.qrSyncError).toStrictEqual({
        code: QrSyncErrorCodes.SYNC_FAILED,
        message: 'User closed verification screen',
      });
    });

    it('rejects cancellation when the flow is not awaiting OTP input', async () => {
      const { controller } = setupController();

      await expect(controller.cancelOtp()).rejects.toThrow(
        'QrSyncController action invalid in phase "idle"',
      );
    });
  });

  describe('sync offer from mobile', () => {
    it('moves to wallet review when mobile sends a sync offer', async () => {
      const { controller } = setupController();

      await mockStartSession(controller);
      mockEmitOtpRequired();
      await controller.submitOtp('123456');

      mockEmitSyncOffer();

      expect(controller.state.qrSyncPhase).toBe(
        QR_SYNC_PHASES.REVIEWING_SYNC_OFFER,
      );
      expect(controller.state.syncOffer).toStrictEqual({
        sessionId: TEST_SESSION_ID,
        isOnboardingCompleted: true,
      });
    });

    it('rejects sync offers when the dapp client is not connected', async () => {
      const { controller } = setupController();

      await mockStartSession(controller);
      mockEmitOtpRequired();
      await controller.submitOtp('123456');

      expect(() => {
        mockMwp.dappClient?.emit('message', {
          type: QrSyncActionTypes.SYNC_OFFER,
          version: '1.0.0',
          data: { sessionId: TEST_SESSION_ID, isOnboardingCompleted: true },
        });
      }).toThrow(
        `QrSyncController: ${QrSyncErrorMessages.PREMATURE_SYNC_OFFER_RECEIVED}`,
      );

      expect(controller.state.qrSyncPhase).toBe(
        QR_SYNC_PHASES.AWAITING_SYNC_OFFER,
      );
      expect(controller.state.syncOffer).toBeNull();
    });

    it('rejects sync offers when the flow is not awaiting a sync offer', async () => {
      const { controller } = setupController();

      await mockStartSession(controller);
      mockEmitOtpRequired();
      mockEmitConnected();

      expect(() => {
        mockEmitSyncOffer();
      }).toThrow(
        `QrSyncController: ${QrSyncErrorMessages.PREMATURE_SYNC_OFFER_RECEIVED}`,
      );

      expect(controller.state.qrSyncPhase).toBe(
        QR_SYNC_PHASES.AWAITING_OTP_INPUT,
      );
      expect(controller.state.syncOffer).toBeNull();
    });

    it('ignores sync offers with an invalid payload', async () => {
      const { controller } = setupController();

      await mockStartSession(controller);
      mockEmitOtpRequired();
      await controller.submitOtp('123456');

      mockEmitInvalidSyncOffer();

      expect(controller.state.qrSyncPhase).toBe(
        QR_SYNC_PHASES.AWAITING_SYNC_OFFER,
      );
      expect(controller.state.syncOffer).toBeNull();

      mockEmitSyncOffer();
    });
  });

  describe('syncAccounts', () => {
    it('exports selected mnemonics and sends sync-ready to mobile', async () => {
      const { controller, exportSeedPhrase, primaryGroupId } =
        setupController();

      await mockStartSession(controller);
      await mockSetReviewingSyncOffer(controller);

      await controller.syncAccounts(TEST_PASSWORD, [primaryGroupId]);

      expect(exportSeedPhrase).toHaveBeenCalledWith(
        { password: TEST_PASSWORD },
        TEST_ENTROPY_ID,
      );
      expect(mockMwp.dappClient?.sendRequest).toHaveBeenCalledWith(
        expect.objectContaining({
          type: QrSyncActionTypes.SYNC_READY,
          version: '1.0.0',
          deadline: expect.any(Number),
          data: [
            expect.objectContaining({
              type: 'Mnemonic',
              name: 'Wallet 1',
              groups: [
                expect.objectContaining({
                  groupIndex: 0,
                  name: 'Account 1',
                }),
              ],
              isPrimary: true,
            }),
          ],
        }),
      );
      expect(controller.state.qrSyncPhase).toBe(
        QR_SYNC_PHASES.AWAITING_SYNC_COMPLETION,
      );
      expect(controller.state.qrSyncSelectedAccountGroupIds).toStrictEqual([
        primaryGroupId,
      ]);

      mockEmitSyncCompleted();
    });

    it('marks non-primary wallets when exporting multiple entropy sources', async () => {
      const { controller } = setupController({
        keyringHandlers: {
          entropyIds: [TEST_ENTROPY_ID, TEST_SECONDARY_ENTROPY_ID],
          primaryEntropyId: TEST_ENTROPY_ID,
        },
      });

      await mockStartSession(controller);
      await mockSetReviewingSyncOffer(controller);

      await controller.syncAccounts(TEST_PASSWORD, [
        primaryEntropyFixture.groupId,
        secondaryEntropyFixture.groupId,
      ]);

      const syncReadyPayload = mockMwp.dappClient?.sendRequest.mock.calls.find(
        ([message]) => message.type === QrSyncActionTypes.SYNC_READY,
      )?.[0];

      expect(syncReadyPayload?.data).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            type: 'Mnemonic',
            isPrimary: true,
          }),
          expect.objectContaining({
            type: 'Mnemonic',
          }),
        ]),
      );
      expect(
        syncReadyPayload?.data?.find(
          (entry: { isPrimary?: boolean }) => entry.isPrimary === true,
        ),
      ).toBeDefined();
      expect(
        syncReadyPayload?.data?.filter(
          (entry: { isPrimary?: boolean }) => entry.isPrimary === true,
        ),
      ).toHaveLength(1);

      mockEmitSyncCompleted();
    });

    it('fails the session when sync completion times out', async () => {
      const { controller, primaryGroupId } = setupController();

      await mockStartSession(controller);
      await mockSetReviewingSyncOffer(controller);

      jest.useFakeTimers();
      try {
        await controller.syncAccounts(TEST_PASSWORD, [primaryGroupId]);

        expect(controller.state.qrSyncPhase).toBe(
          QR_SYNC_PHASES.AWAITING_SYNC_COMPLETION,
        );

        await jest.advanceTimersByTimeAsync(
          QR_SYNC_TIMEOUT_MS.SYNC_COMPLETION_TIMEOUT,
        );

        expect(controller.state.qrSyncPhase).toBe(QR_SYNC_PHASES.FAILED);
        expect(controller.state.qrSyncConnectionStatus).toBe('errored');
        expect(controller.state.qrSyncError).toStrictEqual({
          code: QrSyncErrorCodes.SESSION_EXPIRED,
          message: QrSyncErrorMessages.SYNC_COMPLETION_TIMED_OUT,
        });
      } finally {
        jest.useRealTimers();
      }
    });
  });

  describe('sync completion', () => {
    it('finishes the flow when mobile reports sync-completed', async () => {
      const { controller, primaryGroupId } = setupController();

      await mockStartSession(controller);
      await mockSetReviewingSyncOffer(controller);
      await controller.syncAccounts(TEST_PASSWORD, [primaryGroupId]);
      mockEmitSyncCompleted();

      expect(controller.state.qrSyncPhase).toBe(QR_SYNC_PHASES.COMPLETED);
      expect(controller.state.qrSyncSelectedAccountGroupIds).toStrictEqual([
        primaryGroupId,
      ]);
    });
  });

  describe('cancelSync and resetState', () => {
    it('cleans up without notifying mobile when cancelSync is called before the channel is connected', async () => {
      const { controller } = setupController();

      await mockStartSession(controller);
      expect(controller.state.qrSyncConnectionStatus).toBe(
        QrSyncConnectionStatus.CONNECTING,
      );

      await controller.cancelSync();

      expect(mockMwp.dappClient?.sendRequest).not.toHaveBeenCalledWith({
        type: QrSyncActionTypes.SYNC_CANCEL,
        version: '1.0.0',
      });
      expect(controller.state).toStrictEqual(getDefaultQrSyncControllerState());
    });

    it('notifies mobile and resets state when cancelSync is called after the channel is connected', async () => {
      const { controller } = setupController();

      await mockStartSession(controller);
      mockEmitConnected();
      expect(controller.state.qrSyncConnectionStatus).toBe(
        QrSyncConnectionStatus.CONNECTED,
      );

      await controller.cancelSync();

      expect(mockMwp.dappClient?.sendRequest).toHaveBeenCalledWith({
        type: QrSyncActionTypes.SYNC_CANCEL,
        version: '1.0.0',
      });
      expect(controller.state).toStrictEqual(getDefaultQrSyncControllerState());
    });

    it('returns to the default idle state', async () => {
      const { controller } = setupController();

      await mockStartSession(controller);
      await mockSetReviewingSyncOffer(controller);
      controller.resetState();

      expect(controller.state).toStrictEqual(getDefaultQrSyncControllerState());
    });
  });

  describe('channel errors', () => {
    it('fails the session when the relay disconnects', async () => {
      const { controller } = setupController();

      await mockStartSession(controller);
      mockMwp.dappClient?.emit('disconnected');
      await flushAsyncWork();

      expect(controller.state.qrSyncPhase).toBe(QR_SYNC_PHASES.FAILED);
      expect(controller.state.qrSyncConnectionStatus).toBe('errored');
      expect(controller.state.qrSyncError).toStrictEqual({
        code: QrSyncErrorCodes.CHANNEL_DISCONNECTED,
        message: 'The sync channel disconnected.',
      });
    });

    it('fails with QR expired when the client emits a REQUEST_EXPIRED error', async () => {
      const { controller } = setupController();

      await mockStartSession(controller);
      const expiredError = new MwpCoreSessionError(
        MwpCoreErrorCode.REQUEST_EXPIRED,
        'Did not receive handshake offer from wallet in time.',
      );
      mockMwp.dappClient?.emit('error', expiredError);
      await flushAsyncWork();

      expect(controller.state.qrSyncPhase).toBe(QR_SYNC_PHASES.FAILED);
      expect(controller.state.qrSyncConnectionStatus).toBe('errored');
      expect(controller.state.qrSyncError).toStrictEqual({
        code: QrSyncErrorCodes.QR_EXPIRED,
        message: 'Did not receive handshake offer from wallet in time.',
      });
    });
  });

  describe('peer sync messages', () => {
    it('cancels the session when mobile sends sync-cancel', async () => {
      const { controller } = setupController();

      await mockStartSession(controller);
      mockEmitSyncCancel();

      expect(controller.state.qrSyncPhase).toBe(QR_SYNC_PHASES.CANCELLED);
      expect(controller.state.qrSyncConnectionStatus).toBe('disconnected');
      expect(controller.state.qrSyncError).toStrictEqual({
        code: QrSyncErrorCodes.SYNC_REJECTED,
        message: QrSyncErrorMessages.SYNC_SESSION_CANCELLED_BY_PEER,
      });
    });

    it('fails the session when mobile sends sync-error', async () => {
      const { controller } = setupController();

      await mockStartSession(controller);
      mockEmitSyncError({
        message: 'Mobile could not complete the sync',
      });
      await flushAsyncWork();

      expect(controller.state.qrSyncPhase).toBe(QR_SYNC_PHASES.FAILED);
      expect(controller.state.qrSyncConnectionStatus).toBe('errored');
      expect(controller.state.qrSyncError).toStrictEqual({
        code: QrSyncErrorCodes.SYNC_FAILED,
        message: 'Mobile could not complete the sync',
      });
    });

    it('ignores duplicate peer cancel messages after the session has ended', async () => {
      const { controller } = setupController();

      await mockStartSession(controller);
      mockEmitSyncCancel();
      mockEmitSyncCancel();

      expect(controller.state.qrSyncError?.message).toBe(
        QrSyncErrorMessages.SYNC_SESSION_CANCELLED_BY_PEER,
      );
    });
  });

  describe('Sentry reporting', () => {
    it('reports unexpected session failures to Sentry', async () => {
      const captureException = jest.fn();
      const connectError = new Error('Relay unavailable');
      const { controller, qrSyncMessenger } = setupController();
      // @ts-expect-error - captureException mock
      qrSyncMessenger.captureException = captureException;
      mockMwp.connect.mockRejectedValueOnce(connectError);

      await controller.createSession();

      expect(captureException).toHaveBeenCalledTimes(1);
      const sentryError = captureException.mock.calls[0][0] as Error & {
        cause: unknown;
      };
      expect(sentryError.message).toBe(
        `QR sync session failed (${QrSyncErrorCodes.UNKNOWN})`,
      );
      expect(sentryError.cause).toBe(connectError);
    });

    it('does not report QR expiry to Sentry', async () => {
      const captureException = jest.fn();
      const expiredError = new MwpCoreSessionError(
        MwpCoreErrorCode.REQUEST_EXPIRED,
        'Did not receive handshake offer from wallet in time.',
      );
      const { controller, qrSyncMessenger } = setupController();
      // @ts-expect-error - captureException mock
      qrSyncMessenger.captureException = captureException;
      mockMwp.connect.mockRejectedValueOnce(expiredError);

      await controller.createSession();

      expect(captureException).not.toHaveBeenCalled();
    });

    it('reports mobile sync-error messages to Sentry', async () => {
      const captureException = jest.fn();
      const { controller, qrSyncMessenger } = setupController();
      // @ts-expect-error - captureException mock
      qrSyncMessenger.captureException = captureException;

      await mockStartSession(controller);
      mockEmitSyncError({
        message: 'Mobile could not complete the sync',
      });
      await flushAsyncWork();

      expect(captureException).toHaveBeenCalledTimes(1);
      const sentryError = captureException.mock.calls[0][0] as Error & {
        cause: unknown;
      };
      expect(sentryError.message).toBe(
        `QR sync session failed (${QrSyncErrorCodes.SYNC_FAILED})`,
      );
      expect(sentryError.cause).toBeInstanceOf(Error);
      expect((sentryError.cause as Error).message).toBe(
        'Mobile could not complete the sync',
      );
    });

    it('does not report sync offer timeouts to Sentry', async () => {
      const captureException = jest.fn();
      const submitOtp = jest.fn().mockResolvedValue(undefined);
      const { controller, qrSyncMessenger } = setupController();
      // @ts-expect-error - captureException mock
      qrSyncMessenger.captureException = captureException;

      await mockStartSession(controller);
      mockEmitOtpRequired(submitOtp);

      jest.useFakeTimers();
      try {
        await controller.submitOtp('123456');
        await jest.advanceTimersByTimeAsync(
          QR_SYNC_TIMEOUT_MS.SYNC_OFFER_TIMEOUT,
        );
      } finally {
        jest.useRealTimers();
      }

      expect(captureException).not.toHaveBeenCalled();
    });

    it('does not report OTP expiry to Sentry', async () => {
      const captureException = jest.fn();
      const { controller, qrSyncMessenger } = setupController();
      // @ts-expect-error - captureException mock
      qrSyncMessenger.captureException = captureException;

      await mockStartSession(controller);

      jest.useFakeTimers();
      try {
        mockEmitOtpRequired(jest.fn());
        await jest.advanceTimersByTimeAsync(
          QR_SYNC_TIMEOUT_MS.MWP_SESSION_TIMEOUT,
        );
      } finally {
        jest.useRealTimers();
      }

      expect(captureException).not.toHaveBeenCalled();
    });

    it('does not report transport disconnects to Sentry', async () => {
      const captureException = jest.fn();
      const { controller, qrSyncMessenger } = setupController();
      // @ts-expect-error - captureException mock
      qrSyncMessenger.captureException = captureException;

      await mockStartSession(controller);
      mockMwp.dappClient?.emit(
        'disconnected',
        new MwpCoreSessionError(
          MwpCoreErrorCode.TRANSPORT_DISCONNECTED,
          'Transport disconnected.',
        ),
      );
      await flushAsyncWork();

      expect(captureException).not.toHaveBeenCalled();
    });

    it('reports send-message failures to Sentry', async () => {
      const captureException = jest.fn();
      const sendError = new Error('Relay write failed');
      const { controller, qrSyncMessenger, primaryGroupId } =
        setupController();
      // @ts-expect-error - captureException mock
      qrSyncMessenger.captureException = captureException;

      await mockStartSession(controller);
      await mockSetReviewingSyncOffer(controller);
      mockMwp.dappClient?.sendRequest.mockRejectedValueOnce(sendError);

      await expect(
        controller.syncAccounts(TEST_PASSWORD, [primaryGroupId]),
      ).rejects.toThrow(QrSyncErrorMessages.SYNC_FAILED_TO_SEND_MESSAGE);

      expect(captureException).toHaveBeenCalledTimes(1);
      const sentryError = captureException.mock.calls[0][0] as Error & {
        cause: unknown;
      };
      expect(sentryError.message).toBe(
        `QR sync failed to send message (${QrSyncActionTypes.SYNC_READY})`,
      );
      expect(sentryError.cause).toBe(sendError);
    });
  });
});
