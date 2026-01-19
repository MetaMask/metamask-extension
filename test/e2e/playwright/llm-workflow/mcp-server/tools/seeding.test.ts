import * as discovery from '../discovery';
import { knowledgeStore } from '../knowledge-store';
import { sessionManager } from '../session-manager';
import { ErrorCodes } from '../types';
import {
  handleSeedContract,
  handleSeedContracts,
  handleGetContractAddress,
  handleListDeployedContracts,
} from './seeding';

jest.mock('../session-manager');
jest.mock('../knowledge-store');
jest.mock('../discovery');

const mockSessionManager = sessionManager as jest.Mocked<typeof sessionManager>;
const mockKnowledgeStore = knowledgeStore as jest.Mocked<typeof knowledgeStore>;
const mockDiscovery = discovery as jest.Mocked<typeof discovery>;

describe('Seeding Tools', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockKnowledgeStore.recordStep.mockResolvedValue(
      '/test-artifacts/step.json',
    );
    mockDiscovery.collectTestIds.mockResolvedValue([]);
    mockDiscovery.collectTrimmedA11ySnapshot.mockResolvedValue({
      nodes: [],
      refMap: new Map(),
    });
  });

  describe('handleSeedContract', () => {
    it('returns error when no active session', async () => {
      mockSessionManager.hasActiveSession.mockReturnValue(false);

      const result = await handleSeedContract({ contractName: 'hst' });

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.code).toBe(ErrorCodes.MM_NO_ACTIVE_SESSION);
      }
    });

    it('deploys HST contract successfully', async () => {
      mockSessionManager.hasActiveSession.mockReturnValue(true);
      mockSessionManager.getSessionId.mockReturnValue('test-session');
      mockSessionManager.getSeeder.mockReturnValue({
        deployContract: jest.fn().mockResolvedValue({
          name: 'hst',
          address: '0x1234567890abcdef',
          deployedAt: '2026-01-19T00:00:00.000Z',
        }),
      } as never);
      mockSessionManager.getPage.mockReturnValue({} as never);
      mockSessionManager.getExtensionState.mockResolvedValue({
        isLoaded: true,
        currentUrl: 'chrome-extension://test/home.html',
        extensionId: 'test',
        isUnlocked: true,
        currentScreen: 'home',
        accountAddress: '0x123',
        networkName: 'Localhost 8545',
        chainId: 1337,
        balance: '25 ETH',
      });
      mockSessionManager.setRefMap.mockImplementation(jest.fn());

      const result = await handleSeedContract({ contractName: 'hst' });

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.result.contractAddress).toBe('0x1234567890abcdef');
        expect(result.result.contractName).toBe('hst');
      }
    });

    it('uses custom hardfork when specified', async () => {
      const mockDeployContract = jest.fn().mockResolvedValue({
        name: 'hst',
        address: '0x1234',
        deployedAt: '2026-01-19T00:00:00.000Z',
      });

      mockSessionManager.hasActiveSession.mockReturnValue(true);
      mockSessionManager.getSessionId.mockReturnValue('test-session');
      mockSessionManager.getSeeder.mockReturnValue({
        deployContract: mockDeployContract,
      } as never);
      mockSessionManager.getPage.mockReturnValue({} as never);
      mockSessionManager.getExtensionState.mockResolvedValue({} as never);
      mockSessionManager.setRefMap.mockImplementation(jest.fn());

      await handleSeedContract({ contractName: 'hst', hardfork: 'london' });

      expect(mockDeployContract).toHaveBeenCalledWith('hst', {
        hardfork: 'london',
        deployerOptions: undefined,
      });
    });

    it('records step in knowledge store', async () => {
      mockSessionManager.hasActiveSession.mockReturnValue(true);
      mockSessionManager.getSessionId.mockReturnValue('test-session');
      mockSessionManager.getSeeder.mockReturnValue({
        deployContract: jest.fn().mockResolvedValue({
          name: 'hst',
          address: '0x1234',
          deployedAt: '2026-01-19T00:00:00.000Z',
        }),
      } as never);
      mockSessionManager.getPage.mockReturnValue({} as never);
      mockSessionManager.getExtensionState.mockResolvedValue({} as never);
      mockSessionManager.setRefMap.mockImplementation(jest.fn());

      await handleSeedContract({ contractName: 'hst' });

      expect(mockKnowledgeStore.recordStep).toHaveBeenCalledWith(
        expect.objectContaining({
          toolName: 'mm_seed_contract',
          input: expect.objectContaining({
            contractName: 'hst',
          }),
        }),
      );
    });

    it('returns error on deployment failure', async () => {
      mockSessionManager.hasActiveSession.mockReturnValue(true);
      mockSessionManager.getSessionId.mockReturnValue('test-session');
      mockSessionManager.getSeeder.mockReturnValue({
        deployContract: jest.fn().mockRejectedValue(new Error('Deploy failed')),
      } as never);

      const result = await handleSeedContract({ contractName: 'failing' });

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.code).toBe(ErrorCodes.MM_SEED_FAILED);
        expect(result.error.message).toContain('Deploy failed');
      }
    });
  });

  describe('handleSeedContracts', () => {
    it('deploys multiple contracts', async () => {
      mockSessionManager.hasActiveSession.mockReturnValue(true);
      mockSessionManager.getSessionId.mockReturnValue('test-session');
      mockSessionManager.getSeeder.mockReturnValue({
        deployContracts: jest.fn().mockResolvedValue({
          deployed: [
            { name: 'hst', address: '0x1', deployedAt: '...' },
            { name: 'nfts', address: '0x2', deployedAt: '...' },
          ],
          failed: [],
        }),
      } as never);
      mockSessionManager.getPage.mockReturnValue({} as never);
      mockSessionManager.getExtensionState.mockResolvedValue({} as never);
      mockSessionManager.setRefMap.mockImplementation(jest.fn());

      const result = await handleSeedContracts({ contracts: ['hst', 'nfts'] });

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.result.deployed).toHaveLength(2);
        expect(result.result.failed).toHaveLength(0);
      }
    });

    it('reports partial failures', async () => {
      mockSessionManager.hasActiveSession.mockReturnValue(true);
      mockSessionManager.getSessionId.mockReturnValue('test-session');
      mockSessionManager.getSeeder.mockReturnValue({
        deployContracts: jest.fn().mockResolvedValue({
          deployed: [{ name: 'hst', address: '0x1', deployedAt: '...' }],
          failed: [{ name: 'failing', error: 'Deployment reverted' }],
        }),
      } as never);
      mockSessionManager.getPage.mockReturnValue({} as never);
      mockSessionManager.getExtensionState.mockResolvedValue({} as never);
      mockSessionManager.setRefMap.mockImplementation(jest.fn());

      const result = await handleSeedContracts({
        contracts: ['hst', 'failing'],
      });

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.result.deployed).toHaveLength(1);
        expect(result.result.failed).toHaveLength(1);
      }
    });

    it('returns error when no active session', async () => {
      mockSessionManager.hasActiveSession.mockReturnValue(false);

      const result = await handleSeedContracts({ contracts: ['hst'] });

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.code).toBe(ErrorCodes.MM_NO_ACTIVE_SESSION);
      }
    });
  });

  describe('handleGetContractAddress', () => {
    it('returns address for deployed contract', async () => {
      mockSessionManager.hasActiveSession.mockReturnValue(true);
      mockSessionManager.getSessionId.mockReturnValue('test-session');
      mockSessionManager.getSeeder.mockReturnValue({
        getContractAddress: jest.fn().mockReturnValue('0xabc123'),
      } as never);

      const result = await handleGetContractAddress({ contractName: 'hst' });

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.result.contractAddress).toBe('0xabc123');
      }
    });

    it('returns null for non-deployed contract', async () => {
      mockSessionManager.hasActiveSession.mockReturnValue(true);
      mockSessionManager.getSessionId.mockReturnValue('test-session');
      mockSessionManager.getSeeder.mockReturnValue({
        getContractAddress: jest.fn().mockReturnValue(null),
      } as never);

      const result = await handleGetContractAddress({ contractName: 'nfts' });

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.result.contractAddress).toBeNull();
      }
    });

    it('returns error when no active session', async () => {
      mockSessionManager.hasActiveSession.mockReturnValue(false);

      const result = await handleGetContractAddress({ contractName: 'hst' });

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.code).toBe(ErrorCodes.MM_NO_ACTIVE_SESSION);
      }
    });
  });

  describe('handleListDeployedContracts', () => {
    it('returns empty list when no contracts deployed', async () => {
      mockSessionManager.hasActiveSession.mockReturnValue(true);
      mockSessionManager.getSessionId.mockReturnValue('test-session');
      mockSessionManager.getSeeder.mockReturnValue({
        getDeployedContracts: jest.fn().mockReturnValue([]),
      } as never);

      const result = await handleListDeployedContracts({});

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.result.contracts).toHaveLength(0);
      }
    });

    it('returns all deployed contracts', async () => {
      mockSessionManager.hasActiveSession.mockReturnValue(true);
      mockSessionManager.getSessionId.mockReturnValue('test-session');
      mockSessionManager.getSeeder.mockReturnValue({
        getDeployedContracts: jest.fn().mockReturnValue([
          { name: 'hst', address: '0x1', deployedAt: '...' },
          { name: 'nfts', address: '0x2', deployedAt: '...' },
        ]),
      } as never);

      const result = await handleListDeployedContracts({});

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.result.contracts).toHaveLength(2);
      }
    });

    it('returns error when no active session', async () => {
      mockSessionManager.hasActiveSession.mockReturnValue(false);

      const result = await handleListDeployedContracts({});

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.code).toBe(ErrorCodes.MM_NO_ACTIVE_SESSION);
      }
    });
  });
});
