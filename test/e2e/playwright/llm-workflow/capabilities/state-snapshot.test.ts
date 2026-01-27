import type { Page } from '@playwright/test';
import { MetaMaskStateSnapshotCapability } from './state-snapshot';

const mockGetExtensionState = jest.fn();
const mockDetectCurrentScreen = jest.fn();

jest.mock('../launcher/state-inspector', () => ({
  getExtensionState: (...args: unknown[]) => mockGetExtensionState(...args),
  detectCurrentScreen: (...args: unknown[]) => mockDetectCurrentScreen(...args),
}));

describe('MetaMaskStateSnapshotCapability', () => {
  let mockPage: jest.Mocked<Page>;

  beforeEach(() => {
    jest.clearAllMocks();
    mockPage = {} as jest.Mocked<Page>;
  });

  describe('constructor', () => {
    it('uses default chain ID when not provided', () => {
      const capability = new MetaMaskStateSnapshotCapability();

      expect(capability).toBeInstanceOf(MetaMaskStateSnapshotCapability);
    });

    it('uses custom chain ID when provided', async () => {
      mockGetExtensionState.mockResolvedValue({
        isLoaded: true,
        currentScreen: 'home',
      });

      const capability = new MetaMaskStateSnapshotCapability({
        defaultChainId: 1,
      });

      await capability.getState(mockPage, {});

      expect(mockGetExtensionState).toHaveBeenCalledWith(
        mockPage,
        expect.objectContaining({ chainId: 1 }),
      );
    });
  });

  describe('getState', () => {
    it('returns extension state', async () => {
      const mockState = {
        isLoaded: true,
        currentUrl: 'chrome-extension://test/home.html',
        extensionId: 'test',
        isUnlocked: true,
        currentScreen: 'home',
        accountAddress: '0x123',
        networkName: 'Localhost 8545',
        chainId: 1337,
        balance: '25 ETH',
      };
      mockGetExtensionState.mockResolvedValue(mockState);

      const capability = new MetaMaskStateSnapshotCapability();
      const result = await capability.getState(mockPage, { chainId: 1337 });

      expect(result).toEqual(mockState);
    });

    it('passes extension ID to state inspector', async () => {
      mockGetExtensionState.mockResolvedValue({});

      const capability = new MetaMaskStateSnapshotCapability();
      await capability.getState(mockPage, {
        extensionId: 'abc123',
        chainId: 1337,
      });

      expect(mockGetExtensionState).toHaveBeenCalledWith(
        mockPage,
        expect.objectContaining({ extensionId: 'abc123' }),
      );
    });

    it('uses provided chain ID over default', async () => {
      mockGetExtensionState.mockResolvedValue({});

      const capability = new MetaMaskStateSnapshotCapability({
        defaultChainId: 1,
      });
      await capability.getState(mockPage, { chainId: 5 });

      expect(mockGetExtensionState).toHaveBeenCalledWith(
        mockPage,
        expect.objectContaining({ chainId: 5 }),
      );
    });

    it('uses default chain ID when not provided in options', async () => {
      mockGetExtensionState.mockResolvedValue({});

      const capability = new MetaMaskStateSnapshotCapability({
        defaultChainId: 42,
      });
      await capability.getState(mockPage, {});

      expect(mockGetExtensionState).toHaveBeenCalledWith(
        mockPage,
        expect.objectContaining({ chainId: 42 }),
      );
    });
  });

  describe('detectCurrentScreen', () => {
    it('returns detected screen name', async () => {
      mockDetectCurrentScreen.mockResolvedValue('unlock');

      const capability = new MetaMaskStateSnapshotCapability();
      const result = await capability.detectCurrentScreen(mockPage);

      expect(result).toBe('unlock');
    });

    it('passes page to detector', async () => {
      mockDetectCurrentScreen.mockResolvedValue('home');

      const capability = new MetaMaskStateSnapshotCapability();
      await capability.detectCurrentScreen(mockPage);

      expect(mockDetectCurrentScreen).toHaveBeenCalledWith(mockPage);
    });
  });
});
