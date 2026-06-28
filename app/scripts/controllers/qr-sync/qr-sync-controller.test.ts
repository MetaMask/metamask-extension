/**
 * @jest-environment node
 *
 * QrSyncController syncs selected wallets from the extension to MetaMask Mobile
 * over the Mobile Wallet Protocol (MWP) relay.
 *
 * Happy-path flow:
 * 1. Extension calls `createSession()` → relay connects → QR payload is shown
 * 2. Mobile scans the QR → mobile shows an OTP → user enters it via `submitOtp()`
 * 3. Mobile sends `sync-offer` → user picks wallets → `syncAccounts()` exports mnemonics
 * 4. Extension sends `sync-ready` with encrypted wallet data
 * 5. Mobile sends `sync-completed` → flow finishes
 */
import { KeyringType } from '@metamask/keyring-api/v2';
import {
  MOCK_ANY_NAMESPACE,
  Messenger,
  MessengerActions,
  MessengerEvents,
  MockAnyNamespace,
} from '@metamask/messenger';

import { QR_SYNC_PHASES, MWP_SESSION_REQUEST_EXPIRY_SECONDS } from '../../../../shared/constants/qr-sync';
import { QrSyncActionTypes, QrSyncErrorMessages } from './constants';
import { getDefaultQrSyncControllerState } from './metadata';
import { QrSyncController } from './qr-sync-controller';
import type { KeyManager } from './key-manager';
import type { QrSyncControllerMessenger } from './types';

type RootMessenger = Messenger<
  MockAnyNamespace,
  MessengerActions<QrSyncControllerMessenger>,
  MessengerEvents<QrSyncControllerMessenger>
>;

const TEST_RELAY_URL = 'wss://test-relay.example/connection/websocket';
const TEST_SESSION_ID = 'session-abc';
const TEST_ENTROPY_ID = 'entropy-primary';
const TEST_SECONDARY_ENTROPY_ID = 'entropy-secondary';
const TEST_PASSWORD = 'test-password';
const TEST_SEED_PHRASE = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11];

const mockMwp = {
  dappClient: null as {
    connect: jest.Mock;
    sendRequest: jest.Mock;
    emit: (event: string, ...args: unknown[]) => void;
  } | null,
  connect: jest.fn().mockResolvedValue(undefined),
};

jest.mock('@metamask/mobile-wallet-protocol-core', () => ({
  WebSocketTransport: {
    create: jest.fn().mockResolvedValue({}),
  },
  SessionStore: {
    create: jest.fn().mockResolvedValue({}),
  },
}));

jest.mock('@metamask/mobile-wallet-protocol-dapp-client', () => {
  class DappClient {
    readonly #handlers = new Map<string, Set<(...args: unknown[]) => void>>();

    connect = mockMwp.connect;

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
  } = {},
) {
  const {
    entropyIds = [TEST_ENTROPY_ID],
    primaryEntropyId = TEST_ENTROPY_ID,
    seedPhrase = TEST_SEED_PHRASE,
  } = options.keyringHandlers ?? {};

  const exportSeedPhrase = jest.fn().mockResolvedValue(seedPhrase);

  const rootMessenger: RootMessenger = new Messenger({
    namespace: MOCK_ANY_NAMESPACE,
  });

  const qrSyncMessenger: QrSyncControllerMessenger = new Messenger({
    namespace: 'QrSyncController',
    parent: rootMessenger,
  });

  rootMessenger.delegate({
    messenger: qrSyncMessenger,
    actions: [
      'KeyringController:withKeyringV2',
      'KeyringController:exportSeedPhrase',
      'KeyringController:getState',
      'KeyringController:exportAccount',
    ],
    events: [],
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

  const controller = new QrSyncController({
    keyManager: mockKeyManager,
    messenger: qrSyncMessenger,
    relayUrl: TEST_RELAY_URL,
  });

  return { controller, rootMessenger, qrSyncMessenger, exportSeedPhrase };
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
  submit: (otp: string) => Promise<void> = jest.fn().mockResolvedValue(undefined),
  cancel: () => void = jest.fn(),
  deadline = Date.now() + 60_000,
): void {
  mockMwp.dappClient?.emit('otp_required', {
    submit,
    cancel,
    deadline,
  });
}

function mockEmitInvalidSyncOffer(): void {
  mockMwp.dappClient?.emit('message', {
    type: QrSyncActionTypes.SYNC_OFFER,
    version: '1.0.0',
    data: {},
  });
}

function mockEmitSyncOffer(deadline = Date.now() + 60_000): void {
  mockMwp.dappClient?.emit('message', {
    type: QrSyncActionTypes.SYNC_OFFER,
    version: '1.0.0',
    data: { deadline },
  });
}

function mockSetReviewingSyncOffer(
  controller: QrSyncController,
  deadline = Date.now() + 60_000,
): void {
  mockEmitSyncOffer(deadline);
  if (controller.state.phase !== QR_SYNC_PHASES.REVIEWING_SYNC_OFFER) {
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
      expect(controller.state.phase).toBe(QR_SYNC_PHASES.DISPLAYING_QR);
      expect(controller.state.sessionId).toBe(TEST_SESSION_ID);
      expect(controller.state.qrPayload).toMatch(
        /^metamask:\/\/connect\/mwp\?p=[A-Za-z0-9+/]+=*$/u,
      );
      const decodedSessionRequest = JSON.parse(
        Buffer.from(
          controller.state.qrPayload?.split('p=')[1] ?? '',
          'base64',
        ).toString('utf8'),
      );
      expect(decodedSessionRequest.id).toBe(TEST_SESSION_ID);
      expect(controller.state.connectionStatus).toBe('connecting');
    });

    it('marks the session as failed when the relay connection fails', async () => {
      const { controller } = setupController();
      mockMwp.connect.mockRejectedValueOnce(new Error('Relay unavailable'));

      await expect(controller.createSession()).rejects.toThrow(
        'Relay unavailable',
      );

      expect(controller.state.phase).toBe(QR_SYNC_PHASES.FAILED);
      expect(controller.state.error).toStrictEqual({
        code: 'CHANNEL_INIT_FAILED',
        message: 'Relay unavailable',
      });
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
      expect(controller.state.phase).toBe(QR_SYNC_PHASES.AWAITING_SYNC_OFFER);
      expect(controller.state.otpAttempts).toBe(1);

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

        expect(controller.state.phase).toBe(QR_SYNC_PHASES.AWAITING_SYNC_OFFER);

        await jest.advanceTimersByTimeAsync(
          MWP_SESSION_REQUEST_EXPIRY_SECONDS * 1000,
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
        expect(controller.state.phase).toBe(QR_SYNC_PHASES.FAILED);
        expect(controller.state.connectionStatus).toBe('errored');
        expect(controller.state.error).toStrictEqual({
          code: 'SESSION_EXPIRED',
          message: QrSyncErrorMessages.SYNC_OFFER_TIMED_OUT,
        });
      } finally {
        jest.useRealTimers();
      }
    });

    it('records an OTP error without advancing the flow when validation fails', async () => {
      const { controller } = setupController();
      const submitOtp = jest
        .fn()
        .mockRejectedValue(new Error('Incorrect code'));

      await mockStartSession(controller);
      mockEmitOtpRequired(submitOtp);

      await expect(controller.submitOtp('000000')).rejects.toThrow(
        'Incorrect code',
      );

      expect(controller.state.phase).toBe(QR_SYNC_PHASES.AWAITING_OTP_INPUT);
      expect(controller.state.error).toStrictEqual({
        code: 'OTP_INVALID',
        message: 'Incorrect code',
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
      expect(controller.state.phase).toBe(QR_SYNC_PHASES.CANCELLED);
      expect(controller.state.lastActionType).toBe(QrSyncActionTypes.SYNC_CANCEL);
      expect(controller.state.sessionId).toBe(TEST_SESSION_ID);
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
      expect(controller.state.phase).toBe(QR_SYNC_PHASES.CANCELLED);
      expect(controller.state.error).toStrictEqual({
        code: 'SYNC_FAILED',
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

      const deadline = Date.now() + 120_000;
      mockEmitSyncOffer(deadline);

      expect(controller.state.phase).toBe(QR_SYNC_PHASES.REVIEWING_SYNC_OFFER);
      expect(controller.state.syncOffer).toStrictEqual({ deadline });
    });

    it('ignores sync offers with an invalid payload', async () => {
      const { controller } = setupController();

      await mockStartSession(controller);
      mockEmitOtpRequired();
      await controller.submitOtp('123456');

      mockEmitInvalidSyncOffer();

      expect(controller.state.phase).toBe(QR_SYNC_PHASES.AWAITING_SYNC_OFFER);
      expect(controller.state.syncOffer).toBeNull();

      mockEmitSyncOffer();
    });
  });

  describe('syncAccounts', () => {
    it('exports selected mnemonics and sends sync-ready to mobile', async () => {
      const { controller, exportSeedPhrase } = setupController();

      await mockStartSession(controller);
      mockSetReviewingSyncOffer(controller);

      await controller.syncAccounts(TEST_PASSWORD, [TEST_ENTROPY_ID]);

      expect(exportSeedPhrase).toHaveBeenCalledWith(
        { password: TEST_PASSWORD },
        TEST_ENTROPY_ID,
      );
      expect(mockMwp.dappClient?.sendRequest).toHaveBeenCalledWith(
        expect.objectContaining({
          type: QrSyncActionTypes.SYNC_READY,
          version: '1.0.0',
          data: expect.objectContaining({
            version: '1.0.0',
            data: [
              expect.objectContaining({
                type: 'Mnemonic',
                groups: [],
                isPrimary: true,
              }),
            ],
          }),
        }),
      );
      expect(controller.state.phase).toBe(
        QR_SYNC_PHASES.AWAITING_SYNC_COMPLETION,
      );
      expect(controller.state.selectedAccountGroupIds).toStrictEqual([
        TEST_ENTROPY_ID,
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
      mockSetReviewingSyncOffer(controller);

      await controller.syncAccounts(TEST_PASSWORD, [
        TEST_ENTROPY_ID,
        TEST_SECONDARY_ENTROPY_ID,
      ]);

      const syncReadyPayload = mockMwp.dappClient?.sendRequest.mock.calls.find(
        ([message]) => message.type === QrSyncActionTypes.SYNC_READY,
      )?.[0];

      expect(syncReadyPayload?.data?.data).toEqual(
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
        syncReadyPayload?.data?.data?.find(
          (entry: { isPrimary?: boolean }) => entry.isPrimary === true,
        ),
      ).toBeDefined();
      expect(
        syncReadyPayload?.data?.data?.filter(
          (entry: { isPrimary?: boolean }) => entry.isPrimary === true,
        ),
      ).toHaveLength(1);

      mockEmitSyncCompleted();
    });

    it('fails the session when sync completion times out', async () => {
      const { controller } = setupController();

      await mockStartSession(controller);
      mockSetReviewingSyncOffer(controller);

      jest.useFakeTimers();
      try {
        await controller.syncAccounts(TEST_PASSWORD, [TEST_ENTROPY_ID]);

        expect(controller.state.phase).toBe(
          QR_SYNC_PHASES.AWAITING_SYNC_COMPLETION,
        );

        await jest.advanceTimersByTimeAsync(
          MWP_SESSION_REQUEST_EXPIRY_SECONDS * 1000,
        );

        expect(controller.state.phase).toBe(QR_SYNC_PHASES.FAILED);
        expect(controller.state.connectionStatus).toBe('errored');
        expect(controller.state.error).toStrictEqual({
          code: 'SESSION_EXPIRED',
          message: QrSyncErrorMessages.SYNC_COMPLETION_TIMED_OUT,
        });
      } finally {
        jest.useRealTimers();
      }
    });
  });

  describe('sync completion', () => {
    it('finishes the flow when mobile reports sync-completed', async () => {
      const { controller } = setupController();

      await mockStartSession(controller);
      mockSetReviewingSyncOffer(controller);
      await controller.syncAccounts(TEST_PASSWORD, [TEST_ENTROPY_ID]);
      mockEmitSyncCompleted();

      expect(controller.state.phase).toBe(QR_SYNC_PHASES.COMPLETED);
      expect(controller.state.importedAccountIds).toStrictEqual([]);
    });
  });

  describe('cancelSync and resetState', () => {
    it('cancels an in-progress session and optionally records a reason', async () => {
      const { controller } = setupController();

      await mockStartSession(controller);
      await controller.cancelSync('User closed the flow');

      expect(mockMwp.dappClient?.sendRequest).toHaveBeenCalledWith({
        type: QrSyncActionTypes.SYNC_CANCEL,
        version: '1.0.0',
      });
      expect(controller.state.phase).toBe(QR_SYNC_PHASES.CANCELLED);
      expect(controller.state.error).toStrictEqual({
        code: 'SYNC_REJECTED',
        message: 'User closed the flow',
      });
    });

    it('returns to the default idle state', async () => {
      const { controller } = setupController();

      await mockStartSession(controller);
      mockSetReviewingSyncOffer(controller);
      controller.resetState();

      expect(controller.state).toStrictEqual(getDefaultQrSyncControllerState());
    });
  });

  describe('channel errors', () => {
    it('fails the session when the relay disconnects', async () => {
      const { controller } = setupController();

      await mockStartSession(controller);
      mockMwp.dappClient?.emit('disconnected');

      expect(controller.state.phase).toBe(QR_SYNC_PHASES.FAILED);
      expect(controller.state.connectionStatus).toBe('errored');
      expect(controller.state.error).toStrictEqual({
        code: 'CHANNEL_DISCONNECTED',
        message: 'The sync channel disconnected.',
      });
    });
  });

  describe('peer sync messages', () => {
    it('cancels the session when mobile sends sync-cancel', async () => {
      const { controller } = setupController();

      await mockStartSession(controller);
      mockEmitSyncCancel();

      expect(controller.state.phase).toBe(QR_SYNC_PHASES.CANCELLED);
      expect(controller.state.connectionStatus).toBe('disconnected');
      expect(controller.state.lastActionType).toBe(QrSyncActionTypes.SYNC_CANCEL);
      expect(controller.state.error).toStrictEqual({
        code: 'SYNC_REJECTED',
        message: QrSyncErrorMessages.SYNC_SESSION_CANCELLED_BY_PEER,
      });
    });

    it('fails the session when mobile sends sync-error', async () => {
      const { controller } = setupController();

      await mockStartSession(controller);
      mockEmitSyncError({
        message: 'Mobile could not complete the sync',
      });

      expect(controller.state.phase).toBe(QR_SYNC_PHASES.FAILED);
      expect(controller.state.connectionStatus).toBe('errored');
      expect(controller.state.error).toStrictEqual({
        code: 'SYNC_FAILED',
        message: 'Mobile could not complete the sync',
      });
    });

    it('ignores duplicate peer cancel messages after the session has ended', async () => {
      const { controller } = setupController();

      await mockStartSession(controller);
      mockEmitSyncCancel();
      mockEmitSyncCancel();

      expect(controller.state.error?.message).toBe(
        QrSyncErrorMessages.SYNC_SESSION_CANCELLED_BY_PEER,
      );
    });
  });
});
