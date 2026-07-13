/**
 * @jest-environment node
 */
import type { SessionRequest } from '@metamask/mobile-wallet-protocol-core';
import type { OtpRequiredPayload } from '@metamask/mobile-wallet-protocol-dapp-client';
import { QR_SYNC_TIMEOUT_MS } from '../../../../../shared/constants/qr-sync';
import { E2eMwpMockClient } from './e2e-mwp-mock-client';

const TEST_SESSION_ID = 'test-session-id';
const FIXED_NOW = new Date('2026-07-13T10:00:00.000Z').getTime();

const TEST_SESSION_REQUEST: SessionRequest = {
  id: 'custom-session-id',
  expiresAt: FIXED_NOW + QR_SYNC_TIMEOUT_MS.MWP_SESSION_TIMEOUT,
  mode: 'trusted',
  channel: 'websocket',
  publicKeyB64: 'custom-public-key',
};

describe('E2eMwpMockClient', () => {
  let client: E2eMwpMockClient;

  beforeEach(() => {
    jest.spyOn(console, 'log').mockImplementation(() => undefined);
    jest.spyOn(crypto, 'randomUUID').mockReturnValue(TEST_SESSION_ID as `${string}-${string}-${string}-${string}-${string}`);
    jest.useFakeTimers();
    jest.setSystemTime(FIXED_NOW);

    client = new E2eMwpMockClient();
  });

  afterEach(() => {
    jest.restoreAllMocks();
    jest.useRealTimers();
  });

  describe('connect', () => {
    it('creates an untrusted session request and emits session_request', async () => {
      const handler = jest.fn();
      client.on('session_request', handler);

      await client.connect();

      const expectedRequest: SessionRequest = {
        id: TEST_SESSION_ID,
        expiresAt: FIXED_NOW + QR_SYNC_TIMEOUT_MS.MWP_SESSION_TIMEOUT,
        mode: 'untrusted',
        channel: 'websocket',
        publicKeyB64: 'e2e-mock-public-key',
      };

      expect(client.sessionRequest).toStrictEqual(expectedRequest);
      expect(handler).toHaveBeenCalledWith(expectedRequest);
    });

    it('uses the provided connection mode', async () => {
      await client.connect({ mode: 'trusted' });

      expect(client.sessionRequest).toMatchObject({ mode: 'trusted' });
    });
  });

  describe('sendRequest', () => {
    it('stores the last sent payload', async () => {
      const payload = { type: 'init-sync-session', version: '1.0.0' };

      await client.sendRequest(payload);

      expect(client.lastSentRequest).toStrictEqual(payload);
    });
  });

  describe('emitSessionRequest', () => {
    it('updates sessionRequest and emits session_request', () => {
      const handler = jest.fn();
      client.on('session_request', handler);

      client.emitSessionRequest(TEST_SESSION_REQUEST);

      expect(client.sessionRequest).toStrictEqual(TEST_SESSION_REQUEST);
      expect(handler).toHaveBeenCalledWith(TEST_SESSION_REQUEST);
    });
  });

  describe('event emitters', () => {
    it('emits otp_required', () => {
      const handler = jest.fn();
      const payload = {
        submit: jest.fn(),
        cancel: jest.fn(),
        deadline: FIXED_NOW + 1_000,
      } satisfies OtpRequiredPayload;
      client.on('otp_required', handler);

      client.emitOtpRequired(payload);

      expect(handler).toHaveBeenCalledWith(payload);
    });

    it('emits connected', () => {
      const handler = jest.fn();
      client.on('connected', handler);

      client.emitConnected();

      expect(handler).toHaveBeenCalledTimes(1);
    });

    it('emits message', () => {
      const handler = jest.fn();
      const message = { type: 'sync-offer', version: '1.0.0' };
      client.on('message', handler);

      client.emitMessage(message);

      expect(handler).toHaveBeenCalledWith(message);
    });

    it('emits disconnected', () => {
      const handler = jest.fn();
      client.on('disconnected', handler);

      client.emitDisconnected();

      expect(handler).toHaveBeenCalledTimes(1);
    });

    it('emits error', () => {
      const handler = jest.fn();
      const error = new Error('simulated transport error');
      client.on('error', handler);

      client.emitError(error);

      expect(handler).toHaveBeenCalledWith(error);
    });
  });

  describe('reset', () => {
    it('clears sessionRequest and lastSentRequest', async () => {
      await client.connect();
      await client.sendRequest({ type: 'sync-ready' });

      client.reset();

      expect(client.sessionRequest).toBeNull();
      expect(client.lastSentRequest).toBeNull();
    });
  });
});
