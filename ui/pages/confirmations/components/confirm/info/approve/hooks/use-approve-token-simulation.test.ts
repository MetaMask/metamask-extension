import { TransactionMeta } from '@metamask/transaction-controller';
import { renderHookWithConfirmContextProvider } from '../../../../../../../../test/lib/confirmations/render-helpers';
import {
  buildPermit2ApproveTransactionData,
  genUnapprovedApproveConfirmation,
} from '../../../../../../../../test/data/confirmations/token-approve';
import { getMockConfirmStateForTransaction } from '../../../../../../../../test/data/confirmations/helper';
import { TOKEN_VALUE_UNLIMITED_THRESHOLD } from '../../shared/constants';
import {
  isSpendingCapUnlimited,
  useApproveTokenSimulation,
} from './use-approve-token-simulation';
import { useIsNFT } from './use-is-nft';

jest.mock('./use-is-nft', () => ({
  ...jest.requireActual('./use-is-nft'),
  useIsNFT: jest.fn(),
}));

describe('isSpendingCapUnlimited', () => {
  it('returns true if spending cap is equal to threshold', () => {
    expect(isSpendingCapUnlimited(TOKEN_VALUE_UNLIMITED_THRESHOLD)).toBe(true);
  });

  it('returns true if spending cap is greater than threshold', () => {
    expect(isSpendingCapUnlimited(TOKEN_VALUE_UNLIMITED_THRESHOLD + 1)).toBe(
      true,
    );
  });

  it('returns false if spending cap is less than threshold', () => {
    expect(isSpendingCapUnlimited(TOKEN_VALUE_UNLIMITED_THRESHOLD - 1)).toBe(
      false,
    );
  });

  it('returns false if spending cap is less than threshold after applying decimals', () => {
    expect(isSpendingCapUnlimited(TOKEN_VALUE_UNLIMITED_THRESHOLD, 1)).toBe(
      false,
    );
  });
});

describe('useApproveTokenSimulation', () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });

  it('returns the token id for NFT', async () => {
    const useIsNFTMock = jest.fn().mockImplementation(() => ({ isNFT: true }));

    (useIsNFT as jest.Mock).mockImplementation(useIsNFTMock);

    const transactionMeta = genUnapprovedApproveConfirmation({
      amountHex:
        '0000000000000000000000000000000000000000000000000000000000011170',
    }) as TransactionMeta;

    const { result } = renderHookWithConfirmContextProvider(
      () => useApproveTokenSimulation(transactionMeta, '4'),
      getMockConfirmStateForTransaction(transactionMeta),
    );

    expect(result.current).toMatchInlineSnapshot(`
      {
        "formattedSpendingCap": "#7",
        "isUnlimitedSpendingCap": false,
        "pending": undefined,
        "spendingCap": "#7",
        "value": "70000",
      }
    `);
  });

  it('returns "UNLIMITED MESSAGE" token amount for fungible tokens approvals equal or over the total number of tokens in circulation', async () => {
    const useIsNFTMock = jest.fn().mockImplementation(() => ({ isNFT: false }));

    (useIsNFT as jest.Mock).mockImplementation(useIsNFTMock);

    const transactionMeta = genUnapprovedApproveConfirmation({
      amountHex:
        '00000000000000000000000000000000000000000000000000038D7EA4C68000',
    }) as TransactionMeta;

    const { result } = renderHookWithConfirmContextProvider(
      () => useApproveTokenSimulation(transactionMeta, '0'),
      getMockConfirmStateForTransaction(transactionMeta),
    );

    expect(result.current).toMatchInlineSnapshot(`
      {
        "formattedSpendingCap": "1,000,000,000,000,000",
        "isUnlimitedSpendingCap": true,
        "pending": undefined,
        "spendingCap": "1000000000000000",
        "value": "1000000000000000",
      }
    `);
  });

  it('returns correct small decimal number token amount for fungible tokens', async () => {
    const useIsNFTMock = jest.fn().mockImplementation(() => ({ isNFT: false }));

    (useIsNFT as jest.Mock).mockImplementation(useIsNFTMock);

    const transactionMeta =
      genUnapprovedApproveConfirmation() as TransactionMeta;

    const { result } = renderHookWithConfirmContextProvider(
      () => useApproveTokenSimulation(transactionMeta, '18'),
      getMockConfirmStateForTransaction(transactionMeta),
    );

    expect(result.current).toMatchInlineSnapshot(`
      {
        "formattedSpendingCap": "<0.000001",
        "isUnlimitedSpendingCap": false,
        "pending": undefined,
        "spendingCap": "0.000000000000000001",
        "value": "1",
      }
    `);
  });

  it('returns token amount for permit2 approval', async () => {
    const useIsNFTMock = jest.fn().mockImplementation(() => ({ isNFT: true }));

    (useIsNFT as jest.Mock).mockImplementation(useIsNFTMock);

    const transactionMeta = {
      txParams: {
        data: buildPermit2ApproveTransactionData(
          '0x1234567890123456789012345678901234567890',
          '0x1234567890123456789012345678901234567891',
          123456,
          789,
        ),
      },
    } as TransactionMeta;

    const { result } = renderHookWithConfirmContextProvider(
      () => useApproveTokenSimulation(transactionMeta, '5'),
      getMockConfirmStateForTransaction(transactionMeta),
    );

    expect(result.current).toMatchInlineSnapshot(`
      {
        "formattedSpendingCap": "1.235",
        "isUnlimitedSpendingCap": false,
        "pending": undefined,
        "spendingCap": "1.23456",
        "value": "123456",
      }
    `);
  });
});
