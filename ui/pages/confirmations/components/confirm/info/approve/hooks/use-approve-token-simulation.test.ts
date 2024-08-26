import { TransactionMeta } from '@metamask/transaction-controller';
import {
  CONTRACT_INTERACTION_SENDER_ADDRESS,
  genUnapprovedContractInteractionConfirmation,
} from '../../../../../../../../test/data/confirmations/contract-interaction';
import mockState from '../../../../../../../../test/data/mock-state.json';
import { renderHookWithProvider } from '../../../../../../../../test/lib/render-helpers';
import { useDecodedTransactionData } from '../../hooks/useDecodedTransactionData';
import { useApproveTokenSimulation } from './use-approve-token-simulation';
import { useIsNFT } from './use-is-nft';

jest.mock('./use-is-nft', () => ({
  ...jest.requireActual('./use-is-nft'),
  useIsNFT: jest.fn(),
}));

jest.mock('../../hooks/useDecodedTransactionData', () => ({
  ...jest.requireActual('../../hooks/useDecodedTransactionData'),
  useDecodedTransactionData: jest.fn(),
}));

describe('useApproveTokenSimulation', () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });

  it('returns the token id for NFT', async () => {
    const useIsNFTMock = jest.fn().mockImplementation(() => ({ isNFT: true }));

    const useDecodedTransactionDataMock = jest.fn().mockImplementation(() => ({
      pending: false,
      value: {
        data: [
          {
            name: 'approve',
            params: [
              {
                type: 'address',
                value: '0x9bc5baF874d2DA8D216aE9f137804184EE5AfEF4',
              },
              {
                type: 'uint256',
                value: 70000,
              },
            ],
          },
        ],
        source: 'FourByte',
      },
    }));

    (useIsNFT as jest.Mock).mockImplementation(useIsNFTMock);
    (useDecodedTransactionData as jest.Mock).mockImplementation(
      useDecodedTransactionDataMock,
    );

    const transactionMeta = genUnapprovedContractInteractionConfirmation({
      address: CONTRACT_INTERACTION_SENDER_ADDRESS,
    }) as TransactionMeta;

    const { result } = renderHookWithProvider(
      () => useApproveTokenSimulation(transactionMeta, '4'),
      mockState,
    );

    expect(result.current).toMatchInlineSnapshot(`
      {
        "formattedTokenNum": 7,
        "pending": undefined,
        "tokenAmount": "#7",
        "value": {
          "data": [
            {
              "name": "approve",
              "params": [
                {
                  "type": "address",
                  "value": "0x9bc5baF874d2DA8D216aE9f137804184EE5AfEF4",
                },
                {
                  "type": "uint256",
                  "value": 70000,
                },
              ],
            },
          ],
          "source": "FourByte",
        },
      }
    `);
  });

  it('returns "UNLIMITED MESSAGE" token amount for fungible tokens approvals equal or over the total number of tokens in circulation', async () => {
    const useIsNFTMock = jest.fn().mockImplementation(() => ({ isNFT: false }));

    const useDecodedTransactionDataMock = jest.fn().mockImplementation(() => ({
      pending: false,
      value: {
        data: [
          {
            name: 'approve',
            params: [
              {
                type: 'address',
                value: '0x9bc5baF874d2DA8D216aE9f137804184EE5AfEF4',
              },
              {
                type: 'uint256',
                value: 10 ** 15,
              },
            ],
          },
        ],
        source: 'FourByte',
      },
    }));

    (useIsNFT as jest.Mock).mockImplementation(useIsNFTMock);
    (useDecodedTransactionData as jest.Mock).mockImplementation(
      useDecodedTransactionDataMock,
    );

    const transactionMeta = genUnapprovedContractInteractionConfirmation({
      address: CONTRACT_INTERACTION_SENDER_ADDRESS,
    }) as TransactionMeta;

    const { result } = renderHookWithProvider(
      () => useApproveTokenSimulation(transactionMeta, '0'),
      mockState,
    );

    expect(result.current).toMatchInlineSnapshot(`
      {
        "formattedTokenNum": "1,000,000,000,000,000",
        "pending": undefined,
        "tokenAmount": "UNLIMITED MESSAGE",
        "value": {
          "data": [
            {
              "name": "approve",
              "params": [
                {
                  "type": "address",
                  "value": "0x9bc5baF874d2DA8D216aE9f137804184EE5AfEF4",
                },
                {
                  "type": "uint256",
                  "value": 1000000000000000,
                },
              ],
            },
          ],
          "source": "FourByte",
        },
      }
    `);
  });
});
