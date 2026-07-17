import { LedgerAction } from '../../../shared/constants/offscreen-communication';
import { LedgerDmkBridgeHandler } from './ledger-dmk';

const mockLegacyInit = jest.fn();
const mockLegacyDestroy = jest.fn();
const mockLegacyHandleAction = jest.fn();

jest.mock('./ledger', () => ({
  // eslint-disable-next-line @typescript-eslint/naming-convention
  __esModule: true,
  default: jest.fn(() => ({
    init: mockLegacyInit,
    destroy: mockLegacyDestroy,
    handleAction: mockLegacyHandleAction,
  })),
}));

// Coverage-only tests for the temporary DMK stub. These will be replaced when
// the real LedgerDmkBridgeHandler implementation lands.
describe('LedgerDmkBridgeHandler', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockLegacyInit.mockResolvedValue(undefined);
    mockLegacyDestroy.mockResolvedValue(undefined);
    mockLegacyHandleAction.mockResolvedValue({ ok: true });
  });

  describe('init', () => {
    // Satisfies coverage for the stub init path; update when DMK bridge is real.
    it('initialises the underlying legacy handler', async () => {
      const handler = new LedgerDmkBridgeHandler();

      await handler.init();

      expect(mockLegacyInit).toHaveBeenCalledTimes(1);
    });
  });

  describe('destroy', () => {
    // Satisfies coverage for the stub destroy path; update when DMK bridge is real.
    it('destroys the underlying legacy handler', async () => {
      const handler = new LedgerDmkBridgeHandler();
      await handler.init();

      await handler.destroy();

      expect(mockLegacyDestroy).toHaveBeenCalledTimes(1);
    });

    // Satisfies coverage for destroy before init; update when DMK bridge is real.
    it('resolves when called before init', async () => {
      const handler = new LedgerDmkBridgeHandler();

      await expect(handler.destroy()).resolves.toBeUndefined();

      expect(mockLegacyDestroy).not.toHaveBeenCalled();
    });
  });

  describe('handleAction', () => {
    // Satisfies coverage for the uninitialised guard; update when DMK bridge is real.
    it('throws when called before init', async () => {
      const handler = new LedgerDmkBridgeHandler();

      await expect(
        handler.handleAction(LedgerAction.getAppConfiguration),
      ).rejects.toThrow('Ledger DMK stub handler is not initialised');
    });

    // Satisfies coverage for the stub delegation path; update when DMK bridge is real.
    it('delegates to the underlying legacy handler', async () => {
      const handler = new LedgerDmkBridgeHandler();
      const params = { hdPath: "m/44'/60'/0'/0/0" };
      await handler.init();

      const result = await handler.handleAction(
        LedgerAction.getPublicKey,
        params,
      );

      expect(mockLegacyHandleAction).toHaveBeenCalledWith(
        LedgerAction.getPublicKey,
        params,
      );
      expect(result).toEqual({ ok: true });
    });
  });
});
