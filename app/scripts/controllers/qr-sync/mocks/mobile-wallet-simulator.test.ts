/**
 * @jest-environment node
 */
import type { OtpRequiredPayload } from '@metamask/mobile-wallet-protocol-dapp-client';
import { QR_SYNC_TIMEOUT_MS } from '../../../../../shared/constants/qr-sync';
import { QrSyncActionTypes, QrSyncMessageVersion } from '../constants';
import { E2eMwpMockClient } from './e2e-mwp-mock-client';
import {
  MobileWalletSimulator,
  QR_SYNC_E2E_OTP,
} from './mobile-wallet-simulator';

const FIXED_NOW = new Date('2026-07-13T10:00:00.000Z').getTime();
const TEST_SESSION_ID = 'test-session-id';

describe('MobileWalletSimulator', () => {
  let client: E2eMwpMockClient;
  let simulator: MobileWalletSimulator;

  beforeEach(() => {
    jest.spyOn(console, 'log').mockImplementation(() => undefined);
    jest
      .spyOn(crypto, 'randomUUID')
      .mockReturnValue(
        TEST_SESSION_ID as `${string}-${string}-${string}-${string}-${string}`,
      );
    jest.useFakeTimers();
    jest.setSystemTime(FIXED_NOW);

    client = new E2eMwpMockClient();
    simulator = new MobileWalletSimulator(client);
  });

  afterEach(() => {
    jest.restoreAllMocks();
    jest.useRealTimers();
  });

  describe('bind', () => {
    it('completes without side effects', () => {
      expect(() => simulator.bind()).not.toThrow();
    });
  });

  describe('getState', () => {
    it('returns the initial simulator state', () => {
      expect(simulator.getState()).toStrictEqual({
        sessionId: null,
        otp: QR_SYNC_E2E_OTP,
        otpDeadline: null,
        isConnected: false,
        lastSyncReadyPayload: null,
      });
    });

    it('reflects client session and payload state', async () => {
      await client.connect();
      await client.sendRequest({ type: 'sync-ready' });

      expect(simulator.getState()).toMatchObject({
        sessionId: TEST_SESSION_ID,
        lastSyncReadyPayload: { type: 'sync-ready' },
      });
    });
  });

  describe('runAction mobileScanned', () => {
    it('emits otp_required with the default OTP and deadline', () => {
      const handler = jest.fn();
      client.on('otp_required', handler);

      simulator.runAction('mobileScanned');

      const expectedDeadline =
        FIXED_NOW + QR_SYNC_TIMEOUT_MS.MWP_SESSION_TIMEOUT;
      expect(simulator.getState()).toMatchObject({
        otp: QR_SYNC_E2E_OTP,
        otpDeadline: expectedDeadline,
      });
      expect(handler).toHaveBeenCalledWith(
        expect.objectContaining({
          deadline: expectedDeadline,
        }),
      );
    });

    it('uses a custom OTP when provided', () => {
      simulator.runAction('mobileScanned', { otp: '654321' });

      expect(simulator.getState().otp).toBe('654321');
    });

    it('validates OTP via the emitted submit handler', async () => {
      let otpPayload: OtpRequiredPayload | undefined;
      client.on('otp_required', (payload: OtpRequiredPayload) => {
        otpPayload = payload;
      });

      simulator.runAction('mobileScanned', { otp: '654321' });

      await expect(otpPayload?.submit('654321')).resolves.toBeUndefined();
      await expect(otpPayload?.submit('000000')).rejects.toThrow('Invalid OTP');
    });

    it('marks the simulator disconnected when OTP entry is cancelled', () => {
      let otpPayload: OtpRequiredPayload | undefined;
      client.on('otp_required', (payload: OtpRequiredPayload) => {
        otpPayload = payload;
      });

      simulator.runAction('deliverSyncOffer');
      expect(simulator.getState().isConnected).toBe(true);

      simulator.runAction('mobileScanned');
      otpPayload?.cancel();

      expect(simulator.getState().isConnected).toBe(false);
    });
  });

  describe('runAction deliverSyncOffer', () => {
    it('emits connected once and delivers a sync-offer message', async () => {
      const connectedHandler = jest.fn();
      const messageHandler = jest.fn();
      client.on('connected', connectedHandler);
      client.on('message', messageHandler);
      await client.connect();

      simulator.runAction('deliverSyncOffer');
      simulator.runAction('deliverSyncOffer');

      expect(connectedHandler).toHaveBeenCalledTimes(1);
      expect(messageHandler).toHaveBeenNthCalledWith(1, {
        type: QrSyncActionTypes.SYNC_OFFER,
        version: QrSyncMessageVersion.V1,
        data: {
          sessionId: TEST_SESSION_ID,
          isOnboardingCompleted: true,
        },
      });
      expect(messageHandler).toHaveBeenNthCalledWith(2, {
        type: QrSyncActionTypes.SYNC_OFFER,
        version: QrSyncMessageVersion.V1,
        data: {
          sessionId: TEST_SESSION_ID,
          isOnboardingCompleted: true,
        },
      });
      expect(simulator.getState().isConnected).toBe(true);
    });

    it('uses provided session and onboarding values', () => {
      const messageHandler = jest.fn();
      client.on('message', messageHandler);

      simulator.runAction('deliverSyncOffer', {
        sessionId: 'custom-session',
        isOnboardingCompleted: false,
      });

      expect(messageHandler).toHaveBeenCalledWith({
        type: QrSyncActionTypes.SYNC_OFFER,
        version: QrSyncMessageVersion.V1,
        data: {
          sessionId: 'custom-session',
          isOnboardingCompleted: false,
        },
      });
    });
  });

  describe('runAction deliverSyncCompleted', () => {
    it('emits a sync-completed message', () => {
      const messageHandler = jest.fn();
      client.on('message', messageHandler);

      simulator.runAction('deliverSyncCompleted');

      expect(messageHandler).toHaveBeenCalledWith({
        type: QrSyncActionTypes.SYNC_COMPLETED,
        version: QrSyncMessageVersion.V1,
      });
    });
  });

  describe('runAction deliverSyncCancel', () => {
    it('emits a sync-cancel message', () => {
      const messageHandler = jest.fn();
      client.on('message', messageHandler);

      simulator.runAction('deliverSyncCancel');

      expect(messageHandler).toHaveBeenCalledWith({
        type: QrSyncActionTypes.SYNC_CANCEL,
        version: QrSyncMessageVersion.V1,
      });
    });
  });

  describe('runAction deliverSyncError', () => {
    it('emits a sync-error message with the default error text', () => {
      const messageHandler = jest.fn();
      client.on('message', messageHandler);

      simulator.runAction('deliverSyncError');

      expect(messageHandler).toHaveBeenCalledWith({
        type: QrSyncActionTypes.SYNC_ERROR,
        version: QrSyncMessageVersion.V1,
        data: {
          message: 'Simulated sync error',
        },
      });
    });

    it('emits a sync-error message with a custom error text', () => {
      const messageHandler = jest.fn();
      client.on('message', messageHandler);

      simulator.runAction('deliverSyncError', {
        errorMessage: 'Custom sync failure',
      });

      expect(messageHandler).toHaveBeenCalledWith({
        type: QrSyncActionTypes.SYNC_ERROR,
        version: QrSyncMessageVersion.V1,
        data: {
          message: 'Custom sync failure',
        },
      });
    });
  });

  describe('runAction reset', () => {
    it('restores the initial simulator and client state', async () => {
      simulator.runAction('mobileScanned', { otp: '654321' });
      simulator.runAction('deliverSyncOffer');
      await client.sendRequest({ type: 'sync-ready' });

      simulator.runAction('reset');

      expect(simulator.getState()).toStrictEqual({
        sessionId: null,
        otp: QR_SYNC_E2E_OTP,
        otpDeadline: null,
        isConnected: false,
        lastSyncReadyPayload: null,
      });
    });
  });
});
