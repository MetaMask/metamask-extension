/**
 * mUSD Conversion Transaction Utilities Tests
 *
 * Tests for the transaction building and manipulation utilities
 * used in mUSD conversion flows.
 */

import {
  TransactionType,
  TransactionMeta,
  TransactionStatus,
} from '@metamask/transaction-controller';
import { ORIGIN_METAMASK } from '@metamask/controller-utils';
import type { Hex } from '@metamask/utils';

import { MUSD_TOKEN_ADDRESS } from '../constants';
import { CHAIN_IDS } from '../../../../../shared/constants/network';
import {
  generateERC20TransferData,
  buildMusdConversionTx,
  extractMusdConversionTransferDetails,
  isMusdConversionTransaction,
  isMatchingMusdConversion,
  createMusdConversionTransaction,
  replaceMusdConversionTransactionForPayToken,
  TransactionControllerCallbacks,
} from './transaction-utils';

// ============================================================================
// Test Constants
// ============================================================================

const MOCK_ADDRESS = '0x1234567890123456789012345678901234567890' as Hex;
const MOCK_RECIPIENT = '0xabcdefabcdefabcdefabcdefabcdefabcdefabcd' as Hex;
const MOCK_NETWORK_CLIENT_ID = 'mainnet';
const MOCK_TX_ID = 'tx-123';

/** Minimal TransactionMeta shape required by type; use with spread in mocks. */
const MOCK_TX_META_BASE: Pick<
  TransactionMeta,
  'networkClientId' | 'status' | 'time' | 'chainId' | 'txParams'
> = {
  networkClientId: MOCK_NETWORK_CLIENT_ID,
  status: TransactionStatus.approved,
  time: 1700000000000,
  chainId: CHAIN_IDS.MAINNET,
  txParams: {
    from: MOCK_ADDRESS,
    to: MUSD_TOKEN_ADDRESS,
    value: '0x0',
    data: '0x',
  },
};

// ============================================================================
// generateERC20TransferData Tests
// ============================================================================

describe('generateERC20TransferData', () => {
  it('should generate valid transfer data with 0x prefix', () => {
    const data = generateERC20TransferData(MOCK_RECIPIENT, '0x64');

    // Should start with the transfer function selector
    expect(data.startsWith('0xa9059cbb')).toBe(true);

    // Should be a valid hex string
    expect(data).toMatch(/^0x[0-9a-f]+$/iu);
  });

  it('should generate valid transfer data without 0x prefix', () => {
    const data = generateERC20TransferData(MOCK_RECIPIENT, '64');

    // Should start with the transfer function selector
    expect(data.startsWith('0xa9059cbb')).toBe(true);
  });

  it('should encode the recipient address correctly', () => {
    const data = generateERC20TransferData(MOCK_RECIPIENT, '0x0');

    // The recipient address should be in the data (padded to 32 bytes)
    const recipientWithoutPrefix = MOCK_RECIPIENT.toLowerCase().slice(2);
    expect(data.toLowerCase()).toContain(recipientWithoutPrefix);
  });

  it('should handle zero amount', () => {
    const data = generateERC20TransferData(MOCK_RECIPIENT, '0x0');

    expect(data.startsWith('0xa9059cbb')).toBe(true);
  });
});

// ============================================================================
// buildMusdConversionTx Tests
// ============================================================================

describe('buildMusdConversionTx', () => {
  const defaultParams = {
    chainId: CHAIN_IDS.MAINNET,
    fromAddress: MOCK_ADDRESS,
    recipientAddress: MOCK_RECIPIENT,
    amountHex: '0x64',
    networkClientId: MOCK_NETWORK_CLIENT_ID,
  };

  it('should build valid transaction params', () => {
    const result = buildMusdConversionTx(defaultParams);

    expect(result.txParams.to?.toLowerCase()).toBe(
      MUSD_TOKEN_ADDRESS.toLowerCase(),
    );
    expect(result.txParams.from).toBe(MOCK_ADDRESS);
    expect(result.txParams.value).toBe('0x0');
    expect(result.txParams.data).toBeDefined();
  });

  it('should set correct addTxOptions', () => {
    const result = buildMusdConversionTx(defaultParams);

    expect(result.addTxOptions.skipInitialGasEstimate).toBe(true);
    expect(result.addTxOptions.networkClientId).toBe(MOCK_NETWORK_CLIENT_ID);
    expect(result.addTxOptions.origin).toBe(ORIGIN_METAMASK);
    expect(result.addTxOptions.type).toBe(TransactionType.musdConversion);
  });

  it('should throw for unsupported chains', () => {
    expect(() =>
      buildMusdConversionTx({
        ...defaultParams,
        chainId: '0x999' as Hex,
      }),
    ).toThrow('mUSD token address not found');
  });

  it('should generate correct transfer data', () => {
    const result = buildMusdConversionTx(defaultParams);

    // Should have transfer function selector
    expect(result.txParams.data?.toString().startsWith('0xa9059cbb')).toBe(
      true,
    );
  });
});

// ============================================================================
// extractMusdConversionTransferDetails Tests
// ============================================================================

describe('extractMusdConversionTransferDetails', () => {
  const mockTransferData = generateERC20TransferData(MOCK_RECIPIENT, '0x64');

  it('should extract recipient and amount from valid transaction', () => {
    const mockTx: TransactionMeta = {
      ...MOCK_TX_META_BASE,
      id: MOCK_TX_ID,
      type: TransactionType.musdConversion,
      chainId: CHAIN_IDS.MAINNET,
      txParams: {
        from: MOCK_ADDRESS,
        to: MUSD_TOKEN_ADDRESS,
        data: mockTransferData,
        value: '0x0',
      },
    };

    const details = extractMusdConversionTransferDetails(mockTx);

    expect(details.recipientAddress.toLowerCase()).toBe(
      MOCK_RECIPIENT.toLowerCase(),
    );
    expect(details.amountHex).toBeDefined();
  });

  it('should throw if transaction data is missing', () => {
    const mockTx: TransactionMeta = {
      ...MOCK_TX_META_BASE,
      id: MOCK_TX_ID,
      type: TransactionType.musdConversion,
      txParams: {
        from: MOCK_ADDRESS,
        to: MUSD_TOKEN_ADDRESS,
        value: '0x0',
      },
    };

    expect(() => extractMusdConversionTransferDetails(mockTx)).toThrow(
      'Missing transaction data',
    );
  });

  it('should fallback to from address if recipient not in data', () => {
    const mockTx: TransactionMeta = {
      ...MOCK_TX_META_BASE,
      id: MOCK_TX_ID,
      type: TransactionType.musdConversion,
      txParams: {
        from: MOCK_ADDRESS,
        to: MUSD_TOKEN_ADDRESS,
        data: '0x',
        value: '0x0',
      },
    };

    const details = extractMusdConversionTransferDetails(mockTx);

    // Should fallback to from address
    expect(details.recipientAddress).toBe(MOCK_ADDRESS);
  });
});

// ============================================================================
// isMusdConversionTransaction Tests
// ============================================================================

describe('isMusdConversionTransaction', () => {
  it('should return true for mUSD conversion transactions', () => {
    const mockTx: TransactionMeta = {
      ...MOCK_TX_META_BASE,
      id: MOCK_TX_ID,
      type: TransactionType.musdConversion,
    };

    expect(isMusdConversionTransaction(mockTx)).toBe(true);
  });

  it('should return false for other transaction types', () => {
    const mockTx: TransactionMeta = {
      ...MOCK_TX_META_BASE,
      id: MOCK_TX_ID,
      type: TransactionType.tokenMethodTransfer,
    };

    expect(isMusdConversionTransaction(mockTx)).toBe(false);
  });

  it('should return false for undefined type', () => {
    const mockTx: TransactionMeta = {
      ...MOCK_TX_META_BASE,
      id: MOCK_TX_ID,
    };

    expect(isMusdConversionTransaction(mockTx)).toBe(false);
  });
});

// ============================================================================
// isMatchingMusdConversion Tests
// ============================================================================

describe('isMatchingMusdConversion', () => {
  const mockTx: TransactionMeta = {
    ...MOCK_TX_META_BASE,
    id: MOCK_TX_ID,
    type: TransactionType.musdConversion,
    chainId: CHAIN_IDS.MAINNET,
    txParams: {
      ...MOCK_TX_META_BASE.txParams,
      from: MOCK_ADDRESS,
    },
  };

  it('should return true for matching transaction', () => {
    expect(
      isMatchingMusdConversion(mockTx, MOCK_ADDRESS, CHAIN_IDS.MAINNET),
    ).toBe(true);
  });

  it('should return false for different chain', () => {
    expect(
      isMatchingMusdConversion(mockTx, MOCK_ADDRESS, CHAIN_IDS.LINEA_MAINNET),
    ).toBe(false);
  });

  it('should return false for different address', () => {
    expect(
      isMatchingMusdConversion(mockTx, MOCK_RECIPIENT, CHAIN_IDS.MAINNET),
    ).toBe(false);
  });

  it('should return false for non-mUSD transactions', () => {
    const nonMusdTx: TransactionMeta = {
      ...mockTx,
      type: TransactionType.tokenMethodTransfer,
    };

    expect(
      isMatchingMusdConversion(nonMusdTx, MOCK_ADDRESS, CHAIN_IDS.MAINNET),
    ).toBe(false);
  });

  it('should be case-insensitive for addresses', () => {
    expect(
      isMatchingMusdConversion(
        mockTx,
        MOCK_ADDRESS.toUpperCase() as Hex,
        CHAIN_IDS.MAINNET,
      ),
    ).toBe(true);
  });
});

// ============================================================================
// createMusdConversionTransaction Tests
// ============================================================================

describe('createMusdConversionTransaction', () => {
  const mockCallbacks: TransactionControllerCallbacks = {
    addTransaction: jest.fn().mockResolvedValue({ id: MOCK_TX_ID }),
    findNetworkClientIdByChainId: jest
      .fn()
      .mockResolvedValue(MOCK_NETWORK_CLIENT_ID),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should create a transaction with correct parameters', async () => {
    const result = await createMusdConversionTransaction(
      {
        chainId: CHAIN_IDS.MAINNET,
        fromAddress: MOCK_ADDRESS,
        recipientAddress: MOCK_RECIPIENT,
        amountHex: '0x64',
        networkClientId: MOCK_NETWORK_CLIENT_ID,
      },
      mockCallbacks,
    );

    expect(result.transactionId).toBe(MOCK_TX_ID);
    expect(result.networkClientId).toBe(MOCK_NETWORK_CLIENT_ID);
    expect(mockCallbacks.addTransaction).toHaveBeenCalledTimes(1);
  });

  it('should pass correct options to addTransaction', async () => {
    await createMusdConversionTransaction(
      {
        chainId: CHAIN_IDS.MAINNET,
        fromAddress: MOCK_ADDRESS,
        recipientAddress: MOCK_RECIPIENT,
        amountHex: '0x64',
        networkClientId: MOCK_NETWORK_CLIENT_ID,
      },
      mockCallbacks,
    );

    expect(mockCallbacks.addTransaction).toHaveBeenCalledWith(
      expect.objectContaining({
        to: expect.any(String),
        from: MOCK_ADDRESS,
        data: expect.any(String),
        value: '0x0',
      }),
      expect.objectContaining({
        type: TransactionType.musdConversion,
        origin: ORIGIN_METAMASK,
        skipInitialGasEstimate: true,
      }),
    );
  });
});

// ============================================================================
// replaceMusdConversionTransactionForPayToken Tests
// ============================================================================

describe('replaceMusdConversionTransactionForPayToken', () => {
  const mockTransferData = generateERC20TransferData(MOCK_RECIPIENT, '0x64');
  const mockTx: TransactionMeta = {
    ...MOCK_TX_META_BASE,
    id: MOCK_TX_ID,
    type: TransactionType.musdConversion,
    chainId: CHAIN_IDS.MAINNET,
    txParams: {
      ...MOCK_TX_META_BASE.txParams,
      from: MOCK_ADDRESS,
      to: MUSD_TOKEN_ADDRESS,
      data: mockTransferData,
      value: '0x0',
    },
  };

  const mockCallbacks: TransactionControllerCallbacks = {
    addTransaction: jest.fn().mockResolvedValue({ id: 'new-tx-id' }),
    findNetworkClientIdByChainId: jest.fn().mockResolvedValue('linea'),
    fetchGasFeeEstimates: jest.fn().mockResolvedValue(undefined),
    updatePaymentToken: jest.fn(),
    rejectApproval: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should create a new transaction and return its ID', async () => {
    const result = await replaceMusdConversionTransactionForPayToken(
      mockTx,
      { address: '0xusdc' as Hex, chainId: CHAIN_IDS.LINEA_MAINNET },
      mockCallbacks,
    );

    expect(result).toBe('new-tx-id');
    expect(mockCallbacks.addTransaction).toHaveBeenCalledTimes(1);
  });

  it('should call updatePaymentToken with correct params', async () => {
    await replaceMusdConversionTransactionForPayToken(
      mockTx,
      { address: '0xusdc' as Hex, chainId: CHAIN_IDS.LINEA_MAINNET },
      mockCallbacks,
    );

    expect(mockCallbacks.updatePaymentToken).toHaveBeenCalledWith({
      transactionId: 'new-tx-id',
      tokenAddress: '0xusdc',
      chainId: CHAIN_IDS.LINEA_MAINNET,
    });
  });

  it('should reject the previous approval', async () => {
    await replaceMusdConversionTransactionForPayToken(
      mockTx,
      { address: '0xusdc' as Hex, chainId: CHAIN_IDS.LINEA_MAINNET },
      mockCallbacks,
    );

    expect(mockCallbacks.rejectApproval).toHaveBeenCalledWith(
      MOCK_TX_ID,
      expect.any(Error),
    );
  });

  it('should throw if transaction meta is missing', async () => {
    await expect(
      replaceMusdConversionTransactionForPayToken(
        { ...MOCK_TX_META_BASE, txParams: {} } as TransactionMeta,
        { address: '0xusdc' as Hex, chainId: CHAIN_IDS.LINEA_MAINNET },
        mockCallbacks,
      ),
    ).rejects.toThrow('Missing transaction metadata');
  });

  it('should return undefined if replacement fails', async () => {
    const failingCallbacks = {
      ...mockCallbacks,
      addTransaction: jest.fn().mockRejectedValue(new Error('Failed')),
    };

    const consoleErrorSpy = jest
      .spyOn(console, 'error')
      .mockImplementation(() => undefined);

    const result = await replaceMusdConversionTransactionForPayToken(
      mockTx,
      { address: '0xusdc' as Hex, chainId: CHAIN_IDS.LINEA_MAINNET },
      failingCallbacks,
    );

    expect(result).toBeUndefined();
    consoleErrorSpy.mockRestore();
  });

  it('should handle missing optional callbacks gracefully', async () => {
    const minimalCallbacks: TransactionControllerCallbacks = {
      addTransaction: jest.fn().mockResolvedValue({ id: 'new-tx-id' }),
      findNetworkClientIdByChainId: jest.fn().mockResolvedValue('linea'),
    };

    const result = await replaceMusdConversionTransactionForPayToken(
      mockTx,
      { address: '0xusdc' as Hex, chainId: CHAIN_IDS.LINEA_MAINNET },
      minimalCallbacks,
    );

    expect(result).toBe('new-tx-id');
  });
});
