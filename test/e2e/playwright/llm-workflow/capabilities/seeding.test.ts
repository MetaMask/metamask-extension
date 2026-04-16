import {
  MetaMaskContractSeedingCapability,
  AVAILABLE_CONTRACTS,
} from './seeding';
import type { MetaMaskChainCapability } from './chain';

const mockDeployContract = jest.fn();
const mockDeployContracts = jest.fn();
const mockGetContractAddress = jest.fn();
const mockGetDeployedContracts = jest.fn();
const mockClearRegistry = jest.fn();

jest.mock('../anvil-seeder-wrapper', () => ({
  AnvilSeederWrapper: jest.fn().mockImplementation(() => ({
    deployContract: mockDeployContract,
    deployContracts: mockDeployContracts,
    getContractAddress: mockGetContractAddress,
    getDeployedContracts: mockGetDeployedContracts,
    clearRegistry: mockClearRegistry,
  })),
}));

describe('MetaMaskContractSeedingCapability', () => {
  let mockChainCapability: jest.Mocked<MetaMaskChainCapability>;

  beforeEach(() => {
    jest.clearAllMocks();
    mockChainCapability = {
      start: jest.fn(),
      stop: jest.fn(),
      isRunning: jest.fn().mockReturnValue(true),
      getAnvil: jest.fn().mockReturnValue({
        getProvider: jest.fn().mockReturnValue({}),
      }),
    } as unknown as jest.Mocked<MetaMaskChainCapability>;
  });

  describe('constructor', () => {
    it('creates instance with chain capability', () => {
      const capability = new MetaMaskContractSeedingCapability({
        chainCapability: mockChainCapability,
      });

      expect(capability).toBeInstanceOf(MetaMaskContractSeedingCapability);
    });
  });

  describe('initialize', () => {
    it('throws error when chain capability not started', () => {
      mockChainCapability.getAnvil.mockReturnValue(undefined);
      const capability = new MetaMaskContractSeedingCapability({
        chainCapability: mockChainCapability,
      });

      expect(() => capability.initialize()).toThrow(
        'Chain capability not initialized. Call chain.start() first.',
      );
    });

    it('initializes seeder when chain is running', () => {
      const capability = new MetaMaskContractSeedingCapability({
        chainCapability: mockChainCapability,
      });

      expect(() => capability.initialize()).not.toThrow();
    });
  });

  describe('deployContract', () => {
    it('throws error when not initialized', async () => {
      const capability = new MetaMaskContractSeedingCapability({
        chainCapability: mockChainCapability,
      });

      await expect(capability.deployContract('hst')).rejects.toThrow(
        'Seeder not initialized',
      );
    });

    it('deploys contract successfully', async () => {
      mockDeployContract.mockResolvedValue({
        name: 'hst',
        address: '0x1234567890abcdef',
        deployedAt: '2026-01-25T00:00:00.000Z',
      });

      const capability = new MetaMaskContractSeedingCapability({
        chainCapability: mockChainCapability,
      });
      capability.initialize();

      const result = await capability.deployContract('hst');

      expect(result.name).toBe('hst');
      expect(result.address).toBe('0x1234567890abcdef');
      expect(result.deployedAt).toBe('2026-01-25T00:00:00.000Z');
    });

    it('throws error for unknown contract', async () => {
      const capability = new MetaMaskContractSeedingCapability({
        chainCapability: mockChainCapability,
      });
      capability.initialize();

      await expect(capability.deployContract('unknown')).rejects.toThrow(
        'Unknown contract: unknown',
      );
    });

    it('passes hardfork option to seeder', async () => {
      mockDeployContract.mockResolvedValue({
        name: 'hst',
        address: '0x123',
        deployedAt: '...',
      });

      const capability = new MetaMaskContractSeedingCapability({
        chainCapability: mockChainCapability,
      });
      capability.initialize();

      await capability.deployContract('hst', { hardfork: 'london' });

      expect(mockDeployContract).toHaveBeenCalledWith(
        'hst',
        expect.objectContaining({ hardfork: 'london' }),
      );
    });
  });

  describe('deployContracts', () => {
    it('deploys multiple contracts', async () => {
      mockDeployContracts.mockResolvedValue({
        deployed: [
          { name: 'hst', address: '0x1', deployedAt: '...' },
          { name: 'nfts', address: '0x2', deployedAt: '...' },
        ],
        failed: [],
      });

      const capability = new MetaMaskContractSeedingCapability({
        chainCapability: mockChainCapability,
      });
      capability.initialize();

      const result = await capability.deployContracts(['hst', 'nfts']);

      expect(result.deployed).toHaveLength(2);
      expect(result.failed).toHaveLength(0);
    });

    it('reports partial failures', async () => {
      mockDeployContracts.mockResolvedValue({
        deployed: [{ name: 'hst', address: '0x1', deployedAt: '...' }],
        failed: [{ name: 'failing', error: 'Deployment reverted' }],
      });

      const capability = new MetaMaskContractSeedingCapability({
        chainCapability: mockChainCapability,
      });
      capability.initialize();

      const result = await capability.deployContracts(['hst', 'failing']);

      expect(result.deployed).toHaveLength(1);
      expect(result.failed).toHaveLength(1);
      expect(result.failed[0].error).toBe('Deployment reverted');
    });
  });

  describe('getContractAddress', () => {
    it('returns address for deployed contract', () => {
      mockGetContractAddress.mockReturnValue('0xabc123');

      const capability = new MetaMaskContractSeedingCapability({
        chainCapability: mockChainCapability,
      });
      capability.initialize();

      const address = capability.getContractAddress('hst');

      expect(address).toBe('0xabc123');
    });

    it('returns null for non-deployed contract', () => {
      mockGetContractAddress.mockReturnValue(null);

      const capability = new MetaMaskContractSeedingCapability({
        chainCapability: mockChainCapability,
      });
      capability.initialize();

      const address = capability.getContractAddress('nfts');

      expect(address).toBeNull();
    });
  });

  describe('listDeployedContracts', () => {
    it('returns empty list when no contracts deployed', () => {
      mockGetDeployedContracts.mockReturnValue([]);

      const capability = new MetaMaskContractSeedingCapability({
        chainCapability: mockChainCapability,
      });
      capability.initialize();

      const contracts = capability.listDeployedContracts();

      expect(contracts).toHaveLength(0);
    });

    it('returns all deployed contracts', () => {
      mockGetDeployedContracts.mockReturnValue([
        { name: 'hst', address: '0x1', deployedAt: '...' },
        { name: 'nfts', address: '0x2', deployedAt: '...' },
      ]);

      const capability = new MetaMaskContractSeedingCapability({
        chainCapability: mockChainCapability,
      });
      capability.initialize();

      const contracts = capability.listDeployedContracts();

      expect(contracts).toHaveLength(2);
    });
  });

  describe('getAvailableContracts', () => {
    it('returns list of available contract names', () => {
      const capability = new MetaMaskContractSeedingCapability({
        chainCapability: mockChainCapability,
      });

      const contracts = capability.getAvailableContracts();

      expect(contracts).toEqual(AVAILABLE_CONTRACTS);
      expect(contracts).toContain('hst');
      expect(contracts).toContain('nfts');
    });
  });

  describe('clearRegistry', () => {
    it('clears the deployed contracts registry', () => {
      const capability = new MetaMaskContractSeedingCapability({
        chainCapability: mockChainCapability,
      });
      capability.initialize();

      capability.clearRegistry();

      expect(mockClearRegistry).toHaveBeenCalled();
    });

    it('does nothing when not initialized', () => {
      const capability = new MetaMaskContractSeedingCapability({
        chainCapability: mockChainCapability,
      });

      expect(() => capability.clearRegistry()).not.toThrow();
    });
  });
});
