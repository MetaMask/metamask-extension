import { processInBatches, fetchAccountBalancesInBatches } from './batch-utils';

describe('batch-utils', () => {
  describe('processInBatches', () => {
    const mockLogger = {
      warn: jest.fn(),
      debug: jest.fn(),
    };

    beforeEach(() => {
      jest.clearAllMocks();
    });

    it('should process items in batches using Promise.all', async () => {
      const items = [1, 2, 3, 4, 5];
      const mockProcessBatch = jest
        .fn()
        .mockImplementation(async (batch: number[]) => {
          return { sum: batch.reduce((a, b) => a + b, 0) };
        });

      const result = await processInBatches({
        items,
        batchSize: 2,
        processBatch: mockProcessBatch,
        logger: mockLogger,
      });

      // Should process in 3 batches: [1,2], [3,4], [5]
      expect(mockProcessBatch).toHaveBeenCalledTimes(3);
      expect(mockProcessBatch).toHaveBeenNthCalledWith(1, [1, 2]);
      expect(mockProcessBatch).toHaveBeenNthCalledWith(2, [3, 4]);
      expect(mockProcessBatch).toHaveBeenNthCalledWith(3, [5]);

      // Should return first result since no mergeResults provided
      expect(result).toEqual({ sum: 3 }); // sum of first batch [1,2]
    });

    it('should handle batch failures gracefully', async () => {
      const items = [1, 2, 3, 4];
      const mockProcessBatch = jest
        .fn()
        .mockResolvedValueOnce({ sum: 3 }) // First batch succeeds
        .mockResolvedValueOnce(null); // Second batch fails

      const result = await processInBatches({
        items,
        batchSize: 2,
        processBatch: mockProcessBatch,
        logger: mockLogger,
      });

      expect(result).toEqual({ sum: 3 }); // Only successful batch result
      expect(mockLogger.warn).toHaveBeenCalledWith(
        'Batch 2 failed and returned null',
      );
    });

    it('should return null when all batches fail', async () => {
      const items = [1, 2, 3];
      const mockProcessBatch = jest.fn().mockResolvedValue(null);

      const result = await processInBatches({
        items,
        batchSize: 2,
        processBatch: mockProcessBatch,
        logger: mockLogger,
      });

      expect(result).toBeNull();
      expect(mockLogger.warn).toHaveBeenCalledWith('All batches failed');
    });

    it('should handle empty items array', async () => {
      const mockProcessBatch = jest.fn();

      const result = await processInBatches({
        items: [],
        batchSize: 2,
        processBatch: mockProcessBatch,
        logger: mockLogger,
      });

      expect(result).toBeNull();
      expect(mockProcessBatch).not.toHaveBeenCalled();
    });

    it('should handle batch processing errors', async () => {
      const items = [1, 2];
      const mockProcessBatch = jest
        .fn()
        .mockResolvedValueOnce({ sum: 1 }) // First batch succeeds
        .mockRejectedValueOnce(new Error('Network error')); // Second batch throws error

      const result = await processInBatches({
        items,
        batchSize: 1,
        processBatch: mockProcessBatch,
        logger: mockLogger,
      });

      expect(result).toEqual({ sum: 1 }); // Only successful batch result
      expect(mockLogger.warn).toHaveBeenCalledWith(
        'Batch 2 failed with error: Error: Network error',
      );
    });
  });

  describe('fetchAccountBalancesInBatches', () => {
    const mockLogger = {
      warn: jest.fn(),
      debug: jest.fn(),
    };

    beforeEach(() => {
      jest.clearAllMocks();
      global.fetch = jest.fn();
    });

    afterEach(() => {
      jest.restoreAllMocks();
    });

    it('should fetch account balances in batches', async () => {
      const mockResponse = {
        balances: {
          '1': {
            '0xAddress1': {
              balance: '1000000000000000000',
              token: {
                address: '0x0000000000000000000000000000000000000000',
                symbol: 'ETH',
                decimals: 18,
                name: 'Ethereum',
                type: 'native' as const,
              },
            },
          },
        },
      };

      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      });

      const result = await fetchAccountBalancesInBatches({
        addresses: ['0xAddress1', '0xAddress2'],
        supportedChainIds: ['1'],
        accountApiBaseUrl: 'https://api.test.com',
        batchSize: 1, // Force 2 batches
        logger: mockLogger,
      });

      expect(global.fetch).toHaveBeenCalledTimes(2);
      expect(result).toBeTruthy();
      expect(result?.balances['1']).toBeDefined();
    });

    it('should handle API errors gracefully', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
      });

      const result = await fetchAccountBalancesInBatches({
        addresses: ['0xAddress1'],
        supportedChainIds: ['1'],
        accountApiBaseUrl: 'https://api.test.com',
        logger: mockLogger,
      });

      expect(result).toBeNull();
      expect(mockLogger.warn).toHaveBeenCalledWith(
        'Account API batch request failed with status 500: Internal Server Error',
      );
    });
  });
});
