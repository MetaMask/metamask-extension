import { TransactionMeta } from '@metamask/transaction-controller';
import { renderHookWithConfirmContextProvider } from '../../../../../../../../test/lib/confirmations/render-helpers';
import { genUnapprovedApproveConfirmation } from '../../../../../../../../test/data/confirmations/token-approve';
import { getMockConfirmStateForTransaction } from '../../../../../../../../test/data/confirmations/helper';
import { useApproveTokenSimulation } from './use-approve-token-simulation';
import { useIsNFT } from './use-is-nft';

jest.mock('./use-is-nft', () => ({
  ...jest.requireActual('./use-is-nft'),
  useIsNFT: jest.fn(),
}));

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
        "value": {
          "hex": "0x011170",
          "type": "BigNumber",
        },
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
        "value": {
          "hex": "0x038d7ea4c68000",
          "type": "BigNumber",
        },
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
        "value": {
          "hex": "0x01",
          "type": "BigNumber",
        },
      }
    `);
  });
});
